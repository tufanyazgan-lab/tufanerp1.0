"use server";

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { generateJobCode } from "@/lib/jobs";
import { leadSubmitSchema, type LeadSubmit } from "@/lib/wizard-types";
import { calculatePrice, type ComboTariff, type PriceResult } from "@/lib/pricing";

export interface LeadResult {
  ok: boolean;
  code?: string;
  jobId?: string;
  estimate?: { min: number; max: number };
  error?: string;
}

async function loadActiveComboTariff(): Promise<{ id: string; tariff: ComboTariff } | null> {
  const t = await prisma.tariff.findFirst({ where: { active: true, kind: "COMBO" } });
  if (!t) return null;
  return {
    id: t.id,
    tariff: {
      truck: {
        minFee: t.minFee,
        includedKm: t.includedKm,
        perExtraKm: t.perExtraKm,
        includedHours: t.includedHours,
        perExtraHour: t.perExtraHour,
        perExtraTrip: t.perExtraTrip,
        waitingPerHour: t.waitingPerHour,
        outOfCityMultiplier: t.outOfCityMultiplier,
      },
      elevator: {
        minFee: t.kind === "COMBO" ? 0 : t.minFee, // combo tarifede asansör min ücreti kurulumla temsil edilir
        setupFee: t.setupFee,
        extraSetupFee: t.extraSetupFee,
        includedHours: t.includedHours,
        perExtraHour: t.perExtraHour,
        floorThreshold: t.floorThreshold,
        perExtraFloor: t.perExtraFloor,
        rubbleSurcharge: t.rubbleSurcharge,
      },
      comboDiscount: t.comboDiscount,
    },
  };
}

export async function estimateLead(input: LeadSubmit): Promise<PriceResult | null> {
  const parsed = leadSubmitSchema.safeParse(input);
  if (!parsed.success) return null;
  const data = parsed.data;

  const loaded = await loadActiveComboTariff();
  if (!loaded) return null;

  const elevatorSetups = data.addresses.filter((a) => a.mobileElevator).length;
  const maxFloor = Math.max(0, ...data.addresses.map((a) => a.floor));

  return calculatePrice(loaded.tariff, {
    serviceType: data.serviceType,
    distanceKm: data.distanceKm,
    estimatedHours: data.estimatedHours,
    outOfCity: data.outOfCity,
    elevatorSetups: elevatorSetups || (data.serviceType !== "TRUCK_ONLY" ? 1 : 0),
    maxFloor,
    isRubbleOrSpecial: data.jobType === "RUBBLE" || data.needsStaffReview,
  });
}

export async function submitLead(input: LeadSubmit): Promise<LeadResult> {
  const parsed = leadSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join(", ") };
  }
  const data = parsed.data;

  const customer = await prisma.customer.upsert({
    where: { phone: data.customer.phone },
    update: { name: data.customer.name, email: data.customer.email || null },
    create: {
      name: data.customer.name,
      phone: data.customer.phone,
      email: data.customer.email || null,
    },
  });

  const estimate = await estimateLead(data);

  const elevatorSetups = data.addresses.filter((a) => a.mobileElevator).length;
  const totalWeight =
    [...data.rooms.flatMap((r) => r.items), ...data.extraItems, ...data.cargoItems].reduce(
      (s, it) => s + (it.approxWeight ?? 0) * it.qty,
      0
    ) || null;

  const job = await prisma.job.create({
    data: {
      code: generateJobCode(),
      customerId: customer.id,
      serviceType: data.serviceType,
      jobType: data.jobType,
      status: "NEW_REQUEST",
      homeType: data.homeType ?? null,
      distanceKm: data.distanceKm,
      estimatedHours: data.estimatedHours,
      elevatorSetups,
      outOfCity: data.outOfCity,
      estimatedWeight: totalWeight,
      needsStaffReview: data.needsStaffReview,
      notes: data.notes,
      addresses: {
        create: data.addresses.map((a) => ({
          kind: a.kind,
          addressText: a.addressText,
          floor: a.floor,
          buildingElevator: a.buildingElevator,
          mobileElevator: a.mobileElevator,
          truckAccess: a.truckAccess,
        })),
      },
    },
  });

  for (const room of data.rooms) {
    const created = await prisma.room.create({
      data: { jobId: job.id, name: room.name },
    });
    for (const item of room.items) {
      if (item.qty <= 0) continue;
      const jobItem = await prisma.jobItem.create({
        data: {
          jobId: job.id,
          roomId: created.id,
          name: item.name,
          qty: item.qty,
          unit: item.unit,
          dimensions: item.dimensions,
          approxWeight: item.approxWeight,
          isCustom: item.isCustom,
          fragile: item.fragile,
        },
      });
      for (const url of item.photoDataUrls) {
        await prisma.photo.create({
          data: { jobId: job.id, jobItemId: jobItem.id, kind: "ITEM", dataUrl: url },
        });
      }
    }
  }

  for (const item of data.extraItems) {
    if (item.qty <= 0) continue;
    const jobItem = await prisma.jobItem.create({
      data: {
        jobId: job.id,
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        dimensions: item.dimensions,
        approxWeight: item.approxWeight,
        isCustom: item.isCustom,
        fragile: item.fragile,
      },
    });
    for (const url of item.photoDataUrls) {
      await prisma.photo.create({
        data: { jobId: job.id, jobItemId: jobItem.id, kind: "ITEM", dataUrl: url },
      });
    }
  }

  for (const item of data.cargoItems) {
    if (item.qty <= 0) continue;
    const jobItem = await prisma.jobItem.create({
      data: {
        jobId: job.id,
        categoryKey: item.categoryKey,
        name: item.name,
        qty: item.qty,
        unit: item.unit,
        dimensions: item.dimensions,
        approxWeight: item.approxWeight,
        isCustom: item.isCustom,
        fragile: item.fragile,
      },
    });
    for (const url of item.photoDataUrls) {
      await prisma.photo.create({
        data: { jobId: job.id, jobItemId: jobItem.id, kind: "ITEM", dataUrl: url },
      });
    }
  }

  for (const url of data.facadePhotoDataUrls) {
    await prisma.photo.create({ data: { jobId: job.id, kind: "FACADE", dataUrl: url } });
  }

  if (estimate) {
    const loaded = await loadActiveComboTariff();
    await prisma.quote.create({
      data: {
        jobId: job.id,
        tariffId: loaded?.id,
        kind: "ESTIMATE",
        status: "DRAFT",
        totalMin: estimate.estimateMin,
        totalMax: estimate.estimateMax,
        lines: {
          create: estimate.lines.map((l, i) => ({ label: l.label, amount: l.amount, sortNo: i })),
        },
      },
    });
  }

  await prisma.jobEvent.create({
    data: { jobId: job.id, type: "STATUS_CHANGE", toStatus: "NEW_REQUEST", actor: "customer" },
  });
  await audit("Job", job.id, "create", { actor: "customer", after: { code: job.code } });

  return {
    ok: true,
    code: job.code,
    jobId: job.id,
    estimate: estimate ? { min: estimate.estimateMin, max: estimate.estimateMax } : undefined,
  };
}
