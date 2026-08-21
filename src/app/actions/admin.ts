"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { isPanelAuthed } from "@/lib/panel-auth";
import { transitionJob, TransitionError } from "@/lib/jobs";
import type { JobStatus } from "@/lib/domain";

type Result = { ok: boolean; error?: string };

async function guard(): Promise<Result | null> {
  if (!(await isPanelAuthed())) return { ok: false, error: "Yetkisiz" };
  return null;
}

export async function adminTransition(jobId: string, to: JobStatus): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await transitionJob(jobId, to, { actor: "admin" });
  } catch (e) {
    if (e instanceof TransitionError) return { ok: false, error: e.message };
    throw e;
  }
  revalidatePath("/admin");
  return { ok: true };
}

const quoteLineSchema = z.object({ label: z.string().min(1), amount: z.number() });

export async function sendFinalQuote(
  jobId: string,
  lines: Array<{ label: string; amount: number }>
): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = z.array(quoteLineSchema).min(1).safeParse(lines);
  if (!parsed.success) return { ok: false, error: "Geçersiz teklif kalemleri" };

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return { ok: false, error: "İş bulunamadı" };

  const total = parsed.data.reduce((s, l) => s + l.amount, 0);
  if (total <= 0) return { ok: false, error: "Toplam sıfırdan büyük olmalı" };

  // Eski gönderilmiş kesin teklifleri geçersiz kıl
  await prisma.quote.updateMany({
    where: { jobId, kind: "FINAL", status: "SENT" },
    data: { status: "EXPIRED" },
  });

  const quote = await prisma.quote.create({
    data: {
      jobId,
      kind: "FINAL",
      status: "SENT",
      totalMin: total,
      totalMax: total,
      createdBy: "admin",
      lines: { create: parsed.data.map((l, i) => ({ label: l.label, amount: l.amount, sortNo: i })) },
    },
  });
  await audit("Quote", quote.id, "create", { actor: "admin", after: { total, kind: "FINAL" } });

  try {
    if (job.status === "NEW_REQUEST") {
      await transitionJob(jobId, "PRICING", { actor: "admin" });
      await transitionJob(jobId, "QUOTE_SENT", { actor: "admin" });
    } else if (job.status === "AWAITING_INFO" || job.status === "PRICING") {
      if (job.status === "AWAITING_INFO") await transitionJob(jobId, "PRICING", { actor: "admin" });
      await transitionJob(jobId, "QUOTE_SENT", { actor: "admin" });
    } else if (job.status === "QUOTE_SENT") {
      // yeni teklif gönderildi; durum zaten uygun
    } else {
      return { ok: false, error: `Bu durumda teklif gönderilemez: ${job.status}` };
    }
  } catch (e) {
    if (e instanceof TransitionError) return { ok: false, error: e.message };
    throw e;
  }

  revalidatePath(`/admin/talepler/${jobId}`);
  return { ok: true };
}

export async function confirmTransferPayment(paymentId: string): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: false, error: "Ödeme bulunamadı" };
  if (payment.status !== "PENDING") return { ok: false, error: "Ödeme beklemede değil" };

  await prisma.payment.update({ where: { id: paymentId }, data: { status: "PAID" } });
  await prisma.paymentEvent.create({
    data: { paymentId, type: "MANUAL_CONFIRMED", detail: "Havale/EFT admin tarafından onaylandı" },
  });
  await audit("Payment", paymentId, "update", {
    actor: "admin",
    before: { status: "PENDING" },
    after: { status: "PAID" },
  });

  revalidatePath(`/admin/talepler/${payment.jobId}`);
  return { ok: true };
}

export async function assignJob(
  jobId: string,
  input: { vehicleId?: string; operatorId?: string; date: string }
): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;

  const date = new Date(input.date);
  if (isNaN(date.getTime())) return { ok: false, error: "Geçersiz tarih" };

  await prisma.assignment.create({
    data: {
      jobId,
      vehicleId: input.vehicleId || null,
      operatorId: input.operatorId || null,
      date,
    },
  });
  await prisma.job.update({ where: { id: jobId }, data: { scheduledDate: date } });
  await audit("Job", jobId, "update", { actor: "admin", after: { scheduledDate: input.date } });

  revalidatePath(`/admin/talepler/${jobId}`);
  return { ok: true };
}

const tariffSchema = z.object({
  name: z.string().min(1),
  minFee: z.number().min(0),
  includedKm: z.number().min(0),
  perExtraKm: z.number().min(0),
  includedHours: z.number().min(0),
  perExtraHour: z.number().min(0),
  perExtraTrip: z.number().min(0),
  waitingPerHour: z.number().min(0),
  outOfCityMultiplier: z.number().min(1),
  setupFee: z.number().min(0),
  extraSetupFee: z.number().min(0),
  floorThreshold: z.number().int().min(0),
  perExtraFloor: z.number().min(0),
  rubbleSurcharge: z.number().min(0),
  comboDiscount: z.number().min(0),
});
export type TariffInput = z.infer<typeof tariffSchema>;

export async function updateTariff(id: string, input: TariffInput): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = tariffSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz tarife değerleri" };

  const before = await prisma.tariff.findUnique({ where: { id } });
  if (!before) return { ok: false, error: "Tarife bulunamadı" };

  await prisma.tariff.update({ where: { id }, data: parsed.data });
  await audit("Tariff", id, "price_change", { actor: "admin", before, after: parsed.data });

  revalidatePath("/admin/tarifeler");
  return { ok: true };
}

const catalogItemSchema = z.object({
  scope: z.enum(["ROOM_TEMPLATE", "CARGO", "EXTRA"]),
  groupKey: z.string().min(1),
  name: z.string().min(1),
  defaultQty: z.number().int().min(0),
  unit: z.string().min(1),
  approxWeight: z.number().nullable(),
});

export async function createCatalogItem(input: z.infer<typeof catalogItemSchema>): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = catalogItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Geçersiz kalem" };
  const item = await prisma.catalogItem.create({ data: parsed.data });
  await audit("CatalogItem", item.id, "create", { actor: "admin", after: parsed.data });
  revalidatePath("/admin/sablonlar");
  return { ok: true };
}

export async function toggleCatalogItem(id: string, active: boolean): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  await prisma.catalogItem.update({ where: { id }, data: { active } });
  await audit("CatalogItem", id, "update", { actor: "admin", after: { active } });
  revalidatePath("/admin/sablonlar");
  return { ok: true };
}

export async function deleteCatalogItem(id: string): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  const before = await prisma.catalogItem.findUnique({ where: { id } });
  await prisma.catalogItem.delete({ where: { id } });
  await audit("CatalogItem", id, "delete", { actor: "admin", before });
  revalidatePath("/admin/sablonlar");
  return { ok: true };
}
