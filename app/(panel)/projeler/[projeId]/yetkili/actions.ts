"use server";

import { revalidatePath } from "next/cache";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluProje, yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { davetLimiter } from "@/lib/rate-limit";
import { tetikleKartYetkiliAtama } from "@/app/(panel)/bildirimler/tetikleyiciler";
import {
  davetiYenidenGonder,
  davetOlustur,
  kartBekleyenDavetleriListele,
  kartDavetBaglamiKaldir,
  listeBekleyenDavetleriListele,
  listeDavetBaglamiKaldir,
  projeBekleyenDavetleriListele,
  projeDavetBaglamiKaldir,
} from "@/app/(panel)/ayarlar/kullanicilar/services";
import { db } from "@/lib/db";
import {
  kartAdayKullanicilarSemasi,
  kartaYetkiliEkleSemasi,
  kartaYetkiliKaldirSemasi,
  kartinYetkilileriSemasi,
  projeAdayKullanicilarSemasi,
  projeBekleyenDavetleriSemasi,
  projeDavetIptalSemasi,
  projeDavetYenidenGonderSemasi,
  projeYetkilileriListeleSemasi,
  projeyeDavetGonderSemasi,
  projeyeYetkiliEkleSemasi,
  projeyeYetkiliKaldirSemasi,
} from "./schemas";
import {
  kartAdayKullanicilariniAra,
  kartProjeIdGetir,
  kartaYetkiliEkle as kartaYetkiliEkleSrv,
  kartaYetkiliKaldir as kartaYetkiliKaldirSrv,
  kartinYetkilileri as kartinYetkilileriSrv,
  listeProjeIdGetir,
  projeAdayKullanicilariniAra,
  projeYetkilileriniListele,
  projeyeYetkiliEkle as projeyeYetkiliEkleSrv,
  projeyeYetkiliKaldir as projeyeYetkiliKaldirSrv,
} from "./services";

function birimIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

// =====================================================================
// Proje yetkili yönetimi (proje admin işi — Kural 50: RBAC her action başında)
// =====================================================================

export const projeYetkilileriniListeleEylem = eylem({
  ad: "proje:yetkilileri-listele",
  girdi: projeYetkilileriListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:read",
      girdi.proje_id,
    );
    return projeYetkilileriniListele(birimIdAl(ctx), girdi.proje_id);
  },
});

export const projeAdayKullanicilarEylem = eylem({
  ad: "proje:aday-kullanicilar",
  girdi: projeAdayKullanicilarSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      girdi.proje_id,
    );
    return projeAdayKullanicilariniAra(birimIdAl(ctx), girdi);
  },
});

export const projeyeYetkiliEkleEylem = eylem({
  ad: "proje:yetkili-ekle",
  girdi: projeyeYetkiliEkleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      girdi.proje_id,
    );
    return projeyeYetkiliEkleSrv(birimIdAl(ctx), girdi);
  },
});

export const projeyeYetkiliKaldirEylem = eylem({
  ad: "proje:yetkili-kaldir",
  girdi: projeyeYetkiliKaldirSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      girdi.proje_id,
    );
    await projeyeYetkiliKaldirSrv(
      birimIdAl(ctx),
      girdi.proje_id,
      girdi.kullanici_id,
    );
    return { proje_id: girdi.proje_id, kullanici_id: girdi.kullanici_id };
  },
});

// ADR-0012: projeYetkilisiSeviyeGuncelleEylem kaldırıldı — seviye kavramı yok.
// Aksiyon yetkisi sistem rolünden gelir (KullaniciRol değiştirilirse RBAC değişir).

// =====================================================================
// Karta yetkili atama
// =====================================================================

export const kartinYetkilileriEylem = eylem({
  ad: "kart:yetkilileri",
  girdi: kartinYetkilileriSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartinYetkilileriSrv(birimIdAl(ctx), girdi.kart_id);
  },
});

export const kartAdayKullanicilarEylem = eylem({
  ad: "kart:aday-kullanicilar",
  girdi: kartAdayKullanicilarSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await kartProjeIdGetir(girdi.kart_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    return kartAdayKullanicilariniAra(birimIdAl(ctx), girdi);
  },
});

export const kartaYetkiliEkleEylem = eylem({
  ad: "kart:yetkili-ekle",
  girdi: kartaYetkiliEkleSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await kartProjeIdGetir(girdi.kart_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    const atayanId = ctx.oturum?.kullaniciId ?? null;
    await kartaYetkiliEkleSrv(birimIdAl(ctx), girdi.kart_id, girdi.kullanici_id);
    if (atayanId) {
      tetikleKartYetkiliAtama({
        kartId: girdi.kart_id,
        atananId: girdi.kullanici_id,
        atayanId,
      }).catch(() => {
        /* Bildirim hatası işlemi bozmaz */
      });
    }
    return { kart_id: girdi.kart_id, kullanici_id: girdi.kullanici_id };
  },
});

export const kartaYetkiliKaldirEylem = eylem({
  ad: "kart:yetkili-kaldir",
  girdi: kartaYetkiliKaldirSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await kartProjeIdGetir(girdi.kart_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    await kartaYetkiliKaldirSrv(birimIdAl(ctx), girdi.kart_id, girdi.kullanici_id);
    return { kart_id: girdi.kart_id, kullanici_id: girdi.kullanici_id };
  },
});

// =====================================================================
// Proje davet bağlamı (ADR-0010): sistemde olmayan e-postaya davet gönder,
// kabul edildiğinde otomatik olarak projeye yetkili olarak eklenir.
// =====================================================================

// Kaynak normalizesi: girdi'den proje_id veya liste_id veya kart_id geliyor.
// Server-side projeId çözümlenir (RBAC kontrolünde lazım).
type KaynakArgs = { proje_id?: string; liste_id?: string; kart_id?: string };

async function kaynakProjeIdAl(args: KaynakArgs): Promise<string> {
  if (args.proje_id) return args.proje_id;
  if (args.kart_id) return kartProjeIdGetir(args.kart_id);
  if (args.liste_id) return listeProjeIdGetir(args.liste_id);
  throw new EylemHatasi(
    "Davet için kaynak belirtilmedi.",
    HATA_KODU.GECERSIZ_GIRDI,
  );
}

export const projeyeDavetGonderEylem = eylem({
  ad: "yetkili:davet-gonder",
  girdi: projeyeDavetGonderSemasi,
  calistir: async (girdi, ctx) => {
    const kullaniciId = birimIdAl(ctx);
    const projeId = await kaynakProjeIdAl(girdi);

    // Çift yetki: hem kullanıcı davet hem proje yetkili yönetimi
    await yetkiZorunlu(
      kullaniciId,
      IZIN_KODLARI.KULLANICI_DAVET,
      IZIN_KODLARI.PROJE_YETKILI_YONET,
    );
    await yetkiZorunluProje(kullaniciId, "proje:authorize", projeId);

    if (!davetLimiter.tryConsume(`proje-davet:${kullaniciId}`)) {
      throw new EylemHatasi(
        "Çok hızlı davet gönderiyorsunuz, biraz bekleyin.",
        HATA_KODU.RATE_LIMIT,
      );
    }

    // ADR-0013: davet bağlamı kaynak'a göre yazılır. Kart davet → kart yetkili,
    // liste davet → liste yetkili, proje davet → proje yetkili.
    const ortakArgs = {
      email: girdi.email,
      rol_id: girdi.rol_id,
      birim_id: girdi.birim_id,
    };
    try {
      const sonuc = girdi.kart_id
        ? await davetOlustur(kullaniciId, {
            ...ortakArgs,
            proje_baglamlari: [],
            liste_baglamlari: [],
            kart_baglamlari: [{ kart_id: girdi.kart_id }],
          })
        : girdi.liste_id
          ? await davetOlustur(kullaniciId, {
              ...ortakArgs,
              proje_baglamlari: [],
              liste_baglamlari: [{ liste_id: girdi.liste_id }],
              kart_baglamlari: [],
            })
          : await davetOlustur(kullaniciId, {
              ...ortakArgs,
              proje_baglamlari: [{ proje_id: projeId }],
              liste_baglamlari: [],
              kart_baglamlari: [],
            });
      revalidatePath(`/projeler/${projeId}`);
      return {
        davet_id: sonuc.id,
        email: girdi.email.toLowerCase(),
        proje_id: projeId,
      };
    } catch (err) {
      if (err instanceof EylemHatasi) throw err;
      if (err instanceof Error) {
        throw new EylemHatasi(err.message, HATA_KODU.CAKISMA);
      }
      throw err;
    }
  },
});

export const projeBekleyenDavetleriEylem = eylem({
  ad: "yetkili:bekleyen-davetler",
  girdi: projeBekleyenDavetleriSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await kaynakProjeIdAl(girdi);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      projeId,
    );
    if (girdi.kart_id) return kartBekleyenDavetleriListele(girdi.kart_id);
    if (girdi.liste_id) return listeBekleyenDavetleriListele(girdi.liste_id);
    return projeBekleyenDavetleriListele(projeId);
  },
});

export const projeDavetIptalEylem = eylem({
  ad: "yetkili:davet-iptal",
  girdi: projeDavetIptalSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await kaynakProjeIdAl(girdi);
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.PROJE_YETKILI_YONET,
    );
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      projeId,
    );
    if (girdi.kart_id) {
      await kartDavetBaglamiKaldir(girdi.davet_id, girdi.kart_id);
    } else if (girdi.liste_id) {
      await listeDavetBaglamiKaldir(girdi.davet_id, girdi.liste_id);
    } else {
      await projeDavetBaglamiKaldir(girdi.davet_id, projeId);
    }
    revalidatePath(`/projeler/${projeId}`);
    return { davet_id: girdi.davet_id, proje_id: projeId };
  },
});

export const projeDavetYenidenGonderEylem = eylem({
  ad: "yetkili:davet-yeniden-gonder",
  girdi: projeDavetYenidenGonderSemasi,
  calistir: async (girdi, ctx) => {
    const projeId = await kaynakProjeIdAl(girdi);
    const kullaniciId = birimIdAl(ctx);
    await yetkiZorunlu(
      kullaniciId,
      IZIN_KODLARI.KULLANICI_DAVET,
      IZIN_KODLARI.PROJE_YETKILI_YONET,
    );
    await yetkiZorunluProje(kullaniciId, "proje:authorize", projeId);

    // Davet bu kaynağa bağlı mı? RBAC bypass guard — kart panelinden listenin
    // davetini yeniden gönderemezsin.
    const baglamVar = girdi.kart_id
      ? await db.davetKartBaglami.findUnique({
          where: {
            davet_id_kart_id: {
              davet_id: girdi.davet_id,
              kart_id: girdi.kart_id,
            },
          },
          select: { id: true },
        })
      : girdi.liste_id
        ? await db.davetListeBaglami.findUnique({
            where: {
              davet_id_liste_id: {
                davet_id: girdi.davet_id,
                liste_id: girdi.liste_id,
              },
            },
            select: { id: true },
          })
        : await db.davetProjeBaglami.findUnique({
            where: {
              davet_id_proje_id: {
                davet_id: girdi.davet_id,
                proje_id: projeId,
              },
            },
            select: { id: true },
          });
    if (!baglamVar) {
      throw new EylemHatasi(
        "Bu davet bu kaynağa bağlı değil.",
        HATA_KODU.BULUNAMADI,
      );
    }

    if (!davetLimiter.tryConsume(`proje-davet:${kullaniciId}`)) {
      throw new EylemHatasi(
        "Çok hızlı davet gönderiyorsunuz, biraz bekleyin.",
        HATA_KODU.RATE_LIMIT,
      );
    }

    const sonuc = await davetiYenidenGonder(girdi.davet_id);
    return { davet_id: sonuc.id, email: sonuc.email };
  },
});
