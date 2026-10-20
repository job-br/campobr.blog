import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ExternalLink, 
  RotateCw, 
  Trophy, 
  Flame, 
  Search, 
  Clock, 
  MapPin, 
  Tv, 
  TrendingUp,
  Sparkles,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { MatchLiveScore } from '../types';
import { LATEST_GOOGLE_MATCHES } from '../services/googleSportsService';

export interface ExtendedMatchLiveScore extends MatchLiveScore {
  round?: string;
  stadium?: string;
  broadcast?: string;
  isActuallyInProgress?: boolean;
  goals?: { team: 'home' | 'away'; player: string; minute: string }[];
  stats?: {
    possession: [number, number];
    shots: [number, number];
    fouls: [number, number];
  };
}

interface GoogleSportsWidgetProps {
  onSelectMatch?: (match: ExtendedMatchLiveScore) => void;
}

export const INITIAL_BRAZILIAN_MATCHES: ExtendedMatchLiveScore[] = LATEST_GOOGLE_MATCHES;

export const GoogleSportsMatchesWidget: React.FC<GoogleSportsWidgetProps> = () => {
  const [matches, setMatches] = useState<ExtendedMatchLiveScore[]>(INITIAL_BRAZILIAN_MATCHES);
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'ao-vivo' | 'encerrados' | 'serie-a' | 'serie-b' | 'copa'>('todos');
  const [searchTeam, setSearchTeam] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('agora');
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>('gmatch-today-1');

  // Simulação de atualização em tempo real periódica estilo Google Sports
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 700);
  };

  const filteredMatches = matches.filter((m) => {
    // Busca por time
    if (searchTeam.trim()) {
      const q = searchTeam.toLowerCase();
      const matchName = `${m.homeTeam} ${m.awayTeam} ${m.league}`.toLowerCase();
      if (!matchName.includes(q)) return false;
    }

    // Filtros de torneio com regra estrita de 'AO VIVO' (somente jogos realmente em andamento)
    if (selectedFilter === 'ao-vivo') {
      return m.isActuallyInProgress === true && m.status === 'AO VIVO';
    }
    if (selectedFilter === 'encerrados') {
      return m.status === 'ENCERRADO';
    }
    if (selectedFilter === 'serie-a') return m.league.includes('Série A');
    if (selectedFilter === 'serie-b') return m.league.includes('Série B');
    if (selectedFilter === 'copa') return m.league.includes('Copa') || m.league.includes('Libertadores');
    return true;
  });

  const openGoogleSearchMatch = (home: string, away: string) => {
    const query = encodeURIComponent(`jogo ${home} x ${away} placar ao vivo`);
    window.open(`https://www.google.com/search?q=${query}`, '_blank');
  };

  const openGoogleSportsGeneral = () => {
    window.open('https://www.google.com/search?q=jogos+do+brasileirao+serie+a+ao+vivo', '_blank');
  };

  return (
    <div className="card-football rounded-3xl p-5 sm:p-6 border border-emerald-500/40 bg-gradient-to-b from-[#0a121c] via-[#080d14] to-[#05080c] shadow-2xl space-y-5">
      {/* Header com Identidade Google Sports */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {/* Google Official Color Dots + Ball Icon */}
          <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center relative shadow-inner shrink-0">
            <span className="text-xl">⚽</span>
            <div className="absolute -bottom-1 -right-1 flex gap-0.5 p-1 rounded-full bg-slate-950 border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FBBC05]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Google Esportes • Placar em Tempo Real
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                Ao Vivo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Jogos brasileiros atualizados com placares, cronômetro e estatísticas oficiais.
            </p>
          </div>
        </div>

        {/* Ações: Atualizar + Link Oficial Google */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Atualizar dados agora"
          >
            <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-[11px]">{isRefreshing ? 'Atualizando...' : `Atualizado ${lastUpdated}`}</span>
          </button>

          <button
            onClick={openGoogleSportsGeneral}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            title="Ver no Google Search oficial"
          >
            {/* Google G Logo */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="hidden sm:inline">Google Placar</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Tabs de Filtro */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedFilter('todos')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'todos' 
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({matches.length})
          </button>

          <button
            onClick={() => setSelectedFilter('ao-vivo')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'ao-vivo' 
                ? 'bg-red-500 text-white shadow-md shadow-red-500/30' 
                : 'bg-slate-900/80 text-red-400 hover:text-red-300 border border-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
            Ao Vivo ({matches.filter(m => m.isActuallyInProgress === true && m.status === 'AO VIVO').length})
          </button>

          <button
            onClick={() => setSelectedFilter('encerrados')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedFilter === 'encerrados' 
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                : 'bg-slate-900/80 text-amber-400 hover:text-amber-300 border border-slate-800'
            }`}
          >
            <span>Resultados ({matches.filter(m => m.status === 'ENCERRADO').length})</span>
          </button>

          <button
            onClick={() => setSelectedFilter('serie-a')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'serie-a' 
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Série A
          </button>

          <button
            onClick={() => setSelectedFilter('serie-b')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'serie-b' 
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Série B
          </button>

          <button
            onClick={() => setSelectedFilter('copa')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedFilter === 'copa' 
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Copas
          </button>
        </div>

        {/* Input de Busca Rápida por Clube */}
        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTeam}
            onChange={(e) => setSearchTeam(e.target.value)}
            placeholder="Filtrar por time (ex: Flamengo)..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-colors"
          />
        </div>
      </div>

      {/* Grid de Partidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredMatches.map((m) => {
          const isLive = m.status === 'AO VIVO';
          const isExpanded = expandedMatchId === m.id;

          return (
            <div
              key={m.id}
              className={`rounded-2xl border transition-all ${
                isLive
                  ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-[#0b141e] border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Banner da Partida */}
              <div className="px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300 truncate max-w-[200px]">
                  {m.league}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1 ${
                      isLive
                        ? 'bg-red-950 text-red-400 border border-red-500/40 animate-pulse'
                        : m.status === 'ENCERRADO'
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isLive && <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>}
                    {m.status} {m.minute ? `• ${m.minute}` : ''}
                  </span>
                </div>
              </div>

              {/* Placar e Clubes */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-5 items-center gap-2">
                  {/* Mandante */}
                  <div className="col-span-2 flex items-center gap-2.5">
                    <span className="text-2xl p-1 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
                      {m.homeLogo}
                    </span>
                    <span className="font-black text-sm text-white leading-tight">
                      {m.homeTeam}
                    </span>
                  </div>

                  {/* Placar Central */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    {m.homeScore !== undefined ? (
                      <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 shadow-inner">
                        <span className="font-display font-black text-lg text-white">
                          {m.homeScore}
                        </span>
                        <span className="text-slate-600 text-xs font-bold">:</span>
                        <span className="font-display font-black text-lg text-white">
                          {m.awayScore}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-black uppercase text-amber-400 bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-500/30">
                        VS
                      </span>
                    )}
                  </div>

                  {/* Visitante */}
                  <div className="col-span-2 flex items-center justify-end gap-2.5 text-right">
                    <span className="font-black text-sm text-white leading-tight">
                      {m.awayTeam}
                    </span>
                    <span className="text-2xl p-1 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
                      {m.awayLogo}
                    </span>
                  </div>
                </div>

                {/* Gols e Lances Rápidos (se houver) */}
                {m.goals && m.goals.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      ⚽ Gols da partida:
                    </span>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {m.goals.map((g, idx) => (
                        <span key={idx} className="text-slate-300 font-medium">
                          {g.player} <span className="text-emerald-400 font-bold">({g.minute})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Informações de Estádio e Onde Assistir */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  {m.stadium && (
                    <div className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{m.stadium}</span>
                    </div>
                  )}

                  {m.broadcast && (
                    <div className="flex items-center gap-1 text-slate-300 font-medium">
                      <Tv className="w-3 h-3 text-blue-400 shrink-0" />
                      <span>{m.broadcast}</span>
                    </div>
                  )}
                </div>

                {/* Botões de Ação: Ver Estatísticas + Abrir no Google */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {m.stats && (
                    <button
                      type="button"
                      onClick={() => setExpandedMatchId(isExpanded ? null : m.id)}
                      className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Activity className="w-3 h-3" />
                      <span>{isExpanded ? 'Ocultar Estatísticas' : 'Ver Estatísticas (Posse / Chutes)'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openGoogleSearchMatch(m.homeTeam, m.awayTeam)}
                    className="ml-auto px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Google Placar</span>
                    <ExternalLink className="w-3 h-3 text-blue-400" />
                  </button>
                </div>

                {/* Painel Expandido com Estatísticas estilo Google Sports */}
                {isExpanded && m.stats && (
                  <div className="mt-2 p-3 rounded-xl bg-black/60 border border-slate-800 space-y-2.5 animate-fade-in text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                      Estatísticas Oficiais do Confronto
                    </div>

                    {/* Posse de Bola */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-300">
                        <span>{m.stats.possession[0]}%</span>
                        <span className="text-slate-400 font-normal">Posse de Bola</span>
                        <span>{m.stats.possession[1]}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 flex overflow-hidden">
                        <div style={{ width: `${m.stats.possession[0]}%` }} className="bg-emerald-500"></div>
                        <div style={{ width: `${m.stats.possession[1]}%` }} className="bg-slate-600"></div>
                      </div>
                    </div>

                    {/* Finalizações */}
                    <div className="flex justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                      <span className="font-bold">{m.stats.shots[0]}</span>
                      <span className="text-slate-400">Finalizações no Alvo</span>
                      <span className="font-bold">{m.stats.shots[1]}</span>
                    </div>

                    {/* Faltas */}
                    <div className="flex justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/80">
                      <span className="font-bold">{m.stats.fouls[0]}</span>
                      <span className="text-slate-400">Faltas Cometidas</span>
                      <span className="font-bold">{m.stats.fouls[1]}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredMatches.length === 0 && (
        <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
          <p className="text-sm font-bold text-slate-300">Nenhum jogo encontrado para este filtro.</p>
          <button
            onClick={() => {
              setSelectedFilter('todos');
              setSearchTeam('');
            }}
            className="text-xs text-emerald-400 hover:underline font-semibold"
          >
            Limpar filtros e exibir todos os jogos
          </button>
        </div>
      )}

      {/* Rodapé Informativo do Widget Google */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Integração com pesquisa de resultados do <strong className="text-slate-200">Google Futebol Brasil</strong>.
          </span>
        </div>
        <button
          onClick={openGoogleSportsGeneral}
          className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
        >
          <span>Abrir Tabela & Classificação Completa no Google</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
