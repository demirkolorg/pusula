"use server";

import argon2 from "argon2";
import { db } from "@/lib/db";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { rolAtamaPolitikasiniDogrula } from "@/lib/kullanici-rol-politikasi";
import { makamRoluMu } from "@/lib/roller";
import { davetiKabulSemasi } from "./schemas";

export const daveriKabul = eylem({
  ad: "davet:kabul",
  girdi: davetiKabulSemasi,
  girisGerekli: false,
  calistir: async (girdi) => {
    const davet = await db.davetTokeni.findUnique({
      where: { token: girdi.token },
      include: {
        proje_baglamlari: {
          select: { proje_id: true, seviye: true },
        },
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

      // Davet üzerindeki proje bağlamlarını ProjeYetkili kayıtlarına dönüştür.
      // Why: davet sahibinin sisteme katılır katılmaz ilgili projelere yetkili olması.
      // Silinmiş projeler atlanır; bağlam tablosu davet expire/use'de Cascade ile temizlenir.
      if (davet.proje_baglamlari.length > 0) {
        const projeIdleri = davet.proje_baglamlari.map((b) => b.proje_id);
        const aktifProjeler = await tx.proje.findMany({
          where: { id: { in: projeIdleri }, silindi_mi: false },
          select: { id: true },
        });
        const aktifSet = new Set(aktifProjeler.map((p) => p.id));
        const yetkiKayitlari = davet.proje_baglamlari
          .filter((b) => aktifSet.has(b.proje_id))
          .map((b) => ({
            proje_id: b.proje_id,
            kullanici_id: kullanici.id,
            seviye: b.seviye,
          }));
        if (yetkiKayitlari.length > 0) {
          await tx.projeYetkilisi.createMany({
            data: yetkiKayitlari,
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

    return { kullaniciId: yeni.id, email: yeni.email };
  },
});
