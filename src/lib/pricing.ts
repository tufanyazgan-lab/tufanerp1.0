import type { ServiceType } from "./domain";

// Tarife değerleri DB'den gelir (admin yönetimli); bu motor pure hesap yapar.
export interface TruckTariff {
  minFee: number;
  includedKm: number;
  perExtraKm: number;
  includedHours: number;
  perExtraHour: number;
  perExtraTrip: number;
  waitingPerHour: number;
  outOfCityMultiplier: number;
}

export interface ElevatorTariff {
  minFee: number;
  setupFee: number;
  extraSetupFee: number;
  includedHours: number;
  perExtraHour: number;
  floorThreshold: number;
  perExtraFloor: number;
  rubbleSurcharge: number;
}

export interface ComboTariff {
  truck: TruckTariff;
  elevator: ElevatorTariff;
  comboDiscount: number;
}

export interface PriceInput {
  serviceType: ServiceType;
  distanceKm: number;
  estimatedHours: number;
  extraTrips?: number;
  waitingHours?: number;
  outOfCity?: boolean;
  elevatorSetups?: number; // kaç adreste kurulum (0 => asansör yoksa)
  maxFloor?: number; // asansör kurulacak en yüksek kat
  isRubbleOrSpecial?: boolean;
}

export interface PriceLine {
  label: string;
  amount: number;
}

export interface PriceResult {
  lines: PriceLine[];
  total: number;
  // Tahmini aralık: müşteriye ilk aşamada gösterilir; kesin fiyat personel onayıyla verilir.
  estimateMin: number;
  estimateMax: number;
}

const round = (n: number) => Math.round(n * 100) / 100;

export function priceTruck(t: TruckTariff, input: PriceInput): PriceLine[] {
  const lines: PriceLine[] = [{ label: "Araç minimum hizmet bedeli", amount: t.minFee }];

  const extraKm = Math.max(0, input.distanceKm - t.includedKm);
  if (extraKm > 0) lines.push({ label: `Ek km (${round(extraKm)} km)`, amount: round(extraKm * t.perExtraKm) });

  const extraHours = Math.max(0, input.estimatedHours - t.includedHours);
  if (extraHours > 0) lines.push({ label: `Ek süre (${round(extraHours)} saat)`, amount: round(extraHours * t.perExtraHour) });

  const trips = input.extraTrips ?? 0;
  if (trips > 0) lines.push({ label: `Ek sefer (${trips})`, amount: round(trips * t.perExtraTrip) });

  const waiting = input.waitingHours ?? 0;
  if (waiting > 0) lines.push({ label: `Bekleme (${waiting} saat)`, amount: round(waiting * t.waitingPerHour) });

  if (input.outOfCity && t.outOfCityMultiplier > 1) {
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    lines.push({
      label: `Şehir dışı katsayısı (x${t.outOfCityMultiplier})`,
      amount: round(subtotal * (t.outOfCityMultiplier - 1)),
    });
  }

  return lines;
}

export function priceElevator(t: ElevatorTariff, input: PriceInput): PriceLine[] {
  const lines: PriceLine[] = [{ label: "Asansör minimum hizmet bedeli", amount: t.minFee }];

  const setups = input.elevatorSetups ?? 1;
  if (setups >= 1) lines.push({ label: "Kurulum", amount: t.setupFee });
  if (setups > 1) lines.push({ label: `Ek kurulum (${setups - 1})`, amount: round((setups - 1) * t.extraSetupFee) });

  const extraHours = Math.max(0, input.estimatedHours - t.includedHours);
  if (extraHours > 0) lines.push({ label: `Asansör ek süre (${round(extraHours)} saat)`, amount: round(extraHours * t.perExtraHour) });

  const maxFloor = input.maxFloor ?? 0;
  if (maxFloor > t.floorThreshold) {
    const extraFloors = maxFloor - t.floorThreshold;
    lines.push({ label: `Yüksek kat (${extraFloors} kat)`, amount: round(extraFloors * t.perExtraFloor) });
  }

  if (input.isRubbleOrSpecial && t.rubbleSurcharge > 0) {
    lines.push({ label: "Moloz / özel yük ek ücreti", amount: t.rubbleSurcharge });
  }

  return lines;
}

export function calculatePrice(tariff: ComboTariff, input: PriceInput): PriceResult {
  let lines: PriceLine[] = [];

  if (input.serviceType === "TRUCK_ONLY") {
    lines = priceTruck(tariff.truck, input);
  } else if (input.serviceType === "ELEVATOR_ONLY") {
    lines = priceElevator(tariff.elevator, input);
  } else {
    lines = [...priceTruck(tariff.truck, input), ...priceElevator(tariff.elevator, input)];
    if (tariff.comboDiscount > 0) {
      lines.push({ label: "Araç + asansör paket indirimi", amount: -tariff.comboDiscount });
    }
  }

  const total = round(lines.reduce((s, l) => s + l.amount, 0));
  // Tahmini aralık: -%5 / +%15 — kesin fiyat personel kontrolünden sonra verilir.
  return {
    lines,
    total,
    estimateMin: round(total * 0.95),
    estimateMax: round(total * 1.15),
  };
}
