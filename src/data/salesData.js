/**
 * Table 1 - Sales data with extracted fields
 * Extractions: Catégorie (from Code Produit), Forme juridique (from Client),
 * Type vente (from Num.CMD), Wilaya (from Adresse), Mois, Année (from Date.CMD)
 */

import { parseDecimal } from './importUtils';

// Extract type vente from Num.CMD: SLSD=Direct, SLSR=Retail, SLSG=Gouvernement
function extractTypeVente(numCmd) {
  const prefix = (numCmd || '').split('/')[0]?.toUpperCase() || '';
  const mapping = { SLSD: 'Direct', SLSR: 'Retail', SLSG: 'Gouvernement' };
  return mapping[prefix] || prefix || 'Autre';
}

// Extract wilaya from Adresse (last part after comma)
function extractWilaya(adresse) {
  const parts = (adresse || '').split(',').map(s => s.trim());
  return parts[parts.length - 1] || '';
}

// Extract forme juridique from Client (SARL, EURL, SNC, etc.)
function extractFormeJuridique(client) {
  const match = (client || '').match(/\b(SARL|EURL|SNC|SA|SAS|EI|EIRL|SCOP|GIE)\b/i);
  return match ? match[1].toUpperCase() : '';
}

// Extract catégorie from Code Produit (LAP, INK, PRI, SCA)
function extractCategorie(codeProduit) {
  const match = (codeProduit || '').match(/^([A-Z]+)/i);
  return match ? match[1].toUpperCase() : '';
}

// Raw Table 1 data (Tableau.01 – Ventes)
export const rawSalesData = [
  { numCmd: 'SLSD/0001', dateCmd: '2024-12-28', client: 'SARL ABC', adresse: 'Cité 20 Aout, Alger', codeProduit: 'LAP.0120', produit: 'Laptop HP Probook G4', qte: 4, montantHt: '500 000,00', taxe: '95 000,00', montantTtc: '595 000,00' },
  { numCmd: 'SLSD/0001', dateCmd: '2024-12-28', client: 'SARL ABC', adresse: 'Cité 20 Aout, Alger', codeProduit: 'PRI.0020', produit: 'Printer Canon 6030', qte: 1, montantHt: '49 000,00', taxe: '9 310,00', montantTtc: '58 310,00' },
  { numCmd: 'SLSD/0001', dateCmd: '2024-12-28', client: 'SARL ABC', adresse: 'Cité 20 Aout, Alger', codeProduit: 'INK.0034', produit: 'Toner Canon 6030', qte: 1, montantHt: '1 800,00', taxe: '342,00', montantTtc: '2 142,00' },
  { numCmd: 'SLSR/0002', dateCmd: '2025-02-22', client: 'EURL XYZ', adresse: 'Coopérative Rym, Blida', codeProduit: 'LAP.0011', produit: 'Laptop Lenovo 110', qte: 1, montantHt: '89 000,00', taxe: '16 910,00', montantTtc: '105 910,00' },
  { numCmd: 'SLSR/0002', dateCmd: '2025-02-22', client: 'EURL XYZ', adresse: 'Coopérative Rym, Blida', codeProduit: 'PRI.0020', produit: 'Printer Canon 6030', qte: 2, montantHt: '98 000,00', taxe: '18 620,00', montantTtc: '116 620,00' },
  { numCmd: 'SLSR/0002', dateCmd: '2025-02-22', client: 'EURL XYZ', adresse: 'Coopérative Rym, Blida', codeProduit: 'INK.0004', produit: 'Toner Canon 6030', qte: 2, montantHt: '3 600,00', taxe: '684,00', montantTtc: '4 284,00' },
  { numCmd: 'SLSR/0002', dateCmd: '2025-02-22', client: 'EURL XYZ', adresse: 'Coopérative Rym, Blida', codeProduit: 'SCA.0002', produit: 'Scanner Epson 1600', qte: 1, montantHt: '21 000,00', taxe: '3 990,00', montantTtc: '24 990,00' },
  { numCmd: 'SLSD/0003', dateCmd: '2025-03-15', client: 'SARL AGRODZ', adresse: 'Cité 310 logt Kouba, Alger', codeProduit: 'PRI.0011', produit: 'Printer EPSON 3010', qte: 2, montantHt: '64 000,00', taxe: '12 160,00', montantTtc: '76 160,00' },
  { numCmd: 'SLSD/0003', dateCmd: '2025-03-15', client: 'SARL AGRODZ', adresse: 'Cité 310 logt Kouba, Alger', codeProduit: 'LAP.0120', produit: 'Laptop HP Probook G4', qte: 1, montantHt: '125 000,00', taxe: '23 750,00', montantTtc: '148 750,00' },
  { numCmd: 'SLSG/0004', dateCmd: '2025-03-28', client: 'SNC Wiffak', adresse: 'Boulvard Nord, Sétif', codeProduit: 'INK.0001', produit: 'INK Canon 3210', qte: 10, montantHt: '18 000,00', taxe: '3 420,00', montantTtc: '21 420,00' },
  { numCmd: 'SLSD/0005', dateCmd: '2025-03-28', client: 'EURL XYZ', adresse: 'Coopérative Rym, Oran', codeProduit: 'LAP.0011', produit: 'Laptop Lenovo 110', qte: 3, montantHt: '267 000,00', taxe: '50 730,00', montantTtc: '317 730,00' },
  { numCmd: 'SLSD/0005', dateCmd: '2025-03-28', client: 'EURL XYZ', adresse: 'Coopérative Rym, Oran', codeProduit: 'PRI.0011', produit: 'Printer EPSON 3010', qte: 1, montantHt: '32 000,00', taxe: '6 080,00', montantTtc: '38 080,00' },
  { numCmd: 'SLSD/0005', dateCmd: '2025-03-28', client: 'EURL XYZ', adresse: 'Coopérative Rym, Oran', codeProduit: 'INK.0005', produit: 'INK Epson 110', qte: 10, montantHt: '8 000,00', taxe: '1 520,00', montantTtc: '9 520,00' },
  { numCmd: 'SLSG/0006', dateCmd: '2025-05-02', client: 'SARL ABC', adresse: 'Cité 20 Aout, Alger', codeProduit: 'LAP.0120', produit: 'Laptop HP Probook G4', qte: 2, montantHt: '250 000,00', taxe: '47 500,00', montantTtc: '297 500,00' },
  { numCmd: 'SLSD/0007', dateCmd: '2025-05-04', client: 'EURL HAMIDI', adresse: 'Promotion Bahia, Oran', codeProduit: 'PRI.0020', produit: 'Printer Canon 6030', qte: 2, montantHt: '98 000,00', taxe: '18 620,00', montantTtc: '116 620,00' },
];

export function processSalesData(raw) {
  return raw.map((row, idx) => {
    const date = new Date(row.dateCmd);
    const montantTtc = parseDecimal(row.montantTtc);
    return {
      id: idx + 1,
      numCmd: row.numCmd,
      dateCmd: row.dateCmd,
      client: row.client,
      adresse: row.adresse,
      codeProduit: row.codeProduit,
      produit: row.produit,
      qte: Number(row.qte) || 0,
      montantHt: parseDecimal(row.montantHt),
      taxe: parseDecimal(row.taxe),
      montantTtc,
      // Extracted fields (separate)
      typeVente: extractTypeVente(row.numCmd),
      wilaya: extractWilaya(row.adresse),
      categorie: extractCategorie(row.codeProduit),
      formeJuridique: extractFormeJuridique(row.client),
      mois: date.getMonth() + 1,
      moisLabel: date.toLocaleString('fr-FR', { month: 'long' }),
      annee: date.getFullYear(),
    };
  });
}

export const defaultSalesData = processSalesData(rawSalesData);
