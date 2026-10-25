import React, { useMemo, useEffect, useRef } from 'react';
import { 
  ExternalLink, 
  Compass, 
  Trophy, 
  ClipboardList, 
  Sparkles, 
  Camera, 
  Eye, 
  Zap, 
  ShieldCheck, 
  Link2, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  HelpCircle, 
  CheckSquare 
} from 'lucide-react';
import { AdSenseConfig, Post, ImageApplicationAnalysis } from '../types';
import { generateImageApplicationForPost } from '../services/aiVisualThemeEngine';
import { valueAnalyticsService } from '../services/valueAnalyticsService';
import { ArticleAdSenseSlot } from './ArticleAdSenseSlot';

interface ArticleContentRendererProps {
  content: string;
  post?: Post;
  onNavigateToPost?: (postIdOrSlug: string) => void;
  fontSizeClass?: string;
  adsConfig?: AdSenseConfig;
  isReadingMode?: boolean;
  readingTheme?: 'sepia' | 'oled' | 'dark';
  readingFont?: 'serif' | 'sans';
  readingLineHeight?: 'normal' | 'relaxed';
}

export const ArticleContentRenderer: React.FC<ArticleContentRendererProps> = ({
  content,
  post,
  onNavigateToPost,
  fontSizeClass = 'text-base sm:text-lg',
  adsConfig,
  isReadingMode = false,
  readingTheme = 'sepia',
  readingFont = 'serif',
  readingLineHeight = 'relaxed',
}) => {
  // Análise estruturada da aplicação da imagem gerada pelo Robô Inteligente
  const appAnalysis = useMemo<ImageApplicationAnalysis | null>(() => {
    if (post?.imageApplication) return post.imageApplication;
    if (post) {
      return generateImageApplicationForPost(
        post.title || '',
        post.summary || '',
        post.category || 'Jogadores',
        post.thematicConcept,
        post.visualMood,
        post.content
      );
    }
    return null;
  }, [post]);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackedDepths = useRef<Set<number>>(new Set());

  // Reading depth tracking for GA4 value analysis (25%, 50%, 75%, 100%)
  useEffect(() => {
    if (!post?.id) return;
    trackedDepths.current.clear();

    const handleScroll = () => {
      if (!containerRef.current || !post?.id) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalHeight = rect.height;
      if (totalHeight <= 0) return;

      const scrolledPastTop = Math.max(0, -rect.top + windowHeight * 0.5);
      const ratio = Math.min(1, Math.max(0, scrolledPastTop / totalHeight));

      const thresholds = [25, 50, 75, 100] as const;
      thresholds.forEach((depth) => {
        if (ratio >= depth / 100 && !trackedDepths.current.has(depth)) {
          trackedDepths.current.add(depth);
          valueAnalyticsService.trackArticleReadDepth(post.id, depth);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once initially
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [post?.id]);

  const hasExplicitImageAppBlock = useMemo(() => {
    return content.includes('### 📸 Aplicação da Imagem') || 
           content.includes('### Aplicação da Imagem') || 
           content.includes('### Leitura Tática da Imagem');
  }, [content]);
  // Normalize Windows newlines and split into blocks
  const rawBlocks = content.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const blocks: string[] = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const b = rawBlocks[i].trim();
    if (!b) continue;
    if (
      (b.startsWith('### Destaques') || b.startsWith('### Informações')) &&
      !b.includes('\n') &&
      i + 1 < rawBlocks.length
    ) {
      blocks.push(`${b}\n${rawBlocks[i + 1].trim()}`);
      i++; // Skip merged block
    } else {
      blocks.push(b);
    }
  }

  // Helper to parse formatting inside spans
  const parseInlineFormats = (text: string, keyPrefix: string): React.ReactNode => {
    // Check for bold **text**, italic *text*, underline <u>text</u>, mark <mark>text</mark>, strikethrough ~~text~~
    const parts: React.ReactNode[] = [];
    const formatRegex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|<u>([^<]+)<\/u>|<mark>([^<]+)<\/mark>|~~([^~]+)~~)/g;
    let last = 0;
    let m: RegExpExecArray | null;

    while ((m = formatRegex.exec(text)) !== null) {
      if (m.index > last) {
        parts.push(text.slice(last, m.index));
      }
      const full = m[0];
      if (full.startsWith('**')) {
        parts.push(<strong key={`${keyPrefix}-b-${m.index}`} className="font-bold text-white">{m[2]}</strong>);
      } else if (full.startsWith('*')) {
        parts.push(<em key={`${keyPrefix}-i-${m.index}`} className="italic text-slate-200">{m[3]}</em>);
      } else if (full.startsWith('<u>')) {
        parts.push(<u key={`${keyPrefix}-u-${m.index}`} className="underline underline-offset-4 decoration-emerald-400">{m[4]}</u>);
      } else if (full.startsWith('<mark>')) {
        parts.push(<mark key={`${keyPrefix}-m-${m.index}`} className="bg-amber-400/20 text-amber-200 px-1 py-0.5 rounded border border-amber-400/30">{m[5]}</mark>);
      } else if (full.startsWith('~~')) {
        parts.push(<del key={`${keyPrefix}-d-${m.index}`} className="line-through text-slate-400">{m[6]}</del>);
      }
      last = formatRegex.lastIndex;
    }

    if (last < text.length) {
      parts.push(text.slice(last));
    }
    return parts.length > 0 ? parts : text;
  };

  // Helper to parse inline links [Label](url)
  const renderInlineText = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(text)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        elements.push(parseInlineFormats(text.slice(lastIndex, matchIndex), `txt-${lastIndex}`));
      }

      const label = match[1];
      const url = match[2];

      if (url.startsWith('http://') || url.startsWith('https://')) {
        // External link to official sources (CBF, FIFA, CONMEBOL, etc.)
        elements.push(
          <a
            key={`ext-${matchIndex}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/50 hover:decoration-emerald-400 transition-colors cursor-pointer mx-1"
            title={`Acessar fonte oficial: ${label}`}
          >
            <span>{label}</span>
            <ExternalLink className="w-3 h-3 text-emerald-400 inline shrink-0" />
          </a>
        );
      } else if (url.startsWith('internal:') || url.startsWith('#') || url.startsWith('/post/')) {
        // Internal link to other articles of the blog
        const targetIdOrSlug = url.replace(/^(internal:|#|\/post\/)/, '');
        elements.push(
          <button
            key={`int-${matchIndex}`}
            type="button"
            onClick={() => onNavigateToPost && onNavigateToPost(targetIdOrSlug)}
            className="inline-flex items-center gap-1 font-bold text-cyan-300 hover:text-cyan-200 underline decoration-cyan-500/50 hover:decoration-cyan-400 transition-colors cursor-pointer bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30 text-sm mx-1 shadow-sm"
            title={`Ler matéria completa: ${label}`}
          >
            <Compass className="w-3 h-3 text-cyan-400 inline shrink-0" />
            <span>{label}</span>
          </button>
        );
      } else {
        elements.push(
          <span key={`fallback-${matchIndex}`} className="font-semibold text-emerald-400">
            {label}
          </span>
        );
      }

      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(parseInlineFormats(text.slice(lastIndex), `txt-${lastIndex}`));
    }

    return elements;
  };

  // Dynamic typography & contrast styling for Reading Mode
  const paragraphColor = isReadingMode
    ? readingTheme === 'sepia'
      ? 'text-[#f5efe6]'
      : readingTheme === 'oled'
        ? 'text-[#ffffff]'
        : 'text-[#e5e7eb]'
    : 'text-slate-200';

  const headingColor = isReadingMode
    ? readingTheme === 'sepia'
      ? 'text-[#faebd7] border-amber-900/40'
      : readingTheme === 'oled'
        ? 'text-[#ffffff] border-zinc-800'
        : 'text-[#f8fafc] border-slate-800'
    : 'text-white border-slate-800';

  const headingFont = isReadingMode
    ? readingFont === 'serif' ? 'font-serif' : 'font-sans'
    : 'font-display';

  const quoteStyle = isReadingMode
    ? readingTheme === 'sepia'
      ? 'border-amber-500 bg-[#261f17] text-[#faebd7]'
      : readingTheme === 'oled'
        ? 'border-emerald-400 bg-zinc-950 text-zinc-100'
        : 'border-teal-500 bg-slate-900/80 text-slate-200'
    : 'border-amber-400 bg-amber-950/20 text-slate-200';

  const paragraphFont = isReadingMode && readingFont === 'serif'
    ? 'font-serif'
    : 'font-sans';

  const paragraphLeading = isReadingMode && readingLineHeight === 'relaxed'
    ? 'leading-[2.1] sm:leading-[2.2] my-6 sm:my-7'
    : 'leading-[1.85] my-4.5';

  return (
    <div 
      ref={containerRef}
      className={`space-y-4 ${paragraphColor} ${paragraphFont} ${fontSizeClass} ${isReadingMode ? 'max-w-2xl mx-auto transition-colors duration-300' : ''}`}
    >
      {blocks.map((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Horizontal Divider (---)
        if (trimmed === '---' || trimmed === '***') {
          return (
            <hr key={idx} className="my-6 border-slate-800" />
          );
        }

        // Special UOL-style Classificação e Jogos Box
        if (
          trimmed.toLowerCase().startsWith('### classificação e jogos') ||
          trimmed.toLowerCase().startsWith('## classificação e jogos') ||
          trimmed.toLowerCase().startsWith('classificação e jogos')
        ) {
          const compName = trimmed.replace(/^###?\s*classificação e jogos[:\s-]*/i, '').trim() || 'Campeonato Brasileiro';
          return (
            <div key={idx} className="my-5 p-4 rounded-2xl border-2 border-rose-500/40 bg-gradient-to-r from-[#180a11] via-[#12080d] to-[#180a11] flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">Classificação e jogos</p>
                  <p className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>⚽</span> {compName}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-rose-300 bg-rose-950/80 border border-rose-500/50 px-3 py-1 rounded-full uppercase tracking-wider">
                Tabela Oficial
              </span>
            </div>
          );
        }

        // Special UOL-style FICHA TÉCNICA Section Header
        if (
          trimmed.toUpperCase().includes('FICHA TÉCNICA') &&
          (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#'))
        ) {
          const title = trimmed.replace(/^[#\s]+/, '');
          return (
            <div key={idx} className="mt-8 mb-3 p-4 rounded-2xl bg-[#071318] border-2 border-emerald-500/50 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-black">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-lg sm:text-xl text-white uppercase tracking-wider">
                    {title}
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium">Súmula Oficial, Escalações & Relatório de Jogo</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                Oficial
              </span>
            </div>
          );
        }

        // Headings (# , ## , ### , #### )
        if (trimmed.startsWith('# ')) {
          return (
            <h2
              key={idx}
              className={`${headingFont} font-black text-2xl sm:text-3xl md:text-4xl ${headingColor} pt-5 pb-1 flex items-center gap-2`}
            >
              <span className="w-2.5 h-8 rounded-full bg-emerald-400 inline-block"></span>
              {trimmed.replace('# ', '')}
            </h2>
          );
        }

        if (trimmed.startsWith('## ')) {
          return (
            <h2
              key={idx}
              className={`${headingFont} font-black text-xl sm:text-2xl md:text-3xl ${headingColor} pt-5 pb-1 flex items-center gap-2`}
            >
              <span className="w-2 h-7 rounded-full bg-amber-400 inline-block"></span>
              {trimmed.replace('## ', '')}
            </h2>
          );
        }

        // 2 Blocos Pequenos Informativos Finais (Padrão Simplificado e Profissional para Blog e AdSense)
        if (trimmed.startsWith('### Destaques e Cenário da Tabela') || trimmed.startsWith('### Destaques')) {
          const lines = trimmed.split('\n');
          const title = lines[0].replace(/^###\s*/, '').trim() || 'Destaques e Cenário da Tabela';
          const body = lines.slice(1).join('\n').trim();

          return (
            <div 
              key={idx} 
              className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950/90 border border-emerald-500/30 shadow-lg transition-all"
            >
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-emerald-500/20">
                <div className="flex items-center gap-2.5 text-emerald-400 font-display font-black text-sm sm:text-base uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"></span>
                  <Trophy className="w-4 h-4 text-emerald-400 inline" />
                  <span>{title}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Tabela & Análise
                </span>
              </div>
              {body ? (
                <p className={`${fontSizeClass || 'text-[16px] sm:text-[17px]'} text-slate-200 leading-[1.8] font-normal`}>
                  {renderInlineText(body)}
                </p>
              ) : null}
            </div>
          );
        }

        if (trimmed.startsWith('### Informações do Confronto e Próximo Jogo') || trimmed.startsWith('### Informações')) {
          const lines = trimmed.split('\n');
          const title = lines[0].replace(/^###\s*/, '').trim() || 'Informações do Confronto e Próximo Jogo';
          const body = lines.slice(1).join('\n').trim();

          return (
            <div 
              key={idx} 
              className="my-5 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950/90 border border-cyan-500/30 shadow-lg transition-all"
            >
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-cyan-500/20">
                <div className="flex items-center gap-2.5 text-cyan-400 font-display font-black text-sm sm:text-base uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
                  <Compass className="w-4 h-4 text-cyan-400 inline" />
                  <span>{title}</span>
                </div>
                <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  Agenda & Detalhes
                </span>
              </div>
              {body ? (
                <p className={`${fontSizeClass || 'text-[16px] sm:text-[17px]'} text-slate-200 leading-[1.8] font-normal`}>
                  {renderInlineText(body)}
                </p>
              ) : null}
            </div>
          );
        }

        // Special Section: Aplicação da Imagem & Leitura do Lance pelo Robô Inteligente
        if (
          trimmed.startsWith('### 📸 Aplicação da Imagem') ||
          trimmed.startsWith('### Aplicação da Imagem') ||
          trimmed.startsWith('### Leitura Tática da Imagem')
        ) {
          const lines = trimmed.split('\n');
          const title = lines[0].replace(/^###\s*/, '').trim() || 'Aplicação da Imagem & Leitura do Lance';
          const body = lines.slice(1).join('\n').trim();

          return (
            <div 
              key={idx} 
              className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#08151f] via-[#09101a] to-[#0d1c24] border border-cyan-500/30 shadow-xl space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-display font-black text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2">
                      <span>{title}</span>
                    </h4>
                    <p className="text-[11px] text-cyan-300 font-medium">
                      Robô Inteligente Gemini • Leitura tática e aplicação visual na narrativa
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest bg-cyan-950/90 px-2.5 py-1 rounded-full border border-cyan-500/40 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-cyan-400" /> Leitura do Lance
                </span>
              </div>

              {body ? (
                <div className={`${fontSizeClass || 'text-[16px] sm:text-[17px]'} text-slate-200 leading-[1.8] font-normal space-y-3`}>
                  {renderInlineText(body)}
                </div>
              ) : appAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"></span>
                      <span>Aplicação no Gramado & Tática</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-normal">
                      {appAnalysis.tacticalApplication}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
                      <span>Atmosfera & Tensão Visual</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-normal">
                      {appAnalysis.visualAtmosphere}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
                      <span>Consistência com o Leitor</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-normal">
                      {appAnalysis.editorialConsistency}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        }

        if (trimmed.startsWith('### ')) {
          return (
            <h3
              key={idx}
              className={`${headingFont} font-black text-lg sm:text-xl md:text-2xl ${headingColor} pt-4 pb-1 flex items-center gap-2`}
            >
              <span className="w-1.5 h-6 rounded-full bg-emerald-500 inline-block"></span>
              {trimmed.replace('### ', '')}
            </h3>
          );
        }

        if (trimmed.startsWith('#### ')) {
          return (
            <h4
              key={idx}
              className={`${headingFont} font-bold text-base sm:text-lg ${isReadingMode ? (readingTheme === 'sepia' ? 'text-amber-300' : 'text-emerald-300') : 'text-emerald-300'} pt-3 flex items-center gap-2`}
            >
              <span className="w-1 h-4 rounded-full bg-cyan-400 inline-block"></span>
              {trimmed.replace('#### ', '')}
            </h4>
          );
        }

        // Blockquotes (> )
        if (trimmed.startsWith('> ')) {
          const quoteText = trimmed.replace(/^> /, '');
          return (
            <blockquote
              key={idx}
              className={`border-l-4 pl-4 pr-3 py-3 my-3 rounded-r-2xl italic font-medium shadow-inner transition-colors duration-200 ${quoteStyle}`}
            >
              {renderInlineText(quoteText)}
            </blockquote>
          );
        }

        // Markdown Table (| Col 1 | Col 2 | ...)
        if (trimmed.includes('|') && trimmed.includes('\n')) {
          const lines = trimmed.split('\n').filter(l => l.trim().startsWith('|'));
          if (lines.length >= 2) {
            const headerLine = lines[0];
            const dataLines = lines.slice(lines[1].includes('---') ? 2 : 1);
            const headers = headerLine.split('|').map(c => c.trim()).filter(Boolean);

            return (
              <div key={idx} className="my-5 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-slate-700 text-emerald-300 font-black uppercase text-[11px] tracking-wider">
                      {headers.map((h, hIdx) => (
                        <th key={hIdx} className="py-2.5 px-3.5 border-r border-slate-800 last:border-r-0">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {dataLines.map((row, rIdx) => {
                      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
                      return (
                        <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                          {cells.map((cell, cIdx) => (
                            <td key={cIdx} className="py-2 px-3.5 border-r border-slate-800/40 last:border-r-0 text-slate-300">
                              {renderInlineText(cell)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          }
        }

        // Bullet lists (Com detecção inteligente de Pontos Principais do UOL e Lances)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const listItems = trimmed.split('\n');
          const isUOLHighlightsBox = idx <= 2 && listItems.length >= 3 && listItems.every(i => i.includes('**'));

          if (isUOLHighlightsBox) {
            return (
              <div key={idx} className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0c131e] via-[#090e17] to-[#0d1624] border border-slate-700/80 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400 inline-block"></span>
                    Pontos principais do jogo
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                    Destaques UOL
                  </span>
                </div>
                <ul className="space-y-3.5 pt-1">
                  {listItems.map((item, itemIdx) => {
                    const itemText = item.replace(/^[-*]\s+/, '');
                    return (
                      <li key={itemIdx} className="flex items-start gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2.5 shrink-0 shadow-sm shadow-emerald-400"></span>
                        <div className="text-[17px] sm:text-[18px] text-slate-200 leading-[1.85] font-normal">
                          {renderInlineText(itemText)}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          }

          return (
            <ul key={idx} className="space-y-3 my-5 pl-1">
              {listItems.map((item, itemIdx) => {
                const itemText = item.replace(/^[-*]\s+/, '');
                const isHighlightLead = itemText.startsWith('**');
                const hasTimeMarker = itemText.includes("'") || itemText.includes('minuto') || itemText.includes('1ºT') || itemText.includes('2ºT');

                return (
                  <li 
                    key={itemIdx} 
                    className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                      hasTimeMarker 
                        ? 'bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/30' 
                        : isHighlightLead 
                          ? 'text-slate-200' 
                          : 'text-slate-300'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2.5 shrink-0 shadow-sm shadow-emerald-400"></span>
                    <div className="text-[17px] sm:text-[18px] text-slate-200 leading-[1.85] font-normal w-full">
                      {renderInlineText(itemText)}
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const listItems = trimmed.split('\n');
          return (
            <ol key={idx} className="space-y-2.5 my-4 pl-1">
              {listItems.map((item, itemIdx) => {
                const itemText = item.replace(/^\d+\.\s+/, '');
                return (
                  <li key={itemIdx} className="flex items-start gap-3">
                    <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-950 border border-emerald-500/40 text-emerald-400 mt-1 shrink-0">
                      {itemIdx + 1}
                    </span>
                    <div className="text-[17px] sm:text-[18px] text-slate-200 leading-[1.85] font-normal">
                      {renderInlineText(itemText)}
                    </div>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Standard Paragraph - Tamanho padronizado e calibrado para conforto visual
        return (
          <React.Fragment key={idx}>
            <p className={`${fontSizeClass || 'text-[17px] sm:text-[18px]'} ${paragraphColor} ${paragraphFont} ${paragraphLeading} ${idx === 0 && !isReadingMode ? 'text-slate-100 font-normal leading-[1.9]' : ''} tracking-normal`}>
              {renderInlineText(trimmed)}
            </p>

            {/* Inserção Automática da Aplicação Estruturada da Imagem logo após o 1º parágrafo da crônica */}
            {idx === 0 && !hasExplicitImageAppBlock && appAnalysis && (
              <div className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#08151f] via-[#09101a] to-[#0d1c24] border border-cyan-500/30 shadow-xl space-y-4 animate-fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-sm sm:text-base text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Aplicação da Imagem & Leitura do Lance</span>
                      </h4>
                      <p className="text-[11px] text-cyan-300 font-medium">
                        Robô Inteligente Gemini • Leitura tática e aplicação visual na matéria
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest bg-cyan-950/90 px-2.5 py-1 rounded-full border border-cyan-500/40 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-cyan-400" /> Leitura Visual
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse"></span>
                      <span>Aplicação no Gramado & Tática</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-normal">
                      {appAnalysis.tacticalApplication}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400"></span>
                      <span>Atmosfera & Tensão Visual</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-normal">
                      {appAnalysis.visualAtmosphere}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-1.5 shadow-sm">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px] uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></span>
                      <span>Consistência com o Leitor</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-normal">
                      {appAnalysis.editorialConsistency}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {idx === 2 && !isReadingMode && adsConfig && adsConfig.adsenseEnabled && (
              <ArticleAdSenseSlot adsConfig={adsConfig} />
            )}
          </React.Fragment>
        );
      })}

      {/* ========================================================================= */}
      {/* SEÇÃO EDITORIAL: FAQ & DÚVIDAS FREQUENTES (Anti-alegações falsas) */}
      {/* ========================================================================= */}
      {post?.faqItems && post.faqItems.length > 0 && (
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">
                Perguntas Frequentes (FAQ Editorial)
              </h3>
              <p className="text-xs text-slate-400">
                Respostas diretas baseadas em apuração jornalística e dados oficiais
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {post.faqItems.map((item, qIdx) => (
              <div key={qIdx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-emerald-400 rounded-full shrink-0"></span>
                  {item.question}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed pl-3.5">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO: CHECKLIST DE COMPRA & ESPECIFICAÇÕES VERIFICADAS */}
      {/* ========================================================================= */}
      {post?.purchaseChecklist && post.purchaseChecklist.length > 0 && (
        <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-900/80 to-slate-950 border border-amber-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">
                Checklist Editorial & Recomendações
              </h3>
              <p className="text-xs text-amber-300/80">
                Critérios técnicos e observações sem métricas comerciais simuladas
              </p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {post.purchaseChecklist.map((chk, cIdx) => (
              <li key={cIdx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{chk.item}</span>
                </div>
                <p className="text-xs text-slate-300 pl-6 leading-relaxed">{chk.recommendation}</p>
                {chk.verifiedNote && (
                  <p className="text-[11px] text-emerald-400/90 pl-6 font-mono">Nota de checagem: {chk.verifiedNote}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO: LINKS INTERNOS RELACIONADOS (Até 3 artigos verídicos da mesma categoria) */}
      {/* ========================================================================= */}
      {post?.relatedInternalLinks && post.relatedInternalLinks.length > 0 && (
        <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-cyan-950/20 via-slate-900/80 to-slate-950 border border-cyan-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg text-white">
                Matérias Relacionadas da Mesma Categoria
              </h3>
              <p className="text-xs text-cyan-300/80">
                Aprofunde sua leitura com artigos verídicos do acervo CampoBR
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {post.relatedInternalLinks.map((rel, rIdx) => (
              <button
                key={rIdx}
                type="button"
                onClick={() => onNavigateToPost && onNavigateToPost(rel.slug || rel.id)}
                className="text-left p-4 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-all group cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                    {rel.category || post.category}
                  </span>
                  <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {rel.title}
                  </h4>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-xs text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Ler artigo</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO PRINCIPAL: FONTES CITADAS & APURAÇÃO COM GROUNDING GOOGLE SEARCH */}
      {/* ========================================================================= */}
      {post?.citedSources && post.citedSources.length > 0 && (
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#07131b] via-[#091522] to-[#0d1c28] border-2 border-emerald-500/40 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-base sm:text-lg text-white">
                    Fontes Citadas & Apuração Jornalística
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                    Grounding Verificado
                  </span>
                </div>
                <p className="text-xs text-emerald-300/80 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Consulta realizada em: <strong>{post.researchTimestamp || 'Horário de Brasília (BRT)'}</strong>
                  </span>
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="font-bold text-emerald-400">{post.citedSources.length}</span> fontes verificadas
            </div>
          </div>

          {/* Editorial Disclaimer as required */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Nota Editorial:</strong> O robô inteligente utiliza o <em>Google Search Grounding</em> para apuração de fatos recentes em tempo real. Cada afirmação nesta matéria foi correlacionada com sua respectiva fonte documental e passou por validação editorial humana. Não utilizamos números simulados ou alegações sem respaldo.
            </div>
          </div>

          {/* List of sources with sustained claims */}
          <div className="space-y-3 pt-1">
            {post.citedSources.map((source, sIdx) => (
              <div 
                key={sIdx}
                className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                    <span className="font-bold text-white text-xs sm:text-sm truncate">
                      {source.title || source.domain || 'Fonte Documentada'}
                    </span>
                    {source.domain && (
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">
                        {source.domain}
                      </span>
                    )}
                  </div>

                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (post.id) {
                        valueAnalyticsService.trackSourceCitationClick(source.url, source.domain, post.id);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/40 shrink-0 ml-2"
                  >
                    <span>Acessar Fonte</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {source.claimSustained && (
                  <div className="text-xs text-slate-300 pl-4 border-l-2 border-emerald-500/30">
                    <span className="text-slate-400 font-semibold">Afirmação sustentada: </span>
                    <span>"{source.claimSustained}"</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Claims supported summary */}
          {post.claimsSupported && post.claimsSupported.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block mb-1">
                Fatos Checados & Sustentados:
              </span>
              <ul className="space-y-1.5 text-slate-300">
                {post.claimsSupported.map((c, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>
                    <div>
                      <span className="text-slate-200 font-medium leading-relaxed">"{c.claim}"</span>
                      {c.sourceTitle && (
                        <span className="text-slate-400 text-[11px] block mt-0.5">Fonte: {c.sourceTitle}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Unverified Claims / Warnings if any */}
          {post.unverifiedClaims && post.unverifiedClaims.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200">
              <span className="font-bold text-amber-300 uppercase tracking-wider text-[10px] block mb-1">
                ⚠️ Informações em Apuração Contínua:
              </span>
              <ul className="list-disc list-inside space-y-1">
                {post.unverifiedClaims.map((u, uIdx) => (
                  <li key={uIdx}>{u}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
