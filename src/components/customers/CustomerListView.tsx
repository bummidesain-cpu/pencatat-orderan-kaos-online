import React, { useState } from 'react';
import {
  AlertCircle,
  Building2,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { formatDateShort, formatRupiah } from '../../lib/utils';
import { Customer, Order } from '../../types';

interface CustomerListViewProps {
  customers: Customer[];
  orders: Order[];
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onSelectOrder: (order: Order) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  customers,
  orders,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectOrder,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.organization && c.organization.toLowerCase().includes(search.toLowerCase())) ||
      c.phone.includes(search)
  );

  const [formError, setFormError] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setOrganization('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingId(customer.id);
    setName(customer.name);
    setOrganization(customer.organization || '');
    setPhone(customer.phone);
    setEmail(customer.email || '');
    setAddress(customer.address || '');
    setNotes(customer.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setFormError('Nama Customer dan Nomor WhatsApp wajib diisi!');
      return;
    }

    const newCustomer: Customer = {
      id: editingId || 'cust-' + Date.now().toString(36),
      name: name.trim(),
      organization: organization.trim() || undefined,
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: editingId
        ? customers.find((c) => c.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    onSaveCustomer(newCustomer);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Database Customer</h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola kontak pelanggan, instansi/komunitas, dan riwayat pesanan
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm transition"
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Tambah Customer Baru</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, instansi, atau WhatsApp..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const custOrders = orders.filter((o) => o.customerId === cust.id || o.customerName === cust.name);
          const totalSpent = custOrders.reduce((sum, o) => sum + o.grandTotal, 0);

          return (
            <div
              key={cust.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-indigo-300 transition dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-extrabold text-base dark:bg-indigo-950/60 dark:text-indigo-400">
                      {cust.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                        {cust.name}
                      </h3>
                      {cust.organization && (
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3" />
                          {cust.organization}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(cust)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                      title="Edit Customer"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus customer "${cust.name}"?`)) {
                          onDeleteCustomer(cust.id);
                        }
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                      title="Hapus Customer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{cust.phone}</span>
                  </p>
                  {cust.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{cust.email}</span>
                    </p>
                  )}
                  {cust.address && (
                    <p className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{cust.address}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Order Stats & History Trigger */}
              <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between dark:border-slate-800">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Transaksi</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {custOrders.length} Order ({formatRupiah(totalSpent)})
                  </p>
                </div>

                <button
                  onClick={() => setSelectedCustomerForHistory(cust)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 transition"
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Riwayat</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {editingId ? 'Edit Data Customer' : 'Tambah Customer Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Instansi / Komunitas (Opsional)
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Contoh: Komunitas Garuda Indonesia"
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nomor WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email (Opsional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Merdeka No..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Catatan Khusus</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan preferensi..."
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-900 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition"
                >
                  Simpan Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Order History Drawer/Modal */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Riwayat Order — {selectedCustomerForHistory.name}
                </h3>
                {selectedCustomerForHistory.organization && (
                  <p className="text-xs text-indigo-600 font-semibold">
                    {selectedCustomerForHistory.organization}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedCustomerForHistory(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
              {orders.filter(
                (o) =>
                  o.customerId === selectedCustomerForHistory.id ||
                  o.customerName === selectedCustomerForHistory.name
              ).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada riwayat order untuk customer ini.
                </div>
              ) : (
                orders
                  .filter(
                    (o) =>
                      o.customerId === selectedCustomerForHistory.id ||
                      o.customerName === selectedCustomerForHistory.name
                  )
                  .map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setSelectedCustomerForHistory(null);
                        onSelectOrder(ord);
                      }}
                      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-white cursor-pointer transition flex items-center justify-between dark:bg-slate-800 dark:border-slate-700"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                            {ord.orderNumber}
                          </span>
                          <span className="text-xs text-slate-500">({formatDateShort(ord.orderDate)})</span>
                        </div>
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white mt-1">
                          {ord.items[0]?.productName}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {ord.items.reduce((s, i) => s + i.quantity, 0)} pcs • {ord.items[0]?.fabric}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {formatRupiah(ord.grandTotal)}
                        </p>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.paymentStatus === 'Lunas'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
