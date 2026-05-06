import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { superAdminMi } from "@/lib/permissions";
import { DenetimIstemci } from "./components/denetim-istemci";

export const metadata = { title: "Denetim (Forensik) — Pusula" };

export default async function DenetimSayfasi() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullaniciId = (oturum.user as { id: string }).id;
  const yetkili = await superAdminMi(kullaniciId);

  if (!yetkili) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold">Yetkiniz yok</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Bu sayfayı görüntülemek için süper yönetici rolü gerekli.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Denetim Günlüğü (Forensik)</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ham audit logu: IP, request kimliği, HTTP yolu, gerekçe ve JSON diff.
        </p>
      </div>
      <DenetimIstemci />
    </div>
  );
}
