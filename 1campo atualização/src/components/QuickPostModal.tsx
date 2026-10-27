import React, { useState, useEffect } from 'react';
import { Post, FootballCategory } from '../types';
import { 
  X, 
  Save, 
  Sparkles, 
  Link, 
  ExternalLink, 
  Image, 
  Clock, 
  Tag, 
  FileText, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { createNewPost, updateExistingPost } from '../services/firebase';
import { GoogleEditorAssistant } from './GoogleEditorAssistant';
import { WordDocumentEditor } from './WordDocumentEditor';
import { 
  getHumanizedPeakSchedule, 
  getNextOptimalHumanSchedule, 
  HumanizedScheduleResult 
} from '../utils/humanSchedule';

interface QuickPostModalProps {
  isOpen: boolean;
  editingPost: Post | null;
  onClose: () => void;
  onPostSaved: () => void;
  availablePosts: Post[];
}

export const QuickPostModal: React.FC<QuickPostModalProps> = ({
  isOpen,
  editingPost,
  onClose,
  onPostSaved,
  availablePosts,
}) => {
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setCategory(editingPost.category);
      setSummary(editingPost.summary);
      setContent(editingPost.content);
      setCoverImage(editingPost.coverImage);
      setAiImageMention(editingPost.aiImageMention || 'Imagem gerada por IA / CampoBR Studio');
      setAuthorName(editingPost.authorName);
      setAuthorRole(editingPost.authorRole);
      setReadTimeMinutes(editingPost.readTimeMinutes || 5);
      setFeatured(editingPost.featured || false);
      setTagsInput(editingPost.tags ? editingPost.tags.join(', ') : '');
      setPostStatus(editingPost.status === 'scheduled' ? 'scheduled' : 'published');
      setScheduledFor(editingPost.scheduledFor || '');
      setHumanScheduleInfo(null);
    } else {
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
    }
    setErrorMsg(null);
  }, [editingPost, isOpen]);

  if (!isOpen) return null;

  const insertTextAtCursor = (snippet: string) => {
    setContent((prev) => prev + '\n' + snippet);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Preencha título e conteúdo da matéria.');
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

      if (editingPost) {
        await updateExistingPost(editingPost.id, {
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
      }

      onPostSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Erro ao salvar publicação.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-[#090f18] border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                {editingPost ? 'Modo de Edição Rápida' : 'Nova Matéria Esportiva'}
              </span>
              <h2 className="font-display font-black text-lg sm:text-xl text-white">
                {editingPost ? `Editando: ${editingPost.title}` : 'Adicionar Nova Postagem'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSave} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Plugin Google AI de Redação Esportiva */}
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
            onApplyCategory={setCategory}
            onApplyCoverImage={setCoverImage}
            onApplyAll={(data) => {
              setTitle(data.title);
              setSummary(data.summary);
              setContent(data.content);
              setTagsInput(data.tags);
            }}
          />

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Título da Postagem *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Análise Tática da Rodada do Brasileirão..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-white text-sm font-semibold outline-none"
            />
          </div>

          {/* Category & Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Categoria Oficial *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FootballCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-white text-sm outline-none cursor-pointer"
              >
                <option value="Seleção Brasileira">Seleção Brasileira</option>
                <option value="Clubes Serie A">Clubes Serie A</option>
                <option value="Clubes Serie B">Clubes Serie B</option>
                <option value="Jogadores">Jogadores</option>
                <option value="Equipe Técnica">Equipe Técnica</option>
                <option value="Eventos">Eventos</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-200">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-slate-900"
                />
                <span>Marcar como Matéria Destaque Principal</span>
              </label>
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Subtítulo / Resumo Atraente (Lead) *
            </label>
            <textarea
              rows={2}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Breve parágrafo jornalístico de introdução que prende a atenção do leitor..."
              className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-slate-200 text-sm outline-none"
            />
          </div>

          {/* Word-like Document Page Editor with Floating Menu and Internal Links Inserter */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">
              Corpo da Matéria Completo • Editor Estilo Word (Visão Ampla & Menu Flutuante) *
            </label>
            <WordDocumentEditor
              content={content}
              onChange={setContent}
              availablePosts={availablePosts}
              currentPostId={editingPost?.id}
              articleTitle={title}
              articleCategory={category}
              placeholder="Escreva a análise esportiva completa em parágrafos estruturados, subtítulos, tabelas e links em frases..."
            />
          </div>

          {/* Cover image & AI Mention */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Image className="w-3.5 h-3.5 text-emerald-400" />
                URL da Imagem de Capa
              </label>
              <input
                type="url"
                required
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-white text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Menção da Imagem Gerada por IA
              </label>
              <input
                type="text"
                value={aiImageMention}
                onChange={(e) => setAiImageMention(e.target.value)}
                placeholder="Imagem gerada por IA / CampoBR Studio"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-amber-300 text-xs outline-none"
              />
            </div>
          </div>

          {/* Author & Read Time */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center gap-3">
            <img 
              src="/logo-512x512.png" 
              alt="Logo do Blog" 
              className="w-10 h-10 rounded-xl object-contain bg-black border border-emerald-500/40 p-1 shrink-0" 
            />
            <div>
              <span className="text-xs font-bold text-white block">Avatar do Redator: Logo Oficial do Blog</span>
              <span className="text-[11px] text-slate-400">As publicações utilizam a identidade visual oficial do CampoBR</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nome do Autor
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Cargo / Especialidade
              </label>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tempo Leitura (min)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-400" />
              Tags da Matéria (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Seleção, Copa, Tática, Brasileirão"
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs outline-none"
            />
          </div>

          {/* Programação de Horário de Publicação (Anti-Robô Humano ±10m) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Agendamento Anti-Robô (Horários Nobres BR ±10m)
              </span>
              <span className="text-[11px] text-amber-400 font-bold">
                {postStatus === 'published' ? '● Imediato' : '● Agendado'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setPostStatus('published');
                  setScheduledFor('');
                  setHumanScheduleInfo(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  postStatus === 'published'
                    ? 'bg-emerald-500 text-slate-950 font-black'
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                  postStatus === 'scheduled'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                Agendar com Horário Humano
              </button>
            </div>

            {postStatus === 'scheduled' && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px]">Padrões:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const res = getHumanizedPeakSchedule('morning');
                      setScheduledFor(res.datetimeLocalValue);
                      setHumanScheduleInfo(res);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium cursor-pointer"
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
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium cursor-pointer"
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
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium cursor-pointer"
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
                    className="px-2 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold cursor-pointer"
                  >
                    🎲 Variação
                  </button>
                </div>

                {humanScheduleInfo && (
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] flex items-center justify-between">
                    <span>
                      📅 <strong>{humanScheduleInfo.displayDate}</strong> ({humanScheduleInfo.offsetMinutes > 0 ? `+${humanScheduleInfo.offsetMinutes}` : humanScheduleInfo.offsetMinutes} min de margem natural)
                    </span>
                    <span className="text-[9px] font-black uppercase text-amber-400 bg-slate-950 px-1.5 py-0.5 rounded border border-amber-500/30">
                      Anti-Robô
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : editingPost ? 'Salvar Alterações' : 'Publicar Matéria'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
