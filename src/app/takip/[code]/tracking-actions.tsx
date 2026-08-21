"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptQuote, payForJob } from "@/app/actions/tracking";
import { TRANSFER_INSTRUCTIONS } from "@/lib/payments";
import type { JobStatus, PaymentMethod } from "@/lib/domain";

export function TrackingActions({
  code,
  status,
  hasFinalQuoteSent,
  hasAcceptedQuote,
  paid,
  pendingTransfer,
}: {
  code: string;
  status: JobStatus;
  hasFinalQuoteSent: boolean;
  hasAcceptedQuote: boolean;
  paid: boolean;
  pendingTransfer: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Bir hata oluştu");
      router.refresh();
    });
  }

  const canPay =
    !paid && hasAcceptedQuote && ["RESERVED", "EN_ROUTE", "ON_SITE", "AWAITING_PAYMENT"].includes(status);

  return (
    <div className="space-y-4">
      {status === "QUOTE_SENT" && hasFinalQuoteSent && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm text-slate-600">
              Teklifi onayladığınızda rezervasyonunuz kesinleşir.
            </p>
            <Button className="w-full" disabled={pending} onClick={() => run(() => acceptQuote(code))}>
              {pending ? "İşleniyor..." : "Teklifi Onayla"}
            </Button>
          </CardContent>
        </Card>
      )}

      {canPay && (
        <Card>
          <CardHeader>
            <CardTitle>Ödeme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-500">
              Hizmet bedeli işe başlamadan önce tahsil edilir. Ödeme tamamlanmadan hizmet başlatılmaz.
            </p>
            {pendingTransfer && (
              <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                Havale bildiriminiz alındı; onay bekleniyor. Onaylandığında burada görünecektir.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod("CARD")}
                className={`rounded-xl border p-3 text-sm font-medium ${
                  method === "CARD" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"
                }`}
              >
                Kredi / Banka Kartı
              </button>
              <button
                type="button"
                onClick={() => setMethod("TRANSFER")}
                className={`rounded-xl border p-3 text-sm font-medium ${
                  method === "TRANSFER" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white"
                }`}
              >
                Havale / EFT
              </button>
            </div>

            {method === "TRANSFER" && (
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold">{TRANSFER_INSTRUCTIONS.bank}</p>
                <p className="font-mono">{TRANSFER_INSTRUCTIONS.iban}</p>
                <p>{TRANSFER_INSTRUCTIONS.holder}</p>
                <p className="mt-1">{TRANSFER_INSTRUCTIONS.note}</p>
              </div>
            )}

            {method && (
              <Button
                className="w-full"
                disabled={pending || (method === "TRANSFER" && pendingTransfer)}
                onClick={() => run(() => payForJob(code, method))}
              >
                {pending
                  ? "İşleniyor..."
                  : method === "CARD"
                    ? "Kartla Öde"
                    : "Havale Yaptım, Bildir"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
