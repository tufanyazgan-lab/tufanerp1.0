import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ResourcesPage() {
  const [vehicles, operators] = await Promise.all([
    prisma.vehicle.findMany({ orderBy: { name: "asc" } }),
    prisma.operator.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Araçlar & Operatörler</h1>
      <Card>
        <CardHeader>
          <CardTitle>Araçlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between">
              <span>
                {v.name} · <span className="font-mono">{v.plate}</span>
              </span>
              <span className="flex gap-2">
                <Badge variant="secondary">{v.kind === "TRUCK" ? "Kapalı kasa" : "Mobil asansör"}</Badge>
                <Badge variant={v.active ? "success" : "destructive"}>{v.active ? "Aktif" : "Pasif"}</Badge>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Operatörler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {operators.map((o) => (
            <div key={o.id} className="flex items-center justify-between">
              <span>
                {o.name} · {o.phone}
              </span>
              <span className="flex gap-2">
                <Badge variant="secondary">{o.role}</Badge>
                <Badge variant={o.active ? "success" : "destructive"}>{o.active ? "Aktif" : "Pasif"}</Badge>
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
