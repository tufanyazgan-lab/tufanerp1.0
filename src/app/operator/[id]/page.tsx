import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  type JobStatus,
  type JobType,
  type ServiceType,
} from "@/lib/domain";
import { OperatorActions } from "./operator-actions";

export const dynamic = "force-dynamic";

const TRY = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export default async function OperatorJobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      customer: true,
      addresses: true,
      quotes: { include: { lines: { orderBy: { sortNo: "asc" } } }, orderBy: { createdAt: "desc" } },
      payments: true,
      photos: { where: { kind: { in: ["BEFORE", "AFTER"] } } },
    },
  });
  if (!job) notFound();

  const status = job.status as JobStatus;
  const paid = job.payments.some((p) => p.status === "PAID");
  const acceptedQuote = job.quotes.find((q) => q.kind === "FINAL" && q.status === "ACCEPTED");
  const pickup = job.addresses.find((a) => a.kind === "PICKUP");
  const beforeCount = job.photos.filter((p) => p.kind === "BEFORE").length;
  const afterCount = job.photos.filter((p) => p.kind === "AFTER").length;

  return (
    <main className="space-y-4 p-4 pb-12">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-mono text-xl font-bold">{job.code}</h1>
          <p className="text-sm text-slate-500">
            {job.customer.name} ·{" "}
            <a className="underline" href={`tel:${job.customer.phone}`}>
              {job.customer.phone}
            </a>
          </p>
        </div>
        <Badge variant="secondary">{JOB_STATUS_LABELS[status]}</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>İş Detayı</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            {SERVICE_TYPE_LABELS[job.serviceType as ServiceType]} · {JOB_TYPE_LABELS[job.jobType as JobType]}
          </p>
          {job.addresses.map((a) => (
            <p key={a.id} className="text-xs text-slate-500">
              <b>{a.kind === "PICKUP" ? "Alış" : "Teslim"}:</b> {a.addressText || "-"} · Kat {a.floor}
              {a.mobileElevator ? " · asansör kurulacak" : ""}
            </p>
          ))}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-500">Ödeme durumu</span>
            <Badge variant={paid ? "success" : "warning"}>{paid ? "Ödendi" : "Ödenmedi"}</Badge>
          </div>
          {acceptedQuote && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Onaylı tutar</span>
              <span className="text-sm font-semibold">{TRY.format(acceptedQuote.totalMax)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <OperatorActions
        jobId={job.id}
        status={status}
        paid={paid}
        hasAcceptedQuote={!!acceptedQuote}
        pickupAddress={pickup?.addressText ?? ""}
        beforeCount={beforeCount}
        afterCount={afterCount}
      />

      {job.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Öncesi / Sonrası</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {job.photos.map((p) => (
              <div key={p.id} className="relative h-20 w-20 overflow-hidden rounded-lg border">
                <Image src={p.dataUrl} alt={p.kind} fill unoptimized className="object-cover" />
                <span className="absolute bottom-0 left-0 bg-black/60 px-1 text-[9px] text-white">
                  {p.kind === "BEFORE" ? "önce" : "sonra"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
