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

export function hataSeviyeEtiketi(seviye: string): string {
  return HATA_SEVIYE_LABEL[seviye] ?? seviye;
}

export function hataTarafEtiketi(taraf: string): string {
  return HATA_TARAF_LABEL[taraf] ?? taraf;
}

export function denetimIslemEtiketi(islem: string): string {
  return DENETIM_ISLEM_LABEL[islem] ?? islem;
}
