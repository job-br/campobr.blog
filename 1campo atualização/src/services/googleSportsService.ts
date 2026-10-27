export interface GoogleLiveFootballMatch {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore?: number;
  awayScore?: number;
  // Status rigoroso: 'AO VIVO' apenas para jogos que ESTÃO EM ANDAMENTO
  status: 'AO VIVO' | 'ENCERRADO' | string;
  minute?: string;
  round?: string;
  stadium?: string;
  broadcast?: string;
  startTime?: string;
  isActuallyInProgress: boolean; // Flag estrita: só true se o jogo está rolando agora
  goals?: { team: 'home' | 'away'; player: string; minute: string }[];
  stats?: {
    possession: [number, number];
    shots: [number, number];
    fouls: [number, number];
  };
}

export interface GoogleNewsHeadline {
  id: string;
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  category: string;
  url: string;
  tag: string;
  isHot?: boolean;
}

// Conjunto sincronizado de notícias mais recentes de futebol brasileiro via Google Notícias
// Dados estáticos removidos: placares/manchetes "ao vivo" fixos enganavam o leitor.
// Integre uma API real de resultados (ex.: API-Football) para repovoar.
export const LATEST_GOOGLE_FOOTBALL_NEWS: GoogleNewsHeadline[] = [];

// Dados dos jogos rigorosamente sincronizados com os resultados de HOJE do Google
// Dados estáticos removidos: placares/manchetes "ao vivo" fixos enganavam o leitor.
// Integre uma API real de resultados (ex.: API-Football) para repovoar.
export const LATEST_GOOGLE_MATCHES: GoogleLiveFootballMatch[] = [];
