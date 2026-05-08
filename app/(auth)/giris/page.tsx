import Link from "next/link";

import { AuthKabugu } from "@/components/auth/auth-kabugu";
import { GirisForm } from "./components/giris-form";

// Giriş sayfası için sosyal paylaşım (WhatsApp vs.) önizlemesi: kök layout'taki
// metadata'yı override ediyoruz. ÖNEMLİ: Next.js metadata "shallow merge"
// yapmıyor — sayfa-spesifik openGraph yazıldığında kök openGraph block'u
// (file-based opengraph-image dahil) tamamen replace ediliyor. Bu yüzden
// dosya-tabanlı og-image'ı kaybetmemek için images alanını burada da
// `/opengraph-image` olarak tekrar belirtmek gerekiyor (metadataBase ile
// https://pusulaportal.com/opengraph-image olarak resolve olur).
export const metadata = {
  title: "Giriş — Pusula",
  description:
    "Pusula hesabınızla giriş yapın ve görevlerinize kaldığınız yerden devam edin.",
  openGraph: {
    type: "website" as const,
    locale: "tr_TR",
    url: "/giris",
    siteName: "Pusula",
    title: "Giriş — Pusula",
    description:
      "Pusula hesabınızla giriş yapın ve görevlerinize kaldığınız yerden devam edin.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Pusula — Kaymakamlık Görev Yönetimi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Giriş — Pusula",
    description:
      "Pusula hesabınızla giriş yapın ve görevlerinize kaldığınız yerden devam edin.",
    images: ["/opengraph-image"],
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
