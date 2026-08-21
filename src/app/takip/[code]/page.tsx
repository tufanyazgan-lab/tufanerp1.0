import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
  type JobStatus,
  type JobType,
  type PaymentMethod,
  type PaymentStatus,
  type ServiceType,
} from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackingActions } from "./tracking-actions";

export const dynamic = "force-dynamic";

const TRY = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export default async function TrackingDetail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const job = await prisma.job.findUnique({
    where: { code: decodeURIComponent(code).toUpperCase() },
    include: {
      customer: true,
      quotes: { include: { lines: { orderBy: { sortNo: "asc" } } }, orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 20 },
      addresses: true,
    },
  });
  if (!job) notFound();

  const status = job.status as JobStatus;
  const finalQuote = job.quotes.find((q) => q.kind === "FINAL" && ["SENT", "ACCEPTED"].includes(q.status));
  const estimate = job.quotes.find((q) => q.kind === "ESTIMATE");
  const paid = job.payments.some((p) => p.status === "PAID");
  const pendingTransfer = job.payments.some((p) => p.method === "TRANSFER" && p.status === "PENDING");

  const flowStatuses = JOB_STATUSES.filter((s) => s !== "CANCELLED");
  const currentIdx = flowStatuses.indexOf(status as (typeof flowStatuses)[number]);

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4 pb-12">
      <header className="flex items-center justify-between pt-4">
        <div>
          <p className="text-xs text-slate-500">Takip kodu</p>
          <h1 className="font-mono text-xl font-bold">{job.code}</h1>
        </div>
        <Badge variant={status === "COMPLETED" ? "success" : status === "CANCELLED" ? "destructive" : "secondary"}>
          {JOB_STATUS_LABELS[status]}
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Talep Özeti</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{SERVICE_TYPE_LABELS[job.serviceType as ServiceType]}</p>
          <p className="text-slate-600">{JOB_TYPE_LABELS[job.jobType as JobType]}{job.homeType ? ` · ${job.homeType}` : ""}</p>
          {job.addresses.map((a) => (
            <p key={a.id} className="text-xs text-slate-500">
              {a.kind === "PICKUP" ? "Alış: " : "Teslim: "}
              {a.addressText || "-"} (Kat {a.floor}
              {a.mobileElevator ? ", mobil asansör" : ""})
            </p>
          ))}
        </CardContent>
      </Card>

      {status === "CANCELLED" ? (
        <Card>
          <CardContent className="p-4 text-sm text-red-600">Bu talep iptal edilmiştir.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Süreç</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {flowStatuses.map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      i < currentIdx
                        ? "bg-emerald-500 text-white"
                        : i === currentIdx
                          ? "bg-slate-900 text-white"
                          : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={i === currentIdx ? "font-semibold" : "text-slate-500"}>
                    {JOB_STATUS_LABELS[s]}
                  </span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {finalQuote ? (
        <Card>
          <CardHeader>
            <CardTitle>Kesin Teklif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {finalQuote.lines.map((l) => (
              <div key={l.id} className="flex justify-between text-sm">
                <span className="text-slate-600">{l.label}</span>
                <span className="tabular-nums">{TRY.format(l.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
              <span>Toplam</span>
              <span>{TRY.format(finalQuote.totalMax)}</span>
            </div>
          </CardContent>
        </Card>
      ) : estimate ? (
        <Card>
          <CardHeader>
            <CardTitle>Tahmini Fiyat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">
              {TRY.format(estimate.totalMin)} – {TRY.format(estimate.totalMax)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Kesin fiyat, ekibimiz bilgileri inceledikten sonra iletilecektir.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {job.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ödemeler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {job.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span>{PAYMENT_METHOD_LABELS[p.method as PaymentMethod]}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{TRY.format(p.amount)}</span>
                  <Badge
                    variant={p.status === "PAID" ? "success" : p.status === "FAILED" ? "destructive" : "warning"}
                  >
                    {PAYMENT_STATUS_LABELS[p.status as PaymentStatus]}
                  </Badge>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <TrackingActions
        code={job.code}
        status={status}
        hasFinalQuoteSent={!!job.quotes.find((q) => q.kind === "FINAL" && q.status === "SENT")}
        hasAcceptedQuote={!!job.quotes.find((q) => q.kind === "FINAL" && q.status === "ACCEPTED")}
        paid={paid}
        pendingTransfer={pendingTransfer}
      />

      <div className="text-center">
        <Link href="/" className="text-xs text-slate-400 underline">
          Ana sayfa
        </Link>
      </div>
    </main>
  );
}
