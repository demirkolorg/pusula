"use server";

// "Şablondan proje oluştur" — bağımsız server action.
// Mevcut proje/services.ts'e dokunmadan şablon entegrasyonu sağlar:
// 1. Boş proje oluştur (mevcut akış)
// 2. Şablon listelerini sabit sıra ile yeni projeye ekle (transaction).
//
// Kontrol Kural 45 (transaction), 50 (RBAC), 90 (yetki: proje:create izni).

import { z } from "zod";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { db } from "@/lib/db";
import { yetkiZorunlu } from "@/lib/permissions";
import { IZIN_KODLARI } from "@/lib/permissions-katalog";
import { siraSonuna } from "@/lib/sira";
import { HATA_KODU } from "@/lib/sonuc";
import { sablonListeleriniGetir } from "./services";

const sablondanProjeSemasi = z.object({
  sablon_id: z.string().uuid(),
  ad: z.string().trim().min(2).max(120),
  aciklama: z.string().trim().max(1000).nullable().optional(),
  kapak_renk: z.string().nullable().optional(),
  kapak_ikon: z.string().nullable().optional(),
});

export const sablondanProjeOlusturEylem = eylem({
  ad: "sablon:projeden-olustur",
  girdi: sablondanProjeSemasi,
  calistir: async (girdi, ctx) => {
    const kullaniciId = ctx.oturum!.kullaniciId;
    await yetkiZorunlu(kullaniciId, IZIN_KODLARI.PROJE_OLUSTUR);

    // Kullanıcının birim_id'si — proje oluşturulurken otomatik ProjeBirimi
    // join'ine eklenir (ADR-0008 — saf görünürlük).
    const kullanici = await db.kullanici.findUnique({
      where: { id: kullaniciId },
      select: { birim_id: true },
    });
    if (!kullanici) {
      throw new EylemHatasi("Kullanıcı bulunamadı.", HATA_KODU.BULUNAMADI);
    }

    const sablonListeleri = await sablonListeleriniGetir(
      kullaniciId,
      girdi.sablon_id,
    );

    // Proje oluşturma için son sıra — mevcut projelerden hesapla.
    const sonProje = await db.proje.findFirst({
      where: { silindi_mi: false },
      orderBy: { sira: "desc" },
      select: { sira: true },
    });
    const projeSira = siraSonuna(sonProje?.sira ?? null);

    const yeni = await db.$transaction(async (tx) => {
      const proje = await tx.proje.create({
        data: {
          ad: girdi.ad,
          aciklama: girdi.aciklama ?? null,
          kapak_renk: girdi.kapak_renk ?? null,
          kapak_ikon: girdi.kapak_ikon ?? null,
          sira: projeSira,
          olusturan_id: kullaniciId,
          // ADR-0008: oluşturanın birimi otomatik proje birimine eklenir.
          ...(kullanici.birim_id
            ? { birimler: { create: { birim_id: kullanici.birim_id } } }
            : {}),
          // Oluşturan kullanıcı projeye yetkili olarak eklenir.
          yetkililer: { create: { kullanici_id: kullaniciId } },
        },
        select: { id: true },
      });

      // Şablon listelerini kopyala (sıra ile) + Arşiv sistem listesi (ADR-0009).
      // Arşiv: sıra "ZZZZ" ile en sonda, ARSIV tipi.
      for (const l of sablonListeleri) {
        await tx.liste.create({
          data: {
            proje_id: proje.id,
            ad: l.ad,
            sira: l.sira,
            tip: "NORMAL",
            wip_limit: l.wip_limit ?? null,
          },
        });
      }
      await tx.liste.create({
        data: {
          proje_id: proje.id,
          ad: "Arşiv",
          sira: "ZZZZ",
          tip: "ARSIV",
        },
      });

      return proje;
    });

    return { id: yeni.id };
  },
});
