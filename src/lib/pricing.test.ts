import { describe, expect, it } from "vitest";
import { calculatePrice, type ComboTariff } from "./pricing";
import { canTransition, isPaymentComplete } from "./domain";

const tariff: ComboTariff = {
  truck: {
    minFee: 3000,
    includedKm: 10,
    perExtraKm: 40,
    includedHours: 2,
    perExtraHour: 500,
    perExtraTrip: 1500,
    waitingPerHour: 400,
    outOfCityMultiplier: 1.3,
  },
  elevator: {
    minFee: 2000,
    setupFee: 750,
    extraSetupFee: 500,
    includedHours: 2,
    perExtraHour: 600,
    floorThreshold: 10,
    perExtraFloor: 100,
    rubbleSurcharge: 800,
  },
  comboDiscount: 500,
};

describe("price engine", () => {
  it("truck only: min fee when within included km/hours", () => {
    const r = calculatePrice(tariff, {
      serviceType: "TRUCK_ONLY",
      distanceKm: 8,
      estimatedHours: 2,
    });
    expect(r.total).toBe(3000);
    expect(r.lines).toHaveLength(1);
  });

  it("truck only: extra km and hours billed", () => {
    const r = calculatePrice(tariff, {
      serviceType: "TRUCK_ONLY",
      distanceKm: 25, // 15 extra * 40 = 600
      estimatedHours: 4, // 2 extra * 500 = 1000
    });
    expect(r.total).toBe(3000 + 600 + 1000);
  });

  it("truck only: extra trips and waiting", () => {
    const r = calculatePrice(tariff, {
      serviceType: "TRUCK_ONLY",
      distanceKm: 5,
      estimatedHours: 1,
      extraTrips: 2, // 3000
      waitingHours: 1.5, // 600
    });
    expect(r.total).toBe(3000 + 3000 + 600);
  });

  it("truck only: out-of-city multiplier applies to subtotal", () => {
    const r = calculatePrice(tariff, {
      serviceType: "TRUCK_ONLY",
      distanceKm: 10,
      estimatedHours: 2,
      outOfCity: true,
    });
    // 3000 * 0.3 = 900 ek
    expect(r.total).toBe(3900);
  });

  it("elevator only: setup + extra setups", () => {
    const r = calculatePrice(tariff, {
      serviceType: "ELEVATOR_ONLY",
      distanceKm: 0,
      estimatedHours: 2,
      elevatorSetups: 2,
    });
    // 2000 + 750 + 500
    expect(r.total).toBe(3250);
  });

  it("elevator only: high floor surcharge", () => {
    const r = calculatePrice(tariff, {
      serviceType: "ELEVATOR_ONLY",
      distanceKm: 0,
      estimatedHours: 2,
      elevatorSetups: 1,
      maxFloor: 14, // 4 extra * 100
    });
    expect(r.total).toBe(2000 + 750 + 400);
  });

  it("elevator only: rubble surcharge", () => {
    const r = calculatePrice(tariff, {
      serviceType: "ELEVATOR_ONLY",
      distanceKm: 0,
      estimatedHours: 1,
      elevatorSetups: 1,
      isRubbleOrSpecial: true,
    });
    expect(r.total).toBe(2000 + 750 + 800);
  });

  it("combo: truck + elevator minus discount", () => {
    const r = calculatePrice(tariff, {
      serviceType: "TRUCK_PLUS_ELEVATOR",
      distanceKm: 10,
      estimatedHours: 2,
      elevatorSetups: 1,
    });
    // 3000 + 2000 + 750 - 500
    expect(r.total).toBe(5250);
  });

  it("estimate range brackets the total", () => {
    const r = calculatePrice(tariff, {
      serviceType: "TRUCK_ONLY",
      distanceKm: 10,
      estimatedHours: 2,
    });
    expect(r.estimateMin).toBeLessThanOrEqual(r.total);
    expect(r.estimateMax).toBeGreaterThanOrEqual(r.total);
  });
});

describe("status machine", () => {
  it("follows the CLAUDE.md flow", () => {
    expect(canTransition("NEW_REQUEST", "PRICING")).toBe(true);
    expect(canTransition("PRICING", "QUOTE_SENT")).toBe(true);
    expect(canTransition("QUOTE_SENT", "APPROVED")).toBe(true);
    expect(canTransition("APPROVED", "RESERVED")).toBe(true);
    expect(canTransition("RESERVED", "EN_ROUTE")).toBe(true);
    expect(canTransition("ON_SITE", "AWAITING_PAYMENT")).toBe(true);
    expect(canTransition("AWAITING_PAYMENT", "IN_PROGRESS")).toBe(true);
    expect(canTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
  });

  it("blocks skipping payment", () => {
    expect(canTransition("ON_SITE", "IN_PROGRESS")).toBe(false);
    expect(canTransition("RESERVED", "IN_PROGRESS")).toBe(false);
  });

  it("allows cancel from active states but not from terminal", () => {
    expect(canTransition("QUOTE_SENT", "CANCELLED")).toBe(true);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
    expect(canTransition("CANCELLED", "CANCELLED")).toBe(false);
  });
});

describe("payment lock", () => {
  it("only PAID unlocks work start", () => {
    expect(isPaymentComplete("PAID")).toBe(true);
    expect(isPaymentComplete("PENDING")).toBe(false);
    expect(isPaymentComplete("AUTHORIZED")).toBe(false);
    expect(isPaymentComplete(null)).toBe(false);
  });
});
