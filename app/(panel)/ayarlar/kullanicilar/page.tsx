import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { KullanicilarIstemci } from "./components/kullanicilar-istemci";

export const metadata = { title: "Kullanıcılar — Pusula" };

export default async function KullanicilarSayfasi() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullaniciId = (oturum.user as { id: string }).id;
  const [duzenleyebilir, davetEdebilir, silebilir] = await Promise.all([
    izinVarMi(kullaniciId, IZIN_KODLARI.KULLANICI_DUZENLE),
    izinVarMi(kullaniciId, IZIN_KODLARI.KULLANICI_DAVET),
    izinVarMi(kullaniciId, IZIN_KODLARI.KULLANICI_SIL),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Kullanıcılar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Kurum personelini ve rollerini yönetin.
        </p>
      </div>
      <KullanicilarIstemci
        yetkiler={{ duzenleyebilir, davetEdebilir, silebilir }}
        aktifKullaniciId={kullaniciId}
      />
    </div>
  );
}
