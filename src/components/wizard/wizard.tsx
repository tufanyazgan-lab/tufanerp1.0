"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronLeft, Pencil, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CARGO_CATEGORY_LABELS,
  HOME_TYPES,
  JOB_TYPES,
  JOB_TYPE_LABELS,
  ROOM_BASED_JOB_TYPES,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type HomeType,
  type JobType,
} from "@/lib/domain";
import type { TemplateData } from "@/app/actions/catalog";
import { submitLead, type LeadResult } from "@/app/actions/lead";
import type { LeadSubmit, WizardItem } from "@/lib/wizard-types";
import { useWizard } from "./store";
import { QtyStepper } from "./qty-stepper";
import { PhotoInput } from "./photo-input";
import { CustomItemForm } from "./custom-item-form";

const TRY = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

function SelectionCard({
  title,
  selected,
  onClick,
  subtitle,
}: {
  title: string;
  selected: boolean;
  onClick: () => void;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${
        selected ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white active:bg-slate-50"
      }`}
    >
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        {subtitle && <span className={`block text-xs ${selected ? "text-slate-300" : "text-slate-500"}`}>{subtitle}</span>}
      </span>
      {selected && <Check className="h-5 w-5 shrink-0" />}
    </button>
  );
}

export function Wizard({ templates }: { templates: TemplateData }) {
  const w = useWizard();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<LeadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRoomFlow = w.jobType !== null && ROOM_BASED_JOB_TYPES.includes(w.jobType);

  // Adım listesi akışa göre değişir: ev/ofis oda akışı veya kargo akışı
  const steps = useMemo(() => {
    const base = ["Hizmet", "İş Türü"];
    if (w.jobType === null) return [...base, "Detay", "Adres", "İletişim"];
    if (isRoomFlow) return [...base, "Ev Tipi", "Odalar", "Ekstra", "Adres", "İletişim"];
    return [...base, "Yük Detayı", "Adres", "İletişim"];
  }, [w.jobType, isRoomFlow]);

  const lastStep = steps.length - 1;

  function buildPayload(): LeadSubmit {
    const addresses = w.addresses.filter(
      (a, i) => i === 0 || a.addressText.trim().length > 0 || a.mobileElevator
    );
    return {
      serviceType: w.serviceType!,
      jobType: w.jobType!,
      homeType: w.homeType,
      rooms: w.rooms,
      extraItems: w.extraItems.filter((i) => i.qty > 0 || i.isCustom),
      cargoItems: w.cargoItems.filter((i) => i.qty > 0 || i.isCustom),
      addresses: addresses.length > 0 ? addresses : w.addresses.slice(0, 1),
      distanceKm: w.distanceKm,
      estimatedHours: w.estimatedHours,
      outOfCity: w.outOfCity,
      facadePhotoDataUrls: w.facadePhotoDataUrls,
      needsStaffReview:
        w.needsStaffReview ||
        [...w.rooms.flatMap((r) => r.items), ...w.extraItems, ...w.cargoItems].some((i) => i.fragile && i.qty > 0),
      notes: w.notes || undefined,
      customer: { name: w.customerName, phone: w.customerPhone, email: w.customerEmail },
    };
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const res = await submitLead(buildPayload());
      if (res.ok) setResult(res);
      else setError(res.error ?? "Bir hata oluştu");
    });
  }

  if (result?.ok) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold">Talebiniz alındı</h2>
        <p className="text-sm text-slate-600">
          Takip kodunuz: <span className="font-mono text-base font-bold">{result.code}</span>
        </p>
        {result.estimate && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-slate-500">Tahmini fiyat aralığı</p>
              <p className="text-2xl font-bold">
                {TRY.format(result.estimate.min)} – {TRY.format(result.estimate.max)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Kesin fiyat, ekibimiz fotoğraf ve bilgileri inceledikten sonra telefon/WhatsApp ile iletilir.
              </p>
            </CardContent>
          </Card>
        )}
        <div className="flex flex-col gap-2">
          <a href={`/takip/${result.code}`}>
            <Button className="w-full">Talebimi Takip Et</Button>
          </a>
          <a href="tel:+905550000000">
            <Button variant="outline" className="w-full">
              <Phone className="h-4 w-4" /> Bizi Arayın
            </Button>
          </a>
          <a
            href={`https://wa.me/905550000000?text=${encodeURIComponent(`Merhaba, ${result.code} kodlu talebim hakkında bilgi almak istiyorum.`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full">
              WhatsApp ile Yazın
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const canNext = (() => {
    const label = steps[w.step];
    if (label === "Hizmet") return w.serviceType !== null;
    if (label === "İş Türü") return w.jobType !== null;
    if (label === "Ev Tipi") return w.homeType !== null;
    if (label === "Adres") return w.addresses[0]?.addressText.trim().length >= 3;
    if (label === "İletişim")
      return w.customerName.trim().length >= 2 && w.customerPhone.trim().length >= 10;
    return true;
  })();

  return (
    <div className="mx-auto max-w-lg pb-28">
      {/* Stepper */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          {w.step > 0 && (
            <button type="button" aria-label="Geri" onClick={() => w.setStep(w.step - 1)}>
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1">
            <p className="text-xs text-slate-500">
              Adım {w.step + 1}/{steps.length}
            </p>
            <p className="text-sm font-semibold">{steps[w.step]}</p>
          </div>
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 w-4 rounded-full ${i <= w.step ? "bg-slate-900" : "bg-slate-200"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {steps[w.step] === "Hizmet" && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Hangi hizmete ihtiyacınız var?</p>
            {SERVICE_TYPES.map((s) => (
              <SelectionCard
                key={s}
                title={SERVICE_TYPE_LABELS[s]}
                selected={w.serviceType === s}
                onClick={() => w.setServiceType(s)}
              />
            ))}
          </div>
        )}

        {steps[w.step] === "İş Türü" && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Ne taşınacak?</p>
            <div className="grid grid-cols-2 gap-2">
              {JOB_TYPES.map((j) => (
                <SelectionCard
                  key={j}
                  title={JOB_TYPE_LABELS[j]}
                  selected={w.jobType === j}
                  onClick={() => {
                    w.setJobType(j);
                    if (["CONSTRUCTION", "RUBBLE", "DOORS_WINDOWS"].includes(j) && w.cargoItems.length === 0) {
                      seedCargo(j);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {steps[w.step] === "Ev Tipi" && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Yapı tipini seçin; odalar otomatik oluşturulur.</p>
            <div className="grid grid-cols-3 gap-2">
              {HOME_TYPES.map((h) => (
                <SelectionCard key={h} title={h} selected={w.homeType === h} onClick={() => selectHomeType(h)} />
              ))}
            </div>
          </div>
        )}

        {steps[w.step] === "Odalar" && <RoomsStep />}

        {steps[w.step] === "Ekstra" && <ExtrasStep templates={templates} />}

        {steps[w.step] === "Yük Detayı" && <CargoStep templates={templates} />}

        {steps[w.step] === "Adres" && <AddressStep />}

        {steps[w.step] === "İletişim" && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Size ulaşabilmemiz için iletişim bilgilerinizi bırakın. Üyelik gerekmez.
            </p>
            <div className="space-y-1">
              <Label>Ad Soyad *</Label>
              <Input value={w.customerName} onChange={(e) => w.set({ customerName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Telefon *</Label>
              <Input
                type="tel"
                placeholder="05xx xxx xx xx"
                value={w.customerPhone}
                onChange={(e) => w.set({ customerPhone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>E-posta (isteğe bağlı)</Label>
              <Input
                type="email"
                value={w.customerEmail}
                onChange={(e) => w.set({ customerEmail: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Not (isteğe bağlı)</Label>
              <Input value={w.notes} onChange={(e) => w.set({ notes: e.target.value })} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>

      {/* Alt aksiyon çubuğu */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-4">
        <div className="mx-auto max-w-lg">
          {w.step < lastStep ? (
            <Button className="w-full" size="lg" disabled={!canNext} onClick={() => w.setStep(w.step + 1)}>
              Devam Et
            </Button>
          ) : (
            <Button className="w-full" size="lg" disabled={!canNext || pending} onClick={handleSubmit}>
              {pending ? "Gönderiliyor..." : "Talebi Gönder"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  function selectHomeType(h: HomeType) {
    const roomDefs = templates.homeRooms[h] ?? templates.homeRooms["Diğer"] ?? [];
    const rooms = roomDefs.map((r) => {
      // bedroom2 -> bedroom önekiyle şablon eşyası bul
      const groupKey = Object.keys(templates.roomItems).find((k) => r.key.startsWith(k)) ?? r.key;
      const items: WizardItem[] = (templates.roomItems[groupKey] ?? []).map((it) => ({
        name: it.name,
        qty: it.defaultQty,
        unit: it.unit,
        approxWeight: it.approxWeight ?? undefined,
        isCustom: false,
        fragile: false,
        photoDataUrls: [],
      }));
      return { key: r.key, name: r.name, items };
    });
    w.setHomeType(h, rooms);
  }

  function seedCargo(jobType: JobType) {
    const categoryKey =
      jobType === "CONSTRUCTION" ? "construction" : jobType === "RUBBLE" ? "rubble" : "doors_windows";
    const items = (templates.cargoItems[categoryKey] ?? []).map((it) => ({
      name: it.name,
      qty: 0,
      unit: it.unit,
      approxWeight: it.approxWeight ?? undefined,
      isCustom: false,
      fragile: false,
      photoDataUrls: [],
      categoryKey,
    }));
    w.setCargoItems(items);
  }
}

function RoomsStep() {
  const w = useWizard();
  const [editingRoom, setEditingRoom] = useState<number | null>(null);
  const [addingTo, setAddingTo] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Eşya adetlerini <b>-</b> / <b>+</b> ile düzeltin. Oda adını değiştirmek için kalem simgesine dokunun.
      </p>
      {w.rooms.map((room, ri) => (
        <Card key={room.key}>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              {editingRoom === ri ? (
                <Input
                  autoFocus
                  value={room.name}
                  onChange={(e) => w.renameRoom(ri, e.target.value)}
                  onBlur={() => setEditingRoom(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingRoom(null)}
                  className="h-9"
                />
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-semibold"
                  onClick={() => setEditingRoom(ri)}
                >
                  {room.name}
                  <Pencil className="h-3.5 w-3.5 text-slate-400" />
                </button>
              )}
              <Badge variant="secondary">{room.items.filter((i) => i.qty > 0).length} eşya</Badge>
            </div>
            <div className="space-y-2">
              {room.items.map((item, ii) => (
                <div key={ii} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{item.name}</p>
                    {item.isCustom && (
                      <p className="text-xs text-slate-400">
                        {item.dimensions ?? ""} {item.approxWeight ? `~${item.approxWeight} kg` : ""}
                      </p>
                    )}
                  </div>
                  <QtyStepper value={item.qty} onChange={(v) => w.setItemQty(ri, ii, v)} />
                </div>
              ))}
            </div>
            {addingTo === ri ? (
              <div className="mt-3">
                <CustomItemForm
                  onAdd={(item) => {
                    w.addRoomItem(ri, item);
                    setAddingTo(null);
                  }}
                  onCancel={() => setAddingTo(null)}
                />
              </div>
            ) : (
              <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setAddingTo(ri)}>
                + Başka Eşya Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExtrasStep({ templates }: { templates: TemplateData }) {
  const w = useWizard();
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (useWizard.getState().extraItems.length === 0 && templates.extraItems.length > 0) {
      useWizard.getState().set({
        extraItems: templates.extraItems.map((it) => ({
          name: it.name,
          qty: 0,
          unit: it.unit,
          approxWeight: it.approxWeight ?? undefined,
          isCustom: false,
          fragile: false,
          photoDataUrls: [],
        })),
      });
    }
  }, [templates.extraItems]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Odalar dışında taşınacak ekstra eşyalar varsa adetlerini belirtin. Koli, hurç ve çuval da buradan eklenir.
      </p>
      <Card>
        <CardContent className="space-y-2 p-4">
          {w.extraItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{item.name}</p>
                <p className="text-xs text-slate-400">{item.unit !== "adet" ? item.unit : ""}</p>
              </div>
              <QtyStepper value={item.qty} onChange={(v) => w.setExtraQty(i, v)} />
            </div>
          ))}
          {adding ? (
            <CustomItemForm
              onAdd={(item) => {
                w.addExtraItem(item);
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
              + Başka Eşya Ekle
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CargoStep({ templates }: { templates: TemplateData }) {
  const w = useWizard();
  const [category, setCategory] = useState<string | null>(
    w.cargoItems[0]?.categoryKey ?? null
  );
  const [adding, setAdding] = useState(false);

  function pickCategory(key: string) {
    setCategory(key);
    const existingKeys = new Set(w.cargoItems.map((c) => `${c.categoryKey}:${c.name}`));
    const newItems = (templates.cargoItems[key] ?? [])
      .filter((it) => !existingKeys.has(`${key}:${it.name}`))
      .map((it) => ({
        name: it.name,
        qty: 0,
        unit: it.unit,
        approxWeight: it.approxWeight ?? undefined,
        isCustom: false,
        fragile: false,
        photoDataUrls: [] as string[],
        categoryKey: key,
      }));
    w.setCargoItems([...w.cargoItems, ...newItems]);
  }

  const visible = w.cargoItems
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => item.categoryKey === category || item.qty > 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">Yük kategorisini seçin, hazır kalemlerden miktar girin.</p>
      <div className="flex flex-wrap gap-2">
        {templates.cargoCategories.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => pickCategory(c.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              category === c.key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white"
            }`}
          >
            {CARGO_CATEGORY_LABELS[c.key] ?? c.name}
          </button>
        ))}
      </div>
      {category && (
        <Card>
          <CardContent className="space-y-2 p-4">
            {visible.length === 0 && (
              <p className="text-sm text-slate-500">Bu kategoride hazır kalem yok; aşağıdan serbest kalem ekleyin.</p>
            )}
            {visible.map(({ item, idx }) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.unit}</p>
                </div>
                <QtyStepper value={item.qty} onChange={(v) => w.setCargoQty(idx, v)} />
              </div>
            ))}
            {adding ? (
              <CustomItemForm
                defaultUnit={category === "rubble" ? "çuval" : "adet"}
                onAdd={(item) => {
                  w.addCargoItem({ ...item, categoryKey: category });
                  setAdding(false);
                }}
                onCancel={() => setAdding(false)}
              />
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(true)}>
                + Başka Malzeme/Yük Ekle
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={useWizard.getState().needsStaffReview}
          onChange={(e) => w.set({ needsStaffReview: e.target.checked })}
        />
        Ağır / hassas yük var, personel incelemesi istiyorum
      </label>
    </div>
  );
}

function AddressStep() {
  const w = useWizard();
  const showElevator = w.serviceType !== "TRUCK_ONLY";

  return (
    <div className="space-y-4">
      {w.addresses.map((addr, i) => (
        <Card key={i}>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold">{addr.kind === "PICKUP" ? "Alış Adresi" : "Teslim Adresi"}</p>
            <div className="space-y-1">
              <Label>Adres {addr.kind === "PICKUP" ? "*" : "(gerekiyorsa)"}</Label>
              <Input
                value={addr.addressText}
                onChange={(e) => w.updateAddress(i, { addressText: e.target.value })}
                placeholder="Mahalle, sokak, bina no, ilçe/il"
              />
            </div>
            <div className="grid grid-cols-2 items-end gap-2">
              <div className="space-y-1">
                <Label>Kat</Label>
                <Input
                  type="number"
                  value={addr.floor}
                  onChange={(e) => w.updateAddress(i, { floor: Number(e.target.value) })}
                />
              </div>
              <label className="flex h-11 items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={addr.buildingElevator}
                  onChange={(e) => w.updateAddress(i, { buildingElevator: e.target.checked })}
                />
                Bina asansörü var
              </label>
            </div>
            {showElevator && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={addr.mobileElevator}
                  onChange={(e) => w.updateAddress(i, { mobileElevator: e.target.checked })}
                />
                Bu adreste mobil asansör kurulsun
              </label>
            )}
            <div className="space-y-1">
              <Label>Bina önü / yanaşma durumu</Label>
              <Input
                value={addr.truckAccess ?? ""}
                onChange={(e) => w.updateAddress(i, { truckAccess: e.target.value })}
                placeholder="Örn: dar sokak, araç bina önüne yanaşabilir"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold">Mesafe ve süre</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Tahmini mesafe (km)</Label>
              <Input
                type="number"
                min={0}
                value={w.distanceKm}
                onChange={(e) => w.set({ distanceKm: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Tahmini süre (saat)</Label>
              <Input
                type="number"
                min={0}
                step="0.5"
                value={w.estimatedHours}
                onChange={(e) => w.set({ estimatedHours: Number(e.target.value) })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={w.outOfCity}
              onChange={(e) => w.set({ outOfCity: e.target.checked })}
            />
            Şehir dışı taşıma
          </label>
        </CardContent>
      </Card>

      {showElevator && (
        <Card>
          <CardContent className="space-y-2 p-4">
            <p className="text-sm font-semibold">Cephe / balkon fotoğrafı</p>
            <p className="text-xs text-slate-500">
              Mobil asansörün kurulacağı cephe veya balkonun fotoğrafı keşif için önemlidir.
            </p>
            <PhotoInput
              photos={w.facadePhotoDataUrls}
              onChange={(p) => w.set({ facadePhotoDataUrls: p })}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
