import {
  initialBusinessSettings,
  initialCustomers,
  initialExpenses,
  initialOrders,
  initialPriceList,
  initialUsers,
} from '../data/initialData';
import {
  ActivityLog,
  BackupReminderInterval,
  BusinessSettings,
  Customer,
  Expense,
  Order,
  PriceListItem,
  User,
} from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'bummi_settings_v1',
  USERS: 'bummi_users_v1',
  CURRENT_USER: 'bummi_current_user_v1',
  AUTH_SESSION: 'bummi_auth_session_v1',
  CUSTOMERS: 'bummi_customers_v1',
  ORDERS: 'bummi_orders_v3',
  EXPENSES: 'bummi_expenses_v1',
  ACTIVITY_LOGS: 'bummi_activity_logs_v1',
  PRICE_LIST: 'bummi_price_list_v1',
  PHP_BACKEND_URL: 'bummi_php_backend_url_v1',
  BACKEND_MODE: 'bummi_backend_mode_v1', // 'local' | 'php_mysql'
};

export function getPhpBackendUrl(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEYS.PHP_BACKEND_URL) || 'http://localhost/order-api';
}

export function setPhpBackendUrl(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PHP_BACKEND_URL, url.trim().replace(/\/+$/, ''));
}

export function getBackendMode(): 'local' | 'php_mysql' {
  if (typeof window === 'undefined') return 'local';
  return (localStorage.getItem(STORAGE_KEYS.BACKEND_MODE) as 'local' | 'php_mysql') || 'local';
}

export function setBackendMode(mode: 'local' | 'php_mysql'): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.BACKEND_MODE, mode);
}

export async function testPhpBackendConnection(customUrl?: string): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  const baseUrl = (customUrl || getPhpBackendUrl()).trim().replace(/\/+$/, '');
  if (!baseUrl) {
    return { success: false, message: 'URL Backend PHP belum ditentukan.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${baseUrl}/api/settings.php`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return {
          success: true,
          message: `Berhasil terhubung ke Backend PHP MySQL! (${data.settings?.name || 'Database OK'})`,
          data,
        };
      }
      return {
        success: true,
        message: 'Endpoint PHP merespon, namun status database perlu diperiksa.',
        data,
      };
    } else {
      return {
        success: false,
        message: `Server merespon dengan status HTTP ${res.status}: ${res.statusText}`,
      };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Koneksi timeout (lebih dari 6 detik). Pastikan web server Apache/PHP dan MySQL aktif.',
      };
    }
    return {
      success: false,
      message: `Gagal terhubung: ${err?.message || 'Pastikan XAMPP/Laragon/cPanel aktif dan CORS diizinkan.'}`,
    };
  }
}


// Initialize default storage if empty
export function initLocalStorage(): void {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialBusinessSettings));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(initialUsers[0])); // Owner default
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(initialOrders));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EXPENSES)) {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(initialExpenses));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PRICE_LIST)) {
    localStorage.setItem(STORAGE_KEYS.PRICE_LIST, JSON.stringify(initialPriceList));
  }

  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
    const defaultLogs: ActivityLog[] = [
      {
        id: 'log-1',
        orderId: 'ord-101',
        orderNumber: 'ORD-202608-0001',
        timestamp: '2026-08-01T10:30:00Z',
        user: 'Siti Admin Sales',
        activity: 'Membuat Order Baru & Mengunggah Desain V1',
      },
      {
        id: 'log-2',
        orderId: 'ord-102',
        orderNumber: 'ORD-202607-0012',
        timestamp: '2026-07-29T14:20:00Z',
        user: 'Dewi Lestari (Customer)',
        activity: 'Menyetujui Desain V2 (Approved)',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(defaultLogs));
  }
}

// Business Settings
export function getBusinessSettings(): BusinessSettings {
  initLocalStorage();
  try {
    const item = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!item) return initialBusinessSettings;
    return JSON.parse(item);
  } catch {
    return initialBusinessSettings;
  }
}

export function saveBusinessSettings(settings: BusinessSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  syncWithBackend('settings', settings);
}

// Users
export function getUsers(): User[] {
  initLocalStorage();
  try {
    const item = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!item) return initialUsers;
    const users: User[] = JSON.parse(item);
    // Ensure all existing initial users have default passwords and updated domain if missing
    return users.map((u) => {
      if (!u.password) {
        if (u.role === 'owner') u.password = 'owner123';
        else if (u.role === 'admin') u.password = 'admin123';
        else if (u.role === 'produksi') u.password = 'produksi123';
      }
      if (u.email && u.email.includes('@bummisablon.com')) {
        u.email = u.email.replace('@bummisablon.com', '@ordermanagement.com');
      }
      return u;
    });
  } catch {
    return initialUsers;
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

export function saveUser(userToSave: User): User[] {
  const users = getUsers();
  const existingIdx = users.findIndex((u) => u.id === userToSave.id);
  let updatedUsers: User[];
  if (existingIdx >= 0) {
    updatedUsers = users.map((u) => (u.id === userToSave.id ? { ...u, ...userToSave } : u));
  } else {
    updatedUsers = [{ ...userToSave, createdAt: userToSave.createdAt || new Date().toISOString().slice(0, 10) }, ...users];
  }
  saveUsers(updatedUsers);

  // If current user updated, keep current user in sync
  const currentUser = getCurrentUser();
  if (currentUser.id === userToSave.id) {
    setCurrentUser({ ...currentUser, ...userToSave });
  }

  return updatedUsers;
}

export function deleteUser(userId: string): User[] {
  const users = getUsers();
  const updatedUsers = users.filter((u) => u.id !== userId);
  saveUsers(updatedUsers);
  return updatedUsers;
}

export function verifyOwnerPassword(password: string): boolean {
  const users = getUsers();
  const owners = users.filter((u) => u.role === 'owner');
  // Check if password matches any owner or default fallback 'owner123'
  return owners.some((o) => (o.password || 'owner123') === password.trim()) || password.trim() === 'owner123';
}

export function getCurrentUser(): User {
  initLocalStorage();
  try {
    const item = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return item ? JSON.parse(item) : initialUsers[0];
  } catch {
    return initialUsers[0];
  }
}

export function setCurrentUser(user: User): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

// Authentication Session Methods
export function getAuthSession(): User | null {
  initLocalStorage();
  try {
    // Check sessionStorage first for current active session
    if (typeof window !== 'undefined' && sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION)) {
      const sessionItem = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (sessionItem) return JSON.parse(sessionItem);
    }
    // Fallback to localStorage if rememberMe was used
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYS.AUTH_SESSION)) {
      const localItem = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (localItem) {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, localItem);
        return JSON.parse(localItem);
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function loginUser(
  identifier: string,
  pass: string,
  rememberMe: boolean = false
): { success: boolean; user?: User; error?: string } {
  const users = getUsers();
  const target = users.find(
    (u) =>
      u.name.toLowerCase().trim() === identifier.toLowerCase().trim() ||
      (u.email && u.email.toLowerCase().trim() === identifier.toLowerCase().trim())
  );
  if (!target) {
    return { success: false, error: 'Nama pengguna tidak ditemukan.' };
  }

  const expectedPass =
    target.password || (target.role === 'owner' ? 'owner123' : target.role === 'admin' ? 'admin123' : 'produksi123');

  if (pass.trim() !== expectedPass.trim()) {
    return { success: false, error: 'Password yang Anda masukkan salah.' };
  }

  // Set session in sessionStorage and conditionally in localStorage
  sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(target));
  if (rememberMe) {
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(target));
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }
  setCurrentUser(target);
  return { success: true, user: target };
}

export function logoutUser(): void {
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
}

// Customers
export function getCustomers(): Customer[] {
  initLocalStorage();
  try {
    const item = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    return item ? JSON.parse(item) : initialCustomers;
  } catch {
    return initialCustomers;
  }
}

export function saveCustomer(customer: Customer): void {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === customer.id);
  if (index >= 0) {
    customers[index] = customer;
  } else {
    customers.unshift(customer);
  }
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  syncWithBackend('customers', customers);
}

export function deleteCustomer(id: string): void {
  const customers = getCustomers().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  syncWithBackend('customers', customers);
}

// Orders
export function getOrders(): Order[] {
  initLocalStorage();
  try {
    const item = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const parsed = item ? JSON.parse(item) : initialOrders;
    return (parsed || []).map((o: any) => ({
      ...o,
      items: Array.isArray(o.items) ? o.items : [],
      payments: Array.isArray(o.payments) ? o.payments : [],
    }));
  } catch {
    return initialOrders;
  }
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find((o) => o.id === id);
}


export function saveOrder(order: Order): void {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === order.id);
  if (index >= 0) {
    orders[index] = { ...order, updatedAt: new Date().toISOString() };
  } else {
    orders.unshift({ ...order, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  syncWithBackend('orders', orders);
}

export function deleteOrder(id: string): void {
  const orders = getOrders().filter((o) => o.id !== id);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  syncWithBackend('orders', orders);
}

export function deleteAllOrders(): void {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  syncWithBackend('orders', []);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  syncWithBackend('expenses', []);
}

// Expenses
export function getExpenses(): Expense[] {
  initLocalStorage();
  try {
    const item = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return item ? JSON.parse(item) : initialExpenses;
  } catch {
    return initialExpenses;
  }
}

export function saveExpense(expense: Expense): void {
  const expenses = getExpenses();
  const index = expenses.findIndex((e) => e.id === expense.id);
  if (index >= 0) {
    expenses[index] = expense;
  } else {
    expenses.unshift(expense);
  }
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  syncWithBackend('expenses', expenses);
}

export function deleteExpense(id: string): void {
  const expenses = getExpenses().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  syncWithBackend('expenses', expenses);
}

// Activity Logs
export function getActivityLogs(): ActivityLog[] {
  initLocalStorage();
  try {
    const item = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
}

export function addActivityLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): void {
  const logs = getActivityLogs();
  const newLog: ActivityLog = {
    ...log,
    id: 'log-' + Date.now().toString(36),
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  // Keep last 100 logs
  if (logs.length > 100) logs.pop();
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
}

// Background sync helper with Express server backend
async function syncWithBackend(resource: string, data: unknown): Promise<void> {
  try {
    await fetch(`/api/${resource}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  } catch {
    // Client offline or local-only fallback
  }
}

// Restore state from backend API on initial boot if available
export async function syncFromBackend(): Promise<void> {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.customers) localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(data.customers));
      if (data.orders) localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(data.orders));
    }
  } catch {
    // Fail silently, use localStorage
  }
}

// Backup & Restore Database Helpers
export function exportDatabaseBackup(): void {
  const currentSettings = getBusinessSettings();
  const nowIso = new Date().toISOString();
  const updatedSettings: BusinessSettings = {
    ...currentSettings,
    lastBackupDate: nowIso,
  };
  saveBusinessSettings(updatedSettings);

  const backupObj = {
    appName: 'ORDER MANAGEMENT SYSTEM POS',
    version: '1.0',
    exportedAt: nowIso,
    settings: updatedSettings,
    customers: getCustomers(),
    orders: getOrders(),
    users: getUsers(),
    activityLogs: getActivityLogs(),
  };

  const jsonStr = JSON.stringify(backupObj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '');
  const fileName = `order_management_backup_${dateStr}_${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  addActivityLog({
    orderId: '-',
    orderNumber: 'BACKUP',
    user: getCurrentUser().name,
    activity: 'Mengunduh / Mengexport Backup Database (.json)',
  });
}

export interface BackupReminderStatus {
  enabled: boolean;
  interval: BackupReminderInterval;
  lastBackupDate: string | null;
  isDue: boolean;
  daysSinceLastBackup: number | null;
  daysThreshold: number;
  intervalLabel: string;
  nextBackupDate: string | null;
  formattedLastBackup: string;
}

export function getBackupReminderStatus(customSettings?: BusinessSettings): BackupReminderStatus {
  const settings = customSettings || getBusinessSettings();
  const enabled = settings.backupReminderEnabled !== false;
  const interval: BackupReminderInterval = settings.backupReminderInterval || '7_days';
  const lastBackup = settings.lastBackupDate || null;

  let daysThreshold = 7;
  let intervalLabel = '7 Hari (Mingguan)';
  if (interval === '1_day') {
    daysThreshold = 1;
    intervalLabel = '1 Hari (Harian)';
  } else if (interval === '1_month') {
    daysThreshold = 30;
    intervalLabel = '1 Bulan (Bulanan)';
  }

  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;

  if (!lastBackup) {
    return {
      enabled,
      interval,
      lastBackupDate: null,
      isDue: enabled,
      daysSinceLastBackup: null,
      daysThreshold,
      intervalLabel,
      nextBackupDate: null,
      formattedLastBackup: 'Belum pernah di-backup',
    };
  }

  const lastBackupTime = new Date(lastBackup).getTime();
  const nowTime = Date.now();
  const diffMs = Math.max(0, nowTime - lastBackupTime);
  const daysSinceLastBackup = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const isDue = enabled && diffMs >= thresholdMs;
  const nextBackupDate = new Date(lastBackupTime + thresholdMs).toISOString();

  const formattedLastBackup = new Date(lastBackup).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    enabled,
    interval,
    lastBackupDate: lastBackup,
    isDue,
    daysSinceLastBackup,
    daysThreshold,
    intervalLabel,
    nextBackupDate,
    formattedLastBackup,
  };
}

export async function importDatabaseBackup(backupData: any): Promise<{
  ordersCount: number;
  customersCount: number;
}> {
  if (!backupData || typeof backupData !== 'object') {
    throw new Error('Format file backup tidak valid.');
  }

  const { settings, customers, orders, users, activityLogs } = backupData;

  if (!Array.isArray(orders) && !Array.isArray(customers) && !settings) {
    throw new Error('Isi file JSON tidak memiliki struktur database Order Management System yang valid.');
  }

  if (settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    await syncWithBackend('settings', settings);
  }

  if (Array.isArray(customers)) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    await syncWithBackend('customers', customers);
  }

  if (Array.isArray(orders)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    await syncWithBackend('orders', orders);
  }

  if (Array.isArray(users)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  if (Array.isArray(activityLogs)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
  }

  addActivityLog({
    orderId: '-',
    orderNumber: 'RESTORE',
    user: getCurrentUser().name,
    activity: `Memulihkan (Restore) Database Backup: ${orders?.length || 0} order & ${customers?.length || 0} pelanggan`,
  });

  return {
    ordersCount: Array.isArray(orders) ? orders.length : 0,
    customersCount: Array.isArray(customers) ? customers.length : 0,
  };
}

export async function resetDatabaseToDefault(): Promise<void> {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialBusinessSettings));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(initialOrders));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));

  await syncWithBackend('settings', initialBusinessSettings);
  await syncWithBackend('customers', initialCustomers);
  await syncWithBackend('orders', initialOrders);

  addActivityLog({
    orderId: '-',
    orderNumber: 'RESET',
    user: getCurrentUser().name,
    activity: 'Mereset Seluruh Data ke Default Awal',
  });
}

// Price List Storage Handlers
export function getPriceList(): PriceListItem[] {
  initLocalStorage();
  try {
    const item = localStorage.getItem(STORAGE_KEYS.PRICE_LIST);
    if (!item) return initialPriceList;
    return JSON.parse(item);
  } catch {
    return initialPriceList;
  }
}

export function savePriceList(items: PriceListItem[]): void {
  localStorage.setItem(STORAGE_KEYS.PRICE_LIST, JSON.stringify(items));
}

export function addPriceListItem(newItem: Omit<PriceListItem, 'id' | 'updatedAt'>): PriceListItem {
  const list = getPriceList();
  const created: PriceListItem = {
    ...newItem,
    id: `price-${Date.now()}`,
    updatedAt: new Date().toISOString().split('T')[0],
  };
  const updatedList = [created, ...list];
  savePriceList(updatedList);
  return created;
}

export function updatePriceListItem(updated: PriceListItem): void {
  const list = getPriceList();
  const index = list.findIndex((p) => p.id === updated.id);
  if (index !== -1) {
    list[index] = {
      ...updated,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    savePriceList(list);
  }
}

export function deletePriceListItem(id: string): void {
  const list = getPriceList();
  const updatedList = list.filter((p) => p.id !== id);
  savePriceList(updatedList);
}


