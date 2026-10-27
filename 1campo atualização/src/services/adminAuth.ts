import { AdminSession } from '../types';
import { auth, loginWithGoogle, logoutUser } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Autenticação do administrador baseada em Firebase Authentication (Google).
 *
 * SEGURANÇA:
 *  - Não existe mais senha no código nem sessão em localStorage.
 *  - A identidade vem do token do Firebase; a AUTORIZAÇÃO real é aplicada pelas
 *    regras do Firestore (firestore.rules → isAdmin()). Este arquivo apenas decide
 *    o que a interface exibe; forjar o estado no navegador não concede escrita.
 *  - O e-mail abaixo deve ser idêntico ao de firestore.rules.
 */
export const AUTHORIZED_ADMIN_EMAIL = 'canaldamenteadulta@gmail.com';

function isAuthorized(email: string | null | undefined, verified: boolean | undefined): boolean {
  return Boolean(email && verified && email.toLowerCase() === AUTHORIZED_ADMIN_EMAIL);
}

let currentSession: AdminSession | null = null;

export function getAdminSession(): AdminSession | null {
  return currentSession;
}

export function isUserAdminLoggedIn(): boolean {
  return currentSession !== null;
}

/** Observa o estado de login e entrega a sessão admin (ou null). Retorna a função de cancelamento. */
export function subscribeAdminSession(callback: (session: AdminSession | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => {
    if (user && isAuthorized(user.email, user.emailVerified)) {
      currentSession = {
        email: user.email as string,
        verifiedAt: user.metadata.lastSignInTime || new Date().toISOString(),
      };
    } else {
      currentSession = null;
      // Qualquer outra conta Google não deve permanecer logada neste site
      if (user) void logoutUser();
    }
    callback(currentSession);
  });
}

export async function loginAdminWithGoogle(): Promise<{ success: boolean; session?: AdminSession; error?: string }> {
  try {
    const user = await loginWithGoogle();
    if (!user) return { success: false, error: 'Login indisponível no momento. Tente novamente.' };
    if (!isAuthorized(user.email, user.emailVerified)) {
      await logoutUser();
      return { success: false, error: 'Esta conta Google não tem permissão de administrador.' };
    }
    currentSession = {
      email: user.email as string,
      verifiedAt: new Date().toISOString(),
    };
    return { success: true, session: currentSession };
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { success: false, error: 'Login cancelado.' };
    }
    if (code === 'auth/unauthorized-domain') {
      return { success: false, error: 'Domínio não autorizado no Firebase Auth (Authentication → Settings → Authorized domains).' };
    }
    return { success: false, error: 'Não foi possível entrar. Tente novamente.' };
  }
}

export async function logoutAdmin(): Promise<void> {
  currentSession = null;
  await logoutUser();
}

export const adminAuthService = {
  getCurrentSession: getAdminSession,
  isLoggedIn: isUserAdminLoggedIn,
  subscribe: subscribeAdminSession,
  login: loginAdminWithGoogle,
  logout: logoutAdmin,
};
