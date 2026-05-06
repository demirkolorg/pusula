import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { canProje } from "@/lib/yetki";
import { buttonVariants } from "@/components/ui/button";
import { db } from "@/lib/db";
import { EtiketListesiIstemci } from "./components/etiket-listesi-istemci";

export const metadata = { title: "Etiketler — Pusula" };

type SayfaProps = {
  params: Promise<{ projeId: string }>;
};

export default async function EtiketYonetimSayfasi({ params }: SayfaProps) {
  const { projeId } = await params;

  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");
  const kullanici = oturum.user as { id: string };

  if (!(await canProje(kullanici.id, "proje:read", projeId))) {
    notFound();
  }

  const proje = await db.proje.findUnique({
    where: { id: projeId },
    select: { ad: true, silindi_mi: true },
  });
  if (!proje || proje.silindi_mi) notFound();

  const [
    olusturIzni,
    duzenleIzni,
    silIzni,
    projeDuzenleKaynak,
  ] = await Promise.all([
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_ETIKET_OLUSTUR),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_ETIKET_DUZENLE),
    izinVarMi(kullanici.id, IZIN_KODLARI.KART_ETIKET_SIL),
    canProje(kullanici.id, "proje:edit", projeId),
  ]);

  const yetkiler = {
    olustur: olusturIzni && projeDuzenleKaynak,
    duzenle: duzenleIzni && projeDuzenleKaynak,
    sil: silIzni && projeDuzenleKaynak,
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col gap-3">
        <Link
          href={`/projeler/${projeId}`}
          className={`${buttonVariants({ variant: "ghost", size: "sm" })} self-start`}
        >
          <ArrowLeft className="size-4" /> Projeye Dön
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Etiketler</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            <span className="font-medium">{proje.ad}</span> projesindeki
            etiketleri yönetin. Etiketler kartlara atanarak hızlı sınıflandırma
            sağlar.
          </p>
        </div>
      </div>
      <EtiketListesiIstemci projeId={projeId} yetkiler={yetkiler} />
    </div>
  );
}
