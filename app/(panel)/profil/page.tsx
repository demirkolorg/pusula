import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { aktifKullaniciId } from "@/lib/oturum";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BIRIM_KATEGORI_LABEL,
  BIRIM_TIP_LABEL,
  birimGorunenAd,
} from "@/lib/constants/birim";
import { tarihTam } from "@/lib/tarih-format";
import { ProfilForm } from "./components/profil-form";
import { ParolaDegistirForm } from "./components/parola-degistir-form";

export const metadata = { title: "Profilim — Pusula" };

export default async function ProfilPage() {
  // Sprint 4 / S4-16 — Profil yönetimi: salt-okur kart + düzenleme +
  // parola değiştirme. Audit log Kural 42 ile otomatik (Kullanici update
  // middleware tarafından yakalanır).
  const kullaniciId = await aktifKullaniciId();
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
      birim: { select: { ad: true, kategori: true, tip: true } },
      roller: { select: { rol: { select: { id: true, ad: true } } } },
    },
  });

  if (!kullanici) redirect("/giris");

  const birimAdi = kullanici.birim
    ? birimGorunenAd({ ad: kullanici.birim.ad, tip: kullanici.birim.tip })
    : "Makam";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Profilim</h1>
        <p className="text-muted-foreground text-sm">
          Hesap bilgilerinizi görüntüleyin ve düzenleyin.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sol kolon — Salt okur bilgi (e-posta, birim, roller, hesap zamanları) */}
        <Card>
          <CardHeader>
            <CardTitle>Hesap Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Alan baslik="E-posta" deger={kullanici.email} />
            <Separator />
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">Birim</span>
              <span className="font-medium">{birimAdi}</span>
              <div className="flex flex-wrap gap-1">
                {kullanici.birim ? (
                  <>
                    <Badge variant="outline">
                      {BIRIM_KATEGORI_LABEL[kullanici.birim.kategori]}
                    </Badge>
                    <Badge variant="secondary">
                      {BIRIM_TIP_LABEL[kullanici.birim.tip]}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="secondary">Birimsiz makam</Badge>
                )}
              </div>
            </div>
            <Separator />
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
            <Separator />
            <Alan
              baslik="Hesap oluşturuldu"
              deger={tarihTam(kullanici.olusturma_zamani)}
            />
            <Alan
              baslik="Son giriş"
              deger={tarihTam(kullanici.son_giris_zamani)}
            />
          </CardContent>
        </Card>

        {/* Sağ kolon — Profil düzenleme */}
        <Card>
          <CardHeader>
            <CardTitle>Kişisel Bilgileri Düzenle</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfilForm
              baslangic={{
                ad: kullanici.ad,
                soyad: kullanici.soyad,
                unvan: kullanici.unvan,
                telefon: kullanici.telefon,
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Parola değiştirme — alt blok, ayrı vurgulu kart */}
      <Card>
        <CardHeader>
          <CardTitle>Parolayı Değiştir</CardTitle>
        </CardHeader>
        <CardContent className="max-w-md">
          <ParolaDegistirForm />
        </CardContent>
      </Card>
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
