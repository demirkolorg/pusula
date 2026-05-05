import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { SonAktiviteSatiri } from "../schemas";

const TARIH_KISA = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const RELATIVE = new Intl.RelativeTimeFormat("tr-TR", { numeric: "auto" });

function relatifZaman(d: Date): string {
  const fark = (Date.now() - new Date(d).getTime()) / 1000;
  if (fark < 60) return "şimdi";
  if (fark < 3600) return RELATIVE.format(-Math.round(fark / 60), "minute");
  if (fark < 86_400) return RELATIVE.format(-Math.round(fark / 3600), "hour");
  if (fark < 86_400 * 7) return RELATIVE.format(-Math.round(fark / 86_400), "day");
  return TARIH_KISA.format(new Date(d));
}

// Audit `islem` kodunu okunur Türkçe fiile çevir.
const ISLEM_FIIL: Record<string, string> = {
  CREATE: "oluşturdu",
  UPDATE: "güncelledi",
  DELETE: "sildi",
};

const KAYNAK_AD: Record<string, string> = {
  Proje: "proje",
  Liste: "liste",
  Kart: "kart",
  Yorum: "yorum",
  Eklenti: "eklenti",
  KontrolListesi: "kontrol listesi",
  KontrolMaddesi: "madde",
  Etiket: "etiket",
  ProjeYetkilisi: "proje yetkilisi",
  ListeYetkilisi: "liste yetkilisi",
  KartYetkilisi: "kart yetkilisi",
  Kullanici: "kullanıcı",
  Birim: "birim",
};

function bashHarfler(ad: string, soyad: string): string {
  return `${ad.charAt(0)}${soyad.charAt(0)}`.toUpperCase();
}

export function SonAktiviteler({
  aktiviteler,
}: {
  aktiviteler: readonly SonAktiviteSatiri[];
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4" />
          Son Aktiviteler
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {aktiviteler.length === 0 ? (
          <div className="text-muted-foreground p-6 text-center text-sm">
            Henüz aktivite yok.
          </div>
        ) : (
          <ul className="divide-y">
            {aktiviteler.map((a) => {
              const fiil = ISLEM_FIIL[a.islem] ?? a.islem.toLowerCase();
              const kaynak = KAYNAK_AD[a.kaynak_tip] ?? a.kaynak_tip;
              const kim = a.kullanici
                ? `${a.kullanici.ad} ${a.kullanici.soyad}`
                : "Bilinmeyen kullanıcı";
              return (
                <li
                  key={a.id}
                  className="flex items-start gap-3 p-3"
                >
                  <Avatar className="size-7 shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {a.kullanici
                        ? bashHarfler(a.kullanici.ad, a.kullanici.soyad)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <span className="font-medium">{kim}</span>{" "}
                      <span className="text-muted-foreground">
                        {kaynak} {fiil}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {relatifZaman(a.zaman)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
