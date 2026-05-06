import { redirect } from "next/navigation";
import { aktifKullaniciAl, izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import {
  AKTIVITE_GUNLUGU_VARSAYILAN_FILTRE,
  aktiviteGunluguFiltreSemasi,
  type AktiviteGunluguFiltre,
} from "./schemas";
import {
  aktiviteBaglamSecenekleriGetir,
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

function kapsamParamAl(
  params: Record<string, string | string[] | undefined>,
): AktiviteGunluguFiltre["kapsam"] {
  return paramAl(params, "kapsam") === "benim" ? "benim" : "tum";
}

function islemParamAl(
  params: Record<string, string | string[] | undefined>,
): AktiviteGunluguFiltre["islem"] {
  const deger = paramAl(params, "islem");
  if (deger === "CREATE" || deger === "UPDATE" || deger === "DELETE") {
    return deger;
  }
  return undefined;
}

function uuidParamAl(
  params: Record<string, string | string[] | undefined>,
  ad: string,
): string | undefined {
  const deger = paramAl(params, ad);
  if (!deger) return undefined;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    deger,
  )
    ? deger
    : undefined;
}

function filtreHazirla(
  params: Record<string, string | string[] | undefined>,
): AktiviteGunluguFiltre {
  return aktiviteGunluguFiltreSemasi.parse({
    ...AKTIVITE_GUNLUGU_VARSAYILAN_FILTRE,
    kapsam: kapsamParamAl(params),
    arama: paramAl(params, "arama"),
    islem: islemParamAl(params),
    kaynak_tip: paramAl(params, "kaynak_tip"),
    proje_id: uuidParamAl(params, "proje_id"),
    liste_id: uuidParamAl(params, "liste_id"),
    kart_id: uuidParamAl(params, "kart_id"),
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
  const [ilkSayfa, kaynakTipleri, baglamSecenekleri, disaAktarabilir] =
    await Promise.all([
      aktiviteGunluguListele(kullaniciId, filtre),
      aktiviteKaynakTipleriGetir(kullaniciId),
      aktiviteBaglamSecenekleriGetir(kullaniciId),
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
        baglamSecenekleri={baglamSecenekleri}
        disaAktarabilir={disaAktarabilir}
      />
    </div>
  );
}
