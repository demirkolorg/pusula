"use server";

import argon2 from "argon2";
import { db } from "@/lib/db";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { kayitSemasi } from "./schemas";

export const kayitOl = eylem({
  ad: "auth:kayit",
  girdi: kayitSemasi,
  girisGerekli: false,
  calistir: async (girdi) => {
    const email = girdi.email.toLowerCase();

    const mevcut = await db.kullanici.findUnique({ where: { email } });
    if (mevcut) {
      throw new EylemHatasi(
        "Bu e-posta ile zaten bir hesap var.",
        HATA_KODU.CAKISMA,
        { email: "Bu e-posta zaten kayıtlı." },
      );
    }

    const birim = await db.birim.findUnique({
      where: { id: girdi.birim_id },
      select: { id: true, silindi_mi: true, aktif: true },
    });
    if (!birim || birim.silindi_mi || !birim.aktif) {
      throw new EylemHatasi(
        "Seçilen birim geçerli değil.",
        HATA_KODU.GECERSIZ_GIRDI,
        { birim_id: "Geçersiz birim." },
      );
    }

    const parolaHash = await argon2.hash(girdi.parola, {
      type: argon2.argon2id,
    });

    const yeni = await db.kullanici.create({
      data: {
        birim_id: girdi.birim_id,
        email,
        parola_hash: parolaHash,
        ad: girdi.ad.trim(),
        soyad: girdi.soyad.trim(),
        unvan: girdi.unvan?.trim() || null,
        telefon: girdi.telefon?.trim() || null,
        // Self-register: onay bekliyor (Kaymakamlık personeli onaylayana kadar
        // giriş yapamaz). Onay durumu varsayılan olarak BEKLIYOR.
        aktif: false,
      },
      select: { id: true, email: true },
    });

    return { kullaniciId: yeni.id, email: yeni.email };
  },
});
