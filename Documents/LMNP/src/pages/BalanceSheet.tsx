import { useLMNPStore } from '../store/lmnpStore';
import { Card } from '../components/ui/Card';
import { formatCurrency } from '../utils/formatters';
import {
  computeAllYears,
  computeCumulativeAmort,
  getTotalBrutImmobilisations,
  computeCapitalRestantDu,
  getActivityStartYear,
} from '../utils/calculations';

function BSRow({
  label,
  value,
  indent = 0,
  bold = false,
  separator = false,
  color,
}: {
  label: string;
  value?: number;
  indent?: number;
  bold?: boolean;
  separator?: boolean;
  color?: string;
}) {
  return (
    <tr className={separator ? 'border-t border-gray-300' : ''}>
      <td
        className={`py-2 text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
        style={{ paddingLeft: `${1 + indent * 1.25}rem` }}
      >
        {label}
      </td>
      <td className={`py-2 text-sm text-right font-${bold ? 'semibold' : 'normal'} pr-4 min-w-36 ${color || (value !== undefined && value < 0 ? 'text-red-600' : 'text-gray-900')}`}>
        {value !== undefined ? formatCurrency(value) : ''}
      </td>
    </tr>
  );
}

export function BalanceSheet() {
  const { property, invoices, additionalAssets, rentals, selectedYear, setSelectedYear } = useLMNPStore();

  const startYear = property.activityStartDate ? getActivityStartYear(property) : new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = startYear; y <= currentYear + 1; y++) {
    yearOptions.push(y);
  }

  const allResults = computeAllYears(selectedYear, property, invoices, additionalAssets, rentals);
  const result = allResults.find((r) => r.year === selectedYear);

  const totalBrut = getTotalBrutImmobilisations(property, additionalAssets);
  const cumulAmort = computeCumulativeAmort(property, additionalAssets, selectedYear);
  const vnc = Math.max(0, totalBrut - cumulAmort);
  const capitalRestantDu = computeCapitalRestantDu(property, selectedYear);

  // Compute disponibilités (simplified: loyers - charges paid out during year)
  const disponibilites = result ? Math.max(0, result.loyers - result.totalChargesHorsAmort) : 0;

  const totalActif = vnc + disponibilites;

  // Passif
  const resultatExercice = result?.resultatFiscalFinal ?? 0;
  // Capital = total acquisition - emprunts
  const totalAcquisition = property.prixBien + property.fraisNotaire + property.fraisAgence + property.mobilierActe;
  const apportPersonnel = Math.max(0, totalAcquisition - property.montantEmprunt);
  const totalPassif = apportPersonnel + resultatExercice + capitalRestantDu;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bilan (2033-A)</h1>
          <p className="text-sm text-gray-500 mt-1">Exercice clos au 31/12/{selectedYear}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={() => window.print()}
            className="text-xs text-gray-500 hover:text-indigo-600 border border-gray-300 px-3 py-1.5 rounded-md hover:border-indigo-300 transition-colors no-print"
          >
            Imprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIF */}
        <Card padding={false}>
          <div className="p-4 border-b border-gray-200 bg-blue-50">
            <h3 className="font-bold text-blue-900">ACTIF</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium">Poste</th>
                <th className="text-right py-2 px-4 text-xs text-gray-500 font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2} className="pt-3 pb-1 px-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Actif immobilisé</span>
                </td>
              </tr>
              <BSRow label="Immobilisations corporelles (brut)" value={totalBrut} indent={1} />
              <BSRow label="Amortissements cumulés" value={-cumulAmort} indent={1} color="text-red-600" />
              <BSRow label="Valeur nette comptable (VNC)" value={vnc} bold separator color="text-indigo-700" />

              <tr>
                <td colSpan={2} className="pt-3 pb-1 px-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Actif circulant</span>
                </td>
              </tr>
              <BSRow label="Disponibilités (trésorerie estimée)" value={disponibilites} indent={1} />

              <BSRow label="TOTAL ACTIF" value={totalActif} bold separator color="text-blue-900" />
            </tbody>
          </table>
        </Card>

        {/* PASSIF */}
        <Card padding={false}>
          <div className="p-4 border-b border-gray-200 bg-green-50">
            <h3 className="font-bold text-green-900">PASSIF</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-4 text-xs text-gray-500 font-medium">Poste</th>
                <th className="text-right py-2 px-4 text-xs text-gray-500 font-medium">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2} className="pt-3 pb-1 px-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Capitaux propres</span>
                </td>
              </tr>
              <BSRow label="Apport personnel (capital)" value={apportPersonnel} indent={1} />
              <BSRow
                label="Résultat de l'exercice"
                value={resultatExercice}
                indent={1}
                color={resultatExercice < 0 ? 'text-red-600' : resultatExercice > 0 ? 'text-green-700' : 'text-gray-900'}
              />
              <BSRow label="Total capitaux propres" value={apportPersonnel + resultatExercice} bold separator />

              <tr>
                <td colSpan={2} className="pt-3 pb-1 px-4">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dettes</span>
                </td>
              </tr>
              <BSRow label="Emprunts et dettes financières" value={capitalRestantDu} indent={1} />
              <BSRow label="Capital restant dû au {selectedYear}/12/31" value={capitalRestantDu} indent={2} />

              <BSRow label="TOTAL PASSIF" value={totalPassif} bold separator color="text-green-900" />
            </tbody>
          </table>
        </Card>
      </div>

      {/* Equilibre */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Vérification de l'équilibre</h3>
            <p className="text-sm text-gray-500 mt-1">Le bilan doit être équilibré (Actif = Passif)</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Actif : <span className="font-semibold text-gray-900">{formatCurrency(totalActif)}</span></p>
            <p className="text-sm text-gray-500">Passif : <span className="font-semibold text-gray-900">{formatCurrency(totalPassif)}</span></p>
            <p className={`text-sm font-bold mt-1 ${Math.abs(totalActif - totalPassif) < 1 ? 'text-green-700' : 'text-amber-600'}`}>
              {Math.abs(totalActif - totalPassif) < 1 ? 'Bilan équilibré' : `Écart : ${formatCurrency(Math.abs(totalActif - totalPassif))}`}
            </p>
          </div>
        </div>
      </Card>

      {/* Key figures */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-gray-500">Valeur brute</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(totalBrut)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">VNC</p>
          <p className="text-lg font-bold text-indigo-700 mt-1">{formatCurrency(vnc)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Capital restant dû</p>
          <p className="text-lg font-bold text-red-600 mt-1">{formatCurrency(capitalRestantDu)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500">Résultat fiscal</p>
          <p className={`text-lg font-bold mt-1 ${resultatExercice < 0 ? 'text-red-600' : resultatExercice > 0 ? 'text-green-700' : 'text-gray-500'}`}>
            {formatCurrency(resultatExercice)}
          </p>
        </Card>
      </div>
    </div>
  );
}
