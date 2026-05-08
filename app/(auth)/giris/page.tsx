import Link from "next/link";

import { AuthKabugu } from "@/components/auth/auth-kabugu";
import { GirisForm } from "./components/giris-form";

// Giriş sayfası için sosyal paylaşım (WhatsApp vs.) önizlemesi: kök layout'taki
// metadata'yı miras alıp title/description/openGraph alanlarını override ediyoruz.
export const metadata = {
  title: "Giriş — Pusula",
  description:
    "Pusula hesabınızla giriş yapın ve görevlerinize kaldığınız yerden devam edin.",
  openGraph: {
    title: "Giriş — Pusula",
    description:
      "Pusula hesabınızla giriş yapın ve görevlerinize kaldığınız yerden devam edin.",
    url: "/giris",
  },
  twitter: {
    title: "Giriş — Pusula",
    description:
      "Pusula hesabınızla giriş yapın ve görevlerinize kaldığınız yerden devam edin.",
  },
};

export default function GirisSayfasi() {
  return (
    <AuthKabugu
      baslik="Tekrar hoş geldiniz"
      aciklama="Hesabınızla giriş yapın ve görevlerinize kaldığınız yerden devam edin."
      altIcerik={
        <span>
          Hesabınız yok mu?{" "}
          <Link
            href="/kayit"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Kayıt olun
          </Link>
        </span>
      }
    >
      <GirisForm />
    </AuthKabugu>
  );
}
