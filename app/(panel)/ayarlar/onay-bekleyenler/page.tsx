import { redirect } from "next/navigation";

// ADR-0025 — Onay bekleyen kayıtların yönetimi `/ayarlar/kullanicilar`
// sayfasına entegre edildi. Eski yer-imlerini kıracak yerine yönlendirme
// bırakılıyor; bir sonraki major sürümde dosya tamamen kaldırılabilir.
export default function OnayBekleyenlerEskiSayfa() {
  redirect("/ayarlar/kullanicilar");
}
