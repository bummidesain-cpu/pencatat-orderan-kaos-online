import React, { useState } from 'react';
import {
  BadgePercent,
  Calculator,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  Filter,
  Grid,
  Info,
  Layers,
  List,
  Plus,
  Printer,
  Search,
  Share2,
  Sparkles,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { formatRupiah } from '../../lib/utils';
import { PriceCategory, PriceListItem, UserRole } from '../../types';

interface PriceListViewProps {
  priceList: PriceListItem[];
  userRole: UserRole;
  onSaveItem: (item: Omit<PriceListItem, 'id' | 'updatedAt'> & { id?: string }) => void;
  onDeleteItem: (id: string) => void;
}

const CATEGORIES: { id: PriceCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'Semua Produk', icon: '📦' },
  { id: 'kaos', label: 'Kaos & T-Shirt', icon: '👕' },
  { id: 'polo', label: 'Polo Shirt', icon: '👔' },
  { id: 'hoodie_jaket', label: 'Hoodie & Jaket', icon: '🧥' },
  { id: 'jersey_sublim', label: 'Jersey Sublim', icon: '⚽' },
  { id: 'jasa_sablon', label: 'Jasa Sablon & DTF', icon: '🎨' },
  { id: 'biaya_tambahan', label: 'Size & Extra Addons', icon: '🏷️' },
  { id: 'lainnya', label: 'Lain-lain', icon: '📌' },
];

export const PriceListView: React.FC<PriceListViewProps> = ({
  priceList,
  userRole,
  onSaveItem,
  onDeleteItem,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PriceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedGeneral, setCopiedGeneral] = useState(false);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceListItem | null>(null);

  // Calculator Modal State
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcProductId, setCalcProductId] = useState<string>(priceList[0]?.id || '');
  const [calcQty, setCalcQty] = useState<number>(30);
  const [calcLenganPanjangQty, setCalcLenganPanjangQty] = useState<number>(0);
  const [calcXXLQty, setCalcXXLQty] = useState<number>(0);
  const [calcNotes, setCalcNotes] = useState<string>('');
  const [copiedCalcText, setCopiedCalcText] = useState(false);

  // Form state
  const [formCategory, setFormCategory] = useState<PriceCategory>('kaos');
  const [formName, setFormName] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formSpecs, setFormSpecs] = useState('');
  const [formBaseUnit, setFormBaseUnit] = useState('pcs');
  const [formIsTier, setFormIsTier] = useState(true);
  const [formFixedPrice, setFormFixedPrice] = useState<number>(10000);
  const [formNotes, setFormNotes] = useState('');
  const [formIsPopular, setFormIsPopular] = useState(false);

  // Tier form state
  const [formTiers, setFormTiers] = useState<
    { minQty: number; maxQty?: number; label: string; price: number }[]
  >([
    { minQty: 12, maxQty: 23, label: '12 - 23 pcs', price: 60000 },
    { minQty: 24, maxQty: 59, label: '24 - 59 pcs', price: 54000 },
    { minQty: 60, maxQty: 119, label: '60 - 119 pcs', price: 49000 },
    { minQty: 120, label: '>= 120 pcs', price: 44000 },
  ]);

  // Filter items
  const filteredItems = priceList.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.materialFabric && item.materialFabric.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.includedSpecs && item.includedSpecs.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormCategory('kaos');
    setFormName('');
    setFormMaterial('');
    setFormSpecs('');
    setFormBaseUnit('pcs');
    setFormIsTier(true);
    setFormFixedPrice(10000);
    setFormNotes('');
    setFormIsPopular(false);
    setFormTiers([
      { minQty: 12, maxQty: 23, label: '12 - 23 pcs', price: 60000 },
      { minQty: 24, maxQty: 59, label: '24 - 59 pcs', price: 54000 },
      { minQty: 60, maxQty: 119, label: '60 - 119 pcs', price: 49000 },
      { minQty: 120, label: '>= 120 pcs', price: 44000 },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: PriceListItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormName(item.name);
    setFormMaterial(item.materialFabric || '');
    setFormSpecs(item.includedSpecs || '');
    setFormBaseUnit(item.baseUnit || 'pcs');
    setFormIsTier(item.tierPrices && item.tierPrices.length > 0);
    setFormFixedPrice(item.fixedUnitPrice || 0);
    setFormNotes(item.notes || '');
    setFormIsPopular(!!item.isPopular);
    setFormTiers(
      item.tierPrices && item.tierPrices.length > 0
        ? item.tierPrices
        : [
            { minQty: 12, maxQty: 23, label: '12 - 23 pcs', price: 60000 },
            { minQty: 24, maxQty: 59, label: '24 - 59 pcs', price: 54000 },
            { minQty: 60, maxQty: 119, label: '60 - 119 pcs', price: 49000 },
            { minQty: 120, label: '>= 120 pcs', price: 44000 },
          ]
    );
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    onSaveItem({
      id: editingItem?.id,
      category: formCategory,
      name: formName.trim(),
      materialFabric: formMaterial.trim(),
      includedSpecs: formSpecs.trim(),
      baseUnit: formBaseUnit,
      tierPrices: formIsTier ? formTiers : [],
      fixedUnitPrice: !formIsTier ? formFixedPrice : undefined,
      notes: formNotes.trim(),
      isPopular: formIsPopular,
    });

    setIsModalOpen(false);
  };

  const handleCopySingleWA = (item: PriceListItem) => {
    let text = `*PRICELIST ${item.name.toUpperCase()}*\n`;
    if (item.materialFabric) text += `📍 Bahan: ${item.materialFabric}\n`;
    if (item.includedSpecs) text += `✨ Specs: ${item.includedSpecs}\n`;

    if (item.tierPrices && item.tierPrices.length > 0) {
      text += `\n*Daftar Harga Bertingkat:*\n`;
      item.tierPrices.forEach((t) => {
        text += `• ${t.label}: ${formatRupiah(t.price)} / ${item.baseUnit}\n`;
      });
    } else if (item.fixedUnitPrice) {
      text += `\n*Tarif Addon:* ${formatRupiah(item.fixedUnitPrice)} / ${item.baseUnit}\n`;
    }

    if (item.notes) text += `\n💡 Catatan: ${item.notes}\n`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopyAllWA = () => {
    let text = `*KATALOG PRICELIST RESMI ORDER MANAGEMENT SYSTEM*\n`;
    text += `========================================\n\n`;

    filteredItems.forEach((item, idx) => {
      text += `${idx + 1}. *${item.name}*\n`;
      if (item.materialFabric) text += `   Bahan: ${item.materialFabric}\n`;
      if (item.includedSpecs) text += `   Specs: ${item.includedSpecs}\n`;

      if (item.tierPrices && item.tierPrices.length > 0) {
        text += `   Harga: ${item.tierPrices
          .map((t) => `${t.label} (${formatRupiah(t.price)})`)
          .join(' | ')}\n`;
      } else if (item.fixedUnitPrice) {
        text += `   Tarif: ${formatRupiah(item.fixedUnitPrice)} / ${item.baseUnit}\n`;
      }
      text += `\n`;
    });

    text += `----------------------------------------\n`;
    text += `*Info Order & Konsultasi Desain Gratis:* WA 0812-3456-7890`;

    navigator.clipboard.writeText(text);
    setCopiedGeneral(true);
    setTimeout(() => setCopiedGeneral(false), 2500);
  };

  // Selected calc item computation
  const selectedCalcProduct = priceList.find((p) => p.id === calcProductId) || priceList[0];

  const getTierPriceForQty = (product: PriceListItem, qty: number): number => {
    if (!product || !product.tierPrices || product.tierPrices.length === 0) {
      return product?.fixedUnitPrice || 0;
    }
    const found = product.tierPrices.find((t) => {
      if (t.maxQty) {
        return qty >= t.minQty && qty <= t.maxQty;
      }
      return qty >= t.minQty;
    });

    if (found) return found.price;
    // Fallback if below minimum qty
    return product.tierPrices?.[0]?.price || 0;
  };

  const calcUnitPrice = selectedCalcProduct ? getTierPriceForQty(selectedCalcProduct, calcQty) : 0;
  const calcProductSubtotal = calcUnitPrice * calcQty;

  // Additional addon pricing calculation
  const extraLenganPriceItem = priceList.find((p) => p.name.toLowerCase().includes('lengan panjang'));
  const extraLenganUnitPrice = extraLenganPriceItem?.fixedUnitPrice || 10000;
  const calcLenganTotal = calcLenganPanjangQty * extraLenganUnitPrice;

  const extraXXLPriceItem = priceList.find(
    (p) => p.name.toLowerCase().includes('xxl') || p.name.toLowerCase().includes('big size')
  );
  const extraXXLUnitPrice = extraXXLPriceItem?.fixedUnitPrice || 7500;
  const calcXXLTotal = calcXXLQty * extraXXLUnitPrice;

  const calcGrandTotal = calcProductSubtotal + calcLenganTotal + calcXXLTotal;
  const calcAvgPerPcs = calcQty > 0 ? Math.round(calcGrandTotal / calcQty) : 0;

  const handleCopyCalcResultWA = () => {
    if (!selectedCalcProduct) return;
    let text = `*PENAWARAN ESTIMASI HARGA ORDER MANAGEMENT SYSTEM*\n`;
    text += `========================================\n`;
    text += `📋 *Produk:* ${selectedCalcProduct.name}\n`;
    if (selectedCalcProduct.materialFabric) text += `👕 *Bahan:* ${selectedCalcProduct.materialFabric}\n`;
    if (selectedCalcProduct.includedSpecs) text += `✨ *Specs:* ${selectedCalcProduct.includedSpecs}\n`;
    text += `🔢 *Jumlah Order:* ${calcQty} pcs\n`;
    text += `----------------------------------------\n`;
    text += `• Harga Satuan Base: ${formatRupiah(calcUnitPrice)} / pcs\n`;
    text += `• Subtotal Produk (${calcQty} pcs): ${formatRupiah(calcProductSubtotal)}\n`;

    if (calcLenganPanjangQty > 0) {
      text += `• Extra Lengan Panjang (${calcLenganPanjangQty} pcs @ ${formatRupiah(extraLenganUnitPrice)}): ${formatRupiah(calcLenganTotal)}\n`;
    }
    if (calcXXLQty > 0) {
      text += `• Extra Size XXL/Jumbo (${calcXXLQty} pcs @ ${formatRupiah(extraXXLUnitPrice)}): ${formatRupiah(calcXXLTotal)}\n`;
    }

    text += `----------------------------------------\n`;
    text += `💰 *TOTAL ESTIMASI:* ${formatRupiah(calcGrandTotal)}\n`;
    text += `📊 (Rata-rata: ${formatRupiah(calcAvgPerPcs)} / pcs)\n`;
    if (calcNotes.trim()) text += `\n💬 *Catatan:* ${calcNotes.trim()}\n`;
    text += `\n*Sudah Termasuk:* Packing rapi + Garansi Hasil Cetak 14 Hari.`;

    navigator.clipboard.writeText(text);
    setCopiedCalcText(true);
    setTimeout(() => setCopiedCalcText(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <BadgePercent className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                Daftar Harga & Katalis Produk
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acuan patokan tarif bertingkat (tier qty) & biaya tambahan penawaran vendor konveksi & sablon
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCalcOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Calculator className="h-4 w-4" />
            <span>Simulasi Hitung WA Quote</span>
          </button>

          <button
            onClick={handleCopyAllWA}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {copiedGeneral ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span>Format WA Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Katalis WA</span>
              </>
            )}
          </button>

          {userRole !== 'produksi' && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Produk Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari bahan (Combed 24s, 30s, Fleece, DTF, Plastisol, Lengan Panjang)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl self-start sm:self-auto shrink-0 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Kartu Grid</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Tabel Matriks</span>
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Display List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-16 h-16 mx-auto flex items-center justify-center text-slate-400">
            <Tag className="h-8 w-8" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
            Tidak Ada Produk Ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Coba ubah kata kunci pencarian atau pilih kategori lain. Anda juga dapat menambahkan tarif baru ke dalam katalog.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden relative group"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                      {item.category.replace('_', ' ').toUpperCase()}
                    </span>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                      {item.name}
                    </h3>
                  </div>

                  {item.isPopular && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shrink-0 shadow-xs">
                      <Star className="h-3 w-3 fill-slate-950" />
                      Best Seller
                    </span>
                  )}
                </div>

                {item.materialFabric && (
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span className="text-slate-400 font-normal">Bahan:</span> {item.materialFabric}
                  </p>
                )}

                {item.includedSpecs && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>{item.includedSpecs}</span>
                  </p>
                )}
              </div>

              {/* Card Body - Prices */}
              <div className="p-5 flex-1 space-y-3">
                {item.tierPrices && item.tierPrices.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Harga Bertingkat (Tier Qty):
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {item.tierPrices.map((t, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-2xl border text-center transition ${
                            idx === item.tierPrices.length - 1
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                            {t.label}
                          </span>
                          <span className="text-sm font-black text-slate-900 dark:text-white block mt-0.5">
                            {formatRupiah(t.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : item.fixedUnitPrice ? (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
                      Tarif Addon Fixed:
                    </span>
                    <span className="text-xl font-black text-amber-900 dark:text-amber-300 mt-1 block">
                      {formatRupiah(item.fixedUnitPrice)} / {item.baseUnit}
                    </span>
                  </div>
                ) : null}

                {item.notes && (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                    <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item.notes}</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleCopySingleWA(item)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy WA</span>
                    </>
                  )}
                </button>

                {userRole !== 'produksi' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition cursor-pointer"
                      title="Edit Produk"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition cursor-pointer"
                      title="Hapus Produk"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* MATRIX TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-black uppercase text-slate-500 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Nama Produk / Material</th>
                  <th className="p-4">Specs Kelengkapan</th>
                  <th className="p-4 text-center">12 - 23 pcs</th>
                  <th className="p-4 text-center">24 - 59 pcs</th>
                  <th className="p-4 text-center">60 - 119 pcs</th>
                  <th className="p-4 text-center bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                    ≥ 120 pcs
                  </th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredItems.map((item) => {
                  const t1 = item.tierPrices?.find((t) => t.minQty === 12 || t.label.includes('12'));
                  const t2 = item.tierPrices?.find((t) => t.minQty === 24 || t.label.includes('24'));
                  const t3 = item.tierPrices?.find((t) => t.minQty === 60 || t.label.includes('60'));
                  const t4 = item.tierPrices?.find((t) => t.minQty >= 120 || t.label.includes('120'));

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="p-4 max-w-xs">
                        <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.isPopular && (
                            <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full">
                              Best
                            </span>
                          )}
                        </div>
                        {item.materialFabric && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.materialFabric}</div>
                        )}
                      </td>

                      <td className="p-4 max-w-xs">
                        <span className="text-slate-600 dark:text-slate-300 block">{item.includedSpecs || '-'}</span>
                        {item.notes && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 italic">{item.notes}</span>
                        )}
                      </td>

                      {item.tierPrices && item.tierPrices.length > 0 ? (
                        <>
                          <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-200">
                            {t1 ? formatRupiah(t1.price) : '-'}
                          </td>
                          <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-200">
                            {t2 ? formatRupiah(t2.price) : '-'}
                          </td>
                          <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-200">
                            {t3 ? formatRupiah(t3.price) : '-'}
                          </td>
                          <td className="p-4 text-center font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                            {t4 ? formatRupiah(t4.price) : '-'}
                          </td>
                        </>
                      ) : (
                        <td colSpan={4} className="p-4 text-center font-black text-amber-600 dark:text-amber-400">
                          Tarif Fixed Addon: {formatRupiah(item.fixedUnitPrice || 0)} / {item.baseUnit}
                        </td>
                      )}

                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleCopySingleWA(item)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition cursor-pointer"
                            title="Copy Format WA"
                          >
                            {copiedId === item.id ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-slate-500" />
                            )}
                          </button>
                          {userRole !== 'produksi' && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onDeleteItem(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CALCULATOR MODAL FOR WA QUOTES */}
      {isCalcOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Calculator className="h-6 w-6" />
                <h3 className="text-base font-black">Simulasi Penawaran Harga WA Quick Quote</h3>
              </div>
              <button
                onClick={() => setIsCalcOpen(false)}
                className="p-1.5 rounded-full bg-slate-950/10 hover:bg-slate-950/20 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-1">
                  Pilih Produk Dari Katalog:
                </label>
                <select
                  value={calcProductId}
                  onChange={(e) => setCalcProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {priceList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.materialFabric ? `(${p.materialFabric})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Jumlah Order (Pcs):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={calcQty}
                    onChange={(e) => setCalcQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Qty Lengan Panjang:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={calcLenganPanjangQty}
                    onChange={(e) => setCalcLenganPanjangQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Qty Size XXL Jumbo:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={calcXXLQty}
                    onChange={(e) => setCalcXXLQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Khusus (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Estimasi pengerjaan 5 hari kerja, Garansi hasil cetak."
                  value={calcNotes}
                  onChange={(e) => setCalcNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              {/* Simulation Result Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-950 text-white space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-800 pb-2">
                  <span className="text-[11px] font-extrabold text-indigo-300 uppercase">
                    Hasil Simulasi Penawaran:
                  </span>
                  <span className="text-xs font-black text-amber-400">
                    Tier Qty {calcQty} pcs: {formatRupiah(calcUnitPrice)} / pcs
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span>Base Produk ({calcQty} pcs):</span>
                    <span className="font-bold">{formatRupiah(calcProductSubtotal)}</span>
                  </div>
                  {calcLenganPanjangQty > 0 && (
                    <div className="flex justify-between">
                      <span>Lengan Panjang ({calcLenganPanjangQty} pcs):</span>
                      <span className="font-bold">{formatRupiah(calcLenganTotal)}</span>
                    </div>
                  )}
                  {calcXXLQty > 0 && (
                    <div className="flex justify-between">
                      <span>Size XXL ({calcXXLQty} pcs):</span>
                      <span className="font-bold">{formatRupiah(calcXXLTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-indigo-800/80 pt-2 text-sm font-black text-emerald-400">
                    <span>ESTIMASI GRAND TOTAL:</span>
                    <span>{formatRupiah(calcGrandTotal)}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    Rata-rata: {formatRupiah(calcAvgPerPcs)} / pcs
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsCalcOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={handleCopyCalcResultWA}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                {copiedCalcText ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-200" />
                    <span>Format Penawaran WA Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Text Penawaran WA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Tag className="h-6 w-6 text-amber-400" />
                <h3 className="text-base font-black">
                  {editingItem ? 'Edit Produk Katalog' : 'Tambah Produk / Tarif Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Kategori Produk:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as PriceCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value="kaos">Kaos & T-Shirt</option>
                    <option value="polo">Polo Shirt</option>
                    <option value="hoodie_jaket">Hoodie & Jaket</option>
                    <option value="jersey_sublim">Jersey Sublim</option>
                    <option value="jasa_sablon">Jasa Sablon & DTF</option>
                    <option value="biaya_tambahan">Size & Extra Addons</option>
                    <option value="lainnya">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Produk / Tarif:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kaos Cotton Combed 24s + Sablon"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Spesifikasi Bahan Material:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cotton Combed 24s Reaktif Supima 100%"
                    value={formMaterial}
                    onChange={(e) => setFormMaterial(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kelengkapan Specs (Termasuk):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Termasuk Sablon Plastisol A3 2 Titik"
                    value={formSpecs}
                    onChange={(e) => setFormSpecs(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Price Type Switch */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">
                    Mode Harga Produk
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Gunakan harga bertingkat kuantitas (12-23, 24-59 pcs) atau tarif addon fixed
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormIsTier(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      formIsTier ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Harga Tier Qty
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormIsTier(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      !formIsTier ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Fixed Addon
                  </button>
                </div>
              </div>

              {formIsTier ? (
                /* Tier inputs */
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                    Rincian Tarif Harga Bertingkat (Kuantitas):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formTiers.map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {t.label}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-400">Rp</span>
                          <input
                            type="number"
                            step={500}
                            value={t.price}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              const updated = [...formTiers];
                              updated[idx].price = val;
                              setFormTiers(updated);
                            }}
                            className="w-24 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-black text-right text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Fixed price input */
                <div>
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Nominal Tarif Fixed (Rp):
                  </label>
                  <input
                    type="number"
                    step={500}
                    value={formFixedPrice}
                    onChange={(e) => setFormFixedPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-black text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan / Syarat Ketentuan:
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Minimal order 12 pcs. Waktu pengerjaan 5-7 hari kerja."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 h-4 w-4"
                  />
                  <span>Tandai Produk Sebagai "Best Seller / Populer"</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-md cursor-pointer"
                >
                  Simpan Produk Katalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
