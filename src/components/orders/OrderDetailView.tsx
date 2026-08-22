import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  FileCheck2,
  FileImage,
  History,
  Kanban,
  Layers,
  Lock,
  MessageSquare,
  Plus,
  Printer,
  RefreshCw,
  Scissors,
  Shirt,
  ShoppingBag,
  Trash2,
  User,
  UserCheck,
} from 'lucide-react';
import {
  calculatePaymentStatus,
  formatCategoryName,
  formatDateIndo,
  formatDateShort,
  formatRupiah,
  getDeadlineInfo,
} from '../../lib/utils';
import {
  BusinessSettings,
  Order,
  Payment,
  PaymentMethod,
  ProductionStage,
  UserRole,
} from '../../types';

export type DetailTab =
  | 'overview'
  | 'item'
  | 'size'

  | 'pembayaran'
  | 'produksi'
  | 'riwayat';

interface OrderDetailViewProps {
  order: Order;
  settings: BusinessSettings;
  userRole: UserRole;
  onUpdateOrder: (updatedOrder: Order) => void;
  onDeleteOrder: (id: string) => void;
  onBack: () => void;
  onOpenWA: (order: Order, type: 'nota') => void;
  onPrintNota: (order: Order) => void;
  onPrintSPK?: (order: Order) => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  settings,
  userRole,
  onUpdateOrder,
  onDeleteOrder,
  onBack,
  onOpenWA,
  onPrintNota,
  onPrintSPK,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [copiedLink, setCopiedLink] = useState(false);


  // Delete Order Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Record Payment Modal State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(order.remainingBalance);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Transfer Bank');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  const deadline = getDeadlineInfo(order.deadline, order.productionStage === 'Selesai');


  // Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      setPayError('Nominal pembayaran harus lebih besar dari 0!');
      return;
    }

    const newPayment: Payment = {
      id: 'pay-' + Date.now().toString(36),
      date: new Date().toISOString().split('T')[0],
      amount: payAmount,
      method: payMethod,
      notes: payNotes || 'Pembayaran Pelunasan / Angsuran',
      recordedBy: userRole === 'owner' ? 'Owner' : 'Admin',
    };

    const updatedPayments = [newPayment, ...order.payments];
    const newTotalPaid = order.totalPaid + payAmount;
    const newRemaining = Math.max(0, order.grandTotal - newTotalPaid);
    const newPayStatus = calculatePaymentStatus(newTotalPaid, order.grandTotal);

    const updatedOrder: Order = {
      ...order,
      payments: updatedPayments,
      totalPaid: newTotalPaid,
      remainingBalance: newRemaining,
      paymentStatus: newPayStatus,
      updatedAt: new Date().toISOString(),
    };

    onUpdateOrder(updatedOrder);
    setIsPayModalOpen(false);
    setPayNotes('');
  };

  // Stage Update
  const handleStageChange = (newStage: ProductionStage) => {
    const updatedOrder: Order = {
      ...order,
      productionStage: newStage,
      status:
        newStage === 'Selesai'
          ? 'Selesai'
          : order.status === 'Draft'
          ? 'Produksi'
          : order.status,
      updatedAt: new Date().toISOString(),
    };
    onUpdateOrder(updatedOrder);
  };

  const tabs = [
    { id: 'overview' as DetailTab, label: 'OVERVIEW', icon: ShoppingBag },
    { id: 'item' as DetailTab, label: 'ITEM PRODUK', icon: Shirt },
    { id: 'size' as DetailTab, label: 'RINCIAN SIZE', icon: Layers },
    { id: 'pembayaran' as DetailTab, label: 'PEMBAYARAN', icon: DollarSign },
    { id: 'produksi' as DetailTab, label: 'PRODUKSI', icon: Kanban },
    { id: 'riwayat' as DetailTab, label: 'RIWAYAT', icon: History },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Navigation Back Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                {order.orderNumber}
                {deadline.isOverdue && (
                  <span className="flex h-2.5 w-2.5 relative" title="Order Melewati Deadline!">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                  </span>
                )}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${deadline.badgeClass}`}>
                {deadline.isOverdue && <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />}
                {deadline.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Customer: <strong className="text-slate-900 dark:text-white">{order.customerName}</strong>{' '}
              {order.organization && `(${order.organization})`} • {order.customerPhone}
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onPrintNota(order)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-900 shadow-xs transition"
            title="Cetak Nota / Invoice Keuangan"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Nota</span>
          </button>

          <button
            onClick={() => (onPrintSPK ? onPrintSPK(order) : onPrintNota(order))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs transition"
            title="Cetak SPK Produksi Jahit & Sablon (Ukuran & Posisi Sablon)"
          >
            <Scissors className="h-4 w-4 text-amber-300" />
            <span>Cetak SPK Produksi</span>
          </button>

          {userRole !== 'produksi' && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition"
              title="Hapus Order / Nota Ini"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* 8 Integrated Tabs Nav Header */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-200 bg-slate-50 p-1 rounded-2xl dark:bg-slate-800/60 dark:border-slate-800 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Status Bar Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Status Pembayaran
              </span>
              <p className="mt-1 text-base font-black text-slate-900 dark:text-white">
                {order.paymentStatus} ({formatRupiah(order.totalPaid)} / {formatRupiah(order.grandTotal)})
              </p>
              <p className="text-xs text-red-600 font-bold mt-0.5">
                Sisa Tagihan: {formatRupiah(order.remainingBalance)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Tahap Produksi Saat Ini
              </span>
              <p className="mt-1 text-base font-black text-indigo-600 dark:text-indigo-400">
                {order.productionStage}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Deadline: {formatDateIndo(order.deadline)}
              </p>
            </div>
          </div>

          {/* Order General Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="space-y-2 text-xs">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">Informasi Pemesan</h3>
              <p><span className="text-slate-500">Nama Customer:</span> <strong>{order.customerName}</strong></p>
              <p><span className="text-slate-500">Instansi:</span> <strong>{order.organization || '-'}</strong></p>
              <p><span className="text-slate-500">Nomor WhatsApp:</span> <strong className="font-mono">{order.customerPhone}</strong></p>
              <p><span className="text-slate-500">Sales Admin:</span> <strong>{order.salesAdmin}</strong></p>
            </div>

            <div className="space-y-2 text-xs">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white mb-2">Tanggal & Catatan</h3>
              <p><span className="text-slate-500">Tanggal Transaksi:</span> <strong>{formatDateIndo(order.orderDate)}</strong></p>
              <p><span className="text-slate-500">Deadline Selesai:</span> <strong className="text-indigo-600">{formatDateIndo(order.deadline)}</strong></p>
              <p><span className="text-slate-500">Catatan Order:</span> <span className="italic">{order.notes || 'Tidak ada catatan.'}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ITEM PRODUK */}
      {activeTab === 'item' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Rincian Item Produk & Harga</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-bold dark:bg-slate-800 dark:border-slate-700">
                  <th className="py-3 px-3">Nama Produk</th>
                  <th className="py-3 px-3">Bahan & Warna</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Harga Satuan</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {order.items.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr>
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                        <p className="text-[11px] text-slate-500">{item.productType} ({item.modelCategory})</p>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{item.fabric}</p>
                        <p className="text-[11px] text-slate-500">Warna: {item.color}</p>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-sm text-slate-900 dark:text-white">
                        {item.quantity} pcs
                      </td>
                      <td className="py-3 px-3 text-right font-medium">{formatRupiah(item.unitPrice)}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>

                    {item.pricingConfig && (
                      <tr>
                        <td colSpan={5} className="bg-slate-50/80 px-3 py-2 dark:bg-slate-800/40">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                            <span className="font-extrabold text-indigo-600 dark:text-indigo-400">Rincian Aturan Harga:</span>
                            {item.pricingConfig.basePriceDewasa && (
                              <span>Harga Dewasa: <strong>{formatRupiah(item.pricingConfig.basePriceDewasa)}</strong></span>
                            )}
                            {item.pricingConfig.basePriceAnak && (
                              <span>Harga Anak: <strong>{formatRupiah(item.pricingConfig.basePriceAnak)}</strong></span>
                            )}
                            {item.pricingConfig.extraLenganPanjangDewasa ? (
                              <span>Lengan Panjang Dewasa: <strong>+{formatRupiah(item.pricingConfig.extraLenganPanjangDewasa)}</strong></span>
                            ) : null}
                            {item.pricingConfig.extraXXL ? (
                              <span>Surcharge XXL: <strong>+{formatRupiah(item.pricingConfig.extraXXL)}</strong></span>
                            ) : null}
                            {item.pricingConfig.extraXXXL ? (
                              <span>Surcharge XXXL: <strong>+{formatRupiah(item.pricingConfig.extraXXXL)}</strong></span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RINCIAN SIZE */}
      {activeTab === 'size' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Matrix Rincian Ukuran (Size Breakdown)</h3>

          {order.items.map((item) => {
            const hasCategorySizes = item.sizeBreakdown?.categorySizes;
            const totalItemSizeCount = Object.values(item.sizeBreakdown?.sizes || {}).reduce((s: number, v: number | undefined) => s + (v || 0), 0);

            return (
              <div key={item.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {item.productName} ({item.modelCategory})
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {item.serviceType === 'maklon_sablon' ? `Maklon Sablon: ${item.quantity} pcs` : `Total Size: ${totalItemSizeCount} / ${item.quantity} pcs`}
                  </span>
                </div>

                {item.serviceType === 'maklon_sablon' ? (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 text-amber-950 dark:text-amber-200">
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                      <Printer className="h-4 w-4 text-amber-600" />
                      <span>Layanan Maklon Sablon Saja</span>
                    </div>
                    <p className="text-xs mt-1">
                      Item ini disablon menggunakan kaos/bahan yang disuplai langsung oleh konsumen sebanyak <strong>{item.quantity} Pcs</strong>. Tanpa rincian pola ukuran S/M/L/XL.
                    </p>
                  </div>
                ) : hasCategorySizes ? (
                  <div className="space-y-3">
                    {Object.entries(item.sizeBreakdown?.categorySizes || {}).map(([cat, catSizes]) => {
                      const activeSizes = Object.entries(catSizes || {}).filter(([, qty]) => Number(qty) > 0);
                      const catTotal = Object.values(catSizes || {}).reduce((sum: number, v: number) => sum + (Number(v) || 0), 0);
                      if (catTotal === 0) return null;

                      return (
                        <div key={cat} className="p-3 bg-white rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                              {formatCategoryName(cat)}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              Subtotal: {catTotal} pcs
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeSizes.map(([sz, qty]) => (
                              <div key={sz} className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-center dark:bg-slate-800 dark:border-slate-700">
                                <span className="block text-[10px] font-bold text-slate-400">{sz}</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">{qty}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                    {Object.entries(item.sizeBreakdown?.sizes || {}).map(([sz, qty]) => (
                      <div key={sz} className="bg-white p-3 rounded-xl border border-slate-200 text-center dark:bg-slate-900 dark:border-slate-800">
                        <span className="block text-[11px] font-bold text-slate-400">Ukuran {sz}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">{qty || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 6: PEMBAYARAN */}
      {activeTab === 'pembayaran' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Rincian Pembayaran & Tagihan</h3>
              {userRole !== 'produksi' && (
                <button
                  onClick={() => setIsPayModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Catat Pembayaran / Pelunasan</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center dark:bg-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Grand Total</span>
                <p className="text-lg font-black text-slate-900 dark:text-white">{formatRupiah(order.grandTotal)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center dark:bg-emerald-950/40">
                <span className="text-[10px] font-bold text-emerald-700 uppercase">Total Sudah Dibayar</span>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{formatRupiah(order.totalPaid)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center dark:bg-red-950/40">
                <span className="text-[10px] font-bold text-red-700 uppercase">Sisa Pelunasan</span>
                <p className="text-lg font-black text-red-700 dark:text-red-300">{formatRupiah(order.remainingBalance)}</p>
              </div>
            </div>

            {/* Payment Ledger History */}
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300 pt-2">Riwayat Pembayaran (Ledger)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase font-bold dark:bg-slate-800">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3">Nominal</th>
                    <th className="py-2.5 px-3">Catatan</th>
                    <th className="py-2.5 px-3">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {order.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 font-medium">{formatDateShort(p.date)}</td>
                      <td className="py-2.5 px-3"><span className="font-bold text-indigo-600">{p.method}</span></td>
                      <td className="py-2.5 px-3 font-extrabold text-emerald-600">{formatRupiah(p.amount)}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.notes || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-500">{p.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PRODUKSI */}
      {activeTab === 'produksi' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-6">
          {/* SPK Print Banner for Production Staff */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900/60 gap-4">
            <div>
              <h4 className="font-extrabold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <Scissors className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Lembar Kerja SPK Produksi Jahit & Sablon</span>
              </h4>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5">
                Cetak dokumen SPK resmi berisi rincian ukuran kaos (S/M/L/XL/dll), bahan kain, teknik & posisi sablon, dan lembar kontrol paraf operator.
              </p>
            </div>
            <button
              type="button"
              onClick={() => (onPrintSPK ? onPrintSPK(order) : onPrintNota(order))}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md transition cursor-pointer shrink-0"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak SPK Produksi</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 dark:bg-slate-800 space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {userRole === 'admin' ? 'Tahapan Produksi Saat Ini' : 'Ubah Tahapan Produksi Saat Ini'}
            </h3>
            {userRole === 'admin' ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-900 text-xs font-black text-indigo-700 dark:text-indigo-300">
                  <span>{order.productionStage}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                  * Role Admin (Sales) memiliki akses lihat (view-only) dan tidak dapat mengubah progres produksi.
                </p>
              </div>
            ) : (
              <>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Pilih Status Tahapan Baru</label>
                <select
                  value={order.productionStage}
                  onChange={(e) => handleStageChange(e.target.value as ProductionStage)}
                  className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-3 text-xs font-black text-indigo-700 focus:border-indigo-500 dark:bg-slate-900 dark:text-indigo-300 cursor-pointer"
                >
                  <option value="Order Masuk">Order Masuk</option>
                  <option value="Belanja bahan">Belanja bahan</option>
                  <option value="Potong">Potong</option>
                  <option value="Proofing">Proofing</option>
                  <option value="Sablon">Sablon</option>
                  <option value="Finishing sablon">Finishing sablon</option>
                  <option value="Jahit">Jahit</option>
                  <option value="QC">QC</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: RIWAYAT */}
      {activeTab === 'riwayat' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Aktivitas & Log Transaksi</h3>
          <div className="text-xs text-slate-600 space-y-2">
            <p>• Dibuat pada: {formatDateIndo(order.createdAt, true)}</p>
            <p>• Terakhir diperbarui: {formatDateIndo(order.updatedAt, true)}</p>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Catat Pembayaran</h3>
              <button onClick={() => setIsPayModalOpen(false)} className="rounded-lg p-1 text-slate-400">
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {payError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nominal Pembayaran (Rp)</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={order.remainingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-black text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Metode Pembayaran</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Cash">Cash / Tunai</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Pelunasan via Transfer BCA..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Order Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Hapus Order Ini?
                </h3>
                <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  {order.orderNumber}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 text-xs space-y-1 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
              <p>
                <strong>Customer:</strong> {order.customerName}
              </p>
              <p>
                <strong>Total Nota:</strong> {formatRupiah(order.grandTotal)}
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus order <strong className="font-mono">{order.orderNumber}</strong>? Seluruh data nota, riwayat pembayaran, dan riwayat desain akan dihapus secara permanen.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteOrder(order.id);
                  setIsDeleteModalOpen(false);
                  onBack();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 text-xs font-extrabold text-white hover:bg-rose-700 shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
