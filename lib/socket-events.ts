// Socket.io event isim sabitleri (Kural 54: kebab-case namespace + iki nokta + fiil).
// Bu dosya server-server'da, Server Action'larda ve client hook'unda ortak referans.

// =====================================================================
// Sistem & oturum event'leri
// =====================================================================

export const SOCKET = {
  // İstemciden gelir — bir proje room'una katılma isteği. Server üyelik kontrol eder.
  PROJE_KATIL: "proje:katil",
  PROJE_AYRIL: "proje:ayril",
  // Kart presence (kim aktif görüntülüyor)
  KART_KATIL: "kart:katil",
  KART_AYRIL: "kart:ayril",
  // Server'dan gelir — kart room üyeleri (presence list)
  KART_PRESENCE: "kart:presence",
  // Bildirim — kullanıcı kendi room'unda alır
  BILDIRIM_YENI: "bildirim:yeni",

  // =====================================================================
  // Kart yaşam döngüsü
  // =====================================================================
  KART_OLUSTUR: "kart:olustur",
  KART_GUNCELLE: "kart:guncelle",
  KART_TASI: "kart:tasi",
  KART_SIL: "kart:sil",
  KART_GERI_YUKLE: "kart:geri-yukle",

  // =====================================================================
  // Liste yaşam döngüsü
  // =====================================================================
  LISTE_OLUSTUR: "liste:olustur",
  LISTE_GUNCELLE: "liste:guncelle",
  LISTE_SIL: "liste:sil",
  LISTE_SIRALA: "liste:sirala",

  // =====================================================================
  // Kart içi alt-kayıtlar
  // =====================================================================
  YORUM_OLUSTUR: "yorum:olustur",
  YORUM_GUNCELLE: "yorum:guncelle",
  YORUM_SIL: "yorum:sil",

  ETIKET_KART_EKLE: "etiket:kart-ekle",
  ETIKET_KART_KALDIR: "etiket:kart-kaldir",

  UYE_KART_EKLE: "uye:kart-ekle",
  UYE_KART_KALDIR: "uye:kart-kaldir",

  KONTROL_LISTESI_OLUSTUR: "kontrol-listesi:olustur",
  KONTROL_LISTESI_GUNCELLE: "kontrol-listesi:guncelle",
  KONTROL_LISTESI_SIL: "kontrol-listesi:sil",
  MADDE_OLUSTUR: "madde:olustur",
  MADDE_GUNCELLE: "madde:guncelle",
  MADDE_SIL: "madde:sil",

  EKLENTI_OLUSTUR: "eklenti:olustur",
  EKLENTI_SIL: "eklenti:sil",

  ILISKI_OLUSTUR: "iliski:olustur",
  ILISKI_SIL: "iliski:sil",

  KAPAK_AYARLA: "kapak:ayarla",
  KAPAK_KALDIR: "kapak:kaldir",
} as const;

export type SocketEventAdi = (typeof SOCKET)[keyof typeof SOCKET];

// =====================================================================
// Event payload tipleri (server → client + emit helper)
// =====================================================================

// Tüm broadcast event'leri request_id ile imzalanır — client kendi
// mutation'ının request_id'sini eşleştirir, drop eder (Kural 114).
// audit-context'ten geliyor; lib/realtime.ts otomatik ekler.
export type EventZarfi<T = unknown> = {
  request_id: string | null;
  ureten_id: string | null; // Mutation'ı yapan kullanıcı id'si
  // Olay yayınlandığı room (kontrol için, client filtre yapabilir)
  room: string;
  // İçerik
  veri: T;
};

// Room isim üreticileri — tek doğruluk kaynağı
export const room = {
  proje: (projeId: string) => `proje:${projeId}`,
  kart: (kartId: string) => `kart:${kartId}`,
  kullanici: (kullaniciId: string) => `kullanici:${kullaniciId}`,
};
