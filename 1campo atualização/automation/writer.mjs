// Etapa 2 e 3 — Redação estruturada + revisão editorial.
export const CATEGORIES = ['Seleção Brasileira', 'Clubes Serie A', 'Clubes Serie B', 'Jogadores', 'Equipe Técnica', 'Eventos'];

export function parseJson(raw) {
  const clean = String(raw || '').replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try { return JSON.parse(clean); } catch { /* tenta extrair */ }
  const a = clean.indexOf('{'); const b = clean.lastIndexOf('}');
  if (a >= 0 && b > a) { try { return JSON.parse(clean.slice(a, b + 1)); } catch { /* */ } }
  return null;
}

export async function callJson(ai, model, prompt, temperature = 0.4, tries = 2) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await ai.models.generateContent({
        model, contents: prompt, config: { responseMimeType: 'application/json', temperature },
      });
      const obj = parseJson(res.text);
      if (obj) return obj;
    } catch (e) {
      console.log(`[campobr-bot] Gemini (tentativa ${i}) falhou: ${e?.message || e}`);
    }
  }
  return null;
}

const str = (v) => String(v ?? '').trim();
const arr = (v) => (Array.isArray(v) ? v : []);

/** Normaliza/valida o formato retornado pelo modelo. */
export function normalizeDraft(o) {
  if (!o || typeof o !== 'object') return null;
  const img = (x) => ({
    prompt: str(x?.imagePrompt || x?.prompt), alt: str(x?.imageAlt || x?.alt),
    caption: str(x?.imageCaption || x?.caption), search: str(x?.imageSearch || x?.search),
  });
  const draft = {
    title: str(o.title),
    summary: str(o.summary),
    category: str(o.category),
    intro: str(o.intro),
    keyTakeaways: arr(o.keyTakeaways).map(str).filter(Boolean),
    sections: arr(o.sections).map((s) => ({ heading: str(s?.heading), body: str(s?.body), image: img(s) })).filter((s) => s.heading && s.body),
    faq: arr(o.faq).map((f) => ({ question: str(f?.question), answer: str(f?.answer) })).filter((f) => f.question && f.answer),
    cover: img(o.cover || {}),
    tags: arr(o.tags).map(str).filter(Boolean).slice(0, 6),
    unverified: arr(o.unverified).map(str).filter(Boolean),
    issues: arr(o.issues).map(str).filter(Boolean),
  };
  return draft.title && draft.intro && draft.sections.length ? draft : null;
}

const SCHEMA = `{
  "title": "20 a 110 caracteres, específico e original (não copie o título da fonte)",
  "summary": "40 a 180 caracteres, descreve o valor da matéria para o leitor",
  "category": "UMA entre: ${CATEGORIES.join(' | ')}",
  "intro": "lide em 60 a 100 palavras: o que aconteceu, com quem, quando e por que importa",
  "keyTakeaways": ["3 a 4 pontos objetivos, cada um com um fato ou implicação"],
  "sections": [ { "heading": "subtítulo ESPECÍFICO (máx. 70 caracteres, nada de 'Contexto' genérico)",
                  "body": "130 a 220 palavras em parágrafos (pode ter uma lista com '- ')",
                  "imagePrompt": "descrição em INGLÊS de uma cena visual que ilustre ESTE trecho (ambiente, ação, clima), sem pessoas reconhecíveis, sem textos e sem escudos",
                  "imageAlt": "texto alternativo em português descrevendo a cena",
                  "imageCaption": "legenda curta em português ligando a imagem ao assunto do trecho",
                  "imageSearch": "2 a 4 palavras em inglês para buscar uma foto equivalente" } ],
  "faq": [ { "question": "dúvida real do leitor", "answer": "resposta de 30 a 70 palavras baseada nos fatos" } ],
  "cover": { "imagePrompt": "...", "imageAlt": "...", "imageCaption": "...", "imageSearch": "..." },
  "tags": ["3 a 6 palavras-chave"],
  "unverified": ["informações do tema que ainda NÃO estão confirmadas nas fontes (pode ser vazio)"]
}`;

export async function writeDraft({ ai, model, item, factsBlock, minWords }) {
  const prompt = `Você é redator-chefe do portal CampoBR (futebol brasileiro). Escreva uma matéria de ALTO VALOR para o leitor, original e útil, usando EXCLUSIVAMENTE os FATOS abaixo.

PADRÃO EDITORIAL
- Entregue algo que o leitor não obtém só lendo a manchete: explique o que o fato significa, o que muda para clube/jogador/torcedor, o que ainda está em aberto e o que observar a seguir. Toda análise deve decorrer dos fatos; deixe claro quando for leitura/avaliação ("na leitura do CampoBR") e nunca crie novos fatos.
- NUNCA invente placares, números, datas, nomes, declarações, lesões, valores ou estatísticas que não estejam nos FATOS. Se faltar informação, diga que ainda não foi confirmada e liste em "unverified".
- Não copie frases da fonte; reescreva. Citação direta só até 12 palavras, entre aspas.
- Português do Brasil, tom jornalístico claro. Sem emojis, sem clichês vazios ("jogo emocionante", "não há dúvidas", "é importante ressaltar"), sem repetir ideias entre seções, sem links, sem listar fontes.
- Mínimo de ${minWords} palavras no total; 4 a 5 seções; 3 perguntas no FAQ.
- As imagens devem ilustrar o conteúdo específico de cada seção.

FATOS
Fonte principal: ${item.source} — ${item.title}
Publicado em: ${item.publishedAt.toISOString()}
${factsBlock}

Responda SOMENTE com JSON neste formato:
${SCHEMA}`;
  return normalizeDraft(await callJson(ai, model, prompt, 0.5));
}

/** Revisão: remove afirmações sem respaldo, corta enrolação e melhora clareza, preservando o formato. */
export async function reviewDraft({ ai, model, draft, factsBlock }) {
  const prompt = `Você é editor-executivo do CampoBR. Revise o rascunho (JSON) comparando CADA afirmação com os FATOS.
Faça: (1) remova ou suavize qualquer afirmação, número, nome ou data que não esteja nos FATOS; (2) elimine repetição e frases genéricas; (3) garanta que cada seção traga informação nova; (4) mantenha o tamanho (não encurte abaixo do mínimo) e o mesmo formato JSON, incluindo imagePrompt/imageAlt/imageCaption/imageSearch coerentes com o texto revisado; (5) em "issues" liste, em frases curtas, o que você corrigiu.

FATOS
${factsBlock}

RASCUNHO
${JSON.stringify(draft)}

Responda SOMENTE com o JSON revisado (mesmo formato do rascunho, mais "issues").`;
  const revised = normalizeDraft(await callJson(ai, model, prompt, 0.2));
  return revised || draft;
}

/** Monta o Markdown final. imagesByKey: { cover?, s0?, s1? ... } → { url, alt, caption } */
export function assembleMarkdown(draft, imagesBySection = {}) {
  const parts = [draft.intro, '', '## Em resumo', draft.keyTakeaways.map((k) => `- ${k}`).join('\n'), ''];
  draft.sections.forEach((s, i) => {
    parts.push(`## ${s.heading}`, '', s.body, '');
    const im = imagesBySection[`s${i}`];
    if (im?.url) {
      parts.push(`![${im.alt.replace(/[\[\]]/g, '')}](${im.url})`);
      if (im.caption) parts.push(`*${im.caption.replace(/\*/g, '')}*`);
      parts.push('');
    }
  });
  if (draft.faq.length) {
    parts.push('## Perguntas frequentes', '');
    for (const f of draft.faq) parts.push(`**${f.question}**`, '', f.answer, '');
  }
  return parts.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Texto "puro" (sem imagens) para métricas e verificação. */
export function plainText(draft) {
  return [draft.title, draft.summary, draft.intro, ...draft.keyTakeaways,
    ...draft.sections.flatMap((s) => [s.heading, s.body]),
    ...draft.faq.flatMap((f) => [f.question, f.answer])].join('\n');
}
