export type FootballCategory =
  | 'Seleção Brasileira'
  | 'Clubes Serie A'
  | 'Clubes Serie B'
  | 'Jogadores'
  | 'Equipe Técnica'
  | 'Eventos';

export type EditorialContentType =
  | 'noticia-contexto'        // 1. Notícias com contexto (O que muda, impacto na tabela e cenários)
  | 'historia-curiosidade'    // 2. Histórias e curiosidades dos clubes (Evergreen, tráfego contínuo)
  | 'estatistica-comparacao'  // 3. Estatísticas e comparações (Critérios claros, dados atualizados)
  | 'calendario-guia'         // 4. Calendário e guias de jogos (Datas, fuso de Brasília e onde assistir)
  | 'analise-tatica';         // 5. Análises que explicam o jogo (Didática que diferencia o CampoBR)

export const EDITORIAL_CONTENT_TYPES: { id: EditorialContentType; label: string; badge: string; description: string }[] = [
  { id: 'noticia-contexto', label: 'Notícias com Contexto', badge: 'Contexto & Impacto', description: 'Não apenas o fato: impacto na tabela, próximos desafios e cenários.' },
  { id: 'historia-curiosidade', label: 'Histórias e Curiosidades', badge: 'Memória & História', description: 'Matérias duradouras com alto tráfego contínuo sobre a mística dos clubes.' },
  { id: 'estatistica-comparacao', label: 'Estatísticas e Comparações', badge: 'Raio-X de Dados', description: 'Critérios claros, números checados, fontes e comparações aprofundadas.' },
  { id: 'calendario-guia', label: 'Calendário e Guias de Jogos', badge: 'Onde Assistir & Guia', description: 'Datas, horários oficiais (BRT), canais e transmissões confirmadas.' },
  { id: 'analise-tatica', label: 'Análises que Explicam o Jogo', badge: 'Didática do Jogo', description: 'Explicações ricas e táticas que diferenciam o CampoBR de sites comuns.' },
];

export interface ImageApplicationAnalysis {
  tacticalApplication: string; // Aplicação tática e espacial no gramado
  visualAtmosphere: string;    // Atmosfera dramática, iluminação e tensão do lance
  editorialConsistency: string; // Consistência editorial e conexão direta com o público
}

export interface CitedSource {
  id: string;
  title: string;
  url: string;
  domain: string;
  claimSustained: string;
  accessedAt: string; // Ex: "2026-10-24T14:09:23Z" ou "24/10/2026 11:09 BRT"
  relevanceScore?: number;
  isVerified: boolean;
  sourceType?: 'comunicado_oficial' | 'imprensa_esportiva' | 'organizacao_torneio' | 'estatistica_oficial';
}

export type PautaStatus = 'nova' | 'pesquisando' | 'rascunho' | 'revisao' | 'aprovada' | 'publicada' | 'rejeitada';
export type PautaRisk = 'Baixo' | 'Médio' | 'Alto';

export interface EditorialPauta {
  id: string;
  tema: string;
  categoria: FootballCategory;
  tipoConteudo: EditorialContentType;
  status: PautaStatus;
  risco: PautaRisk;
  fontes: CitedSource[];
  responsavelRevisao: string;
  dataPrevista: string;
  draftPostId?: string;
  draftTitle?: string;
  claimsSupported?: { claim: string; sourceTitle: string; sourceUrl: string }[];
  unverifiedNotes?: string;
  editorialChecklist?: {
    noFalseClaimsInShortText: boolean;
    noInventedLabTestsOrSamples: boolean;
    sourcesForVerifiableClaims: boolean;
    internalLinksVerified: boolean;
    specsSeparatedFromOpinion: boolean;
    affiliatesCompliantNoFakeAsin: boolean;
  };
  createdAt: string;
  updatedAt: string;
  publishedPostId?: string;
  publishedAt?: string;
  iveScore?: number; // Índice de Valor Editorial (Analytics vs Search Console)
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: FootballCategory;
  contentType?: EditorialContentType;
  contentPillar?: string;
  coverImage: string;
  aiImageMention?: string;
  thematicConcept?: string;
  visualMood?: string;
  imageApplication?: ImageApplicationAnalysis;
  imageGenerationSource?: 'gemini-ai' | 'curated-unique' | 'procedural-svg';
  reviewedBy?: string;
  editorialStatus?: string;
  reviewNotes?: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  viewsCount: number;
  likesCount: number;
  featured: boolean;
  readTimeMinutes: number;
  tags: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  status: 'published' | 'draft' | 'scheduled';
  scheduledFor?: string;
  automationDate?: string;
  automationSlot?: 'morning' | 'evening';
  // Pesquisa com Grounding e Rastreabilidade Editorial
  citedSources?: CitedSource[];
  researchTimestamp?: string;
  claimsSupported?: { claim: string; sourceTitle: string; sourceUrl: string }[];
  unverifiedClaims?: string[];
  faqItems?: { question: string; answer: string; sourceTitle?: string }[];
  purchaseChecklist?: { item: string; recommendation: string; verifiedNote: string }[];
  relatedInternalLinks?: { id: string; title: string; category: FootballCategory; slug: string }[];
  editorialVerificationStatus?: 'aprovada' | 'revisao_pendente' | 'verificada';
  pautaId?: string;
}

export interface AdminSession {
  email: string;
  phone?: string;
  verifiedAt: string;
  twoFactorVerified?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
}

export interface AdSenseConfig {
  publisherId: string;
  slotRightTop: string;
  slotRightBottom: string;
  slotFeedMiddle: string;
  adsenseEnabled: boolean;
  autoAds: boolean;
}

export interface ShopeeProduct {
  id: string;
  title: string;
  category: FootballCategory | 'Geral';
  priceDisplay: string;
  originalPrice?: string;
  rating?: number; // Opcional - nunca inventado
  reviewCount?: number; // Opcional - nunca inventado
  soldCountDisplay?: string; // Opcional - nunca inventado
  imageUrl: string;
  badge?: string;
  searchQuery: string;
  directShopeeUrl?: string; // Link direto verificado se houver
  directAmazonUrl?: string; // Link direto /dp/ASIN se houver ASIN válido
  asin?: string; // ASIN se verificado
  isAsinValid?: boolean;
  description: string;
  freeShipping?: boolean;
  keywords?: string[];
  isUserRealProduct?: boolean;
  verifiedStatus: 'verified' | 'unverified'; // Marcação obrigatória
  currentPriceVerified: boolean; // Se false, exibe "Verificar preço atual"
  editorialNotes?: string; // Observação editorial separada da especificação
  productSpecifications?: string[]; // Especificação objetiva do produto
  unverifiedInfo?: string; // Informação não verificada expressamente declarada
  createdAt?: string;
}

export interface ShopeeAffiliateConfig {
  affiliateId: string;
  enabled: boolean;
  disclosure: string;
  showInArticle: boolean;
  showInSidebar: boolean;
  catalogMode?: 'prefer_user_products' | 'exclusive_user_products' | 'curated_fallback';
  userProductsCount?: number;
}

export type AmazonAffiliateConfig = ShopeeAffiliateConfig;

export interface DailySlotConfig {
  slot: 'morning' | 'evening' | 'noon' | 'lunch' | 'night';
  label: string;
  baseTime: string;
  offsetMinutes: number;
  scheduledTime: string; // Ex: "11:45" ou "18:45"
  targetDate: string;    // "YYYY-MM-DD"
  targetIso: string;     // ISO timestamp
  executed: boolean;
  executedPostId?: string;
  executedPostTitle?: string;
  category: FootballCategory;
}

export interface AutomationConfig {
  enabled: boolean;
  autoPublishScheduled: boolean;
  lastRunDate: string; // YYYY-MM-DD
  frequency: 'twice_daily'; // 2x por dia todos os dias do ano
  slotMorning: DailySlotConfig; // Edição 1: Almoço / Manhã (~11h45)
  slotEvening: DailySlotConfig; // Edição 2: Fim de Tarde / Noite (~18h45)
  slotToday: DailySlotConfig;   // Compatibilidade: próximo slot ativo
  slotsToday: {
    morning: DailySlotConfig;
    lunch: DailySlotConfig;
    noon: DailySlotConfig;
    night: DailySlotConfig;
  };
}

export interface MatchLiveScore {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore?: number;
  awayScore?: number;
  status: 'AO VIVO' | 'ENCERRADO' | string;
  league: string;
  minute?: string;
}

export type PageTab = 'inicio' | 'postagens' | 'noticias' | 'admin';

