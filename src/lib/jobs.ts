import { prisma } from "./db";
import { audit } from "./audit";
import { canTransition, isPaymentComplete, type JobStatus } from "./domain";

export class TransitionError extends Error {}

export async function transitionJob(
  jobId: string,
  to: JobStatus,
  opts: { actor?: string; detail?: string; lat?: number; lng?: number } = {}
) {
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId }, include: { payments: true } });
  const from = job.status as JobStatus;

  if (!canTransition(from, to)) {
    throw new TransitionError(`Geçersiz durum geçişi: ${from} -> ${to}`);
  }

  // Temel iş kuralı: ödeme tamamlanmadan iş başlatılmaz (CLAUDE.md #8).
  if (to === "IN_PROGRESS") {
    const paid = job.payments.some((p) => isPaymentComplete(p.status));
    if (!paid) throw new TransitionError("Ödeme tamamlanmadan iş başlatılamaz.");
  }

  const updated = await prisma.job.update({ where: { id: jobId }, data: { status: to } });

  await prisma.jobEvent.create({
    data: {
      jobId,
      type: "STATUS_CHANGE",
      fromStatus: from,
      toStatus: to,
      detail: opts.detail,
      lat: opts.lat,
      lng: opts.lng,
      actor: opts.actor,
    },
  });
  await audit("Job", jobId, "status_change", {
    actor: opts.actor,
    before: { status: from },
    after: { status: to },
  });

  return updated;
}

export function generateJobCode(): string {
  const s = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TAS-${s}`;
}
