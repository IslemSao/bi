import { describe, it, expect } from 'vitest';
import { parseDecimal, parseInteger, importSalesFromFlatRows, importPurchasesFromFlatRows } from './importUtils';
import { buildMarginJournal } from './marginJournal';

describe('importUtils number/date parsing', () => {
  it('parseDecimal handles strings like "500000.00" and "500 000,00"', () => {
    expect(parseDecimal('500000.00')).toBeCloseTo(500000);
    expect(parseDecimal('500 000,00')).toBeCloseTo(500000);
    expect(parseDecimal('"1 234,5"')).toBeCloseTo(1234.5);
  });

  it('parseInteger handles various formats', () => {
    expect(parseInteger('10')).toBe(10);
    expect(parseInteger(' 1 000 ')).toBe(1000);
    expect(parseInteger('"25"')).toBe(25);
  });

  it('imports sales with date conversion and filters invalid lines', () => {
    const { rows, errors } = importSalesFromFlatRows([
      {
        'Num.CMD': 'SLSD/0001',
        'Date.CMD': '2024-12-28',
        Client: 'SARL ABC',
        Adresse: 'Alger',
        'Code Produit': 'LAP.0120',
        Produit: 'Laptop',
        Qté: '4',
        'Montant HT': '500000.00',
        Taxe: '0',
        'Montant TTC': '595000.00',
      },
      {
        'Num.CMD': 'SLSD/0002',
        'Date.CMD': '',
        Client: 'SARL ABC',
        Adresse: 'Alger',
        'Code Produit': '',
        Produit: 'Laptop',
        Qté: '0',
        'Montant HT': '0',
        Taxe: '0',
        'Montant TTC': '0',
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(rows[0].dateCmd).toBe('2024-12-28');
    expect(rows[0].qte).toBe(4);
    expect(rows[0].montantHt).toBeCloseTo(500000);
  });

  it('imports purchases and drops invalid quantity', () => {
    const { rows, errors } = importPurchasesFromFlatRows([
      {
        'Num.CMD': 'POL/0001',
        'Date.CMD': '2024-11-05',
        Fournisseur: 'SARL IMPORT COMPUTER',
        'Code Produit': 'LAP.0120',
        Produit: 'Laptop HP',
        QTY: '10',
        'Montant HT': '1000000.00',
        Taxe: '0',
        'Montant TTC': '1190000.00',
      },
      {
        'Num.CMD': 'POL/0002',
        'Date.CMD': '2024-11-06',
        Fournisseur: 'SARL IMPORT COMPUTER',
        'Code Produit': 'LAP.0120',
        Produit: 'Laptop HP',
        QTY: '0',
        'Montant HT': '0',
        Taxe: '0',
        'Montant TTC': '0',
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(rows[0].dateCmd).toBe('2024-11-05');
    expect(rows[0].qte).toBe(10);
    expect(rows[0].montantHt).toBeCloseTo(1000000);
  });
});

describe('marginJournal PMP calculation', () => {
  it('computes PMP on two purchases then one sale (standard case)', () => {
    const purchases = [
      { dateCmd: '2024-11-05', numCmd: 'POL/0001', fournisseur: 'F1', codeProduit: 'LAP.0120', produit: 'Laptop', qte: 10, montantHt: 1000000 },
      // second achat: 5 pièces pour 525 000 => PMP global ~101 666
      { dateCmd: '2025-02-11', numCmd: 'POL/0002', fournisseur: 'F1', codeProduit: 'LAP.0120', produit: 'Laptop', qte: 5, montantHt: 525000 },
    ];
    const sales = [
      { dateCmd: '2025-03-01', numCmd: 'SLSD/0001', client: 'C1', codeProduit: 'LAP.0120', produit: 'Laptop', qte: 3, montantHt: 450000 },
    ];

    const journal = buildMarginJournal(sales, purchases, { trackStock: true }).filter(
      (j) => j.codeProduit === 'LAP.0120'
    );

    const achat1 = journal[0];
    const achat2 = journal[1];
    const vente1 = journal[2];

    expect(achat1.pmp).toBeCloseTo(100000); // 1 000 000 / 10
    expect(achat2.pmp).toBeCloseTo(101666.666, 0);
    expect(vente1.pmp).toBeCloseTo(101666.666, 0);
    expect(vente1.coutHt).toBeCloseTo(3 * 101666.666, 0);
    expect(vente1.margeHt).toBeCloseTo(450000 - vente1.coutHt, 0);
  });

  it('flags sale without prior purchase as COUT_INCONNU', () => {
    const purchases = [];
    const sales = [
      { dateCmd: '2025-01-01', numCmd: 'SLSD/0001', client: 'C1', codeProduit: 'INK.0004', produit: 'Ink', qte: 10, montantHt: 80000 },
    ];

    const journal = buildMarginJournal(sales, purchases, { trackStock: true }).filter(
      (j) => j.codeProduit === 'INK.0004'
    );

    expect(journal).toHaveLength(1);
    const vente = journal[0];
    expect(vente.pmp).toBeNull();
    expect(vente.margeHt).toBeNull();
    expect(vente.flags).toContain('COUT_INCONNU');
  });

  it('keeps PMP example for LAP.0120 coherent with provided dates', () => {
    const purchases = [
      { dateCmd: '2024-11-05', numCmd: 'POL/0001', fournisseur: 'SARL IMPORT COMPUTER', codeProduit: 'LAP.0120', produit: 'Laptop HP Probook G4', qte: 10, montantHt: 1000000 },
      { dateCmd: '2025-02-11', numCmd: 'POL/0005', fournisseur: 'SARL IMPORT COMPUTER', codeProduit: 'LAP.0120', produit: 'Laptop HP Probook G4', qte: 5, montantHt: 525000 },
    ];
    const sales = [];
    const journal = buildMarginJournal(sales, purchases, { trackStock: true }).filter(
      (j) => j.codeProduit === 'LAP.0120'
    );

    const achat1 = journal[0];
    const achat2 = journal[1];

    expect(achat1.date).toBe('2024-11-05');
    expect(achat1.pmp).toBeCloseTo(100000);
    expect(achat2.date).toBe('2025-02-11');
    expect(achat2.pmp).toBeCloseTo(101666.666, 0);
  });
});

