import React, { useState } from 'react';
import { Copy, ExternalLink, MessageSquare, Send, X } from 'lucide-react';
import { generateWAInvoiceUrl } from '../lib/utils';
import { BusinessSettings, Order } from '../types';

interface WhatsAppModalProps {
  isOpen: boolean;
  type?: 'nota' | string;
  order: Order;
  settings?: BusinessSettings;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  order,
  settings,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !order) return null;

  const waUrl = generateWAInvoiceUrl(
    order.customerPhone,
    order.customerName,
    order.orderNumber,
    order.grandTotal,
    order.remainingBalance,
    settings?.name
  );

  // Extract the text parameter from the URL for text display
  const messageText = decodeURIComponent(waUrl.split('text=')[1] || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWA = () => {
    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-600 px-6 py-4 text-white dark:border-emerald-700 dark:bg-emerald-700">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 fill-current" />
            <h3 className="text-base font-semibold">
              Kirim Nota Invoice via WhatsApp
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-emerald-100 hover:bg-emerald-500 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Penerima (Customer)
            </label>
            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {order.customerName} ({order.customerPhone})
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Pesan WhatsApp Otomatis
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium dark:text-indigo-400"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Tersalin!' : 'Salin Pesan'}
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 max-h-60 overflow-y-auto">
              {messageText}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 px-6 py-4 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleOpenWA}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md transition"
          >
            <Send className="h-4 w-4" />
            <span>Buka WhatsApp Web / App</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </div>
  );
};
