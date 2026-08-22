import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  DollarSign,
  FileImage,
  Layers,
  Plus,
  Printer,
  Scissors,
  Shirt,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import {

  generateOrderNumber,
} from '../../lib/utils';
import {
  Customer,
  ModelCategory,
  Order,
  OrderItem,
  PaymentMethod,
  SablonDetail,
  SablonPosition,
  SablonTechnique,
  ServiceType,
} from '../../types';

interface OrderFormModalProps {
  isOpen: boolean;
  customers: Customer[];
  existingOrdersCount?: number;
  onSaveOrder?: (order: Order) => void;
  onSave?: (order: Order) => void;
  onClose: () => void;
  salesAdminName?: string;
  userRole?: string;
  priceList?: any[];
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  customers,
  existingOrdersCount = 0,
  onSaveOrder,
  onSave,
  onClose,
  salesAdminName,
}) => {
  // Order Base
  const [orderNumber] = useState(generateOrderNumber(existingOrdersCount || 0));
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [salesAdmin, setSalesAdmin] = useState(salesAdminName || 'Siti Admin Sales');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Service Type State ('jahit_sablon' | 'maklon_sablon')
  const [serviceType, setServiceType] = useState<ServiceType>('jahit_sablon');

  // Customer Selection / Inline Creation
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [organization, setOrganization] = useState('');

  // Product Item State
  const [productName, setProductName] = useState('Kaos Event Cotton Combed 24s');
  const [productType, setProductType] = useState('Kaos');
  const [fabric, setFabric] = useState('Cotton Combed 24s');
  const [color, setColor] = useState('Hitam');
  const [modelCategory, setModelCategory] = useState<ModelCategory>('Dewasa Pendek');
  const [quantity, setQuantity] = useState<number>(0);
  const [unitPrice, setUnitPrice] = useState<number>(65000);

  // Size Breakdown Input State (5 Category Columns)
  const [categorySizes, setCategorySizes] = useState<{
    [category: string]: { [sz: string]: number };
  }>({
    'Dewasa Pendek': { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0, Custom: 0 },
    'Dewasa Panjang': { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0, Custom: 0 },
    'Dewasa 3/4': { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0, Custom: 0 },
    'Anak Pendek': { S: 0, M: 0, L: 0, XL: 0 },
    'Anak Panjang': { S: 0, M: 0, L: 0, XL: 0 },
  });

  // Sablon Details State
  const [technique, setTechnique] = useState<SablonTechnique>('DTF');
  const [finishing, setFinishing] = useState<string>('Hot Press Doff (Matte)');
  const [sablonNotes, setSablonNotes] = useState('');

  // Initial Design Upload
  const [designFileUrl, setDesignFileUrl] = useState(
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800'
  );
  const [designNotes, setDesignNotes] = useState('Draf desain versi V1');

  // Costs & Payment
  const [designFee, setDesignFee] = useState<number>(0);
  const [sablonFee, setSablonFee] = useState<number>(0);
  const [extraFee, setExtraFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);

  // Pricing Rules & Surcharges (Dewasa vs Anak, Lengan Pendek vs Panjang, Size XXL/XXXL)
  const getSavedDefault = (key: string, fallback: number) => {
    try {
      const saved = localStorage.getItem(`pricing_default_${key}`);
      return saved !== null && !isNaN(Number(saved)) ? Number(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [basePriceDewasa, setBasePriceDewasa] = useState<number>(() => getSavedDefault('dewasa', 60000));
  const [basePriceAnak, setBasePriceAnak] = useState<number>(() => getSavedDefault('anak', 45000));
  const [basePriceMaklon, setBasePriceMaklon] = useState<number>(() => getSavedDefault('maklon', 15000));
  const [extraLenganPanjangDewasa, setExtraLenganPanjangDewasa] = useState<number>(() => getSavedDefault('lengan_panjang_dewasa', 5000));
  const [extraLengan34Dewasa, setExtraLengan34Dewasa] = useState<number>(() => getSavedDefault('lengan_34_dewasa', 3000));
  const [extraLenganPanjangAnak, setExtraLenganPanjangAnak] = useState<number>(() => getSavedDefault('lengan_panjang_anak', 5000));
  const [extraXXL, setExtraXXL] = useState<number>(() => getSavedDefault('xxl', 5000));
  const [extraXXXL, setExtraXXXL] = useState<number>(() => getSavedDefault('xxxl', 10000));
  const [extraCustomSize, setExtraCustomSize] = useState<number>(() => getSavedDefault('custom_size', 15000));
  const [isManualPrice, setIsManualPrice] = useState<boolean>(false);
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);

  // Save current pricing setup as permanent user default in localStorage
  const handleSaveAsDefault = () => {
    try {
      localStorage.setItem('pricing_default_dewasa', basePriceDewasa.toString());
      localStorage.setItem('pricing_default_anak', basePriceAnak.toString());
      localStorage.setItem('pricing_default_maklon', basePriceMaklon.toString());
      localStorage.setItem('pricing_default_lengan_panjang_dewasa', extraLenganPanjangDewasa.toString());
      localStorage.setItem('pricing_default_lengan_34_dewasa', extraLengan34Dewasa.toString());
      localStorage.setItem('pricing_default_lengan_panjang_anak', extraLenganPanjangAnak.toString());
      localStorage.setItem('pricing_default_xxl', extraXXL.toString());
      localStorage.setItem('pricing_default_xxxl', extraXXXL.toString());
      localStorage.setItem('pricing_default_custom_size', extraCustomSize.toString());
      
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to save pricing defaults', err);
    }
  };

  // Reset pricing setup to standard factory defaults
  const handleResetToStandard = () => {
    setBasePriceDewasa(60000);
    setBasePriceAnak(45000);
    setBasePriceMaklon(15000);
    setExtraLenganPanjangDewasa(5000);
    setExtraLengan34Dewasa(3000);
    setExtraLenganPanjangAnak(5000);
    setExtraXXL(5000);
    setExtraXXXL(10000);
    setExtraCustomSize(15000);

    try {
      ['dewasa', 'anak', 'maklon', 'lengan_panjang_dewasa', 'lengan_34_dewasa', 'lengan_panjang_anak', 'xxl', 'xxxl', 'custom_size'].forEach((key) => {
        localStorage.removeItem(`pricing_default_${key}`);
      });
    } catch {
      // ignore
    }
  };

  const [dpAmount, setDpAmount] = useState<number>(0);
  const [isCustomDp, setIsCustomDp] = useState<boolean>(false);
  const [dpMethod, setDpMethod] = useState<PaymentMethod>('Transfer Bank');

  if (!isOpen) return null;

  // Real-Time Size Sum Calculation across 5 Category Columns
  const totalSizeCount: number = (Object.values(categorySizes) as Array<Record<string, number>>).reduce((acc: number, catObj) => {
    const catValues = Object.values(catObj || {});
    const catSum: number = catValues.reduce((sum: number, val: number) => sum + (Number(val) || 0), 0);
    return acc + catSum;
  }, 0);
  const isSizeCountValid = serviceType === 'maklon_sablon' || totalSizeCount === quantity;

  // Calculate Item Subtotal & Detailed Breakdown based on Categories & Size Surcharges
  const calculatePricingDetails = () => {
    let calculatedSubtotal = 0;
    const catBreakdown: { [cat: string]: { pcs: number; total: number; baseRate: number } } = {};
    let totalJumboExtra = 0;
    let jumboPcs = 0;

    Object.entries(categorySizes).forEach(([cat, sizesObj]) => {
      let catPcs = 0;
      let catTotal = 0;

      // Determine base rate for category
      let catBaseRate = basePriceDewasa;
      if (cat === 'Dewasa Panjang') catBaseRate = basePriceDewasa + extraLenganPanjangDewasa;
      else if (cat === 'Dewasa 3/4') catBaseRate = basePriceDewasa + extraLengan34Dewasa;
      else if (cat === 'Anak Pendek') catBaseRate = basePriceAnak;
      else if (cat === 'Anak Panjang') catBaseRate = basePriceAnak + extraLenganPanjangAnak;

      Object.entries(sizesObj).forEach(([sz, qtyVal]) => {
        const qty = Number(qtyVal) || 0;
        if (qty <= 0) return;

        catPcs += qty;

        // Size Surcharge
        let sizeExtra = 0;
        if (sz === 'XXL') sizeExtra = extraXXL;
        else if (sz === 'XXXL') sizeExtra = extraXXXL;
        else if (sz === 'Custom') sizeExtra = extraCustomSize;

        if (sizeExtra > 0) {
          totalJumboExtra += sizeExtra * qty;
          jumboPcs += qty;
        }

        const pricePerPc = catBaseRate + sizeExtra;
        catTotal += pricePerPc * qty;
      });

      catBreakdown[cat] = { pcs: catPcs, total: catTotal, baseRate: catBaseRate };
      calculatedSubtotal += catTotal;
    });

    const hasSizes = totalSizeCount > 0;
    const avgPrice = hasSizes ? Math.round(calculatedSubtotal / totalSizeCount) : unitPrice;

    return {
      calculatedSubtotal,
      catBreakdown,
      totalJumboExtra,
      jumboPcs,
      averagePrice: avgPrice,
    };
  };

  const pricingSummary = calculatePricingDetails();
  const subtotalItem = serviceType === 'maklon_sablon' || isManualPrice ? quantity * unitPrice : pricingSummary.calculatedSubtotal;
  const effectiveUnitPrice = serviceType === 'maklon_sablon' || isManualPrice ? unitPrice : (totalSizeCount > 0 ? pricingSummary.averagePrice : unitPrice);

  // Auto-fill customer info when existing selected
  const handleCustomerSelect = (id: string) => {
    setSelectedCustomerId(id);
    if (!id) return;
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone);
      setOrganization(found.organization || '');
    }
  };

  // Image Upload File & Clipboard Paste Handler
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setDesignFileUrl(reader.result.toString());
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Global window paste listener when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const onGlobalPaste = (e: ClipboardEvent) => {
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
    window.addEventListener('paste', onGlobalPaste);
    return () => window.removeEventListener('paste', onGlobalPaste);
  }, [isOpen]);

  const handleCategorySizeChange = (category: string, sizeKey: string, val: number) => {
    setCategorySizes((prev) => {
      const updated = {
        ...prev,
        [category]: {
          ...prev[category],
          [sizeKey]: Math.max(0, val),
        },
      };

      // Automatically calculate sum of all sizes in input form below
      const newTotalSizeCount = Object.values(updated).reduce((acc, catObj) => {
        const catSum = Object.values(catObj).reduce((sum, v) => sum + (Number(v) || 0), 0);
        return acc + catSum;
      }, 0);

      // Auto update quantity field to sum of sizes for jahit_sablon mode
      if (serviceType === 'jahit_sablon') {
        setQuantity(newTotalSizeCount);
      }

      return updated;
    });
  };

  const grandTotal = subtotalItem + designFee + sablonFee + extraFee + shippingFee - discount;
  const remainingBalance = Math.max(0, grandTotal - dpAmount);

  useEffect(() => {
    if (isOpen) {
      setIsCustomDp(false);
      setDpAmount(Math.round(grandTotal * 0.5));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isCustomDp) {
      setDpAmount(Math.round(grandTotal * 0.5));
    }
  }, [grandTotal, isCustomDp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim()) {
      setFormError('Nama Customer dan Nomor WhatsApp Wajib Diisi!');
      return;
    }

    if (!isSizeCountValid && totalSizeCount > 0 && quantity > 0) {
      setFormError(`VALIDASI UKURAN: Jumlah seluruh size (${totalSizeCount} pcs) tidak sama dengan total quantity produk (${quantity} pcs). Harap sesuaikan!`);
      return;
    }

    setFormError(null);

    // Consolidated sizes object for backwards compatibility
    const consolidatedSizes: { [key: string]: number } = {};
    const notesParts: string[] = [];

    Object.entries(categorySizes).forEach(([cat, catSizes]) => {
      const activeSizes = Object.entries(catSizes)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `${k}=${v}`);

      if (activeSizes.length > 0) {
        notesParts.push(`${cat}: ${activeSizes.join(', ')}`);
        Object.entries(catSizes).forEach(([k, v]) => {
          if (v > 0) {
            consolidatedSizes[`${cat} (${k})`] = v;
          }
        });
      }
    });

    const item: OrderItem = {
      id: 'item-' + Date.now().toString(36),
      productName: productName || (serviceType === 'maklon_sablon' ? 'Jasa Maklon Sablon' : 'Kaos Event'),
      productType: serviceType === 'maklon_sablon' ? 'Maklon Sablon' : productType,
      serviceType,
      fabric: fabric || (serviceType === 'maklon_sablon' ? 'Bahan/Kaos dari Konsumen' : 'Cotton Combed 24s'),
      color: color || 'Campur (Dari Konsumen)',
      modelCategory,
      quantity: serviceType === 'maklon_sablon' ? quantity : (totalSizeCount > 0 ? totalSizeCount : quantity),
      unitPrice: effectiveUnitPrice,
      subtotal: subtotalItem,
      sizeBreakdown: {
        category: modelCategory,
        sizes: serviceType === 'maklon_sablon' ? {} : consolidatedSizes,
        categorySizes: serviceType === 'maklon_sablon' ? {} : categorySizes,
      },
      pricingConfig: {
        basePriceDewasa,
        basePriceAnak,
        extraLenganPanjangDewasa,
        extraLengan34Dewasa,
        extraLenganPanjangAnak,
        extraXXL,
        extraXXXL,
        extraCustomSize,
      },
      sablonDetails: [
        {
          id: 'sablon-' + Date.now().toString(36),
          technique,
          finishing,
          notes: sablonNotes,
        },
      ],
      notes: serviceType === 'maklon_sablon' ? `Maklon Sablon Saja ${quantity} pcs (Kaos dari Konsumen)` : (notesParts.join(' | ') || `${modelCategory} ${quantity} pcs`),
    };



    const newOrder: Order = {
      id: 'ord-' + Date.now().toString(36),
      orderNumber,
      orderDate,
      deadline,
      customerId: selectedCustomerId || 'cust-' + Date.now().toString(36),
      customerName,
      customerPhone,
      organization: organization || undefined,
      salesAdmin,
      notes,
      status: 'Produksi',
      items: [item],
      additionalCosts: {
        designFee,
        sablonFee,
        extraFee,
        discount,
        shippingFee,
      },
      subtotal: subtotalItem,
      grandTotal,
      totalPaid: dpAmount,
      remainingBalance,
      paymentStatus: dpAmount >= grandTotal ? 'Lunas' : dpAmount > 0 ? 'DP' : 'Belum Bayar',
      payments:
        dpAmount > 0
          ? [
              {
                id: 'pay-' + Date.now().toString(36),
                date: orderDate,
                amount: dpAmount,
                method: dpMethod,
                notes: 'DP Awal Pembuatan Order',
                recordedBy: salesAdmin,
              },
            ]
          : [],
      productionStage: 'Order Masuk',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (typeof onSaveOrder === 'function') {
      onSaveOrder(newOrder);
    } else if (typeof onSave === 'function') {
      onSave(newOrder);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 my-6 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-6 py-4 text-white dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-extrabold text-sm">
              ORD
            </div>
            <div>
              <h3 className="font-extrabold text-base">Buat Order Pesanan Baru</h3>
              <p className="text-xs text-slate-400 font-mono">Nomor Otomatis: {orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-8">
          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300 text-xs font-bold flex items-center justify-between gap-2 animate-shake">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-xs underline hover:opacity-80 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Section 1: Customer & Dates */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <User className="h-4 w-4" /> 1. Data Customer & Informasi Order
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700">
              {/* Customer Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pilih Customer Lama</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">-- Customer Baru --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.organization ? `(${c.organization})` : ''} - {c.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nomor WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="081234567890"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Instansi / Komunitas (Opsional)
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Contoh: Komunitas Garuda"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tanggal Order</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Deadline Produksi</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-indigo-600 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Product & Pricing Calculator */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Shirt className="h-4 w-4" /> 2. Detail Produk & Tipe Layanan
            </h4>

            {/* Service Type Selection */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900 rounded-2xl space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-indigo-950 dark:text-indigo-200 block">
                Pilih Tipe Pesanan / Layanan Produksi:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setServiceType('jahit_sablon');
                    if (productName === 'Jasa Maklon Sablon') setProductName('Kaos Event Cotton Combed 24s');
                    if (fabric === 'Bahan dari Konsumen') setFabric('Cotton Combed 24s');
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                    serviceType === 'jahit_sablon'
                      ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20 dark:bg-slate-900 dark:border-indigo-500'
                      : 'bg-white/60 border-slate-200 hover:bg-white dark:bg-slate-800 dark:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${serviceType === 'jahit_sablon' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    <Shirt className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>🧵 Jahit & Sablon Full (Kaos Jadi)</span>
                      {serviceType === 'jahit_sablon' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold dark:bg-indigo-900 dark:text-indigo-300">Aktif</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Produksi lengkap bahan kain, potong, jahit & cetak sablon. Memerlukan pengisian rincian ukuran (S, M, L, XL, dll).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setServiceType('maklon_sablon');
                    if (productName === 'Kaos Event Cotton Combed 24s') setProductName('Jasa Maklon Sablon');
                    if (fabric === 'Cotton Combed 24s') setFabric('Bahan dari Konsumen');
                    setUnitPrice(basePriceMaklon);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                    serviceType === 'maklon_sablon'
                      ? 'bg-white border-amber-600 shadow-md ring-2 ring-amber-500/20 dark:bg-slate-900 dark:border-amber-500'
                      : 'bg-white/60 border-slate-200 hover:bg-white dark:bg-slate-800 dark:border-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${serviceType === 'maklon_sablon' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                    <Printer className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>🖨️ Maklon Sablon Saja (Bahan/Kaos dari Konsumen)</span>
                      {serviceType === 'maklon_sablon' && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold dark:bg-amber-900 dark:text-amber-200">Aktif</span>}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Hanya jasa cetak sablon. Kaos/bahan disiapkannya oleh konsumen. <strong>Tanpa memasukkan ukuran kaos</strong> (hanya input jumlah total pcs yang disablon).
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {serviceType === 'maklon_sablon' ? (
              /* Dedicated Maklon Sablon Input Grid */
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between border-b border-amber-200/80 dark:border-amber-900/60 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Printer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-extrabold text-sm text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                      INPUT HARGA & QTY MAKLON SABLON (TANPA JAHIT)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Set Harga Dasar Default:</span>
                    <div className="flex items-center bg-white border border-amber-300 rounded-lg px-2 py-0.5 shadow-xs dark:bg-slate-800 dark:border-amber-800">
                      <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 mr-1">Rp</span>
                      <input
                        type="number"
                        step={1000}
                        value={basePriceMaklon}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setBasePriceMaklon(val);
                          setUnitPrice(val);
                        }}
                        className="w-20 text-xs font-black text-amber-900 bg-transparent focus:outline-none dark:text-amber-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Qty Sablon */}
                  <div className="bg-white p-3.5 rounded-xl border border-amber-300 shadow-xs dark:bg-slate-900 dark:border-amber-900">
                    <label className="text-xs font-extrabold text-amber-950 dark:text-amber-200 block mb-1">
                      Qty Sablon (Jumlah Pcs) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                        placeholder="Misal: 100"
                        className="w-full rounded-lg border border-amber-300 bg-amber-50/30 pr-12 p-2.5 text-sm font-black text-slate-900 focus:border-amber-500 focus:outline-none dark:border-amber-800 dark:bg-slate-800 dark:text-white"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-amber-700 dark:text-amber-400">Pcs</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Total kaos/bahan yang disablon</p>
                  </div>

                  {/* 2. Harga Sablon Satuan */}
                  <div className="bg-white p-3.5 rounded-xl border border-amber-300 shadow-xs dark:bg-slate-900 dark:border-amber-900 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-amber-950 dark:text-amber-200 block">
                        Harga Sablon (Per Pcs) <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        Rp {unitPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs font-black text-amber-700 dark:text-amber-400">Rp</span>
                      <input
                        type="number"
                        min={0}
                        required
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(Math.max(0, Number(e.target.value)))}
                        placeholder="15000"
                        className="w-full rounded-lg border border-amber-300 bg-amber-50/30 pl-9 pr-3 p-2.5 text-sm font-black text-slate-900 focus:border-amber-500 focus:outline-none dark:border-amber-800 dark:bg-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase block">Pilihan Preset Cepat:</span>
                      <div className="flex flex-wrap gap-1">
                        {[10000, 12000, 15000, 18000, 20000, 25000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setUnitPrice(preset);
                              setBasePriceMaklon(preset);
                            }}
                            className={`px-1.5 py-0.5 text-[10px] rounded font-bold transition border cursor-pointer ${
                              unitPrice === preset
                                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-amber-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {(preset / 1000).toString()}rb
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. Subtotal Jasa Sablon */}
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-300 shadow-xs dark:bg-slate-900 dark:border-emerald-900">
                    <label className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200 block mb-1">
                      Total Subtotal Sablon
                    </label>
                    <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-sm font-black text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-200">
                      Rp {(quantity * unitPrice).toLocaleString('id-ID')}
                    </div>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                      = {quantity} Pcs × Rp {unitPrice.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {/* 4. Keterangan Kaos/Bahan Konsumen */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-700">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block mb-1">
                      Keterangan Kaos Konsumen
                    </label>
                    <input
                      type="text"
                      value={fabric}
                      onChange={(e) => setFabric(e.target.value)}
                      placeholder="Kaos dari Konsumen"
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Status/spesifikasi barang dari konsumen</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Jahit & Sablon Product Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 dark:bg-slate-800/50 dark:border-slate-700">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nama Produk</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Kaos Gathering"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Jenis Produk</label>
                  <select
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="Kaos">Kaos</option>
                    <option value="Jersey">Jersey</option>
                    <option value="Hoodie">Hoodie</option>
                    <option value="Jaket">Jaket</option>
                    <option value="Polo Shirt">Polo Shirt</option>
                    <option value="Kemeja Korsa">Kemeja Korsa</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bahan</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="Cotton Combed 24s"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Warna</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Hitam"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>



                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Total Quantity (Pcs) <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                      {totalSizeCount > 0 ? `🔥 ${totalSizeCount} Pcs (Otomatis dari Rincian)` : 'Auto-hitung dari rincian'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-black text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    💡 Angka ini merupakan hasil penjumlahan otomatis seluruh rincian ukuran kaos (S, M, L, XL, dll) dari form input di bawah.
                  </p>
                  {totalSizeCount > 0 && quantity !== totalSizeCount && (
                    <button
                      type="button"
                      onClick={() => setQuantity(totalSizeCount)}
                      className="mt-1 text-[11px] font-black text-amber-600 hover:underline flex items-center gap-1"
                    >
                      <span>⚠️ Beda dengan rincian ukuran ({totalSizeCount} Pcs). Klik di sini untuk samakan ({totalSizeCount} Pcs)</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Rata-Rata Harga Satuan
                  </label>
                  <input
                    type="text"
                    disabled={!isManualPrice}
                    value={isManualPrice ? unitPrice : `Rp ${effectiveUnitPrice.toLocaleString('id-ID')}`}
                    onChange={(e) => isManualPrice && setUnitPrice(Number(e.target.value))}
                    className={`mt-1 w-full rounded-xl border p-2.5 text-xs font-extrabold ${
                      isManualPrice
                        ? 'bg-white border-indigo-500 text-slate-900 dark:bg-slate-800 dark:text-white'
                        : 'bg-slate-100 border-slate-200 text-indigo-700 dark:bg-slate-900 dark:border-slate-700 dark:text-indigo-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Total Subtotal Item</label>
                  <input
                    type="text"
                    disabled
                    value={`Rp ${subtotalItem.toLocaleString('id-ID')}`}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-emerald-50 p-2.5 text-xs font-black text-emerald-800 dark:border-slate-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  />
                </div>
              </div>
            )}

            {/* Config Box: Rule Harga Dasar & Tambahan Surcharge (Hanya untuk Jahit & Sablon) */}
            {serviceType === 'jahit_sablon' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-indigo-800/60 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 mt-0.5">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="text-sm font-black tracking-tight text-white">
                          Aturan Harga Dasar & Tambahan Surcharge
                        </h5>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isManualPrice
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1'
                        }`}>
                          {!isManualPrice && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                          {isManualPrice ? 'Mode Manual' : 'Kalkulasi Otomatis'}
                        </span>
                        {isSavedNotice && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950 animate-bounce">
                            ✓ Default Disimpan!
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-200/80 mt-0.5">
                        Atur tarif dasar & tambahan lengan/size default. Klik <strong className="text-amber-300">"Simpan sebagai Default Saya"</strong> agar tersimpan otomatis untuk order berikutnya.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={handleSaveAsDefault}
                      title="Simpan pengaturan harga ini sebagai default untuk form order baru"
                      className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/30 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      💾 Simpan Default Saya
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToStandard}
                      title="Reset ke setelan harga dasar pabrik"
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                    >
                      🔄 Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsManualPrice(!isManualPrice)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isManualPrice
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-black shadow-xs'
                          : 'bg-indigo-600/60 hover:bg-indigo-600 text-white border border-indigo-400/30'
                      }`}
                    >
                      {isManualPrice ? '✏️ Kembali ke Otomatis' : '⚙️ Override Manual'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* 1. Harga Dasar Dewasa & Anak */}
                  <div className="bg-slate-800/80 backdrop-blur-xs p-3.5 rounded-xl border border-indigo-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-300 border-b border-slate-700/60 pb-2">
                      <User className="h-4 w-4 text-indigo-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wide">1. Harga Dasar (S-XL)</span>
                    </div>
                    
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">Kaos Dewasa (Pendek)</label>
                          <div className="flex gap-1 mb-1">
                            {[55000, 60000, 65000].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setBasePriceDewasa(p)}
                                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                                  basePriceDewasa === p ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                {p / 1000}k
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="relative rounded-lg border border-slate-700 bg-slate-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
                          <span className="absolute left-2.5 top-2 text-xs font-black text-slate-500">Rp</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={basePriceDewasa}
                            onChange={(e) => setBasePriceDewasa(Number(e.target.value))}
                            className="w-full bg-transparent pl-8 pr-2.5 py-1.5 text-xs font-black text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">Kaos Anak (Pendek)</label>
                          <div className="flex gap-1 mb-1">
                            {[40000, 45000, 50000].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setBasePriceAnak(p)}
                                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                                  basePriceAnak === p ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                {p / 1000}k
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="relative rounded-lg border border-slate-700 bg-slate-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
                          <span className="absolute left-2.5 top-2 text-xs font-black text-slate-500">Rp</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={basePriceAnak}
                            onChange={(e) => setBasePriceAnak(Number(e.target.value))}
                            className="w-full bg-transparent pl-8 pr-2.5 py-1.5 text-xs font-black text-emerald-300 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Tambahan Lengan Dewasa */}
                  <div className="bg-slate-800/80 backdrop-blur-xs p-3.5 rounded-xl border border-indigo-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-blue-300 border-b border-slate-700/60 pb-2">
                      <Shirt className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wide">2. Lengan Dewasa</span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-300 block">Lengan Panjang (+/pcs)</label>
                          <div className="flex gap-1">
                            {[0, 5000, 10000].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setExtraLenganPanjangDewasa(p)}
                                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                                  extraLenganPanjangDewasa === p ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                +{p / 1000}k
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="relative rounded-lg border border-slate-700 bg-slate-900 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
                          <span className="absolute left-2.5 top-2 text-xs font-black text-blue-400">+Rp</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={extraLenganPanjangDewasa}
                            onChange={(e) => setExtraLenganPanjangDewasa(Number(e.target.value))}
                            className="w-full bg-transparent pl-10 pr-2.5 py-1.5 text-xs font-black text-blue-300 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-300 block">Lengan 3/4 (+/pcs)</label>
                          <div className="flex gap-1">
                            {[0, 3000, 5000].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setExtraLengan34Dewasa(p)}
                                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                                  extraLengan34Dewasa === p ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                +{p / 1000}k
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="relative rounded-lg border border-slate-700 bg-slate-900 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition">
                          <span className="absolute left-2.5 top-2 text-xs font-black text-blue-400">+Rp</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={extraLengan34Dewasa}
                            onChange={(e) => setExtraLengan34Dewasa(Number(e.target.value))}
                            className="w-full bg-transparent pl-10 pr-2.5 py-1.5 text-xs font-black text-blue-300 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Tambahan Lengan Anak */}
                  <div className="bg-slate-800/80 backdrop-blur-xs p-3.5 rounded-xl border border-indigo-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-teal-300 border-b border-slate-700/60 pb-2">
                      <Shirt className="h-4 w-4 text-teal-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wide">3. Lengan Anak</span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-300 block">Lengan Panjang Anak (+/pcs)</label>
                          <div className="flex gap-1">
                            {[0, 5000, 10000].map((p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setExtraLenganPanjangAnak(p)}
                                className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                                  extraLenganPanjangAnak === p ? 'bg-teal-500 text-slate-950' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                              >
                                +{p / 1000}k
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="relative rounded-lg border border-slate-700 bg-slate-900 focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500 transition">
                          <span className="absolute left-2.5 top-2 text-xs font-black text-teal-400">+Rp</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={extraLenganPanjangAnak}
                            onChange={(e) => setExtraLenganPanjangAnak(Number(e.target.value))}
                            className="w-full bg-transparent pl-10 pr-2.5 py-1.5 text-xs font-black text-teal-300 focus:outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 italic pt-1">
                        *Ditambahkan ke harga dasar Kaos Anak
                      </p>
                    </div>
                  </div>

                  {/* 4. Tambahan Size Jumbo */}
                  <div className="bg-slate-800/80 backdrop-blur-xs p-3.5 rounded-xl border border-indigo-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-300 border-b border-slate-700/60 pb-2">
                      <Layers className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-extrabold uppercase tracking-wide">4. Size Jumbo (+/pcs)</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2 pl-3 rounded-lg border border-slate-700/50">
                        <span className="text-xs font-bold text-amber-200 shrink-0">Size XXL</span>
                        <div className="relative flex-1 max-w-[140px] rounded-md border border-slate-700 bg-slate-950 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition">
                          <span className="absolute left-2.5 top-2 text-[11px] font-black text-amber-400/80">+Rp</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={extraXXL}
                            onChange={(e) => setExtraXXL(Number(e.target.value))}
                            className="w-full bg-transparent pl-10 pr-2 py-1.5 text-xs font-black text-amber-300 text-right focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2 pl-3 rounded-lg border border-slate-700/50">
                        <span className="text-xs font-bold text-amber-200 shrink-0">Size XXXL</span>
                        <div className="relative flex-1 max-w-[140px] rounded-md border border-slate-700 bg-slate-950 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition">
                          <span className="absolute left-2.5 top-2 text-[11px] font-black text-amber-400/80">+Rp</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={extraXXXL}
                            onChange={(e) => setExtraXXXL(Number(e.target.value))}
                            className="w-full bg-transparent pl-10 pr-2 py-1.5 text-xs font-black text-amber-300 text-right focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2 pl-3 rounded-lg border border-slate-700/50">
                        <span className="text-xs font-bold text-amber-200 shrink-0">Size Custom</span>
                        <div className="relative flex-1 max-w-[140px] rounded-md border border-slate-700 bg-slate-950 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition">
                          <span className="absolute left-2.5 top-2 text-[11px] font-black text-amber-400/80">+Rp</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={extraCustomSize}
                            onChange={(e) => setExtraCustomSize(Number(e.target.value))}
                            className="w-full bg-transparent pl-10 pr-2 py-1.5 text-xs font-black text-amber-300 text-right focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Size Breakdown & Mandatory Validation (5 Columns) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Layers className="h-4 w-4" /> 3. Rincian Ukuran & Pola Kaos
              </h4>

              {serviceType === 'jahit_sablon' ? (
                /* Validation Badge */
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                    isSizeCountValid
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 animate-pulse'
                  }`}
                >
                  {isSizeCountValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <span>
                    Total Input Size: {totalSizeCount} / {quantity} pcs
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  <Printer className="h-4 w-4 text-amber-600" />
                  <span>Maklon Sablon ({quantity} Pcs)</span>
                </div>
              )}
            </div>

            {serviceType === 'maklon_sablon' ? (
              /* MAKLON SABLON BANNER */
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-900 space-y-2">
                <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-extrabold text-sm uppercase tracking-wider">
                  <Printer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <span>MODE MAKLON SABLON SAJA (TANPA PROSES POTONG & JAHIT)</span>
                </div>
                <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                  Pada pesanan <strong>Maklon Sablon Saja</strong>, bahan/kaos disuplai langsung oleh konsumen. Anda <strong>tidak perlu menginput rincian ukuran kaos (S, M, L, XL, dll)</strong>.
                  Sistem akan memproses pesanan ini menggunakan total quantity disablon yaitu <strong>{quantity} Pcs</strong>. Silakan tentukan posisi, dimensi, dan teknik sablon pada bagian di bawah!
                </p>
              </div>
            ) : (
              <>
                {/* Validation Warning Alert */}
                {!isSizeCountValid && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                    <span>
                      PERHATIAN: Jumlah seluruh size ({totalSizeCount} pcs) tidak sesuai dengan Total Quantity produk ({quantity} pcs). Silakan sesuaikan rincian size!
                    </span>
                  </div>
                )}

            {/* 5 Column Categories Grid Grouped into Dewasa & Anak */}
            <div className="space-y-6">
              {/* BLOCK 1: UKURAN DEWASA */}
              <div className="space-y-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50">
                <div className="flex items-center justify-between border-b border-indigo-200 dark:border-indigo-800/60 pb-2">
                  <h5 className="font-black text-xs uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-indigo-600" />
                    <span>👔 UKURAN KAOS DEWASA (S, M, L, XL, XXL, XXXL)</span>
                  </h5>
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md dark:bg-indigo-900 dark:text-indigo-300">
                    Kategori Dewasa
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'Dewasa Pendek',
                      title: 'Lengan Pendek (Kaos Dewasa Standard)',
                      subLabel: 'Kaos Dewasa Lengan Pendek',
                      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Custom'],
                      badge: 'bg-indigo-600 text-white',
                    },
                    {
                      key: 'Dewasa Panjang',
                      title: 'Lengan Panjang (Kaos Dewasa Longsleeve)',
                      subLabel: 'Kaos Dewasa Lengan Panjang (+Surcharge Lengan Panjang)',
                      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Custom'],
                      badge: 'bg-blue-600 text-white',
                    },
                    {
                      key: 'Dewasa 3/4',
                      title: 'Lengan 3/4 / Raglan (Kaos Dewasa 3/4)',
                      subLabel: 'Kaos Dewasa Lengan 3/4 Raglan (+Surcharge Lengan 3/4)',
                      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Custom'],
                      badge: 'bg-purple-600 text-white',
                    },
                  ].map((col) => {
                    const catTotal = Object.values(categorySizes[col.key] || {}).reduce(
                      (sum: number, v: number) => sum + (Number(v) || 0),
                      0
                    );

                    return (
                      <div
                        key={col.key}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-2.5 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                              {col.title}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-4">
                              {col.subLabel}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${col.badge}`}>
                            Subtotal: {catTotal} pcs
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-1">
                          {col.sizes.map((sz) => (
                            <div key={sz} className="text-center">
                              <label className="text-[11px] font-black text-slate-700 dark:text-slate-300 block mb-1">
                                {sz}
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={categorySizes[col.key]?.[sz] || 0}
                                onChange={(e) => handleCategorySizeChange(col.key, sz, Number(e.target.value))}
                                className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-black text-slate-900 focus:bg-white focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BLOCK 2: UKURAN ANAK-ANAK */}
              <div className="space-y-3 p-4 rounded-2xl bg-teal-50/50 border border-teal-100 dark:bg-teal-950/20 dark:border-teal-900/50">
                <div className="flex items-center justify-between border-b border-teal-200 dark:border-teal-800/60 pb-2">
                  <h5 className="font-black text-xs uppercase tracking-wider text-teal-950 dark:text-teal-200 flex items-center gap-2">
                    <Shirt className="h-4 w-4 text-teal-600" />
                    <span>🧒 UKURAN KAOS ANAK-ANAK (S, M, L, XL ANAK)</span>
                  </h5>
                  <span className="text-[10px] font-extrabold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md dark:bg-teal-900 dark:text-teal-300">
                    Kategori Anak-Anak
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      key: 'Anak Pendek',
                      title: 'Anak-Anak - Lengan Pendek',
                      subLabel: 'Kaos Anak Lengan Pendek (Panduan: S=2-3th, M=4-5th, L=6-7th, XL=8-10th)',
                      sizes: [
                        { name: 'S', info: '2-3 Th' },
                        { name: 'M', info: '4-5 Th' },
                        { name: 'L', info: '6-7 Th' },
                        { name: 'XL', info: '8-10 Th' },
                      ],
                      badge: 'bg-teal-600 text-white',
                    },
                    {
                      key: 'Anak Panjang',
                      title: 'Anak-Anak - Lengan Panjang',
                      subLabel: 'Kaos Anak Lengan Panjang (+Surcharge Lengan Panjang Anak)',
                      sizes: [
                        { name: 'S', info: '2-3 Th' },
                        { name: 'M', info: '4-5 Th' },
                        { name: 'L', info: '6-7 Th' },
                        { name: 'XL', info: '8-10 Th' },
                      ],
                      badge: 'bg-amber-600 text-white',
                    },
                  ].map((col) => {
                    const catTotal = Object.values(categorySizes[col.key] || {}).reduce(
                      (sum: number, v: number) => sum + (Number(v) || 0),
                      0
                    );

                    return (
                      <div
                        key={col.key}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-2.5 shadow-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <span className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-teal-600"></span>
                              {col.title}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-4">
                              {col.subLabel}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${col.badge}`}>
                            Subtotal: {catTotal} pcs
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          {col.sizes.map((szObj) => (
                            <div key={szObj.name} className="text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                                  {szObj.name}
                                </span>
                                <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1 py-0.2 rounded dark:bg-teal-950 dark:text-teal-300">
                                  {szObj.info}
                                </span>
                              </div>
                              <input
                                type="number"
                                min={0}
                                value={categorySizes[col.key]?.[szObj.name] || 0}
                                onChange={(e) => handleCategorySizeChange(col.key, szObj.name, Number(e.target.value))}
                                className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 py-1.5 text-xs font-black text-slate-900 focus:bg-white focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Pricing Calculation Summary Box */}
            <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" /> Ringkasan Rincian Harga Otomatis
                </span>
                <span className="text-xs font-bold text-slate-300">
                  Total Size: {totalSizeCount} pcs
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {Object.entries(pricingSummary.catBreakdown).map(([cat, info]) => {
                  if (info.pcs === 0) return null;
                  return (
                    <div key={cat} className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 flex justify-between items-center dark:bg-slate-900/60">
                      <div>
                        <span className="font-bold text-slate-200 block">{cat}</span>
                        <span className="text-[10px] text-slate-400">{info.pcs} pcs @ Rp {info.baseRate.toLocaleString('id-ID')}</span>
                      </div>
                      <span className="font-black text-indigo-300">
                        Rp {info.total.toLocaleString('id-ID')}
                      </span>
                    </div>
                  );
                })}

                {pricingSummary.jumboPcs > 0 && (
                  <div className="bg-amber-950/40 p-2.5 rounded-lg border border-amber-800/60 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-amber-300 block">Surcharge Size Jumbo</span>
                      <span className="text-[10px] text-amber-400">{pricingSummary.jumboPcs} pcs (XXL / XXXL / Custom)</span>
                    </div>
                    <span className="font-black text-amber-300">
                      +Rp {pricingSummary.totalJumboExtra.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="text-xs text-slate-400">
                  Rata-Rata Harga Satuan: <strong className="text-white">Rp {effectiveUnitPrice.toLocaleString('id-ID')} / pcs</strong>
                </div>
                <div className="text-sm font-black text-emerald-400">
                  Subtotal Pakaian: Rp {subtotalItem.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

          {/* Section 4: Detail Sablon & Finishing */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Shirt className="h-4 w-4" /> 4. Detail Teknik Sablon & Finishing
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Teknik Sablon</label>
                <select
                  value={technique}
                  onChange={(e) => setTechnique(e.target.value as SablonTechnique)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="DTF">DTF (Direct to Film)</option>
                  <option value="Plastisol">Plastisol</option>
                  <option value="Rubber">Rubber / Waterbased</option>
                  <option value="Discharge">Discharge (Cabut Warna)</option>
                  <option value="High Density">High Density (Timbul)</option>
                  <option value="Polyflex">Polyflex</option>
                  <option value="Sublimasi">Sublimasi</option>
                  <option value="Manual Screen Printing">Manual Screen Printing</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Finishing Sablon / Pakaian</label>
                <select
                  value={finishing}
                  onChange={(e) => setFinishing(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Hot Press Doff (Matte)">Hot Press Doff (Matte)</option>
                  <option value="Hot Press Glossy">Hot Press Glossy</option>
                  <option value="Standard (Press & Lipat)">Standard (Press & Lipat)</option>
                  <option value="Plastik & Hanging Tag">Plastik & Hanging Tag</option>
                  <option value="Polybag & Barcode Label">Polybag & Barcode Label</option>
                  <option value="Tanpa Finishing">Tanpa Finishing</option>
                  <option value="Custom Finishing">Custom Finishing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Design File Upload (Pasting Screenshot Supported) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <FileImage className="h-4 w-4" /> 5. Upload Desain Sablon Versi V1
              </h4>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                <Clipboard className="h-3.5 w-3.5" />
                Dapat langsung Paste Screenshot (<kbd className="font-sans px-1 py-0.5 bg-white dark:bg-slate-800 rounded shadow-xs">Ctrl + V</kbd>)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Upload File Desain (JPG, PNG, WEBP)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan Desain V1</label>
                  <input
                    type="text"
                    value={designNotes}
                    onChange={(e) => setDesignNotes(e.target.value)}
                    placeholder="Instruksi awal desain..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Interactive Drag, Drop & Paste Box */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl p-4 bg-indigo-50/40 dark:bg-slate-900/60 transition-colors hover:border-indigo-400"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2">Preview Desain V1</span>
                {designFileUrl ? (
                  <div className="relative group flex flex-col items-center">
                    <img
                      src={designFileUrl}
                      alt="Preview Desain"
                      className="h-32 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setDesignFileUrl('')}
                      className="mt-2 text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md border border-red-200 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400"
                    >
                      <X className="h-3 w-3" /> Hapus Gambar
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-1.5 p-2">
                    <Upload className="h-6 w-6 text-indigo-500 mx-auto opacity-80" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Paste Screenshot PC (<kbd className="font-sans px-1 bg-white border rounded">Ctrl+V</kbd>)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Atau Drag & Drop file gambar ke area ini
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 6: Biaya Tambahan & Pembayaran DP */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> 6. Biaya Tambahan & Pembayaran DP
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Biaya Desain</label>
                <input
                  type="number"
                  min={0}
                  value={designFee}
                  onChange={(e) => setDesignFee(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Biaya Ongkir</label>
                <input
                  type="number"
                  min={0}
                  value={shippingFee}
                  onChange={(e) => setShippingFee(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Diskon Potongan</label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">GRAND TOTAL</label>
                <input
                  type="text"
                  disabled
                  value={`Rp ${grandTotal.toLocaleString('id-ID')}`}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-200 p-2 text-xs font-black text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Initial DP Record */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900">
              <div>
                <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                  Pembayaran DP Awal (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={dpAmount}
                  onChange={(e) => {
                    setDpAmount(Number(e.target.value));
                    setIsCustomDp(true);
                  }}
                  className="mt-1 w-full rounded-xl border border-indigo-200 bg-white p-2.5 text-xs font-black text-indigo-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Metode Pembayaran DP</label>
                <select
                  value={dpMethod}
                  onChange={(e) => setDpMethod(e.target.value as PaymentMethod)}
                  className="mt-1 w-full rounded-xl border border-indigo-200 bg-white p-2.5 text-xs text-slate-900 focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="Cash">Cash / Tunai</option>
                  <option value="QRIS">QRIS Mandiri/BCA</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={!isSizeCountValid}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-xs font-bold text-white shadow-md transition ${
                isSizeCountValid
                  ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500'
                  : 'bg-slate-400 cursor-not-allowed opacity-60'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>SIMPAN ORDER</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
