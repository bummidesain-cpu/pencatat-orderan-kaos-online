const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Also remove `const isApprovalPath...`
content = content.replace(/  \/\/ Check URL pathname for Public Customer Approval Token\n  const pathname = window\.location\.pathname;\n  const isApprovalPath = pathname\.startsWith\('\/approval\/'\);\n  const approvalToken = isApprovalPath \? pathname\.replace\('\/approval\/', ''\) : null;\n/g, '');

const inject = `

  if (!authSession) {
    return <LoginView onLogin={handleLoginAttempt} />;
  }

  return (
    <div className={\`min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 \${theme === 'dark' ? 'dark' : ''}\`}>
      <Navbar
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        onToggleTheme={handleThemeChange}
        onOpenUserManagement={() => setIsUserManagementModalOpen(true)}
        onLogout={handleLogout}
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
          onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser}
        />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-x-hidden">
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
                  onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
                  onSelectOrder={setSelectedOrder}
                  userRole={currentUser.role}
                />
              )}
              {activeTab === 'orders' && (
                <OrderListView
                  orders={orders}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectOrder={setSelectedOrder}
                  onOpenNewOrder={() => setIsNewOrderModalOpen(true)}
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
                  onSelectOrder={setSelectedOrder}
                  userRole={currentUser.role}
                />
              )}
              {activeTab === 'customers' && (
                <CustomerListView
                  customers={customers}
                  onSaveCustomer={handleSaveCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  userRole={currentUser.role}
                />
              )}
              {activeTab === 'expenses' && (
                <ExpensesView
                  expenses={expenses}
                  onSaveExpense={handleSaveExpense}
                  onDeleteExpense={handleDeleteExpense}
                  userRole={currentUser.role}
                />
              )}
              {activeTab === 'pricelist' && (
                <PriceListView 
                  items={priceList} 
                  onSaveItem={handleSavePriceItem} 
                  onDeleteItem={handleDeletePriceItem} 
                  userRole={currentUser.role} 
                />
              )}
              {activeTab === 'reports' && (
                <ReportsView orders={orders} expenses={expenses} />
              )}
              {activeTab === 'settings' && (
                <SettingsView
                  settings={settings}
                  onSave={handleSaveSettings}
                  onResetData={() => {
                    handleRefreshAllData();
                    window.location.reload();
                  }}
                  userRole={currentUser.role}
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
          onSave={handleSaveOrder}
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
        />
      )}
    </div>
  );
`;

content = content.replace(/  const handleProductionStageChange =[\s\S]*?    handleSaveOrder\(updatedOrder\);\n  \};\n\n\}/, '  const handleProductionStageChange = (orderId: string, newStage: ProductionStage) => {\n    const targetOrder = orders.find((o) => o.id === orderId);\n    if (!targetOrder) return;\n\n    const updatedOrder: Order = {\n      ...targetOrder,\n      productionStage: newStage,\n      status:\n        newStage === \'Diambil/Dikirim\' || newStage === \'Selesai\'\n          ? \'Selesai\'\n          : targetOrder.status,\n      updatedAt: new Date().toISOString(),\n    };\n\n    handleSaveOrder(updatedOrder);\n  };\n\n' + inject + '\n}');

fs.writeFileSync('src/App.tsx', content);

