// Son Aktiviteler için saf gruplama/format helper'ları (Kural 131).
// React/DOM bağımlılığı yok — doğrudan unit test edilir.

export type ZamanGrubu = "bugun" | "dun" | "buHafta" | "daha-eski";

export const GRUP_BASLIKLARI: Record<ZamanGrubu, string> = {
  bugun: "Bugün",
  dun: "Dün",
  buHafta: "Bu Hafta",
  "daha-eski": "Daha Eski",
};

const GRUP_SIRASI: ZamanGrubu[] = ["bugun", "dun", "buHafta", "daha-eski"];

// Tarihi yerel saatte günün başına çek (00:00:00). Aynı gün karşılaştırması
// için saat dilimi farklarını sıfırlar.
function gununBasi(d: Date): Date {
  const t = new Date(d);
  t.setHours(0, 0, 0, 0);
  return t;
}

// Verilen zamanı şimdiye göre 4 gruba ayırır.
// - bugun: aynı gün
// - dun: bir gün önce
// - buHafta: son 7 gün içinde (bugün/dün hariç)
// - daha-eski: 7+ gün önce
export function zamanGrubu(zaman: Date, simdi: Date = new Date()): ZamanGrubu {
  const bugun = gununBasi(simdi);
  const tarih = gununBasi(zaman);
  const farkGun = Math.round(
    (bugun.getTime() - tarih.getTime()) / 86_400_000,
  );
  if (farkGun <= 0) return "bugun";
  if (farkGun === 1) return "dun";
  if (farkGun < 7) return "buHafta";
  return "daha-eski";
}

// Aktiviteleri tarih gruplarına ayır. Sıra korunur (girdi zaten zaman DESC).
// Boş gruplar dönmez.
export function gruplaraAyir<T extends { zaman: Date }>(
  aktiviteler: ReadonlyArray<T>,
  simdi: Date = new Date(),
): Array<{ grup: ZamanGrubu; baslik: string; satirlar: T[] }> {
  const haritalar = new Map<ZamanGrubu, T[]>();
  for (const a of aktiviteler) {
    const g = zamanGrubu(a.zaman, simdi);
    const liste = haritalar.get(g) ?? [];
    liste.push(a);
    haritalar.set(g, liste);
  }
  return GRUP_SIRASI.flatMap((grup) => {
    const satirlar = haritalar.get(grup);
    if (!satirlar || satirlar.length === 0) return [];
    return [{ grup, baslik: GRUP_BASLIKLARI[grup], satirlar }];
  });
}
