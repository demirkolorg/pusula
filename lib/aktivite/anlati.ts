import type { AktiviteOzeti, AnlatiCumlesi } from "./tipler";

function kisiAdi(a: AktiviteOzeti): string {
  return a.kullanici ? `${a.kullanici.ad} ${a.kullanici.soyad}` : "Sistem";
}

function temizle(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function tirnakli(deger: string | null | undefined, fallback: string): string {
  const metin = deger && deger.trim().length > 0 ? deger : fallback;
  return `'${metin}'`;
}

function baglamMetni(a: AktiviteOzeti): string | null {
  const proje = a.baglam?.proje?.ad;
  const liste = a.baglam?.liste?.ad;
  if (proje && liste) return `${tirnakli(proje, "silinmiş proje")} projesinin ${tirnakli(liste, "silinmiş liste")} listesinde`;
  if (proje) return `${tirnakli(proje, "silinmiş proje")} projesinde`;
  if (liste) return `${tirnakli(liste, "silinmiş liste")} listesinde`;
  return null;
}

function kartCumlesi(a: AktiviteOzeti, kim: string, baglam: string | null): string {
  const kart = tirnakli(a.baglam?.kart?.baslik ?? a.detay, "silinmiş kart");
  const nesne = `${kart} kartını`;
  const iyelikliMesaj = a.mesaj.match(/^kartın\s+(.+)$/)?.[1];
  if (iyelikliMesaj) {
    return temizle(
      `${kim}, ${baglam ? `${baglam} ` : ""}${kart} kartının ${iyelikliMesaj}.`,
    );
  }
  const mesaj = a.mesaj
    .replace(/^kartı\s+/, "");
  return temizle(`${kim}, ${baglam ? `${baglam} ` : ""}${nesne} ${mesaj}.`);
}

function iliskiCumlesi(a: AktiviteOzeti, kim: string, baglam: string | null): string {
  const hedef = a.detay ? `: ${a.detay}` : "";
  if (a.baglam?.kart?.baslik) {
    return temizle(
      `${kim}, ${baglam ? `${baglam} ` : ""}${tirnakli(
        a.baglam.kart.baslik,
        "silinmiş kart",
      )} kartında ${a.mesaj}${hedef}.`,
    );
  }
  return temizle(`${kim}, ${a.mesaj}${hedef}.`);
}

export function aktiviteAnlati(a: AktiviteOzeti): AnlatiCumlesi {
  const kim = kisiAdi(a);
  const baglam = baglamMetni(a);

  if (a.kategori === "kart" && (a.baglam?.kart || a.detay)) {
    return { metin: kartCumlesi(a, kim, baglam), kim, baglam };
  }

  if (
    a.kategori === "yorum" ||
    a.kategori === "eklenti" ||
    a.kategori === "etiket" ||
    a.kategori === "yetkili" ||
    a.kategori === "hedef-birim" ||
    a.kategori === "kontrol-listesi" ||
    a.kategori === "kontrol-maddesi"
  ) {
    return { metin: iliskiCumlesi(a, kim, baglam), kim, baglam };
  }

  const detay = a.detay ? `: ${a.detay}` : "";
  return {
    metin: temizle(`${kim}, ${baglam ? `${baglam} ` : ""}${a.mesaj}${detay}.`),
    kim,
    baglam,
  };
}
