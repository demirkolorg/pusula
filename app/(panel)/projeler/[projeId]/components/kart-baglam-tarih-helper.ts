// Kart bağlam menüsünde "Tarih" submenu'sünün preset'leri.
// Saf hesaplama — UI'dan ayrı (Kural 131). Tüm tarihler Europe/Istanbul saat
// dilimine göre 17:00:00 (mesai sonu) olarak set edilir; kullanıcı modal'dan
// daha hassas saat seçebilir.

export type TarihOnayari =
  | "bugun"
  | "yarin"
  | "haftasonu"
  | "gelecek-hafta"
  | "kaldir";

export type TarihOnay = {
  anahtar: TarihOnayari;
  etiket: string;
};

export const TARIH_ONAYLARI: ReadonlyArray<TarihOnay> = [
  { anahtar: "bugun", etiket: "Bugün" },
  { anahtar: "yarin", etiket: "Yarın" },
  { anahtar: "haftasonu", etiket: "Bu hafta sonu" },
  { anahtar: "gelecek-hafta", etiket: "Gelecek hafta" },
];

const ISTANBUL_OFFSET_MIN = 180; // UTC+3, DST yok (TR 2016'dan beri sabit)

function gunBitisi(yil: number, ay: number, gun: number): Date {
  // İstanbul yerel 17:00 → UTC 14:00. Saat sabitlenirken local TZ değişimine
  // dayanmıyoruz; manuel offset ile UTC ms üretip Date oluşturuyoruz.
  return new Date(
    Date.UTC(yil, ay, gun, 17, 0, 0) - ISTANBUL_OFFSET_MIN * 60_000,
  );
}

// İstanbul TZ'de bugünün yıl/ay/gün bilgisini döndürür — `now` parametresi
// test edilebilirlik için.
function istanbulBugun(now: Date): { yil: number; ay: number; gun: number } {
  const yil = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
    }).format(now),
  );
  const ay =
    Number(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Istanbul",
        month: "2-digit",
      }).format(now),
    ) - 1;
  const gun = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
    }).format(now),
  );
  return { yil, ay, gun };
}

// Cumartesi (6) ya da Pazar (0) → 0 gün. Aksi halde haftaSonu Cumartesi'ye
// kadar olan gün sayısı. JS getDay: 0=Pazar, 1=Pzt, ..., 6=Cmt.
function haftaSonunaGun(haftaninGunu: number): number {
  if (haftaninGunu === 0 || haftaninGunu === 6) return 0;
  return 6 - haftaninGunu; // Cmt'ye kadar
}

/**
 * Preset anahtarına göre Date hesapla.
 *  - bugun → bugün 17:00 (İstanbul)
 *  - yarin → yarın 17:00
 *  - haftasonu → bu Cumartesi 17:00 (zaten Cmt/Pzr ise bugün)
 *  - gelecek-hafta → bu Pazartesi'den sonraki Pazartesi 17:00
 *  - kaldir → null
 */
export function tarihOnayHesapla(
  anahtar: TarihOnayari,
  now: Date = new Date(),
): Date | null {
  if (anahtar === "kaldir") return null;

  const { yil, ay, gun } = istanbulBugun(now);

  if (anahtar === "bugun") {
    return gunBitisi(yil, ay, gun);
  }
  if (anahtar === "yarin") {
    return gunBitisi(yil, ay, gun + 1);
  }
  if (anahtar === "haftasonu") {
    // İstanbul TZ'deki haftanın gününü tek seferde ay/gün üzerinden hesapla.
    const ref = new Date(Date.UTC(yil, ay, gun));
    const ekle = haftaSonunaGun(ref.getUTCDay());
    return gunBitisi(yil, ay, gun + ekle);
  }
  // gelecek-hafta → sonraki Pazartesi
  const ref = new Date(Date.UTC(yil, ay, gun));
  const haftaninGunu = ref.getUTCDay(); // 0=Pzr ... 6=Cmt
  // Pazartesi = 1; bugün Pzt ise +7, aksi halde 1-haftaninGunu (mod 7) + 7
  const farkBuPzt = haftaninGunu === 0 ? -6 : 1 - haftaninGunu;
  const eklenecek = farkBuPzt + 7;
  return gunBitisi(yil, ay, gun + eklenecek);
}
