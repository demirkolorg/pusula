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
    projeUyeYonetIzni,
    projeUyeYonetKaynak,
  ] = await Promise.all([
    izinVarMi(kullanici.id, IZIN_KODLARI.LISTE_OLUSTUR),
    izinVarMi(kullanici.id, IZIN_KODLARI.LISTE_DUZENLE),
    izinVarMi(kullanici.id, IZIN_KODLARI.LISTE_SIL),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_OLUSTUR),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_TASI),
    izinVarMi(kullanici.id, IZIN_KODLARI.PROJE_UYE_YONET),
    canProje(kullanici.id, "proje:uye-yonet", projeId),
  ]);

  return (
    <div className="flex h-full flex-col gap-4">
      <ProjeBaslik
        proje={detay}
        paylasimYonet={projeUyeYonetIzni && projeUyeYonetKaynak}
      />
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
