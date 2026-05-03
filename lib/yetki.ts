// Resource-level RBAC — kontrol Kural 146 (ADR-0005).
//
// Global izinler (`pano:create`, `kart:edit` gibi) bir kullanıcının "bu tip
// işlemi yapabileceğini" söyler ama HANGİ kaynak üzerinde olduğunu söylemez.
// Bu modül `ProjeUyesi` ve Makam katmanı (SUPER_ADMIN/KAYMAKAM) bilgisini
// kullanarak kaynak bazlı yetki cevabı verir.

import { db } from "./db";
import { EylemHatasi } from "./action-wrapper";
import { HATA_KODU } from "./sonuc";
import { kullaniciIzinleriniAl } from "./permissions";

// =====================================================================
// Aksiyon tipleri
// =====================================================================

export type ProjeAksiyon =
  | "proje:read"
  | "proje:edit"
  | "proje:delete"
  | "proje:uye-yonet";

export type ListeAksiyon = "liste:read" | "liste:create" | "liste:edit" | "liste:delete";

export type KartAksiyon = "kart:read" | "kart:edit" | "kart:delete" | "kart:tasi" | "kart:create";

// ProjeUyesi.seviye → izinli aksiyonlar
const SEVIYE_IZINLERI: Record<
  "ADMIN" | "NORMAL" | "IZLEYICI",
  Set<ProjeAksiyon | ListeAksiyon | KartAksiyon>
> = {
  ADMIN: new Set([
    "proje:read", "proje:edit", "proje:delete", "proje:uye-yonet",
    "liste:read", "liste:create", "liste:edit", "liste:delete",
    "kart:read", "kart:create", "kart:edit", "kart:delete", "kart:tasi",
  ]),
  NORMAL: new Set([
    "proje:read", "proje:edit",
    "liste:read", "liste:create", "liste:edit",
    "kart:read", "kart:create", "kart:edit", "kart:tasi",
  ]),
  IZLEYICI: new Set([
    "proje:read", "liste:read", "kart:read",
  ]),
};

// =====================================================================
// İç yardımcılar
// =====================================================================

async function makamKatmaniMi(kullaniciId: string): Promise<boolean> {
  const izinler = await kullaniciIzinleriniAl(kullaniciId);
  return izinler.has("*");
}

async function kullaniciKurumId(kullaniciId: string): Promise<string | null> {
  const k = await db.kullanici.findUnique({
    where: { id: kullaniciId },
    select: { kurum_id: true },
  });
  return k?.kurum_id ?? null;
}

// =====================================================================
// canProje
// =====================================================================

export async function canProje(
  kullaniciId: string,
  aksiyon: ProjeAksiyon,
  projeId: string,
): Promise<boolean> {
  const proje = await db.proje.findUnique({
    where: { id: projeId },
    select: {
      kurum_id: true,
      silindi_mi: true,
      uyeler: {
        where: { kullanici_id: kullaniciId },
        select: { seviye: true },
      },
    },
  });
  if (!proje) return false;
  if (proje.silindi_mi && aksiyon !== "proje:read") return false;

  // Makam katmanı (SUPER_ADMIN/KAYMAKAM) — kurumun tamamına erişir
  if (await makamKatmaniMi(kullaniciId)) {
    const kurumId = await kullaniciKurumId(kullaniciId);
    if (kurumId === proje.kurum_id) return true;
  }

  // ProjeUyesi seviyesi
  const uye = proje.uyeler[0];
  if (!uye) return false;
  return SEVIYE_IZINLERI[uye.seviye].has(aksiyon);
}

// =====================================================================
// canListe
// =====================================================================

export async function canListe(
  kullaniciId: string,
  aksiyon: ListeAksiyon,
  listeId: string,
): Promise<boolean> {
  const liste = await db.liste.findUnique({
    where: { id: listeId },
    select: { proje_id: true },
  });
  if (!liste) return false;
  // Liste yetkileri = projenin yetki haritasından türetilir
  // (proje admin → liste tüm; normal → liste read+create+edit; izleyici → read)
  const projeAksiyon: ProjeAksiyon =
    aksiyon === "liste:read" ? "proje:read" : "proje:edit";
  // create/edit/delete için proje:edit yetkisi yeterli sayılır;
  // proje admin'i tek başına proje:delete bekleyen yere de erişir.
  if (aksiyon === "liste:delete") {
    return canProje(kullaniciId, "proje:edit", liste.proje_id);
  }
  return canProje(kullaniciId, projeAksiyon, liste.proje_id);
}

// =====================================================================
// canKart
// =====================================================================

export async function canKart(
  kullaniciId: string,
  aksiyon: KartAksiyon,
  kartId: string,
): Promise<boolean> {
  const kart = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      silindi_mi: true,
      liste: { select: { proje_id: true } },
    },
  });
  if (!kart) return false;
  if (kart.silindi_mi && aksiyon !== "kart:read") return false;
  const projeAksiyon: ProjeAksiyon =
    aksiyon === "kart:read" ? "proje:read" : "proje:edit";
  return canProje(kullaniciId, projeAksiyon, kart.liste.proje_id);
}

// =====================================================================
// Yetki zorunlu (throw)
// =====================================================================

export async function yetkiZorunluProje(
  kullaniciId: string | null | undefined,
  aksiyon: ProjeAksiyon,
  projeId: string,
): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi("Giriş yapmalısınız.", HATA_KODU.GIRIS_YOK);
  }
  if (!(await canProje(kullaniciId, aksiyon, projeId))) {
    throw new EylemHatasi(
      "Bu projeye erişim yetkiniz yok.",
      HATA_KODU.YETKISIZ,
      undefined,
      "WARN",
    );
  }
}

export async function yetkiZorunluListe(
  kullaniciId: string | null | undefined,
  aksiyon: ListeAksiyon,
  listeId: string,
): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi("Giriş yapmalısınız.", HATA_KODU.GIRIS_YOK);
  }
  if (!(await canListe(kullaniciId, aksiyon, listeId))) {
    throw new EylemHatasi(
      "Bu listeye erişim yetkiniz yok.",
      HATA_KODU.YETKISIZ,
      undefined,
      "WARN",
    );
  }
}

export async function yetkiZorunluKart(
  kullaniciId: string | null | undefined,
  aksiyon: KartAksiyon,
  kartId: string,
): Promise<void> {
  if (!kullaniciId) {
    throw new EylemHatasi("Giriş yapmalısınız.", HATA_KODU.GIRIS_YOK);
  }
  if (!(await canKart(kullaniciId, aksiyon, kartId))) {
    throw new EylemHatasi(
      "Bu karta erişim yetkiniz yok.",
      HATA_KODU.YETKISIZ,
      undefined,
      "WARN",
    );
  }
}
