import React, { useState, useEffect, useRef } from 'react';
import { AdSenseConfig } from '../types';
import { X, ShieldCheck } from 'lucide-react';

interface MobileStickyAnchorAdProps {
  adsConfig?: AdSenseConfig;
}

export const MobileStickyAnchorAd: React.FC<MobileStickyAnchorAdProps> = ({ adsConfig }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const isEnabled = adsConfig?.adsenseEnabled ?? true;
  const publisherId = adsConfig?.publisherId || 'ca-pub-1323802134955418';
  const slotId = adsConfig?.slotRightBottom || '8491029412';
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!isEnabled || isDismissed || typeof window === 'undefined') return;

    try {
      const insEl = insRef.current;
      if (insEl && !insEl.getAttribute('data-adsbygoogle-status')) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      // Ignora se bloqueador de anúncios estiver presente
    }
  }, [isEnabled, isDismissed]);

  if (!isEnabled || isDismissed) {
    return null;
  }

  return (
    <aside 
      role="complementary"
      aria-label="Espaço Publicitário Âncora Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl transition-transform duration-300"
    >
      {/* Barra de controle e identificação */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900/90 border-b border-slate-800 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="font-bold uppercase tracking-wider text-slate-300">Publicidade</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Google AdSense</span>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
          title="Fechar anúncio"
        >
          <span>Fechar</span>
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Container oficial do anúncio âncora mobile */}
      <div className="p-1 min-h-[50px] max-h-[100px] flex items-center justify-center overflow-hidden">
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'inline-block', width: '320px', height: '50px' }}
          data-ad-client={publisherId}
          data-ad-slot={slotId}
        />
      </div>
    </aside>
  );
};
