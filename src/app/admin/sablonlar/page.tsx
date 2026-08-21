import { prisma } from "@/lib/db";
import { CatalogManager } from "./catalog-manager";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const [items, categories] = await Promise.all([
    prisma.catalogItem.findMany({ orderBy: [{ scope: "asc" }, { groupKey: "asc" }, { sortNo: "asc" }] }),
    prisma.cargoCategory.findMany({ orderBy: { sortNo: "asc" } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Oda / Eşya ve Yük Şablonları</h1>
      <p className="text-sm text-slate-500">
        Müşteri wizard&apos;ında görünen hazır eşya ve yük kalemleri buradan yönetilir.
      </p>
      <CatalogManager
        items={items.map((i) => ({
          id: i.id,
          scope: i.scope,
          groupKey: i.groupKey,
          name: i.name,
          defaultQty: i.defaultQty,
          unit: i.unit,
          approxWeight: i.approxWeight,
          active: i.active,
        }))}
        cargoCategories={categories.map((c) => ({ key: c.key, name: c.name }))}
      />
    </div>
  );
}
