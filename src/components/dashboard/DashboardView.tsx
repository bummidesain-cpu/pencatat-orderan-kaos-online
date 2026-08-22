import React from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck2,
  Kanban,
  MessageSquare,
  PlusCircle,
  Printer,
  Receipt,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  UserPlus,
} from 'lucide-react';
import { formatDateShort, formatRupiah, getDeadlineInfo } from '../../lib/utils';
import { Expense, Order, UserRole } from '../../types';

interface DashboardViewProps {
  orders: Order[];
  expenses?: Expense[];
  userRole: UserRole;
  onSelectOrder: (order: Order) => void;
  onOpenNewOrder: () => void;
  onOpenCustomers: () => void;
  onOpenProduction: () => void;
  onOpenExpenses?: () => void;
  onOpenWA: (order: Order, type: 'nota') => void;
  onPrintNota: (order: Order) => void;
  onPrintSPK?: (order: Order) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  expenses = [],
  userRole,
  onSelectOrder,
  onOpenNewOrder,
  onOpenCustomers,
  onOpenProduction,
  onOpenExpenses,
  onOpenWA,
  onPrintNota,
  onPrintSPK,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  // Stats Calculations
  const ordersToday = orders.filter((o) => o.orderDate.startsWith(todayStr));
  const omzetToday = ordersToday.reduce((sum, o) => sum + o.grandTotal, 0);

  const ordersMonth = orders.filter((o) => o.orderDate.startsWith(currentMonthStr));
  const omzetMonth = ordersMonth.reduce((sum, o) => sum + o.grandTotal, 0);

  // Expense Calculations
  const expensesMonth = expenses.filter((e) => e.date.startsWith(currentMonthStr));
  const totalExpenseMonth = expensesMonth.reduce((sum, e) => sum + e.amount, 0);

  const inProductionCount = orders.filter((o) => o.productionStage !== 'Selesai').length;
  const finishedCount = orders.filter((o) => o.productionStage === 'Selesai').length;
  const unpaidCount = orders.filter((o) => o.paymentStatus !== 'Lunas').length;
  const totalPiutang = orders.reduce((sum, o) => sum + o.remainingBalance, 0);

  // Urgent Orders needing attention
  const urgentOrders = orders.filter((o) => {
    const isLate = getDeadlineInfo(o.deadline, o.productionStage === 'Selesai').isOverdue;
    const isUnpaid = o.remainingBalance > 0;
    return (isLate || isUnpaid) && o.productionStage !== 'Selesai';
  }).slice(0, 5);

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-indigo-700/40">
        <div>
          <span className="inline-block px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-full text-xs font-semibold tracking-wider uppercase mb-2 backdrop-blur-xs">
            Order Management System • Dashboard Utama
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Sistem Order Sablon</h2>
          <p className="text-xs sm:text-sm text-indigo-200/90 mt-1 max-w-xl">
            Kelola transaksi, verifikasi desain customer via WhatsApp, pantau antrian produksi, dan cetak nota dalam satu aplikasi.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {userRole !== 'produksi' && (
            <button
              onClick={onOpenNewOrder}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs sm:text-sm font-extrabold text-indigo-900 hover:bg-indigo-50 shadow-lg transition transform active:scale-95"
            >
              <PlusCircle className="h-4 w-4 text-indigo-600" />
              <span>+ ORDER BARU</span>
            </button>
          )}
          <button
            onClick={onOpenProduction}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white border border-indigo-400/40 backdrop-blur-xs transition cursor-pointer"
          >
            <Kanban className="h-4 w-4" />
            <span>PRODUKSI</span>
          </button>
          {userRole !== 'produksi' && onOpenExpenses && (
            <button
              onClick={onOpenExpenses}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-md transition cursor-pointer"
            >
              <Receipt className="h-4 w-4" />
              <span>BELANJA & GAJI</span>
            </button>
          )}
        </div>
      </div>      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Omzet Hari Ini */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Omzet Hari Ini</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {formatRupiah(omzetToday)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {ordersToday.length} Order Masuk
          </p>
        </div>

        {/* Omzet Bulan Ini */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Omzet Bulan Ini</span>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {formatRupiah(omzetMonth)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {ordersMonth.length} Order Bulan Ini
          </p>
        </div>

        {/* Total Piutang / Belum Lunas */}
        <div className="p-4 rounded-2xl bg-white border border-purple-200/80 shadow-xs dark:bg-slate-900 dark:border-purple-900/40">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
            <span className="text-xs font-bold uppercase tracking-wider">Sisa Piutang</span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-lg sm:text-xl font-black text-slate-900 dark:text-purple-300">
            {formatRupiah(totalPiutang)}
          </p>
          <p className="text-[11px] text-purple-600/80 font-medium mt-0.5">
            {unpaidCount} Order belum pelunasan
          </p>
        </div>
      </div>

      {/* Quick Action Navigation Buttons Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={onOpenNewOrder}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 transition font-bold text-xs gap-1.5"
        >
          <PlusCircle className="h-5 w-5 text-indigo-600" />
          <span>ORDER BARU</span>
        </button>

        <button
          onClick={onOpenCustomers}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:border-blue-800 text-blue-900 dark:text-blue-200 transition font-bold text-xs gap-1.5"
        >
          <UserPlus className="h-5 w-5 text-blue-600" />
          <span>CUSTOMER</span>
        </button>

        <button
          onClick={onOpenProduction}
          className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-800 text-amber-900 dark:text-amber-200 transition font-bold text-xs gap-1.5"
        >
          <Kanban className="h-5 w-5 text-amber-600" />
          <span>PRODUKSI ({inProductionCount})</span>
        </button>

        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-purple-50 border border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold text-xs gap-1.5">
          <FileCheck2 className="h-5 w-5 text-purple-600" />
          <span>SELESAI ({finishedCount})</span>
        </div>

        <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs gap-1.5">
          <Clock className="h-5 w-5 text-slate-500" />
          <span>TOTAL ORDER ({orders.length})</span>
        </div>
      </div>

      {/* Urgent Tasks Section: Order Membutuhkan Tindakan */}
      {urgentOrders.length > 0 && (
        <div className="rounded-2xl bg-red-50/50 border border-red-200 p-5 dark:bg-red-950/20 dark:border-red-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Order Membutuhkan Tindakan Cepat ({urgentOrders.length})
              </h3>
            </div>
            <span className="text-xs text-red-600 dark:text-red-400 font-semibold">
              Prioritas Tinggi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentOrders.map((order) => {
              const deadline = getDeadlineInfo(order.deadline, order.productionStage === 'Selesai');
              return (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className={`p-4 rounded-xl bg-white border shadow-xs hover:shadow-md cursor-pointer transition dark:bg-slate-900 ${
                    deadline.isOverdue ? 'border-red-400 bg-red-50/20 dark:border-red-900' : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      {order.orderNumber}
                      {deadline.isOverdue && (
                        <span className="flex h-2 w-2 relative" title="Order Terlambat / Melewati Deadline">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                        </span>
                      )}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${deadline.badgeClass}`}>
                      {deadline.status}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                    {order.customerName}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">{order.items[0]?.productName}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] dark:border-slate-800">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatRupiah(order.grandTotal)}
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        order.status === 'Selesai'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Terbaru Table */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Daftar Order Terbaru</h3>
            <p className="text-xs text-slate-500">Monitor status pembayaran dan tahapan produksi</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:bg-slate-800/50 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 px-4">No. Order</th>
                <th className="py-3 px-4">Tanggal & Customer</th>
                <th className="py-3 px-4">Produk / Item</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Pembayaran</th>
                <th className="py-3 px-4 text-center">Tahap Produksi</th>
                <th className="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {orders.slice(0, 10).map((order) => {
                const deadline = getDeadlineInfo(order.deadline, order.productionStage === 'Selesai');
                return (
                  <tr
                    key={order.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${deadline.isOverdue ? 'bg-red-50/20 dark:bg-red-950/10' : ''}`}
                  >
                    <td className="py-3.5 px-4 font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="hover:underline text-left flex items-center gap-1.5"
                      >
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
                        {formatDateShort(order.orderDate)} • Deadline: <span className={deadline.isOverdue ? 'font-extrabold text-red-600 dark:text-red-400' : 'font-semibold text-slate-700 dark:text-slate-300'}>{formatDateShort(order.deadline)}</span>
                      </p>
                      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-black ${deadline.badgeClass}`}>
                        {deadline.isOverdue && <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />}
                        {deadline.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {order.items[0]?.productName || 'Produk Custom'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} pcs • {order.items[0]?.fabric}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                      {formatRupiah(order.grandTotal)}
                    </td>

                    {/* Pembayaran Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          order.paymentStatus === 'Lunas'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : order.paymentStatus === 'DP'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                      {order.remainingBalance > 0 && (
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-medium mt-0.5">
                          Sisa: {formatRupiah(order.remainingBalance)}
                        </p>
                      )}
                    </td>

                    {/* Tahap Produksi Badge */}
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 text-[11px]">
                        {order.productionStage}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300"
                          title="Buka Detail Order"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onOpenWA(order, 'nota')}
                          className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"
                          title="Kirim Nota via WA"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onPrintNota(order)}
                          className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          title="Cetak Nota / Invoice"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
