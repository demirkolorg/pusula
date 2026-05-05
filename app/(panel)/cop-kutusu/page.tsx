import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { kullaniciErisimBilgisi } from "@/lib/yetki";
import { CopKutusuIstemci } from "./components/cop-kutusu-istemci";

export default async function CopKutusuSayfa() {
  const oturum = await auth();
  const kullaniciId =
    typeof oturum?.user?.id === "string" ? oturum.user.id : null;
  if (!kullaniciId) redirect("/giris");

  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  return <CopKutusuIstemci makamMi={erisim.makam} />;
}
