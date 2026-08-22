import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Settings,
  ShieldAlert,
  X,
} from 'lucide-react';
import { BackupReminderStatus, exportDatabaseBackup } from '../lib/storage';
import { BusinessSettings } from '../types';

interface BackupReminderBannerProps {
  settings: BusinessSettings;
  status: BackupReminderStatus;
  onOpenSettings: () => void;
  onBackupSuccess: () => void;
}

export const BackupReminderBanner: React.FC<BackupReminderBannerProps> = ({
  status,
  onOpenSettings,
  onBackupSuccess,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!status.enabled || !status.isDue || isDismissed) {
    return null;
  }

  const handleDownloadNow = () => {
    try {
      setIsDownloading(true);
      exportDatabaseBackup();
      setDownloadSuccess(true);
      onBackupSuccess();
      setTimeout(() => {
        setIsDismissed(true);
      }, 3500);
    } catch {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/90 p-4 shadow-sm dark:border-amber-700/60 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs dark:bg-amber-600">
            {downloadSuccess ? (
              <CheckCircle2 className="h-5 w-5 animate-scaleUp" />
            ) : (
              <ShieldAlert className="h-5 w-5 animate-pulse" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Peringatan Cadangan (Backup) Database
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                <Clock className="h-3 w-3" />
                Jadwal: {status.intervalLabel}
              </span>
            </div>

            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed max-w-2xl">
              {downloadSuccess ? (
                <strong className="text-emerald-700 dark:text-emerald-400">
                  ✓ File backup database (.json) berhasil diunduh ke perangkat Anda. Jadwal pengingat telah diperbarui!
                </strong>
              ) : status.daysSinceLastBackup === null ? (
                <span>
                  Database sistem <strong>belum pernah dicadangkan</strong>. Segera unduh file backup <code className="bg-amber-200/60 dark:bg-amber-900/40 px-1 rounded font-bold">.json</code> untuk mengamankan data orderan, pelanggan, dan laporan keuangan usaha Anda.
                </span>
              ) : (
                <span>
                  Terakhir kali backup dilakukan <strong>{status.daysSinceLastBackup} hari yang lalu</strong> ({status.formattedLastBackup}). Demi keamanan data, disarankan untuk mengunduh cadangan terbaru.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          {!downloadSuccess && (
            <>
              <button
                type="button"
                onClick={handleDownloadNow}
                disabled={isDownloading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3.5 py-2 text-xs font-black text-white shadow-xs transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>{isDownloading ? 'Mengunduh...' : 'Unduh Backup Sekarang'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="inline-flex items-center gap-1 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-white/80 dark:bg-slate-900/80 hover:bg-amber-100/60 dark:hover:bg-slate-800 px-3 py-2 text-xs font-bold text-amber-900 dark:text-amber-200 transition cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Atur Jadwal</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-amber-700/80 hover:bg-amber-200/60 dark:text-amber-400 dark:hover:bg-amber-900/50 transition cursor-pointer"
            title="Tutup pengingat untuk sesi ini"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
