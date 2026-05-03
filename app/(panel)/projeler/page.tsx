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
      <div>
        <h1 className="text-2xl font-semibold">Projeler</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Tüm projelerinizi pano (Kanban) ya da liste görünümünde yönetin.
        </p>
      </div>
      <ProjelerIstemci yetkili={yetkili} />
    </div>
  );
}
