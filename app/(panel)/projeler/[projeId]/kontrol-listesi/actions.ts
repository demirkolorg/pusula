"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { bildirimGuvenliCagir } from "@/lib/bildirim-guvenli";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { db } from "@/lib/db";
import {
  tetikleKontrolListesiGuncellendi,
  tetikleKontrolListesiOlusturuldu,
  tetikleKontrolListesiSilindi,
  tetikleMaddeAtama,
  tetikleMaddeEklendi,
  tetikleMaddeGuncellendi,
  tetikleMaddeSilindi,
  tetikleMaddeTamamlamaOnaylandi,
  tetikleMaddeTamamlamaOnerildi,
  tetikleMaddeTamamlamaReddedildi,
} from "@/app/(panel)/bildirimler/tetikleyiciler";
import {
  kontrolListeleriListeleSemasi,
  kontrolListesiGuncelleSemasi,
  kontrolListesiOlusturSemasi,
  kontrolListesiSilSemasi,
  maddeAdayKullanicilarSemasi,
  maddeGuncelleSemasi,
  maddeOlusturSemasi,
  maddeSilSemasi,
  maddeTamamlamaOneriSemasi,
  maddeTamamlamaOnaySemasi,
  maddeTamamlamaReddetSemasi,
} from "./schemas";
import {
  kartKontrolListeleriniListele,
  kartMaddeAdayKullanicilariniAra,
  kontrolListesiGuncelle as kontrolListesiGuncelleSrv,
  kontrolListesiOlustur as kontrolListesiOlusturSrv,
  kontrolListesiSil as kontrolListesiSilSrv,
  maddeGuncelle as maddeGuncelleSrv,
  maddeOlustur as maddeOlusturSrv,
  maddeSil as maddeSilSrv,
  maddeTamamlamaOneri as maddeTamamlamaOneriSrv,
  maddeTamamlamaOnay as maddeTamamlamaOnaySrv,
  maddeTamamlamaReddet as maddeTamamlamaReddetSrv,
} from "./services";

function birimIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) {
    throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  }
  return id;
}

function kullaniciIdAl(ctx: { oturum: { kullaniciId?: string } | null }): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

// =====================================================================
// Kontrol Listesi
// =====================================================================

export const kontrolListeleriListeleEylem = eylem({
  ad: "kontrol-listesi:listele",
  girdi: kontrolListeleriListeleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", girdi.kart_id);
    return kartKontrolListeleriniListele(birimIdAl(ctx), girdi.kart_id);
  },
});

export const kontrolListesiOlusturEylem = eylem({
  ad: "kontrol-listesi:olustur",
  girdi: kontrolListesiOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    const olusturanId = ctx.oturum?.kullaniciId ?? null;
    const sonuc = await kontrolListesiOlusturSrv(birimIdAl(ctx), girdi);
    if (olusturanId) {
      void bildirimGuvenliCagir(
        tetikleKontrolListesiOlusturuldu({
          kontrolListeId: sonuc.id,
          olusturanId,
        }),
        "kontrol-listesi-olusturuldu",
      );
    }
    return sonuc;
  },
});

async function kontrolListesininKartId(listeId: string): Promise<string> {
  const l = await db.kontrolListesi.findUnique({
    where: { id: listeId },
    select: { kart_id: true },
  });
  if (!l) {
    throw new EylemHatasi(
      "Kontrol listesi bulunamadı.",
      HATA_KODU.BULUNAMADI,
    );
  }
  return l.kart_id;
}

export const kontrolListesiGuncelleEylem = eylem({
  ad: "kontrol-listesi:guncelle",
  girdi: kontrolListesiGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    // Sprint 1 / S1-9 — resource-level RBAC (Kural V.2 / #146).
    const kartId = await kontrolListesininKartId(girdi.id);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", kartId);
    const degistirenId = ctx.oturum?.kullaniciId ?? null;
    await kontrolListesiGuncelleSrv(birimIdAl(ctx), girdi);
    if (degistirenId) {
      void bildirimGuvenliCagir(
        tetikleKontrolListesiGuncellendi({
          kontrolListeId: girdi.id,
          degistirenId,
        }),
        "kontrol-listesi-guncellendi",
      );
    }
    return { id: girdi.id };
  },
});

export const kontrolListesiSilEylem = eylem({
  ad: "kontrol-listesi:sil",
  girdi: kontrolListesiSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    // Sprint 1 / S1-9 — resource-level RBAC (Kural V.2 / #146).
    const kartId = await kontrolListesininKartId(girdi.id);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", kartId);
    const silenId = ctx.oturum?.kullaniciId ?? null;
    // Silmeden ÖNCE bildirim üret — silindikten sonra kontrol listesi yok olur.
    if (silenId) {
      await bildirimGuvenliCagir(
        tetikleKontrolListesiSilindi({
          kontrolListeId: girdi.id,
          silenId,
        }),
        "kontrol-listesi-silindi",
      );
    }
    await kontrolListesiSilSrv(birimIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});

// =====================================================================
// Madde
// =====================================================================

export const maddeOlusturEylem = eylem({
  ad: "kontrol-maddesi:olustur",
  girdi: maddeOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    const atayanId = ctx.oturum?.kullaniciId ?? null;
    const m = await maddeOlusturSrv(birimIdAl(ctx), girdi);
    if (girdi.atanan_id && atayanId) {
      void bildirimGuvenliCagir(
        tetikleMaddeAtama({
          maddeId: m.id,
          metin: m.metin,
          atananId: girdi.atanan_id,
          atayanId,
        }),
        "madde-atama-olustur",
      );
    }
    // Generic madde eklendi bildirimi (atama dışı, kart yetkililerine).
    if (atayanId) {
      void bildirimGuvenliCagir(
        tetikleMaddeEklendi({
          maddeId: m.id,
          metin: m.metin,
          ekleyenId: atayanId,
        }),
        "madde-eklendi",
      );
    }
    return m;
  },
});

export const maddeGuncelleEylem = eylem({
  ad: "kontrol-maddesi:guncelle",
  girdi: maddeGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    // ADR-0018 — madde'nin tamamlandi_mi alanı değişiyorsa kart:tamamla
    // yetkisi ZORUNLU (kart düzeyiyle aynı kural; atanan/yetkili olmak hak
    // vermez). Madde'den parent kart'ı bulup hem global hem resource
    // kontrolü uygula.
    if (girdi.tamamlandi_mi !== undefined) {
      const madde = await db.kontrolMaddesi.findUnique({
        where: { id: girdi.id },
        select: { kontrol_listesi: { select: { kart_id: true } } },
      });
      if (!madde) {
        throw new EylemHatasi("Madde bulunamadı.", HATA_KODU.BULUNAMADI);
      }
      await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_TAMAMLA);
      await yetkiZorunluKart(
        ctx.oturum?.kullaniciId,
        "kart:tamamla",
        madde.kontrol_listesi.kart_id,
      );
    }
    const atayanId = ctx.oturum?.kullaniciId ?? null;
    await maddeGuncelleSrv(birimIdAl(ctx), kullaniciIdAl(ctx), girdi);
    // atanan_id explicit verildiyse (yeni atama veya değişim) bildir.
    if (girdi.atanan_id && atayanId) {
      void bildirimGuvenliCagir(
        tetikleMaddeAtama({
          maddeId: girdi.id,
          metin: girdi.metin ?? "",
          atananId: girdi.atanan_id,
          atayanId,
        }),
        "madde-atama-guncelle",
      );
    }
    // Generic madde güncellendi bildirimi (kart yetkililerine).
    if (atayanId) {
      void bildirimGuvenliCagir(
        tetikleMaddeGuncellendi({
          maddeId: girdi.id,
          degistirenId: atayanId,
        }),
        "madde-guncellendi",
      );
    }
    return { id: girdi.id };
  },
});

export const maddeSilEylem = eylem({
  ad: "kontrol-maddesi:sil",
  girdi: maddeSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    // Sprint 1 / S1-9 — resource-level RBAC (Kural V.2 / #146).
    const kartId = await maddeninParentKartId(girdi.id);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", kartId);
    const silenId = ctx.oturum?.kullaniciId ?? null;
    // Silmeden ÖNCE bildirim üret — silindikten sonra madde meta yok olur.
    if (silenId) {
      await bildirimGuvenliCagir(
        tetikleMaddeSilindi({ maddeId: girdi.id, silenId }),
        "madde-silindi",
      );
    }
    await maddeSilSrv(birimIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});

// ADR-0019 — Madde tamamlama öneri/onay/red action'ları (kart ile aynı kural).
// Yetki: parent kart üzerinden çözülür — madde'den kart_id'yi DB'den oku.

async function maddeninParentKartId(maddeId: string): Promise<string> {
  const m = await db.kontrolMaddesi.findUnique({
    where: { id: maddeId },
    select: { kontrol_listesi: { select: { kart_id: true } } },
  });
  if (!m) {
    throw new EylemHatasi("Madde bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return m.kontrol_listesi.kart_id;
}

export const maddeTamamlamaOneriEylem = eylem({
  ad: "kontrol-maddesi:tamamlama-oneri",
  girdi: maddeTamamlamaOneriSemasi,
  calistir: async (girdi, ctx) => {
    const kartId = await maddeninParentKartId(girdi.id);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:read", kartId);
    const onerenId = kullaniciIdAl(ctx);
    await maddeTamamlamaOneriSrv(onerenId, girdi);
    void bildirimGuvenliCagir(
      tetikleMaddeTamamlamaOnerildi({
        maddeId: girdi.id,
        onerenId,
      }),
      "madde-tamamlama-onerildi",
    );
    return { id: girdi.id };
  },
});

export const maddeTamamlamaOnayEylem = eylem({
  ad: "kontrol-maddesi:tamamlama-onay",
  girdi: maddeTamamlamaOnaySemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_TAMAMLA);
    const kartId = await maddeninParentKartId(girdi.id);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:tamamla", kartId);
    const onayliyenId = kullaniciIdAl(ctx);
    const { onerenId } = await maddeTamamlamaOnaySrv(onayliyenId, girdi);
    if (onerenId) {
      void bildirimGuvenliCagir(
        tetikleMaddeTamamlamaOnaylandi({
          maddeId: girdi.id,
          onayliyenId,
          onerenId,
        }),
        "madde-tamamlama-onaylandi",
      );
    }
    return { id: girdi.id };
  },
});

export const maddeTamamlamaReddetEylem = eylem({
  ad: "kontrol-maddesi:tamamlama-reddet",
  girdi: maddeTamamlamaReddetSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_TAMAMLA);
    const kartId = await maddeninParentKartId(girdi.id);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:tamamla", kartId);
    const reddedenId = kullaniciIdAl(ctx);
    const { onerenId } = await maddeTamamlamaReddetSrv(reddedenId, girdi);
    if (onerenId) {
      void bildirimGuvenliCagir(
        tetikleMaddeTamamlamaReddedildi({
          maddeId: girdi.id,
          reddedenId,
          onerenId,
          sebep: girdi.sebep ?? null,
        }),
        "madde-tamamlama-reddedildi",
      );
    }
    return { id: girdi.id };
  },
});

export const maddeAdayKullanicilarEylem = eylem({
  ad: "kontrol-maddesi:aday-kullanicilar",
  girdi: maddeAdayKullanicilarSemasi,
  calistir: async (girdi, ctx) => {
    // Picker'ı kart düzenleyebilen herkese aç (Kural V.2/146 — kaynak bazlı).
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.kart_id);
    return kartMaddeAdayKullanicilariniAra(birimIdAl(ctx), girdi);
  },
});
