/**
 * CampoBR - Serviço da Planilha & Fila Editorial (Fonte Viva de Conhecimento)
 * 
 * "Crie uma planilha que funciona como fila editorial.
 * Crie abas Pautas, Fontes, Revisão e Publicado.
 * Em Pautas, use colunas como id, tema, categoria, tipo de conteúdo, status, risco, fontes,
 * responsável pela revisão e data prevista.
 * Os status podem ser: nova, pesquisando, rascunho, revisão, aprovada, publicada e rejeitada.
 * Essa planilha será usada como uma fonte de conhecimento, atualizada a cada criação
 * e sempre consultada para manter um padrão de produção de matérias."
 */

import { collection, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db, isOnlineFirebase } from './firebase';
import { EditorialPauta, PautaStatus, PautaRisk, CitedSource, FootballCategory, EditorialContentType, Post } from '../types';
import { formatCurrentBRTTime } from './intelligentResearchRobot';

export const LOCAL_STORAGE_KEY_EDITORIAL_QUEUE = 'campobr_editorial_queue_v1';
export const FIRESTORE_EDITORIAL_QUEUE_COLLECTION = 'editorial_queue';

/**
 * Pautas Iniciais Pré-carregadas para Estabelecer o Padrão Editorial
 */
export const INITIAL_EDITORIAL_PAUTAS: EditorialPauta[] = [
  {
    id: 'pauta-2026-001',
    tema: 'O Impacto de Estêvão e das Novas Jóias na Dinâmica Ofensiva do Futebol Brasileiro',
    categoria: 'Jogadores',
    tipoConteudo: 'analise-tatica',
    status: 'publicada',
    risco: 'Baixo',
    fontes: [
      {
        id: 'src-001',
        title: 'CBF - Súmulas Oficiais e Relatório Técnico da Série A',
        url: 'https://www.cbf.com.br/futebol-brasileiro/competicoes',
        domain: 'cbf.com.br',
        claimSustained: 'Média de 4.8 dribles certos por jogo e liderança em participações diretas em gols.',
        accessedAt: '24/10/2026 09:15:00 BRT',
        isVerified: true,
        sourceType: 'organizacao_torneio',
      },
      {
        id: 'src-002',
        title: 'ge.globo - Análise Tática dos Pontas do Brasileirão',
        url: 'https://ge.globo.com/futebol/',
        domain: 'ge.globo.com',
        claimSustained: 'Ocupação de meio-espaço e aceleração no mano a mano atraindo dobra de marcação.',
        accessedAt: '24/10/2026 09:16:30 BRT',
        isVerified: true,
        sourceType: 'imprensa_esportiva',
      }
    ],
    responsavelRevisao: 'Carlos Eduardo Matos (Editor-Chefe)',
    dataPrevista: '2026-10-24',
    draftTitle: 'A Ascensão Meteórica de Estêvão: Maturidade Tática e o Drible que Desequilibra o Futebol Nacional',
    claimsSupported: [
      { claim: 'Volume de dribles de elite internacional no campeonato.', sourceTitle: 'CBF', sourceUrl: 'https://www.cbf.com.br' }
    ],
    editorialChecklist: {
      noFalseClaimsInShortText: true,
      noInventedLabTestsOrSamples: true,
      sourcesForVerifiableClaims: true,
      internalLinksVerified: true,
      specsSeparatedFromOpinion: true,
      affiliatesCompliantNoFakeAsin: true,
    },
    createdAt: '2026-10-23T14:00:00Z',
    updatedAt: '2026-10-24T09:20:00Z',
    publishedPostId: 'art-jog-1',
    publishedAt: '2026-10-24T09:30:00Z',
    iveScore: 88,
  },
  {
    id: 'pauta-2026-002',
    tema: 'A Metodologia Posicional de Filipe Luís e a Ocupação de Entrelinhas no Flamengo',
    categoria: 'Equipe Técnica',
    tipoConteudo: 'analise-tatica',
    status: 'aprovada',
    risco: 'Baixo',
    fontes: [
      {
        id: 'src-003',
        title: 'Flamengo Oficial - Entrevista Coletiva no Ninho do Urubu',
        url: 'https://www.flamengo.com.br/noticias/futebol',
        domain: 'flamengo.com.br',
        claimSustained: 'Declarações oficiais sobre desenho tático em 3-2-5 na fase de construção ofensiva.',
        accessedAt: '24/10/2026 10:05:00 BRT',
        isVerified: true,
        sourceType: 'comunicado_oficial',
      }
    ],
    responsavelRevisao: 'Mariana Guimarães (Analista Tática)',
    dataPrevista: '2026-10-25',
    draftTitle: 'Fluidez, Espaço e Intensidade: Como Filipe Luís Implanta a Metodologia Posicional',
    editorialChecklist: {
      noFalseClaimsInShortText: true,
      noInventedLabTestsOrSamples: true,
      sourcesForVerifiableClaims: true,
      internalLinksVerified: true,
      specsSeparatedFromOpinion: true,
      affiliatesCompliantNoFakeAsin: true,
    },
    createdAt: '2026-10-24T10:00:00Z',
    updatedAt: '2026-10-24T10:30:00Z',
    iveScore: 92,
  },
  {
    id: 'pauta-2026-003',
    tema: 'Guia do Super Mundial de Clubes FIFA 2025: Logística e Preparo dos 4 Gigantes Brasileiros',
    categoria: 'Eventos',
    tipoConteudo: 'calendario-guia',
    status: 'revisao',
    risco: 'Médio',
    fontes: [
      {
        id: 'src-004',
        title: 'FIFA Official - Regulations and Dates of FIFA Club World Cup 2025',
        url: 'https://www.fifa.com/tournaments/mens/club-world-cup/2025',
        domain: 'fifa.com',
        claimSustained: 'Confirmação do formato de 32 clubes e sedes oficiais nos Estados Unidos.',
        accessedAt: '24/10/2026 10:45:00 BRT',
        isVerified: true,
        sourceType: 'organizacao_torneio',
      }
    ],
    responsavelRevisao: 'Roberto Vianna (Repórter Internacional)',
    dataPrevista: '2026-10-26',
    draftTitle: 'O Brasil no Centro do Mundo: O Preparo dos Gigantes Nacionais para o Super Mundial FIFA',
    unverifiedNotes: 'Aguardando publicação do regulamento final de premiação individual por fase.',
    editorialChecklist: {
      noFalseClaimsInShortText: true,
      noInventedLabTestsOrSamples: true,
      sourcesForVerifiableClaims: true,
      internalLinksVerified: false,
      specsSeparatedFromOpinion: true,
      affiliatesCompliantNoFakeAsin: true,
    },
    createdAt: '2026-10-24T10:40:00Z',
    updatedAt: '2026-10-24T11:00:00Z',
    iveScore: 84,
  },
  {
    id: 'pauta-2026-004',
    tema: 'A Batalha pelo Acesso na Série B: A Mística da Vila Belmiro e a Regularidade do Santos',
    categoria: 'Clubes Serie B',
    tipoConteudo: 'noticia-contexto',
    status: 'rascunho',
    risco: 'Baixo',
    fontes: [
      {
        id: 'src-005',
        title: 'Santos FC Oficial - Boletim de Treinamentos e Departamento Médico',
        url: 'https://www.santosfc.com.br/noticias',
        domain: 'santosfc.com.br',
        claimSustained: 'Aproveitamento de mais de 80% nos pontos disputados na Vila Belmiro.',
        accessedAt: '24/10/2026 11:15:00 BRT',
        isVerified: true,
        sourceType: 'comunicado_oficial',
      }
    ],
    responsavelRevisao: 'Gabriel Faria (Setorista Série B)',
    dataPrevista: '2026-10-27',
    draftTitle: 'O Renascimento Alvinegro na Vila Belmiro: A Luta Ponto a Ponto pelo Retorno',
    createdAt: '2026-10-24T11:10:00Z',
    updatedAt: '2026-10-24T11:20:00Z',
  },
  {
    id: 'pauta-2026-005',
    tema: 'O Choque de Titãs: Palmeiras x Botafogo e a Disputa Centímetro a Centímetro pelo Título da Série A',
    categoria: 'Clubes Serie A',
    tipoConteudo: 'noticia-contexto',
    status: 'pesquisando',
    risco: 'Médio',
    fontes: [],
    responsavelRevisao: 'Carlos Eduardo Matos (Editor-Chefe)',
    dataPrevista: '2026-10-28',
    createdAt: '2026-10-24T11:30:00Z',
    updatedAt: '2026-10-24T11:30:00Z',
  },
  {
    id: 'pauta-2026-006',
    tema: 'A Nova Trinca do Meio-Campo da Seleção Brasileira com Dorival Júnior',
    categoria: 'Seleção Brasileira',
    tipoConteudo: 'analise-tatica',
    status: 'nova',
    risco: 'Baixo',
    fontes: [],
    responsavelRevisao: 'Mariana Guimarães (Analista Tática)',
    dataPrevista: '2026-10-29',
    createdAt: '2026-10-24T11:45:00Z',
    updatedAt: '2026-10-24T11:45:00Z',
  }
];

export class EditorialQueueService {
  private cache: EditorialPauta[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): EditorialPauta[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_EDITORIAL_QUEUE);
      if (stored) {
        this.cache = JSON.parse(stored);
        return this.cache;
      }
    } catch {
      // Fallback
    }
    this.cache = [...INITIAL_EDITORIAL_PAUTAS];
    this.saveToStorage(this.cache);
    return this.cache;
  }

  private saveToStorage(pautas: EditorialPauta[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_EDITORIAL_QUEUE, JSON.stringify(pautas));
    } catch (e) {
      console.warn('Erro ao salvar fila editorial localmente:', e);
    }
  }

  /**
   * Obtém todas as pautas da planilha editorial
   */
  async getAllPautas(): Promise<EditorialPauta[]> {
    if (isOnlineFirebase() && db) {
      try {
        const snap = await getDocs(collection(db, FIRESTORE_EDITORIAL_QUEUE_COLLECTION));
        if (!snap.empty) {
          const cloudPautas = snap.docs.map(d => ({
            id: d.id,
            ...(d.data() as Omit<EditorialPauta, 'id'>),
          }));
          this.cache = cloudPautas;
          this.saveToStorage(cloudPautas);
          return cloudPautas;
        }
      } catch (err) {
        console.warn('CampoBR: Leitura da fila editorial no Firestore via fallback:', err);
      }
    }
    return this.loadFromStorage();
  }

  /**
   * Cria uma nova pauta na planilha
   */
  async createPauta(data: Partial<EditorialPauta> & { tema: string; categoria: FootballCategory }): Promise<EditorialPauta> {
    const now = new Date();
    const newId = `pauta-${now.getFullYear()}-${String(this.cache.length + 1).padStart(3, '0')}-${Date.now().toString(36)}`;
    
    const newPauta: EditorialPauta = {
      id: newId,
      tema: data.tema.trim(),
      categoria: data.categoria,
      tipoConteudo: data.tipoConteudo || 'noticia-contexto',
      status: data.status || 'nova',
      risco: data.risco || 'Baixo',
      fontes: data.fontes || [],
      responsavelRevisao: data.responsavelRevisao || 'Editor de Plantão',
      dataPrevista: data.dataPrevista || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      claimsSupported: data.claimsSupported || [],
      unverifiedNotes: data.unverifiedNotes || '',
      editorialChecklist: data.editorialChecklist || {
        noFalseClaimsInShortText: false,
        noInventedLabTestsOrSamples: false,
        sourcesForVerifiableClaims: false,
        internalLinksVerified: false,
        specsSeparatedFromOpinion: false,
        affiliatesCompliantNoFakeAsin: false,
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.cache.unshift(newPauta);
    this.saveToStorage(this.cache);

    if (isOnlineFirebase() && db) {
      setDoc(doc(db, FIRESTORE_EDITORIAL_QUEUE_COLLECTION, newId), newPauta).catch(e => {
        console.warn('Sync pauta Firestore:', e);
      });
    }

    return newPauta;
  }

  /**
   * Atualiza uma pauta existente
   */
  async updatePauta(id: string, updates: Partial<EditorialPauta>): Promise<EditorialPauta | null> {
    const idx = this.cache.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const updated: EditorialPauta = {
      ...this.cache[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.cache[idx] = updated;
    this.saveToStorage(this.cache);

    if (isOnlineFirebase() && db) {
      updateDoc(doc(db, FIRESTORE_EDITORIAL_QUEUE_COLLECTION, id), updates).catch(e => {
        console.warn('Update pauta Firestore:', e);
      });
    }

    return updated;
  }

  /**
   * Registra fontes adicionadas a uma pauta
   */
  async addSourcesToPauta(pautaId: string, newSources: CitedSource[]): Promise<EditorialPauta | null> {
    const pauta = this.cache.find(p => p.id === pautaId);
    if (!pauta) return null;

    const mergedSources = [...pauta.fontes];
    for (const src of newSources) {
      if (!mergedSources.some(s => s.url === src.url)) {
        mergedSources.push(src);
      }
    }

    const claims = mergedSources.map(s => ({
      claim: s.claimSustained,
      sourceTitle: s.title,
      sourceUrl: s.url,
    }));

    return this.updatePauta(pautaId, {
      fontes: mergedSources,
      claimsSupported: claims,
      status: pauta.status === 'nova' ? 'pesquisando' : pauta.status,
    });
  }

  /**
   * Consulta a base de conhecimento de pautas para evitar repetições
   * e manter padrão consistente de ângulos editoriais
   */
  findSimilarPautas(topicOrTitle: string): EditorialPauta[] {
    const clean = topicOrTitle.toLowerCase().trim();
    return this.cache.filter(p => {
      const pTema = p.tema.toLowerCase();
      const pDraft = (p.draftTitle || '').toLowerCase();
      return pTema.includes(clean) || clean.includes(pTema) || (pDraft && (pDraft.includes(clean) || clean.includes(pDraft)));
    });
  }

  /**
   * Retorna todas as fontes citadas registradas em toda a história da redação
   */
  getAllRegisteredSources(): { pautaTema: string; pautaId: string; source: CitedSource }[] {
    const result: { pautaTema: string; pautaId: string; source: CitedSource }[] = [];
    this.cache.forEach(p => {
      p.fontes.forEach(s => {
        result.push({
          pautaTema: p.tema,
          pautaId: p.id,
          source: s,
        });
      });
    });
    return result;
  }
}

export const editorialQueueService = new EditorialQueueService();
