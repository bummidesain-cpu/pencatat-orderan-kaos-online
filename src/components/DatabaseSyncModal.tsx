import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  HelpCircle,
  Loader2,
  RefreshCw,
  Server,
  UploadCloud,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { apiClient, ConnectionInfo, getActiveBackendUrl, setActiveBackendUrl } from '../lib/apiClient';
import { pushAllToBackend, syncFromBackend } from '../lib/storage';

interface DatabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefreshed?: () => void;
}

export const DatabaseSyncModal: React.FC<DatabaseSyncModalProps> = ({
  isOpen,
  onClose,
  onDataRefreshed,
}) => {
  const [backendUrl, setBackendUrl] = useState('');
  const [connection, setConnection] = useState<ConnectionInfo>(apiClient.getConnectionInfo());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentUrl = getActiveBackendUrl();
      setBackendUrl(currentUrl);
      setTestResult(null);
      setSyncFeedback(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = apiClient.subscribe((info) => {
      setConnection(info);
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setSyncFeedback(null);
    setActiveBackendUrl(backendUrl);

    const res = await apiClient.testConnection(backendUrl);
    setIsTesting(false);
    setTestResult({
      success: res.success,
      message: res.message,
    });
  };

  const handlePushAllToMySQL = async () => {
    setIsPushing(true);
    setSyncFeedback(null);
    setActiveBackendUrl(backendUrl);

    try {
      const res = await pushAllToBackend();
      setIsPushing(false);
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: res.message || 'Semua data lokal berhasil dikirim dan tersimpan ke MySQL!',
        });
      } else {
        setSyncFeedback({
          type: 'error',
          message: res.message || 'Gagal mengirim data ke MySQL.',
        });
      }
    } catch (err: any) {
      setIsPushing(false);
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan saat sinkronisasi data.',
      });
    }
  };

  const handlePullFromMySQL = async () => {
    setIsPulling(true);
    setSyncFeedback(null);
    setActiveBackendUrl(backendUrl);

    try {
      const res = await syncFromBackend();
      setIsPulling(false);
      if (res.success) {
        setSyncFeedback({
          type: 'success',
          message: res.message || 'Data terbaru berhasil ditarik dari MySQL!',
        });
        if (onDataRefreshed) {
          onDataRefreshed();
        }
      } else {
        setSyncFeedback({
          type: 'error',
          message: res.message || 'Gagal menarik data dari MySQL.',
        });
      }
    } catch (err: any) {
      setIsPulling(false);
      setSyncFeedback({
        type: 'error',
        message: err?.message || 'Terjadi kesalahan saat menarik data.',
      });
    }
  };

  const isConnected = connection.status === 'connected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl font-bold ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Integrasi Database MySQL & PHP
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3" /> Terhubung
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3" /> Offline / Belum Terhubung
                    </>
                  )}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hubungkan antarmuka aplikasi ini langsung ke database MySQL Anda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="mt-5 space-y-5">
          {/* Status Box */}
          <div
            className={`rounded-xl p-4 border ${
              isConnected
                ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200'
                : 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider">Status Koneksi Server:</span>
              </div>
              {connection.latencyMs !== undefined && (
                <span className="text-xs font-mono font-bold bg-white/70 dark:bg-slate-900/70 px-2 py-0.5 rounded-md">
                  {connection.latencyMs} ms
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold">
              {connection.message || (isConnected ? 'Koneksi ke database MySQL aktif dan sinkron.' : 'Sedang tidak terhubung ke PHP MySQL backend.')}
            </p>
            {connection.databaseName && (
              <p className="text-xs opacity-80 mt-0.5">Database: <strong className="font-mono">{connection.databaseName}</strong></p>
            )}
          </div>

          {/* URL Configuration Input */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              URL Backend PHP REST API:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={backendUrl}
                  onChange={(e) => setBackendUrl(e.target.value)}
                  placeholder="http://localhost/order-api atau https://domain.com/api"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 font-mono shadow-2xs focus:border-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 shrink-0"
              >
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                {isTesting ? 'Menguji...' : 'Test Koneksi'}
              </button>
            </div>

            {/* Quick Helper Presets */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => {
                  setBackendUrl('http://localhost/order-api');
                }}
                className="rounded-lg bg-slate-200/70 hover:bg-slate-300 px-2 py-1 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-mono text-[11px]"
              >
                XAMPP (localhost/order-api)
              </button>
              <button
                type="button"
                onClick={() => {
                  setBackendUrl(typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api');
                }}
                className="rounded-lg bg-slate-200/70 hover:bg-slate-300 px-2 py-1 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-mono text-[11px]"
              >
                Domain Saat Ini (/api)
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-3 rounded-lg p-3 text-xs font-semibold ${
                  testResult.success
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          {/* Sync Actions (Push & Pull) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Push to MySQL */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                  <UploadCloud className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Kirim Data Lokal ke MySQL
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Upload seluruh orderan, pelanggan, pengeluaran & pengaturan dari browser ke database MySQL.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePushAllToMySQL}
                disabled={isPushing}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
              >
                {isPushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {isPushing ? 'Mengirim Data...' : 'Push Semua ke MySQL'}
              </button>
            </div>

            {/* Pull from MySQL */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-800/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                  <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Tarik Data dari MySQL
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sinkronkan dan muat ulang data pesanan & transaksi terbaru langsung dari database MySQL.
                </p>
              </div>
              <button
                type="button"
                onClick={handlePullFromMySQL}
                disabled={isPulling}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50"
              >
                {isPulling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isPulling ? 'Menarik Data...' : 'Tarik dari MySQL (Pull)'}
              </button>
            </div>
          </div>

          {/* Sync Feedback Message */}
          {syncFeedback && (
            <div
              className={`rounded-xl p-3.5 text-xs font-bold flex items-center gap-2 ${
                syncFeedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{syncFeedback.message}</span>
            </div>
          )}

          {/* Troubleshooting Info */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <h4 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-indigo-500" />
              Panduan Mengapa Data Tidak Masuk ke MySQL:
            </h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Cek Kredensial MySQL:</strong> Buka file <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">backend/config/database.php</code> dan pastikan <code className="font-mono">DB_NAME</code>, <code className="font-mono">DB_USER</code>, dan <code className="font-mono">DB_PASS</code> sudah sesuai dengan database phpMyAdmin Anda.
              </li>
              <li>
                <strong>Import Database SQL:</strong> Pastikan Anda sudah mengimport tabel dari file <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">backend/database.sql</code> ke database MySQL Anda.
              </li>
              <li>
                <strong>URL Backend:</strong> Jika menggunakan XAMPP di komputer sendiri, gunakan <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">http://localhost/order-api</code>. Jika di hosting cPanel, gunakan <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[11px]">https://domainanda.com/api</code>.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
