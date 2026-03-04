import { useState, useEffect, useMemo } from 'react';
import {
  BarChart2,
  Table2,
  RefreshCw,
  Database,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  UploadCloud,
  Plus,
} from 'lucide-react';
import { defaultSalesData, processSalesData } from './data/salesData';
import { defaultPurchasesData, processPurchasesData } from './data/purchasesData';
import { loadData, saveData, loadLegacySales } from './utils/storage';
import { FilterPanel } from './components/FilterPanel';
import { AdvancedTable, ColumnTypes } from './components/AdvancedTable';
import { buildMarginJournal } from './data/marginJournal';
import { CentralChart, AXIS_LABELS, MEASURE_LABELS } from './components/CentralChart';
import { parseCsvToObjects } from './utils/csvParser';
import { importSalesFromFlatRows, importPurchasesFromFlatRows } from './data/importUtils';
import './App.css';

const DIMENSION_KEYS_VENTES = ['codeProduit', 'produit', 'categorie', 'client', 'formeJuridique', 'typeVente', 'wilaya', 'moisLabel', 'annee', 'dateCmd', 'numCmd'];
const DIMENSION_KEYS_ACHATS = ['codeProduit', 'produit', 'categorie', 'fournisseur', 'formeJuridique', 'typeAchat', 'moisLabel', 'annee', 'dateCmd', 'numCmd'];
const DIMENSION_KEYS_MARGE = ['codeProduit', 'produit', 'type', 'partenaire', 'moisLabel', 'annee', 'date', 'numCmd'];

const MEASURE_KEYS_SALES_PURCHASES = ['montantHt', 'montantTtc', 'taxe', 'qte', 'count'];
const MEASURE_KEYS_MARGE = ['entree', 'sortie', 'coutHt', 'margeHt', 'stockQte', 'count'];

const defaultFiltersVentes = {
  produit: '', categorie: '', client: '', formeJuridique: '', typeVente: '', wilaya: '', mois: '', annee: '', dateMin: '', dateMax: '',
};

const defaultFiltersAchats = {
  produit: '', categorie: '', fournisseur: '', formeJuridique: '', typeAchat: '', mois: '', annee: '', dateMin: '', dateMax: '',
};

function applyFilters(data, filters, dateKey = 'dateCmd', moisFilterKey = 'moisLabel') {
  return data.filter((row) => {
    const date = new Date(row[dateKey]);
    if (filters.dateMin && date < new Date(filters.dateMin)) return false;
    if (filters.dateMax && date > new Date(filters.dateMax + 'T23:59:59')) return false;
    for (const [k, v] of Object.entries(filters)) {
      if (!v || k === 'dateMin' || k === 'dateMax') continue;
      const rowKey = k === 'mois' ? moisFilterKey : k;
      const rowVal = row[rowKey];
      if (k === 'annee') {
        if (String(rowVal) !== String(v)) return false;
      } else if (String(rowVal || '').toLowerCase() !== String(v).toLowerCase()) {
        return false;
      }
    }
    return true;
  });
}

function App() {
  const [dataSource, setDataSource] = useState('ventes');
  const [salesData, setSalesData] = useState(defaultSalesData);
  const [purchasesData, setPurchasesData] = useState(defaultPurchasesData);
  const [filtersVentes, setFiltersVentes] = useState(defaultFiltersVentes);
  const [filtersAchats, setFiltersAchats] = useState(defaultFiltersAchats);
  const [activeTab, setActiveTab] = useState('analyses');
  const [activeDataTab, setActiveDataTab] = useState('ventes'); // 'ventes' | 'achats' | 'marge'
  const [analysisSource, setAnalysisSource] = useState('ventes'); // 'ventes' | 'achats' | 'marge'
  const [lastSaved, setLastSaved] = useState(null);
  const [chartAxisX, setChartAxisX] = useState('categorie');
  const [chartAxisY, setChartAxisY] = useState('montantHt');
  const [importErrorsVentes, setImportErrorsVentes] = useState([]);
  const [importErrorsAchats, setImportErrorsAchats] = useState([]);
  const [importSalesMode, setImportSalesMode] = useState('replace'); // 'replace' | 'expand'
  const [importPurchasesMode, setImportPurchasesMode] = useState('replace'); // 'replace' | 'expand'
  const [showAddVente, setShowAddVente] = useState(false);
  const [showAddAchat, setShowAddAchat] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [newVente, setNewVente] = useState({
    numCmd: 'SLSD/0000',
    dateCmd: today,
    client: '',
    adresse: '',
    codeProduit: '',
    produit: '',
    qte: 1,
    montantHt: 0,
    taxe: 0,
    montantTtc: 0,
  });
  const [newAchat, setNewAchat] = useState({
    numCmd: 'POL/0000',
    dateCmd: today,
    fournisseur: '',
    codeProduit: '',
    produit: '',
    qte: 1,
    montantHt: 0,
    taxe: 0,
    montantTtc: 0,
  });

  useEffect(() => {
    const { salesData: s, purchasesData: p } = loadData();
    if (s?.length) setSalesData(s);
    if (p?.length) setPurchasesData(p);
    else {
      const legacy = loadLegacySales();
      if (legacy?.length) setSalesData(legacy);
    }
  }, []);

  useEffect(() => {
    saveData(salesData, purchasesData);
    setLastSaved(new Date().toLocaleTimeString('fr-FR'));
  }, [salesData, purchasesData]);

  const isVentes = dataSource === 'ventes';
  const filters = isVentes ? filtersVentes : filtersAchats;
  const setFilters = isVentes ? setFiltersVentes : setFiltersAchats;
  const currentData = isVentes ? salesData : purchasesData;

  const filteredData = useMemo(
    () => applyFilters(currentData, filters),
    [currentData, filters]
  );

  const marginJournal = useMemo(
    () => buildMarginJournal(salesData, purchasesData, { trackStock: true }),
    [salesData, purchasesData]
  );

  const isAnalysisMarge = analysisSource === 'marge';

  const dimensionKeys = useMemo(() => {
    if (isAnalysisMarge) return DIMENSION_KEYS_MARGE;
    return isVentes ? DIMENSION_KEYS_VENTES : DIMENSION_KEYS_ACHATS;
  }, [isAnalysisMarge, isVentes]);

  const measureKeysForSource = useMemo(() => {
    if (isAnalysisMarge) return MEASURE_KEYS_MARGE;
    return MEASURE_KEYS_SALES_PURCHASES;
  }, [isAnalysisMarge]);

  const uniqueValues = useMemo(() => {
    const getUnique = (key) => [...new Set(currentData.map((r) => r[key]).filter(Boolean))].sort();
    if (isVentes) {
      return {
        produits: getUnique('produit'),
        categories: getUnique('categorie'),
        clients: getUnique('client'),
        formesJuridiques: getUnique('formeJuridique'),
        typesVente: getUnique('typeVente'),
        wilayas: getUnique('wilaya'),
        mois: getUnique('moisLabel'),
        annees: getUnique('annee').map(String).sort(),
      };
    }
    return {
      produits: getUnique('produit'),
      categories: getUnique('categorie'),
      fournisseurs: getUnique('fournisseur'),
      formesJuridiques: getUnique('formeJuridique'),
      typesAchat: getUnique('typeAchat'),
      mois: getUnique('moisLabel'),
      annees: getUnique('annee').map(String).sort(),
    };
  }, [currentData, isVentes]);

  const filterFields = useMemo(() => {
    if (isVentes) {
      return [
        { key: 'produit', label: 'Produit', values: uniqueValues.produits },
        { key: 'categorie', label: 'Catégorie', values: uniqueValues.categories },
        { key: 'client', label: 'Client', values: uniqueValues.clients },
        { key: 'formeJuridique', label: 'Forme juridique', values: uniqueValues.formesJuridiques },
        { key: 'typeVente', label: 'Type vente', values: uniqueValues.typesVente },
        { key: 'wilaya', label: 'Wilaya', values: uniqueValues.wilayas },
        { key: 'mois', label: 'Mois', values: uniqueValues.mois },
        { key: 'annee', label: 'Année', values: uniqueValues.annees },
      ];
    }
    return [
      { key: 'produit', label: 'Produit', values: uniqueValues.produits },
      { key: 'categorie', label: 'Catégorie', values: uniqueValues.categories },
      { key: 'fournisseur', label: 'Fournisseur', values: uniqueValues.fournisseurs },
      { key: 'formeJuridique', label: 'Forme juridique', values: uniqueValues.formesJuridiques },
      { key: 'typeAchat', label: 'Type achat', values: uniqueValues.typesAchat },
      { key: 'mois', label: 'Mois', values: uniqueValues.mois },
      { key: 'annee', label: 'Année', values: uniqueValues.annees },
    ];
  }, [uniqueValues, isVentes]);

  useEffect(() => {
    if (!dimensionKeys.includes(chartAxisX)) setChartAxisX(dimensionKeys[0]);
  }, [dimensionKeys, chartAxisX]);

  useEffect(() => {
    if (!measureKeysForSource.includes(chartAxisY)) {
      setChartAxisY(measureKeysForSource[0]);
    }
  }, [measureKeysForSource, chartAxisY]);

  const centralChartData = useMemo(() => {
    const dimKey = chartAxisX;
    if (!dimensionKeys.includes(dimKey)) return [];
    const sourceData = isAnalysisMarge ? marginJournal : filteredData;
    const by = {};
    sourceData.forEach((r) => {
      const key = String(r[dimKey] ?? 'Non défini');
      if (!by[key]) by[key] = { [dimKey]: key, value: 0 };
      if (chartAxisY === 'count') by[key].value += 1;
      else if (measureKeysForSource.includes(chartAxisY)) by[key].value += r[chartAxisY] ?? 0;
    });
    return Object.values(by)
      .sort((a, b) => b.value - a.value)
      .slice(0, 25);
  }, [filteredData, marginJournal, chartAxisX, chartAxisY, dimensionKeys, isAnalysisMarge, measureKeysForSource]);

  const handleResetFilters = () => {
    if (isVentes) setFiltersVentes(defaultFiltersVentes);
    else setFiltersAchats(defaultFiltersAchats);
  };

  const handleResetData = () => {
    if (confirm('Réinitialiser les données du tableau sélectionné ?')) {
      if (isVentes) {
        setSalesData(defaultSalesData);
        setFiltersVentes(defaultFiltersVentes);
      } else {
        setPurchasesData(defaultPurchasesData);
        setFiltersAchats(defaultFiltersAchats);
      }
    }
  };

  const totalMontantHt = filteredData.reduce((s, r) => s + (r.montantHt ?? 0), 0);
  const totalQte = filteredData.reduce((s, r) => s + r.qte, 0);
  const distinctCount = isVentes
    ? new Set(filteredData.map((r) => r.client)).size
    : new Set(filteredData.map((r) => r.fournisseur)).size;

  const handleImportSalesFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const flatRows = parseCsvToObjects(text);
      const { rows, errors } = importSalesFromFlatRows(flatRows);
      const processed = processSalesData(rows);
      if (importSalesMode === 'expand') {
        const maxId = Math.max(0, ...salesData.map((r) => r.id || 0));
        const withIds = processed.map((r, i) => ({ ...r, id: maxId + i + 1 }));
        setSalesData((prev) => [...prev, ...withIds]);
      } else {
        setSalesData(processed);
      }
      setImportErrorsVentes(errors);
    } catch (e) {
      console.error('Import ventes échoué', e);
      setImportErrorsVentes([{ source: 'VENTES', reasons: ['IMPORT_ECHEC'] }]);
    } finally {
      event.target.value = '';
    }
  };

  const handleImportPurchasesFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const flatRows = parseCsvToObjects(text);
      const { rows, errors } = importPurchasesFromFlatRows(flatRows);
      const processed = processPurchasesData(rows);
      if (importPurchasesMode === 'expand') {
        const maxId = Math.max(0, ...purchasesData.map((r) => r.id || 0));
        const withIds = processed.map((r, i) => ({ ...r, id: maxId + i + 1 }));
        setPurchasesData((prev) => [...prev, ...withIds]);
      } else {
        setPurchasesData(processed);
      }
      setImportErrorsAchats(errors);
    } catch (e) {
      console.error('Import achats échoué', e);
      setImportErrorsAchats([{ source: 'ACHATS', reasons: ['IMPORT_ECHEC'] }]);
    } finally {
      event.target.value = '';
    }
  };

  const handleAddVenteSubmit = (event) => {
    event.preventDefault();
    const processed = processSalesData([newVente])[0];
    const newId = Math.max(0, ...salesData.map((r) => r.id || 0)) + 1;
    setSalesData((prev) => [...prev, { ...processed, id: newId }]);
    setNewVente({
      ...newVente,
      numCmd: 'SLSD/0000',
      codeProduit: '',
      produit: '',
      qte: 1,
      montantHt: 0,
      taxe: 0,
      montantTtc: 0,
    });
    setShowAddVente(false);
  };

  const handleAddAchatSubmit = (event) => {
    event.preventDefault();
    const processed = processPurchasesData([newAchat])[0];
    const newId = Math.max(0, ...purchasesData.map((r) => r.id || 0)) + 1;
    setPurchasesData((prev) => [...prev, { ...processed, id: newId }]);
    setNewAchat({
      ...newAchat,
      numCmd: 'POL/0000',
      codeProduit: '',
      produit: '',
      qte: 1,
      montantHt: 0,
      taxe: 0,
      montantTtc: 0,
    });
    setShowAddAchat(false);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Business Intelligence – {isVentes ? 'Tableau 01 (Ventes)' : 'Tableau 02 (Achats)'}</h1>
        <div className="header-actions">
          {lastSaved && <span className="saved-badge">Sauvegardé {lastSaved}</span>}
          <button className="btn btn-outline" onClick={handleResetData} title="Réinitialiser les données">
            <RefreshCw size={16} /> Réinitialiser
          </button>
        </div>
      </header>

      <FilterPanel
        filters={filters}
        onFilterChange={(k, v) => setFilters((prev) => ({ ...prev, [k]: v }))}
        onReset={handleResetFilters}
        filterFields={filterFields}
      />

      <div className="kpi-row">
        <div className="kpi-card">
          <TrendingUp size={24} />
          <div>
            <span className="kpi-value">{totalMontantHt.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} DA</span>
            <span className="kpi-label">{isVentes ? "Chiffre d'affaires (HT)" : 'Coût d\'achat (HT)'}</span>
          </div>
        </div>
        <div className="kpi-card">
          <Package size={24} />
          <div>
            <span className="kpi-value">{totalQte}</span>
            <span className="kpi-label">{isVentes ? 'Quantités vendues' : 'Quantités achetées'}</span>
          </div>
        </div>
        <div className="kpi-card">
          <Users size={24} />
          <div>
            <span className="kpi-value">{distinctCount}</span>
            <span className="kpi-label">{isVentes ? 'Clients distincts' : 'Fournisseurs distincts'}</span>
          </div>
        </div>
      </div>

      <nav className="tabs">
        <button className={activeTab === 'analyses' ? 'active' : ''} onClick={() => setActiveTab('analyses')}>
          <BarChart2 size={18} /> Analyses & graphiques
        </button>
        <button className={activeTab === 'data' ? 'active' : ''} onClick={() => setActiveTab('data')}>
          <Table2 size={18} /> Ventes, Achats & Marge
        </button>
      </nav>

      <main className="content">
        {activeTab === 'analyses' && (
          <div className="central-graph-panel">
            <nav className="tabs sub-tabs">
              <button
                className={analysisSource === 'ventes' ? 'active' : ''}
                onClick={() => {
                  setAnalysisSource('ventes');
                  setDataSource('ventes');
                }}
              >
                <TrendingUp size={16} /> Ventes
              </button>
              <button
                className={analysisSource === 'achats' ? 'active' : ''}
                onClick={() => {
                  setAnalysisSource('achats');
                  setDataSource('achats');
                }}
              >
                <ShoppingCart size={16} /> Achats
              </button>
              <button
                className={analysisSource === 'marge' ? 'active' : ''}
                onClick={() => setAnalysisSource('marge')}
              >
                <TrendingUp size={16} /> Marge (journal)
              </button>
            </nav>
            <div className="axis-selectors">
              <div className="axis-group">
                <label>Axe X (en fonction de)</label>
                <select value={chartAxisX} onChange={(e) => setChartAxisX(e.target.value)}>
                  {dimensionKeys.map((k) => (
                    <option key={k} value={k}>{AXIS_LABELS[k] ?? k}</option>
                  ))}
                </select>
              </div>
              <div className="axis-group">
                <label>Axe Y (indicateur)</label>
                <select value={chartAxisY} onChange={(e) => setChartAxisY(e.target.value)}>
                  {measureKeysForSource.map((k) => (
                    <option key={k} value={k}>{MEASURE_LABELS[k] ?? k}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="central-chart-caption">
              {MEASURE_LABELS[chartAxisY]} <em>en fonction de</em> {AXIS_LABELS[chartAxisX]}
            </p>
            <CentralChart data={centralChartData} axisX={chartAxisX} axisY={chartAxisY} />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="data-panel">
            <div className="data-header">
              <Database size={20} />
              <h2>Données Ventes / Achats / Marge</h2>
              <p>
                Trois vues : ventes seules, achats seuls, et journal de marge fusionné, chacune
                avec filtres colonne par colonne, tri multi-colonnes, pagination et export CSV.
              </p>
            </div>
            <nav className="tabs sub-tabs">
              <button
                className={activeDataTab === 'ventes' ? 'active' : ''}
                onClick={() => setActiveDataTab('ventes')}
              >
                <TrendingUp size={16} /> Ventes
              </button>
              <button
                className={activeDataTab === 'achats' ? 'active' : ''}
                onClick={() => setActiveDataTab('achats')}
              >
                <ShoppingCart size={16} /> Achats
              </button>
              <button
                className={activeDataTab === 'marge' ? 'active' : ''}
                onClick={() => setActiveDataTab('marge')}
              >
                <TrendingUp size={16} /> Marge
              </button>
            </nav>

            {activeDataTab === 'ventes' && (
              <>
                <div className="data-actions-bar">
                  <button
                    className="btn btn-add"
                    type="button"
                    onClick={() => setShowAddVente((v) => !v)}
                  >
                    <Plus size={14} /> Ajouter une vente
                  </button>
                  <span className="import-mode-toggle">
                    <span className="import-mode-label">Import CSV :</span>
                    <button
                      type="button"
                      className={importSalesMode === 'replace' ? 'active' : ''}
                      onClick={() => setImportSalesMode('replace')}
                    >
                      Remplacer
                    </button>
                    <button
                      type="button"
                      className={importSalesMode === 'expand' ? 'active' : ''}
                      onClick={() => setImportSalesMode('expand')}
                    >
                      Étendre
                    </button>
                  </span>
                  <label className="file-upload-btn">
                    <UploadCloud size={14} /> Choisir un fichier
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleImportSalesFile}
                    />
                  </label>
                  {importErrorsVentes?.length > 0 && (
                    <span className="import-errors-badge">
                      {importErrorsVentes.length} lignes invalides ignorées
                    </span>
                  )}
                </div>
                {showAddVente && (
                  <form className="quick-add-form" onSubmit={handleAddVenteSubmit}>
                    <div className="quick-add-grid">
                      <div>
                        <label>Num.CMD</label>
                        <input
                          type="text"
                          value={newVente.numCmd}
                          onChange={(e) => setNewVente((p) => ({ ...p, numCmd: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Date</label>
                        <input
                          type="date"
                          value={newVente.dateCmd}
                          onChange={(e) => setNewVente((p) => ({ ...p, dateCmd: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Client</label>
                        <input
                          type="text"
                          value={newVente.client}
                          onChange={(e) => setNewVente((p) => ({ ...p, client: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Adresse</label>
                        <input
                          type="text"
                          value={newVente.adresse}
                          onChange={(e) => setNewVente((p) => ({ ...p, adresse: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Code Produit</label>
                        <input
                          type="text"
                          value={newVente.codeProduit}
                          onChange={(e) => setNewVente((p) => ({ ...p, codeProduit: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Produit</label>
                        <input
                          type="text"
                          value={newVente.produit}
                          onChange={(e) => setNewVente((p) => ({ ...p, produit: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Qté</label>
                        <input
                          type="number"
                          min={1}
                          value={newVente.qte}
                          onChange={(e) => setNewVente((p) => ({ ...p, qte: Number(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <label>Montant HT</label>
                        <input
                          type="number"
                          value={newVente.montantHt}
                          onChange={(e) => setNewVente((p) => ({ ...p, montantHt: Number(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <label>Taxe</label>
                        <input
                          type="number"
                          value={newVente.taxe}
                          onChange={(e) => setNewVente((p) => ({ ...p, taxe: Number(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <label>Montant TTC</label>
                        <input
                          type="number"
                          value={newVente.montantTtc}
                          onChange={(e) => setNewVente((p) => ({ ...p, montantTtc: Number(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <div className="quick-add-actions">
                      <button type="submit" className="btn btn-add">
                        <Plus size={14} /> Valider
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setShowAddVente(false)}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
                <AdvancedTable
                  data={salesData}
                  columns={[
                    { key: 'dateCmd', label: 'Date', type: ColumnTypes.DATE },
                    { key: 'numCmd', label: 'Num.CMD', type: ColumnTypes.TEXT },
                    { key: 'client', label: 'Client', type: ColumnTypes.TEXT },
                    { key: 'adresse', label: 'Adresse', type: ColumnTypes.TEXT },
                    { key: 'codeProduit', label: 'Code Produit', type: ColumnTypes.TEXT },
                    { key: 'produit', label: 'Produit', type: ColumnTypes.TEXT },
                    { key: 'qte', label: 'Qté', type: ColumnTypes.NUMBER },
                    { key: 'montantHt', label: 'Montant HT', type: ColumnTypes.NUMBER },
                    { key: 'taxe', label: 'Taxe', type: ColumnTypes.NUMBER },
                    { key: 'montantTtc', label: 'Montant TTC', type: ColumnTypes.NUMBER },
                    { key: 'typeVente', label: 'Type vente', type: ColumnTypes.TEXT },
                    { key: 'wilaya', label: 'Wilaya', type: ColumnTypes.TEXT },
                    { key: 'categorie', label: 'Catégorie', type: ColumnTypes.TEXT },
                    { key: 'formeJuridique', label: 'Forme juridique', type: ColumnTypes.TEXT },
                  ]}
                  defaultSort={[
                    { key: 'dateCmd', direction: 'asc' },
                    { key: 'codeProduit', direction: 'asc' },
                    { key: 'numCmd', direction: 'asc' },
                  ]}
                  exportFileName="ventes_nettoyees.csv"
                  title="Ventes – données nettoyées"
                />
              </>
            )}

            {activeDataTab === 'achats' && (
              <>
                <div className="data-actions-bar">
                  <button
                    className="btn btn-add"
                    type="button"
                    onClick={() => setShowAddAchat((v) => !v)}
                  >
                    <Plus size={14} /> Ajouter un achat
                  </button>
                  <span className="import-mode-toggle">
                    <span className="import-mode-label">Import CSV :</span>
                    <button
                      type="button"
                      className={importPurchasesMode === 'replace' ? 'active' : ''}
                      onClick={() => setImportPurchasesMode('replace')}
                    >
                      Remplacer
                    </button>
                    <button
                      type="button"
                      className={importPurchasesMode === 'expand' ? 'active' : ''}
                      onClick={() => setImportPurchasesMode('expand')}
                    >
                      Étendre
                    </button>
                  </span>
                  <label className="file-upload-btn">
                    <UploadCloud size={14} /> Choisir un fichier
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleImportPurchasesFile}
                    />
                  </label>
                  {importErrorsAchats?.length > 0 && (
                    <span className="import-errors-badge">
                      {importErrorsAchats.length} lignes invalides ignorées
                    </span>
                  )}
                </div>
                {showAddAchat && (
                  <form className="quick-add-form" onSubmit={handleAddAchatSubmit}>
                    <div className="quick-add-grid">
                      <div>
                        <label>Num.CMD</label>
                        <input
                          type="text"
                          value={newAchat.numCmd}
                          onChange={(e) => setNewAchat((p) => ({ ...p, numCmd: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Date</label>
                        <input
                          type="date"
                          value={newAchat.dateCmd}
                          onChange={(e) => setNewAchat((p) => ({ ...p, dateCmd: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Fournisseur</label>
                        <input
                          type="text"
                          value={newAchat.fournisseur}
                          onChange={(e) => setNewAchat((p) => ({ ...p, fournisseur: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Code Produit</label>
                        <input
                          type="text"
                          value={newAchat.codeProduit}
                          onChange={(e) => setNewAchat((p) => ({ ...p, codeProduit: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Produit</label>
                        <input
                          type="text"
                          value={newAchat.produit}
                          onChange={(e) => setNewAchat((p) => ({ ...p, produit: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label>Qté</label>
                        <input
                          type="number"
                          min={1}
                          value={newAchat.qte}
                          onChange={(e) => setNewAchat((p) => ({ ...p, qte: Number(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <label>Montant HT</label>
                        <input
                          type="number"
                          value={newAchat.montantHt}
                          onChange={(e) => setNewAchat((p) => ({ ...p, montantHt: Number(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <label>Taxe</label>
                        <input
                          type="number"
                          value={newAchat.taxe}
                          onChange={(e) => setNewAchat((p) => ({ ...p, taxe: Number(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <label>Montant TTC</label>
                        <input
                          type="number"
                          value={newAchat.montantTtc}
                          onChange={(e) => setNewAchat((p) => ({ ...p, montantTtc: Number(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <div className="quick-add-actions">
                      <button type="submit" className="btn btn-add">
                        <Plus size={14} /> Valider
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setShowAddAchat(false)}
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                )}
                <AdvancedTable
                  data={purchasesData}
                  columns={[
                    { key: 'dateCmd', label: 'Date', type: ColumnTypes.DATE },
                    { key: 'numCmd', label: 'Num.CMD', type: ColumnTypes.TEXT },
                    { key: 'fournisseur', label: 'Fournisseur', type: ColumnTypes.TEXT },
                    { key: 'codeProduit', label: 'Code Produit', type: ColumnTypes.TEXT },
                    { key: 'produit', label: 'Produit', type: ColumnTypes.TEXT },
                    { key: 'qte', label: 'Qté', type: ColumnTypes.NUMBER },
                    { key: 'montantHt', label: 'Montant HT', type: ColumnTypes.NUMBER },
                    { key: 'taxe', label: 'Taxe', type: ColumnTypes.NUMBER },
                    { key: 'montantTtc', label: 'Montant TTC', type: ColumnTypes.NUMBER },
                  ]}
                  defaultSort={[
                    { key: 'dateCmd', direction: 'asc' },
                    { key: 'codeProduit', direction: 'asc' },
                    { key: 'numCmd', direction: 'asc' },
                  ]}
                  exportFileName="achats_nettoyes.csv"
                  title="Achats – données nettoyées"
                />
              </>
            )}

            {activeDataTab === 'marge' && (
              <AdvancedTable
                data={marginJournal}
                columns={[
                  { key: 'date', label: 'Date', type: ColumnTypes.DATE },
                  { key: 'type', label: 'Type', type: ColumnTypes.TEXT },
                  { key: 'numCmd', label: 'Num.CMD', type: ColumnTypes.TEXT },
                  { key: 'codeProduit', label: 'Code Produit', type: ColumnTypes.TEXT },
                  { key: 'produit', label: 'Produit', type: ColumnTypes.TEXT },
                  { key: 'partenaire', label: 'Partenaire', type: ColumnTypes.TEXT },
                  { key: 'entree', label: 'Entrée', type: ColumnTypes.NUMBER },
                  { key: 'sortie', label: 'Sortie', type: ColumnTypes.NUMBER },
                  { key: 'puAchat', label: 'PU Achat', type: ColumnTypes.NUMBER },
                  { key: 'puVente', label: 'PU Vente', type: ColumnTypes.NUMBER },
                  { key: 'pmp', label: 'PMP', type: ColumnTypes.NUMBER },
                  { key: 'coutHt', label: 'Coût HT', type: ColumnTypes.NUMBER },
                  { key: 'margeHt', label: 'Marge HT', type: ColumnTypes.NUMBER },
                  { key: 'stockQte', label: 'Stock Qté', type: ColumnTypes.NUMBER },
                  { key: 'stockValeur', label: 'Stock Valeur', type: ColumnTypes.NUMBER },
                  {
                    key: 'flags',
                    label: 'Alertes',
                    type: ColumnTypes.TEXT,
                    render: (v, row) => (row.flags || []).join(', '),
                  },
                ]}
                defaultSort={[
                  { key: 'date', direction: 'asc' },
                  { key: 'codeProduit', direction: 'asc' },
                  { key: 'type', direction: 'asc' },
                  { key: 'numCmd', direction: 'asc' },
                ]}
                rowClassName={(row) => {
                  const classes = [];
                  if (row.type === 'ACHAT') classes.push('row-achat');
                  if (row.type === 'VENTE') classes.push('row-vente');
                  if (row.flags?.includes('COUT_INCONNU') || row.flags?.includes('STOCK_NEGATIF')) {
                    classes.push('row-alert');
                  }
                  return classes.join(' ');
                }}
                exportFileName="journal_marge.csv"
                title="Journal de marge (entrées / sorties)"
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
