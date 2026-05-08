"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import {
  yetkiZorunluProje,
  yetkiZorunluListe,
  yetkiZorunluKart,
} from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { db } from "@/lib/db";
import {
  tetikleKartBitisDegisti,
  tetikleKartDurumDegisti,
  tetikleKartSilindi,
  tetikleKartTamamlandi,
  tetikleKartTamamlamaOnaylandi,
  tetikleKartTamamlamaOnerildi,
  tetikleKartTamamlamaReddedildi,
  tetikleListeSilindi,
} from "@/app/(panel)/bildirimler/tetikleyiciler";
import {
  kartArsivSemasi,
  kartGeriYukleSemasi,
  kartGuncelleSemasi,
  kartOlusturSemasi,
  kartSilSemasi,
  kartTamamlamaOneriSemasi,
  kartTamamlamaOnaySemasi,
  kartTamamlamaReddetSemasi,
  kartTasiSemasi,
  listeGuncelleSemasi,
  listeOlusturSemasi,
  listeSilSemasi,
  listeSiraSemasi,
  projeDetaySemasi,
} from "./schemas";
import {
  kartArsivToggle,
  kartGeriYukle,
  kartGuncelle as kartGuncelleSrv,
  kartiTasi,
  kartOlustur as kartOlusturSrv,
  kartSil,
  kartTamamlamaOneri as kartTamamlamaOneriSrv,
  kartTamamlamaOnay as kartTamamlamaOnaySrv,
  kartTamamlamaReddet as kartTamamlamaReddetSrv,
  listeGuncelle,
  listeOlustur,
  listeSil,
  listeyeSiraVer,
  projeDetayiniGetir,
  projedeTumKartlar,
} from "./services";
import {
  kartBirimEkle,
  kartBirimKaldir,
  kartBirimleriniListele,
} from "./kart-birim";
import {
  listeAdayKisileriAra,
  listeBirimEkle,
  listeBirimKaldir,
  listeBirimleriniListele,
  listeProjeIdGetir,
  listeYetkiliEkle,
  listeYetkiliKaldir,
  listeYetkilileriniListele,
  kartProjeIdGetir,
  projeBirimEkle,
  projeBirimKaldir,
  projeBirimleriniListele,
} from "./yetkilendirme";

function kullaniciIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

// ============================================================
// Proje detayı (pano + liste görünümü)
// ============================================================

export const projeDetayEylem = eylem({
  ad: "proje:detay",
  girdi: projeDetaySemasi,
  calistir: async (girdi, ctx) => {
    const kullaniciId = kullaniciIdAl(ctx);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:read", girdi.proje_id);
    return projeDetayiniGetir(kullaniciId, girdi.proje_id);
  },
});

export const projeKartlarEylem = eylem({
  ad: "proje:kartlar",
  girdi: projeDetaySemasi,
  calistir: async (girdi, ctx) => {
    const kullaniciId = kullaniciIdAl(ctx);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:read", girdi.proje_id);
    return projedeTumKartlar(kullaniciId, girdi.proje_id);
  },
});

// ============================================================
// Liste eylemleri
// ============================================================

export const listeOlusturEylem = eylem({
  ad: "liste:olustur",
  girdi: listeOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.LISTE_OLUSTUR);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:edit", girdi.proje_id);
    const kullaniciId = kullaniciIdAl(ctx);
    const yeni = await listeOlustur(kullaniciId, girdi);
    revalidatePath(`/projeler/${girdi.proje_id}`);
    return yeni;
  },
});

export const listeGuncelleEylem = eylem({
  ad: "liste:guncelle",
  girdi: listeGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    // Sprint 1 / S1-11 — granüler izin kodu (Kural V.2 / #146).
    // Liste güncelleme şu an sadece ad değiştirme; ayrı izin koduna sahip.
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.LISTE_AD_DUZENLE);
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:edit", girdi.id);
    await listeGuncelle(kullaniciIdAl(ctx), girdi);
    return { id: girdi.id };
  },
});

export const listeSilEylem = eylem({
  ad: "liste:sil",
  girdi: listeSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.LISTE_SIL);
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:delete", girdi.id);
    const silenId = ctx.oturum?.kullaniciId ?? null;
    // Tetikleyici silme öncesi yetki bağlamını okumalı (cascade ile yetkililer
    // silinince alıcı listesi boşalır).
    if (silenId) {
      await tetikleListeSilindi({ listeId: girdi.id, silenId }).catch(() => {});
    }
    await listeSil(kullaniciIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});

export const listeSiralaEylem = eylem({
  ad: "liste:sirala",
  girdi: listeSiraSemasi,
  calistir: async (girdi, ctx) => {
    // Sprint 1 / S1-11 — granüler izin kodu (Kural V.2 / #146).
    // Sıralama liste düzenlemekten ayrı bir aksiyon.
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.LISTE_SIRALA);
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:edit", girdi.id);
    return listeyeSiraVer(kullaniciIdAl(ctx), girdi);
  },
});

// ============================================================
// Kart eylemleri
// ============================================================

export const kartOlusturEylem = eylem({
  ad: "kart:olustur",
  girdi: kartOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_OLUSTUR);
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:create", girdi.liste_id);
    const kullaniciId = kullaniciIdAl(ctx);
    return kartOlusturSrv(kullaniciId, girdi);
  },
});

export const kartGuncelleEylem = eylem({
  ad: "kart:guncelle",
  girdi: kartGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.id);
    // ADR-0018 — tamamlama ayrı bir aksiyondur. Düzenleyebilen herkes
    // kapatamaz; KART_TAMAMLA + kaynak yetkisi ZORUNLU.
    if (girdi.tamamlandi_mi !== undefined) {
      await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_TAMAMLA);
      await yetkiZorunluKart(
        ctx.oturum?.kullaniciId,
        "kart:tamamla",
        girdi.id,
      );
    }
    const degistirenId = ctx.oturum?.kullaniciId ?? null;
    await kartGuncelleSrv(kullaniciIdAl(ctx), girdi);
    // Sadece anlamlı alanlar değiştiğinde bildirim — tip-spesifik trigger.
    if (degistirenId && girdi.bitis !== undefined) {
      tetikleKartBitisDegisti({
        kartId: girdi.id,
        degistirenId,
        yeniBitis: girdi.bitis ?? null,
      }).catch(() => {});
    }
    if (degistirenId && girdi.tamamlandi_mi === true) {
      tetikleKartTamamlandi({
        kartId: girdi.id,
        tamamlayanId: degistirenId,
      }).catch(() => {});
    }
    return { id: girdi.id };
  },
});

// ADR-0019 — Kart tamamlama öneri/onay/red action'ları.
// Öneri: KART_TAMAMLA gerekmez; sadece kart erişimi (`kart:read`).
// Onay/Red: KART_TAMAMLA + `kart:tamamla` ZORUNLU (kartGuncelleEylem ile
// aynı kural).

export const kartTamamlamaOneriEylem = eylem({
  ad: "kart:tamamlama-oneri",
  girdi: kartTamamlamaOneriSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.id);
    const onerenId = kullaniciIdAl(ctx);
    await kartTamamlamaOneriSrv(onerenId, girdi);
    tetikleKartTamamlamaOnerildi({
      kartId: girdi.id,
      onerenId,
    }).catch(() => {});
    return { id: girdi.id };
  },
});

export const kartTamamlamaOnayEylem = eylem({
  ad: "kart:tamamlama-onay",
  girdi: kartTamamlamaOnaySemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_TAMAMLA);
    await yetkiZorunluKart(
      ctx.oturum?.kullaniciId,
      "kart:tamamla",
      girdi.id,
    );
    const onayliyenId = kullaniciIdAl(ctx);
    const { onerenId } = await kartTamamlamaOnaySrv(onayliyenId, girdi);
    if (onerenId) {
      tetikleKartTamamlamaOnaylandi({
        kartId: girdi.id,
        onayliyenId,
        onerenId,
      }).catch(() => {});
    }
    // KART_TAMAMLANDI bildirimini de tetikle — kart üyelerine "kart kapandı".
    tetikleKartTamamlandi({
      kartId: girdi.id,
      tamamlayanId: onayliyenId,
    }).catch(() => {});
    return { id: girdi.id };
  },
});

export const kartTamamlamaReddetEylem = eylem({
  ad: "kart:tamamlama-reddet",
  girdi: kartTamamlamaReddetSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_TAMAMLA);
    await yetkiZorunluKart(
      ctx.oturum?.kullaniciId,
      "kart:tamamla",
      girdi.id,
    );
    const reddedenId = kullaniciIdAl(ctx);
    const { onerenId } = await kartTamamlamaReddetSrv(reddedenId, girdi);
    if (onerenId) {
      tetikleKartTamamlamaReddedildi({
        kartId: girdi.id,
        reddedenId,
        onerenId,
        sebep: girdi.sebep ?? null,
      }).catch(() => {});
    }
    return { id: girdi.id };
  },
});

export const kartSilEylem = eylem({
  ad: "kart:sil",
  girdi: kartSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_SIL);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:delete", girdi.id);
    const silenId = ctx.oturum?.kullaniciId ?? null;
    // Tetikleyici silme öncesi yetki bağlamını okumalı (kart sonra silindi
    // olarak işaretleniyor; üyelik bilgisi yine kalır ama "atandığınız bir
    // kart" cümlesi an itibarıyla geçerli olmalı).
    if (silenId) {
      await tetikleKartSilindi({ kartId: girdi.id, silenId }).catch(() => {});
    }
    await kartSil(kullaniciIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});

export const kartGeriYukleEylem = eylem({
  ad: "kart:geri-yukle",
  girdi: kartGeriYukleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_SIL);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.id);
    await kartGeriYukle(kullaniciIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});

export const kartTasiEylem = eylem({
  ad: "kart:tasi",
  girdi: kartTasiSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_TASI);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:tasi", girdi.id);
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:edit", girdi.hedef_liste_id);
    const tasiyanId = ctx.oturum?.kullaniciId ?? null;
    // Eski liste id'sini taşımadan önce oku — sadece liste değişti ise bildirim
    // tetiklenir (aynı liste içi sıralama bildirim üretmesin).
    const oncesi = tasiyanId
      ? await db.kart.findUnique({
          where: { id: girdi.id },
          select: { liste_id: true },
        })
      : null;
    const sonuc = await kartiTasi(kullaniciIdAl(ctx), girdi);
    if (
      tasiyanId &&
      oncesi &&
      oncesi.liste_id !== girdi.hedef_liste_id
    ) {
      const hedefListe = await db.liste.findUnique({
        where: { id: girdi.hedef_liste_id },
        select: { ad: true },
      });
      if (hedefListe) {
        tetikleKartDurumDegisti({
          kartId: girdi.id,
          tasiyanId,
          yeniListeAd: hedefListe.ad,
        }).catch(() => {});
      }
    }
    return sonuc;
  },
});

// ADR-0009 — Kartı arşivle/arşivden çıkar.
// Sistem Arşiv listesine taşır veya arsiv_oncesi_liste_id'ye geri yükler.
export const kartArsivEylem = eylem({
  ad: "kart:arsiv",
  girdi: kartArsivSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.id);
    return kartArsivToggle(kullaniciIdAl(ctx), girdi);
  },
});

// ============================================================
// Kart Birim (KartBirimi join — ADR-0001)
// ============================================================

export const kartBirimleriEylem = eylem({
  ad: "kart:yetkili-birimler",
  girdi: z.object({ kart_id: z.string().uuid() }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartBirimleriniListele(kullaniciIdAl(ctx), girdi.kart_id);
  },
});

export const kartBirimEkleEylem = eylem({
  ad: "kart:yetkili-birim-ekle",
  girdi: z.object({
    kart_id: z.string().uuid(),
    birim_id: z.string().uuid(),
  }),
  calistir: async (girdi, ctx) => {
    const projeId = await kartProjeIdGetir(girdi.kart_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    await kartBirimEkle(kullaniciIdAl(ctx), girdi.kart_id, girdi.birim_id);
    return { kart_id: girdi.kart_id, birim_id: girdi.birim_id };
  },
});

export const kartBirimKaldirEylem = eylem({
  ad: "kart:yetkili-birim-kaldir",
  girdi: z.object({
    kart_id: z.string().uuid(),
    birim_id: z.string().uuid(),
  }),
  calistir: async (girdi, ctx) => {
    const projeId = await kartProjeIdGetir(girdi.kart_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    await kartBirimKaldir(kullaniciIdAl(ctx), girdi.kart_id, girdi.birim_id);
    return { kart_id: girdi.kart_id, birim_id: girdi.birim_id };
  },
});

// ============================================================
// Proje/Liste/Kart yetkilendirmesi
// ============================================================

export const projeBirimleriEylem = eylem({
  ad: "proje:birimler",
  girdi: z.object({ proje_id: z.string().uuid() }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:read", girdi.proje_id);
    return projeBirimleriniListele(girdi.proje_id);
  },
});

export const projeBirimEkleEylem = eylem({
  ad: "proje:birim-ekle",
  girdi: z.object({
    proje_id: z.string().uuid(),
    birim_id: z.string().uuid(),
  }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      girdi.proje_id,
    );
    await projeBirimEkle(girdi.proje_id, girdi.birim_id);
    revalidatePath(`/projeler/${girdi.proje_id}`);
    return { proje_id: girdi.proje_id, birim_id: girdi.birim_id };
  },
});

export const projeBirimKaldirEylem = eylem({
  ad: "proje:birim-kaldir",
  girdi: z.object({
    proje_id: z.string().uuid(),
    birim_id: z.string().uuid(),
  }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(
      ctx.oturum?.kullaniciId,
      "proje:authorize",
      girdi.proje_id,
    );
    await projeBirimKaldir(girdi.proje_id, girdi.birim_id);
    revalidatePath(`/projeler/${girdi.proje_id}`);
    return { proje_id: girdi.proje_id, birim_id: girdi.birim_id };
  },
});

export const listeBirimleriEylem = eylem({
  ad: "liste:birimler",
  girdi: z.object({ liste_id: z.string().uuid() }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:read", girdi.liste_id);
    return listeBirimleriniListele(girdi.liste_id);
  },
});

export const listeBirimEkleEylem = eylem({
  ad: "liste:birim-ekle",
  girdi: z.object({
    liste_id: z.string().uuid(),
    birim_id: z.string().uuid(),
  }),
  calistir: async (girdi, ctx) => {
    const projeId = await listeProjeIdGetir(girdi.liste_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    await listeBirimEkle(girdi.liste_id, girdi.birim_id);
    return { liste_id: girdi.liste_id, birim_id: girdi.birim_id };
  },
});

export const listeBirimKaldirEylem = eylem({
  ad: "liste:birim-kaldir",
  girdi: z.object({
    liste_id: z.string().uuid(),
    birim_id: z.string().uuid(),
  }),
  calistir: async (girdi, ctx) => {
    const projeId = await listeProjeIdGetir(girdi.liste_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    await listeBirimKaldir(girdi.liste_id, girdi.birim_id);
    return { liste_id: girdi.liste_id, birim_id: girdi.birim_id };
  },
});

export const listeYetkilileriEylem = eylem({
  ad: "liste:yetkililer",
  girdi: z.object({ liste_id: z.string().uuid() }),
  calistir: async (girdi, ctx) => {
    await yetkiZorunluListe(ctx.oturum?.kullaniciId, "liste:read", girdi.liste_id);
    return listeYetkilileriniListele(girdi.liste_id);
  },
});

export const listeAdayKisilerEylem = eylem({
  ad: "liste:aday-kisiler",
  girdi: z.object({
    liste_id: z.string().uuid(),
    q: z.string().trim().max(100).optional(),
  }),
  calistir: async (girdi, ctx) => {
    const projeId = await listeProjeIdGetir(girdi.liste_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    return listeAdayKisileriAra(girdi.liste_id, girdi.q);
  },
});

export const listeYetkiliEkleEylem = eylem({
  ad: "liste:yetkili-ekle",
  girdi: z.object({
    liste_id: z.string().uuid(),
    kullanici_id: z.string().uuid(),
  }),
  calistir: async (girdi, ctx) => {
    const projeId = await listeProjeIdGetir(girdi.liste_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    const yetkili = await listeYetkiliEkle(girdi.liste_id, girdi.kullanici_id);
    return { liste_id: girdi.liste_id, yetkili };
  },
});

export const listeYetkiliKaldirEylem = eylem({
  ad: "liste:yetkili-kaldir",
  girdi: z.object({
    liste_id: z.string().uuid(),
    kullanici_id: z.string().uuid(),
  }),
  calistir: async (girdi, ctx) => {
    const projeId = await listeProjeIdGetir(girdi.liste_id);
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_YETKILI_YONET);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:authorize", projeId);
    await listeYetkiliKaldir(girdi.liste_id, girdi.kullanici_id);
    return { liste_id: girdi.liste_id, kullanici_id: girdi.kullanici_id };
  },
});
