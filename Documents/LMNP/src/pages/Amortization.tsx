import { useState } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { useLMNPStore } from '../store/lmnpStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  computeBaseComponents,
  getProrataFirstYear,
  getComponentAmortForYear,
  getActivityStartYear,
  computeAdditionalAssetAmortForYear,
  computeTotalAmortForYear,
  computeCumulativeAmort,
} from '../utils/calculations';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

type TabId = 'decomposition' | 'annual' | 'additional' | 'multiyear';

export function Amortization() {
  const { property, additionalAssets, addAdditionalAsset, deleteAdditionalAsset, selectedYear, setSelectedYear } = useLMNPStore();
  const [activeTab, setActiveTab] = useState<TabId>('decomposition');
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [assetForm, setAssetForm] = useState<{
    name: string;
    amount: string;
    startDate: string;
    amortizationYears: string;
    category: 'travaux' | 'mobilier';
  }>({
    name: '',
    amount: '',
    startDate: new Date().toISOString().slice(0, 10),
    amortizationYears: '10',
    category: 'travaux',
  });

  const hasProperty = property.prixBien > 0 && property.activityStartDate;
  const startYear = hasProperty ? getActivityStartYear(property) : new Date().getFullYear();
  const prorata = hasProperty ? getProrataFirstYear(property) : 1;
  const components = hasProperty ? computeBaseComponents(property) : [];
  const terrainValue = hasProperty ? property.prixBien * (property.tauxTerrain / 100) : 0;

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = startYear; y <= currentYear + 1; y++) {
    yearOptions.push({ value: String(y), label: String(y) });
  }

  const multiYears: number[] = [];
  for (let y = startYear; y <= Math.min(startYear + 9, currentYear + 1); y++) {
    multiYears.push(y);
  }

  const handleAddAsset = () => {
    const amount = parseFloat(assetForm.amount.replace(',', '.'));
    if (!amount || !assetForm.name || !assetForm.startDate) return;
    addAdditionalAsset({
      id: generateId(),
      name: assetForm.name,
      amount,
      startDate: assetForm.startDate,
      amortizationYears: parseInt(assetForm.amortizationYears),
      category: assetForm.category,
    });
    setAssetForm({ name: '', amount: '', startDate: new Date().toISOString().slice(0, 10), amortizationYears: '10', category: 'travaux' });
    setShowAssetForm(false);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'decomposition', label: 'Décomposition initiale' },
    { id: 'annual', label: 'Tableau par année' },
    { id: 'additional', label: 'Travaux & Mobilier' },
    { id: 'multiyear', label: 'Vue multi-années' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amortissements</h1>
          <p className="text-sm text-gray-500 mt-1">Décomposition et suivi des amortissements</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {yearOptions.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab A: Décomposition initiale */}
      {activeTab === 'decomposition' && (
        <Card padding={false}>
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Décomposition des composants</h3>
            {hasProperty && (
              <p className="text-sm text-gray-500 mt-1">
                Début d'activité: {new Date(property.activityStartDate).toLocaleDateString('fr-FR')} —
                Prorata 1ère année: {formatNumber(prorata * 100, 1)}%
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Composant</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Base amortissable</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Durée</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Taux/an</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Amort/an (années pleines)</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Amort 1ère année</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-gray-50 italic">
                  <td className="py-3 px-4 text-gray-500">Terrain</td>
                  <td className="py-3 px-4 text-right text-gray-500">{formatCurrency(terrainValue)}</td>
                  <td className="py-3 px-4 text-right text-gray-400">—</td>
                  <td className="py-3 px-4 text-right text-gray-400">—</td>
                  <td className="py-3 px-4 text-right text-gray-400">Non amortissable</td>
                  <td className="py-3 px-4 text-right text-gray-400">—</td>
                </tr>
                {components.map((c, i) => {
                  const firstYearAmort = getComponentAmortForYear(c, startYear, prorata);
                  return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="py-3 px-4 font-medium text-gray-800">{c.label}</td>
                      <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(c.base)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{c.duree} ans</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(c.tauxAnnuel, 2)}%</td>
                      <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(c.amortAnnuel)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-700">{formatCurrency(firstYearAmort)}</td>
                    </tr>
                  );
                })}
                {/* Additional assets */}
                {additionalAssets.map((asset, i) => {
                  const assetStartMonth = new Date(asset.startDate).getMonth() + 1;
                  const assetProrata = (12 - assetStartMonth + 1) / 12;
                  const annualAmort = asset.amount / asset.amortizationYears;
                  const firstYearAmort = annualAmort * assetProrata;
                  return (
                    <tr key={`asset-${i}`} className={i % 2 === 0 ? 'bg-blue-50/30' : 'bg-blue-50/50'}>
                      <td className="py-3 px-4 font-medium text-blue-800">
                        {asset.name}
                        <span className="ml-2 text-xs text-blue-500">({asset.category})</span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(asset.amount)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{asset.amortizationYears} ans</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber((1 / asset.amortizationYears) * 100, 2)}%</td>
                      <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(annualAmort)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-700">{formatCurrency(firstYearAmort)}</td>
                    </tr>
                  );
                })}
                {/* Total */}
                <tr className="bg-indigo-50 font-bold border-t-2 border-indigo-200">
                  <td className="py-3 px-4 text-gray-800">TOTAL</td>
                  <td className="py-3 px-4 text-right text-gray-800">
                    {formatCurrency(components.reduce((s, c) => s + c.base, 0) + additionalAssets.reduce((s, a) => s + a.amount, 0))}
                  </td>
                  <td colSpan={2}></td>
                  <td className="py-3 px-4 text-right text-gray-800">
                    {formatCurrency(components.reduce((s, c) => s + c.amortAnnuel, 0) + additionalAssets.reduce((s, a) => s + a.amount / a.amortizationYears, 0))}
                  </td>
                  <td className="py-3 px-4 text-right text-indigo-700">
                    {formatCurrency(
                      components.reduce((s, c) => s + getComponentAmortForYear(c, startYear, prorata), 0) +
                      additionalAssets.reduce((s, a) => s + computeAdditionalAssetAmortForYear(a, startYear), 0)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab B: Annual table */}
      {activeTab === 'annual' && (
        <Card padding={false}>
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Détail amortissements — {selectedYear}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Composant</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Base</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Début</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Fin</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Amort année</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">Cumul</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-medium">VNC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {components.map((c, i) => {
                  let cumulAmort = 0;
                  for (let y = c.startYear; y <= selectedYear; y++) {
                    cumulAmort += getComponentAmortForYear(c, y, prorata);
                  }
                  const amortThisYear = getComponentAmortForYear(c, selectedYear, prorata);
                  const vnc = Math.max(0, c.base - cumulAmort);
                  return (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="py-3 px-4 font-medium text-gray-800">{c.label}</td>
                      <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(c.base)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{c.startYear}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{c.endYear}</td>
                      <td className="py-3 px-4 text-right font-semibold text-indigo-700">{formatCurrency(amortThisYear)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(cumulAmort)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-green-700">{formatCurrency(vnc)}</td>
                    </tr>
                  );
                })}
                {additionalAssets.map((asset, i) => {
                  let cumulAmort = 0;
                  const assetStartYear = new Date(asset.startDate).getFullYear();
                  for (let y = assetStartYear; y <= selectedYear; y++) {
                    cumulAmort += computeAdditionalAssetAmortForYear(asset, y);
                  }
                  const amortThisYear = computeAdditionalAssetAmortForYear(asset, selectedYear);
                  const vnc = Math.max(0, asset.amount - cumulAmort);
                  const endYear = assetStartYear + asset.amortizationYears - 1;
                  return (
                    <tr key={`a-${i}`} className="bg-blue-50/30">
                      <td className="py-3 px-4 font-medium text-blue-800">{asset.name}</td>
                      <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(asset.amount)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{assetStartYear}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{endYear}</td>
                      <td className="py-3 px-4 text-right font-semibold text-blue-700">{formatCurrency(amortThisYear)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(cumulAmort)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-green-700">{formatCurrency(vnc)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-indigo-50 font-bold border-t-2 border-indigo-200">
                  <td className="py-3 px-4 text-gray-800">TOTAL</td>
                  <td className="py-3 px-4 text-right text-gray-800">
                    {formatCurrency(components.reduce((s, c) => s + c.base, 0) + additionalAssets.reduce((s, a) => s + a.amount, 0))}
                  </td>
                  <td colSpan={2}></td>
                  <td className="py-3 px-4 text-right text-indigo-700">
                    {formatCurrency(computeTotalAmortForYear(property, additionalAssets, selectedYear))}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {formatCurrency(computeCumulativeAmort(property, additionalAssets, selectedYear))}
                  </td>
                  <td className="py-3 px-4 text-right text-green-700">
                    {formatCurrency(
                      Math.max(0,
                        components.reduce((s, c) => s + c.base, 0) +
                        additionalAssets.reduce((s, a) => s + a.amount, 0) -
                        computeCumulativeAmort(property, additionalAssets, selectedYear)
                      )
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab C: Additional assets */}
      {activeTab === 'additional' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAssetForm(true)} icon={<Plus size={16} />}>
              Ajouter un actif
            </Button>
          </div>

          {showAssetForm && (
            <Card>
              <CardHeader title="Ajouter un actif (travaux / mobilier)" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Nom *"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Cuisine équipée"
                />
                <Input
                  label="Montant (€) *"
                  type="number"
                  min={0}
                  suffix="€"
                  value={assetForm.amount}
                  onChange={(e) => setAssetForm((f) => ({ ...f, amount: e.target.value }))}
                />
                <Input
                  label="Date d'acquisition *"
                  type="date"
                  value={assetForm.startDate}
                  onChange={(e) => setAssetForm((f) => ({ ...f, startDate: e.target.value }))}
                />
                <Input
                  label="Durée d'amortissement (ans)"
                  type="number"
                  min={1}
                  suffix="ans"
                  value={assetForm.amortizationYears}
                  onChange={(e) => setAssetForm((f) => ({ ...f, amortizationYears: e.target.value }))}
                />
                <Select
                  label="Catégorie"
                  value={assetForm.category}
                  onChange={(e) => setAssetForm((f) => ({ ...f, category: e.target.value as 'travaux' | 'mobilier' }))}
                  options={[
                    { value: 'travaux', label: 'Travaux' },
                    { value: 'mobilier', label: 'Mobilier' },
                  ]}
                />
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={handleAddAsset} icon={<Check size={16} />}>Ajouter</Button>
                <Button variant="secondary" onClick={() => setShowAssetForm(false)} icon={<X size={16} />}>Annuler</Button>
              </div>
            </Card>
          )}

          <Card padding={false}>
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Actifs additionnels ({additionalAssets.length})</h3>
            </div>
            {additionalAssets.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Aucun actif additionnel enregistré</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Nom</th>
                      <th className="text-left py-3 px-4 text-gray-600 font-medium">Catégorie</th>
                      <th className="text-right py-3 px-4 text-gray-600 font-medium">Montant</th>
                      <th className="text-right py-3 px-4 text-gray-600 font-medium">Date début</th>
                      <th className="text-right py-3 px-4 text-gray-600 font-medium">Durée</th>
                      <th className="text-right py-3 px-4 text-gray-600 font-medium">Amort/an</th>
                      <th className="text-right py-3 px-4 text-gray-600 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {additionalAssets.map((asset, i) => (
                      <tr key={asset.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="py-3 px-4 font-medium text-gray-900">{asset.name}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.category === 'travaux' ? 'bg-orange-50 text-orange-700' : 'bg-purple-50 text-purple-700'}`}>
                            {asset.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(asset.amount)}</td>
                        <td className="py-3 px-4 text-right text-gray-700">
                          {new Date(asset.startDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-700">{asset.amortizationYears} ans</td>
                        <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                          {formatCurrency(asset.amount / asset.amortizationYears)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => deleteAdditionalAsset(asset.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab D: Multi-year */}
      {activeTab === 'multiyear' && (
        <Card padding={false}>
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Vue multi-années</h3>
            <p className="text-sm text-gray-500">Amortissements annuels par composant</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium sticky left-0 bg-gray-50 min-w-32">Composant</th>
                  {multiYears.map((y) => (
                    <th key={y} className={`text-right py-2 px-3 text-gray-600 font-medium whitespace-nowrap ${y === selectedYear ? 'bg-indigo-50 text-indigo-700' : ''}`}>
                      {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {components.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="py-2 px-3 font-medium text-gray-700 sticky left-0 bg-inherit">{c.label}</td>
                    {multiYears.map((y) => {
                      const amt = getComponentAmortForYear(c, y, prorata);
                      return (
                        <td key={y} className={`py-2 px-3 text-right text-gray-900 ${y === selectedYear ? 'bg-indigo-50 font-semibold text-indigo-700' : ''}`}>
                          {amt > 0 ? formatCurrency(amt) : <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {additionalAssets.map((asset, i) => (
                  <tr key={`a${i}`} className="bg-blue-50/30">
                    <td className="py-2 px-3 font-medium text-blue-700 sticky left-0 bg-blue-50/30">{asset.name}</td>
                    {multiYears.map((y) => {
                      const amt = computeAdditionalAssetAmortForYear(asset, y);
                      return (
                        <td key={y} className={`py-2 px-3 text-right text-gray-900 ${y === selectedYear ? 'bg-indigo-50 font-semibold text-indigo-700' : ''}`}>
                          {amt > 0 ? formatCurrency(amt) : <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="bg-indigo-50 font-bold border-t-2 border-indigo-200">
                  <td className="py-2 px-3 text-gray-800 sticky left-0 bg-indigo-50">TOTAL</td>
                  {multiYears.map((y) => (
                    <td key={y} className={`py-2 px-3 text-right text-indigo-700 ${y === selectedYear ? 'underline' : ''}`}>
                      {formatCurrency(computeTotalAmortForYear(property, additionalAssets, y))}
                    </td>
                  ))}
                </tr>
                <tr className="bg-green-50/50">
                  <td className="py-2 px-3 text-gray-700 font-medium sticky left-0 bg-green-50/50">Cumul amort</td>
                  {multiYears.map((y) => (
                    <td key={y} className="py-2 px-3 text-right text-gray-700">
                      {formatCurrency(computeCumulativeAmort(property, additionalAssets, y))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
