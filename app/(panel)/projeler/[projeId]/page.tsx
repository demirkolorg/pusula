import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { canProje } from "@/lib/yetki";
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

  const kullanici = oturum.user as { id: string };
  if (!(await canProje(kullanici.id, "proje:read", projeId))) {
    notFound();
  }

  const detay = await projeDetayiniGetir(kullanici.id, projeId);
  const [
    listeOlustur,
    listeDuzenle,
    listeSil,
    kartOlustur,
    kartTasi,
    kartDuzenle,
    kartSil,
    projeDuzenleIzni,
    projeYetkiliYonetIzni,
    projeYetkiliYonetKaynak,
    projeDuzenleKaynak,
  ] = await Promise.all([
    izinVarMi(kullanici.id, IZIN_KODLARI.LISTE_OLUSTUR),
    izinVarMi(kullanici.id, IZIN_KODLARI.LISTE_DUZENLE),
    izinVarMi(kullanici.id, IZIN_KODLARI.LISTE_SIL),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_OLUSTUR),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_TASI),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_DUZENLE),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_SIL),
    izinVarMi(kullanici.id, IZIN_KODLARI.PROJE_DUZENLE),
    izinVarMi(kullanici.id, IZIN_KODLARI.PROJE_YETKILI_YONET),
    canProje(kullanici.id, "proje:authorize", projeId),
    canProje(kullanici.id, "proje:edit", projeId),
  ]);

  const yetkililerYonet = projeYetkiliYonetIzni && projeYetkiliYonetKaynak;
  const projeDuzenle = projeDuzenleIzni && projeDuzenleKaynak;

  return (
    <div className="flex h-full flex-col">
      <ProjeBaslik
        proje={detay}
        yetkiler={{
          yildizla: projeDuzenle,
          yetkililerYonet,
          arama: true,
          arsivle: projeDuzenle,
        }}
      />
      <div className="flex-1 overflow-hidden p-4">
        <KanbanPano
          projeId={projeId}
          ilkVeri={detay}
          yetkiler={{
            listeOlustur,
            listeDuzenle,
            listeSil,
            kartOlustur,
            kartTasi,
            kartDuzenle,
            kartSil,
            yetkiliYonet: yetkililerYonet,
          }}
        />
      </div>
    </div>
  );
}
