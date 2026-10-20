import React, { useEffect, useRef } from 'react';
import { AdSenseConfig } from '../types';
import { ExternalLink, ShieldCheck } from 'lucide-react';

interface ArticleAdSenseSlotProps {
  adsConfig?: AdSenseConfig;
}

export const ArticleAdSenseSlot: React.FC<ArticleAdSenseSlotProps> = ({ adsConfig }) => {
  const publisherId = adsConfig?.publisherId || 'ca-pub-1323802134955418';
  const slotId = adsConfig?.slotFeedMiddle || '5820491820';
  const isEnabled = adsConfig?.adsenseEnabled ?? true;
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    // Previne erro 'TagError: All ins elements already have ads in them' no React 19 SPA
    try {
      const insEl = insRef.current;
      if (insEl && !insEl.getAttribute('data-adsbygoogle-status')) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      // Ignora silenciosamente se o adblocker estiver ativo ou script carregando
    }
  }, [isEnabled, slotId]);

  if (!isEnabled) {
    return null;
  }

  return (
    <section 
      aria-label="Espaço Publicitário Oficial Google AdSense"
      className="w-full my-8 p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-[#090e17] to-[#060a10] border border-slate-800/80 shadow-lg overflow-hidden text-center"
    >
      {/* Barra de conformidade e rotulagem estrita do Google AdSense */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/60 text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60"></span>
          <span className="font-bold tracking-wider uppercase text-slate-400">Publicidade</span>
          <span>•</span>
          <span className="text-slate-500">Google AdSense</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://support.google.com/adsense/answer/1638622"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] text-slate-400 hover:text-emerald-300 transition-colors"
            title="Sobre anúncios do Google (AdChoices)"
          >
            <span>AdChoices</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* Container oficial do anúncio in-article responsivo */}
      <div className="min-h-[120px] flex items-center justify-center w-full overflow-hidden">
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center', width: '100%', minHeight: '120px' }}
          data-ad-layout="in-article"
          data-ad-format="fluid"
          data-ad-client={publisherId}
          data-ad-slot={slotId}
        />
      </div>

      <div className="mt-2 text-[9px] text-slate-600 flex items-center justify-center gap-1">
        <ShieldCheck className="w-3 h-3 text-emerald-500/60" />
        <span>Espaço verificado • Parceria Oficial Google Publisher</span>
      </div>
    </section>
  );
};
