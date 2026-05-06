import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { ProjelerIstemci } from "./components/projeler-istemci";

export const metadata = { title: "Projeler — Pusula" };

export default async function ProjelerSayfasi() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullaniciId = (oturum.user as { id: string }).id;
  const yetkili = await izinVarMi(kullaniciId, IZIN_KODLARI.PROJE_OLUSTUR);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ProjelerIstemci yetkili={yetkili} />
    </div>
  );
}
