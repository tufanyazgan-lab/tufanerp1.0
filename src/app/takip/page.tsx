"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TakipPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <main className="mx-auto max-w-lg space-y-4 p-4 pt-12">
      <h1 className="text-xl font-bold">Talep Takibi</h1>
      <p className="text-sm text-slate-600">Size verilen takip kodunu girin.</p>
      <div className="space-y-1">
        <Label>Takip kodu</Label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="TAS-XXXXXX"
        />
      </div>
      <Button
        className="w-full"
        disabled={code.trim().length < 4}
        onClick={() => router.push(`/takip/${code.trim()}`)}
      >
        Sorgula
      </Button>
    </main>
  );
}
