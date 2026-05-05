import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `tercihAliciFiltresi` saf bir DB sorgusu süzgeci (Kural 80 sınır
// istisnası: db boundary mock'lanır, business logic süzme/default
// davranışı izole test edilir). Bu testler `BildirimTercih` modeli
// üzerinden gelen veriyi default ve overlay durumlarda doğrular.

const findManyMock = vi.fn();
vi.mock("./db", () => ({
  db: {
    bildirimTercih: {
      get findMany() {
        return findManyMock;
      },
    },
  },
}));

import { tercihAliciFiltresi } from "./bildirim-tercih";

describe("tercihAliciFiltresi", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("boş liste için DB sorgusu yapmadan boş döner", async () => {
    const sonuc = await tercihAliciFiltresi([], "YORUM_MENTION", "in_app");
    expect(sonuc).toEqual([]);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("kayıt yoksa default açık → tüm alıcılar geçer", async () => {
    findManyMock.mockResolvedValueOnce([]);
    const sonuc = await tercihAliciFiltresi(
      ["u1", "u2", "u3"],
      "YORUM_MENTION",
      "in_app",
    );
    expect(sonuc).toEqual(["u1", "u2", "u3"]);
  });

  it("in_app_acik=false olan kullanıcı süzülür", async () => {
    findManyMock.mockResolvedValueOnce([
      { kullanici_id: "u2", in_app_acik: false, email_acik: true },
    ]);
    const sonuc = await tercihAliciFiltresi(
      ["u1", "u2", "u3"],
      "YORUM_MENTION",
      "in_app",
    );
    expect(sonuc).toEqual(["u1", "u3"]);
  });

  it("email kanalı email_acik=false'u süzer, in_app=false'u etkilemez", async () => {
    findManyMock.mockResolvedValueOnce([
      { kullanici_id: "u1", in_app_acik: false, email_acik: true },
      { kullanici_id: "u2", in_app_acik: true, email_acik: false },
    ]);
    const sonuc = await tercihAliciFiltresi(
      ["u1", "u2", "u3"],
      "YORUM_MENTION",
      "email",
    );
    expect(sonuc).toEqual(["u1", "u3"]);
  });

  it("orijinal sırasını korur (filter)", async () => {
    findManyMock.mockResolvedValueOnce([
      { kullanici_id: "u3", in_app_acik: false, email_acik: false },
    ]);
    const sonuc = await tercihAliciFiltresi(
      ["u5", "u3", "u1", "u4"],
      "KART_SILINDI",
      "in_app",
    );
    expect(sonuc).toEqual(["u5", "u1", "u4"]);
  });

  it("hepsi kapalıysa boş döner", async () => {
    findManyMock.mockResolvedValueOnce([
      { kullanici_id: "u1", in_app_acik: false, email_acik: false },
      { kullanici_id: "u2", in_app_acik: false, email_acik: false },
    ]);
    const sonuc = await tercihAliciFiltresi(
      ["u1", "u2"],
      "YORUM_EKLENDI",
      "in_app",
    );
    expect(sonuc).toEqual([]);
  });
});
