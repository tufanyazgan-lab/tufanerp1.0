"use server";

import { revalidatePath } from "next/cache";
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

export async function operatorTransition(
  jobId: string,
  to: JobStatus,
  gps?: { lat: number; lng: number }
): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await transitionJob(jobId, to, {
      actor: "operator",
      lat: gps?.lat,
      lng: gps?.lng,
      detail: gps ? "GPS kaydı ile" : undefined,
    });
  } catch (e) {
    if (e instanceof TransitionError) return { ok: false, error: e.message };
    throw e;
  }
  revalidatePath(`/operator/${jobId}`);
  return { ok: true };
}

export async function recordArrival(jobId: string, gps: { lat: number; lng: number } | null): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await transitionJob(jobId, "ON_SITE", {
      actor: "operator",
      lat: gps?.lat,
      lng: gps?.lng,
      detail: gps ? "Konuma geldim (GPS)" : "Konuma geldim (GPS alınamadı)",
    });
    // Konumda -> ödeme kontrolü aşamasına otomatik geç
    await transitionJob(jobId, "AWAITING_PAYMENT", { actor: "system" });
  } catch (e) {
    if (e instanceof TransitionError) return { ok: false, error: e.message };
    throw e;
  }
  revalidatePath(`/operator/${jobId}`);
  return { ok: true };
}

export async function uploadJobPhotos(
  jobId: string,
  kind: "BEFORE" | "AFTER",
  dataUrls: string[]
): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  if (dataUrls.length === 0) return { ok: false, error: "Fotoğraf yok" };

  for (const url of dataUrls) {
    await prisma.photo.create({ data: { jobId, kind, dataUrl: url } });
  }
  await prisma.jobEvent.create({
    data: { jobId, type: "NOTE", detail: `${dataUrls.length} adet ${kind === "BEFORE" ? "öncesi" : "sonrası"} fotoğrafı`, actor: "operator" },
  });
  revalidatePath(`/operator/${jobId}`);
  return { ok: true };
}

// Ek hizmetler tarifeden gelir; operatör keyfi tutar giremez (CLAUDE.md #7).
const EXTRA_KINDS = ["EXTRA_HOUR", "EXTRA_TRIP", "EXTRA_SETUP", "WAITING"] as const;
export type ExtraKind = (typeof EXTRA_KINDS)[number];

export async function addExtraService(jobId: string, kind: ExtraKind, qty: number): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  if (!EXTRA_KINDS.includes(kind) || qty <= 0) return { ok: false, error: "Geçersiz ek hizmet" };

  const tariff = await prisma.tariff.findFirst({ where: { active: true, kind: "COMBO" } });
  if (!tariff) return { ok: false, error: "Aktif tarife yok" };

  const unitPrice =
    kind === "EXTRA_HOUR"
      ? tariff.perExtraHour
      : kind === "EXTRA_TRIP"
        ? tariff.perExtraTrip
        : kind === "EXTRA_SETUP"
          ? tariff.extraSetupFee
          : tariff.waitingPerHour;
  const label =
    kind === "EXTRA_HOUR" ? "Ek süre" : kind === "EXTRA_TRIP" ? "Ek sefer" : kind === "EXTRA_SETUP" ? "Ek kurulum" : "Bekleme";
  const amount = unitPrice * qty;

  const quote = await prisma.quote.findFirst({
    where: { jobId, kind: "FINAL", status: "ACCEPTED" },
    orderBy: { createdAt: "desc" },
  });
  if (!quote) return { ok: false, error: "Onaylanmış kesin teklif yok" };

  await prisma.quoteLine.create({
    data: { quoteId: quote.id, label: `${label} (${qty})`, amount, sortNo: 99 },
  });
  await prisma.quote.update({
    where: { id: quote.id },
    data: { totalMin: quote.totalMin + amount, totalMax: quote.totalMax + amount },
  });
  await prisma.jobEvent.create({
    data: { jobId, type: "EXTRA_SERVICE", detail: `${label} x${qty} = ${amount} TL (tarifeden)`, actor: "operator" },
  });
  await audit("Quote", quote.id, "price_change", {
    actor: "operator",
    before: { total: quote.totalMax },
    after: { total: quote.totalMax + amount, added: `${label} x${qty}` },
  });

  revalidatePath(`/operator/${jobId}`);
  return { ok: true };
}
