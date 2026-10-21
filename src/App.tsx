/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Post, FootballCategory, AdSenseConfig, MatchLiveScore, PageTab, AdminSession } from './types';
import { 
  fetchAllPosts, 
  subscribeToPosts,
  registerPostView, 
  togglePostLike, 
  getAdSenseConfig,
  isOnlineFirebase,
  deletePostById
} from './services/firebase';
import { adminAuthService } from './services/adminAuth';
import { Header } from './components/Header';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebarAds } from './components/RightSidebarAds';
import { FeaturedHeroPost } from './components/FeaturedHeroPost';
import { Top10PostsList } from './components/Top10PostsList';
import { PostsView } from './components/PostsView';
import { NewsView } from './components/NewsView';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { PostDetailModal } from './components/PostDetailModal';
import { LegalModal, LegalDocType } from './components/LegalModal';
import { Admin2FAModal } from './components/Admin2FAModal';
import { QuickPostModal } from './components/QuickPostModal';
import { DownloadModal } from './components/DownloadModal';
import { downloadSourceZipReliable } from './services/zipDownloader';
import { MobileStickyAnchorAd } from './components/MobileStickyAnchorAd';
import { LATEST_GOOGLE_MATCHES } from './services/googleSportsService';
import { automationService } from './services/automationService';
import { Loader2, Trash2, AlertTriangle, X, ArrowUp, ArrowDown } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<PageTab>('inicio');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FootballCategory | 'Todas'>('Todas');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [legalModalType, setLegalModalType] = useState<LegalDocType | null>(null);
  const [adsConfig, setAdsConfig] = useState<AdSenseConfig>(getAdSenseConfig());
  const [showPageScrollNav, setShowPageScrollNav] = useState(false);

  // Admin 2FA Auth State
  const [adminSession, setAdminSession] = useState<AdminSession | null>(() => adminAuthService.getCurrentSession());
  const [showAdmin2FAModal, setShowAdmin2FAModal] = useState(false);

  // Quick Post Create/Edit Modal State (null = new post, Post = edit post, undefined = closed)
  const [quickPostTarget, setQuickPostTarget] = useState<Post | null | undefined>(undefined);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<Post | null>(null);
  const [adminNotification, setAdminNotification] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const isAdminLoggedIn = Boolean(adminSession);

  // Real-time football scoreboard for Brazilian games synchronized with Google Sports
  const [liveMatches] = useState<MatchLiveScore[]>(LATEST_GOOGLE_MATCHES);

  // Load posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await fetchAllPosts();
      setPosts(data);
    } catch (err) {
      console.error('Erro ao carregar postagens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    const unsubscribe = subscribeToPosts((livePosts) => {
      if (livePosts && livePosts.length > 0) {
        setPosts(livePosts);
        setLoading(false);
      }
    });

    // Watcher de Automação & Publicação em Segundo Plano (Otimizado para economia de recursos e bateria)
    const runIdleCheck = () => {
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => automationService.checkAndRun(() => loadPosts()));
      } else {
        setTimeout(() => automationService.checkAndRun(() => loadPosts()), 100);
      }
    };

    runIdleCheck();
    const autoInterval = setInterval(runIdleCheck, 60000);

    const handleWindowScroll = () => {
      setShowPageScrollNav(window.scrollY > 350);
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });

    return () => {
      unsubscribe();
      clearInterval(autoInterval);
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, []);

  // Deep Linking: Ao carregar ou receber posts, abre matéria da URL (?materia=slug ou #materia)
  useEffect(() => {
    if (posts.length === 0) return;

    const parseUrlAndOpenPost = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Suporte a páginas institucionais diretas para Google AdSense
        const legalParam = urlParams.get('legal') || urlParams.get('institucional') || urlParams.get('page');
        if (legalParam && ['privacidade', 'termos', 'sobre', 'editorial', 'contato', 'avisos', 'firebase'].includes(legalParam)) {
          setLegalModalType(legalParam as LegalDocType);
          return;
        }

        // Suporte a download direto (?download=source, ?download=codigo ou #download)
        const downloadParam = urlParams.get('download');
        const hash = window.location.hash.replace(/^#/, '');
        if (downloadParam === 'source' || downloadParam === 'codigo' || downloadParam === 'all' || downloadParam === 'zip' || hash === 'download') {
          setIsDownloadModalOpen(true);
          downloadSourceZipReliable();
          return;
        }

        const slugOrId = urlParams.get('materia') || urlParams.get('post');
        if (slugOrId) {
          const found = posts.find(p => p.slug === slugOrId || p.id === slugOrId);
          if (found) {
            setSelectedPost(found);
            return;
          }
        }

        // Suporte a hash (#sobre, #contato, #privacidade, #post-id ou #slug)
        if (hash) {
          if (['privacidade', 'termos', 'sobre', 'editorial', 'contato', 'avisos', 'firebase'].includes(hash)) {
            setLegalModalType(hash as LegalDocType);
            return;
          }
          const found = posts.find(p => p.slug === hash || p.id === hash);
          if (found) {
            setSelectedPost(found);
            return;
          }
        }
      } catch {
        // safe fallback
      }
    };

    parseUrlAndOpenPost();

    const handlePopState = () => {
      parseUrlAndOpenPost();
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('materia') && !urlParams.get('post') && !window.location.hash) {
        setSelectedPost(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [posts]);

  const notifyAdmin = (msg: string) => {
    setAdminNotification(msg);
    setTimeout(() => {
      setAdminNotification(null);
    }, 4000);
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [posts]);

  // Filtered posts for search and category
  const filteredFeedPosts = useMemo(() => {
    const nowTime = Date.now();
    return posts.filter((p) => {
      // Se não for admin logado, não exibe posts agendados cujo horário ainda não chegou
      if (!isAdminLoggedIn && p.status === 'scheduled') {
        const isReady = (p.scheduledFor || p.publishedAt) && new Date(p.scheduledFor || p.publishedAt).getTime() <= nowTime;
        if (!isReady) return false;
      }

      const matchCat = selectedCategory === 'Todas' || p.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [posts, selectedCategory, searchQuery, isAdminLoggedIn]);

  // The latest post for Featured Hero:
  const featuredPost = useMemo(() => {
    if (filteredFeedPosts.length === 0) return posts[0] || null;
    const sorted = [...filteredFeedPosts].sort(
      (a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
    );
    const explicitFeatured = sorted.find((p) => p.featured);
    return explicitFeatured || sorted[0];
  }, [filteredFeedPosts, posts]);

  // Posts for the Top 10 list
  const top10SourcePosts = filteredFeedPosts.length > 0 ? filteredFeedPosts : posts;

  // Handle Reading a Post com sincronização da URL (Deep Linking & Histórico)
  const handleReadPost = async (post: Post, updateHistory = true) => {
    setSelectedPost(post);
    if (updateHistory && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('materia', post.slug || post.id);
      window.history.pushState({ postId: post.id }, '', url.toString());
    }
    await registerPostView(post.id);
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, viewsCount: (p.viewsCount || 0) + 1 } : p))
    );
  };

  const handleClosePostModal = () => {
    setSelectedPost(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('materia');
      url.searchParams.delete('post');
      window.history.pushState(null, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  // Internal link navigation (when clicking [texto](internal:post-id))
  const handleNavigateToPost = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (target) {
      handleReadPost(target);
    }
  };

  // Handle Like
  const handleLikePost = async (e: React.MouseEvent, post: Post) => {
    e.stopPropagation();
    const newLikes = await togglePostLike(post.id);
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likesCount: newLikes } : p))
    );
  };

  // Post updated in modal
  const handlePostUpdated = (updated: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (selectedPost?.id === updated.id) {
      setSelectedPost(updated);
    }
  };

  const handleSelectCategory = (cat: FootballCategory | 'Todas') => {
    setSelectedCategory(cat);
    if (activeTab !== 'inicio') {
      setActiveTab('inicio');
    }
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Admin 2FA Login Success
  const handleAdminLoginSuccess = (session: AdminSession) => {
    setAdminSession(session);
    setShowAdmin2FAModal(false);
    notifyAdmin('Modo Administrador autenticado com sucesso via Google!');
  };

  // Admin Logout
  const handleAdminLogout = () => {
    adminAuthService.logout();
    setAdminSession(null);
    notifyAdmin('Sessão administrativa encerrada com segurança.');
  };

  // Trigger New Post
  const handleStartNewPost = () => {
    if (!isAdminLoggedIn) {
      setShowAdmin2FAModal(true);
      return;
    }
    setQuickPostTarget(null);
  };

  // Trigger Edit Post
  const handleStartEditPost = (post: Post) => {
    if (!isAdminLoggedIn) {
      setShowAdmin2FAModal(true);
      return;
    }
    setQuickPostTarget(post);
  };

  // Trigger Delete Post
  const handleRequestDeletePost = (post: Post) => {
    if (!isAdminLoggedIn) {
      setShowAdmin2FAModal(true);
      return;
    }
    setDeleteConfirmPost(post);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmPost) return;
    try {
      await deletePostById(deleteConfirmPost.id);
      setPosts((prev) => prev.filter((p) => p.id !== deleteConfirmPost.id));
      if (selectedPost?.id === deleteConfirmPost.id) {
        setSelectedPost(null);
      }
      notifyAdmin(`Matéria "${deleteConfirmPost.title}" excluída com sucesso.`);
      setDeleteConfirmPost(null);
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  // Related posts for the active article reader modal
  const relatedPosts = useMemo(() => {
    if (!selectedPost) return [];
    return posts.filter(
      (p) =>
        p.id !== selectedPost.id &&
        (p.category === selectedPost.category ||
          (p.tags && selectedPost.tags && p.tags.some((t) => selectedPost.tags?.includes(t))))
    );
  }, [selectedPost, posts]);

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 pitch-bg flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Admin Floating Notification Toast */}
      {adminNotification && (
        <div className="fixed bottom-6 right-6 z-[90] px-4 py-3 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-300 text-sm font-bold shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span>{adminNotification}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        currentTab={activeTab}
        onSelectTab={(tab: PageTab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        isFirebaseConnected={isOnlineFirebase()}
        onOpenFirebaseModal={() => setLegalModalType('firebase')}
        isAdminLoggedIn={isAdminLoggedIn}
        adminSession={adminSession}
        onOpenAdmin2FA={() => setShowAdmin2FAModal(true)}
        onOpenNewPost={handleStartNewPost}
        onAdminLogout={handleAdminLogout}
        onOpenDownload={() => setIsDownloadModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            <p className="font-display font-bold text-slate-400 text-sm tracking-wide">
              Carregando o CampoBR...
            </p>
          </div>
        ) : (
          <>
            {/* VIEW 1: INÍCIO (Home Feed with 3 Columns: Left Sidebar, Main Center Feed, Right AdSense Sidebar) */}
            {activeTab === 'inicio' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Left Column: Categories, Search, Scores (col-span-3) */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                  <LeftSidebar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    categoryCounts={categoryCounts}
                    liveMatches={liveMatches}
                  />
                </div>

                {/* Center Column: Feed (Featured latest post + Top 10 Most Viewed) (col-span-6) */}
                <div className="lg:col-span-6 order-1 lg:order-2 space-y-8">
                  {/* Category / Search Alert Banner */}
                  {(selectedCategory !== 'Todas' || searchQuery) && (
                    <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">Filtrando por: </span>
                        {selectedCategory !== 'Todas' && (
                          <span className="text-emerald-400 font-bold mr-2">[{selectedCategory}]</span>
                        )}
                        {searchQuery && (
                          <span className="text-cyan-400">"{searchQuery}"</span>
                        )}
                      </div>
                      <button
                        onClick={() => { setSelectedCategory('Todas'); setSearchQuery(''); }}
                        className="text-emerald-400 hover:underline font-bold text-[11px] cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  )}

                  {/* 1. EM DESTAQUE A ÚLTIMA POSTAGEM */}
                  {featuredPost ? (
                    <FeaturedHeroPost
                      post={featuredPost}
                      onReadPost={handleReadPost}
                      onLikePost={handleLikePost}
                      isAdminLoggedIn={isAdminLoggedIn}
                      onEditPost={handleStartEditPost}
                      onDeletePost={handleRequestDeletePost}
                    />
                  ) : (
                    <div className="card-football rounded-3xl p-8 text-center">
                      <p className="text-slate-400 text-sm">Nenhuma postagem encontrada para os filtros selecionados.</p>
                    </div>
                  )}

                  {/* 2. MINIATURAS EM LISTA DE 10 POSTAGENS MAIS VISTAS NO BLOG (SEM DUPLICAR O DESTAQUE) */}
                  <Top10PostsList
                    posts={top10SourcePosts}
                    featuredPostId={featuredPost?.id}
                    onReadPost={handleReadPost}
                    onLikePost={handleLikePost}
                    isAdminLoggedIn={isAdminLoggedIn}
                    onEditPost={handleStartEditPost}
                    onDeletePost={handleRequestDeletePost}
                  />
                </div>

                {/* Right Column: Google AdSense Monetization Area (col-span-3) */}
                <div className="lg:col-span-3 order-3">
                  <RightSidebarAds
                    adsConfig={adsConfig}
                    isAdminLoggedIn={isAdminLoggedIn}
                    onOpenAdminAds={() => setActiveTab('admin')}
                  />
                </div>
              </div>
            )}

            {/* VIEW 2: POSTAGENS (Full Catalog with filter pills and search) */}
            {activeTab === 'postagens' && (
              <PostsView
                posts={posts}
                onReadPost={handleReadPost}
                onLikePost={handleLikePost}
                initialCategory={selectedCategory}
                isAdminLoggedIn={isAdminLoggedIn}
                onEditPost={handleStartEditPost}
                onDeletePost={handleRequestDeletePost}
              />
            )}

            {/* VIEW 3: NOTÍCIAS (Live ticker, real-time matches, market transfers) */}
            {activeTab === 'noticias' && (
              <NewsView
                posts={posts}
                liveMatches={liveMatches}
                onReadPost={handleReadPost}
              />
            )}

            {/* VIEW 4: ADMIN (Full Control Panel with 2FA Gate, CRUD, Ads, Firebase) */}
            {activeTab === 'admin' && (
              <AdminPanel
                posts={posts}
                adsConfig={adsConfig}
                onRefreshPosts={loadPosts}
                onUpdateAdsConfig={(cfg) => setAdsConfig(cfg)}
                isAdminLoggedIn={isAdminLoggedIn}
                adminSession={adminSession}
                onAdminLoginSuccess={handleAdminLoginSuccess}
                onAdminLogout={handleAdminLogout}
                onOpenQuickNewPost={handleStartNewPost}
              />
            )}
          </>
        )}
      </main>

      {/* Structured Footer with legal notices, privacy, about, copyright */}
      <Footer
        onOpenLegal={(type) => setLegalModalType(type)}
        onSelectCategory={handleSelectCategory}
        onOpenAdmin={() => {
          setActiveTab('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Post Reading Modal with Full Article Renderer & Admin Controls */}
      <PostDetailModal
        post={selectedPost}
        onClose={handleClosePostModal}
        onPostUpdated={handlePostUpdated}
        isAdminLoggedIn={isAdminLoggedIn}
        onEditPost={handleStartEditPost}
        onDeletePost={handleRequestDeletePost}
        onNavigateToPost={handleNavigateToPost}
        relatedPosts={relatedPosts}
        adsConfig={adsConfig}
      />

      {/* Quick Post Create/Edit Modal */}
      {quickPostTarget !== undefined && (
        <QuickPostModal
          isOpen={true}
          editingPost={quickPostTarget}
          onClose={() => setQuickPostTarget(undefined)}
          onPostSaved={() => {
            setQuickPostTarget(undefined);
            loadPosts();
            notifyAdmin(quickPostTarget ? 'Matéria atualizada com sucesso!' : 'Nova matéria publicada no CampoBR!');
          }}
          availablePosts={posts}
        />
      )}

      {/* Admin 2-Step Verification Modal */}
      <Admin2FAModal
        isOpen={showAdmin2FAModal}
        onClose={() => setShowAdmin2FAModal(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      {/* Official Download Modal (ZIP) */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="card-football max-w-md w-full rounded-2xl p-6 border-rose-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white">
                  Confirmar Exclusão
                </h3>
                <p className="text-xs text-rose-300">
                  Ação de Administrador
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Você tem certeza que deseja excluir permanentemente a matéria:
            </p>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200">
              <p className="font-bold text-white line-clamp-2">{deleteConfirmPost.title}</p>
              <p className="text-[11px] text-emerald-400 mt-1">Categoria: {deleteConfirmPost.category}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmPost(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-900/50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Matéria</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal and Information Modals */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Mobile Sticky Footer Anchor Ad (Padrão AdSense Oficial) */}
      <MobileStickyAnchorAd adsConfig={adsConfig} />

      {/* Botões Flutuantes de Rolagem Rápida na Página Principal (Topo / Fim) */}
      {showPageScrollNav && !selectedPost && (
        <div className="fixed bottom-20 right-5 sm:right-7 z-40 flex flex-col gap-2 animate-fade-in">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-3 rounded-2xl bg-[#090f18]/95 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-slate-700/90 shadow-2xl transition-all cursor-pointer group flex items-center justify-center"
            title="Subir rapidamente até o topo da página"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="p-3 rounded-2xl bg-[#090f18]/95 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-slate-700/90 shadow-2xl transition-all cursor-pointer group flex items-center justify-center"
            title="Descer rapidamente até o rodapé da página"
          >
            <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
