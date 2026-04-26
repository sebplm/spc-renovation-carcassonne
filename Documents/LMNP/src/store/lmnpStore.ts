import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PropertyData, Invoice, AdditionalAsset, RentalEntry } from '../types';

const defaultProperty: PropertyData = {
  name: 'Mon bien LMNP',
  address: '',
  acquisitionDate: '',
  activityStartDate: '',
  prixBien: 0,
  fraisNotaire: 0,
  fraisAgence: 0,
  mobilierActe: 0,
  tauxTerrain: 15,
  tauxStructure: 40,
  tauxFacades: 10,
  tauxIGT: 10,
  tauxAgencements: 15,
  dureeStructure: 50,
  dureeFacades: 25,
  dureeIGT: 10,
  dureeAgencements: 10,
  dureeMobilier: 7,
  dureeNotaire: 20,
  dureeAgence: 20,
  montantEmprunt: 0,
  tauxEmprunt: 0,
  dureeEmpruntAns: 0,
  dateDebutEmprunt: '',
};

interface LMNPState {
  property: PropertyData;
  invoices: Invoice[];
  additionalAssets: AdditionalAsset[];
  rentals: RentalEntry[];
  selectedYear: number;

  setProperty: (property: PropertyData) => void;
  updateProperty: (updates: Partial<PropertyData>) => void;

  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  addAdditionalAsset: (asset: AdditionalAsset) => void;
  updateAdditionalAsset: (id: string, asset: Partial<AdditionalAsset>) => void;
  deleteAdditionalAsset: (id: string) => void;

  addRental: (rental: RentalEntry) => void;
  updateRental: (id: string, rental: Partial<RentalEntry>) => void;
  deleteRental: (id: string) => void;

  setSelectedYear: (year: number) => void;
}

export const useLMNPStore = create<LMNPState>()(
  persist(
    (set) => ({
      property: defaultProperty,
      invoices: [],
      additionalAssets: [],
      rentals: [],
      selectedYear: new Date().getFullYear(),

      setProperty: (property) => set({ property }),
      updateProperty: (updates) =>
        set((state) => ({ property: { ...state.property, ...updates } })),

      addInvoice: (invoice) =>
        set((state) => ({ invoices: [...state.invoices, invoice] })),
      updateInvoice: (id, invoice) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...invoice } : inv
          ),
        })),
      deleteInvoice: (id) =>
        set((state) => ({ invoices: state.invoices.filter((inv) => inv.id !== id) })),

      addAdditionalAsset: (asset) =>
        set((state) => ({ additionalAssets: [...state.additionalAssets, asset] })),
      updateAdditionalAsset: (id, asset) =>
        set((state) => ({
          additionalAssets: state.additionalAssets.map((a) =>
            a.id === id ? { ...a, ...asset } : a
          ),
        })),
      deleteAdditionalAsset: (id) =>
        set((state) => ({
          additionalAssets: state.additionalAssets.filter((a) => a.id !== id),
        })),

      addRental: (rental) =>
        set((state) => ({ rentals: [...state.rentals, rental] })),
      updateRental: (id, rental) =>
        set((state) => ({
          rentals: state.rentals.map((r) => (r.id === id ? { ...r, ...rental } : r)),
        })),
      deleteRental: (id) =>
        set((state) => ({ rentals: state.rentals.filter((r) => r.id !== id) })),

      setSelectedYear: (year) => set({ selectedYear: year }),
    }),
    {
      name: 'lmnp-storage',
    }
  )
);
