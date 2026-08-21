# CLAUDE.md — tasinmakistiyorum.com

Bu dosya Claude Code / VS Code Claude için projenin ana geliştirme talimatıdır. Projede çalışmaya başlamadan önce bu dosyanın tamamını ve `README.md` dosyasını oku. Mevcut HTML/JS sürümü çalışan bir iş modeli prototipidir; nihai hedef bunu sürdürülebilir, mobil öncelikli gerçek bir web uygulamasına dönüştürmektir.

## 1. Marka ve geliştirme ortamı
- Marka/domain: `tasinmakistiyorum.com`
- Müşteriye görünen alanlarda bu marka kullanılacak.
- Local development portu: **7070**.
- 8080 kullanma.
- Local URL: `http://localhost:7070`

## 2. Ürünün amacı
Tek işletmenin iki ayrı varlığını yöneten lojistik/taşıma sistemi:
1. Kapalı kasa nakliye aracı
2. Ayrı mobil yük/eşya asansörü aracı

MVP bir pazaryeri değildir. Partner, dış sürücü havuzu, puanlama, sadakat veya abonelik sistemi ekleme.

## 3. Ana hizmetler
Müşteri önce şunlardan birini seçer:
- Sadece mobil asansör
- Sadece kapalı kasa araç
- Araç + mobil asansör

Ardından iş türü:
- Ev taşıma
- Ofis taşıma
- Parça eşya
- Ticari yük
- İnşaat / tadilat malzemesi
- Moloz
- Kapı / pencere / doğrama
- Diğer

## 4. Ev / ofis keşif akışı
- İlk adım yapı tipi: `1+0`, `1+1`, `2+1`, `3+1`, `4+1`, `4+2`, `5+1`, `5+2`, `Diğer`.
- Seçime göre odalar otomatik oluşur.
- Oda isimleri gerektiğinde değiştirilebilir.
- Her oda, yönetilebilir varsayılan eşya şablonuyla gelir.
- Her eşyanın adedi `- / +` ile sıfıra kadar azaltılabilir veya artırılabilir.
- Yatak odası örneği: yatak, baza, gardırop, komodin, şifonyer, ayna.
- Salon örneği: üçlü/ikili koltuk, berjer, TV, TV ünitesi, yemek masası, sandalye, orta sehpa.
- Mutfak ve diğer oda şablonları da hazır gelir.
- Her odada `+ Başka Eşya Ekle` bulunur.
- Özel eşya eklerken ad, adet, boyut, yaklaşık ağırlık ve fotoğraf alınabilsin.
- Odalardan bağımsız `Diğer / Ekstra Eşyalar` bölümü olsun: balkon takımı, bisiklet, mangal, büyük saksı, derin dondurucu, kurutma makinesi, koşu bandı, kondisyon bisikleti, çelik kasa, akvaryum vb.
- Koli, hurç, çuval gibi kalemler ayrıca girilebilsin.
- Oda/eşya fotoğrafları yüklenebilsin.

## 5. Ticari yük / inşaat / moloz akışı
Oda mantığı yerine kategori ve yük kalemi mantığı kullan.

Hazır kategoriler:
- Genel ticari yük
- İnşaat / tadilat
- Moloz
- Kapı / pencere / doğrama
- Mobilya / beyaz eşya
- Paletli ürün
- Makine / ekipman
- Koli / paket
- Diğer

İnşaat/tadilat hazır kalemleri en az:
- Parke paketi (paket veya m²)
- Seramik kutusu
- Çimento torbası
- Alçı / sıva torbası
- Alçıpan levha
- Boya kovası
- Vitrifiye
- Mutfak dolabı modülü
- Tezgah
- İç kapı
- Çelik kapı
- PVC pencere
- Alüminyum doğrama
- Cam panel

Molozda adet yerine gerektiğinde çuval, big bag, kova, kg gibi birimler kullanılabilsin. Kullanıcı her kategoride `+ Başka Malzeme/Yük Ekle` ile serbest kalem ekleyebilsin. Kalemlerde adet/miktar, birim, ölçüler, yaklaşık ağırlık ve fotoğraf desteklensin. Ağır/hassas yükler personel incelemesi gerektiren şekilde işaretlenebilsin.

## 6. Adres ve keşif bilgileri
- Alış adresi
- Teslim adresi (gerekiyorsa)
- Kat bilgileri
- Bina asansörü bilgisi
- Mobil asansör ihtiyacı
- Kaç adreste mobil asansör kurulacağı
- Bina önü / yanaşma durumu
- Asansör kullanılacak cephe/balkon fotoğrafı
- Harita üzerinden rota ve km
- Tahmini hacim ve ağırlık

## 7. Fiyat motoru
Fiyatlar business logic içine hard-code edilmemeli. Admin panelinden yönetilmeli.

Araç tarifesi en az:
- Minimum hizmet bedeli
- Dahil km
- Ek km ücreti
- Dahil süre
- Ek saat
- Ek sefer
- Bekleme
- Şehir dışı kuralı/katsayısı

Asansör tarifesi en az:
- Minimum hizmet bedeli
- Kurulum
- İkinci/ek kurulum
- Dahil süre
- Ek saat
- Kat/yükseklik kuralı
- Moloz/özel yük kuralı

Araç + asansör için paket tarife veya birleşik hesap desteklenebilir. Müşteriye ilk aşamada tahmini fiyat/aralık gösterilebilir; kesin fiyat personel tarafından fotoğraf/telefon/WhatsApp kontrolünden sonra verilir. Operatör yetkisi yoksa keyfi fiyat yazamaz; ek hizmetler tarifeden gelir.

## 8. Teklif, rezervasyon ve ödeme
Akış:
`Yeni Talep -> Bilgi/Fotoğraf Bekleniyor -> Fiyatlandırılıyor -> Teklif Gönderildi -> Onaylandı -> Rezervasyon Kesin -> Yola Çıktı -> Konumda -> Ödeme Bekliyor -> İş Başladı -> Tamamlandı / İptal`

Ödeme yöntemleri:
- Kredi/banka kartı
- Havale/EFT

Temel kural: **Hizmet bedeli işe başlamadan önce tahsil edilir. Ödeme tamamlanmadan hizmet başlatılmaz.**

Kart sağlayıcısı destekliyorsa adapter üzerinden ön provizyon/capture mimarisi kurulabilsin; MVP'yi tek bir ödeme sağlayıcısına sıkı bağlama. Havale/EFT manuel onaylanabilsin; ileride banka entegrasyonuna açık tasarla.

## 9. Operatör mobil akışı
Operatör ekranı mobil öncelikli olmalı:
- Bugünkü işler
- İş detayı
- Navigasyonu aç
- Konuma geldim
- GPS + timestamp kaydı
- Öncesi fotoğrafları
- Ödeme durumu
- Ödeme yoksa `İşe Başla` kilitli
- İşe başla
- Ek süre / ek sefer / ek kurulum / bekleme
- Sonrası fotoğrafları
- İşi bitir

Tüm kritik durum ve fiyat değişiklikleri audit log'a yazılmalı.

## 10. Yönetim paneli
En az şu modüller:
- Dashboard
- Talepler
- Teklifler
- Rezervasyonlar
- Takvim
- Araçlar
- Mobil asansör araçları
- Operatörler
- Müşteriler
- İş emirleri
- Ödemeler
- Fotoğraflar
- Fiyat tarifeleri
- Ev/ofis oda ve eşya şablonları
- Ticari yük kategorileri ve kalemleri
- Raporlama
- Audit log

## 11. Roller
- public/customer
- dispatcher/admin
- operator/driver

Müşteri hesabı zorunlu olmasın. Telefon numarası ve gerektiğinde SMS doğrulamasıyla talep/rezervasyon takibi yapılabilsin.

## 12. Önerilen teknik mimari
Mevcut prototipi analiz et; iyi parçaları koru fakat geçici yapıya bağlı kalma.

Hedef stack:
- Next.js 15 + TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth + PostgreSQL + Storage
- Zod
- React Hook Form
- Harita sağlayıcı adapter'ı (ilk aday Google Maps)
- Ödeme sağlayıcı adapter'ı
- PWA manifest/service worker

Önerilen ana tablolar/entity'ler:
`customers`, `leads`, `jobs`, `job_addresses`, `home_profiles`, `rooms`, `item_catalog`, `job_items`, `cargo_categories`, `photos`, `quotes`, `quote_lines`, `tariffs`, `vehicles`, `operators`, `assignments`, `payments`, `payment_events`, `job_events`, `audit_logs`.

Şemayı birebir kopyalamak zorunda değilsin; fakat ayrımları ve audit edilebilirliği koru.

> **Uygulama notu (bu proje için karar):** Bu repo'da gerçek Supabase kimlik bilgisi yok. Aynı şemayı Prisma + SQLite (dev) ile kuruyoruz; `DATABASE_URL` değiştirilerek prod'da Postgres/Supabase'e geçiş yapılabilecek şekilde tasarlanmıştır. Bu geri döndürülebilir bir teknik karardır, bkz. `docs/DECISIONS.md`.

## 13. UX kuralları
- Mobile-first.
- Müşteriye uzun metin formları doldurtma.
- Seçim kartları, `+/-`, fotoğraf ve akıllı varsayılanlar kullan.
- Gereksiz üyelik zorunluluğu yok.
- Ev tipi seçimi -> otomatik odalar -> hazır eşya -> düzelt -> ekstra ekle -> fotoğraf akışı korunmalı.
- Ticari yükte kategori -> hazır kalem -> miktar -> ekstra kalem -> fotoğraf akışı korunmalı.
- Telefon ve WhatsApp ile kesin fiyat alma davranışı korunmalı.

## 14. MVP dışında bırakılacaklar
Şimdilik ekleme:
- Partnerlik sistemi
- Açık pazaryeri
- Dış sürücü/araç havuzu
- Puanlama
- Sadakat programı
- Abonelik paketleri
- Gereksiz AI özellikleri

## 15. Çalışma yöntemi
1. Önce repo/proje ağacını tamamen incele.
2. `CLAUDE.md` ve `README.md` dosyalarını oku.
3. Mevcut prototipi gereksinimlerle karşılaştır.
4. Eksikleri ve teknik borçları belirle.
5. Kısa bir uygulama planı oluştur.
6. Sonra doğrudan geliştirmeye başla; yalnız plan yazıp durma.
7. İşi küçük, geri döndürülebilir aşamalara böl.
8. Her önemli aşamada build, lint, typecheck ve testleri çalıştır.
9. Hata varsa çözmeden sonraki aşamaya geçme.
10. Önemli mimari kararları dokümante et.
11. Geri döndürülebilir teknik ayrıntılarda kullanıcıyı sürekli sorularla durdurma; makul varsayım yap ve ilerle.
12. İş modelini, fiyatlandırmayı, ödeme mantığını veya ana müşteri deneyimini değiştirecek kararları kullanıcıya sor.
13. Mevcut çalışan özellikleri sebepsiz bozma.

## 16. İlk kabul kriterleri
- Responsive müşteri keşif wizard'ı
- Dinamik ev tipi/oda/eşya şablonları
- Oda bazlı serbest eşya ekleme
- Genel ekstra eşyalar
- Dinamik ticari yük/moloz/inşaat şablonları
- Fotoğraf yükleme
- Adres/kat/asansör bilgileri
- Admin yönetimli tarife CRUD
- Test edilebilir fiyat hesaplama servisi
- Kesin teklif akışı
- Rezervasyon takvimi
- Kart/havale ödeme durumları
- Operatör ödeme kilidi
- GPS/timestamp/before-after kayıt modeli
- Ek süre/sefer/kurulum
- Status history + audit trail
- Mevcut browser MVP varsayımlarını yeniden üreten seed data

Bu dosya proje boyunca ana ürün talimatıdır. Gereksinimlerle kod arasında çelişki varsa, açıkça dokümante edilmiş yeni bir kullanıcı kararı yoksa bu dosyadaki iş kurallarını esas al.

---

@AGENTS.md
