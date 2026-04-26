import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Banknote,
  Receipt,
  TrendingDown,
  FileText,
  Scale,
  FilePen,
  Menu,
  X,
  Home,
} from 'lucide-react';

type PageId =
  | 'dashboard'
  | 'property'
  | 'rentals'
  | 'invoices'
  | 'amortization'
  | 'income'
  | 'balance'
  | 'taxforms';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} /> },
  { id: 'property', label: 'Bien immobilier', icon: <Building2 size={18} /> },
  { id: 'rentals', label: 'Loyers', icon: <Banknote size={18} /> },
  { id: 'invoices', label: 'Factures', icon: <Receipt size={18} /> },
  { id: 'amortization', label: 'Amortissements', icon: <TrendingDown size={18} /> },
  { id: 'income', label: 'Compte de résultat', icon: <FileText size={18} /> },
  { id: 'balance', label: 'Bilan (2033-A)', icon: <Scale size={18} /> },
  { id: 'taxforms', label: 'Formulaires fiscaux', icon: <FilePen size={18} /> },
];

interface NavbarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (page: PageId) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-8 px-3">
          <div className="bg-indigo-600 rounded-lg p-1.5">
            <Home size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">LMNP Comptabilité</div>
            <div className="text-xs text-gray-500">Gestion fiscale</div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`nav-link ${currentPage === item.id ? 'nav-link-active' : 'nav-link-inactive'}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 px-3">LMNP — Régime réel simplifié</p>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 rounded-lg p-1.5">
            <Home size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900">LMNP Comptabilité</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex flex-col w-72 bg-white p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-6 px-3">
              <div className="bg-indigo-600 rounded-lg p-1.5">
                <Home size={18} className="text-white" />
              </div>
              <span className="text-sm font-bold text-gray-900">LMNP Comptabilité</span>
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`nav-link ${currentPage === item.id ? 'nav-link-active' : 'nav-link-inactive'}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

export type { PageId };
