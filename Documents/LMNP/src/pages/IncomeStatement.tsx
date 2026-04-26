import { useLMNPStore } from '../store/lmnpStore';
import { Card } from '../components/ui/Card';
import { formatCurrency } from '../utils/formatters';
import { computeAllYears, getActivityStartYear } from '../utils/calculations';

function Row({
  label,
  value,
  indent = 0,
  bold = false,
  color,
  border = false,
  doubleBorder = false,
}: {
  label: string;
  value?: number;
  indent?: number;
  bold?: boolean;
  color?: 'positive' | 'negative' | 'neutral';
  border?: boolean;
  doubleBorder?: boolean;
}) {
  const valueColor =
    value === undefined
      ? ''
      : color === 'positive'
      ? 'text-green-700'
      : color === 'negative'
      ? 'text-red-600'
      : value < 0
      ? 'text-red-600'
      : 'text-gray-900';

  return (
    <tr className={`${border ? 'border-t border-gray-300' : ''} ${doubleBorder ? 'border-t-2 border-gray-400' : ''}`}>
      <td
        className={`py-1.5 text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
        style={{ paddingLeft: `${1 + indent * 1.25}rem` }}
      >
        {label}
      </td>
      <td className={`py-1.5 text-sm text-right font-${bold ? 'semibold' : 'normal'} ${valueColor} pr-4 min-w-32`}>
        {value !== undefined ? formatCurrency(value) : ''}
      </td>
    </tr>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td colSpan={2} className="pt-4 pb-1 text-xs font-bold text-gray-500 uppercase tracking-wider px-4">
        {title}
      </td>
    </tr>
  );
}

function Separator() {
  return (
    <tr>
      <td colSpan={2} className="py-0">
        <div className="border-t border-gray-300 mx-4" />
      </td>
    </tr>
  );
}

export function IncomeStatement() {
  const { property, invoices, additionalAssets, rentals, selectedYear, setSelectedYear } = useLMNPStore();

  const startYear = property.activityStartDate ? getActivityStartYear(property) : new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = startYear; y <= currentYear + 1; y++) {
    yearOptions.push(y);
  }

  const allResults = computeAllYears(selectedYear, property, invoices, additionalAssets, rentals);
  const result = allResults.find((r) => r.year === selectedYear);

  if (!result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Compte de résultat</h1>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <Card>
          <p className="text-gray-500 text-sm">Renseignez d'abord les informations du bien immobilier.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compte de résultat</h1>
          <p className="text-sm text-gray-500 mt-1">Exercice {selectedYear} — LMNP régime réel simplifié</p>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main P&L */}
        <Card className="xl:col-span-2" padding={false}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Compte de résultat {selectedYear}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{property.name}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="text-xs text-gray-500 hover:text-indigo-600 border border-gray-300 px-3 py-1.5 rounded-md hover:border-indigo-300 transition-colors no-print"
            >
              Imprimer
            </button>
          </div>

          <table className="w-full">
            <tbody>
              <SectionHeader title="Produits" />
              <Row label="Loyers (recettes locatives)" value={result.loyers} color="positive" />
              <Row label="Total produits d'exploitation" value={result.loyers} bold border color="positive" />

              <SectionHeader title="Charges d'exploitation" />
              <Row label="Charges déductibles (entretien, gestion, assurance, etc.)" value={result.chargesDeductibles} />
              <Row label="Taxes (taxe foncière, CFE)" value={result.taxes} />
              <Row label="Intérêts d'emprunt" value={result.interetsEmprunt} />
              <Row label="Total charges d'exploitation" value={result.totalChargesHorsAmort} bold border />

              <Separator />
              <Row
                label="Résultat avant dotation aux amortissements"
                value={result.resultatAvantAmort}
                bold
                border
              />

              <SectionHeader title="Dotation aux amortissements" />
              <Row label="Amortissements de l'exercice" value={result.dotationAmortissement} />
              <Row label="Amortissements imputés" value={result.amortissementsImputes} indent={1} />
              {result.amortissementsExcedentairesNouveaux > 0 && (
                <Row
                  label="→ Amortissements excédentaires (reportés)"
                  value={result.amortissementsExcedentairesNouveaux}
                  indent={1}
                  color="negative"
                />
              )}

              <Separator />
              <Row label="Résultat comptable" value={result.resultatComptable} bold border />

              <SectionHeader title="Traitement fiscal LMNP" />
              {result.deficitNouveauCreer > 0 && (
                <Row label="Déficits nouvellement créés (charges > produits)" value={result.deficitNouveauCreer} indent={1} color="negative" />
              )}
              {result.amortissementsExcedentairesNouveaux > 0 && (
                <Row label="Amortissements excédentaires nouveaux" value={result.amortissementsExcedentairesNouveaux} indent={1} />
              )}

              {result.amortissementsExcedentairesAnterieurs > 0 && (
                <>
                  <Row label="Amortissements excédentaires antérieurs" value={result.amortissementsExcedentairesAnterieurs} indent={1} />
                  <Row label="Amortissements antérieurs imputés" value={result.amortissementsAnterieursImputes} indent={2} color="positive" />
                  <Row label="Amortissements antérieurs restants" value={result.amortissementsAnterieursRestants} indent={2} />
                </>
              )}

              {result.deficitsAnterieurs > 0 && (
                <>
                  <Row label="Déficits antérieurs" value={result.deficitsAnterieurs} indent={1} />
                  <Row label="Déficits antérieurs imputés" value={result.deficitsAnterieursImputes} indent={2} color="positive" />
                  <Row label="Déficits antérieurs restants" value={result.deficitsAnterieursRestants} indent={2} />
                </>
              )}

              <Separator />
              <Row
                label="Résultat fiscal final"
                value={result.resultatFiscalFinal}
                bold
                doubleBorder
                color={result.resultatFiscalFinal < 0 ? 'negative' : result.resultatFiscalFinal > 0 ? 'positive' : 'neutral'}
              />

              <SectionHeader title="Reports pour l'exercice suivant" />
              <Row label="Amortissements excédentaires à reporter" value={result.amortissementsExcedentairesAReporter} />
              <Row label="Déficits à reporter" value={result.deficitsAReporter} />
            </tbody>
          </table>
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 italic">
              Règle LMNP : Les amortissements ne peuvent pas créer ni aggraver un déficit. Ils sont reportables indéfiniment.
              Les déficits sur charges sont reportables 10 ans.
            </p>
          </div>
        </Card>

        {/* Side summary */}
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Synthèse {selectedYear}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Loyers</span>
                <span className="text-sm font-semibold text-green-700">{formatCurrency(result.loyers)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total charges</span>
                <span className="text-sm font-semibold text-red-600">{formatCurrency(result.totalChargesHorsAmort)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Amortissements</span>
                <span className="text-sm font-semibold text-indigo-700">{formatCurrency(result.dotationAmortissement)}</span>
              </div>
              <div className="flex justify-between items-center py-2 bg-gray-50 rounded-md px-2">
                <span className="text-sm font-bold text-gray-900">Résultat fiscal</span>
                <span className={`text-sm font-bold ${result.resultatFiscalFinal < 0 ? 'text-red-600' : result.resultatFiscalFinal > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                  {formatCurrency(result.resultatFiscalFinal)}
                </span>
              </div>
            </div>
          </Card>

          {/* Previous years summary */}
          {allResults.length > 1 && (
            <Card padding={false}>
              <div className="p-3 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900">Historique</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {allResults.slice().reverse().map((r) => (
                  <div key={r.year} className={`px-3 py-2 flex justify-between items-center text-xs ${r.year === selectedYear ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                    <span className={`font-medium ${r.year === selectedYear ? 'text-indigo-700' : 'text-gray-700'}`}>{r.year}</span>
                    <span className={r.resultatFiscalFinal < 0 ? 'text-red-600' : r.resultatFiscalFinal > 0 ? 'text-green-700' : 'text-gray-500'}>
                      {formatCurrency(r.resultatFiscalFinal)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Reports cumulés</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amort. excédentaires</span>
                <span className="font-medium text-indigo-700">{formatCurrency(result.amortissementsExcedentairesAReporter)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Déficits reportables</span>
                <span className={`font-medium ${result.deficitsAReporter > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {formatCurrency(result.deficitsAReporter)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
