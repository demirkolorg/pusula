// Sprint 3 / S3-4 — Kart bildirim tetikleyicileri.
// Yorum, eklenti yükleme, durum/bitiş değişimi, silme, tamamlama akışı,
// kapak/etiket-üzeri (kart kapağı), bitiş cron'ları.

import { db } from "@/lib/db";
import { kisalt } from "@/lib/metin-helpers";
import { bildirimUret } from "../services";
import {
  TARIH_KISA,
  adSoyad,
  kartBaglami,
  kartTamamlamaYetkilileriniBul,
  kartUyeleriniToplaHaricli,
  kartYetkiBaglami,
  kartYetkiliAliciMap,
  mentionParse,
} from "./_ortak";

// =====================================================================
// 1. Yorum @mention — yorum içeriğindeki UUID'leri parse et
// =====================================================================

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
// 3. Karta yorum eklendi — kart yetkililerine bildirim (yazan hariç)
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
// 4. Karta eklenti yüklendi — kart yetkililerine bildirim (yükleyen hariç)
//    NOT: Yeni Dosya yönetimi `dosya.ts` modülünde; bu legacy Eklenti.
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
// 5. Kart başka listeye taşındı — kart üyelerine bildirim
// =====================================================================

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
// 6. Kart bitiş tarihi değişti — kart üyelerine bildirim
// =====================================================================

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
// 7. Kart silindi — kart üyelerine bildirim (silme henüz uygulanmadan
//    çağrılmalı; silindi sonrası kartYetkiBaglami null döndürür)
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
// 8. Kart tamamlandı — kart üyelerine bildirim
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
// 9. ADR-0019 Kart tamamlama önerisi akışı (3 olay)
// =====================================================================

export async function tetikleKartTamamlamaOnerildi(opt: {
  kartId: string;
  onerenId: string;
}): Promise<void> {
  const ctx = await kartBaglami(opt.kartId);
  if (!ctx) return;
  // Öneren kendi öneri bildirimini almasın → haric.
  const aliciIdler = await kartTamamlamaYetkilileriniBul(opt.kartId, [
    opt.onerenId,
  ]);
  if (aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.onerenId);
  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.onerenId,
    tip: "KART_TAMAMLAMA_ONERILDI",
    baslik: `${adi} bir kartın tamamlandığını bildirdi`,
    ozet: ctx.baslik,
    kart_id: opt.kartId,
    proje_id: ctx.proje_id,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}

export async function tetikleKartTamamlamaOnaylandi(opt: {
  kartId: string;
  onayliyenId: string;
  onerenId: string;
}): Promise<void> {
  const ctx = await kartBaglami(opt.kartId);
  if (!ctx) return;
  // Bildirim öneren'e gider — kendi onayladığı bir öneri olamaz çünkü öneren
  // yetkisiz, onaylayan yetkili (farklı kullanıcı). Yine de defansif kontrol.
  if (opt.onayliyenId === opt.onerenId) return;
  const adi = await adSoyad(opt.onayliyenId);
  await bildirimUret({
    alici_idler: [opt.onerenId],
    ureten_id: opt.onayliyenId,
    tip: "KART_TAMAMLAMA_ONAYLANDI",
    baslik: `${adi} kart tamamlama önerinizi onayladı`,
    ozet: ctx.baslik,
    kart_id: opt.kartId,
    proje_id: ctx.proje_id,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}

export async function tetikleKartTamamlamaReddedildi(opt: {
  kartId: string;
  reddedenId: string;
  onerenId: string;
  sebep: string | null;
}): Promise<void> {
  const ctx = await kartBaglami(opt.kartId);
  if (!ctx) return;
  if (opt.reddedenId === opt.onerenId) return;
  const adi = await adSoyad(opt.reddedenId);
  // Sebep varsa ozet'e dahil et (kullanıcı bildirim listesinde sebebi görsün).
  const ozet = opt.sebep
    ? `${ctx.baslik} — Sebep: ${kisalt(opt.sebep, 120)}`
    : ctx.baslik;
  await bildirimUret({
    alici_idler: [opt.onerenId],
    ureten_id: opt.reddedenId,
    tip: "KART_TAMAMLAMA_REDDEDILDI",
    baslik: `${adi} kart tamamlama önerinizi reddetti`,
    ozet,
    kart_id: opt.kartId,
    proje_id: ctx.proje_id,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}

// =====================================================================
// 10. Kart kapağı/rengi değişti — kart üyelerine düşük öncelik
// =====================================================================

export async function tetikleKapakDegisti(opt: {
  kartId: string;
  degistirenId: string;
  alt_eylem:
    | "kapak-ayarlandi"
    | "kapak-kaldirildi"
    | "renk-ayarlandi"
    | "renk-kaldirildi";
}): Promise<void> {
  const ctx = await kartUyeleriniToplaHaricli(opt.kartId, opt.degistirenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.degistirenId);
  const aciklama: Record<typeof opt.alt_eylem, string> = {
    "kapak-ayarlandi": "kart kapağı ayarladı",
    "kapak-kaldirildi": "kart kapağını kaldırdı",
    "renk-ayarlandi": "kart kapak rengini değiştirdi",
    "renk-kaldirildi": "kart kapak rengini kaldırdı",
  };
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.degistirenId,
    tip: "KAPAK_DEGISTI",
    baslik: `${adi} ${aciklama[opt.alt_eylem]}`,
    ozet: ctx.baslik,
    kart_id: opt.kartId,
    proje_id: ctx.projeId,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
    meta: { alt_eylem: opt.alt_eylem },
  });
}

// =====================================================================
// 11. Bitiş tarihi yaklaşıyor / geçti — cron ile çağrılır
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

// =====================================================================
// 14. Kart oluşturuldu — kart yetkililerine bildirim (oluşturan hariç)
// =====================================================================

export async function tetikleKartOlusturuldu(opt: {
  kartId: string;
  olusturanId: string;
}): Promise<void> {
  const ctx = await kartUyeleriniToplaHaricli(opt.kartId, opt.olusturanId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.olusturanId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.olusturanId,
    tip: "KART_OLUSTURULDU",
    baslik: `${adi} yeni bir kart oluşturdu`,
    ozet: ctx.baslik,
    kart_id: opt.kartId,
    proje_id: ctx.projeId,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}

// =====================================================================
// 15. Kart başlığı değişti — kart yetkililerine bildirim
// =====================================================================

export async function tetikleKartBaslikDegisti(opt: {
  kartId: string;
  degistirenId: string;
  yeniBaslik: string;
  eskiBaslik: string;
}): Promise<void> {
  // Aynı başlık geldi → bildirim gerekmez (idempotent guard).
  if (opt.yeniBaslik === opt.eskiBaslik) return;
  const ctx = await kartUyeleriniToplaHaricli(opt.kartId, opt.degistirenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.degistirenId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.degistirenId,
    tip: "KART_BASLIK_DEGISTI",
    baslik: `${adi} bir kartın başlığını güncelledi`,
    ozet: `${kisalt(opt.eskiBaslik, 40)} → ${kisalt(opt.yeniBaslik, 40)}`,
    kart_id: opt.kartId,
    proje_id: ctx.projeId,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}

// =====================================================================
// 16. Kart açıklaması değişti — kart yetkililerine bildirim
// =====================================================================

export async function tetikleKartAciklamaDegisti(opt: {
  kartId: string;
  degistirenId: string;
}): Promise<void> {
  const ctx = await kartUyeleriniToplaHaricli(opt.kartId, opt.degistirenId);
  if (!ctx || ctx.aliciIdler.length === 0) return;
  const adi = await adSoyad(opt.degistirenId);
  await bildirimUret({
    alici_idler: ctx.aliciIdler,
    ureten_id: opt.degistirenId,
    tip: "KART_ACIKLAMA_DEGISTI",
    baslik: `${adi} bir kartın açıklamasını güncelledi`,
    ozet: ctx.baslik,
    kart_id: opt.kartId,
    proje_id: ctx.projeId,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}

// =====================================================================
// 17. Karttan yetkili çıkarıldı — çıkarılan kişiye bildirim
// =====================================================================

export async function tetikleKartYetkiliCikarildi(opt: {
  kartId: string;
  cikarilanId: string;
  cikaranId: string;
}): Promise<void> {
  if (opt.cikarilanId === opt.cikaranId) return;
  const kart = await kartBaglami(opt.kartId);
  if (!kart) return;
  const cikaranAdi = await adSoyad(opt.cikaranId);
  await bildirimUret({
    alici_idler: [opt.cikarilanId],
    ureten_id: opt.cikaranId,
    tip: "KART_YETKILI_CIKARILDI",
    baslik: `${cikaranAdi} sizi bir karttan çıkardı`,
    ozet: kart.baslik,
    kart_id: opt.kartId,
    proje_id: kart.proje_id,
    kaynak_tip: "Kart",
    kaynak_id: opt.kartId,
  });
}
