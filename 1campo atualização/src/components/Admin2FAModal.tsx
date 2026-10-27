import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, X } from 'lucide-react';
import { adminAuthService } from '../services/adminAuth';
import { AdminSession } from '../types';

interface Admin2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AdminSession) => void;
}

/**
 * Modal de acesso do administrador (Google / Firebase Authentication).
 * O nome do arquivo foi mantido por compatibilidade de importação.
 * A permissão real de escrita é validada pelas regras do Firestore.
 */
export const Admin2FAModal: React.FC<Admin2FAModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    const result = await adminAuthService.login();
    setLoading(false);
    if (result.success && result.session) {
      onSuccess(result.session);
    } else {
      setErrorMsg(result.error || 'Não foi possível entrar.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 id="admin-login-title" className="text-lg font-bold text-white">
              Acesso do administrador
            </h2>
            <p className="text-xs text-slate-400">Entre com a conta Google autorizada.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Abrindo login do Google…' : 'Entrar com Google'}
        </button>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
          Recomendado: ative a verificação em duas etapas na sua conta Google. Apenas o e-mail
          autorizado consegue publicar, editar ou excluir conteúdo.
        </p>
      </div>
    </div>
  );
};
