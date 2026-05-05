import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { OnaylarSayfa } from "./components/onaylar-sayfa";

export const metadata = { title: "Tamamlama Onayları — Pusula" };

export default async function OnaylarPage() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");
  const kullanici = oturum.user as { id: string };
  // ADR-0019/PR-3 — Sayfa KART_TAMAMLA izinli kullanıcılara açık.
  // Yetki yoksa /ana-sayfa'ya yönlendir; sidebar zaten badge'i gizler.
  const izin = await izinVarMi(kullanici.id, IZIN_KODLARI.KART_TAMAMLA);
  if (!izin) {
    redirect("/ana-sayfa");
  }
  return <OnaylarSayfa />;
}
