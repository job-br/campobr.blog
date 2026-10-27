# Otimizações de performance — CampoBR

## Build / bundle
- `scripts/package-build.py` removido; `npm run build` agora é só `vite build`. O script antigo embutia o ZIP do projeto (Base64) no JS e o publicava em `/download/`.
- `vite.config.ts`: chave `GEMINI_API_KEY` não é mais injetada no bundle; `target es2022`, sem sourcemap.
- Code-splitting (`React.lazy`): AdminPanel, PostDetailModal, LegalModal, Admin2FAModal, QuickPostModal, DownloadModal.
- `automationService` (e o SDK `@google/genai`) só carregam no navegador do admin.
- Removido botão público "Baixar Projeto" e o gatilho `?download=`.

## Imagens
- 7 JPG (6,1 MB) -> WebP 1280px (836 KB), em `public/images/`.
- Corrigido bug: caminhos `/src/assets/images/*.jpg` davam 404 em produção. Referências reescritas e redirects 301 para posts antigos.
- Removidos 4,7 MB de screenshots (`public/assets/aistudio`) que iam para produção.

## Firestore (custo e velocidade)
- Antes: `getDocs` da coleção inteira + `onSnapshot` da coleção inteira em todo visitante. Agora: 1 leitura com `limit(60)`.
- Cache de 5 min + stale-while-revalidate (pinta o cache da visita anterior imediatamente).
- Removidas escritas em segundo plano durante a leitura (sync de pendentes, dedupe com delete, enriquecimento de imagens).
- `onSnapshot` não é mais usado no site público.
- Robô de automação: só roda com admin logado, só com aba visível (antes: todo visitante, a cada 60 s).
- 1 contagem de view por matéria/sessão; `getLocalPosts` com cache em memória.
- Publicadores (Action/Netlify/standalone) leem só os 80 posts mais recentes.

## Carregamento
- CSS de fontes não bloqueante; removido script Google Identity (não usado) e `prerender` de speculation rules (prefetch mantido).
- Service Worker v2: cache-first de `/assets/*` e imagens, limite de entradas, host exato.
- Cache-Control longo para `/assets/*` e `/images/*`; HTML e `sw.js` sempre revalidados.

## Não alterado (fora do escopo de performance)
Regras do Firestore, login admin, conteúdo seed e SEO (SPA sem SSR) continuam como no relatório de auditoria.

---
# Rodada 2 — segurança, robô, monetização (ver SETUP.md)
- Firestore: escrita só pelo admin autenticado; visitantes só +1 em views/likes; comentários validados; coleções internas fechadas.
- Login admin via Firebase Auth (Google). Removidos senha em texto puro, sessão em localStorage e "2FA" falso.
- Robô único no servidor (`automation/`, Admin SDK, fontes RSS, controle de qualidade, drafts). Removidos 4 publicadores antigos e a função Netlify.
- Removidos: posts/comentários/engajamento fictícios, placar "ao vivo" estático, newsletter que não enviava nada, anúncios falsos, autores/endereço inventados.
- AdSense: slots reais via ambiente, rótulo "Publicidade", consentimento LGPD, anúncios não personalizados por padrão.
- SEO: páginas estáticas `/materia/<slug>`, `sitemap.xml` e `rss.xml` gerados no build (`tools/prerender.mjs`).
- Headers: HSTS, Permissions-Policy, COOP e CSP (report-only).

- Rodada 3: removidos todos os botões/modal de download do projeto (Header, menu mobile, barra lateral, Footer e aba do admin). Mantidos só backup de matérias, sitemap, RSS e ads.txt no painel admin.

- Rodada 4: robô em etapas (pesquisa com busca na web, redação estruturada, revisão editorial, controle de qualidade rígido); imagens geradas por seção e verificadas por visão computacional (Firebase Storage + fallback Pexels); imagens no corpo dos artigos; FAQ com JSON-LD nas páginas estáticas.
