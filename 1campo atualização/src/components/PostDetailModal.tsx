import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Post, Comment, AdSenseConfig } from '../types';
import { fetchPostComments, addPostComment, togglePostLike } from '../services/firebase';
import { 
  X, 
  Eye, 
  Heart, 
  Share2, 
  MessageSquare, 
  Clock, 
  Calendar, 
  Check, 
  Send, 
  User,
  Sparkles,
  Edit3,
  Trash2,
  Compass,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ListFilter,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Trophy,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Sliders,
  Type,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { ArticleContentRenderer } from './ArticleContentRenderer';
import { ArticleAdSenseSlot } from './ArticleAdSenseSlot';
import { ShopeeAffiliateShowcase } from './ShopeeAffiliateShowcase';
import { FanPollWidget } from './FanPollWidget';
import { FastImage } from './FastImage';
import { DEFAULT_FALLBACK_IMAGE } from '../services/imageOptimizer';
import { valueAnalyticsService } from '../services/valueAnalyticsService';

interface PostDetailModalProps {
  post: Post | null;
  onClose: () => void;
  onPostUpdated: (updatedPost: Post) => void;
  isAdminLoggedIn?: boolean;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (post: Post) => void;
  onNavigateToPost?: (slugOrId: string) => void;
  relatedPosts?: Post[];
  adsConfig?: AdSenseConfig;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onPostUpdated,
  isAdminLoggedIn = false,
  onEditPost,
  onDeletePost,
  onNavigateToPost,
  relatedPosts = [],
  adsConfig,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentName, setNewCommentName] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [likes, setLikes] = useState(post?.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [readingProgress, setReadingProgress] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(1);
  const [showSummaryDrawer, setShowSummaryDrawer] = useState(false);
  const [reportErrorOpen, setReportErrorOpen] = useState(false);
  const [reportErrorSent, setReportErrorSent] = useState(false);
  const [reportErrorText, setReportErrorText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Modo Leitura: Ajuste de Contraste, Tipografia Editorial e Conforto Visual
  const [isReadingMode, setIsReadingMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('campobr_reading_mode') === 'true';
    }
    return false;
  });
  const [readingTheme, setReadingTheme] = useState<'sepia' | 'oled' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('campobr_reading_theme');
      if (saved === 'sepia' || saved === 'oled' || saved === 'dark') return saved;
    }
    return 'sepia';
  });
  const [readingFont, setReadingFont] = useState<'serif' | 'sans'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('campobr_reading_font');
      if (saved === 'serif' || saved === 'sans') return saved;
    }
    return 'serif';
  });
  const [readingLineHeight, setReadingLineHeight] = useState<'normal' | 'relaxed'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('campobr_reading_lh');
      if (saved === 'normal' || saved === 'relaxed') return saved;
    }
    return 'relaxed';
  });
  const [showReadingPreferences, setShowReadingPreferences] = useState(false);

  const toggleReadingMode = () => {
    setIsReadingMode(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('campobr_reading_mode', String(next));
      }
      return next;
    });
  };

  const handleThemeChange = (theme: 'sepia' | 'oled' | 'dark') => {
    setReadingTheme(theme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('campobr_reading_theme', theme);
    }
  };

  const handleFontChange = (font: 'serif' | 'sans') => {
    setReadingFont(font);
    if (typeof window !== 'undefined') {
      localStorage.setItem('campobr_reading_font', font);
    }
  };

  const handleLineHeightChange = (lh: 'normal' | 'relaxed') => {
    setReadingLineHeight(lh);
    if (typeof window !== 'undefined') {
      localStorage.setItem('campobr_reading_lh', lh);
    }
  };

  const themeStyles = useMemo(() => {
    if (!isReadingMode) {
      return {
        modalBg: 'bg-[#080d14]',
        modalBorder: 'border-emerald-500/30',
        headerBg: 'bg-[#090f18]/95 border-slate-800',
        titleColor: 'text-white font-display',
        summaryBg: 'border-emerald-500 bg-emerald-950/10 text-slate-300',
        authorBorder: 'border-slate-800 text-slate-400',
        scrollBg: 'article-scrollbar',
        pillBg: 'bg-slate-900 border-slate-700/80 text-slate-400',
      };
    }
    if (readingTheme === 'sepia') {
      return {
        modalBg: 'bg-[#191510]',
        modalBorder: 'border-amber-900/50 shadow-2xl shadow-amber-950/50',
        headerBg: 'bg-[#14100c]/95 border-amber-950/80',
        titleColor: readingFont === 'serif' ? 'text-[#f5efe6] font-serif' : 'text-[#f5efe6] font-sans',
        summaryBg: 'border-amber-600 bg-amber-950/30 text-[#e6ded2]',
        authorBorder: 'border-amber-950/70 text-[#c8bcad]',
        scrollBg: 'article-scrollbar',
        pillBg: 'bg-[#221c15] border-amber-900/60 text-[#dfd4c5]',
      };
    }
    if (readingTheme === 'oled') {
      return {
        modalBg: 'bg-[#000000]',
        modalBorder: 'border-zinc-800 shadow-2xl shadow-black',
        headerBg: 'bg-[#000000]/95 border-zinc-900',
        titleColor: readingFont === 'serif' ? 'text-[#ffffff] font-serif' : 'text-[#ffffff] font-sans',
        summaryBg: 'border-emerald-400 bg-zinc-900/50 text-[#e4e4e7]',
        authorBorder: 'border-zinc-800 text-zinc-400',
        scrollBg: 'article-scrollbar',
        pillBg: 'bg-zinc-900 border-zinc-700 text-zinc-300',
      };
    }
    // dark suave
    return {
      modalBg: 'bg-[#0b1017]',
      modalBorder: 'border-slate-800 shadow-2xl',
      headerBg: 'bg-[#080d14]/95 border-slate-800',
      titleColor: readingFont === 'serif' ? 'text-[#f8fafc] font-serif' : 'text-[#f8fafc] font-sans',
      summaryBg: 'border-teal-500 bg-teal-950/20 text-[#cbd5e1]',
      authorBorder: 'border-slate-800 text-slate-400',
      scrollBg: 'article-scrollbar',
      pillBg: 'bg-slate-900 border-slate-700 text-slate-300',
    };
  }, [isReadingMode, readingTheme, readingFont]);

  // Garante que artigos relacionados tenham 100% imagens distintas entre si e distintas da matéria atual
  const uniqueRelatedPosts = useMemo<Post[]>(() => {
    if (!post || !relatedPosts) return [];
    const mainPhotoClean = (post.coverImage || '').split('?')[0];
    const mainPhotoMatch = (post.coverImage || '').match(/photo-[a-zA-Z0-9_-]+/);
    const mainKey = mainPhotoMatch ? mainPhotoMatch[0] : mainPhotoClean;

    const seenCovers = new Set<string>();
    if (mainKey) seenCovers.add(mainKey);

    const result: Post[] = [];
    for (const rel of relatedPosts) {
      if (rel.id === post.id) continue;
      const relClean = (rel.coverImage || '').split('?')[0];
      const relMatch = (rel.coverImage || '').match(/photo-[a-zA-Z0-9_-]+/);
      const relKey = relMatch ? relMatch[0] : relClean;

      if (!seenCovers.has(relKey)) {
        seenCovers.add(relKey);
        result.push(rel);
      }
      if (result.length === 4) break;
    }
    return result;
  }, [post, relatedPosts]);

  const fontSizeClassMap = {
    normal: 'text-[17px] sm:text-[18px]',
    large: 'text-[19px] sm:text-[20px]',
    xlarge: 'text-[21px] sm:text-[22px]',
  };

  useEffect(() => {
    if (post) {
      setLikes(post.likesCount || 0);
      setHasLiked(false);
      setReadingProgress(0);
      fetchPostComments(post.id).then(setComments);

      // Dynamic SEO & Schema.org NewsArticle for Google AdSense & Search crawlers
      const originalTitle = document.title;
      document.title = `${post.title} | CampoBR`;

      const metaDesc = document.querySelector('meta[name="description"]');
      const originalDesc = metaDesc?.getAttribute('content') || '';
      if (metaDesc && post.summary) {
        metaDesc.setAttribute('content', post.summary);
      }

      const schemaScriptId = 'article-jsonld-schema';
      const existingSchema = document.getElementById(schemaScriptId);
      if (existingSchema) existingSchema.remove();

      const script = document.createElement('script');
      script.id = schemaScriptId;
      script.type = 'application/ld+json';
      script.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": post.title,
        "description": post.summary,
        "image": [post.coverImage],
        "datePublished": post.publishedAt || post.createdAt,
        "dateModified": post.updatedAt || post.publishedAt || post.createdAt,
        "author": [{
          "@type": "Person",
          "name": post.authorName,
          "jobTitle": post.authorRole || "Redação CampoBR"
        }],
        "publisher": {
          "@type": "NewsMediaOrganization",
          "name": "CampoBR",
          "url": "https://campobr.blog",
          "logo": {
            "@type": "ImageObject",
            "url": "https://campobr.blog/logo-512x512.png"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `${window.location.origin}/materia/${post.slug || post.id}`
        },
        "articleSection": post.category,
        "inLanguage": "pt-BR"
      });
      document.head.appendChild(script);

      return () => {
        document.title = originalTitle;
        if (metaDesc && originalDesc) {
          metaDesc.setAttribute('content', originalDesc);
        }
        const s = document.getElementById(schemaScriptId);
        if (s) s.remove();
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      };
    }
  }, [post]);

  // Clean audio on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleSpeechAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      if (!post) return;
      // Strip markdown syntax for natural voice reading
      const cleanText = `${post.title}. ${post.summary}. ${post.content
        .replace(/[#*`>|\[\]\(\)-]/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 2500)}`;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = audioSpeed;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  const changeAudioSpeed = () => {
    const nextSpeed = audioSpeed === 1 ? 1.5 : audioSpeed === 1.5 ? 2 : 1;
    setAudioSpeed(nextSpeed);
    if (isPlayingAudio && post) {
      window.speechSynthesis.cancel();
      const cleanText = `${post.title}. ${post.summary}. ${post.content
        .replace(/[#*`>|\[\]\(\)-]/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 2500)}`;
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = nextSpeed;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendReportError = (e: React.FormEvent) => {
    e.preventDefault();
    setReportErrorSent(true);
    setTimeout(() => {
      setReportErrorOpen(false);
      setReportErrorSent(false);
      setReportErrorText('');
    }, 2500);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const totalHeight = target.scrollHeight - target.clientHeight;
    if (totalHeight > 0) {
      const current = Math.min(100, Math.max(0, Math.round((target.scrollTop / totalHeight) * 100)));
      setReadingProgress(current);
    }
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  if (!post) return null;

  const postDateObj = new Date(post.publishedAt || post.createdAt);
  const formattedDate = postDateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = postDateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleLike = async () => {
    if (hasLiked) return;
    const newCount = await togglePostLike(post.id);
    setLikes(newCount);
    setHasLiked(true);
    onPostUpdated({ ...post, likesCount: newCount });
  };

  const handleShare = (network: 'whatsapp' | 'twitter' | 'copy') => {
    const platform = network === 'copy' ? 'copy_link' : network;
    valueAnalyticsService.trackArticleShare(platform, post.id);
    const url = `${window.location.origin}/materia/${post.slug || post.id}`;
    const shareMessage = `⚽ *${post.title}*\n\nConfira os bastidores e a análise completa no CampoBR:\n${url}`;

    if (network === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
    } else if (network === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setIsSubmitting(true);
    try {
      const added = await addPostComment(post.id, newCommentName, newCommentText);
      setComments([added, ...comments]);
      setNewCommentText('');
    } catch (err) {
      console.error('Erro ao postar comentário:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 md:p-6 animate-fade-in">
      <div className={`relative w-full max-w-4xl border-0 sm:border rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[92vh] transition-colors duration-300 ${themeStyles.modalBg} ${themeStyles.modalBorder}`}>
        {/* Glowing Reading Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-900 z-30 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-green-500 transition-all duration-150 shadow-sm shadow-emerald-400"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        {/* Sticky top action bar */}
        <div className={`sticky top-0 z-20 px-4 sm:px-6 py-3.5 backdrop-blur-md border-b flex items-center justify-between transition-colors duration-300 ${themeStyles.headerBg}`}>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase tracking-wider">
              {post.category}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs text-slate-400 hidden sm:inline flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Admin Actions if Admin Logged In */}
            {isAdminLoggedIn && (
              <div className="flex items-center gap-1.5 mr-2 pr-2 border-r border-slate-800">
                <button
                  onClick={() => onEditPost && onEditPost(post)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Editar esta matéria"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
                <button
                  onClick={() => onDeletePost && onDeletePost(post)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Excluir esta matéria"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Excluir</span>
                </button>
              </div>
            )}

            {/* TOGGLE MODO LEITURA: Ajuste de Contraste e Tipografia */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleReadingMode}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  isReadingMode
                    ? readingTheme === 'sepia'
                      ? 'bg-amber-500/25 border-amber-500 text-amber-200'
                      : readingTheme === 'oled'
                        ? 'bg-zinc-800 border-zinc-500 text-white'
                        : 'bg-emerald-500/25 border-emerald-500 text-emerald-300'
                    : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
                title={isReadingMode ? 'Desativar Modo Leitura' : 'Ativar Modo Leitura (Ajusta contraste, tipografia e conforto visual)'}
              >
                <BookOpen className={`w-3.5 h-3.5 ${isReadingMode ? 'fill-current text-amber-400' : 'text-emerald-400'}`} />
                <span className="hidden xs:inline sm:inline">
                  {isReadingMode ? 'Modo Leitura' : 'Modo Leitura'}
                </span>
                {isReadingMode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
                )}
              </button>

              {/* Botão de Ajustes Rápidos do Modo Leitura */}
              {isReadingMode && (
                <button
                  type="button"
                  onClick={() => setShowReadingPreferences(!showReadingPreferences)}
                  className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                    showReadingPreferences
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Ajustar contraste, paleta e tipografia"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Font Size Adjuster Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => setFontSizeLevel('normal')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer font-bold ${
                  fontSizeLevel === 'normal' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'hover:text-white'
                }`}
                title="Tamanho padrão de leitura"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSizeLevel('large')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer font-bold text-sm ${
                  fontSizeLevel === 'large' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'hover:text-white'
                }`}
                title="Aumentar fonte"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => setFontSizeLevel('xlarge')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer font-bold text-base ${
                  fontSizeLevel === 'xlarge' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'hover:text-white'
                }`}
                title="Fonte extra grande"
              >
                A++
              </button>
            </div>

            <button
              onClick={() => handleShare('whatsapp')}
              className="hidden sm:inline-block px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-900 text-xs font-bold transition-colors cursor-pointer"
              title="Compartilhar no WhatsApp"
            >
              WhatsApp
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Copiar Link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-400 hover:text-white transition-all cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Painel Expansível de Preferências do Modo Leitura */}
        {isReadingMode && showReadingPreferences && (
          <div className="px-6 py-3.5 bg-black/60 border-b border-amber-900/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs animate-fade-in z-20">
            {/* 1. Contraste & Tema */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Palette className="w-3 h-3 text-amber-400" /> Contraste:
              </span>
              <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleThemeChange('sepia')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    readingTheme === 'sepia'
                      ? 'bg-[#2a2217] text-amber-200 border border-amber-600/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Sépia Quente: Suaviza luz azul e reduz a fadiga ocular"
                >
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Sépia Conforto</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('oled')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    readingTheme === 'oled'
                      ? 'bg-zinc-800 text-white border border-zinc-600 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Preto Puro OLED: Máximo contraste e nitidez"
                >
                  <Moon className="w-3 h-3 text-emerald-400" />
                  <span>Preto OLED</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                    readingTheme === 'dark'
                      ? 'bg-slate-800 text-teal-200 border border-teal-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Dark Suave: Fundo grafite editorial"
                >
                  <span>Dark Suave</span>
                </button>
              </div>
            </div>

            {/* 2. Tipografia */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Type className="w-3 h-3 text-cyan-400" /> Tipografia:
              </span>
              <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleFontChange('serif')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs font-serif transition-all cursor-pointer ${
                    readingFont === 'serif'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tipografia Serifada Editorial (Georgia / Livro)"
                >
                  Serifada (Livro)
                </button>
                <button
                  type="button"
                  onClick={() => handleFontChange('sans')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs font-sans transition-all cursor-pointer ${
                    readingFont === 'sans'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tipografia Sem Serifa Moderna (Sans)"
                >
                  Sem Serifa
                </button>
              </div>
            </div>

            {/* 3. Entrelinha */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Entrelinha:
              </span>
              <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleLineHeightChange('relaxed')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    readingLineHeight === 'relaxed'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Entrelinha ampla para respiração visual"
                >
                  Ampla (2.2x)
                </button>
                <button
                  type="button"
                  onClick={() => handleLineHeightChange('normal')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    readingLineHeight === 'normal'
                      ? 'bg-slate-800 text-slate-200'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Entrelinha padrão"
                >
                  Normal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Article Body */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={`overflow-y-auto px-6 sm:px-10 py-6 space-y-6 article-scrollbar scroll-smooth transition-colors duration-300 ${
            isReadingMode && readingFont === 'serif' ? 'font-serif' : ''
          }`}
        >
          {/* UOL-Style Kicker Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-500 pb-1">
            <span>UOL ESPORTE</span>
            <span className="text-slate-600">/</span>
            <span>FUTEBOL</span>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400">{post.category}</span>
          </div>

          {/* Article Title */}
          <h1 className={`font-black text-2xl sm:text-3xl md:text-4xl leading-tight tracking-tight transition-colors duration-200 ${
            isReadingMode ? themeStyles.titleColor : 'font-display text-white'
          }`}>
            {post.title}
          </h1>

          {/* Subtitle / Excerpt (UOL Editorial Linha Fina) */}
          <p className={`text-lg sm:text-xl font-normal leading-relaxed border-l-4 pl-4 py-1.5 rounded-r-xl transition-colors duration-200 ${
            isReadingMode ? themeStyles.summaryBg : 'border-emerald-500 bg-emerald-950/10 text-slate-300'
          }`}>
            {post.summary}
          </p>

          {/* Author info & metrics (Padrão UOL) */}
          <div className={`flex flex-wrap items-center justify-between gap-4 py-3.5 border-y text-xs transition-colors duration-200 ${
            isReadingMode ? themeStyles.authorBorder : 'border-slate-800 text-slate-400'
          }`}>
            <div className="flex items-center gap-3">
              <img
                src={post.authorAvatar || '/logo-512x512.png'}
                alt={post.authorName || 'CampoBR'}
                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400/50 bg-black p-0.5 shadow-sm"
              />
              <div>
                <p className={`font-bold text-sm ${isReadingMode ? (readingTheme === 'sepia' ? 'text-[#f5efe6]' : 'text-white') : 'text-white'}`}>
                  Por {post.authorName || 'CampoBR'}
                </p>
                <p className="text-slate-400 text-[11px]">
                  {formattedDate} às {formattedTime} • Atualizada às {formattedTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <Eye className="w-4 h-4" /> {post.viewsCount.toLocaleString('pt-BR')} lidas
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Clock className="w-4 h-4" /> {post.readTimeMinutes || 6} min de leitura
              </span>
            </div>
          </div>

          {/* UOL-Style Toolbar: Colaboração + Resumo + Ouvir Áudio (Native Web Speech) */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm text-xs">
            <div className="flex items-center gap-2">
              {/* Botão Resumo */}
              <button
                type="button"
                onClick={() => setShowSummaryDrawer(!showSummaryDrawer)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  showSummaryDrawer 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm' 
                    : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:text-white'
                }`}
                title="Visualizar tópicos e resumo do confronto"
              >
                <ListFilter className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resumo</span>
              </button>

              {/* Botão Ouvir Matéria (Web Speech Audio Player) */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={toggleSpeechAudio}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isPlayingAudio 
                      ? 'bg-emerald-500 text-slate-950 shadow-md animate-pulse' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                  title={isPlayingAudio ? 'Pausar leitura de voz' : 'Ouvir matéria na íntegra'}
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Ouvir</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={changeAudioSpeed}
                  className="px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-emerald-400 hover:bg-slate-900 rounded cursor-pointer"
                  title="Alterar velocidade de reprodução"
                >
                  {audioSpeed}x
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <span>Colaboração para o <strong>CampoBR</strong></span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Drawer de Resumo Rápido em Tópicos */}
          {showSummaryDrawer && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 animate-fade-in text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20">
                <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ListFilter className="w-4 h-4" /> Destaques e Síntese da Matéria
                </span>
                <button 
                  onClick={() => setShowSummaryDrawer(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-slate-200 leading-relaxed font-normal">
                {post.summary}
              </p>
            </div>
          )}

          {/* Cover Photo with FastImage (Priority High Preload) */}
          <div className="space-y-2">
            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-lg">
              <FastImage
                src={post.coverImage}
                alt={post.title}
                priority={true}
                widthTarget={1200}
                containerClassName="w-full h-full"
                className="w-full h-full object-cover object-center"
              />
            </div>
            {/* Thematic AI Concept & Editorial Review Box */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-200 flex items-center gap-2 flex-wrap">
                      <span>{post.thematicConcept ? post.thematicConcept.split('|')[0].trim() : 'Conceito Visual da IA'}</span>
                      {post.imageGenerationSource === 'gemini-ai' && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Google Gemini Imagem
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {post.thematicConcept && post.thematicConcept.includes('|') 
                        ? post.thematicConcept.split('|')[1].trim() 
                        : (post.aiImageMention || 'Arte fotográfica gerada pelo Google Gemini de acordo com todo o conteúdo da matéria.')}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 shrink-0">
                  {post.imageGenerationSource === 'gemini-ai' ? 'Gemini 3.1 Imagem' : 'Arte Fotográfica Única'}
                </span>
              </div>

              {/* Auditoria Editorial Inteligente */}
              {post.reviewedBy && (
                <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Revisão Editorial:</strong> {post.reviewNotes || 'Conteúdo produzido com apoio de IA a partir das fontes citadas.'}</span>
                  </div>
                  <span className="font-bold text-emerald-400 shrink-0 hidden sm:inline">
                    {post.editorialStatus || 'Aprovado'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Formatted Content with Rich ArticleContentRenderer (Headers, bold, internal/external links, quotes, and in-article ads) */}
          <ArticleContentRenderer 
            post={post}
            content={post.content} 
            onNavigateToPost={onNavigateToPost}
            fontSizeClass={fontSizeClassMap[fontSizeLevel]}
            adsConfig={adsConfig}
            isReadingMode={isReadingMode}
            readingTheme={readingTheme}
            readingFont={readingFont}
            readingLineHeight={readingLineHeight}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-400">Tags da matéria:</span>
              {post.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-300 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Barra de Ações UOL: Comunicar Erro, WhatsApp e Comentários */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReportErrorOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Reportar imprecisão factual ou erro de digitação"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Comunicar erro</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleShare('whatsapp')}
                className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const commentsEl = document.getElementById('comentarios-torcida-section');
                  if (commentsEl) commentsEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deixe seu comentário</span>
              </button>
            </div>
          </div>

          {/* Modal / Formulário In-Place de Comunicar Erro */}
          {reportErrorOpen && (
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Comunicar Erro ou Correção Editorial
                </span>
                <button
                  onClick={() => setReportErrorOpen(false)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {reportErrorSent ? (
                <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Apontamento recebido com sucesso! Nossa checagem de fatos analisará a correção.</span>
                </div>
              ) : (
                <form onSubmit={handleSendReportError} className="space-y-3">
                  <p className="text-slate-400">
                    Prezamos pelo rigor factual (E-E-A-T). Se encontrou algum erro factual ou ortográfico na matéria, descreva abaixo:
                  </p>
                  <textarea
                    rows={2}
                    required
                    value={reportErrorText}
                    onChange={(e) => setReportErrorText(e.target.value)}
                    placeholder="Descreva o erro ou a informação a ser retificada..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-amber-400 resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setReportErrorOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase cursor-pointer"
                    >
                      Enviar Correção
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Banner Editorial de Jornalismo Independente (Padrão UOL) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-[#041a16] via-[#09151e] to-[#041a16] border border-emerald-500/30 space-y-2">
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-serif">
              O jornalismo investigativo e tático é o verdadeiro antídoto a especulações de bastidores, vídeos manipulados e algoritmos que privilegiam a controvérsia rasa.
              O <strong>CampoBR</strong> defende a apuração independente, o respeito à história dos clubes brasileiros e a profundidade analítica.
            </p>
            <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Compromisso Editorial & Checagem de Fatos CampoBR
            </p>
          </div>

          {/* Enquete Interativa de Torcida (Aumenta Dwell Time e Engajamento) */}
          <FanPollWidget postId={post.id} category={post.category} />

          {/* ESPAÇO GOOGLE ADSENSE NO FINAL DA MATÉRIA */}
          <ArticleAdSenseSlot adsConfig={adsConfig} />

          {/* VITRINE CONTEXTUAL SHOPEE AFILIADOS (MANTOS & ARTIGOS OFICIAIS) */}
          <ShopeeAffiliateShowcase 
            category={post.category} 
            postTitle={post.title}
            postContent={post.content}
            postSummary={post.summary}
          />

          {/* Related Articles Box for High Dwell Time (100% Imagens Exclusivas) */}
          {uniqueRelatedPosts.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 className="font-display font-bold text-sm text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                Artigos Relacionados do CampoBR
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {uniqueRelatedPosts.map((rel) => (
                  <div
                    key={rel.id}
                    onClick={() => onNavigateToPost && onNavigateToPost(rel.id)}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer flex gap-3 items-center group"
                  >
                    <img
                      src={rel.coverImage}
                      alt={rel.title}
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_FALLBACK_IMAGE;
                      }}
                      className="w-14 h-14 rounded-lg object-cover shrink-0"
                    />
                    <div className="overflow-hidden">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase">
                        {rel.category}
                      </span>
                      <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-tight">
                        {rel.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Like Interaction Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-display font-black text-lg text-white">Gostou da análise?</h4>
              <p className="text-xs text-slate-400">Deixe seu like e apoie o jornalismo independente do CampoBR.</p>
            </div>
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase transition-all shadow-lg cursor-pointer ${
                hasLiked
                  ? 'bg-rose-600 text-white shadow-rose-900/50'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-rose-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : 'text-rose-500'}`} />
              <span>{likes.toLocaleString('pt-BR')} Curtidas</span>
            </button>
          </div>

          {/* Reader Comments Section */}
          <div className="pt-6 space-y-6 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-black text-xl text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Comentários da Torcida ({comments.length})
              </h3>
              <span className="text-xs text-slate-400">Comente com respeito</span>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Seu Nome / Torcida</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={newCommentName}
                      onChange={(e) => setNewCommentName(e.target.value)}
                      placeholder="Ex: Gabriel (Torcedor do Flamengo)"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Sua Opinião sobre a Matéria</label>
                <textarea
                  rows={3}
                  required
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Participe do debate esportivo com civilidade..."
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newCommentText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Enviando...' : 'Publicar Comentário'}</span>
                </button>
              </div>
            </form>

            {/* List of comments */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Seja o primeiro torcedor a comentar nesta matéria!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-emerald-300">{c.authorName || 'Torcedor Anônimo'}</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Floating Navigation Dock para Rolagem Rápida e Acessível */}
        <div className="absolute bottom-5 right-5 sm:right-8 z-40 flex items-center gap-2 bg-[#090f18]/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/90 shadow-2xl animate-fade-in">
          <button
            type="button"
            onClick={scrollToTop}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 transition-all cursor-pointer shadow-md flex items-center gap-1.5 text-xs font-bold"
            title="Subir rapidamente até o topo da matéria"
          >
            <ArrowUp className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Topo</span>
          </button>
          
          <div className="px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 rounded-xl select-none" title="Progresso da leitura">
            {readingProgress}%
          </div>

          <button
            type="button"
            onClick={scrollToBottom}
            className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 transition-all cursor-pointer shadow-md flex items-center gap-1.5 text-xs font-bold"
            title="Descer rapidamente até os comentários e ficha técnica"
          >
            <ArrowDown className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Fim</span>
          </button>
        </div>
      </div>
    </div>
  );
};
