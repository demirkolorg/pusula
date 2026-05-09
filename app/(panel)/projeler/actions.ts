"use server";

import { revalidatePath } from "next/cache";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { bildirimGuvenliCagir } from "@/lib/bildirim-guvenli";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluProje } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import {
  tetikleProjeArsivlendi,
  tetikleProjeGeriYuklendi,
  tetikleProjeGuncellendi,
  tetikleProjeOlusturuldu,
  tetikleProjeSilindi,
} from "@/app/(panel)/bildirimler/tetikleyiciler";
import {
  projeArsivSemasi,
  projeGeriYukleSemasi,
  projeGuncelleSemasi,
  projeListeSemasi,
  projeOlusturSemasi,
  projeSilSemasi,
  projeSiraSemasi,
} from "./schemas";
import {
  projeArsivle,
  projeGeriYukle,
  projeGuncelle,
  projeleriListele,
  projeOlustur,
  projeSil,
  projeyeSiraVer,
} from "./services";

function kullaniciIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

export const projeListele = eylem({
  ad: "proje:liste",
  girdi: projeListeSemasi,
  calistir: async (girdi, ctx) => {
    const kullaniciId = kullaniciIdAl(ctx);
    return projeleriListele(kullaniciId, girdi);
  },
});

export const projeOlusturEylem = eylem({
  ad: "proje:olustur",
  girdi: projeOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_OLUSTUR);
    const kullaniciId = kullaniciIdAl(ctx);
    const yeni = await projeOlustur(kullaniciId, girdi);
    void bildirimGuvenliCagir(
      tetikleProjeOlusturuldu({ projeId: yeni.id, olusturanId: kullaniciId }),
      "proje-olusturuldu",
    );
    revalidatePath("/projeler");
    return yeni;
  },
});

export const projeGuncelleEylem = eylem({
  ad: "proje:guncelle",
  girdi: projeGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_DUZENLE);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:edit", girdi.id);
    const degistirenId = ctx.oturum?.kullaniciId ?? null;
    await projeGuncelle(girdi);
    if (degistirenId) {
      void bildirimGuvenliCagir(
        tetikleProjeGuncellendi({ projeId: girdi.id, degistirenId }),
        "proje-guncellendi",
      );
    }
    revalidatePath("/projeler");
    return { id: girdi.id };
  },
});

export const projeArsivleEylem = eylem({
  ad: "proje:arsiv",
  girdi: projeArsivSemasi,
  calistir: async (girdi, ctx) => {
    // Sprint 1 / S1-10 — granüler izin kodu (Kural V.2 / #146).
    // Arşivleme proje düzenlemekten ayrı bir aksiyon; ayrı izin koduna sahip.
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_ARSIVLE);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:edit", girdi.id);
    const arsivleyenId = ctx.oturum?.kullaniciId ?? null;
    await projeArsivle(girdi);
    if (arsivleyenId) {
      void bildirimGuvenliCagir(
        tetikleProjeArsivlendi({ projeId: girdi.id, arsivleyenId }),
        "proje-arsivlendi",
      );
    }
    revalidatePath("/projeler");
    return { id: girdi.id };
  },
});

export const projeSilEylem = eylem({
  ad: "proje:sil",
  girdi: projeSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_SIL);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:delete", girdi.id);
    const silenId = ctx.oturum?.kullaniciId ?? null;
    // Silmeden ÖNCE bildirim üret — silindikten sonra yetkililer cascade
    // ile temizlenir, alıcı listesi boşalır.
    if (silenId) {
      await bildirimGuvenliCagir(
        tetikleProjeSilindi({ projeId: girdi.id, silenId }),
        "proje-silindi",
      );
    }
    await projeSil(girdi.id);
    revalidatePath("/projeler");
    return { id: girdi.id };
  },
});

export const projeGeriYukleEylem = eylem({
  ad: "proje:geri-yukle",
  girdi: projeGeriYukleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_SIL);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:delete", girdi.id);
    const geriYukleyenId = ctx.oturum?.kullaniciId ?? null;
    await projeGeriYukle(girdi.id);
    if (geriYukleyenId) {
      void bildirimGuvenliCagir(
        tetikleProjeGeriYuklendi({ projeId: girdi.id, geriYukleyenId }),
        "proje-geri-yuklendi",
      );
    }
    revalidatePath("/projeler");
    return { id: girdi.id };
  },
});

export const projeSiralaEylem = eylem({
  ad: "proje:sirala",
  girdi: projeSiraSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.PROJE_DUZENLE);
    await yetkiZorunluProje(ctx.oturum?.kullaniciId, "proje:edit", girdi.id);
    return projeyeSiraVer(girdi);
  },
});
