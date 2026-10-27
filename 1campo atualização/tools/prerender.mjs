#!/usr/bin/env node
/**
 * Pós-build: lê as matérias publicadas (Firestore REST, leitura pública) e gera em dist/:
 *   - /materia/<slug>/index.html  → HTML com título, meta tags, canonical, JSON-LD e texto da matéria
 *                                   (crawlers e redes sociais enxergam o conteúdo sem executar JS)
 *   - /sitemap.xml e /rss.xml      → sempre atualizados a cada deploy
 * Nunca derruba o build: se algo falhar, mantém o site como está e sai com código 0.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const SITE = (process.env.VITE_SITE_URL || 'https://campobr.blog').replace(/\/$/, '');
const LIMIT = 200;

const log = (...a) => console.log('[prerender]', ...a);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── Firestore REST → objeto JS ──
function fromValue(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromValue);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, fromValue(x)]));
  return null;
}

async function fetchPosts() {
  const cfg = JSON.parse(readFileSync(path.join(ROOT, 'firebase-applet-config.json'), 'utf8'));
  const dbId = cfg.firestoreDatabaseId || '(default)';
  const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${encodeURIComponent(dbId)}/documents:runQuery?key=${cfg.apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'posts' }],
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
        limit: LIMIT,
      },
    }),
  });
  if (!res.ok) throw new Error(`Firestore HTTP ${res.status}`);
  const rows = await res.json();
  return rows
    .filter((r) => r.document)
    .map((r) => ({ id: r.document.name.split('/').pop(), ...Object.fromEntries(Object.entries(r.document.fields || {}).map(([k, v]) => [k, fromValue(v)])) }))
    .filter((p) => p.title && p.content && (!p.status || p.status === 'published'));
}

// ── Markdown simples → HTML seguro ──
function mdToHtml(md) {
  const out = [];
  let list = false;
  const flush = () => { if (list) { out.push('</ul>'); list = false; } };
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  for (const raw of String(md).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const im = line.match(/^!\[([^\]]*)\]\((https:\/\/[^)\s]+|\/(?!\/)[^)\s]+)\)$/);
    if (im) { flush(); out.push(`<figure><img src="${esc(im[2])}" alt="${esc(im[1])}" loading="lazy" width="1280" height="720" style="max-width:100%;height:auto" /></figure>`); continue; }
    if (/^\*[^*]+\*$/.test(line)) { flush(); out.push(`<figcaption>${esc(line.slice(1, -1))}</figcaption>`); continue; }
    if (/^###\s+/.test(line)) { flush(); out.push(`<h3>${inline(line.replace(/^###\s+/, ''))}</h3>`); }
    else if (/^##\s+/.test(line)) { flush(); out.push(`<h2>${inline(line.replace(/^##\s+/, ''))}</h2>`); }
    else if (/^[-*]\s+/.test(line)) { if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`); }
    else { flush(); out.push(`<p>${inline(line)}</p>`); }
  }
  flush();
  return out.join('\n');
}

const abs = (u) => (!u ? `${SITE}/logo-512x512.png` : /^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`);
const setTag = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`));

function renderPostPage(template, p) {
  const url = `${SITE}/materia/${p.slug}`;
  const title = `${p.title} | CampoBR`;
  const desc = (p.summary || p.content.replace(/[#*_>\-\[\]()]/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 160);
  const img = abs(p.coverImage);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: p.title.slice(0, 110),
    description: desc,
    image: [img],
    datePublished: p.publishedAt || p.createdAt,
    dateModified: p.updatedAt || p.publishedAt || p.createdAt,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: p.authorName || 'Redação CampoBR' },
    publisher: { '@type': 'Organization', name: 'CampoBR', logo: { '@type': 'ImageObject', url: `${SITE}/logo-512x512.png` } },
  };

  const faq = (p.faqItems || []).filter((f) => f && f.question && f.answer);
  const faqLd = faq.length ? {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  } : null;

  let html = template;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = setTag(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(desc)}" />`);
  html = setTag(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`);
  html = setTag(html, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${esc(img)}" />`);
  html = setTag(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${esc(url)}" />`);
  html = setTag(html, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="article" />`);
  html = setTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(url)}" />`);
  html = setTag(html, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${esc(img)}" />`);
  const ldBlocks = [ld, faqLd].filter(Boolean).map((o) => `    <script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
  html = html.replace('</head>', `${ldBlocks}\n  </head>`);

  const sources = (p.citedSources || [])
    .filter((s) => s && /^https?:\/\//.test(s.url || ''))
    .map((s) => `<li><a href="${esc(s.url)}" rel="noopener nofollow" target="_blank">${esc(s.title || s.domain || s.url)}</a></li>`)
    .join('');
  const body = `<article style="max-width:760px;margin:0 auto;padding:24px;font-family:system-ui,sans-serif;color:#e2e8f0">
<h1>${esc(p.title)}</h1><p>${esc(p.summary || '')}</p>${mdToHtml(p.content)}${sources ? `<h2>Fontes</h2><ul>${sources}</ul>` : ''}
</article>`;
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

const iso = (d) => { const t = new Date(d); return Number.isNaN(t.getTime()) ? new Date().toISOString() : t.toISOString(); };

function buildSitemap(posts) {
  const urls = [`<url><loc>${SITE}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`];
  for (const p of posts) {
    urls.push(`<url><loc>${SITE}/materia/${esc(p.slug)}</loc><lastmod>${iso(p.updatedAt || p.publishedAt || p.createdAt)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function buildRss(posts) {
  const items = posts.slice(0, 30).map((p) => `<item><title>${esc(p.title)}</title><link>${SITE}/materia/${esc(p.slug)}</link><guid isPermaLink="true">${SITE}/materia/${esc(p.slug)}</guid><pubDate>${new Date(iso(p.publishedAt || p.createdAt)).toUTCString()}</pubDate><description>${esc(p.summary || '')}</description></item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>CampoBR</title><link>${SITE}</link><description>Notícias e análises do futebol brasileiro</description><language>pt-BR</language>\n${items}\n</channel></rss>\n`;
}

try {
  if (!existsSync(path.join(DIST, 'index.html'))) { log('dist/index.html não existe; nada a fazer.'); process.exit(0); }
  const posts = (await fetchPosts()).filter((p) => /^[a-z0-9-]{3,120}$/.test(p.slug || ''));
  log(`${posts.length} matéria(s) publicada(s).`);
  if (!posts.length) process.exit(0);

  const template = readFileSync(path.join(DIST, 'index.html'), 'utf8');
  for (const p of posts) {
    const dir = path.join(DIST, 'materia', p.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'index.html'), renderPostPage(template, p));
  }
  writeFileSync(path.join(DIST, 'sitemap.xml'), buildSitemap(posts));
  writeFileSync(path.join(DIST, 'rss.xml'), buildRss(posts));
  log('Páginas, sitemap.xml e rss.xml gerados.');
} catch (e) {
  log('Aviso: não foi possível gerar páginas estáticas (o site continua funcionando):', e?.message || e);
}
process.exit(0);
