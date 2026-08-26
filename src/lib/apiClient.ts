import { BusinessSettings, Customer, Expense, Order, PriceListItem } from '../types';

export type BackendConnectionStatus = 'connected' | 'connecting' | 'offline' | 'error';

export interface ConnectionInfo {
  status: BackendConnectionStatus;
  url: string;
  serverTime?: string;
  databaseName?: string;
  latencyMs?: number;
  message?: string;
  lastChecked?: string;
}

const STORAGE_KEYS = {
  PHP_BACKEND_URL: 'bummi_php_backend_url_v1',
  BACKEND_MODE: 'bummi_backend_mode_v1', // 'auto' | 'php_mysql' | 'local'
  LAST_SYNC_TIME: 'bummi_last_sync_time_v1',
};

// Default fallback URL
export function getDefaultBackendUrl(): string {
  if (typeof window === 'undefined') return '';
  // Check if we are running in same-origin hosting (e.g. cPanel public_html)
  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalDev) {
    // If on localhost (Vite dev server port 3000), default to XAMPP / Laragon API path
    return 'http://localhost/order-api';
  }
  // If hosted on live domain, relative /api is default
  return `${window.location.origin}/api`;
}

export function getActiveBackendUrl(): string {
  if (typeof window === 'undefined') return '';
  const saved = localStorage.getItem(STORAGE_KEYS.PHP_BACKEND_URL);
  if (saved && saved.trim()) {
    return saved.trim().replace(/\/+$/, '');
  }
  return getDefaultBackendUrl().replace(/\/+$/, '');
}

export function setActiveBackendUrl(url: string): void {
  if (typeof window === 'undefined') return;
  const clean = url.trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEYS.PHP_BACKEND_URL, clean);
}

// Normalize endpoint path given base URL
// Handles cases where user enters:
// 1. "http://localhost/order-api" -> `${url}/api/${endpoint}.php`
// 2. "http://localhost/order-api/api" -> `${url}/${endpoint}.php`
// 3. "https://domain.com/api" -> `${url}/${endpoint}.php`
// 4. "/api" -> `/api/${endpoint}.php`
function resolveEndpoint(endpoint: string, customBaseUrl?: string): string {
  const baseUrl = (customBaseUrl || getActiveBackendUrl()).trim().replace(/\/+$/, '');
  const endpointPhp = endpoint.endsWith('.php') ? endpoint : `${endpoint}.php`;

  if (!baseUrl) {
    return `/api/${endpointPhp}`;
  }

  // If base url already ends with /api or has /api at the end
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}/${endpointPhp}`;
  }

  // Otherwise append /api/
  return `${baseUrl}/api/${endpointPhp}`;
}

class ApiClient {
  private status: BackendConnectionStatus = 'connecting';
  private connectionInfo: ConnectionInfo = {
    status: 'connecting',
    url: getActiveBackendUrl(),
  };
  private listeners: Array<(info: ConnectionInfo) => void> = [];

  constructor() {
    // Run initial test on client load
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.testConnection();
      }, 500);
    }
  }

  public subscribe(listener: (info: ConnectionInfo) => void): () => void {
    this.listeners.push(listener);
    listener(this.connectionInfo);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.connectionInfo));
  }

  public getConnectionInfo(): ConnectionInfo {
    return this.connectionInfo;
  }

  public setConnectionStatus(status: BackendConnectionStatus, message?: string, latencyMs?: number) {
    this.status = status;
    this.connectionInfo = {
      ...this.connectionInfo,
      status,
      message,
      latencyMs,
      lastChecked: new Date().toISOString(),
    };
    this.notify();
  }

  // Test Ping Server & Database
  public async testConnection(customUrl?: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
    latencyMs: number;
  }> {
    const url = (customUrl || getActiveBackendUrl()).trim();
    const endpoint = resolveEndpoint('settings', url);
    const start = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - start);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const info: ConnectionInfo = {
            status: 'connected',
            url,
            latencyMs,
            serverTime: new Date().toLocaleTimeString('id-ID'),
            databaseName: data.database || 'MySQL Active',
            message: `Terhubung ke MySQL (${latencyMs}ms)`,
            lastChecked: new Date().toISOString(),
          };
          this.connectionInfo = info;
          this.notify();
          return {
            success: true,
            message: `Koneksi Berhasil! Database MySQL aktif (${latencyMs}ms)`,
            data,
            latencyMs,
          };
        }
      }

      const errMsg = `Server HTTP ${res.status}: ${res.statusText}`;
      this.setConnectionStatus('error', errMsg, latencyMs);
      return { success: false, message: errMsg, latencyMs };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      const isTimeout = err?.name === 'AbortError';
      const errMsg = isTimeout
        ? 'Koneksi timeout (server tidak merespon dalam 6 detik)'
        : (err?.message || 'Gagal terhubung ke endpoint PHP');
      
      this.setConnectionStatus('offline', errMsg, latencyMs);
      return { success: false, message: errMsg, latencyMs };
    }
  }

  // ------------------------------------------------------------------------
  // ORDERS API
  // ------------------------------------------------------------------------
  public async getOrders(): Promise<Order[] | null> {
    try {
      const endpoint = resolveEndpoint('orders');
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.orders)) {
          this.setConnectionStatus('connected', 'Tersinkronisasi dengan MySQL');
          return data.orders;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  public async saveOrder(order: Order): Promise<boolean> {
    try {
      const endpoint = resolveEndpoint('orders');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(order),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          this.setConnectionStatus('connected', 'Order tersimpan ke MySQL');
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn('Gagal menyimpan order ke MySQL backend, disimpan di lokal:', err);
      return false;
    }
  }

  public async deleteOrder(id: string): Promise<boolean> {
    try {
      const endpoint = `${resolveEndpoint('orders')}?id=${encodeURIComponent(id)}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return !!(data && data.success);
      }
      return false;
    } catch {
      return false;
    }
  }

  public async deleteAllOrders(): Promise<boolean> {
    try {
      const endpoint = `${resolveEndpoint('orders')}?action=delete_all`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return !!(data && data.success);
      }
      return false;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------------
  // CUSTOMERS API
  // ------------------------------------------------------------------------
  public async getCustomers(): Promise<Customer[] | null> {
    try {
      const endpoint = resolveEndpoint('customers');
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.customers)) {
          return data.customers;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  public async saveCustomer(customer: Customer): Promise<boolean> {
    try {
      const endpoint = resolveEndpoint('customers');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(customer),
      });
      if (res.ok) {
        const data = await res.json();
        return !!(data && data.success);
      }
      return false;
    } catch {
      return false;
    }
  }

  public async deleteCustomer(id: string): Promise<boolean> {
    try {
      const endpoint = `${resolveEndpoint('customers')}?id=${encodeURIComponent(id)}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return !!(data && data.success);
      }
      return false;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------------
  // EXPENSES API
  // ------------------------------------------------------------------------
  public async getExpenses(): Promise<Expense[] | null> {
    try {
      const endpoint = resolveEndpoint('expenses');
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.expenses)) {
          return data.expenses;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  public async saveExpense(expense: Expense): Promise<boolean> {
    try {
      const endpoint = resolveEndpoint('expenses');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(expense),
      });
      if (res.ok) {
        const data = await res.json();
        return !!(data && data.success);
      }
      return false;
    } catch {
      return false;
    }
  }

  public async deleteExpense(id: string): Promise<boolean> {
    try {
      const endpoint = `${resolveEndpoint('expenses')}?id=${encodeURIComponent(id)}`;
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return !!(data && data.success);
      }
      return false;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------------
  // SETTINGS API
  // ------------------------------------------------------------------------
  public async getSettings(): Promise<BusinessSettings | null> {
    try {
      const endpoint = resolveEndpoint('settings');
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.settings) {
          return data.settings;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  public async saveSettings(settings: BusinessSettings): Promise<boolean> {
    try {
      const endpoint = resolveEndpoint('settings');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        return !!(data && data.success);
      }
      return false;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------------
  // PRICE LIST API
  // ------------------------------------------------------------------------
  public async getPriceList(): Promise<PriceListItem[] | null> {
    try {
      const endpoint = resolveEndpoint('pricelist');
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.priceList)) {
          return data.priceList;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  public async savePriceList(items: PriceListItem[]): Promise<boolean> {
    try {
      const endpoint = resolveEndpoint('pricelist');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        const data = await res.json();
        return !!(data && data.success);
      }
      return false;
    } catch {
      return false;
    }
  }

  // ------------------------------------------------------------------------
  // FULL STATE SYNC: GET ALL DATA FROM MYSQL & PUSH ALL DATA TO MYSQL
  // ------------------------------------------------------------------------
  public async fetchFullStateFromBackend(): Promise<{
    success: boolean;
    settings?: BusinessSettings;
    customers?: Customer[];
    orders?: Order[];
    expenses?: Expense[];
    priceList?: PriceListItem[];
  }> {
    try {
      const endpoint = resolveEndpoint('state');
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          this.setConnectionStatus('connected', 'Tersinkronisasi dengan MySQL Database');
          return {
            success: true,
            settings: data.settings,
            customers: data.customers,
            orders: data.orders,
            expenses: data.expenses,
            priceList: data.priceList,
          };
        }
      }
      return { success: false };
    } catch {
      return { success: false };
    }
  }

  public async pushFullStateToBackend(payload: {
    settings?: BusinessSettings;
    customers?: Customer[];
    orders?: Order[];
    expenses?: Expense[];
    priceList?: PriceListItem[];
  }): Promise<{ success: boolean; message: string; savedCount?: number }> {
    try {
      const endpoint = resolveEndpoint('state');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          this.setConnectionStatus('connected', 'Data lokal berhasil dipush ke MySQL');
          return {
            success: true,
            message: data.message || 'Semua data berhasil disimpan ke MySQL!',
            savedCount: data.savedOrdersCount || (payload.orders?.length ?? 0),
          };
        }
        return { success: false, message: data.error || 'Server menolak sinkronisasi data.' };
      }
      return { success: false, message: `HTTP ${res.status}: Gagal mengirim data ke server.` };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menghubungi server PHP MySQL.' };
    }
  }
}

export const apiClient = new ApiClient();
