import React, { useState, useRef, useEffect } from 'react';
import { Post, FootballCategory } from '../types';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  ExternalLink, 
  Table, 
  Minus, 
  Highlighter, 
  Undo, 
  Redo, 
  Maximize2, 
  Minimize2, 
  Eye, 
  Columns, 
  Search, 
  Check, 
  X, 
  Sparkles, 
  FileText, 
  Compass, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Sun, 
  Moon,
  ChevronRight,
  Info
} from 'lucide-react';
import { ArticleContentRenderer } from './ArticleContentRenderer';
import { googleContentAssistant, InternalLinkMatch } from '../services/googleContentAssistant';

interface WordDocumentEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  availablePosts: Post[];
  currentPostId?: string | null;
  placeholder?: string;
  articleTitle?: string;
  articleCategory?: string;
}

export const WordDocumentEditor: React.FC<WordDocumentEditorProps> = ({
  content,
  onChange,
  availablePosts,
  currentPostId,
  placeholder = 'Comece a redigir a matéria esportiva com visão ampla no padrão Word...',
  articleTitle = '',
  articleCategory = 'Futebol',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // View states
  const [viewMode, setViewMode] = useState<'editor' | 'split' | 'preview'>('editor');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paperTheme, setPaperTheme] = useState<'light' | 'dark'>('light');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Undo / Redo history
  const [history, setHistory] = useState<string[]>([content]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Internal Link Modal state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [searchPostTerm, setSearchPostTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Todas');
  const [linkTab, setLinkTab] = useState<'phrase' | 'callout' | 'autoDetect'>('phrase');
  const [detectedMatches, setDetectedMatches] = useState<InternalLinkMatch[]>([]);
  const [linkSuccessToast, setLinkSuccessToast] = useState<string | null>(null);

  // Stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const paragraphCount = content.trim() ? content.split(/\n{2,}/).filter(Boolean).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 180));

  // Sync initial content to history
  const pushToHistory = (newVal: string) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(newVal);
    // Limit to 30 states
    if (updated.length > 30) updated.shift();
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    onChange(newVal);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      onChange(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      onChange(next);
    }
  };

  const showToast = (msg: string) => {
    setLinkSuccessToast(msg);
    setTimeout(() => setLinkSuccessToast(null), 3500);
  };

  // Helper to wrap or insert text at current cursor / selection
  const insertFormatting = (prefix: string, suffix: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const textToWrap = selected || defaultText;

    const replacement = `${prefix}${textToWrap}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    
    pushToHistory(newContent);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursor = start + prefix.length + textToWrap.length;
      textarea.setSelectionRange(start + prefix.length, newCursor);
    }, 10);
  };

  const insertBlockSnippet = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Check if on a newline
    const before = content.substring(0, start);
    const after = content.substring(end);
    const needsNewlineBefore = before.length > 0 && !before.endsWith('\n\n');
    const prefix = needsNewlineBefore ? '\n\n' : '';

    const newContent = before + prefix + snippet + '\n\n' + after;
    pushToHistory(newContent);

    setTimeout(() => {
      textarea.focus();
    }, 10);
  };

  // Open Internal Link Modal with highlighted phrase
  const handleOpenLinkModal = () => {
    const textarea = textareaRef.current;
    let phrase = '';
    let start = 0;
    let end = 0;

    if (textarea) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
      phrase = content.substring(start, end).trim();
    }

    setSelectedPhrase(phrase);
    setSelectionRange({ start, end });
    setSearchPostTerm('');
    setLinkTab('phrase');

    // Run auto detector in parallel
    const matches = googleContentAssistant.detectInternalLinks(
      content, 
      availablePosts.filter(p => p.id !== currentPostId)
    );
    setDetectedMatches(matches);

    setIsLinkModalOpen(true);
  };

  // Insert Internal Link on selected phrase
  const handleApplyInternalLink = (targetPost: Post) => {
    const phraseToLink = selectedPhrase.trim() || targetPost.title;
    const linkMarkdown = `[${phraseToLink}](internal:${targetPost.id})`;

    const start = selectionRange.start;
    const end = selectionRange.end;

    let newContent: string;
    if (end > start) {
      // Replace highlighted selection directly
      newContent = content.substring(0, start) + linkMarkdown + content.substring(end);
    } else {
      // Insert at cursor position or end
      const textarea = textareaRef.current;
      const curPos = textarea ? textarea.selectionStart : content.length;
      newContent = content.substring(0, curPos) + ' ' + linkMarkdown + ' ' + content.substring(curPos);
    }

    pushToHistory(newContent);
    setIsLinkModalOpen(false);
    showToast(`Link interno para "${targetPost.title}" adicionado na frase!`);
  };

  // Insert "Leia também" callout box
  const handleApplyCalloutLink = (targetPost: Post) => {
    const callout = `\n\n> 📌 **Leia também:** [${targetPost.title}](internal:${targetPost.id})\n\n`;
    insertBlockSnippet(callout.trim());
    setIsLinkModalOpen(false);
    showToast(`Box "Leia também" inserido com sucesso!`);
  };

  // Apply auto detected match
  const handleApplyAutoMatch = (match: InternalLinkMatch) => {
    const replaced = content.replace(match.phrase, match.replacementMarkdown);
    pushToHistory(replaced);
    setDetectedMatches(prev => prev.filter(m => m.phrase !== match.phrase));
    showToast(`Frase "${match.phrase}" vinculada a "${match.postTitle}"!`);
  };

  // Apply all auto detected matches
  const handleApplyAllAutoMatches = () => {
    let updated = content;
    let count = 0;
    for (const m of detectedMatches) {
      if (updated.includes(m.phrase)) {
        updated = updated.replace(m.phrase, m.replacementMarkdown);
        count++;
      }
    }
    pushToHistory(updated);
    setDetectedMatches([]);
    setIsLinkModalOpen(false);
    showToast(`${count} links internos inseridos automaticamente nas frases do artigo!`);
  };

  // Filter posts in modal
  const eligiblePosts = availablePosts.filter(p => p.id !== currentPostId);
  const filteredModalPosts = eligiblePosts.filter(p => {
    const matchCat = filterCategory === 'Todas' || p.category === filterCategory;
    const matchSearch = !searchPostTerm.trim() || 
      p.title.toLowerCase().includes(searchPostTerm.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchPostTerm.toLowerCase()) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchPostTerm.toLowerCase())));
    return matchCat && matchSearch;
  });

  return (
    <div className={`word-editor-container rounded-3xl border border-slate-700/80 bg-slate-950/90 shadow-2xl transition-all ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-slate-950 p-4 sm:p-6 overflow-y-auto flex flex-col' : 'relative'
    }`}>
      {/* Toast Notification */}
      {linkSuccessToast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-emerald-950/95 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{linkSuccessToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* TOP HEADER: Microsoft Word Document Status & Controls    */}
      {/* ======================================================== */}
      <div className="border-b border-slate-800 bg-slate-900/90 px-4 py-3 rounded-t-3xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md shadow-blue-500/30">
            <span className="font-serif text-base tracking-tighter">W</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs sm:text-sm">
                {articleTitle.trim() ? articleTitle : 'Documento 1 • Nova Matéria Esportiva'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Padrão Word A4
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              CampoBR Editorial Studio • Otimizado para Leitura, Links e AdSense
            </p>
          </div>
        </div>

        {/* Quick View and Tool Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Paper Theme Toggle */}
          <button
            type="button"
            onClick={() => setPaperTheme(paperTheme === 'light' ? 'dark' : 'light')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Alternar entre Folha Clara do Word e Modo Noturno"
          >
            {paperTheme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Papel Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Folha Word Clara</span>
              </>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800/90 rounded-xl p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'editor' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Visão Ampla da Folha de Redação"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Folha Word</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'split' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Ver Editor e Prévia Lado a Lado"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Lado a Lado</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'preview' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Prévia Formatada de Leitura"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Prévia Final</span>
            </button>
          </div>

          {/* Fullscreen / Visão Ampla Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold transition-colors cursor-pointer"
            title={isFullscreen ? 'Sair da Visão Ampla' : 'Visão Ampla / Tela Cheia (Foco Total)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FLOATING FORMATTING TOOLBAR (MENU FLUTUANTE COMPLETO)    */}
      {/* ======================================================== */}
      <div className="sticky top-0 z-30 px-4 py-2.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-r border-slate-700 pr-2">
          <button
            type="button"
            disabled={historyIndex <= 0}
            onClick={handleUndo}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Desfazer (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={historyIndex >= history.length - 1}
            onClick={handleRedo}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Refazer (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
          <button
            type="button"
            onClick={() => insertBlockSnippet('## Título da Seção Esportiva')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black flex items-center gap-1 cursor-pointer"
            title="Título de Seção (H2 - ##)"
          >
            <Heading1 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">H2</span>
          </button>
          <button
            type="button"
            onClick={() => insertBlockSnippet('### Subtítulo / Intertítulo Tático')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black flex items-center gap-1 cursor-pointer"
            title="Subtítulo (H3 - ###)"
          >
            <Heading2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">H3</span>
          </button>
          <button
            type="button"
            onClick={() => insertBlockSnippet('#### Tópico Adicional')}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black flex items-center gap-1 cursor-pointer"
            title="Tópico Menor (H4 - ####)"
          >
            <Heading3 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">H4</span>
          </button>
        </div>

        {/* Inline Typography: Bold, Italic, Underline, Strikethrough, Highlight */}
        <div className="flex items-center gap-0.5 border-r border-slate-700 pr-2">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'texto em negrito')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white font-black cursor-pointer"
            title="Negrito (**texto**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'texto em itálico')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white italic cursor-pointer"
            title="Itálico (*texto*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('<u>', '</u>', 'texto sublinhado')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white underline cursor-pointer"
            title="Sublinhado (<u>texto</u>)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('~~', '~~', 'texto tachado')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white line-through cursor-pointer"
            title="Tachado (~~texto~~)"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('<mark>', '</mark>', 'destaque')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-amber-400 hover:text-amber-300 cursor-pointer"
            title="Marca-texto (<mark>destaque</mark>)"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Structures: Quote, Lists, Divider, Table */}
        <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
          <button
            type="button"
            onClick={() => insertBlockSnippet('> "Aspas importantes da comissão técnica ou jogador do confronto." — Redação CampoBR.')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Citação em Destaque (> aspas)"
          >
            <Quote className="w-3.5 h-3.5 text-amber-400" />
          </button>
          <button
            type="button"
            onClick={() => insertBlockSnippet('- Primeiro ponto tático de destaque\n- Segundo momento decisivo da rodada\n- Terceira observação da comissão')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Lista com Marcadores (- )"
          >
            <List className="w-3.5 h-3.5 text-emerald-400" />
          </button>
          <button
            type="button"
            onClick={() => insertBlockSnippet('1. Primeiro lance capital do jogo\n2. Segundo gol e desdobramentos\n3. Análise final das arquibancadas')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Lista Numerada (1. )"
          >
            <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
          </button>
          <button
            type="button"
            onClick={() => insertBlockSnippet('---\n')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Linha Divisória (---)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertBlockSnippet('| Indicador Estatístico | Mandante | Visitante |\n|---|---|---|\n| Posse de Bola | 58% | 42% |\n| Finalizações no Alvo | 8 | 4 |\n| Escanteios | 6 | 3 |')}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            title="Inserir Tabela de Estatísticas / Escalação"
          >
            <Table className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ⭐ DESTAQUE PRINCIPAL: ADICIONADOR DE LINKS INTERNOS EM FRASES (SOLICITADO) */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenLinkModal}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all cursor-pointer border border-cyan-300/40 active:scale-95"
            title="Adicionar Link Interno em Frase Selecionada (Conectar Artigos do Blog)"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span className="font-extrabold tracking-wide">🔗 Adicionar Link Interno</span>
          </button>

          <button
            type="button"
            onClick={() => insertFormatting('[Confederação Brasileira de Futebol (CBF)](', ')', 'https://www.cbf.com.br')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            title="Inserir Link Externo Oficial (CBF/FIFA)"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Link Externo</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* WORD RULER (RÉGUA SUPERIOR DO MICROSOFT WORD)            */}
      {/* ======================================================== */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-1 flex items-center justify-center select-none text-[10px] text-slate-500 font-mono overflow-x-hidden">
        <div className="max-w-[850px] w-full flex items-center justify-between px-6 sm:px-12">
          <span>◄ 0</span>
          <span>|</span>
          <span>2</span>
          <span>|</span>
          <span>4</span>
          <span>|</span>
          <span>6</span>
          <span>|</span>
          <span>8</span>
          <span>|</span>
          <span>10</span>
          <span>|</span>
          <span>12</span>
          <span>|</span>
          <span>14</span>
          <span>|</span>
          <span>16 ►</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN DOCUMENT WORKSPACE & SHEET CANVAS                   */}
      {/* ======================================================== */}
      <div className={`word-workspace flex-1 p-3 sm:p-6 md:p-8 bg-[#090d14] overflow-y-auto ${
        viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''
      }`}>
        {/* SHEET 1: WORD EDITABLE PAGE CANVAS */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className="flex justify-center w-full">
            <div 
              style={{ zoom: `${zoomLevel}%` }}
              className={`word-sheet-paper w-full max-w-[850px] min-h-[720px] rounded-2xl p-6 sm:p-12 md:p-16 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border transition-all flex flex-col ${
                paperTheme === 'light'
                  ? 'bg-[#ffffff] text-slate-900 border-slate-300 ring-1 ring-slate-200'
                  : 'bg-[#151c27] text-slate-100 border-slate-700/80 ring-1 ring-slate-800'
              }`}
            >
              {/* Paper Top Header Watermark (Word Document Header) */}
              <div className={`pb-5 mb-5 border-b flex items-center justify-between text-[11px] font-sans ${
                paperTheme === 'light' ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-500'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold uppercase tracking-wider text-emerald-600">CampoBR</span>
                  <span>•</span>
                  <span>{articleCategory}</span>
                </div>
                <div>
                  <span>Padrão Word A4 • {wordCount} palavras</span>
                </div>
              </div>

              {/* Title Display on the Top of Document */}
              {articleTitle && (
                <div className="mb-6">
                  <h1 className={`font-display font-black text-2xl sm:text-3xl leading-tight ${
                    paperTheme === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    {articleTitle}
                  </h1>
                </div>
              )}

              {/* Editable Textarea behaving like Word text flow */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => pushToHistory(e.target.value)}
                placeholder={placeholder}
                rows={24}
                className={`flex-1 w-full bg-transparent border-0 focus:outline-none focus:ring-0 resize-y leading-relaxed text-sm sm:text-base font-sans ${
                  paperTheme === 'light'
                    ? 'text-slate-900 placeholder-slate-400 selection:bg-blue-200 selection:text-slate-900'
                    : 'text-slate-100 placeholder-slate-600 selection:bg-emerald-500 selection:text-black'
                }`}
                style={{ minHeight: '520px' }}
              />

              {/* Paper Footer Marker */}
              <div className={`pt-6 mt-6 border-t flex items-center justify-between text-[11px] font-sans ${
                paperTheme === 'light' ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-500'
              }`}>
                <span>Redação Oficial CampoBR</span>
                <span>Página 1</span>
              </div>
            </div>
          </div>
        )}

        {/* SHEET 2: PREVIEW COLUMN (For Split View or Full Preview) */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex justify-center w-full">
            <div className="w-full max-w-[850px] min-h-[720px] rounded-2xl p-6 sm:p-10 md:p-12 bg-slate-900/90 border border-slate-800 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Prévia Formatada como o Leitor Vê
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {readingTime} min de leitura
                </span>
              </div>

              {articleTitle && (
                <h1 className="font-display font-black text-2xl sm:text-3xl text-white mb-6 leading-tight">
                  {articleTitle}
                </h1>
              )}

              <div className="flex-1">
                {content.trim() ? (
                  <ArticleContentRenderer content={content} />
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-500 text-sm italic">
                    O conteúdo formatado aparecerá aqui em tempo real...
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* BOTTOM STATUS BAR (ESTILO MICROSOFT WORD COMPLETO)       */}
      {/* ======================================================== */}
      <div className="border-t border-slate-800 bg-slate-900/90 px-4 py-2 rounded-b-3xl flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-sans">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <span className="font-semibold text-slate-300">Página 1 de 1</span>
          <span>•</span>
          <span><strong>{wordCount}</strong> palavras</span>
          <span>•</span>
          <span><strong>{charCount}</strong> caracteres</span>
          <span>•</span>
          <span><strong>{paragraphCount}</strong> parágrafos</span>
          <span>•</span>
          <span>~<strong>{readingTime}</strong> min leitura</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
            Google Discover & AdSense Ready
          </span>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel(Math.max(80, zoomLevel - 10))}
              className="text-slate-400 hover:text-white cursor-pointer"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] w-8 text-center">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))}
              className="text-slate-400 hover:text-white cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 MODAL: ADICIONADOR DE LINKS INTERNOS EM FRASES (SOLICITADO PELO USUÁRIO) */}
      {/* ========================================================================= */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/20">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg text-white">
                    Adicionar Link Interno em Frase
                  </h3>
                  <p className="text-xs text-slate-400">
                    Conecte palavras e frases a outros artigos do blog CampoBR para reter leitores e potencializar o AdSense.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex border-b border-slate-800 bg-slate-950/80 px-4 pt-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setLinkTab('phrase')}
                className={`px-3.5 py-2 font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  linkTab === 'phrase'
                    ? 'bg-slate-900 text-cyan-300 border-t border-x border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Link Direto na Frase</span>
              </button>

              <button
                type="button"
                onClick={() => setLinkTab('callout')}
                className={`px-3.5 py-2 font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  linkTab === 'callout'
                    ? 'bg-slate-900 text-amber-300 border-t border-x border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Quote className="w-3.5 h-3.5 text-amber-400" />
                <span>Box "Leia Também"</span>
              </button>

              <button
                type="button"
                onClick={() => setLinkTab('autoDetect')}
                className={`px-3.5 py-2 font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ml-auto ${
                  linkTab === 'autoDetect'
                    ? 'bg-slate-900 text-emerald-300 border-t border-x border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Escanear Frases ({detectedMatches.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Phrase input */}
              {linkTab !== 'autoDetect' && (
                <div className="space-y-1.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide flex items-center justify-between">
                    <span>Texto Âncora / Frase que receberá o Link:</span>
                    {selectedPhrase ? (
                      <span className="text-cyan-400 text-[10px] font-normal">
                        ✓ Selecionada no documento
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[10px] font-normal">
                        Dica: Você pode digitar a frase aqui
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={selectedPhrase}
                    onChange={(e) => setSelectedPhrase(e.target.value)}
                    placeholder="Ex: a vitória sobre o Palmeiras, Dorival Júnior, etc..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-xs focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* TAB 1 & 2: Search and Select Target Post */}
              {linkTab !== 'autoDetect' && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Search bar */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={searchPostTerm}
                        onChange={(e) => setSearchPostTerm(e.target.value)}
                        placeholder="Pesquisar matéria de destino por título, clube ou tag..."
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Category Filter */}
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-400"
                    >
                      <option value="Todas">Todas as Categorias</option>
                      <option value="Seleção Brasileira">Seleção Brasileira</option>
                      <option value="Clubes Serie A">Clubes Serie A</option>
                      <option value="Clubes Serie B">Clubes Serie B</option>
                      <option value="Jogadores">Jogadores</option>
                      <option value="Equipe Técnica">Equipe Técnica</option>
                      <option value="Eventos">Eventos</option>
                    </select>
                  </div>

                  {/* List of articles to link to */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {filteredModalPosts.length > 0 ? (
                      filteredModalPosts.map((post) => (
                        <div
                          key={post.id}
                          className="p-3 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={post.coverImage}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-800"
                            />
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wide block truncate">
                                {post.category}
                              </span>
                              <h4 className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors line-clamp-1">
                                {post.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 line-clamp-1">
                                {post.summary}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              if (linkTab === 'phrase') {
                                handleApplyInternalLink(post);
                              } else {
                                handleApplyCalloutLink(post);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1 shadow-md shadow-cyan-600/30 transition-all cursor-pointer whitespace-nowrap"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>{linkTab === 'phrase' ? 'Vincular na Frase' : 'Inserir Box'}</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        Nenhum artigo encontrado com os termos pesquisados.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Auto Detect Matches in Phrases */}
              {linkTab === 'autoDetect' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Encontramos <strong>{detectedMatches.length}</strong> termos no seu texto que coincidem com matérias já publicadas.
                      </span>
                    </div>
                    {detectedMatches.length > 0 && (
                      <button
                        type="button"
                        onClick={handleApplyAllAutoMatches}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-md"
                      >
                        Vincular Todos ({detectedMatches.length})
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {detectedMatches.length > 0 ? (
                      detectedMatches.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Palavra encontrada no texto:
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                "{m.phrase}"
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                              <span className="font-semibold text-white truncate max-w-[280px]">
                                {m.postTitle}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleApplyAutoMatch(m)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs shrink-0 cursor-pointer"
                          >
                            Vincular Frase
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        Nenhum termo repetido detectado ou todas as palavras já estão linkadas.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Links internos ajudam o Google a entender a relevância do CampoBR.
              </span>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
