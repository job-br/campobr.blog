/**
 * CampoBR - Robô Autônomo Diário (Executado via GitHub Actions / Cloud Cron)
 * 
 * Executa todos os dias às 12:00 BRT (15:00 UTC).
 * 1. Verifica no Firestore se a matéria de hoje já foi gerada (idempotência atômica).
 * 2. Determina a categoria do dia no ciclo oficial de 6 dias (Jogadores -> Equipe Técnica -> Eventos -> Série B -> Série A -> Seleção).
 * 3. Aciona o Google Gemini para redigir o artigo completo e gerar imagem temática coerente.
 * 4. Salva a nova matéria no Firestore com 'featured: true' (Destaque Principal).
 * 5. Desmarca destaques anteriores para manter apenas a matéria mais recente no topo.
 */

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

let activeRunRef: any = null;
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';
import { 
  analyzeEditorialHistory, 
  buildEditorialPromptContext, 
  calculateTitleSimilarity,
  DIVERSE_CATEGORY_ANGLES 
} from '../src/services/editorialIntelligenceService';
import { 
  getUniqueThematicImageForPost 
} from '../src/services/aiVisualThemeEngine';

// 5 Categorias Oficiais do Ciclo do Robô Autônomo para o Público Norte-Americano
const OFFICIAL_CYCLE_CATEGORIES = [
  'Jogadores',          // 1. Players & Rising Stars
  'Equipe Técnica',     // 2. Tactics & Master Coaches
  'Eventos',            // 3. Tournaments & Major Events (Copa América, Club World Cup 2025, 2026 World Cup)
  'Clubes Serie A',     // 4. Major Clubs & Historic Derbies (Flamengo, Palmeiras, São Paulo, Corinthians)
  'Seleção Brasileira', // 5. Brazil National Team & Global Stage
] as const;

type FootballCategory = typeof OFFICIAL_CYCLE_CATEGORIES[number];

const CATEGORY_COHERENT_IMAGES: Record<FootballCategory, string[]> = {
  'Jogadores': [
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80',
  ],
  'Equipe Técnica': [
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
  ],
  'Eventos': [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
  ],
  'Clubes Serie A': [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80',
  ],
  'Seleção Brasileira': [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
  ],
};

const JOURNALIST_AUTHORS = [
  { name: 'Lucas Silveira', role: 'Analista Tático & Repórter Especial' },
  { name: 'Camila Duarte', role: 'Colunista de Bastidores & Seleção' },
  { name: 'Felipe Brandão', role: 'Jornalista Investigativo de Futebol' },
  { name: 'Matheus Nogueira', role: 'Estatístico & Editor de Coberturas' },
  { name: 'Mariana Siqueira', role: 'Repórter de Campo & Zona Mista' },
  { name: 'Redação CampoBR', role: 'Mesa Redonda & Noticiário Geral' }
];

function getTodayString(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

async function run() {
  console.log('=== [CampoBR] Iniciando Publicação Autônoma 2x ao Dia (365 Dias/Ano) ===');
  const today = getTodayString();
  
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const forcedCategoryArg = args.find(a => a.startsWith('--category='))?.split('=')[1] as FootballCategory | undefined;
  const forcedSlotArg = args.find(a => a.startsWith('--slot='))?.split('=')[1] as 'morning' | 'evening' | undefined;

  // Determina o slot alvo (Manhã ~11h45 ou Noite ~18h45)
  let targetSlot: 'morning' | 'evening' = 'morning';
  if (forcedSlotArg && (forcedSlotArg === 'morning' || forcedSlotArg === 'evening')) {
    targetSlot = forcedSlotArg;
  } else {
    try {
      const nowBrt = new Date();
      const brtHour = Number(new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: 'numeric', hour12: false }).format(nowBrt));
      targetSlot = brtHour < 15 ? 'morning' : 'evening';
    } catch {
      targetSlot = new Date().getHours() < 15 ? 'morning' : 'evening';
    }
  }

  const slotLabel = targetSlot === 'morning' ? 'Edição 1: Almoço / Manhã (11h45)' : 'Edição 2: Fim de Tarde / Noite (18h45)';
  const slotTag = `auto-slot-${targetSlot}-${today}`;

  console.log(`Data Alvo: ${today} | Slot Selecionado: ${slotLabel}`);

  // Inicialização server-side: chave de service account só via secret de runtime.
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<string, string>;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON ausente; publicador seguro indisponível.');
  const serviceAccount = JSON.parse(serviceAccountJson);
  const adminApp = getApps().find(app => app.name === 'campobr-publisher') || initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  }, 'campobr-publisher');
  const db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId);

  // 2. Consulta postagens existentes no Firestore
  console.log('Consultando matérias existentes no Firestore...');
  const snap = await db.collection('posts').orderBy('createdAt', 'desc').get();
  const existingPosts = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  console.log(`Total de matérias encontradas no banco: ${existingPosts.length}`);

  // 3. Trava de Idempotência Atômica Específica por Slot
  const alreadyCreatedForSlot = existingPosts.find(p => 
    (p.tags && Array.isArray(p.tags) && p.tags.includes(slotTag)) ||
    (p.automationDate === today && p.automationSlot === targetSlot)
  );

  if (alreadyCreatedForSlot && !isDryRun) {
    console.log(`✓ TRAVA DE SEGURANÇA ATIVADA: A ${slotLabel} de hoje (${today}) já está publicada no blog!`);
    console.log(`Título existente: "${alreadyCreatedForSlot.title}"`);
    console.log('Nenhuma matéria duplicada será gerada. Finalizando com sucesso.');
    process.exit(0);
  }
  if (!isDryRun) {
    const runRef = db.collection('automation_runs').doc(`${today}-${targetSlot}`);
    activeRunRef = runRef;
    const acquired = await db.runTransaction(async (tx) => {
      const current = await tx.get(runRef);
      const data = current.data();
      if (data?.status === 'completed') return false;
      if (data?.status === 'running' && data.startedAt?.toDate && Date.now() - data.startedAt.toDate().getTime() < 20 * 60 * 1000) return false;
      tx.set(runRef, { status: 'running', slot: targetSlot, runDate: today, startedAt: FieldValue.serverTimestamp(), attempt: FieldValue.increment(1) }, { merge: true });
      return true;
    });
    if (!acquired) {
      console.log(`Execução ${today}/${targetSlot} já está em andamento ou concluída; encerrando sem duplicar.`);
      process.exit(0);
    }
  }

  // 4. Determina a Categoria do Dia (Rotação dos 6 Dias)
  let targetCategory: FootballCategory = OFFICIAL_CYCLE_CATEGORIES[0];
  if (forcedCategoryArg && OFFICIAL_CYCLE_CATEGORIES.includes(forcedCategoryArg)) {
    targetCategory = forcedCategoryArg;
    console.log(`Categoria forçada via argumento: ${targetCategory}`);
  } else {
    // Descobre a última categoria utilizada no ciclo
    const lastAutomatedPost = existingPosts.find(p => p.automationDate && p.category);
    if (lastAutomatedPost && lastAutomatedPost.category) {
      const idx = OFFICIAL_CYCLE_CATEGORIES.indexOf(lastAutomatedPost.category as FootballCategory);
      if (idx !== -1) {
        targetCategory = OFFICIAL_CYCLE_CATEGORIES[(idx + 1) % OFFICIAL_CYCLE_CATEGORIES.length];
      }
    }
    console.log(`Categoria calculada no Ciclo de 6 Dias: ${targetCategory}`);
  }

  // 5. Analisa a Inteligência Editorial e Engajamento dos Leitores
  console.log('Executando Análise de Inteligência Editorial e Engajamento dos Leitores...');
  const intelligence = analyzeEditorialHistory(existingPosts);
  console.log(`✓ Inteligência Editorial ativa: ${intelligence.totalAnalyzedPosts} matérias analisadas, taxa de duplicatas: ${intelligence.duplicateRate}%, índice de diversidade: ${intelligence.diversityIndex}%.`);
  if (intelligence.topPerformingPosts.length > 0) {
    console.log(`✓ Top Matéria por Engajamento: "${intelligence.topPerformingPosts[0].title}" (${intelligence.topPerformingPosts[0].views} views, ${intelligence.topPerformingPosts[0].likes} likes).`);
  }

  const editorialContext = buildEditorialPromptContext(targetCategory, intelligence);

  // 6. Gera conteúdo com Google Gemini
  console.log(`Acionando Google Gemini para redigir matéria de alta qualidade em "${targetCategory}"...`);
  const geminiKey = process.env.GEMINI_API_KEY || '';
  if (!geminiKey) throw new Error('GEMINI_API_KEY ausente; publicação cancelada sem fallback inventado.');
  const ai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

  let title = '';
  let summary = '';
  let content = '';
  let tags: string[] = [targetCategory, 'Futebol Brasileiro', 'Brasileirão', 'Análise Tática', 'CampoBR'];
  let coverImage = CATEGORY_COHERENT_IMAGES[targetCategory][0];
  let sources: { title: string; url: string }[] = [];
  let reviewPassed = false;
  let imageVisualBrief = ''; 

  if (ai) {
    try {
      const prompt = `Você é o Editor-Chefe Sênior e Especialista em Tática Esportiva do CampoBR, portal de referência no jornalismo do futebol brasileiro (estilo UOL Esporte e ge.globo).

Sua missão é produzir uma matéria esportiva profunda, envolvente, humanizada e 100% INÉDITA (LIVRE DE QUALQUER REPETIÇÃO OU CLICHÊ) sobre o futebol brasileiro no idioma PORTUGUÊS DO BRASIL na Categoria Obrigatória: "${targetCategory}".
O conteúdo deve cumprir rigorosamente as diretrizes editoriais de alto valor para Google AdSense e Google Discover (tempo de permanência elevado, cerca de 1.000 palavras, narrativa imersiva, análise tática e apuração de bastidores).

${editorialContext}

ESTRUTURA EDITORIAL OBRIGATÓRIA (PADRÃO PROFISSIONAL DE ALTA RETENÇÃO & JORNALISMO HUMANIZADO):
1. NARRATIVA PRINCIPAL CONTÍNUA COM SEO (ESTRITAMENTE ENTRE 760 E 970 PALAVRAS):
   - Abertura com Gancho Dramático: Comece no calor da ação ou da tensão tática, com emoção autêntica de beira de gramado.
   - Humanização e Voz Viva: Use vocabulário autêntico de torcedor e crônica esportiva brasileira (ge.globo, UOL Esporte, Trivela).
   - Zero Clichês Artificiais: Proibido jargões de IA ("no mundo do futebol", "montanha-russa", "em suma").
   - Análise Tática Sensorial & Dados Contextualizados: Conecte estatísticas às entrelinhas do jogo e ao impacto na tabela.
   - Aspas e Citações: Só reproduza declaração textual localizada nas fontes Grounding; não invente aspas, placar, escalação, estatística ou data. Se a fonte não confirmar o detalhe, omita-o.
   - Contagem de palavras do corpo estritamente entre 760 e 970 palavras em português.

2. BLOCO 1 ABAIXO: "### Destaques e Cenário da Tabela" (ENTRE 20 E 70 PALAVRAS):
   - Um parágrafo conciso resumindo pontuação, liderança, Libertadores ou rebaixamento.

3. BLOCO 2 ABAIXO: "### Informações do Confronto e Próximo Jogo" (ENTRE 20 E 70 PALAVRAS):
   - Um parágrafo objetivo detalhando público, estádio, arbitragem, onde assistir e o próximo compromisso.

DIRETRIZES DA MATÉRIA:
- Base factual exclusiva nas páginas retornadas pelo Google Search Grounding; não invente fatos, nomes, datas, números, lesões, transferências, falas ou próximos jogos.
- Diferencie análise/opinião de notícia factual; omita qualquer detalhe não verificável nas fontes.
- Categoria Oficial: "${targetCategory}".
- Idioma: 100% PORTUGUÊS DO BRASIL.
- Tamanho Total: Aproximadamente 1.000 palavras (corpo 760-970 palavras + dois blocos finais de 20-70 palavras).

Responda ESTRITAMENTE em JSON válido (sem marcadores adicionais):
{
  "title": "Manchete magnética em português otimizada para Google Discover",
  "summary": "Lide jornalístico de 2 frases envolventes em português introduzindo a narrativa",
  "content": "Conteúdo markdown completo: o texto corrido de 760-970 palavras seguido de '### Destaques e Cenário da Tabela' e '### Informações do Confronto e Próximo Jogo' (20 a 70 palavras cada)",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"]
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const raw = res.text || '';
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const grounding = (res.candidates?.[0] as any)?.groundingMetadata;
      sources = (grounding?.groundingChunks || []).map((chunk: any) => chunk.web).filter((web: any) => web?.uri).map((web: any) => ({ title: String(web.title || web.uri), url: String(web.uri) }));
      sources = [...new Map(sources.map(source => [source.url, source])).values()];

      if (parsed.title && parsed.summary && parsed.content && sources.length > 0) {
        // Validação estrita anti-repetição
        const isDuplicate = intelligence.recentCoveredTitles.some(rec => 
          calculateTitleSimilarity(parsed.title, rec) > 0.55
        );
        if (!isDuplicate) {
          title = parsed.title;
        } else {
          console.warn(`Título sugerido pelo Gemini muito similar a matérias recentes. Aplicando ângulo inédito.`);
          const angles = DIVERSE_CATEGORY_ANGLES[targetCategory] || [];
          title = angles.find(a => !intelligence.recentCoveredTitles.some(rec => calculateTitleSimilarity(a, rec) > 0.45)) || `${parsed.title} - Nova Abordagem`;
        }

        summary = parsed.summary;
        content = parsed.content;
        tags = parsed.tags || tags;
        console.log(`✓ Rascunho inicial gerado com Gemini: "${title}"`);

        // ETAPA DE REVISÃO INTELIGENTE POR IA ANTES DE POSTAR
        try {
          console.log('🤖 Robô inteligente revisando toda a matéria antes de postar...');
          const reviewPrompt = `Você é o Editor-Executivo Chefe e Especialista de Revisão Editorial do CampoBR (portal referência no jornalismo do futebol brasileiro).
REVISAR, AUDITAR E APERFEIÇOAR ESTA MATÉRIA ANTES DA PUBLICAÇÃO DEFINITIVA:
Categoria: "${targetCategory}"
Título: "${title}"
Resumo: "${summary}"
Conteúdo Atual:
${content}

ITENS DE AUDITORIA:
1. HUMANIZAÇÃO: Eliminar qualquer clichê ou frase robótica de IA ("no mundo do futebol", "montanha-russa", "em suma").
2. CONFERÊNCIA DOS BLOCOS FINAIS OBRIGATÓRIOS: Deve conter "### Destaques e Cenário da Tabela" e "### Informações do Confronto e Próximo Jogo" (20 a 70 palavras cada).
3. EXTENSÃO: Corpo com 760 a 970 palavras além dos blocos finais.
4. Preserve cada fato, número, nome e citação; não acrescente informações não presentes no texto original ou nas fontes. Nunca converta suposição em notícia factual.
5. MANCHETE MAGNÉTICA: Alto CTR no Google Discover.

Responda ESTRITAMENTE em JSON válido:
{
  "title": "Manchete revisada",
  "summary": "Resumo revisado",
  "content": "Conteúdo integralmente revisado",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
  "reviewNotes": "Síntese dos ajustes realizados"
}`;

          const reviewRes = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: reviewPrompt,
          });

          const revRaw = reviewRes.text || '';
          const revParsed = JSON.parse(revRaw.replace(/```json/g, '').replace(/```/g, '').trim());
          if (revParsed.content) {
            title = revParsed.title || title;
            summary = revParsed.summary || summary;
            content = revParsed.content;
            if (Array.isArray(revParsed.tags) && revParsed.tags.length > 0) tags = revParsed.tags;
            reviewPassed = true;
            console.log(`✓ Revisão editorial concluída. Fontes Grounding: ${sources.length}. (${revParsed.reviewNotes || 'Texto polido'})`);
          }
        } catch (revErr) {
          console.warn('Revisão editorial automática manteve o rascunho com validação interna:', revErr);
        }
      }

      if (!sources.length) throw new Error('Google Grounding não retornou fontes utilizáveis; publicação bloqueada.');
      if (!reviewPassed) throw new Error('A revisão editorial não concluiu; publicação bloqueada.');
      const bodyWords = content.split('### Destaques e Cenário da Tabela')[0].trim().split(/\s+/).filter(Boolean).length;
      if (!title.trim() || !summary.trim() || bodyWords < 760 || bodyWords > 970 || !content.includes('### Destaques e Cenário da Tabela') || !content.includes('### Informações do Confronto e Próximo Jogo')) throw new Error('Artigo incompleto ou fora da extensão editorial; publicação bloqueada.');
      const narrativeSnippet = content.replace(/###[^\n]+/g, ' ').replace(/[*#`>|\[\]\(\)-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200);
      const briefResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Crie uma descrição visual para fotografia editorial desta matéria. Use somente elementos explicitamente presentes no texto e fontes. Não invente identidade de jogadores, clubes, placares, estádios ou uniformes. Se não houver sujeito/evento identificável, prefira cena conceitual neutra. Retorne duas frases concretas em inglês, indicando sujeito, ação e atmosfera.\nTítulo: ${title}\nResumo: ${summary}\nTexto: ${narrativeSnippet}\nFontes: ${sources.map(x => x.title + ' ' + x.url).slice(0, 5).join(' | ')}`
      });
      imageVisualBrief = (briefResponse.text || '').trim().replace(/[\r\n]+/g, ' ').slice(0, 500);
      if (!imageVisualBrief) throw new Error('Briefing visual vazio; publicação bloqueada.');

    } catch (err) {
      console.warn('Erro ao acionar Gemini, usando gerador procedural:', err);
    }
  }

  // A falha do modelo interrompe o job; não publicar narrativa factual genérica.
  if (!title || !summary || !content || !sources.length || !reviewPassed || !imageVisualBrief) {
    throw new Error('Grounding, revisão, estrutura ou briefing visual ausente; publicação cancelada.');
  }

  // Gera imagem temática ÚNICA com conceito visual coeso baseado em TODO O CONTEÚDO
  const alreadyUsedUrls = new Set(existingPosts.map(p => p.coverImage).filter(Boolean));
  const thematicVisual = getUniqueThematicImageForPost(
    title,
    summary,
    targetCategory,
    alreadyUsedUrls,
    false,
    `${content}\n\nVisual direction derived from the grounded article: ${imageVisualBrief}`
  );
  coverImage = thematicVisual.url;
  let aiImageMention = thematicVisual.mention;
  const thematicConcept = thematicVisual.thematicConcept;
  const visualMood = thematicVisual.visualMood;

  // Mantém apenas URL editorial durável. Não persiste Base64 de imagem no documento Firestore.
  // O brief específico e o conteúdo integral alimentam o seletor visual semântico acima.


  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 100);

  const author = JOURNALIST_AUTHORS[Math.floor(Math.random() * JOURNALIST_AUTHORS.length)];
  const newPostId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const autoPublish = process.env.CAMPOBR_AUTO_PUBLISH === 'true';
  const postData = {
    id: newPostId,
    title,
    slug,
    summary,
    content,
    category: targetCategory,
    coverImage,
    imageGenerationSource: 'curated-unique',
    reviewedBy: 'Revisão automatizada Gemini; fontes do Google Search Grounding',
    editorialStatus: 'Revisão automatizada concluída; conferir fatos antes da publicação',
    reviewNotes: `Rascunho Grounded revisado por IA, com ${sources.length} fontes listadas; conferir fatos e imagem temática antes de manter a publicação automática.`,
    aiImageMention,
    thematicConcept,
    visualMood,
    authorName: author.name,
    authorRole: author.role,
    authorAvatar: '/logo-512x512.png',
    featured: autoPublish, // Só destacar quando publicação automática estiver explicitamente habilitada
    readTimeMinutes: 6,
    tags: [...tags, slotTag, 'Piloto Automático 2x/Dia', slotLabel, 'auto-' + today, 'GitHub Actions'],
    sources,
    viewsCount: 0,
    likesCount: 0,
    publishedAt: nowIso,
    createdAt: nowIso,
    updatedAt: nowIso,
    status: autoPublish ? 'published' : 'draft',
    automationDate: today,
    automationSlot: targetSlot,
  };

  if (isDryRun) {
    console.log('Modo Dry-Run ativo. Post NÃO foi salvo no Firestore:');
    console.log(JSON.stringify(postData, null, 2));
    process.exit(0);
  }

  // 6. Grava a nova matéria no Firestore
  console.log(`Gravando matéria no Firestore com ID: ${newPostId}...`);
  await db.collection('posts').doc(newPostId).set(postData);
  console.log('✓ Matéria gravada com sucesso!');

  // 7. Desmarca destaques anteriores
  console.log('Ajustando status de Destaque Principal das matérias anteriores...');
  const previousFeatured = existingPosts.filter(p => p.featured && p.id !== newPostId);
  for (const prev of previousFeatured) {
    try {
      await db.collection('posts').doc(prev.id).update({ featured: false });
    } catch {
      // ignore
    }
  }
  console.log(`✓ ${previousFeatured.length} destaques anteriores foram desmarcados.`);

  // 8. Atualiza o estado da automação no Firestore (v5 2x ao dia e compatibilidade v4)
  try {
    const slotUpdate = {
      slot: targetSlot,
      label: slotLabel,
      baseTime: targetSlot === 'morning' ? '11:45' : '18:45',
      scheduledTime: targetSlot === 'morning' ? '11:45' : '18:45',
      targetDate: today,
      targetIso: nowIso,
      executed: true,
      executedPostId: newPostId,
      executedPostTitle: title,
      category: targetCategory,
    };

    const updateDocPayload: any = {
      lastRunDate: today,
      frequency: 'twice_daily',
      slotToday: slotUpdate,
    };
    if (targetSlot === 'morning') {
      updateDocPayload.slotMorning = slotUpdate;
    } else {
      updateDocPayload.slotEvening = slotUpdate;
    }

    await db.collection('system_state').doc('automation_v5_twice_daily').set(updateDocPayload, { merge: true });
    await db.collection('system_state').doc('automation_v4_noon').set({
      lastRunDate: today,
      slotToday: slotUpdate,
      executed: true,
    }, { merge: true });
    
    // Atualiza evolução de conhecimento
    await db.collection('system_state').doc('knowledge_evolution').set({
      lastUpdated: nowIso,
      lastCoveredTitle: title,
      lastCategory: targetCategory,
      totalAutonomousPosts: existingPosts.length + 1,
    }, { merge: true });

    console.log('✓ Estado da automação e cérebro de aprendizado atualizados no Firestore.');
  } catch (err) {
    console.warn('Aviso: Não foi possível atualizar system_state no Firestore:', err);
  }

  if (activeRunRef) await activeRunRef.set({ status: 'completed', completedAt: FieldValue.serverTimestamp(), postId: newPostId }, { merge: true });
  console.log(autoPublish ? '=== [CampoBR] Post publicado conforme opt-in ===' : '=== [CampoBR] Rascunho criado; publicação automática permanece desativada ===');
  process.exit(0);
}

run().catch(async err => {
  if (activeRunRef) { try { await activeRunRef.set({ status: 'failed', failedAt: FieldValue.serverTimestamp() }, { merge: true }); } catch {} }
  console.error('ERRO FATAL NA EXECUÇÃO:', err);
  process.exit(1);
});
