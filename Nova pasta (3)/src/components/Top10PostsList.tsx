import React, { useMemo } from 'react';
import { Post } from '../types';
import { Eye, TrendingUp, Clock, Heart, Edit3, Trash2, Sparkles } from 'lucide-react';
import { FastImage } from './FastImage';

interface Top10PostsListProps {
  posts: Post[];
  featuredPostId?: string;
  onReadPost: (post: Post) => void;
  onLikePost: (e: React.MouseEvent, post: Post) => void;
  isAdminLoggedIn?: boolean;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (post: Post) => void;
}

export const Top10PostsList: React.FC<Top10PostsListProps> = ({
  posts,
  featuredPostId,
  onReadPost,
  onLikePost,
  isAdminLoggedIn = false,
  onEditPost,
  onDeletePost,
}) => {
  // Ordena por visualizações e garante que NENHUM post nem imagem repetida da matéria em destaque apareça no Top 10
  const top10 = useMemo(() => {
    const candidates = [...posts]
      .filter((p) => !featuredPostId || p.id !== featuredPostId)
      .sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));

    const seenCovers = new Set<string>();
    const seenIds = new Set<string>();
    const uniqueRanked: Post[] = [];

    for (const p of candidates) {
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);

      const coverClean = (p.coverImage || '').split('?')[0];
      const photoIdMatch = (p.coverImage || '').match(/photo-[a-zA-Z0-9_-]+/);
      const photoKey = photoIdMatch ? photoIdMatch[0] : coverClean;

      if (!seenCovers.has(photoKey)) {
        seenCovers.add(photoKey);
        uniqueRanked.push(p);
      }
      if (uniqueRanked.length === 10) break;
    }

    return uniqueRanked;
  }, [posts, featuredPostId]);

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'badge-top1 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400';
      case 2:
        return 'badge-top2 shadow-md shadow-slate-400/20 ring-2 ring-slate-300';
      case 3:
        return 'badge-top3 shadow-md shadow-orange-500/20 ring-2 ring-orange-400';
      default:
        return 'bg-slate-900/90 text-slate-300 border border-slate-700/80';
    }
  };

  return (
    <section className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight flex items-center gap-2">
              Top 10 Postagens Mais Vistas
            </h2>
            <p className="text-xs text-slate-400">
              As matérias mais lidas e debatidas pela torcida brasileira
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Atualizado em Tempo Real</span>
        </div>
      </div>

      {/* List of 10 items */}
      <div className="space-y-3">
        {top10.map((post, index) => {
          const rank = index + 1;
          const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
          });

          return (
            <article
              key={post.id}
              className="card-football rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 group hover:scale-[1.008] transition-all duration-200"
            >
              {/* Ranking Badge & Thumbnail */}
              <div 
                onClick={() => onReadPost(post)}
                className="flex items-center gap-3 sm:gap-4 shrink-0 cursor-pointer"
              >
                {/* Ranking Number */}
                <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-display font-black text-base sm:text-lg shrink-0 transition-transform group-hover:scale-110 ${getRankBadgeStyle(rank)}`}>
                  #{rank}
                </div>

                {/* Thumbnail Image with FastImage */}
                <div className="relative w-24 sm:w-32 h-20 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-800">
                  <FastImage
                    src={post.coverImage}
                    alt={post.title}
                    widthTarget={320}
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-950/80 text-emerald-400 border border-slate-700 pointer-events-none">
                    {post.category.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Main Info (Desktop & Mobile) */}
              <div className="flex-1 min-w-0 w-full">
                {/* Meta & Badges */}
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase">
                    {post.category}
                  </span>
                  <span>•</span>
                  <span>{formattedDate}</span>
                  <span className="hidden xs:inline">•</span>
                  <span className="hidden xs:flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {post.readTimeMinutes || 4} min
                  </span>
                  {post.aiImageMention && (
                    <span className="hidden md:flex text-[10px] text-amber-300/80 italic items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      {post.aiImageMention}
                    </span>
                  )}
                </div>

                <h3 
                  onClick={() => onReadPost(post)}
                  className="font-display font-bold text-sm sm:text-base md:text-lg text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug cursor-pointer"
                >
                  {post.title}
                </h3>

                <p 
                  onClick={() => onReadPost(post)}
                  className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-normal cursor-pointer"
                >
                  {post.summary}
                </p>

                {/* Footer Metrics & Admin Quick Actions */}
                <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.authorAvatar || '/logo-512x512.png'}
                      alt={post.authorName || 'CampoBR'}
                      className="w-5 h-5 rounded-full object-cover border border-slate-700 bg-black p-0.5"
                    />
                    <span className="text-[11px] text-slate-300 font-medium truncate max-w-[140px]">
                      {post.authorName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Admin Action Buttons */}
                    {isAdminLoggedIn && (
                      <div className="flex items-center gap-1 mr-1 pr-2 border-r border-slate-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPost && onEditPost(post);
                          }}
                          className="p-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-colors"
                          title="Editar matéria"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePost && onDeletePost(post);
                          }}
                          className="p-1 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors"
                          title="Excluir matéria"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <span className="flex items-center gap-1 font-semibold text-emerald-400 text-xs">
                      <Eye className="w-3.5 h-3.5" />
                      {post.viewsCount.toLocaleString('pt-BR')}
                    </span>
                    <button
                      onClick={(e) => onLikePost(e, post)}
                      className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Curtir"
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.likesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
                      <span>{post.likesCount.toLocaleString('pt-BR')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
