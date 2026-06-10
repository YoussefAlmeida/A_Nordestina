const KV_URL       = process.env.KV_REST_API_URL;
const KV_TOKEN     = process.env.KV_REST_API_TOKEN;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

// ── Limites de segurança ──
const MAX_PAYLOAD = 60 * 1024;           // 60 KB por gravação
const TIPOS_VALIDOS = ['cardapio', 'promo', 'especiais'];

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

// Comparação de senha sem vazar tempo de resposta (timing-safe)
function senhaValida(header) {
  if (!ADMIN_SECRET || typeof header !== 'string') return false;
  const recebido = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (recebido.length !== ADMIN_SECRET.length) return false;
  let diff = 0;
  for (let i = 0; i < ADMIN_SECRET.length; i++) {
    diff |= recebido.charCodeAt(i) ^ ADMIN_SECRET.charCodeAt(i);
  }
  return diff === 0;
}

// Sanitiza recursivamente: só permite strings curtas e números
function limpar(valor, profundidade = 0) {
  if (profundidade > 4) return null;
  if (typeof valor === 'string') return valor.slice(0, 300);
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
  if (Array.isArray(valor)) return valor.slice(0, 100).map(v => limpar(v, profundidade + 1));
  if (valor && typeof valor === 'object') {
    const limpo = {};
    for (const k of Object.keys(valor).slice(0, 30)) {
      limpo[k.slice(0, 50)] = limpar(valor[k], profundidade + 1);
    }
    return limpo;
  }
  return null;
}

module.exports = async function handler(req, res) {
  // O site e a API estão no mesmo domínio: não há necessidade de CORS aberto.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

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
    if (!senhaValida(req.headers['authorization'])) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    try {
      const { type, data } = req.body || {};

      // Usado pela tela de login só para confirmar a senha
      if (type === 'verify') return res.status(200).json({ ok: true });

      if (!TIPOS_VALIDOS.includes(type)) {
        return res.status(400).json({ error: 'Tipo inválido' });
      }
      if (JSON.stringify(data || '').length > MAX_PAYLOAD) {
        return res.status(413).json({ error: 'Dados grandes demais' });
      }
      await kvSet(`nordestina_${type}`, limpar(data));
      return res.status(200).json({ ok: true });
    } catch {
      return res.status(500).json({ error: 'Erro ao salvar' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).end();
};
