import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AXIS_LABELS = {
  codeProduit: 'Code produit',
  produit: 'Produit',
  categorie: 'Catégorie',
  client: 'Client',
  fournisseur: 'Fournisseur',
  formeJuridique: 'Forme juridique',
  typeVente: 'Type vente',
  typeAchat: 'Type achat',
  type: 'Type (achat/vente)',
  partenaire: 'Partenaire',
  wilaya: 'Wilaya',
  moisLabel: 'Mois',
  annee: 'Année',
  dateCmd: 'Date commande',
  date: 'Date',
  numCmd: 'Num. commande',
};

const MEASURE_LABELS = {
  montantHt: "Chiffre d'affaires",
  montantTtc: 'Montant TTC',
  taxe: 'Taxe',
  qte: 'Quantité',
  entree: 'Entrées (Qté achat)',
  sortie: 'Sorties (Qté vente)',
  coutHt: 'Coût HT (PMP)',
  margeHt: 'Marge HT',
  stockQte: 'Stock quantité',
  stockValeur: 'Valeur stock (HT)',
  count: 'Nombre de lignes',
};

const CURRENCY_MEASURES = ['montantHt', 'montantTtc', 'taxe', 'coutHt', 'margeHt', 'stockValeur'];

export function CentralChart({ data, axisX, axisY }) {
  if (!data?.length) {
    return (
      <div className="central-chart-empty">
        Aucune donnée. Ajustez les filtres ou les axes.
      </div>
    );
  }

  const isHorizontal = data.length > 8;
  const valueKey = 'value';
  const labelKey = axisX;

  return (
    <div className="central-chart">
      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={data}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={isHorizontal ? { left: 140, right: 24 } : { bottom: 80, left: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          {isHorizontal ? (
            <>
              <XAxis type="number" tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
              <YAxis type="category" dataKey={labelKey} width={135} tick={{ fontSize: 11 }} />
            </>
          ) : (
            <>
              <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={80} />
              <YAxis tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
            </>
          )}
          <Tooltip
            formatter={(v) => (CURRENCY_MEASURES.includes(axisY) ? v?.toLocaleString('fr-FR') : v)}
            labelFormatter={(l) => l}
          />
          <Bar
            dataKey={valueKey}
            fill="#6366f1"
            name={MEASURE_LABELS[axisY] || axisY}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export { AXIS_LABELS, MEASURE_LABELS };
