"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { panelLogin } from "@/app/actions/panel";

export function PinGate({ title }: { title: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <main className="mx-auto max-w-sm space-y-4 p-4 pt-20">
      <h1 className="text-xl font-bold">{title}</h1>
      <div className="space-y-1">
        <Label>PIN</Label>
        <Input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      {error && <p className="text-sm text-red-600">Hatalı PIN</p>}
      <Button className="w-full" disabled={pending || pin.length === 0} onClick={submit}>
        Giriş
      </Button>
    </main>
  );

  function submit() {
    setError(false);
    startTransition(async () => {
      const res = await panelLogin(pin);
      if (res.ok) router.refresh();
      else setError(true);
    });
  }
}
