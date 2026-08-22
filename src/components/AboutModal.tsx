import React from 'react';
import {
  AppWindow,
  CheckCircle2,
  Code2,
  ExternalLink,
  Heart,
  Info,
  Kanban,
  Layers,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  appName = 'Order Management System',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 text-amber-400">
              <Sparkles className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
                Informasi Sistem
              </span>
              <h2 className="text-xl font-black text-white mt-0.5">Tentang Aplikasi & Pembuat</h2>
            </div>
          </div>
          <p className="text-xs text-indigo-200/80 leading-relaxed max-w-lg">
            Sistem ERP & POS Terintegrasi Manajemen Usaha Konveksi, Vendor Apparel, dan Jasa Sablon Kaos.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Card 1: Identitas Aplikasi */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <AppWindow className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Identitas Aplikasi</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                v2.5.0 Enterprise
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Nama Sistem:</span>
                <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{appName} - Apparel POS & ERP</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Tipe Lisensi:</span>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Single Vendor Production License
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[11px] text-slate-500 font-extrabold uppercase">Deskripsi Ringkas:</span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                  Aplikasi khusus konveksi & vendor sablon kaos untuk pencatatan pesanan (order), sistem tracking produksi Kanban workshop, pencatatan pengeluaran belanja bahan baku/gaji borongan, serta analisa keuangan laba bersih.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Pembuat & Developer Credits */}
          <div className="bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-indigo-950/30 dark:to-slate-900 p-5 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
            <div className="flex items-center gap-2 border-b border-indigo-200/60 dark:border-indigo-900/60 pb-3">
              <Code2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Pengembang & Tim Kreatif</h3>
            </div>

            <div className="text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Nama Pembuat / Developer:
                </span>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white font-black text-xs">
                    OMS
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white text-sm">Order Management System Team</p>
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">Tech Development</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Fitur Unggulan Sistem */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-500" /> Modul & Fitur Utama Aplikasi
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <ShoppingBag className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">Kasir POS & Pelunasan DP</span>
                  <p className="text-[11px] text-slate-500">Pencatatan variasi ukuran kaos, DP, & pembayaran lunas.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <Kanban className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">Workflow Produksi KanBan</span>
                  <p className="text-[11px] text-slate-500">Tracking Potong, Sablon, Jahit, QC hingga Siap Kirim.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-start gap-2.5">
                <Receipt className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">Pencatatan Belanja & Gaji</span>
                  <p className="text-[11px] text-slate-500">Riwayat belanja bahan baku & upah borongan karyawan.</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1 font-bold">
            <span>Dibuat dengan</span>
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            <span>oleh Order Management System © 2026</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
