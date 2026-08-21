"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhotoInput } from "@/components/wizard/photo-input";
import {
  addExtraService,
  operatorTransition,
  recordArrival,
  uploadJobPhotos,
  type ExtraKind,
} from "@/app/actions/operator";
import type { JobStatus } from "@/lib/domain";

function getGps(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000 }
    );
  });
}

const EXTRAS: Array<{ kind: ExtraKind; label: string }> = [
  { kind: "EXTRA_HOUR", label: "Ek süre (saat)" },
  { kind: "EXTRA_TRIP", label: "Ek sefer" },
  { kind: "EXTRA_SETUP", label: "Ek kurulum" },
  { kind: "WAITING", label: "Bekleme (saat)" },
];

export function OperatorActions({
  jobId,
  status,
  paid,
  hasAcceptedQuote,
  pickupAddress,
  beforeCount,
  afterCount,
}: {
  jobId: string;
  status: JobStatus;
  paid: boolean;
  hasAcceptedQuote: boolean;
  pickupAddress: string;
  beforeCount: number;
  afterCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [extraQty, setExtraQty] = useState<Record<ExtraKind, number>>({
    EXTRA_HOUR: 1,
    EXTRA_TRIP: 1,
    EXTRA_SETUP: 1,
    WAITING: 1,
  });

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Hata oluştu");
      router.refresh();
    });
  }

  const working = ["EN_ROUTE", "ON_SITE", "AWAITING_PAYMENT", "IN_PROGRESS"].includes(status);

  return (
    <div className="space-y-4">
      {pickupAddress && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickupAddress)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="w-full">
            <Navigation className="h-4 w-4" /> Navigasyonu Aç
          </Button>
        </a>
      )}

      {status === "RESERVED" && (
        <Button className="w-full" size="lg" disabled={pending} onClick={() => run(() => operatorTransition(jobId, "EN_ROUTE"))}>
          Yola Çıktım
        </Button>
      )}

      {status === "EN_ROUTE" && (
        <Button
          className="w-full"
          size="lg"
          disabled={pending}
          onClick={() =>
            run(async () => {
              const gps = await getGps();
              return recordArrival(jobId, gps);
            })
          }
        >
          <MapPin className="h-4 w-4" /> Konuma Geldim (GPS kaydet)
        </Button>
      )}

      {working && (
        <Card>
          <CardHeader>
            <CardTitle>Öncesi Fotoğrafları {beforeCount > 0 ? `(${beforeCount} kayıtlı)` : ""}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <PhotoInput photos={beforePhotos} onChange={setBeforePhotos} />
            {beforePhotos.length > 0 && (
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const res = await uploadJobPhotos(jobId, "BEFORE", beforePhotos);
                    if (res.ok) setBeforePhotos([]);
                    return res;
                  })
                }
              >
                Kaydet
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {status === "AWAITING_PAYMENT" &&
        (paid ? (
          <Button className="w-full" size="lg" disabled={pending} onClick={() => run(() => operatorTransition(jobId, "IN_PROGRESS"))}>
            İşe Başla
          </Button>
        ) : (
          <Button className="w-full" size="lg" disabled variant="outline">
            <Lock className="h-4 w-4" /> İşe Başla (ödeme bekleniyor)
          </Button>
        ))}

      {status === "IN_PROGRESS" && (
        <>
          {hasAcceptedQuote && (
            <Card>
              <CardHeader>
                <CardTitle>Ek Hizmet (tarifeden)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {EXTRAS.map((e) => (
                  <div key={e.kind} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{e.label}</span>
                    <span className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={extraQty[e.kind]}
                        onChange={(ev) => setExtraQty({ ...extraQty, [e.kind]: Number(ev.target.value) })}
                        className="h-9 w-16 rounded-lg border border-slate-300 px-2 text-center text-sm"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending || extraQty[e.kind] <= 0}
                        onClick={() => run(() => addExtraService(jobId, e.kind, extraQty[e.kind]))}
                      >
                        Ekle
                      </Button>
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Sonrası Fotoğrafları {afterCount > 0 ? `(${afterCount} kayıtlı)` : ""}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <PhotoInput photos={afterPhotos} onChange={setAfterPhotos} />
              {afterPhotos.length > 0 && (
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const res = await uploadJobPhotos(jobId, "AFTER", afterPhotos);
                      if (res.ok) setAfterPhotos([]);
                      return res;
                    })
                  }
                >
                  Kaydet
                </Button>
              )}
            </CardContent>
          </Card>

          <Button className="w-full" size="lg" disabled={pending} onClick={() => run(() => operatorTransition(jobId, "COMPLETED"))}>
            İşi Bitir
          </Button>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
