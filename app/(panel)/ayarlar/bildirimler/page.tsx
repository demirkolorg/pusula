import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { BildirimTercihleriMatrix } from "./components/bildirim-tercihleri-matrix";

export const metadata = { title: "Bildirim Ayarları — Pusula" };

export default async function BildirimAyarlariSayfasi() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Bildirim Ayarları</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hangi olaylarda bildirim ve e-posta almak istediğinizi seçin.
          Varsayılan: hepsi açık. Değişiklikler anında kaydedilir.
        </p>
      </div>
      <BildirimTercihleriMatrix />
    </div>
  );
}
