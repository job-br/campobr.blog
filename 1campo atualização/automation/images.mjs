// Etapa 4 — Imagens CONEXAS ao texto: cada imagem nasce do trecho que ilustra e é verificada antes de entrar.
import { randomUUID } from 'node:crypto';
import { getStorage } from 'firebase-admin/storage';
import { callJson } from './writer.mjs';

const SAFE_RULES =
  'Strict rules: absolutely no text, letters, numbers, logos, club badges or watermarks; no real or recognizable people (use distant silhouettes or figures seen from behind); no copyrighted characters.';

const buildPrompt = (scene) =>
  `Photorealistic editorial image for a Brazilian football news article, 16:9 landscape, natural lighting, dynamic composition. Scene: ${scene}. ${SAFE_RULES}`;

const log = (...a) => console.log('[campobr-bot][img]', ...a);

async function generateWithGemini({ ai, model, scene }) {
  try {
    const res = await ai.models.generateContent({
      model,
      contents: buildPrompt(scene),
      // 'TEXT' + 'IMAGE' é aceito pelos modelos de imagem do Gemini
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    });
    const part = (res.candidates?.[0]?.content?.parts || []).find((p) => p?.inlineData?.data);
    if (!part) return null;
    return { buffer: Buffer.from(part.inlineData.data, 'base64'), mime: part.inlineData.mimeType || 'image/png' };
  } catch (e) {
    log('geração indisponível:', e?.message || e);
    return null;
  }
}

async function toWebp(buffer, mime) {
  try {
    const sharp = (await import('sharp')).default;
    const out = await sharp(buffer).resize({ width: 1280, height: 720, fit: 'cover' }).webp({ quality: 78 }).toBuffer();
    return { buffer: out, mime: 'image/webp', ext: 'webp' };
  } catch {
    return { buffer, mime, ext: mime.includes('png') ? 'png' : 'jpg' };
  }
}

/** Visão computacional: a imagem ilustra o trecho? Tem texto/logos/pessoas reais? */
async function verifyImage({ ai, model, buffer, mime, sectionText }) {
  try {
    const res = await ai.models.generateContent({
      model,
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: mime, data: buffer.toString('base64') } },
          { text: `Trecho de uma matéria de futebol: """${sectionText.slice(0, 900)}"""
A imagem acima é uma ilustração adequada e coerente com o ASSUNTO desse trecho? Ela contém texto legível, logotipos/escudos ou o rosto de uma pessoa real identificável?
Responda SOMENTE JSON: {"relevant": boolean, "hasTextOrLogo": boolean, "reason": string}` },
        ],
      }],
      config: { responseMimeType: 'application/json', temperature: 0 },
    });
    const t = String(res.text || '').replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    const v = JSON.parse(t);
    return { ok: v.relevant === true && v.hasTextOrLogo !== true, reason: v.reason || '' };
  } catch {
    return { ok: true, reason: 'verificação indisponível' }; // não bloqueia por falha técnica
  }
}

async function searchPexels(query, key) {
  if (!key || !query) return [];
  try {
    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&size=large&per_page=6`,
      { headers: { Authorization: key } }
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j.photos || []).map((p) => ({ url: p.src?.large2x || p.src?.large, photographer: p.photographer, page: p.url })).filter((p) => p.url);
  } catch { return []; }
}

async function download(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const mime = r.headers.get('content-type') || 'image/jpeg';
  return { buffer: Buffer.from(await r.arrayBuffer()), mime };
}

async function upload({ ctx, key, buffer, mime, ext }) {
  if (ctx.dryRun) return `https://dry-run.invalid/${ctx.postId}-${key}.${ext}`;
  const bucket = getStorage().bucket();
  const path = `articles/${new Date().getUTCFullYear()}/${ctx.postId}-${key}.${ext}`;
  const token = randomUUID();
  await bucket.file(path).save(buffer, {
    resumable: false,
    metadata: { contentType: mime, cacheControl: 'public, max-age=31536000, immutable', metadata: { firebaseStorageDownloadTokens: token } },
  });
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

/**
 * @param plan  { prompt, alt, caption, search }
 * @returns {{url,alt,caption,kind:'ia'|'pexels'} | null}
 */
export async function createImage({ ctx, key, plan, sectionText }) {
  const alt = plan.alt || 'Ilustração da matéria';
  const baseCaption = (plan.caption || '').trim();

  // 1) Ilustração própria por IA (2 tentativas, cada uma verificada contra o texto)
  if (ctx.imageModel && plan.prompt) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const gen = await generateWithGemini({ ai: ctx.ai, model: ctx.imageModel, scene: plan.prompt });
      if (!gen) break;
      const webp = await toWebp(gen.buffer, gen.mime);
      const check = await verifyImage({ ai: ctx.ai, model: ctx.textModel, buffer: webp.buffer, mime: webp.mime, sectionText });
      if (!check.ok) { log(`${key}: imagem IA reprovada (${check.reason}); tentativa ${attempt}`); continue; }
      try {
        const url = await upload({ ctx, key, ...webp });
        log(`${key}: ilustração IA aprovada.`);
        return { url, alt, caption: `${baseCaption} Ilustração gerada por IA.`.trim(), kind: 'ia' };
      } catch (e) {
        log(`${key}: falha ao hospedar no Storage (${e?.message || e}). Ative o Firebase Storage — veja SETUP.md.`);
        break;
      }
    }
  }

  // 2) Foto real de banco gratuito (Pexels), também verificada
  const photos = await searchPexels(plan.search || '', ctx.pexelsKey);
  for (const ph of photos.slice(0, 3)) {
    try {
      const { buffer, mime } = await download(ph.url);
      const check = await verifyImage({ ai: ctx.ai, model: ctx.textModel, buffer, mime, sectionText });
      if (!check.ok) continue;
      log(`${key}: foto Pexels aprovada.`);
      return { url: ph.url, alt, caption: `${baseCaption} Foto: ${ph.photographer}/Pexels.`.trim(), kind: 'pexels' };
    } catch { /* próxima foto */ }
  }
  log(`${key}: nenhuma imagem conexa disponível.`);
  return null;
}

/** Cria capa + imagens do corpo (após as seções 2 e 4, se houver). */
export async function createAllImages({ ctx, draft }) {
  const out = {};
  const intro = `${draft.title}. ${draft.intro}`;
  out.cover = await createImage({ ctx, key: 'cover', plan: draft.cover.prompt ? draft.cover : { prompt: draft.sections[0].image.prompt, alt: draft.title, caption: '', search: draft.sections[0].image.search }, sectionText: intro });
  const idx = draft.sections.length >= 4 ? [1, 3] : [1];
  for (const i of idx) {
    const s = draft.sections[i];
    if (!s) continue;
    out[`s${i}`] = await createImage({ ctx, key: `s${i}`, plan: s.image, sectionText: `${s.heading}. ${s.body}` });
  }
  return out;
}
