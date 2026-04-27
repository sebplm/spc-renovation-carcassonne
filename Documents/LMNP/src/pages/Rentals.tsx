import { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useLMNPStore } from '../store/lmnpStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { formatCurrency, MONTH_NAMES_FR } from '../utils/formatters';
import type { RentalEntry } from '../types';
import { getActivityStartYear } from '../utils/calculations';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function Rentals() {
  const { rentals, addRental, updateRental, deleteRental, selectedYear, setSelectedYear, property } = useLMNPStore();

  const startYear = property.activityStartDate ? getActivityStartYear(property) : new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = startYear; y <= currentYear + 1; y++) years.push(y);

  const [mode, setMode] = useState<'annual' | 'monthly'>('monthly');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    year: selectedYear,
    month: 1,
    amount: '',
    description: '',
  });

  const yearRentals = rentals.filter((r) => r.year === selectedYear);
  const totalLoyers = yearRentals.reduce((sum, r) => sum + r.amount, 0);

  const resetForm = () => {
    setForm({ year: selectedYear, month: 1, amount: '', description: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    const amount = parseFloat(form.amount.replace(',', '.'));
    if (!amount || amount <= 0) return;

    if (editingId) {
      updateRental(editingId, {
        year: form.year,
        month: mode === 'monthly' ? form.month : 0,
        amount,
        description: form.description || undefined,
      });
    } else {
      addRental({
        id: generateId(),
        year: form.year,
        month: mode === 'monthly' ? form.month : 0,
        amount,
        description: form.description || undefined,
      });
    }
    resetForm();
  };

  const startEdit = (entry: RentalEntry) => {
    setEditingId(entry.id);
    setForm({
      year: entry.year,
      month: entry.month,
      amount: entry.amount.toString(),
      description: entry.description || '',
    });
    setMode(entry.month === 0 ? 'annual' : 'monthly');
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Loyers</h1>
          <p className="text-sm text-gray-500 mt-1">Recettes locatives annuelles</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(Number(e.target.value)); resetForm(); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ year: selectedYear, month: 1, amount: '', description: '' }); }} icon={<Plus size={16} />}>
            Ajouter
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="sm:col-span-1">
          <p className="text-sm text-gray-500">Total loyers {selectedYear}</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">{formatCurrency(totalLoyers)}</p>
          <p className="text-xs text-gray-400 mt-1">{yearRentals.length} entrée(s)</p>
        </Card>
        <Card className="sm:col-span-2">
          <p className="text-sm text-gray-500 mb-2">Mensualités (mode saisie mensuelle)</p>
          <div className="grid grid-cols-6 gap-1">
            {MONTH_NAMES_FR.map((m, i) => {
              const monthEntries = yearRentals.filter((r) => r.month === i + 1);
              const total = monthEntries.reduce((s, r) => s + r.amount, 0);
              return (
                <div key={i} className={`rounded p-1.5 text-center ${total > 0 ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-500 truncate">{m.slice(0, 3)}</p>
                  <p className={`text-xs font-semibold ${total > 0 ? 'text-indigo-700' : 'text-gray-400'}`}>
                    {total > 0 ? `${(total / 1000).toFixed(1)}k` : '—'}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader title={editingId ? 'Modifier une entrée' : 'Ajouter des loyers'} />
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMode('monthly')}
                className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${mode === 'monthly' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Par mois
              </button>
              <button
                type="button"
                onClick={() => setMode('annual')}
                className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${mode === 'annual' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                Annuel global
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {mode === 'monthly' && (
                <Select
                  label="Mois"
                  value={String(form.month)}
                  onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                  options={MONTH_NAMES_FR.map((m, i) => ({ value: String(i + 1), label: m }))}
                />
              )}
              <Input
                label="Montant (€)"
                suffix="€"
                type="number"
                min={0}
                step={0.01}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="1 200,00"
              />
              <Input
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Loyer mensuel (optionnel)"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSubmit} icon={<Check size={16} />}>
                {editingId ? 'Mettre à jour' : 'Ajouter'}
              </Button>
              <Button variant="secondary" onClick={resetForm} icon={<X size={16} />}>
                Annuler
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Entries table */}
      <Card padding={false}>
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Entrées {selectedYear}</h3>
        </div>
        {yearRentals.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p>Aucun loyer enregistré pour {selectedYear}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Période</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Description</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Montant</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {yearRentals
                  .sort((a, b) => a.month - b.month)
                  .map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {entry.month === 0 ? `${entry.year} (annuel)` : `${MONTH_NAMES_FR[entry.month - 1]} ${entry.year}`}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{entry.description || '—'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                        {formatCurrency(entry.amount)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(entry)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteRental(entry.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-indigo-50 border-t border-indigo-200">
                <tr>
                  <td className="py-3 px-4 font-bold text-gray-900" colSpan={2}>Total {selectedYear}</td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-700">{formatCurrency(totalLoyers)}</td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
