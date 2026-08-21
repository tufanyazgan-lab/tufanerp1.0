"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adminTransition,
  assignJob,
  confirmTransferPayment,
  sendFinalQuote,
} from "@/app/actions/admin";
import { JOB_STATUS_LABELS, JOB_STATUS_TRANSITIONS, type JobStatus } from "@/lib/domain";

const TRY = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export function JobAdminActions({
  jobId,
  status,
  suggestedLines,
  pendingTransferId,
  vehicles,
  operators,
  assignments,
}: {
  jobId: string;
  status: JobStatus;
  suggestedLines: Array<{ label: string; amount: number }>;
  pendingTransferId: string | null;
  vehicles: Array<{ id: string; name: string }>;
  operators: Array<{ id: string; name: string }>;
  assignments: Array<{ id: string; date: string; vehicle: string | null; operator: string | null }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState(suggestedLines);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [date, setDate] = useState("");

  const nextStatuses = [...JOB_STATUS_TRANSITIONS[status]];
  if (status !== "COMPLETED" && status !== "CANCELLED") nextStatuses.push("CANCELLED");

  const canQuote = ["NEW_REQUEST", "AWAITING_INFO", "PRICING", "QUOTE_SENT"].includes(status);
  const total = lines.reduce((s, l) => s + l.amount, 0);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Hata oluştu");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {canQuote && (
        <Card>
          <CardHeader>
            <CardTitle>Kesin Teklif Gönder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!showQuoteForm ? (
              <Button variant="outline" onClick={() => setShowQuoteForm(true)}>
                Tarifeden Teklif Oluştur
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">
                  Kalemler tarifeden hesaplandı; gerekiyorsa düzeltin. Operatör keyfi fiyat yazamaz — kalemler
                  tarife kaynaklıdır.
                </p>
                {lines.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={l.label}
                      onChange={(e) =>
                        setLines(lines.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                      }
                      className="h-9 flex-1 text-xs"
                    />
                    <Input
                      type="number"
                      value={l.amount}
                      onChange={(e) =>
                        setLines(lines.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))
                      }
                      className="h-9 w-28 text-right text-xs"
                    />
                    <button
                      type="button"
                      className="text-xs text-red-500"
                      onClick={() => setLines(lines.filter((_, j) => j !== i))}
                    >
                      Sil
                    </button>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLines([...lines, { label: "Ek hizmet", amount: 0 }])}
                >
                  + Kalem Ekle
                </Button>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-semibold">Toplam: {TRY.format(total)}</span>
                  <Button
                    disabled={pending || total <= 0}
                    onClick={() => run(() => sendFinalQuote(jobId, lines))}
                  >
                    {pending ? "Gönderiliyor..." : "Teklifi Gönder"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {pendingTransferId && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-sm">Bekleyen havale bildirimi var.</p>
            <Button disabled={pending} onClick={() => run(() => confirmTransferPayment(pendingTransferId))}>
              Havaleyi Onayla
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Planlama</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {assignments.map((a) => (
            <p key={a.id} className="text-xs text-slate-600">
              {new Date(a.date).toLocaleString("tr-TR")} · {a.vehicle ?? "araç yok"} · {a.operator ?? "operatör yok"}
            </p>
          ))}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <Label>Tarih</Label>
              <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Araç</Label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">Seçin</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Operatör</Label>
              <select
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="">Seçin</option>
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button
            variant="outline"
            disabled={pending || !date}
            onClick={() => run(() => assignJob(jobId, { vehicleId, operatorId, date }))}
          >
            Ata / Planla
          </Button>
        </CardContent>
      </Card>

      {nextStatuses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Durum Değiştir</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {nextStatuses.map((s) => (
              <Button
                key={s}
                variant={s === "CANCELLED" ? "destructive" : "outline"}
                size="sm"
                disabled={pending}
                onClick={() => run(() => adminTransition(jobId, s))}
              >
                {JOB_STATUS_LABELS[s]}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
