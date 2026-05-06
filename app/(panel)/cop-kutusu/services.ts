// Çöp Kutusu service katmanı (ADR-0018).
// Silinmiş kayıtları listele / geri yükle / kalıcı sil.
// Kontrol Kural 50 (RBAC her action'da), 42 (audit otomatik), 90 (5 katman).

import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { kullaniciErisimBilgisi, canProje } from "@/lib/yetki";
import {
  mentionKisiMapiGetir,
  mentionliMetniGorunurYap,
} from "@/lib/mention-server";
import type { CopGeriYukle, CopKaliciSil, CopKutusuListele, CopTipi } from "./schemas";

// =====================================================================
// Tipler
// =====================================================================

export type CopOzeti = {
  id: string;
  tip: CopTipi;
  /** Görünen ad (proje.ad / kart.baslik / yorum.icerik kısa / eklenti.ad). */
  baslik: string;
  /** İkincil bilgi (proje adı, kart başlığı vb.). */
  detay: string | null;
  silinme_zamani: Date;
  /** İlişkili proje id — yetki kontrolü ve gezinme için. */
  proje_id: string | null;
  /** Kart için liste, yorum/eklenti için kart. */
  parent_id: string | null;
};

// =====================================================================
// Listele
// =====================================================================

export async function copKutusuListele(
  kullaniciId: string,
  girdi: CopKutusuListele,
): Promise<{ kayitlar: CopOzeti[]; toplam: number }> {
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  // Makam tüm projeleri görür; aksi halde erişebildiği projeler.
  const projeFiltresi = erisim.makam
    ? null
    : await erisilebilirProjeIdleriniCek(kullaniciId, erisim.birimId);

  switch (girdi.tip) {
    case "proje":
      return projeListele(kullaniciId, projeFiltresi, girdi);
    case "kart":
      return kartListele(projeFiltresi, girdi);
    case "yorum":
      return yorumListele(kullaniciId, projeFiltresi, girdi);
    case "eklenti":
      return eklentiListele(kullaniciId, projeFiltresi, girdi);
  }
}

async function erisilebilirProjeIdleriniCek(
  kullaniciId: string,
  birimId: string | null,
): Promise<string[]> {
  const projeler = await db.proje.findMany({
    where: {
      OR: [
        { yetkililer: { some: { kullanici_id: kullaniciId } } },
        ...(birimId ? [{ birimler: { some: { birim_id: birimId } } }] : []),
        {
          listeler: {
            some: {
              OR: [
                { yetkililer: { some: { kullanici_id: kullaniciId } } },
                ...(birimId
                  ? [{ birimler: { some: { birim_id: birimId } } }]
                  : []),
                {
                  kartlar: {
                    some: {
                      OR: [
                        { yetkililer: { some: { kullanici_id: kullaniciId } } },
                        ...(birimId
                          ? [{ birimler: { some: { birim_id: birimId } } }]
                          : []),
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    select: { id: true },
  });
  return projeler.map((p) => p.id);
}

async function projeListele(
  kullaniciId: string,
  projeFiltresi: string[] | null,
  girdi: CopKutusuListele,
): Promise<{ kayitlar: CopOzeti[]; toplam: number }> {
  // Proje çöp kutusunda — silinmiş projeler için yetki:
  // - makam: hepsi
  // - normal kullanıcı: doğrudan yetkili olduğu silinmiş projeler.
  // Erişim subquery'sinde silinmiş projeler de geçecek (silindi_mi false ile
  // çekiyoruz orada — düzeltelim: silindi_mi:true filtreli ayrı çek).
  const kullanicininSilinmisProjeleri = await db.proje.findMany({
    where: {
      silindi_mi: true,
      ...(projeFiltresi === null
        ? {}
        : {
            OR: [
              { yetkililer: { some: { kullanici_id: kullaniciId } } },
              { id: { in: projeFiltresi } },
            ],
          }),
    },
    select: {
      id: true,
      ad: true,
      aciklama: true,
      silinme_zamani: true,
    },
    orderBy: { silinme_zamani: "desc" },
    take: girdi.limit,
  });

  const toplam = kullanicininSilinmisProjeleri.length;
  return {
    kayitlar: kullanicininSilinmisProjeleri.map((p) => ({
      id: p.id,
      tip: "proje" as const,
      baslik: p.ad,
      detay: p.aciklama,
      silinme_zamani: p.silinme_zamani!,
      proje_id: p.id,
      parent_id: null,
    })),
    toplam,
  };
}

async function kartListele(
  projeFiltresi: string[] | null,
  girdi: CopKutusuListele,
): Promise<{ kayitlar: CopOzeti[]; toplam: number }> {
  const kartlar = await db.kart.findMany({
    where: {
      silindi_mi: true,
      ...(projeFiltresi === null
        ? {}
        : { liste: { proje_id: { in: projeFiltresi } } }),
    },
    select: {
      id: true,
      baslik: true,
      // ADR-0023 — Çöp kutusu önizlemesi için denormalize plaintext yeterli;
      // Tiptap doc'u parse etmeden line-clamp basabiliriz.
      aciklama_metin: true,
      liste_id: true,
      silinme_zamani: true,
      liste: { select: { proje_id: true, proje: { select: { ad: true } } } },
    },
    orderBy: { silinme_zamani: "desc" },
    take: girdi.limit,
  });
  return {
    kayitlar: kartlar.map((k) => ({
      id: k.id,
      tip: "kart" as const,
      baslik: k.baslik,
      detay: k.liste.proje.ad,
      silinme_zamani: k.silinme_zamani!,
      proje_id: k.liste.proje_id,
      parent_id: k.liste_id,
    })),
    toplam: kartlar.length,
  };
}

async function yorumListele(
  kullaniciId: string,
  projeFiltresi: string[] | null,
  girdi: CopKutusuListele,
): Promise<{ kayitlar: CopOzeti[]; toplam: number }> {
  const yorumlar = await db.yorum.findMany({
    where: {
      silindi_mi: true,
      OR: [
        // Yazar kendi yorumlarını her zaman görür.
        { yazan_id: kullaniciId },
        ...(projeFiltresi === null
          ? [{ kart: {} as never }] // makam: tümü
          : [
              {
                kart: {
                  liste: { proje_id: { in: projeFiltresi } },
                },
              },
            ]),
      ],
    },
    select: {
      id: true,
      icerik: true,
      kart_id: true,
      silinme_zamani: true,
      kart: {
        select: {
          baslik: true,
          liste: { select: { proje_id: true } },
        },
      },
    },
    orderBy: { silinme_zamani: "desc" },
    take: girdi.limit,
  });
  const mentionKisiMap = await mentionKisiMapiGetir(
    yorumlar.map((y) => y.icerik),
  );

  return {
    kayitlar: yorumlar.map((y) => ({
      id: y.id,
      tip: "yorum" as const,
      baslik: yorumBasligi(y.icerik, mentionKisiMap),
      detay: y.kart.baslik,
      silinme_zamani: y.silinme_zamani!,
      proje_id: y.kart.liste.proje_id,
      parent_id: y.kart_id,
    })),
    toplam: yorumlar.length,
  };
}

function yorumBasligi(
  icerik: string,
  mentionKisiMap: Awaited<ReturnType<typeof mentionKisiMapiGetir>>,
): string {
  const gorunen = mentionliMetniGorunurYap(icerik, mentionKisiMap);
  return gorunen.length > 80 ? gorunen.slice(0, 80) + "…" : gorunen;
}

async function eklentiListele(
  kullaniciId: string,
  projeFiltresi: string[] | null,
  girdi: CopKutusuListele,
): Promise<{ kayitlar: CopOzeti[]; toplam: number }> {
  const eklentiler = await db.eklenti.findMany({
    where: {
      silindi_mi: true,
      OR: [
        { yukleyen_id: kullaniciId },
        ...(projeFiltresi === null
          ? [{ kart: {} as never }]
          : [
              {
                kart: {
                  liste: { proje_id: { in: projeFiltresi } },
                },
              },
            ]),
      ],
    },
    select: {
      id: true,
      ad: true,
      kart_id: true,
      silinme_zamani: true,
      kart: {
        select: {
          baslik: true,
          liste: { select: { proje_id: true } },
        },
      },
    },
    orderBy: { silinme_zamani: "desc" },
    take: girdi.limit,
  });
  return {
    kayitlar: eklentiler.map((e) => ({
      id: e.id,
      tip: "eklenti" as const,
      baslik: e.ad,
      detay: e.kart.baslik,
      silinme_zamani: e.silinme_zamani!,
      proje_id: e.kart.liste.proje_id,
      parent_id: e.kart_id,
    })),
    toplam: eklentiler.length,
  };
}

// =====================================================================
// Geri yükle
// =====================================================================

export async function copGeriYukle(
  kullaniciId: string,
  girdi: CopGeriYukle,
): Promise<{ id: string; tip: CopTipi }> {
  switch (girdi.tip) {
    case "proje": {
      const proje = await db.proje.findUnique({
        where: { id: girdi.id },
        select: {
          silindi_mi: true,
          yetkililer: {
            where: { kullanici_id: kullaniciId },
            select: { kullanici_id: true },
            take: 1,
          },
        },
      });
      if (!proje || !proje.silindi_mi) {
        throw new EylemHatasi("Kayıt bulunamadı.", HATA_KODU.BULUNAMADI);
      }
      const erisim = await kullaniciErisimBilgisi(kullaniciId);
      if (!erisim.makam && proje.yetkililer.length === 0) {
        throw new EylemHatasi(
          "Bu projeyi geri yükleme yetkiniz yok.",
          HATA_KODU.YETKISIZ,
        );
      }
      await db.proje.update({
        where: { id: girdi.id },
        data: { silindi_mi: false, silinme_zamani: null },
      });
      break;
    }
    case "kart": {
      // Kart yetkisi proje üzerinden cascade — canKart soft-delete içinde
      // bile kontrolü uygulayabilir mi? canKart silindi_mi check yapıyor;
      // silinmiş kartı geri yüklemek için proje yetkisi yeterli.
      const kart = await db.kart.findUnique({
        where: { id: girdi.id },
        select: {
          silindi_mi: true,
          liste: { select: { proje_id: true } },
        },
      });
      if (!kart || !kart.silindi_mi) {
        throw new EylemHatasi("Kayıt bulunamadı.", HATA_KODU.BULUNAMADI);
      }
      if (!(await canProje(kullaniciId, "proje:edit", kart.liste.proje_id))) {
        throw new EylemHatasi(
          "Bu kartı geri yükleme yetkiniz yok.",
          HATA_KODU.YETKISIZ,
        );
      }
      await db.kart.update({
        where: { id: girdi.id },
        data: { silindi_mi: false, silinme_zamani: null },
      });
      break;
    }
    case "yorum": {
      const yorum = await db.yorum.findUnique({
        where: { id: girdi.id },
        select: {
          silindi_mi: true,
          yazan_id: true,
          kart: { select: { id: true, liste: { select: { proje_id: true } } } },
        },
      });
      if (!yorum || !yorum.silindi_mi) {
        throw new EylemHatasi("Kayıt bulunamadı.", HATA_KODU.BULUNAMADI);
      }
      const yazar = yorum.yazan_id === kullaniciId;
      const projeYetkili = await canProje(
        kullaniciId,
        "proje:edit",
        yorum.kart.liste.proje_id,
      );
      if (!yazar && !projeYetkili) {
        throw new EylemHatasi(
          "Bu yorumu geri yükleme yetkiniz yok.",
          HATA_KODU.YETKISIZ,
        );
      }
      await db.yorum.update({
        where: { id: girdi.id },
        data: { silindi_mi: false, silinme_zamani: null },
      });
      break;
    }
    case "eklenti": {
      const eklenti = await db.eklenti.findUnique({
        where: { id: girdi.id },
        select: {
          silindi_mi: true,
          yukleyen_id: true,
          kart: { select: { id: true, liste: { select: { proje_id: true } } } },
        },
      });
      if (!eklenti || !eklenti.silindi_mi) {
        throw new EylemHatasi("Kayıt bulunamadı.", HATA_KODU.BULUNAMADI);
      }
      const yukleyen = eklenti.yukleyen_id === kullaniciId;
      const projeYetkili = await canProje(
        kullaniciId,
        "proje:edit",
        eklenti.kart.liste.proje_id,
      );
      if (!yukleyen && !projeYetkili) {
        throw new EylemHatasi(
          "Bu eklentiyi geri yükleme yetkiniz yok.",
          HATA_KODU.YETKISIZ,
        );
      }
      await db.eklenti.update({
        where: { id: girdi.id },
        data: { silindi_mi: false, silinme_zamani: null },
      });
      break;
    }
  }
  return { id: girdi.id, tip: girdi.tip };
}

// =====================================================================
// Kalıcı sil
// =====================================================================

export async function copKaliciSil(
  kullaniciId: string,
  girdi: CopKaliciSil,
): Promise<{ id: string; tip: CopTipi }> {
  // Yetki: yalnızca makam (SUPER_ADMIN/KAYMAKAM) kalıcı silebilir.
  // Geri alınamaz olduğu için yazar/proje-yetkili düzeyinde değil, kurumsal
  // karar.
  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  if (!erisim.makam) {
    throw new EylemHatasi(
      "Kalıcı silme için yetkiniz yok. Bu işlem yalnızca yöneticiler tarafından yapılabilir.",
      HATA_KODU.YETKISIZ,
    );
  }

  switch (girdi.tip) {
    case "proje": {
      const v = await db.proje.findUnique({
        where: { id: girdi.id },
        select: { silindi_mi: true },
      });
      if (!v || !v.silindi_mi) {
        throw new EylemHatasi("Kayıt bulunamadı.", HATA_KODU.BULUNAMADI);
      }
      // Cascade Liste → Kart → Yorum/Eklenti otomatik (schema'da onDelete: Cascade)
      await db.proje.delete({ where: { id: girdi.id } });
      break;
    }
    case "kart": {
      const v = await db.kart.findUnique({
        where: { id: girdi.id },
        select: { silindi_mi: true },
      });
      if (!v || !v.silindi_mi) {
        throw new EylemHatasi("Kayıt bulunamadı.", HATA_KODU.BULUNAMADI);
      }
      await db.kart.delete({ where: { id: girdi.id } });
      break;
    }
    case "yorum": {
      const v = await db.yorum.findUnique({
        where: { id: girdi.id },
        select: { silindi_mi: true },
      });
      if (!v || !v.silindi_mi) {
        throw new EylemHatasi("Kayıt bulunamadı.", HATA_KODU.BULUNAMADI);
      }
      await db.yorum.delete({ where: { id: girdi.id } });
      break;
    }
    case "eklenti": {
      // TODO v2: MinIO dosyasını da sil (storage.deleteObject(depolama_yolu)).
      const v = await db.eklenti.findUnique({
        where: { id: girdi.id },
        select: { silindi_mi: true },
      });
      if (!v || !v.silindi_mi) {
        throw new EylemHatasi("Kayıt bulunamadı.", HATA_KODU.BULUNAMADI);
      }
      await db.eklenti.delete({ where: { id: girdi.id } });
      break;
    }
  }
  return { id: girdi.id, tip: girdi.tip };
}
