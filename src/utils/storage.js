const STORAGE_KEY = 'bi-dashboard-v2';

export function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const sales = parsed.salesData;
      const purchases = parsed.purchasesData;
      if (sales?.length) {
        const migrated = sales.map((r) =>
          r.typeVente === 'Gros' ? { ...r, typeVente: 'Gouvernement' } : r
        );
        return { salesData: migrated, purchasesData: purchases?.length ? purchases : null };
      }
      return { salesData: null, purchasesData: purchases?.length ? purchases : null };
    }
  } catch (e) {
    console.warn('Failed to load dashboard data:', e);
  }
  return { salesData: null, purchasesData: null };
}

export function saveData(salesData, purchasesData = null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      salesData: salesData || [],
      purchasesData: purchasesData || [],
      savedAt: new Date().toISOString(),
    }));
    return true;
  } catch (e) {
    console.warn('Failed to save dashboard data:', e);
    return false;
  }
}

export function loadLegacySales() {
  try {
    const stored = localStorage.getItem('bi-sales-dashboard-v1');
    if (stored) {
      const { salesData } = JSON.parse(stored);
      if (salesData?.length) {
        return salesData.map((r) =>
          r.typeVente === 'Gros' ? { ...r, typeVente: 'Gouvernement' } : r
        );
      }
    }
  } catch (_) {}
  return null;
}
