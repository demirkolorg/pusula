import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { GenelAyarlarFormu } from "./components/genel-ayarlar-formu";

export const metadata = { title: "Genel Ayarlar — Pusula" };

export default async function GenelAyarlarSayfasi() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Genel Ayarlar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kenar çubuğunda görünen kurum ve uygulama başlıklarını özelleştirin.
        </p>
      </div>
      <GenelAyarlarFormu />
    </div>
  );
}
