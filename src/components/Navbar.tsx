import React from 'react';
import {
  Crown,
  LogOut,
  Menu,
  Monitor,
  Moon,
  PlusCircle,
  Search,
  ShieldAlert,
  Sun,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface NavbarProps {
  currentUser: User;
  onRoleChange: (role: UserRole) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewOrder: () => void;
  onToggleSidebar: () => void;
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onOpenUserManagement?: () => void;
  onLogout?: () => void;
  businessName?: string;
  logoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onRoleChange,
  searchQuery,
  onSearchChange,
  onOpenNewOrder,
  onToggleSidebar,
  theme,
  onThemeChange,
  onOpenUserManagement,
  onLogout,
  businessName,
  logoUrl,
}) => {
  const nameDisplay = businessName || 'Order Management System';
  const initial = nameDisplay.charAt(0).toUpperCase() || 'O';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      {/* Left: Mobile Toggle & Business Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
          title="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt={nameDisplay} className="h-9 w-9 rounded-xl object-cover shadow-xs shrink-0" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-extrabold text-sm shadow-xs shrink-0">
              {initial}
            </div>
          )}
          <div className="hidden sm:block min-w-0">
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white leading-none truncate max-w-[180px] md:max-w-[240px]" title={nameDisplay}>
              {nameDisplay}
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
              Order & System
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Global Search */}
      <div className="relative max-w-xs sm:max-w-md w-full mx-2 sm:mx-4">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari No. Order, Customer, WA, Produk..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-900 transition"
        />
      </div>

      {/* Right: Quick Actions & Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Order Button (For Admin / Owner) */}
        {currentUser.role !== 'produksi' && (
          <button
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Order Baru</span>
          </button>
        )}

        {/* Kelola User Button (Owner / Admin) */}
        {currentUser.role === 'owner' && onOpenUserManagement && (
          <button
            onClick={onOpenUserManagement}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Kelola Akun & Password User"
          >
            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden xl:inline">Kelola User</span>
          </button>
        )}

        {/* Role Switcher */}
        <div className="relative flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 hidden md:inline">
            Akses:
          </span>
          <select
            value={currentUser.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer py-1 pr-1"
          >
            <option value="owner" className="dark:bg-slate-900">
              👑 Owner (Full)
            </option>
            <option value="admin" className="dark:bg-slate-900">
              👤 Admin (Sales)
            </option>
            <option value="produksi" className="dark:bg-slate-900">
              ⚙️ Produksi (Worker)
            </option>
          </select>
        </div>

        {/* Theme Selector (Terang / Gelap / Sistem) */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            onClick={() => onThemeChange('light')}
            className={`p-1.5 rounded-lg transition-all text-xs flex items-center justify-center cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-amber-600 shadow-xs font-black dark:bg-slate-700 dark:text-amber-400 ring-1 ring-amber-400/30'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Tema Terang (Light Mode)"
            aria-label="Aktifkan Mode Terang"
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`p-1.5 rounded-lg transition-all text-xs flex items-center justify-center cursor-pointer ${
              theme === 'dark'
                ? 'bg-white text-indigo-600 shadow-xs font-black dark:bg-slate-700 dark:text-indigo-400 ring-1 ring-indigo-400/30'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Tema Gelap (Dark Mode)"
            aria-label="Aktifkan Mode Gelap"
          >
            <Moon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onThemeChange('system')}
            className={`p-1.5 rounded-lg transition-all text-xs flex items-center justify-center cursor-pointer ${
              theme === 'system'
                ? 'bg-white text-blue-600 shadow-xs font-black dark:bg-slate-700 dark:text-blue-400 ring-1 ring-blue-400/30'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
            title="Otomatis Sistem (Sesuai OS Laptop / HP)"
            aria-label="Aktifkan Otomatis Sistem"
          >
            <Monitor className="h-4 w-4" />
          </button>
        </div>

        {/* User Role Badge Indicator */}
        <div
          className={`hidden xl:flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold ${
            currentUser.role === 'owner'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              : currentUser.role === 'admin'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
          }`}
        >
          {currentUser.role === 'owner' && <Crown className="h-3.5 w-3.5" />}
          {currentUser.role === 'admin' && <UserCheck className="h-3.5 w-3.5" />}
          {currentUser.role === 'produksi' && <Wrench className="h-3.5 w-3.5" />}
          <span className="capitalize">{currentUser.name.split(' ')[0]}</span>
        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 px-3 py-2 text-xs font-extrabold text-rose-600 dark:text-rose-400 transition cursor-pointer border border-rose-200 dark:border-rose-900/60"
            title="Keluar dari Akun (Logout)"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        )}
      </div>
    </header>
  );
};
