/**
 * Tableau 02 - Achats (purchases)
 * Extractions: Catégorie (Code Produit), Forme juridique (Fournisseur),
 * Type achat (Num.CMD: POL, POI), Mois, Année (Date.CMD)
 */

import { parseDecimal } from './importUtils';

function extractTypeAchat(numCmd) {
  const prefix = (numCmd || '').split('/')[0]?.toUpperCase() || '';
  const mapping = { POL: 'Politique', POI: 'Import' };
  return mapping[prefix] || prefix || 'Autre';
}

function extractFormeJuridique(fournisseur) {
  const match = (fournisseur || '').match(/\b(SARL|EURL|SNC|SA|SAS|EI|EIRL|SCOP|GIE)\b/i);
  return match ? match[1].toUpperCase() : '';
}

function extractCategorie(codeProduit) {
  const match = (codeProduit || '').match(/^([A-Z]+)/i);
  return match ? match[1].toUpperCase() : '';
}

export const rawPurchasesData = [
  { numCmd: 'POL/0001', dateCmd: '2024-11-05', fournisseur: 'SARL IMPORT COMPUTER', codeProduit: 'LAP.0120', produit: 'Laptop HP Probook G4', qte: 10, montantHt: '1 000 000,00', taxe: '190 000,00', montantTtc: '1 190 000,00' },
  { numCmd: 'POI/0002', dateCmd: '2024-12-16', fournisseur: 'EURL ABM', codeProduit: 'PRI.0020', produit: 'Printer Canon 6030', qte: 20, montantHt: '390 000,00', taxe: '74 100,00', montantTtc: '464 100,00' },
  { numCmd: 'POI/0002', dateCmd: '2024-12-16', fournisseur: 'EURL ABM', codeProduit: 'INK.0034', produit: 'Toner Canon 6030', qte: 500, montantHt: '450 000,00', taxe: '85 500,00', montantTtc: '535 500,00' },
  { numCmd: 'POI/0002', dateCmd: '2024-12-16', fournisseur: 'EURL ABM', codeProduit: 'LAP.0011', produit: 'Laptop Lenovo 110', qte: 500, montantHt: '33 500 000,00', taxe: '6 365 000,00', montantTtc: '39 865 000,00' },
  { numCmd: 'POL/0003', dateCmd: '2025-02-11', fournisseur: 'SNC Wiffak', codeProduit: 'INK.0004', produit: 'INK Canon 3210', qte: 1000, montantHt: '450 000,00', taxe: '85 500,00', montantTtc: '535 500,00' },
  { numCmd: 'POI/0004', dateCmd: '2025-02-25', fournisseur: 'SNC Wiffak', codeProduit: 'SCA.0002', produit: 'Scanner Epson 1600', qte: 5, montantHt: '160 000,00', taxe: '30 400,00', montantTtc: '190 400,00' },
  { numCmd: 'POI/0004', dateCmd: '2025-02-25', fournisseur: 'SNC Wiffak', codeProduit: 'INK.0005', produit: 'INK Epson 110', qte: 1000, montantHt: '600 000,00', taxe: '114 000,00', montantTtc: '714 000,00' },
  { numCmd: 'POL/0005', dateCmd: '2025-03-10', fournisseur: 'SARL IMPORT COMPUTER', codeProduit: 'LAP.0120', produit: 'Laptop HP Probook G4', qte: 5, montantHt: '500 000,00', taxe: '95 000,00', montantTtc: '595 000,00' },
  { numCmd: 'POI/0006', dateCmd: '2025-04-01', fournisseur: 'EURL ABM', codeProduit: 'PRI.0011', produit: 'Printer EPSON 3010', qte: 3, montantHt: '96 000,00', taxe: '18 240,00', montantTtc: '114 240,00' },
];

export function processPurchasesData(raw) {
  return raw.map((row, idx) => {
    const date = new Date(row.dateCmd);
    const montantTtc = parseDecimal(row.montantTtc);
    return {
      id: idx + 1,
      numCmd: row.numCmd,
      dateCmd: row.dateCmd,
      fournisseur: row.fournisseur,
      codeProduit: row.codeProduit,
      produit: row.produit,
      qte: Number(row.qte) || 0,
      montantHt: parseDecimal(row.montantHt),
      taxe: parseDecimal(row.taxe),
      montantTtc,
      typeAchat: extractTypeAchat(row.numCmd),
      categorie: extractCategorie(row.codeProduit),
      formeJuridique: extractFormeJuridique(row.fournisseur),
      mois: date.getMonth() + 1,
      moisLabel: date.toLocaleString('fr-FR', { month: 'long' }),
      annee: date.getFullYear(),
    };
  });
}

export const defaultPurchasesData = processPurchasesData(rawPurchasesData);
