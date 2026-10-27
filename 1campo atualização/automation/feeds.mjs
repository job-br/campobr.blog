// Leitura de feeds RSS/Atom + extração de texto de apoio. Sem dependências além do fast-xml-parser.
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  processEntities: true,
});

const UA = 'Mozilla/5.0 (compatible; CampoBRBot/1.0; +https://campobr.blog)';

export async function fetchText(url, ms = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA, Accept: 'text/html,application/xml,application/rss+xml,*/*' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const txt = (v) => (v == null ? '' : typeof v === 'object' ? String(v['#text'] ?? '') : String(v));

export function stripHtml(s) {
  return String(s || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Retorna [{ title, link, summary, publishedAt: Date, source, category }] */
export async function loadFeed(feed) {
  const xml = await fetchText(feed.url);
  const doc = parser.parse(xml);
  const out = [];

  // RSS 2.0
  for (const it of asArray(doc?.rss?.channel?.item)) {
    out.push({
      title: stripHtml(txt(it.title)),
      link: txt(it.link).trim(),
      summary: stripHtml(txt(it.description) || txt(it['content:encoded'])),
      publishedAt: new Date(txt(it.pubDate) || Date.now()),
    });
  }
  // Atom
  for (const en of asArray(doc?.feed?.entry)) {
    const links = asArray(en.link);
    const alt = links.find((l) => l?.['@_rel'] === 'alternate') || links[0];
    out.push({
      title: stripHtml(txt(en.title)),
      link: String(alt?.['@_href'] || '').trim(),
      summary: stripHtml(txt(en.summary) || txt(en.content)),
      publishedAt: new Date(txt(en.updated) || txt(en.published) || Date.now()),
    });
  }

  return out
    .filter((i) => i.title && /^https?:\/\//.test(i.link) && !Number.isNaN(i.publishedAt.getTime()))
    .map((i) => ({ ...i, source: feed.name, category: feed.category }));
}

/** Texto de apoio (parágrafos) da página da matéria de origem — apenas como base de FATOS. */
export async function fetchArticleFacts(url, maxChars = 4500) {
  try {
    const html = await fetchText(url, 15000);
    const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripHtml(m[1]))
      .filter((p) => p.length > 70);
    return paragraphs.join('\n').slice(0, maxChars);
  } catch {
    return '';
  }
}
