import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { canProje } from "@/lib/yetki";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { EtiketDetayBaslik } from "../components/etiket-detay-baslik";
import { EtiketKartlariListesi } from "../components/etiket-kartlari-listesi";

export const metadata = { title: "Etiket Detayı — Pusula" };

type SayfaProps = {
  params: Promise<{ projeId: string; etiketId: string }>;
};

export default async function EtiketDetaySayfasi({ params }: SayfaProps) {
  const { projeId, etiketId } = await params;

  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");
  const kullanici = oturum.user as { id: string };

  if (!(await canProje(kullanici.id, "proje:read", projeId))) {
    notFound();
  }

  // Etiket gerçekten bu projede mi? (URL guess'lerine karşı koruma)
  const etiket = await db.etiket.findUnique({
    where: { id: etiketId },
    select: { proje_id: true },
  });
  if (!etiket || etiket.proje_id !== projeId) notFound();

  const [duzenleIzni, silIzni, projeDuzenleKaynak] = await Promise.all([
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_ETIKET_DUZENLE),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_ETIKET_SIL),
    canProje(kullanici.id, "proje:edit", projeId),
  ]);

  const yetkiler = {
    olustur: false,
    duzenle: duzenleIzni && projeDuzenleKaynak,
    sil: silIzni && projeDuzenleKaynak,
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <Link
        href={`/projeler/${projeId}/etiket`}
        className={`${buttonVariants({ variant: "ghost", size: "sm" })} self-start`}
      >
        <ArrowLeft className="size-4" /> Etiketlere Dön
      </Link>

      <EtiketDetayBaslik
        projeId={projeId}
        etiketId={etiketId}
        yetkiler={yetkiler}
      />

      <div className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">Bu etiketi içeren kartlar</h2>
        <EtiketKartlariListesi projeId={projeId} etiketId={etiketId} />
      </div>
    </div>
  );
}
