// İlk kurulum: .env yoksa .env.example'dan kopyalar, veritabanını kurar ve seed eder.
import { copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log(".env oluşturuldu (.env.example kopyalandı)");
}

execSync("npx prisma migrate deploy", { stdio: "inherit" });
execSync("npx prisma generate", { stdio: "inherit" });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });

console.log("\nKurulum tamam. Başlatmak için: npm run dev  ->  http://localhost:7075");
