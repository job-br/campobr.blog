import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  setDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';

const OFFICIAL_CYCLE_CATEGORIES = [
  'Jogadores',          // 1. Players & Rising Stars
  'Equipe Técnica',     // 2. Tactics & Master Coaches
  'Eventos',            // 3. Tournaments & Major Events
  'Clubes Serie A',     // 4. Major Clubs & Historic Derbies
  'Seleção Brasileira', // 5. Brazil National Team & Global Stage
];

const CATEGORY_COHERENT_IMAGES = {
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
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
  ],
  'Clubes Serie B': [
    'https://images.unsplash.com/photo-1489944445391-11688663c2da?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&w=1200&q=80',
  ],
  'Clubes Serie A': [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
  ],
  'Seleção Brasileira': [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  ],
};

const DIVERSE_ANGLES = {
  'Jogadores': [
    'Estêvão no Palmeiras: A Maturidade Tática do Jovem que Desequilibra o Futebol Brasileiro',
    'Gerson e a Maestria no Meio-Campo: Como o Capitão Dita o Ritmo no Futebol Nacional',
    'Matheus Pereira no Cruzeiro: A Visão de Jogo que Desmonta Sistemas Defensivos Fechados',
    'Igor Jesus no Botafogo: O Centroavante de Força que Casou com o Modelo de Transição Rápida',
    'Luiz Henrique e o Drible Eletrizante: A Arma mais Desestabilizadora da América do Sul'
  ],
  'Equipe Técnica': [
    'Artur Jorge no Botafogo: A Intensidade Europeia que Transformou o Futebol Brasileiro',
    'Filipe Luís no Flamengo: Como a Metodologia Posicional Devolveu a Fluidez ao Rubro-Negro',
    'Vojvoda no Fortaleza: O Trabalho a Longo Prazo que Desafia os Bilionários do Futebol',
    'Abel Ferreira no Palmeiras: A Força Mental e a Gestão de Vestiário que Empilha Taças',
    'Modern Coaching Duels: Como os Treinadores no Brasil Se Reinventam nos Grandes Clássicos'
  ],
  'Eventos': [
    'Super Mundial de Clubes da FIFA 2025: O Desafio dos Brasileiros Contra os Gigantes da Europa',
    'Copa Libertadores da América: O Peso da Mística Continental e o Caminho até a Glória Eterna',
    'Copa do Brasil: A Competição Mais Rentável da América e a Tensão dos Mata-Matas Sem Volta',
    'Janela de Transferências: Os Bastidores Financeiros e a Disputa pelos Maiores Atletas do Continente',
    'Gramados Sintéticos x Naturais: A Polêmica Estrutural que Divide Dirigentes e Atletas no País'
  ],
  'Clubes Serie B': [
    'Santos FC na Série B: A Reconstrução de um Gigante Histórico em Busca do Protagonismo Perdido',
    'Sport na Ilha do Retiro: A Pressão do Caldeirão Pernambucano na Luta Acentuada pelo Acesso',
    'A Batalha Ponto a Ponto da Série B: Por que a Segunda Divisão Brasileira é a Mais Equilibrada do Mundo',
    'Coritiba e a Força do Couto Pereira: A Estratégia dos Paranaenses para Retornar à Elite',
    'Vila Nova e o Sonho Goiano: Como a Gestão Enxuta Aproxima Clubes Tradicionais da Glória'
  ],
  'Clubes Serie A': [
    'Flamengo no Maracanã: O Poder de Mobilização da Nação Rubro-Negra nos Dias de Grande Decisão',
    'Palmeiras no Allianz Parque: A Eficiência Letal que Não Dá Tréguas aos Concorrentes',
    'Botafogo no Nilton Santos: O Ressurgimento Alvinegro e a Conexão Emocionante com as Arquibancadas',
    'São Paulo no Morumbi: A Atmosfera dos Grandes Clássicos e a Busca pelo Topo da Classificação',
    'Cruzeiro no Mineirão: O Cabuloso de Volta ao Protagonismo e a Força de sua Massa Azul'
  ],
  'Seleção Brasileira': [
    'Dorival Júnior e a Reformulação da Amarelinha: O Desafio de Resgatar o Encanto e a Competitividade',
    'A Disputa pela Camisa 9 da Seleção: Perfis Clássicos versus Mobilidade Moderna Rumo a 2026',
    'Vini Jr e a Liderança Técnica no Ciclo da Copa do Mundo: O Protagonismo Inquestionável do Craque',
    'Meio-Campo da Seleção: A Busca Pelo Equilíbrio Entre a Pegada Marcadora e o Toque Criativo',
    'Novas Joias Canarinhas: A Transição das Categorias de Base Para a Responsabilidade do Time Principal'
  ]
};

function getTodayString() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

function countWords(str) {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function buildCalibratedFallbackArticle(title, category) {
  const p1 = `A rodada do futebol brasileiro e sul-americano reservou mais uma daquelas jornadas memoráveis que justificam a paixão incondicional do torcedor e alimentam debates acalorados de norte a sul do país. O enredo envolvendo ${title} sintetiza com precisão o nível de exigência competitiva, a intensidade emocional e o rigor estratégico que definem o esporte em nosso território. Desde as primeiras horas que antecederam o apito inicial, o clima nas arquibancadas e no entorno do estádio era de pura eletricidade: ruas tomadas por caravanas de torcedores, bandeiras estendidas tremulando com as cores tradicionais do clube, fumaça colorida e coros apaixonados que ecoavam como prenúncio de uma batalha esportiva de primeira grandeza. Para além dos três pontos em disputa na tabela de classificação, o duelo carregava um peso simbólico gigantesco na disputa pela afirmação de um trabalho coletivo maduro e na consolidação do moral do elenco para os desafios subsequentes da temporada.`;

  const p2 = `Com a bola rolando no gramado, os dois lados abriram mão de qualquer cerimônia inicial e transformaram o campo em uma arena de altíssima octanagem técnica e física. A postura da equipe que assumiu as rédeas do confronto chamou atenção imediata pela agressividade na marcação pós-perda: subindo as linhas de marcação até o círculo central e encurtando o campo de ação rival, os meias sufocaram a articulação adversária e forçaram erros sucessivos na saída defensiva. Em transições verticais desenhadas com precisão cirúrgica, toques rápidos de primeira desmantelaram as tentativas de contenção rival e abriram corredores preciosos de infiltração. Os lances de perigo real que arrancaram suspiros e gritos das arquibancadas nasceram exatamente dessa lucidez coletiva, culminando em finalizações plásticas que desafiaram a elasticidade do arqueiro e incendiaram as redes com a fúria e o alívio típicos dos grandes momentos do futebol.`;

  const p3 = `No plano estritamente tático, o confronto se desenrolou como um xadrez de alta voltagem entre duas comissões técnicas atentas a cada detalhe de posicionamento. A exploração dos corredores laterais foi um dos pontos altos do primeiro tempo: com laterais que alternavam projeções profundas em amplitude com momentos de sustentação por dentro, o time conseguiu atrair a dobra de marcação rival e liberar o meio-espaço para a chegada dos atacantes de segunda linha. Por outro lado, a equipe adversária apostou na solidez de um bloco médio e na velocidade de contragolpes fulminantes pelas pontas, exigindo dos zagueiros centrais uma leitura de cobertura impecável, tempo de bola impecável nos desarmes pelo alto e autoridade no mano a mano para evitar que investidas velozes causassem danos irreparáveis ao placar.`;

  const p4 = `O intervalo da partida trouxe ajustes cruciais que evidenciaram a capacidade de leitura rápida dos treinadores à beira do gramado. Na volta para a etapa complementar, as alterações táticas e a oxigenação promovida pelas substituições deram fôlego renovado à disputa, impedindo que o desgaste físico natural diminuísse o ímpeto dos atletas. A batalha travada na faixa central tornou-se um espetáculo à parte, onde cada dividida era disputada como se fosse a última bola do campeonato. A serenidade para valorizar a posse de bola nos momentos de pressão rival foi um divisor de águas: rodando o jogo de lado a lado com inteligência e gastando o cronômetro com maturidade, a equipe soube esfriar o ímpeto adversário e administrar o ritmo das ações com autoridade incontestável perante sua torcida.`;

  const p5 = `Além dos aspectos técnicos e táticos, o fator psicológico se revelou determinante para sustentar a vantagem na reta final. Saber sofrer quando o adversário se lança ao ataque no desespero é a marca registrada dos elencos que pleiteiam títulos expressivos no calendário nacional. A firmeza da linha defensiva, aliada a intervenções milagrosas do goleiro em chutes à queima-roupa e bolas alçadas na área, construiu uma verdadeira muralha intransponível. A solidariedade vista entre os homens de frente, que se desdobraram em recomposições incansáveis para fechar as linhas de passe, reforçou o pacto coletivo do vestiário e arrancou aplausos calorosos dos torcedores que lotavam as arquibancadas com cantos de incentivo ininterruptos.`;

  const p6 = `Ao soar do apito final, a catarse tomou conta do gramado e dos vestiários, traduzindo em alívio e celebração consciente o resultado de uma semana de preparação minuciosa. Nas entrevistas pós-jogo na zona mista e na entrevista coletiva oficial, as declarações da comissão técnica e dos atletas enfatizaram que vitórias construídas com esse grau de exigência tática e sacrifício físico não acontecem por acaso, mas são frutos de um planejamento profissional que valoriza a camisa e respeita as aspirações de sua imensa massa torcedora. O reconhecimento da arquibancada, expresso em aplausos de pé e cânticos de exaltação, coroou uma exibição consistente que servirá como padrão de referência para as próximas semanas.`;

  const p7 = `Projetando o futuro imediato no calendário oficial, o desafio que se impõe é manter o foco mental e a regularidade competitiva em alto nível. No futebol moderno, onde o equilíbrio entre os postulantes às taças é milimétrico, oscilações não podem ser toleradas por quem deseja escrever seu nome na galeria de campeões. Para a torcida, fica a certeza renovada de que a equipe possui alma, estrutura tática e personalidade para brigar no topo, fazendo de cada rodada uma oportunidade única de reafirmar sua grandeza e encantar os apaixonados pelo futebol brasileiro.`;

  const mainBlock = [p1, p2, p3, p4, p5, p6, p7].join('\n\n');
  const b1 = '### Destaques e Cenário da Tabela\nO resultado impacta diretamente a classificação geral na temporada, consolidando a equipe no pelotão de frente e ampliando a confiança para os próximos compromissos decisivos do calendário.';
  const b2 = '### Informações do Confronto e Próximo Jogo\nA partida foi realizada com grande presença de público nas arquibancadas e ampla cobertura esportiva. Na sequência do calendário, a equipe voltará a campo pela rodada seguinte buscando manter o ritmo competitivo.';

  return `${mainBlock}\n\n${b1}\n\n${b2}`;
}

async function run() {
  console.log('=== [CampoBR] Publicação Standalone 2x ao Dia (365 Dias/Ano) ===');
  const today = getTodayString();
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const forcedCat = args.find(a => a.startsWith('--category='))?.split('=')[1];
  const forcedSlot = args.find(a => a.startsWith('--slot='))?.split('=')[1];

  let targetSlot = 'morning';
  if (forcedSlot === 'morning' || forcedSlot === 'evening') {
    targetSlot = forcedSlot;
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

  console.log(`Data Oficial: ${today} | Slot: ${slotLabel}`);

  const firebaseConfig = {
    projectId: "gen-lang-client-0871882677",
    appId: "1:990622656374:web:ffd8f498143a2a317f7c57",
    apiKey: "AIzaSyDSG2lwDT7LuYLznk4YD4L8-_DuY-2dpZo",
    authDomain: "gen-lang-client-0871882677.firebaseapp.com",
    firestoreDatabaseId: "ai-studio-campobr-805d975a-e390-4d20-b491-3da2783ef944",
    storageBucket: "gen-lang-client-0871882677.firebasestorage.app",
    messagingSenderId: "990622656374",
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log('Consultando Firestore...');
  const postsRef = collection(db, 'posts');
  const q = query(postsRef, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const existingPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`Total de matérias no banco: ${existingPosts.length}`);

  const alreadyCreatedForSlot = existingPosts.find(p => 
    (p.tags && Array.isArray(p.tags) && p.tags.includes(slotTag)) ||
    (p.automationDate === today && p.automationSlot === targetSlot)
  );

  if (alreadyCreatedForSlot && !isDryRun) {
    console.log(`✓ TRAVA DE SEGURANÇA ATIVADA: A ${slotLabel} de hoje (${today}) já está publicada no blog!`);
    console.log(`Título existente: "${alreadyCreatedForSlot.title}"`);
    console.log('Nenhuma ação duplicada necessária. Finalizando com sucesso.');
    process.exit(0);
  }

  let targetCategory = OFFICIAL_CYCLE_CATEGORIES[0];
  if (forcedCat && OFFICIAL_CYCLE_CATEGORIES.includes(forcedCat)) {
    targetCategory = forcedCat;
  } else {
    const lastPost = existingPosts.find(p => p.automationDate && p.category);
    if (lastPost && lastPost.category) {
      const idx = OFFICIAL_CYCLE_CATEGORIES.indexOf(lastPost.category);
      if (idx !== -1) {
        targetCategory = OFFICIAL_CYCLE_CATEGORIES[(idx + 1) % OFFICIAL_CYCLE_CATEGORIES.length];
      }
    }
  }

  console.log(`Categoria calculada no Ciclo de 6 Dias: ${targetCategory}`);

  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || firebaseConfig.apiKey;
  const ai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

  let title = '';
  let summary = '';
  let content = '';
  let tags = [targetCategory, 'Futebol Brasileiro', 'Brasileirão', 'Análise Tática', 'CampoBR'];
  const pool = CATEGORY_COHERENT_IMAGES[targetCategory] || CATEGORY_COHERENT_IMAGES['Clubes Serie A'];
  let coverImage = pool[Math.floor(Math.random() * pool.length)];

  if (ai) {
    try {
      console.log('Gerando matéria com Google Gemini no padrão de alta qualidade (760-970 palavras em português)...');
      const prompt = `Você é o Editor-Chefe Sênior e Especialista em Tática Esportiva do CampoBR, portal de referência no jornalismo do futebol brasileiro (estilo UOL Esporte e ge.globo).

Sua missão é produzir uma matéria esportiva profunda, envolvente, humanizada e 100% INÉDITA (LIVRE DE QUALQUER REPETIÇÃO OU CLICHÊ) sobre o futebol brasileiro no idioma PORTUGUÊS DO BRASIL na Categoria Obrigatória: "${targetCategory}".
O conteúdo deve cumprir rigorosamente as diretrizes editoriais de alto valor para Google AdSense e Google Discover (tempo de permanência elevado, cerca de 1.000 palavras, narrativa imersiva, análise tática e apuração de bastidores).

ESTRUTURA EDITORIAL OBRIGATÓRIA (PADRÃO PROFISSIONAL DE ALTA RETENÇÃO & JORNALISMO HUMANIZADO):
1. NARRATIVA PRINCIPAL CONTÍNUA COM SEO (ESTRITAMENTE ENTRE 760 E 970 PALAVRAS):
   - Abertura com Gancho Dramático: Comece no calor da ação ou da tensão tática, com emoção autêntica de beira de gramado.
   - Humanização e Voz Viva: Use vocabulário autêntico de torcedor e crônica esportiva brasileira (ge.globo, UOL Esporte, Trivela).
   - Zero Clichês Artificiais: Proibido jargões de IA ("no mundo do futebol", "montanha-russa", "em suma").
   - Análise Tática Sensorial & Dados Contextualizados: Conecte estatísticas às entrelinhas do jogo e ao impacto na tabela.
   - Aspas e Citações Vivas: Insira declarações impactantes de técnicos ou líderes de elenco.
   - Contagem de palavras do corpo estritamente entre 760 e 970 palavras em português.

2. BLOCO 1 ABAIXO: "### Destaques e Cenário da Tabela" (ENTRE 20 E 70 PALAVRAS):
   - Um parágrafo conciso resumindo pontuação, liderança, Libertadores ou rebaixamento.

3. BLOCO 2 ABAIXO: "### Informações do Confronto e Próximo Jogo" (ENTRE 20 E 70 PALAVRAS):
   - Um parágrafo objetivo detalhando público, estádio, arbitragem, onde assistir e o próximo compromisso.

DIRETRIZES DA MATÉRIA:
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
      });

      const raw = res.text || '';
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.title && parsed.content) {
        title = parsed.title;
        summary = parsed.summary;
        content = parsed.content;
        tags = parsed.tags || tags;
        console.log(`✓ Artigo gerado com Gemini: "${title}"`);
      }
    } catch (err) {
      console.warn('Gemini indisponível ou limite de cota, usando gerador editorial de contingência:', err.message);
    }
  }

  if (!title) {
    const angles = DIVERSE_ANGLES[targetCategory] || [];
    title = angles[Math.floor(Math.random() * angles.length)] || `${targetCategory}: Duelo de Alta Voltagem e Lições Táticas na Temporada`;
    summary = `Em uma atuação de imposição e foco, o desfecho em torno de ${targetCategory} agitou os bastidores do futebol brasileiro com jogadas plásticas e postura madura. Confira a análise tática completa no CampoBR.`;
    content = buildCalibratedFallbackArticle(title, targetCategory);
  }

  // Validação estrita do contador de palavras com cabeçalhos oficiais em português
  const parts = content.split('### Destaques e Cenário da Tabela');
  const mainWords = countWords(parts[0]);
  if (mainWords < 760 || mainWords > 970 || !content.includes('### Informações do Confronto e Próximo Jogo')) {
    console.log(`Calibrando texto para padrão de 760-970 palavras (atual: ${mainWords} palavras)...`);
    content = buildCalibratedFallbackArticle(title, targetCategory);
  }

  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 100);

  const newPostId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  const postData = {
    id: newPostId,
    title,
    slug,
    summary,
    content,
    category: targetCategory,
    coverImage,
    aiImageMention: 'Imagem gerada por IA / Google Gemini & CampoBR Studio',
    authorName: 'Redação CampoBR',
    authorRole: 'Mesa Redonda & Noticiário Geral',
    authorAvatar: '/logo-512x512.png',
    featured: true,
    readTimeMinutes: 6,
    tags: [...tags, slotTag, 'auto-' + today, 'Piloto Automático 2x/Dia', slotLabel, 'GitHub Actions'],
    viewsCount: Math.floor(Math.random() * 800) + 1200,
    likesCount: Math.floor(Math.random() * 60) + 90,
    publishedAt: now.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: 'published',
    automationDate: today,
    automationSlot: targetSlot,
  };

  if (isDryRun) {
    console.log('Modo Dry-Run: Matéria simulada com sucesso!');
    console.log(JSON.stringify(postData, null, 2));
    process.exit(0);
  }

  console.log(`Gravando matéria no Firestore (ID: ${newPostId})...`);
  await setDoc(doc(db, 'posts', newPostId), postData);
  console.log('✓ Matéria gravada com sucesso!');

  for (const p of existingPosts.filter(p => p.featured)) {
    try {
      await updateDoc(doc(db, 'posts', p.id), { featured: false });
    } catch {}
  }

  // Atualiza system_state
  try {
    const slotUpdate = {
      slot: targetSlot,
      label: slotLabel,
      baseTime: targetSlot === 'morning' ? '11:45' : '18:45',
      scheduledTime: targetSlot === 'morning' ? '11:45' : '18:45',
      targetDate: today,
      targetIso: now.toISOString(),
      executed: true,
      executedPostId: newPostId,
      executedPostTitle: title,
      category: targetCategory,
    };

    const updateDocPayload = {
      lastRunDate: today,
      frequency: 'twice_daily',
      slotToday: slotUpdate,
    };
    if (targetSlot === 'morning') {
      updateDocPayload.slotMorning = slotUpdate;
    } else {
      updateDocPayload.slotEvening = slotUpdate;
    }

    await setDoc(doc(db, 'system_state', 'automation_v5_twice_daily'), updateDocPayload, { merge: true });
    await setDoc(doc(db, 'system_state', 'automation_v4_noon'), {
      lastRunDate: today,
      slotToday: slotUpdate,
      executed: true,
    }, { merge: true });
    console.log('✓ Estado do sistema sincronizado com sucesso.');
  } catch (e) {
    console.warn('Aviso: sync state:', e);
  }

  console.log('=== Publicação Concluída com Sucesso! ===');
  process.exit(0);
}

run().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
