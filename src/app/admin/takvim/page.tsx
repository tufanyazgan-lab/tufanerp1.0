import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/domain";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 14);

  const jobs = await prisma.job.findMany({
    where: { scheduledDate: { gte: start, lt: end }, status: { notIn: ["CANCELLED"] } },
    include: { customer: true, assignments: { include: { vehicle: true, operator: true } } },
    orderBy: { scheduledDate: "asc" },
  });

  const byDay = new Map<string, typeof jobs>();
  for (const j of jobs) {
    const key = j.scheduledDate!.toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    (byDay.get(key) ?? byDay.set(key, []).get(key)!).push(j);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Takvim (14 gün)</h1>
      {byDay.size === 0 && <p className="text-sm text-slate-500">Planlanmış iş yok.</p>}
      {[...byDay.entries()].map(([day, dayJobs]) => (
        <div key={day}>
          <h2 className="mb-2 text-sm font-semibold text-slate-600">{day}</h2>
          <div className="space-y-2">
            {dayJobs.map((j) => (
              <Link key={j.id} href={`/admin/talepler/${j.id}`} className="block">
                <Card className="hover:bg-slate-50">
                  <CardContent className="flex items-center justify-between p-3 text-sm">
                    <div>
                      <span className="font-mono font-semibold">{j.code}</span>
                      <span className="ml-2 text-slate-500">
                        {j.scheduledDate!.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                        {j.customer.name}
                      </span>
                      {j.assignments[0] && (
                        <p className="text-xs text-slate-400">
                          {j.assignments[0].vehicle?.name ?? "-"} · {j.assignments[0].operator?.name ?? "-"}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">{JOB_STATUS_LABELS[j.status as JobStatus]}</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
