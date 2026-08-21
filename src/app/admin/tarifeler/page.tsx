import { prisma } from "@/lib/db";
import { TariffForm } from "./tariff-form";

export const dynamic = "force-dynamic";

export default async function TariffsPage() {
  const tariffs = await prisma.tariff.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Fiyat Tarifeleri</h1>
      <p className="text-sm text-slate-500">
        Fiyatlar koda gömülü değildir; buradaki değerler fiyat motorunu besler. Değişiklikler audit log&apos;a yazılır.
      </p>
      {tariffs.map((t) => (
        <TariffForm
          key={t.id}
          tariff={{
            id: t.id,
            kind: t.kind,
            name: t.name,
            minFee: t.minFee,
            includedKm: t.includedKm,
            perExtraKm: t.perExtraKm,
            includedHours: t.includedHours,
            perExtraHour: t.perExtraHour,
            perExtraTrip: t.perExtraTrip,
            waitingPerHour: t.waitingPerHour,
            outOfCityMultiplier: t.outOfCityMultiplier,
            setupFee: t.setupFee,
            extraSetupFee: t.extraSetupFee,
            floorThreshold: t.floorThreshold,
            perExtraFloor: t.perExtraFloor,
            rubbleSurcharge: t.rubbleSurcharge,
            comboDiscount: t.comboDiscount,
          }}
        />
      ))}
    </div>
  );
}
