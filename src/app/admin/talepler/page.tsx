import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  JOB_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  type JobStatus,
  type JobType,
  type ServiceType,
} from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function JobsList({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  const { durum } = await searchParams;
  const filter = durum && JOB_STATUSES.includes(durum as JobStatus) ? (durum as JobStatus) : undefined;

  const jobs = await prisma.job.findMany({
    where: filter ? { status: filter } : undefined,
    include: { customer: true, payments: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Talepler</h1>
      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/admin/talepler"
          className={`rounded-full border px-3 py-1 text-xs ${!filter ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}
        >
          Tümü
        </Link>
        {JOB_STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/talepler?durum=${s}`}
            className={`rounded-full border px-3 py-1 text-xs ${filter === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}
          >
            {JOB_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-slate-500">Kayıt yok.</p>
      ) : (
        <div className="space-y-2">
          {jobs.map((j) => (
            <Link key={j.id} href={`/admin/talepler/${j.id}`} className="block">
              <Card className="transition-colors hover:bg-slate-50">
                <CardContent className="flex items-center justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{j.code}</p>
                    <p className="truncate text-xs text-slate-500">
                      {j.customer.name} · {SERVICE_TYPE_LABELS[j.serviceType as ServiceType]} ·{" "}
                      {JOB_TYPE_LABELS[j.jobType as JobType]}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {j.payments.some((p) => p.status === "PAID") && <Badge variant="success">Ödendi</Badge>}
                    {j.needsStaffReview && <Badge variant="warning">İnceleme</Badge>}
                    <Badge variant="secondary">{JOB_STATUS_LABELS[j.status as JobStatus]}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
