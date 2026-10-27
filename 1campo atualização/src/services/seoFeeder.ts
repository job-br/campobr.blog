import { Post } from '../types';

export function generateSitemapXml(posts: Post[]): string {
  const baseUrl = 'https://campobr.blog';
  const now = new Date().toISOString().split('T')[0];

  const staticUrls = `  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/#noticias</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`;

  const postUrls = posts
    .map((post) => {
      const date = (post.publishedAt || post.createdAt).split('T')[0];
      return `  <url>
    <loc>${baseUrl}/#post-${post.id}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${postUrls}
</urlset>`;
}

export function generateRssXml(posts: Post[]): string {
  const baseUrl = 'https://campobr.blog';
  const now = new Date().toUTCString();

  const items = posts
    .slice(0, 30)
    .map((post) => {
      const pubDate = new Date(post.publishedAt || post.createdAt).toUTCString();
      const escapedTitle = post.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const escapedSummary = (post.summary || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      return `    <item>
      <title>${escapedTitle}</title>
      <link>${baseUrl}/#post-${post.id}</link>
      <guid isPermaLink="false">${post.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${post.category}</category>
      <description>${escapedSummary}</description>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CampoBR | O Seu Portal do Futebol Brasileiro</title>
    <link>${baseUrl}</link>
    <description>Últimas notícias, coberturas ao vivo, táticas e análises das Séries A e B e Seleção Brasileira</description>
    <language>pt-BR</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

export function downloadFile(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
