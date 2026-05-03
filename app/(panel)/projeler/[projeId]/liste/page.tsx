import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { projeDetayiniGetir } from "../services";
import { ProjeBaslik } from "../components/proje-baslik";
import { KartListeIstemci } from "./components/kart-liste-istemci";

export const metadata = { title: "Proje (Liste) — Pusula" };

type SayfaProps = {
  params: Promise<{ projeId: string }>;
};

export default async function ProjeListeGorunumu({ params }: SayfaProps) {
  const { projeId } = await params;

  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");
  const kullanici = oturum.user as { id: string; kurumId?: string };
  if (!kullanici.kurumId) redirect("/giris");

  const sahiplik = await db.proje.findUnique({
    where: { id: projeId },
    select: { kurum_id: true, silindi_mi: true },
  });
  if (!sahiplik || sahiplik.kurum_id !== kullanici.kurumId || sahiplik.silindi_mi) {
    notFound();
  }

  const detay = await projeDetayiniGetir(kullanici.kurumId, projeId);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ProjeBaslik proje={detay} />
      <KartListeIstemci projeId={projeId} />
    </div>
  );
}
