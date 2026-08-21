"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UNITS } from "@/lib/domain";
import type { WizardItem } from "@/lib/wizard-types";
import { PhotoInput } from "./photo-input";

export function CustomItemForm({
  onAdd,
  onCancel,
  defaultUnit = "adet",
}: {
  onAdd: (item: WizardItem) => void;
  onCancel: () => void;
  defaultUnit?: string;
}) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [unit, setUnit] = useState(defaultUnit);
  const [dimensions, setDimensions] = useState("");
  const [weight, setWeight] = useState("");
  const [fragile, setFragile] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="space-y-1">
        <Label>Ad *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Piyano" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Adet / Miktar</Label>
          <Input
            type="number"
            min={0}
            step="any"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label>Birim</Label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label>Boyut</Label>
          <Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="En x Boy x Yük." />
        </div>
        <div className="space-y-1">
          <Label>Yaklaşık ağırlık (kg)</Label>
          <Input type="number" min={0} value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={fragile} onChange={(e) => setFragile(e.target.checked)} />
        Ağır / hassas yük (personel incelemesi gerekir)
      </label>
      <PhotoInput photos={photos} onChange={setPhotos} />
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!name.trim() || qty <= 0}
          onClick={() =>
            onAdd({
              name: name.trim(),
              qty,
              unit,
              dimensions: dimensions || undefined,
              approxWeight: weight ? Number(weight) : undefined,
              isCustom: true,
              fragile,
              photoDataUrls: photos,
            })
          }
        >
          Ekle
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Vazgeç
        </Button>
      </div>
    </div>
  );
}
