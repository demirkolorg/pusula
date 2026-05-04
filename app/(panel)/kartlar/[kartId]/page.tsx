import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Kart — Pusula" };

type SayfaProps = {
  params: Promise<{ kartId: string }>;
};

// Deep-link: /kartlar/[kartId] — kullanıcıyı kartın projesine yönlendirir.
// Drawer iskeleti S3'te, detay alanları (yorum, eklenti, mention, kontrol listesi)
// S4'te eklenecek. Plan: docs/plan.md S3 → S4.
export default async function KartDeepLink({ params }: SayfaProps) {
  const { kartId } = await params;

  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullanici = oturum.user as { id: string; kurumId?: string };
  if (!kullanici.kurumId) redirect("/giris");

  const kart = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      silindi_mi: true,
      liste: {
        select: { proje_id: true },
      },
    },
  });

  // Tek-kurum (ADR-0007) — kurum sahiplik kontrolü düştü.
  if (!kart || kart.silindi_mi) {
    notFound();
  }

  // Şu anlık kullanıcıyı projenin pano görünümüne yönlendiriyoruz; drawer
  // S4'te query param ile açılacak (`?kart=<id>`).
  redirect(`/projeler/${kart.liste.proje_id}?kart=${kartId}`);
}
