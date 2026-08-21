import Link from "next/link";
import { ArrowRight, Building2, Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          tasinmakistiyorum.com
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight">
          Araç + mobil asansörle
          <br />
          zahmetsiz taşıma
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Kapalı kasa nakliye aracı ve mobil eşya asansörü. Ev/ofis taşıma, parça eşya, ticari yük,
          inşaat malzemesi ve moloz. Üyelik gerekmez.
        </p>
      </header>

      <Link href="/talep">
        <Button size="lg" className="w-full">
          Hemen Tahmini Fiyat Al <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>

      <div className="mt-8 grid gap-3">
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <Truck className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <div>
              <p className="text-sm font-semibold">Kapalı kasa araç</p>
              <p className="text-xs text-slate-500">Eşyalarınız hava koşullarından etkilenmeden güvenle taşınır.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <div>
              <p className="text-sm font-semibold">Mobil eşya asansörü</p>
              <p className="text-xs text-slate-500">
                Dar merdivenlere takılmayın; eşyalar balkon/pencereden asansörle iner ve çıkar.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <Package className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <div>
              <p className="text-sm font-semibold">Ticari yük, inşaat ve moloz</p>
              <p className="text-xs text-slate-500">
                Parke, seramik, çimento, alçıpan, kapı/pencere ve moloz taşıma için hazır seçenekler.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 space-y-2 text-center text-sm">
        <p className="text-slate-500">Mevcut talebiniz mi var?</p>
        <Link href="/takip" className="font-medium text-slate-900 underline">
          Takip koduyla sorgulayın
        </Link>
      </div>

      <footer className="mt-auto pt-10 text-center text-xs text-slate-400">
        <div className="space-x-3">
          <Link href="/operator" className="underline">
            Operatör Girişi
          </Link>
          <Link href="/admin" className="underline">
            Yönetim Paneli
          </Link>
        </div>
      </footer>
    </main>
  );
}
