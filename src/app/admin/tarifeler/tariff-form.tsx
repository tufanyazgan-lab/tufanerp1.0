"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTariff, type TariffInput } from "@/app/actions/admin";

const FIELDS: Array<{ key: keyof TariffInput; label: string; group: string }> = [
  { key: "minFee", label: "Minimum hizmet bedeli (TL)", group: "Araç" },
  { key: "includedKm", label: "Dahil km", group: "Araç" },
  { key: "perExtraKm", label: "Ek km ücreti (TL)", group: "Araç" },
  { key: "includedHours", label: "Dahil süre (saat)", group: "Araç" },
  { key: "perExtraHour", label: "Ek saat ücreti (TL)", group: "Araç" },
  { key: "perExtraTrip", label: "Ek sefer ücreti (TL)", group: "Araç" },
  { key: "waitingPerHour", label: "Bekleme (TL/saat)", group: "Araç" },
  { key: "outOfCityMultiplier", label: "Şehir dışı katsayısı", group: "Araç" },
  { key: "setupFee", label: "Kurulum (TL)", group: "Asansör" },
  { key: "extraSetupFee", label: "İkinci/ek kurulum (TL)", group: "Asansör" },
  { key: "floorThreshold", label: "Kat eşiği", group: "Asansör" },
  { key: "perExtraFloor", label: "Eşik üstü kat ücreti (TL)", group: "Asansör" },
  { key: "rubbleSurcharge", label: "Moloz/özel yük ek ücreti (TL)", group: "Asansör" },
  { key: "comboDiscount", label: "Paket indirimi (TL)", group: "Paket" },
];

export function TariffForm({ tariff }: { tariff: TariffInput & { id: string; kind: string } }) {
  const router = useRouter();
  const [values, setValues] = useState<TariffInput>(tariff);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const groups = [...new Set(FIELDS.map((f) => f.group))];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {tariff.name} <span className="text-xs font-normal text-slate-400">({tariff.kind})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{g}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {FIELDS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    type="number"
                    step="any"
                    value={values[f.key] as number}
                    onChange={(e) => setValues({ ...values, [f.key]: Number(e.target.value) })}
                    className="h-9"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <Button
            disabled={pending}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                const res = await updateTariff(tariff.id, values);
                setMessage(res.ok ? "Kaydedildi" : (res.error ?? "Hata"));
                router.refresh();
              });
            }}
          >
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          {message && <span className="text-sm text-slate-500">{message}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
