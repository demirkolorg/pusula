"use server";

import argon2 from "argon2";
import { db } from "@/lib/db";
import { mailGonder } from "@/lib/mail";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { sifirlamaIstekSemasi, yeniParolaSemasi } from "./schemas";

const TOKEN_OMUR_DK = 60;

function tokenUret(): string {
  const bayt = new Uint8Array(32);
  crypto.getRandomValues(bayt);
  let s = "";
  for (const b of bayt) s += b.toString(16).padStart(2, "0");
  return s;
}

export const sifirlamaIste = eylem({
  ad: "parola-sifirla:iste",
  girdi: sifirlamaIstekSemasi,
  girisGerekli: false,
  calistir: async (girdi) => {
    const email = girdi.email.toLowerCase();
    const kullanici = await db.kullanici.findUnique({
      where: { email },
      select: { id: true, ad: true, soyad: true, aktif: true, silindi_mi: true },
    });

    if (kullanici && kullanici.aktif && !kullanici.silindi_mi) {
      const token = tokenUret();
      const sonKullanma = new Date(Date.now() + TOKEN_OMUR_DK * 60 * 1000);

      await db.sifirlamaTokeni.create({
        data: {
          token,
          kullanici_id: kullanici.id,
          son_kullanma: sonKullanma,
        },
      });

      const url = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:2500"}/parola-sifirla/${token}`;
      await mailGonder({
        alici: email,
        konu: "Pusula — Parola sıfırlama bağlantınız",
        govde: `Merhaba ${kullanici.ad},\n\nParolanızı sıfırlamak için aşağıdaki bağlantıya tıklayın. Bağlantı ${TOKEN_OMUR_DK} dakika sonra geçersiz olacak.\n\n${url}\n\nBu işlemi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.\n\nPusula Ekibi`,
      });
    }

    return { gonderildi: true } as const;
  },
});

export const yeniParolaBelirle = eylem({
  ad: "parola-sifirla:onayla",
  girdi: yeniParolaSemasi,
  girisGerekli: false,
  calistir: async (girdi) => {
    const tokenKaydi = await db.sifirlamaTokeni.findUnique({
      where: { token: girdi.token },
    });

    if (!tokenKaydi) {
      throw new EylemHatasi(
        "Bağlantı geçersiz veya süresi dolmuş.",
        HATA_KODU.BULUNAMADI,
      );
    }
    if (tokenKaydi.kullanildi_mi) {
      throw new EylemHatasi(
        "Bu bağlantı daha önce kullanılmış.",
        HATA_KODU.CAKISMA,
      );
    }
    if (tokenKaydi.son_kullanma < new Date()) {
      throw new EylemHatasi(
        "Bağlantının süresi dolmuş.",
        HATA_KODU.BULUNAMADI,
      );
    }

    const parolaHash = await argon2.hash(girdi.parola, { type: argon2.argon2id });

    await db.$transaction([
      db.kullanici.update({
        where: { id: tokenKaydi.kullanici_id },
        data: { parola_hash: parolaHash },
      }),
      db.sifirlamaTokeni.update({
        where: { id: tokenKaydi.id },
        data: { kullanildi_mi: true },
      }),
    ]);

    return { guncellendi: true } as const;
  },
});
