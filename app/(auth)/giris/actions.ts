"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { girisSemasi } from "./schemas";

export type GirisSonucu =
  | { basarili: true }
  | { basarili: false; hata: string; kod: string; alanlar?: Record<string, string> };

export async function girisYap(formData: FormData): Promise<GirisSonucu> {
  const ham = {
    email: formData.get("email"),
    parola: formData.get("parola"),
  };
  const dogrulama = girisSemasi.safeParse(ham);

  if (!dogrulama.success) {
    const alanlar: Record<string, string> = {};
    for (const issue of dogrulama.error.issues) {
      const yol = issue.path.join(".");
      if (yol) alanlar[yol] = issue.message;
    }
    return {
      basarili: false,
      hata: "Bilgiler geçersiz",
      kod: "VALIDATION_ERROR",
      alanlar,
    };
  }

  try {
    await signIn("credentials", {
      email: dogrulama.data.email.toLowerCase(),
      parola: dogrulama.data.parola,
      redirect: false,
    });
    return { basarili: true };
  } catch (hata) {
    if (hata instanceof AuthError) {
      switch (hata.type) {
        case "CredentialsSignin":
          return {
            basarili: false,
            hata: "E-posta veya parola hatalı",
            kod: "INVALID_CREDENTIALS",
          };
        default:
          return {
            basarili: false,
            hata: "Giriş yapılamadı, lütfen tekrar deneyin",
            kod: "AUTH_ERROR",
          };
      }
    }
    throw hata;
  }
}
