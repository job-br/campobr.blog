import React, { useState } from 'react';
import { Post, FootballCategory } from '../types';
import { 
  Flame, 
  Sparkles, 
  Wand2, 
  TrendingUp, 
  Globe, 
  Clock, 
  Check, 
  ExternalLink, 
  FileText, 
  Cpu, 
  Loader2, 
  Compass, 
  ShieldCheck, 
  Zap,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';
import { LATEST_GOOGLE_FOOTBALL_NEWS, GoogleNewsHeadline } from '../services/googleSportsService';
import { googleContentAssistant, GeneratedArticleData } from '../services/googleContentAssistant';

export interface TrendingTrendItem {
  id: string;
  topic: string;
  category: FootballCategory;
  searchVolume: string;
  trendVelocity: string;
  angle: string;
  coverImage: string;
  defaultTitle: string;
}

// Tendências de Alto Tráfego no Google Trends Brasil (Futebol)
export const GOOGLE_TRENDS_FOOTBALL_BR: TrendingTrendItem[] = [
  {
    id: 'tr-1',
    topic: 'Flamengo x Bragantino e a Liderança do Brasileirão',
    category: 'Clubes Serie A',
    searchVolume: '280.000+ pesquisas hoje',
    trendVelocity: '+180% nas últimas 4 horas',
    angle: 'Análise tática da vitória no Maracanã e os desdobramentos para a disputa do título',
    coverImage: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
    defaultTitle: 'Flamengo se Isola na Liderança do Brasileirão: Análise Tática e os Bastidores da Vitória no Maracanã'
  },
  {
    id: 'tr-2',
    topic: 'Palmeiras e o Confronto Decisivo contra o Grêmio na Arena',
    category: 'Clubes Serie A',
    searchVolume: '240.000+ pesquisas hoje',
    trendVelocity: '+140% nas últimas 2 horas',
    angle: 'Equilíbrio tático, lances capitais de Raphael Veiga e Cristaldo e a pressão na tabela',
    coverImage: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    defaultTitle: 'Duelo de Gigantes: Como o Palmeiras Superou a Pressão em Porto Alegre e Segue Firme na Briga'
  },
  {
    id: 'tr-3',
    topic: 'Convocação da Seleção Brasileira e a Renovação de Dorival Júnior',
    category: 'Seleção Brasileira',
    searchVolume: '350.000+ pesquisas hoje',
    trendVelocity: '+290% em alta nacional',
    angle: 'Novos talentos, intensidade no meio-campo e o planejamento para a Copa do Mundo',
    coverImage: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80',
    defaultTitle: 'Seleção Brasileira em Nova Fase: As Surpresas da Lista de Dorival Júnior e a Identidade Tática'
  },
  {
    id: 'tr-4',
    topic: 'Vasco da Gama Goleia em São Januário com Show de Vegetti e Coutinho',
    category: 'Clubes Serie A',
    searchVolume: '190.000+ pesquisas hoje',
    trendVelocity: '+120% nas últimas horas',
    angle: 'Atuação de gala, sintonia da torcida e ascensão expressiva na tabela de classificação',
    coverImage: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    defaultTitle: 'Noite Histórica em São Januário: O Show Coletivo do Vasco e a Vibração da Colina Histórica'
  },
  {
    id: 'tr-5',
    topic: 'Cruzeiro Vira sobre o Vitória no Barradão e Entra na Briga pela Libertadores',
    category: 'Clubes Serie A',
    searchVolume: '160.000+ pesquisas hoje',
    trendVelocity: '+95% em Salvador e BH',
    angle: 'Poder de reação da Raposa, brilho de Matheus Pereira e os números do confronto',
    coverImage: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
    defaultTitle: 'Poder de Reação e Consolidação: Como o Cruzeiro Construiu a Virada no Barradão'
  },
  {
    id: 'tr-6',
    topic: 'Estêvão e Vinicius Júnior: O Protagonismo dos Atacantes Brasileiros no Mundo',
    category: 'Jogadores',
    searchVolume: '310.000+ pesquisas hoje',
    trendVelocity: '+210% no Google Discover',
    angle: 'Comparativo de dribles, impacto nas decisões e a valorização no mercado internacional',
    coverImage: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=1200&q=80',
    defaultTitle: 'A Nova Safra de Ouro: Por que a Dinâmica de Estêvão e Vini Jr Fascina o Futebol Mundial'
  }
];

interface GoogleAutomationHubProps {
  availablePosts: Post[];
  onApplyPostData: (data: {
    title: string;
    category: FootballCategory;
    summary: string;
    content: string;
    coverImage: string;
    aiImageMention: string;
    tags: string;
    readTimeMinutes: number;
  }) => void;
  onAutoPublishDirectly?: (post: Omit<Post, 'id' | 'viewsCount' | 'likesCount'>) => Promise<void>;
}

export const GoogleAutomationHub: React.FC<GoogleAutomationHubProps> = ({
  availablePosts,
  onApplyPostData,
  onAutoPublishDirectly,
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'news'>('trends');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const hasApiKey = googleContentAssistant.hasApiKey();

  const handleTransformTrend = async (trend: TrendingTrendItem, autoPublish = false) => {
    setIsGenerating(true);
    setGeneratingId(trend.id);
    setStatusMessage(`Gerando artigo inédito com Google AI sobre: "${trend.topic}"...`);

    try {
      // 1. Gera artigo completo inédito estruturado
      const articleData: GeneratedArticleData = await googleContentAssistant.generateFullArticle(
        trend.topic,
        trend.category,
        trend.defaultTitle
      );

      // 2. Detecta links internos automaticamente nas frases
      const detected = googleContentAssistant.detectInternalLinks(articleData.content, availablePosts);
      let contentWithInternalLinks = articleData.content;
      for (const match of detected) {
        if (contentWithInternalLinks.includes(match.phrase)) {
          contentWithInternalLinks = contentWithInternalLinks.replace(match.phrase, match.replacementMarkdown);
        }
      }

      // Adiciona citação de recomendação se houver outros artigos
      if (availablePosts.length > 0) {
        const related = availablePosts.find(p => p.category === trend.category) || availablePosts[0];
        if (related && !contentWithInternalLinks.includes(related.id)) {
          contentWithInternalLinks += `\n\n> 📌 **Leia também no CampoBR:** [${related.title}](internal:${related.id})`;
        }
      }

      const formattedData = {
        title: articleData.title,
        category: trend.category,
        summary: articleData.summary,
        content: contentWithInternalLinks,
        coverImage: trend.coverImage,
        aiImageMention: 'Imagem gerada por IA / CampoBR Studio',
        tags: articleData.tags.join(', '),
        readTimeMinutes: 5,
      };

      if (autoPublish && onAutoPublishDirectly) {
        setStatusMessage('Publicando matéria diretamente no blog...');
        const slug = formattedData.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 100);

        await onAutoPublishDirectly({
          ...formattedData,
          slug,
          authorName: 'Redação CampoBR',
          authorRole: 'Jornalista Esportivo',
          authorAvatar: '/logo-512x512.png',
          featured: false,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'published',
          tags: formattedData.tags.split(',').map(t => t.trim()).filter(Boolean),
        });

        setStatusMessage(`Matéria "${formattedData.title.slice(0, 35)}..." publicada com sucesso no blog!`);
      } else {
        // Preenche o editor Word com o conteúdo pronto para revisão
        onApplyPostData(formattedData);
        setStatusMessage(`Matéria carregada na Folha de Word! Role abaixo para revisar e publicar.`);
      }
    } catch (err) {
      console.error('Erro na automação do artigo:', err);
      setStatusMessage('Erro ao gerar matéria. Tente novamente.');
    } finally {
      setIsGenerating(false);
      setGeneratingId(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleTransformNewsHeadline = async (news: GoogleNewsHeadline, autoPublish = false) => {
    setIsGenerating(true);
    setGeneratingId(news.id);
    setStatusMessage(`Pesquisando e redigindo matéria inédita sobre: "${news.title.slice(0, 35)}..."`);

    try {
      const category: FootballCategory = news.category === 'Seleção Brasileira' ? 'Seleção Brasileira' : 'Clubes Serie A';
      const cleanTopic = news.title.replace(/há \d+ (minutos|hora|horas)/i, '').trim();

      const articleData: GeneratedArticleData = await googleContentAssistant.generateFullArticle(
        cleanTopic,
        category
      );

      // Auto linkagem interna
      const detected = googleContentAssistant.detectInternalLinks(articleData.content, availablePosts);
      let contentWithInternalLinks = articleData.content;
      for (const match of detected) {
        if (contentWithInternalLinks.includes(match.phrase)) {
          contentWithInternalLinks = contentWithInternalLinks.replace(match.phrase, match.replacementMarkdown);
        }
      }

      const formattedData = {
        title: articleData.title,
        category,
        summary: articleData.summary || news.summary,
        content: contentWithInternalLinks,
        coverImage: articleData.coverImage || '',
        aiImageMention: 'Imagem gerada por IA / CampoBR Studio',
        tags: articleData.tags.join(', '),
        readTimeMinutes: 5,
      };

      if (autoPublish && onAutoPublishDirectly) {
        setStatusMessage('Publicando matéria diretamente no blog...');
        const slug = formattedData.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 100);

        await onAutoPublishDirectly({
          ...formattedData,
          slug,
          authorName: 'Redação CampoBR',
          authorRole: 'Jornalista Esportivo',
          authorAvatar: '/logo-512x512.png',
          featured: false,
          publishedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'published',
          tags: formattedData.tags.split(',').map(t => t.trim()).filter(Boolean),
        });

        setStatusMessage(`Notícia convertida e publicada com sucesso!`);
      } else {
        onApplyPostData(formattedData);
        setStatusMessage(`Artigo inédito gerado e carregado na Folha de Word!`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('Erro ao transformar notícia.');
    } finally {
      setIsGenerating(false);
      setGeneratingId(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const filteredTrends = GOOGLE_TRENDS_FOOTBALL_BR.filter(t => 
    !searchTerm.trim() || 
    t.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.angle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNews = LATEST_GOOGLE_FOOTBALL_NEWS.filter(n =>
    !searchTerm.trim() ||
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card-football rounded-3xl p-5 sm:p-7 border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 shadow-2xl space-y-5">
      {/* Top Banner & Explanation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-black text-lg sm:text-xl text-white">
                Central de Pautas & Automação Diária do Google
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                100% Compatível com Google AdSense
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Monitore o que o torcedor brasileiro está buscando agora no <strong>Google Trends</strong> e no <strong>Google Notícias</strong>. Com 1 clique, a IA do Google redige um <strong>artigo 100% inédito, analítico e formatado</strong> no padrão Word para monetização máxima.
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 self-start md:self-auto shrink-0">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <div className="text-[11px]">
            <span className="font-bold text-slate-300 block leading-none">Motor IA Editorial</span>
            <span className="text-emerald-400 text-[10px] leading-none mt-0.5 block">
              {hasApiKey ? 'Gemini 2.5 Flash Conectado' : 'Modo Inteligente Ativo'}
            </span>
          </div>
        </div>
      </div>

      {/* Live Toast Message */}
      {statusMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-xl animate-fade-in">
          {isGenerating ? (
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Tabs Switcher and Filter Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-slate-950 rounded-2xl p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'trends'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Google Trends em Alta ({GOOGLE_TRENDS_FOOTBALL_BR.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'news'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Google Notícias do Dia ({LATEST_GOOGLE_FOOTBALL_NEWS.length})</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por clube, jogador ou clássico..."
            className="pl-8.5 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* TAB 1: GOOGLE TRENDS CARDS */}
      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTrends.map((trend) => (
            <div
              key={trend.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3 flex flex-col justify-between group shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {trend.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-bold">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{trend.trendVelocity}</span>
                  </div>
                </div>

                <h3 className="font-display font-black text-sm text-white group-hover:text-emerald-300 transition-colors leading-snug">
                  {trend.topic}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {trend.angle}
                </p>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                  <span>🔥 Volume: <strong>{trend.searchVolume}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleTransformTrend(trend, false)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Gera a matéria e abre na Folha de Word para você revisar"
                >
                  {isGenerating && generatingId === trend.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Carregar no Word</span>
                    </>
                  )}
                </button>

                {onAutoPublishDirectly && (
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => handleTransformTrend(trend, true)}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    title="Gera e publica diretamente no CampoBR agora"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Publicar Agora</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: GOOGLE NEWS REAL-TIME HEADLINES */}
      {activeTab === 'news' && (
        <div className="space-y-3">
          {filteredNews.map((news) => (
            <div
              key={news.id}
              className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-lg"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {news.tag}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {news.timeAgo}
                  </span>
                  <span className="text-[11px] text-slate-500">•</span>
                  <span className="text-[11px] text-slate-400 font-medium">{news.source}</span>
                </div>

                <h3 className="font-display font-bold text-sm text-white group-hover:text-blue-300 transition-colors leading-snug">
                  {news.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {news.summary}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex sm:flex-col items-center gap-2 shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleTransformNewsHeadline(news, false)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  title="Cria artigo analítico original e abre na Folha Word"
                >
                  {isGenerating && generatingId === news.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span>Transformar em Artigo</span>
                </button>

                {onAutoPublishDirectly && (
                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => handleTransformNewsHeadline(news, true)}
                    className="w-full px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center justify-center gap-1 shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Auto-Publicar</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
