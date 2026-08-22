import React, { useState, useMemo } from 'react';
import {
  Building2,
  Calendar,
  Check,
  Clipboard,
  CreditCard,
  DollarSign,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Image,
  Package,
  Plus,
  Receipt,
  Search,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { formatDateShort, formatRupiah } from '../../lib/utils';
import { Expense, ExpenseCategory, Order, PaymentMethod, User } from '../../types';
import { ConfirmModal } from '../ConfirmModal';

interface ExpensesViewProps {
  expenses?: Expense[];
  orders?: Order[];
  currentUser?: User;
  userRole?: string;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses = [],
  orders = [],
  currentUser = { id: 'u1', username: 'admin', name: 'Admin', role: 'admin' },
  userRole = 'admin',
  onSaveExpense,
  onDeleteExpense,
}) => {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [successToast, setSuccessToast] = useState<string>('');
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Form State
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('bahan_baku');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formQuantity, setFormQuantity] = useState<number | ''>('');
  const [formUnit, setFormUnit] = useState<string>('kg');
  const [formUnitPrice, setFormUnitPrice] = useState<number | ''>('');
  const [formVendor, setFormVendor] = useState<string>('');
  const [formOrderId, setFormOrderId] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('Transfer Bank');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formReceiptUrl, setFormReceiptUrl] = useState<string>('');

  // Generate dynamic month list for filter
  const monthOptions = useMemo(() => {
    const list: { key: string; label: string }[] = [];
    const date = new Date();
    // 12 months backwards and 1 forward
    for (let i = -1; i <= 10; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      list.push({ key, label: `${label}${i === 0 ? ' (Bulan Ini)' : ''}` });
    }
    return list;
  }, []);

  // Filter logic
  const filteredExpenses = expenses.filter((item) => {
    // Filter Category
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    // Filter Month
    if (selectedMonth !== 'all') {
      if (!item.date.startsWith(selectedMonth)) return false;
    }
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchVendor = (item.recipientOrVendor || '').toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      const matchOrder = (item.relatedOrderId || '').toLowerCase().includes(q);
      const matchUser = (item.recordedBy || '').toLowerCase().includes(q);
      if (!matchTitle && !matchVendor && !matchNotes && !matchOrder && !matchUser) {
        return false;
      }
    }
    return true;
  });

  // Financial Summaries for active month
  const activeMonthExpenses = expenses.filter((e) =>
    selectedMonth === 'all' ? true : e.date.startsWith(selectedMonth)
  );

  const totalExpenseMonth = activeMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalBahanBakuMonth = activeMonthExpenses
    .filter((e) => e.category === 'bahan_baku')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalGajiMonth = activeMonthExpenses
    .filter((e) => e.category === 'gaji_karyawan')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalOperasionalMonth = activeMonthExpenses
    .filter((e) => e.category === 'operasional' || e.category === 'lainnya')
    .reduce((sum, e) => sum + e.amount, 0);

  const handleOpenAddModal = (defaultCat: ExpenseCategory = 'bahan_baku') => {
    setEditingExpense(null);
    setFormError('');
    setFormCategory(defaultCat);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormTitle('');
    setFormAmount('');
    setFormQuantity('');
    setFormUnit(defaultCat === 'bahan_baku' ? 'kg' : defaultCat === 'gaji_karyawan' ? 'pcs' : 'bulan');
    setFormUnitPrice('');
    setFormVendor('');
    setFormOrderId('');
    setFormPaymentMethod('Transfer Bank');
    setFormNotes('');
    setFormReceiptUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormError('');
    setFormCategory(exp.category);
    setFormDate(exp.date);
    setFormTitle(exp.title);
    setFormAmount(exp.amount);
    setFormQuantity(exp.quantity !== undefined ? exp.quantity : '');
    setFormUnit(exp.unit || 'kg');
    setFormUnitPrice(exp.unitPrice !== undefined ? exp.unitPrice : '');
    setFormVendor(exp.recipientOrVendor || '');
    setFormOrderId(exp.relatedOrderId || '');
    setFormPaymentMethod(exp.paymentMethod);
    setFormNotes(exp.notes || '');
    setFormReceiptUrl(exp.receiptUrl || '');
    setIsModalOpen(true);
  };

  // Auto calculate total when qty or unit price changes
  const handleQuantityChange = (qtyVal: string) => {
    if (qtyVal === '') {
      setFormQuantity('');
      return;
    }
    const num = parseFloat(qtyVal);
    if (!isNaN(num) && num >= 0) {
      setFormQuantity(num);
      if (typeof formUnitPrice === 'number' && formUnitPrice > 0) {
        setFormAmount(Math.round(num * formUnitPrice));
      }
    }
  };

  const handleUnitPriceChange = (priceVal: string) => {
    if (priceVal === '') {
      setFormUnitPrice('');
      return;
    }
    const num = parseFloat(priceVal);
    if (!isNaN(num) && num >= 0) {
      setFormUnitPrice(num);
      if (typeof formQuantity === 'number' && formQuantity > 0) {
        setFormAmount(Math.round(formQuantity * num));
      }
    }
  };

  const handleAddQuickAmount = (addValue: number) => {
    const current = typeof formAmount === 'number' ? formAmount : 0;
    setFormAmount(current + addValue);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = typeof formAmount === 'number' ? formAmount : parseFloat(String(formAmount)) || 0;

    if (!formTitle.trim()) {
      setFormError('Judul / deskripsi pengeluaran wajib diisi.');
      return;
    }

    const newExpense: Expense = {
      id: editingExpense ? editingExpense.id : 'exp-' + Date.now().toString(36),
      date: formDate,
      category: formCategory,
      title: formTitle.trim(),
      amount: parsedAmount,
      quantity: typeof formQuantity === 'number' ? formQuantity : undefined,
      unit: formUnit || undefined,
      unitPrice: typeof formUnitPrice === 'number' ? formUnitPrice : undefined,
      recipientOrVendor: formVendor.trim() || undefined,
      relatedOrderId: formOrderId || undefined,
      paymentMethod: formPaymentMethod,
      notes: formNotes.trim() || undefined,
      recordedBy: editingExpense ? editingExpense.recordedBy : currentUser.name,
      receiptUrl: formReceiptUrl || undefined,
      createdAt: editingExpense ? editingExpense.createdAt : new Date().toISOString(),
    };

    onSaveExpense(newExpense);
    setIsModalOpen(false);
    setSuccessToast(editingExpense ? 'Pengeluaran berhasil diperbarui!' : 'Pengeluaran berhasil dicatat!');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Image compression for receipt photos to save storage
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.7);
          setFormReceiptUrl(compressed);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processImageFile(files[0]);
    }
  };

  const getCategoryBadge = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'bahan_baku':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <Package className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Belanja Bahan Baku
          </span>
        );
      case 'gaji_karyawan':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
            <UserCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Gaji & Upah Karyawan
          </span>
        );
      case 'operasional':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <Building2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
            Operasional
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-300">
            <Tag className="h-3.5 w-3.5" />
            Lainnya
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black animate-fadeIn">
          <Check className="h-4 w-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-900/40">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-7 w-7 text-amber-400" />
            <h1 className="text-2xl font-black tracking-tight">Pencatatan & History Pengeluaran</h1>
          </div>
          <p className="text-sm text-indigo-200/80">
            Kelola riwayat belanja bahan baku kaos, tinta sablon, gaji & upah borongan karyawan, serta operasional workshop.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={() => handleOpenAddModal('bahan_baku')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Belanja Bahan Baku</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('gaji_karyawan')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-md flex items-center gap-1.5 border border-indigo-400/30 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Gaji / Upah Karyawan</span>
          </button>
          <button
            onClick={() => handleOpenAddModal('operasional')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs transition shadow-md flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Operasional & Lainnya</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pengeluaran */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Pengeluaran Bulan Ini
            </span>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-200 dark:border-red-900">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400">
            {formatRupiah(totalExpenseMonth)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1">
            <span>{activeMonthExpenses.length} total pengeluaran tercatat</span>
          </div>
        </div>

        {/* Card 2: Belanja Bahan Baku */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              📦 Belanja Bahan Baku
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-200">
            {formatRupiah(totalBahanBakuMonth)}
          </div>
          <div className="text-[11px] font-bold text-amber-700/80 dark:text-amber-400/80 mt-2">
            {activeMonthExpenses.filter((e) => e.category === 'bahan_baku').length} transaksi bahan baku
          </div>
        </div>

        {/* Card 3: Gaji Karyawan */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              👷 Gaji & Upah Karyawan
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-950 dark:text-indigo-200">
            {formatRupiah(totalGajiMonth)}
          </div>
          <div className="text-[11px] font-bold text-indigo-700/80 dark:text-indigo-400/80 mt-2">
            {activeMonthExpenses.filter((e) => e.category === 'gaji_karyawan').length} pembayaran gaji/borongan
          </div>
        </div>

        {/* Card 4: Operasional & Lainnya */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              ⚙️ Operasional & Lainnya
            </span>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatRupiah(totalOperasionalMonth)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-2">
            Listrik, BBM, Konsumsi & Tooling
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Tabs Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-indigo-600 dark:text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Semua ({expenses.length})
            </button>
            <button
              onClick={() => setSelectedCategory('bahan_baku')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === 'bahan_baku'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>Bahan Baku ({expenses.filter((e) => e.category === 'bahan_baku').length})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('gaji_karyawan')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === 'gaji_karyawan'
                  ? 'bg-indigo-600 text-white font-black shadow-xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Gaji Karyawan ({expenses.filter((e) => e.category === 'gaji_karyawan').length})</span>
            </button>
            <button
              onClick={() => setSelectedCategory('operasional')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                selectedCategory === 'operasional'
                  ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>Operasional ({expenses.filter((e) => e.category === 'operasional' || e.category === 'lainnya').length})</span>
            </button>
          </div>

          {/* Month & Search Inputs */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Month */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Calendar className="h-4 w-4 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Periode</option>
                {monthOptions.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari deskripsi, vendor, order..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expense History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Tabel History Pengeluaran
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {filteredExpenses.length} data
            </span>
          </div>

          <button
            onClick={() => handleOpenAddModal('bahan_baku')}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Catat Pengeluaran
          </button>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Receipt className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Belum ada riwayat pengeluaran yang sesuai filter.
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Silakan klik tombol "Belanja Bahan Baku", "Gaji Karyawan", atau "Operasional" untuk mencatat pengeluaran.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Deskripsi & Pemasok/Penerima</th>
                  <th className="py-3.5 px-4">Jumlah & Satuan</th>
                  <th className="py-3.5 px-4">Link Order</th>
                  <th className="py-3.5 px-4">Metode & Pencatat</th>
                  <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Tanggal */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-700 dark:text-slate-300">
                      {exp.date}
                    </td>

                    {/* Kategori */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getCategoryBadge(exp.category)}
                    </td>

                    {/* Deskripsi & Pemasok */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-extrabold text-slate-900 dark:text-white leading-snug">
                        {exp.title}
                      </div>
                      {exp.recipientOrVendor && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span>{exp.recipientOrVendor}</span>
                        </div>
                      )}
                      {exp.notes && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5 line-clamp-1">
                          "{exp.notes}"
                        </p>
                      )}
                    </td>

                    {/* Jumlah & Satuan */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {exp.quantity ? (
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-200">
                            {exp.quantity} {exp.unit || 'pcs'}
                          </span>
                          {exp.unitPrice && (
                            <div className="text-[10px] text-slate-400">
                              @ {formatRupiah(exp.unitPrice)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    {/* Link Order */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {exp.relatedOrderId ? (
                        <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900">
                          {exp.relatedOrderId}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>

                    {/* Metode & Pencatat */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-700 dark:text-slate-300">
                        {exp.paymentMethod}
                      </div>
                      <div className="text-[10px] text-slate-400">by {exp.recordedBy}</div>
                    </td>

                    {/* Nominal */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <span className="font-black text-sm text-red-600 dark:text-red-400">
                        {formatRupiah(exp.amount)}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        {exp.receiptUrl && (
                          <button
                            onClick={() => setReceiptPreviewUrl(exp.receiptUrl || null)}
                            title="Lihat Bukti Nota Belanja"
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(exp)}
                          title="Edit Pengeluaran"
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingExpense(exp)}
                          title="Hapus"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Input/Edit Pengeluaran */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingExpense ? 'Edit Catatan Pengeluaran' : 'Tambah Catatan Pengeluaran Baru'}
                  </h3>
                  <p className="text-xs text-indigo-200/80">
                    Catat pengeluaran bahan baku, gaji borongan, atau operasional bengkel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} onPaste={handlePaste} className="p-6 space-y-4 overflow-y-auto">
              {/* Inline Error Banner */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Category Selector Buttons */}
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-2">
                  Kategori Pengeluaran <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('bahan_baku');
                      if (!formUnit) setFormUnit('kg');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formCategory === 'bahan_baku'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="h-4 w-4 mb-1" />
                    <span className="text-xs font-extrabold block">Bahan Baku</span>
                    <span className="text-[10px] opacity-80 font-normal">Kain, Tinta, Film, Obat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('gaji_karyawan');
                      if (!formUnit) setFormUnit('pcs');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      formCategory === 'gaji_karyawan'
                        ? 'bg-indigo-600 text-white border-indigo-700 font-black shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="h-4 w-4 mb-1" />
                    <span className="text-xs font-extrabold block">Gaji Karyawan</span>
                    <span className="text-[10px] opacity-80 font-normal">Borongan Jahit, Sablon</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormCategory('operasional');
                      if (!formUnit) setFormUnit('bulan');
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer col-span-2 sm:col-span-1 ${
                      formCategory === 'operasional'
                        ? 'bg-slate-800 text-white border-slate-900 font-black shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="h-4 w-4 mb-1" />
                    <span className="text-xs font-extrabold block">Operasional</span>
                    <span className="text-[10px] opacity-80 font-normal">PLN, BBM, Konsumsi</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide block">
                  Pilihan Cepat (Preset Judul):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(formCategory === 'bahan_baku'
                    ? [
                        'Pembelian Kain Cotton Combed 24s',
                        'Pembelian Kain Cotton Combed 30s',
                        'Pembelian Tinta Sablon Plastisol',
                        'Pembelian Film DTF & Powder Glue',
                        'Pembelian Emulsi & Obat Afdruk',
                        'Rib Kaos & Aksesoris',
                      ]
                    : formCategory === 'gaji_karyawan'
                    ? [
                        'Gaji Pokok Operator Sablon',
                        'Upah Borongan Jahit Kaos',
                        'Gaji Operator DTF',
                        'Upah Finishing & Packing',
                        'Bonus & Uang Makan Tim',
                      ]
                    : [
                        'Listrik Workshop PLN',
                        'BBM & Transportasi Kurir',
                        'Pembelian Alat & Maintenance Mesin',
                        'Konsumsi Lembur Karyawan',
                      ]
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setFormTitle(preset)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg border font-bold transition cursor-pointer ${
                        formTitle === preset
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid 1: Tanggal & Judul */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Judul / Deskripsi Pengeluaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pembelian Kain Cotton Combed 24s 50kg"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Grid 2: Quantity, Satuan, Harga Satuan, Nominal Total */}
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                      Jumlah (Qty)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="0"
                      value={formQuantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-black text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                      Satuan
                    </label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value="kg">kg (Kilogram)</option>
                      <option value="pcs">pcs (Buah)</option>
                      <option value="roll">roll</option>
                      <option value="meter">meter</option>
                      <option value="liter">liter</option>
                      <option value="orang">orang</option>
                      <option value="bulan">bulan</option>
                      <option value="paket">paket</option>
                    </select>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                      Harga / Satuan
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="Rp / unit"
                      value={formUnitPrice}
                      onChange={(e) => handleUnitPriceChange(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-black text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Total Nominal Field with Live Rupiah Preview & Quick Buttons */}
                <div className="p-4 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      <span>Nominal Total Pengeluaran</span>
                    </label>
                    {typeof formAmount === 'number' && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800">
                        {formatRupiah(formAmount)}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-black text-slate-400 select-none">
                      Rp
                    </span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0"
                      value={formAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormAmount(val === '' ? '' : parseFloat(val));
                      }}
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900 text-base font-black text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600 focus:ring-3 focus:ring-indigo-500/15 transition"
                    />
                  </div>

                  {/* Quick Addition Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[11px] font-bold text-slate-400 mr-1">Tambah Cepat:</span>
                    {[
                      { label: '+50rb', val: 50000 },
                      { label: '+100rb', val: 100000 },
                      { label: '+500rb', val: 500000 },
                      { label: '+1jt', val: 1000000 },
                      { label: '+5jt', val: 5000000 },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleAddQuickAmount(chip.val)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-300 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      >
                        {chip.label}
                      </button>
                    ))}
                    {formAmount !== '' && (
                      <button
                        type="button"
                        onClick={() => setFormAmount('')}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Grid 3: Vendor / Penerima & Link Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Pemasok / Nama Penerima
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Toko Tekstil Sinar Mulia / Nama Karyawan"
                    value={formVendor}
                    onChange={(e) => setFormVendor(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Hubungkan dengan Order (Opsional)
                  </label>
                  <select
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Tanpa Link Order --</option>
                    {(orders || []).map((o) => (
                      <option key={o.id} value={o.orderNumber}>
                        {o.orderNumber} - {o.customerName} ({o.items[0]?.productName || 'Order'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 4: Payment Method & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="Cash">Cash / Tunai</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Catatan / Keterangan Tambahan
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pembelian kain untuk order Komunitas 100pcs"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Receipt / Proof Upload with Screenshot Paste Support */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Foto Bukti Nota / Kwitansi Belanja (Opsional)</span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                    Bisa Ctrl + V / Screenshot Paste
                  </span>
                </label>
                
                <div
                  onPaste={handlePaste}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`p-4 rounded-2xl border-2 border-dashed transition relative ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/80 shadow-md scale-[1.01]'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 hover:border-indigo-400 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                  }`}
                >
                  {formReceiptUrl ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={formReceiptUrl}
                          alt="Bukti Nota"
                          className="h-16 w-16 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Check className="h-4 w-4" /> Foto Bukti Terpasang
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            Tempel screenshot baru <kbd className="px-1 py-0.2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] rounded">Ctrl+V</kbd> atau ganti file.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormReceiptUrl('')}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 font-bold text-xs shrink-0 cursor-pointer"
                        title="Hapus foto"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                          <Clipboard className="h-5 w-5" />
                        </div>
                      </div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                        Upload Foto, Drag & Drop, atau <span className="text-indigo-600 dark:text-indigo-400 underline">Paste (Ctrl + V)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                        Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold">Ctrl + V</kbd> (atau <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-[10px] font-bold">Cmd + V</kbd>) langsung setelah menyalin screenshot nota belanja dari WA / browser.
                      </p>

                      <label className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5">
                        <Upload className="h-3.5 w-3.5" />
                        Pilih File Foto Nota
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4 stroke-[3]" />
                  Simpan Catatan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Receipt Photo */}
      {receiptPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-5 border border-slate-800 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-500" />
                Bukti Nota / Kwitansi Belanja
              </h4>
              <button
                type="button"
                onClick={() => setReceiptPreviewUrl(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 max-h-[70vh] flex items-center justify-center">
              <img
                src={receiptPreviewUrl}
                alt="Bukti Nota Belanja"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingExpense}
        title="Hapus Catatan Pengeluaran"
        message={`Apakah Anda yakin ingin menghapus catatan pengeluaran "${deletingExpense?.title}"?`}
        confirmLabel="Ya, Hapus"
        isDanger={true}
        onClose={() => setDeletingExpense(null)}
        onConfirm={() => {
          if (deletingExpense) {
            onDeleteExpense(deletingExpense.id);
            setSuccessToast('Catatan pengeluaran berhasil dihapus.');
            setTimeout(() => setSuccessToast(''), 4000);
          }
        }}
      />
    </div>
  );
};
