import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Order, PaymentStatus, ProductionStage } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateString: string, includeTime: boolean = false): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }

  return date.toLocaleDateString('id-ID', options);
}

export function formatPhoneWA(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }
  return cleaned;
}

export function generateWAInvoiceUrl(
  phone: string,
  customerName: string,
  orderNumber: string,
  grandTotal: number,
  remainingBalance: number,
  businessName: string = 'Order Management System'
): string {
  const cleanPhone = formatPhoneWA(phone);
  const statusPayment = remainingBalance <= 0 ? 'LUNAS' : `SISA ${formatRupiah(remainingBalance)}`;
  const brand = businessName || 'Order Management System';
  const text = `Halo Kak ${customerName},\n\nBerikut rincian Nota/Invoice pesanan *${orderNumber}* di ${brand}:\n\n• Total Pesanan: *${formatRupiah(grandTotal)}*\n• Status Pembayaran: *${statusPayment}*\n\nTerima kasih atas kepercayaan Anda di ${brand}! ✨`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function calculatePaymentStatus(totalPaid: number, grandTotal: number): PaymentStatus {
  if (totalPaid <= 0) return 'Belum Bayar';
  if (totalPaid >= grandTotal) return 'Lunas';
  return 'DP';
}

export function generateOrderNumber(existingCount: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(existingCount + 1).padStart(4, '0');
  return `ORD-${year}${month}-${seq}`;
}

export function formatCategoryName(category: string): string {
  if (category === 'kaosPolo') return 'Kaos Polo';
  if (category === 'kaosLenganPanjang') return 'Lengan Panjang';
  if (category === 'kaosLenganPendek') return 'Lengan Pendek';
  return category;
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

export function getDeadlineInfo(deadline: string, isCompleted: boolean = false): { status: string; daysRemaining: number; isOverdue: boolean; badgeClass: string } {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (isCompleted) {
    return { status: 'Selesai', daysRemaining: diffDays, isOverdue: false, badgeClass: 'bg-emerald-100 text-emerald-700' };
  }

  if (diffDays < 0) return { status: 'Terlambat', daysRemaining: diffDays, isOverdue: true, badgeClass: 'bg-red-100 text-red-700' };
  if (diffDays === 0) return { status: 'Hari Ini', daysRemaining: diffDays, isOverdue: true, badgeClass: 'bg-red-100 text-red-700' };
  if (diffDays <= 3) return { status: `${diffDays} Hari Lagi`, daysRemaining: diffDays, isOverdue: false, badgeClass: 'bg-amber-100 text-amber-700' };
  return { status: `${diffDays} Hari Lagi`, daysRemaining: diffDays, isOverdue: false, badgeClass: 'bg-slate-100 text-slate-700' };
}
