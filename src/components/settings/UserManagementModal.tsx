import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Plus,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { deleteUser, saveUser } from '../../lib/storage';
import { User, UserRole } from '../../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onUsersUpdated?: () => void;
  onRefresh?: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onUsersUpdated,
  onRefresh,
}) => {
  // Modal states for CRUD
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [password, setPassword] = useState('');
  const [showPasswordInForm, setShowPasswordInForm] = useState(false);

  // Password visibility map for table rows
  const [revealedPasswords, setRevealedPasswords] = useState<{ [id: string]: boolean }>({});

  // Delete State
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Status message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleOpenAddForm = () => {
    setEditingUser(null);
    setName('');
    setRole('admin');
    setPassword('');
    setShowPasswordInForm(false);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setRole(user.role);
    setPassword(user.password || '');
    setShowPasswordInForm(false);
    setIsFormOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showStatus('error', 'Nama pengguna wajib diisi.');
      return;
    }
    if (!password.trim()) {
      showStatus('error', 'Password pengguna wajib diisi.');
      return;
    }

    const newUserObj: User = {
      id: editingUser ? editingUser.id : `usr-${Date.now()}`,
      name: name.trim(),
      email: editingUser?.email || `${name.toLowerCase().trim().replace(/[^a-z0-9]/g, '')}@ordermanagement.com`,
      role,
      password: password.trim(),
      createdAt: editingUser?.createdAt || new Date().toISOString().slice(0, 10),
    };

    saveUser(newUserObj);
    if (typeof onUsersUpdated === 'function') onUsersUpdated();
    if (typeof onRefresh === 'function') onRefresh();
    setIsFormOpen(false);

    showStatus(
      'success',
      editingUser
        ? `Pengguna ${newUserObj.name} berhasil diperbarui!`
        : `Pengguna baru ${newUserObj.name} berhasil ditambahkan!`
    );
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      showStatus('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }

    const owners = users.filter((u) => u.role === 'owner');
    if (user.role === 'owner' && owners.length <= 1) {
      showStatus('error', 'Tidak dapat menghapus akun Owner terakhir. Harus ada minimal 1 Owner.');
      return;
    }

    setDeletingUser(user);
  };

  const confirmDelete = () => {
    if (!deletingUser) return;

    deleteUser(deletingUser.id);
    if (typeof onUsersUpdated === 'function') onUsersUpdated();
    if (typeof onRefresh === 'function') onRefresh();
    showStatus('success', `Pengguna ${deletingUser.name} berhasil dihapus.`);
    setDeletingUser(null);
  };

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 px-2.5 py-1 text-xs font-black text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Crown className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Owner (Full Access)</span>
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-950/80 px-2.5 py-1 text-xs font-extrabold text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <UserCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Admin Sales</span>
          </span>
        );
      case 'produksi':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 text-xs font-extrabold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Wrench className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Tim Produksi</span>
          </span>
        );
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fadeIn overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 dark:border-slate-800 dark:bg-slate-900 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Manajemen Pengaturan User</h3>
              <p className="text-[11px] text-slate-400">
                Kelola akun pengguna, hak akses peran (Role), dan password akun
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-bold transition animate-fadeIn ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
              <button
                onClick={() => setStatusMessage(null)}
                className="text-[11px] underline hover:opacity-80 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Daftar Pengguna Aplikasi ({users.length})
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pengguna dapat login dengan hak akses Owner, Admin Sales, atau Tim Produksi.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-indigo-700 shadow-md transition cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Tambah Pengguna Baru</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Nama Pengguna</th>
                  <th className="px-4 py-3">Peran / Role</th>
                  <th className="px-4 py-3">Password Akses</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const isPasswordRevealed = !!revealedPasswords[u.id];
                  const userPass = u.password || (u.role === 'owner' ? 'owner123' : u.role === 'admin' ? 'admin123' : 'produksi123');

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-sm border border-slate-200 dark:border-slate-700">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                  Aktif
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">{getRoleBadge(u.role)}</td>
                      <td className="px-4 py-3.5 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-800 dark:text-slate-200 text-xs">
                            {isPasswordRevealed ? userPass : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRevealPassword(u.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title={isPasswordRevealed ? 'Sembunyikan Password' : 'Lihat Password'}
                          >
                            {isPasswordRevealed ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(u)}
                            className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition cursor-pointer font-extrabold text-[11px] flex items-center gap-1"
                            title="Edit User & Password"
                          >
                            <span>Edit / Ganti Pass</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrent}
                            className={`rounded-lg p-2 transition cursor-pointer font-extrabold text-[11px] flex items-center gap-1 ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                                : 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/60'
                            }`}
                            title={isCurrent ? 'Tidak bisa menghapus akun sendiri' : 'Hapus User'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

        {/* Create / Edit User Modal Overlay */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <span>{editingUser ? 'Edit Data / Password Pengguna' : 'Tambah Pengguna Baru'}</span>
                </h3>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Bambang Kurniawan"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                  />
                </div>



                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Peran (Role Akses) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
                  >
                    <option value="owner">👑 Owner (Hak Akses Penuh / Laporan Keuangan)</option>
                    <option value="admin">👤 Admin Sales (Buat Order, Nota & Pelanggan)</option>
                    <option value="produksi">⚙️ Tim Produksi (Lihat & Update Status Produksi)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300">
                    Password Akses <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPasswordInForm ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password baru..."
                      required
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordInForm(!showPasswordInForm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPasswordInForm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Password ini digunakan saat berpindah peran atau login akun.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-xs font-extrabold text-white hover:bg-indigo-700 shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Simpan Pengguna</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="p-2.5 rounded-full bg-rose-100 dark:bg-rose-950/60">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Hapus Pengguna?
                  </h3>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {deletingUser.name}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Apakah Anda yakin ingin menghapus akun ini? Pengguna ini tidak akan lagi dapat mengakses aplikasi.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 text-xs font-extrabold text-white hover:bg-rose-700 shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Ya, Hapus</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
