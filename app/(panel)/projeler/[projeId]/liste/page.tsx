import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { canProje } from "@/lib/yetki";
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
  const kullanici = oturum.user as { id: string };
  if (!(await canProje(kullanici.id, "proje:read", projeId))) {
    notFound();
  }

  const [detay, projeUyeYonetIzni, projeUyeYonetKaynak] = await Promise.all([
    projeDetayiniGetir(kullanici.id, projeId),
    izinVarMi(kullanici.id, IZIN_KODLARI.PROJE_UYE_YONET),
    canProje(kullanici.id, "proje:uye-yonet", projeId),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <ProjeBaslik
        proje={detay}
        paylasimYonet={projeUyeYonetIzni && projeUyeYonetKaynak}
      />
      <KartListeIstemci projeId={projeId} />
    </div>
  );
}
