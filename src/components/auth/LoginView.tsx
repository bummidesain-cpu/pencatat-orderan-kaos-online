import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Printer,
  ShieldCheck,
  User as UserIcon,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { BusinessSettings, User } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  users: User[];
  settings: BusinessSettings;
  onLoginAttempt: (username: string, pass: string, rememberMe?: boolean) => { success: boolean; user?: User; error?: string };
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  users,
  settings,
  onLoginAttempt,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('Silakan masukkan nama pengguna Anda.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Silakan masukkan password Anda.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    setTimeout(() => {
      const res = onLoginAttempt(username, password, rememberMe);
      setIsSubmitting(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Login gagal. Periksa kembali nama & password Anda.');
      }
    }, 300);
  };

  const handleQuickFill = (user: User) => {
    const defaultPass =
      user.password ||
      (user.role === 'owner' ? 'owner123' : user.role === 'admin' ? 'admin123' : 'produksi123');
    setUsername(user.name);
    setPassword(defaultPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Subtle Glowing Gradients */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* App Logo & Title Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 border border-indigo-400/30">
            <Printer className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              {settings.name || 'Order Management System'}
            </h1>
            <p className="text-xs font-semibold text-slate-400 tracking-wide mt-1">
              Sistem Cetak Nota, Manajemen Desain & Produksi Sablon
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-slate-800/90 p-6 sm:p-8 shadow-2xl border border-slate-700/80 backdrop-blur-xl space-y-5">
          <div className="border-b border-slate-700 pb-3">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-400" />
              <span>Login Aplikasi</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Masukkan kredensial akun Anda untuk mengakses sistem.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-xl bg-rose-950/80 p-3.5 text-xs font-bold text-rose-300 border border-rose-800 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-300">
                Nama Pengguna
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Contoh: Bambang Owner"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="Masukkan password Anda..."
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                />
                <span>Ingat saya di perangkat ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Masuk Ke Aplikasi</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Accounts Section */}
          {settings.showDemoQuickFill !== false && (
            <div className="pt-2 border-t border-slate-700/80 space-y-2 animate-fadeIn">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>Klik Akun Untuk Quick Fill Login (Demo):</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {users.map((u) => {
                  const pass =
                    u.password ||
                    (u.role === 'owner' ? 'owner123' : u.role === 'admin' ? 'admin123' : 'produksi123');

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickFill(u)}
                      className="flex flex-col items-start p-2.5 rounded-xl bg-slate-900/60 hover:bg-indigo-950/60 border border-slate-700/60 hover:border-indigo-500/60 text-left transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-1 text-[11px] font-black text-slate-200 group-hover:text-indigo-300">
                        {u.role === 'owner' && <Crown className="h-3 w-3 text-amber-400" />}
                        {u.role === 'admin' && <UserCheck className="h-3 w-3 text-blue-400" />}
                        {u.role === 'produksi' && <Wrench className="h-3 w-3 text-emerald-400" />}
                        <span className="truncate">{u.role.toUpperCase()}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate w-full">{u.name}</span>
                      <span className="text-[9px] font-mono text-slate-500 truncate w-full">Pass: {pass}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500 font-medium">
          &copy; {new Date().getFullYear()} {settings.name}. Dilindungi oleh keamanan sesi terenkripsi lokal.
        </p>
      </div>
    </div>
  );
};
