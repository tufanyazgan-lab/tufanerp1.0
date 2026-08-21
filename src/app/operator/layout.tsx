import { isPanelAuthed } from "@/lib/panel-auth";
import { PinGate } from "@/components/panel/pin-gate";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPanelAuthed())) return <PinGate title="Operatör Girişi" />;
  return <div className="mx-auto max-w-lg">{children}</div>;
}
