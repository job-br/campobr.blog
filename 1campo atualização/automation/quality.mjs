// Controle de qualidade editorial: o robô só publica se TODAS as verificações passarem.
import { plainText } from './writer.mjs';

const STOP = new Set(['de','da','do','das','dos','a','o','as','os','e','em','no','na','nos','nas','para','por','com','um','uma','que','se','ao','aos','sobre','apos','após','contra']);

export function normalizeTitle(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
}

export function jaccard(a, b) {
  const A = new Set(normalizeTitle(a)); const B = new Set(normalizeTitle(b));
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

export function wordCount(md) {
  return String(md || '').replace(/[#*_>`\-\[\]()!]/g, ' ').split(/\s+/).filter(Boolean).length;
}

const numbersIn = (s) => (String(s).match(/\d+(?:[.,]\d+)*/g) || []).map((n) => n.replace(/[.,]/g, ''));

const GENERIC_HEADINGS = new Set(['contexto', 'introducao', 'introdução', 'conclusao', 'conclusão', 'analise', 'análise', 'resumo', 'consideracoes finais', 'considerações finais', 'o que muda', 'proximos passos', 'próximos passos']);
const FILLER = [
  'jogo emocionante', 'não há dúvidas', 'nao ha duvidas', 'é importante ressaltar', 'vale ressaltar que', 'sem sombra de dúvida',
  'em um mundo onde', 'no mundo do futebol', 'como um modelo de linguagem', 'lorem ipsum', '[inserir', 'todo:', 'em suma,', 'sem dúvida alguma',
];

/**
 * @returns {{ ok: boolean, reasons: string[], words: number }}
 */
export function runQualityGate({ draft, factsText, existingTitles, minWords }) {
  const reasons = [];
  const text = plainText(draft);
  const lower = text.toLowerCase();
  const words = wordCount(text);

  if (draft.title.length < 20 || draft.title.length > 120) reasons.push(`título com ${draft.title.length} caracteres (esperado 20–120)`);
  if (draft.summary.length < 40 || draft.summary.length > 220) reasons.push(`resumo com ${draft.summary.length} caracteres (esperado 40–220)`);
  if (words < minWords) reasons.push(`texto curto: ${words} palavras (mínimo ${minWords})`);
  if (draft.sections.length < 4) reasons.push(`apenas ${draft.sections.length} seções (mínimo 4)`);
  draft.sections.forEach((s, i) => {
    if (wordCount(s.body) < 100) reasons.push(`seção ${i + 1} curta (${wordCount(s.body)} palavras)`);
    if (GENERIC_HEADINGS.has(s.heading.toLowerCase())) reasons.push(`subtítulo genérico: "${s.heading}"`);
    if (s.heading.length > 90) reasons.push(`subtítulo longo demais na seção ${i + 1}`);
  });
  const heads = draft.sections.map((s) => s.heading.toLowerCase());
  if (new Set(heads).size !== heads.length) reasons.push('subtítulos repetidos');
  if (draft.keyTakeaways.length < 3) reasons.push('menos de 3 pontos em "Em resumo"');
  if (draft.faq.length < 2) reasons.push('menos de 2 perguntas frequentes');
  if (/https?:\/\/|www\./i.test(text)) reasons.push('links dentro do texto');
  const filler = FILLER.filter((f) => lower.includes(f));
  if (filler.length) reasons.push(`frases genéricas/placeholder: ${filler.slice(0, 3).join(' | ')}`);

  // Diversidade lexical e repetição de frases
  const tokens = lower.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  if (tokens.length && new Set(tokens).size / tokens.length < 0.3) reasons.push('vocabulário muito repetitivo');
  const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim().toLowerCase()).filter((s) => s.split(/\s+/).length > 8);
  if (new Set(sentences).size !== sentences.length) reasons.push('frases repetidas no texto');

  // Anti-alucinação: números precisam existir nos fatos (exceto ano e números de 1 dígito)
  const allowed = new Set(numbersIn(factsText));
  const year = String(new Date().getFullYear());
  const unsupported = [...new Set(numbersIn(text))].filter((n) => n.length >= 2 && !allowed.has(n) && n !== year && n !== String(Number(year) - 1));
  if (unsupported.length > 1) reasons.push(`números sem respaldo nas fontes: ${unsupported.slice(0, 5).join(', ')}`);

  for (const t of existingTitles) {
    if (jaccard(draft.title, t) >= 0.7) { reasons.push(`título muito parecido com matéria existente: "${t.slice(0, 60)}"`); break; }
  }
  return { ok: reasons.length === 0, reasons, words };
}
