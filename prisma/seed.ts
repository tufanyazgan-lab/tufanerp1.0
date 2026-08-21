import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Ev tipine göre otomatik oda listesi (CLAUDE.md #4)
const HOME_ROOMS: Record<string, Array<{ key: string; name: string }>> = {
  "1+0": [
    { key: "living", name: "Yaşam Alanı" },
    { key: "kitchen", name: "Mutfak" },
    { key: "bathroom", name: "Banyo" },
  ],
  "1+1": [
    { key: "living", name: "Salon" },
    { key: "bedroom", name: "Yatak Odası" },
    { key: "kitchen", name: "Mutfak" },
    { key: "bathroom", name: "Banyo" },
  ],
  "2+1": [
    { key: "living", name: "Salon" },
    { key: "bedroom", name: "Yatak Odası" },
    { key: "bedroom2", name: "Oda 2" },
    { key: "kitchen", name: "Mutfak" },
    { key: "bathroom", name: "Banyo" },
  ],
  "3+1": [
    { key: "living", name: "Salon" },
    { key: "bedroom", name: "Yatak Odası" },
    { key: "bedroom2", name: "Çocuk Odası" },
    { key: "bedroom3", name: "Oda 3" },
    { key: "kitchen", name: "Mutfak" },
    { key: "bathroom", name: "Banyo" },
    { key: "balcony", name: "Balkon" },
  ],
  "4+1": [
    { key: "living", name: "Salon" },
    { key: "bedroom", name: "Yatak Odası" },
    { key: "bedroom2", name: "Çocuk Odası" },
    { key: "bedroom3", name: "Oda 3" },
    { key: "bedroom4", name: "Oda 4" },
    { key: "kitchen", name: "Mutfak" },
    { key: "bathroom", name: "Banyo" },
    { key: "balcony", name: "Balkon" },
  ],
  "4+2": [
    { key: "living", name: "Salon" },
    { key: "living2", name: "Oturma Odası" },
    { key: "bedroom", name: "Yatak Odası" },
    { key: "bedroom2", name: "Çocuk Odası" },
    { key: "bedroom3", name: "Oda 3" },
    { key: "bedroom4", name: "Oda 4" },
    { key: "kitchen", name: "Mutfak" },
    { key: "bathroom", name: "Banyo" },
    { key: "balcony", name: "Balkon" },
  ],
  "5+1": [
    { key: "living", name: "Salon" },
    { key: "bedroom", name: "Yatak Odası" },
    { key: "bedroom2", name: "Çocuk Odası" },
    { key: "bedroom3", name: "Oda 3" },
    { key: "bedroom4", name: "Oda 4" },
    { key: "bedroom5", name: "Oda 5" },
    { key: "kitchen", name: "Mutfak" },
    { key: "bathroom", name: "Banyo" },
    { key: "balcony", name: "Balkon" },
  ],
  "5+2": [
    { key: "living", name: "Salon" },
    { key: "living2", name: "Oturma Odası" },
    { key: "bedroom", name: "Yatak Odası" },
    { key: "bedroom2", name: "Çocuk Odası" },
    { key: "bedroom3", name: "Oda 3" },
    { key: "bedroom4", name: "Oda 4" },
    { key: "bedroom5", name: "Oda 5" },
    { key: "kitchen", name: "Mutfak" },
    { key: "bathroom", name: "Banyo" },
    { key: "balcony", name: "Balkon" },
  ],
  Diğer: [{ key: "living", name: "Alan 1" }],
};

// Oda şablon eşyaları — groupKey oda anahtarının önekiyle eşleşir (bedroom2 -> bedroom)
const ROOM_ITEMS: Record<string, Array<{ name: string; qty?: number; weight?: number }>> = {
  bedroom: [
    { name: "Yatak", weight: 40 },
    { name: "Baza", weight: 50 },
    { name: "Gardırop", weight: 80 },
    { name: "Komodin", qty: 2, weight: 15 },
    { name: "Şifonyer", weight: 40 },
    { name: "Ayna", weight: 10 },
  ],
  living: [
    { name: "Üçlü Koltuk", weight: 70 },
    { name: "İkili Koltuk", weight: 55 },
    { name: "Berjer", weight: 30 },
    { name: "TV", weight: 15 },
    { name: "TV Ünitesi", weight: 45 },
    { name: "Yemek Masası", weight: 40 },
    { name: "Sandalye", qty: 6, weight: 6 },
    { name: "Orta Sehpa", weight: 15 },
  ],
  kitchen: [
    { name: "Buzdolabı", weight: 80 },
    { name: "Çamaşır Makinesi", weight: 70 },
    { name: "Bulaşık Makinesi", weight: 50 },
    { name: "Fırın", weight: 40 },
    { name: "Mutfak Masası", weight: 25 },
    { name: "Mikrodalga", weight: 12 },
  ],
  bathroom: [
    { name: "Çamaşır Sepeti", weight: 3 },
    { name: "Banyo Dolabı", weight: 20 },
  ],
  balcony: [
    { name: "Balkon Masası", weight: 12 },
    { name: "Balkon Sandalyesi", qty: 4, weight: 5 },
  ],
};

// Odalardan bağımsız ekstra eşyalar (CLAUDE.md #4)
const EXTRA_ITEMS = [
  { name: "Balkon Takımı", weight: 30 },
  { name: "Bisiklet", weight: 15 },
  { name: "Mangal", weight: 10 },
  { name: "Büyük Saksı", weight: 20 },
  { name: "Derin Dondurucu", weight: 60 },
  { name: "Kurutma Makinesi", weight: 50 },
  { name: "Koşu Bandı", weight: 90 },
  { name: "Kondisyon Bisikleti", weight: 40 },
  { name: "Çelik Kasa", weight: 150 },
  { name: "Akvaryum", weight: 40 },
  { name: "Koli", unit: "koli", weight: 10 },
  { name: "Hurç", unit: "adet", weight: 12 },
  { name: "Çuval", unit: "çuval", weight: 15 },
];

const CARGO_CATEGORIES = [
  { key: "general", name: "Genel Ticari Yük" },
  { key: "construction", name: "İnşaat / Tadilat" },
  { key: "rubble", name: "Moloz" },
  { key: "doors_windows", name: "Kapı / Pencere / Doğrama" },
  { key: "furniture_appliance", name: "Mobilya / Beyaz Eşya" },
  { key: "pallet", name: "Paletli Ürün" },
  { key: "machinery", name: "Makine / Ekipman" },
  { key: "parcel", name: "Koli / Paket" },
  { key: "other", name: "Diğer" },
];

const CARGO_ITEMS: Record<string, Array<{ name: string; unit?: string; weight?: number }>> = {
  construction: [
    { name: "Parke Paketi", unit: "paket", weight: 20 },
    { name: "Seramik Kutusu", unit: "kutu", weight: 25 },
    { name: "Çimento Torbası", unit: "torba", weight: 50 },
    { name: "Alçı / Sıva Torbası", unit: "torba", weight: 35 },
    { name: "Alçıpan Levha", unit: "levha", weight: 25 },
    { name: "Boya Kovası", unit: "kova", weight: 20 },
    { name: "Vitrifiye", unit: "adet", weight: 30 },
    { name: "Mutfak Dolabı Modülü", unit: "adet", weight: 30 },
    { name: "Tezgah", unit: "adet", weight: 40 },
    { name: "İç Kapı", unit: "adet", weight: 20 },
    { name: "Çelik Kapı", unit: "adet", weight: 60 },
    { name: "PVC Pencere", unit: "adet", weight: 25 },
    { name: "Alüminyum Doğrama", unit: "adet", weight: 20 },
    { name: "Cam Panel", unit: "adet", weight: 30 },
  ],
  rubble: [
    { name: "Moloz Çuvalı", unit: "çuval", weight: 25 },
    { name: "Big Bag", unit: "big bag", weight: 800 },
    { name: "Moloz Kovası", unit: "kova", weight: 15 },
    { name: "Karışık Moloz", unit: "kg", weight: 1 },
  ],
  doors_windows: [
    { name: "İç Kapı", unit: "adet", weight: 20 },
    { name: "Çelik Kapı", unit: "adet", weight: 60 },
    { name: "PVC Pencere", unit: "adet", weight: 25 },
    { name: "Cam Panel", unit: "adet", weight: 30 },
  ],
  general: [
    { name: "Koli", unit: "koli", weight: 10 },
    { name: "Palet", unit: "adet", weight: 300 },
    { name: "Varil", unit: "adet", weight: 60 },
  ],
  furniture_appliance: [
    { name: "Beyaz Eşya", unit: "adet", weight: 60 },
    { name: "Koltuk", unit: "adet", weight: 60 },
    { name: "Dolap", unit: "adet", weight: 70 },
  ],
  pallet: [{ name: "Palet", unit: "adet", weight: 300 }],
  machinery: [{ name: "Makine / Ekipman", unit: "adet", weight: 200 }],
  parcel: [{ name: "Koli / Paket", unit: "koli", weight: 10 }],
};

async function main() {
  // idempotent: mevcut katalog/şablon/tarife verisini yenile
  await prisma.homeTemplate.deleteMany();
  await prisma.catalogItem.deleteMany();
  await prisma.cargoCategory.deleteMany();

  for (const [homeType, rooms] of Object.entries(HOME_ROOMS)) {
    await prisma.homeTemplate.createMany({
      data: rooms.map((r, i) => ({ homeType, roomKey: r.key, roomName: r.name, sortNo: i })),
    });
  }

  for (const [groupKey, items] of Object.entries(ROOM_ITEMS)) {
    await prisma.catalogItem.createMany({
      data: items.map((it, i) => ({
        scope: "ROOM_TEMPLATE",
        groupKey,
        name: it.name,
        defaultQty: it.qty ?? 1,
        approxWeight: it.weight,
        sortNo: i,
      })),
    });
  }

  await prisma.catalogItem.createMany({
    data: EXTRA_ITEMS.map((it, i) => ({
      scope: "EXTRA",
      groupKey: "extra",
      name: it.name,
      defaultQty: 1,
      unit: (it as { unit?: string }).unit ?? "adet",
      approxWeight: it.weight,
      sortNo: i,
    })),
  });

  for (const [i, cat] of CARGO_CATEGORIES.entries()) {
    await prisma.cargoCategory.create({ data: { key: cat.key, name: cat.name, sortNo: i } });
  }

  for (const [groupKey, items] of Object.entries(CARGO_ITEMS)) {
    await prisma.catalogItem.createMany({
      data: items.map((it, i) => ({
        scope: "CARGO",
        groupKey,
        name: it.name,
        defaultQty: 1,
        unit: it.unit ?? "adet",
        approxWeight: it.weight,
        sortNo: i,
      })),
    });
  }

  const tariffCount = await prisma.tariff.count();
  if (tariffCount === 0) {
    await prisma.tariff.create({
      data: {
        kind: "COMBO",
        name: "Standart Tarife",
        minFee: 3000,
        includedKm: 10,
        perExtraKm: 40,
        includedHours: 2,
        perExtraHour: 500,
        perExtraTrip: 1500,
        waitingPerHour: 400,
        outOfCityMultiplier: 1.3,
        setupFee: 750,
        extraSetupFee: 500,
        floorThreshold: 10,
        perExtraFloor: 100,
        rubbleSurcharge: 800,
        comboDiscount: 500,
      },
    });
    await prisma.tariff.create({
      data: {
        kind: "ELEVATOR",
        name: "Asansör Tarifesi",
        minFee: 2000,
        setupFee: 750,
        extraSetupFee: 500,
        includedHours: 2,
        perExtraHour: 600,
        floorThreshold: 10,
        perExtraFloor: 100,
        rubbleSurcharge: 800,
      },
    });
  }

  const vehicleCount = await prisma.vehicle.count();
  if (vehicleCount === 0) {
    await prisma.vehicle.createMany({
      data: [
        { kind: "TRUCK", name: "Kapalı Kasa Kamyonet", plate: "34 TAS 001" },
        { kind: "ELEVATOR", name: "Mobil Asansör Aracı", plate: "34 TAS 002" },
      ],
    });
  }

  const operatorCount = await prisma.operator.count();
  if (operatorCount === 0) {
    await prisma.operator.createMany({
      data: [
        { name: "Operatör 1", phone: "+905550000001", role: "operator" },
        { name: "Yönetici", phone: "+905550000000", role: "admin" },
      ],
    });
  }

  console.log("Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
