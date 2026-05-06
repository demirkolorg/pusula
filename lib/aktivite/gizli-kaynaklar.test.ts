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

  it("Prisma where koşulunu notIn olarak üretir", () => {
    expect(aktiviteAkisiGorunurKaynakWhere()).toEqual({
      kaynak_tip: { notIn: [...AKTIVITE_AKISI_GIZLI_KAYNAK_TIPLERI] },
    });
  });
});
