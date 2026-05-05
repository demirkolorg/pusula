import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  anaSayfaMetrikleriniGetir,
  benimAcikKartlarim,
  sonAktiviteleriGetir,
  sonZiyaretEdilenProjeleriGetir,
} from "./services";
import { KarsilamaBaslik } from "./components/karsilama-baslik";
import { MetrikKartlari } from "./components/metrik-kartlari";
import { BanaAtananKartlar } from "./components/bana-atanan-kartlar";
import { SonAktiviteler } from "./components/son-aktiviteler";
import { SonZiyaretProjeleri } from "./components/son-ziyaret-projeleri";

export const metadata = { title: "Ana Sayfa — Pusula" };

export default async function AnaSayfa() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullanici = oturum.user as {
    id: string;
    email?: string | null;
    adSoyad?: string;
  };
  const email = kullanici.email ?? "";
  const adSoyad = kullanici.adSoyad ?? email;

  // Paralel fetch — tüm widget verisi tek roundtrip'te. Suspense yerine
  // top-level await tercihi: ilk yükleme cache'lenebilir, görsel layout
  // shift olmaz. Her sorgu izole try/catch yapmaz; biri patlarsa Next.js
  // error boundary'si yakalar (app/(panel)/error.tsx).
  const [metrik, kartlar, aktiviteler, sonZiyaretler] = await Promise.all([
    anaSayfaMetrikleriniGetir(kullanici.id, email),
    benimAcikKartlarim(kullanici.id, 10),
    sonAktiviteleriGetir(kullanici.id, 15),
    sonZiyaretEdilenProjeleriGetir(kullanici.id, 6),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <KarsilamaBaslik adSoyad={adSoyad} acikGorev={metrik.acikGorev} />
      <MetrikKartlari metrik={metrik} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BanaAtananKartlar kartlar={kartlar} />
        </div>
        <div className="flex flex-col gap-4">
          <SonAktiviteler aktiviteler={aktiviteler} />
          <SonZiyaretProjeleri projeler={sonZiyaretler} />
        </div>
      </div>
    </div>
  );
}
