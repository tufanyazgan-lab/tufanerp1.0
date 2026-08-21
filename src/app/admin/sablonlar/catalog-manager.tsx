"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCatalogItem, deleteCatalogItem, toggleCatalogItem } from "@/app/actions/admin";
import { UNITS } from "@/lib/domain";

interface Item {
  id: string;
  scope: string;
  groupKey: string;
  name: string;
  defaultQty: number;
  unit: string;
  approxWeight: number | null;
  active: boolean;
}

const SCOPE_LABELS: Record<string, string> = {
  ROOM_TEMPLATE: "Oda şablonu",
  CARGO: "Ticari yük / inşaat / moloz",
  EXTRA: "Ekstra eşyalar",
};

export function CatalogManager({
  items,
  cargoCategories,
}: {
  items: Item[];
  cargoCategories: Array<{ key: string; name: string }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [scope, setScope] = useState("ROOM_TEMPLATE");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ groupKey: "", name: "", defaultQty: 1, unit: "adet", approxWeight: "" });

  const groups = useMemo(() => {
    const byGroup = new Map<string, Item[]>();
    for (const it of items.filter((i) => i.scope === scope)) {
      const arr = byGroup.get(it.groupKey) ?? [];
      arr.push(it);
      byGroup.set(it.groupKey, arr);
    }
    return [...byGroup.entries()];
  }, [items, scope]);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {Object.entries(SCOPE_LABELS).map(([s, label]) => (
          <button
            key={s}
            type="button"
            onClick={() => setScope(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              scope === s ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {groups.map(([groupKey, groupItems]) => (
        <Card key={groupKey}>
          <CardHeader>
            <CardTitle className="text-sm">
              {scope === "CARGO"
                ? (cargoCategories.find((c) => c.key === groupKey)?.name ?? groupKey)
                : groupKey}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {groupItems.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-2 text-sm">
                <span className={it.active ? "" : "text-slate-400 line-through"}>
                  {it.name} · {it.defaultQty} {it.unit}
                  {it.approxWeight ? ` · ~${it.approxWeight}kg` : ""}
                </span>
                <span className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="text-xs text-slate-500 underline"
                    onClick={() => run(() => toggleCatalogItem(it.id, !it.active))}
                  >
                    {it.active ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    className="text-xs text-red-500 underline"
                    onClick={() => run(() => deleteCatalogItem(it.id))}
                  >
                    Sil
                  </button>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {adding ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Grup anahtarı</Label>
                {scope === "CARGO" ? (
                  <select
                    value={form.groupKey}
                    onChange={(e) => setForm({ ...form, groupKey: e.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="">Kategori seçin</option>
                    {cargoCategories.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : scope === "EXTRA" ? (
                  <Input value="extra" disabled />
                ) : (
                  <Input
                    value={form.groupKey}
                    onChange={(e) => setForm({ ...form, groupKey: e.target.value })}
                    placeholder="bedroom, living, kitchen..."
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label>Ad</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Varsayılan adet</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.defaultQty}
                  onChange={(e) => setForm({ ...form, defaultQty: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label>Birim</Label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Yaklaşık ağırlık (kg)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.approxWeight}
                  onChange={(e) => setForm({ ...form, approxWeight: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={pending || !form.name || (scope !== "EXTRA" && !form.groupKey)}
                onClick={() =>
                  run(async () => {
                    const res = await createCatalogItem({
                      scope: scope as "ROOM_TEMPLATE" | "CARGO" | "EXTRA",
                      groupKey: scope === "EXTRA" ? "extra" : form.groupKey,
                      name: form.name,
                      defaultQty: form.defaultQty,
                      unit: form.unit,
                      approxWeight: form.approxWeight ? Number(form.approxWeight) : null,
                    });
                    if (res.ok) {
                      setAdding(false);
                      setForm({ groupKey: "", name: "", defaultQty: 1, unit: "adet", approxWeight: "" });
                    }
                    return res;
                  })
                }
              >
                Ekle
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Vazgeç
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>
          + Yeni Kalem
        </Button>
      )}
    </div>
  );
}
