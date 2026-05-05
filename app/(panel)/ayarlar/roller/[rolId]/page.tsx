import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { izinVarMi, IZIN_KODLARI } from "@/lib/permissions";
import { rolDetayiniGetir, tumIzinleriListele } from "../services";
import { RolDetayIstemci } from "./components/rol-detay-istemci";

export const metadata = { title: "Rol Detayı — Pusula" };

type SayfaProps = {
  params: Promise<{ rolId: string }>;
};

export default async function RolDetaySayfasi({ params }: SayfaProps) {
  const { rolId } = await params;

  const oturum = await auth();
  if (!oturum?.user) notFound();

  const kullaniciId = (oturum.user as { id: string }).id;
  const yonetebilir = await izinVarMi(kullaniciId, IZIN_KODLARI.ROL_YONET);
  if (!yonetebilir) notFound();

  // Server-side ilk yükleme — istemci hydrate sonrası TanStack Query devralır.
  const [rol, izinler] = await Promise.all([
    rolDetayiniGetir(rolId).catch(() => null),
    tumIzinleriListele(),
  ]);
  if (!rol) notFound();

  return (
    <RolDetayIstemci
      rolId={rolId}
      ilkRol={rol}
      ilkIzinler={izinler}
      aktifKullaniciId={kullaniciId}
    />
  );
}
