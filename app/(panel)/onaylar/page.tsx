import { redirect } from "next/navigation";
import { aktifKullaniciId } from "@/lib/oturum";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { OnaylarSayfa } from "./components/onaylar-sayfa";

export const metadata = { title: "Tamamlama Onayları — Pusula" };

export default async function OnaylarPage() {
  // Sprint 3 / S3-16 — `as { id: string }` cast'i `aktifKullaniciId` ile
  // değiştirildi.
  const kullaniciId = await aktifKullaniciId();
  if (!kullaniciId) redirect("/giris");
  // ADR-0019/PR-3 — Sayfa KART_TAMAMLA izinli kullanıcılara açık.
  // Yetki yoksa /ana-sayfa'ya yönlendir; sidebar zaten badge'i gizler.
  const izin = await izinVarMi(kullaniciId, IZIN_KODLARI.KART_TAMAMLA);
  if (!izin) {
    redirect("/ana-sayfa");
  }
  return <OnaylarSayfa />;
}
