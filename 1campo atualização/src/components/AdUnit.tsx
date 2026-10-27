import React, { useEffect, useRef } from 'react';
import { isValidAdSlot } from '../config/monetization';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdUnitProps {
  publisherId: string;
  slot: string | undefined;
  format?: 'auto' | 'fluid';
  layout?: string;
  minHeight?: number;
  className?: string;
}

/**
 * Bloco de anúncio AdSense real, rotulado apenas como "Publicidade".
 * Não renderiza nada se o ID do bloco não for válido (evita requisições inválidas).
 */
export const AdUnit: React.FC<AdUnitProps> = ({
  publisherId,
  slot,
  format = 'auto',
  layout,
  minHeight = 120,
  className = '',
}) => {
  const insRef = useRef<HTMLModElement>(null);
  const valid = isValidAdSlot(slot);

  useEffect(() => {
    if (!valid || typeof window === 'undefined') return;
    try {
      const el = insRef.current;
      if (el && !el.getAttribute('data-adsbygoogle-status')) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {
      // bloqueador de anúncios ou script ainda carregando
    }
  }, [valid, slot]);

  if (!valid) return null;

  return (
    <aside aria-label="Publicidade" className={`w-full overflow-hidden ${className}`}>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Publicidade</div>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        data-full-width-responsive="true"
      />
    </aside>
  );
};
