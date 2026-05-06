import { describe, it, expect } from "vitest";
import { maskeleHassas } from "./audit-context";

describe("maskeleHassas", () => {
  it("hassas alanları '***' ile değiştirir", () => {
    const sonuc = maskeleHassas({
      kullanici: "asya",
      parola: "gizli",
      token: "abc123",
    });
    expect(sonuc).toEqual({
      kullanici: "asya",
      parola: "***",
      token: "***",
    });
  });

  it("Date instance'ını boş objeye çevirmez (audit diff bilgi kaybı)", () => {
    const tarih = new Date("2026-05-12T10:00:00.000Z");
    const sonuc = maskeleHassas({ id: "k1", bitis: tarih });
    expect(sonuc.bitis).toBeInstanceOf(Date);
    expect((sonuc.bitis as Date).toISOString()).toBe(
      "2026-05-12T10:00:00.000Z",
    );
  });

  it("iç içe Date'leri korur (kart kaydı senaryosu)", () => {
    const olusturma = new Date("2026-01-01T00:00:00.000Z");
    const bitis = new Date("2026-05-12T00:00:00.000Z");
    const sonuc = maskeleHassas({
      id: "k1",
      baslik: "Servis güzergahı",
      olusturma_zamani: olusturma,
      bitis,
      meta: { sondegistirme: olusturma },
    });
    expect(sonuc.olusturma_zamani).toBeInstanceOf(Date);
    expect(sonuc.bitis).toBeInstanceOf(Date);
    expect((sonuc.meta as { sondegistirme: Date }).sondegistirme).toBeInstanceOf(
      Date,
    );
  });

  it("array içindeki Date'leri korur", () => {
    const t1 = new Date("2026-01-01T00:00:00.000Z");
    const t2 = new Date("2026-02-01T00:00:00.000Z");
    const sonuc = maskeleHassas({ tarihler: [t1, t2] });
    const tarihler = (sonuc as { tarihler: Date[] }).tarihler;
    expect(tarihler[0]).toBeInstanceOf(Date);
    expect(tarihler[1]).toBeInstanceOf(Date);
  });

  it("Buffer/Uint8Array'i traverse etmez", () => {
    const buf = Buffer.from("merhaba");
    const u8 = new Uint8Array([1, 2, 3]);
    const sonuc = maskeleHassas({ dosya: buf, ham: u8 });
    expect((sonuc as { dosya: Buffer }).dosya).toBe(buf);
    expect((sonuc as { ham: Uint8Array }).ham).toBe(u8);
  });

  it("null/undefined/primitif değerleri olduğu gibi geçirir", () => {
    expect(maskeleHassas(null)).toBe(null);
    expect(maskeleHassas(undefined)).toBe(undefined);
    expect(maskeleHassas(42)).toBe(42);
    expect(maskeleHassas("metin")).toBe("metin");
    expect(maskeleHassas(true)).toBe(true);
  });

  it("derin maskeleme — iç içe hassas alan", () => {
    const sonuc = maskeleHassas({
      kullanici: { id: "u1", parola_hash: "argon2..." },
    });
    expect((sonuc.kullanici as { parola_hash: string }).parola_hash).toBe(
      "***",
    );
    expect((sonuc.kullanici as { id: string }).id).toBe("u1");
  });
});
