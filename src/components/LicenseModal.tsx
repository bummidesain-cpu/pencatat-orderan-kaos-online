import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, ShieldCheck, HelpCircle, X, Check, AlertTriangle, Copy, Lock, Unlock, Zap } from 'lucide-react';
import { getDeviceId, activateLicense, isActivated, getCorrectSerialForDevice } from '../lib/license';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivationSuccess?: () => void;
}

const DEVELOPER_PASSWORDS = ['kmzway87aa', '192.168.23.28'];

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  onActivationSuccess,
}) => {
  const [serialInput, setSerialInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Developer Mode States
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [devPasswordInput, setDevPasswordInput] = useState('');
  const [devPasswordError, setDevPasswordError] = useState('');
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  
  // Secret gesture states (6 taps or 2.5s hold)
  const [secretTapCount, setSecretTapCount] = useState(0);
  const secretTapTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Custom device ID generator in Dev Panel
  const deviceId = getDeviceId();
  const [customDevIdInput, setCustomDevIdInput] = useState(deviceId);
  const [copiedDevId, setCopiedDevId] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);

  const active = isActivated();

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!serialInput.trim()) {
      setErrorMsg('Masukkan Serial Key terlebih dahulu.');
      return;
    }

    const success = activateLicense(serialInput);
    if (success) {
      setSuccessMsg('Aplikasi Berhasil Diaktivasi! Lisensi Anda Aktif.');
      if (onActivationSuccess) {
        onActivationSuccess();
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setErrorMsg('Serial Key tidak valid untuk perangkat ini.');
    }
  };

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerDevPrompt = () => {
    if (isDevUnlocked) {
      setShowDevPanel(!showDevPanel);
    } else {
      setShowPasswordPrompt(true);
      setDevPasswordError('');
      setDevPasswordInput('');
    }
  };

  const handleSecretIconTap = () => {
    setSecretTapCount((prev) => {
      const next = prev + 1;
      if (next >= 6) {
        triggerDevPrompt();
        return 0;
      }
      if (secretTapTimerRef.current) clearTimeout(secretTapTimerRef.current);
      secretTapTimerRef.current = setTimeout(() => {
        setSecretTapCount(0);
      }, 2500);
      return next;
    });
  };

  const handleSecretPressStart = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      triggerDevPrompt();
    }, 2500);
  };

  const handleSecretPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleLockDevMode = () => {
    setIsDevUnlocked(false);
    setShowDevPanel(false);
    setShowPasswordPrompt(false);
    setDevPasswordInput('');
    setDevPasswordError('');
  };

  const handleVerifyDevPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (DEVELOPER_PASSWORDS.includes(devPasswordInput.trim().toLowerCase())) {
      setIsDevUnlocked(true);
      setShowPasswordPrompt(false);
      setShowDevPanel(true);
      setDevPasswordError('');
    } else {
      setDevPasswordError('Password salah! Akses generator ditolak.');
    }
  };

  const calculatedSerialForCustom = getCorrectSerialForDevice(customDevIdInput.trim() || deviceId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 border border-slate-150 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div
                onClick={handleSecretIconTap}
                onMouseDown={handleSecretPressStart}
                onMouseUp={handleSecretPressEnd}
                onMouseLeave={handleSecretPressEnd}
                onTouchStart={handleSecretPressStart}
                onTouchEnd={handleSecretPressEnd}
                title="Status Lisensi"
                className={`p-2.5 rounded-xl cursor-pointer select-none transition-transform active:scale-90 ${
                  active 
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' 
                    : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40'
                }`}
              >
                {active ? <ShieldCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-950 dark:text-white">
                    {active ? 'Lisensi Aktif' : 'Aktivasi Lisensi Aplikasi'}
                  </h3>
                  {isDevUnlocked && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                      <Unlock className="h-3 w-3" /> Dev Mode
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {active ? 'Fitur lengkap tidak terbatas' : '1 Device 1 Serial Key System'}
                </p>
              </div>
            </div>

            {/* Content */}
            {active ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30 text-xs">
                  <div className="flex gap-2.5 text-emerald-800 dark:text-emerald-300">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Aplikasi Telah Aktif</p>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">
                        Terima kasih telah menggunakan aplikasi kami! Perangkat Anda telah terdaftar dan seluruh limitasi transaksi telah dilepas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                    <span>Device ID Perangkat</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{deviceId}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                    <span>Status Lisensi</span>
                    <span className="font-bold text-emerald-600">Full Version</span>
                  </div>
                </div>

                <div>
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>

                {/* Password Prompt Popup */}
                {showPasswordPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-indigo-400">
                        <Lock className="h-4 w-4" />
                        <span>Buka Akses Developer</span>
                      </div>
                      <button
                        onClick={() => setShowPasswordPrompt(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Masukkan password rahasia developer untuk membuka License Generator.
                    </p>

                    <form onSubmit={handleVerifyDevPassword} className="space-y-2">
                      <input
                        type="password"
                        placeholder="Masukkan password developer..."
                        value={devPasswordInput}
                        onChange={(e) => setDevPasswordInput(e.target.value)}
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      {devPasswordError && (
                        <p className="text-[11px] text-red-400 font-medium">{devPasswordError}</p>
                      )}

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setShowPasswordPrompt(false)}
                          className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 text-xs font-medium"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                        >
                          Buka Akses
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Developer Generator Box (Unlocked with password) */}
                {showDevPanel && isDevUnlocked && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800 text-[11px] space-y-3 leading-relaxed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-indigo-950 dark:text-indigo-200 text-xs">
                        <Unlock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Developer License Generator</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleLockDevMode}
                          title="Kunci Kembali Akses Developer"
                          className="px-2 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          <Lock className="h-3 w-3" /> Kunci Akses
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDevPanel(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Device ID Target:
                      </label>
                      <input
                        type="text"
                        placeholder="DEV-XXXX-XXXX"
                        value={customDevIdInput}
                        onChange={(e) => setCustomDevIdInput(e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 font-mono text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-500 font-semibold text-[10px]">
                        <span>SERIAL KEY VALID:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(calculatedSerialForCustom, setCopiedSerial)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                          >
                            {copiedSerial ? 'Tersalin' : 'Salin'}
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-xs font-black text-indigo-900 dark:text-indigo-200 tracking-wider select-all">
                        {calculatedSerialForCustom || 'Format Device ID salah'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[10px]">
                      <span className="text-slate-500">Master: <code className="font-mono font-bold text-indigo-700 dark:text-indigo-300">LIC-FULL-ACCESS</code></span>
                      <button
                        type="button"
                        onClick={() => setShowDevPanel(false)}
                        className="text-indigo-600 hover:underline font-bold"
                      >
                        Tutup Panel Generator
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Warning / Trial Status */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/50 dark:bg-slate-800/40 dark:border-slate-800 text-xs">
                  <div className="flex gap-2.5 text-amber-800 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <p className="font-bold">Versi Evaluasi / Trial</p>
                      <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                        Aplikasi saat ini berjalan dalam mode Trial dan dibatasi maksimal <strong>5 Transaksi</strong>. Masukkan Serial Key untuk membuka kunci.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Device Info */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-150 dark:bg-slate-900/60 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Device ID Anda:</span>
                    <button
                      onClick={() => handleCopy(deviceId, setCopiedDevId)}
                      className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-semibold"
                    >
                      {copiedDevId ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-center font-mono font-black text-sm text-slate-800 dark:text-white tracking-widest">
                    {deviceId}
                  </div>
                </div>

                {/* Activation Form */}
                <form onSubmit={handleActivate} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Masukkan Serial Key
                    </label>
                    <input
                      type="text"
                      placeholder="LIC-XXXX-XXXX"
                      value={serialInput}
                      onChange={(e) => setSerialInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-xs text-slate-800 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                      ⚠️ {errorMsg}
                    </p>
                  )}

                  {successMsg && (
                    <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      ✅ {successMsg}
                    </p>
                  )}

                  <div>
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/10 transition cursor-pointer"
                    >
                      Aktivasi Sekarang
                    </button>
                  </div>
                </form>

                {/* Password Prompt Popup */}
                {showPasswordPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-indigo-400">
                        <Lock className="h-4 w-4" />
                        <span>Password Developer</span>
                      </div>
                      <button
                        onClick={() => setShowPasswordPrompt(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      Panel generator khusus pembuat aplikasi. Masukkan password rahasia untuk melanjutkan.
                    </p>

                    <form onSubmit={handleVerifyDevPassword} className="space-y-2">
                      <input
                        type="password"
                        placeholder="Masukkan password developer..."
                        value={devPasswordInput}
                        onChange={(e) => setDevPasswordInput(e.target.value)}
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />

                      {devPasswordError && (
                        <p className="text-[11px] text-red-400 font-medium">{devPasswordError}</p>
                      )}

                      <div className="flex gap-2 justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setShowPasswordPrompt(false)}
                          className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 text-xs font-medium"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                        >
                          Buka Generator
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Developer Generator Box (Unlocked with password) */}
                {showDevPanel && isDevUnlocked && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800 text-[11px] space-y-3 leading-relaxed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-black text-indigo-950 dark:text-indigo-200 text-xs">
                        <Unlock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Developer License Generator</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleLockDevMode}
                          title="Kunci Kembali Akses Developer"
                          className="px-2 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-[10px] font-bold flex items-center gap-1 transition"
                        >
                          <Lock className="h-3 w-3" /> Kunci Akses
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDevPanel(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Device ID Target:
                      </label>
                      <input
                        type="text"
                        placeholder="DEV-XXXX-XXXX"
                        value={customDevIdInput}
                        onChange={(e) => setCustomDevIdInput(e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 font-mono text-xs font-bold text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-2">
                      <div className="flex items-center justify-between text-slate-500 font-semibold text-[10px]">
                        <span>SERIAL KEY VALID:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy(calculatedSerialForCustom, setCopiedSerial)}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                          >
                            {copiedSerial ? 'Tersalin' : 'Salin'}
                          </button>
                          {customDevIdInput.trim().toUpperCase() === deviceId.toUpperCase() && (
                            <button
                              type="button"
                              onClick={() => setSerialInput(calculatedSerialForCustom)}
                              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-0.5"
                            >
                              <Zap className="h-3 w-3" /> Pasang
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="font-mono text-xs font-black text-indigo-900 dark:text-indigo-200 tracking-wider select-all">
                        {calculatedSerialForCustom || 'Format Device ID salah'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/60 space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Master Keys:</span>{' '}
                        <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-700 dark:text-indigo-300">
                          LIC-FULL-ACCESS
                        </code>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
