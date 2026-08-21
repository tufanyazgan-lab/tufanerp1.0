import Link from "next/link";
import { isPanelAuthed } from "@/lib/panel-auth";
import { PinGate } from "@/components/panel/pin-gate";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/talepler", label: "Talepler" },
  { href: "/admin/takvim", label: "Takvim" },
  { href: "/admin/tarifeler", label: "Tarifeler" },
  { href: "/admin/sablonlar", label: "Şablonlar" },
  { href: "/admin/kaynaklar", label: "Araç & Operatör" },
  { href: "/admin/kayitlar", label: "Audit Log" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPanelAuthed())) return <PinGate title="Yönetim Paneli" />;

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 py-2">
          <span className="mr-2 shrink-0 text-sm font-bold">tasinmakistiyorum</span>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="mx-auto max-w-4xl p-4">{children}</div>
    </div>
  );
}
