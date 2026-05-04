import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { BirimlerIstemci } from "./components/birimler-istemci";

export const metadata = { title: "Birimler — Pusula" };

export default async function BirimlerSayfasi() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullaniciId = (oturum.user as { id: string }).id;
  const yetkili = await izinVarMi(kullaniciId, IZIN_KODLARI.BIRIM_YONET);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Birimler</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          İlçedeki tüm birimlerın envanterini yönetin.
        </p>
      </div>
      <BirimlerIstemci yetkili={yetkili} />
    </div>
  );
}
