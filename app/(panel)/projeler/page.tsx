import { redirect } from "next/navigation";
import { aktifKullaniciId } from "@/lib/oturum";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { ProjelerIstemci } from "./components/projeler-istemci";

export const metadata = { title: "Projeler — Pusula" };

export default async function ProjelerSayfasi() {
  // Sprint 3 / S3-16 — `as { id: string }` cast'i `aktifKullaniciId` ile
  // değiştirildi (Kontrol Kural 36).
  const kullaniciId = await aktifKullaniciId();
  if (!kullaniciId) redirect("/giris");

  const yetkili = await izinVarMi(kullaniciId, IZIN_KODLARI.PROJE_OLUSTUR);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ProjelerIstemci yetkili={yetkili} />
    </div>
  );
}
