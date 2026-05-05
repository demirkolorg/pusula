"use server";

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { yetkiZorunluKart } from "@/lib/yetki";
import { HATA_KODU } from "@/lib/sonuc";
import { db } from "@/lib/db";
import {
  tetikleMaddeAtama,
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
    return kontrolListesiOlusturSrv(birimIdAl(ctx), girdi);
  },
});

export const kontrolListesiGuncelleEylem = eylem({
  ad: "kontrol-listesi:guncelle",
  girdi: kontrolListesiGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
    await kontrolListesiGuncelleSrv(birimIdAl(ctx), girdi);
    return { id: girdi.id };
  },
});

export const kontrolListesiSilEylem = eylem({
  ad: "kontrol-listesi:sil",
  girdi: kontrolListesiSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
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
      tetikleMaddeAtama({
        maddeId: m.id,
        metin: m.metin,
        atananId: girdi.atanan_id,
        atayanId,
      }).catch(() => {});
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
      tetikleMaddeAtama({
        maddeId: girdi.id,
        metin: girdi.metin ?? "",
        atananId: girdi.atanan_id,
        atayanId,
      }).catch(() => {});
    }
    return { id: girdi.id };
  },
});

export const maddeSilEylem = eylem({
  ad: "kontrol-maddesi:sil",
  girdi: maddeSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.KART_DUZENLE);
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
    tetikleMaddeTamamlamaOnerildi({
      maddeId: girdi.id,
      onerenId,
    }).catch(() => {});
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
      tetikleMaddeTamamlamaOnaylandi({
        maddeId: girdi.id,
        onayliyenId,
        onerenId,
      }).catch(() => {});
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
      tetikleMaddeTamamlamaReddedildi({
        maddeId: girdi.id,
        reddedenId,
        onerenId,
        sebep: girdi.sebep ?? null,
      }).catch(() => {});
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
