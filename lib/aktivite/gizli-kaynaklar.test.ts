import { describe, expect, it } from "vitest";
import {
  AKTIVITE_AKISI_GIZLI_KAYNAK_TIPLERI,
  aktiviteAkisiGizliKaynakMi,
  aktiviteAkisiGorunurKaynakWhere,
} from "./gizli-kaynaklar";

describe("aktivite akışı gizli kaynakları", () => {
  it("bildirim altyapısı kayıtlarını gizli sayar", () => {
    expect(aktiviteAkisiGizliKaynakMi("Bildirim")).toBe(true);
    expect(aktiviteAkisiGizliKaynakMi("BildirimMailKuyrugu")).toBe(true);
    expect(aktiviteAkisiGizliKaynakMi("BildirimTercih")).toBe(true);
  });

  it("operasyonel proje ve kart kayıtlarını gizlemez", () => {
    expect(aktiviteAkisiGizliKaynakMi("Proje")).toBe(false);
    expect(aktiviteAkisiGizliKaynakMi("Kart")).toBe(false);
  });

  it("dosya internal/forensik kayıtlarını gizler (ADR-0028)", () => {
    expect(aktiviteAkisiGizliKaynakMi("DosyaErisimLogu")).toBe(true);
    expect(aktiviteAkisiGizliKaynakMi("DosyaYuklemeOturumu")).toBe(true);
    expect(aktiviteAkisiGizliKaynakMi("DosyaEtiketBaglantisi")).toBe(true);
  });

  it("kullanıcıya görünür dosya event'lerini gizlemez", () => {
    expect(aktiviteAkisiGizliKaynakMi("Dosya")).toBe(false);
    expect(aktiviteAkisiGizliKaynakMi("DosyaSurumu")).toBe(false);
    expect(aktiviteAkisiGizliKaynakMi("DosyaBaglantisi")).toBe(false);
    expect(aktiviteAkisiGizliKaynakMi("DosyaEtiketi")).toBe(false);
  });

  it("Prisma where koşulunu notIn olarak üretir", () => {
    expect(aktiviteAkisiGorunurKaynakWhere()).toEqual({
      kaynak_tip: { notIn: [...AKTIVITE_AKISI_GIZLI_KAYNAK_TIPLERI] },
    });
  });
});
