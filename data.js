const KV_URL   = process.env.KV_REST_API_URL;
const KV_TOKEN  = process.env.KV_REST_API_TOKEN;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

async function kvGet(key) {
  const res = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['GET', key])
  });
  const { result } = await res.json();
  if (!result) return null;
  try { return JSON.parse(result); } catch { return result; }
}

async function kvSet(key, value) {
  await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['SET', key, JSON.stringify(value)])
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const [cardapio, promo, especiais] = await Promise.all([
        kvGet('nordestina_cardapio'),
        kvGet('nordestina_promo'),
        kvGet('nordestina_especiais')
      ]);
      return res.status(200).json({ cardapio, promo, especiais });
    } catch {
      return res.status(500).json({ error: 'Erro ao carregar dados' });
    }
  }

  if (req.method === 'POST') {
    if (req.headers['authorization'] !== `Bearer ${ADMIN_SECRET}`) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    try {
      const { type, data } = req.body;
      if (!['cardapio', 'promo', 'especiais'].includes(type)) {
        return res.status(400).json({ error: 'Tipo inválido' });
      }
      await kvSet(`nordestina_${type}`, data);
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ error: 'Erro ao salvar' });
    }
  }

  return res.status(405).end();
};
