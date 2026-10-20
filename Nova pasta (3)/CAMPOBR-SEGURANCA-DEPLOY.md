# CampoBR — aplicação das correções com segurança

Esta cópia contém mudanças no código, mas ainda não foi publicada em GitHub, Firebase ou Netlify. Faça backup do estado atual antes de aplicar. O modo padrão do robô grava **rascunhos**; publicação automática só é ativada optando explicitamente por `CAMPOBR_AUTO_PUBLISH=true`. O seed de notícias e comentários fictícios foi retirado; o app não preencherá um Firestore vazio com matérias inventadas. Antes de atualizar, publique/exports qualquer rascunho que exista apenas no localStorage antigo — o novo cache ignora essas chaves antigas, mas não as apaga do navegador.

## O que mudou

- O login administrativo passou a usar Google Sign-In do Firebase Authentication e exige o custom claim assinado `admin: true`; sessão em `localStorage`, e-mail hard-coded, hash e senha no JavaScript foram removidos. A chave Web do Firebase não é segredo; o script standalone antigo a reutilizava como credencial Gemini, por isso esse publicador foi desativado. Restrinja a chave Web no Google Cloud ao Firebase e aos domínios do blog, e use chave Gemini dedicada somente como secret de Actions.
- `firestore.rules` nega escritas administrativas sem claim; posts públicos só podem ser consultados com `status == published`. Comentários públicos têm limites de tamanho.
- CRUD do painel verifica claim e falha de forma explícita em caso de erro de rede/permissão. Visitantes já não executam a rotina autônoma.
- O workflow diário usa Firebase Admin SDK somente no servidor, lê `FIREBASE_SERVICE_ACCOUNT_JSON` e aplica lock transacional por data/slot. A função Netlify duplicada foi desativada com HTTP 410.
- Gemini Grounding precisa retornar pelo menos uma fonte; artigo precisa passar pelo revisor e por verificações mínimas de estrutura e extensão. Fontes são guardadas no post e mostradas aos leitores. Erro de geração não é substituído por texto esportivo genérico.
- A direção visual é extraída do artigo e das fontes; um seletor semântico escolhe capa temática persistente. Imagens Base64 não são gravadas nos documentos Firestore.
- O build gera apenas o site. O antigo empacotador de ZIP e o link público de código-fonte foram retirados. Metadados `NewsArticle`, canonical e tags sociais são ajustados por matéria no cliente.

## Ordem segura de implantação

1. **Revisar o diff e preservar backup.** Não use o código em produção sem testar o login e os fluxos de leitura. Considere revogar credenciais antigas de administrador que possam ter sido utilizadas fora do Firebase.
2. No Firebase Console, habilite o provedor Google em **Authentication → Sign-in method** e inclua `campobr.blog`, `www.campobr.blog` e o domínio de preview do Netlify em **Authorized domains**.
3. Crie uma conta Google autorizada e obtenha seu UID em **Authentication → Users**. Configure o claim administrativo por ambiente confiável. Exemplo local (não cole a chave no código nem em chat):

   ```bash
   export FIREBASE_SERVICE_ACCOUNT_JSON="$(cat /caminho/seguro/service-account.json)"
   ADMIN_UID="UID_DO_ADMIN" node scripts/grant-admin-claim.mjs
   unset FIREBASE_SERVICE_ACCOUNT_JSON
   ```

   A service account precisa de permissão para administrar usuários no Authentication. O usuário deve sair e entrar de novo após atribuição/remoção do claim. Conceda o claim só a contas controladas.
4. Crie o secret `FIREBASE_SERVICE_ACCOUNT_JSON` no ambiente **GitHub Actions** com o JSON da service account do mesmo projeto Firebase. Não use `VITE_` para nenhuma chave. Conceda à conta apenas os papéis necessários para Firestore (e Auth Admin só à identidade usada no passo de custom claim, idealmente separada).
5. Cadastre `GEMINI_API_KEY` como secret de GitHub Actions. Não coloque essa chave em `VITE_GEMINI_API_KEY`, HTML, GitHub public, Netlify client variables nem no bundle do navegador.
6. Por padrão, o workflow cria drafts (`CAMPOBR_AUTO_PUBLISH` ausente ou diferente de `true`). Depois de revisar vários artigos/fonte/imagem manualmente e medir qualidade, crie o secret de Actions `CAMPOBR_AUTO_PUBLISH` com valor literal `true` somente se aceitar que o sistema publique sem aprovação humana. Retirar o secret retorna ao modo de rascunho.
7. Teste primeiro o workflow manualmente em modo de rascunho; confira logs, documentos em `posts`, fontes, capas, lock em `automation_runs` e eventual publicação duplicada. O workflow foi escrito para Netlify cuidar do build/deploy do frontend via conexão GitHub; o job diário não precisa atualizar arquivos estáticos para publicar posts no Firestore.
8. Revise `firestore.rules` e publique as regras para o database não padrão declarado em `firebase.json` (`ai-studio-campobr-805d975a-e390-4d20-b491-3da2783ef944`). Com Firebase CLI autenticado no projeto correto, use `firebase deploy --only firestore:rules --project gen-lang-client-0871882677`. Confirme o target do projeto/database antes; caso contrário, as regras podem ser aplicadas ao banco errado. As regras bloqueiam corretamente o escritor antigo. Antes de ativá-las, confirme em uma exportação/consulta admin que cada matéria pública existente tem `status: "published"`; os documentos sem status não serão exibidos ao público e devem ser revisados e normalizados no Admin antes da regra entrar em vigor. Após publicação das regras, faça testes anônimos: leitura de publicados funciona, rascunhos e escritas administrativas são negados; login de claim admin pode gerenciar matérias.
9. No Netlify, conecte o mesmo repositório e mantenha comando `npm run build` e diretório `dist`; o `.npmrc` do projeto já aplica `legacy-peer-deps=true` ao passo de instalação do Netlify (o lockfile contém peers conflitantes Vite/esbuild). Não configure segredos Gemini ou service account como variáveis `VITE_*`.
10. Faça uma solicitação de indexação no Search Console só após verificar o site. O sitemap agora é conservador e inclui a home; como as matérias são rotas SPA baseadas em query string, metas inseridas via React podem não ser vistas por todo crawler/preview social. Para SEO completo por URL, a próxima etapa é prerender/SSR ou páginas estáticas por artigo.

## Limitações e próximos passos

O AI helper do painel que antes chamava Gemini diretamente no navegador foi desativado para não expor chave. A geração editorial automatizada permanece no GitHub Actions; um endpoint server-side protegido por Firebase Auth/App Check pode ser adicionado para geração manual segura no painel. O rich preview SEO em SPA é best-effort; recomenda-se SSR/prerender. Ainda é necessário testar as Security Rules com Firebase Emulator, ativar App Check e adicionar rate limiting/spam controls aos comentários antes de ampliar o tráfego.


## Google AdSense

O snippet do editor `pub-1323802134955418` foi colocado uma vez no `<head>` de `index.html`. O publisher ID também foi alinhado nos componentes/configuração administrativa e `public/ads.txt` contém `google.com, pub-1323802134955418, DIRECT, f08c47fec0942fa0`. O cache local legado do painel migra o publisher ID antigo ao carregar, preservando os IDs de blocos existentes.

Depois de publicar o novo build, confirme que `https://campobr.blog/ads.txt` retorna exatamente essa linha e que o código-fonte HTML da página inclui o script `adsbygoogle.js?client=ca-pub-1323802134955418` no `<head>`. Em seguida, no AdSense, marque “Adicionei o código”, clique em “Verificar” e, quando habilitado, envie o site para revisão. A captura ainda indica **“Precisa de revisão”**: a alteração do código não envia nem garante aprovação da revisão. A conta também precisa estar aprovada e os anúncios automáticos/unidades devem estar ativados no painel do AdSense para haver exibição; os IDs de unidades existentes foram preservados e não foram verificados contra sua conta.
