import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { OnayBekleyenlerIstemci } from "./components/onay-bekleyenler-istemci";

export const metadata = { title: "Onay Bekleyenler — Pusula" };

export default async function OnayBekleyenlerSayfasi() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullaniciId = (oturum.user as { id: string }).id;
  const yetkili = await izinVarMi(kullaniciId, IZIN_KODLARI.KULLANICI_ONAYLA);

  if (!yetkili) {
    return (
      <div className="flex flex-1 flex-col gap-2">
        <h1 className="text-2xl font-semibold">Onay Bekleyenler</h1>
        <p className="text-muted-foreground text-sm">
          Bu sayfayı görüntüleme yetkiniz yok.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Onay Bekleyen Kayıtlar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Self-register ile gelen kullanıcı talepleri. Onaylayın veya reddedin.
        </p>
      </div>
      <OnayBekleyenlerIstemci />
    </div>
  );
}
