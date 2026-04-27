export interface PropertyData {
  name: string;
  address: string;
  acquisitionDate: string;
  activityStartDate: string;
  prixBien: number;
  fraisNotaire: number;
  fraisAgence: number;
  mobilierActe: number;
  tauxTerrain: number; // default 15
  // Component percentages (of building value after terrain)
  tauxStructure: number; // default 40, 50 years
  tauxFacades: number; // default 10, 25 years
  tauxIGT: number; // default 10, 10 years
  tauxAgencements: number; // default 15, 10 years
  // Duration overrides
  dureeStructure: number;
  dureeFacades: number;
  dureeIGT: number;
  dureeAgencements: number;
  dureeMobilier: number;
  dureeNotaire: number;
  dureeAgence: number;
  // Loan
  montantEmprunt: number;
  tauxEmprunt: number;
  dureeEmpruntAns: number;
  dateDebutEmprunt: string;
}

export type InvoiceCategory =
  | 'electricite'
  | 'travaux_entretien'
  | 'mobilier'
  | 'plomberie'
  | 'toiture'
  | 'agence_gestion'
  | 'assurance'
  | 'taxe_fonciere'
  | 'cfe'
  | 'interets_emprunt'
  | 'frais_comptable'
  | 'syndic'
  | 'autres_charges';

export interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: InvoiceCategory;
  isCapex: boolean;
  amortizationYears?: number;
}

export interface AdditionalAsset {
  id: string;
  name: string;
  amount: number;
  startDate: string; // ISO date
  amortizationYears: number;
  category: 'travaux' | 'mobilier';
}

export interface RentalEntry {
  id: string;
  year: number;
  month: number; // 1-12, 0 = annual total
  amount: number;
  description?: string;
}

export interface YearlyData {
  year: number;
  loyers: number;
  chargesDeductibles: number;
  taxes: number;
  interetsEmprunt: number;
  autresCharges: number;
}

export interface YearlyFiscalResult {
  year: number;
  loyers: number;
  chargesDeductibles: number;
  taxes: number;
  interetsEmprunt: number;
  totalChargesHorsAmort: number;
  resultatAvantAmort: number;
  dotationAmortissement: number;
  resultatComptable: number;
  amortissementsImputes: number;
  amortissementsExcedentairesNouveaux: number;
  deficitNouveauCreer: number;
  amortissementsExcedentairesAnterieurs: number;
  amortissementsAnterieursImputes: number;
  amortissementsAnterieursRestants: number;
  deficitsAnterieurs: number;
  deficitsAnterieursImputes: number;
  deficitsAnterieursRestants: number;
  resultatFiscalFinal: number;
  amortissementsExcedentairesAReporter: number;
  deficitsAReporter: number;
}
