import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { AdminSession } from '../types';
import { auth } from './firebase';

/** Authorization is granted only by the server-assigned Firebase custom claim `admin: true`. */
export async function signInAdminWithGoogle(): Promise<AdminSession> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(auth, provider);
  const token = await credential.user.getIdTokenResult(true);
  if (token.claims.admin !== true) {
    await signOut(auth);
    throw new Error('Esta conta não possui permissão administrativa atribuída no Firebase.');
  }
  return sessionFromUser(credential.user);
}

export async function verifyAdminUser(user: User | null): Promise<AdminSession | null> {
  if (!user) return null;
  try {
    const token = await user.getIdTokenResult();
    return token.claims.admin === true ? sessionFromUser(user) : null;
  } catch {
    return null;
  }
}

function sessionFromUser(user: User): AdminSession {
  return { uid: user.uid, email: user.email || '', verifiedAt: new Date().toISOString() };
}

export function subscribeToAdminAuth(callback: (session: AdminSession | null) => void): () => void {
  return onAuthStateChanged(auth, async user => callback(await verifyAdminUser(user)));
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export const adminAuthService = { logout: logoutAdmin };
