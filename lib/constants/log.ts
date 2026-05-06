export const HATA_SEVIYE_LABEL: Record<string, string> = {
  FATAL: "Kritik",
  ERROR: "Hata",
  WARN: "Uyarı",
  INFO: "Bilgi",
  DEBUG: "Hata Ayıklama",
};

export const HATA_TARAF_LABEL: Record<string, string> = {
  BACKEND: "Sunucu",
  FRONTEND: "İstemci",
};

export const HATA_COZUM_LABEL = {
  EVET: "Çözüldü",
  HAYIR: "Açık",
} as const;

export const DENETIM_ISLEM_LABEL: Record<string, string> = {
  CREATE: "Oluşturma",
  UPDATE: "Güncelleme",
  DELETE: "Silme",
};

// Audit/Aktivite kaynak_tip kodları için Türkçe okunur etiketler.
// Saf sözlük + helper — client component'lerden de import edilir, server
// bağımlılığı olmamalıdır.
export const KAYNAK_TIP_LABEL: Record<string, string> = {
  Proje: "Proje",
  ProjeSablonu: "Proje Şablonu",
  Liste: "Liste",
  Kart: "Kart",
  Yorum: "Yorum",
  Eklenti: "Eklenti",
  KontrolListesi: "Kontrol Listesi",
  KontrolMaddesi: "Madde",
  Etiket: "Etiket",
  Kullanici: "Kullanıcı",
  Birim: "Birim",
  Rol: "Rol",
  Izin: "İzin",
  DavetTokeni: "Davet",
  Bildirim: "Bildirim",
  BildirimMailKuyrugu: "E-posta Bildirimi",
  ProjeYetkilisi: "Proje Yetkilisi",
  ListeYetkilisi: "Liste Yetkilisi",
  KartYetkilisi: "Kart Yetkilisi",
  ProjeBirimi: "Proje Birimi",
  ListeBirimi: "Liste Birimi",
  KartBirimi: "Kart Birimi",
  KartEtiket: "Kart Etiketi",
  KullaniciRol: "Kullanıcı Rolü",
  RolIzin: "Rol İzni",
  DavetProjeBaglami: "Davet → Proje",
  DavetListeBaglami: "Davet → Liste",
  DavetKartBaglami: "Davet → Kart",
};

export function kaynakTipEtiketi(tip: string): string {
  return KAYNAK_TIP_LABEL[tip] ?? tip;
}

export function hataSeviyeEtiketi(seviye: string): string {
  return HATA_SEVIYE_LABEL[seviye] ?? seviye;
}

export function hataTarafEtiketi(taraf: string): string {
  return HATA_TARAF_LABEL[taraf] ?? taraf;
}

export function denetimIslemEtiketi(islem: string): string {
  return DENETIM_ISLEM_LABEL[islem] ?? islem;
}
