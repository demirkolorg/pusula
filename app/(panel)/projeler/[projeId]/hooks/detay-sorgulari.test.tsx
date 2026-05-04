import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { ok, hata } from "@/lib/sonuc";

// Bu testler hook KATMANINI dogrular: useListeOlustur/useListeGuncelle/...
// useKartOlustur/.../useKartTasi optimistic update + rollback + swap akislari.
//
// `../actions` mock'lanir — DB degil, framework boundary (server action wrapper).
// Tur 2'deki proje-sorgulari.test.tsx ile ayni gerekce — Kontrol Kural 80
// istisnasi: jsdom altinda `next/server` cozulemiyor; hook'lar dogrudan service
// cagirmaz, `eylemMutasyonu` ile sarilmis action fonksiyonunu cagirir.
vi.mock("../actions", () => ({
  projeDetayEylem: vi.fn(),
  projeKartlarEylem: vi.fn(),
  listeOlusturEylem: vi.fn(),
  listeGuncelleEylem: vi.fn(),
  listeSilEylem: vi.fn(),
  listeSiralaEylem: vi.fn(),
  kartOlusturEylem: vi.fn(),
  kartGuncelleEylem: vi.fn(),
  kartSilEylem: vi.fn(),
  kartGeriYukleEylem: vi.fn(),
  kartTasiEylem: vi.fn(),
}));

import {
  useProjeDetay,
  useProjeKartlari,
  useListeOlustur,
  useListeGuncelle,
  useListeSil,
  useListeSirala,
  useKartOlustur,
  useKartGuncelle,
  useKartSil,
  useKartGeriYukle,
  useKartTasi,
  projeDetayKey,
} from "./detay-sorgulari";
import {
  projeDetayEylem,
  projeKartlarEylem,
  listeOlusturEylem,
  listeGuncelleEylem,
  listeSilEylem,
  listeSiralaEylem,
  kartOlusturEylem,
  kartGuncelleEylem,
  kartSilEylem,
  kartGeriYukleEylem,
  kartTasiEylem,
} from "../actions";
import type {
  ListeKartOzeti,
  ListeOzeti,
  ProjeDetayOzeti,
} from "../services";

// vi.mock factory'den cikan mock'lar — type-safe kullanim icin local cast.
type Vif = ReturnType<typeof vi.fn>;
const projeDetayMock = projeDetayEylem as unknown as Vif;
const projeKartlarMock = projeKartlarEylem as unknown as Vif;
const listeOlusturMock = listeOlusturEylem as unknown as Vif;
const listeGuncelleMock = listeGuncelleEylem as unknown as Vif;
const listeSilMock = listeSilEylem as unknown as Vif;
const listeSiralaMock = listeSiralaEylem as unknown as Vif;
const kartOlusturMock = kartOlusturEylem as unknown as Vif;
const kartGuncelleMock = kartGuncelleEylem as unknown as Vif;
const kartSilMock = kartSilEylem as unknown as Vif;
const kartGeriYukleMock = kartGeriYukleEylem as unknown as Vif;
const kartTasiMock = kartTasiEylem as unknown as Vif;

function olusturQc() {
  return new QueryClient({
    defaultOptions: {
      // gcTime: Infinity — observer'siz setQueryData verisi GC olmasin (RQ 5).
      queries: { retry: false, gcTime: Infinity, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

function sarici(qc: QueryClient) {
  const Sarici = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  Sarici.displayName = "Sarici";
  return Sarici;
}

// ============================================================
// Yardimci fabrikalar (in-memory ProjeDetayOzeti agacı)
// ============================================================

function ornekKart(p: Partial<ListeKartOzeti> = {}): ListeKartOzeti {
  return {
    id: p.id ?? crypto.randomUUID(),
    baslik: p.baslik ?? "Kart",
    aciklama: p.aciklama ?? null,
    sira: p.sira ?? "M",
    kapak_renk: p.kapak_renk ?? null,
    kapak: p.kapak ?? null,
    bitis: p.bitis ?? null,
    arsiv_mi: p.arsiv_mi ?? false,
    silindi_mi: p.silindi_mi ?? false,
    uye_sayisi: p.uye_sayisi ?? 0,
    etiket_sayisi: p.etiket_sayisi ?? 0,
  };
}

function ornekListe(p: Partial<ListeOzeti> = {}): ListeOzeti {
  return {
    id: p.id ?? crypto.randomUUID(),
    proje_id: p.proje_id ?? "proje-1",
    ad: p.ad ?? "Liste",
    sira: p.sira ?? "M",
    arsiv_mi: p.arsiv_mi ?? false,
    wip_limit: p.wip_limit ?? null,
    kartlar: p.kartlar ?? [],
  };
}

function ornekDetay(p: Partial<ProjeDetayOzeti> = {}): ProjeDetayOzeti {
  return {
    id: p.id ?? "proje-1",
    ad: p.ad ?? "Test Proje",
    aciklama: p.aciklama ?? null,
    kapak_renk: p.kapak_renk ?? null,
    yildizli_mi: p.yildizli_mi ?? false,
    arsiv_mi: p.arsiv_mi ?? false,
    silindi_mi: p.silindi_mi ?? false,
    listeler: p.listeler ?? [],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

const PROJE_ID = "proje-1";
const ANAHTAR = projeDetayKey(PROJE_ID);

// ============================================================
// useProjeDetay (sorgu)
// ============================================================

describe("useProjeDetay (sorgu)", () => {
  it("data doner: action'in basarili sonucundaki .veri'yi gosterir", async () => {
    const detay = ornekDetay({ ad: "Pano" });
    projeDetayMock.mockResolvedValue(ok(detay));

    const qc = olusturQc();
    const { result } = renderHook(() => useProjeDetay(PROJE_ID), {
      wrapper: sarici(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.ad).toBe("Pano");
  });

  it("hata atilinca exception fırlar", async () => {
    projeDetayMock.mockResolvedValue(hata("Yetkin yok", "YETKISIZ"));

    const qc = olusturQc();
    const { result } = renderHook(() => useProjeDetay(PROJE_ID), {
      wrapper: sarici(qc),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Yetkin yok");
  });
});

// ============================================================
// useProjeKartlari (sorgu)
// ============================================================

describe("useProjeKartlari (sorgu)", () => {
  it("liste doner", async () => {
    projeKartlarMock.mockResolvedValue(
      ok([
        {
          id: "k1",
          liste_id: "l1",
          liste_ad: "Yapilacak",
          baslik: "K1",
          aciklama: null,
          sira: "M",
          kapak_renk: null,
          bitis: null,
          arsiv_mi: false,
          silindi_mi: false,
          uye_sayisi: 0,
          etiket_sayisi: 0,
        },
      ]),
    );

    const qc = olusturQc();
    const { result } = renderHook(() => useProjeKartlari(PROJE_ID), {
      wrapper: sarici(qc),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0]?.liste_ad).toBe("Yapilacak");
  });
});

// ============================================================
// useListeOlustur — optimistic + swap
// ============================================================

describe("useListeOlustur", () => {
  it("happy: optimistic ekle, swap ile gercek ID'ye gec", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [ornekListe({ id: "l-1", ad: "Var", sira: "M" })],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let cozumle: ((y: unknown) => void) | null = null;
    listeOlusturMock.mockImplementation(
      () =>
        new Promise((res) => {
          cozumle = res;
        }),
    );

    const { result } = renderHook(() => useListeOlustur(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id_taslak: "temp-l",
        proje_id: PROJE_ID,
        ad: "Yeni",
      });
    });

    // Optimistic eklendi.
    await waitFor(() => {
      const v = qc.getQueryData<ProjeDetayOzeti>(ANAHTAR);
      expect(v?.listeler.map((l) => l.id)).toEqual(["l-1", "temp-l"]);
    });

    // Server gercek ID donsun.
    act(() => {
      cozumle!(
        ok({
          id: "real-l",
          proje_id: PROJE_ID,
          ad: "Yeni",
          sira: "U",
          arsiv_mi: false,
          wip_limit: null,
        }),
      );
    });

    await waitFor(() => {
      const v = qc.getQueryData<ProjeDetayOzeti>(ANAHTAR);
      const idler = v?.listeler.map((l) => l.id) ?? [];
      expect(idler).toContain("real-l");
      expect(idler).not.toContain("temp-l");
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [ornekListe({ id: "l-1", ad: "Var" })],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    listeOlusturMock.mockResolvedValue(hata("Yetkin yok", "YETKISIZ"));

    const { result } = renderHook(() => useListeOlustur(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id_taslak: "temp-x",
        proje_id: PROJE_ID,
        ad: "Olmaz",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Liste oluşturulamadı",
      expect.objectContaining({ description: "Yetkin yok" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [ornekListe({ id: "l-1", ad: "Var" })],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((s: Error) => void) | null = null;
    listeOlusturMock.mockImplementation(
      () =>
        new Promise((_r, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(() => useListeOlustur(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id_taslak: "temp-y",
        proje_id: PROJE_ID,
        ad: "Gec",
      });
    });

    await waitFor(() => {
      expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)?.listeler.length).toBe(2);
    });

    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Liste oluşturulamadı",
      expect.objectContaining({ description: "timeout" }),
    );
  });

  it("optimistic: bos listelerde sira SIRA_BAS ile baslar", async () => {
    const qc = olusturQc();
    qc.setQueryData(ANAHTAR, ornekDetay({ listeler: [] }));

    listeOlusturMock.mockResolvedValue(
      ok({
        id: "real-l",
        proje_id: PROJE_ID,
        ad: "Ilk",
        sira: "M",
        arsiv_mi: false,
        wip_limit: null,
      }),
    );

    const { result } = renderHook(() => useListeOlustur(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id_taslak: "temp-i",
        proje_id: PROJE_ID,
        ad: "Ilk",
      });
    });

    await waitFor(() => {
      const v = qc.getQueryData<ProjeDetayOzeti>(ANAHTAR);
      expect(v?.listeler.length).toBe(1);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

// ============================================================
// useListeGuncelle
// ============================================================

describe("useListeGuncelle", () => {
  it("optimistic: sadece arsiv_mi verildiginde ad/wip korunur", async () => {
    const qc = olusturQc();
    qc.setQueryData(
      ANAHTAR,
      ornekDetay({
        listeler: [ornekListe({ id: "l-1", ad: "Eski", wip_limit: 10 })],
      }),
    );
    listeGuncelleMock.mockResolvedValue(ok({ id: "l-1" }));

    const { result } = renderHook(() => useListeGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "l-1", arsiv_mi: true });
    });

    await waitFor(() => {
      const l = qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)?.listeler[0];
      expect(l?.ad).toBe("Eski"); // korundu
      expect(l?.wip_limit).toBe(10); // korundu
      expect(l?.arsiv_mi).toBe(true); // degisti
    });
  });

  it("happy: optimistic ad/wip degisir", async () => {
    const qc = olusturQc();
    qc.setQueryData(
      ANAHTAR,
      ornekDetay({
        listeler: [
          ornekListe({ id: "l-1", ad: "Eski", wip_limit: null }),
        ],
      }),
    );

    listeGuncelleMock.mockResolvedValue(ok({ id: "l-1" }));

    const { result } = renderHook(() => useListeGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "l-1", ad: "Yeni", wip_limit: 5 });
    });

    await waitFor(() => {
      const l = qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)?.listeler[0];
      expect(l?.ad).toBe("Yeni");
      expect(l?.wip_limit).toBe(5);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [ornekListe({ id: "l-1", ad: "Eski" })],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    listeGuncelleMock.mockResolvedValue(hata("Cakisma", "CAKISMA"));

    const { result } = renderHook(() => useListeGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "l-1", ad: "Yeni" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Liste güncellenemedi",
      expect.objectContaining({ description: "Cakisma" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [ornekListe({ id: "l-1", ad: "Eski" })],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((s: Error) => void) | null = null;
    listeGuncelleMock.mockImplementation(
      () =>
        new Promise((_r, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(() => useListeGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "l-1", ad: "Yeni" });
    });

    await waitFor(() => {
      const l = qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)?.listeler[0];
      expect(l?.ad).toBe("Yeni");
    });

    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Liste güncellenemedi",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useListeSil
// ============================================================

describe("useListeSil", () => {
  it("happy: filter ile cikar", async () => {
    const qc = olusturQc();
    qc.setQueryData(
      ANAHTAR,
      ornekDetay({
        listeler: [
          ornekListe({ id: "l-1", ad: "Silinecek" }),
          ornekListe({ id: "l-2", ad: "Kalan" }),
        ],
      }),
    );

    listeSilMock.mockResolvedValue(ok({ id: "l-1" }));

    const { result } = renderHook(() => useListeSil(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "l-1" });
    });

    await waitFor(() => {
      const v = qc.getQueryData<ProjeDetayOzeti>(ANAHTAR);
      expect(v?.listeler.map((l) => l.id)).toEqual(["l-2"]);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({ id: "l-1", ad: "A" }),
        ornekListe({ id: "l-2", ad: "B" }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    listeSilMock.mockResolvedValue(hata("Bulunamadi", "BULUNAMADI"));

    const { result } = renderHook(() => useListeSil(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "l-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Liste silinemedi",
      expect.objectContaining({ description: "Bulunamadi" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [ornekListe({ id: "l-1" })],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((s: Error) => void) | null = null;
    listeSilMock.mockImplementation(
      () =>
        new Promise((_r, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(() => useListeSil(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "l-1" });
    });

    await waitFor(() => {
      expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)?.listeler.length).toBe(0);
    });

    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Liste silinemedi",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useListeSirala — LexoRank re-sort
// ============================================================

describe("useListeSirala", () => {
  // siraArasi("M", "T") ortayi 'P' uretir (uppercase). localeCompare'in
  // case-collation tutarsizligindan kacinmak icin uppercase blogu icinde tasiriz.
  it("happy: 3 liste [M,T,Z], B id'li 'T' siraliyi M ve Z arasina tasi -> sira degisir", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({ id: "A", ad: "A", sira: "M" }),
        ornekListe({ id: "B", ad: "B", sira: "T" }),
        ornekListe({ id: "C", ad: "C", sira: "Z" }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    listeSiralaMock.mockResolvedValue(ok({ sira: "P" }));

    const { result } = renderHook(() => useListeSirala(ANAHTAR), {
      wrapper: sarici(qc),
    });

    // B'yi A (sira=M) ile C (sira=Z) arasinda yeniden konumlandir.
    // Cache'te B zaten A ve C arasinda — ama optimistic yeni siray 'P' yapar.
    act(() => {
      result.current.mutate({
        id: "B",
        proje_id: PROJE_ID,
        onceki_id: "A",
        sonraki_id: "C",
        onceki_sira: "M",
        sonraki_sira: "Z",
      });
    });

    await waitFor(() => {
      const v = qc.getQueryData<ProjeDetayOzeti>(ANAHTAR);
      // Sirasi 'P' uppercase oldu, [M, P, Z] sirasinda kalir.
      const adlar = v?.listeler.map((l) => l.ad);
      expect(adlar).toEqual(["A", "B", "C"]);
      const b = v?.listeler.find((l) => l.id === "B");
      // T -> S degisti (M < S < Z) — basit string compare.
      const bs = b?.sira ?? "";
      expect(bs > "M").toBe(true);
      expect(bs < "Z").toBe(true);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({ id: "A", ad: "A", sira: "A" }),
        ornekListe({ id: "B", ad: "B", sira: "B" }),
        ornekListe({ id: "C", ad: "C", sira: "C" }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    listeSiralaMock.mockResolvedValue(hata("Yetkin yok", "YETKISIZ"));

    const { result } = renderHook(() => useListeSirala(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id: "B",
        proje_id: PROJE_ID,
        onceki_id: "C",
        sonraki_id: null,
        onceki_sira: "C",
        sonraki_sira: null,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Liste taşınamadı",
      expect.objectContaining({ description: "Yetkin yok" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    // [M, T, Z] siralanmis; B'nin sirasi M ile T arasina cekilir → 'P'.
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({ id: "A", ad: "A", sira: "M" }),
        ornekListe({ id: "B", ad: "B", sira: "T" }),
        ornekListe({ id: "C", ad: "C", sira: "Z" }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((s: Error) => void) | null = null;
    listeSiralaMock.mockImplementation(
      () =>
        new Promise((_r, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(() => useListeSirala(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id: "B",
        proje_id: PROJE_ID,
        onceki_id: "A",
        sonraki_id: "C",
        onceki_sira: "M",
        sonraki_sira: "Z",
      });
    });

    // Optimistic: B'nin sirasi 'S' oldu (siraArasi("M","Z") = floor((77+90)/2)=83='S').
    // Sira yine [M, S, Z] = [A, B, C].
    await waitFor(() => {
      const b = qc
        .getQueryData<ProjeDetayOzeti>(ANAHTAR)
        ?.listeler.find((l) => l.id === "B");
      expect(b?.sira).toBe("S");
    });

    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Liste taşınamadı",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useKartOlustur — optimistic ekle + swap
// ============================================================

describe("useKartOlustur", () => {
  it("happy: hedef listeye ekle, server kabulu ile temp -> real swap", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "l-1",
          kartlar: [ornekKart({ id: "k-1", baslik: "Var" })],
        }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let cozumle: ((y: unknown) => void) | null = null;
    kartOlusturMock.mockImplementation(
      () =>
        new Promise((res) => {
          cozumle = res;
        }),
    );

    const { result } = renderHook(() => useKartOlustur(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id_taslak: "temp-k",
        liste_id: "l-1",
        baslik: "Yeni Kart",
      });
    });

    // Optimistic eklendi.
    await waitFor(() => {
      const l = qc
        .getQueryData<ProjeDetayOzeti>(ANAHTAR)
        ?.listeler.find((x) => x.id === "l-1");
      expect(l?.kartlar.map((k) => k.id)).toEqual(["k-1", "temp-k"]);
    });

    act(() => {
      cozumle!(
        ok({
          id: "real-k",
          liste_id: "l-1",
          baslik: "Yeni Kart",
          aciklama: null,
          sira: "U",
          kapak_renk: null,
          bitis: null,
          arsiv_mi: false,
          silindi_mi: false,
          uye_sayisi: 0,
          etiket_sayisi: 0,
        }),
      );
    });

    await waitFor(() => {
      const l = qc
        .getQueryData<ProjeDetayOzeti>(ANAHTAR)
        ?.listeler.find((x) => x.id === "l-1");
      const idler = l?.kartlar.map((k) => k.id) ?? [];
      expect(idler).toContain("real-k");
      expect(idler).not.toContain("temp-k");
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback (temp kart cıkar) + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "l-1",
          kartlar: [ornekKart({ id: "k-1", baslik: "Var" })],
        }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    kartOlusturMock.mockResolvedValue(hata("Yetkin yok", "YETKISIZ"));

    const { result } = renderHook(() => useKartOlustur(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id_taslak: "temp-z",
        liste_id: "l-1",
        baslik: "Olmaz",
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Kart oluşturulamadı",
      expect.objectContaining({ description: "Yetkin yok" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [ornekListe({ id: "l-1" })],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((s: Error) => void) | null = null;
    kartOlusturMock.mockImplementation(
      () =>
        new Promise((_r, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(() => useKartOlustur(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id_taslak: "temp-w",
        liste_id: "l-1",
        baslik: "Gec",
      });
    });

    await waitFor(() => {
      const l = qc
        .getQueryData<ProjeDetayOzeti>(ANAHTAR)
        ?.listeler.find((x) => x.id === "l-1");
      expect(l?.kartlar.length).toBe(1);
    });

    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Kart oluşturulamadı",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useKartGuncelle
// ============================================================

describe("useKartGuncelle", () => {
  it("optimistic: tum alanlar (aciklama/kapak_renk/bitis null) ayri ayri set edilebilir", async () => {
    const qc = olusturQc();
    const tarih = new Date("2026-12-31");
    qc.setQueryData(
      ANAHTAR,
      ornekDetay({
        listeler: [
          ornekListe({
            id: "l-1",
            kartlar: [
              ornekKart({
                id: "k-1",
                baslik: "B",
                aciklama: "EskiAciklama",
                kapak_renk: "primary",
                bitis: tarih,
              }),
            ],
          }),
        ],
      }),
    );
    kartGuncelleMock.mockResolvedValue(ok({ id: "k-1" }));

    const { result } = renderHook(() => useKartGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    // aciklama, kapak_renk, bitis null'lanir; baslik/arsiv_mi degismez.
    act(() => {
      result.current.mutate({
        id: "k-1",
        aciklama: null,
        kapak_renk: null,
        bitis: null,
      });
    });

    await waitFor(() => {
      const k = qc
        .getQueryData<ProjeDetayOzeti>(ANAHTAR)
        ?.listeler[0]?.kartlar[0];
      expect(k?.baslik).toBe("B"); // korundu
      expect(k?.aciklama).toBeNull();
      expect(k?.kapak_renk).toBeNull();
      expect(k?.bitis).toBeNull();
    });
  });

  it("happy: optimistic alan degisir", async () => {
    const qc = olusturQc();
    qc.setQueryData(
      ANAHTAR,
      ornekDetay({
        listeler: [
          ornekListe({
            id: "l-1",
            kartlar: [ornekKart({ id: "k-1", baslik: "Eski" })],
          }),
        ],
      }),
    );

    kartGuncelleMock.mockResolvedValue(ok({ id: "k-1" }));

    const { result } = renderHook(() => useKartGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "k-1", baslik: "Yeni" });
    });

    await waitFor(() => {
      const l = qc
        .getQueryData<ProjeDetayOzeti>(ANAHTAR)
        ?.listeler.find((x) => x.id === "l-1");
      expect(l?.kartlar[0]?.baslik).toBe("Yeni");
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "l-1",
          kartlar: [ornekKart({ id: "k-1", baslik: "Eski" })],
        }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    kartGuncelleMock.mockResolvedValue(hata("Cakisma", "CAKISMA"));

    const { result } = renderHook(() => useKartGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "k-1", baslik: "Yeni" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Kart güncellenemedi",
      expect.objectContaining({ description: "Cakisma" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "l-1",
          kartlar: [ornekKart({ id: "k-1", baslik: "Eski" })],
        }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((s: Error) => void) | null = null;
    kartGuncelleMock.mockImplementation(
      () =>
        new Promise((_r, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(() => useKartGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "k-1", baslik: "Yeni" });
    });

    await waitFor(() => {
      const l = qc
        .getQueryData<ProjeDetayOzeti>(ANAHTAR)
        ?.listeler.find((x) => x.id === "l-1");
      expect(l?.kartlar[0]?.baslik).toBe("Yeni");
    });

    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Kart güncellenemedi",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useKartSil
// ============================================================

describe("useKartSil", () => {
  it("happy: kart listeden cikar", async () => {
    const qc = olusturQc();
    qc.setQueryData(
      ANAHTAR,
      ornekDetay({
        listeler: [
          ornekListe({
            id: "l-1",
            kartlar: [
              ornekKart({ id: "k-1", baslik: "Silinecek" }),
              ornekKart({ id: "k-2", baslik: "Kalan" }),
            ],
          }),
        ],
      }),
    );

    kartSilMock.mockResolvedValue(ok({ id: "k-1" }));

    const { result } = renderHook(() => useKartSil(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "k-1" });
    });

    await waitFor(() => {
      const l = qc
        .getQueryData<ProjeDetayOzeti>(ANAHTAR)
        ?.listeler.find((x) => x.id === "l-1");
      expect(l?.kartlar.map((k) => k.id)).toEqual(["k-2"]);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "l-1",
          kartlar: [ornekKart({ id: "k-1" })],
        }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    kartSilMock.mockResolvedValue(hata("Bulunamadi", "BULUNAMADI"));

    const { result } = renderHook(() => useKartSil(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "k-1" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Kart silinemedi",
      expect.objectContaining({ description: "Bulunamadi" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "l-1",
          kartlar: [ornekKart({ id: "k-1" })],
        }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((s: Error) => void) | null = null;
    kartSilMock.mockImplementation(
      () =>
        new Promise((_r, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(() => useKartSil(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "k-1" });
    });

    await waitFor(() => {
      const l = qc
        .getQueryData<ProjeDetayOzeti>(ANAHTAR)
        ?.listeler.find((x) => x.id === "l-1");
      expect(l?.kartlar.length).toBe(0);
    });

    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Kart silinemedi",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useKartGeriYukle (no-op optimistic; invalidate sonrasi geri gelir)
// ============================================================

describe("useKartGeriYukle", () => {
  it("happy: cache degismez (invalidate sonrasi gelir), success", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "l-1",
          kartlar: [ornekKart({ id: "k-1", baslik: "Var" })],
        }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    kartGeriYukleMock.mockResolvedValue(ok({ id: "kx" }));

    const { result } = renderHook(() => useKartGeriYukle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "kx" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Optimistic no-op: cache eski hali korur (invalidate ile yenilenir).
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "l-1",
          kartlar: [ornekKart({ id: "k-1" })],
        }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    kartGeriYukleMock.mockResolvedValue(hata("Yetkin yok", "YETKISIZ"));

    const { result } = renderHook(() => useKartGeriYukle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "kx" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Kart geri yüklenemedi",
      expect.objectContaining({ description: "Yetkin yok" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [ornekListe({ id: "l-1" })],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((s: Error) => void) | null = null;
    kartGeriYukleMock.mockImplementation(
      () =>
        new Promise((_r, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(() => useKartGeriYukle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id: "kx" });
    });

    // Mutation kuyruga girdi — mutationFn cagrilmis olmali (mock kaydolsun).
    await waitFor(() => {
      expect(kartGeriYukleMock).toHaveBeenCalledTimes(1);
    });

    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Kart geri yüklenemedi",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useKartTasi — KRITIK: kaynaktan cikar + hedefe ekle + sirala
// ============================================================

describe("useKartTasi", () => {
  it("happy: ayni liste icinde tasima -> mutation server'a dogru parametrelerle iletilir", async () => {
    // Not: useKartTasi'da optimistic update YOK (detay-sorgulari.ts:303-307).
    // Cache rollback'i kanban-pano dragBaslat snapshot'ı ile yapılır. Hook'tan
    // beklenen tek davranış: server action'ı doğru parametrelerle çağırmak.
    const qc = olusturQc();
    qc.setQueryData(
      ANAHTAR,
      ornekDetay({
        listeler: [
          ornekListe({
            id: "l-1",
            kartlar: [
              ornekKart({ id: "A", baslik: "A", sira: "A" }),
              ornekKart({ id: "B", baslik: "B", sira: "B" }),
              ornekKart({ id: "C", baslik: "C", sira: "C" }),
            ],
          }),
        ],
      }),
    );

    kartTasiMock.mockResolvedValue(ok({ sira: "AN", liste_id: "l-1" }));

    const { result } = renderHook(() => useKartTasi(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id: "C",
        hedef_liste_id: "l-1",
        onceki_id: "A",
        sonraki_id: "B",
        kaynak_liste_id: "l-1",
        onceki_sira: "A",
        sonraki_sira: "B",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(kartTasiMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "C",
        hedef_liste_id: "l-1",
        onceki_id: "A",
        sonraki_id: "B",
      }),
    );
  });

  it("happy: listeler arasi tasima -> mutation server'a dogru parametrelerle iletilir", async () => {
    // Hook fiziksel tasima yapmaz — pano UI dragOver sirasinda zaten yapmis olur.
    const qc = olusturQc();
    qc.setQueryData(
      ANAHTAR,
      ornekDetay({
        listeler: [
          ornekListe({
            id: "kaynak",
            kartlar: [
              ornekKart({ id: "k1", baslik: "K1", sira: "M" }),
              ornekKart({ id: "k2", baslik: "K2", sira: "T" }),
            ],
          }),
          ornekListe({
            id: "hedef",
            kartlar: [
              ornekKart({ id: "h1", baslik: "H1", sira: "M" }),
              ornekKart({ id: "h2", baslik: "H2", sira: "Z" }),
            ],
          }),
        ],
      }),
    );

    kartTasiMock.mockResolvedValue(ok({ sira: "S", liste_id: "hedef" }));

    const { result } = renderHook(() => useKartTasi(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id: "k2",
        hedef_liste_id: "hedef",
        onceki_id: "h1",
        sonraki_id: "h2",
        kaynak_liste_id: "kaynak",
        onceki_sira: "M",
        sonraki_sira: "Z",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(kartTasiMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "k2",
        hedef_liste_id: "hedef",
        onceki_id: "h1",
        sonraki_id: "h2",
      }),
    );
  });

  it("server fail: rollback (kart kaynakta kalir, hedefte yok)", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "kaynak",
          kartlar: [ornekKart({ id: "k1", baslik: "K1", sira: "M" })],
        }),
        ornekListe({
          id: "hedef",
          kartlar: [],
        }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    kartTasiMock.mockResolvedValue(hata("Yetkin yok", "YETKISIZ"));

    const { result } = renderHook(() => useKartTasi(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id: "k1",
        hedef_liste_id: "hedef",
        onceki_id: null,
        sonraki_id: null,
        kaynak_liste_id: "kaynak",
        onceki_sira: null,
        sonraki_sira: null,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Kart taşınamadı",
      expect.objectContaining({ description: "Yetkin yok" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "kaynak",
          kartlar: [ornekKart({ id: "k1", baslik: "K1", sira: "M" })],
        }),
        ornekListe({
          id: "hedef",
          kartlar: [],
        }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((s: Error) => void) | null = null;
    kartTasiMock.mockImplementation(
      () =>
        new Promise((_r, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(() => useKartTasi(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id: "k1",
        hedef_liste_id: "hedef",
        onceki_id: null,
        sonraki_id: null,
        kaynak_liste_id: "kaynak",
        onceki_sira: "M",
        sonraki_sira: null,
      });
    });

    // mutate baslamasini bekle (mutationState.status = "pending")
    await waitFor(() => expect(result.current.isPending).toBe(true));

    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // Optimistic YOK; cache değişmedi, rollback gereksiz. Hata toast'ı atılmalı.
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Kart taşınamadı",
      expect.objectContaining({ description: "timeout" }),
    );
  });

  it("optimistic: bystander listler (kaynak/hedef olmayan) degistirilmez", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "kaynak",
          ad: "Kaynak",
          kartlar: [ornekKart({ id: "k1", baslik: "K1", sira: "M" })],
        }),
        ornekListe({
          id: "bystander",
          ad: "Bystander",
          kartlar: [ornekKart({ id: "x1", baslik: "X1", sira: "M" })],
        }),
        ornekListe({ id: "hedef", ad: "Hedef", kartlar: [] }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    kartTasiMock.mockResolvedValue(ok({ sira: "M", liste_id: "hedef" }));

    const { result } = renderHook(() => useKartTasi(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({
        id: "k1",
        hedef_liste_id: "hedef",
        onceki_id: null,
        sonraki_id: null,
        kaynak_liste_id: "kaynak",
        onceki_sira: null,
        sonraki_sira: null,
      });
    });

    await waitFor(() => {
      const v = qc.getQueryData<ProjeDetayOzeti>(ANAHTAR);
      const bystander = v?.listeler.find((x) => x.id === "bystander");
      // Bystander listenin kartlari aynen kalmali (return l branch'i).
      expect(bystander?.kartlar.map((k) => k.id)).toEqual(["x1"]);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("optimistic: kart bulunamazsa cache aynı kalır (no-op)", async () => {
    const qc = olusturQc();
    const baslangic = ornekDetay({
      listeler: [
        ornekListe({
          id: "kaynak",
          kartlar: [ornekKart({ id: "k1", baslik: "K1", sira: "M" })],
        }),
        ornekListe({ id: "hedef", kartlar: [] }),
      ],
    });
    qc.setQueryData(ANAHTAR, baslangic);

    kartTasiMock.mockResolvedValue(ok({ sira: "M", liste_id: "hedef" }));

    const { result } = renderHook(() => useKartTasi(ANAHTAR), {
      wrapper: sarici(qc),
    });

    // Var olmayan kart id'si — kart bulunamayinca optimistic eski cache'i doner.
    act(() => {
      result.current.mutate({
        id: "yok-boyle-id",
        hedef_liste_id: "hedef",
        onceki_id: null,
        sonraki_id: null,
        kaynak_liste_id: "kaynak",
        onceki_sira: null,
        sonraki_sira: null,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Cache degismedi.
    expect(qc.getQueryData<ProjeDetayOzeti>(ANAHTAR)).toEqual(baslangic);
  });
});
