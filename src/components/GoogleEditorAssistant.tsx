import React, { useState } from 'react';
import { 
  Sparkles, 
  Wand2, 
  FileText, 
  Tags, 
  Check, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Flame,
  Globe,
  Loader2,
  Cpu,
  Link,
  HelpCircle,
  Zap,
  Calendar,
  Clock
} from 'lucide-react';
import { googleContentAssistant, GeneratedHeadlineOptions, GeneratedArticleData } from '../services/googleContentAssistant';
import { FootballCategory } from '../types';

interface GoogleEditorAssistantProps {
  currentTitle: string;
  currentCategory: string;
  currentSummary: string;
  currentContent: string;
  currentTags: string;
  onApplyTitle: (title: string) => void;
  onApplySummary: (summary: string) => void;
  onApplyContent: (content: string) => void;
  onApplyTags: (tags: string) => void;
  onApplyAll: (data: { title: string; summary: string; content: string; tags: string }) => void;
  onApplyCategory?: (category: FootballCategory) => void;
  onApplyCoverImage?: (url: string) => void;
  onAutoCreateAndPublish?: (article: GeneratedArticleData) => Promise<void>;
  onGenerateTripleSchedule?: (category?: FootballCategory) => Promise<void>;
}

export const GoogleEditorAssistant: React.FC<GoogleEditorAssistantProps> = ({
  currentTitle,
  currentCategory,
  currentSummary,
  currentContent,
  currentTags,
  onApplyTitle,
  onApplySummary,
  onApplyContent,
  onApplyTags,
  onApplyAll,
  onApplyCategory,
  onApplyCoverImage,
  onAutoCreateAndPublish,
  onGenerateTripleSchedule,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [topicInput, setTopicInput] = useState('');
  const [selectedTargetCategory, setSelectedTargetCategory] = useState<FootballCategory | 'auto'>('auto');
  const [headlineOptions, setHeadlineOptions] = useState<GeneratedHeadlineOptions | null>(null);
  const [showSerpPreview, setShowSerpPreview] = useState(false);
  const [lastActionMsg, setLastActionMsg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const hasKey = googleContentAssistant.hasApiKey();

  const showNotification = (msg: string) => {
    setLastActionMsg(msg);
    setTimeout(() => setLastActionMsg(null), 5000);
  };

  const handleGenerateHeadlines = async () => {
    const topic = topicInput.trim() || currentTitle.trim() || 'Grande Clássico do Brasileirão';
    setIsGenerating(true);
    setActiveAction('headlines');
    try {
      const opts = await googleContentAssistant.generateHeadlines(topic, currentCategory);
      setHeadlineOptions(opts);
      showNotification('3 manchetes geradas com sucesso!');
    } catch (err) {
      console.error(err);
      showNotification('Erro ao gerar manchetes.');
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleGenerateSummary = async () => {
    const topic = topicInput.trim() || currentTitle.trim() || 'o clássico da rodada';
    setIsGenerating(true);
    setActiveAction('summary');
    try {
      const lead = await googleContentAssistant.generateSummary(topic, currentCategory, currentTitle);
      onApplySummary(lead);
      showNotification('Lead jornalístico gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showNotification('Erro ao gerar lead.');
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleGenerateFullArticle = async (autoPublish = false) => {
    setIsGenerating(true);
    setActiveAction(autoPublish ? 'auto_publish' : 'full');
    try {
      const targetCat: FootballCategory | undefined = selectedTargetCategory === 'auto'
        ? (currentCategory as FootballCategory || undefined)
        : selectedTargetCategory;

      const article = await googleContentAssistant.generateFullArticle(
        topicInput.trim() || undefined,
        targetCat,
        currentTitle.trim() || undefined
      );
      
      onApplyAll({
        title: article.title,
        summary: article.summary,
        content: article.content,
        tags: article.tags.join(', ')
      });

      if (article.category && onApplyCategory) {
        onApplyCategory(article.category);
      }
      if (article.coverImage && onApplyCoverImage) {
        onApplyCoverImage(article.coverImage);
      }

      if (autoPublish && onAutoCreateAndPublish) {
        await onAutoCreateAndPublish(article);
        showNotification(`Matéria de [${article.category}] criada e publicada com sucesso: "${article.title.slice(0, 35)}..."`);
      } else {
        showNotification(`Nova matéria gerada na categoria [${article.category}]: "${article.title.slice(0, 35)}..."`);
      }
    } catch (err) {
      console.error(err);
      showNotification('Erro ao gerar matéria completa.');
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleGenerateTripleSchedule = async () => {
    if (!onGenerateTripleSchedule) return;
    setIsGenerating(true);
    setActiveAction('triple_schedule');
    try {
      const forcedCat = selectedTargetCategory === 'auto' ? undefined : selectedTargetCategory;
      await onGenerateTripleSchedule(forcedCat);
      showNotification('3 matérias inéditas salvas e organizadas nas categorias oficiais nos 3 horários!');
    } catch (err) {
      console.error(err);
      showNotification('Erro ao gerar grade das 3 postagens.');
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleGenerateTags = async () => {
    const topic = topicInput.trim() || currentTitle.trim();
    setIsGenerating(true);
    setActiveAction('tags');
    try {
      const tags = await googleContentAssistant.generateSeoTags(topic, currentCategory);
      const existing = currentTags ? currentTags.split(',').map(t => t.trim()) : [];
      const combined = Array.from(new Set([...existing, ...tags])).filter(Boolean).join(', ');
      onApplyTags(combined);
      showNotification('Tags do Google Trends adicionadas com sucesso!');
    } catch (err) {
      console.error(err);
      showNotification('Erro ao gerar tags.');
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const handleImproveContent = async () => {
    if (!currentContent.trim()) {
      showNotification('Digite algum texto no corpo da matéria antes de aprimorar.');
      return;
    }
    setIsGenerating(true);
    setActiveAction('improve');
    try {
      const improved = await googleContentAssistant.improveContent(currentContent);
      onApplyContent(improved);
      showNotification('Texto aprimorado com estilo editorial esportivo!');
    } catch (err) {
      console.error(err);
      showNotification('Erro ao aprimorar texto.');
    } finally {
      setIsGenerating(false);
      setActiveAction(null);
    }
  };

  const currentSlug = (currentTitle || 'titulo-da-materia')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 70);

  return (
    <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-4 space-y-3.5 shadow-xl transition-all">
      {/* Header do Plugin Google */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Google Color Dots */}
          <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center relative shadow shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div className="absolute -bottom-0.5 -right-0.5 flex gap-0.5 p-0.5 rounded-full bg-black">
              <span className="w-1 h-1 rounded-full bg-[#4285F4]"></span>
              <span className="w-1 h-1 rounded-full bg-[#EA4335]"></span>
              <span className="w-1 h-1 rounded-full bg-[#FBBC05]"></span>
              <span className="w-1 h-1 rounded-full bg-[#34A853]"></span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Plugin Google AI • Assistente de Redação & SEO
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                hasKey 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                <Cpu className="w-3 h-3" />
                {hasKey ? 'Gemini 2.5 Conectado' : 'Modo Inteligente Ativo'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Crie matérias completas, manchetes atraentes e otimizadas para o Google Discover com 1 clique.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title={isOpen ? 'Recolher assistente' : 'Expandir assistente'}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 pt-1 border-t border-slate-800/80 text-xs animate-fade-in">
          {/* Feedback de ação */}
          {lastActionMsg && (
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] flex items-center gap-2 animate-fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lastActionMsg}</span>
            </div>
          )}

          {/* Seletor das 6 Categorias Oficiais do Futebol Brasileiro */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Nicho Futebol Brasileiro • Categoria de Destino:
              </span>
              <span className="text-emerald-400 font-bold text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                {selectedTargetCategory === 'auto' ? '● Automático (Rotativo)' : `● ${selectedTargetCategory}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTargetCategory('auto')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedTargetCategory === 'auto'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                🔄 Todas as 6 (Rotativo)
              </button>

              {[
                { id: 'Seleção Brasileira' as FootballCategory, label: '🇧🇷 Seleção Brasileira' },
                { id: 'Clubes Serie A' as FootballCategory, label: '🏆 Times Série A' },
                { id: 'Clubes Serie B' as FootballCategory, label: '🛡️ Times Série B' },
                { id: 'Jogadores' as FootballCategory, label: '⭐ Jogadores' },
                { id: 'Equipe Técnica' as FootballCategory, label: '📋 Equipe Técnica' },
                { id: 'Eventos' as FootballCategory, label: '📅 Novos Eventos Futuros' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedTargetCategory(cat.id);
                    if (onApplyCategory) onApplyCategory(cat.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    selectedTargetCategory === cat.id
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Assunto / Foco da Matéria e Botões de Ação */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Tema opcional (ex: Flamengo x Palmeiras, Vini Jr, Clássico)... ou deixe em branco para sortear tema inédito!"
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-400"
              />

              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleGenerateFullArticle(false)}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                title="Gera matéria completa e preenche os campos do formulário para revisão"
              >
                {isGenerating && activeAction === 'full' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gerando...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 text-amber-300" />
                    <span>Gerar Matéria Completa</span>
                  </>
                )}
              </button>

              {onAutoCreateAndPublish && (
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleGenerateFullArticle(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                  title="Gera matéria com conteúdo 100% diferente e publica imediatamente no blog!"
                >
                  {isGenerating && activeAction === 'auto_publish' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      <span>Publicando...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-slate-950" />
                      <span>⚡ Gerar & Publicar Agora</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Linha de Automação: Grade nos 3 Horários Salvos */}
            {onGenerateTripleSchedule && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">
                      Grade Automática nos 3 Melhores Horários do Brasil (Anti-Robô ±10m)
                    </span>
                    <span className="text-[11px] text-amber-300/80">
                      Gera 3 matérias 100% diferentes para: <strong>Manhã (~07h00)</strong>, <strong>Almoço (~12h30)</strong> e <strong>Pós-Jogo (~22h30)</strong>.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateTripleSchedule}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isGenerating && activeAction === 'triple_schedule' ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                      <span>Gerando Grade (3 Artigos)...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Gerar as 3 Matérias Agendadas</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Atalhos de Pautas Quentes em Alta no Google Trends */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-0.5">
            <span className="text-slate-400 font-bold flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Em alta no Google:</span>
            </span>
            {[
              'Flamengo na Liderança',
              'Palmeiras x Grêmio',
              'Convocação da Seleção Brasileira',
              'Vasco em São Januário',
              'Estêvão & Vini Jr'
            ].map((pauta) => (
              <button
                key={pauta}
                type="button"
                onClick={() => {
                  setTopicInput(pauta);
                  showNotification(`Tema "${pauta}" selecionado! Clique em Gerar.`);
                }}
                className="px-2 py-0.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white font-medium transition-colors cursor-pointer"
              >
                {pauta}
              </button>
            ))}
          </div>

          {/* Botões de Ação Rápida */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateHeadlines}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGenerating && activeAction === 'headlines' ? (
                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-400" />
              )}
              <span>Sugerir Títulos de Impacto</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateSummary}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGenerating && activeAction === 'summary' ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
              ) : (
                <FileText className="w-3 h-3 text-blue-400" />
              )}
              <span>Criar Lead / Resumo</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateTags}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGenerating && activeAction === 'tags' ? (
                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
              ) : (
                <Tags className="w-3 h-3 text-emerald-400" />
              )}
              <span>Tags Google Trends</span>
            </button>

            <button
              type="button"
              disabled={isGenerating}
              onClick={handleImproveContent}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGenerating && activeAction === 'improve' ? (
                <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
              ) : (
                <Wand2 className="w-3 h-3 text-purple-400" />
              )}
              <span>Aprimorar Texto</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSerpPreview(!showSerpPreview)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ml-auto"
            >
              <Search className="w-3 h-3 text-blue-400" />
              <span>{showSerpPreview ? 'Ocultar Prévia Google' : 'Prévia no Google Search'}</span>
            </button>
          </div>

          {/* Sugestões de Título Geradas */}
          {headlineOptions && (
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5 animate-fade-in shadow-inner">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Escolha uma manchete para aplicar no artigo:
              </span>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onApplyTitle(headlineOptions.sensational);
                    showNotification('Título aplicado com sucesso!');
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 hover:border-amber-500/50 text-slate-200 hover:text-white text-xs transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <span className="leading-snug"><strong className="text-amber-400">🔥 Viral / Torcida:</strong> {headlineOptions.sensational}</span>
                  <span className="text-[11px] text-amber-300 font-bold shrink-0 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-black transition-all">Usar Este</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onApplyTitle(headlineOptions.tactical);
                    showNotification('Título aplicado com sucesso!');
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 hover:border-emerald-500/50 text-slate-200 hover:text-white text-xs transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <span className="leading-snug"><strong className="text-emerald-400">📊 Análise Tática:</strong> {headlineOptions.tactical}</span>
                  <span className="text-[11px] text-emerald-300 font-bold shrink-0 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-black transition-all">Usar Este</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onApplyTitle(headlineOptions.breaking);
                    showNotification('Título aplicado com sucesso!');
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 hover:border-rose-500/50 text-slate-200 hover:text-white text-xs transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <span className="leading-snug"><strong className="text-rose-400">🚨 Urgente / Bastidores:</strong> {headlineOptions.breaking}</span>
                  <span className="text-[11px] text-rose-300 font-bold shrink-0 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30 group-hover:bg-rose-500 group-hover:text-black transition-all">Usar Este</span>
                </button>
              </div>
            </div>
          )}

          {/* Prévia de Snippet no Google Search (Google SERP Card) */}
          {showSerpPreview && (
            <div className="p-3.5 rounded-xl bg-[#202124] border border-[#3c4043] text-left space-y-1 font-sans text-xs animate-fade-in shadow-xl">
              <div className="flex items-center gap-2">
                <img src="/logo-512x512.png" alt="CampoBR" className="w-4 h-4 rounded-full" />
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#dadce0] font-medium leading-none">CampoBR • O Seu Portal do Futebol</span>
                  <span className="text-[10px] text-[#bdc1c6] leading-none mt-0.5">https://campobr.blog › noticias › {currentSlug}</span>
                </div>
              </div>
              <h4 className="text-[#8ab4f8] hover:underline cursor-pointer font-normal text-sm pt-0.5 leading-snug">
                {currentTitle || 'Título da matéria no CampoBR Futebol Brasileiro'}
              </h4>
              <p className="text-[#bdc1c6] text-xs leading-relaxed line-clamp-2">
                {currentSummary || 'Resumo da matéria que o torcedor e internauta lê quando busca sobre o jogo ou clube no Google.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
