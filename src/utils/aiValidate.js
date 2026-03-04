/**
 * Call AI validation (OpenRouter). Tries /api/validate-import first (Vercel serverless).
 * If that fails (e.g. 404 in dev), falls back to direct OpenRouter when VITE_OPENROUTER_API_KEY is set.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini';

function buildPrompt(type, rowCount, columns, sampleRows) {
  const isSales = type === 'sales';
  const dataDesc = isSales
    ? 'VENTES (Num.CMD, Date, Client, Adresse, Code Produit, Produit, Qté, Montant HT, Taxe, Montant TTC)'
    : 'ACHATS (Num.CMD, Date, Fournisseur, Code Produit, Produit, QTY, Montant HT, Taxe, Montant TTC)';
  const sampleText = JSON.stringify(sampleRows.slice(0, 15), null, 0);
  return `Tu es un assistant qui vérifie la cohérence de données importées dans un tableau BI.

Contexte: ${dataDesc}
Nombre total de lignes: ${rowCount}
Colonnes présentes: ${columns.join(', ')}

Échantillon de lignes (JSON):
${sampleText}

Vérifie rapidement:
1. Les dates sont-elles plausibles (format, pas de dates futures si incohérent)?
2. Les montants et quantités sont-ils numériques et cohérents (pas de négatifs sauf si logique)?
3. Les champs obligatoires (commande, date, code produit, quantité) sont-ils renseignés?
4. Y a-t-il des incohérences évidentes (ex: montant TTC < HT, codes produits incohérents)?

Réponds en 2-4 phrases courtes en français: soit "Les données semblent cohérentes." soit liste les points d'attention ou erreurs évidentes. Sois concis.`;
}

export async function validateWithAI(type, rowCount, columns, sampleRows) {
  const payload = { type, rowCount, columns, sampleRows };

  // 1) Try serverless API (works on Vercel)
  try {
    const res = await fetch('/api/validate-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) return data;
    if (res.status === 404 || res.status === 502) throw new Error('API unavailable');
    return { ok: false, message: data.message || `Error ${res.status}` };
  } catch (err) {
    const clientKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENROUTER_API_KEY;
    if (!clientKey) {
      return {
        ok: false,
        message: 'Validation non disponible (déployez sur Vercel avec OPENROUTER_API_KEY, ou définissez VITE_OPENROUTER_API_KEY en dev).',
      };
    }
    // 2) Fallback: call OpenRouter from client (dev only; key exposed)
    try {
      const prompt = buildPrompt(type, rowCount, columns, sampleRows);
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${clientKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        return { ok: false, message: `OpenRouter: ${response.status} ${errText.slice(0, 150)}` };
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() || 'Aucune réponse.';
      return { ok: true, message: content };
    } catch (e) {
      return { ok: false, message: e.message || 'Requête échouée' };
    }
  }
}

/**
 * Build payload from sales or purchases array for validation.
 */
export function buildValidationPayload(data, type) {
  if (!data?.length) return null;
  const columns = type === 'sales'
    ? ['numCmd', 'dateCmd', 'client', 'adresse', 'codeProduit', 'produit', 'qte', 'montantHt', 'taxe', 'montantTtc']
    : ['numCmd', 'dateCmd', 'fournisseur', 'codeProduit', 'produit', 'qte', 'montantHt', 'taxe', 'montantTtc'];
  const sampleRows = data.slice(0, 15).map((row) => {
    const o = {};
    columns.forEach((col) => { o[col] = row[col]; });
    return o;
  });
  return { type: type === 'sales' ? 'sales' : 'purchases', rowCount: data.length, columns, sampleRows };
}
