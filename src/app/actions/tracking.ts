"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { transitionJob, TransitionError } from "@/lib/jobs";
import { getCardProvider } from "@/lib/payments";
import type { PaymentMethod } from "@/lib/domain";

export async function acceptQuote(code: string): Promise<{ ok: boolean; error?: string }> {
  const job = await prisma.job.findUnique({ where: { code }, include: { quotes: true } });
  if (!job) return { ok: false, error: "Talep bulunamadı" };
  if (job.status !== "QUOTE_SENT") return { ok: false, error: "Onaylanacak teklif yok" };

  const quote = job.quotes.find((q) => q.kind === "FINAL" && q.status === "SENT");
  if (!quote) return { ok: false, error: "Gönderilmiş kesin teklif bulunamadı" };

  try {
    await prisma.quote.update({ where: { id: quote.id }, data: { status: "ACCEPTED" } });
    await transitionJob(job.id, "APPROVED", { actor: "customer" });
    await transitionJob(job.id, "RESERVED", { actor: "system", detail: "Teklif onayı ile rezervasyon kesinleşti" });
    await audit("Quote", quote.id, "update", { actor: "customer", after: { status: "ACCEPTED" } });
  } catch (e) {
    if (e instanceof TransitionError) return { ok: false, error: e.message };
    throw e;
  }
  revalidatePath(`/takip/${code}`);
  return { ok: true };
}

export async function payForJob(
  code: string,
  method: PaymentMethod
): Promise<{ ok: boolean; error?: string }> {
  const job = await prisma.job.findUnique({
    where: { code },
    include: { quotes: true, payments: true },
  });
  if (!job) return { ok: false, error: "Talep bulunamadı" };

  const payableStatuses = ["RESERVED", "EN_ROUTE", "ON_SITE", "AWAITING_PAYMENT"];
  if (!payableStatuses.includes(job.status)) {
    return { ok: false, error: "Bu aşamada ödeme yapılamaz" };
  }
  if (job.payments.some((p) => p.status === "PAID")) {
    return { ok: false, error: "Ödeme zaten tamamlandı" };
  }

  const finalQuote = job.quotes.find((q) => q.kind === "FINAL" && q.status === "ACCEPTED");
  if (!finalQuote) return { ok: false, error: "Onaylanmış kesin teklif yok" };
  const amount = finalQuote.totalMax;

  if (method === "CARD") {
    const provider = getCardProvider();
    const result = await provider.charge({
      amount,
      currency: "TRY",
      description: `${job.code} taşıma hizmeti`,
    });
    if (!result.success) return { ok: false, error: result.error ?? "Ödeme başarısız" };

    const payment = await prisma.payment.create({
      data: {
        jobId: job.id,
        method: "CARD",
        status: "PAID",
        amount,
        reference: result.reference,
        events: {
          create: [
            { type: "CREATED" },
            { type: "CAPTURED", detail: `provider=${provider.name} ref=${result.reference}` },
          ],
        },
      },
    });
    await audit("Payment", payment.id, "create", { actor: "customer", after: { method, status: "PAID", amount } });
  } else {
    // Havale/EFT: müşteri bildirir, admin manuel onaylar (PENDING).
    const existing = job.payments.find((p) => p.method === "TRANSFER" && p.status === "PENDING");
    if (!existing) {
      const payment = await prisma.payment.create({
        data: {
          jobId: job.id,
          method: "TRANSFER",
          status: "PENDING",
          amount,
          events: { create: [{ type: "CREATED", detail: "Müşteri havale bildirimi" }] },
        },
      });
      await audit("Payment", payment.id, "create", { actor: "customer", after: { method, status: "PENDING", amount } });
    }
  }

  revalidatePath(`/takip/${code}`);
  return { ok: true };
}
