import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { db } from "@/lib/db";
import { projeDetayiniGetir } from "./services";
import { ProjeBaslik } from "./components/proje-baslik";
import { KanbanPano } from "./components/kanban-pano";

export const metadata = { title: "Proje — Pusula" };

type SayfaProps = {
  params: Promise<{ projeId: string }>;
};

export default async function ProjeDetaySayfasi({ params }: SayfaProps) {
  const { projeId } = await params;

  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullanici = oturum.user as { id: string; kurumId?: string };
  if (!kullanici.kurumId) redirect("/giris");

  // Kurumun bu projesi olduğunu doğrula.
  const sahiplik = await db.proje.findUnique({
    where: { id: projeId },
    select: { kurum_id: true, silindi_mi: true },
  });
  if (!sahiplik || sahiplik.kurum_id !== kullanici.kurumId || sahiplik.silindi_mi) {
    notFound();
  }

  const detay = await projeDetayiniGetir(kullanici.kurumId, projeId);
  const [
    listeOlustur,
    listeDuzenle,
    listeSil,
    kartOlustur,
    kartTasi,
  ] = await Promise.all([
    izinVarMi(kullanici.id, IZIN_KODLARI.LISTE_OLUSTUR),
    izinVarMi(kullanici.id, IZIN_KODLARI.LISTE_DUZENLE),
    izinVarMi(kullanici.id, IZIN_KODLARI.LISTE_SIL),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_OLUSTUR),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_TASI),
  ]);

  return (
    <div className="flex h-full flex-col gap-4">
      <ProjeBaslik proje={detay} />
      <div className="flex-1 overflow-hidden">
        <KanbanPano
          projeId={projeId}
          ilkVeri={detay}
          yetkiler={{
            listeOlustur,
            listeDuzenle,
            listeSil,
            kartOlustur,
            kartTasi,
          }}
        />
      </div>
    </div>
  );
}
