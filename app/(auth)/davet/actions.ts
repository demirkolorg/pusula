"use server";

import argon2 from "argon2";
import { db } from "@/lib/db";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { davetiKabulSemasi } from "./schemas";

export const daveriKabul = eylem({
  ad: "davet:kabul",
  girdi: davetiKabulSemasi,
  girisGerekli: false,
  calistir: async (girdi) => {
    const davet = await db.davetTokeni.findUnique({
      where: { token: girdi.token },
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
      throw new EylemHatasi(
        "Davetin süresi dolmuş.",
        HATA_KODU.BULUNAMADI,
      );
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

    // Davet edilen kurum: davet kaydında belirtilen `kurum_id` (yoksa daveti
    // gönderen kullanıcının kurumu — geriye dönük güvenli varsayılan).
    let kurumId: string | null = davet.kurum_id;
    if (!kurumId) {
      const davetEden = await db.kullanici.findUnique({
        where: { id: davet.davet_eden_id },
        select: { kurum_id: true },
      });
      if (!davetEden) {
        throw new EylemHatasi(
          "Daveti oluşturan kullanıcı bulunamadı.",
          HATA_KODU.BULUNAMADI,
        );
      }
      kurumId = davetEden.kurum_id;
    }

    const parolaHash = await argon2.hash(girdi.parola, { type: argon2.argon2id });

    const yeni = await db.$transaction(async (tx) => {
      const kullanici = await tx.kullanici.create({
        data: {
          kurum_id: kurumId!,
          email: davet.email.toLowerCase(),
          parola_hash: parolaHash,
          ad: girdi.ad.trim(),
          soyad: girdi.soyad.trim(),
          aktif: true,
          // Davetli kullanıcı doğrudan onaylı sayılır (davet zaten yetkili
          // tarafından gönderildi).
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

      await tx.davetTokeni.update({
        where: { id: davet.id },
        data: { kullanildi_mi: true, kullanim_zamani: new Date() },
      });

      return kullanici;
    });

    return { kullaniciId: yeni.id, email: yeni.email };
  },
});
