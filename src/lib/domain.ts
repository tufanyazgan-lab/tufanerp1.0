export const SERVICE_TYPES = ["ELEVATOR_ONLY", "TRUCK_ONLY", "TRUCK_PLUS_ELEVATOR"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  ELEVATOR_ONLY: "Sadece Mobil Asansör",
  TRUCK_ONLY: "Sadece Kapalı Kasa Araç",
  TRUCK_PLUS_ELEVATOR: "Araç + Mobil Asansör",
};

export const JOB_TYPES = [
  "HOME_MOVE",
  "OFFICE_MOVE",
  "PARTIAL_ITEMS",
  "COMMERCIAL",
  "CONSTRUCTION",
  "RUBBLE",
  "DOORS_WINDOWS",
  "OTHER",
] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  HOME_MOVE: "Ev Taşıma",
  OFFICE_MOVE: "Ofis Taşıma",
  PARTIAL_ITEMS: "Parça Eşya",
  COMMERCIAL: "Ticari Yük",
  CONSTRUCTION: "İnşaat / Tadilat Malzemesi",
  RUBBLE: "Moloz",
  DOORS_WINDOWS: "Kapı / Pencere / Doğrama",
  OTHER: "Diğer",
};

// Oda mantığı kullanan iş türleri
export const ROOM_BASED_JOB_TYPES: JobType[] = ["HOME_MOVE", "OFFICE_MOVE"];

export const HOME_TYPES = ["1+0", "1+1", "2+1", "3+1", "4+1", "4+2", "5+1", "5+2", "Diğer"] as const;
export type HomeType = (typeof HOME_TYPES)[number];

export const JOB_STATUSES = [
  "NEW_REQUEST",
  "AWAITING_INFO",
  "PRICING",
  "QUOTE_SENT",
  "APPROVED",
  "RESERVED",
  "EN_ROUTE",
  "ON_SITE",
  "AWAITING_PAYMENT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  NEW_REQUEST: "Yeni Talep",
  AWAITING_INFO: "Bilgi/Fotoğraf Bekleniyor",
  PRICING: "Fiyatlandırılıyor",
  QUOTE_SENT: "Teklif Gönderildi",
  APPROVED: "Onaylandı",
  RESERVED: "Rezervasyon Kesin",
  EN_ROUTE: "Yola Çıktı",
  ON_SITE: "Konumda",
  AWAITING_PAYMENT: "Ödeme Bekliyor",
  IN_PROGRESS: "İş Başladı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
};

// CLAUDE.md #8 akışına göre izinli durum geçişleri.
// CANCELLED tamamlanmamış her durumdan erişilebilir.
export const JOB_STATUS_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  NEW_REQUEST: ["AWAITING_INFO", "PRICING"],
  AWAITING_INFO: ["PRICING"],
  PRICING: ["QUOTE_SENT"],
  QUOTE_SENT: ["APPROVED", "PRICING"],
  APPROVED: ["RESERVED"],
  RESERVED: ["EN_ROUTE"],
  EN_ROUTE: ["ON_SITE"],
  ON_SITE: ["AWAITING_PAYMENT"],
  AWAITING_PAYMENT: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  if (to === "CANCELLED") return from !== "COMPLETED" && from !== "CANCELLED";
  return JOB_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export const PAYMENT_METHODS = ["CARD", "TRANSFER"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: "Kredi / Banka Kartı",
  TRANSFER: "Havale / EFT",
};

export const PAYMENT_STATUSES = ["PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Bekliyor",
  AUTHORIZED: "Ön Provizyon",
  PAID: "Ödendi",
  FAILED: "Başarısız",
  REFUNDED: "İade Edildi",
};

// Temel iş kuralı: ödeme tamamlanmadan iş başlatılamaz.
export function isPaymentComplete(paymentStatus: string | null | undefined): boolean {
  return paymentStatus === "PAID";
}

export const UNITS = ["adet", "paket", "m2", "torba", "kova", "çuval", "big bag", "kg", "koli", "levha", "kutu"] as const;
export type Unit = (typeof UNITS)[number];

export const CARGO_CATEGORY_LABELS: Record<string, string> = {
  general: "Genel Ticari Yük",
  construction: "İnşaat / Tadilat",
  rubble: "Moloz",
  doors_windows: "Kapı / Pencere / Doğrama",
  furniture_appliance: "Mobilya / Beyaz Eşya",
  pallet: "Paletli Ürün",
  machinery: "Makine / Ekipman",
  parcel: "Koli / Paket",
  other: "Diğer",
};
