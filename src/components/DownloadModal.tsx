import React, { useState } from 'react';
import { 
  Download, 
  CheckCircle2, 
  ExternalLink, 
  FileArchive, 
  FolderCheck, 
  X, 
  Sparkles, 
  Info,
  Layers,
  Copy,
  Check,
  Code2,
  Package
} from 'lucide-react';
import { downloadDistZipReliable, downloadSourceZipReliable } from '../services/zipDownloader';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'source' | 'dist'>('source');
  const [downloadSuccessSource, setDownloadSuccessSource] = useState(false);
  const [downloadSuccessDist, setDownloadSuccessDist] = useState(false);
  const [copiedLink, setCopiedLink] = useState<'source' | 'dist' | null>(null);

  if (!isOpen) return null;

  const handleDownloadSource = async () => {
    const ok = await downloadSourceZipReliable();
    if (ok) {
      setDownloadSuccessSource(true);
      setTimeout(() => setDownloadSuccessSource(false), 4000);
    }
  };

  const handleDownloadDist = async () => {
    const ok = await downloadDistZipReliable();
    if (ok) {
      setDownloadSuccessDist(true);
      setTimeout(() => setDownloadSuccessDist(false), 4000);
    }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const sourceUrl = `${origin}/download/campobr-codigo-fonte.zip`;
  const distUrl = `${origin}/download/campobr-dist-pronto.zip`;

  const handleCopyLink = (type: 'source' | 'dist') => {
    const url = type === 'source' ? sourceUrl : distUrl;
    navigator.clipboard.writeText(url);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#090f18] border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl my-8">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <FileArchive className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  CampoBR Oficial
                </span>
                <span className="text-slate-400 text-xs font-semibold">• Pacotes Atualizados</span>
              </div>
              <h2 className="font-display font-black text-xl text-white mt-0.5">
                Baixar Projeto Completo
              </h2>
            </div>
          </div>

          {/* Abas de Seleção */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-800/80">
            <button
              onClick={() => setActiveTab('source')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'source'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Código-Fonte Completo (Todos os Arquivos)</span>
            </button>
            <button
              onClick={() => setActiveTab('dist')}
              className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'dist'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Build Pronto (dist)</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {activeTab === 'source' ? (
            <>
              {/* Status de Verificação de Integridade */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <div>
                  <strong className="text-white block font-bold">Projeto 100% Completo (2.4 MB)</strong>
                  <span>Contém todos os arquivos de código-fonte, componentes React, scripts, banco de dados, estilos e configurações.</span>
                </div>
              </div>

              {/* Botões de Ação para o Código Fonte */}
              <div className="space-y-3">
                <button
                  onClick={handleDownloadSource}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadSuccessSource ? 'Download Iniciado!' : 'Baixar Código-Fonte Completo (ZIP)'}
                  </span>
                </button>

                <a
                  href="/download/campobr-codigo-fonte.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  download="campobr-codigo-fonte.zip"
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Abrir Link Direto em Nova Aba (ZIP)</span>
                </a>
              </div>

              {/* Copiar Link Direto do Código Fonte */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 truncate max-w-[340px] font-mono text-[11px]">
                  {sourceUrl}
                </span>
                <button
                  onClick={() => handleCopyLink('source')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedLink === 'source' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Arquivos inclusos no pacote de código fonte */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Principais pastas e arquivos do repositório inclusos</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>src/ (Componentes & Hooks)</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>src/services/ (Automação & IA)</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>src/data/ (mockPosts.ts & Base)</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>scripts/ (Robôs & Utilitários)</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>public/ (Imagens, icons & PWA)</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>package.json & vite.config.ts</span>
                  </div>
                </div>
              </div>

              {/* Dica para rodar localmente */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Como rodar no seu computador:</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px] font-mono">
                  1. Descompacte o ZIP<br/>
                  2. Execute <span className="text-cyan-300">npm install</span><br/>
                  3. Execute <span className="text-cyan-300">npm run dev</span> para abrir no navegador!
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Build Pronto */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <div>
                  <strong className="text-white block font-bold">Arquivo ZIP Compilado (555 KB)</strong>
                  <span>Contém todos os arquivos minificados prontos para publicação direta em qualquer hospedagem web.</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownloadDist}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadSuccessDist ? 'Download Iniciado!' : 'Baixar Pacote Pronto (dist.zip)'}
                  </span>
                </button>

                <a
                  href="/download/campobr-dist-pronto.zip"
                  target="_blank"
                  rel="noopener noreferrer"
                  download="campobr-dist-pronto.zip"
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Abrir Link Direto em Nova Aba (ZIP)</span>
                </a>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 truncate max-w-[340px] font-mono text-[11px]">
                  {distUrl}
                </span>
                <button
                  onClick={() => handleCopyLink('dist')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-[11px] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedLink === 'dist' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-300">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span>Instrução rápida de publicação:</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Basta descompactar o arquivo e enviar todo o conteúdo interno diretamente para a pasta <strong className="text-white">public_html</strong> da sua Hostinger / cPanel ou fazer upload no Netlify / Vercel.
                </p>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
