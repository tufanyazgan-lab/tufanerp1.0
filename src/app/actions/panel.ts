"use server";

import { tryPanelLogin } from "@/lib/panel-auth";
import { revalidatePath } from "next/cache";

export async function panelLogin(pin: string): Promise<{ ok: boolean }> {
  const ok = await tryPanelLogin(pin);
  if (ok) {
    revalidatePath("/admin");
    revalidatePath("/operator");
  }
  return { ok };
}
