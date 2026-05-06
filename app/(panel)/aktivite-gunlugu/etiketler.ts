import type { AktiviteGunluguSatiri } from "./services";

export const ISLEM_ETIKETI: Record<AktiviteGunluguSatiri["islem"], string> = {
  CREATE: "Yeni kayıt",
  UPDATE: "Güncelleme",
  DELETE: "Silme",
};

const KAYNAK_TIP_ETIKETLERI: Record<string, string> = {
  Proje: "Proje",
  Liste: "Liste",
  Kart: "Kart",
  Yorum: "Yorum",
  Eklenti: "Dosya eki",
  // ADR-0028 — yeni dosya yönetimi kaynakları
  Dosya: "Dosya",
  DosyaSurumu: "Sürüm",
  DosyaBaglantisi: "Bağlantı",
  DosyaEtiketi: "Dosya etiketi",
  KontrolListesi: "Kontrol listesi",
  KontrolMaddesi: "Kontrol maddesi",
  Etiket: "Etiket",
  KartEtiket: "Kart etiketi",
  KartYetkilisi: "Kart yetkilisi",
  KartBirimi: "Kart birimi",
  ListeYetkilisi: "Liste yetkilisi",
  ListeBirimi: "Liste birimi",
  ProjeYetkilisi: "Proje yetkilisi",
  ProjeBirimi: "Proje birimi",
  Kullanici: "Kullanıcı",
  Rol: "Rol",
  Birim: "Birim",
  HataLogu: "Hata logu",
};

export function kaynakTipEtiketi(tip: string): string {
  return (
    KAYNAK_TIP_ETIKETLERI[tip] ??
    tip.replace(/([\p{Ll}])([\p{Lu}])/gu, "$1 $2")
  );
}
