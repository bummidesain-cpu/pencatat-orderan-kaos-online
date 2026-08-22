export type UserRole = 'owner' | 'admin' | 'produksi';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  organization?: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export type SablonTechnique =
  | 'DTF'
  | 'Plastisol'
  | 'Rubber'
  | 'Discharge'
  | 'High Density'
  | 'Polyflex'
  | 'Sublimasi'
  | 'Manual Screen Printing'
  | 'Custom';

export type SablonPosition =
  | 'Tengah Depan'
  | 'Dada Kiri'
  | 'Dada Kanan'
  | 'Belakang Atas'
  | 'Belakang Tengah'
  | 'Lengan Kiri'
  | 'Lengan Kanan'
  | 'Custom';

export interface SablonDetail {
  id: string;
  position?: SablonPosition;
  dimensions?: string; // e.g. "28 x 35 cm"
  technique: SablonTechnique;
  finishing?: string;
  notes?: string;
}

export type ModelCategory =
  | 'Dewasa Pendek'
  | 'Dewasa Panjang'
  | 'Dewasa 3/4'
  | 'Anak Pendek'
  | 'Anak Panjang'
  | 'Custom';

export interface SizeBreakdown {
  category: ModelCategory;
  sizes: {
    XS?: number;
    S?: number;
    M?: number;
    L?: number;
    XL?: number;
    XXL?: number;
    XXXL?: number;
    Custom?: number;
    [key: string]: number | undefined;
  };
  categorySizes?: {
    [key: string]: { [sz: string]: number };
  };
}

export interface ItemPricingConfig {
  basePriceDewasa?: number;
  basePriceAnak?: number;
  extraLenganPanjangDewasa?: number;
  extraLengan34Dewasa?: number;
  extraLenganPanjangAnak?: number;
  extraXXL?: number;
  extraXXXL?: number;
  extraCustomSize?: number;
}

export type ServiceType = 'jahit_sablon' | 'maklon_sablon';

export interface OrderItem {
  id: string;
  productName: string; // e.g. "Kaos Event Cotton Combed 24s" or "Jasa Maklon Sablon"
  productType: string; // e.g. "Kaos", "Jersey", "Hoodie", "Jaket", "Maklon Sablon"
  serviceType?: ServiceType; // 'jahit_sablon' | 'maklon_sablon'
  fabric: string; // e.g. "Cotton Combed 24s" or "Bahan dari Konsumen"
  color: string; // e.g. "Hitam"
  modelCategory: ModelCategory;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  sizeBreakdown: SizeBreakdown;
  sablonDetails: SablonDetail[];
  notes?: string;
  pricingConfig?: ItemPricingConfig;
}

export type PaymentStatus = 'Belum Bayar' | 'DP' | 'Lunas';

export type PaymentMethod = 'Cash' | 'Transfer Bank' | 'QRIS' | 'Lainnya';

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  recordedBy: string;
}

export type ProductionStage =
  | 'Order Masuk'
  | 'Belanja bahan'
  | 'Potong'
  | 'Proofing'
  | 'Sablon'
  | 'Finishing sablon'
  | 'Jahit'
  | 'QC'
  | 'Selesai';

export type OrderStatus =
  | 'Draft'
  | 'Produksi'
  | 'Selesai'
  | 'Dibatalkan';

export interface OrderAdditionalCosts {
  designFee: number;
  sablonFee: number;
  extraFee: number;
  discount: number;
  shippingFee: number;
}

export interface Order {
  id: string;
  orderNumber: string; // "ORD-202608-0001"
  orderDate: string; // "YYYY-MM-DD" or ISO
  deadline: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  organization?: string;
  salesAdmin: string;
  notes?: string;
  status: OrderStatus;
  items: OrderItem[];
  additionalCosts: OrderAdditionalCosts;
  subtotal: number;
  grandTotal: number;
  totalPaid: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  payments: Payment[];
  productionStage: ProductionStage;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  orderId?: string;
  orderNumber?: string;
  timestamp: string;
  user: string;
  activity: string;
}

export type BackupReminderInterval = '1_day' | '7_days' | '1_month';

export interface BusinessSettings {
  name: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  website: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  invoiceNotes: string;
  showDemoQuickFill?: boolean;
  monthlySalesTarget?: number;
  // Backup reminder notification settings
  backupReminderEnabled?: boolean;
  backupReminderInterval?: BackupReminderInterval; // '1_day' | '7_days' | '1_month'
  lastBackupDate?: string;
}

export type ExpenseCategory = 'bahan_baku' | 'gaji_karyawan' | 'operasional' | 'lainnya';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  title: string; // e.g. "Pembelian Kain Cotton Combed 24s 50kg", "Gaji Operator Sablon"
  amount: number; // Nominal total Rp
  quantity?: number;
  unit?: string; // e.g. kg, roll, pcs, meter, orang, bulan
  unitPrice?: number;
  recipientOrVendor?: string; // e.g. Toko Kain Jaya / Budi
  relatedOrderId?: string; // e.g. ORD-202608-0001
  paymentMethod: PaymentMethod;
  notes?: string;
  recordedBy: string;
  receiptUrl?: string;
  createdAt: string;
}

export type PriceCategory =
  | 'kaos'
  | 'polo'
  | 'hoodie_jaket'
  | 'jersey_sublim'
  | 'jasa_sablon'
  | 'biaya_tambahan'
  | 'lainnya';

export interface TierPrice {
  minQty: number;
  maxQty?: number;
  label: string;
  price: number;
}

export interface PriceListItem {
  id: string;
  category: PriceCategory;
  name: string;
  materialFabric?: string;
  includedSpecs?: string;
  baseUnit: string; // e.g. 'pcs', 'titik', 'cm²'
  tierPrices: TierPrice[];
  fixedUnitPrice?: number;
  notes?: string;
  isPopular?: boolean;
  updatedAt: string;
}


