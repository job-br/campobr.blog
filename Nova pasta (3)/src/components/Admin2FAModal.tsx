import React, { useState } from 'react';
import { AlertCircle, X, ShieldCheck, Loader2 } from 'lucide-react';
import { signInAdminWithGoogle } from '../services/adminAuth';
import { AdminSession } from '../types';

interface Props { isOpen: boolean; onClose: () => void; onSuccess: (session: AdminSession) => void }
export const Admin2FAModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;
  const handleSignIn = async () => {
    setError(null); setLoading(true);
    try { onSuccess(await signInAdminWithGoogle()); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível autenticar.'); }
    finally { setLoading(false); }
  };
  return <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
    <section className="relative w-full max-w-md rounded-3xl bg-[#090f18] border border-emerald-500/40 p-7 shadow-2xl">
      <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white" aria-label="Fechar"><X /></button>
      <div className="flex items-center gap-3 mb-5"><ShieldCheck className="w-10 h-10 text-emerald-400"/><div><p className="text-emerald-300 text-xs font-bold uppercase">Acesso administrativo</p><h2 className="text-white text-xl font-black">Entrar com Google</h2></div></div>
      {error && <p role="alert" className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-sm flex gap-2"><AlertCircle className="w-5 h-5 shrink-0"/>{error}</p>}
      <p className="text-slate-300 text-sm leading-relaxed mb-5">A conta precisa ter a permissão administrativa atribuída no Firebase. O acesso é validado por token assinado; não use uma senha armazenada no navegador.</p>
      <button disabled={loading} onClick={handleSignIn} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black flex justify-center items-center gap-2">{loading ? <><Loader2 className="animate-spin w-4 h-4"/> Verificando…</> : 'Continuar com Google'}</button>
    </section>
  </div>;
};
export const AdminLoginModal = Admin2FAModal;
