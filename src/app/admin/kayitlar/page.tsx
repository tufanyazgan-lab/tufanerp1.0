import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Audit Log</h1>
      <Card>
        <CardContent className="divide-y divide-slate-100 p-0">
          {logs.map((l) => (
            <div key={l.id} className="p-3 text-xs">
              <p className="font-medium">
                {l.createdAt.toLocaleString("tr-TR")} · {l.entity} · {l.action}
                {l.actor ? ` · ${l.actor}` : ""}
              </p>
              {(l.before || l.after) && (
                <p className="mt-0.5 break-all font-mono text-[10px] text-slate-500">
                  {l.before ? `önce: ${l.before} ` : ""}
                  {l.after ? `sonra: ${l.after}` : ""}
                </p>
              )}
            </div>
          ))}
          {logs.length === 0 && <p className="p-4 text-sm text-slate-500">Kayıt yok.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
