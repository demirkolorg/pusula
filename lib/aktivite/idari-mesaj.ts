import type { HamAktivite } from "./tipler";

type Islem = "CREATE" | "UPDATE" | "DELETE";
type IdariMesaj = {
  kategori: "diger";
  mesaj: string;
  detay: string | null;
};

function jsonNesne(j: unknown): j is Record<string, unknown> {
  return j !== null && typeof j === "object" && !Array.isArray(j);
}

function stringAlan(j: unknown, alan: string): string | undefined {
  if (!jsonNesne(j)) return undefined;
  const deger = j[alan];
  if (typeof deger !== "string") return undefined;
  return deger;
}

function stringlestirilebilirAlan(j: unknown, alan: string): string | undefined {
  if (!jsonNesne(j)) return undefined;
  const deger = j[alan];
  if (typeof deger === "string") return deger;
  if (typeof deger === "number" || typeof deger === "boolean") {
    return String(deger);
  }
  return undefined;
}

function adSoyad(veri: unknown): string | null {
  const ad = stringAlan(veri, "ad");
  const soyad = stringAlan(veri, "soyad");
  const birlesik = [ad, soyad].filter(Boolean).join(" ").trim();
  return birlesik || (stringAlan(veri, "email") ?? null);
}

function kaynakAdi(a: HamAktivite, ...alanlar: string[]): string | null {
  for (const alan of alanlar) {
    const yeni = stringlestirilebilirAlan(a.yeni_veri, alan);
    const eski = stringlestirilebilirAlan(a.eski_veri, alan);
    if (yeni) return yeni;
    if (eski) return eski;
  }
  return null;
}

function eylemFiili(islem: Islem): string {
  if (islem === "CREATE") return "oluşturdu";
  if (islem === "DELETE") return "sildi";
  return "güncelledi";
}

export function idariMesaj(a: HamAktivite, islem: Islem): IdariMesaj | null {
  switch (a.kaynak_tip) {
    case "Kullanici": {
      const detay = adSoyad(a.yeni_veri) ?? adSoyad(a.eski_veri);
      return {
        kategori: "diger",
        mesaj: `kullanıcı kaydını ${eylemFiili(islem)}`,
        detay,
      };
    }
    case "KullaniciRol":
      return {
        kategori: "diger",
        mesaj:
          islem === "DELETE"
            ? "kullanıcıdan rolü kaldırdı"
            : "kullanıcıya rol atadı",
        detay: kaynakAdi(a, "kullanici_id", "rol_id"),
      };
    case "Rol":
      return {
        kategori: "diger",
        mesaj: `rol kaydını ${eylemFiili(islem)}`,
        detay: kaynakAdi(a, "ad", "kod"),
      };
    case "Izin":
      return {
        kategori: "diger",
        mesaj: `izin kaydını ${eylemFiili(islem)}`,
        detay: kaynakAdi(a, "ad", "kod"),
      };
    case "RolIzin":
      return {
        kategori: "diger",
        mesaj:
          islem === "DELETE"
            ? "rolden izni kaldırdı"
            : "role izin ekledi",
        detay: kaynakAdi(a, "rol_id", "izin_id"),
      };
    case "DavetTokeni":
      return {
        kategori: "diger",
        mesaj:
          islem === "DELETE" ? "daveti iptal etti" : "davet kaydını oluşturdu",
        detay: kaynakAdi(a, "email"),
      };
    case "Birim":
      return {
        kategori: "diger",
        mesaj: `birim kaydını ${eylemFiili(islem)}`,
        detay: kaynakAdi(a, "ad", "kisa_ad", "tip"),
      };
    case "ProjeSablonu":
      return {
        kategori: "diger",
        mesaj: `proje şablonunu ${eylemFiili(islem)}`,
        detay: kaynakAdi(a, "ad", "sistem_kodu"),
      };
    default:
      return null;
  }
}
