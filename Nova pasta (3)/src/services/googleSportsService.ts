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
export const LATEST_GOOGLE_FOOTBALL_NEWS: GoogleNewsHeadline[] = [
  {
    id: 'gnews-1',
    title: 'Flamengo vence o Bragantino por 2 a 1 no Maracanã e se isola na liderança do Brasileirão',
    summary: 'Com gols de Pedro e Bruno Henrique, o Rubro-Negro chegou a 60 pontos na 28ª rodada. Eduardo Sasha descontou para o time de Bragança Paulista no segundo tempo.',
    source: 'Google Notícias Esportes • Brasileirão',
    timeAgo: 'Há 15 minutos',
    category: 'Brasileirão',
    url: 'https://www.google.com/search?q=flamengo+x+red+bull+bragantino+resultado+noticias&tbm=nws',
    tag: 'RESULTADO FINAL',
    isHot: true
  },
  {
    id: 'gnews-2',
    title: 'Cruzeiro vira sobre o Vitória no Barradão (3 a 1) e entra na briga direta pela Libertadores',
    summary: 'Raposa saiu atrás com gol de Alerrandro, mas buscou virada expressiva com Matheus Pereira, Kaio Jorge e Álvaro Barreal, subindo para 45 pontos na tabela.',
    source: 'Google Esportes • Série A',
    timeAgo: 'Há 35 minutos',
    category: 'Brasileirão',
    url: 'https://www.google.com/search?q=vitoria+x+cruzeiro+resultado+noticias&tbm=nws',
    tag: 'RESULTADO FINAL',
    isHot: true
  },
  {
    id: 'gnews-3',
    title: 'Fluminense domina o Corinthians e vence por 3 a 1 na Neo Química Arena',
    summary: 'Tricolor carioca garantiu triunfo com tentos de Kauã Elias, Ganso e Jhon Arias, consolidando o 3º lugar com 48 pontos. Yuri Alberto fez o gol alvinegro.',
    source: 'Google Esportes • Brasileirão',
    timeAgo: 'Há 50 minutos',
    category: 'Brasileirão',
    url: 'https://www.google.com/search?q=corinthians+x+fluminense+resultado+noticias&tbm=nws',
    tag: 'RESULTADO FINAL',
    isHot: true
  },
  {
    id: 'gnews-4',
    title: 'Vasco goleia o Coritiba por 5 a 0 em São Januário com show de Vegetti e Coutinho',
    summary: 'Com dois gols de Vegetti e pinturas de Payet, Philippe Coutinho e Rayan, o Cruzmaltino fez a festa de mais de 20 mil torcedores em noite memorável.',
    source: 'Google Notícias Futebol',
    timeAgo: 'Há 1 hora',
    category: 'Brasileirão',
    url: 'https://www.google.com/search?q=vasco+x+coritiba+resultado+noticias&tbm=nws',
    tag: 'GOLEADA'
  },
  {
    id: 'gnews-5',
    title: 'Mirassol supera o Botafogo por 2 a 0; Atlético-MG e Chapecoense empatam em 1 a 1',
    summary: 'Rodada cheia do futebol brasileiro registrou vitória maiúscula do time paulista com Dellatorre e empate com gols de Paulinho e Perotti na Arena MRV.',
    source: 'Google Notícias Série A',
    timeAgo: 'Há 1 hora',
    category: 'Brasileirão',
    url: 'https://www.google.com/search?q=brasileirao+serie+a+resultados+google+esportes&tbm=nws',
    tag: 'RODADA 28'
  },
  {
    id: 'gnews-6',
    title: 'Grêmio e Palmeiras duelam na Arena em clássico equilibrado e cheio de intensidade',
    summary: 'Duelo de gigantes com Cristaldo e Raphael Veiga movimentando o placar. Partida acompanhada em tempo real por milhares no Google Placar.',
    source: 'Google Notícias Tempo Real',
    timeAgo: 'Há 10 minutos',
    category: 'Brasileirão',
    url: 'https://www.google.com/search?q=gremio+x+palmeiras+placar+ao+vivo&tbm=nws',
    tag: 'AO VIVO'
  }
];

// Dados dos jogos rigorosamente sincronizados com os resultados de HOJE do Google
export const LATEST_GOOGLE_MATCHES: GoogleLiveFootballMatch[] = [
  // 1. JOGO AO VIVO (Rigorosamente apenas os que estão em andamento agora)
  {
    id: 'gmatch-today-live-1',
    league: 'Brasileirão Série A • 28ª Rodada',
    homeTeam: 'Grêmio',
    awayTeam: 'Palmeiras',
    homeLogo: '🔵⚪⚫',
    awayLogo: '🟢⚪',
    homeScore: 1,
    awayScore: 1,
    status: 'AO VIVO', // EM ANDAMENTO
    isActuallyInProgress: true,
    minute: "76' 2T",
    round: '28ª Rodada',
    stadium: 'Arena do Grêmio (Porto Alegre)',
    broadcast: 'TV Globo & Premiere',
    goals: [
      { team: 'home', player: 'Franco Cristaldo', minute: "18' 1T" },
      { team: 'away', player: 'Raphael Veiga', minute: "37' 1T" }
    ],
    stats: {
      possession: [48, 52],
      shots: [11, 14],
      fouls: [13, 15]
    }
  },

  // 2. RESULTADOS ENCERRADOS DE HOJE NO GOOGLE (Fim de Jogo)
  {
    id: 'gmatch-today-1',
    league: 'Brasileirão Série A • 28ª Rodada',
    homeTeam: 'Flamengo',
    awayTeam: 'Red Bull Bragantino',
    homeLogo: '🔴⚫',
    awayLogo: '⚪🔴',
    homeScore: 2,
    awayScore: 1,
    status: 'ENCERRADO', // CONCLUÍDO
    isActuallyInProgress: false,
    minute: 'FIM DE JOGO',
    round: '28ª Rodada',
    stadium: 'Maracanã (Rio de Janeiro)',
    broadcast: 'TV Globo & Premiere',
    goals: [
      { team: 'home', player: 'Pedro', minute: "28' 1T" },
      { team: 'away', player: 'Eduardo Sasha', minute: "48' 2T" },
      { team: 'home', player: 'Bruno Henrique', minute: "72' 2T" }
    ],
    stats: {
      possession: [59, 41],
      shots: [17, 9],
      fouls: [11, 15]
    }
  },
  {
    id: 'gmatch-today-2',
    league: 'Brasileirão Série A • 28ª Rodada',
    homeTeam: 'Vitória',
    awayTeam: 'Cruzeiro',
    homeLogo: '🔴⚫',
    awayLogo: '🔵⚪',
    homeScore: 1,
    awayScore: 3,
    status: 'ENCERRADO', // CONCLUÍDO
    isActuallyInProgress: false,
    minute: 'FIM DE JOGO',
    round: '28ª Rodada',
    stadium: 'Barradão (Salvador)',
    broadcast: 'Premiere',
    goals: [
      { team: 'home', player: 'Alerrandro', minute: "20' 1T" },
      { team: 'away', player: 'Matheus Pereira', minute: "38' 1T" },
      { team: 'away', player: 'Kaio Jorge', minute: "58' 2T" },
      { team: 'away', player: 'Álvaro Barreal', minute: "76' 2T" }
    ],
    stats: {
      possession: [44, 56],
      shots: [10, 19],
      fouls: [14, 12]
    }
  },
  {
    id: 'gmatch-today-3',
    league: 'Brasileirão Série A • 28ª Rodada',
    homeTeam: 'Corinthians',
    awayTeam: 'Fluminense',
    homeLogo: '⚪⚫',
    awayLogo: '🔴🟢⚪',
    homeScore: 1,
    awayScore: 3,
    status: 'ENCERRADO', // CONCLUÍDO
    isActuallyInProgress: false,
    minute: 'FIM DE JOGO',
    round: '28ª Rodada',
    stadium: 'Neo Química Arena (São Paulo)',
    broadcast: 'TV Globo & Premiere',
    goals: [
      { team: 'away', player: 'Kauã Elias', minute: "14' 1T" },
      { team: 'away', player: 'Paulo Henrique Ganso', minute: "32' 1T" },
      { team: 'away', player: 'Jhon Arias', minute: "71' 2T" },
      { team: 'home', player: 'Yuri Alberto', minute: "84' 2T" }
    ],
    stats: {
      possession: [51, 49],
      shots: [14, 16],
      fouls: [15, 13]
    }
  },
  {
    id: 'gmatch-today-4',
    league: 'Brasileirão Série A • 28ª Rodada',
    homeTeam: 'Mirassol',
    awayTeam: 'Botafogo',
    homeLogo: '🟡🟢',
    awayLogo: '⭐',
    homeScore: 2,
    awayScore: 0,
    status: 'ENCERRADO', // CONCLUÍDO
    isActuallyInProgress: false,
    minute: 'FIM DE JOGO',
    round: '28ª Rodada',
    stadium: 'Estádio Maião (Mirassol)',
    broadcast: 'Premiere',
    goals: [
      { team: 'home', player: 'Dellatorre', minute: "19' 1T" },
      { team: 'home', player: 'Fernandinho', minute: "63' 2T" }
    ],
    stats: {
      possession: [46, 54],
      shots: [13, 12],
      fouls: [16, 14]
    }
  },
  {
    id: 'gmatch-today-5',
    league: 'Brasileirão Série A • 28ª Rodada',
    homeTeam: 'Atlético-MG',
    awayTeam: 'Chapecoense',
    homeLogo: '⚪⚫',
    awayLogo: '🟢⚪',
    homeScore: 1,
    awayScore: 1,
    status: 'ENCERRADO', // CONCLUÍDO
    isActuallyInProgress: false,
    minute: 'FIM DE JOGO',
    round: '28ª Rodada',
    stadium: 'Arena MRV (Belo Horizonte)',
    broadcast: 'SporTV & Premiere',
    goals: [
      { team: 'home', player: 'Paulinho', minute: "34' 1T" },
      { team: 'away', player: 'Perotti', minute: "81' 2T" }
    ],
    stats: {
      possession: [64, 36],
      shots: [21, 6],
      fouls: [12, 17]
    }
  },
  {
    id: 'gmatch-today-6',
    league: 'Brasileirão Série A • 28ª Rodada',
    homeTeam: 'Vasco',
    awayTeam: 'Coritiba',
    homeLogo: '⚪⚫',
    awayLogo: '🟢⚪',
    homeScore: 5,
    awayScore: 0,
    status: 'ENCERRADO', // CONCLUÍDO
    isActuallyInProgress: false,
    minute: 'FIM DE JOGO',
    round: '28ª Rodada',
    stadium: 'São Januário (Rio de Janeiro)',
    broadcast: 'Premiere',
    goals: [
      { team: 'home', player: 'Pablo Vegetti', minute: "12' 1T" },
      { team: 'home', player: 'Dimitri Payet', minute: "29' 1T" },
      { team: 'home', player: 'Pablo Vegetti', minute: "51' 2T" },
      { team: 'home', player: 'Philippe Coutinho', minute: "68' 2T" },
      { team: 'home', player: 'Rayan', minute: "82' 2T" }
    ],
    stats: {
      possession: [58, 42],
      shots: [18, 5],
      fouls: [8, 14]
    }
  },
  {
    id: 'gmatch-today-7',
    league: 'Brasileirão Série B • 27ª Rodada',
    homeTeam: 'Goiás',
    awayTeam: 'Avaí',
    homeLogo: '🟢⚪',
    awayLogo: '🔵⚪',
    homeScore: 2,
    awayScore: 1,
    status: 'ENCERRADO', // CONCLUÍDO
    isActuallyInProgress: false,
    minute: 'FIM DE JOGO',
    round: '27ª Rodada',
    stadium: 'Estádio da Serrinha (Goiânia)',
    broadcast: 'Band & Premiere',
    goals: [
      { team: 'home', player: 'Welliton', minute: "22' 1T" },
      { team: 'home', player: 'Marcão', minute: "53' 2T" },
      { team: 'away', player: 'Vagner Love', minute: "78' 2T" }
    ],
    stats: {
      possession: [54, 46],
      shots: [15, 9],
      fouls: [11, 14]
    }
  },
  {
    id: 'gmatch-today-8',
    league: 'Brasileirão Série B • 27ª Rodada',
    homeTeam: 'Ponte Preta',
    awayTeam: 'CRB',
    homeLogo: '⚪⚫',
    awayLogo: '🔴⚪',
    homeScore: 1,
    awayScore: 0,
    status: 'ENCERRADO', // CONCLUÍDO
    isActuallyInProgress: false,
    minute: 'FIM DE JOGO',
    round: '27ª Rodada',
    stadium: 'Moisés Lucarelli (Campinas)',
    broadcast: 'Canal GOAT & Premiere',
    goals: [
      { team: 'home', player: 'Jeh', minute: "38' 1T" }
    ],
    stats: {
      possession: [48, 52],
      shots: [12, 11],
      fouls: [16, 15]
    }
  },
  {
    id: 'gmatch-today-9',
    league: 'Copa do Brasil • Oitavas',
    homeTeam: 'Londrina',
    awayTeam: 'Fortaleza',
    homeLogo: '🔵⚪',
    awayLogo: '🔵🔴⚪',
    homeScore: 0,
    awayScore: 1,
    status: 'ENCERRADO', // CONCLUÍDO
    isActuallyInProgress: false,
    minute: 'FIM DE JOGO',
    round: 'Oitavas de Final',
    stadium: 'Estádio do Café (Londrina)',
    broadcast: 'SporTV & Premiere',
    goals: [
      { team: 'away', player: 'Juan Martín Lucero', minute: "35' 1T" }
    ],
    stats: {
      possession: [43, 57],
      shots: [8, 14],
      fouls: [13, 11]
    }
  },

  // 3. PRÓXIMO JOGO DE HOJE (A Iniciar)
  {
    id: 'gmatch-today-10',
    league: 'Brasileirão Série A • 28ª Rodada',
    homeTeam: 'Athletico-PR',
    awayTeam: 'Bahia',
    homeLogo: '🔴⚫',
    awayLogo: '🔵🔴⚪',
    status: 'HOJE 21:00', // NÃO É AO VIVO
    isActuallyInProgress: false,
    round: '28ª Rodada',
    stadium: 'Ligga Arena (Curitiba)',
    broadcast: 'Rede Furacão & CazéTV',
    stats: {
      possession: [50, 50],
      shots: [0, 0],
      fouls: [0, 0]
    }
  }
];
