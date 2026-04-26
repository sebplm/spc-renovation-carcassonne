import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts';
import { Building2, TrendingDown, FileText, AlertCircle } from 'lucide-react';
import { useLMNPStore } from '../store/lmnpStore';
import { Card, CardHeader } from '../components/ui/Card';
import { formatCurrency } from '../utils/formatters';
import {
  computeAllYears,
  computeCumulativeAmort,
  getTotalBrutImmobilisations,
  getActivityStartYear,
} from '../utils/calculations';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">{icon}</div>
      </div>
    </Card>
  );
}

export function Dashboard() {
  const { property, invoices, additionalAssets, rentals, selectedYear, setSelectedYear } = useLMNPStore();

  const hasProperty = property.prixBien > 0 && property.activityStartDate;

  if (!hasProperty) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="bg-indigo-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Building2 size={28} className="text-indigo-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bienvenue dans LMNP Comptabilité</h2>
        <p className="text-gray-500 mb-6">
          Commencez par saisir les informations de votre bien immobilier pour utiliser toutes les fonctionnalités.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
          <div className="flex gap-2 text-amber-800">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              Rendez-vous dans l'onglet <strong>Bien immobilier</strong> pour saisir les données d'acquisition.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const startYear = getActivityStartYear(property);
  const allResults = computeAllYears(selectedYear, property, invoices, additionalAssets, rentals);
  const currentResult = allResults.find((r) => r.year === selectedYear);

  // Last 5 years chart data
  const chartYears: number[] = [];
  for (let y = Math.max(startYear, selectedYear - 4); y <= selectedYear; y++) {
    chartYears.push(y);
  }

  const allResultsForChart = computeAllYears(selectedYear, property, invoices, additionalAssets, rentals);

  const barData = chartYears.map((y) => {
    const r = allResultsForChart.find((r) => r.year === y);
    return {
      year: y.toString(),
      Loyers: r ? Math.round(r.loyers) : 0,
      Charges: r ? Math.round(r.totalChargesHorsAmort) : 0,
      Amortissements: r ? Math.round(r.dotationAmortissement) : 0,
    };
  });

  // Cumulative amort line chart
  const lineData = chartYears.map((y) => {
    const cumul = computeCumulativeAmort(property, additionalAssets, y);
    const totalBrut = getTotalBrutImmobilisations(property, additionalAssets);
    return {
      year: y.toString(),
      'Amort cumulé': Math.round(cumul),
      'VNC': Math.round(Math.max(0, totalBrut - cumul)),
    };
  });

  const totalBrut = getTotalBrutImmobilisations(property, additionalAssets);
  const cumulAmort = computeCumulativeAmort(property, additionalAssets, selectedYear);
  const vnc = Math.max(0, totalBrut - cumulAmort);
  const resultatFiscal = currentResult?.resultatFiscalFinal ?? 0;
  const deficitsReportables = currentResult?.deficitsAReporter ?? 0;

  const availableYears: number[] = [];
  for (let y = startYear; y <= new Date().getFullYear() + 1; y++) {
    availableYears.push(y);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">{property.name} — {property.address}</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Valeur brute du bien"
          value={formatCurrency(totalBrut)}
          icon={<Building2 size={20} />}
          color="text-gray-900"
          subtitle={`VNC: ${formatCurrency(vnc)}`}
        />
        <StatCard
          title="Amortissements cumulés"
          value={formatCurrency(cumulAmort)}
          icon={<TrendingDown size={20} />}
          color="text-indigo-700"
          subtitle={`Exercice ${selectedYear}: ${formatCurrency(currentResult?.dotationAmortissement ?? 0)}`}
        />
        <StatCard
          title="Résultat fiscal"
          value={formatCurrency(resultatFiscal)}
          icon={<FileText size={20} />}
          color={resultatFiscal < 0 ? 'text-red-600' : resultatFiscal > 0 ? 'text-green-700' : 'text-gray-900'}
          subtitle={`Exercice ${selectedYear}`}
        />
        <StatCard
          title="Déficits reportables"
          value={formatCurrency(deficitsReportables)}
          icon={<AlertCircle size={20} />}
          color={deficitsReportables > 0 ? 'text-amber-600' : 'text-gray-500'}
          subtitle="Accumulés"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Loyers vs Charges vs Amortissements" subtitle="5 dernières années" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="Loyers" fill="#4F46E5" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Charges" fill="#F97316" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Amortissements" fill="#10B981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Valeur comptable nette (VNC)" subtitle="Évolution cumulée" />
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="Amort cumulé" stroke="#4F46E5" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="VNC" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Current year summary */}
      {currentResult && (
        <Card>
          <CardHeader title={`Résumé exercice ${selectedYear}`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-indigo-50">
                  <td className="py-2 px-3 font-medium text-gray-700">Loyers perçus</td>
                  <td className="py-2 px-3 text-right font-medium text-gray-900">{formatCurrency(currentResult.loyers)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-600">Charges déductibles</td>
                  <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(currentResult.chargesDeductibles)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-600">Taxes (foncière, CFE)</td>
                  <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(currentResult.taxes)}</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-600">Intérêts d'emprunt</td>
                  <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(currentResult.interetsEmprunt)}</td>
                </tr>
                <tr className="bg-gray-50 font-medium">
                  <td className="py-2 px-3 text-gray-700">Résultat avant amortissements</td>
                  <td className={`py-2 px-3 text-right ${currentResult.resultatAvantAmort < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(currentResult.resultatAvantAmort)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-gray-600">Dotation aux amortissements</td>
                  <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(currentResult.dotationAmortissement)}</td>
                </tr>
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-2 px-3 text-gray-700">Résultat fiscal final</td>
                  <td className={`py-2 px-3 text-right ${currentResult.resultatFiscalFinal < 0 ? 'text-red-600' : currentResult.resultatFiscalFinal > 0 ? 'text-green-700' : 'text-gray-900'}`}>
                    {formatCurrency(currentResult.resultatFiscalFinal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
