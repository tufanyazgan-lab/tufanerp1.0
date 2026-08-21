import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "tasinmakistiyorum.com — Araç + Mobil Asansör",
  description:
    "Kapalı kasa araç ve mobil eşya asansörü ile ev/ofis taşıma, ticari yük, inşaat malzemesi ve moloz taşıma. Hemen tahmini fiyat alın.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${geist.variable} bg-slate-50 font-sans text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
