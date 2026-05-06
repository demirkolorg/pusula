import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import {
  anaSayfaMetrikleriniGetir,
  benimAcikKartlarim,
  makamKpisiniGetir,
  sonAktiviteleriGetir,
  sonZiyaretEdilenProjeleriGetir,
} from "./services";
import { MetrikKartlari } from "./components/metrik-kartlari";
import { MakamKpiSeridi } from "./components/makam-kpi-seridi";
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

  // Paralel fetch — tüm widget verisi tek roundtrip'te.
  // makamKpi non-makam için null döner (servis seviyesinde yetki kontrolü).
  const [metrik, kartlar, aktiviteler, sonZiyaretler, denetimErisimi, makamKpi] =
    await Promise.all([
      anaSayfaMetrikleriniGetir(kullanici.id, email),
      benimAcikKartlarim(kullanici.id, 8),
      sonAktiviteleriGetir(kullanici.id, 25),
      sonZiyaretEdilenProjeleriGetir(kullanici.id, 6),
      izinVarMi(kullanici.id, IZIN_KODLARI.AKTIVITE_OKU),
      makamKpisiniGetir(kullanici.id),
    ]);

  return (
    // h-full + min-h-0: outer panel container (overflow-y-auto) içinde sığmaya
    // zorla — sayfanın kendisi scroll vermesin, her widget kendi içinde scroll alsın.
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      {makamKpi && <MakamKpiSeridi kpi={makamKpi} />}
      <MetrikKartlari metrik={metrik} />
      {/*
        Layout: Son Aktiviteler ana odak (sol 2/3). Sağda dikey stack: Bana
        Atanan üstte, Son Ziyaret altta. Mobil tek kolon — Aktiviteler en üstte.
        flex-1 + min-h-0: kalan dikey alanı al, çocukların shrink edebilmesi
        için min-h-0 (Tailwind/flex item default min-height: auto'yu ezer).
      */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="order-1 min-h-0 lg:col-span-2">
          <SonAktiviteler
            aktiviteler={aktiviteler}
            denetimErisimi={denetimErisimi}
          />
        </div>
        <div className="order-2 flex min-h-0 flex-col gap-4 overflow-y-auto">
          <BanaAtananKartlar kartlar={kartlar} />
          <SonZiyaretProjeleri projeler={sonZiyaretler} />
        </div>
      </div>
    </div>
  );
}
