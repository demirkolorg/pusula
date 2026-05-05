import { db } from "@/lib/db";

// ADR-0020 — REDDEDILDI durumundaki kart ve madde için retention temizliği.
// 90+ gün eski kayıtlar YOK durumuna döndürülür; tamamlanma_red_sebebi
// (kişisel veri içerebilir) silinir. Audit log korunur.

const VARSAYILAN_RETENTION_GUN = 90;
const MIN_RETENTION_GUN = 7;
const MAX_RETENTION_GUN = 365;

// Operasyonel hata güvencesi — env'den gelen değer clamp edilir.
// `Record<string, string | undefined>` kabul ederiz; process.env de uyumlu.
export function retentionGunOku(env: Record<string, string | undefined>): number {
  const ham = env.RETENTION_GUN;
  if (!ham) return VARSAYILAN_RETENTION_GUN;
  const sayi = Number(ham);
  if (!Number.isFinite(sayi) || sayi <= 0) return VARSAYILAN_RETENTION_GUN;
  return Math.min(MAX_RETENTION_GUN, Math.max(MIN_RETENTION_GUN, Math.floor(sayi)));
}

// Eşik tarihi: simdi - retentionGun gün önce. simdi enjekte edilebilir
// (test).
export function retentionEsigi(simdi: Date, retentionGun: number): Date {
  const ms = retentionGun * 24 * 60 * 60 * 1000;
  return new Date(simdi.getTime() - ms);
}

export type RetentionSonuc = {
  kartTemizlendi: number;
  maddeTemizlendi: number;
  esik: Date;
  retentionGun: number;
};

// Cron endpoint bunu çağırır. updateMany atomik per-row; iki tablo arasında
// tutarlılık beklentisi yok (her kayıt bağımsız retention kararıdır).
// Audit log middleware updateMany'i yakalar; her kart/madde için ayrı
// "değişti" kaydı atılır.
export async function oneriRetention(opt?: {
  simdi?: Date;
  retentionGun?: number;
}): Promise<RetentionSonuc> {
  const simdi = opt?.simdi ?? new Date();
  const retentionGun =
    opt?.retentionGun ?? retentionGunOku(process.env);
  const esik = retentionEsigi(simdi, retentionGun);

  const temizleVerisi = {
    tamamlanma_oneri_durumu: "YOK" as const,
    tamamlanma_oneren_id: null,
    tamamlanma_oneri_zamani: null,
    tamamlanma_red_sebebi: null,
  };

  const [kartSonuc, maddeSonuc] = await Promise.all([
    db.kart.updateMany({
      where: {
        tamamlanma_oneri_durumu: "REDDEDILDI",
        tamamlanma_oneri_zamani: { lt: esik },
      },
      data: temizleVerisi,
    }),
    db.kontrolMaddesi.updateMany({
      where: {
        tamamlanma_oneri_durumu: "REDDEDILDI",
        tamamlanma_oneri_zamani: { lt: esik },
      },
      data: temizleVerisi,
    }),
  ]);

  return {
    kartTemizlendi: kartSonuc.count,
    maddeTemizlendi: maddeSonuc.count,
    esik,
    retentionGun,
  };
}
