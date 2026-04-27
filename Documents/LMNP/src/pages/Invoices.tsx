import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Filter } from 'lucide-react';
import { useLMNPStore } from '../store/lmnpStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { formatCurrency } from '../utils/formatters';
import type { Invoice, InvoiceCategory } from '../types';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface CategoryMeta {
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
}

const CATEGORY_META: Record<InvoiceCategory, CategoryMeta> = {
  electricite: { label: 'Électricité', color: 'text-yellow-700', bgColor: 'bg-yellow-50', emoji: '⚡' },
  travaux_entretien: { label: 'Travaux entretien', color: 'text-orange-700', bgColor: 'bg-orange-50', emoji: '🔨' },
  mobilier: { label: 'Mobilier', color: 'text-purple-700', bgColor: 'bg-purple-50', emoji: '🪑' },
  plomberie: { label: 'Plomberie', color: 'text-blue-700', bgColor: 'bg-blue-50', emoji: '🚿' },
  toiture: { label: 'Toiture', color: 'text-red-700', bgColor: 'bg-red-50', emoji: '🏠' },
  agence_gestion: { label: 'Agence gestion', color: 'text-teal-700', bgColor: 'bg-teal-50', emoji: '🏢' },
  assurance: { label: 'Assurance', color: 'text-cyan-700', bgColor: 'bg-cyan-50', emoji: '🛡️' },
  taxe_fonciere: { label: 'Taxe foncière', color: 'text-indigo-700', bgColor: 'bg-indigo-50', emoji: '📋' },
  cfe: { label: 'CFE', color: 'text-indigo-700', bgColor: 'bg-indigo-50', emoji: '📋' },
  interets_emprunt: { label: "Intérêts d'emprunt", color: 'text-green-700', bgColor: 'bg-green-50', emoji: '💰' },
  frais_comptable: { label: 'Frais comptable', color: 'text-gray-700', bgColor: 'bg-gray-50', emoji: '📊' },
  syndic: { label: 'Syndic', color: 'text-pink-700', bgColor: 'bg-pink-50', emoji: '🏘️' },
  autres_charges: { label: 'Autres charges', color: 'text-gray-700', bgColor: 'bg-gray-100', emoji: '📁' },
};

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_META) as InvoiceCategory[]).map((k) => ({
  value: k,
  label: `${CATEGORY_META[k].emoji} ${CATEGORY_META[k].label}`,
}));

const ALL_CATEGORIES_OPTION = [{ value: 'all', label: 'Toutes les catégories' }, ...CATEGORY_OPTIONS];

interface InvoiceFormState {
  date: string;
  description: string;
  amount: string;
  category: InvoiceCategory;
  isCapex: boolean;
  amortizationYears: string;
}

const defaultFormState: InvoiceFormState = {
  date: new Date().toISOString().slice(0, 10),
  description: '',
  amount: '',
  category: 'autres_charges',
  isCapex: false,
  amortizationYears: '5',
};

export function Invoices() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice, selectedYear } = useLMNPStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InvoiceFormState>(defaultFormState);
  const [filterYear, setFilterYear] = useState<string>(String(selectedYear));
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'charges' | 'capex'>('all');

  const currentYear = new Date().getFullYear();
  const yearSet = new Set(invoices.map((inv) => new Date(inv.date).getFullYear()));
  yearSet.add(currentYear);
  const years = Array.from(yearSet).sort((a, b) => b - a);
  const yearOptions = [{ value: 'all', label: 'Toutes les années' }, ...years.map((y) => ({ value: String(y), label: String(y) }))];

  const filteredInvoices = invoices.filter((inv) => {
    const invYear = new Date(inv.date).getFullYear();
    if (filterYear !== 'all' && invYear !== Number(filterYear)) return false;
    if (filterCategory !== 'all' && inv.category !== filterCategory) return false;
    if (filterType === 'charges' && inv.isCapex) return false;
    if (filterType === 'capex' && !inv.isCapex) return false;
    return true;
  });

  const sortedInvoices = [...filteredInvoices].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const totalCharges = filteredInvoices.filter((i) => !i.isCapex).reduce((s, i) => s + i.amount, 0);
  const totalCapex = filteredInvoices.filter((i) => i.isCapex).reduce((s, i) => s + i.amount, 0);

  const byCategory: Record<string, number> = {};
  filteredInvoices.forEach((inv) => {
    byCategory[inv.category] = (byCategory[inv.category] || 0) + inv.amount;
  });

  const resetForm = () => {
    setForm(defaultFormState);
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    const amount = parseFloat(form.amount.replace(',', '.'));
    if (!amount || !form.date || !form.description) return;

    const data: Omit<Invoice, 'id'> = {
      date: form.date,
      description: form.description,
      amount,
      category: form.category,
      isCapex: form.isCapex,
      amortizationYears: form.isCapex ? parseInt(form.amortizationYears) : undefined,
    };

    if (editingId) {
      updateInvoice(editingId, data);
    } else {
      addInvoice({ id: generateId(), ...data });
    }
    resetForm();
  };

  const startEdit = (inv: Invoice) => {
    setEditingId(inv.id);
    setForm({
      date: inv.date,
      description: inv.description,
      amount: inv.amount.toString(),
      category: inv.category,
      isCapex: inv.isCapex,
      amortizationYears: String(inv.amortizationYears || 5),
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Factures & Charges</h1>
          <p className="text-sm text-gray-500 mt-1">Toutes les dépenses liées au bien</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditingId(null); setForm(defaultFormState); }} icon={<Plus size={16} />}>
          Ajouter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Charges (déductibles)</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalCharges)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Immobilisations (CAPEX)</p>
          <p className="text-2xl font-bold text-indigo-700 mt-1">{formatCurrency(totalCapex)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalCharges + totalCapex)}</p>
          <p className="text-xs text-gray-400 mt-1">{filteredInvoices.length} facture(s)</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <Filter size={16} className="text-gray-500" />
          <Select
            options={yearOptions}
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-44"
          />
          <Select
            options={ALL_CATEGORIES_OPTION}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-56"
          />
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            {(['all', 'charges', 'capex'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${filterType === t ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                {t === 'all' ? 'Tous' : t === 'charges' ? 'Charges' : 'CAPEX'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader title={editingId ? 'Modifier la facture' : 'Nouvelle facture'} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            <Input
              label="Description *"
              placeholder="Ex: Facture EDF janvier"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Input
              label="Montant (€) *"
              type="number"
              min={0}
              step={0.01}
              suffix="€"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <Select
              label="Catégorie"
              options={CATEGORY_OPTIONS}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as InvoiceCategory }))}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <div className="flex gap-3 mt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!form.isCapex}
                    onChange={() => setForm((f) => ({ ...f, isCapex: false }))}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">Charge (déductible)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.isCapex}
                    onChange={() => setForm((f) => ({ ...f, isCapex: true }))}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-gray-700">CAPEX (immobilisation)</span>
                </label>
              </div>
            </div>
            {form.isCapex && (
              <Input
                label="Durée d'amortissement (ans)"
                type="number"
                min={1}
                suffix="ans"
                value={form.amortizationYears}
                onChange={(e) => setForm((f) => ({ ...f, amortizationYears: e.target.value }))}
              />
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleSubmit} icon={<Check size={16} />}>
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </Button>
            <Button variant="secondary" onClick={resetForm} icon={<X size={16} />}>Annuler</Button>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card padding={false}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Liste des factures</h3>
          <span className="text-sm text-gray-500">{sortedInvoices.length} entrée(s)</span>
        </div>
        {sortedInvoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Aucune facture trouvée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Catégorie</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Type</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Montant</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedInvoices.map((inv, i) => {
                  const meta = CATEGORY_META[inv.category];
                  return (
                    <tr key={inv.id} className={i % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100/50'}>
                      <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                        {new Date(inv.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 px-4 text-gray-900">{inv.description}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${meta.bgColor} ${meta.color}`}>
                          {meta.emoji} {meta.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {inv.isCapex ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                            CAPEX {inv.amortizationYears}ans
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            Charge
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-gray-900">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(inv)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteInvoice(inv.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-gray-700">Total</td>
                  <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(totalCharges + totalCapex)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* By category */}
      {Object.keys(byCategory).length > 0 && (
        <Card>
          <CardHeader title="Totaux par catégorie" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(Object.entries(byCategory) as [InvoiceCategory, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([cat, total]) => {
                const meta = CATEGORY_META[cat];
                return (
                  <div key={cat} className={`flex items-center justify-between p-3 rounded-lg ${meta.bgColor}`}>
                    <span className={`text-sm font-medium ${meta.color}`}>{meta.emoji} {meta.label}</span>
                    <span className={`text-sm font-bold ${meta.color}`}>{formatCurrency(total)}</span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}
    </div>
  );
}
