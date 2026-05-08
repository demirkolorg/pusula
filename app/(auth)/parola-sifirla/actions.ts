"use server";

import argon2 from "argon2";
import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { mailGonder } from "@/lib/mail";
import { eylem, EylemHatasi } from "@/lib/action-wrapper";
import {
  parolaSifirlaIPLimiter,
  parolaSifirlaEmailLimiter,
} from "@/lib/rate-limit";
import { istekContextAl } from "@/lib/request-context";
import { HATA_KODU } from "@/lib/sonuc";
import { sifirlamaIstekSemasi, yeniParolaSemasi } from "./schemas";

const TOKEN_OMUR_DK = 60;
// Aynı kullanıcıya 5 dk içinde aktif token üretildiyse yeni token üretilmez —
// e-posta spam ve token enumeration suistimalini engeller.
const TEKRAR_URET_KORUMA_MS = 5 * 60 * 1000;

function tokenUret(): string {
  const bayt = new Uint8Array(32);
  crypto.getRandomValues(bayt);
  let s = "";
  for (const b of bayt) s += b.toString(16).padStart(2, "0");
  return s;
}

// Sahte branş için zamanı gerçek branşla eşitle — kullanıcı varlığı
// yan-kanaldan sızmasın.
async function sahteGecikme(): Promise<void> {
  // 100–300ms arası rastgele bekleme (argon2 + DB roundtrip ortalaması).
  const bayt = new Uint8Array(1);
  crypto.getRandomValues(bayt);
  const ek = Math.floor((bayt[0]! / 255) * 200);
  await new Promise((r) => setTimeout(r, 100 + ek));
}

function emailHash(email: string): string {
  // In-memory rate-limit map'inde plaintext e-posta tutmamak için.
  return createHash("sha256").update(email).digest("hex").slice(0, 32);
}

export const sifirlamaIste = eylem({
  ad: "parola-sifirla:iste",
  girdi: sifirlamaIstekSemasi,
  girisGerekli: false,
  calistir: async (girdi) => {
    const email = girdi.email.toLowerCase();
    const ctx = await istekContextAl();
    const ipKey = ctx.ip ?? "ip-yok";
    const emailKey = emailHash(email);

    // Sprint 1 / S1-2: IP+email çift limit — DoS, mail bombing, token
    // enumeration üçlüsüne karşı. Limit aşıldığında sahte başarı dön
    // (kullanıcı sayımı sızdırma) ama timing'i de eşitle.
    const ipOk = parolaSifirlaIPLimiter.tryConsume(ipKey);
    const emailOk = parolaSifirlaEmailLimiter.tryConsume(emailKey);
    if (!ipOk || !emailOk) {
      await sahteGecikme();
      return { gonderildi: true } as const;
    }

    const kullanici = await db.kullanici.findUnique({
      where: { email },
      select: { id: true, ad: true, soyad: true, aktif: true, silindi_mi: true },
    });

    if (kullanici && kullanici.aktif && !kullanici.silindi_mi) {
      // Aktif (kullanılmamış, süresi dolmamış) yakın zamanlı token varsa
      // yenisini üretme — saldırgan aynı user'a sürekli mail tetikleyemez.
      const tazeToken = await db.sifirlamaTokeni.findFirst({
        where: {
          kullanici_id: kullanici.id,
          kullanildi_mi: false,
          son_kullanma: { gt: new Date() },
          olusturma_zamani: {
            gte: new Date(Date.now() - TEKRAR_URET_KORUMA_MS),
          },
        },
        select: { id: true },
      });

      if (!tazeToken) {
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
    } else {
      // Sahte branş — varlık-yokluk timing eşitlemesi.
      await sahteGecikme();
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
