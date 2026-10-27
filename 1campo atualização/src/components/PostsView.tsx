import React, { useState, useMemo, useEffect } from 'react';
import { Post, FootballCategory } from '../types';
import { Search, Eye, Clock, Heart, Filter, ArrowUpDown, Edit3, Trash2, Sparkles } from 'lucide-react';
import { FastImage } from './FastImage';
import { warmupImages } from '../services/imageOptimizer';
import { getUniqueThematicImageForPost } from '../services/aiVisualThemeEngine';

interface PostsViewProps {
  posts: Post[];
  onReadPost: (post: Post) => void;
  onLikePost: (e: React.MouseEvent, post: Post) => void;
  initialCategory?: FootballCategory | 'Todas';
  isAdminLoggedIn?: boolean;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (post: Post) => void;
}

export const PostsView: React.FC<PostsViewProps> = ({
  posts,
  onReadPost,
  onLikePost,
  initialCategory = 'Todas',
  isAdminLoggedIn = false,
  onEditPost,
  onDeletePost,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<FootballCategory | 'Todas'>(initialCategory);
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'likes'>('recent');

  // Preload top visible covers in background for 0ms transition
  useEffect(() => {
    if (posts && posts.length > 0) {
      const topCovers = posts.slice(0, 6).map(p => p.coverImage).filter(Boolean);
      warmupImages(topCovers, 600);
    }
  }, [posts]);

  const categories: (FootballCategory | 'Todas')[] = [
    'Todas',
    'Seleção Brasileira',
    'Clubes Serie A',
    'Clubes Serie B',
    'Jogadores',
    'Equipe Técnica',
    'Eventos'
  ];

  const filteredPosts = useMemo(() => {
    const matched = posts
      .filter((post) => {
        const matchesCategory = selectedCat === 'Todas' || post.category === selectedCat;
        const matchesSearch =
          !search ||
          post.title.toLowerCase().includes(search.toLowerCase()) ||
          post.summary.toLowerCase().includes(search.toLowerCase()) ||
          post.authorName.toLowerCase().includes(search.toLowerCase()) ||
          post.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'views') return (b.viewsCount || 0) - (a.viewsCount || 0);
        if (sortBy === 'likes') return (b.likesCount || 0) - (a.likesCount || 0);
        return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
      });

    // Deduplicação instantânea sem atraso: garante que nenhuma imagem ou matéria se repita
    const seenIds = new Set<string>();
    const seenImages = new Set<string>();
    const sanitized: Post[] = [];

    for (const post of matched) {
      if (seenIds.has(post.id)) continue;
      seenIds.add(post.id);

      const coverClean = (post.coverImage || '').split('?')[0];
      const photoIdMatch = (post.coverImage || '').match(/photo-[a-zA-Z0-9_-]+/);
      const photoKey = photoIdMatch ? photoIdMatch[0] : coverClean;

      if (photoKey && seenImages.has(photoKey)) {
        // Se a imagem já foi exibida em postagem anterior, obtém imagem temática esportiva única
        const replacement = getUniqueThematicImageForPost(
          post.title,
          post.summary,
          post.category,
          seenImages
        );
        const newPhotoMatch = replacement.url.match(/photo-[a-zA-Z0-9_-]+/);
        const newKey = newPhotoMatch ? newPhotoMatch[0] : replacement.url.split('?')[0];
        seenImages.add(newKey);
        sanitized.push({
          ...post,
          coverImage: replacement.url,
          thematicConcept: post.thematicConcept || replacement.thematicConcept,
        });
      } else {
        if (photoKey) seenImages.add(photoKey);
        sanitized.push(post);
      }
    }

    return sanitized;
  }, [posts, selectedCat, search, sortBy]);

  return (
    <div className="w-full space-y-6">
      {/* Header of View */}
      <div className="card-football rounded-2xl p-6 border-emerald-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              Todas as Postagens do CampoBR
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Explore o arquivo completo de coberturas, crônicas e análises exclusivas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por termo ou jogador..."
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>

            {/* Sort selection */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-300 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer"
              >
                <option value="recent" className="bg-slate-900">Mais Recentes</option>
                <option value="views" className="bg-slate-900">Mais Visualizados</option>
                <option value="likes" className="bg-slate-900">Mais Curtidos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filtrar:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCat === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of articles */}
      {filteredPosts.length === 0 ? (
        <div className="card-football rounded-2xl p-12 text-center">
          <p className="text-base text-slate-300 font-semibold">Nenhuma matéria encontrada para os filtros selecionados.</p>
          <button
            onClick={() => { setSearch(''); setSelectedCat('Todas'); }}
            className="mt-3 text-xs text-emerald-400 hover:underline font-bold"
          >
            Limpar Filtros de Busca
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => {
            const formattedDate = new Date(post.publishedAt || post.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short'
            });

            return (
              <article
                key={post.id}
                onClick={() => onReadPost(post)}
                className="card-football rounded-2xl overflow-hidden flex flex-col justify-between cursor-pointer group hover:scale-[1.01] transition-all"
              >
                <div>
                  {/* Cover with FastImage */}
                  <div className="relative w-full h-48 bg-slate-900 overflow-hidden">
                    <FastImage
                      src={post.coverImage}
                      alt={post.title}
                      widthTarget={600}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none"></div>
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase pointer-events-none">
                      {post.category}
                    </span>
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-amber-400/40 text-amber-300 font-bold text-[9px] flex items-center gap-1 shadow-md pointer-events-none">
                      <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                      Visual de Alto Impacto
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" /> {post.readTimeMinutes || 4} min
                      </span>
                    </div>

                    <h3 className="font-display font-black text-lg text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {post.summary}
                    </p>
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="p-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.authorAvatar || '/logo-512x512.png'}
                      alt={post.authorName || 'CampoBR'}
                      className="w-6 h-6 rounded-full object-cover border border-emerald-500/40 bg-black p-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="truncate max-w-[130px] font-medium text-slate-300">
                        {post.authorName}
                      </span>
                      {(post.thematicConcept || post.aiImageMention) && (
                        <span className="text-[10px] text-amber-300/80 italic flex items-center gap-1 mt-0.5 truncate max-w-[150px]" title={post.thematicConcept || post.aiImageMention}>
                          <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate">
                            {post.thematicConcept ? post.thematicConcept.split('|')[0].trim() : post.aiImageMention}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
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

                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                      <Eye className="w-3.5 h-3.5" />
                      {post.viewsCount.toLocaleString('pt-BR')}
                    </span>
                    <button
                      onClick={(e) => onLikePost(e, post)}
                      className="flex items-center gap-1 text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      <Heart className={`w-3.5 h-3.5 ${post.likesCount > 0 ? 'text-rose-500 fill-rose-500' : ''}`} />
                      <span>{post.likesCount.toLocaleString('pt-BR')}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
