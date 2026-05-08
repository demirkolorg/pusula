"use server";

import argon2 from "argon2";
import { z } from "zod";
import { db } from "@/lib/db";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { rolAtamaPolitikasiniDogrula } from "@/lib/kullanici-rol-politikasi";
import { makamRoluMu } from "@/lib/roller";
import { tetikleDavetKabulEdildi } from "@/app/(panel)/bildirimler/tetikleyiciler";
import { davetiKabulSemasi } from "./schemas";

// Sprint 1 / S1-6 — token hash fragment'tan geldiğinde sayfa client-side
// olduğu için server'a token GET ile erişilmez. Form'a render etmeden
// önce client bu sorgu ile token geçerliliğini doğrular.
const tokenSorgulaSemasi = z.object({ token: z.string().min(16).max(128) });

export const davetTokeniSorgula = eylem({
  ad: "davet:token-sorgula",
  girdi: tokenSorgulaSemasi,
  girisGerekli: false,
  calistir: async ({ token }) => {
    const davet = await db.davetTokeni.findUnique({
      where: { token },
      select: {
        email: true,
        kullanildi_mi: true,
        son_kullanma: true,
      },
    });
    if (!davet) {
      return { gecerli: false, sebep: "bulunamadi" } as const;
    }
    if (davet.kullanildi_mi) {
      return { gecerli: false, sebep: "kullanilmis" } as const;
    }
    if (davet.son_kullanma <= new Date()) {
      return { gecerli: false, sebep: "expired" } as const;
    }
    return { gecerli: true, email: davet.email } as const;
  },
});

export const daveriKabul = eylem({
  ad: "davet:kabul",
  girdi: davetiKabulSemasi,
  girisGerekli: false,
  calistir: async (girdi) => {
    const davet = await db.davetTokeni.findUnique({
      where: { token: girdi.token },
      include: {
        proje_baglamlari: { select: { proje_id: true } },
        liste_baglamlari: { select: { liste_id: true } },
        kart_baglamlari: { select: { kart_id: true } },
      },
    });

    if (!davet) {
      throw new EylemHatasi(
        "Davet geçersiz veya süresi dolmuş.",
        HATA_KODU.BULUNAMADI,
      );
    }
    if (davet.kullanildi_mi) {
      throw new EylemHatasi(
        "Bu davet daha önce kullanılmış.",
        HATA_KODU.CAKISMA,
      );
    }
    if (davet.son_kullanma < new Date()) {
      throw new EylemHatasi("Davetin süresi dolmuş.", HATA_KODU.BULUNAMADI);
    }

    const mevcut = await db.kullanici.findUnique({
      where: { email: davet.email.toLowerCase() },
    });
    if (mevcut) {
      throw new EylemHatasi(
        "Bu e-posta ile zaten bir hesap var. Giriş yapın veya parola sıfırlayın.",
        HATA_KODU.CAKISMA,
      );
    }

    const davetRolu = davet.rol_id
      ? await db.rol.findUnique({
          where: { id: davet.rol_id },
          select: { kod: true },
        })
      : null;
    if (davet.rol_id && !davetRolu) {
      throw new EylemHatasi("Davet rolü bulunamadı.", HATA_KODU.BULUNAMADI);
    }

    let birimId: string | null = davet.birim_id;
    if (!birimId && (!davetRolu || !makamRoluMu(davetRolu.kod))) {
      const davetEden = await db.kullanici.findUnique({
        where: { id: davet.davet_eden_id },
        select: { birim_id: true },
      });
      if (!davetEden) {
        throw new EylemHatasi(
          "Daveti oluşturan kullanıcı bulunamadı.",
          HATA_KODU.BULUNAMADI,
        );
      }
      birimId = davetEden.birim_id;
    }

    const parolaHash = await argon2.hash(girdi.parola, { type: argon2.argon2id });

    const yeni = await db.$transaction(async (tx) => {
      await rolAtamaPolitikasiniDogrula(tx, {
        rolIdleri: davet.rol_id ? [davet.rol_id] : [],
        birimId,
      });

      const kullanici = await tx.kullanici.create({
        data: {
          birim_id: birimId,
          email: davet.email.toLowerCase(),
          parola_hash: parolaHash,
          ad: girdi.ad.trim(),
          soyad: girdi.soyad.trim(),
          aktif: true,
          onay_durumu: "ONAYLANDI",
          onay_zamani: new Date(),
          onaylayan_id: davet.davet_eden_id,
          email_dogrulandi: new Date(),
        },
      });

      if (davet.rol_id) {
        await tx.kullaniciRol.create({
          data: {
            kullanici_id: kullanici.id,
            rol_id: davet.rol_id,
            atayan_id: davet.davet_eden_id,
          },
        });
      }

      // ADR-0010/0012/0013: davet bağlamları kaynak'a göre üç ayrı tabloda
      // tutulur. Kabul edildiğinde ilgili yetkili tablolarına dönüştürülür.
      // Silinmiş kaynaklar atlanır; bağlam tablosu davet expire/use'da
      // Cascade ile temizlenir.
      if (davet.proje_baglamlari.length > 0) {
        const projeIdleri = davet.proje_baglamlari.map((b) => b.proje_id);
        const aktif = await tx.proje.findMany({
          where: { id: { in: projeIdleri }, silindi_mi: false },
          select: { id: true },
        });
        const aktifSet = new Set(aktif.map((p) => p.id));
        const kayitlar = davet.proje_baglamlari
          .filter((b) => aktifSet.has(b.proje_id))
          .map((b) => ({
            proje_id: b.proje_id,
            kullanici_id: kullanici.id,
          }));
        if (kayitlar.length > 0) {
          await tx.projeYetkilisi.createMany({
            data: kayitlar,
            skipDuplicates: true,
          });
        }
      }

      if (davet.liste_baglamlari.length > 0) {
        const listeIdleri = davet.liste_baglamlari.map((b) => b.liste_id);
        const aktif = await tx.liste.findMany({
          where: { id: { in: listeIdleri } },
          select: { id: true },
        });
        const aktifSet = new Set(aktif.map((l) => l.id));
        const kayitlar = davet.liste_baglamlari
          .filter((b) => aktifSet.has(b.liste_id))
          .map((b) => ({
            liste_id: b.liste_id,
            kullanici_id: kullanici.id,
          }));
        if (kayitlar.length > 0) {
          await tx.listeYetkilisi.createMany({
            data: kayitlar,
            skipDuplicates: true,
          });
        }
      }

      if (davet.kart_baglamlari.length > 0) {
        const kartIdleri = davet.kart_baglamlari.map((b) => b.kart_id);
        const aktif = await tx.kart.findMany({
          where: { id: { in: kartIdleri }, silindi_mi: false },
          select: { id: true },
        });
        const aktifSet = new Set(aktif.map((k) => k.id));
        const kayitlar = davet.kart_baglamlari
          .filter((b) => aktifSet.has(b.kart_id))
          .map((b) => ({
            kart_id: b.kart_id,
            kullanici_id: kullanici.id,
          }));
        if (kayitlar.length > 0) {
          await tx.kartYetkilisi.createMany({
            data: kayitlar,
            skipDuplicates: true,
          });
        }
      }

      await tx.davetTokeni.update({
        where: { id: davet.id },
        data: { kullanildi_mi: true, kullanim_zamani: new Date() },
      });

      return kullanici;
    });

    // Davet edene "kabul edildi" bildirimi (transaction sonrası, fire-and-forget)
    tetikleDavetKabulEdildi({
      davetEdenId: davet.davet_eden_id,
      kabulEdenAd: yeni.ad,
      kabulEdenSoyad: yeni.soyad,
      kabulEdenEmail: yeni.email,
    }).catch(() => {
      /* Bildirim hatası işlemi bozmaz */
    });

    return { kullaniciId: yeni.id, email: yeni.email };
  },
});
