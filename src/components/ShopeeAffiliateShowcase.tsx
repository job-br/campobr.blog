import React from 'react';
import { ShoppingBag, Star, ExternalLink, ShieldCheck, Tag, Truck, Zap, CheckCircle2 } from 'lucide-react';
import { FootballCategory } from '../types';
import { 
  getSmartContextualShopeeProducts, 
  buildShopeeAffiliateUrl, 
  getShopeeAffiliateConfig,
  type ShopeeProduct 
} from '../services/shopeeAffiliateService';

interface ShopeeAffiliateShowcaseProps {
  category: FootballCategory;
  compact?: boolean;
  postTitle?: string;
  postContent?: string;
  postSummary?: string;
}

export const ShopeeAffiliateShowcase: React.FC<ShopeeAffiliateShowcaseProps> = ({ 
  category, 
  compact = false,
  postTitle,
  postContent,
  postSummary,
}) => {
  const config = getShopeeAffiliateConfig();

  if (!config.enabled) {
    return null;
  }

  const products = getSmartContextualShopeeProducts({
    category,
    postTitle,
    postContent,
    postSummary,
    limit: compact ? 2 : 3,
  });

  if (products.length === 0) {
    return null;
  }

  // Verifica se há pelo menos um produto do catálogo pessoal do usuário
  const hasUserProducts = products.some(p => p.isUserRealProduct);

  return (
    <section 
      aria-label="Vitrine de Artigos de Futebol Shopee"
      className="my-8 rounded-3xl bg-gradient-to-br from-slate-950 via-[#130f14] to-[#260f0a] border border-[#ee4d2d]/35 p-5 sm:p-7 shadow-2xl relative overflow-hidden"
    >
      {/* Glow decorativo de fundo com a cor característica da Shopee (#ee4d2d) */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#ee4d2d]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header da Vitrine */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#ee4d2d]/20 text-[#ff6433] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-[#ee4d2d]/40">
              <ShoppingBag className="w-3 h-3 text-[#ee4d2d]" />
              Vitrine Shopee
            </span>
            {hasUserProducts ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Catálogo Oficial do Blog
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Mantos & Acessórios em Alta
              </span>
            )}
          </div>
          <h3 className="font-display font-black text-lg sm:text-xl text-white mt-1">
            Artigos de Futebol & Mantos Oficiais • Official Soccer Gear Showcase
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Seleção contextual com os melhores produtos para torcedores e colecionadores com links oficiais de afiliados da Shopee.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#ff6433] font-bold bg-[#ee4d2d]/10 px-3 py-1.5 rounded-xl border border-[#ee4d2d]/30 shrink-0 self-start sm:self-center">
          <Truck className="w-3.5 h-3.5 text-[#ee4d2d]" />
          <span>Frete Grátis • Fast Shipping</span>
        </div>
      </div>

      {/* Grid de Produtos */}
      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
        {products.map((prod: ShopeeProduct) => {
          const affiliateUrl = buildShopeeAffiliateUrl(prod, config.affiliateId);

          return (
            <div 
              key={prod.id}
              className="flex flex-col justify-between rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-[#ee4d2d]/60 transition-all p-4 group relative shadow-md hover:shadow-xl hover:shadow-[#ee4d2d]/10"
            >
              <div className="space-y-3">
                {/* Imagem do Produto com Selo Shopee */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <img 
                    src={prod.imageUrl} 
                    alt={prod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {prod.badge && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#ee4d2d] text-white font-black text-[9px] uppercase tracking-wider shadow-lg flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 fill-white" />
                      {prod.badge}
                    </span>
                  )}
                  {prod.verifiedStatus === 'verified' || prod.isUserRealProduct ? (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-600/95 text-white font-bold text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1 border border-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Verificado / Verified
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-900/90 text-amber-300 font-bold text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1 border border-amber-500/40">
                      Não Verificado / Unverified
                    </span>
                  )}
                  {prod.asin && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 font-mono text-[9px] uppercase tracking-wider border border-slate-700">
                      ASIN: {prod.asin}
                    </span>
                  )}
                </div>

                {/* Título & Detalhes */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {prod.category}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {prod.currentPriceVerified ? 'Preço confirmado' : 'Preço sob consulta'}
                    </span>
                  </div>

                  <h4 className="font-display font-bold text-sm text-white line-clamp-2 group-hover:text-[#ff7849] transition-colors leading-snug">
                    {prod.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>

                  {/* Separação de especificação objetiva e observação editorial */}
                  {prod.productSpecifications && prod.productSpecifications.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-300">
                      <span className="text-slate-400 font-bold block mb-0.5">Especificações:</span>
                      <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                        {prod.productSpecifications.slice(0, 2).map((spec, sIdx) => (
                          <li key={sIdx} className="truncate">{spec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Preço e CTA */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  {prod.currentPriceVerified ? (
                    <span className="font-display font-black text-base sm:text-lg text-[#ff6433]">
                      {prod.priceDisplay}
                    </span>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        Verificar preço atual
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Check current price
                      </span>
                    </div>
                  )}
                </div>

                <a 
                  href={affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#ee4d2d] to-[#ff5722] hover:from-[#d73f1f] hover:to-[#ee4d2d] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-[#ee4d2d]/30 transition-all cursor-pointer group-hover:translate-x-0.5 shrink-0"
                >
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                  <span>{prod.currentPriceVerified ? 'Ver na Loja' : 'Check Price'}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-80" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aviso de Transparência e Diretriz Oficial Shopee & Google AdSense */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[10px] text-slate-400 leading-tight">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <p>
          {config.disclosure}
        </p>
      </div>
    </section>
  );
};
