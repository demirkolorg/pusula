// Proje detayını client-side JSON dosyası olarak indir.
// Kullanıcıya yönelik insan-okur format: id, sıra (LexoRank), tip, sayaçlar
// gibi internal alanlar dışarıda. Eklentiler ve yorumlar v2 (sunucu rapor
// üretimi gerektirir).
import { ListeTipi } from "@prisma/client";
import type { ProjeDetayOzeti } from "../services";

type DisaAktarmaOzeti = {
  uretildi: string;
  proje: {
    ad: string;
    aciklama: string | null;
    yildizli: boolean;
    arsivde: boolean;
  };
  listeler: Array<{
    ad: string;
    kartlar: Array<{
      baslik: string;
      aciklama: string | null;
      bitis: string | null;
      arsivde: boolean;
    }>;
  }>;
};

function bitisFormatla(bitis: Date | null): string | null {
  if (!bitis) return null;
  // dd.MM.yyyy HH:mm — Kural 8 (tr-TR + Europe/Istanbul).
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  }).format(bitis);
}

function dosyaAdi(proje: ProjeDetayOzeti): string {
  // Türkçe karakter + boşlukları temizle, slug-style.
  const slug = proje.ad
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "proje";
  const ts = new Date().toISOString().slice(0, 10);
  return `${slug}-${ts}.json`;
}

export function projeDetayiniJsonOlarakIndir(proje: ProjeDetayOzeti): void {
  const veri: DisaAktarmaOzeti = {
    uretildi: new Date().toISOString(),
    proje: {
      ad: proje.ad,
      aciklama: proje.aciklama,
      yildizli: proje.yildizli_mi,
      arsivde: proje.arsiv_mi,
    },
    // Sistem ARSIV listesi kullanıcıya gösterilmez — kart bazında zaten
    // `arsivde` alanı var.
    listeler: proje.listeler
      .filter((l) => l.tip !== ListeTipi.ARSIV)
      .map((l) => ({
        ad: l.ad,
        kartlar: l.kartlar.map((k) => ({
          baslik: k.baslik,
          aciklama: k.aciklama,
          bitis: bitisFormatla(k.bitis),
          arsivde: k.arsiv_mi,
        })),
      })),
  };

  const blob = new Blob([JSON.stringify(veri, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = dosyaAdi(proje);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Bir sonraki tick'te revoke (Safari için anında revoke download'u iptal eder).
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
