import React, { useState, useEffect } from 'react';
import { AdSenseConfig } from '../types';
import { Info, ExternalLink, Sparkles, ShieldCheck, Tag, ShoppingBag, Tv, Zap } from 'lucide-react';
import { 
  getSmartContextualShopeeProducts, 
  buildShopeeAffiliateUrl, 
  getShopeeAffiliateConfig 
} from '../services/shopeeAffiliateService';

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

interface RightSidebarAdsProps {
  adsConfig: AdSenseConfig;
  onOpenAdminAds?: () => void;
  isAdminLoggedIn?: boolean;
}

export const RightSidebarAds: React.FC<RightSidebarAdsProps> = ({
  adsConfig,
  onOpenAdminAds,
  isAdminLoggedIn = false,
}) => {
  const [adFeedback, setAdFeedback] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && adsConfig.adsenseEnabled) {
        window.adsbygoogle = window.adsbygoogle || [];
      }
    } catch {
      // Safe fallback se bloqueador de anúncios estiver ativo
    }
  }, [adsConfig.adsenseEnabled]);

  const handleAdClick = (adTitle: string) => {
    setAdFeedback(`Interação registrada: ${adTitle}`);
    setTimeout(() => setAdFeedback(null), 3000);
  };

  return (
    <aside className="w-full space-y-6">
      {/* Monetization / Google AdSense Header Badge */}
      <div className="flex items-center justify-between px-2 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Espaço Comercial</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
          <Info className="w-3 h-3" />
          <span>Google AdSense</span>
        </div>
      </div>

      {adFeedback && (
        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-300 animate-fade-in text-center">
          {adFeedback}
        </div>
      )}

      {/* AD SLOT 1: 300x250 Medium Rectangle */}
      <div className="card-football rounded-2xl p-3 text-center overflow-hidden relative group">
        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2 px-1">
          <span>PUBLICIDADE</span>
          <span className="text-[9px] text-slate-600 font-mono">ID: {adsConfig.slotRightTop}</span>
        </div>

        {/* AdSense Standard 300x250 Container */}
        <div className="w-full min-h-[250px] rounded-xl bg-gradient-to-b from-[#0b131e] to-[#0d1726] border border-slate-700/60 p-4 flex flex-col justify-between items-center relative overflow-hidden">
          {/* Subtle glow effect */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl"></div>

          {/* Ad choices icon */}
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">
            <span>AdChoices</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </div>

          <div className="text-left w-full mt-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase">
              <Tag className="w-3 h-3" /> Patrocinado
            </span>
            <h3 className="font-display font-black text-base text-white mt-2 leading-tight">
              Manto Oficial 2026: Vista a Camisa do Seu Time com 40% OFF
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed line-clamp-3">
              Entrega rápida para todo o Brasil. Modelos oficiais das Séries A e B com personalização gratuita de nome e número.
            </p>
          </div>

          <div className="w-full mt-4">
            <button
              onClick={() => handleAdClick('Manto Oficial 2026')}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Comprar com Desconto
            </button>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-[9px] text-slate-500">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Site Seguro Verificado • Google Certified</span>
            </div>
          </div>

          {/* AdSense Unit <ins> tag */}
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={adsConfig.publisherId}
            data-ad-slot={adsConfig.slotRightTop}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>

      {/* AD SLOT 2: 300x600 Half Page / Large Skyscraper */}
      <div className="card-football rounded-2xl p-3 text-center overflow-hidden relative group">
        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2 px-1">
          <span>ANÚNCIO GOOGLE ADSENSE</span>
          <span className="text-[9px] text-slate-600 font-mono">SLOT: {adsConfig.slotRightBottom}</span>
        </div>

        {/* 300x600 Format Container */}
        <div className="w-full min-h-[460px] rounded-xl bg-gradient-to-b from-[#09111c] via-[#0e1a2b] to-[#070d17] border border-slate-700/60 p-4 flex flex-col justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500"></div>

          <div className="w-full text-left pt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
              <span className="bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded font-bold uppercase">
                Streaming HD
              </span>
              <span className="text-[9px]">4K HDR</span>
            </div>

            <div className="w-full h-36 rounded-xl bg-slate-800/80 mb-3 overflow-hidden relative border border-slate-700/80">
              <img
                src="https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=600&q=80"
                alt="Futebol ao Vivo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-xs font-black text-white">
                <Tv className="w-3.5 h-3.5 text-emerald-400" />
                <span>Todos os Jogos ao Vivo</span>
              </div>
            </div>

            <h3 className="font-display font-black text-lg text-white leading-tight">
              Assista ao Brasileirão e Libertadores Sem Travamentos!
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Experimente 7 dias grátis. Acesso instantâneo na Smart TV, celular e computador. Escolha a câmera tática e narração exclusiva.
            </p>

            <ul className="mt-3 space-y-1 text-[11px] text-slate-300">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> 100% dos jogos da Série A & B
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Melhores momentos em tempo real
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span> Sem fidelidade, cancele quando quiser
              </li>
            </ul>
          </div>

          <div className="w-full mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => handleAdClick('Streaming Futebol')}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-xl shadow-cyan-950/50 transition-all cursor-pointer"
            >
              Testar 7 Dias Grátis
            </button>
            <span className="block text-center text-[10px] text-slate-500 mt-2">
              Oferta válida por tempo limitado
            </span>
          </div>

          {/* AdSense Unit <ins> tag */}
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={adsConfig.publisherId}
            data-ad-slot={adsConfig.slotRightBottom}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>

      {/* AD SLOT 3: Cartola / Fantasy Gaming Sports Native */}
      <div className="card-football rounded-2xl p-3 relative">
        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2 px-1">
          <span>PUBLICIDADE ESPORTIVA</span>
          <span className="text-emerald-400 font-mono text-[9px]">Dica VIP</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎩</span>
            <div>
              <h4 className="font-bold text-xs text-white">Cartola & Fantasy Brasil</h4>
              <p className="text-[10px] text-slate-400">Escalações automáticas com IA</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug mb-3">
            Mito na sua liga clássica com dados estatísticos e desfalques de última hora.
          </p>
          <button
            onClick={() => handleAdClick('Cartola IA')}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 font-bold text-xs transition-colors border border-emerald-500/30 cursor-pointer"
          >
            Ver Dicas da Rodada
          </button>
        </div>
      </div>

      {/* SHOPEE AFILIADOS: Vitrine Oficial do Torcedor */}
      {(() => {
        const shopeeConfig = getShopeeAffiliateConfig();
        if (!shopeeConfig.enabled) return null;
        const products = getSmartContextualShopeeProducts({ category: 'Clubes Serie A', limit: 1 });
        const featured = products[0];
        if (!featured) return null;
        const affiliateUrl = buildShopeeAffiliateUrl(featured, shopeeConfig.affiliateId);

        return (
          <div className="card-football rounded-2xl p-3 relative bg-gradient-to-br from-slate-950 via-[#140f13] to-[#260f0a] border border-[#ee4d2d]/35">
            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-2 px-1">
              <span className="flex items-center gap-1 font-bold text-[#ff6433] uppercase tracking-wider">
                <ShoppingBag className="w-3 h-3 text-[#ee4d2d]" /> Vitrine Shopee
              </span>
              {featured.isUserRealProduct ? (
                <span className="text-emerald-400 font-bold text-[9px] flex items-center gap-0.5">
                  ★ Link Verificado
                </span>
              ) : (
                <span className="text-slate-500 text-[9px]">Afiliado Oficial</span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-left space-y-2">
              <div className="flex items-start gap-2.5">
                <div className="w-12 h-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                  <img src={featured.imageUrl} alt={featured.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-white line-clamp-1 leading-tight">{featured.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-display font-black text-xs text-[#ff6433]">{featured.priceDisplay}</span>
                    <span className="text-[9px] text-emerald-400 font-bold">Frete Grátis</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                {featured.description}
              </p>
              <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="w-full py-2 rounded-lg bg-gradient-to-r from-[#ee4d2d] to-[#ff5722] hover:from-[#d73f1f] hover:to-[#ee4d2d] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#ee4d2d]/25 cursor-pointer"
              >
                <span>Comprar na Shopee</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[9px] text-slate-500 block text-center leading-tight">
                {shopeeConfig.disclosure.slice(0, 85)}...
              </span>
            </div>
          </div>
        );
      })()}

      {/* AdSense Publisher Configuration Link for Admin (only visible when logged in as admin) */}
      {isAdminLoggedIn && (
        <div className="p-3 rounded-xl bg-[#090f18] border border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-slate-300">Status do AdSense</span>
            <span className="text-emerald-400 font-bold">Ativo</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Publisher ID: <code className="text-slate-400 font-mono">{adsConfig.publisherId}</code>
          </p>
          {onOpenAdminAds && (
            <button
              onClick={onOpenAdminAds}
              className="mt-2 text-[10px] text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              Configurar IDs do Google AdSense →
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
