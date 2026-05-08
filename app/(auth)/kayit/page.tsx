import Link from "next/link";

import { AuthKabugu } from "@/components/auth/auth-kabugu";
import { KayitForm } from "./components/kayit-form";

export const metadata = {
  title: "Kayıt — Pusula",
};

export default function KayitSayfasi() {
  return (
    <AuthKabugu
      formMaxGenislik="md"
      baslik="Hesap oluşturun"
      aciklama="Biriminizi seçip hesap açın. Kaymakamlık onayından sonra giriş yapabileceksiniz."
      altIcerik={
        <span>
          Zaten hesabınız var mı?{" "}
          <Link
            href="/giris"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Giriş yapın
          </Link>
        </span>
      }
    >
      <KayitForm />
    </AuthKabugu>
  );
}
