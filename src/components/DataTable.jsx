import { useState } from 'react';
import { Edit2, Check, X, Plus, Trash2 } from 'lucide-react';

const formatAmount = (n) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 });

const SALES_COLUMNS = [
  { key: 'numCmd', label: 'Num.CMD', editable: false },
  { key: 'dateCmd', label: 'Date', editable: true },
  { key: 'client', label: 'Client', editable: true },
  { key: 'adresse', label: 'Adresse', editable: true },
  { key: 'codeProduit', label: 'Code Produit', editable: true },
  { key: 'produit', label: 'Produit', editable: true },
  { key: 'qte', label: 'Qté', editable: true },
  { key: 'montantTtc', label: 'Montant TTC', editable: true, format: formatAmount },
  { key: 'typeVente', label: 'Type vente', editable: false },
  { key: 'wilaya', label: 'Wilaya', editable: false },
  { key: 'categorie', label: 'Catégorie', editable: false },
  { key: 'formeJuridique', label: 'Forme juridique', editable: false },
];

const PURCHASES_COLUMNS = [
  { key: 'numCmd', label: 'Num.CMD', editable: false },
  { key: 'dateCmd', label: 'Date', editable: true },
  { key: 'fournisseur', label: 'Fournisseur', editable: true },
  { key: 'codeProduit', label: 'Code Produit', editable: true },
  { key: 'produit', label: 'Produit', editable: true },
  { key: 'qte', label: 'Qté', editable: true },
  { key: 'montantTtc', label: 'Montant TTC', editable: true, format: formatAmount },
  { key: 'typeAchat', label: 'Type achat', editable: false },
  { key: 'categorie', label: 'Catégorie', editable: false },
  { key: 'formeJuridique', label: 'Forme juridique', editable: false },
];

export { PURCHASES_COLUMNS, SALES_COLUMNS };

export function DataTable({ data, onUpdate, onAdd, onDelete, columns }) {
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({});

  const cols = columns || SALES_COLUMNS;

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditRow({ ...row });
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdate(editRow);
      setEditingId(null);
      setEditRow({});
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRow({});
  };

  const isNumeric = (key) => key === 'qte' || key === 'montantTtc' || key === 'montantHt';

  return (
    <div className="data-table-wrap">
      {(onAdd || onDelete) && (
        <div className="data-table-actions">
          {onAdd && (
            <button className="btn btn-add" onClick={onAdd}>
              <Plus size={16} /> Ajouter une ligne
            </button>
          )}
        </div>
      )}
      {!data?.length ? (
        <p className="empty-state">Aucune donnée. Cliquez sur &quot;Ajouter une ligne&quot; pour commencer.</p>
      ) : (
      <table className="data-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {cols.map(({ key, editable, format }) => {
                const isEditing = editingId === row.id;
                const val = isEditing ? editRow[key] : row[key];
                const display = format ? format(val) : val;
                return (
                  <td key={key}>
                    {isEditing && editable ? (
                      <input
                        type={isNumeric(key) ? 'number' : 'text'}
                        value={val ?? ''}
                        onChange={(e) =>
                          setEditRow((prev) => ({
                            ...prev,
                            [key]: isNumeric(key) ? +e.target.value : e.target.value,
                          }))
                        }
                      />
                    ) : (
                      display
                    )}
                  </td>
                );
              })}
              <td>
                {editingId === row.id ? (
                  <>
                    <button className="btn-icon save" onClick={saveEdit}><Check size={14} /></button>
                    <button className="btn-icon cancel" onClick={cancelEdit}><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <button className="btn-icon edit" onClick={() => startEdit(row)} title="Modifier">
                      <Edit2 size={14} />
                    </button>
                    {onDelete && (
                      <button className="btn-icon delete" onClick={() => onDelete(row.id)} title="Supprimer">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
    </div>
  );
}
