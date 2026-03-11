// Utilitaires d'import pour VENTES et ACHATS
// Objectif : accepter des lignes issues d'un CSV/Excel avec en-têtes hétérogènes
// et retourner un modèle interne normalisé commun aux autres fonctions de l'app.

const DATE_KEYS = ['datecmd', 'date'];
const NUM_CMD_KEYS = ['numcmd', 'numero'];
const CLIENT_KEYS = ['client'];
const ADRESSE_KEYS = ['adresse'];
const FOURNISSEUR_KEYS = ['fournisseur', 'client'];
const CODE_PRODUIT_KEYS = ['codeproduit', 'codearticle'];
const PRODUIT_KEYS = ['produit', 'designation'];
const QTE_KEYS_VENTES = ['qte', 'qty', 'quantite'];
const QTE_KEYS_ACHATS = ['qty', 'qte', 'quantite'];
const MONTANT_HT_KEYS = ['montantht', 'ht'];
const TAXE_KEYS = ['taxe', 'tva'];
const MONTANT_TTC_KEYS = ['montantttc', 'ttc'];

function normalizeKey(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase();
}

function normalizeRow(rawRow) {
  const normalized = {};
  Object.entries(rawRow || {}).forEach(([key, value]) => {
    const normalizedKey = normalizeKey(key);
    if (!normalizedKey || normalized[normalizedKey] != null) return;
    normalized[normalizedKey] = value;
  });
  return normalized;
}

export function parseDecimal(value) {
  if (typeof value === 'number') return value;
  if (value == null) return 0;
  let str = String(value).trim();
  if (!str) return 0;
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }
  str = str.replace(/\s/g, '').replace(/\u00A0/g, '');
  const commaIndex = str.lastIndexOf(',');
  const dotIndex = str.lastIndexOf('.');
  if (commaIndex > -1 && dotIndex > -1) {
    if (commaIndex > dotIndex) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (commaIndex > -1) {
    const commaCount = (str.match(/,/g) || []).length;
    const digitsAfterComma = str.length - commaIndex - 1;
    if (commaCount > 1 || digitsAfterComma === 3) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  } else if (dotIndex > -1) {
    const dotCount = (str.match(/\./g) || []).length;
    const digitsAfterDot = str.length - dotIndex - 1;
    if (dotCount > 1 || digitsAfterDot === 3) {
      str = str.replace(/\./g, '');
    }
  }
  const n = Number(str);
  return Number.isFinite(n) ? n : 0;
}

export function parseInteger(value) {
  return Math.trunc(parseDecimal(value));
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
  const isoLike = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoLike) {
    const [, year, month, day] = isoLike;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const slashLike = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashLike) {
    const [, first, second, year] = slashLike;
    const firstNum = Number(first);
    const secondNum = Number(second);
    let month = firstNum;
    let day = secondNum;
    if (firstNum > 12) {
      day = firstNum;
      month = secondNum;
    } else if (secondNum <= 12) {
      const fallback = new Date(str);
      if (!Number.isNaN(fallback.getTime())) return fallback;
    }
    const d = new Date(Number(year), month - 1, day);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function normalizeSalesRow(rawRow, errors, index) {
  const row = normalizeRow(rawRow);
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
    dateCmd: formatDateLocal(date),
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
  const row = normalizeRow(rawRow);
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
    dateCmd: formatDateLocal(date),
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
