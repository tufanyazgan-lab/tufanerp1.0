import { cookies } from "next/headers";

// MVP paneli kilidi: tek PIN, cookie ile. Prod'da Supabase Auth + gerçek roller gelecek (docs/DECISIONS.md).
const PIN = process.env.PANEL_PIN ?? "7070";
const COOKIE = "panel_auth";

export async function isPanelAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE)?.value === PIN;
}

export async function tryPanelLogin(pin: string): Promise<boolean> {
  if (pin !== PIN) return false;
  const store = await cookies();
  store.set(COOKIE, PIN, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 12 });
  return true;
}
