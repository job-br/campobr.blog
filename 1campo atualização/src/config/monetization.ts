/**
 * Configuração ÚNICA de monetização (Google AdSense).
 * Defina os IDs reais no ambiente de build (Netlify/Vercel → Environment variables) — veja .env.example.
 *
 * Regras de segurança/conformidade:
 *  - Sem ID de bloco válido NENHUM bloco manual é renderizado (os anúncios automáticos do
 *    script no <head> continuam funcionando). Nunca usamos IDs inventados.
 *  - Os anúncios só são rotulados como "Publicidade" (exigência das políticas do Google).
 */
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const ADSENSE_CLIENT: string = env.VITE_ADSENSE_CLIENT || 'ca-pub-4032013040376402';

export const ADSENSE_SLOTS = {
  article: env.VITE_ADSENSE_SLOT_ARTICLE || '',
  sidebarTop: env.VITE_ADSENSE_SLOT_SIDEBAR_TOP || '',
  sidebarBottom: env.VITE_ADSENSE_SLOT_SIDEBAR_BOTTOM || '',
};

/** IDs de blocos são numéricos (8–12 dígitos). */
export function isValidAdSlot(slot: string | undefined | null): slot is string {
  return typeof slot === 'string' && /^\d{8,12}$/.test(slot.trim());
}
