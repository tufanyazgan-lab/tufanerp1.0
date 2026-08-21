import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS, type JobStatus, type ServiceType } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function OperatorHome() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [todayJobs, activeJobs] = await Promise.all([
    prisma.job.findMany({
      where: { scheduledDate: { gte: start, lt: end }, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      include: { customer: true, addresses: true },
      orderBy: { scheduledDate: "asc" },
    }),
    prisma.job.findMany({
      where: { status: { in: ["EN_ROUTE", "ON_SITE", "AWAITING_PAYMENT", "IN_PROGRESS"] } },
      include: { customer: true, addresses: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const jobs = [...new Map([...activeJobs, ...todayJobs].map((j) => [j.id, j])).values()];

  return (
    <main className="space-y-4 p-4">
      <h1 className="pt-2 text-xl font-bold">Bugünkü İşler</h1>
      {jobs.length === 0 ? (
        <p className="text-sm text-slate-500">Bugün için planlanmış iş yok.</p>
      ) : (
        jobs.map((j) => {
          const pickup = j.addresses.find((a) => a.kind === "PICKUP");
          return (
            <Link key={j.id} href={`/operator/${j.id}`} className="block">
              <Card className="hover:bg-slate-50">
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold">{j.code}</span>
                    <Badge variant="secondary">{JOB_STATUS_LABELS[j.status as JobStatus]}</Badge>
                  </div>
                  <p className="text-sm">{j.customer.name}</p>
                  <p className="text-xs text-slate-500">
                    {SERVICE_TYPE_LABELS[j.serviceType as ServiceType]}
                    {j.scheduledDate
                      ? ` · ${j.scheduledDate.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`
                      : ""}
                  </p>
                  {pickup && <p className="truncate text-xs text-slate-500">{pickup.addressText}</p>}
                </CardContent>
              </Card>
            </Link>
          );
        })
      )}
    </main>
  );
}
