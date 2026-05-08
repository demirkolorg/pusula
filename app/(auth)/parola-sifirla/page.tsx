import Link from "next/link";

import { AuthKabugu } from "@/components/auth/auth-kabugu";
import { ParolaSifirlaIstekForm } from "./components/istek-form";

export const metadata = {
  title: "Parolamı Unuttum — Pusula",
};

export default function ParolaSifirlaSayfasi() {
  return (
    <AuthKabugu
      baslik="Parolamı unuttum"
      aciklama="E-posta adresinizi girin, sıfırlama bağlantısını size gönderelim."
      altIcerik={
        <Link
          href="/giris"
          className="text-foreground font-medium underline-offset-4 hover:underline"
        >
          Giriş sayfasına dön
        </Link>
      }
    >
      <ParolaSifirlaIstekForm />
    </AuthKabugu>
  );
}
