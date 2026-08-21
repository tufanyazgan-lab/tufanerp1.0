# tasinmakistiyorum.com — MVP

Araç + mobil asansör + ev/ofis taşıma + genel/ticari yük + inşaat/tadilat + moloz operasyonu için Next.js tabanlı MVP.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + SQLite (dev) — prod'da Postgres/Supabase'e geçişe hazır şema, bkz. `docs/DECISIONS.md`
- Zod + React Hook Form
- Vitest (fiyat motoru testleri)

## Geliştirme
```bash
npm install
npm run db:migrate   # Prisma migration + seed
npm run dev           # http://localhost:7075
```

> 8080 portunu kullanma; bu proje için local port **7075** olarak belirlenmiştir.

## Claude ile geliştirme
`CLAUDE.md` projenin ana ürün/geliştirme talimatıdır. Değişiklik yapmadan önce onu oku.

## Test / kalite
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Mimari kararlar
Bkz. `docs/DECISIONS.md`.
