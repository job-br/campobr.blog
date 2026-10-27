/**
 * Configuração central do site. Defina em .env (prefixo VITE_) — veja .env.example.
 * Todos os e-mails/endereços exibidos nas páginas legais saem DAQUI (nada inventado no código).
 */
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const SITE = {
  name: 'CampoBR',
  url: env.VITE_SITE_URL || 'https://campobr.blog',
  // E-mail único de contato exibido ao público. Troque por um e-mail do seu domínio.
  contactEmail: env.VITE_CONTACT_EMAIL || 'canaldamenteadulta@gmail.com',
  // Endereço físico é opcional; só aparece se você preencher.
  address: env.VITE_SITE_ADDRESS || '',
};
