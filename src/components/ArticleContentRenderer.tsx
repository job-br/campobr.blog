import React, { useMemo } from 'react';
import { ExternalLink, Compass, Trophy, ClipboardList, Sparkles, Camera, Eye, Zap, ShieldCheck } from 'lucide-react';
import { AdSenseConfig, Post, ImageApplicationAnalysis } from '../types';
import { generateImageApplicationForPost } from '../services/aiVisualThemeEngine';
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
    <div className={`space-y-4 ${paragraphColor} ${paragraphFont} ${fontSizeClass} ${isReadingMode ? 'max-w-2xl mx-auto transition-colors duration-300' : ''}`}>
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
    </div>
  );
};
