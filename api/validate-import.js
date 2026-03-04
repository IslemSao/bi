/**
 * Vercel serverless function: validate imported sales/purchases data via OpenRouter.
 * Set OPENROUTER_API_KEY in Vercel environment variables.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini'; // cheap and fast; change if you prefer

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  allowCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return res.status(500).json({
      ok: false,
      message: 'OPENROUTER_API_KEY not configured. Add it in Vercel project settings.',
    });
  }

  let body;
  try {
    const raw = req.body;
    if (raw == null) return res.status(400).json({ ok: false, message: 'No request body' });
    body = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return res.status(400).json({ ok: false, message: 'Invalid JSON body' });
  }

  const { type, rowCount, columns, sampleRows } = body;
  if (!type || !Array.isArray(columns) || !Array.isArray(sampleRows)) {
    return res.status(400).json({
      ok: false,
      message: 'Missing type, columns, or sampleRows',
    });
  }

  const isSales = type === 'sales';
  const dataDesc = isSales
    ? 'VENTES (Num.CMD, Date, Client, Adresse, Code Produit, Produit, Qté, Montant HT, Taxe, Montant TTC)'
    : 'ACHATS (Num.CMD, Date, Fournisseur, Code Produit, Produit, QTY, Montant HT, Taxe, Montant TTC)';

  const sampleText = JSON.stringify(sampleRows.slice(0, 15), null, 0);
  const prompt = `Tu es un assistant qui vérifie la cohérence de données importées dans un tableau BI.

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

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'HTTP-Referer': req.headers.origin || 'https://bi-dashboard.vercel.app',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({
        ok: false,
        message: `OpenRouter error: ${response.status} ${errText.slice(0, 200)}`,
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || 'Aucune réponse.';
    return res.status(200).json({ ok: true, message: content });
  } catch (err) {
    console.error('validate-import error', err);
    return res.status(500).json({
      ok: false,
      message: err.message || 'Validation request failed',
    });
  }
}
