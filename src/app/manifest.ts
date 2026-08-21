import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "tasinmakistiyorum.com",
    short_name: "tasinmakistiyorum",
    description: "Araç + mobil asansörle taşıma: tahmini fiyat alın, talebinizi takip edin.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0f172a",
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
