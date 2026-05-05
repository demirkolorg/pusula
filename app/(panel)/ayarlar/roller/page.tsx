import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { RollerIstemci } from "./components/roller-istemci";

export const metadata = { title: "Rol & Yetki — Pusula" };

export default async function RollerSayfasi() {
  const oturum = await auth();
  if (!oturum?.user) notFound();

  const kullaniciId = (oturum.user as { id: string }).id;
  const yonetebilir = await izinVarMi(kullaniciId, IZIN_KODLARI.ROL_YONET);
  if (!yonetebilir) notFound();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Rol & Yetki Yönetimi</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Rolleri tanımlayın, izinleri kategoriye göre düzenleyin. Aksiyon
          yetkisi roldendir; hangi proje veya birime erişileceği ayrı
          yönetilir.
        </p>
      </div>
      <RollerIstemci aktifKullaniciId={kullaniciId} />
    </div>
  );
}
