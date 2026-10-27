import React, { useState, useEffect } from 'react';
import { FootballCategory } from '../types';
import { LegalDocType } from './LegalModal';
import { 
  ShieldCheck, 
  ExternalLink, 
  Heart, 
  Database,
  ArrowUp,
  Instagram,
  Music2
} from 'lucide-react';
import { GoogleRenderingOptimizer } from './GoogleRenderingOptimizer';

interface FooterProps {
  onOpenLegal: (type: LegalDocType) => void;
  onSelectCategory: (cat: FootballCategory) => void;
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenLegal,
  onSelectCategory,
  onOpenAdmin,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categories: FootballCategory[] = [
    'Seleção Brasileira',
    'Clubes Serie A',
    'Clubes Serie B',
    'Jogadores',
    'Equipe Técnica',
    'Eventos'
  ];

  return (
    <footer className="w-full bg-[#05080c] border-t border-emerald-500/20 text-slate-400 mt-16 relative overflow-hidden">
      {/* Top glowing line */}
      <div className="w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 opacity-60"></div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Column 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#091018] border border-emerald-400/50 flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5 L85 18 V55 C85 75 50 95 50 95 C50 95 15 75 15 55 V18 Z" fill="#042f2e" stroke="#10b981" strokeWidth="3" />
                  <circle cx="50" cy="48" r="16" fill="#f8fafc" stroke="#047857" strokeWidth="2.5" />
                  <polygon points="50,40 56,44 54,51 46,51 44,44" fill="#0f172a" />
                  <polygon points="50,11 52,16 57,16 53,19 55,24 50,21 45,24 47,19 43,16 48,16" fill="#facc15" />
                </svg>
              </div>
              <span className="font-display font-black text-2xl text-white tracking-tight">
                Campo<span className="text-emerald-400">BR</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm">
              O Seu Portal do Futebol Brasileiro. Notícias em tempo real, análises táticas aprofundadas, bastidores da Seleção Brasileira e cobertura completa das Séries A e B.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/campobroficial"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-emerald-950 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-center text-slate-300 hover:text-emerald-400 transition-all hover:scale-105 shadow-md cursor-pointer group"
                aria-label="Instagram do CampoBR (@campobroficial)"
                title="Siga o CampoBR no Instagram: @campobroficial"
              >
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://www.tiktok.com/@campobrofical"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-emerald-950 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-center text-slate-300 hover:text-emerald-400 transition-all hover:scale-105 shadow-md cursor-pointer group"
                aria-label="TikTok do CampoBR (@campobrofical)"
                title="Siga o CampoBR no TikTok: @campobrofical"
              >
                <Music2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Column 3: Categorias */}
          <div className="space-y-3">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
              Editorias & Categorias
            </h3>
            <ul className="space-y-2 text-xs">
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onSelectCategory(cat)}
                    className="text-slate-400 hover:text-emerald-300 transition-colors text-left cursor-pointer"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Institucional & Avisos Legais */}
          <div className="space-y-3">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
              Institucional & Legal
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenLegal('sobre')}
                  className="text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer text-left"
                >
                  Sobre o CampoBR (Quem Somos)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('editorial')}
                  className="text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer text-left"
                >
                  Política Editorial & Fact-Checking
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('privacidade')}
                  className="text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer text-left flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Política de Privacidade (LGPD & Ads)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('termos')}
                  className="text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer text-left"
                >
                  Termos de Uso
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('contato')}
                  className="text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer text-left text-emerald-400 font-semibold"
                >
                  Fale com a Redação (Contato)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('avisos')}
                  className="text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer text-left"
                >
                  Avisos Legais & Isenção
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenLegal('firebase')}
                  className="text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer text-left flex items-center gap-1"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  Conexão Firebase Online
                </button>
              </li>
              {onOpenAdmin && (
                <li>
                  <button
                    onClick={onOpenAdmin}
                    className="text-slate-500 hover:text-emerald-400 text-[11px] transition-colors cursor-pointer text-left flex items-center gap-1.5"
                    title="Acesso Restrito"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                    Área Restrita
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Column 5: Monetização & Google AdSense Compliance */}
          <div className="space-y-3">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
              Publicidade & Ads
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monetização realizada via <strong>Google AdSense</strong> em conformidade com as diretrizes de transparência publicitária e experiência do usuário.
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
                Google Certified Partner
              </span>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="mt-12 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
          <p>
            <strong className="text-slate-300">Aviso Legal:</strong> O CampoBR é uma publicação de imprensa independente sobre o futebol brasileiro e internacional. Todas as marcas, nomes de clubes, escudos oficiais e imagens pertencem aos seus respectivos proprietários e são utilizados no estrito direito à informação e cobertura jornalística. O conteúdo publicitário de casas de apostas ou patrocinadores é destinado exclusivamente para maiores de 18 anos.
          </p>
        </div>

        {/* Bottom Bar with Copyright */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="text-center sm:text-left">
            <p className="font-medium text-slate-300">
              © 2026 <strong>CampoBR</strong>. Todos os direitos reservados.
            </p>
            <p className="text-[11px] text-slate-400">
              O Seu Portal do Futebol Brasileiro. Feito com paixão pelo esporte mais amado do Brasil.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <GoogleRenderingOptimizer />

            <button
              onClick={scrollToTop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>Voltar ao Topo</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
