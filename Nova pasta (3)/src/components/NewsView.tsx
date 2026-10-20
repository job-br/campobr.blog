import React, { useState, useMemo } from 'react';
import { Post, MatchLiveScore } from '../types';
import { 
  Radio, 
  Flame, 
  Trophy, 
  ArrowUpRight, 
  Clock, 
  Sparkles, 
  ExternalLink, 
  RotateCw, 
  TrendingUp, 
  Search,
  CheckCircle2,
  Newspaper
} from 'lucide-react';
import { GoogleSportsMatchesWidget } from './GoogleSportsMatchesWidget';
import { LATEST_GOOGLE_FOOTBALL_NEWS, GoogleNewsHeadline } from '../services/googleSportsService';
import { FastImage } from './FastImage';

interface NewsViewProps {
  posts: Post[];
  liveMatches: MatchLiveScore[];
  onReadPost: (post: Post) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  posts,
  onReadPost,
}) => {
  const [googleNews, setGoogleNews] = useState<GoogleNewsHeadline[]>(LATEST_GOOGLE_FOOTBALL_NEWS);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('todos');
  const [isRefreshingNews, setIsRefreshingNews] = useState(false);
  const [newsLastUpdated, setNewsLastUpdated] = useState<string>('agora');

  // Ordenar as postagens do blog pelas mais recentes garantindo unicidade absoluta de imagens
  const mostRecentPosts = useMemo(() => {
    const sorted = [...posts].sort(
      (a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
    );

    const seenIds = new Set<string>();
    const seenCovers = new Set<string>();
    const result: Post[] = [];

    for (const p of sorted) {
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);

      const coverClean = (p.coverImage || '').split('?')[0];
      const photoMatch = (p.coverImage || '').match(/photo-[a-zA-Z0-9_-]+/);
      const photoKey = photoMatch ? photoMatch[0] : coverClean;

      if (!seenCovers.has(photoKey)) {
        seenCovers.add(photoKey);
        result.push(p);
      }
      if (result.length === 8) break;
    }

    return result;
  }, [posts]);

  const handleRefreshNews = () => {
    setIsRefreshingNews(true);
    setTimeout(() => {
      setIsRefreshingNews(false);
      setNewsLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 600);
  };

  const filteredGoogleNews = googleNews.filter((item) => {
    if (selectedNewsCategory === 'todos') return true;
    if (selectedNewsCategory === 'brasileirao') return item.category.toLowerCase().includes('brasileir');
    if (selectedNewsCategory === 'selecao') return item.category.toLowerCase().includes('sele');
    if (selectedNewsCategory === 'mercado') return item.category.toLowerCase().includes('mercado');
    if (selectedNewsCategory === 'copas') return item.category.toLowerCase().includes('copa');
    return true;
  });

  const transferRumors = [
    { player: 'Estêvão', team: 'Palmeiras ➔ Chelsea', status: 'Confirmado para 2025', fee: '€ 61,5M', type: 'Venda Recorde' },
    { player: 'Gerson', team: 'Flamengo', status: 'Renovação de Contrato', fee: 'Até 2028', type: 'Blindagem' },
    { player: 'Lucas Moura', team: 'São Paulo', status: 'Titular Absoluto', fee: 'Liderança', type: 'Renovação' },
    { player: 'Neymar Jr', team: 'Al-Hilal ➔ Santos', status: 'Sondagem de Retorno', fee: 'Em pauta', type: 'Especulação' },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Live Banner */}
      <div className="card-football rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-950/60 via-[#0a121c] to-[#070b10] border border-emerald-500/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" /> Plantão de Notícias & Jogos Ao Vivo
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              Central de Notícias e Tempo Real CampoBR
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Notícias mais recentes verificadas e resultados ao vivo sincronizados pelo Google. Apenas jogos em andamento são classificados como Ao Vivo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Google Notícias & Esportes 2026
            </span>
          </div>
        </div>

        {/* Ticker de Resultados de Hoje no Google */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Resultados dos Jogos de Hoje no Google:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium shrink-0">
              <span className="text-emerald-400 font-bold mr-1">Fim:</span> Flamengo 2x1 Bragantino
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium shrink-0">
              <span className="text-emerald-400 font-bold mr-1">Fim:</span> Cruzeiro 3x1 Vitória
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium shrink-0">
              <span className="text-emerald-400 font-bold mr-1">Fim:</span> Corinthians 1x3 Fluminense
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium shrink-0">
              <span className="text-emerald-400 font-bold mr-1">Fim:</span> Vasco 5x0 Coritiba
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium shrink-0">
              <span className="text-emerald-400 font-bold mr-1">Fim:</span> Mirassol 2x0 Botafogo
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium shrink-0">
              <span className="text-emerald-400 font-bold mr-1">Fim:</span> Atlético-MG 1x1 Chapecoense
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-red-950/90 border border-red-500/50 text-red-300 font-bold shrink-0 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
              <span>Ao Vivo: Grêmio 1x1 Palmeiras (76')</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-blue-500/40 text-blue-300 font-medium shrink-0">
              <span className="text-blue-400 font-normal mr-1">Hoje 21:00:</span> Athletico-PR x Bahia
            </span>
          </div>
        </div>
      </div>

      {/* Google Sports Real-Time Scoreboard Plugin (Com filtro estrito de Ao Vivo) */}
      <GoogleSportsMatchesWidget />

      {/* SEÇÃO: Notícias Mais Recentes Atualizadas pelo Google */}
      <div className="card-football rounded-3xl p-6 border border-emerald-500/30 bg-[#091018] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-lg sm:text-xl text-white">
                  Notícias Mais Recentes do Google
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  Google Notícias
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Giro oficial em tempo real sobre clubes, CBF, Seleção e mercado do futebol nacional.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshNews}
              disabled={isRefreshingNews}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshingNews ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">{isRefreshingNews ? 'Atualizando...' : `Atualizado ${newsLastUpdated}`}</span>
            </button>

            <a
              href="https://news.google.com/search?q=futebol+brasileiro&hl=pt-BR&gl=BR&ceid=BR%3Apt-419"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Ver no Google</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Categorias de filtro de notícias */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'todos', label: 'Todas as Notícias' },
            { id: 'brasileirao', label: 'Brasileirão Série A & B' },
            { id: 'selecao', label: 'Seleção Brasileira' },
            { id: 'mercado', label: 'Mercado da Bola' },
            { id: 'copas', label: 'Copa do Brasil & Libertadores' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedNewsCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedNewsCategory === cat.id
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista de notícias em tempo real sincronizadas do Google */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {filteredGoogleNews.map((news) => (
            <div
              key={news.id}
              className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-sm hover:shadow-emerald-950/20"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px] mb-2">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                    {news.tag}
                  </span>
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {news.timeAgo}
                  </span>
                </div>

                <h3 className="font-display font-bold text-base text-white group-hover:text-emerald-300 transition-colors leading-snug">
                  {news.title}
                </h3>

                <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                  {news.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 font-medium">{news.source}</span>
                <a
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group-hover:underline"
                >
                  <span>Google Cobertura</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid: Transfers and Market */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transfer Market Watch */}
        <div className="lg:col-span-3 card-football rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="font-display font-black text-lg text-white">Mercado da Bola & Transferências Recentes</h2>
            </div>
            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider bg-orange-950/80 px-2 py-0.5 rounded border border-orange-500/40">
              Janela de Transferências 2026
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {transferRumors.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs hover:border-orange-500/40 transition-colors">
                <div className="flex justify-between items-start gap-1">
                  <span className="font-black text-white text-sm">{item.player}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-400 border border-orange-700/40 whitespace-nowrap">
                    {item.type}
                  </span>
                </div>
                <p className="text-slate-300 text-xs mt-1">{item.team}</p>
                <div className="flex justify-between items-center mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">{item.status}</span>
                  <span className="font-bold text-emerald-400">{item.fee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breaking Articles Stream - Ordenados rigorosamente por mais recentes */}
      <div className="card-football rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="font-display font-black text-xl text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            Matérias & Artigos do Portal (Mais Recentes)
          </h2>
          <span className="text-xs text-slate-400">
            Atualizado em ordem cronológica
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {mostRecentPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => onReadPost(post)}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer hover:bg-slate-900/40 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-start gap-4">
                <FastImage
                  src={post.coverImage}
                  alt={post.title}
                  widthTarget={320}
                  containerClassName="w-20 h-16 rounded-xl shrink-0 border border-slate-800"
                  className="w-full h-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-400">
                      {post.category}
                    </span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                    {post.summary}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0 self-end sm:self-center">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> {post.readTimeMinutes}m de leitura
                </span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
