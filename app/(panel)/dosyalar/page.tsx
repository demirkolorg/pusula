import { redirect } from "next/navigation";
import { aktifKullaniciAl, izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { dosyalariListele } from "./services";
import { projeKlasorListesi } from "./services-proje-gorunumu";
import { paramlardanFiltreUret } from "./helpers/dosya-filtre";
import { DosyalarIstemci } from "./components/dosyalar-istemci";

export const metadata = { title: "Dosyalar — Pusula" };

export default async function DosyalarSayfasi({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const kullanici = await aktifKullaniciAl();
  if (!kullanici) redirect("/giris");

  const yetkili = await izinVarMi(kullanici.kullaniciId, IZIN_KODLARI.DOSYA_OKU);
  if (!yetkili) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold">Yetkiniz yok</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Bu sayfayı görüntülemek için dosya okuma yetkisi gerekli.
          </p>
        </div>
      </div>
    );
  }

  const filtre = paramlardanFiltreUret(await searchParams);
  // Liste ve Proje görünümleri paralel SSR prefetch — kullanıcı hangi sekmeyi
  // açarsa açsın ilk render anında veri hazır olsun.
  const [ilkSayfa, ilkProjeKlasorleri] = await Promise.all([
    dosyalariListele(kullanici.kullaniciId, filtre),
    projeKlasorListesi(kullanici.kullaniciId),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dosyalar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Yetki kapsamınızdaki tüm dosyalar — proje görünümünde klasör gibi
          gezin, liste görünümünde filtre ve aramayla bulun.
        </p>
      </div>

      <DosyalarIstemci
        ilkFiltre={filtre}
        ilkSayfa={ilkSayfa}
        ilkProjeKlasorleri={ilkProjeKlasorleri}
      />
    </div>
  );
}
