import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "@/lib/db";
import { auditContext } from "@/lib/audit-context";
import { authConfig } from "./auth.config";

const girisSemasi = z.object({
  email: z.string().email(),
  parola: z.string().min(8).max(128),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-posta", type: "email" },
        parola: { label: "Parola", type: "password" },
      },
      authorize: async (credentials) => {
        const dogrulama = girisSemasi.safeParse(credentials);
        if (!dogrulama.success) return null;

        const { email, parola } = dogrulama.data;

        const kullanici = await db.kullanici.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            roller: { include: { rol: true } },
          },
        });

        if (!kullanici || !kullanici.aktif || kullanici.silindi_mi) return null;
        // Onay bekliyor veya reddedildiyse giriş engelli.
        if (kullanici.onay_durumu !== "ONAYLANDI") return null;

        const parolaDogru = await argon2.verify(kullanici.parola_hash, parola);
        if (!parolaDogru) return null;

        // NextAuth callback `eylem()` wrapper dışından çalışır → audit
        // context yok. Self-update'te kullanıcı kendisini güncellediği için
        // audit kaydını kendi adına yazıyoruz (sebep: login).
        //
        // Why: callback ZORUNLU `async` + içinde `await` olmalı. Sync arrow
        // (`() => db.kullanici.update(...)`) lazy PrismaPromise'i hemen
        // döndürür; AsyncLocalStorage.run() callback sync bittiği için
        // context'ten çıkar; PrismaPromise dış `await` ile execute edilirken
        // artık caller'ın (audit-context'siz) async context'indedir →
        // Prisma extension boş context görür ve KATİ AUDIT GUARD reddeder.
        await auditContext.run(
          {
            kullaniciId: kullanici.id,
            sebep: "login:son_giris_zamani",
            httpMetod: "AUTH",
            httpYol: "credentials.authorize",
          },
          async () => {
            await db.kullanici.update({
              where: { id: kullanici.id },
              data: { son_giris_zamani: new Date() },
            });
          },
        );

        return {
          id: kullanici.id,
          email: kullanici.email,
          name: `${kullanici.ad} ${kullanici.soyad}`,
          adSoyad: `${kullanici.ad} ${kullanici.soyad}`,
          birimId: kullanici.birim_id,
          roller: kullanici.roller.map((r) => r.rol.kod),
        };
      },
    }),
  ],
});
