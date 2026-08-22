import React, { useEffect, useState } from 'react';
import { LoginView } from './components/auth/LoginView';
import { OwnerPasswordModal } from './components/auth/OwnerPasswordModal';
import { CustomerListView } from './components/customers/CustomerListView';
import { DashboardView } from './components/dashboard/DashboardView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { Navbar } from './components/Navbar';
import { OrderDetailView } from './components/orders/OrderDetailView';
import { OrderFormModal } from './components/orders/OrderFormModal';
import { OrderListView } from './components/orders/OrderListView';
import { PrintInvoiceModal } from './components/PrintInvoiceModal';
import { ProductionBoard } from './components/production/ProductionBoard';
import { ReportsView } from './components/reports/ReportsView';
import { PriceListView } from './components/pricelist/PriceListView';
import { SettingsView } from './components/settings/SettingsView';
import { UserManagementModal } from './components/settings/UserManagementModal';
import { NavTab, Sidebar } from './components/Sidebar';
import { WhatsAppModal } from './components/WhatsAppModal';
import { BackupReminderBanner } from './components/BackupReminderBanner';
import {
  addPriceListItem,
  deleteCustomer as removeCustomerStorage,
  deleteExpense as removeExpenseStorage,
  deleteOrder as removeOrderStorage,
  deletePriceListItem,
  getAuthSession,
  getBackupReminderStatus,
  getBusinessSettings,
  getCurrentUser,
  getCustomers,
  getExpenses,
  getOrders,
  getPriceList,
  getUsers,
  loginUser,
  logoutUser,
  saveBusinessSettings,
  saveCustomer as persistCustomer,
  saveExpense as persistExpense,
  saveOrder as persistOrder,
  setCurrentUser,
  syncFromBackend,
  updatePriceListItem,
} from './lib/storage';
import { BusinessSettings, Customer, Expense, Order, PriceListItem, ProductionStage, User, UserRole } from './types';
import { isActivated } from './lib/license';
import { LicenseModal } from './components/LicenseModal';


export default function App() {
  // Auth Session State
  const [authSession, setAuthSession] = useState<User | null>(() => getAuthSession());

  // App State
  const [currentUser, setUserState] = useState<User>(() => getAuthSession() || getCurrentUser());
  const [users, setUsersState] = useState<User[]>(getUsers());
  const [settings, setSettingsState] = useState<BusinessSettings>(getBusinessSettings());
  const [customers, setCustomersState] = useState<Customer[]>(getCustomers());
  const [orders, setOrdersState] = useState<Order[]>(getOrders());
  const [expenses, setExpensesState] = useState<Expense[]>(getExpenses());
  const [priceList, setPriceListState] = useState<PriceListItem[]>(() => getPriceList());

  // License State
  const [isLicensed, setIsLicensed] = useState(() => isActivated());
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  const handleSavePriceItem = (itemData: Omit<PriceListItem, 'id' | 'updatedAt'> & { id?: string }) => {
    if (itemData.id) {
      updatePriceListItem(itemData as PriceListItem);
    } else {
      addPriceListItem(itemData);
    }
    setPriceListState(getPriceList());
  };

  const handleDeletePriceItem = (id: string) => {
    deletePriceListItem(id);
    setPriceListState(getPriceList());
  };


  // UI State
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    const session = getAuthSession() || getCurrentUser();
    if (session?.role === 'admin') return 'orders';
    if (session?.role === 'produksi') return 'production';
    return 'dashboard';
  });

  useEffect(() => {
    if (currentUser.role === 'admin' && !['orders', 'customers', 'pricelist', 'production'].includes(activeTab)) {
      setActiveTab('orders');
    } else if (currentUser.role === 'produksi' && !['production', 'orders'].includes(activeTab)) {
      setActiveTab('production');
    }
  }, [currentUser.role]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [waModalOrder, setWaModalOrder] = useState<Order | null>(null);
  const [waModalType, setWaModalType] = useState<'nota'>('nota');
  const [printModalConfig, setPrintModalConfig] = useState<{
    order: Order;
    mode: 'invoice' | 'spk';
  } | null>(null);
  const [isOwnerPasswordModalOpen, setIsOwnerPasswordModalOpen] = useState(false);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);


  // Theme State ('light' | 'dark' | 'system')
  type ThemeMode = 'light' | 'dark' | 'system';
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      return (localStorage.getItem('bummi_theme') as ThemeMode) || 'system';
    } catch {
      return 'system';
    }
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemDark = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };
    mediaQuery.addEventListener('change', updateSystemDark);
    return () => mediaQuery.removeEventListener('change', updateSystemDark);
  }, []);

  const isDarkMode = theme === 'dark' || (theme === 'system' && systemDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('bummi_theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme to localStorage', e);
    }
  };

  // Sync state on load
  useEffect(() => {
    syncFromBackend().then(() => {
      setSettingsState(getBusinessSettings());
      setCustomersState(getCustomers());
      setOrdersState(getOrders());
      setExpensesState(getExpenses());
    });
  }, []);

  // Sync state changes
  const handleSaveOrder = (order: Order) => {
    const isExisting = orders.some((o) => o.id === order.id);
    if (!isLicensed && !isExisting && orders.length >= 5) {
      setIsLicenseModalOpen(true);
      return;
    }

    persistOrder(order);
    const refreshed = getOrders();
    setOrdersState(refreshed);

    // If currently viewing detail of this order, keep it updated
    if (selectedOrder && selectedOrder.id === order.id) {
      const updated = refreshed.find((o) => o.id === order.id);
      if (updated) setSelectedOrder(updated);
    }
  };

  const handleOpenNewOrder = () => {
    if (!isLicensed && orders.length >= 5) {
      setIsLicenseModalOpen(true);
    } else {
      setIsNewOrderModalOpen(true);
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    removeOrderStorage(orderId);
    setOrdersState(getOrders());
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(null);
    }
  };

  const handleSaveCustomer = (customer: Customer) => {
    persistCustomer(customer);
    setCustomersState(getCustomers());
  };

  const handleDeleteCustomer = (customerId: string) => {
    removeCustomerStorage(customerId);
    setCustomersState(getCustomers());
  };

  const handleSaveExpense = (expense: Expense) => {
    persistExpense(expense);
    setExpensesState(getExpenses());
  };

  const handleDeleteExpense = (expenseId: string) => {
    removeExpenseStorage(expenseId);
    setExpensesState(getExpenses());
  };

  const handleSaveSettings = (newSettings: BusinessSettings) => {
    saveBusinessSettings(newSettings);
    setSettingsState(getBusinessSettings());
  };

  const handleRefreshAllData = () => {
    setSettingsState(getBusinessSettings());
    setCustomersState(getCustomers());
    setOrdersState(getOrders());
    setSelectedOrder(null);
  };

  const handleRefreshUsers = () => {
    const updated = getUsers();
    setUsersState(updated);
    const session = getAuthSession();
    if (session) {
      setAuthSession(session);
      setUserState(session);
    } else {
      const freshCur = getCurrentUser();
      setUserState(freshCur);
    }
  };

  const handleLoginAttempt = (email: string, pass: string, rememberMe?: boolean) => {
    const res = loginUser(email, pass, rememberMe);
    if (res.success && res.user) {
      setAuthSession(res.user);
      setUserState(res.user);
    }
    return res;
  };

  const handleLogout = () => {
    logoutUser();
    setAuthSession(null);
  };

  const handleRoleChange = (role: UserRole) => {
    if (role === 'owner' && currentUser.role !== 'owner') {
      setIsOwnerPasswordModalOpen(true);
    } else {
      applyRoleChange(role);
    }
  };

  const applyRoleChange = (role: UserRole) => {
    const allUsers = getUsers();
    const matched = allUsers.find((u) => u.role === role) || { ...currentUser, role };
    setCurrentUser(matched);
    setUserState(matched);
  };

  const handleOwnerPasswordSuccess = () => {
    setIsOwnerPasswordModalOpen(false);
    applyRoleChange('owner');
  };

  const handleProductionStageChange = (orderId: string, newStage: ProductionStage) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    const updatedOrder: Order = {
      ...targetOrder,
      productionStage: newStage,
      status:
        newStage === 'Selesai'
          ? 'Selesai'
          : targetOrder.status,
      updatedAt: new Date().toISOString(),
    };

    handleSaveOrder(updatedOrder);
  };



  if (!authSession) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setAuthSession(user);
          setUserState(user);
        }}
        onLoginAttempt={handleLoginAttempt}
        users={users}
        settings={settings}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 ${isDarkMode ? 'dark' : ''}`}>
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenNewOrder={handleOpenNewOrder}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        onThemeChange={handleThemeChange}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        onLogout={handleLogout}
        businessName={settings.name}
        logoUrl={settings.logoUrl}
      />
      <div className="flex pt-16">
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSelectedOrder(null);
            setIsSidebarOpen(false);
          }}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          userRole={currentUser.role}
          unpaidCount={orders.filter(o => o.paymentStatus !== 'Lunas').length}
          businessName={settings.name}
          logoUrl={settings.logoUrl}
          isLicensed={isLicensed}
          ordersCount={orders.length}
          onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
          isBackupDue={currentUser.role === 'owner' && getBackupReminderStatus(settings).isDue}
        />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden">
          {/* Backup Reminder Banner (For Admin / Owner) */}
          {currentUser.role !== 'produksi' && (
            <BackupReminderBanner
              settings={settings}
              status={getBackupReminderStatus(settings)}
              onOpenSettings={() => {
                setActiveTab('settings');
                setSelectedOrder(null);
              }}
              onBackupSuccess={() => {
                setSettingsState(getBusinessSettings());
              }}
            />
          )}

          {selectedOrder ? (
            <OrderDetailView
              order={selectedOrder}
              settings={settings}
              userRole={currentUser.role}
              onUpdateOrder={handleSaveOrder}
              onDeleteOrder={handleDeleteOrder}
              onBack={() => setSelectedOrder(null)}
              onOpenWA={(order, type) => {
                setWaModalOrder(order);
                setWaModalType(type);
              }}
              onPrintNota={(order) => setPrintModalConfig({ order, mode: 'invoice' })}
              onPrintSPK={(order) => setPrintModalConfig({ order, mode: 'spk' })}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  orders={orders}
                  expenses={expenses}
                  onOpenNewOrder={handleOpenNewOrder}
                  onOpenCustomers={() => setActiveTab('customers')}
                  onOpenProduction={() => setActiveTab('production')}
                  onOpenExpenses={() => setActiveTab('expenses')}
                  onSelectOrder={setSelectedOrder}
                  userRole={currentUser.role}
                  onOpenWA={(order, type) => {
                    setWaModalOrder(order);
                    setWaModalType(type);
                  }}
                  onPrintNota={(order) => setPrintModalConfig({ order, mode: 'invoice' })}
                  onPrintSPK={(order) => setPrintModalConfig({ order, mode: 'spk' })}
                />
              )}
              {activeTab === 'orders' && (
                <OrderListView
                  orders={orders}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectOrder={setSelectedOrder}
                  onOpenNewOrder={handleOpenNewOrder}
                  onOpenWA={(order, type) => {
                    setWaModalOrder(order);
                    setWaModalType(type);
                  }}
                  onPrintNota={(order) => setPrintModalConfig({ order, mode: 'invoice' })}
                  onPrintSPK={(order) => setPrintModalConfig({ order, mode: 'spk' })}
                  onDeleteOrder={handleDeleteOrder}
                />
              )}
              {activeTab === 'production' && (
                <ProductionBoard
                  orders={orders}
                  onStageChange={handleProductionStageChange}
                  onUpdateStage={handleProductionStageChange}
                  onSelectOrder={setSelectedOrder}
                  onPrintSPK={(order) => setPrintModalConfig({ order, mode: 'spk' })}
                  userRole={currentUser.role}
                />
              )}
              {activeTab === 'customers' && (
                <CustomerListView
                  customers={customers}
                  orders={orders}
                  onSaveCustomer={handleSaveCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onSelectOrder={setSelectedOrder}
                />
              )}
              {activeTab === 'expenses' && (
                <ExpensesView
                  expenses={expenses}
                  orders={orders}
                  currentUser={currentUser}
                  userRole={currentUser.role}
                  onSaveExpense={handleSaveExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}
              {activeTab === 'pricelist' && (
                <PriceListView 
                  priceList={priceList} 
                  onSaveItem={handleSavePriceItem} 
                  onDeleteItem={handleDeletePriceItem} 
                  userRole={currentUser.role} 
                />
              )}
              {activeTab === 'reports' && (
                <ReportsView
                  orders={orders}
                  expenses={expenses}
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onNavigateExpenses={() => setActiveTab('expenses')}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsView
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onResetData={() => {
                    handleRefreshAllData();
                    window.location.reload();
                  }}
                  userRole={currentUser.role}
                  isLicensed={isLicensed}
                  onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
                  onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
                  theme={theme}
                  onThemeChange={handleThemeChange}
                />
              )}
            </>
          )}
        </main>
      </div>

      {isNewOrderModalOpen && (
        <OrderFormModal
          isOpen={isNewOrderModalOpen}
          onClose={() => setIsNewOrderModalOpen(false)}
          onSaveOrder={handleSaveOrder}
          onSave={handleSaveOrder}
          existingOrdersCount={orders.length}
          salesAdminName={currentUser.name}
          userRole={currentUser.role}
          customers={customers}
          priceList={priceList}
        />
      )}

      {waModalOrder && (
        <WhatsAppModal
          isOpen={true}
          onClose={() => setWaModalOrder(null)}
          order={waModalOrder}
          type={waModalType}
          settings={settings}
        />
      )}

      {printModalConfig && (
        <PrintInvoiceModal
          isOpen={true}
          onClose={() => setPrintModalConfig(null)}
          order={printModalConfig.order}
          settings={settings}
          mode={printModalConfig.mode}
        />
      )}

      <OwnerPasswordModal
        isOpen={isOwnerPasswordModalOpen}
        onClose={() => setIsOwnerPasswordModalOpen(false)}
        onSuccess={handleOwnerPasswordSuccess}
      />

      {isUserManagementModalOpen && (
        <UserManagementModal
          isOpen={isUserManagementModalOpen}
          onClose={() => setIsUserManagementModalOpen(false)}
          users={users}
          currentUser={currentUser}
          onRefresh={handleRefreshUsers}
          onUsersUpdated={handleRefreshUsers}
        />
      )}

      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        onActivationSuccess={() => setIsLicensed(true)}
      />
    </div>
  );

}
