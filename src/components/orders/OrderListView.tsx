import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Filter,
  MessageSquare,
  PlusCircle,
  Printer,
  Scissors,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { formatDateShort, formatRupiah, getDeadlineInfo } from '../../lib/utils';
import { Order, UserRole } from '../../types';

interface OrderListViewProps {
  orders: Order[];
  userRole: UserRole;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectOrder: (order: Order) => void;
  onOpenNewOrder: () => void;
  onOpenWA: (order: Order, type: 'nota') => void;
  onPrintNota: (order: Order) => void;
  onPrintSPK?: (order: Order) => void;
  onDeleteOrder?: (id: string) => void;
}

export const OrderListView: React.FC<OrderListViewProps> = ({
  orders,
  userRole,
  searchQuery,
  onSearchChange,
  onSelectOrder,
  onOpenNewOrder,
  onOpenWA,
  onPrintNota,
  onPrintSPK,
  onDeleteOrder,
}) => {
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterProduction, setFilterProduction] = useState<string>('all');
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchQuery =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      (o.organization && o.organization.toLowerCase().includes(q)) ||
      o.items.some((i) => i.productName.toLowerCase().includes(q));

    const matchPayment = filterPayment === 'all' || o.paymentStatus === filterPayment;
    const matchProduction = filterProduction === 'all' || o.productionStage === filterProduction;

    return matchQuery && matchPayment && matchProduction;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Daftar Order & Nota Invoice
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data pesanan, dan nota pembayaran
          </p>
        </div>

        {userRole !== 'produksi' && (
          <button
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Buat Order Baru</span>
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari order, customer, WA..."
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">Filter Pembayaran: Semua</option>
            <option value="Belum Bayar">Belum Bayar</option>
            <option value="DP">DP (Sebagian)</option>
            <option value="Lunas">Lunas</option>
          </select>
        </div>

        <div>
          <select
            value={filterProduction}
            onChange={(e) => setFilterProduction(e.target.value)}
            className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">Filter Produksi: Semua</option>
            <option value="Proses Sablon">Proses Sablon</option>
            <option value="QC">QC / Packing</option>
            <option value="Selesai">Selesai / Kirim</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 px-4">No. Order</th>
                <th className="py-3 px-4">Tanggal & Customer</th>
                <th className="py-3 px-4">Produk & Pcs</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Pembayaran</th>
                <th className="py-3 px-4 text-center">Tahap Produksi</th>
                <th className="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada data order yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const deadline = getDeadlineInfo(order.deadline, order.productionStage === 'Selesai');
                  return (
                    <tr key={order.id} className={`hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40 ${deadline.isOverdue ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                        <button onClick={() => onSelectOrder(order)} className="hover:underline flex items-center gap-1.5">
                          {order.orderNumber}
                          {deadline.isOverdue && (
                            <span className="flex h-2 w-2 relative" title="Order Melewati Deadline">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                            </span>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{order.customerName}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatDateShort(order.orderDate)} • Deadline: <strong className={deadline.isOverdue ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-slate-700 dark:text-slate-300'}>{formatDateShort(order.deadline)}</strong>
                        </p>
                        <span className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-black ${deadline.badgeClass}`}>
                          {deadline.isOverdue && <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />}
                          {deadline.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {order.items[0]?.productName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} pcs • {order.items[0]?.fabric}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                        {formatRupiah(order.grandTotal)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            order.paymentStatus === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px]">
                          {order.productionStage}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onSelectOrder(order)}
                            className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-900/60"
                            title="Buka Detail"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onOpenWA(order, 'nota')}
                            className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:hover:bg-emerald-900/60"
                            title="Kirim WA Nota"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onPrintNota(order)}
                            className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                            title="Cetak Nota Invoice Keuangan"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => (onPrintSPK ? onPrintSPK(order) : onPrintNota(order))}
                            className="rounded-lg bg-indigo-50 p-1.5 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/80 cursor-pointer"
                            title="Cetak SPK Produksi (Ukuran Kaos & Sablon)"
                          >
                            <Scissors className="h-4 w-4" />
                          </button>
                          {userRole !== 'produksi' && onDeleteOrder && (
                            <button
                              onClick={() => setDeletingOrder(order)}
                              className="rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/60"
                              title="Hapus Nota / Order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Konfirmasi Hapus Order
                </h3>
                <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  {deletingOrder.orderNumber}
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 text-xs space-y-1 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80">
              <p>
                <strong>Customer:</strong> {deletingOrder.customerName}
              </p>
              <p>
                <strong>Total Nota:</strong> {formatRupiah(deletingOrder.grandTotal)}
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apakah Anda yakin ingin menghapus order ini? Seluruh data nota, histori pembayaran, dan persetujuan desain akan dihapus secara permanen.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteOrder && deletingOrder) {
                    onDeleteOrder(deletingOrder.id);
                    setDeletingOrder(null);
                  }
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
