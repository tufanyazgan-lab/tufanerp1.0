# Mimari Kararlar

## 1. Veritabanı: Prisma + SQLite (dev), Postgres/Supabase (prod hedefi)
CLAUDE.md Supabase önerir; bu ortamda gerçek Supabase kimlik bilgisi yok.
Şema Prisma ile kuruldu, SQLite dev veritabanıyla çalışır. Prod'a geçiş:
`datasource.provider = "postgresql"` + `DATABASE_URL` değişikliği ve `prisma migrate`.
Enum yerine String alanlar SQLite uyumluluğu için; geçerli değerler `src/lib/domain.ts` içinde tek noktadan yönetilir.

## 2. Prisma 6 (7 değil)
Prisma 7'nin yeni `prisma.config.ts` + driver adapter zorunluluğu MVP için gereksiz karmaşıklık.
Prisma 6 stable ve klasik yapılandırmayla çalışıyor. Yükseltme geri döndürülebilir.

## 3. shadcn/ui bileşenleri elle yazıldı
Bu ortamdan shadcn registry'ye ağ erişimi yok. Aynı kalıp (Tailwind + cva + cn) ile
`src/components/ui/*` altında minimal bileşen seti oluşturuldu. `npx shadcn add` ile
sonradan gerçek bileşenlerle değiştirilebilir.

## 4. Fotoğraflar MVP'de data URL
`photos.dataUrl` alanında base64 saklanır. Prod'da Supabase Storage'a taşınır;
alan adı ve `kind` (ITEM/FACADE/BEFORE/AFTER) modeli korunur.

## 5. Kimlik doğrulama MVP kapsamı
Müşteri hesabı zorunlu değil (CLAUDE.md #11): talep telefonla oluşturulur, takip kodu verilir.
Operatör/admin ekranları MVP'de basit rol seçimiyle açılır; prod'da Supabase Auth eklenecek.

## 6. Durum makinesi
CLAUDE.md #8 akışı `src/lib/domain.ts` içindeki `JOB_STATUS_TRANSITIONS` ile kodlandı.
Ödeme kilidi: `AWAITING_PAYMENT -> IN_PROGRESS` geçişi yalnız `Payment.status == PAID` iken
sunucu tarafında izinlidir.

## 7. Fiyat motoru
`src/lib/pricing.ts` pure fonksiyon; tarife değerleri DB'den (admin CRUD) gelir,
hard-code yok. Tahmini aralık -%5/+%15; kesin fiyat personel onayıyla `Quote(kind=FINAL)`.
