import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { KurumlarIstemci } from "./components/kurumlar-istemci";

export const metadata = { title: "Kurumlar — Pusula" };

export default async function KurumlarSayfasi() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullaniciId = (oturum.user as { id: string }).id;
  const yetkili = await izinVarMi(kullaniciId, IZIN_KODLARI.KURUM_YONET);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Kurumlar</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          İlçedeki tüm kurumların envanterini yönetin.
        </p>
      </div>
      <KurumlarIstemci yetkili={yetkili} />
    </div>
  );
}
