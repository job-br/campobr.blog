import fs from 'fs';
import path from 'path';
import { FOOTBALL_THEMATIC_LIBRARY } from './football-library-definition';
import { INITIAL_POSTS } from '../src/data/mockPosts';
import { 
  extractThematicVisualConcept, 
  generateImageApplicationForPost,
  getBaseImageUrl,
  normalizeText
} from '../src/services/aiVisualThemeEngine';

console.log('--- ETAPA 1: ATUALIZANDO THEMATIC_IMAGE_LIBRARY EM aiVisualThemeEngine.ts ---');

const enginePath = path.resolve(process.cwd(), 'src/services/aiVisualThemeEngine.ts');
let engineContent = fs.readFileSync(enginePath, 'utf-8');

// Formata o novo array de imagens de futebol puro
const libraryCode = `export const THEMATIC_IMAGE_LIBRARY: ThematicImageDescriptor[] = ${JSON.stringify(FOOTBALL_THEMATIC_LIBRARY, null, 2)};`;

// Substitui a declaração de THEMATIC_IMAGE_LIBRARY
const regexLibrary = /export const THEMATIC_IMAGE_LIBRARY: ThematicImageDescriptor\[\] = \[[\s\S]*?\n\];/;
if (!regexLibrary.test(engineContent)) {
  console.error('ERRO: Não encontrou THEMATIC_IMAGE_LIBRARY em aiVisualThemeEngine.ts');
  process.exit(1);
}

engineContent = engineContent.replace(regexLibrary, libraryCode);
fs.writeFileSync(enginePath, engineContent, 'utf-8');
console.log('✓ aiVisualThemeEngine.ts atualizado com 48 imagens fotográficas 100% futebol profissional!');

console.log('--- ETAPA 2: ATUALIZANDO CATEGORY_COHERENT_IMAGES EM googleContentAssistant.ts ---');
const assistantPath = path.resolve(process.cwd(), 'src/services/googleContentAssistant.ts');
let assistantContent = fs.readFileSync(assistantPath, 'utf-8');

const regexCoherent = /const CATEGORY_COHERENT_IMAGES: Record<FootballCategory, string\[\]> = \{[\s\S]*?\n\};/;
const newCoherentImages = `const CATEGORY_COHERENT_IMAGES: Record<FootballCategory, string[]> = {
  'Jogadores': [
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  ],
  'Equipe Técnica': [
    'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
  ],
  'Eventos': [
    'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80',
  ],
  'Clubes Serie B': [
    'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1568194157720-8bbe7114ebe8?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
  ],
  'Clubes Serie A': [
    'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80',
  ],
  'Seleção Brasileira': [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80',
  ],
};`;

if (!regexCoherent.test(assistantContent)) {
  console.error('ERRO: Não encontrou CATEGORY_COHERENT_IMAGES em googleContentAssistant.ts');
  process.exit(1);
}

assistantContent = assistantContent.replace(regexCoherent, newCoherentImages);
fs.writeFileSync(assistantPath, assistantContent, 'utf-8');
console.log('✓ googleContentAssistant.ts atualizado com fallbacks de futebol puro!');

console.log('--- ETAPA 3: ATUALIZANDO TODAS AS 36 MATÉRIAS DE mockPosts.ts ---');

// Mapeamento minucioso de cada uma das 36 matérias para a foto de futebol que melhor representa
// o pensamento conceitual do título e do corpo:
const POST_IMAGE_MAPPING: Record<string, { imageId: string; dominantMood: string; thought: string }> = {
  // SELEÇÃO BRASILEIRA (6 matérias)
  'art-sel-1': {
    // Vini Jr na Fonte Nova destruindo Uruguai
    imageId: 'sel-fonte-nova-vini-show',
    dominantMood: 'drible',
    thought: 'Drible desconcertante e velocidade na ponta esquerda desequilibrando o sistema defensivo uruguaio na Arena Fonte Nova.'
  },
  'art-sel-2': {
    // Aula tática em Barranquilla: meio-campo dita ritmo
    imageId: 'sel-barranquilla-tactics-colombia',
    dominantMood: 'tático',
    thought: 'Maestria na armação e distribuição de passes verticais no círculo central, quebrando as linhas de marcação rivais.'
  },
  'art-sel-3': {
    // Furacão pelas pontas: Brasil atropela Chile 4x0
    imageId: 'sel-maracana-chile-goleada',
    dominantMood: 'drible',
    thought: 'Arrancada avassaladora dos extremos em transição ofensiva de velocidade, rompendo o bloco defensivo adversário.'
  },
  'art-sel-4': {
    // Guerra no Maracanã: Raça e defesa impenetrável calam Argentina
    imageId: 'sel-maracana-argentina-classico',
    dominantMood: 'tático',
    thought: 'Disputa física e intensidade na marcação no gramado do Maracanã, sustentando o resultado no Superclássico.'
  },
  'art-sel-5': {
    // Show da nova geração: Hat-trick do camisa 9 contra o Peru
    imageId: 'sel-peru-hat-trick-striker',
    dominantMood: 'celebração',
    thought: 'O faro de gol e o êxtase do artilheiro camisa 9 em comemoração apoteótica após balançar a rede três vezes.'
  },
  'art-sel-6': {
    // Heroísmo a 3.600 metros na altitude de La Paz contra Bolívia
    imageId: 'sel-lapaz-altitude-arena',
    dominantMood: 'estádio',
    thought: 'A pelota em jogo sob a atmosfera intimidadora e a iluminação potente da arena em desafio histórico de superação física.'
  },

  // CLUBES SÉRIE A (6 matérias)
  'art-cla-1': {
    // Maracanã ferveu: Flamengo amassa Palmeiras
    imageId: 'cla-maracana-crowd-flamengo',
    dominantMood: 'estádio',
    thought: 'O pulsar de 65 mil vozes no Maracanã e a pressão esmagadora da torcida empurrando o time à liderança do campeonato.'
  },
  'art-cla-2': {
    // Pintura de Luiz Henrique na Fonte Nova: Botafogo bate Bahia
    imageId: 'cla-botafogo-nilton-santos',
    dominantMood: 'drible',
    thought: 'Acelerada vertical pela ponta direita cravando as travas no gramado para finalizar no ângulo e selar a vitória.'
  },
  'art-cla-3': {
    // MorumBIS caldeirão: São Paulo amassa Grêmio
    imageId: 'cla-morumbi-lights-saopaulo',
    dominantMood: 'estádio',
    thought: 'A grandiosidade do Morumbi iluminado na noite de vitória maiúscula com o apoio irrestrito da torcida tricolor.'
  },
  'art-cla-4': {
    // Explosão na Arena MRV: Atlético-MG bate Cruzeiro
    imageId: 'cla-arenamrv-atleticomg-derby',
    dominantMood: 'estádio',
    thought: 'A vibração apaixonada da arquibancada alvinegra celebrando o gol da vitória épica no clássico mineiro.'
  },
  'art-cla-5': {
    // Show de Rodrigo Garro: Corinthians vence Vasco em São Januário
    imageId: 'cla-corinthians-arena-night',
    dominantMood: 'estádio',
    thought: 'A atmosfera noturna de tensão e entrega sob os holofotes do Brasileirão em vitória crucial fora de casa.'
  },
  'art-cla-6': {
    // A Fortaleza de Vojvoda: Leão bate Internacional no Castelão
    imageId: 'coach-stadium-bench-view',
    dominantMood: 'tático',
    thought: 'A leitura serena e cirúrgica do treinador a partir do banco de reservas, orquestrando mais uma vitória incontestável.'
  },

  // CLUBES SÉRIE B (6 matérias)
  'art-clb-1': {
    // Vila Belmiro ruge de novo: Santos bate América-MG rumo ao acesso
    imageId: 'clb-vilabelmiro-santos-peixe',
    dominantMood: 'estádio',
    thought: 'A mística centenária do alçapão da Vila Belmiro fervendo em apoio apaixonado rumo ao retorno à elite nacional.'
  },
  'art-clb-2': {
    // Sensação do interior: Novorizontino derruba Sport na Ilha do Retiro
    imageId: 'clb-novorizontino-tatico-gramado',
    dominantMood: 'tático',
    thought: 'Organização tática impecável e ocupação inteligente das linhas do gramado em triunfo cirúrgico fora de casa.'
  },
  'art-clb-3': {
    // O Mar Preto e Branco: Ceará coloca 55 mil no Castelão
    imageId: 'clb-castelao-ceara-multidao',
    dominantMood: 'estádio',
    thought: 'Mais de 55 mil corações apaixonados transformando o Castelão em um mar preto e branco na caminhada pelo acesso.'
  },
  'art-clb-4': {
    // Drama e Catarse aos 49 do 2º tempo: Vila Nova vira contra o Paysandu
    imageId: 'clb-vilanova-catarse-final',
    dominantMood: 'celebração',
    thought: 'A bola balançando a rede no último suspiro dos acréscimos, deflagrando a catarse coletiva da virada emocionante.'
  },
  'art-clb-5': {
    // Surpresa no Cerrado: Operário-PR silencia o Goiás na Serrinha
    imageId: 'clb-operario-cerrado-turf',
    dominantMood: 'estádio',
    thought: 'A bola de futebol no gramado sob a noite fria de decisão no Centro-Oeste em vitória maiúscula pela Série B.'
  },
  'art-clb-6': {
    // Dérbi da Sobrevivência: Guarani vence Ponte Preta no Brinco de Ouro
    imageId: 'clb-derby-campinas-brinco',
    dominantMood: 'tático',
    thought: 'A intensidade ferrenha da rivalidade campineira e a disputa palmo a palmo de cada metro do campo de jogo.'
  },

  // JOGADORES (6 matérias)
  'art-jog-1': {
    // Vini Jr destrói Barcelona
    imageId: 'art-young-dribbler-2',
    dominantMood: 'drible',
    thought: 'O drible curto desconcertante e a aceleração fatal no mano a mano desmontando a defesa adversária.'
  },
  'art-jog-2': {
    // Rodrygo anota hat-trick na Champions
    imageId: 'art-striker-kick-2',
    dominantMood: 'celebração',
    thought: 'O chute indefensável no ângulo, confirmando a frieza técnica e o faro de gol em noites de gala internacional.'
  },
  'art-jog-3': {
    // Estêvão dá show no Allianz Parque
    imageId: 'art-young-wonderkid-1',
    dominantMood: 'drible',
    thought: 'A explosão do jovem talento nacional partindo em velocidade para o drible decisivo diante da torcida.'
  },
  'art-jog-4': {
    // Orquestra de Gerson no Flamengo com 96% de acerto
    imageId: 'art-midfielder-playmaker-1',
    dominantMood: 'tático',
    thought: 'O domínio absoluto dos ritmos do jogo a partir do meio-campo, articulando jogadas com elegância e precisão milimétrica.'
  },
  'art-jog-5': {
    // Predador dos acréscimos: Endrick decide com golaço
    imageId: 'art-striker-focus-3',
    dominantMood: 'celebração',
    thought: 'A frieza implacável e o foco do jovem goleador ao converter a finalização suprema sob a pressão do relógio.'
  },
  'art-jog-6': {
    // Memphis Depay cala críticas com falta na gaveta
    imageId: 'art-crossbar-topcorner-goal',
    dominantMood: 'celebração',
    thought: 'A cobrança de falta antológica estufando a bochecha da rede, consagrando a precisão cirúrgica da bola parada.'
  },

  // EQUIPE TÉCNICA (6 matérias)
  'art-tec-1': {
    // A Mente Fria do Campeão: O nó tático de Abel Ferreira
    imageId: 'coach-sideline-gesturing-1',
    dominantMood: 'tático',
    thought: 'A intensidade do comandante à beira do gramado, desenhando correções táticas e cobrando postura mental inabalável.'
  },
  'art-tec-2': {
    // Futebol Corajoso e Avassalador: Artur Jorge e o Botafogo
    imageId: 'coach-tactical-pitch-lines',
    dominantMood: 'tático',
    thought: 'A rigorosa ocupação das linhas do gramado e a pressão sufocante no campo ofensivo sufocando a saída rival.'
  },
  'art-tec-3': {
    // O Milagre Cearense: Vojvoda 200 jogos no Fortaleza
    imageId: 'coach-stadium-bench-view',
    dominantMood: 'tático',
    thought: 'A visão do banco de reservas acompanhando a consolidação de um projeto histórico de 200 jogos na elite.'
  },
  'art-tec-4': {
    // Aula no vestiário: A leitura cirúrgica de Filipe Luís
    imageId: 'coach-team-huddle-pitch',
    dominantMood: 'tático',
    thought: 'A união em roda do elenco no gramado assimilando as diretrizes de jogo posicional antes de subir ao combate.'
  },
  'art-tec-5': {
    // Fórmula Canarinha Encontrada: Dorival Júnior monta meio-campo
    imageId: 'coach-referee-tactical-duel',
    dominantMood: 'tático',
    thought: 'O alinhamento tático no círculo central e a distribuição de responsabilidades para equilibrar o setor de criação da Seleção.'
  },
  'art-tec-6': {
    // Raça argentina na beira do gramado: Luis Zubeldía no São Paulo
    imageId: 'coach-tunnel-entrance-focus',
    dominantMood: 'tático',
    thought: 'A concentração inflamada e a liderança vibrante na descida do túnel de acesso rumo ao gramado do Morumbi.'
  },

  // EVENTOS (6 matérias)
  'art-eve-1': {
    // Glória Eterna: Botafogo e Atlético-MG na final da Libertadores
    imageId: 'eve-libertadores-pitch-final',
    dominantMood: 'copa',
    thought: 'O tapete verde do estádio iluminado pelos holofotes para a decisão continental mais esperada da temporada.'
  },
  'art-eve-2': {
    // Batalha dos R$ 73 Milhões: Flamengo e Galo na final da Copa do Brasil
    imageId: 'eve-copadobrasil-trophy-silver',
    dominantMood: 'copa',
    thought: 'O troféu dourado e prateado sob a expectativa solene da arquibancada para a consagração do grande campeão nacional.'
  },
  'art-eve-3': {
    // O Brasil contra o Mundo: 4 gigantes no Super Mundial da FIFA 2025
    imageId: 'eve-super-mundial-aerial-arena',
    dominantMood: 'copa',
    thought: 'A visão aérea imponente da superarena esportiva pronta para sediar o maior embate de clubes do futebol planetário.'
  },
  'art-eve-4': {
    // Mística Celeste em Assunção: Cruzeiro derruba Lanús rumo à final da Sula
    imageId: 'eve-cruzeiro-sulamericana-assuncao',
    dominantMood: 'copa',
    thought: 'A arrancada fulminante no gramado na noite épica que devolveu a Raposa ao protagonismo das finais sul-americanas.'
  },
  'art-eve-5': {
    // Corrida pelo Sonho do Hexa: Contagem regressiva para a Copa 2026
    imageId: 'eve-worldcup-2026-ball-net',
    dominantMood: 'copa',
    thought: 'A bola balançando a rede do gol, materializando a busca obstinada pela consagração máxima do futebol mundial.'
  },
  'art-eve-6': {
    // Febre nas arquibancadas: Brasileirão bate recorde com 35 mil por jogo
    imageId: 'eve-brasileirao-crowd-fever',
    dominantMood: 'estádio',
    thought: 'A festa contagiante da multidão nas arquibancadas celebrando a paixão popular e o recorde histórico de público.'
  }
};

const mockPostsPath = path.resolve(process.cwd(), 'src/data/mockPosts.ts');
let mockPostsContent = fs.readFileSync(mockPostsPath, 'utf-8');

// Atualiza os posts
const updatedPosts = INITIAL_POSTS.map(post => {
  const mapping = POST_IMAGE_MAPPING[post.id];
  let chosenImg = FOOTBALL_THEMATIC_LIBRARY.find(i => i.id === mapping?.imageId);

  if (!chosenImg) {
    // Fallback inteligente para imagem de futebol puro da mesma categoria
    chosenImg = FOOTBALL_THEMATIC_LIBRARY.find(i => i.category === post.category) || FOOTBALL_THEMATIC_LIBRARY[0];
  }

  const visualConcept = extractThematicVisualConcept(post.title, post.summary, post.category);
  const thematicConcept = mapping ? `${visualConcept.conceptTitle} | ${mapping.thought}` : `${visualConcept.conceptTitle} | ${chosenImg.description}`;
  const visualMood = mapping?.dominantMood || chosenImg.dominantMood || visualConcept.dominantMood;

  const appAnalysis = generateImageApplicationForPost(
    post.title,
    post.summary,
    post.category,
    thematicConcept,
    visualMood,
    post.content
  );

  return {
    ...post,
    coverImage: chosenImg.url,
    aiImageMention: `📸 Cobertura Fotográfica de Futebol • ${chosenImg.description}`,
    thematicConcept,
    visualMood,
    imageApplication: appAnalysis,
    imageGenerationSource: 'curated-unique' as const,
    reviewedBy: 'Robô Inteligente de Automação & Criação de Conteúdo (CampoBR IA)',
    editorialStatus: '100% Temática Futebolística Aprovada',
    reviewNotes: 'Imagem fotográfica de futebol profissional estritamente vinculada ao conceito informativo do título e do corpo da matéria.'
  };
});

// Escreve de volta no mockPosts.ts
const newMockContent = `import { Post } from '../types';

export const INITIAL_POSTS: Post[] = ${JSON.stringify(updatedPosts, null, 2)};
`;

fs.writeFileSync(mockPostsPath, newMockContent, 'utf-8');
console.log('✓ Todas as 36 postagens em mockPosts.ts foram atualizadas com imagens 100% futebol profissional!');
