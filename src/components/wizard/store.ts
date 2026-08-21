import { create } from "zustand";
import type { HomeType, JobType, ServiceType } from "@/lib/domain";
import type { WizardAddress, WizardItem, WizardRoom } from "@/lib/wizard-types";

export type CargoItem = WizardItem & { categoryKey: string };

interface WizardState {
  step: number;
  serviceType: ServiceType | null;
  jobType: JobType | null;
  homeType: HomeType | null;
  rooms: WizardRoom[];
  extraItems: WizardItem[];
  cargoItems: CargoItem[];
  addresses: WizardAddress[];
  distanceKm: number;
  estimatedHours: number;
  outOfCity: boolean;
  facadePhotoDataUrls: string[];
  needsStaffReview: boolean;
  notes: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;

  setStep: (n: number) => void;
  setServiceType: (s: ServiceType) => void;
  setJobType: (j: JobType) => void;
  setHomeType: (h: HomeType, rooms: WizardRoom[]) => void;
  renameRoom: (idx: number, name: string) => void;
  setItemQty: (roomIdx: number, itemIdx: number, qty: number) => void;
  addRoomItem: (roomIdx: number, item: WizardItem) => void;
  setExtraQty: (itemIdx: number, qty: number) => void;
  addExtraItem: (item: WizardItem) => void;
  setCargoItems: (items: CargoItem[]) => void;
  setCargoQty: (idx: number, qty: number) => void;
  addCargoItem: (item: CargoItem) => void;
  updateAddress: (idx: number, patch: Partial<WizardAddress>) => void;
  setAddresses: (a: WizardAddress[]) => void;
  set: (patch: Partial<WizardState>) => void;
  reset: () => void;
}

const initial = {
  step: 0,
  serviceType: null as ServiceType | null,
  jobType: null as JobType | null,
  homeType: null as HomeType | null,
  rooms: [] as WizardRoom[],
  extraItems: [] as WizardItem[],
  cargoItems: [] as CargoItem[],
  addresses: [
    { kind: "PICKUP", addressText: "", floor: 0, buildingElevator: false, mobileElevator: false },
    { kind: "DROPOFF", addressText: "", floor: 0, buildingElevator: false, mobileElevator: false },
  ] as WizardAddress[],
  distanceKm: 5,
  estimatedHours: 2,
  outOfCity: false,
  facadePhotoDataUrls: [] as string[],
  needsStaffReview: false,
  notes: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
};

export const useWizard = create<WizardState>((set) => ({
  ...initial,
  setStep: (n) => set({ step: n }),
  setServiceType: (serviceType) => set({ serviceType }),
  setJobType: (jobType) => set({ jobType }),
  setHomeType: (homeType, rooms) => set({ homeType, rooms }),
  renameRoom: (idx, name) =>
    set((s) => ({ rooms: s.rooms.map((r, i) => (i === idx ? { ...r, name } : r)) })),
  setItemQty: (roomIdx, itemIdx, qty) =>
    set((s) => ({
      rooms: s.rooms.map((r, i) =>
        i === roomIdx
          ? { ...r, items: r.items.map((it, j) => (j === itemIdx ? { ...it, qty: Math.max(0, qty) } : it)) }
          : r
      ),
    })),
  addRoomItem: (roomIdx, item) =>
    set((s) => ({
      rooms: s.rooms.map((r, i) => (i === roomIdx ? { ...r, items: [...r.items, item] } : r)),
    })),
  setExtraQty: (itemIdx, qty) =>
    set((s) => ({
      extraItems: s.extraItems.map((it, i) => (i === itemIdx ? { ...it, qty: Math.max(0, qty) } : it)),
    })),
  addExtraItem: (item) => set((s) => ({ extraItems: [...s.extraItems, item] })),
  setCargoItems: (cargoItems) => set({ cargoItems }),
  setCargoQty: (idx, qty) =>
    set((s) => ({
      cargoItems: s.cargoItems.map((it, i) => (i === idx ? { ...it, qty: Math.max(0, qty) } : it)),
    })),
  addCargoItem: (item) => set((s) => ({ cargoItems: [...s.cargoItems, item] })),
  updateAddress: (idx, patch) =>
    set((s) => ({ addresses: s.addresses.map((a, i) => (i === idx ? { ...a, ...patch } : a)) })),
  setAddresses: (addresses) => set({ addresses }),
  set: (patch) => set(patch),
  reset: () => set(initial),
}));
