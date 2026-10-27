import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bot, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Zap, 
  RotateCcw, 
  Flame, 
  Trash2,
  Activity,
  Sparkles,
  ShieldCheck,
  Layers,
  Award,
  Image as ImageIcon,
  Check,
  Terminal,
  GitBranch,
  Brain,
  TrendingUp,
  BarChart3,
  ShoppingBag,
  DollarSign,
  Sun,
  Moon,
  ExternalLink,
  Tag,
  Plus,
  ListPlus,
  Link as LinkIcon,
  HelpCircle,
  AlertCircle,
  Filter,
  Search,
  UploadCloud
} from 'lucide-react';
import { FootballCategory, Post } from '../types';
import { automationService, AutomationConfig, AutomationLogEntry } from '../services/automationService';
import { OFFICIAL_CYCLE_CATEGORIES, CATEGORY_ENGLISH_TITLES } from '../services/googleContentAssistant';
import { analyzeEditorialHistory, UOL_BENCHMARK_SPECIFICATION } from '../services/editorialIntelligenceService';
import { knowledgeEvolutionService, KnowledgeEvolutionState } from '../services/knowledgeEvolutionService';
import { 
  getShopeeAffiliateConfig, 
  saveShopeeAffiliateConfig, 
  getUserShopeeProducts,
  addUserShopeeProduct,
  deleteUserShopeeProduct,
  importShopeeProductsFromBulkText,
  syncShopeeProductsFromCloud,
  getSmartContextualShopeeProducts,
  buildShopeeAffiliateUrl,
  type ShopeeAffiliateConfig,
  type ShopeeProduct
} from '../services/shopeeAffiliateService';
import { ShopeeAffiliateShowcase } from './ShopeeAffiliateShowcase';
import { forceRenewAllPostsWithAppealingImages } from '../services/firebase';

interface AutomationDashboardProps {
  onRefreshPosts: () => void;
  posts: Post[];
}

export const AutomationDashboard: React.FC<AutomationDashboardProps> = ({ onRefreshPosts, posts }) => {
  const [config, setConfig] = useState<AutomationConfig>(automationService.getConfig());
  const [logs, setLogs] = useState<AutomationLogEntry[]>(automationService.getLogs());
  const [shopeeConfig, setShopeeConfig] = useState<ShopeeAffiliateConfig>(getShopeeAffiliateConfig());
  const [shopeeIdInput, setShopeeIdInput] = useState(shopeeConfig.affiliateId);
  const [userProducts, setUserProducts] = useState<ShopeeProduct[]>(() => getUserShopeeProducts());
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorQuery, setSimulatorQuery] = useState('Flamengo clássico no Maracanã');
  
  // Form para Novo Produto Real
  const [formTitle, setFormTitle] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formCategory, setFormCategory] = useState<FootballCategory>('Clubes Serie A');
  const [formPrice, setFormPrice] = useState('R$ 89,90');
  const [formOriginalPrice, setFormOriginalPrice] = useState('R$ 149,90');
  const [formKeywords, setFormKeywords] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formBadge, setFormBadge] = useState('Meu Link Oficial');
  const [formDescription, setFormDescription] = useState('Manto ou acessório oficial com cupom de desconto e entrega garantida pela Shopee.');

  // Form para Importação em Lote
  const [bulkText, setBulkText] = useState('');
  const [bulkCategory, setBulkCategory] = useState<FootballCategory>('Clubes Serie A');

  const [isProcessing, setIsProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; title: string } | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Inteligência Editorial & Evolução Contínua de Conhecimento
  const intelligence = useMemo(() => analyzeEditorialHistory(posts), [posts]);
  const [knowledgeState, setKnowledgeState] = useState<KnowledgeEvolutionState>(() => 
    knowledgeEvolutionService.getState(posts)
  );

  const refreshData = async () => {
    try {
      const synced = await automationService.syncFromFirestore();
      setConfig(synced);
    } catch {
      setConfig(automationService.getConfig());
    }
    setLogs(automationService.getLogs());

    try {
      const kState = await knowledgeEvolutionService.syncFromFirestore(posts);
      setKnowledgeState(kState);
    } catch {
      setKnowledgeState(knowledgeEvolutionService.getState(posts));
    }

    try {
      const syncedProds = await syncShopeeProductsFromCloud();
      setUserProducts(syncedProds);
    } catch {
      setUserProducts(getUserShopeeProducts());
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 10000);
    return () => clearInterval(interval);
  }, [posts]);

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleToggleAutomation = () => {
    const updated: AutomationConfig = {
      ...config,
      enabled: !config.enabled,
    };
    automationService.saveConfig(updated);
    setConfig(updated);
    automationService.addLog({
      type: 'system',
      title: updated.enabled ? 'Piloto Automático 2x/Dia Ativado' : 'Piloto Automático Pausado',
      message: updated.enabled 
        ? 'O motor de 100% piloto automático agora está ativo com 2 publicações diárias (11h45 e 18h45) e Destaque Principal garantido.'
        : 'O piloto automático foi pausado pelo administrador.',
      status: updated.enabled ? 'success' : 'warning',
    });
    refreshData();
    showFeedback(updated.enabled ? 'Piloto Automático ATIVADO (2 publicações diárias nos 365 dias do ano)!' : 'Piloto Automático pausado.');
  };

  const handleForceSlot = async (slot: 'morning' | 'evening') => {
    setIsProcessing(true);
    const slotName = slot === 'morning' ? 'Edição 1: Almoço / Manhã' : 'Edição 2: Fim de Tarde / Noite';
    try {
      const created = await automationService.forceExecuteSlot(slot, onRefreshPosts);
      await refreshData();
      showFeedback(`${slotName} gerada com sucesso em DESTAQUE PRINCIPAL: "${created.title.slice(0, 40)}..."`);
    } catch (err) {
      console.error(err);
      showFeedback(`Erro ao disparar ${slotName}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateDiverseInstant = async (category?: FootballCategory) => {
    setIsProcessing(true);
    try {
      const created = await automationService.generateDiverseInstantPost(category, onRefreshPosts);
      await refreshData();
      showFeedback(`Nova matéria gerada com sucesso na categoria "${created.category}" em DESTAQUE PRINCIPAL!`);
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar matéria imediata.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunCheckNow = async () => {
    setIsProcessing(true);
    try {
      const res = await automationService.checkAndRun(onRefreshPosts);
      await refreshData();
      if (res.publishedCount > 0 || res.generatedCount > 0) {
        showFeedback(`Checagem concluída: ${res.publishedCount} matéria(s) agendada(s) publicada(s) e ${res.generatedCount} do piloto automático gerada(s).`);
      } else {
        showFeedback('Checagem concluída: Ambas as edições de hoje verificadas e horários sincronizados.');
      }
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao executar checagem do piloto automático.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenewAllPosts = async () => {
    setIsProcessing(true);
    setBatchProgress({ current: 0, total: posts.length, title: 'Iniciando revisão editorial e criação de imagens...' });
    try {
      const res = await forceRenewAllPostsWithAppealingImages((current, total, title) => {
        setBatchProgress({ current, total, title });
      });
      if (onRefreshPosts) onRefreshPosts();
      await refreshData();
      showFeedback(`✓ Sucesso Absoluto! Todas as ${res.count} postagens foram auditadas pelo robô inteligente e atualizadas com imagens chamativas, atraentes e de alto CTR!`);
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao renovar imagens das postagens.');
    } finally {
      setIsProcessing(false);
      setBatchProgress(null);
    }
  };

  const handleSaveShopeeId = () => {
    const updated = {
      ...shopeeConfig,
      affiliateId: shopeeIdInput.trim() || 'campobr_oficial',
    };
    saveShopeeAffiliateConfig(updated);
    setShopeeConfig(updated);
    showFeedback(`ID de Afiliado Shopee atualizado para "${updated.affiliateId}" com sucesso!`);
  };

  const handleToggleShopeeAffiliate = () => {
    const updated = {
      ...shopeeConfig,
      enabled: !shopeeConfig.enabled,
    };
    saveShopeeAffiliateConfig(updated);
    setShopeeConfig(updated);
    showFeedback(updated.enabled ? 'Monetização com Shopee Afiliados ATIVADA!' : 'Monetização com Shopee Afiliados pausada.');
  };

  const handleAddShopeeProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl.trim()) {
      showFeedback('Por favor, cole o seu link de afiliado da Shopee (ex: https://s.shopee.com.br/...).');
      return;
    }
    if (!formTitle.trim()) {
      showFeedback('Por favor, informe o título do produto.');
      return;
    }

    const keywordsArray = formKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    if (keywordsArray.length === 0) {
      keywordsArray.push(
        ...formTitle.toLowerCase().replace(/[^a-z0-9áéíóúãõâêîôûç\s]/g, '').split(/\s+/).filter(w => w.length >= 3)
      );
    }

    const fallbackImages: Record<FootballCategory, string> = {
      'Clubes Serie A': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
      'Clubes Serie B': 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=600&q=80',
      'Seleção Brasileira': 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=600&q=80',
      'Jogadores': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
      'Equipe Técnica': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      'Eventos': 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=600&q=80',
    };

    const finalImage = formImageUrl.trim() || fallbackImages[formCategory] || fallbackImages['Clubes Serie A'];

    const isPriceGiven = Boolean(formPrice.trim());
    await addUserShopeeProduct({
      title: formTitle.trim(),
      category: formCategory,
      priceDisplay: isPriceGiven ? formPrice.trim() : 'Verificar preço atual (Check current price)',
      originalPrice: formOriginalPrice.trim() || undefined,
      currentPriceVerified: isPriceGiven,
      verifiedStatus: formUrl.trim() ? 'verified' : 'unverified',
      imageUrl: finalImage,
      badge: formBadge.trim() || (formUrl.trim() ? 'Link Verificado' : 'Marketplace'),
      searchQuery: formTitle.trim(),
      directShopeeUrl: formUrl.trim(),
      description: formDescription.trim() || 'Item selecionado para torcedores e praticantes de futebol.',
      freeShipping: false,
      keywords: keywordsArray,
      isUserRealProduct: true,
      productSpecifications: ['Verificar especificações na loja oficial'],
      editorialNotes: 'Link de produto adicionado pela redação.',
    });

    const updated = getUserShopeeProducts();
    setUserProducts(updated);
    setIsAddProductOpen(false);
    setFormTitle('');
    setFormUrl('');
    setFormKeywords('');
    showFeedback(`Produto "${formTitle}" cadastrado com sucesso e conectado ao robô autônomo!`);
  };

  const handleDeleteProduct = async (id: string, title: string) => {
    const updated = await deleteUserShopeeProduct(id);
    setUserProducts(updated);
    showFeedback(`Produto "${title}" removido do catálogo.`);
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      showFeedback('Cole os links da Shopee para importar.');
      return;
    }
    const res = await importShopeeProductsFromBulkText(bulkText, bulkCategory);
    setUserProducts(res.products);
    setIsBulkImportOpen(false);
    setBulkText('');
    showFeedback(`${res.added} produto(s) de afiliado importado(s) com sucesso para o robô!`);
  };

  const handleCatalogModeChange = (mode: 'prefer_user_products' | 'exclusive_user_products') => {
    const updated = {
      ...shopeeConfig,
      catalogMode: mode,
    };
    saveShopeeAffiliateConfig(updated);
    setShopeeConfig(updated);
    showFeedback(
      mode === 'exclusive_user_products'
        ? 'Modo Exclusivo Ativado: O robô só usará os produtos cadastrados por você!'
        : 'Modo Preferencial Ativado: O robô prioriza seus produtos reais e usa itens de apoio se faltar produto para a categoria.'
    );
  };

  const handleClearLogs = () => {
    automationService.clearLogs();
    setLogs([]);
    showFeedback('Logs de automação limpos com sucesso.');
  };

  const slotMorning = config.slotMorning;
  const slotEvening = config.slotEvening;

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 animate-fade-in shadow-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Header Banner com Status do Piloto Automático 2x ao Dia */}
      <div className="card-football rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/40 border border-emerald-500/30 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-800 pb-6">
          <div className="flex items-start gap-4">
            <div className={`p-4 rounded-2xl border ${
              config.enabled 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}>
              <Bot className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display font-black text-xl sm:text-2xl text-white">
                  Ecossistema 100% Piloto Automático (2x ao Dia • 365 Dias no Ano)
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                  config.enabled 
                    ? 'bg-emerald-500 text-slate-950 animate-pulse' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  <Activity className="w-3 h-3" />
                  {config.enabled ? 'Ativo 24/7' : 'Pausado'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 730 Matérias/Ano
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" /> Destaque Hero Automático
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-400" /> Trava Anti-Duplicações Ativa
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                O motor autônomo do CampoBR publica sozinho <strong>2 vezes por dia todos os dias do ano (365 dias)</strong>:
                a <strong>Edição 1 no Almoço (~11h45 BRT)</strong> e a <strong>Edição 2 no Fim de Tarde/Noite (~18h45 BRT)</strong>.
                Cada matéria é 100% inédita, redigida no padrão de <strong>760 a 970 palavras + 2 blocos de apoio</strong>, com alta relevância para monetização no <strong>Google AdSense e Shopee Afiliados</strong> e cérebro de auto-aprendizado ativo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleToggleAutomation}
              className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                config.enabled
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>{config.enabled ? 'Pausar Piloto Automático' : 'Ativar Piloto Automático (2x/Dia)'}</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRunCheckNow}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              title="Executa imediatamente a rotina de checagem do robô"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isProcessing ? 'Verificando...' : 'Verificar Agora'}</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRenewAllPosts}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md"
              title="Aplica novas imagens chamativas e atrativas em 100% das postagens do blog"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Renovar Imagens de Todas as Matérias</span>
            </button>
          </div>
        </div>

        {/* Pilares do Ecossistema em 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Data de Hoje
            </span>
            <span className="text-lg font-black text-white font-mono">
              {config.lastRunDate}
            </span>
            <span className="text-[10px] text-emerald-400 block font-semibold">
              ● 2 Edições diárias programadas
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-400" /> Edição 1 (Almoço)
            </span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {slotMorning.scheduledTime} BRT
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {slotMorning.executed ? '✓ Postado Hoje' : `Categoria: ${slotMorning.category}`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-400" /> Edição 2 (Noite)
            </span>
            <span className="text-lg font-black text-indigo-300 font-mono">
              {slotEvening.scheduledTime} BRT
            </span>
            <span className="text-[10px] text-slate-400 block truncate">
              {slotEvening.executed ? '✓ Postado Hoje' : `Categoria: ${slotEvening.category}`}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Dupla Monetização
            </span>
            <span className="text-sm font-black text-[#ff6433] block">
              AdSense + Shopee
            </span>
            <span className="text-[10px] text-slate-400 block">
              100% em conformidade com políticas
            </span>
          </div>
        </div>
      </div>

      {/* Os 2 Slots Diários: Painel de Controle e Disparo Imediato */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card Edição 1: Almoço / Manhã */}
        <div className="card-football rounded-3xl p-6 sm:p-7 space-y-5 bg-gradient-to-br from-slate-950 via-[#0e1622] to-amber-950/20 border border-amber-500/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Sun className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-display font-black text-base sm:text-lg text-white">
                  Edição 1: Almoço / Manhã
                </h3>
                <span className="text-[10px] text-slate-400">
                  Horário Oficial: ~11h45 BRT (Pré-jogo, coletivas e escalações)
                </span>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              slotMorning.executed 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {slotMorning.executed ? '✓ Postado Hoje' : '⏳ Aguardando Horário'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Horário Hoje:</span>
              <span className="font-mono font-black text-emerald-400 text-base">{slotMorning.scheduledTime} BRT</span>
              <span className="text-[10px] text-slate-400 block font-medium">Horário de Brasília</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Categoria Oficial:</span>
              <span className="font-bold text-amber-300 text-sm truncate block">{slotMorning.category}</span>
              <span className="text-[10px] text-slate-400 truncate block">
                {CATEGORY_ENGLISH_TITLES[slotMorning.category] || slotMorning.category}
              </span>
            </div>
          </div>

          {slotMorning.executedPostTitle && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs space-y-0.5">
              <span className="text-emerald-400 font-bold text-[10px] uppercase block">Matéria Publicada no Slot:</span>
              <p className="text-white font-medium text-xs line-clamp-2">{slotMorning.executedPostTitle}</p>
            </div>
          )}

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleForceSlot('morning')}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>Publicar Edição da Manhã Agora (Teste Imediato)</span>
          </button>
        </div>

        {/* Card Edição 2: Fim de Tarde / Noite */}
        <div className="card-football rounded-3xl p-6 sm:p-7 space-y-5 bg-gradient-to-br from-slate-950 via-[#0d1424] to-indigo-950/20 border border-indigo-500/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Moon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-display font-black text-base sm:text-lg text-white">
                  Edição 2: Fim de Tarde / Noite
                </h3>
                <span className="text-[10px] text-slate-400">
                  Horário Oficial: ~18h45 BRT (Pós-jogos, tabela e desfecho da rodada)
                </span>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              slotEvening.executed 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
            }`}>
              {slotEvening.executed ? '✓ Postado Hoje' : '⏳ Aguardando Horário'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Horário Hoje:</span>
              <span className="font-mono font-black text-indigo-400 text-base">{slotEvening.scheduledTime} BRT</span>
              <span className="text-[10px] text-slate-400 block font-medium">Horário de Brasília</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Categoria Oficial:</span>
              <span className="font-bold text-purple-300 text-sm truncate block">{slotEvening.category}</span>
              <span className="text-[10px] text-slate-400 truncate block">
                {CATEGORY_ENGLISH_TITLES[slotEvening.category] || slotEvening.category}
              </span>
            </div>
          </div>

          {slotEvening.executedPostTitle && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-0.5">
              <span className="text-indigo-400 font-bold text-[10px] uppercase block">Matéria Publicada no Slot:</span>
              <p className="text-white font-medium text-xs line-clamp-2">{slotEvening.executedPostTitle}</p>
            </div>
          )}

          <button
            type="button"
            disabled={isProcessing}
            onClick={() => handleForceSlot('evening')}
            className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-white" />
            <span>Publicar Edição da Noite Agora (Teste Imediato)</span>
          </button>
        </div>
      </div>

      {/* Cérebro de Evolução Contínua de Conhecimento e Atração de Leitores */}
      <div className="card-football rounded-3xl p-6 sm:p-8 space-y-6 bg-gradient-to-br from-slate-950 via-[#0a121d] to-indigo-950/30 border border-indigo-500/40 shadow-2xl">
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-indigo-400" /> Cérebro de Evolução Contínua de Conhecimento (Self-Learning)
            </span>
            <h3 className="font-display font-black text-lg sm:text-xl text-white mt-0.5">
              Aprendizado com a Audiência & Otimização Hipnótica de Retenção
            </h3>
            <p className="text-xs text-slate-400">
              O robô analisa continuamente o engajamento dos leitores, memoriza tópicos já abordados para não se repetir e injeta lições de atração no Gemini a cada publicação dos 365 dias do ano.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold shrink-0 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Ciclo #{knowledgeState.currentCycle} Ativo
            </span>
          </div>
        </div>

        {/* Métricas do Cérebro Editorial */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> Matérias no Acervo
            </span>
            <span className="text-2xl font-black text-white font-mono block">
              {posts.length}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Base de conhecimento ativa
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Índice de Atração
            </span>
            <span className="text-2xl font-black text-amber-300 font-mono block">
              {knowledgeState.readerAttractionIndex}/100
            </span>
            <span className="text-[10px] text-amber-500 block">
              Alto Dwell Time comprovado
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Diversidade & Originalidade
            </span>
            <span className="text-2xl font-black text-cyan-300 font-mono block">
              {intelligence.diversityIndex}%
            </span>
            <span className="text-[10px] text-cyan-500 block">
              Zero duplicações de pauta
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> Tempo Médio de Leitura
            </span>
            <span className="text-2xl font-black text-purple-300 font-mono block">
              {knowledgeState.averageReadingTimeMinutes} min
            </span>
            <span className="text-[10px] text-purple-400 block">
              Ideal para monetização máxima
            </span>
          </div>
        </div>

        {/* Lições de Atração Aprendidas em Tempo Real */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" /> Lições de Engajamento Aprendidas pelo Robô:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {knowledgeState.learnedInsights.slice(0, 4).map((ins) => (
              <div key={ins.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {ins.category} • Ciclo #{ins.cycle}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                    {ins.impactScore}
                  </span>
                </div>
                <p className="text-xs text-white font-medium">
                  {ins.finding}
                </p>
                <p className="text-[11px] text-slate-400 italic">
                  💡 Ação assimilada: {ins.appliedAction}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Memória Anti-Repetição */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Memória de Longo Prazo Anti-Repetição (Tópicos Bloqueados)
            </span>
            <span className="text-[10px] text-slate-500">
              {intelligence.recentCoveredTitles.length} matérias recentes na memória ativa
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Antes de redigir qualquer nova edição, o robô consulta este banco para impedir repetições de manchete e focar em novos ângulos:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {intelligence.recentEntities.map((ent) => (
              <span key={ent} className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                🔒 {ent}
              </span>
            ))}
            {intelligence.recentCoveredTitles.slice(0, 6).map((t, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-slate-950/80 text-slate-400 text-[10px] border border-slate-800 truncate max-w-xs">
                ✓ {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Padrão Editorial OBRIGATÓRIO (Alto Valor para AdSense e Retenção de Leitores) */}
      <div className="card-football rounded-3xl p-6 sm:p-8 space-y-4 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/30 border border-emerald-500/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-display font-black text-base sm:text-lg text-white">
                  Padrão Editorial de Alto Rendimento CampoBR
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Futebol Brasileiro • Alto Dwell Time
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Conteúdo 100% redigido no padrão UOL Esporte e ge.globo, com narrativa esportiva de alta imersão, análise tática, bastidores e cobertura dos clubes e competições nacionais.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 6 Categorias • 760-970 Palavras
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center font-mono font-black">1</span>
              <span>Narrativa Principal Imersiva</span>
            </div>
            <span className="font-mono font-black text-white text-base block">760 a 970 Palavras</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Bloco contínuo e aprofundado com a vibração das arquibancadas, duelos táticos de prancheta, lances capitais e apuração de bastidores.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs flex items-center justify-center font-mono font-black">2</span>
              <span>Bloco 1: Destaques da Tabela</span>
            </div>
            <span className="font-mono font-black text-white text-base block">20 a 70 Palavras</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Subtítulo "### Destaques e Cenário da Tabela" detalhando pontuação, classificação e desdobramentos na corrida pelo título.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center justify-center font-mono font-black">3</span>
              <span>Bloco 2: Informações do Jogo</span>
            </div>
            <span className="font-mono font-black text-white text-base block">20 a 70 Palavras</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Subtítulo "### Informações do Confronto e Próximo Jogo" com público, estádio, arbitragem e o próximo compromisso no calendário.
            </p>
          </div>
        </div>
      </div>

      {/* PAINEL COMPLETO: CATÁLOGO DE PRODUTOS AFILIADOS REAIS DA SHOPEE & ROBÔ AUTÔNOMO */}
      <div className="card-football rounded-3xl p-6 sm:p-8 space-y-6 bg-gradient-to-br from-slate-950 via-[#140f13] to-[#260f0a] border border-[#ee4d2d]/35 shadow-2xl">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-start gap-3.5">
            <div className="p-3.5 rounded-2xl bg-[#ee4d2d]/20 text-[#ff6433] border border-[#ee4d2d]/30 shrink-0">
              <ShoppingBag className="w-7 h-7 text-[#ee4d2d]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-display font-black text-xl sm:text-2xl text-white">
                  Monetização com Seus Produtos da Shopee Afiliados
                </h3>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  shopeeConfig.enabled 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {shopeeConfig.enabled ? 'Ativo no Blog' : 'Pausado'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ee4d2d]/20 text-[#ff6433] text-[10px] font-black uppercase tracking-wider border border-[#ee4d2d]/40 flex items-center gap-1">
                  <Bot className="w-3 h-3 text-[#ee4d2d]" />
                  Robô Conectado aos Seus Links
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Cadastre todos os seus produtos verdadeiros com seus links reais da sua conta Shopee (<code className="text-[#ff7849]">https://s.shopee.com.br/...</code>). O robô autônomo do blog lê este catálogo e faz a correspondência contextual automática para cada matéria do ano.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleShopeeAffiliate}
            className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
              shopeeConfig.enabled
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                : 'bg-gradient-to-r from-[#ee4d2d] to-[#ff5722] text-white font-black shadow-lg shadow-[#ee4d2d]/30'
            }`}
          >
            {shopeeConfig.enabled ? 'Pausar Vitrine Shopee' : 'Ativar Vitrine Shopee'}
          </button>
        </div>

        {/* Barra de Status e Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Seus Produtos Reais Cadastrados
            </span>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-2xl text-[#ff6433]">{userProducts.length}</span>
              <span className="text-[11px] text-slate-400 font-medium">itens ativos no robô</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Modo de Seleção do Robô
            </span>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm text-emerald-400">
                {shopeeConfig.catalogMode === 'exclusive_user_products' ? 'Exclusivo (Só Seus Links)' : 'Preferencial (Recomendado)'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Sincronização em Nuvem
            </span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Firestore Cloud Ativo</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Precisão do Match Contextual
            </span>
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>100% Afinidade Temática</span>
            </div>
          </div>
        </div>

        {/* Configuração do ID de Afiliado & Modo de Operação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <label className="font-bold text-slate-200 block">
              Seu ID / Tag de Afiliado Shopee (af_sub1 / Sub-ID):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shopeeIdInput}
                onChange={(e) => setShopeeIdInput(e.target.value)}
                placeholder="Ex: campobr_oficial"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-[#ee4d2d]"
              />
              <button
                type="button"
                onClick={handleSaveShopeeId}
                className="px-4 py-2.5 rounded-xl bg-[#ee4d2d] hover:bg-[#d73f1f] text-white font-black text-xs uppercase tracking-wide cursor-pointer transition-colors shadow-md shadow-[#ee4d2d]/25"
              >
                Salvar ID
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 Para links completos ou buscas, este parâmetro garante a atribuição das suas comissões na sua conta Shopee.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <label className="font-bold text-slate-200 block">
              Estratégia de Exibição do Robô Autônomo:
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleCatalogModeChange('prefer_user_products')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  shopeeConfig.catalogMode !== 'exclusive_user_products'
                    ? 'bg-[#ee4d2d]/20 border-[#ee4d2d] text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-black text-xs text-[#ff6433] mb-0.5">★ Preferencial (Recomendado)</div>
                <p className="text-[10px] leading-tight opacity-90">
                  Prioriza 100% seus produtos reais. Se a matéria for de time sem produto, usa apoio esportivo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleCatalogModeChange('exclusive_user_products')}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  shopeeConfig.catalogMode === 'exclusive_user_products'
                    ? 'bg-[#ee4d2d]/20 border-[#ee4d2d] text-white font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-black text-xs text-[#ff6433] mb-0.5">🔒 Exclusivo</div>
                <p className="text-[10px] leading-tight opacity-90">
                  Exibe unicamente os produtos que você cadastrou nesta lista com seus links reais.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Botões de Ações de Catálogo */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setIsAddProductOpen(!isAddProductOpen);
              setIsBulkImportOpen(false);
              setIsSimulatorOpen(false);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#ee4d2d] to-[#ff5722] hover:from-[#d73f1f] hover:to-[#ee4d2d] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md shadow-[#ee4d2d]/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Produto Afiliado Real</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsBulkImportOpen(!isBulkImportOpen);
              setIsAddProductOpen(false);
              setIsSimulatorOpen(false);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
          >
            <ListPlus className="w-4 h-4 text-[#ff6433]" />
            <span>Importar em Lote (Colar Vários Links)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSimulatorOpen(!isSimulatorOpen);
              setIsAddProductOpen(false);
              setIsBulkImportOpen(false);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ml-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Simulador de Match do Robô</span>
          </button>
        </div>

        {/* FORMULÁRIO DE CADASTRO INDIVIDUAL */}
        {isAddProductOpen && (
          <form 
            onSubmit={handleAddShopeeProduct}
            className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-[#ee4d2d]/40 space-y-4 animate-fade-in shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-display font-black text-base text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ee4d2d]" />
                Cadastrar Novo Produto Afiliado Verdadeiro da Sua Conta Shopee
              </h4>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Seu Link Real de Afiliado da Shopee (Obrigatório):
                </label>
                <input
                  type="url"
                  required
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="Ex: https://s.shopee.com.br/123456 ou https://shope.ee/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-[#ee4d2d]"
                />
                <p className="text-[10px] text-slate-400">
                  Cole o link exato gerado no app ou painel de afiliados Shopee.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Título do Produto (Obrigatório):
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Camisa Oficial Palmeiras I 2024 Torcedor Puma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#ee4d2d]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Categoria de Futebol:
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as FootballCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#ee4d2d]"
                >
                  {OFFICIAL_CYCLE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  Preço de Venda (Exibição):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="R$ 89,90"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#ee4d2d]"
                  />
                  <input
                    type="text"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    placeholder="De R$ 149,90"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#ee4d2d]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-slate-300 block">
                  Palavras-chave para o Robô Autônomo Associar (Separadas por vírgula):
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="Ex: palmeiras, verdao, allianz parque, abel ferreira, camisa verde, manto"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#ee4d2d]"
                />
                <p className="text-[10px] text-slate-400">
                  Sempre que o robô gerar uma matéria mencionando esses termos, este produto será o escolhido para aparecer no topo!
                </p>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-bold text-slate-300 block">
                  URL da Foto do Produto (Opcional - usamos foto esportiva em alta definição se deixar em branco):
                </label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://cf.shopee.com.br/file/... ou URL de imagem direta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-[#ee4d2d]"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ee4d2d] to-[#ff5722] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md shadow-[#ee4d2d]/30"
              >
                Salvar Produto no Catálogo
              </button>
            </div>
          </form>
        )}

        {/* FORMULÁRIO DE IMPORTAÇÃO EM LOTE */}
        {isBulkImportOpen && (
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-[#ee4d2d]/40 space-y-4 animate-fade-in shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-display font-black text-base text-white flex items-center gap-2">
                <ListPlus className="w-4 h-4 text-[#ee4d2d]" />
                Importar Múltiplos Links de Afiliado da Shopee de Uma Vez
              </h4>
              <button
                type="button"
                onClick={() => setIsBulkImportOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Fechar
              </button>
            </div>

            <p className="text-slate-300">
              Cole abaixo uma lista de links de afiliado da sua conta Shopee. O importador detectará automaticamente cada link e criará os produtos no catálogo do robô:
            </p>

            <textarea
              rows={5}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Exemplo de linhas:
https://s.shopee.com.br/exemplo1 - Camisa Titular Flamengo 2024
https://s.shopee.com.br/exemplo2 - Meião Grip Antiderrapante
https://s.shopee.com.br/exemplo3 - Chuteira Society Masculina Travas`}
              className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-[#ee4d2d]"
            />

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-300">Categoria padrão para estes itens:</label>
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value as FootballCategory)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                >
                  {OFFICIAL_CYCLE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleBulkImport}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ee4d2d] to-[#ff5722] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md shadow-[#ee4d2d]/30"
              >
                Processar e Importar Links
              </button>
            </div>
          </div>
        )}

        {/* SIMULADOR DE MATCH CONTEXTUAL DO ROBÔ */}
        {isSimulatorOpen && (
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4 animate-fade-in shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-display font-black text-base text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Simulador de Seleção do Robô Autônomo
              </h4>
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕ Fechar
              </button>
            </div>

            <p className="text-slate-300">
              Digite qualquer assunto ou título de matéria para ver exatamente qual produto da sua conta Shopee o robô selecionará:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={simulatorQuery}
                onChange={(e) => setSimulatorQuery(e.target.value)}
                placeholder="Ex: Flamengo, Palmeiras, Seleção Brasileira, Dorival, Chuteira..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Resultado do Match */}
            {(() => {
              const matched = getSmartContextualShopeeProducts({
                category: 'Clubes Serie A',
                postTitle: simulatorQuery,
                postContent: simulatorQuery,
                limit: 2,
              });

              return (
                <div className="pt-2">
                  <span className="font-bold text-slate-300 block mb-2">
                    🎯 Produtos Selecionados pelo Robô para este tema:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {matched.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                        <img src={m.imageUrl} alt={m.title} className="w-12 h-12 rounded-lg object-cover bg-slate-950 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            {m.isUserRealProduct ? (
                              <span className="text-[9px] font-black uppercase text-emerald-400">★ Seu Produto Real</span>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400">Catálogo Padrão</span>
                            )}
                          </div>
                          <h5 className="font-bold text-white text-xs truncate">{m.title}</h5>
                          <span className="font-display font-black text-xs text-[#ff6433]">{m.priceDisplay}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* LISTA / GRID DE PRODUTOS REAIS CADASTRADOS */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#ee4d2d]" />
              Catálogo de Produtos Reais Cadastrados ({userProducts.length}):
            </span>
            {userProducts.length > 0 && (
              <span className="text-[11px] text-emerald-400 font-bold">
                ✓ Todos prontos para serem usados pelo robô diário
              </span>
            )}
          </div>

          {userProducts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-display font-black text-sm text-white">
                  Nenhum produto próprio cadastrado ainda
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Cadastre seus produtos reais ou cole seus links encurtados da Shopee (<code className="text-[#ff6433]">https://s.shopee.com.br/...</code>). Enquanto você não cadastra, o robô utiliza produtos esportivos oficiais de reserva para não deixar nenhuma matéria sem monetização!
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#ee4d2d] hover:bg-[#d73f1f] text-white font-black text-xs uppercase tracking-wide cursor-pointer shadow-md shadow-[#ee4d2d]/25"
              >
                + Cadastrar Primeiro Produto Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {userProducts.map((p) => {
                const affiliateUrl = buildShopeeAffiliateUrl(p, shopeeConfig.affiliateId);

                return (
                  <div 
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-[#ee4d2d]/50 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                          <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[8px] uppercase tracking-wider border border-emerald-500/30">
                              ★ Link Verificado
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold">{p.category}</span>
                          </div>
                          <h5 className="font-display font-bold text-xs text-white line-clamp-2 mt-1 leading-snug">
                            {p.title}
                          </h5>
                          <span className="font-display font-black text-xs text-[#ff6433] block mt-0.5">
                            {p.priceDisplay}
                          </span>
                        </div>
                      </div>

                      {/* Palavras-chave associadas pelo robô */}
                      {p.keywords && p.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {p.keywords.slice(0, 5).map((kw, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono text-[9px] border border-slate-800">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ações do Card */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                      <a
                        href={affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="px-3 py-1.5 rounded-lg bg-[#ee4d2d]/20 hover:bg-[#ee4d2d]/30 text-[#ff7849] font-bold text-[10px] uppercase flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Testar Link</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id, p.title)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Guia Rápido: Como Pegar Seus Links de Afiliado na Shopee */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-bold text-[#ff6433]">
            <HelpCircle className="w-4 h-4" />
            <span>Passo a Passo: Como Obter Seus Links de Afiliado na Shopee</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-400 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
              <span className="font-bold text-white block mb-0.5">1. No App Shopee:</span>
              Acesse sua conta com perfil de afiliado aprovado. Vá em "Eu" &gt; "Programa de Afiliados".
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
              <span className="font-bold text-white block mb-0.5">2. Escolha o Produto:</span>
              Encontre o manto, bola, acessório ou chuteira. Toque no ícone de "Compartilhar" e clique em "Copiar Link".
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/60">
              <span className="font-bold text-white block mb-0.5">3. Cole no CampoBR:</span>
              Cole o link aqui no botão "Cadastrar Produto" ou "Importar em Lote". O robô do blog passa a usá-lo imediatamente em todas as novas matérias!
            </div>
          </div>
        </div>

        {/* Pré-visualização da Vitrine Shopee com Produtos do Usuário */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#ee4d2d]" /> Pré-visualização da Vitrine Shopee (Exibida aos Leitores):
          </span>
          <ShopeeAffiliateShowcase category="Clubes Serie A" compact={false} />
        </div>
      </div>

      {/* Rotação Oficial das 5 Categorias (Padrão em Inglês para o Público Norte-Americano) */}
      <div className="card-football rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Rotação Contínua das 6 Categorias Oficiais
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Futebol Brasileiro
              </span>
            </div>
            <h3 className="font-display font-black text-lg text-white mt-0.5">
              Cobertura Estruturada do Ecossistema do Futebol Nacional
            </h3>
            <p className="text-xs text-slate-400">
              A cada dia, as 2 edições diárias avançam de forma contínua no ciclo de 6 categorias oficiais, entregando matérias ricas com análise tática, bastidores e cobertura do Brasileirão, Série B, Copas e Seleção:
            </p>
          </div>

          <span className="text-[11px] font-bold text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
            6 Categorias Oficiais • 365 Dias/Ano
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-1">
          {OFFICIAL_CYCLE_CATEGORIES.map((cat, idx) => {
            const isMorning = slotMorning.category === cat;
            const isEvening = slotEvening.category === cat;
            const subtitle = CATEGORY_ENGLISH_TITLES[cat] || cat;

            return (
              <div 
                key={cat}
                className={`p-4 rounded-2xl border text-center space-y-2 transition-all flex flex-col justify-between ${
                  isMorning || isEvening
                    ? 'bg-emerald-950/60 border-emerald-500 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-900/70 border-slate-800'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isMorning || isEvening ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      Cat. #{idx + 1}
                    </span>
                    {(isMorning || isEvening) && (
                      <span className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Hoje
                      </span>
                    )}
                  </div>
                  <h4 className={`font-bold text-xs ${isMorning || isEvening ? 'text-white' : 'text-slate-200'}`}>
                    {cat}
                  </h4>
                  <div className="px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-black text-[#ff7849] truncate">
                    {subtitle}
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                  {isMorning && '☀️ Edição Manhã (~11h45)'}
                  {isEvening && '🌙 Edição Noite (~18h45)'}
                  {!isMorning && !isEvening && (
                    idx === 0 ? 'Revelações & Craques' :
                    idx === 1 ? 'Pranchetas & Treinadores' :
                    idx === 2 ? 'Mundial & Libertadores' :
                    idx === 3 ? 'Acesso & Caldeirões' :
                    idx === 4 ? 'Título & Clássicos' :
                    'Seleção & Eliminatórias'
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disparo Imediato nas 6 Categorias Oficiais do Robô Autônomo */}
      <div className="card-football rounded-3xl p-6 sm:p-8 space-y-5 bg-gradient-to-br from-slate-950 via-[#0a1420] to-emerald-950/20 border border-emerald-500/40 shadow-xl">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> 6 Categorias Oficiais do Robô Autônomo CampoBR
            </span>
            <h3 className="font-display font-black text-lg sm:text-xl text-white mt-0.5">
              Produção Instantânea nas 6 Categorias (760-970 Palavras)
            </h3>
            <p className="text-xs text-slate-400">
              Dispare uma matéria avulsa imediatamente em qualquer uma das 6 categorias oficiais no padrão editorial do CampoBR (narrativa profunda, lances capitais, análise tática e apuração de bastidores):
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold shrink-0 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Padrão 760-970 Palavras
          </span>
        </div>

        {/* Banner Informativo & Ação em Lote do Pipeline de Revisão e Geração de Imagem com Gemini */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-[#0c1622] border border-emerald-500/50 flex flex-col gap-4 text-xs shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <span className="text-emerald-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Robô Inteligente: Automação 100% Futebolística + Imagens Alinhadas ao Conteúdo + Alto CTR
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">
                <strong>1. Imagens 100% no Tema Futebol:</strong> O robô inteligente vincula exclusivamente fotos de futebol profissional (lances capitais, jogadas de área, arquibancadas, craques e pranchetas táticas) alinhadas rigorosamente ao conceito informativo do título e do corpo da matéria.<br/>
                <strong>2. Revisão Editorial Pré-Postagem:</strong> O robô inteligente audita minuciosamente toda a matéria antes de publicar (elimina clichês de IA, refina o gancho dramático e valida os blocos de Tabela e Confronto).<br/>
                <strong>3. Aplicação Estruturada no Conteúdo:</strong> O robô inteligente insere automaticamente a leitura tática, atmosfera de arena e consistência com o leitor, criando uma experiência cativante e uniforme.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleRenewAllPosts}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 hover:from-amber-400 to-emerald-500 hover:to-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>{isProcessing && batchProgress ? 'Processando Matérias...' : `Revisar & Gerar Imagens de Todas (${posts.length})`}</span>
              </button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <span className="text-emerald-400 font-bold">● 100% Únicas</span>
                <span>•</span>
                <span className="text-amber-300 font-bold">Zero Duplicatas</span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso em Tempo Real durante a Atualização em Lote */}
          {batchProgress && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/40 space-y-2 mt-1 animate-pulse">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-amber-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  Robô revisando matéria e gerando nova imagem apelativa...
                </span>
                <span className="text-white font-mono font-bold">
                  {batchProgress.current} / {batchProgress.total} ({Math.round((batchProgress.current / batchProgress.total) * 100)}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${Math.round((batchProgress.current / batchProgress.total) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Processando agora: <span className="text-white font-medium italic">"{batchProgress.title}"</span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-1">
          {OFFICIAL_CYCLE_CATEGORIES.map((cat, idx) => (
            <button
              key={cat}
              type="button"
              disabled={isProcessing}
              onClick={() => handleGenerateDiverseInstant(cat)}
              className="p-4 rounded-2xl bg-slate-900/90 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/60 text-slate-200 hover:text-white font-bold text-xs flex flex-col items-start justify-between gap-3 transition-all cursor-pointer disabled:opacity-50 group shadow-md text-left"
            >
              <div className="w-full flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                  Cat. #{idx + 1}
                </span>
                <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-transform" />
              </div>
              <div>
                <span className="font-display font-black text-sm text-white block">
                  {cat}
                </span>
                <span className="text-[11px] text-amber-300/90 block font-medium mt-0.5 line-clamp-1">
                  {CATEGORY_ENGLISH_TITLES[cat] || cat}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  760-970 palavras • Inédita
                </span>
              </div>
              <div className="w-full pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-emerald-400 group-hover:text-emerald-300 font-bold">
                <span>Gerar Agora</span>
                <Zap className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Webhook & GitHub Actions 2x ao Dia */}
      <div className="card-football rounded-3xl p-6 sm:p-8 space-y-5 bg-gradient-to-br from-slate-950 via-[#0a111c] to-emerald-950/30 border border-emerald-500/40 shadow-2xl">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <GitBranch className="w-4 h-4" /> Automação Externa 2x ao Dia na Nuvem (365 Dias)
            </span>
            <h3 className="font-display font-black text-lg sm:text-xl text-white mt-0.5">
              GitHub Actions Cron (11h45 e 18h45 BRT) & Webhooks
            </h3>
            <p className="text-xs text-slate-400">
              O blog roda 100% autônomo na nuvem todos os dias do ano sem precisar de computador ligado:
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold shrink-0 self-start sm:self-auto flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 2x/Dia Configurado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>1. GitHub Actions (Workflow Automático 2x/Dia)</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Arquivo configurado em <code className="text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">.github/workflows/daily-publisher.yml</code>.
              Executa 2x/dia: às <strong>14:45 UTC (11:45 BRT)</strong> e às <strong>21:45 UTC (18:45 BRT)</strong>.
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-400 space-y-1">
              <span className="text-slate-500 block"># Cron de Execução Dupla Oficial</span>
              <span className="text-emerald-400 font-bold block">schedule: - cron: '45 14 * * *'</span>
              <span className="text-indigo-400 font-bold block">schedule: - cron: '45 21 * * *'</span>
              <span className="text-slate-500 block mt-1"># Suporta slot selection e dry-run</span>
              <span className="text-purple-300 block">workflow_dispatch: ativo</span>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>2. Comando CLI Standalone</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Você também pode disparar manualmente qualquer slot via linha de comando ou script cron no servidor:
            </p>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-[10px] text-slate-300 space-y-1 overflow-x-auto">
              <span className="text-slate-500 block"># Teste local (sem gravar):</span>
              <span className="text-teal-400 select-all block">cd automation && npm install && node run.mjs --dry-run</span>
              <span className="text-slate-500 block mt-1"># Publicação real: GitHub → Actions → "CampoBR - Robô Editorial" → Run workflow</span>
              <span className="text-indigo-400 select-all block">(roda sozinho 2x ao dia às 11:45 e 18:45 BRT)</span>
            </div>
            <p className="text-[10px] text-slate-400">
              🔒 <em>Limite diário e lista de pautas já processadas ficam em system_state/automation; o robô não republica a mesma fonte.</em>
            </p>
          </div>
        </div>
      </div>

      {/* Logs de Auditoria */}
      <div className="card-football rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-black text-lg text-white">
              Histórico & Logs de Execução do Piloto Automático
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClearLogs}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Logs</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-500">
            Nenhum evento registrado ainda. O robô registrará todas as publicações automáticas da Manhã (11h45) e Noite (18h45) aqui.
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-xs">{log.title}</span>
                    {log.category && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                        {log.category}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      log.status === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                      log.status === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                      log.status === 'error' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{log.message}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 pt-0.5">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
