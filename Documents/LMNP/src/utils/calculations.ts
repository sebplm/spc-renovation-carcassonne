import type { PropertyData, Invoice, AdditionalAsset, RentalEntry, YearlyFiscalResult } from '../types';

export interface AmortizationComponent {
  label: string;
  base: number;
  duree: number;
  tauxAnnuel: number;
  amortAnnuel: number;
  startYear: number;
  endYear: number;
}

export function getActivityStartYear(property: PropertyData): number {
  if (!property.activityStartDate) return new Date().getFullYear();
  return new Date(property.activityStartDate).getFullYear();
}

export function getActivityStartMonth(property: PropertyData): number {
  if (!property.activityStartDate) return 1;
  return new Date(property.activityStartDate).getMonth() + 1; // 1-12
}

export function getProrataFirstYear(property: PropertyData): number {
  const month = getActivityStartMonth(property);
  return (12 - month + 1) / 12;
}

/**
 * Compute the base amortization components from property data
 */
export function computeBaseComponents(property: PropertyData): AmortizationComponent[] {
  const {
    prixBien,
    fraisNotaire,
    fraisAgence,
    mobilierActe,
    tauxTerrain,
    tauxStructure,
    tauxFacades,
    tauxIGT,
    tauxAgencements,
    dureeStructure,
    dureeFacades,
    dureeIGT,
    dureeAgencements,
    dureeMobilier,
    dureeNotaire,
    dureeAgence,
    activityStartDate,
  } = property;

  const startYear = activityStartDate ? new Date(activityStartDate).getFullYear() : new Date().getFullYear();

  const buildingValue = prixBien * (1 - tauxTerrain / 100);

  const structureBase = buildingValue * (tauxStructure / 100);
  const facadesBase = buildingValue * (tauxFacades / 100);
  const igtBase = buildingValue * (tauxIGT / 100);
  const agengementsBase = buildingValue * (tauxAgencements / 100);

  const components: AmortizationComponent[] = [];

  if (structureBase > 0 && dureeStructure > 0) {
    const amort = structureBase / dureeStructure;
    components.push({
      label: 'Structure',
      base: structureBase,
      duree: dureeStructure,
      tauxAnnuel: (1 / dureeStructure) * 100,
      amortAnnuel: amort,
      startYear,
      endYear: startYear + dureeStructure - 1,
    });
  }

  if (facadesBase > 0 && dureeFacades > 0) {
    const amort = facadesBase / dureeFacades;
    components.push({
      label: 'Façades',
      base: facadesBase,
      duree: dureeFacades,
      tauxAnnuel: (1 / dureeFacades) * 100,
      amortAnnuel: amort,
      startYear,
      endYear: startYear + dureeFacades - 1,
    });
  }

  if (igtBase > 0 && dureeIGT > 0) {
    const amort = igtBase / dureeIGT;
    components.push({
      label: 'IGT',
      base: igtBase,
      duree: dureeIGT,
      tauxAnnuel: (1 / dureeIGT) * 100,
      amortAnnuel: amort,
      startYear,
      endYear: startYear + dureeIGT - 1,
    });
  }

  if (agengementsBase > 0 && dureeAgencements > 0) {
    const amort = agengementsBase / dureeAgencements;
    components.push({
      label: 'Agencements',
      base: agengementsBase,
      duree: dureeAgencements,
      tauxAnnuel: (1 / dureeAgencements) * 100,
      amortAnnuel: amort,
      startYear,
      endYear: startYear + dureeAgencements - 1,
    });
  }

  if (mobilierActe > 0 && dureeMobilier > 0) {
    const amort = mobilierActe / dureeMobilier;
    components.push({
      label: 'Mobilier (acte)',
      base: mobilierActe,
      duree: dureeMobilier,
      tauxAnnuel: (1 / dureeMobilier) * 100,
      amortAnnuel: amort,
      startYear,
      endYear: startYear + dureeMobilier - 1,
    });
  }

  if (fraisNotaire > 0 && dureeNotaire > 0) {
    const amort = fraisNotaire / dureeNotaire;
    components.push({
      label: 'Frais notaire',
      base: fraisNotaire,
      duree: dureeNotaire,
      tauxAnnuel: (1 / dureeNotaire) * 100,
      amortAnnuel: amort,
      startYear,
      endYear: startYear + dureeNotaire - 1,
    });
  }

  if (fraisAgence > 0 && dureeAgence > 0) {
    const amort = fraisAgence / dureeAgence;
    components.push({
      label: "Frais d'agence",
      base: fraisAgence,
      duree: dureeAgence,
      tauxAnnuel: (1 / dureeAgence) * 100,
      amortAnnuel: amort,
      startYear,
      endYear: startYear + dureeAgence - 1,
    });
  }

  return components;
}

/**
 * Compute amortization for a specific year for a component
 */
export function getComponentAmortForYear(
  component: AmortizationComponent,
  year: number,
  prorata: number
): number {
  if (year < component.startYear || year > component.endYear) return 0;
  if (year === component.startYear) {
    return component.amortAnnuel * prorata;
  }
  return component.amortAnnuel;
}

/**
 * Compute total base amortization for a given year
 */
export function computeBaseAmortForYear(property: PropertyData, year: number): number {
  const components = computeBaseComponents(property);
  const prorata = getProrataFirstYear(property);
  return components.reduce((sum, c) => sum + getComponentAmortForYear(c, year, prorata), 0);
}

/**
 * Compute additional asset amortization for a given year
 */
export function computeAdditionalAssetAmortForYear(asset: AdditionalAsset, year: number): number {
  const startYear = new Date(asset.startDate).getFullYear();
  const startMonth = new Date(asset.startDate).getMonth() + 1;
  const endYear = startYear + asset.amortizationYears - 1;

  if (year < startYear || year > endYear) return 0;

  const annualAmort = asset.amount / asset.amortizationYears;

  if (year === startYear) {
    const prorata = (12 - startMonth + 1) / 12;
    return annualAmort * prorata;
  }
  return annualAmort;
}

/**
 * Compute total amortization for a year (base + additional assets)
 */
export function computeTotalAmortForYear(
  property: PropertyData,
  additionalAssets: AdditionalAsset[],
  year: number
): number {
  const base = computeBaseAmortForYear(property, year);
  const additional = additionalAssets.reduce(
    (sum, asset) => sum + computeAdditionalAssetAmortForYear(asset, year),
    0
  );
  return base + additional;
}

/**
 * Compute cumulative amortization up to and including a year
 */
export function computeCumulativeAmort(
  property: PropertyData,
  additionalAssets: AdditionalAsset[],
  upToYear: number
): number {
  const startYear = getActivityStartYear(property);
  let total = 0;
  for (let y = startYear; y <= upToYear; y++) {
    total += computeTotalAmortForYear(property, additionalAssets, y);
  }
  return total;
}

/**
 * Compute VNC (Valeur Nette Comptable) at end of a year
 */
export function computeVNC(
  property: PropertyData,
  additionalAssets: AdditionalAsset[],
  year: number
): number {
  const components = computeBaseComponents(property);
  const totalBrut =
    components.reduce((s, c) => s + c.base, 0) +
    additionalAssets.reduce((s, a) => s + a.amount, 0);
  const cumul = computeCumulativeAmort(property, additionalAssets, year);
  return Math.max(0, totalBrut - cumul);
}

/**
 * Loan amortization schedule
 */
export interface LoanPayment {
  year: number;
  month: number;
  principal: number;
  interest: number;
  balance: number;
}

export function computeLoanSchedule(property: PropertyData): LoanPayment[] {
  const { montantEmprunt, tauxEmprunt, dureeEmpruntAns, dateDebutEmprunt } = property;
  if (!montantEmprunt || !tauxEmprunt || !dureeEmpruntAns || !dateDebutEmprunt) return [];

  const monthlyRate = tauxEmprunt / 12 / 100;
  const nMonths = dureeEmpruntAns * 12;

  if (monthlyRate === 0) return [];

  const monthlyPayment =
    (montantEmprunt * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -nMonths));

  const schedule: LoanPayment[] = [];
  let balance = montantEmprunt;
  const startDate = new Date(dateDebutEmprunt);

  for (let i = 0; i < nMonths; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance = Math.max(0, balance - principal);

    schedule.push({ year, month, principal, interest, balance });
  }

  return schedule;
}

export function computeYearlyLoanInterests(property: PropertyData, year: number): number {
  const schedule = computeLoanSchedule(property);
  return schedule
    .filter((p) => p.year === year)
    .reduce((sum, p) => sum + p.interest, 0);
}

export function computeCapitalRestantDu(property: PropertyData, year: number): number {
  const schedule = computeLoanSchedule(property);
  const lastPaymentOfYear = schedule.filter((p) => p.year <= year).pop();
  return lastPaymentOfYear ? lastPaymentOfYear.balance : property.montantEmprunt;
}

/**
 * Compute loyers for a year from rental entries
 */
export function computeLoyers(rentals: RentalEntry[], year: number): number {
  return rentals.filter((r) => r.year === year).reduce((sum, r) => sum + r.amount, 0);
}

/**
 * Compute deductible charges from invoices for a year
 * (non-capex, non-tax categories)
 */
export function computeChargesDeductibles(invoices: Invoice[], year: number): number {
  const taxCategories: string[] = ['taxe_fonciere', 'cfe', 'interets_emprunt'];
  return invoices
    .filter((inv) => {
      const invYear = new Date(inv.date).getFullYear();
      return invYear === year && !inv.isCapex && !taxCategories.includes(inv.category);
    })
    .reduce((sum, inv) => sum + inv.amount, 0);
}

/**
 * Compute taxes (taxe foncière + CFE) from invoices for a year
 */
export function computeTaxes(invoices: Invoice[], year: number): number {
  return invoices
    .filter((inv) => {
      const invYear = new Date(inv.date).getFullYear();
      return invYear === year && !inv.isCapex && ['taxe_fonciere', 'cfe'].includes(inv.category);
    })
    .reduce((sum, inv) => sum + inv.amount, 0);
}

/**
 * Compute interest from invoices for a year (if manually entered)
 */
export function computeInteretsFromInvoices(invoices: Invoice[], year: number): number {
  return invoices
    .filter((inv) => {
      const invYear = new Date(inv.date).getFullYear();
      return invYear === year && !inv.isCapex && inv.category === 'interets_emprunt';
    })
    .reduce((sum, inv) => sum + inv.amount, 0);
}

/**
 * Compute the complete LMNP fiscal result for a given year
 * Requires previous years' results for carry-forwards
 */
export function computeYearlyFiscalResult(
  year: number,
  property: PropertyData,
  invoices: Invoice[],
  additionalAssets: AdditionalAsset[],
  rentals: RentalEntry[],
  previousResults: YearlyFiscalResult[]
): YearlyFiscalResult {
  const loyers = computeLoyers(rentals, year);
  const chargesDeductibles = computeChargesDeductibles(invoices, year);
  const taxes = computeTaxes(invoices, year);

  // Use loan schedule for interests (or invoices if they exist)
  const interetsFromLoan = computeYearlyLoanInterests(property, year);
  const interetsFromInvoices = computeInteretsFromInvoices(invoices, year);
  const interetsEmprunt = interetsFromInvoices > 0 ? interetsFromInvoices : interetsFromLoan;

  const totalChargesHorsAmort = chargesDeductibles + taxes + interetsEmprunt;
  const resultatAvantAmort = loyers - totalChargesHorsAmort;

  const dotationAmortissement = computeTotalAmortForYear(property, additionalAssets, year);

  let amortissementsImputes = 0;
  let amortissementsExcedentairesNouveaux = 0;
  let deficitNouveauCreer = 0;
  let resultatComptable = 0;

  if (resultatAvantAmort < 0) {
    deficitNouveauCreer = Math.abs(resultatAvantAmort);
    amortissementsExcedentairesNouveaux = dotationAmortissement;
    resultatComptable = resultatAvantAmort;
  } else {
    amortissementsImputes = Math.min(dotationAmortissement, resultatAvantAmort);
    amortissementsExcedentairesNouveaux = dotationAmortissement - amortissementsImputes;
    resultatComptable = resultatAvantAmort - amortissementsImputes;
  }

  // Carry-forwards from previous years — use last year's ending balance
  const lastPrevResult = previousResults[previousResults.length - 1];
  const amortissementsExcedentairesAnterieurs = lastPrevResult
    ? lastPrevResult.amortissementsExcedentairesAReporter
    : 0;

  // Déficits from previous years (only last 10 years carry forward)
  const deficitsAnterieurs = lastPrevResult ? lastPrevResult.deficitsAReporter : 0;

  // Apply previous excédentaires and déficits to reduce resultatComptable
  let remainingResult = resultatComptable;

  // First apply amortissements excédentaires antérieurs
  const amortissementsAnterieursImputes = Math.min(
    amortissementsExcedentairesAnterieurs,
    Math.max(0, remainingResult)
  );
  remainingResult -= amortissementsAnterieursImputes;
  const amortissementsAnterieursRestants =
    amortissementsExcedentairesAnterieurs - amortissementsAnterieursImputes;

  // Then apply déficits antérieurs
  const deficitsAnterieursImputes = Math.min(deficitsAnterieurs, Math.max(0, remainingResult));
  remainingResult -= deficitsAnterieursImputes;
  const deficitsAnterieursRestants = deficitsAnterieurs - deficitsAnterieursImputes;

  const resultatFiscalFinal = remainingResult;

  // Compute carry-forwards for next year
  const amortissementsExcedentairesAReporter =
    amortissementsAnterieursRestants + amortissementsExcedentairesNouveaux;

  const deficitsAReporter = deficitsAnterieursRestants + deficitNouveauCreer;

  return {
    year,
    loyers,
    chargesDeductibles,
    taxes,
    interetsEmprunt,
    totalChargesHorsAmort,
    resultatAvantAmort,
    dotationAmortissement,
    resultatComptable,
    amortissementsImputes,
    amortissementsExcedentairesNouveaux,
    deficitNouveauCreer,
    amortissementsExcedentairesAnterieurs,
    amortissementsAnterieursImputes,
    amortissementsAnterieursRestants,
    deficitsAnterieurs,
    deficitsAnterieursImputes,
    deficitsAnterieursRestants,
    resultatFiscalFinal,
    amortissementsExcedentairesAReporter,
    deficitsAReporter,
  };
}

/**
 * Compute all years from activity start up to selectedYear
 */
export function computeAllYears(
  selectedYear: number,
  property: PropertyData,
  invoices: Invoice[],
  additionalAssets: AdditionalAsset[],
  rentals: RentalEntry[]
): YearlyFiscalResult[] {
  if (!property.activityStartDate) return [];
  const startYear = getActivityStartYear(property);
  const results: YearlyFiscalResult[] = [];

  for (let y = startYear; y <= selectedYear; y++) {
    const result = computeYearlyFiscalResult(
      y,
      property,
      invoices,
      additionalAssets,
      rentals,
      results
    );
    results.push(result);
  }

  return results;
}

/**
 * Get total brut immobilisations
 */
export function getTotalBrutImmobilisations(
  property: PropertyData,
  additionalAssets: AdditionalAsset[]
): number {
  const components = computeBaseComponents(property);
  const baseBrut = components.reduce((s, c) => s + c.base, 0);
  const additionalBrut = additionalAssets.reduce((s, a) => s + a.amount, 0);
  return baseBrut + additionalBrut;
}

export function getTotalAcquisition(property: PropertyData): number {
  return (
    property.prixBien +
    property.fraisNotaire +
    property.fraisAgence +
    property.mobilierActe
  );
}
