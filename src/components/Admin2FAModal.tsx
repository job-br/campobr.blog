import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  X, 
  Eye, 
  EyeOff, 
  LockKeyhole
} from 'lucide-react';
import { 
  requestAdminStep1,
  loginWithGoogleAdmin,
  AUTHORIZED_ADMIN_EMAIL
} from '../services/adminAuth';
import { loginWithGoogle } from '../services/firebase';
import { AdminSession } from '../types';

interface Admin2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AdminSession) => void;
}

export const Admin2FAModal: React.FC<Admin2FAModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Limpa os campos sempre que o modal abre ou fecha
  useEffect(() => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setErrorMsg(null);
    setIsCredentialsLoading(false);
    setIsGoogleLoading(false);
  }, [isOpen]);

  if (!isOpen) return null;

  // Login Direto com a Conta Google Oficial do Proprietário
  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);

    try {
      const user = await loginWithGoogle();
      setIsGoogleLoading(false);

      if (user && user.email) {
        const result = loginWithGoogleAdmin(user.email);
        if (result.success && result.session) {
          onSuccess(result.session);
          onClose();
        } else {
          setErrorMsg(result.error || `A conta Google (${user.email}) não possui privilégios de administrador.`);
        }
      }
    } catch (err: unknown) {
      setIsGoogleLoading(false);
      console.error('Erro Google Auth:', err);
      const errObj = err as { code?: string; message?: string };
      if (errObj?.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domínio Netlify não autorizado no Firebase Auth! No Console do Firebase (Authentication > Configurações > Domínios Autorizados), adicione o seu domínio .netlify.app. Enquanto isso, use o login com senha abaixo.');
      } else if (errObj?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Janela de login com Google fechada antes da confirmação.');
      } else {
        setErrorMsg('Falha na autenticação Google. Caso o domínio não esteja no Firebase, utilize o login com senha abaixo.');
      }
    }
  };

  // Login com Gmail e Senha Administrativa
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsCredentialsLoading(true);

    try {
      const result = await requestAdminStep1(email, password);
      setIsCredentialsLoading(false);

      if (result.success && result.session) {
        setEmail('');
        setPassword('');
        onSuccess(result.session);
        onClose();
      } else {
        setErrorMsg(result.error || 'Acesso restrito. Credenciais incorretas ou não autorizadas.');
      }
    } catch {
      setIsCredentialsLoading(false);
      setErrorMsg('Falha ao validar credenciais. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-md bg-[#090f18] border border-emerald-500/40 rounded-3xl overflow-hidden shadow-2xl my-8">
        
        {/* Top Header Banner */}
        <div className="p-6 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border-b border-slate-800 relative">
          <button
            onClick={() => {
              setEmail('');
              setPassword('');
              onClose();
            }}
            className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <LockKeyhole className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Acesso Restrito
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-medium">
                  Privacidade Total
                </span>
              </div>
              <h2 className="font-display font-black text-xl text-white mt-0.5">
                Painel do Administrador
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-2.5 text-rose-300 text-xs font-medium leading-relaxed animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="text-left space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed">
              Autenticação exclusiva do proprietário. Conecte-se com sua <strong className="text-white">Conta Google Oficial</strong> ou informe seu e-mail e senha administrativa:
            </p>

            {/* Opção 1: Login com Conta Google Oficial (1-Click) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isCredentialsLoading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-900 border-t-transparent animate-spin"></span>
                  Conectando com o Google...
                </span>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Entrar com Conta Google Oficial</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ou acesse com senha</span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>
          </div>

          {/* FORMULÁRIO DE SEGURANÇA: GMAIL E SENHA */}
          <form 
            onSubmit={handleCredentialsSubmit} 
            className="space-y-4" 
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
          >
            {/* Inputs invisíveis para neutralizar preenchimento automático forçado de navegadores */}
            <input type="text" name="anti_autofill_email" tabIndex={-1} aria-hidden="true" className="hidden" autoComplete="off" />
            <input type="password" name="anti_autofill_pwd" tabIndex={-1} aria-hidden="true" className="hidden" autoComplete="new-password" />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Gmail do Administrador
                </label>
                <button
                  type="button"
                  onClick={() => setEmail(AUTHORIZED_ADMIN_EMAIL)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline"
                >
                  Usar e-mail oficial
                </button>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="adm_auth_email_input"
                  name="campo_seguranca_usr"
                  type="text"
                  inputMode="email"
                  required
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-white text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">
                Senha Administrativa
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="adm_auth_pwd_input"
                  name="campo_seguranca_pwd"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-emerald-500 text-white text-sm outline-none transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer p-1"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCredentialsLoading || !email.trim() || !password.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition-all cursor-pointer"
            >
              {isCredentialsLoading ? (
                <span>Validando Credenciais...</span>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy & Security Guarantee Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <p className="flex items-center gap-1.5 font-bold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privacidade & Acesso do Proprietário</span>
            </p>
            <p className="leading-relaxed">
              Conta autorizada: <strong className="text-emerald-300">{AUTHORIZED_ADMIN_EMAIL}</strong>.
            </p>
            <p className="text-[10px] text-slate-400 leading-normal">
              💡 <strong>Dica no Netlify:</strong> Você pode clicar no botão Google acima ou usar o e-mail oficial com a senha mestra <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded border border-slate-700">admin2026</code>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export const AdminLoginModal = Admin2FAModal;
