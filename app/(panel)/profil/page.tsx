import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  KURUM_KATEGORI_LABEL,
  KURUM_TIP_LABEL,
  kurumGorunenAd,
} from "@/lib/constants/kurum";

export default async function ProfilPage() {
  const oturum = await auth();
  if (!oturum?.user) redirect("/giris");

  const kullaniciId = (oturum.user as { id?: string }).id;
  if (!kullaniciId) redirect("/giris");

  const kullanici = await db.kullanici.findUnique({
    where: { id: kullaniciId },
    select: {
      ad: true,
      soyad: true,
      email: true,
      unvan: true,
      telefon: true,
      olusturma_zamani: true,
      son_giris_zamani: true,
      kurum: { select: { ad: true, kategori: true, tip: true } },
      roller: { select: { rol: { select: { id: true, ad: true } } } },
    },
  });

  if (!kullanici) redirect("/giris");

  const tarihFormat = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });

  const kurumAdi = kurumGorunenAd({
    ad: kullanici.kurum.ad,
    tip: kullanici.kurum.tip,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Profilim</h1>
        <p className="text-muted-foreground text-sm">
          Hesap bilgilerinizi görüntüleyin.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kişisel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Alan baslik="Ad Soyad" deger={`${kullanici.ad} ${kullanici.soyad}`} />
            <Alan baslik="E-posta" deger={kullanici.email} />
            <Alan baslik="Unvan" deger={kullanici.unvan ?? "—"} />
            <Alan baslik="Telefon" deger={kullanici.telefon ?? "—"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kurumsal</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Kurum</span>
              <span className="font-medium">{kurumAdi}</span>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline">
                  {KURUM_KATEGORI_LABEL[kullanici.kurum.kategori]}
                </Badge>
                <Badge variant="secondary">
                  {KURUM_TIP_LABEL[kullanici.kurum.tip]}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Roller</span>
              <div className="flex flex-wrap gap-1">
                {kullanici.roller.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  kullanici.roller.map((r) => (
                    <Badge key={r.rol.id} variant="secondary">
                      {r.rol.ad}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <Alan
              baslik="Hesap oluşturuldu"
              deger={tarihFormat.format(kullanici.olusturma_zamani)}
            />
            <Alan
              baslik="Son giriş"
              deger={
                kullanici.son_giris_zamani
                  ? tarihFormat.format(kullanici.son_giris_zamani)
                  : "—"
              }
            />
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-xs">
        Profil düzenleme ve parola değiştirme özellikleri sonraki sürümde gelecek.
      </p>
    </div>
  );
}

function Alan({ baslik, deger }: { baslik: string; deger: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{baslik}</span>
      <span className="font-medium">{deger}</span>
    </div>
  );
}
