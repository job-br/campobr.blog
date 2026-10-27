import React from 'react';
import { FootballCategory, MatchLiveScore } from '../types';
import { 
  Search, 
  X, 
  Trophy, 
  ShieldCheck, 
  Users, 
  ClipboardCheck, 
  Calendar, 
  TrendingUp,
  Activity,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

import { valueAnalyticsService } from '../services/valueAnalyticsService';

interface LeftSidebarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: FootballCategory | 'Todas';
  onSelectCategory: (cat: FootballCategory | 'Todas') => void;
  categoryCounts: Record<string, number>;
  liveMatches: MatchLiveScore[];
  onOpenMatchDetails?: (match: MatchLiveScore) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  liveMatches,
}) => {
  const [newsletterSubscribed, setNewsletterSubscribed] = React.useState(false);
  const [newsletterEmail, setNewsletterEmail] = React.useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    valueAnalyticsService.trackNewsletterSignup('sidebar_left', newsletterEmail);
    setNewsletterSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setNewsletterSubscribed(false), 5000);
  };
  const categories: { id: FootballCategory; label: string; sublabel: string; icon: React.ReactNode; color: string }[] = [
    { id: 'Jogadores', label: 'Jogadores', sublabel: 'Players & Rising Stars', icon: <Users className="w-4 h-4 text-purple-400" />, color: 'from-purple-500/20 to-pink-500/20' },
    { id: 'Equipe Técnica', label: 'Equipe Técnica', sublabel: 'Tactics & Master Coaches', icon: <ClipboardCheck className="w-4 h-4 text-amber-400" />, color: 'from-amber-500/20 to-orange-500/20' },
    { id: 'Eventos', label: 'Eventos', sublabel: 'Tournaments & Major Events', icon: <Calendar className="w-4 h-4 text-rose-400" />, color: 'from-rose-500/20 to-red-500/20' },
    { id: 'Clubes Serie A', label: 'Clubes Serie A', sublabel: 'Major Clubs & Historic Derbies', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, color: 'from-emerald-500/20 to-teal-500/20' },
    { id: 'Seleção Brasileira', label: 'Seleção Brasileira', sublabel: 'Brazil National Team & Global Stage', icon: <Trophy className="w-4 h-4 text-yellow-400" />, color: 'from-yellow-500/20 to-emerald-500/20' },
    { id: 'Clubes Serie B', label: 'Clubes Serie B', sublabel: 'Underdog Clubs & Rise to Glory', icon: <TrendingUp className="w-4 h-4 text-cyan-400" />, color: 'from-cyan-500/20 to-blue-500/20' },
  ];

  return (
    <aside className="w-full space-y-6">
      {/* Search Input Box */}
      <div className="card-football rounded-2xl p-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" /> Pesquisar Conteúdos
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ex: Vini Jr, Flamengo, Tática..."
            className="w-full pl-9 pr-8 py-2.5 bg-slate-900/90 border border-slate-700/70 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-sm text-slate-100 placeholder-slate-500 transition-all outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-[11px] text-emerald-400 mt-2 font-medium">
            Filtrando resultados por "{searchQuery}"
          </p>
        )}
      </div>

      {/* Categorias */}
      <div className="card-football rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Categorias do Portal
          </h2>
          {selectedCategory !== 'Todas' && (
            <button
              onClick={() => onSelectCategory('Todas')}
              className="text-[10px] text-emerald-400 hover:underline font-semibold"
            >
              Ver Todas
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          {/* Todas as postagens button */}
          <button
            onClick={() => onSelectCategory('Todas')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              selectedCategory === 'Todas'
                ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/70 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center">
                ⚽
              </div>
              <div className="text-left">
                <span className="block font-medium leading-tight">Todas as Categorias</span>
                <span className="block text-[10px] text-slate-400 leading-tight">All Soccer Categories</span>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {Object.values(categoryCounts).reduce((a, b) => a + b, 0)}
            </span>
          </button>

          {/* Categorias Especificas do Prompt */}
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-900/90 border border-slate-700/60 flex items-center justify-center shrink-0">
                    {cat.icon}
                  </div>
                  <div className="text-left">
                    <span className="block font-medium leading-tight">{cat.label}</span>
                    <span className="block text-[10px] text-slate-400 leading-tight">{cat.sublabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-emerald-500/30 text-emerald-300' : 'bg-slate-800/80 text-slate-400'
                  }`}>
                    {count}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Matches & Upcoming Games Widget */}
      {liveMatches.length > 0 && (
      <div className="card-football rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Giro da Rodada
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/30">
            Placar
          </span>
        </div>

        <div className="space-y-2.5">
          {liveMatches.slice(0, 3).map((match) => (
            <div
              key={match.id}
              className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-all text-xs"
            >
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1.5">
                <span className="font-semibold text-emerald-400">{match.league}</span>
                <span className={`px-1.5 py-0.2 rounded font-bold ${
                  match.status === 'AO VIVO' ? 'text-red-400 bg-red-950/60 animate-pulse' : 'text-slate-400'
                }`}>
                  {match.status} {match.minute && `(${match.minute})`}
                </span>
              </div>

              <div className="flex items-center justify-between font-semibold text-slate-200">
                <div className="flex items-center gap-1.5 truncate">
                  <span>{match.homeLogo}</span>
                  <span className="truncate">{match.homeTeam}</span>
                </div>
                <div className="px-2 py-0.5 rounded bg-slate-950 font-display font-black text-white text-sm">
                  {match.homeScore !== undefined ? `${match.homeScore} x ${match.awayScore}` : 'VS'}
                </div>
                <div className="flex items-center gap-1.5 justify-end truncate">
                  <span className="truncate">{match.awayTeam}</span>
                  <span>{match.awayLogo}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <a
          href="https://www.google.com/search?q=jogos+do+brasileirao+serie+a+ao+vivo"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-emerald-500/40 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Placar Google Sports
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
        </a>
      </div>
      )}
    </aside>
  );
};
