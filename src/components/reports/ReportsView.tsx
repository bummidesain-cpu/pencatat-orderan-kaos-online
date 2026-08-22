import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertCircle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit3,
  Flame,
  Package,
  Percent,
  Plus,
  Receipt,
  Save,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';
import { formatDateShort, formatRupiah } from '../../lib/utils';
import { BusinessSettings, Expense, Order } from '../../types';

interface ReportsViewProps {
  orders: Order[];
  expenses?: Expense[];
  settings?: BusinessSettings;
  onSaveSettings?: (settings: BusinessSettings) => void;
  onNavigateExpenses?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  expenses = [],
  settings,
  onSaveSettings,
  onNavigateExpenses,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetInput, setTargetInput] = useState<string>(
    String(settings?.monthlySalesTarget || 50000000)
  );

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredOrders = orders.filter((o) => {
    if (filterPeriod === 'today') return o.orderDate.startsWith(todayStr);
    if (filterPeriod === 'month') return o.orderDate.startsWith(currentMonthStr);
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (filterPeriod === 'today') return e.date.startsWith(todayStr);
    if (filterPeriod === 'month') return e.date.startsWith(currentMonthStr);
    return true;
  });

  const totalOmzet = filteredOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalPengeluaran = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBahanBaku = filteredExpenses
    .filter((e) => e.category === 'bahan_baku')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalGaji = filteredExpenses
    .filter((e) => e.category === 'gaji_karyawan')
    .reduce((sum, e) => sum + e.amount, 0);
  const labaBersih = totalOmzet - totalPengeluaran;

  const totalOrdersCount = filteredOrders.length;
  const totalPcsCount = filteredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );
  const totalUnpaidDebt = filteredOrders.reduce((sum, o) => sum + o.remainingBalance, 0);

  // Target Omset Calculations
  const targetOmzet = settings?.monthlySalesTarget || 50000000;
  const percentageAchieved = targetOmzet > 0 ? (totalOmzet / targetOmzet) * 100 : 0;
  const roundedPercentage = Math.round(percentageAchieved * 10) / 10;
  const progressWidth = Math.min(percentageAchieved, 100);
  const remainingTarget = targetOmzet - totalOmzet;
  const isTargetAchieved = totalOmzet >= targetOmzet;

  // Days remaining in current month for daily run rate calculation
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysLeft = Math.max(daysInMonth - currentDay, 1);
  const dailyRequiredRunRate =
    remainingTarget > 0 ? Math.ceil(remainingTarget / daysLeft) : 0;

  // Group chart data
  const chartData = filteredOrders.map((o) => ({
    name: o.orderNumber.replace('ORD-', ''),
    orderNumber: o.orderNumber,
    customer: o.customerName,
    omzet: o.grandTotal,
    pcs: o.items.reduce((s, i) => s + i.quantity, 0),
    status: o.status,
  }));

  // Group sales by Sales Admin
  const adminSalesMap: Record<string, { totalOmzet: number; count: number }> = {};
  filteredOrders.forEach((o) => {
    const admin = o.salesAdmin || 'Admin Unassigned';
    if (!adminSalesMap[admin]) {
      adminSalesMap[admin] = { totalOmzet: 0, count: 0 };
    }
    adminSalesMap[admin].totalOmzet += o.grandTotal;
    adminSalesMap[admin].count += 1;
  });

  const adminSalesList = Object.entries(adminSalesMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalOmzet - a.totalOmzet);

  const handleSaveTarget = () => {
    const newTarget = Number(targetInput);
    if (isNaN(newTarget) || newTarget < 0) return;
    if (settings && onSaveSettings) {
      onSaveSettings({
        ...settings,
        monthlySalesTarget: newTarget,
      });
    }
    setIsTargetModalOpen(false);
  };

  const handleApplyPresetTarget = (val: number) => {
    setTargetInput(String(val));
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            Laporan Penjualan & Target Omset
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analisis realisasi omset, pencapaian target bulanan, volume pcs produksi, dan saldo piutang
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <button
            onClick={() => setFilterPeriod('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterPeriod === 'today'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setFilterPeriod('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterPeriod === 'month'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Bulan Ini
          </button>
          <button
            onClick={() => setFilterPeriod('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filterPeriod === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Semua Data
          </button>
        </div>
      </div>

      {/* Target Omset Progress Hero Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-indigo-800/50">
        {/* Background Decorative Glow */}
        <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/30 border border-indigo-400/30 backdrop-blur-md">
                <Target className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-indigo-300 block">
                  Target & Progress Omset Bulanan
                </span>
                <h3 className="text-lg font-black text-white">
                  {filterPeriod === 'month'
                    ? `Bulan ${now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`
                    : filterPeriod === 'today'
                    ? 'Target Omset (Perhitungan Bulan Ini)'
                    : 'Target Omset Usaha'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isTargetAchieved ? (
                <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black flex items-center gap-1.5 backdrop-blur-md">
                  <Award className="h-4 w-4 text-emerald-400" />
                  <span>Target Omset Tercapai! 🎉</span>
                </span>
              ) : percentageAchieved >= 80 ? (
                <span className="px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black flex items-center gap-1.5 backdrop-blur-md">
                  <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
                  <span>Mendekati Target (≥80%)</span>
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <span>Dalam Proses</span>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setTargetInput(String(targetOmzet));
                  setIsTargetModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
              >
                <Edit3 className="h-3.5 w-3.5 text-indigo-300" />
                <span>Ubah Target</span>
              </button>
            </div>
          </div>

          {/* Numbers Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Target Goal */}
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 backdrop-blur-xs">
              <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider block">
                Target Omset Bulanan
              </span>
              <p className="text-2xl font-black text-white mt-1">
                {formatRupiah(targetOmzet)}
              </p>
              <span className="text-[10px] text-indigo-300/80 block mt-0.5">
                Ditetapkan oleh Manajemen
              </span>
            </div>

            {/* Realisasi Omset */}
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 backdrop-blur-xs">
              <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider block">
                Capaian Omset Terkumpul
              </span>
              <p className="text-2xl font-black text-emerald-400 mt-1">
                {formatRupiah(totalOmzet)}
              </p>
              <span className="text-[10px] text-emerald-300/80 block mt-0.5">
                {roundedPercentage}% dari target bulanan
              </span>
            </div>

            {/* Selisih Target */}
            <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 backdrop-blur-xs">
              <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider block">
                {isTargetAchieved ? 'Surplus / Kelebihan Omset' : 'Sisa Target Harus Dicapai'}
              </span>
              <p
                className={`text-2xl font-black mt-1 ${
                  isTargetAchieved ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {isTargetAchieved
                  ? `+${formatRupiah(Math.abs(remainingTarget))}`
                  : formatRupiah(remainingTarget)}
              </p>
              <span className="text-[10px] text-indigo-300/80 block mt-0.5">
                {isTargetAchieved
                  ? 'Selamat! Target omset telah terlampaui'
                  : `Dibutuhkan ~${formatRupiah(dailyRequiredRunRate)}/hari (${daysLeft} hari tersisa)`}
              </span>
            </div>
          </div>

          {/* Visual Progress Bar Component */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Progress Pencapaian Target</span>
              </span>
              <span className="text-white text-sm font-black">
                {roundedPercentage}%
              </span>
            </div>

            <div className="h-4 w-full rounded-full bg-indigo-950/80 border border-indigo-700/60 overflow-hidden p-0.5 relative">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isTargetAchieved
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 shadow-md'
                    : percentageAchieved >= 80
                    ? 'bg-gradient-to-r from-amber-500 via-indigo-400 to-emerald-400'
                    : 'bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-400'
                }`}
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Omzet Penjualan
            </span>
            <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatRupiah(totalOmzet)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Transaksi Order
            </span>
            <ShoppingBag className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {totalOrdersCount} Order
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Produksi Kaos / Item
            </span>
            <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {totalPcsCount} Pcs
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Piutang Belum Lunas
            </span>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
            {formatRupiah(totalUnpaidDebt)}
          </p>
        </div>
      </div>

      {/* Financial Health & Net Profit Overview */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Rangkuman Laba / Rugi & Pengeluaran Usaha
              </h3>
              <p className="text-xs text-slate-500">
                Pemasukan Omzet dikurangi Belanja Bahan Baku, Gaji Karyawan & Operasional
              </p>
            </div>
          </div>

          {onNavigateExpenses && (
            <button
              onClick={onNavigateExpenses}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Receipt className="h-4 w-4 text-amber-400" />
              Lihat History Pengeluaran
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Laba Bersih */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-300 dark:border-emerald-800/60">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
              Estimasi Laba Bersih
            </span>
            <p
              className={`text-2xl font-black mt-1 ${
                labaBersih >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatRupiah(labaBersih)}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
              (Omzet - Pengeluaran)
            </span>
          </div>

          {/* Total Pengeluaran */}
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-700 dark:text-red-400 block">
              Total Pengeluaran Bulan Ini
            </span>
            <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
              {formatRupiah(totalPengeluaran)}
            </p>
            <span className="text-[11px] text-red-700/80 dark:text-red-400/80 block mt-1">
              {filteredExpenses.length} transaksi pengeluaran
            </span>
          </div>

          {/* Belanja Bahan Baku */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
              📦 Belanja Bahan Baku
            </span>
            <p className="text-2xl font-black text-amber-900 dark:text-amber-300 mt-1">
              {formatRupiah(totalBahanBaku)}
            </p>
            <span className="text-[11px] text-amber-800/80 dark:text-amber-400/80 block mt-1">
              Kain, Tinta, Film, Chemical
            </span>
          </div>

          {/* Gaji Karyawan */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 dark:text-indigo-400 block">
              👷 Gaji & Upah Borongan
            </span>
            <p className="text-2xl font-black text-indigo-900 dark:text-indigo-300 mt-1">
              {formatRupiah(totalGaji)}
            </p>
            <span className="text-[11px] text-indigo-800/80 dark:text-indigo-400/80 block mt-1">
              Sablon & Jahit Borongan
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Omzet Bar Graph (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Grafik Omzet Per Pesanan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualisasi nilai transaksi per pesanan yang berkontribusi pada target omset
              </p>
            </div>
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickFormatter={(v) => `Rp ${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(val) => [formatRupiah(Number(val)), 'Nilai Omzet']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.orderNumber} (${item.customer})` : label;
                  }}
                  contentStyle={{
                    borderRadius: '12px',
                    fontSize: '12px',
                    borderColor: '#6366f1',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="omzet" fill="#4f46e5" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index % 2 === 0 ? '#4f46e5' : '#6366f1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Performance by Admin / Staff Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Performa Sales Admin
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kontribusi tim admin penjualan terhadap realisasi target omset
            </p>

            <div className="space-y-3.5 mt-4">
              {adminSalesList.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Belum ada transaksi di periode ini.
                </div>
              ) : (
                adminSalesList.map((admin, idx) => {
                  const share =
                    totalOmzet > 0 ? Math.round((admin.totalOmzet / totalOmzet) * 100) : 0;
                  return (
                    <div
                      key={admin.name}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black dark:bg-indigo-950 dark:text-indigo-300">
                            #{idx + 1}
                          </span>
                          {admin.name}
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                          {formatRupiah(admin.totalOmzet)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{admin.count} Transaksi Order</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {share}% dari total omzet
                        </span>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              Target omset usaha dapat disesuaikan kapan saja lewat tombol Ubah Target atau menu Pengaturan.
            </span>
          </div>
        </div>
      </div>

      {/* Target Setting Modal */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Set Target Omset Bulanan
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Atur sasaran omset penjualan usaha sablon
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Omset (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-extrabold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000000}
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Preset buttons */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2">
                  Pilihan Cepat Target Omset:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[25000000, 50000000, 75000000, 100000000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplyPresetTarget(preset)}
                      className={`p-2 rounded-xl text-xs font-bold border transition ${
                        Number(targetInput) === preset
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-500 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {formatRupiah(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Capaian Saat Ini:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(totalOmzet)}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Proyeksi Persentase Target Baru:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {Number(targetInput) > 0
                      ? `${Math.round((totalOmzet / Number(targetInput)) * 100)}%`
                      : '0%'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveTarget}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Target Omset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
