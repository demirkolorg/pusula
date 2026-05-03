import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { HataLogIstemci } from "./components/hata-log-istemci";

export const metadata = { title: "Hata Logları — Pusula" };

export default async function HataLoglariSayfasi() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullaniciId = (oturum.user as { id: string }).id;
  const yetkili = await izinVarMi(kullaniciId, IZIN_KODLARI.HATA_LOGU_OKU);

  if (!yetkili) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold">Yetkiniz yok</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Bu sayfayı görüntülemek için hata logu yetkisi gerekli.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Hata Logları</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Backend ve frontend hataları, çözüm durumları.
        </p>
      </div>
      <HataLogIstemci />
    </div>
  );
}
