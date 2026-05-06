"use server";

// ADR-0028 / F4 — Dosya yönetimi server action katmanı.
// Her action `eylem()` wrapper'ı ile sarılır → otomatik audit context,
// hata logu, request_id propagation, Zod validate.

import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { uploadLimiter } from "@/lib/rate-limit";
import { HATA_KODU } from "@/lib/sonuc";
import {
  dosyaListeFiltreSemasi,
  dosyaDetaySemasi,
  dosyaYuklemeBaslatSemasi,
  dosyaYuklemeOnaylaSemasi,
  dosyaSurumYuklemeBaslatSemasi,
  dosyaSurumYuklemeOnaylaSemasi,
  dosyaIndirSemasi,
  dosyaOnizlemeSemasi,
  dosyaMetinIcerikSemasi,
  dosyaAdGuncelleSemasi,
  dosyaAciklamaGuncelleSemasi,
  dosyaGizlilikGuncelleSemasi,
  dosyaEtiketleriGuncelleSemasi,
  dosyaEtiketiOlusturSemasi,
  dosyaEtiketiSilSemasi,
  dosyaBaglantiEkleSemasi,
  dosyaBaglantiKaldirSemasi,
  dosyaSilSemasi,
  dosyaGeriYukleSemasi,
  dosyaKaliciSilSemasi,
} from "./schemas";
import {
  dosyalariListele,
  dosyaDetay,
  yuklemeBaslat,
  yuklemeOnayla,
  surumYuklemeBaslat,
  surumYuklemeOnayla,
  indirUrl,
  onizlemeUrl,
  metinIcerikGetir,
  adGuncelle,
  aciklamaGuncelle,
  gizlilikGuncelle,
  etiketleriGuncelle,
  etiketOlustur,
  etiketSil,
  baglantiEkle,
  baglantiKaldir,
  sil,
  geriYukle,
  kaliciSil,
} from "./services";

function kullaniciIdAl(ctx: {
  oturum: { kullaniciId?: string } | null;
}): string {
  const id = ctx.oturum?.kullaniciId;
  if (!id) throw new EylemHatasi("Oturum yok.", HATA_KODU.GIRIS_YOK);
  return id;
}

export const dosyalariListeleEylem = eylem({
  ad: "dosya:listele",
  girdi: dosyaListeFiltreSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.DOSYA_OKU);
    return dosyalariListele(kullaniciIdAl(ctx), girdi);
  },
});

export const dosyaDetayEylem = eylem({
  ad: "dosya:detay",
  girdi: dosyaDetaySemasi,
  calistir: async (girdi, ctx) =>
    dosyaDetay(kullaniciIdAl(ctx), girdi.id),
});

export const dosyaYuklemeBaslatEylem = eylem({
  ad: "dosya:yukleme-baslat",
  girdi: dosyaYuklemeBaslatSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.DOSYA_YUKLE);
    const kullaniciId = kullaniciIdAl(ctx);
    if (!uploadLimiter.tryConsume(kullaniciId)) {
      throw new EylemHatasi(
        "Çok fazla yükleme isteği. Lütfen biraz bekleyin.",
        HATA_KODU.YETKISIZ,
      );
    }
    return yuklemeBaslat(kullaniciId, girdi);
  },
});

export const dosyaYuklemeOnaylaEylem = eylem({
  ad: "dosya:yukleme-onayla",
  girdi: dosyaYuklemeOnaylaSemasi,
  calistir: async (girdi, ctx) =>
    yuklemeOnayla(kullaniciIdAl(ctx), girdi),
});

export const dosyaSurumYuklemeBaslatEylem = eylem({
  ad: "dosya:surum-yukleme-baslat",
  girdi: dosyaSurumYuklemeBaslatSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_SURUM_YUKLE,
    );
    const kullaniciId = kullaniciIdAl(ctx);
    if (!uploadLimiter.tryConsume(kullaniciId)) {
      throw new EylemHatasi(
        "Çok fazla yükleme isteği. Lütfen biraz bekleyin.",
        HATA_KODU.YETKISIZ,
      );
    }
    return surumYuklemeBaslat(kullaniciId, girdi);
  },
});

export const dosyaSurumYuklemeOnaylaEylem = eylem({
  ad: "dosya:surum-yukleme-onayla",
  girdi: dosyaSurumYuklemeOnaylaSemasi,
  calistir: async (girdi, ctx) =>
    surumYuklemeOnayla(kullaniciIdAl(ctx), girdi),
});

export const dosyaIndirEylem = eylem({
  ad: "dosya:indir",
  girdi: dosyaIndirSemasi,
  calistir: async (girdi, ctx) =>
    indirUrl(kullaniciIdAl(ctx), girdi.id),
});

export const dosyaOnizlemeEylem = eylem({
  ad: "dosya:onizleme",
  girdi: dosyaOnizlemeSemasi,
  calistir: async (girdi, ctx) =>
    onizlemeUrl(kullaniciIdAl(ctx), girdi.id),
});

export const dosyaMetinIcerikEylem = eylem({
  ad: "dosya:metin-icerik",
  girdi: dosyaMetinIcerikSemasi,
  calistir: async (girdi, ctx) =>
    metinIcerikGetir(kullaniciIdAl(ctx), girdi.id),
});

export const dosyaAdGuncelleEylem = eylem({
  ad: "dosya:ad-guncelle",
  girdi: dosyaAdGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_AD_DUZENLE,
    );
    await adGuncelle(kullaniciIdAl(ctx), girdi);
    return { id: girdi.id };
  },
});

export const dosyaAciklamaGuncelleEylem = eylem({
  ad: "dosya:aciklama-guncelle",
  girdi: dosyaAciklamaGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_ACIKLAMA_DUZENLE,
    );
    await aciklamaGuncelle(kullaniciIdAl(ctx), girdi);
    return { id: girdi.id };
  },
});

export const dosyaGizlilikGuncelleEylem = eylem({
  ad: "dosya:gizlilik-guncelle",
  girdi: dosyaGizlilikGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_GIZLILIK_DUZENLE,
    );
    await gizlilikGuncelle(kullaniciIdAl(ctx), girdi);
    return { id: girdi.id };
  },
});

export const dosyaEtiketleriGuncelleEylem = eylem({
  ad: "dosya:etiket-guncelle",
  girdi: dosyaEtiketleriGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_ETIKET_ATA,
    );
    await etiketleriGuncelle(kullaniciIdAl(ctx), girdi);
    return { dosya_id: girdi.dosya_id };
  },
});

export const dosyaEtiketiOlusturEylem = eylem({
  ad: "dosya:etiket-olustur",
  girdi: dosyaEtiketiOlusturSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_ETIKET_YONET,
    );
    return etiketOlustur(kullaniciIdAl(ctx), girdi);
  },
});

export const dosyaEtiketiSilEylem = eylem({
  ad: "dosya:etiket-sil",
  girdi: dosyaEtiketiSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_ETIKET_YONET,
    );
    await etiketSil(girdi.id);
    return { id: girdi.id };
  },
});

export const dosyaBaglantiEkleEylem = eylem({
  ad: "dosya:baglanti-ekle",
  girdi: dosyaBaglantiEkleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_BAGLANTI_EKLE,
    );
    return baglantiEkle(kullaniciIdAl(ctx), girdi);
  },
});

export const dosyaBaglantiKaldirEylem = eylem({
  ad: "dosya:baglanti-kaldir",
  girdi: dosyaBaglantiKaldirSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_BAGLANTI_KALDIR,
    );
    await baglantiKaldir(kullaniciIdAl(ctx), girdi.baglanti_id);
    return { id: girdi.baglanti_id };
  },
});

export const dosyaSilEylem = eylem({
  ad: "dosya:sil",
  girdi: dosyaSilSemasi,
  calistir: async (girdi, ctx) => {
    // canDosya helper'ı kendi-sil/baska-sil ayrımını otomatik yapar.
    await sil(kullaniciIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});

export const dosyaGeriYukleEylem = eylem({
  ad: "dosya:geri-yukle",
  girdi: dosyaGeriYukleSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_GERI_YUKLE,
    );
    await geriYukle(kullaniciIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});

export const dosyaKaliciSilEylem = eylem({
  ad: "dosya:kalici-sil",
  girdi: dosyaKaliciSilSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(
      ctx.oturum?.kullaniciId,
      IZIN_KODLARI.DOSYA_KALICI_SIL,
    );
    await kaliciSil(kullaniciIdAl(ctx), girdi.id);
    return { id: girdi.id };
  },
});
