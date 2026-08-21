"use client";

import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  value,
  onChange,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Azalt"
        onClick={() => onChange(Math.max(0, value - step))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 active:bg-slate-100 disabled:opacity-30"
        disabled={value <= 0}
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Artır"
        onClick={() => onChange(value + step)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-700 active:bg-slate-100"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
