import { useState } from 'react';
import { Layout } from './components/Layout/Layout';
import type { PageId } from './components/Layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { PropertyForm } from './pages/PropertyForm';
import { Rentals } from './pages/Rentals';
import { Invoices } from './pages/Invoices';
import { Amortization } from './pages/Amortization';
import { IncomeStatement } from './pages/IncomeStatement';
import { BalanceSheet } from './pages/BalanceSheet';
import { TaxForms } from './pages/TaxForms';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'property':
        return <PropertyForm />;
      case 'rentals':
        return <Rentals />;
      case 'invoices':
        return <Invoices />;
      case 'amortization':
        return <Amortization />;
      case 'income':
        return <IncomeStatement />;
      case 'balance':
        return <BalanceSheet />;
      case 'taxforms':
        return <TaxForms />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}
