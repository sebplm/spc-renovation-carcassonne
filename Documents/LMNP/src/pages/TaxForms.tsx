import { useState } from 'react';
import { Printer } from 'lucide-react';
import { useLMNPStore } from '../store/lmnpStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { formatCurrency } from '../utils/formatters';
import {
  computeAllYears,
  computeBaseComponents,
  computeCumulativeAmort,
  computeTotalAmortForYear,
  getActivityStartYear,
  computeAdditionalAssetAmortForYear,
} from '../utils/calculations';

type TabId = '2033B' | '2033C' | '2033D';

function FormRow({
  code,
  label,
  value,
  bold = false,
  indent = 0,
}: {
  code?: string;
  label: string;
  value?: number;
  bold?: boolean;
  indent?: number;
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      {code && (
        <td className="py-2 px-3 text-xs text-gray-400 font-mono w-16">{code}</td>
      )}
      <td
        className={`py-2 text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
        style={{ paddingLeft: `${0.75 + indent * 1.25}rem` }}
      >
        {label}
      </td>
      <td className={`py-2 px-3 text-right text-sm min-w-32 ${bold ? 'font-semibold' : ''} ${value !== undefined && value < 0 ? 'text-red-600' : 'text-gray-900'}`}>
        {value !== undefined ? formatCurrency(value) : ''}
      </td>
    </tr>
  );
}

export function TaxForms() {
  const { property, invoices, additionalAssets, rentals, selectedYear, setSelectedYear } = useLMNPStore();
  const [activeTab, setActiveTab] = useState<TabId>('2033B');

  const startYear = property.activityStartDate ? getActivityStartYear(property) : new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let y = startYear; y <= currentYear + 1; y++) yearOptions.push(y);

  const allResults = computeAllYears(selectedYear, property, invoices, additionalAssets, rentals);
  const result = allResults.find((r) => r.year === selectedYear);

  const components = computeBaseComponents(property);
  const totalAmortThisYear = computeTotalAmortForYear(property, additionalAssets, selectedYear);
  const totalAmortPrevYear = selectedYear > startYear ? computeCumulativeAmort(property, additionalAssets, selectedYear - 1) : 0;
  const totalAmortCumul = computeCumulativeAmort(property, additionalAssets, selectedYear);

  const tabs = [
    { id: '2033B' as TabId, label: 'Liasse 2033-B' },
    { id: '2033C' as TabId, label: 'Liasse 2033-C' },
    { id: '2033D' as TabId, label: 'Liasse 2033-D' },
  ];

  // 2033-C: immobilisations categories
  const terrainValue = property.prixBien * (property.tauxTerrain / 100);
  const buildingValue = property.prixBien * (1 - property.tauxTerrain / 100);
  const structureVal = buildingValue * property.tauxStructure / 100;
  const facadesVal = buildingValue * property.tauxFacades / 100;
  const igtVal = buildingValue * property.tauxIGT / 100;
  const agementsVal = buildingValue * property.tauxAgencements / 100;
  const mobilierVal = property.mobilierActe;
  const fraisNotVal = property.fraisNotaire;
  const fraisAgeVal = property.fraisAgence;

  const constructionsBase = structureVal + facadesVal;
  const installationsBase = igtVal + fraisNotVal + fraisAgeVal;

  // Additional assets grouped by category
  const travauxAssets = additionalAssets.filter((a) => a.category === 'travaux');
  const mobilierAssets = additionalAssets.filter((a) => a.category === 'mobilier');

  const travauxBase = travauxAssets.reduce((s, a) => s + a.amount, 0);
  const mobilierAddBase = mobilierAssets.reduce((s, a) => s + a.amount, 0);

  const travauxAmortThisYear = travauxAssets.reduce((s, a) => s + computeAdditionalAssetAmortForYear(a, selectedYear), 0);
  const mobilierAddAmortThisYear = mobilierAssets.reduce((s, a) => s + computeAdditionalAssetAmortForYear(a, selectedYear), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formulaires fiscaux</h1>
          <p className="text-sm text-gray-500 mt-1">Liasses 2033-B, 2033-C, 2033-D — Exercice {selectedYear}</p>
        </div>
        <div className="flex items-center gap-3 no-print">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>
            Imprimer
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 no-print">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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

      {/* 2033-B */}
      {activeTab === '2033B' && (
        <div className="space-y-4">
          <Card padding={false}>
            <div className="p-4 border-b border-gray-200 bg-indigo-50">
              <h3 className="font-bold text-indigo-900">2033-B — Résultat comptable et fiscal</h3>
              <p className="text-xs text-gray-600 mt-0.5">LMNP — Régime réel simplifié — Exercice {selectedYear}</p>
            </div>

            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">A — Résultat comptable</p>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium w-16">N°</th>
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Libellé</th>
                  <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium min-w-32">Montant</th>
                </tr>
              </thead>
              <tbody>
                <FormRow code="218" label="Production vendue — services (loyers)" value={result?.loyers} />
                <FormRow code="— " label="Total des produits d'exploitation" value={result?.loyers} bold />
                <FormRow code="606" label="Autres charges externes (entretien, gestion, assurance…)" value={result?.chargesDeductibles} />
                <FormRow code="63" label="Impôts, taxes et versements assimilés (foncière, CFE)" value={result?.taxes} />
                <FormRow code="661" label="Charges d'intérêts (intérêts emprunt)" value={result?.interetsEmprunt} />
                <FormRow code="681" label="Dotation aux amortissements" value={result?.dotationAmortissement} />
                <FormRow code="— " label="Total des charges d'exploitation" value={result ? result.totalChargesHorsAmort + result.dotationAmortissement : undefined} bold />
                <FormRow code="— " label="Résultat d'exploitation (avant rémunération)" value={result ? result.loyers - result.totalChargesHorsAmort - result.dotationAmortissement : undefined} bold />
                <FormRow code="— " label="BÉNÉFICE OU PERTE comptable" value={result?.resultatComptable} bold />
              </tbody>
            </table>

            <div className="p-3 bg-gray-50 border-t border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">B — Résultat fiscal</p>
            </div>
            <table className="w-full">
              <tbody>
                <FormRow code="— " label="Bénéfice comptable à reporter" value={result?.resultatComptable && result.resultatComptable > 0 ? result.resultatComptable : 0} />
                <FormRow code="— " label="Amortissements excédentaires (non déductibles cette année)" value={result?.amortissementsExcedentairesNouveaux} />
                <FormRow code="— " label="Amortissements antérieurs imputés" value={result?.amortissementsAnterieursImputes} />
                <FormRow code="— " label="Déficits antérieurs imputés" value={result?.deficitsAnterieursImputes} />
                <FormRow code="— " label="Résultat fiscal (bénéfice imposable / déficit)" value={result?.resultatFiscalFinal} bold />
              </tbody>
            </table>
          </Card>

          <Card>
            <p className="text-xs text-gray-500 italic">
              Le résultat fiscal positif est reporté en case BA (bénéfices agricoles) ou BIC non-professionnels selon la déclaration 2042 C Pro.
              En cas de déficit, celui-ci est imputable uniquement sur les BIC non-professionnels des 10 années suivantes.
            </p>
          </Card>
        </div>
      )}

      {/* 2033-C */}
      {activeTab === '2033C' && (
        <Card padding={false}>
          <div className="p-4 border-b border-gray-200 bg-indigo-50">
            <h3 className="font-bold text-indigo-900">2033-C — Immobilisations et amortissements</h3>
            <p className="text-xs text-gray-600 mt-0.5">Exercice {selectedYear}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-2 px-3 text-gray-600 font-medium">Catégorie</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Brut début N</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Augmentations</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Brut fin N</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Amort début N</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Dotation N</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">Amort fin N</th>
                  <th className="text-right py-2 px-3 text-gray-600 font-medium">VNC fin N</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Terrains */}
                <tr className="bg-amber-50/30">
                  <td className="py-2 px-3 font-medium text-gray-800">Terrains</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(terrainValue)}</td>
                  <td className="py-2 px-3 text-right">—</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(terrainValue)}</td>
                  <td className="py-2 px-3 text-right text-gray-400">—</td>
                  <td className="py-2 px-3 text-right text-gray-400">—</td>
                  <td className="py-2 px-3 text-right text-gray-400">—</td>
                  <td className="py-2 px-3 text-right font-semibold text-amber-700">{formatCurrency(terrainValue)}</td>
                </tr>
                {/* Constructions */}
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-800">Constructions (structure + façades)</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(constructionsBase)}</td>
                  <td className="py-2 px-3 text-right">—</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(constructionsBase)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(totalAmortPrevYear > 0 ? totalAmortPrevYear * 0.5 : 0)}</td>
                  <td className="py-2 px-3 text-right text-indigo-700 font-medium">
                    {formatCurrency(
                      (components.find((c) => c.label === 'Structure')
                        ? computeAdditionalAssetAmortForYear({ id: '', name: 'x', amount: structureVal, startDate: property.activityStartDate, amortizationYears: property.dureeStructure, category: 'travaux' }, selectedYear)
                        : 0) +
                      (components.find((c) => c.label === 'Façades')
                        ? computeAdditionalAssetAmortForYear({ id: '', name: 'x', amount: facadesVal, startDate: property.activityStartDate, amortizationYears: property.dureeFacades, category: 'travaux' }, selectedYear)
                        : 0)
                    )}
                  </td>
                  <td className="py-2 px-3 text-right">{formatCurrency(Math.min(totalAmortCumul * 0.5, constructionsBase))}</td>
                  <td className="py-2 px-3 text-right font-semibold text-green-700">{formatCurrency(Math.max(0, constructionsBase - Math.min(totalAmortCumul * 0.5, constructionsBase)))}</td>
                </tr>
                {/* Installations */}
                <tr className="bg-gray-50/50">
                  <td className="py-2 px-3 font-medium text-gray-800">Installations, agencements, frais</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(installationsBase + agementsVal)}</td>
                  <td className="py-2 px-3 text-right">{travauxBase > 0 ? formatCurrency(travauxBase) : '—'}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(installationsBase + agementsVal + travauxBase)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(totalAmortPrevYear > 0 ? totalAmortPrevYear * 0.3 : 0)}</td>
                  <td className="py-2 px-3 text-right text-indigo-700 font-medium">{formatCurrency(travauxAmortThisYear)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(Math.min(totalAmortCumul * 0.3, installationsBase + agementsVal + travauxBase))}</td>
                  <td className="py-2 px-3 text-right font-semibold text-green-700">
                    {formatCurrency(Math.max(0, installationsBase + agementsVal + travauxBase - Math.min(totalAmortCumul * 0.3, installationsBase + agementsVal + travauxBase)))}
                  </td>
                </tr>
                {/* Mobilier */}
                <tr>
                  <td className="py-2 px-3 font-medium text-gray-800">Mobilier</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(mobilierVal)}</td>
                  <td className="py-2 px-3 text-right">{mobilierAddBase > 0 ? formatCurrency(mobilierAddBase) : '—'}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(mobilierVal + mobilierAddBase)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(totalAmortPrevYear > 0 ? totalAmortPrevYear * 0.2 : 0)}</td>
                  <td className="py-2 px-3 text-right text-indigo-700 font-medium">{formatCurrency(mobilierAddAmortThisYear)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(Math.min(totalAmortCumul * 0.2, mobilierVal + mobilierAddBase))}</td>
                  <td className="py-2 px-3 text-right font-semibold text-green-700">
                    {formatCurrency(Math.max(0, mobilierVal + mobilierAddBase - Math.min(totalAmortCumul * 0.2, mobilierVal + mobilierAddBase)))}
                  </td>
                </tr>
                {/* Total */}
                <tr className="bg-indigo-50 font-bold border-t-2 border-indigo-200">
                  <td className="py-2 px-3 text-gray-800">TOTAL</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(terrainValue + constructionsBase + installationsBase + agementsVal + mobilierVal)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(travauxBase + mobilierAddBase)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(terrainValue + constructionsBase + installationsBase + agementsVal + mobilierVal + travauxBase + mobilierAddBase)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(totalAmortPrevYear)}</td>
                  <td className="py-2 px-3 text-right text-indigo-700">{formatCurrency(totalAmortThisYear)}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(totalAmortCumul)}</td>
                  <td className="py-2 px-3 text-right text-green-700">
                    {formatCurrency(Math.max(0, terrainValue + constructionsBase + installationsBase + agementsVal + mobilierVal + travauxBase + mobilierAddBase - totalAmortCumul))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 2033-D */}
      {activeTab === '2033D' && (
        <Card padding={false}>
          <div className="p-4 border-b border-gray-200 bg-indigo-50">
            <h3 className="font-bold text-indigo-900">2033-D — Déficits reportables</h3>
            <p className="text-xs text-gray-600 mt-0.5">Exercice {selectedYear}</p>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium w-20">Ligne</th>
                <th className="text-left py-2 px-3 text-xs text-gray-500 font-medium">Libellé</th>
                <th className="text-right py-2 px-3 text-xs text-gray-500 font-medium min-w-36">Montant</th>
              </tr>
            </thead>
            <tbody>
              <FormRow
                code="982"
                label="Déficits restant à reporter au titre de l'exercice précédent"
                value={result?.deficitsAnterieurs ?? 0}
              />
              <FormRow
                code="983"
                label="Déficits imputés sur le résultat de l'exercice"
                value={result?.deficitsAnterieursImputes ?? 0}
              />
              <FormRow
                code="984"
                label="Déficits reportables (ligne 982 - ligne 983)"
                value={(result?.deficitsAnterieurs ?? 0) - (result?.deficitsAnterieursImputes ?? 0)}
                bold
              />
              <FormRow
                code="860"
                label="Déficits de l'exercice (nouveau déficit créé)"
                value={result?.deficitNouveauCreer ?? 0}
              />
              <FormRow
                code="870"
                label="TOTAL des déficits restant à reporter"
                value={result?.deficitsAReporter ?? 0}
                bold
              />
            </tbody>
          </table>

          <div className="p-4 border-t border-gray-200">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Règle LMNP :</strong> Les déficits sont reportables sur les BIC non-professionnels des 10 années suivantes uniquement.
                Les amortissements excédentaires ({formatCurrency(result?.amortissementsExcedentairesAReporter ?? 0)}) sont reportables indéfiniment
                et ne figurent pas dans ce tableau.
              </p>
            </div>

            {(result?.amortissementsExcedentairesAReporter ?? 0) > 0 && (
              <div className="mt-3 border border-indigo-200 rounded-lg overflow-hidden">
                <div className="bg-indigo-50 px-4 py-2">
                  <p className="text-xs font-bold text-indigo-700">Amortissements excédentaires (hors 2033-D)</p>
                </div>
                <table className="w-full">
                  <tbody>
                    <FormRow label="Amortissements excédentaires nouveaux" value={result?.amortissementsExcedentairesNouveaux} />
                    <FormRow label="Amortissements excédentaires antérieurs restants" value={result?.amortissementsAnterieursRestants} />
                    <FormRow label="Total amortissements excédentaires à reporter" value={result?.amortissementsExcedentairesAReporter} bold />
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
