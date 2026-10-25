import React, { useState } from 'react';
import { Post, FootballCategory, AdSenseConfig, AdminSession } from '../types';
import { 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Database, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Save, 
  RotateCcw,
  Eye,
  Heart,
  Share2,
  ShieldCheck,
  Smartphone,
  Mail,
  Lock,
  LogOut,
  Search,
  ExternalLink,
  Link,
  KeyRound,
  Check,
  Download,
  FileArchive,
  Globe,
  Flame,
  Zap,
  Clock,
  Calendar,
  Bot
} from 'lucide-react';
import { 
  createNewPost, 
  updateExistingPost, 
  deletePostById, 
  testConnection, 
  saveAdSenseConfig,
  isOnlineFirebase 
} from '../services/firebase';
import { Admin2FAModal } from './Admin2FAModal';
import { downloadDistZipReliable } from '../services/zipDownloader';
import { GoogleEditorAssistant } from './GoogleEditorAssistant';
import { WordDocumentEditor } from './WordDocumentEditor';
import { GoogleAutomationHub } from './GoogleAutomationHub';
import { AutomationDashboard } from './AutomationDashboard';
import { automationService } from '../services/automationService';
import { googleContentAssistant, GeneratedArticleData } from '../services/googleContentAssistant';
import { generateSitemapXml, generateRssXml, downloadFile } from '../services/seoFeeder';
import { 
  getHumanizedPeakSchedule, 
  getNextOptimalHumanSchedule, 
  HumanizedScheduleResult,
  PeakSlot 
} from '../utils/humanSchedule';
import { EditorialSpreadsheetQueue } from './EditorialSpreadsheetQueue';
import { GoogleEcosystemHub } from './GoogleEcosystemHub';
import { Table, Activity } from 'lucide-react';

interface AdminPanelProps {
  posts: Post[];
  adsConfig: AdSenseConfig;
  onRefreshPosts: () => void;
  onUpdateAdsConfig: (config: AdSenseConfig) => void;
  isAdminLoggedIn: boolean;
  adminSession: AdminSession | null;
  onAdminLoginSuccess: (session: AdminSession) => void;
  onAdminLogout: () => void;
  onOpenQuickNewPost?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  posts,
  adsConfig,
  onRefreshPosts,
  onUpdateAdsConfig,
  isAdminLoggedIn,
  adminSession,
  onAdminLoginSuccess,
  onAdminLogout,
  onOpenQuickNewPost,
}) => {
  const [adminTab, setAdminTab] = useState<
    'manage' | 'create' | 'editorial-queue' | 'google-ecosystem' | 'trends' | 'automation' | 'ads' | 'firebase' | 'export'
  >('manage');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [searchManageTerm, setSearchManageTerm] = useState('');
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);

  const handleOpenDraftInEditor = (draft: {
    title: string;
    summary: string;
    content: string;
    category: FootballCategory;
    tags: string[];
    sources: any[];
  }) => {
    setEditingPostId(null);
    setTitle(draft.title);
    setCategory(draft.category);
    setSummary(draft.summary);
    setContent(draft.content);
    setTagsInput(draft.tags ? draft.tags.join(', ') : 'Futebol, Brasileirão, Tática');
    setAdminTab('create');
    setNotification({
      text: 'Rascunho gerado pelo Robô com Grounding carregado no editor! Revise antes de publicar.',
      type: 'success',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FootballCategory>('Seleção Brasileira');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [aiImageMention, setAiImageMention] = useState('Imagem gerada por IA / CampoBR Studio');
  const [authorName, setAuthorName] = useState('Redação CampoBR');
  const [authorRole, setAuthorRole] = useState('Jornalista Esportivo');
  const [readTimeMinutes, setReadTimeMinutes] = useState(5);
  const [featured, setFeatured] = useState(false);
  const [tagsInput, setTagsInput] = useState('Futebol, Brasileirão, Tática');
  const [postStatus, setPostStatus] = useState<'published' | 'scheduled'>('published');
  const [scheduledFor, setScheduledFor] = useState('');
  const [humanScheduleInfo, setHumanScheduleInfo] = useState<HumanizedScheduleResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // AdSense Form
  const [adPubId, setAdPubId] = useState(adsConfig.publisherId);
  const [adSlotTop, setAdSlotTop] = useState(adsConfig.slotRightTop);
  const [adSlotBottom, setAdSlotBottom] = useState(adsConfig.slotRightBottom);
  const [adEnabled, setAdEnabled] = useState(adsConfig.adsenseEnabled);

  // Firebase test status
  const [firebaseStatusMessage, setFirebaseStatusMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingPostId(null);
    setTitle('');
    setCategory('Seleção Brasileira');
    setSummary('');
    setContent('');
    setCoverImage('');
    setAiImageMention('Imagem gerada por IA / CampoBR Studio');
    setAuthorName('Redação CampoBR');
    setAuthorRole('Jornalista Esportivo');
    setReadTimeMinutes(5);
    setFeatured(false);
    setTagsInput('Futebol, Brasileirão, Tática');
    setPostStatus('published');
    setScheduledFor('');
    setHumanScheduleInfo(null);
  };

  const handleEditClick = (post: Post) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setCategory(post.category);
    setSummary(post.summary);
    setContent(post.content);
    setCoverImage(post.coverImage);
    setAiImageMention(post.aiImageMention || 'Imagem gerada por IA / CampoBR Studio');
    setAuthorName(post.authorName);
    setAuthorRole(post.authorRole);
    setReadTimeMinutes(post.readTimeMinutes || 5);
    setFeatured(post.featured || false);
    setTagsInput(post.tags ? post.tags.join(', ') : '');
    setPostStatus(post.status === 'scheduled' ? 'scheduled' : 'published');
    setScheduledFor(post.scheduledFor || '');
    setAdminTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setNotification({ text: 'Preencha todos os campos obrigatórios (título e conteúdo).', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const slug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 100);

      if (editingPostId) {
        await updateExistingPost(editingPostId, {
          title,
          category,
          summary,
          content,
          coverImage,
          aiImageMention,
          authorName,
          authorRole,
          authorAvatar: '/logo-512x512.png',
          readTimeMinutes: Number(readTimeMinutes) || 4,
          featured,
          tags: parsedTags,
          slug,
          status: postStatus,
          scheduledFor: postStatus === 'scheduled' ? scheduledFor : undefined,
        });
        setNotification({ text: 'Postagem atualizada com sucesso no banco de dados!', type: 'success' });
      } else {
        await createNewPost({
          title,
          slug,
          summary,
          content,
          category,
          coverImage,
          aiImageMention,
          authorName,
          authorRole,
          authorAvatar: '/logo-512x512.png',
          featured,
          readTimeMinutes: Number(readTimeMinutes) || 5,
          tags: parsedTags,
          publishedAt: new Date().toISOString(),
          status: postStatus,
          scheduledFor: postStatus === 'scheduled' ? scheduledFor : undefined,
        });
        setNotification({ 
          text: postStatus === 'scheduled' 
            ? 'Matéria agendada com sucesso para o horário nobre!' 
            : 'Nova matéria publicada com sucesso no CampoBR!', 
          type: 'success' 
        });
      }

      resetForm();
      onRefreshPosts();
      setAdminTab('manage');
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error(err);
      setNotification({ text: 'Erro ao salvar postagem.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoCreateAndPublish = async (article: GeneratedArticleData) => {
    setIsSaving(true);
    try {
      const slug = article.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 100);

      await createNewPost({
        title: article.title,
        slug,
        summary: article.summary,
        content: article.content,
        category: article.category || category,
        coverImage: article.coverImage || coverImage,
        aiImageMention: 'Imagem gerada por IA / CampoBR Studio',
        authorName: article.authorName || authorName || 'Redação CampoBR',
        authorRole: article.authorRole || authorRole || 'Jornalista Esportivo',
        authorAvatar: '/logo-512x512.png',
        featured: false,
        readTimeMinutes: article.suggestedReadingTime || 5,
        tags: article.tags,
        publishedAt: new Date().toISOString(),
        status: 'published',
      });

      onRefreshPosts();
      setNotification({ text: `Nova matéria inédita publicada no blog: "${article.title.slice(0, 45)}..."`, type: 'success' });
      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error(err);
      setNotification({ text: 'Erro ao publicar matéria automática.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateTripleSchedule = async (forcedCategory?: FootballCategory) => {
    setIsSaving(true);
    try {
      await automationService.generateTripleScheduledGrade(forcedCategory, onRefreshPosts);
      setNotification({
        text: 'Grade gerada com sucesso! 3 matérias inéditas salvas e organizadas nas respectivas categorias do futebol brasileiro nos 3 horários nobres.',
        type: 'success'
      });
      setTimeout(() => setNotification(null), 6000);
    } catch (err) {
      console.error(err);
      setNotification({ text: 'Erro ao gerar as 3 postagens agendadas.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportJsonBackup = () => {
    const dataStr = JSON.stringify({
      exportDate: new Date().toISOString(),
      blog: 'CampoBR (campobr.blog)',
      totalPosts: posts.length,
      adsConfig,
      posts
    }, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadFile(`campobr-backup-postagens-${dateStr}.json`, dataStr, 'application/json');
    setNotification({ text: 'Backup JSON de todas as postagens baixado com sucesso!', type: 'success' });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDownloadSitemap = () => {
    const xml = generateSitemapXml(posts);
    downloadFile('sitemap.xml', xml, 'application/xml');
    setNotification({ text: 'Arquivo sitemap.xml gerado e baixado!', type: 'success' });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDownloadRss = () => {
    const xml = generateRssXml(posts);
    downloadFile('rss.xml', xml, 'application/rss+xml');
    setNotification({ text: 'Feed RSS (rss.xml) gerado e baixado!', type: 'success' });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleDeletePost = async (id: string, postTitle: string) => {
    if (!confirm(`Confirma a exclusão definitiva da postagem: "${postTitle}"?`)) return;
    try {
      await deletePostById(id);
      onRefreshPosts();
      setNotification({ text: `Matéria "${postTitle.slice(0, 30)}..." excluída com sucesso!`, type: 'success' });
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error(err);
      setNotification({ text: 'Erro ao excluir matéria.', type: 'error' });
    }
  };

  const handleApplyFromHub = (data: {
    title: string;
    category: FootballCategory;
    summary: string;
    content: string;
    coverImage: string;
    aiImageMention: string;
    tags: string;
    readTimeMinutes: number;
  }) => {
    setEditingPostId(null);
    setTitle(data.title);
    setCategory(data.category);
    setSummary(data.summary);
    setContent(data.content);
    setCoverImage(data.coverImage);
    setAiImageMention(data.aiImageMention);
    setTagsInput(data.tags);
    setReadTimeMinutes(data.readTimeMinutes);
    setAdminTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setNotification({ text: 'Pauta do Google Trends carregada na Folha de Word! Revise e publique.', type: 'success' });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAutoPublishDirectly = async (newPostData: Omit<Post, 'id' | 'viewsCount' | 'likesCount'>) => {
    setIsSaving(true);
    try {
      await createNewPost({
        ...newPostData,
        authorAvatar: '/logo-512x512.png',
        status: 'published',
      });
      setNotification({ text: `Matéria "${newPostData.title.slice(0, 35)}..." publicada com sucesso no CampoBR!`, type: 'success' });
      onRefreshPosts();
      setAdminTab('manage');
      setTimeout(() => setNotification(null), 4500);
    } catch (err) {
      console.error(err);
      setNotification({ text: 'Erro ao publicar matéria automaticamente.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAds = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AdSenseConfig = {
      publisherId: adPubId,
      slotRightTop: adSlotTop,
      slotRightBottom: adSlotBottom,
      slotFeedMiddle: adsConfig.slotFeedMiddle || '9876543210',
      autoAds: adsConfig.autoAds ?? true,
      adsenseEnabled: adEnabled,
    };
    saveAdSenseConfig(updated);
    onUpdateAdsConfig(updated);
    setNotification({ text: 'Configurações de Monetização AdSense salvas!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTestFirebase = async () => {
    setFirebaseStatusMessage('Testando comunicação com o Firestore do Firebase...');
    const result = await testConnection();
    setFirebaseStatusMessage(result.message);
  };

  const insertSnippet = (snippet: string) => {
    setContent((prev) => prev + '\n' + snippet);
  };

  // Filter posts in manage view
  const filteredManagePosts = posts.filter((p) => {
    if (!searchManageTerm) return true;
    const term = searchManageTerm.toLowerCase();
    return (
      p.title.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.authorName.toLowerCase().includes(term)
    );
  });

  // ==========================================
  // UNLOGGED STATE: 2-STEP AUTH GATEWAY
  // ==========================================
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="card-football rounded-3xl p-8 sm:p-12 text-center border border-emerald-500/30 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-xl">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <span className="px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-black uppercase tracking-wider">
            Área Restrita Administrativa
          </span>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white mt-3 mb-2">
            Acesso Restrito ao Painel Administrativo
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Para adicionar, editar ou excluir matérias e gerenciar a monetização do <strong>CampoBR</strong>, autentique-se com o seu <strong>Gmail e Senha</strong>:
          </p>

          <div className="max-w-md mx-auto mb-8 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Etapa de Segurança com Gmail e Senha</h3>
                <p className="text-xs text-slate-400 mt-0.5">Acesso exclusivo do administrador proprietário. Nenhum dado exposto publicamente.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Proteção e confidencialidade total para suas credenciais.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIs2FAModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider inline-flex items-center justify-center gap-3 shadow-xl transition-all cursor-pointer hover:shadow-2xl"
            >
              <Lock className="w-5 h-5 shrink-0 text-slate-950" />
              <span>Autenticar com Gmail e Senha</span>
            </button>
          </div>
        </div>

        {/* 2FA Login Modal */}
        <Admin2FAModal
          isOpen={is2FAModalOpen}
          onClose={() => setIs2FAModalOpen(false)}
          onSuccess={(sess) => {
            setIs2FAModalOpen(false);
            onAdminLoginSuccess(sess);
          }}
        />
      </div>
    );
  }

  // ==========================================
  // LOGGED IN STATE: FULL ADMIN OPERATIONS
  // ==========================================
  return (
    <div className="max-w-6xl mx-auto py-6 px-3 sm:px-6 space-y-6">
      {/* Top Admin Status Bar */}
      <div className="card-football rounded-3xl p-5 border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" />
                Administrador Conectado
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Conta Google Autorizada
              </span>
            </div>
            <h1 className="font-display font-black text-lg sm:text-xl text-white mt-0.5">
              Painel de Controle Editorial • CampoBR
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => {
              resetForm();
              setAdminTab('create');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Adicionar Postagem</span>
          </button>
          <button
            onClick={onAdminLogout}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Encerrar Sessão Segura"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          } animate-fade-in shadow-lg`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setAdminTab('manage')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'manage'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Gerenciar & Editar ({posts.length} Matérias)</span>
        </button>

        <button
          onClick={() => {
            if (adminTab !== 'create') resetForm();
            setAdminTab('create');
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'create'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{editingPostId ? 'Editando Matéria' : 'Criar Nova Matéria'}</span>
        </button>

        <button
          onClick={() => setAdminTab('editorial-queue')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'editorial-queue'
              ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          <Table className="w-4 h-4 text-emerald-400" />
          <span>📋 Fila Editorial & Base (Planilha)</span>
        </button>

        <button
          onClick={() => setAdminTab('google-ecosystem')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'google-ecosystem'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black shadow-md shadow-indigo-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30'
          }`}
        >
          <Activity className="w-4 h-4 text-indigo-400" />
          <span>🌐 8 Ferramentas Google & Valor</span>
        </button>

        <button
          onClick={() => setAdminTab('trends')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'trends'
              ? 'bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>⚡ Pautas do Google (Trends & Notícias)</span>
        </button>

        <button
          onClick={() => setAdminTab('automation')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'automation'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>🤖 Robô & Automação 24/7</span>
        </button>

        <button
          onClick={() => setAdminTab('ads')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'ads'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Google AdSense</span>
        </button>

        <button
          onClick={() => setAdminTab('firebase')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'firebase'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Firebase Firestore</span>
        </button>

        <button
          onClick={() => setAdminTab('export')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            adminTab === 'export'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
              : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
          }`}
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Baixar Arquivos (ZIP)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB: FILA EDITORIAL & BASE DE CONHECIMENTO (PLANILHA) */}
      {/* ======================================================== */}
      {adminTab === 'editorial-queue' && (
        <div className="space-y-4">
          <EditorialSpreadsheetQueue
            existingPosts={posts}
            onOpenDraftInEditor={handleOpenDraftInEditor}
            onPostPublished={() => {
              onRefreshPosts();
              setNotification({
                text: 'Matéria aprovada e publicada no blog CampoBR!',
                type: 'success',
              });
            }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: ECOSSISTEMA GOOGLE (8 FERRAMENTAS & MÉTRICAS DE VALOR) */}
      {/* ======================================================== */}
      {adminTab === 'google-ecosystem' && (
        <div className="space-y-4">
          <GoogleEcosystemHub
            adsConfig={adsConfig}
            onUpdateAdsConfig={onUpdateAdsConfig}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: MANAGE POSTS (SEARCH, EDIT, DELETE ANY OF 36) */}
      {/* ======================================================== */}
      {adminTab === 'manage' && (
        <div className="card-football rounded-3xl p-5 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h2 className="font-display font-black text-xl text-white">
                Catálogo de Matérias ({posts.length})
              </h2>
              <p className="text-xs text-slate-400">
                Você tem permissão total de administrador para editar conteúdo ou excluir qualquer postagem.
              </p>
            </div>

            {/* Search Filter */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchManageTerm}
                onChange={(e) => setSearchManageTerm(e.target.value)}
                placeholder="Buscar por título ou autor..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Barra de Automação Rápida: Gerar Matéria Inédita ou Grade dos 3 Horários */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-amber-950/40 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xs text-white block">
                  Automação com Conteúdo 100% Inédito & Anti-Robô
                </span>
                <span className="text-[11px] text-slate-400">
                  Gere matérias completas agora ou preencha a grade automática dos 3 horários nobres de leitura.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  const article = await googleContentAssistant.generateFullArticle();
                  await handleAutoCreateAndPublish(article);
                }}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-500/20 disabled:opacity-50"
                title="Gera uma matéria com conteúdo e tema 100% diferente e publica imediatamente no blog"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>{isSaving ? 'Gerando...' : '⚡ Gerar 1 Matéria & Publicar'}</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleGenerateTripleSchedule()}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50"
                title="Gera 3 matérias inéditas salvas e agendadas para Manhã (07h00 ±10m), Almoço (12h30 ±10m) e Pós-Jogo (22h30 ±10m)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Criando Grade...' : '📅 Gerar Grade (3 Horários Agendados)'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Título da Postagem</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Autor</th>
                  <th className="p-3">Views</th>
                  <th className="p-3">Likes</th>
                  <th className="p-3">Destaque</th>
                  <th className="p-3 text-right">Ações Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredManagePosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-semibold text-white max-w-sm">
                      <p className="line-clamp-1">{post.title}</p>
                      {post.aiImageMention && (
                        <span className="text-[10px] text-amber-400/80 italic flex items-center gap-1 mt-0.5">
                          <Sparkles className="w-2.5 h-2.5" /> {post.aiImageMention}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400 font-semibold text-[10px] whitespace-nowrap">
                        {post.category}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {post.status === 'scheduled' ? (
                        <div className="space-y-0.5">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/40 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            Agendado
                          </span>
                          {post.scheduledFor && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              {post.scheduledFor.replace('T', ' ')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Publicado
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {post.authorName}
                    </td>
                    <td className="p-3 font-mono text-emerald-400">
                      {post.viewsCount.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 font-mono text-rose-400">
                      {post.likesCount}
                    </td>
                    <td className="p-3">
                      {post.featured ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          SIM
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Não</span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-1.5">
                      {post.status === 'scheduled' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateExistingPost(post.id, { status: 'published', publishedAt: new Date().toISOString() });
                            onRefreshPosts();
                            setNotification({ text: `Matéria "${post.title.slice(0, 30)}..." publicada imediatamente!`, type: 'success' });
                            setTimeout(() => setNotification(null), 3500);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-300 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-md shadow-emerald-950/40"
                          title="Publicar esta matéria agendada agora no blog"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Publicar Já</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleEditClick(post)}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 hover:bg-cyan-900 text-cyan-300 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Editar conteúdo desta postagem"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id, post.title)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/40 hover:bg-rose-900 text-rose-300 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Excluir postagem do blog"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CREATE / EDIT POST FORM */}
      {/* ======================================================== */}
      {adminTab === 'create' && (
        <form onSubmit={handleSavePost} className="card-football rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {editingPostId ? 'Edição de Matéria' : 'Nova Publicação'}
              </span>
              <h2 className="font-display font-black text-xl text-white mt-0.5">
                {editingPostId ? 'Editar Postagem Existente' : 'Cadastrar Nova Matéria Esportiva'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAdminTab('trends')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Abrir Central de Pautas Automáticas do Google"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Pautas em Alta no Google</span>
              </button>
              {editingPostId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Cancelar Edição
                </button>
              )}
            </div>
          </div>

          {/* Plugin Google AI de Redação & SEO Esportivo */}
          <GoogleEditorAssistant
            currentTitle={title}
            currentCategory={category}
            currentSummary={summary}
            currentContent={content}
            currentTags={tagsInput}
            onApplyTitle={setTitle}
            onApplySummary={setSummary}
            onApplyContent={setContent}
            onApplyTags={setTagsInput}
            onApplyCategory={(cat) => setCategory(cat)}
            onApplyCoverImage={(img) => setCoverImage(img)}
            onAutoCreateAndPublish={handleAutoCreateAndPublish}
            onGenerateTripleSchedule={handleGenerateTripleSchedule}
            onApplyAll={(data) => {
              setTitle(data.title);
              setSummary(data.summary);
              setContent(data.content);
              setTagsInput(data.tags);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Title */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Título da Matéria *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Tática Moderna da Seleção Brasileira para 2026..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 font-semibold"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Categoria Oficial *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FootballCategory)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="Seleção Brasileira">Seleção Brasileira</option>
                <option value="Clubes Serie A">Clubes Serie A</option>
                <option value="Clubes Serie B">Clubes Serie B</option>
                <option value="Jogadores">Jogadores</option>
                <option value="Equipe Técnica">Equipe Técnica</option>
                <option value="Eventos">Eventos</option>
              </select>
            </div>

            {/* Read Time */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Tempo Estimado de Leitura (Minutos)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Cover Image URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                URL da Imagem de Capa
              </label>
              <input
                type="url"
                required
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 text-xs"
              />
            </div>

            {/* AI Image Mention (Requested Requirement) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Menção da Imagem Gerada por IA *
              </label>
              <input
                type="text"
                value={aiImageMention}
                onChange={(e) => setAiImageMention(e.target.value)}
                placeholder="Imagem gerada por IA / CampoBR Studio"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-amber-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Excerpt / Summary */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Resumo Atraente (Lead Jornalístico) *
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                required
                placeholder="Breve parágrafo explicativo que atrai o torcedor leitor e prende a atenção..."
                className="w-full p-4 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400 resize-none"
              />
            </div>

            {/* Word-like Document Page Editor with Floating Menu and Internal Links Inserter */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Corpo da Matéria Completo • Editor Estilo Página do Word (Visão Ampla e Menu Flutuante) *
              </label>
              <WordDocumentEditor
                content={content}
                onChange={setContent}
                availablePosts={posts}
                currentPostId={editingPostId}
                articleTitle={title}
                articleCategory={category}
                placeholder="Escreva a matéria esportiva com visão ampla em folha de Word, adicione títulos, links internos em frases e tabelas..."
              />
            </div>

            {/* Author Avatar Logo Preview */}
            <div className="md:col-span-2 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3">
              <img 
                src="/logo-512x512.png" 
                alt="Logo do Blog" 
                className="w-12 h-12 rounded-xl object-contain bg-black border border-emerald-500/40 p-1.5 shrink-0 shadow" 
              />
              <div>
                <span className="text-xs font-bold text-white block">Avatar do Redator: Logo Oficial do Blog</span>
                <span className="text-[11px] text-slate-400">As matérias publicadas exibem a identidade visual oficial do CampoBR</span>
              </div>
            </div>

            {/* Author Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Nome do Autor
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Author Role */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Cargo / Especialidade
              </label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Tags */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                Tags (Separadas por vírgula)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Brasileirão, Seleção, Copa do Brasil, Tática..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Featured toggle */}
            <div className="md:col-span-2 flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <input
                type="checkbox"
                id="featuredToggle"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-700 cursor-pointer"
              />
              <label htmlFor="featuredToggle" className="text-xs sm:text-sm text-slate-200 font-semibold cursor-pointer">
                Exibir como <span className="text-emerald-400 font-bold">Destaque Principal</span> no topo da página inicial
              </label>
            </div>

            {/* Agendamento de Postagens (Horários de Pico do Futebol Brasileiro) */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Programação / Horário de Publicação
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">
                  {postStatus === 'published' ? '● Publicação Imediata' : '● Agendamento Ativo'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPostStatus('published');
                    setScheduledFor('');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    postStatus === 'published'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Publicar Imediatamente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPostStatus('scheduled');
                    const next = getNextOptimalHumanSchedule();
                    setScheduledFor(next.datetimeLocalValue);
                    setHumanScheduleInfo(next);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                    postStatus === 'scheduled'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  Agendar para Horário de Pico (Humano)
                </button>
              </div>

              {postStatus === 'scheduled' && (
                <div className="pt-2.5 border-t border-slate-800/80 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 text-[11px] font-semibold">Os 3 melhores padrões no Brasil (±10 min):</span>
                    <button
                      type="button"
                      onClick={() => {
                        const res = getHumanizedPeakSchedule('morning');
                        setScheduledFor(res.datetimeLocalValue);
                        setHumanScheduleInfo(res);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium transition-colors cursor-pointer border border-amber-500/20"
                      title="Horário base 07h00 com adiantamento/atraso humano de até 10 minutos"
                    >
                      🌅 Manhã (07h00 ±10m)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = getHumanizedPeakSchedule('lunch');
                        setScheduledFor(res.datetimeLocalValue);
                        setHumanScheduleInfo(res);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium transition-colors cursor-pointer border border-amber-500/20"
                      title="Horário base 12h30 com adiantamento/atraso humano de até 10 minutos"
                    >
                      🍽️ Almoço (12h30 ±10m)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = getHumanizedPeakSchedule('night');
                        setScheduledFor(res.datetimeLocalValue);
                        setHumanScheduleInfo(res);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium transition-colors cursor-pointer border border-amber-500/20"
                      title="Horário base 22h30 com adiantamento/atraso humano de até 10 minutos"
                    >
                      🌙 Pós-Jogo (22h30 ±10m)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = getNextOptimalHumanSchedule();
                        setScheduledFor(next.datetimeLocalValue);
                        setHumanScheduleInfo(next);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold cursor-pointer transition-colors"
                      title="Sorteia uma nova variação humana aleatória mantendo a margem de 10 minutos"
                    >
                      🎲 Sortear Nova Variação
                    </button>

                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => {
                        setScheduledFor(e.target.value);
                        setHumanScheduleInfo(null);
                      }}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Informação clara do padrão humano orgânico */}
                  {humanScheduleInfo ? (
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span>
                          Programado para <strong>{humanScheduleInfo.displayDate}</strong> (Base: {humanScheduleInfo.baseTime}, com variação de <strong>{humanScheduleInfo.offsetMinutes > 0 ? `+${humanScheduleInfo.offsetMinutes}` : humanScheduleInfo.offsetMinutes} min</strong> para parecer publicação humana natural).
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                        Padrão Anti-Robô Ativo
                      </span>
                    </div>
                  ) : scheduledFor ? (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Data/hora definida manualmente: {scheduledFor.replace('T', ' às ')}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
            >
              Limpar Campos
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : editingPostId ? 'Salvar Alterações' : 'Publicar Matéria'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* TAB 2.5: CENTRAL DE PAUTAS AUTOMÁTICAS DO GOOGLE        */}
      {/* ======================================================== */}
      {adminTab === 'trends' && (
        <div className="space-y-6">
          {/* Banner Piloto Automático nos 3 Horários */}
          <div className="card-football rounded-3xl p-6 sm:p-8 border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xl">
            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                Piloto Automático Esportivo CampoBR
              </span>
              <h3 className="font-display font-black text-xl text-white">
                Gerar Grade Automática nos 3 Melhores Horários do Brasil
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Cria <strong>3 matérias com conteúdos 100% diferentes e inéditos</strong>, agendando uma para a <strong>Manhã (07h00 ±10m)</strong>, outra para o <strong>Almoço (12h30 ±10m)</strong> e a terceira para o <strong>Pós-Jogo (22h30 ±10m)</strong> com variação humana anti-robô salva no banco de dados.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  const article = await googleContentAssistant.generateFullArticle();
                  await handleAutoCreateAndPublish(article);
                }}
                className="px-4 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                title="Gera 1 matéria inédita e publica imediatamente no blog"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>{isSaving ? 'Gerando...' : '⚡ Publicar 1 Matéria Agora'}</span>
              </button>

              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleGenerateTripleSchedule()}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-amber-950/60 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
                title="Gera 3 matérias inéditas salvas e agendadas para Manhã (07h00 ±10m), Almoço (12h30 ±10m) e Pós-Jogo (22h30 ±10m)"
              >
                <Calendar className="w-4 h-4" />
                <span>{isSaving ? 'Criando Grade...' : '📅 Gerar Grade (3 Horários Agendados)'}</span>
              </button>
            </div>
          </div>

          <GoogleAutomationHub
            availablePosts={posts}
            onApplyPostData={(data) => {
              setTitle(data.title);
              setCategory(data.category as FootballCategory);
              setSummary(data.summary);
              setContent(data.content);
              setCoverImage(data.coverImage);
              setAiImageMention(data.aiImageMention);
              setTagsInput(data.tags);
              setReadTimeMinutes(data.readTimeMinutes);
              setAdminTab('create');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAutoPublishDirectly={async (postData) => {
              await handleAutoCreateAndPublish({
                title: postData.title,
                summary: postData.summary,
                content: postData.content,
                category: postData.category as FootballCategory,
                coverImage: postData.coverImage,
                tags: postData.tags,
                suggestedReadingTime: postData.readTimeMinutes || 5,
                authorName: postData.authorName,
                authorRole: postData.authorRole,
              });
            }}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: ROBÔ & PILOTO AUTOMÁTICO 24/7                      */}
      {/* ======================================================== */}
      {adminTab === 'automation' && (
        <AutomationDashboard posts={posts} onRefreshPosts={onRefreshPosts} />
      )}

      {/* ======================================================== */}
      {/* TAB 3: ADSENSE MONETIZATION */}
      {/* ======================================================== */}
      {adminTab === 'ads' && (
        <div className="space-y-6">
        <form onSubmit={handleSaveAds} className="card-football rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold uppercase text-emerald-400">Monetização Comercial</span>
            <h2 className="font-display font-black text-xl text-white mt-1">
              Configurações do Google AdSense
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Insira o ID de publicador oficial do Google AdSense e os códigos de blocos para exibição na barra lateral direita do blog.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <input
                type="checkbox"
                id="adsEnabledToggle"
                checked={adEnabled}
                onChange={(e) => setAdEnabled(e.target.checked)}
                className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-950 border-slate-700 cursor-pointer"
              />
              <label htmlFor="adsEnabledToggle" className="text-xs sm:text-sm text-slate-200 font-semibold cursor-pointer">
                Habilitar exibição de anúncios do Google AdSense na barra lateral
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                ID do Publicador (Publisher ID)
              </label>
              <input
                type="text"
                value={adPubId}
                onChange={(e) => setAdPubId(e.target.value)}
                placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Slot Bloco Superior Direito
                </label>
                <input
                  type="text"
                  value={adSlotTop}
                  onChange={(e) => setAdSlotTop(e.target.value)}
                  placeholder="Ex: 1234567890"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                  Slot Bloco Inferior Direito
                </label>
                <input
                  type="text"
                  value={adSlotBottom}
                  onChange={(e) => setAdSlotBottom(e.target.value)}
                  placeholder="Ex: 0987654321"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configuração AdSense</span>
            </button>
          </div>
        </form>

        {/* Card Dedicado de Resolução do ads.txt da Hostinger */}
        <div className="card-football rounded-3xl p-6 sm:p-8 space-y-5 border-amber-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/30 shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Resolução de Alerta no AdSense
              </span>
              <h3 className="font-display font-black text-xl text-white">
                Como Resolver o Alerta "Status do ads.txt Não Encontrado"
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                O Google AdSense exige que o arquivo <code>ads.txt</code> esteja acessível publicamente em <code>https://campobr.blog/ads.txt</code> contendo o seu código de publicador exato.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const content = `google.com, pub-4032013040376402, DIRECT, f08c47fec0942fa0\n`;
                downloadFile('ads.txt', content, 'text/plain');
                setNotification({ text: 'Arquivo ads.txt baixado! Envie para a pasta public_html na Hostinger.', type: 'success' });
                setTimeout(() => setNotification(null), 4500);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-lg shadow-amber-950/60 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Baixar ads.txt Pronto</span>
            </button>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wide block">
              Linha Exata Oficial do Seu ads.txt (Conta pub-4032013040376402):
            </label>
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 font-mono text-xs sm:text-sm text-emerald-400 flex items-center justify-between gap-3 overflow-x-auto">
              <code>google.com, pub-4032013040376402, DIRECT, f08c47fec0942fa0</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('google.com, pub-4032013040376402, DIRECT, f08c47fec0942fa0');
                  setNotification({ text: 'Linha do ads.txt copiada para a área de transferência!', type: 'success' });
                  setTimeout(() => setNotification(null), 3000);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer shrink-0"
              >
                Copiar Linha
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs text-slate-300">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Passo a Passo na Hostinger:
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 leading-relaxed">
              <li>Acesse o painel da <strong>Hostinger (hPanel)</strong> &gt; <strong>Gerenciador de Arquivos</strong>.</li>
              <li>Abra a pasta raiz <strong>public_html</strong> do domínio <code>campobr.blog</code>.</li>
              <li>Envie o arquivo <strong>ads.txt</strong> baixado para dentro de <code>public_html</code> (ou crie um novo arquivo chamado <code>ads.txt</code> e cole a linha acima).</li>
              <li>Abra uma nova aba e teste o link direto: <a href="https://campobr.blog/ads.txt" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-mono">https://campobr.blog/ads.txt</a>. Deve exibir apenas a linha do AdSense.</li>
              <li>No painel do Google AdSense, em <strong>Sites &gt; campobr.blog</strong>, clique no botão <strong>"Verificar se há atualizações"</strong>. O Google confirmará o status como <strong>"Pronto / Autorizado"</strong>!</li>
            </ol>
          </div>
        </div>
      </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: FIREBASE FIRESTORE SYNC & STATUS */}
      {/* ======================================================== */}
      {adminTab === 'firebase' && (
        <div className="card-football rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-bold uppercase text-emerald-400">Banco de Dados em Nuvem</span>
            <h2 className="font-display font-black text-xl text-white mt-1">
              Google Firebase Firestore
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Status do banco de dados em tempo real para sincronização de postagens, likes e comentários.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Status da Camada de Dados:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isOnlineFirebase() 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {isOnlineFirebase() ? 'Firebase Firestore Online' : 'Pronto para Ativação Firestore'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              O CampoBR opera com sincronização de dados tolerante a falhas (Zero-Setup Instantâneo). Caso as chaves do Firebase Console não estejam no arquivo de ambiente, todas as 36 postagens e comentários ficam operacionais no armazenamento local criptografado e sincronizam automaticamente ao plugar o Firebase.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTestFirebase}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Testar Conexão Firebase</span>
              </button>
            </div>

            {firebaseStatusMessage && (
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-xs text-emerald-300 font-mono">
                {firebaseStatusMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: BAIXAR ARQUIVOS PRONTOS DO BLOG (ZIP DIRETO)     */}
      {/* ======================================================== */}
      {adminTab === 'export' && (
        <div className="card-football rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Download Direto dos Arquivos
            </span>
            <h2 className="font-display font-black text-xl text-white mt-1">
              Baixar Blog Pronto para Publicação (campobr.blog)
            </h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Você pode baixar os arquivos compilados prontos para enviar direto ao <strong>public_html</strong> da Hostinger, ou o código-fonte completo em formato ZIP.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Dist Pronto para Hostinger */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                    Recomendado para Hostinger
                  </span>
                  <h3 className="font-display font-bold text-base text-white mt-2">
                    Arquivos Prontos (Pasta dist compilada)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Contém o <code>index.html</code> (com SEO campobr.blog), <code>ads.txt</code> (Google AdSense), <code>robots.txt</code> e toda a pasta de scripts e estilos.
                  </p>
                </div>
                <div className="text-[11px] text-emerald-300/80 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20">
                  💡 <strong>Como usar na Hostinger:</strong> basta descompactar este arquivo e subir o conteúdo direto para a pasta <code>public_html</code> do seu domínio!
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={downloadDistZipReliable}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer text-center"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Build Atualizado (383 KB)</span>
                </button>
                <a
                  href="/download/campobr-dist-pronto.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Abrir em Nova Aba (sem restrições)</span>
                </a>
              </div>
            </div>

            {/* Card 2: Código-Fonte Completo */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center">
                  <FileArchive className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Para Desenvolvedores / Backup
                  </span>
                  <h3 className="font-display font-bold text-base text-white mt-2">
                    Código-Fonte Completo do Projeto
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Todo o projeto em React + TypeScript + Tailwind CSS, com componentes, tipos, serviços e configurações para continuar editando no VS Code ou no Git.
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  📦 Inclui todos os arquivos fonte (sem a pasta pesada node_modules).
                </div>
              </div>

              <div className="space-y-2">
                <a
                  href="/download/campobr-codigo-fonte.zip"
                  download="campobr-codigo-fonte.zip"
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                >
                  <FileArchive className="w-4 h-4" />
                  <span>Baixar Código-Fonte (1.3 MB)</span>
                </a>
                <a
                  href="/download/campobr-codigo-fonte.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Abrir em Nova Aba</span>
                </a>
              </div>
            </div>

            {/* Card 3: Backup JSON Completo das Postagens */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/40 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/50 flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500 text-slate-950">
                    Segurança & Proteção de Dados
                  </span>
                  <h3 className="font-display font-bold text-base text-white mt-2">
                    Backup JSON de Postagens & Configurações
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Gera um arquivo JSON estruturado com todas as {posts.length} matérias esportivas, autores, tags e blocos do AdSense para restauração segura.
                  </p>
                </div>
                <div className="text-[11px] text-blue-300/80 bg-blue-950/40 p-2.5 rounded-xl border border-blue-500/20">
                  🔒 Mantenha uma cópia de segurança mensal das suas publicações offline.
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportJsonBackup}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-900/40"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Backup JSON ({posts.length} Matérias)</span>
              </button>
            </div>

            {/* Card 4: Sitemap & Feed RSS para o Google */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/40 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                    Indexação Google Search & News
                  </span>
                  <h3 className="font-display font-bold text-base text-white mt-2">
                    Sitemap XML & Feed RSS Oficiais
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Arquivos prontos para enviar ao <strong>Google Search Console</strong> e ao <strong>Google Notícias Publisher</strong> para indexação ultra-rápida de matérias no Discover.
                  </p>
                </div>
                <div className="text-[11px] text-emerald-300/80 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/20">
                  ⚡ O Googlebot lê esses arquivos para encontrar novos artigos em minutos.
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSitemap}
                  className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Baixar sitemap.xml</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadRss}
                  className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Baixar rss.xml</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
