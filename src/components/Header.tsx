import React, { useState } from 'react';
import { PageTab, AdminSession } from '../types';
import { 
  Flame, 
  Newspaper, 
  BookOpen, 
  Menu, 
  X, 
  Database,
  Lock,
  Unlock,
  ShieldCheck,
  Plus,
  LogOut,
  Download
} from 'lucide-react';

interface HeaderProps {
  currentTab: PageTab;
  onSelectTab: (tab: PageTab) => void;
  isFirebaseConnected: boolean;
  onOpenFirebaseModal: () => void;
  isAdminLoggedIn?: boolean;
  adminSession?: AdminSession | null;
  onOpenAdmin2FA?: () => void;
  onOpenNewPost?: () => void;
  onAdminLogout?: () => void;
  onOpenDownload?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isFirebaseConnected,
  onOpenFirebaseModal,
  isAdminLoggedIn = false,
  adminSession,
  onOpenAdmin2FA,
  onOpenNewPost,
  onAdminLogout,
  onOpenDownload,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'inicio', label: 'Início', icon: <Flame className="w-4 h-4 text-emerald-400" /> },
    { id: 'postagens', label: 'Postagens', icon: <BookOpen className="w-4 h-4 text-emerald-400" /> },
    { id: 'noticias', label: 'Notícias', icon: <Newspaper className="w-4 h-4 text-emerald-400" />, badge: 'AO VIVO' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-emerald-500/20 bg-[#080c12]/90 backdrop-blur-md shadow-2xl">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => onSelectTab('inicio')}
          className="flex items-center gap-3.5 cursor-pointer group select-none"
        >
          {/* Stylized Brazilian Soccer Crest Logo */}
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 blur-sm opacity-60 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative w-12 h-12 rounded-xl bg-[#091018] border border-emerald-400/50 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Shield & Soccer Ball Graphic */}
              <svg viewBox="0 0 100 100" className="w-9 h-9" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Crest Background */}
                <path d="M50 5 L85 18 V55 C85 75 50 95 50 95 C50 95 15 75 15 55 V18 Z" fill="#042f2e" stroke="#10b981" strokeWidth="3" />
                {/* Field Markings */}
                <path d="M22 40 Q50 55 78 40" stroke="#059669" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M22 60 Q50 75 78 60" stroke="#059669" strokeWidth="2" />
                {/* Brazilian flag swirl ribbon */}
                <path d="M20 70 Q50 25 80 45" stroke="#eab308" strokeWidth="3.5" strokeLinecap="round" />
                {/* Center Soccer Ball */}
                <circle cx="50" cy="48" r="16" fill="#f8fafc" stroke="#047857" strokeWidth="2.5" />
                <polygon points="50,40 56,44 54,51 46,51 44,44" fill="#0f172a" />
                <line x1="50" y1="40" x2="50" y2="33" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="56" y1="44" x2="63" y2="40" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="54" y1="51" x2="60" y2="58" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="46" y1="51" x2="40" y2="58" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="44" y1="44" x2="37" y2="40" stroke="#0f172a" strokeWidth="1.5" />
                {/* Golden Top Star */}
                <polygon points="50,11 52,16 57,16 53,19 55,24 50,21 45,24 47,19 43,16 48,16" fill="#facc15" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Campo<span className="text-emerald-400">BR</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Futebol
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">
              O Seu Portal do Futebol Brasileiro
            </span>
          </div>
        </div>

        {/* Desktop Navigation Menu: Início - Postagens - Notícia - Admin */}
        <div className="hidden md:flex items-center gap-3">
          <nav className="flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-950/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-[13px] left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_#10b981]"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Discreet Admin Lock Button / Action Toolbar */}
          {isAdminLoggedIn ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
              <button
                onClick={() => onSelectTab('admin')}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-emerald-400 border-emerald-500/30'
                }`}
                title="Painel Administrativo"
                aria-label="Painel Administrativo"
              >
                <Unlock className="w-4 h-4 text-emerald-400" />
              </button>
              <button
                onClick={onOpenNewPost}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                title="Adicionar Nova Matéria"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden lg:inline">+ Matéria</span>
              </button>
              <button
                onClick={onAdminLogout}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-700/80 transition-colors cursor-pointer"
                title="Encerrar Sessão Segura"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdmin2FA}
              className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition-all cursor-pointer ml-1"
              title="Acesso Seguro"
              aria-label="Acesso Seguro"
            >
              <Lock className="w-4 h-4 opacity-60 hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Botão Oficial de Baixar Projeto ZIP - Sempre visível e destacado */}
          {onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-emerald-500/25 to-teal-500/20 hover:from-amber-500/35 hover:to-emerald-500/35 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-bold shadow-lg shadow-emerald-950/60"
              title="Baixar Projeto Completo (Código-Fonte e Build ZIP)"
              aria-label="Baixar Projeto Completo"
            >
              <Download className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Baixar Projeto</span>
              <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                ZIP
              </span>
            </button>
          )}
        </div>

        {/* Mobile quick download & menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          {onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Baixar Projeto Completo (ZIP)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Baixar ZIP</span>
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/20 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 border-t border-emerald-500/20 bg-[#090e15] space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between transition-colors ${
                currentTab === item.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="pt-2 border-t border-slate-800 space-y-2">
            {isAdminLoggedIn ? (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <button
                  onClick={() => {
                    onSelectTab('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-left cursor-pointer"
                >
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-white font-bold">Painel Admin</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onOpenNewPost && onOpenNewPost();
                      setMobileMenuOpen(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black cursor-pointer"
                  >
                    + Matéria
                  </button>
                  <button
                    onClick={() => {
                      onAdminLogout && onAdminLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-rose-300 cursor-pointer"
                    title="Sair"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAdmin2FA && onOpenAdmin2FA();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title="Acesso Seguro"
              >
                <Lock className="w-3.5 h-3.5 opacity-60" />
                <span className="text-[11px]">Acesso Seguro</span>
              </button>
            )}

            {onOpenDownload && (
              <button
                onClick={() => {
                  onOpenDownload();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs font-bold text-emerald-300 hover:text-white"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" /> Baixar Projeto (ZIP)
                </span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black">
                  ZIP
                </span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenFirebaseModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold text-emerald-300"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" /> Conexão Firebase
              </span>
              <span className="text-emerald-400 font-bold">
                {isFirebaseConnected ? 'Ativo' : 'Pronto p/ Ativar'}
              </span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
