"use client";

import { Camera, X } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

const MAX_DIM = 1280;
const JPEG_QUALITY = 0.7;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function PhotoInput({
  photos,
  onChange,
  label = "Fotoğraf Ekle",
}: {
  photos: string[];
  onChange: (photos: string[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    const urls = await Promise.all(Array.from(files).map(fileToCompressedDataUrl));
    onChange([...photos, ...urls]);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {photos.map((p, i) => (
        <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
          <Image src={p} alt={`Fotoğraf ${i + 1}`} fill unoptimized className="object-cover" />
          <button
            type="button"
            aria-label="Fotoğrafı kaldır"
            onClick={() => onChange(photos.filter((_, j) => j !== i))}
            className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-500 active:bg-slate-50"
      >
        <Camera className="h-5 w-5" />
        <span className="text-[10px]">{label}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
