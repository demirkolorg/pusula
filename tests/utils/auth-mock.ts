import { vi } from "vitest";

// NextAuth (auth.ts) mock yardimcisi.
// Gerekce:
//   - auth.ts production'da NextAuth handler'i export eder; bu dosya server-only modulleri
//     (next/headers, next/server) cekiyor. Test'te jsdom ortaminda calistirilamaz.
//   - Bu yuzden server action / route testlerinde `auth()` fonksiyonunu mock'luyoruz.
//   - Tur 1'de kullanim yok (saf fonksiyonlar test ediliyor); Tur 2 ve sonrasinda devreye girecek.
//
// Kullanim:
//   import { mockAuth, mockYetkili, mockYetkisiz } from "@/tests/utils/auth-mock";
//   mockAuth();             // setup'a sok
//   mockYetkili({ id: "u1", email: "a@b.c" });  // testin icinde kullaniciyi degistir
//   mockYetkisiz();          // session yok senaryosu

type SahteKullanici = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
};

const sahteAuth = vi.fn(async () => null as unknown);

export function mockAuth(): void {
  vi.mock("@/auth", () => ({
    auth: sahteAuth,
    // signIn / signOut da gerekirse genisletilebilir.
    signIn: vi.fn(),
    signOut: vi.fn(),
  }));
}

export function mockYetkili(kullanici: SahteKullanici): void {
  sahteAuth.mockResolvedValue({
    user: kullanici,
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  });
}

export function mockYetkisiz(): void {
  sahteAuth.mockResolvedValue(null);
}

export function mockAuthSifirla(): void {
  sahteAuth.mockReset();
  sahteAuth.mockResolvedValue(null);
}
