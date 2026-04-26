import React, { useState, useEffect } from 'react';
import { useLMNPStore } from '../store/lmnpStore';
import { Card, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Save, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import {
  computeBaseComponents,
  getProrataFirstYear,
  getComponentAmortForYear,
  getActivityStartYear,
} from '../utils/calculations';
import type { PropertyData } from '../types';

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-left"
      >
        <span className="font-semibold text-gray-800 text-sm">{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

export function PropertyForm() {
  const { property, setProperty } = useLMNPStore();
  const [form, setForm] = useState<PropertyData>(property);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(property);
  }, [property]);

  const handleChange = (field: keyof PropertyData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const num = (field: keyof PropertyData) => ({
    type: 'number' as const,
    value: form[field] as number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(field, Number(e.target.value)),
    min: 0,
  });

  const str = (field: keyof PropertyData) => ({
    value: form[field] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(field, e.target.value),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProperty(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Decomposition preview
  const components = computeBaseComponents(form);
  const prorata = getProrataFirstYear(form);
  const startYear = getActivityStartYear(form);

  const terrainValue = form.prixBien * (form.tauxTerrain / 100);
  const buildingValue = form.prixBien - terrainValue;

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bien immobilier</h1>
          <p className="text-sm text-gray-500 mt-1">Paramètres d'acquisition et d'amortissement</p>
        </div>
        <Button type="submit" icon={<Save size={16} />}>
          {saved ? 'Enregistré !' : 'Enregistrer'}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="xl:col-span-2 space-y-4">
          <Section title="Identification du bien">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nom du bien" placeholder="Ex: Appartement Paris 11" {...str('name')} />
              <Input label="Adresse" placeholder="12 rue des Lilas, 75011 Paris" {...str('address')} />
              <Input label="Date d'acquisition" type="date" {...str('acquisitionDate')} />
              <Input label="Date de début d'activité" type="date" {...str('activityStartDate')} helpText="Date de mise en location meublée" />
            </div>
          </Section>

          <Section title="Prix d'acquisition">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Prix du bien (€)" suffix="€" {...num('prixBien')} />
              <Input label="Frais de notaire (€)" suffix="€" {...num('fraisNotaire')} />
              <Input label="Frais d'agence (€)" suffix="€" {...num('fraisAgence')} />
              <Input label="Mobilier acté (€)" suffix="€" {...num('mobilierActe')} helpText="Valeur du mobilier inclus dans l'acte" />
            </div>
            {form.prixBien > 0 && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                Total acquisition : <strong>{formatCurrency(form.prixBien + form.fraisNotaire + form.fraisAgence + form.mobilierActe)}</strong>
              </div>
            )}
          </Section>

          <Section title="Décomposition comptable">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input label="Taux terrain (%)" suffix="%" {...num('tauxTerrain')} helpText="Non amortissable (défaut 15%)" />
                {form.prixBien > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Terrain : {formatCurrency(terrainValue)} — Bâti : {formatCurrency(buildingValue)}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Composants du bâti</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Structure (%)" {...num('tauxStructure')} />
                  <Input label="Durée (ans)" {...num('dureeStructure')} />
                  <Input label="Façades (%)" {...num('tauxFacades')} />
                  <Input label="Durée (ans)" {...num('dureeFacades')} />
                  <Input label="IGT (%)" {...num('tauxIGT')} helpText="Install. gén. & tech." />
                  <Input label="Durée (ans)" {...num('dureeIGT')} />
                  <Input label="Agencements (%)" {...num('tauxAgencements')} />
                  <Input label="Durée (ans)" {...num('dureeAgencements')} />
                </div>
                <p className="text-xs text-amber-600">
                  Total composants : {form.tauxStructure + form.tauxFacades + form.tauxIGT + form.tauxAgencements}%
                  {form.tauxStructure + form.tauxFacades + form.tauxIGT + form.tauxAgencements !== 100 && ' ⚠ doit être égal à 100%'}
                </p>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Autres éléments</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <Input label="Durée mobilier (ans)" {...num('dureeMobilier')} helpText="Durée amort. mobilier acté" />
                  </div>
                  <div className="col-span-2">
                    <Input label="Durée frais notaire (ans)" {...num('dureeNotaire')} helpText="Défaut 20 ans" />
                  </div>
                  <div className="col-span-2">
                    <Input label="Durée frais d'agence (ans)" {...num('dureeAgence')} helpText="Défaut 20 ans" />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Emprunt immobilier">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Montant emprunté (€)" suffix="€" {...num('montantEmprunt')} />
              <Input label="Taux d'intérêt (%)" suffix="%" {...num('tauxEmprunt')} />
              <Input label="Durée (ans)" suffix="ans" {...num('dureeEmpruntAns')} />
              <Input label="Date de début de l'emprunt" type="date" {...str('dateDebutEmprunt')} />
            </div>
            {form.montantEmprunt > 0 && form.tauxEmprunt > 0 && form.dureeEmpruntAns > 0 && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                {(() => {
                  const r = form.tauxEmprunt / 12 / 100;
                  const n = form.dureeEmpruntAns * 12;
                  const m = (form.montantEmprunt * r) / (1 - Math.pow(1 + r, -n));
                  return <>Mensualité estimée : <strong>{formatCurrency(m)}</strong></>;
                })()}
              </div>
            )}
          </Section>
        </div>

        {/* Right: decomposition preview */}
        <div className="xl:col-span-1">
          <Card>
            <CardHeader title="Tableau d'amortissement" subtitle="Aperçu des composants" />
            {form.prixBien > 0 && form.activityStartDate ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-gray-600 font-medium">Composant</th>
                      <th className="text-right py-2 px-2 text-gray-600 font-medium">Base</th>
                      <th className="text-right py-2 px-2 text-gray-600 font-medium">Durée</th>
                      <th className="text-right py-2 px-2 text-gray-600 font-medium">Taux/an</th>
                      <th className="text-right py-2 px-2 text-gray-600 font-medium">1ère année</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Terrain (non amortissable) */}
                    <tr>
                      <td className="py-1.5 px-2 text-gray-500 italic">Terrain</td>
                      <td className="py-1.5 px-2 text-right text-gray-500">{formatCurrency(terrainValue)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                      <td className="py-1.5 px-2 text-right text-gray-400">—</td>
                    </tr>
                    {components.map((c, i) => {
                      const firstYearAmort = getComponentAmortForYear(c, startYear, prorata);
                      return (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-1.5 px-2 font-medium text-gray-700">{c.label}</td>
                          <td className="py-1.5 px-2 text-right text-gray-900">{formatCurrency(c.base)}</td>
                          <td className="py-1.5 px-2 text-right text-gray-700">{c.duree} ans</td>
                          <td className="py-1.5 px-2 text-right text-gray-700">{formatNumber(c.tauxAnnuel, 1)}%</td>
                          <td className="py-1.5 px-2 text-right font-medium text-indigo-700">{formatCurrency(firstYearAmort)}</td>
                        </tr>
                      );
                    })}
                    {/* Total */}
                    <tr className="bg-indigo-50 font-semibold">
                      <td className="py-2 px-2 text-gray-800">Total</td>
                      <td className="py-2 px-2 text-right text-gray-800">
                        {formatCurrency(components.reduce((s, c) => s + c.base, 0))}
                      </td>
                      <td className="py-2 px-2"></td>
                      <td className="py-2 px-2"></td>
                      <td className="py-2 px-2 text-right text-indigo-700">
                        {formatCurrency(
                          components.reduce((s, c) => s + getComponentAmortForYear(c, startYear, prorata), 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-3 italic">
                  Prorata 1ère année ({form.activityStartDate ? new Date(form.activityStartDate).toLocaleString('fr-FR', { month: 'long' }) : '?'}) : {formatNumber(prorata * 100, 0)}%
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Renseignez le prix du bien et la date d'activité pour afficher la décomposition.</p>
            )}
          </Card>
        </div>
      </div>
    </form>
  );
}
