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

  // Sadece kart erişimi olan proje üyelerine bildirim — başkalarını mention
  // etmek bilgi sızıntısı olur.
  const kart = await kartBaglami(opt.kartId);
  if (!kart) return;
  const izinli = await db.projeUyesi.findMany({
    where: {
      proje_id: kart.proje_id,
      kullanici_id: { in: mentionIdler },
    },
    select: { kullanici_id: true },
  });
  const aliciIdler = izinli.map((i) => i.kullanici_id);
  if (aliciIdler.length === 0) return;

  const yazanAdi = await adSoyad(opt.yazanId);

  await bildirimUret({
    alici_idler: aliciIdler,
    ureten_id: opt.yazanId,
    tip: "YORUM_MENTION",
    baslik: `${yazanAdi} sizden bahsetti`,
    ozet: `${kart.baslik}: ${kisalt(opt.icerik, 80)}`,
    kart_id: opt.kartId,
    proje_id: kart.proje_id,
    kaynak_tip: "Yorum",
    kaynak_id: opt.yorumId,
  });
}

// =====================================================================
// 2. Karta üye atama — atanan kullanıcıya bildirim
// =====================================================================

export async function tetikleKartUyeAtama(opt: {
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
    tip: "KART_UYE_ATAMA",
    baslik: `${atayanAdi} sizi bir karta ekledi`,
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
// 4. Karta yorum eklendi — kart üyelerine bildirim (yazan hariç)
// =====================================================================

export async function tetikleYorumEklendi(opt: {
  yorumId: string;
  kartId: string;
  yazanId: string;
  icerik: string;
}): Promise<void> {
  const kart = await kartBaglami(opt.kartId);
  if (!kart) return;
  // Kart üyeleri (yazan hariç)
  const uyeler = await db.kartUyesi.findMany({
    where: { kart_id: opt.kartId, kullanici_id: { not: opt.yazanId } },
    select: { kullanici_id: true },
  });
  const aliciIdler = uyeler.map((u) => u.kullanici_id);
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
    proje_id: kart.proje_id,
    kaynak_tip: "Yorum",
    kaynak_id: opt.yorumId,
  });
}

// =====================================================================
// 5. Karta eklenti yüklendi — kart üyelerine bildirim (yükleyen hariç)
// =====================================================================

export async function tetikleEklentiYuklendi(opt: {
  eklentiId: string;
  kartId: string;
  yukleyenId: string;
  ad: string;
}): Promise<void> {
  const kart = await kartBaglami(opt.kartId);
  if (!kart) return;
  const uyeler = await db.kartUyesi.findMany({
    where: { kart_id: opt.kartId, kullanici_id: { not: opt.yukleyenId } },
    select: { kullanici_id: true },
  });
  if (uyeler.length === 0) return;

  const yukleyenAdi = await adSoyad(opt.yukleyenId);
  await bildirimUret({
    alici_idler: uyeler.map((u) => u.kullanici_id),
    ureten_id: opt.yukleyenId,
    tip: "EKLENTI_YUKLENDI",
    baslik: `${yukleyenAdi} bir karta dosya yükledi`,
    ozet: `${kart.baslik}: ${opt.ad}`,
    kart_id: opt.kartId,
    proje_id: kart.proje_id,
    kaynak_tip: "Eklenti",
    kaynak_id: opt.eklentiId,
  });
}

// =====================================================================
// 6. Bitiş tarihi yaklaşıyor / geçti — cron ile çağrılır
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
      liste: { select: { proje_id: true } },
      uyeler: { select: { kullanici_id: true } },
    },
    take: 500,
  });
  let toplam = 0;
  for (const k of kartlar) {
    if (k.uyeler.length === 0) continue;
    const r = await bildirimUret({
      alici_idler: k.uyeler.map((u) => u.kullanici_id),
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
      liste: { select: { proje_id: true } },
      uyeler: { select: { kullanici_id: true } },
    },
    take: 500,
  });
  let toplam = 0;
  for (const k of kartlar) {
    if (k.uyeler.length === 0) continue;
    const r = await bildirimUret({
      alici_idler: k.uyeler.map((u) => u.kullanici_id),
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
