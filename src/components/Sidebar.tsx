import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Info,
  Kanban,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingBag,
  Tag,
  Users,
  X,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { UserRole } from '../types';

export type NavTab =
  | 'dashboard'
  | 'orders'
  | 'customers'
  | 'production'
  | 'pricelist'
  | 'expenses'
  | 'reports'
  | 'settings';


interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole: UserRole;
  isOpen: boolean;
  onCloseMobile: () => void;
  unpaidCount?: number;
  businessName?: string;
  logoUrl?: string;
  onOpenAbout?: () => void;
  isLicensed?: boolean;
  ordersCount?: number;
  onOpenLicenseModal?: () => void;
  isBackupDue?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  isOpen,
  onCloseMobile,
  unpaidCount = 0,
  businessName,
  logoUrl,
  onOpenAbout,
  isLicensed = false,
  ordersCount = 0,
  onOpenLicenseModal,
  isBackupDue = false,
}) => {
  const nameDisplay = businessName || 'Order Management System';
  const initials = nameDisplay
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'OM';
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      allowedRoles: ['owner'],
    },
    {
      id: 'orders' as NavTab,
      label: 'Order & Nota Invoice',
      icon: ShoppingBag,
      badgeColor: 'bg-amber-500 text-white',
      allowedRoles: ['owner', 'admin', 'produksi'],
    },
    {
      id: 'customers' as NavTab,
      label: 'Database Customer',
      icon: Users,
      allowedRoles: ['owner', 'admin'],
    },
    {
      id: 'production' as NavTab,
      label: 'Production Board',
      icon: Kanban,
      badgeColor: 'bg-indigo-600 text-white',
      allowedRoles: ['owner', 'admin', 'produksi'],
    },
    {
      id: 'pricelist' as NavTab,
      label: 'Daftar Harga & Katalis',
      icon: Tag,
      allowedRoles: ['owner', 'admin'],
    },
    {
      id: 'expenses' as NavTab,

      label: 'Pengeluaran & Belanja',
      icon: Receipt,
      allowedRoles: ['owner'],
    },
    {
      id: 'reports' as NavTab,
      label: 'Laporan Penjualan',
      icon: BarChart3,
      allowedRoles: ['owner'],
    },
    {
      id: 'settings' as NavTab,
      label: 'Pengaturan Usaha',
      icon: Settings,
      allowedRoles: ['owner'],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt={nameDisplay} className="h-9 w-9 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-extrabold text-sm shadow-xs shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate" title={nameDisplay}>
                {nameDisplay}
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold truncate">
                {userRole === 'owner' ? 'Owner Mode' : userRole === 'admin' ? 'Sales Admin' : 'Tim Produksi'}
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden shrink-0 ml-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          {navItems
            .filter((item) => item.allowedRoles.includes(userRole))
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'settings' && isBackupDue && (
                    <span
                      className="flex h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"
                      title="Cadangan database jatuh tempo"
                    />
                  )}
                </button>
              );
            })}
        </nav>

        {/* Action Priority Summary Widget */}
        <div className="p-4 m-3 rounded-2xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-700/60 text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            Tindakan Cepat
          </p>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Belum Lunas:</span>
              <span className="font-bold text-indigo-600">{unpaidCount} order</span>
            </div>
          </div>
        </div>

        {/* License & Trial Widget */}
        <div className="p-4 mx-3 mb-3 rounded-2xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-700/60 text-xs">
          {isLicensed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="text-[11px] tracking-wide">LISENSI AKTIF</span>
              </div>
              <p className="text-[10px] text-slate-500">Fitur Full Version tidak terbatas aktif pada perangkat ini.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-bold">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] tracking-wide">VERSI TRIAL</span>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-black">
                  {ordersCount}/5
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (ordersCount / 5) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>Batas 5 Order</span>
                  <span>{Math.max(0, 5 - ordersCount)} Sisa</span>
                </div>
              </div>

              {onOpenLicenseModal && (
                <button
                  onClick={onOpenLicenseModal}
                  className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition shadow-sm"
                >
                  Aktivasi Lisensi
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3 flex flex-col items-center gap-1.5 text-[10px] text-slate-400">
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-bold transition cursor-pointer"
            >
              <Info className="h-3.5 w-3.5" />
              <span>Tentang Aplikasi & Pembuat</span>
            </button>
          )}
          <span>{nameDisplay} v2.5 • © 2026 Order Management System</span>
        </div>
      </aside>
    </>
  );
};
