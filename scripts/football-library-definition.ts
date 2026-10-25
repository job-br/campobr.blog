import fs from 'fs';
import path from 'path';

// Lista de imagens 100% temáticas de futebol profissional brasileiro
// 100% testadas e ativas (HTTP 200), sem fotos de escritórios, laptops, academias ou festas
export const FOOTBALL_THEMATIC_LIBRARY = [
  // --- JOGADORES, ARTILHEIROS, GOLS E LANCES DECISIVOS ---
  {
    id: 'art-striker-celebration-1',
    url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['camisa 9', 'artilheiro', 'gol', 'finalização', 'faro de gol', 'predador', 'área', 'decisivo', 'comemoração', 'vini jr', 'pedro'],
    description: 'Atacante camisa 9 em comemoração apoteótica de gol decisivo no estádio lotado',
    dominantMood: 'celebração'
  },
  {
    id: 'art-striker-kick-2',
    url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['chute', 'finalizador', 'artilharia', 'camisa 9', 'potência', 'bola na rede', 'golaço', 'voleio', 'chute a gol'],
    description: 'Finalização certeira de voleio no ângulo indefensável do gol no gramado',
    dominantMood: 'celebração'
  },
  {
    id: 'art-young-wonderkid-1',
    url: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['jovem', 'craque', 'drible', 'safra', 'promessa', 'estêvão', 'velocidade', 'ousadia', 'garotada', 'joia'],
    description: 'Jovem talento do futebol brasileiro em arrancada veloz com a bola colada ao pé',
    dominantMood: 'drible'
  },
  {
    id: 'art-young-dribbler-2',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['drible curto', 'habilidade', 'pontas', 'finta', 'talento', 'geração', 'vini jr', 'caneta', 'elástico', 'velocidade'],
    description: 'Drible desconcertante no gramado desequilibrando a linha defensiva rival',
    dominantMood: 'drible'
  },
  {
    id: 'art-midfielder-playmaker-1',
    url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['meio-campo', 'maestria', 'camisa 10', 'visão de jogo', 'gerson', 'passe', 'ritmo', 'armador', 'rodrigo garro'],
    description: 'Armador clássico dominando o círculo central com visão panorâmica e passes verticais',
    dominantMood: 'tático'
  },
  {
    id: 'art-winger-sprint-1',
    url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['velocidade', 'luiz henrique', 'ponta', 'explosão', 'arrancada', 'linha de fundo', 'cruzamento', 'chuteira'],
    description: 'Extremo veloz em transição ofensiva fulminante cravando a chuteira no gramado',
    dominantMood: 'drible'
  },
  {
    id: 'art-defender-tackle-1',
    url: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['zagueiro', 'desarme', 'defesa', 'solidez', 'raça', 'combate', 'bloqueio', 'muralha', 'segurança', 'dividida'],
    description: 'Carrinho milimétrico e desarme limpo na entrada da grande área em clássico quente',
    dominantMood: 'tático'
  },
  {
    id: 'art-striker-focus-3',
    url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['concentração', 'camisa 9', 'foco', 'pênalti', 'decisão', 'artilheiro', 'marca da cal', 'pressão', 'gol de pênalti'],
    description: 'Cobrança magistral de pênalti na marca da cal estufando a bochecha da rede',
    dominantMood: 'celebração'
  },
  {
    id: 'art-striker-pedro-header',
    url: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['faro de gol', 'cabeceio', 'pedro', 'área', 'camisa 9', 'artilharia', 'segundo pau', 'infiltração', 'disputa no alto'],
    description: 'Finalização de cabeça letal no coração da grande área dividindo com zagueiros',
    dominantMood: 'celebração'
  },
  {
    id: 'art-wonderkid-sprint-endrick',
    url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['endrick', 'estevao', 'joia', 'sprint', 'potência', 'velocidade', 'garotada', 'arrancada', 'contra-ataque'],
    description: 'Explosão muscular da nova geração de joias rumo ao ataque fulminante no gramado',
    dominantMood: 'drible'
  },
  {
    id: 'art-midfield-general-gerson',
    url: 'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['coringa', 'gerson', 'construção', 'cadência', 'meio-campo', 'maestria', 'leitura', 'estádio', 'bola'],
    description: 'A pelota em jogo no gramado sob a atmosfera majestosa da arena de futebol',
    dominantMood: 'tático'
  },
  {
    id: 'art-cleats-penalty-spot',
    url: 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['pênalti', 'chuteira', 'marca da cal', 'tensão', 'decisão', 'frio', 'cobrador', 'grama verde'],
    description: 'Chuteiras profissionais cravadas no gramado verde no instante supremo da decisão',
    dominantMood: 'tático'
  },
  {
    id: 'art-ball-wet-turf-reflection',
    url: 'https://images.unsplash.com/photo-1524015368236-bbf6f72545b6?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['bola oficial', 'chuva', 'reflexos', 'gramado molhado', 'noite', 'precisão', 'luzes'],
    description: 'A bola de futebol no gramado encharcado refletindo a luz potente dos refletores da arena',
    dominantMood: 'estádio'
  },
  {
    id: 'art-goalkeeper-miracle-save',
    url: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['goleiro', 'defesaça', 'milagre', 'muralha', 'alisson', 'ederson', 'bento', 'espalma', 'salvação'],
    description: 'Salvação espetacular do arqueiro no ângulo impedindo o gol do adversário',
    dominantMood: 'tático'
  },
  {
    id: 'art-net-bulging-explosion',
    url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['gol', 'bola na rede', 'golaço', 'bomba', 'explosão', 'artilheiro', 'estufar', 'rede balançando'],
    description: 'A bola balançando o fundo da rede no instante mágico do gol decisivo',
    dominantMood: 'celebração'
  },
  {
    id: 'art-crossbar-topcorner-goal',
    url: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['golaço de falta', 'memphis depay', 'gaveta', 'ângulo', 'trave', 'bola na rede'],
    description: 'Cobrança de falta magistral no ângulo estufando a rede do gol',
    dominantMood: 'celebração'
  },
  {
    id: 'art-sprint-breakaway-flank',
    url: 'https://images.unsplash.com/photo-1536122985607-4fe00b283652?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['arrancada', 'contra-ataque', 'transição', 'velocidade', 'rompimento', 'ponta', 'ala'],
    description: 'Arrancada vertical furando o bloqueio da linha média com aceleração no gramado',
    dominantMood: 'drible'
  },
  {
    id: 'art-corner-flag-cross',
    url: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=1200&q=80',
    category: 'Jogadores',
    tags: ['escanteio', 'bandeirinha', 'bola parada', 'cruzamento', 'área cheia', 'grama'],
    description: 'Bandeirinha de escanteio e a bola posicionada para cruzamento decisivo na área',
    dominantMood: 'tático'
  },

  // --- EQUIPE TÉCNICA, TREINADORES E PRANCHETAS TÁTICAS NO GRAMADO ---
  {
    id: 'coach-sideline-gesturing-1',
    url: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80',
    category: 'Equipe Técnica',
    tags: ['abel ferreira', 'técnico', 'beira do gramado', 'gesto', 'orientação', 'intensidade', 'comando', 'área técnica'],
    description: 'Treinador à beira do gramado orientando o posicionamento das linhas com gestos firmes',
    dominantMood: 'tático',
    clubAffinity: 'palmeiras'
  },
  {
    id: 'coach-team-huddle-pitch',
    url: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
    category: 'Equipe Técnica',
    tags: ['preleção no gramado', 'roda de jogadores', 'união', 'filipe luís', 'artur jorge', 'tática'],
    description: 'Comissão técnica e elenco unidos em roda no gramado antes de subir ao jogo',
    dominantMood: 'tático'
  },
  {
    id: 'coach-tactical-pitch-lines',
    url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
    category: 'Equipe Técnica',
    tags: ['marcação', 'linhas táticas', 'esquema', 'organização', 'bloco alto', 'compactação'],
    description: 'A demarcação do campo de jogo traduzindo a ocupação de espaços e disciplina tática',
    dominantMood: 'tático'
  },
  {
    id: 'coach-referee-tactical-duel',
    url: 'https://images.unsplash.com/photo-1517747614396-d21a78b850e8?auto=format&fit=crop&w=1200&q=80',
    category: 'Equipe Técnica',
    tags: ['dorival júnior', 'arbitragem', 'apito', 'volantes', 'meio-campo', 'ajuste tático'],
    description: 'Juiz de futebol e atletas no centro do gramado em momento de alinhamento tático',
    dominantMood: 'tático',
    clubAffinity: 'selecao'
  },
  {
    id: 'coach-tunnel-entrance-focus',
    url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    category: 'Equipe Técnica',
    tags: ['luis zubeldia', 'túnel', 'vestiário', 'concentração', 'subida ao campo', 'são paulo'],
    description: 'Visão do túnel de acesso ao gramado lotado com o treinador liderando a subida da equipe',
    dominantMood: 'tático',
    clubAffinity: 'saopaulo'
  },
  {
    id: 'coach-stadium-bench-view',
    url: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1200&q=80',
    category: 'Equipe Técnica',
    tags: ['vojvoda', 'fortaleza', 'banco de reservas', 'gestão', '200 jogos', 'estabilidade'],
    description: 'A imponente visão das arquibancadas a partir do banco de reservas da comissão técnica',
    dominantMood: 'tático',
    clubAffinity: 'fortaleza'
  },

  // --- CLUBES SÉRIE A: CLÁSSICOS, ESTÁDIOS & RIVALIDADES ---
  {
    id: 'cla-maracana-crowd-flamengo',
    url: 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie A',
    tags: ['flamengo', 'maracanã', 'palmeiras', 'clássico', 'multidão', 'maraca', 'liderança', 'torcida'],
    description: 'O Maracanã em ebulição com mais de 65 mil torcedores cantando e empurrando o time',
    dominantMood: 'estádio',
    clubAffinity: 'flamengo'
  },
  {
    id: 'cla-morumbi-lights-saopaulo',
    url: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie A',
    tags: ['são paulo', 'morumbi', 'morumbis', 'tricolor', 'caldeirão', 'lucas moura', 'gols'],
    description: 'O colosso de concreto do Morumbi iluminado sob a noite de rodada do Brasileirão',
    dominantMood: 'estádio',
    clubAffinity: 'saopaulo'
  },
  {
    id: 'cla-corinthians-arena-night',
    url: 'https://images.unsplash.com/photo-1486286701208-1d58e9338013?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie A',
    tags: ['corinthians', 'neo química arena', 'fiel', 'itaquera', 'timão', 'rodrigo garro', 'vasco'],
    description: 'A iluminação noturna cortando o gramado em duelo eletrizante de Série A',
    dominantMood: 'estádio',
    clubAffinity: 'corinthians'
  },
  {
    id: 'cla-mineirao-cruzeiro-night',
    url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie A',
    tags: ['cruzeiro', 'mineirão', 'raposa', 'celeste', 'belo horizonte', 'gramado', 'refletores'],
    description: 'O gramado do Mineirão banhado por luzes e a atmosfera vibrante da torcida celeste',
    dominantMood: 'estádio',
    clubAffinity: 'cruzeiro'
  },
  {
    id: 'cla-arenamrv-atleticomg-derby',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie A',
    tags: ['atlético-mg', 'arena mrv', 'galo', 'massa', 'hulk', 'clássico mineiro', 'cruzeiro'],
    description: 'A vibração apaixonada da arquibancada comemorando gol histórico no clássico',
    dominantMood: 'estádio',
    clubAffinity: 'atleticomg'
  },
  {
    id: 'cla-botafogo-nilton-santos',
    url: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie A',
    tags: ['botafogo', 'luiz henrique', 'artur jorge', 'glorioso', 'fonte nova', 'bahia', 'liderança'],
    description: 'Chuteira e bola de futebol na arrancada rápida em vitória maiúscula do Botafogo',
    dominantMood: 'drible',
    clubAffinity: 'botafogo'
  },

  // --- CLUBES SÉRIE B: CALDEIRÕES, VILA BELMIRO, ACESSO & TRADIÇÃO ---
  {
    id: 'clb-vilabelmiro-santos-peixe',
    url: 'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie B',
    tags: ['santos', 'vila belmiro', 'peixe', 'alçapão', 'acesso', 'torcida alvinegra'],
    description: 'A mística da Vila Belmiro com as arquibancadas fervendo na vitória pelo acesso',
    dominantMood: 'estádio',
    clubAffinity: 'santos'
  },
  {
    id: 'clb-castelao-ceara-multidao',
    url: 'https://images.unsplash.com/photo-1568194157720-8bbe7114ebe8?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie B',
    tags: ['ceará', 'castelão', 'vozao', '55 mil', 'multidão', 'acesso', 'alvinegro'],
    description: 'Mais de 50 mil torcedores transformando a arena em um mar preto e branco',
    dominantMood: 'estádio',
    clubAffinity: 'ceara'
  },
  {
    id: 'clb-novorizontino-tatico-gramado',
    url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie B',
    tags: ['novorizontino', 'sport', 'ilha do retiro', 'interior', 'g4', 'liderança', 'organização'],
    description: 'A rigorosa disciplina tática e ocupação do gramado na vitória fora de casa',
    dominantMood: 'tático',
    clubAffinity: 'sport'
  },
  {
    id: 'clb-vilanova-catarse-final',
    url: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie B',
    tags: ['vila nova', 'oba', 'paysandu', '49 do segundo tempo', 'catarse', 'virada', 'gol no fim'],
    description: 'A bola balançando a rede nos acréscimos desencadeando a catarse da vitória',
    dominantMood: 'celebração'
  },
  {
    id: 'clb-operario-cerrado-turf',
    url: 'https://images.unsplash.com/photo-1524015368236-bbf6f72545b6?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie B',
    tags: ['operário-pr', 'goiás', 'serrinha', 'batalha', 'acesso', 'bola no gramado'],
    description: 'A bola de futebol no gramado sob a noite de duelo decisivo no Centro-Oeste',
    dominantMood: 'estádio'
  },
  {
    id: 'clb-derby-campinas-brinco',
    url: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=1200&q=80',
    category: 'Clubes Serie B',
    tags: ['guarani', 'ponte preta', 'dérbi campineiro', 'brinco de ouro', 'rivalidade', 'tensão'],
    description: 'O calor da rivalidade centenária e a disputa tensa em cada metro do campo',
    dominantMood: 'tático'
  },

  // --- SELEÇÃO BRASILEIRA: ELIMINATÓRIAS & CAMISA CANARINHO ---
  {
    id: 'sel-fonte-nova-vini-show',
    url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    category: 'Seleção Brasileira',
    tags: ['seleção brasileira', 'fonte nova', 'vini jr', 'uruguai', 'eliminatórias', 'drible', 'gols'],
    description: 'Vinicius Júnior desequilibrando em velocidade com a bola colada ao pé na Fonte Nova',
    dominantMood: 'drible',
    clubAffinity: 'selecao'
  },
  {
    id: 'sel-barranquilla-tactics-colombia',
    url: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
    category: 'Seleção Brasileira',
    tags: ['seleção brasileira', 'colômbia', 'barranquilla', 'meio-campo', 'passe', 'aula tática'],
    description: 'Meio-campo da Seleção dita o ritmo da vitória histórica sobre a Colômbia',
    dominantMood: 'tático',
    clubAffinity: 'selecao'
  },
  {
    id: 'sel-maracana-chile-goleada',
    url: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80',
    category: 'Seleção Brasileira',
    tags: ['seleção brasileira', 'chile', 'maracanã', 'luiz henrique', 'estêvão', 'goleada', 'velocidade'],
    description: 'Arrancada avassaladora dos pontas da Seleção rompendo a zaga chilena',
    dominantMood: 'drible',
    clubAffinity: 'selecao'
  },
  {
    id: 'sel-maracana-argentina-classico',
    url: 'https://images.unsplash.com/photo-1553778263-73a83bab9b0c?auto=format&fit=crop&w=1200&q=80',
    category: 'Seleção Brasileira',
    tags: ['seleção brasileira', 'argentina', 'maracanã', 'superclássico', 'raça', 'defesa', 'duelo'],
    description: 'Disputa feroz e lealdade na dividida do Superclássico das Américas no Maracanã',
    dominantMood: 'tático',
    clubAffinity: 'selecao'
  },
  {
    id: 'sel-peru-hat-trick-striker',
    url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80',
    category: 'Seleção Brasileira',
    tags: ['seleção brasileira', 'peru', 'camisa 9', 'hat-trick', 'goleada', 'faro de gol'],
    description: 'Explosão do artilheiro celebrando o terceiro gol na goleada canarinho',
    dominantMood: 'celebração',
    clubAffinity: 'selecao'
  },
  {
    id: 'sel-lapaz-altitude-arena',
    url: 'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?auto=format&fit=crop&w=1200&q=80',
    category: 'Seleção Brasileira',
    tags: ['seleção brasileira', 'bolívia', 'la paz', 'altitude', 'vitória épica', 'estádio', 'bola'],
    description: 'A bola de futebol no gramado sob a atmosfera pesada do desafio na altitude',
    dominantMood: 'estádio',
    clubAffinity: 'selecao'
  },

  // --- EVENTOS: LIBERTADORES, COPA DO BRASIL, MUNDIAL DE CLUBES & COPA DO MUNDO ---
  {
    id: 'eve-libertadores-pitch-final',
    url: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=1200&q=80',
    category: 'Eventos',
    tags: ['copa libertadores', 'botafogo', 'atlético-mg', 'glória eterna', 'buenos aires', 'final'],
    description: 'O gramado sagrado da final da Copa Libertadores iluminado para a grande decisão',
    dominantMood: 'copa'
  },
  {
    id: 'eve-copadobrasil-trophy-silver',
    url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80',
    category: 'Eventos',
    tags: ['copa do brasil', 'flamengo', 'atlético-mg', 'troféu', 'campeão', '73 milhões', 'decisão'],
    description: 'O troféu reluzente e o clima solene no estádio aguardando o campeão da Copa do Brasil',
    dominantMood: 'copa'
  },
  {
    id: 'eve-super-mundial-aerial-arena',
    url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1200&q=80',
    category: 'Eventos',
    tags: ['super mundial', 'fifa 2025', 'eua', '4 gigantes', 'arena monumental', 'vista aérea'],
    description: 'Visão aérea espetacular da superarena de futebol recebendo o Mundial de Clubes da FIFA',
    dominantMood: 'copa'
  },
  {
    id: 'eve-cruzeiro-sulamericana-assuncao',
    url: 'https://images.unsplash.com/photo-1536122985607-4fe00b283652?auto=format&fit=crop&w=1200&q=80',
    category: 'Eventos',
    tags: ['cruzeiro', 'lanús', 'sul-americana', 'assunção', 'mística celeste', 'final'],
    description: 'Transição ofensiva rápida na noite épica de classificação para a grande final continental',
    dominantMood: 'copa',
    clubAffinity: 'cruzeiro'
  },
  {
    id: 'eve-worldcup-2026-ball-net',
    url: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1200&q=80',
    category: 'Eventos',
    tags: ['copa do mundo', '2026', 'sonho do hexa', 'bola na rede', 'fifa', 'mundial'],
    description: 'A bola de futebol no fundo da rede simbolizando a busca pela glória máxima do Hexa',
    dominantMood: 'copa'
  },
  {
    id: 'eve-brasileirao-crowd-fever',
    url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=1200&q=80',
    category: 'Eventos',
    tags: ['brasileirão', 'recorde de público', '35 mil', 'arquibancada', 'massa', 'festa'],
    description: 'A torcida brasileira em festa nas arquibancadas comemorando a média histórica de público',
    dominantMood: 'estádio'
  }
];
