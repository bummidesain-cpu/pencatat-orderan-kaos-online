import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckSquare,
  FileText,
  Printer,
  Scissors,
  Shirt,
  Sparkles,
  X,
} from 'lucide-react';
import { formatDateIndo, formatRupiah, formatCategoryName } from '../lib/utils';
import { BusinessSettings, Order } from '../types';

interface PrintInvoiceModalProps {
  isOpen: boolean;
  order: Order;
  settings: BusinessSettings;
  initialMode?: 'invoice' | 'spk';
  mode?: 'invoice' | 'spk';
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({
  isOpen,
  order,
  settings,
  initialMode = 'invoice',
  mode,
  onClose,
}) => {
  const chosenMode = mode || initialMode;
  const [activeMode, setActiveMode] = useState<'invoice' | 'spk'>(chosenMode);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveMode(mode || initialMode);
  }, [initialMode, mode, order]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `INV-${order.orderNumber.replace('ORD-', '')}`;
  const spkNumber = `SPK-${order.orderNumber.replace('ORD-', '')}`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 my-8 border border-slate-200 dark:border-slate-800">
        {/* Header Bar with Mode Switcher */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-slate-800 px-6 py-4 text-white dark:border-slate-700 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveMode('invoice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeMode === 'invoice'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Nota Invoice (Keuangan)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('spk')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeMode === 'spk'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Scissors className="h-3.5 w-3.5 text-amber-400" />
                <span>SPK Produksi (Jahit & Sablon)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 shadow-md transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 px-3 py-2 text-xs font-extrabold text-slate-200 hover:text-white transition cursor-pointer border border-slate-600/60"
              title="Tutup Jendela (Esc)"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Tutup Jendela</span>
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        {activeMode === 'invoice' ? (
          /* NOTA INVOICE KEUANGAN VIEW */
          <div
            ref={printRef}
            id="printable-nota"
            className="p-8 sm:p-10 bg-white text-slate-900 font-sans leading-normal dark:bg-white dark:text-slate-900"
          >
            {/* Company Branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 mb-6 gap-4">
              <div className="flex items-center gap-4">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt={settings.name}
                    className="h-16 w-16 object-cover rounded-xl border border-slate-200"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                    {settings.name}
                  </h1>
                  <p className="text-xs text-slate-600 max-w-sm mt-0.5">{settings.address}</p>
                  <p className="text-xs font-semibold text-slate-700 mt-1">
                    WA: {settings.phone} | IG: {settings.instagram}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-md mb-2">
                  NOTA / INVOICE PESANAN
                </span>
                <p className="text-lg font-black text-slate-900">{invoiceNumber}</p>
                <p className="text-xs text-slate-600">
                  No. Order: <span className="font-bold">{order.orderNumber}</span>
                </p>
                <p className="text-xs text-slate-600">
                  Tanggal: {formatDateIndo(order.orderDate)}
                </p>
                <p className="text-xs font-semibold text-indigo-900 mt-0.5">
                  Deadline: {formatDateIndo(order.deadline)}
                </p>
              </div>
            </div>

            {/* Customer & Payment Badge Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pemesan / Customer
                </p>
                <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {order.customerName}
                </h2>
                {order.organization && (
                  <p className="text-xs font-semibold text-slate-700">{order.organization}</p>
                )}
                <p className="text-xs text-slate-600 mt-1">WhatsApp: {order.customerPhone}</p>
                <p className="text-xs text-slate-600">Sales/Admin: {order.salesAdmin}</p>
              </div>

              <div className="sm:text-right flex flex-col justify-center sm:items-end">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Status Pembayaran
                </p>
                <span
                  className={`inline-block px-4 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider ${
                    order.paymentStatus === 'Lunas'
                      ? 'bg-emerald-600 text-white'
                      : order.paymentStatus === 'DP'
                      ? 'bg-amber-500 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  {order.paymentStatus === 'Lunas'
                    ? '✓ LUNAS'
                    : order.paymentStatus === 'DP'
                    ? 'DP (SEBAGIAN)'
                    : 'BELUM BAYAR'}
                </span>
                <p className="text-xs text-slate-600 mt-2">
                  Sisa Tagihan:{' '}
                  <span className="font-bold text-red-600 text-sm">
                    {formatRupiah(order.remainingBalance)}
                  </span>
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-y-2 border-slate-900 bg-slate-100 text-xs font-bold text-slate-900 uppercase">
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">Produk & Spesifikasi</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Harga Satuan</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {order.items.map((item, idx) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-3 px-3 font-bold">{idx + 1}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-sm text-slate-900">{item.productName}</p>
                        <p className="text-slate-600 mt-0.5">
                          {item.productType} • {item.fabric} • Warna: {item.color}
                        </p>

                        {/* Size Breakdown */}
                        {item.serviceType === 'maklon_sablon' ? (
                          <div className="mt-2 text-[11px] bg-amber-50 p-2 rounded border border-amber-200 text-amber-900 font-semibold">
                            🏷️ <strong>Layanan Maklon Sablon Saja:</strong> Kaos disiapkan oleh konsumen ({item.quantity} pcs). Tanpa rincian ukuran kaos.
                          </div>
                        ) : (
                          <div className="mt-2 text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="font-bold text-slate-800">Rincian Ukuran & Model Lengan:</span>
                            {item.sizeBreakdown?.categorySizes ? (
                              <div className="mt-1 space-y-1">
                                {Object.entries(item.sizeBreakdown.categorySizes || {}).map(
                                  ([cat, catSizes]) => {
                                    const activeSizes = Object.entries(catSizes || {}).filter(
                                      ([, v]) => Number(v) > 0
                                    );
                                    if (activeSizes.length === 0) return null;
                                    const catPcs = activeSizes.reduce((s, [, qty]) => s + Number(qty), 0);
                                    return (
                                      <div
                                        key={cat}
                                        className="flex flex-wrap items-center gap-1.5 text-[11px]"
                                      >
                                        <span className="font-extrabold text-slate-900 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                          {formatCategoryName(cat)} ({catPcs} pcs):
                                        </span>
                                        {activeSizes.map(([sz, count]) => (
                                          <span
                                            key={sz}
                                            className="bg-white px-1.5 py-0.5 rounded border border-slate-300 font-mono"
                                          >
                                            <strong>{sz}</strong>: {count}
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 mt-1 font-mono">
                                {Object.entries(item.sizeBreakdown?.sizes || {}).map(([size, count]) =>
                                  count && Number(count) > 0 ? (
                                    <span
                                      key={size}
                                      className="bg-white px-1.5 py-0.5 rounded border border-slate-300"
                                    >
                                      <strong className="text-slate-900">{size}</strong>: {count}
                                    </span>
                                  ) : null
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sablon details */}
                        {item.sablonDetails && item.sablonDetails.length > 0 && (
                          <div className="mt-2 text-[11px] text-slate-700">
                            <span className="font-semibold">Teknik & Finishing Sablon:</span>{' '}
                            {item.sablonDetails
                              .map((s) => {
                                const parts = [s.technique];
                                if (s.finishing) parts.push(`Finishing: ${s.finishing}`);
                                if (s.position) parts.push(`Posisi: ${s.position}`);
                                if (s.dimensions) parts.push(`Dimensi: ${s.dimensions}`);
                                return parts.join(' • ');
                              })
                              .join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900 text-sm">
                        {item.quantity} pcs
                      </td>
                      <td className="py-3 px-3 text-right font-medium">
                        {formatRupiah(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pricing Totals & Payment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t-2 border-slate-900 pt-4">
              <div>
                <p className="text-xs font-bold text-slate-700 uppercase mb-1">
                  Metode Pembayaran Transfer:
                </p>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs">
                  <p className="font-bold text-slate-900">{settings.bankName}</p>
                  <p className="font-mono text-sm font-bold text-indigo-900">
                    {settings.bankAccount}
                  </p>
                  <p className="text-slate-600">a.n. {settings.bankHolder}</p>
                </div>

                {settings.invoiceNotes && (
                  <div className="mt-3 text-[11px] text-slate-600 leading-normal bg-amber-50/60 p-2.5 rounded border border-amber-200">
                    <span className="font-bold text-amber-900">Catatan Nota:</span>{' '}
                    {settings.invoiceNotes}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-right">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Subtotal Item:</span>
                  <span className="font-bold">{formatRupiah(order.subtotal)}</span>
                </div>
                {order.additionalCosts.designFee > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Biaya Desain:</span>
                    <span className="font-bold">
                      {formatRupiah(order.additionalCosts.designFee)}
                    </span>
                  </div>
                )}
                {order.additionalCosts.shippingFee > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Ongkos Kirim:</span>
                    <span className="font-bold">
                      {formatRupiah(order.additionalCosts.shippingFee)}
                    </span>
                  </div>
                )}
                {order.additionalCosts.discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
                    <span>Diskon:</span>
                    <span className="font-bold">
                      - {formatRupiah(order.additionalCosts.discount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-y-2 border-slate-900 text-base font-black text-slate-900 mt-2">
                  <span>GRAND TOTAL:</span>
                  <span>{formatRupiah(order.grandTotal)}</span>
                </div>

                <div className="flex justify-between py-1 text-emerald-700">
                  <span>Total Sudah Dibayar:</span>
                  <span className="font-bold">{formatRupiah(order.totalPaid)}</span>
                </div>

                <div className="flex justify-between py-2 bg-red-50 p-2 rounded border border-red-200 text-sm font-extrabold text-red-700">
                  <span>SISA PELUNASAN:</span>
                  <span>{formatRupiah(order.remainingBalance)}</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-12 pt-6 grid grid-cols-2 text-center text-xs text-slate-700">
              <div>
                <p className="mb-14 font-medium">Pemesan / Customer</p>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block px-8">
                  ( {order.customerName} )
                </p>
              </div>
              <div>
                <p className="mb-14 font-medium">Hormat Kami, {settings.name}</p>
                <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block px-8">
                  ( {order.salesAdmin} )
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* SPK PRODUKSI JAHIT & SABLON VIEW */
          <div
            ref={printRef}
            id="printable-spk"
            className="p-8 sm:p-10 bg-white text-slate-900 font-sans leading-normal dark:bg-white dark:text-slate-900"
          >
            {/* SPK Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-900 pb-5 mb-5 gap-4">
              <div className="flex items-center gap-4">
                {settings.logoUrl && (
                  <img
                    src={settings.logoUrl}
                    alt={settings.name}
                    className="h-14 w-14 object-cover rounded-xl border border-slate-200"
                  />
                )}
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    {settings.name}
                  </h1>
                  <p className="text-xs font-bold text-indigo-900 uppercase">
                    DEPARTEMEN PRODUKSI KONVEKSI & SABLON
                  </p>
                  <p className="text-[11px] text-slate-500">WA Admin: {settings.phone}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="inline-block px-3 py-1 bg-indigo-950 text-white font-black text-xs uppercase tracking-widest rounded mb-1">
                  SURAT PERINTAH KERJA (SPK)
                </span>
                <p className="text-base font-black text-slate-900">{spkNumber}</p>
                <p className="text-xs text-slate-700 font-bold">
                  No. Order: {order.orderNumber}
                </p>
                <p className="text-xs text-slate-600">
                  Tgl Order: {formatDateIndo(order.orderDate)}
                </p>
                <div className="mt-1.5 inline-block px-3 py-1 bg-red-100 border border-red-300 text-red-900 font-black text-xs rounded-lg">
                  ⚠️ DEADLINE PRODUKSI: {formatDateIndo(order.deadline)}
                </div>
              </div>
            </div>

            {/* Job & Customer Summary */}
            <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-5 text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Pemesan / Instansi</p>
                <p className="font-extrabold text-slate-900 text-sm">{order.customerName}</p>
                {order.organization && (
                  <p className="font-bold text-slate-700">{order.organization}</p>
                )}
                <p className="text-slate-600">Kontak WA: {order.customerPhone}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Tahapan Produksi</p>
                <p className="font-extrabold text-emerald-800 text-sm">
                </p>
                <p className="font-bold text-slate-700 mt-0.5">Tahap Produksi: {order.productionStage}</p>
                <p className="text-slate-600">Sales Admin: {order.salesAdmin}</p>
              </div>
            </div>

            {/* SECTION 1: SPESIFIKASI JAHIT & UKURAN KAOS */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-900">
                <Scissors className="h-4 w-4 text-slate-900" />
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                  1. Spesifikasi Jahit & Rincian Ukuran Kaos
                </h3>
              </div>

              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="border border-slate-300 rounded-xl p-4 bg-slate-50/60 space-y-3"
                  >
                    <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                          Item Produksi #{idx + 1}
                        </span>
                        <h4 className="font-black text-base text-slate-900">{item.productName}</h4>
                        <p className="text-xs font-semibold text-slate-700 mt-0.5">
                          Jenis: <strong className="text-slate-900">{item.productType}</strong> • Kain/Bahan:{' '}
                          <strong className="text-slate-900">{item.fabric}</strong> • Warna Kain:{' '}
                          <strong className="text-slate-900">{item.color}</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-sm rounded-lg">
                          TOTAL: {item.quantity} PCS
                        </span>
                      </div>
                    </div>

                    {/* Rincian Ukuran Detail Table */}
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-900 uppercase mb-2 flex items-center gap-1.5">
                        <Shirt className="h-4 w-4 text-indigo-600" />
                        <span>Rincian Pola Ukuran & Model Lengan (Potong Kain & Jahit):</span>
                      </p>
                      {item.serviceType === 'maklon_sablon' ? (
                        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 space-y-1">
                          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-900">
                            <Scissors className="h-4 w-4 text-amber-600" />
                            <span>LAYANAN MAKLON SABLON SAJA (KAOS DARI KONSUMEN)</span>
                          </div>
                          <p className="text-xs">
                            ⚠️ <strong>TANPA PROSES POTONG & JAHIT:</strong> Kaos disuplai langsung oleh konsumen sebanyak{' '}
                            <strong>{item.quantity} PCS</strong>. Operator langsung melanjutkan ke proses setting file, cetak film/stempel & pres sablon.
                          </p>
                        </div>
                      ) : item.sizeBreakdown?.categorySizes ? (
                        <div className="space-y-2.5">
                          {Object.entries(item.sizeBreakdown.categorySizes || {}).map(
                            ([cat, catSizes]) => {
                              const activeSizes = Object.entries(catSizes || {}).filter(
                                ([, v]) => Number(v) > 0
                              );
                              if (activeSizes.length === 0) return null;
                              const categoryTotal = activeSizes.reduce((s, [, qty]) => s + Number(qty), 0);

                              return (
                                <div
                                  key={cat}
                                  className="p-3 bg-white rounded-xl border border-slate-300 shadow-2xs space-y-2"
                                >
                                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                                    <span className="text-xs font-black text-slate-900 uppercase flex items-center gap-1.5">
                                      <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                                      {formatCategoryName(cat)}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-black text-xs">
                                      {categoryTotal} PCS
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 pt-0.5">
                                    {activeSizes.map(([sz, count]) => (
                                      <div
                                        key={sz}
                                        className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                                      >
                                        <span className="font-extrabold text-slate-700 uppercase">Ukuran {sz}:</span>
                                        <span className="font-black text-indigo-950 bg-white px-2.5 py-0.5 rounded-md border border-slate-300 text-sm">
                                          {count} pcs
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-lg border border-slate-300">
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {Object.entries(item.sizeBreakdown?.sizes || {}).map(([sz, count]) =>
                              count && Number(count) > 0 ? (
                                <div
                                  key={sz}
                                  className="text-center p-2 bg-slate-100 rounded-md border border-slate-300"
                                >
                                  <span className="block text-[10px] font-bold text-slate-500 uppercase">
                                    {sz}
                                  </span>
                                  <span className="block text-xs font-black text-slate-900">
                                    {count} pcs
                                  </span>
                                </div>
                              ) : null
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Item Notes */}
                    {item.notes && (
                      <div className="text-xs bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-950">
                        <strong>Catatan Khusus Jahit / Pola:</strong> {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: SPESIFIKASI SABLON */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2 pb-1 border-b-2 border-slate-900">
                <Printer className="h-4 w-4 text-slate-900" />
                <h3 className="font-black text-sm uppercase tracking-wider text-slate-900">
                  2. Spesifikasi & Posisi Cetak Sablon
                </h3>
              </div>

              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-black uppercase text-[10px]">
                    <th className="p-2.5 border border-slate-300">No</th>
                    <th className="p-2.5 border border-slate-300">Produk</th>
                    <th className="p-2.5 border border-slate-300">Teknik Sablon</th>
                    <th className="p-2.5 border border-slate-300">Finishing</th>
                    <th className="p-2.5 border border-slate-300">Posisi Cetak</th>
                    <th className="p-2.5 border border-slate-300">Dimensi / Ukuran</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <React.Fragment key={item.id}>
                      {item.sablonDetails && item.sablonDetails.length > 0 ? (
                        item.sablonDetails.map((sab, sIdx) => (
                          <tr key={sab.id || sIdx} className="border border-slate-300">
                            {sIdx === 0 && (
                              <td
                                className="p-2.5 border border-slate-300 font-bold align-top"
                                rowSpan={item.sablonDetails.length}
                              >
                                {idx + 1}
                              </td>
                            )}
                            {sIdx === 0 && (
                              <td
                                className="p-2.5 border border-slate-300 font-bold align-top"
                                rowSpan={item.sablonDetails.length}
                              >
                                {item.productName}
                              </td>
                            )}
                            <td className="p-2.5 border border-slate-300 font-extrabold text-indigo-900">
                              {sab.technique}
                            </td>
                            <td className="p-2.5 border border-slate-300 font-semibold">
                              {sab.finishing || '-'}
                            </td>
                            <td className="p-2.5 border border-slate-300 font-bold text-slate-900">
                              {sab.position || '-'}
                            </td>
                            <td className="p-2.5 border border-slate-300 font-mono">
                              {sab.dimensions || '-'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border border-slate-300">
                          <td className="p-2.5 border border-slate-300 font-bold">{idx + 1}</td>
                          <td className="p-2.5 border border-slate-300 font-bold">
                            {item.productName}
                          </td>
                          <td colSpan={4} className="p-2.5 border border-slate-300 text-slate-500 italic">
                            Tanpa cetak sablon / Polos
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SECTION 3: MOCKUP DESAIN & INSTRUKSI KHUSUS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Mockup Desain Image */}
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
                <p className="text-[11px] font-black text-slate-900 uppercase mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Acuan Visual Mockup Desain:</span>
                </p>
                <div className="p-6 text-center text-xs text-slate-400 italic bg-white rounded border border-dashed border-slate-300">
                  File mockup desain tidak tersedia (Fitur Approval Dimatikan).
                </div>
              </div>

              {/* Catatan / Instruksi Khusus */}
              <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 space-y-2 text-xs">
                <p className="text-[11px] font-black text-slate-900 uppercase flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span>Catatan & Instruksi Khusus Produksi:</span>
                </p>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-800 space-y-1">
                  <p>• Periksa toleransi ukuran ±1-2 cm saat pemotongan kain.</p>
                  <p>• Pastikan sablon di-curing/hotpress sesuai suhu teknis agar awet.</p>
                  <p>• Lakukan Quality Control (QC) kerapihan benang sebelum packing.</p>
                </div>
              </div>
            </div>

            {/* SECTION 4: KONTROL PARAF & SIGNATURE DEPARTEMEN */}
            <div className="border-t-2 border-slate-900 pt-4">
              <p className="text-[11px] font-black text-slate-900 uppercase mb-2">
                Lembar Kontrol & Paraf Penanggung Jawab Produksi:
              </p>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] border border-slate-300 rounded-xl overflow-hidden">
                <div className="p-2 bg-slate-100 border-r border-slate-300">
                  <p className="font-extrabold text-slate-900 uppercase mb-6">1. Potong Kain (Cutter)</p>
                  <p className="text-slate-500 border-t border-slate-400 pt-1">Tgl: _____ Paraf: _____</p>
                </div>
                <div className="p-2 bg-slate-100 border-r border-slate-300">
                  <p className="font-extrabold text-slate-900 uppercase mb-6">2. Cetak Sablon</p>
                  <p className="text-slate-500 border-t border-slate-400 pt-1">Tgl: _____ Paraf: _____</p>
                </div>
                <div className="p-2 bg-slate-100 border-r border-slate-300">
                  <p className="font-extrabold text-slate-900 uppercase mb-6">3. Proses Jahit</p>
                  <p className="text-slate-500 border-t border-slate-400 pt-1">Tgl: _____ Paraf: _____</p>
                </div>
                <div className="p-2 bg-slate-100">
                  <p className="font-extrabold text-slate-900 uppercase mb-6">4. QC & Packing</p>
                  <p className="text-slate-500 border-t border-slate-400 pt-1">Tgl: _____ Paraf: _____</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Bar (no-print) */}
        <div className="no-print flex items-center justify-between border-t border-slate-200 bg-slate-100 dark:bg-slate-800/90 dark:border-slate-700 px-6 py-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tekan <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200">Esc</kbd> atau klik tombol Tutup untuk kembali.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition cursor-pointer shadow-xs"
            >
              <X className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              <span>Tutup Jendela</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 shadow-md transition cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

