import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

export function ChartProductsByTurnover({ data }) {
  return (
    <div className="chart-box">
      <h4>Classement des produits par chiffre d'affaires</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="produit" width={95} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => v?.toLocaleString('fr-FR')} />
          <Bar dataKey="montantHt" fill="#6366f1" name="Chiffre d'affaires (HT)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartClientsByPurchases({ data }) {
  return (
    <div className="chart-box">
      <h4>Classement des clients par achats (CA)</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="client" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={70} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => v?.toLocaleString('fr-FR')} />
          <Bar dataKey="montantHt" fill="#8b5cf6" name="Chiffre d'affaires (HT)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartQuantitiesByCategory({ data }) {
  return (
    <div className="chart-box">
      <h4>Ventes quantitatives par catégorie produit</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="categorie" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="qte" fill="#ec4899" name="Quantité" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartCategoryRevenue({ data }) {
  return (
    <div className="chart-box">
      <h4>CA par catégorie produit</h4>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="montantHt"
            nameKey="categorie"
            cx="50%"
            cy="50%"
            outerRadius={90}
            label={({ categorie, montantHt }) =>
              `${categorie}: ${(montantHt / 1000).toFixed(0)}k`
            }
          >
            {data?.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => v?.toLocaleString('fr-FR')} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartCAParWilaya({ data }) {
  return (
    <div className="chart-box">
      <h4>Chiffre d&apos;affaires par Wilaya</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="wilaya" />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => v?.toLocaleString('fr-FR')} />
          <Bar dataKey="montantHt" fill="#14b8a6" name="Chiffre d'affaires (HT)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartCAParFormeJuridique({ data }) {
  return (
    <div className="chart-box">
      <h4>Chiffre d&apos;affaires par Forme juridique</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="formeJuridique" />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => v?.toLocaleString('fr-FR')} />
          <Bar dataKey="montantHt" fill="#f97316" name="Chiffre d'affaires (HT)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartClientsParWilaya({ data }) {
  return (
    <div className="chart-box">
      <h4>Classement des clients par Wilaya (CA par client)</h4>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 120 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="label" width={115} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => v?.toLocaleString('fr-FR')} />
          <Bar dataKey="montantHt" fill="#8b5cf6" name="Chiffre d'affaires (HT)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartProduitsParTypeVente({ data }) {
  return (
    <div className="chart-box">
      <h4>Classement produits par CA et type vente</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="produit" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={80} />
          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => v?.toLocaleString('fr-FR')} />
          <Legend />
          <Bar dataKey="Direct" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Retail" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Gouvernement" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartQuantitiesByTypeMonth({ data }) {
  return (
    <div className="chart-box">
      <h4>Quantités vendues par type vente et mois</h4>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="Direct" fill="#6366f1" stackId="a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Retail" fill="#8b5cf6" stackId="a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="Gouvernement" fill="#ec4899" stackId="a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
