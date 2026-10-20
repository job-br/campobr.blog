import React from 'react';
import { Post } from '../types';
import { Sparkles, Eye, Heart, Clock, ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { FastImage } from './FastImage';

interface FeaturedHeroPostProps {
  post: Post;
  onReadPost: (post: Post) => void;
  onLikePost: (e: React.MouseEvent, post: Post) => void;
  isAdminLoggedIn?: boolean;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (post: Post) => void;
}

export const FeaturedHeroPost: React.FC<FeaturedHeroPostProps> = ({
  post,
  onReadPost,
  onLikePost,
  isAdminLoggedIn = false,
  onEditPost,
  onDeletePost,
}) => {
  const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <article className="relative w-full rounded-3xl overflow-hidden card-football border border-emerald-500/40 shadow-2xl group transition-all duration-300">
      {/* Background Image with FastImage (Priority High LCP Preload) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none select-none">
        <FastImage
          src={post.coverImage}
          alt={post.title}
          priority={true}
          widthTarget={1200}
          containerClassName="w-full h-full"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out brightness-90"
        />
      </div>

      {/* Gradients to blend into dark stadium theme */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b10] via-[#070b10]/75 to-transparent pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#070b10]/90 via-[#070b10]/50 to-transparent pointer-events-none"></div>

      {/* Main Card Content Container - Clean Flex Layout so elements never overlap */}
      <div className="relative z-10 flex flex-col justify-between min-h-[460px] sm:min-h-[500px] p-5 sm:p-8">
        {/* Top Tag Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> Destaque Principal
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase tracking-wide">
              {post.category}
            </span>
            {/* AI Image Mention pill */}
            <span className="flex px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/30 text-amber-300 font-medium text-[11px] items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{post.thematicConcept ? `🎨 Conceito: ${post.thematicConcept.split('|')[0].trim()}` : (post.aiImageMention || 'Imagem gerada por IA / CampoBR Studio')}</span>
            </span>
          </div>
        </div>

        {/* Content Block at bottom - In natural flow, never colliding */}
        <div className="pt-8 sm:pt-12 space-y-3">
          {/* Metadata pill: Views & Read time clearly positioned above title */}
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-950/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 shadow-sm">
            <span className="flex items-center gap-1.5 text-slate-200">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>{post.viewsCount.toLocaleString('pt-BR')} visualizações</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{post.readTimeMinutes || 5} min de leitura</span>
            </span>
          </div>

          {/* Headline */}
          <h2 
            onClick={() => onReadPost(post)}
            className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white hover:text-emerald-300 transition-colors leading-tight cursor-pointer line-clamp-2 max-w-3xl drop-shadow-md"
          >
            {post.title}
          </h2>

          {/* Excerpt / Summary */}
          <p className="text-sm sm:text-base text-slate-300 mt-2 line-clamp-2 max-w-2xl font-normal leading-relaxed text-balance">
            {post.summary}
          </p>

          {/* Footer of Hero Card: Author & Actions */}
          <div className="pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-between gap-4">
            {/* Author */}
            <div className="flex items-center gap-3">
              <img
                src={post.authorAvatar || '/logo-512x512.png'}
                alt={post.authorName || 'CampoBR'}
                className="w-9 h-9 rounded-full object-cover border border-emerald-400/60 shadow-sm bg-black p-0.5"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-white leading-tight">
                  {post.authorName}
                </p>
                <p className="text-[11px] text-emerald-400/90 font-medium">
                  {post.authorRole} • {formattedDate}
                </p>
              </div>
            </div>

            {/* CTAs & Admin Fast Action */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {isAdminLoggedIn && (
                <div className="flex items-center gap-1.5 mr-1 pr-2 border-r border-slate-700">
                  <button
                    onClick={() => onEditPost && onEditPost(post)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
                    title="Editar Matéria de Destaque"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => onDeletePost && onDeletePost(post)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition-all cursor-pointer"
                    title="Excluir Matéria de Destaque"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              )}

              <button
                onClick={(e) => onLikePost(e, post)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400 text-xs font-semibold transition-all cursor-pointer"
                title="Curtir publicação"
              >
                <Heart className={`w-3.5 h-3.5 ${post.likesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
                <span>{post.likesCount.toLocaleString('pt-BR')}</span>
              </button>

              <button
                onClick={() => onReadPost(post)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-950/60 cursor-pointer"
              >
                <span>Ler Matéria Completa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
