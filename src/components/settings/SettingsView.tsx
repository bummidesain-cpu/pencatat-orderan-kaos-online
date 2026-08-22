import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  BellRing,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  FileUp,
  Globe,
  HardDrive,
  Heart,
  Image as ImageIcon,
  Info,
  KeyRound,
  Link as LinkIcon,
  Lock,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Terminal,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Unlock,
  X,
  Zap,
  Copy,
  Check,
} from 'lucide-react';
import {
  deleteAllOrders,
  exportDatabaseBackup,
  getBackupReminderStatus,
  importDatabaseBackup,
  resetDatabaseToDefault,
  verifyOwnerPassword,
} from '../../lib/storage';
import { getDeviceId, getCorrectSerialForDevice } from '../../lib/license';
import { BackupReminderInterval, BusinessSettings } from '../../types';
import { PhpBackendManagerModal } from './PhpBackendManagerModal';
import { generateBackendZip, PHP_BACKEND_FILES } from '../../lib/phpBackendData';

interface SettingsViewProps {
  settings: BusinessSettings;
  onSaveSettings: (settings: BusinessSettings) => void;
  theme?: 'light' | 'dark' | 'system';
  onThemeChange?: (theme: 'light' | 'dark' | 'system') => void;
  onRefreshData?: () => void;
  onOpenUserManagement?: () => void;
  isLicensed?: boolean;
  onOpenLicenseModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  theme = 'system',
  onThemeChange,
  onRefreshData,
  onOpenUserManagement,
  isLicensed = false,
  onOpenLicenseModal,
}) => {
  const [formData, setFormData] = useState<BusinessSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteOrdersModalOpen, setIsDeleteOrdersModalOpen] = useState(false);
  const [deleteOrdersPassword, setDeleteOrdersPassword] = useState('');
  const [showDeleteOrdersPassword, setShowDeleteOrdersPassword] = useState(false);
  const [deleteOrdersError, setDeleteOrdersError] = useState('');

  // PHP Backend Modal State
  const [isPhpModalOpen, setIsPhpModalOpen] = useState(false);
  const [isDownloadingPhpZip, setIsDownloadingPhpZip] = useState(false);

  const handleQuickDownloadPhpZip = async () => {
    try {
      setIsDownloadingPhpZip(true);
      const zipBlob = await generateBackendZip();
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'backend_php_mysql_order_management.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download backend zip', err);
    } finally {
      setIsDownloadingPhpZip(false);
    }
  };

  // Developer Mode States
  const [isDevModeUnlocked, setIsDevModeUnlocked] = useState(false);
  const [showDevPasswordModal, setShowDevPasswordModal] = useState(false);
  const [devPasswordInput, setDevPasswordInput] = useState('');
  const [devPasswordError, setDevPasswordError] = useState('');
  const currentDevId = getDeviceId();
  const [customDevIdInput, setCustomDevIdInput] = useState(currentDevId);
  const [copiedTargetSerial, setCopiedTargetSerial] = useState(false);

  // Secret gesture states for Developer Mode (6 taps or 2.5s long press)
  const [secretTapCount, setSecretTapCount] = useState(0);
  const secretTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const DEVELOPER_PASSWORDS = ['kmzway87aa', '192.168.23.28'];

  const triggerSecretDevPrompt = () => {
    if (isDevModeUnlocked) {
      setIsDevModeUnlocked(false);
    } else {
      setShowDevPasswordModal(true);
      setDevPasswordInput('');
      setDevPasswordError('');
    }
  };

  const handleSecretIconClick = () => {
    setSecretTapCount((prev) => {
      const nextCount = prev + 1;
      if (nextCount >= 6) {
        triggerSecretDevPrompt();
        return 0;
      }
      if (secretTapTimerRef.current) clearTimeout(secretTapTimerRef.current);
      secretTapTimerRef.current = setTimeout(() => {
        setSecretTapCount(0);
      }, 2500);
      return nextCount;
    });
  };

  const handleSecretTouchStart = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      triggerSecretDevPrompt();
    }, 2500);
  };

  const handleSecretTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleOpenDevMode = () => {
    triggerSecretDevPrompt();
  };

  const handleVerifyDevPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (DEVELOPER_PASSWORDS.includes(devPasswordInput.trim().toLowerCase())) {
      setIsDevModeUnlocked(true);
      setShowDevPasswordModal(false);
      setDevPasswordError('');
    } else {
      setDevPasswordError('Password developer salah!');
    }
  };

  const handleLockDevMode = () => {
    setIsDevModeUnlocked(false);
    setShowDevPasswordModal(false);
    setDevPasswordInput('');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const processLogoFile = (file: File) => {
    setLogoUploadError(null);
    if (!file.type.startsWith('image/')) {
      setLogoUploadError('File harus berupa format gambar (PNG, JPG, WEBP, atau SVG).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setLogoUploadError('Ukuran file gambar maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const isPng = file.type === 'image/png';
          const optimizedDataUrl = canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.9);
          setFormData((prev) => ({ ...prev, logoUrl: optimizedDataUrl }));
        } else {
          setFormData((prev) => ({ ...prev, logoUrl: rawDataUrl }));
        }
      };
      img.onerror = () => {
        setFormData((prev) => ({ ...prev, logoUrl: rawDataUrl }));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLogoFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLogoFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedData: BusinessSettings = {
      ...formData,
      name: formData.name.trim() || 'Order Management System',
    };
    setFormData(cleanedData);
    onSaveSettings(cleanedData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleExportBackup = () => {
    try {
      exportDatabaseBackup();
      const nowIso = new Date().toISOString();
      const updated = {
        ...formData,
        lastBackupDate: nowIso,
      };
      setFormData(updated);
      onSaveSettings(updated);
      setBackupStatus({
        type: 'success',
        message: 'File backup JSON berhasil dibuat dan diunduh ke perangkat Anda!',
      });
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err: any) {
      setBackupStatus({
        type: 'error',
        message: 'Gagal mengunduh backup: ' + (err?.message || 'Error tidak diketahui'),
      });
    }
  };

  const handleUpdateBackupSettings = (
    enabled: boolean,
    interval: BackupReminderInterval
  ) => {
    const updated: BusinessSettings = {
      ...formData,
      backupReminderEnabled: enabled,
      backupReminderInterval: interval,
    };
    setFormData(updated);
    onSaveSettings(updated);
    setBackupStatus({
      type: 'success',
      message: 'Pengaturan notifikasi pengingat backup berhasil disimpan!',
    });
    setTimeout(() => setBackupStatus(null), 3000);
  };

  const backupReminderStatus = getBackupReminderStatus(formData);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);

      const result = await importDatabaseBackup(parsedData);

      if (onRefreshData) {
        onRefreshData();
      }

      setBackupStatus({
        type: 'success',
        message: `Database berhasil dipulihkan! (${result.ordersCount} pesanan & ${result.customersCount} pelanggan dimuat).`,
      });
      setTimeout(() => setBackupStatus(null), 5000);
    } catch (err: any) {
      setBackupStatus({
        type: 'error',
        message: 'Gagal merestore database: ' + (err?.message || 'File JSON tidak valid'),
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetDatabase = async () => {
    try {
      await resetDatabaseToDefault();
      if (onRefreshData) {
        onRefreshData();
      }
      setIsResetModalOpen(false);
      setBackupStatus({
        type: 'success',
        message: 'Database aplikasi berhasil direset ke data contoh default!',
      });
      setTimeout(() => setBackupStatus(null), 5000);
    } catch (err: any) {
      setBackupStatus({
        type: 'error',
        message: 'Gagal mereset database: ' + (err?.message || 'Error tidak diketahui'),
      });
    }
  };

  const handleDeleteAllOrders = () => {
    if (!deleteOrdersPassword.trim()) {
      setDeleteOrdersError('Password owner tidak boleh kosong.');
      return;
    }

    const isValid = verifyOwnerPassword(deleteOrdersPassword);
    if (!isValid) {
      setDeleteOrdersError('Password Owner salah! Silakan periksa kembali.');
      return;
    }

    try {
      deleteAllOrders();
      if (onRefreshData) {
        onRefreshData();
      }
      setIsDeleteOrdersModalOpen(false);
      setDeleteOrdersPassword('');
      setDeleteOrdersError('');
      setBackupStatus({
        type: 'success',
        message: 'Seluruh data orderan, transaksi, pengeluaran & belanja berhasil dihapus secara permanen!',
      });
      setTimeout(() => setBackupStatus(null), 5000);
    } catch (err: any) {
      setDeleteOrdersError('Gagal menghapus data orderan: ' + (err?.message || 'Error tidak diketahui'));
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Pengaturan Usaha</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Atur profil bisnis, rekening bank, mode tampilan, serta cadangan (backup) & pemulihan (restore) database aplikasi.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>Pengaturan usaha berhasil disimpan!</span>
        </div>
      )}

      {backupStatus && (
        <div
          className={`p-4 rounded-xl font-bold text-xs flex items-center justify-between gap-2 transition ${
            backupStatus.type === 'success'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {backupStatus.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>{backupStatus.message}</span>
          </div>
          <button
            onClick={() => setBackupStatus(null)}
            className="text-xs underline hover:opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* User Management & Password Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Manajemen User & Password Aplikasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kelola daftar akun pengguna (Owner, Admin Sales, Tim Produksi), ubah password, dan atur hak akses aplikasi.
            </p>
          </div>
          {onOpenUserManagement && (
            <button
              type="button"
              onClick={onOpenUserManagement}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-700 shadow-md transition cursor-pointer shrink-0"
            >
              <KeyRound className="h-4 w-4" />
              <span>Buka Kelola User & Password</span>
            </button>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
              Tombol Quick Fill Login (Mode Demo)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Tampilkan tombol bantuan isi cepat login di halaman masuk. Matikan saklar ini untuk menyembunyikan bantuan demo saat aplikasi dipakai secara resmi.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const updated = {
                ...formData,
                showDemoQuickFill: formData.showDemoQuickFill === false ? true : false,
              };
              setFormData(updated);
              onSaveSettings(updated);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              formData.showDemoQuickFill !== false ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                formData.showDemoQuickFill !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* License & Activation Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3
            onClick={handleSecretIconClick}
            onMouseDown={handleSecretTouchStart}
            onMouseUp={handleSecretTouchEnd}
            onMouseLeave={handleSecretTouchEnd}
            onTouchStart={handleSecretTouchStart}
            onTouchEnd={handleSecretTouchEnd}
            title="Lisensi Aplikasi"
            className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 select-none cursor-pointer group"
          >
            <span className="p-1 rounded-lg transition-transform duration-200 active:scale-90 group-hover:bg-slate-100 dark:group-hover:bg-slate-800">
              <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </span>
            <span>Lisensi & Aktivasi Aplikasi</span>
          </h3>
          {isDevModeUnlocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              <Unlock className="h-3 w-3" /> Dev Mode Aktif
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Aplikasi ini dilindungi lisensi perangkat. Mode Trial dibatasi maksimal 5 transaksi. Aktifkan lisensi penuh untuk melepas semua batas.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Status Lisensi:</span>
              {isLicensed ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> Full Version (Aktif)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full">
                  <AlertTriangle className="h-3 w-3" /> Mode Trial / Evaluasi
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {isLicensed 
                ? 'Terima kasih! Lisensi aktif selamanya untuk 1 perangkat ini.' 
                : 'Batas transaksi tersisa atau silakan masukkan Serial Key lisensi Anda.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLicenseModal && (
              <button
                type="button"
                onClick={onOpenLicenseModal}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  isLicensed 
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10'
                }`}
              >
                {isLicensed ? 'Lihat Detail Lisensi' : 'Aktivasi Lisensi'}
              </button>
            )}
          </div>
        </div>

        {/* Developer Mode Unlocked Panel in Settings */}
        {isDevModeUnlocked && (
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/70 dark:bg-indigo-950/30 dark:border-indigo-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-xs text-indigo-950 dark:text-indigo-200">
                <Unlock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Developer Mode: License Generator Pembuat Aplikasi</span>
              </div>
              <button
                type="button"
                onClick={handleLockDevMode}
                className="px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 text-xs font-bold flex items-center gap-1 transition"
              >
                <Lock className="h-3.5 w-3.5" /> Kunci Akses Dev
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Target Device ID Pelanggan:
                </label>
                <input
                  type="text"
                  placeholder="DEV-XXXX-XXXX"
                  value={customDevIdInput}
                  onChange={(e) => setCustomDevIdInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 font-mono text-xs font-bold text-slate-800 dark:text-white"
                />
                <p className="text-[10px] text-slate-500">
                  Device ID Perangkat Ini: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currentDevId}</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                  <span>SERIAL KEY YANG DIHASILKAN:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const calculated = getCorrectSerialForDevice(customDevIdInput.trim() || currentDevId);
                      navigator.clipboard.writeText(calculated);
                      setCopiedTargetSerial(true);
                      setTimeout(() => setCopiedTargetSerial(false), 2000);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                  >
                    {copiedTargetSerial ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" /> Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Salin Serial
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-sm font-black text-indigo-900 dark:text-indigo-200 select-all tracking-wider">
                  {getCorrectSerialForDevice(customDevIdInput.trim() || currentDevId) || 'Format Device ID salah'}
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                  Master Key Alternatif: <code className="font-mono font-bold text-slate-700 dark:text-slate-300">LIC-FULL-ACCESS</code>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Developer Password Modal */}
        {showDevPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  <span>Buka Akses Developer</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDevPasswordModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Fitur ini khusus pembuat aplikasi untuk meng-generate Serial Key lisensi.
              </p>

              <form onSubmit={handleVerifyDevPassword} className="space-y-3">
                <input
                  type="password"
                  placeholder="Masukkan password developer..."
                  value={devPasswordInput}
                  onChange={(e) => setDevPasswordInput(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {devPasswordError && (
                  <p className="text-xs text-red-500 font-medium">{devPasswordError}</p>
                )}

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDevPasswordModal(false)}
                    className="px-3.5 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                  >
                    Buka Akses
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Backup & Restore Database Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Backup & Restore Database Aplikasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Simpan seluruh data usaha (pesanan, pelanggan, histori produksi & profil) ke file cadangan `.json` atau pulihkan data dari file backup sebelumnya.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Lokal & Aman
            </span>
          </div>
        </div>

        {/* Pengaturan Pengingat & Notifikasi Backup */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 dark:border-indigo-900/60 dark:bg-indigo-950/20 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                  <BellRing className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Pengaturan Pengingat (Notifikasi) Backup Database
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Peringatan otomatis akan muncul di layar utama ketika sudah tiba saatnya mencadangkan data agar terhindar dari risiko kehilangan data.
              </p>
            </div>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {formData.backupReminderEnabled !== false ? 'Pengingat Aktif' : 'Pengingat Nonaktif'}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleUpdateBackupSettings(
                    formData.backupReminderEnabled === false ? true : false,
                    formData.backupReminderInterval || '7_days'
                  )
                }
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  formData.backupReminderEnabled !== false
                    ? 'bg-indigo-600 dark:bg-indigo-500'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={formData.backupReminderEnabled !== false}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    formData.backupReminderEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Pilihan Interval Waktu (1 Hari, 7 Hari, 1 Bulan) */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              Pilih Interval Waktu Pengingat:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pilihan 1: 1 Hari */}
              <button
                type="button"
                onClick={() =>
                  handleUpdateBackupSettings(
                    formData.backupReminderEnabled !== false,
                    '1_day'
                  )
                }
                className={`relative p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  (formData.backupReminderInterval || '7_days') === '1_day'
                    ? 'border-indigo-600 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-indigo-600/20 dark:border-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                      1D
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      1 Hari (Harian)
                    </span>
                  </div>
                  {(formData.backupReminderInterval || '7_days') === '1_day' && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-4 ring-indigo-100 dark:ring-indigo-950" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Sangat direkomendasikan jika konveksi memiliki pesanan masuk & transaksi pembayaran setiap hari.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                    Perlindungan Maksimal
                  </span>
                </div>
              </button>

              {/* Pilihan 2: 7 Hari */}
              <button
                type="button"
                onClick={() =>
                  handleUpdateBackupSettings(
                    formData.backupReminderEnabled !== false,
                    '7_days'
                  )
                }
                className={`relative p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  (formData.backupReminderInterval || '7_days') === '7_days'
                    ? 'border-indigo-600 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-indigo-600/20 dark:border-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-black">
                      7D
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      7 Hari (Mingguan)
                    </span>
                  </div>
                  {(formData.backupReminderInterval || '7_days') === '7_days' && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-4 ring-indigo-100 dark:ring-indigo-950" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Pilihan standar seimbang untuk pencadangan rutin operasional setiap akhir pekan.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                    Rekomendasi Standar
                  </span>
                </div>
              </button>

              {/* Pilihan 3: 1 Bulan */}
              <button
                type="button"
                onClick={() =>
                  handleUpdateBackupSettings(
                    formData.backupReminderEnabled !== false,
                    '1_month'
                  )
                }
                className={`relative p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  (formData.backupReminderInterval || '7_days') === '1_month'
                    ? 'border-indigo-600 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-indigo-600/20 dark:border-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-black">
                      1M
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      1 Bulan (Bulanan)
                    </span>
                  </div>
                  {(formData.backupReminderInterval || '7_days') === '1_month' && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 ring-4 ring-indigo-100 dark:ring-indigo-950" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  Pengingat berkala setiap 30 hari untuk rekapitulasi tutup buku dan arsip bulanan.
                </p>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                    Arsip Bulanan
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Status Live Cadangan & Info */}
          <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/90 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    backupReminderStatus.isDue
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  }`}
                >
                  {backupReminderStatus.isDue ? (
                    <>
                      <ShieldAlert className="h-3 w-3" />
                      Perlu Dicadangkan (Jatuh Tempo)
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Status Cadangan: Up-to-Date (Aman)
                    </>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  • Interval:{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {backupReminderStatus.intervalLabel}
                  </strong>
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                <span>
                  Backup Terakhir:{' '}
                  <strong className="text-slate-900 dark:text-white font-semibold">
                    {backupReminderStatus.formattedLastBackup}
                  </strong>
                  {backupReminderStatus.daysSinceLastBackup !== null && (
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] ml-1">
                      ({backupReminderStatus.daysSinceLastBackup} hari lalu)
                    </span>
                  )}
                </span>
                {backupReminderStatus.nextBackupDate && (
                  <span>
                    Jadwal Berikutnya:{' '}
                    <strong className="text-slate-900 dark:text-white font-semibold">
                      {new Date(backupReminderStatus.nextBackupDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </strong>
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold shadow-xs transition shrink-0 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Unduh Backup Sekarang
            </button>
          </div>
        </div>

        {/* Action Grid Buttons: Unduh, Restore, Hapus, Reset */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Aksi Cepat Database:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Download Backup */}
            <button
              type="button"
              onClick={handleExportBackup}
              className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center group"
            >
              <div className="p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 group-hover:scale-110 transition">
                <Download className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-extrabold block">Unduh Backup (.json)</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">Simpan cadangan data</span>
              </div>
            </button>

            {/* Import / Restore Backup */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-900 dark:text-blue-200 flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center group"
            >
              <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/60 group-hover:scale-110 transition">
                <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="text-xs font-extrabold block">Restore Database (.json)</span>
                <span className="text-[10px] text-blue-700 dark:text-blue-400 block mt-0.5">Upload & timpa data</span>
              </div>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />

            {/* Hapus Semua Data Orderan */}
            <button
              type="button"
              onClick={() => {
                setDeleteOrdersPassword('');
                setDeleteOrdersError('');
                setIsDeleteOrdersModalOpen(true);
              }}
              className="p-4 rounded-xl border border-red-200 dark:border-red-900/80 bg-red-50/50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-900 dark:text-red-200 flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center group"
            >
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-900/60 group-hover:scale-110 transition">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <span className="text-xs font-extrabold block">Hapus Semua Transaksi & Belanja</span>
                <span className="text-[10px] text-red-700 dark:text-red-400 block mt-0.5">Order, Transaksi & Pengeluaran</span>
              </div>
            </button>

            {/* Reset Database to Initial Sample Data */}
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 flex flex-col items-center justify-center gap-2 transition cursor-pointer text-center group"
            >
              <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-900/60 group-hover:scale-110 transition">
                <RotateCcw className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-extrabold block">Reset ke Default</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 block mt-0.5">Kembalikan data contoh</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Backend PHP & Database MySQL Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Backend REST API PHP & Database MySQL
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Native PDO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Modul backend siap pakai untuk instalasi di XAMPP, Laragon, cPanel, atau VPS dengan database MySQL / MariaDB relasional.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickDownloadPhpZip}
              disabled={isDownloadingPhpZip}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 dark:text-indigo-300 text-xs font-bold transition border border-indigo-200 dark:border-indigo-800 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isDownloadingPhpZip ? 'Mengompres...' : 'Download ZIP Backend'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPhpModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-600/10 transition cursor-pointer"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Buka Source Code & Dokumentasi</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
              <Database className="h-4 w-4 text-emerald-500" />
              <span>Relasional MySQL</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Tabel orders, order_items, payments, customers, expenses, users, pricelist & logs terindeks lengkap.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>Tanpa Framework Berat</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              PHP Native murni berbasis PDO & CORS Headers, super ringan dan berjalan mulus di shared hosting cPanel manapun.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-150 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              <span>Siap Multi-Perangkat</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              Dilengkapi token autentikasi (Owner, Admin, Produksi) dan endpoint CRUD transaksi real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Online Deployment & Hosting Guide */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Panduan Mengonlinekan Aplikasi (Hosting Pribadi)
          </h3>
          <span className="rounded-full bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 text-[10px] font-black text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Export Ready
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Aplikasi ini dibangun menggunakan <strong>React + TypeScript + Vite</strong> yang dapat di-onlinekan dengan mudah ke berbagai jenis hosting pribadi seperti <strong>cPanel (Hostinger, Niagahoster, DomaiNesia)</strong>, <strong>VPS / Nginx</strong>, atau <strong>Vercel / Netlify / Cloud Run</strong>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Method 1: Local Installation in Drive C */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
              <Monitor className="h-4 w-4 text-indigo-500" />
              <span>Opsi 1: Installasi Local (Drive C:)</span>
            </div>
            <ol className="list-decimal list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-1 font-medium">
              <li>Download Node.js (v18+) dari <strong>nodejs.org</strong>.</li>
              <li>Ekstrak ZIP project ke <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px]">C:\order-management-system</code>.</li>
              <li>Buka CMD, ketik: <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px]">cd C:\order-management-system</code>.</li>
              <li>Jalankan <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px]">npm install</code> lalu <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px]">npm run dev</code>.</li>
            </ol>
          </div>

          {/* Method 2: Installer .EXE (Electron) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2 border-indigo-200 dark:border-indigo-800/50">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-950 dark:text-indigo-200">
              <FileCode className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Opsi 2: Build Application (.EXE)</span>
            </div>
            <ol className="list-decimal list-inside text-[11px] text-slate-700 dark:text-slate-300 space-y-1 font-medium">
              <li>Export project ZIP & ekstrak ke laptop.</li>
              <li>Install Electron: <code className="px-1 py-0.5 bg-indigo-100 dark:bg-indigo-900 rounded font-mono text-[10px]">npm install -D electron electron-builder</code>.</li>
              <li>Build .exe installer: <code className="px-1 py-0.5 bg-indigo-100 dark:bg-indigo-900 rounded font-mono text-[10px]">npx electron-builder</code>.</li>
              <li>File installer <code className="px-1 py-0.5 bg-indigo-100 dark:bg-indigo-900 rounded font-mono text-[10px]">Setup.exe</code> siap di folder <code className="px-1 py-0.5 bg-indigo-100 dark:bg-indigo-900 rounded font-mono text-[10px]">dist/</code>.</li>
            </ol>
          </div>

          {/* Method 3: cPanel / Shared Hosting */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-amber-50/50 dark:bg-amber-950/20 space-y-2 border-amber-200 dark:border-amber-800/40">
            <div className="flex items-center gap-2 text-xs font-black text-amber-950 dark:text-amber-200">
              <HardDrive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Opsi 3: Shared Hosting / cPanel (Solusi Bebas Error npm)</span>
            </div>
            <ol className="list-decimal list-inside text-[11px] text-slate-700 dark:text-slate-300 space-y-1 font-medium">
              <li><strong>Jangan run npm di cPanel:</strong> Build di laptop Anda terlebih dahulu.</li>
              <li>Di laptop: Jalankan <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded font-mono text-[10px]">npm run build</code>.</li>
              <li>Buka folder hasil <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded font-mono text-[10px]">dist/</code>, zip seluruh isinya.</li>
              <li>Upload ZIP ke <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded font-mono text-[10px]">public_html</code> di cPanel lalu Extract.</li>
              <li>Buat file <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded font-mono text-[10px]">.htaccess</code> agar URL routing tidak 404 saat direfresh.</li>
            </ol>
          </div>

          {/* Method 4: VPS / Server */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900 dark:text-white">
              <Server className="h-4 w-4 text-emerald-500" />
              <span>Opsi 4: VPS / Cloud Server</span>
            </div>
            <ol className="list-decimal list-inside text-[11px] text-slate-600 dark:text-slate-300 space-y-1 font-medium">
              <li>Upload source code ke VPS.</li>
              <li>Jalankan <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px]">npm install</code> & <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px]">npm run build</code>.</li>
              <li>Jalankan <code className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono text-[10px]">npm start</code> (Node.js port 3000).</li>
            </ol>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tampilan & Tema Application */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Tampilan & Tema (Mode Gelap / Terang)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sesuaikan mode tampilan aplikasi sesuai kenyamanan mata atau ikuti pengaturan perangkat Anda.
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {theme === 'light' ? '☀️ Mode Terang Aktif' : theme === 'dark' ? '🌙 Mode Gelap Aktif' : '💻 Otomatis Sistem Aktif'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* Pilihan 1: Mode Terang */}
            <button
              type="button"
              onClick={() => onThemeChange && onThemeChange('light')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group relative ${
                theme === 'light'
                  ? 'border-amber-500 bg-amber-50/70 text-amber-950 ring-2 ring-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl transition ${
                    theme === 'light'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 group-hover:scale-105'
                  }`}>
                    <Sun className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black block text-slate-900 dark:text-white">
                      Mode Terang (Light)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                      Latar putih cerah
                    </span>
                  </div>
                </div>

                {theme === 'light' ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-amber-400" />
                )}
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Tampilan cerah dengan kontras tinggi yang nyaman dan jelas saat digunakan di siang hari atau ruangan terang.
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                  {theme === 'light' ? '✓ Sedang Dipakai' : 'Pilih Mode Ini'}
                </span>
              </div>
            </button>

            {/* Pilihan 2: Mode Gelap */}
            <button
              type="button"
              onClick={() => onThemeChange && onThemeChange('dark')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group relative ${
                theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-100 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl transition ${
                    theme === 'dark'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 group-hover:scale-105'
                  }`}>
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black block text-slate-900 dark:text-white">
                      Mode Gelap (Dark)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                      Latar gelap elegan
                    </span>
                  </div>
                </div>

                {theme === 'dark' ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-indigo-400" />
                )}
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Tampilan gelap elegan yang mengurangi silau, ramah untuk mata di ruangan redup/malam hari, dan hemat daya.
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400">
                  {theme === 'dark' ? '✓ Sedang Dipakai' : 'Pilih Mode Ini'}
                </span>
              </div>
            </button>

            {/* Pilihan 3: Otomatis Sistem */}
            <button
              type="button"
              onClick={() => onThemeChange && onThemeChange('system')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between group relative ${
                theme === 'system'
                  ? 'border-blue-500 bg-blue-50/70 text-blue-950 ring-2 ring-blue-500/30 dark:bg-blue-950/40 dark:text-blue-100 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl transition ${
                    theme === 'system'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 group-hover:scale-105'
                  }`}>
                    <Monitor className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black block text-slate-900 dark:text-white">
                      Otomatis Sistem (Auto)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                      Ikuti setelan OS
                    </span>
                  </div>
                </div>

                {theme === 'system' ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <span className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-700 group-hover:border-blue-400" />
                )}
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                Menyesuaikan tampilan secara cerdas mengikuti tema perangkat (Windows, Mac, Android, iOS) yang Anda gunakan.
              </p>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400">
                  {theme === 'system' ? '✓ Sedang Dipakai' : 'Pilih Mode Ini'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Identitas Bisnis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Profil Usaha & Logo Brand
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pengaturan identitas brand usaha untuk kop nota, invoice cetak, SPK kerja, dan tampilan header aplikasi.
              </p>
            </div>
          </div>

          {/* Hidden File Input for Logo */}
          <input
            ref={logoFileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            onChange={handleLogoFileChange}
            className="hidden"
          />

          {/* Logo Brand Upload from Computer & Preview */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Logo Usaha (Gambar Profil Brand)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <LinkIcon className="h-3 w-3" />
                <span>{showUrlInput ? 'Sembunyikan Input URL' : 'Atau Masukkan URL Gambar'}</span>
              </button>
            </div>

            {/* Drag & Drop / Preview Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingLogo(true);
              }}
              onDragLeave={() => setIsDraggingLogo(false)}
              onDrop={handleLogoDrop}
              className={`relative rounded-2xl border-2 border-dashed p-4 transition-all flex flex-col sm:flex-row items-center gap-5 ${
                isDraggingLogo
                  ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 scale-[1.01]'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Logo Preview Avatar */}
              <div className="relative shrink-0 group">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shadow-sm">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo Usaha"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-2 text-center">
                      <ImageIcon className="h-8 w-8 mb-1 opacity-60" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">Tanpa Logo</span>
                    </div>
                  )}
                </div>
                {formData.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                    title="Hapus Logo"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700 transition cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons & Instructions */}
              <div className="flex-1 text-center sm:text-left space-y-2.5">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    {formData.logoUrl ? 'Logo Usaha Saat Ini' : 'Pilih Logo dari Komputer / Laptop Anda'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Tarik (drag & drop) gambar ke kotak ini atau klik tombol di bawah untuk memilih file foto logo dari komputer Anda.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <FileUp className="h-4 w-4" />
                    <span>{formData.logoUrl ? 'Ganti Logo dari Komputer' : 'Pilih File dari Komputer'}</span>
                  </button>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 font-bold text-xs transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Logo</span>
                    </button>
                  )}

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    PNG, JPG, WEBP, SVG (Maks 10MB)
                  </span>
                </div>

                {logoUploadError && (
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{logoUploadError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Direct URL Input Field */}
            {showUrlInput && (
              <div className="pt-2 animate-fadeIn">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Direct Image URL (Tautan Online Logo)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://contoh.com/logo.png"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Clear URL"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="sm:col-span-2">
              <label className="text-xs font-black text-slate-900 dark:text-white">Nama Usaha / Perusahaan</label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
                Nama usaha yang akan tercantum di seluruh dokumen (Nota, SPK, Invoice, WhatsApp) dan Header Sistem.
              </p>
              <input
                type="text"
                required
                placeholder="Contoh: BUMMI SABLON & KONVEKSI"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm font-black text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 shadow-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alamat Lengkap Usaha</label>
              <textarea
                rows={2}
                placeholder="Jl. Raya No. ..., Kota / Kabupaten ..."
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nomor WhatsApp Usaha (CS / Kasir)</label>
              <input
                type="text"
                placeholder="081234567890"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Resmi Usaha</label>
              <input
                type="email"
                placeholder="info@bisnisanda.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Akun Instagram</label>
              <input
                type="text"
                placeholder="@nama_brand"
                value={formData.instagram}
                onChange={(e) => setFormData((prev) => ({ ...prev, instagram: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Website / Portfolio</label>
              <input
                type="text"
                placeholder="www.bisnisanda.com"
                value={formData.website}
                onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2 p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Target Omset Penjualan Bulanan (Rp)</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Target omset bulanan usaha untuk memantau progress persentase pencapaian di halaman Laporan Penjualan.
              </p>
              <input
                type="number"
                min={0}
                step={1000000}
                value={formData.monthlySalesTarget ?? 50000000}
                onChange={(e) => setFormData((prev) => ({ ...prev, monthlySalesTarget: Number(e.target.value) || 0 }))}
                className="mt-2 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-extrabold text-indigo-900 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Informasi Rekening Bank */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Informasi Rekening Bank
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Bank</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData((prev) => ({ ...prev, bankName: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nomor Rekening</label>
              <input
                type="text"
                value={formData.bankAccount}
                onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Atas Nama (Pemilik)</label>
              <input
                type="text"
                value={formData.bankHolder}
                onChange={(e) => setFormData((prev) => ({ ...prev, bankHolder: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Catatan Nota */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            Catatan Otomatis pada Nota
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan Bawah Nota / Invoice</label>
              <textarea
                rows={2}
                value={formData.invoiceNotes}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNotes: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

          </div>
        </div>

        {/* Section Tentang Aplikasi & Pembuat */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-6 rounded-3xl text-white shadow-xl border border-indigo-800/50 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-amber-400">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-950 px-2.5 py-0.5 rounded-full border border-indigo-800">
                  Sistem Informasi ERP
                </span>
                <h3 className="text-base font-black text-white mt-0.5">
                  Tentang Aplikasi & Pembuat
                </h3>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-white/10 text-indigo-200 text-xs font-mono font-bold self-start sm:self-auto border border-white/10">
              Versi 2.5.0 Enterprise
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div>
                <h4 className="font-extrabold text-indigo-200 text-xs uppercase tracking-wider mb-1">
                  Deskripsi Aplikasi
                </h4>
                <p className="text-slate-300 leading-relaxed text-xs">
                  Sistem Informasi Manajemen Kasir (POS), Workshop KanBan Produksi, serta Pencatatan Belanja Material & Upah Borongan terintegrasi untuk Industri Konveksi & Sablon Kaos.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider block">
                  Fitur Utama System:
                </span>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                  <li>Kasir POS Multi Variasi Ukuran & DP/Pelunasan</li>
                  <li>Kanban Workflow Produksi (Potong-Sablon-Jahit-QC)</li>
                  <li>Buku Pengeluaran Belanja Kain/Tinta & Gaji Borongan</li>
                  <li>Laporan Omzet, Pengeluaran, & Laba Bersih Realtime</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-extrabold text-indigo-200 text-xs uppercase tracking-wider mb-1">
                  Informasi Pengembang / Pembuat
                </h4>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                      OMS
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">Order Management System Team</p>
                      <p className="text-[11px] text-indigo-300 font-bold">Lead Developer & Technology</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between text-slate-300">
                      <span>Hak Cipta:</span>
                      <span className="font-bold text-slate-200">© 2026 Order Management System</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Terverifikasi Aman • Penyimpanan Data Lokal Cloud Backup Ready</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-xs font-extrabold text-white hover:bg-indigo-700 shadow-md transition cursor-pointer"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Seluruh Pengaturan</span>
          </button>
          {savedSuccess && (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs animate-fadeIn border border-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Pengaturan berhasil disimpan!</span>
            </div>
          )}
        </div>
      </form>

      {/* Confirmation Modal for Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-950/60">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Konfirmasi Reset Database
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin mereset seluruh database aplikasi ke data contoh bawaan?
              <br />
              <strong className="text-amber-600 dark:text-amber-400 block mt-1">
                Tindakan ini akan menimpa seluruh pesanan dan data pelanggan saat ini.
              </strong>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetDatabase}
                className="px-4 py-2.5 rounded-xl bg-amber-600 text-xs font-extrabold text-white hover:bg-amber-700 shadow-md"
              >
                Ya, Reset Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete All Orders */}
      {isDeleteOrdersModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsDeleteOrdersModalOpen(false);
              setDeleteOrdersPassword('');
              setDeleteOrdersError('');
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fadeIn"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-full bg-red-100 dark:bg-red-950/60">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Hapus Semua Transaksi & Pengeluaran
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Konfirmasi tindakan sensitif dengan password Owner
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>PERINGATAN: Tindakan ini permanen!</span>
              </p>
              <p className="text-[11px] leading-relaxed text-red-700 dark:text-red-300">
                Seluruh data pesanan/orderan, riwayat transaksi, serta catatan pengeluaran & belanja akan dihapus total secara permanen dari database.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDeleteAllOrders();
              }}
              className="space-y-3.5 pt-1"
            >
              {deleteOrdersError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-fadeIn">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{deleteOrdersError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Masukkan Password Owner
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showDeleteOrdersPassword ? 'text' : 'password'}
                    value={deleteOrdersPassword}
                    onChange={(e) => {
                      setDeleteOrdersPassword(e.target.value);
                      if (deleteOrdersError) setDeleteOrdersError('');
                    }}
                    placeholder="Masukkan password owner..."
                    autoFocus
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-red-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-900 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeleteOrdersPassword(!showDeleteOrdersPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showDeleteOrdersPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteOrdersModalOpen(false);
                    setDeleteOrdersPassword('');
                    setDeleteOrdersError('');
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-red-600 text-xs font-extrabold text-white hover:bg-red-700 shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Konfirmasi Hapus Orderan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Source Code & Integrasi Backend PHP + MySQL */}
      <PhpBackendManagerModal
        isOpen={isPhpModalOpen}
        onClose={() => setIsPhpModalOpen(false)}
      />
    </div>
  );
};

