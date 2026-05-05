import { db } from "@/lib/db";
import { bildirimUret } from "./services";

// =====================================================================
// Yardımcı: kart bağlamı (ad + proje_id) — derin link için
// =====================================================================

async function kartBaglami(kartId: string): Promise<{
  baslik: string;
  proje_id: string;
} | null> {
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: { baslik: true, liste: { select: { proje_id: true } } },
  });
  if (!k) return null;
  return { baslik: k.baslik, proje_id: k.liste.proje_id };
}

async function adSoyad(kullaniciId: string): Promise<string> {
  const u = await db.kullanici.findUnique({
    where: { id: kullaniciId },
    select: { ad: true, soyad: true },
  });
  return u ? `${u.ad} ${u.soyad}`.trim() : "Bir kullanıcı";
}

function kisalt(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

type KartYetkiBaglami = {
  id: string;
  baslik: string;
  bitis?: Date | null;
  liste: {
    proje_id: string;
    yetkililer: { kullanici_id: string }[];
    birimler: { birim_id: string }[];
    proje: {
      yetkililer: { kullanici_id: string }[];
      birimler: { birim_id: string }[];
    };
  };
  yetkililer: { kullanici_id: string }[];
  birimler: { birim_id: string }[];
};

function kartKisiIdleri(kart: KartYetkiBaglami): Set<string> {
  const idler = new Set<string>();
  for (const yetkili of kart.liste.proje.yetkililer) {
    idler.add(yetkili.kullanici_id);
  }
  for (const yetkili of kart.liste.yetkililer) {
    idler.add(yetkili.kullanici_id);
  }
  for (const yetkili of kart.yetkililer) {
    idler.add(yetkili.kullanici_id);
  }
  return idler;
}

function kartBirimIdleri(kart: KartYetkiBaglami): Set<string> {
  const idler = new Set<string>();
  for (const birim of kart.liste.proje.birimler) idler.add(birim.birim_id);
  for (const birim of kart.liste.birimler) idler.add(birim.birim_id);
  for (const birim of kart.birimler) idler.add(birim.birim_id);
  return idler;
}

async function kartYetkiliAliciMap(
  kartlar: KartYetkiBaglami[],
  haricIdler: readonly string[] = [],
): Promise<Map<string, string[]>> {
  const tumBirimIdleri = new Set<string>();
  for (const kart of kartlar) {
    for (const birimId of kartBirimIdleri(kart)) tumBirimIdleri.add(birimId);
  }

  const birimKullanicilari =
    tumBirimIdleri.size === 0
      ? []
      : await db.kullanici.findMany({
          where: {
            birim_id: { in: Array.from(tumBirimIdleri) },
            aktif: true,
            silindi_mi: false,
            onay_durumu: "ONAYLANDI",
          },
          select: { id: true, birim_id: true },
        });

  const birimMap = new Map<string, string[]>();
  for (const kullanici of birimKullanicilari) {
    if (!kullanici.birim_id) continue;
    const liste = birimMap.get(kullanici.birim_id) ?? [];
    liste.push(kullanici.id);
    birimMap.set(kullanici.birim_id, liste);
  }

  const haric = new Set(haricIdler);
  const sonuc = new Map<string, string[]>();
  for (const kart of kartlar) {
    const idler = kartKisiIdleri(kart);
    for (const birimId of kartBirimIdleri(kart)) {
      for (const kullaniciId of birimMap.get(birimId) ?? []) {
        idler.add(kullaniciId);
      }
    }
    for (const id of haric) idler.delete(id);
    sonuc.set(kart.id, Array.from(idler));
  }
  return sonuc;
}

async function kartYetkiBaglami(kartId: string): Promise<KartYetkiBaglami | null> {
  return db.kart.findUnique({
    where: { id: kartId },
    select: {
      id: true,
      baslik: true,
      liste: {
        select: {
          proje_id: true,
          yetkililer: { select: { kullanici_id: true } },
          birimler: { select: { birim_id: true } },
          proje: {
            select: {
              yetkililer: { select: { kullanici_id: true } },
              birimler: { select: { birim_id: true } },
            },
          },
        },
      },
      yetkililer: { select: { kullanici_id: true } },
      birimler: { select: { birim_id: true } },
    },
  });
}

// =====================================================================
// 1. Yorum @mention — yorum içeriğindeki UUID'leri parse et
// =====================================================================

// Yorum içinde "@uuid" formatında geçen kullanıcıları bulur.
// Standart UUID v4 regex.
const MENTION_REGEX =
  /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

export function mentionParse(icerik: string): string[] {
  const set = new Set<string>();
  let m: RegExpExecArray | null;
  MENTION_REGEX.lastIndex = 0;
  while ((m = MENTION_REGEX.exec(icerik)) !== null) {
    if (m[1]) set.add(m[1].toLowerCase());
  }
  return Array.from(set);
}

export async function tetikleYorumMention(opt: {
  yorumId: string;
  kartId: string;
  yazanId: string;
  icerik: string;
}): Promise<void> {
  const mentionIdler = mentionParse(opt.icerik);
  if (mentionIdler.length === 0) return;

  // Sadece karta erişimi olan yetkililere bildirim gider; başkalarını mention
  // etmek bilgi sızıntısı olur.
  const kart = await kartYetkiBaglami(opt.kartId);
  if (!kart) return;
  const yetkiliMap = await kartYetkiliAliciMap([kart]);
  const yetkiliIdler = new Set(yetkiliMap.get(kart.id) ?? []);
  const aliciIdler = mentionIdler.filter((id) => yetkiliIdler.has(id));
  if (aliciIdler.length === 0) return;

  const yazanAdi = await adSoyad(opt.yazanId);

  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.yazanId,
    tip: "YORUM_MENTION",
    baslik: `${yazanAdi} sizden bahsetti`,
    ozet: `${kart.baslik}: ${kisalt(opt.icerik, 80)}`,
    kart_id: opt.kartId,
    proje_id: kart.liste.proje_id,
    kaynak_tip: "Yorum",
    kaynak_id: opt.yorumId,
  });
}

// =====================================================================
// 2. Karta yetki atama — atanan kullanıcıya bildirim
// =====================================================================

export async function tetikleKartYetkiliAtama(opt: {
  kartId: string;
  atananId: string;
  atayanId: string;
}): Promise<void> {
  if (opt.atananId === opt.atayanId) return;
  const kart = await kartBaglami(opt.kartId);
  if (!kart) return;
  const atayanAdi = await adSoyad(opt.atayanId);
  await bildirimUret({
    alici_idler: [opt.atananId],
    ureten_id: opt.atayanId,
    tip: "KART_YETKILI_ATAMA",
    baslik: `${atayanAdi} sizi bir kartta yetkilendirdi`,
    ozet: kart.baslik,
    kart_id: opt.kartId,
    proje_id: kart.proje_id,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}

// =====================================================================
// 3. Kontrol maddesi atama — atanan kullanıcıya bildirim
// =====================================================================

export async function tetikleMaddeAtama(opt: {
  maddeId: string;
  metin: string;
  atananId: string;
  atayanId: string;
}): Promise<void> {
  if (opt.atananId === opt.atayanId) return;
  // Madde bağlamından kart bul
  const m = await db.kontrolMaddesi.findUnique({
    where: { id: opt.maddeId },
    select: {
      kontrol_listesi: {
        select: { kart_id: true },
      },
    },
  });
  if (!m) return;
  const kart = await kartBaglami(m.kontrol_listesi.kart_id);
  if (!kart) return;
  const atayanAdi = await adSoyad(opt.atayanId);
  await bildirimUret({
    alici_idler: [opt.atananId],
    ureten_id: opt.atayanId,
    tip: "MADDE_ATAMA",
    baslik: `${atayanAdi} size bir madde atadı`,
    ozet: `${kart.baslik}: ${kisalt(opt.metin, 80)}`,
    kart_id: m.kontrol_listesi.kart_id,
    proje_id: kart.proje_id,
    kaynak_tip: "KontrolMaddesi",
    kaynak_id: opt.maddeId,
  });
}

// =====================================================================
// 4. Karta yorum eklendi — kart yetkililerine bildirim (yazan hariç)
// =====================================================================

export async function tetikleYorumEklendi(opt: {
  yorumId: string;
  kartId: string;
  yazanId: string;
  icerik: string;
}): Promise<void> {
  const kart = await kartYetkiBaglami(opt.kartId);
  if (!kart) return;
  const yetkiliMap = await kartYetkiliAliciMap([kart], [opt.yazanId]);
  const aliciIdler = yetkiliMap.get(kart.id) ?? [];
  // Mention edilmiş kullanıcılar zaten YORUM_MENTION alacak — onları çıkar
  // ki çift bildirim olmasın.
  const mentionIdler = new Set(mentionParse(opt.icerik));
  const filtreli = aliciIdler.filter((id) => !mentionIdler.has(id));
  if (filtreli.length === 0) return;

  const yazanAdi = await adSoyad(opt.yazanId);
  await bildirimUret({
    alici_idler: filtreli,
    ureten_id: opt.yazanId,
    tip: "YORUM_EKLENDI",
    baslik: `${yazanAdi} bir karta yorum yazdı`,
    ozet: `${kart.baslik}: ${kisalt(opt.icerik, 80)}`,
    kart_id: opt.kartId,
    proje_id: kart.liste.proje_id,
    kaynak_tip: "Yorum",
    kaynak_id: opt.yorumId,
  });
}

// =====================================================================
// 5. Karta eklenti yüklendi — kart yetkililerine bildirim (yükleyen hariç)
// =====================================================================

export async function tetikleEklentiYuklendi(opt: {
  eklentiId: string;
  kartId: string;
  yukleyenId: string;
  ad: string;
}): Promise<void> {
  const kart = await kartYetkiBaglami(opt.kartId);
  if (!kart) return;
  const yetkiliMap = await kartYetkiliAliciMap([kart], [opt.yukleyenId]);
  const aliciIdler = yetkiliMap.get(kart.id) ?? [];
  if (aliciIdler.length === 0) return;

  const yukleyenAdi = await adSoyad(opt.yukleyenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.yukleyenId,
    tip: "EKLENTI_YUKLENDI",
    baslik: `${yukleyenAdi} bir karta dosya yükledi`,
    ozet: `${kart.baslik}: ${opt.ad}`,
    kart_id: opt.kartId,
    proje_id: kart.liste.proje_id,
    kaynak_tip: "Eklenti",
    kaynak_id: opt.eklentiId,
  });
}

// =====================================================================
// 6. Projeye yetkili eklendi — eklenen kullanıcıya bildirim
// =====================================================================

async function projeAdiniGetir(projeId: string): Promise<string | null> {
  const p = await db.proje.findUnique({
    where: { id: projeId },
    select: { ad: true },
  });
  return p?.ad ?? null;
}

export async function tetikleProjeUyeEklendi(opt: {
  projeId: string;
  eklenenId: string;
  ekleyenId: string;
}): Promise<void> {
  if (opt.eklenenId === opt.ekleyenId) return;
  const projeAd = await projeAdiniGetir(opt.projeId);
  if (!projeAd) return;
  const ekleyenAdi = await adSoyad(opt.ekleyenId);
  await bildirimUret({
    alici_idler: [opt.eklenenId],
    ureten_id: opt.ekleyenId,
    tip: "PROJE_UYE_EKLENDI",
    baslik: `${ekleyenAdi} sizi bir projeye ekledi`,
    ozet: projeAd,
    proje_id: opt.projeId,
    kaynak_tip: "Proje",
    kaynak_id: opt.projeId,
  });
}

// =====================================================================
// 7. Projeden yetkili çıkarıldı — çıkarılan kullanıcıya bildirim
// =====================================================================

export async function tetikleProjeUyeCikarildi(opt: {
  projeId: string;
  cikarilanId: string;
  cikaranId: string;
}): Promise<void> {
  if (opt.cikarilanId === opt.cikaranId) return;
  const projeAd = await projeAdiniGetir(opt.projeId);
  if (!projeAd) return;
  const cikaranAdi = await adSoyad(opt.cikaranId);
  await bildirimUret({
    alici_idler: [opt.cikarilanId],
    ureten_id: opt.cikaranId,
    tip: "PROJE_UYE_CIKARILDI",
    baslik: `${cikaranAdi} sizi bir projeden çıkardı`,
    ozet: projeAd,
    proje_id: opt.projeId,
    kaynak_tip: "Proje",
    kaynak_id: opt.projeId,
  });
}

// =====================================================================
// 8. Kart başka listeye taşındı — kart üyelerine bildirim
// =====================================================================

// Düşük seviye yardımcı: kart üyelerini topla (yetkililer + birim üyeleri).
// Mevcut kartYetkiliBaglami / kartYetkiliAliciMap iç ayrıntılarını yeniden
// kullanmak yerine, bu fazda doğrudan kart yetki bağlamından alıcı listesi
// üretmek daha doğru — düşük öncelikli "değişti" bildirimleri için aynı
// yetki ağacı geçerli.
async function kartUyeleriniToplaHaricli(
  kartId: string,
  haricId: string | null,
): Promise<{ aliciIdler: string[]; projeId: string; baslik: string } | null> {
  const kart = await kartYetkiBaglami(kartId);
  if (!kart) return null;
  const yetkiliMap = await kartYetkiliAliciMap(
    [kart],
    haricId ? [haricId] : [],
  );
  return {
    aliciIdler: yetkiliMap.get(kart.id) ?? [],
    projeId: kart.liste.proje_id,
    baslik: kart.baslik,
  };
}

export async function tetikleKartDurumDegisti(opt: {
  kartId: string;
  tasiyanId: string;
  yeniListeAd: string;
}): Promise<void> {
  const ctx = await kartUyeleriniToplaHaricli(opt.kartId, opt.tasiyanId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const tasiyanAdi = await adSoyad(opt.tasiyanId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.tasiyanId,
    tip: "KART_DURUM_DEGISTI",
    baslik: `${tasiyanAdi} bir kartı taşıdı`,
    ozet: `${ctx.baslik} → ${opt.yeniListeAd}`,
    kart_id: opt.kartId,
    proje_id: ctx.projeId,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}

// =====================================================================
// 9. Kart bitiş tarihi değişti — kart üyelerine bildirim
// =====================================================================

const TARIH_KISA = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

export async function tetikleKartBitisDegisti(opt: {
  kartId: string;
  degistirenId: string;
  yeniBitis: Date | null;
}): Promise<void> {
  const ctx = await kartUyeleriniToplaHaricli(opt.kartId, opt.degistirenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.degistirenId);
  const tarihMetni = opt.yeniBitis
    ? TARIH_KISA.format(opt.yeniBitis)
    : "kaldırıldı";
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.degistirenId,
    tip: "KART_BITIS_DEGISTI",
    baslik: `${adi} bir kartın bitiş tarihini güncelledi`,
    ozet: `${ctx.baslik}: ${tarihMetni}`,
    kart_id: opt.kartId,
    proje_id: ctx.projeId,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
    meta: { yeni_bitis: opt.yeniBitis?.toISOString() ?? null },
  });
}

// =====================================================================
// 10. Kart silindi — kart üyelerine bildirim (silme henüz uygulanmadan
//     çağrılmalı; silindi sonrası kartYetkiBaglami null döndürür)
// =====================================================================

export async function tetikleKartSilindi(opt: {
  kartId: string;
  silenId: string;
}): Promise<void> {
  const ctx = await kartUyeleriniToplaHaricli(opt.kartId, opt.silenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.silenId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.silenId,
    tip: "KART_SILINDI",
    baslik: `${adi} atandığınız bir kartı sildi`,
    ozet: ctx.baslik,
    proje_id: ctx.projeId,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}

// =====================================================================
// 11. Kart tamamlandı — kart üyelerine bildirim
// =====================================================================

export async function tetikleKartTamamlandi(opt: {
  kartId: string;
  tamamlayanId: string;
}): Promise<void> {
  const ctx = await kartUyeleriniToplaHaricli(opt.kartId, opt.tamamlayanId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.tamamlayanId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.tamamlayanId,
    tip: "KART_TAMAMLANDI",
    baslik: `${adi} bir kartı tamamladı`,
    ozet: ctx.baslik,
    kart_id: opt.kartId,
    proje_id: ctx.projeId,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}

// =====================================================================
// 12. Liste silindi — liste yetkililerine bildirim (silen hariç)
// =====================================================================

// Liste silinmeden ÖNCE çağrılmalı: silindikten sonra ListeYetkilisi cascade
// ile temizlenir, alıcı listesi boşalır. Action'da sıralama: önce tetikle,
// sonra delete.
export async function tetikleListeSilindi(opt: {
  listeId: string;
  silenId: string;
}): Promise<void> {
  const liste = await db.liste.findUnique({
    where: { id: opt.listeId },
    select: {
      ad: true,
      proje_id: true,
      yetkililer: { select: { kullanici_id: true } },
    },
  });
  if (!liste) return;
  const aliciIdler = liste.yetkililer
    .map((y) => y.kullanici_id)
    .filter((id) => id !== opt.silenId);
  if (aliciIdler.length === 0) return;
  const silenAdi = await adSoyad(opt.silenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.silenId,
    tip: "LISTE_SILINDI",
    baslik: `${silenAdi} yetkili olduğunuz bir listeyi sildi`,
    ozet: liste.ad,
    proje_id: liste.proje_id,
    kaynak_tip: "Liste",
    kaynak_id: opt.listeId,
  });
}

// =====================================================================
// 13. Davet kabul edildi — davet edene bildirim
// =====================================================================

export async function tetikleDavetKabulEdildi(opt: {
  davetEdenId: string;
  kabulEdenAd: string;
  kabulEdenSoyad: string;
  kabulEdenEmail: string;
}): Promise<void> {
  const adSoyadMetni = `${opt.kabulEdenAd} ${opt.kabulEdenSoyad}`.trim();
  await bildirimUret({
    alici_idler: [opt.davetEdenId],
    // Sistem tetikledi (davet eden kullanıcı zaten kendisi alıyor) — ureten=null
    // bildirimUret içinde ureten==alici elenmiyor; kabul eden ≠ davet eden
    // garanti.
    ureten_id: null,
    tip: "DAVET_KABUL_EDILDI",
    baslik: "Gönderdiğiniz davet kabul edildi",
    ozet: `${adSoyadMetni} (${opt.kabulEdenEmail})`,
    kaynak_tip: "Davet",
    kaynak_id: null,
    meta: { kabul_eden_email: opt.kabulEdenEmail },
  });
}

// =====================================================================
// 14. Bitiş tarihi yaklaşıyor / geçti — cron ile çağrılır
// =====================================================================

// Cron gibi periyodik bir scheduler'dan çağrılır. MVP'de manuel; production'da
// systemd timer / GitHub Actions / vercel cron tetikler.
export async function tetikleBitisYaklasiyor(saatOnce = 24): Promise<number> {
  const simdi = new Date();
  const esik = new Date(simdi.getTime() + saatOnce * 60 * 60 * 1000);
  const kartlar = await db.kart.findMany({
    where: {
      silindi_mi: false,
      arsiv_mi: false,
      bitis: { gte: simdi, lte: esik },
    },
    select: {
      id: true,
      baslik: true,
      bitis: true,
      liste: {
        select: {
          proje_id: true,
          yetkililer: { select: { kullanici_id: true } },
          birimler: { select: { birim_id: true } },
          proje: {
            select: {
              yetkililer: { select: { kullanici_id: true } },
              birimler: { select: { birim_id: true } },
            },
          },
        },
      },
      yetkililer: { select: { kullanici_id: true } },
      birimler: { select: { birim_id: true } },
    },
    take: 500,
  });
  const yetkiliMap = await kartYetkiliAliciMap(kartlar);
  let toplam = 0;
  for (const k of kartlar) {
    const aliciIdler = yetkiliMap.get(k.id) ?? [];
    if (aliciIdler.length === 0) continue;
    const r = await bildirimUret({
      alici_idler: aliciIdler,
      ureten_id: null,
      tip: "BITIS_YAKLASIYOR",
      baslik: "Kart bitiş tarihi yaklaşıyor",
      ozet: k.baslik,
      kart_id: k.id,
      proje_id: k.liste.proje_id,
      kaynak_tip: "Kart",
      kaynak_id: k.id,
      meta: { bitis: k.bitis?.toISOString() },
    });
    toplam += r.length;
  }
  return toplam;
}

export async function tetikleBitisGecti(): Promise<number> {
  const simdi = new Date();
  // Son 1 saat içinde geçenler — duplicate önlemek için pencere
  const onceki = new Date(simdi.getTime() - 60 * 60 * 1000);
  const kartlar = await db.kart.findMany({
    where: {
      silindi_mi: false,
      arsiv_mi: false,
      bitis: { gte: onceki, lt: simdi },
    },
    select: {
      id: true,
      baslik: true,
      liste: {
        select: {
          proje_id: true,
          yetkililer: { select: { kullanici_id: true } },
          birimler: { select: { birim_id: true } },
          proje: {
            select: {
              yetkililer: { select: { kullanici_id: true } },
              birimler: { select: { birim_id: true } },
            },
          },
        },
      },
      yetkililer: { select: { kullanici_id: true } },
      birimler: { select: { birim_id: true } },
    },
    take: 500,
  });
  const yetkiliMap = await kartYetkiliAliciMap(kartlar);
  let toplam = 0;
  for (const k of kartlar) {
    const aliciIdler = yetkiliMap.get(k.id) ?? [];
    if (aliciIdler.length === 0) continue;
    const r = await bildirimUret({
      alici_idler: aliciIdler,
      ureten_id: null,
      tip: "BITIS_GECTI",
      baslik: "Kart bitiş tarihi geçti",
      ozet: k.baslik,
      kart_id: k.id,
      proje_id: k.liste.proje_id,
      kaynak_tip: "Kart",
      kaynak_id: k.id,
    });
    toplam += r.length;
  }
  return toplam;
}
