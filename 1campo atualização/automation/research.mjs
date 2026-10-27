// Etapa 1 — Pesquisa: levanta fatos confirmados na web (Google Search grounding) e as fontes reais usadas.
const REDIRECT_HOSTS = ['vertexaisearch.cloud.google.com'];

async function resolveRedirect(uri) {
  try {
    const host = new URL(uri).hostname;
    if (!REDIRECT_HOSTS.includes(host)) return uri;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(uri, { redirect: 'manual', signal: ctrl.signal });
    clearTimeout(t);
    const loc = res.headers.get('location');
    return loc && /^https?:\/\//.test(loc) ? loc : uri;
  } catch {
    return uri;
  }
}

/**
 * @returns {{ dossier: string, sources: {title:string,url:string,domain:string}[] }}
 */
export async function researchTopic({ ai, model, item, facts }) {
  const prompt = `Você é pesquisador de um portal de futebol brasileiro. Pesquise na web e liste, em tópicos curtos (no máximo 12), FATOS CONFIRMADOS sobre o tema: o que aconteceu, quando, quem, números oficiais, contexto relevante (histórico recente, classificação, contrato, calendário) e consequências já divulgadas.
Regras: inclua apenas o que encontrar em fontes confiáveis; não opine; não invente; se houver divergência entre fontes, registre a divergência; indique "NÃO CONFIRMADO" para rumores.

Tema: ${item.title}
Resumo do feed: ${item.summary || '(sem resumo)'}
Trecho da fonte original: ${(facts || '').slice(0, 1500)}`;

  try {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }], temperature: 0.2 },
    });
    const dossier = String(res.text || '').trim();
    const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const seen = new Set();
    const raw = [];
    for (const c of chunks) {
      const uri = c?.web?.uri;
      if (!uri) continue;
      const key = (c.web.title || uri).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      raw.push({ title: c.web.title || '', uri });
      if (raw.length >= 5) break;
    }
    const sources = [];
    for (const r of raw) {
      const url = await resolveRedirect(r.uri);
      let domain = '';
      try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch { /* */ }
      sources.push({ title: r.title || domain || 'Fonte', url, domain: domain || r.title });
    }
    return { dossier, sources };
  } catch (e) {
    console.log('[campobr-bot] Pesquisa com busca na web indisponível:', e?.message || e);
    return { dossier: '', sources: [] };
  }
}
