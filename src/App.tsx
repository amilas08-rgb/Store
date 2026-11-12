/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { POSView } from './components/views/POSView';
import { SalesInvoicesView } from './components/views/SalesInvoicesView';
import { PurchaseInvoicesView } from './components/views/PurchaseInvoicesView';
import { ProductsView } from './components/views/ProductsView';
import { InventoryView } from './components/views/InventoryView';
import { SuppliersView } from './components/views/SuppliersView';
import { CustomersView } from './components/views/CustomersView';
import { CashSessionsView } from './components/views/CashSessionsView';
import { BankAccountsView } from './components/views/BankAccountsView';
import { ExpensesView } from './components/views/ExpensesView';
import { ProfitsView } from './components/views/ProfitsView';
import { ReturnsView } from './components/views/ReturnsView';
import { ReportsView } from './components/views/ReportsView';
import { UsersRolesView } from './components/views/UsersRolesView';
import { StoreSettingsView } from './components/views/StoreSettingsView';
import { DatabaseConnectionView } from './components/views/DatabaseConnectionView';
import { BackupRestoreView } from './components/views/BackupRestoreView';
import { AuditLogsView } from './components/views/AuditLogsView';

const StoreFlowApp: React.FC = () => {
  const { activeView, setActiveView, isAuthenticated, theme } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global hotkeys for quick cashier & manager navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveView('dashboard');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveView('pos');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveView('products');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView]);

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'pos':
        return <POSView />;
      case 'sales':
        return <SalesInvoicesView />;
      case 'purchases':
        return <PurchaseInvoicesView />;
      case 'products':
        return <ProductsView />;
      case 'inventory':
        return <InventoryView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'customers':
        return <CustomersView />;
      case 'cash':
        return <CashSessionsView />;
      case 'banks':
        return <BankAccountsView />;
      case 'expenses':
        return <ExpensesView />;
      case 'profits':
        return <ProfitsView />;
      case 'returns':
        return <ReturnsView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UsersRolesView />;
      case 'settings':
        return <StoreSettingsView />;
      case 'database':
        return <DatabaseConnectionView />;
      case 'backup':
        return <BackupRestoreView />;
      case 'audit':
        return <AuditLogsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      <Header onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <StoreFlowApp />
    </StoreProvider>
  );
}
