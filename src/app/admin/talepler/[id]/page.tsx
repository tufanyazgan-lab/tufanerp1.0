import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
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
import { calculatePrice } from "@/lib/pricing";
import { JobAdminActions } from "./job-admin-actions";

export const dynamic = "force-dynamic";

const TRY = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export default async function AdminJobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      customer: true,
      addresses: true,
      rooms: { include: { items: true } },
      items: { where: { roomId: null } },
      photos: true,
      quotes: { include: { lines: { orderBy: { sortNo: "asc" } } }, orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { createdAt: "desc" }, take: 30 },
      assignments: { include: { vehicle: true, operator: true } },
    },
  });
  if (!job) notFound();

  const [vehicles, operators, tariff] = await Promise.all([
    prisma.vehicle.findMany({ where: { active: true } }),
    prisma.operator.findMany({ where: { active: true } }),
    prisma.tariff.findFirst({ where: { active: true, kind: "COMBO" } }),
  ]);

  // Tarifeden önerilen teklif kalemleri (admin düzenleyebilir)
  let suggestedLines: Array<{ label: string; amount: number }> = [];
  if (tariff) {
    const result = calculatePrice(
      {
        truck: {
          minFee: tariff.minFee,
          includedKm: tariff.includedKm,
          perExtraKm: tariff.perExtraKm,
          includedHours: tariff.includedHours,
          perExtraHour: tariff.perExtraHour,
          perExtraTrip: tariff.perExtraTrip,
          waitingPerHour: tariff.waitingPerHour,
          outOfCityMultiplier: tariff.outOfCityMultiplier,
        },
        elevator: {
          minFee: 0,
          setupFee: tariff.setupFee,
          extraSetupFee: tariff.extraSetupFee,
          includedHours: tariff.includedHours,
          perExtraHour: tariff.perExtraHour,
          floorThreshold: tariff.floorThreshold,
          perExtraFloor: tariff.perExtraFloor,
          rubbleSurcharge: tariff.rubbleSurcharge,
        },
        comboDiscount: tariff.comboDiscount,
      },
      {
        serviceType: job.serviceType as ServiceType,
        distanceKm: job.distanceKm ?? 0,
        estimatedHours: job.estimatedHours ?? 2,
        outOfCity: job.outOfCity,
        elevatorSetups: job.elevatorSetups || (job.serviceType !== "TRUCK_ONLY" ? 1 : 0),
        maxFloor: Math.max(0, ...job.addresses.map((a) => a.floor)),
        isRubbleOrSpecial: job.jobType === "RUBBLE" || job.needsStaffReview,
      }
    );
    suggestedLines = result.lines;
  }

  const status = job.status as JobStatus;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-xl font-bold">{job.code}</h1>
          <p className="text-sm text-slate-500">
            {job.customer.name} · <a className="underline" href={`tel:${job.customer.phone}`}>{job.customer.phone}</a>
          </p>
        </div>
        <Badge variant={status === "COMPLETED" ? "success" : status === "CANCELLED" ? "destructive" : "secondary"}>
          {JOB_STATUS_LABELS[status]}
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Keşif Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            {SERVICE_TYPE_LABELS[job.serviceType as ServiceType]} · {JOB_TYPE_LABELS[job.jobType as JobType]}
            {job.homeType ? ` · ${job.homeType}` : ""}
          </p>
          <p className="text-slate-600">
            {job.distanceKm ?? 0} km · ~{job.estimatedHours ?? 0} saat · {job.elevatorSetups} asansör kurulumu
            {job.outOfCity ? " · şehir dışı" : ""}
          </p>
          {job.estimatedWeight ? <p className="text-slate-600">Tahmini ağırlık: ~{Math.round(job.estimatedWeight)} kg</p> : null}
          {job.needsStaffReview && <p className="font-medium text-amber-600">Personel incelemesi işaretli</p>}
          {job.addresses.map((a) => (
            <p key={a.id} className="text-xs text-slate-500">
              <b>{a.kind === "PICKUP" ? "Alış" : "Teslim"}:</b> {a.addressText || "-"} · Kat {a.floor}
              {a.buildingElevator ? " · bina asansörü var" : ""}
              {a.mobileElevator ? " · mobil asansör kurulacak" : ""}
              {a.truckAccess ? ` · ${a.truckAccess}` : ""}
            </p>
          ))}
          {job.notes && <p className="text-xs text-slate-500">Not: {job.notes}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eşya / Yük Listesi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {job.rooms.map((r) => (
            <div key={r.id}>
              <p className="font-semibold">{r.name}</p>
              <ul className="ml-4 list-disc text-slate-600">
                {r.items.map((it) => (
                  <li key={it.id}>
                    {it.name} × {it.qty} {it.unit !== "adet" ? it.unit : ""}
                    {it.fragile ? " (hassas)" : ""}
                    {it.approxWeight ? ` ~${it.approxWeight}kg` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {job.items.length > 0 && (
            <div>
              <p className="font-semibold">Diğer / Ekstra</p>
              <ul className="ml-4 list-disc text-slate-600">
                {job.items.map((it) => (
                  <li key={it.id}>
                    {it.categoryKey ? `[${it.categoryKey}] ` : ""}
                    {it.name} × {it.qty} {it.unit !== "adet" ? it.unit : ""}
                    {it.fragile ? " (hassas)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {job.rooms.length === 0 && job.items.length === 0 && <p className="text-slate-500">Kalem girilmemiş.</p>}
        </CardContent>
      </Card>

      {job.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fotoğraflar ({job.photos.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {job.photos.map((p) => (
              <div key={p.id} className="relative h-24 w-24 overflow-hidden rounded-lg border">
                <Image src={p.dataUrl} alt={p.kind} fill unoptimized className="object-cover" />
                <span className="absolute bottom-0 left-0 bg-black/60 px-1 text-[9px] text-white">{p.kind}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {job.quotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Teklifler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {job.quotes.map((q) => (
              <div key={q.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {q.kind === "ESTIMATE" ? "Tahmin" : "Kesin"} · {q.status}
                  </span>
                  <span className="tabular-nums">
                    {q.totalMin === q.totalMax
                      ? TRY.format(q.totalMax)
                      : `${TRY.format(q.totalMin)} – ${TRY.format(q.totalMax)}`}
                  </span>
                </div>
                <ul className="mt-1 text-xs text-slate-500">
                  {q.lines.map((l) => (
                    <li key={l.id} className="flex justify-between">
                      <span>{l.label}</span>
                      <span className="tabular-nums">{TRY.format(l.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {job.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ödemeler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {job.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span>
                  {PAYMENT_METHOD_LABELS[p.method as PaymentMethod]}
                  {p.reference ? ` · ${p.reference}` : ""}
                </span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums">{TRY.format(p.amount)}</span>
                  <Badge variant={p.status === "PAID" ? "success" : "warning"}>
                    {PAYMENT_STATUS_LABELS[p.status as PaymentStatus]}
                  </Badge>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <JobAdminActions
        jobId={job.id}
        status={status}
        suggestedLines={suggestedLines}
        pendingTransferId={job.payments.find((p) => p.method === "TRANSFER" && p.status === "PENDING")?.id ?? null}
        vehicles={vehicles.map((v) => ({ id: v.id, name: `${v.name} (${v.plate})` }))}
        operators={operators.map((o) => ({ id: o.id, name: o.name }))}
        assignments={job.assignments.map((a) => ({
          id: a.id,
          date: a.date.toISOString(),
          vehicle: a.vehicle?.name ?? null,
          operator: a.operator?.name ?? null,
        }))}
      />

      <Card>
        <CardHeader>
          <CardTitle>Olay Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs text-slate-500">
          {job.events.map((e) => (
            <p key={e.id}>
              {e.createdAt.toLocaleString("tr-TR")} · {e.type}
              {e.fromStatus ? ` ${JOB_STATUS_LABELS[e.fromStatus as JobStatus]} →` : ""}
              {e.toStatus ? ` ${JOB_STATUS_LABELS[e.toStatus as JobStatus]}` : ""}
              {e.lat != null ? ` · GPS ${e.lat.toFixed(5)},${e.lng?.toFixed(5)}` : ""}
              {e.detail ? ` · ${e.detail}` : ""}
              {e.actor ? ` · ${e.actor}` : ""}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
