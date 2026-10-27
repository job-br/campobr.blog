import React, { useState, useEffect } from 'react';
import { 
  Table, 
  FileText, 
  Link2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Bot, 
  RefreshCw, 
  Check, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Send, 
  BarChart3, 
  Compass, 
  Eye, 
  Users, 
  Share2, 
  BookOpen, 
  Flame,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  EditorialPauta, 
  PautaStatus, 
  PautaRisk, 
  CitedSource, 
  FootballCategory, 
  EditorialContentType, 
  Post 
} from '../types';
import { editorialQueueService } from '../services/editorialQueueService';
import { 
  researchTopicWithGrounding, 
  draftArticleWithGroundedResearch, 
  GroundedResearchResult 
} from '../services/intelligentResearchRobot';
import { valueAnalyticsService, EditorialValueMetrics } from '../services/valueAnalyticsService';

interface EditorialSpreadsheetQueueProps {
  existingPosts: Post[];
  onOpenDraftInEditor?: (draft: { title: string; summary: string; content: string; category: FootballCategory; tags: string[]; sources: CitedSource[] }) => void;
  onPostPublished?: (post: Post) => void;
}

export const EditorialSpreadsheetQueue: React.FC<EditorialSpreadsheetQueueProps> = ({
  existingPosts,
  onOpenDraftInEditor,
}) => {
  const [activeTab, setActiveTab] = useState<'pautas' | 'fontes' | 'revisao' | 'publicado'>('pautas');
  const [pautas, setPautas] = useState<EditorialPauta[]>([]);
  const [selectedPauta, setSelectedPauta] = useState<EditorialPauta | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Modal de Criação de Pauta
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTema, setNewTema] = useState('');
  const [newCategoria, setNewCategoria] = useState<FootballCategory>('Clubes Serie A');
  const [newTipo, setNewTipo] = useState<EditorialContentType>('noticia-contexto');
  const [newRisco, setNewRisco] = useState<PautaRisk>('Baixo');
  const [newResponsavel, setNewResponsavel] = useState('Redação CampoBR');
  const [newDataPrevista, setNewDataPrevista] = useState(new Date().toISOString().split('T')[0]);

  // Loading States
  const [isResearchingId, setIsResearchingId] = useState<string | null>(null);
  const [researchNotice, setResearchNotice] = useState<string | null>(null);

  // Carrega pautas ao iniciar
  useEffect(() => {
    loadPautas();
  }, []);

  const loadPautas = async () => {
    const list = await editorialQueueService.getAllPautas();
    setPautas(list);
    if (!selectedPauta && list.length > 0) {
      setSelectedPauta(list[0]);
    }
  };

  const handleCreatePauta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTema.trim()) return;

    const created = await editorialQueueService.createPauta({
      tema: newTema,
      categoria: newCategoria,
      tipoConteudo: newTipo,
      risco: newRisco,
      responsavelRevisao: newResponsavel,
      dataPrevista: newDataPrevista,
      status: 'nova',
      fontes: [],
    });

    setPautas([created, ...pautas]);
    setSelectedPauta(created);
    setNewTema('');
    setIsCreateModalOpen(false);
  };

  const handleUpdateStatus = async (pautaId: string, status: PautaStatus) => {
    const updated = await editorialQueueService.updatePauta(pautaId, { status });
    if (updated) {
      setPautas(pautas.map(p => p.id === pautaId ? updated : p));
      if (selectedPauta?.id === pautaId) {
        setSelectedPauta(updated);
      }
    }
  };

  // EXECUTA PESQUISA PRÉVIA COM GROUNDING (GOOGLE SEARCH)
  const handleTriggerGroundingResearch = async (pauta: EditorialPauta) => {
    setIsResearchingId(pauta.id);
    setResearchNotice(`Pesquisando fontes recentes sobre "${pauta.tema}" via Google Search Grounding...`);

    try {
      const research = await researchTopicWithGrounding(
        pauta.tema,
        pauta.categoria,
        pauta.tipoConteudo,
        existingPosts
      );

      const updated = await editorialQueueService.updatePauta(pauta.id, {
        status: 'rascunho',
        fontes: research.sources,
        claimsSupported: research.claimsSupported,
        unverifiedNotes: research.unverifiedClaims.join('; '),
        risco: research.riskLevel,
      });

      if (updated) {
        setPautas(pautas.map(p => p.id === pauta.id ? updated : p));
        setSelectedPauta(updated);
      }

      setResearchNotice(`Pesquisa concluída com sucesso! ${research.sources.length} fontes verificadas registradas com carimbo de horário.`);
    } catch (err) {
      console.error(err);
      setResearchNotice('Erro ao consultar Grounding. Tente novamente.');
    } finally {
      setIsResearchingId(null);
      setTimeout(() => setResearchNotice(null), 5000);
    }
  };

  // REDIGE RASCUNHO A PARTIR DA PESQUISA COM FONTES CITADAS PRESERVADAS
  const handleDraftFromResearch = async (pauta: EditorialPauta) => {
    setIsResearchingId(pauta.id);
    setResearchNotice(`Redigindo matéria factual com base nas fontes e Grounding...`);

    try {
      const researchMock: GroundedResearchResult = {
        topic: pauta.tema,
        category: pauta.categoria,
        contentType: pauta.tipoConteudo,
        queryTimeIso: pauta.createdAt,
        queryTimeFormattedBRT: pauta.fontes[0]?.accessedAt || new Date().toLocaleString('pt-BR'),
        sources: pauta.fontes,
        claimsSupported: pauta.claimsSupported || [],
        unverifiedClaims: pauta.unverifiedNotes ? [pauta.unverifiedNotes] : [],
        keyFacts: [pauta.tema],
        officialQuotes: [],
        suggestedFaq: [],
        riskLevel: pauta.risco,
        searchQueriesUsed: [pauta.tema],
        editorialVerificationNotes: 'Pauta checada com Grounding.',
      };

      const draft = await draftArticleWithGroundedResearch(researchMock, existingPosts);

      const updated = await editorialQueueService.updatePauta(pauta.id, {
        status: 'revisao',
        draftTitle: draft.title,
        draftPostId: `post-${Date.now().toString(36)}`,
      });

      if (updated) {
        setPautas(pautas.map(p => p.id === pauta.id ? updated : p));
        setSelectedPauta(updated);
      }

      if (onOpenDraftInEditor) {
        onOpenDraftInEditor({
          title: draft.title,
          summary: draft.summary,
          content: draft.content,
          category: draft.category,
          tags: draft.tags,
          sources: draft.sources,
        });
      }

      setResearchNotice(`Rascunho gerado e enviado para a aba de Revisão!`);
    } catch (err) {
      console.error(err);
      setResearchNotice('Falha ao gerar rascunho.');
    } finally {
      setIsResearchingId(null);
      setTimeout(() => setResearchNotice(null), 4000);
    }
  };

  // FILTRO DAS PAUTAS
  const filteredPautas = pautas.filter(p => {
    const matchesSearch = p.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.responsavelRevisao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'todas' || p.categoria === categoryFilter;
    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  // FONTES CADASTRADAS PARA A ABA 'FONTES'
  const allRegisteredSources = editorialQueueService.getAllRegisteredSources();

  // MÉTRICAS DE VALOR PARA A ABA 'PUBLICADO'
  const publishedMetrics = valueAnalyticsService.getAllMetrics();

  const getStatusBadge = (status: PautaStatus) => {
    switch (status) {
      case 'nova':
        return <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">Nova</span>;
      case 'pesquisando':
        return <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-bold border border-cyan-700 flex items-center gap-1"><RefreshCw className="w-2.5 h-2.5 animate-spin" /> Pesquisando</span>;
      case 'rascunho':
        return <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-700">Rascunho</span>;
      case 'revisao':
        return <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold border border-amber-600">Em Revisão</span>;
      case 'aprovada':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-600">Aprovada</span>;
      case 'publicada':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">Publicada</span>;
      case 'rejeitada':
        return <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 text-[10px] font-bold border border-rose-700">Rejeitada</span>;
    }
  };

  const getRiskBadge = (risco: PautaRisk) => {
    switch (risco) {
      case 'Baixo':
        return <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold text-[10px] border border-emerald-800">Baixo</span>;
      case 'Médio':
        return <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold text-[10px] border border-amber-800">Médio</span>;
      case 'Alto':
        return <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold text-[10px] border border-rose-800 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Alto</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Identidade Editorial */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40 flex items-center gap-1">
                <Bot className="w-3 h-3" /> Robô Inteligente de Pesquisa com Grounding
              </span>
              <span className="text-xs text-slate-400">• Fila Editorial & Base de Conhecimento</span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white">
              Planilha de Gestão Editorial & Checagem Factual
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
              Pesquise antes de redigir. Para fatos recentes, utilize Grounding com Google Search.
              Fontes citadas, horários de consulta e afirmações verificadas ficam preservados em cada rascunho.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0 self-start md:self-center"
          >
            <Plus className="w-4 h-4" /> Nova Pauta
          </button>
        </div>

        {researchNotice && (
          <div className="mt-3 p-3 rounded-xl bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 animate-spin" />
            <span>{researchNotice}</span>
          </div>
        )}
      </div>

      {/* Navegação entre as 4 Abas Oficiais da Planilha */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('pautas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'pautas'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>1. Pautas ({pautas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fontes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'fontes'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>2. Fontes ({allRegisteredSources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('revisao')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'revisao'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>3. Revisão Factual ({pautas.filter(p => p.status === 'revisao' || p.status === 'aprovada').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('publicado')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'publicado'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>4. Publicado & Valor ({pautas.filter(p => p.status === 'publicada').length})</span>
        </button>
      </div>

      {/* ABA 1: PAUTAS (Planilha Geral) */}
      {activeTab === 'pautas' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por tema, id ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="todas">Todas Categorias</option>
                <option value="Clubes Serie A">Clubes Serie A</option>
                <option value="Clubes Serie B">Clubes Serie B</option>
                <option value="Seleção Brasileira">Seleção Brasileira</option>
                <option value="Jogadores">Jogadores</option>
                <option value="Equipe Técnica">Equipe Técnica</option>
                <option value="Eventos">Eventos</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="todos">Todos Status</option>
                <option value="nova">Nova</option>
                <option value="pesquisando">Pesquisando</option>
                <option value="rascunho">Rascunho</option>
                <option value="revisao">Revisão</option>
                <option value="aprovada">Aprovada</option>
                <option value="publicada">Publicada</option>
                <option value="rejeitada">Rejeitada</option>
              </select>
            </div>
          </div>

          {/* Tabela de Pautas Estilo Planilha */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">Tema / Foco Jornalístico</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Risco</th>
                    <th className="py-3 px-3">Fontes</th>
                    <th className="py-3 px-3">Revisor</th>
                    <th className="py-3 px-3">Data Prevista</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredPautas.map((pauta) => {
                    const isResearching = isResearchingId === pauta.id;

                    return (
                      <tr 
                        key={pauta.id} 
                        className={`hover:bg-slate-800/40 transition-colors ${selectedPauta?.id === pauta.id ? 'bg-emerald-500/5' : ''}`}
                      >
                        <td className="py-3 px-3 font-mono text-slate-400 text-[11px] font-bold">
                          {pauta.id.split('-').slice(0, 3).join('-')}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white max-w-sm line-clamp-2">
                            {pauta.tema}
                          </div>
                          {pauta.draftTitle && (
                            <span className="text-[10px] text-emerald-400 block truncate">
                              Rascunho: {pauta.draftTitle}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] whitespace-nowrap">
                            {pauta.categoria}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 text-[11px]">
                          {pauta.tipoConteudo}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getStatusBadge(pauta.status)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getRiskBadge(pauta.risco)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {pauta.fontes.length > 0 ? (
                            <span className="text-cyan-400 font-bold flex items-center gap-1">
                              <Link2 className="w-3 h-3" />
                              {pauta.fontes.length} fonte(s)
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">0 fontes</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                          {pauta.responsavelRevisao}
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {pauta.dataPrevista}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap space-x-1.5">
                          {/* Botão de Pesquisa com Grounding */}
                          <button
                            onClick={() => handleTriggerGroundingResearch(pauta)}
                            disabled={isResearching}
                            title="Pesquisar antes de redigir via Google Search Grounding"
                            className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-700/60 font-bold text-[10px] transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                          >
                            <Bot className="w-3 h-3 text-cyan-400" />
                            {isResearching ? 'Pesquisando...' : 'Pesquisar Grounding'}
                          </button>

                          {/* Botão de Gerar Rascunho com Fontes */}
                          {pauta.fontes.length > 0 && (
                            <button
                              onClick={() => handleDraftFromResearch(pauta)}
                              disabled={isResearching}
                              title="Gerar rascunho com fontes citadas vinculadas"
                              className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 font-bold text-[10px] transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <FileText className="w-3 h-3 text-emerald-400" />
                              Gerar Rascunho
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: FONTES (Repositório de Fontes Verificadas & Horário) */}
      {activeTab === 'fontes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-cyan-400" />
              <span>
                <strong>Base de Conhecimento de Fontes:</strong> Todas as URLs citadas pelo Robô Inteligente de Grounding com data/hora oficial e afirmações sustentadas.
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-cyan-900/60 text-cyan-300 font-bold text-[11px] border border-cyan-500/40">
              {allRegisteredSources.length} Fontes Registradas
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Pauta Relacionada</th>
                    <th className="py-3 px-3">Fonte / Veículo</th>
                    <th className="py-3 px-3">URL Oficial</th>
                    <th className="py-3 px-3">Horário da Consulta (BRT)</th>
                    <th className="py-3 px-3">Afirmação que a Fonte Sustenta</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {allRegisteredSources.map(({ pautaTema, source }, idx) => (
                    <tr key={`${source.id}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-white max-w-xs truncate">
                        {pautaTema}
                      </td>
                      <td className="py-3 px-3 text-cyan-300 font-medium whitespace-nowrap">
                        {source.title}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono text-[11px]"
                        >
                          <span>{source.domain}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {source.accessedAt}
                      </td>
                      <td className="py-3 px-3 text-slate-200 max-w-md">
                        {source.claimSustained}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Verificada
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: REVISÃO (Checagem Factual e Auditoria Editorial) */}
      {activeTab === 'revisao' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Diretriz Editorial CampoBR:</strong> Grounding traz informação atual e citações, mas <em>não elimina a necessidade de conferência editorial</em>. Todos os itens abaixo devem ser validados pelo revisor humano antes da publicação.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pautas.filter(p => p.status === 'revisao' || p.status === 'aprovada' || p.status === 'rascunho').map(pauta => (
              <div 
                key={pauta.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(pauta.status)}
                      {getRiskBadge(pauta.risco)}
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{pauta.categoria}</span>
                    </div>
                    <h3 className="font-display font-bold text-base text-white">
                      {pauta.draftTitle || pauta.tema}
                    </h3>
                  </div>
                </div>

                {/* Checklist Obrigatório de Checagem Factual */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wider block">
                    Checklist de Checagem Factual & Diretrizes
                  </span>

                  <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={pauta.editorialChecklist?.noFalseClaimsInShortText ?? true} 
                      className="mt-0.5 rounded text-emerald-500 focus:ring-0" 
                    />
                    <span>Não preenche textos curtos com alegações falsas</span>
                  </label>

                  <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={pauta.editorialChecklist?.noInventedLabTestsOrSamples ?? true} 
                      className="mt-0.5 rounded text-emerald-500 focus:ring-0" 
                    />
                    <span>Não inventa testes de laboratório, instrumentos ou amostras</span>
                  </label>

                  <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={pauta.editorialChecklist?.sourcesForVerifiableClaims ?? true} 
                      className="mt-0.5 rounded text-emerald-500 focus:ring-0" 
                    />
                    <span>Exige fontes para alegações verificáveis ({pauta.fontes.length} vinculadas)</span>
                  </label>

                  <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={pauta.editorialChecklist?.internalLinksVerified ?? true} 
                      className="mt-0.5 rounded text-emerald-500 focus:ring-0" 
                    />
                    <span>Inclui links para até três artigos relacionados da mesma categoria</span>
                  </label>

                  <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox" 
                      defaultChecked={pauta.editorialChecklist?.specsSeparatedFromOpinion ?? true} 
                      className="mt-0.5 rounded text-emerald-500 focus:ring-0" 
                    />
                    <span>Separa especificação de produto, observação editorial e dado não verificado</span>
                  </label>
                </div>

                {/* Fontes Preservadas na Pauta */}
                {pauta.fontes.length > 0 && (
                  <div className="space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                      Fontes Citadas e Horário da Consulta:
                    </span>
                    <ul className="space-y-1">
                      {pauta.fontes.map((f, fIdx) => (
                        <li key={fIdx} className="text-slate-300 flex items-center justify-between gap-2 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                          <span className="truncate">{f.title} ({f.domain})</span>
                          <span className="text-slate-500 font-mono shrink-0">{f.accessedAt.split(' ')[1]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ações de Revisão */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Revisor: <strong>{pauta.responsavelRevisao}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(pauta.id, 'rejeitada')}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-all cursor-pointer"
                    >
                      Rejeitar
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(pauta.id, 'aprovada')}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-3.5 h-3.5" /> Aprovar para Publicação
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 4: PUBLICADO (Meça Valor, Não Apenas Volume) */}
      {activeTab === 'publicado' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-xs text-slate-300 flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <strong className="text-white">Meça valor, não apenas volume:</strong> No Google Analytics 4, acompanhamos leitura completa de artigos, inscrições na newsletter, cliques em fontes e compartilhamentos. Depois, comparamos esses sinais com as impressões e cliques do Search Console para identificar quais pautas realmente interessam aos leitores, sem transformar "mais posts" no objetivo principal.
            </div>
          </div>

          {/* Matriz de Comparação de Desempenho e Índice de Valor Editorial (IVE) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {publishedMetrics.map((item) => (
              <div 
                key={item.postId}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {item.category}
                    </span>
                    <h4 className="font-display font-bold text-sm text-white line-clamp-2 mt-0.5">
                      {item.postTitle}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black font-display text-emerald-400 block">
                      {item.iveScore}
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                      Índice IVE
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">Search Console</span>
                    <span className="text-white font-bold">{item.searchClicks.toLocaleString('pt-BR')} cliques</span>
                    <span className="text-[10px] text-slate-500 block">{item.searchCtr}% CTR (Pos {item.averagePosition})</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400 text-[10px] block">GA4 Leitura Real</span>
                    <span className="text-emerald-400 font-bold">{item.readCompletionRate}% completaram</span>
                    <span className="text-[10px] text-slate-500 block">{item.readsComplete100Percent} leituras 100%</span>
                  </div>
                </div>

                {/* Sinais de Alto Valor do Leitor */}
                <div className="space-y-1.5 text-xs pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-cyan-400" /> Inscrições Newsletter:
                    </span>
                    <strong className="text-white">{item.newsletterSignups}</strong>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Link2 className="w-3 h-3 text-emerald-400" /> Cliques em Fontes Citadas:
                    </span>
                    <strong className="text-white">{item.sourceClicks}</strong>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Share2 className="w-3 h-3 text-amber-400" /> Compartilhamentos Sociais:
                    </span>
                    <strong className="text-white">{item.sharesCount}</strong>
                  </div>
                </div>

                {/* Veredito de Valor Editorial */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Veredito Editorial:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">
                    {item.editorialVerdict}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Nova Pauta */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" /> Cadastrar Nova Pauta na Planilha
              </h3>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePauta} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Tema Central / Foco Jornalístico:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Análise tática da pressão alta do Botafogo de Artur Jorge"
                  value={newTema}
                  onChange={(e) => setNewTema(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Categoria:</label>
                  <select
                    value={newCategoria}
                    onChange={(e) => setNewCategoria(e.target.value as FootballCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Clubes Serie A">Clubes Serie A</option>
                    <option value="Clubes Serie B">Clubes Serie B</option>
                    <option value="Seleção Brasileira">Seleção Brasileira</option>
                    <option value="Jogadores">Jogadores</option>
                    <option value="Equipe Técnica">Equipe Técnica</option>
                    <option value="Eventos">Eventos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tipo de Conteúdo:</label>
                  <select
                    value={newTipo}
                    onChange={(e) => setNewTipo(e.target.value as EditorialContentType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="noticia-contexto">1. Notícia com Contexto</option>
                    <option value="historia-curiosidade">2. História & Mística</option>
                    <option value="estatistica-comparacao">3. Raio-X & Dados</option>
                    <option value="calendario-guia">4. Guia & Onde Assistir</option>
                    <option value="analise-tatica">5. Análise Tática</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nível de Risco:</label>
                  <select
                    value={newRisco}
                    onChange={(e) => setNewRisco(e.target.value as PautaRisk)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Baixo">Baixo (Fato oficial)</option>
                    <option value="Médio">Médio (Análise de desempenho)</option>
                    <option value="Alto">Alto (Apuração sensível)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Data Prevista:</label>
                  <input
                    type="date"
                    value={newDataPrevista}
                    onChange={(e) => setNewDataPrevista(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Responsável pela Revisão:</label>
                <input
                  type="text"
                  value={newResponsavel}
                  onChange={(e) => setNewResponsavel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md cursor-pointer"
                >
                  Salvar Pauta na Planilha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
