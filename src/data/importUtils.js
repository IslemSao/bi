// Utilitaires d'import pour VENTES et ACHATS
// Objectif : accepter des lignes issues d'un CSV/Excel avec en-têtes hétérogènes
// et retourner un modèle interne normalisé commun aux autres fonctions de l'app.

const DATE_KEYS = ['Date.CMD', 'DateCMD', 'dateCmd', 'DATE_CMD', 'DATE.CMD'];
const NUM_CMD_KEYS = ['Num.CMD', 'NumCMD', 'numCmd', 'NUM_CMD'];
const CLIENT_KEYS = ['Client', 'client'];
const ADRESSE_KEYS = ['Adresse', 'adresse'];
const FOURNISSEUR_KEYS = ['Fournisseur', 'fournisseur'];
const CODE_PRODUIT_KEYS = ['Code Produit', 'CodeProduit', 'codeProduit', 'CODE_PRODUIT'];
const PRODUIT_KEYS = ['Produit', 'produit'];
const QTE_KEYS_VENTES = ['Qté', 'Qte', 'qte', 'QTE'];
const QTE_KEYS_ACHATS = ['QTY', 'Qty', 'Qte', 'qte', 'QTY.'];
const MONTANT_HT_KEYS = ['Montant HT', 'MontantHT', 'montantHt', 'MONTANT_HT'];
const TAXE_KEYS = ['Taxe', 'taxe', 'TVA'];
const MONTANT_TTC_KEYS = ['Montant TTC', 'MontantTTC', 'montantTtc', 'MONTANT_TTC'];

export function parseDecimal(value) {
  if (typeof value === 'number') return value;
  if (value == null) return 0;
  let str = String(value).trim();
  if (!str) return 0;
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }
  str = str.replace(/\s/g, '');
  const commaIndex = str.lastIndexOf(',');
  const dotIndex = str.lastIndexOf('.');
  if (commaIndex > -1 && dotIndex > -1) {
    if (commaIndex > dotIndex) {
      str = str.replace('.', '').replace(',', '.');
    } else {
      str = str.replace(',', '');
    }
  } else if (commaIndex > -1) {
    str = str.replace(',', '.');
  }
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
}

export function parseInteger(value) {
  if (typeof value === 'number') return Math.trunc(value);
  if (value == null) return 0;
  let str = String(value).trim();
  if (!str) return 0;
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }
  str = str.replace(/\s/g, '');
  const n = parseInt(str, 10);
  return Number.isFinite(n) ? n : 0;
}

function getFirstNonEmpty(obj, keys) {
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k];
  }
  return '';
}

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  let str = String(value).trim();
  if (!str) return null;
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function normalizeSalesRow(rawRow, errors, index) {
  const row = rawRow || {};
  const dateVal = getFirstNonEmpty(row, DATE_KEYS);
  const date = parseDate(dateVal);
  const numCmd = String(getFirstNonEmpty(row, NUM_CMD_KEYS) || '').trim();
  const codeProduit = String(getFirstNonEmpty(row, CODE_PRODUIT_KEYS) || '').trim();
  const produit = String(getFirstNonEmpty(row, PRODUIT_KEYS) || '').trim();
  const qte = parseInteger(getFirstNonEmpty(row, QTE_KEYS_VENTES));
  const montantHt = parseDecimal(getFirstNonEmpty(row, MONTANT_HT_KEYS));
  const taxe = parseDecimal(getFirstNonEmpty(row, TAXE_KEYS));
  const montantTtc = parseDecimal(getFirstNonEmpty(row, MONTANT_TTC_KEYS));
  const client = String(getFirstNonEmpty(row, CLIENT_KEYS) || '').trim();
  const adresse = String(getFirstNonEmpty(row, ADRESSE_KEYS) || '').trim();

  const invalidReasons = [];
  if (!date) invalidReasons.push('DATE_MANQUANTE');
  if (!codeProduit) invalidReasons.push('CODE_PRODUIT_VIDE');
  if (qte <= 0) invalidReasons.push('QTE_INVALIDE');

  if (invalidReasons.length) {
    errors.push({ source: 'VENTES', index, numCmd, codeProduit, reasons: invalidReasons });
    return null;
  }

  return {
    numCmd,
    dateCmd: date.toISOString().slice(0, 10),
    client,
    adresse,
    codeProduit,
    produit,
    qte,
    montantHt,
    taxe,
    montantTtc,
  };
}

export function normalizePurchaseRow(rawRow, errors, index) {
  const row = rawRow || {};
  const dateVal = getFirstNonEmpty(row, DATE_KEYS);
  const date = parseDate(dateVal);
  const numCmd = String(getFirstNonEmpty(row, NUM_CMD_KEYS) || '').trim();
  const codeProduit = String(getFirstNonEmpty(row, CODE_PRODUIT_KEYS) || '').trim();
  const produit = String(getFirstNonEmpty(row, PRODUIT_KEYS) || '').trim();
  const qte = parseInteger(getFirstNonEmpty(row, QTE_KEYS_ACHATS));
  const montantHt = parseDecimal(getFirstNonEmpty(row, MONTANT_HT_KEYS));
  const taxe = parseDecimal(getFirstNonEmpty(row, TAXE_KEYS));
  const montantTtc = parseDecimal(getFirstNonEmpty(row, MONTANT_TTC_KEYS));
  const fournisseur = String(getFirstNonEmpty(row, FOURNISSEUR_KEYS) || '').trim();

  const invalidReasons = [];
  if (!date) invalidReasons.push('DATE_MANQUANTE');
  if (!codeProduit) invalidReasons.push('CODE_PRODUIT_VIDE');
  if (qte <= 0) invalidReasons.push('QTE_INVALIDE');

  if (invalidReasons.length) {
    errors.push({ source: 'ACHATS', index, numCmd, codeProduit, reasons: invalidReasons });
    return null;
  }

  return {
    numCmd,
    dateCmd: date.toISOString().slice(0, 10),
    fournisseur,
    codeProduit,
    produit,
    qte,
    montantHt,
    taxe,
    montantTtc,
  };
}

export function importSalesFromFlatRows(rows) {
  const errors = [];
  const normalized = (rows || [])
    .map((r, idx) => normalizeSalesRow(r, errors, idx))
    .filter(Boolean);
  return { rows: normalized, errors };
}

export function importPurchasesFromFlatRows(rows) {
  const errors = [];
  const normalized = (rows || [])
    .map((r, idx) => normalizePurchaseRow(r, errors, idx))
    .filter(Boolean);
  return { rows: normalized, errors };
}

