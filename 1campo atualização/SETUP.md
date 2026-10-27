# CampoBR — Guia de configuração e operação

Este guia lista o que **só você** pode fazer (contas, chaves, console do Firebase). O código já está pronto para isso.

## 1. Segurança — faça PRIMEIRO (30 min)

1. **Rotacione tudo que já vazou**: a senha administrativa antiga (estava no código), a `GEMINI_API_KEY` antiga (ficava no bundle público) e qualquer conteúdo de `.env` que tenha ido em ZIP. Gere uma nova chave em https://aistudio.google.com/apikey.
2. **Publique as regras do Firestore** (sem isso o banco continua aberto):
   ```bash
   npm i -g firebase-tools && firebase login
   firebase use gen-lang-client-0871882677
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
   O `firebase.json` já aponta para o banco nomeado `ai-studio-campobr-…`.
   Só a conta Google **verificada** `canaldamenteadulta@gmail.com` escreve; troque o e-mail em `firestore.rules` **e** em `src/services/adminAuth.ts` se quiser outro.
3. **Firebase Authentication**: Console → Authentication → ative o provedor **Google** e, em *Settings → Authorized domains*, adicione `campobr.blog`.
4. Ative a **verificação em duas etapas** na conta Google do administrador (é o 2FA real).
5. Recomendado: **App Check** (Console → App Check → reCAPTCHA v3) para barrar bots nos comentários e contadores.
6. Confirme que `https://campobr.blog/download/campobr-codigo-fonte.zip` retorna 404 após o novo deploy.

## 2. Robô de publicação (automático, 2x/dia)

O robô roda no **GitHub Actions** (`.github/workflows/daily-publisher.yml`), nunca no navegador.

### Como ele produz cada matéria
1. **Pauta**: pega uma notícia nova dos feeds de `automation/sources.json` (ignora o que já foi usado).
2. **Pesquisa**: o Gemini pesquisa na web (Google Search) e monta um dossiê de fatos confirmados; as fontes reais consultadas entram na lista de fontes da matéria.
3. **Redação estruturada**: lide, "Em resumo", 4–5 seções com subtítulos específicos, FAQ com 3 perguntas, ≥ 650 palavras, sem inventar números, nomes ou placares.
4. **Revisão editorial**: uma segunda passada compara cada afirmação com os fatos e remove o que não tem respaldo.
5. **Controle de qualidade** (reprova → vai para `drafts`): tamanho, seções, subtítulos genéricos, frases-clichê, repetição, vocabulário, números sem respaldo, links no texto, título duplicado.
6. **Imagens conexas**: capa + 2 imagens no corpo, cada uma criada a partir do texto da seção. O Gemini **olha a imagem** e confirma que ela combina com o trecho e que não tem texto, logotipo ou rosto reconhecível. Se falhar, tenta uma foto do Pexels (também verificada). Sem imagem conexa de capa, a matéria vai para `drafts` (`REQUIRE_CONTEXT_IMAGE=false` desliga essa exigência).
7. **Publica** no Firestore, aciona o rebuild do site (páginas estáticas, sitemap, RSS) e registra o estado.

### Configuração (uma vez)
1. Segredos no GitHub (*Settings → Secrets and variables → Actions*):
   - `GEMINI_API_KEY` (obrigatório)
   - `FIREBASE_SERVICE_ACCOUNT` (obrigatório; Firebase → ⚙ Configurações do projeto → Contas de serviço → Gerar nova chave privada)
   - `NETLIFY_BUILD_HOOK` (recomendado; Netlify → Site → Build hooks)
   - `PEXELS_API_KEY` (recomendado; gratuita em https://www.pexels.com/api/ — é o plano B das imagens)
2. **Firebase Storage** (onde ficam as ilustrações geradas): Console → Storage → *Começar*. Depois: `firebase deploy --only storage`. Observação: o Google pode exigir o plano Blaze (pago por uso, com cota gratuita) para criar o bucket padrão.
3. **Modelo de imagem**: o workflow usa `gemini-2.5-flash-image`, que costuma exigir conta com faturamento ativo no Google AI Studio. Sem ele, deixe `GEMINI_IMAGE_MODEL` vazio no workflow e o robô usará só as fotos do Pexels.
4. **Confira os feeds** em `automation/sources.json` abrindo cada URL no navegador. Feeds que falham são ignorados; se **nenhum** responder, a execução falha (o GitHub avisa).
5. Teste: *Actions → CampoBR - Robô Editorial → Run workflow → dry_run = true*. Gera, revisa, valida e cria as imagens **sem gravar** no Firestore. Leia o log: ele mostra quantas palavras, quais imagens e por que algo foi reprovado.
6. `PUBLISH_MODE=draft` faz tudo virar rascunho (coleção `drafts`) para você aprovar manualmente — recomendado nas primeiras semanas.

> **Sobre qualidade e monetização**: nenhum filtro automático garante aprovação no AdSense nem ausência de erros. O que mais pesa é conteúdo útil, correto e com fontes. Por isso: acompanhe os rascunhos e as primeiras publicações, ajuste `automation/sources.json` para fontes que você pode usar, e corrija qualquer erro que for apontado pelos leitores.
>
> **Imagens**: as ilustrações são rotuladas como geradas por IA; as fotos do Pexels trazem crédito ao fotógrafo na legenda. O robô não gera imagens de pessoas reais, escudos nem logotipos.
>
> **Direitos autorais**: o robô reescreve com base em fatos e **cita as fontes**, mas isso não elimina o risco de reaproveitamento indevido. Considere `FETCH_ARTICLE_TEXT=false` (usa só título/resumo do feed e a pesquisa na web).

## 3. Monetização (AdSense)

1. Crie os blocos de anúncio no painel do AdSense e coloque os IDs numéricos nas variáveis `VITE_ADSENSE_SLOT_*` (Netlify → Site settings → Environment variables). **Sem ID válido, nenhum bloco manual é exibido** (os anúncios automáticos do script continuam).
2. Os anúncios falsos simulados e rótulos como "Parceria Oficial Google" foram removidos — eram infração de política.
3. Anúncios são **não personalizados** até o visitante aceitar o banner de cookies. Para tráfego da Europa/Reino Unido, ative também em AdSense → Privacidade e mensagens → *Mensagens de consentimento* (gratuito).
4. `public/ads.txt` já contém seu publisher ID.
5. Preencha `VITE_CONTACT_EMAIL` com um e-mail **real** do seu domínio (as páginas Contato/Privacidade usam ele).
6. Afiliados Shopee só aparecem para produtos cadastrados de verdade por você.
7. Antes de pedir revisão/aprovação, garanta ~20+ matérias úteis publicadas pelo robô e páginas Sobre/Contato/Privacidade/Termos verdadeiras.

## 4. Atualização rápida

- Leitores recebem as últimas 60 matérias com cache de 5 min + atualização em segundo plano.
- Após cada publicação, o robô aciona o Build Hook → o site gera `/materia/<slug>` estático, `sitemap.xml` e `rss.xml` (envie o sitemap no Google Search Console uma vez).
- Matérias com URL própria (`/materia/slug`) são indexáveis; antes eram só modais.

## 5. Headers de segurança

`netlify.toml`/`vercel.json` enviam HSTS, Permissions-Policy, COOP e **CSP em modo relatório** (não bloqueia). Navegue no site com o console (F12) aberto; se não aparecer aviso de CSP (anúncios, login, fontes), troque `Content-Security-Policy-Report-Only` por `Content-Security-Policy`.

## 6. Verificações antes de publicar

```bash
npm install && npm run lint && npm run build
cd automation && npm install && node run.mjs --dry-run   # precisa de GEMINI_API_KEY
```
(O ambiente em que este código foi ajustado não tinha rede nem `node_modules`; o build e o lint **não foram executados lá** — rode-os e corrija o que o compilador apontar.)

## 7. Limites conhecidos

- Comentários não têm moderação prévia; as regras bloqueiam links e limitam tamanho, mas spam de texto simples é possível. Ative App Check.
- Posts já existentes no Firestore (gerados antes) **não foram alterados**. Revise-os e apague os que tenham conteúdo fictício pelo Console do Firebase.
- O painel de AdSense dentro do admin não grava mais configuração (a fonte é o ambiente de build).
