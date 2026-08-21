import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const TRY = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

export default async function AdminDashboard() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const [newCount, activeCount, todayJobs, pendingTransfers, paidToday] = await Promise.all([
    prisma.job.count({ where: { status: "NEW_REQUEST" } }),
    prisma.job.count({ where: { status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.job.findMany({
      where: { scheduledDate: { gte: startOfDay, lt: endOfDay } },
      include: { customer: true },
      orderBy: { scheduledDate: "asc" },
    }),
    prisma.payment.count({ where: { method: "TRANSFER", status: "PENDING" } }),
    prisma.payment.aggregate({
      where: { status: "PAID", updatedAt: { gte: startOfDay } },
      _sum: { amount: true },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{newCount}</p>
            <p className="text-xs text-slate-500">Yeni talep</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-slate-500">Aktif iş</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{pendingTransfers}</p>
            <p className="text-xs text-slate-500">Bekleyen havale onayı</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{TRY.format(paidToday._sum.amount ?? 0)}</p>
            <p className="text-xs text-slate-500">Bugün tahsilat</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="pt-2 text-base font-semibold">Bugünkü işler</h2>
      {todayJobs.length === 0 ? (
        <p className="text-sm text-slate-500">Bugün planlanmış iş yok.</p>
      ) : (
        <div className="space-y-2">
          {todayJobs.map((j) => (
            <Link key={j.id} href={`/admin/talepler/${j.id}`}>
              <Card className="transition-colors hover:bg-slate-50">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-mono text-sm font-semibold">{j.code}</p>
                    <p className="text-xs text-slate-500">{j.customer.name}</p>
                  </div>
                  <Badge variant="secondary">{JOB_STATUS_LABELS[j.status as JobStatus]}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
