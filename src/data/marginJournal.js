// Journal de marge (ACHATS + VENTES)
// Construit un journal chronologique par produit avec calcul du PMP, coût et marge.

function sortJournalBaseEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date.getTime() - b.date.getTime();
    }
    if (a.codeProduit !== b.codeProduit) {
      return a.codeProduit.localeCompare(b.codeProduit);
    }
    const typeOrder = (t) => (t === 'ACHAT' ? 0 : 1);
    if (typeOrder(a.type) !== typeOrder(b.type)) {
      return typeOrder(a.type) - typeOrder(b.type);
    }
    if (a.numCmd !== b.numCmd) {
      return String(a.numCmd).localeCompare(String(b.numCmd));
    }
    return a.index - b.index;
  });
}

export function buildMarginJournal(salesData, purchasesData, { trackStock = true } = {}) {
  const baseEntries = [];
  (purchasesData || []).forEach((p, idx) => {
    const date = new Date(p.dateCmd);
    if (Number.isNaN(date.getTime())) return;
    baseEntries.push({
      index: idx,
      source: 'ACHATS',
      type: 'ACHAT',
      date,
      dateStr: p.dateCmd,
      year: date.getFullYear(),
      numCmd: p.numCmd,
      codeProduit: p.codeProduit || '',
      produit: p.produit || '',
      partner: p.fournisseur || '',
      entree: p.qte || 0,
      sortie: 0,
      montantHt: p.montantHt || 0,
    });
  });

  (salesData || []).forEach((s, idx) => {
    const date = new Date(s.dateCmd);
    if (Number.isNaN(date.getTime())) return;
    baseEntries.push({
      index: 10_000 + idx,
      source: 'VENTES',
      type: 'VENTE',
      date,
      dateStr: s.dateCmd,
      year: date.getFullYear(),
      numCmd: s.numCmd,
      codeProduit: s.codeProduit || '',
      produit: s.produit || '',
      partner: s.client || '',
      entree: 0,
      sortie: s.qte || 0,
      montantHt: s.montantHt || 0,
    });
  });

  const sorted = sortJournalBaseEntries(baseEntries);
  const stateByProduct = new Map();
  const journal = [];

  for (const line of sorted) {
    const key = line.codeProduit || '__NO_CODE__';
    const state = stateByProduct.get(key) || { stockQty: 0, stockValue: 0, lastPmp: null };
    const flags = [];
    let pmp = state.lastPmp;
    let puAchat = null;
    let puVente = null;
    let coutHt = null;
    let margeHt = null;

    if (line.type === 'ACHAT') {
      const qty = line.entree || 0;
      puAchat = qty > 0 ? line.montantHt / qty : null;
      state.stockValue += line.montantHt;
      state.stockQty += qty;
      if (state.stockQty > 0) {
        pmp = state.stockValue / state.stockQty;
      } else {
        pmp = null;
      }
      state.lastPmp = pmp;
      if (trackStock && state.stockQty < 0) {
        flags.push('STOCK_NEGATIF');
      }
    } else if (line.type === 'VENTE') {
      const qty = line.sortie || 0;
      puVente = qty > 0 ? line.montantHt / qty : null;
      if (state.lastPmp == null || state.stockQty <= 0) {
        pmp = null;
        flags.push('COUT_INCONNU');
      } else {
        pmp = state.lastPmp;
        coutHt = qty * pmp;
        margeHt = line.montantHt - coutHt;
        if (trackStock) {
          state.stockQty -= qty;
          state.stockValue -= coutHt;
          if (state.stockQty < 0) {
            flags.push('STOCK_NEGATIF');
          }
        }
      }
    }

    stateByProduct.set(key, state);

    const stockQty = trackStock ? state.stockQty : null;
    const stockValue = trackStock ? state.stockValue : null;

    const d = new Date(line.dateStr);
    const annee = Number.isNaN(d.getTime()) ? null : d.getFullYear();
    const moisLabel = Number.isNaN(d.getTime())
      ? null
      : d.toLocaleString('fr-FR', { month: 'long' });

    journal.push({
      date: line.dateStr,
      type: line.type,
      numCmd: line.numCmd,
      codeProduit: line.codeProduit,
      produit: line.produit,
      partenaire: line.partner,
      entree: line.entree || null,
      sortie: line.sortie || null,
      puAchat: puAchat != null ? puAchat : null,
      puVente: puVente != null ? puVente : null,
      pmp: pmp != null ? pmp : null,
      coutHt: coutHt != null ? coutHt : null,
      margeHt: margeHt != null ? margeHt : null,
      stockQte: stockQty,
      stockValeur: stockValue,
      annee,
      moisLabel,
      flags,
    });
  }

  return journal;
}

