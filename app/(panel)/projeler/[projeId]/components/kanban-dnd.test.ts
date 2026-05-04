import { describe, expect, it } from "vitest";
import type { ListeKartOzeti, ListeOzeti, ProjeDetayOzeti } from "../services";
import {
  kartDropKonumuHesapla,
  kartTasimasiDegistirirMi,
  kartiKonumaTasi,
  listeBodyDroppableId,
} from "./kanban-dnd";

function kart(id: string): ListeKartOzeti {
  return {
    id,
    baslik: id,
    aciklama: null,
    sira: id,
    kapak_renk: null,
    kapak: null,
    bitis: null,
    arsiv_mi: false,
    silindi_mi: false,
    uye_sayisi: 0,
    etiket_sayisi: 0,
  };
}

function liste(id: string, kartlar: string[]): ListeOzeti {
  return {
    id,
    proje_id: "p1",
    ad: id,
    sira: id,
    arsiv_mi: false,
    wip_limit: null,
    kartlar: kartlar.map(kart),
  };
}

function detay(listeler: ListeOzeti[]): ProjeDetayOzeti {
  return {
    id: "p1",
    ad: "Proje",
    aciklama: null,
    kapak_renk: null,
    yildizli_mi: false,
    arsiv_mi: false,
    silindi_mi: false,
    listeler,
  };
}

describe("kanban dnd hedef hesabi", () => {
  it("kart hedefinin ust/alt yarisina gore ara index hesaplar", () => {
    const d = detay([liste("l1", ["a"]), liste("l2", ["b", "c", "d"])]);
    const rect = { top: 100, height: 40 };

    expect(
      kartDropKonumuHesapla({
        detay: d,
        aktifKartId: "a",
        overId: "c",
        overRect: rect,
        pointerY: 110,
      }),
    ).toMatchObject({ liste_id: "l2", index: 1 });

    expect(
      kartDropKonumuHesapla({
        detay: d,
        aktifKartId: "a",
        overId: "c",
        overRect: rect,
        pointerY: 130,
      }),
    ).toMatchObject({ liste_id: "l2", index: 2 });
  });

  it("liste body hedefinde karti listenin sonuna koyar", () => {
    const d = detay([liste("l1", ["a"]), liste("l2", ["b", "c"])]);

    expect(
      kartDropKonumuHesapla({
        detay: d,
        aktifKartId: "a",
        overId: listeBodyDroppableId("l2"),
      }),
    ).toMatchObject({ liste_id: "l2", index: 2 });
  });

  it("ayni listede karti bir sonraki kartin altina tasimayi no-op saymaz", () => {
    const listeler = [liste("l1", ["a", "b", "c"])];
    const d = detay(listeler);
    const konum = kartDropKonumuHesapla({
      detay: d,
      aktifKartId: "b",
      overId: "c",
      overRect: { top: 100, height: 40 },
      pointerY: 130,
    });

    expect(konum).toMatchObject({ liste_id: "l1", index: 2 });
    expect(
      kartTasimasiDegistirirMi(listeler, "b", "l1", konum!.liste_id, konum!.index),
    ).toBe(true);
    expect(kartiKonumaTasi(listeler, "b", "l1", konum!.index)?.[0]?.kartlar.map((k) => k.id))
      .toEqual(["a", "c", "b"]);
  });

  it("aktif kart kendi hedefi olarak donerse karti sona atmaz", () => {
    const listeler = [liste("l1", ["a", "b", "c"])];
    const d = detay(listeler);
    const konum = kartDropKonumuHesapla({
      detay: d,
      aktifKartId: "b",
      overId: "b",
    });

    expect(konum).toMatchObject({ liste_id: "l1", index: 1 });
    expect(
      kartTasimasiDegistirirMi(listeler, "b", "l1", konum!.liste_id, konum!.index),
    ).toBe(false);
  });
});
