import React from 'react';
import { AdSenseConfig } from '../types';
import { ExternalLink, ShoppingBag } from 'lucide-react';
import {
  getSmartContextualShopeeProducts,
  buildShopeeAffiliateUrl,
  getShopeeAffiliateConfig,
} from '../services/shopeeAffiliateService';
import { AdUnit } from './AdUnit';

interface RightSidebarAdsProps {
  adsConfig: AdSenseConfig;
  onOpenAdminAds?: () => void;
  isAdminLoggedIn?: boolean;
}

/**
 * Coluna de monetização: somente anúncios AdSense reais e, opcionalmente, um produto de
 * afiliado REAL cadastrado pelo admin. (Os "anúncios" simulados foram removidos: eram
 * criativos falsos sobrepostos aos blocos reais, o que viola as políticas do AdSense.)
 */
export const RightSidebarAds: React.FC<RightSidebarAdsProps> = ({
  adsConfig,
  onOpenAdminAds,
  isAdminLoggedIn = false,
}) => {
  const adsOn = adsConfig.adsenseEnabled !== false;
  const shopeeConfig = getShopeeAffiliateConfig();
  const featured = shopeeConfig.enabled
    ? getSmartContextualShopeeProducts({ category: 'Clubes Serie A', limit: 1 })[0]
    : undefined;
  // Só exibe produto cadastrado de verdade pelo administrador (nunca exemplo/placeholder)
  const realProduct = featured && featured.isUserRealProduct ? featured : undefined;

  return (
    <aside className="w-full space-y-6">
      {adsOn && (
        <AdUnit publisherId={adsConfig.publisherId} slot={adsConfig.slotRightTop} minHeight={250} />
      )}

      {realProduct && (
        <div className="card-football rounded-2xl p-3">
          <div className="mb-2 flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-[#ff6433]">
              <ShoppingBag className="h-3 w-3" /> Indicação Shopee
            </span>
            <span className="text-slate-500">Link de afiliado</span>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-left">
            <div className="flex items-start gap-2.5">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
                <img
                  src={realProduct.imageUrl}
                  alt={realProduct.title}
                  loading="lazy"
                  decoding="async"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="line-clamp-2 text-xs font-bold leading-tight text-white">{realProduct.title}</h4>
                {realProduct.priceDisplay && (
                  <span className="mt-0.5 block font-display text-xs font-black text-[#ff6433]">
                    {realProduct.priceDisplay}
                  </span>
                )}
              </div>
            </div>
            <a
              href={buildShopeeAffiliateUrl(realProduct, shopeeConfig.affiliateId)}
              target="_blank"
              rel="noopener noreferrer sponsored nofollow"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#ee4d2d] py-2 text-xs font-black uppercase text-white hover:bg-[#d73f1f]"
            >
              <span>Ver na Shopee</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <span className="block text-center text-[9px] leading-tight text-slate-500">
              {shopeeConfig.disclosure}
            </span>
          </div>
        </div>
      )}

      {adsOn && (
        <AdUnit publisherId={adsConfig.publisherId} slot={adsConfig.slotRightBottom} minHeight={250} />
      )}

      {isAdminLoggedIn && (
        <div className="rounded-xl border border-slate-800/80 bg-[#090f18] p-3 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">AdSense</span>
          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
            Publisher: <code className="font-mono text-slate-400">{adsConfig.publisherId}</code>
            <br />
            Blocos manuais só aparecem com IDs válidos em <code>VITE_ADSENSE_SLOT_*</code>.
          </p>
          {onOpenAdminAds && (
            <button
              onClick={onOpenAdminAds}
              className="mt-2 cursor-pointer text-[10px] font-bold text-emerald-400 hover:underline"
            >
              Abrir configurações →
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
