import React, { useEffect, useState } from 'react';

const CONSENT_KEY = 'campobr_consent_v1';

type AdsArray = unknown[] & { requestNonPersonalizedAds?: number };

/** Define se o AdSense pode usar anúncios personalizados (somente após consentimento). */
function applyAdsConsent(personalized: boolean): void {
  try {
    const w = window as unknown as { adsbygoogle?: AdsArray };
    w.adsbygoogle = w.adsbygoogle || [];
    w.adsbygoogle.requestNonPersonalizedAds = personalized ? 0 : 1;
  } catch {
    // ignore
  }
}

interface CookieConsentProps {
  onOpenPrivacy?: () => void;
}

/**
 * Aviso de cookies (LGPD). Até o visitante aceitar, os anúncios são NÃO personalizados.
 * Obs.: para tráfego do EEE/Reino Unido o Google exige uma CMP certificada (TCF) —
 * veja SETUP.md → "Mensagens de consentimento do Google (gratuito no AdSense)".
 */
export const CookieConsent: React.FC<CookieConsentProps> = ({ onOpenPrivacy }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(CONSENT_KEY);
    } catch {
      // ignore
    }
    applyAdsConsent(saved === 'all');
    if (!saved) setVisible(true);
  }, []);

  const choose = (value: 'all' | 'essential') => {
    try {
      localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // ignore
    }
    applyAdsConsent(value === 'all');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-slate-700 bg-slate-950/95 p-4 shadow-2xl backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-slate-300">
          Usamos cookies para o funcionamento do site e para exibir anúncios. Você pode aceitar anúncios
          personalizados ou manter apenas os essenciais (anúncios não personalizados).{' '}
          {onOpenPrivacy && (
            <button type="button" onClick={onOpenPrivacy} className="text-emerald-400 underline">
              Política de Privacidade
            </button>
          )}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose('essential')}
            className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
          >
            Somente essenciais
          </button>
          <button
            type="button"
            onClick={() => choose('all')}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
          >
            Aceitar todos
          </button>
        </div>
      </div>
    </div>
  );
};
