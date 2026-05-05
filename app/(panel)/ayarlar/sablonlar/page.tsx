import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SablonlarIstemci } from "./components/sablonlar-istemci";

export default async function SablonlarSayfa() {
  const oturum = await auth();
  const kullaniciId =
    typeof oturum?.user?.id === "string" ? oturum.user.id : null;
  if (!kullaniciId) redirect("/giris");

  return <SablonlarIstemci kullaniciId={kullaniciId} />;
}
