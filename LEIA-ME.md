# A Nordestina — Atualização do site (visual + segurança + conversão)

## ⚠️ AÇÃO OBRIGATÓRIA ANTES DE PUBLICAR

A senha antiga do admin (`nordestina@2026!`) estava **escrita no código-fonte do site** —
qualquer pessoa podia vê-la e editar seu cardápio. Ela foi removida. Agora:

1. Entre na **Vercel → seu projeto → Settings → Environment Variables**
2. **Troque o valor de `ADMIN_SECRET` por uma senha NOVA e forte** (a antiga está comprometida)
3. Faça o redeploy

Para entrar no painel admin, digite essa nova senha na tela de login do site.
Ela é validada no servidor e nunca mais aparece no código.

## O que mudou

### Segurança
- Senha do admin removida do HTML; login validado pelo servidor (`type: "verify"`)
- Comparação de senha timing-safe na API
- Proteção contra XSS: todo dado dinâmico (cardápio, promo, especiais) é sanitizado
  antes de entrar na página (`escapeHtml`, `safeName`, `safePrice`)
- API: removido CORS aberto (`*`), limite de 60 KB por gravação, sanitização do payload
- `vercel.json`: headers de segurança (CSP, HSTS, X-Frame-Options, nosniff, etc.)

### Visual / Motion (identidade cordel preservada)
- **Corrigido bug**: as animações de scroll (`.reveal`) não funcionavam — agora os
  cards aparecem com fade + slide ao rolar
- Faixa letreiro (marquee) estilo feira entre o hero e os números
- Cards dos especiais: efeito de "levantar" + zoom suave na foto ao passar o mouse
- Itens do cardápio: deslizamento e botão `+` que gira ao hover
- Selo de preço do hero balança suavemente
- Acessibilidade: foco visível em todos os controles e respeito a
  `prefers-reduced-motion` (animações desligam para quem prefere)

### Conversão / Marketing
- **Badge "Aberto agora"** no hero (verde quando aberto Seg–Sáb 7h–20h, ajustável
  na função `openStatus()` do HTML)
- **Toast de confirmação** ("✓ item adicionado!") + pulso na barra de pedido —
  feedback imediato reduz abandono
- **Upsell automático**: se o pedido não tem doce, o modal sugere a tapioca doce
  mais barata do cardápio com botão "+ Adicionar" (aumenta o ticket médio)
- Letreiro reforça os produtos e o CTA "peça pelo WhatsApp" em loop

## Estrutura dos arquivos
```
index a nordestina.html   ← página (substitua a sua; renomeei só com _ no pacote)
api/data.js               ← API endurecida
vercel.json               ← rewrite + headers de segurança
```
Obs.: o `vercel.json` continua apontando para `index a nordestina.html` (com espaços).
Se quiser, renomeie o arquivo para `index.html` e remova o bloco `rewrites` —
fica mais limpo, mas funciona dos dois jeitos.
