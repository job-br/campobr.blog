#!/usr/bin/env node
/**
 * Robô editorial do CampoBR — roda no GitHub Actions (servidor), NUNCA no navegador.
 *
 * Fluxo por matéria:
 *   1. Pauta nova (RSS)  →  2. Pesquisa na web (fatos + fontes reais)  →  3. Redação estruturada
 *   →  4. Revisão editorial (corta o que não tem respaldo)  →  5. Controle de qualidade
 *   →  6. Imagens geradas a partir de cada seção e VERIFICADAS contra o texto  →  7. Publica (ou salva em `drafts`).
 *
 * Uso:  node run.mjs [--dry-run] [--category="Clubes Serie A"]
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import { loadFeed, fetchArticleFacts } from './feeds.mjs';
import { runQualityGate, jaccard } from './quality.mjs';
import { researchTopic } from './research.mjs';
import { writeDraft, reviewDraft, assembleMarkdown, CATEGORIES } from './writer.mjs';
import { createAllImages } from './images.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE_CATEGORY = (args.find((a) => a.startsWith('--category=')) || '').split('=')[1] || '';

const CFG = {
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  imageModel: process.env.GEMINI_IMAGE_MODEL ?? 'gemini-2.5-flash-image', // vazio ("") desliga a geração por IA
  pexelsKey: process.env.PEXELS_API_KEY || '',
  minWords: Number(process.env.MIN_WORDS || 650),
  postsPerRun: Number(process.env.POSTS_PER_RUN || 1),
  maxPerDay: Number(process.env.MAX_POSTS_PER_DAY || 4),
  maxAttempts: Number(process.env.MAX_ATTEMPTS || 4),
  fetchArticle: (process.env.FETCH_ARTICLE_TEXT || 'true') !== 'false',
  grounding: (process.env.USE_GROUNDING || 'true') !== 'false',
  requireImage: (process.env.REQUIRE_CONTEXT_IMAGE || 'true') !== 'false',
  mode: process.env.PUBLISH_MODE === 'draft' ? 'draft' : 'publish',
};

const FALLBACK_IMAGES = {
  'Seleção Brasileira': '/images/brazil_tactical_board_coach_1792750182531.webp',
  'Clubes Serie A': '/images/maracana_derby_stadium_action_1792750183212.webp',
  'Clubes Serie B': '/images/football_performance_training_1792750183558.webp',
  'Jogadores': '/images/brazilian_wonderkid_dribble_1792750181934.webp',
  'Equipe Técnica': '/images/brazil_tactical_board_coach_1792750182531.webp',
  'Eventos': '/images/copa_libertadores_glory_trophy_1792750184172.webp',
};

const log = (...a) => console.log('[campobr-bot]', ...a);
const fail = (msg) => { console.error('[campobr-bot] ERRO:', msg); process.exit(1); };
const brt = () => new Date(Date.now() - 3 * 3600 * 1000);
const brtDate = () => brt().toISOString().slice(0, 10);
const slugify = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

// ───────────── Firebase Admin ─────────────
let db = null;
{
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    if (!DRY_RUN) fail('Defina o segredo FIREBASE_SERVICE_ACCOUNT (JSON da conta de serviço). Veja SETUP.md.');
    log('Dry-run sem FIREBASE_SERVICE_ACCOUNT: sem checagem de duplicidade no banco.');
  } else {
    let sa;
    try { sa = JSON.parse(raw); } catch { fail('FIREBASE_SERVICE_ACCOUNT não é um JSON válido.'); }
    const web = JSON.parse(readFileSync(path.join(__dirname, '..', 'firebase-applet-config.json'), 'utf8'));
    if (!getApps().length) initializeApp({ credential: cert(sa), projectId: web.projectId, storageBucket: web.storageBucket });
    db = web.firestoreDatabaseId ? getFirestore(getApps()[0], web.firestoreDatabaseId) : getFirestore();
  }
}

// ───────────── Gemini ─────────────
if (!process.env.GEMINI_API_KEY) fail('Defina o segredo GEMINI_API_KEY.');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
if (!CFG.imageModel && !CFG.pexelsKey) {
  log('AVISO: sem GEMINI_IMAGE_MODEL e sem PEXELS_API_KEY — nenhuma imagem conexa poderá ser criada.');
}

// ───────────── Estado e pautas ─────────────
const sources = JSON.parse(readFileSync(path.join(__dirname, 'sources.json'), 'utf8'));
const stateRef = db ? db.doc('system_state/automation') : null;
const state = stateRef ? ((await stateRef.get()).data() || {}) : {};
const today = brtDate();
const publishedToday = state.date === today ? state.publishedToday || 0 : 0;
const processed = new Set(state.processedLinks || []);

if (publishedToday >= CFG.maxPerDay && !DRY_RUN) {
  log(`Limite diário atingido (${publishedToday}/${CFG.maxPerDay}). Nada a fazer.`);
  process.exit(0);
}

const existingTitles = [];
if (db) {
  const snap = await db.collection('posts').orderBy('createdAt', 'desc').limit(150).get();
  for (const d of snap.docs) {
    const p = d.data();
    existingTitles.push(p.title || '');
    for (const s of p.citedSources || []) if (s?.url) processed.add(s.url);
  }
}

const maxAgeMs = (sources.maxAgeHours || 48) * 3600 * 1000;
let candidates = [];
let feedsOk = 0;
for (const feed of sources.feeds.filter((f) => f.enabled !== false)) {
  try {
    const items = await loadFeed(feed);
    feedsOk++;
    log(`Feed "${feed.name}": ${items.length} itens.`);
    candidates.push(...items);
  } catch (e) {
    log(`Feed "${feed.name}" falhou: ${e?.message || e}`);
  }
}
if (feedsOk === 0) fail('Nenhum feed respondeu. Verifique as URLs em automation/sources.json.');

candidates = candidates
  .filter((i) => Date.now() - i.publishedAt.getTime() <= maxAgeMs)
  .filter((i) => !processed.has(i.link))
  .filter((i) => !existingTitles.some((t) => jaccard(i.title, t) >= 0.7))
  .sort((a, b) => b.publishedAt - a.publishedAt);

log(`${candidates.length} pauta(s) nova(s) elegível(is).`);
if (!candidates.length) { log('Sem pautas novas. Encerrando.'); process.exit(0); }

// ───────────── Produção ─────────────
let published = 0;
let attempts = 0;
const newProcessed = [];

for (const item of candidates) {
  if (published >= CFG.postsPerRun || attempts >= CFG.maxAttempts) break;
  if (publishedToday + published >= CFG.maxPerDay) break;
  attempts++;
  newProcessed.push(item.link);
  log(`\n▶ Pauta: ${item.title}`);

  // 1) Material de apoio: texto da fonte + pesquisa na web
  const pageFacts = CFG.fetchArticle ? await fetchArticleFacts(item.link) : '';
  if (`${item.title}${item.summary}${pageFacts}`.length < 280) { log('  → pouco material de apoio; pulando.'); continue; }
  const research = CFG.grounding
    ? await researchTopic({ ai, model: CFG.model, item, facts: pageFacts })
    : { dossier: '', sources: [] };
  log(`  pesquisa: ${research.dossier ? 'ok' : 'sem dossiê'}, ${research.sources.length} fonte(s) adicional(is).`);

  const factsBlock = `Resumo do feed: ${item.summary || '(sem resumo)'}
Texto de apoio da fonte principal: ${pageFacts || '(indisponível)'}
Dossiê de pesquisa (fatos confirmados na web):
${research.dossier || '(indisponível)'}`;
  const factsText = `${item.title}\n${factsBlock}`;

  // 2) Redação estruturada → 3) revisão editorial
  let draft = await writeDraft({ ai, model: CFG.model, item, factsBlock, minWords: CFG.minWords });
  if (!draft) { log('  → Gemini não gerou rascunho válido; pulando.'); continue; }
  draft = await reviewDraft({ ai, model: CFG.model, draft, factsBlock });
  if (draft.issues.length) log(`  revisão corrigiu: ${draft.issues.slice(0, 3).join(' | ')}`);

  // 4) Controle de qualidade do TEXTO (antes de gastar com imagens)
  const gate = runQualityGate({ draft, factsText, existingTitles, minWords: CFG.minWords });
  const category = CATEGORIES.includes(draft.category) ? draft.category : (FORCE_CATEGORY || item.category);
  const nowIso = new Date().toISOString();
  const hash = createHash('sha1').update(item.link).digest('hex').slice(0, 8);
  const id = `auto-${today.replace(/-/g, '')}-${hash}`;
  const slug = `${slugify(draft.title)}-${hash}`;
  let host = ''; try { host = new URL(item.link).hostname.replace(/^www\./, ''); } catch { /* */ }

  const citedSources = [
    { id: 'src-1', title: item.title, url: item.link, domain: host, claimSustained: 'Fato-base da matéria', accessedAt: nowIso, isVerified: false, sourceType: 'imprensa_esportiva' },
    ...research.sources.map((s, i) => ({ id: `src-${i + 2}`, title: s.title, url: s.url, domain: s.domain, claimSustained: 'Contexto e confirmação de fatos', accessedAt: nowIso, isVerified: false, sourceType: 'imprensa_esportiva' })),
  ];

  const base = {
    id, slug, title: draft.title, summary: draft.summary.slice(0, 200), category,
    contentType: 'noticia-contexto',
    authorName: 'Redação CampoBR', authorRole: 'Conteúdo produzido com apoio de IA a partir de fontes citadas', authorAvatar: '/logo-512x512.png',
    viewsCount: 0, likesCount: 0, featured: false,
    readTimeMinutes: Math.max(3, Math.round(gate.words / 200)),
    tags: draft.tags, publishedAt: nowIso, createdAt: nowIso, updatedAt: nowIso,
    automationDate: today, automationSlot: brt().getUTCHours() < 15 ? 'morning' : 'evening',
    reviewedBy: 'Revisão automática por IA e verificação de qualidade',
    editorialStatus: 'Gerado com IA a partir de fontes citadas',
    reviewNotes: draft.issues.length ? `Ajustes da revisão automática: ${draft.issues.slice(0, 4).join('; ')}` : undefined,
    citedSources, researchTimestamp: nowIso,
    unverifiedClaims: draft.unverified,
    faqItems: draft.faq,
  };
  Object.keys(base).forEach((k) => base[k] === undefined && delete base[k]);

  if (!gate.ok) {
    log(`  → REPROVADA no controle de qualidade: ${gate.reasons.join('; ')}`);
    if (db && !DRY_RUN) await db.collection('drafts').doc(id).set({ ...base, status: 'draft', content: assembleMarkdown(draft), coverImage: FALLBACK_IMAGES[category], gateReasons: gate.reasons });
    continue;
  }

  // 5) Imagens conexas (capa + corpo), verificadas contra o texto
  const images = await createAllImages({ ctx: { ai, textModel: CFG.model, imageModel: CFG.imageModel, pexelsKey: CFG.pexelsKey, postId: id, dryRun: DRY_RUN }, draft });
  const got = Object.values(images).filter(Boolean);
  log(`  imagens: ${got.length}/${Object.keys(images).length} (${[...new Set(got.map((g) => g.kind))].join(', ') || 'nenhuma'})`);

  if (CFG.requireImage && !images.cover) {
    const reason = 'sem imagem de capa conexa ao conteúdo (configure GEMINI_IMAGE_MODEL/Firebase Storage ou PEXELS_API_KEY)';
    log(`  → ${reason}; salvando como rascunho.`);
    if (db && !DRY_RUN) await db.collection('drafts').doc(id).set({ ...base, status: 'draft', content: assembleMarkdown(draft), coverImage: FALLBACK_IMAGES[category], gateReasons: [reason] });
    continue;
  }

  const post = {
    ...base,
    status: 'published',
    content: assembleMarkdown(draft, images),
    coverImage: images.cover?.url || FALLBACK_IMAGES[category] || FALLBACK_IMAGES['Clubes Serie A'],
    aiImageMention: got.some((g) => g.kind === 'ia') ? 'Ilustrações geradas por IA' : got.length ? 'Fotos de banco de imagens (Pexels)' : 'Imagem ilustrativa',
    imageGenerationSource: got.some((g) => g.kind === 'ia') ? 'gemini-ai' : 'curated-unique',
  };

  if (CFG.mode === 'draft') {
    log('  → modo rascunho (PUBLISH_MODE=draft).');
    if (db && !DRY_RUN) await db.collection('drafts').doc(id).set({ ...post, status: 'draft' });
    continue;
  }

  if (DRY_RUN) {
    log(`  → [dry-run] APROVADA (${gate.words} palavras, ${category}): ${post.title}`);
  } else {
    await db.collection('posts').doc(id).create(post);
    log(`  → PUBLICADA: ${post.title} (${gate.words} palavras, ${got.length} imagem(ns))`);
  }
  existingTitles.push(post.title);
  published++;
}

// ───────────── Estado, rebuild e encerramento ─────────────
if (db && !DRY_RUN) {
  await stateRef.set({
    date: today,
    publishedToday: publishedToday + published,
    lastRunAt: new Date().toISOString(),
    lastResult: { published, attempts },
    processedLinks: [...processed, ...newProcessed].slice(-400),
  }, { merge: true });
}

if (published > 0 && !DRY_RUN && process.env.NETLIFY_BUILD_HOOK) {
  try {
    const r = await fetch(process.env.NETLIFY_BUILD_HOOK, { method: 'POST' });
    log(`Rebuild do site solicitado (HTTP ${r.status}).`);
  } catch (e) { log(`Falha ao acionar rebuild: ${e?.message || e}`); }
}

log(`\nFim: ${published} publicada(s) em ${attempts} tentativa(s).`);
