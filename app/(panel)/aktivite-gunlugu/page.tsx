import { redirect } from "next/navigation";
import { aktifKullaniciAl, izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import {
  AKTIVITE_GUNLUGU_VARSAYILAN_FILTRE,
  aktiviteGunluguFiltreSemasi,
  type AktiviteGunluguFiltre,
} from "./schemas";
import {
  aktiviteGunluguListele,
  aktiviteKaynakTipleriGetir,
} from "./services";
import { AktiviteGunluguIstemci } from "./components/aktivite-gunlugu-istemci";

export const metadata = { title: "Aktivite Günlüğü — Pusula" };

function paramAl(
  params: Record<string, string | string[] | undefined>,
  ad: string,
): string | undefined {
  const deger = params[ad];
  return Array.isArray(deger) ? deger[0] : deger;
}

function filtreHazirla(
  params: Record<string, string | string[] | undefined>,
): AktiviteGunluguFiltre {
  return aktiviteGunluguFiltreSemasi.parse({
    ...AKTIVITE_GUNLUGU_VARSAYILAN_FILTRE,
    kapsam: paramAl(params, "kapsam") ?? "tum",
    arama: paramAl(params, "arama"),
    islem: paramAl(params, "islem"),
    kaynak_tip: paramAl(params, "kaynak_tip"),
  });
}

export default async function AktiviteGunluguSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const kullanici = await aktifKullaniciAl();
  if (!kullanici) redirect("/giris");

  const kullaniciId = kullanici.kullaniciId;
  const yetkili = await izinVarMi(kullaniciId, IZIN_KODLARI.AKTIVITE_OKU);
  if (!yetkili) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold">Yetkiniz yok</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Bu sayfayı görüntülemek için aktivite günlüğü yetkisi gerekli.
          </p>
        </div>
      </div>
    );
  }

  const filtre = filtreHazirla(await searchParams);
  const [ilkSayfa, kaynakTipleri, disaAktarabilir] = await Promise.all([
    aktiviteGunluguListele(kullaniciId, filtre),
    aktiviteKaynakTipleriGetir(kullaniciId),
    izinVarMi(kullaniciId, IZIN_KODLARI.AKTIVITE_DISA_AKTAR),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Aktivite Günlüğü</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Yetki kapsamınızdaki proje, kart, yorum ve idari hareketler.
        </p>
      </div>
      <AktiviteGunluguIstemci
        ilkFiltre={filtre}
        ilkSayfa={ilkSayfa}
        kaynakTipleri={kaynakTipleri}
        disaAktarabilir={disaAktarabilir}
      />
    </div>
  );
}
