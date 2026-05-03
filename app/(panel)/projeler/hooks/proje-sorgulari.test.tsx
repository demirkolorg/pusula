import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { ok, hata } from "@/lib/sonuc";

// Bu testler hook KATMANINI dogrular: useProjeOlustur/useProjeGuncelle/... TanStack
// Query mutation davranisini, optimistic update + rollback + swap akisini.
//
// `../actions` mock'lanir — DB degil, framework boundary (server action wrapper).
// Kontrol Kural 80'in istisnasi: gerekce yorumda yazildi (auth-mock.ts gibi).
//
// `../actions` hem service'leri hem de @/auth uzerinden NextAuth'i icerir; jsdom altinda
// next/server modulu cozulemedigi icin mock zorunlu. Hooks dogrudan service cagirmaz —
// `eylemMutasyonu` ile sarilmis action fonksiyonunu cagirir.
vi.mock("../actions", () => ({
  projeListele: vi.fn(),
  projeOlusturEylem: vi.fn(),
  projeGuncelleEylem: vi.fn(),
  projeArsivleEylem: vi.fn(),
  projeSilEylem: vi.fn(),
  projeGeriYukleEylem: vi.fn(),
  projeSiralaEylem: vi.fn(),
}));

import {
  useProjeOlustur,
  useProjeGuncelle,
  useProjeArsivle,
  useProjeSil,
  useProjeGeriYukle,
  useProjeler,
  projelerKey,
} from "./proje-sorgulari";
import {
  projeListele,
  projeOlusturEylem,
  projeGuncelleEylem,
  projeArsivleEylem,
  projeSilEylem,
  projeGeriYukleEylem,
} from "../actions";
import type { ProjeKart } from "../services";

// vi.mock factory'den cikan mock'lar — type-safe kullanim icin local type assertion.
const projeListeleMock = projeListele as unknown as ReturnType<typeof vi.fn>;
const projeOlusturMock = projeOlusturEylem as unknown as ReturnType<typeof vi.fn>;
const projeGuncelleMock = projeGuncelleEylem as unknown as ReturnType<typeof vi.fn>;
const projeArsivleMock = projeArsivleEylem as unknown as ReturnType<typeof vi.fn>;
const projeSilMock = projeSilEylem as unknown as ReturnType<typeof vi.fn>;
const projeGeriYukleMock = projeGeriYukleEylem as unknown as ReturnType<typeof vi.fn>;

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

function ornek(p: Partial<ProjeKart> = {}): ProjeKart {
  return {
    id: p.id ?? crypto.randomUUID(),
    ad: p.ad ?? "Test",
    aciklama: p.aciklama ?? null,
    kapak_renk: p.kapak_renk ?? null,
    yildizli_mi: p.yildizli_mi ?? false,
    arsiv_mi: p.arsiv_mi ?? false,
    silindi_mi: p.silindi_mi ?? false,
    sira: p.sira ?? "M",
    uye_sayisi: p.uye_sayisi ?? 1,
    liste_sayisi: p.liste_sayisi ?? 0,
    olusturma_zamani: p.olusturma_zamani ?? new Date(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

const ANAHTAR = projelerKey("aktif", "");

// ============================================================
// useProjeler (sorgu)
// ============================================================

describe("useProjeler (sorgu)", () => {
  it("data doner: action'in basarili sonucundaki .veri'yi gosterir", async () => {
    const liste: ProjeKart[] = [ornek({ ad: "Bir" }), ornek({ ad: "Iki" })];
    projeListeleMock.mockResolvedValue(ok(liste));

    const qc = olusturQc();
    const { result } = renderHook(() => useProjeler("aktif", ""), {
      wrapper: sarici(qc),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data?.map((p) => p.ad)).toEqual(["Bir", "Iki"]);
  });

  it("hata atilinca exception fırlar, query.error doludur", async () => {
    projeListeleMock.mockResolvedValue(hata("Yetkin yok", "YETKISIZ"));

    const qc = olusturQc();
    const { result } = renderHook(() => useProjeler("aktif", ""), {
      wrapper: sarici(qc),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe("Yetkin yok");
  });
});

// ============================================================
// useProjeOlustur
// ============================================================

describe("useProjeOlustur", () => {
  it("happy: optimistic eklenir, server kabul edince swap calisir", async () => {
    const qc = olusturQc();
    const baslangic = [ornek({ id: "id-1", ad: "Var" })];
    qc.setQueryData(ANAHTAR, baslangic);

    let cozumle: ((y: unknown) => void) | null = null;
    projeOlusturMock.mockImplementation(
      () =>
        new Promise((res) => {
          cozumle = res;
        }),
    );

    const { result } = renderHook(() => useProjeOlustur(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id_taslak: "temp-1", ad: "Yeni" });
    });

    // Optimistic eklendi.
    await waitFor(() => {
      const veri = qc.getQueryData<ProjeKart[]>(ANAHTAR);
      expect(veri?.map((p) => p.id)).toEqual(["id-1", "temp-1"]);
    });

    // Server gercek ID donsun.
    act(() => {
      cozumle!(ok(ornek({ id: "real-1", ad: "Yeni", sira: "N" })));
    });

    await waitFor(() => {
      const veri = qc.getQueryData<ProjeKart[]>(ANAHTAR);
      const tempVar = veri?.some((p) => p.id === "temp-1");
      expect(tempVar).toBe(false);
      expect(veri?.some((p) => p.id === "real-1")).toBe(true);
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: server hata donerse rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = [ornek({ id: "id-1", ad: "Var" })];
    qc.setQueryData(ANAHTAR, baslangic);

    let cozumle: ((y: unknown) => void) | null = null;
    projeOlusturMock.mockImplementation(
      () =>
        new Promise((res) => {
          cozumle = res;
        }),
    );

    const { result } = renderHook(() => useProjeOlustur(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id_taslak: "temp-2", ad: "Olmaz" });
    });

    await waitFor(() => {
      expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)?.length).toBe(2);
    });

    act(() => {
      cozumle!(hata("Yetkin yok", "YETKISIZ"));
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Proje oluşturulamadı",
      expect.objectContaining({ description: "Yetkin yok" }),
    );
  });

  it("network/timeout: kontrollu reject -> rollback + toast.error", async () => {
    const qc = olusturQc();
    const baslangic = [ornek({ id: "id-1", ad: "Var" })];
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((sebep: Error) => void) | null = null;
    projeOlusturMock.mockImplementation(
      () =>
        new Promise((_res, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(() => useProjeOlustur(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id_taslak: "temp-3", ad: "Geç" });
    });

    await waitFor(() => {
      expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)?.length).toBe(2);
    });

    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Proje oluşturulamadı",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useProjeGuncelle
// ============================================================

describe("useProjeGuncelle", () => {
  it("happy: optimistic alan degisir, server kabul eder", async () => {
    const qc = olusturQc();
    const id = "id-9";
    qc.setQueryData(ANAHTAR, [ornek({ id, ad: "Eski" })]);

    let cozumle: ((y: unknown) => void) | null = null;
    projeGuncelleMock.mockImplementation(
      () =>
        new Promise((res) => {
          cozumle = res;
        }),
    );

    const { result } = renderHook(() => useProjeGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id, ad: "Yeni" });
    });

    await waitFor(() => {
      const v = qc.getQueryData<ProjeKart[]>(ANAHTAR);
      expect(v?.[0]?.ad).toBe("Yeni");
    });

    act(() => {
      cozumle!(ok({ id }));
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    // Veri korundu (swap yok bu hook'ta).
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)?.[0]?.ad).toBe("Yeni");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const id = "id-9";
    const baslangic = [ornek({ id, ad: "Eski" })];
    qc.setQueryData(ANAHTAR, baslangic);

    projeGuncelleMock.mockResolvedValue(hata("Cakisma var", "CAKISMA"));

    const { result } = renderHook(() => useProjeGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => {
      result.current.mutate({ id, ad: "Yeni" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Proje güncellenemedi",
      expect.objectContaining({ description: "Cakisma var" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const id = "id-9";
    const baslangic = [ornek({ id, ad: "Eski" })];
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((sebep: Error) => void) | null = null;
    projeGuncelleMock.mockImplementation(
      () => new Promise((_res, rej) => { reddet = rej; }),
    );

    const { result } = renderHook(() => useProjeGuncelle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => { result.current.mutate({ id, ad: "Yeni" }); });

    await waitFor(() => {
      expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)?.[0]?.ad).toBe("Yeni");
    });

    act(() => { reddet!(new Error("timeout")); });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Proje güncellenemedi",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useProjeArsivle (filter ile cikar)
// ============================================================

describe("useProjeArsivle", () => {
  it("happy: listeden filter ile cikar", async () => {
    const qc = olusturQc();
    const id = "id-7";
    qc.setQueryData(ANAHTAR, [
      ornek({ id, ad: "A" }),
      ornek({ id: "id-8", ad: "B" }),
    ]);

    projeArsivleMock.mockResolvedValue(ok({ id }));

    const { result } = renderHook(() => useProjeArsivle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => { result.current.mutate({ id, arsiv_mi: true }); });

    await waitFor(() => {
      const v = qc.getQueryData<ProjeKart[]>(ANAHTAR);
      expect(v?.map((p) => p.id)).toEqual(["id-8"]);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const id = "id-7";
    const baslangic = [ornek({ id, ad: "A" }), ornek({ id: "id-8", ad: "B" })];
    qc.setQueryData(ANAHTAR, baslangic);

    projeArsivleMock.mockResolvedValue(hata("Yetkin yok", "YETKISIZ"));

    const { result } = renderHook(() => useProjeArsivle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => { result.current.mutate({ id, arsiv_mi: true }); });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Proje arşivlenemedi",
      expect.objectContaining({ description: "Yetkin yok" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const id = "id-7";
    const baslangic = [ornek({ id, ad: "A" }), ornek({ id: "id-8", ad: "B" })];
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((sebep: Error) => void) | null = null;
    projeArsivleMock.mockImplementation(
      () => new Promise((_res, rej) => { reddet = rej; }),
    );

    const { result } = renderHook(() => useProjeArsivle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => { result.current.mutate({ id, arsiv_mi: true }); });

    await waitFor(() => {
      expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)?.length).toBe(1);
    });

    act(() => { reddet!(new Error("timeout")); });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Proje arşivlenemedi",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useProjeSil
// ============================================================

describe("useProjeSil", () => {
  it("happy: listeden cikar", async () => {
    const qc = olusturQc();
    const id = "id-1";
    qc.setQueryData(ANAHTAR, [
      ornek({ id, ad: "Silinecek" }),
      ornek({ id: "id-2", ad: "Kalan" }),
    ]);

    projeSilMock.mockResolvedValue(ok({ id }));

    const { result } = renderHook(() => useProjeSil(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => { result.current.mutate({ id }); });

    await waitFor(() => {
      const v = qc.getQueryData<ProjeKart[]>(ANAHTAR);
      expect(v?.map((p) => p.id)).toEqual(["id-2"]);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const id = "id-1";
    const baslangic = [
      ornek({ id, ad: "Silinecek" }),
      ornek({ id: "id-2", ad: "Kalan" }),
    ];
    qc.setQueryData(ANAHTAR, baslangic);

    projeSilMock.mockResolvedValue(hata("Bulunamadi", "BULUNAMADI"));

    const { result } = renderHook(() => useProjeSil(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => { result.current.mutate({ id }); });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Proje silinemedi",
      expect.objectContaining({ description: "Bulunamadi" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const id = "id-1";
    const baslangic = [ornek({ id, ad: "Silinecek" })];
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((sebep: Error) => void) | null = null;
    projeSilMock.mockImplementation(
      () => new Promise((_res, rej) => { reddet = rej; }),
    );

    const { result } = renderHook(() => useProjeSil(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => { result.current.mutate({ id }); });

    await waitFor(() => {
      expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)?.length).toBe(0);
    });

    act(() => { reddet!(new Error("timeout")); });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Proje silinemedi",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

// ============================================================
// useProjeGeriYukle
// ============================================================

describe("useProjeGeriYukle", () => {
  it("happy: listeden cikar (filtre 'silinmis' icinde gosterilen kayit aktife gecince listeden filter'lanir)", async () => {
    const qc = olusturQc();
    const id = "id-x";
    qc.setQueryData(ANAHTAR, [
      ornek({ id, ad: "GeriYuklenecek", silindi_mi: true }),
      ornek({ id: "id-y", ad: "Diger", silindi_mi: true }),
    ]);

    projeGeriYukleMock.mockResolvedValue(ok({ id }));

    const { result } = renderHook(() => useProjeGeriYukle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => { result.current.mutate({ id }); });

    await waitFor(() => {
      const v = qc.getQueryData<ProjeKart[]>(ANAHTAR);
      expect(v?.map((p) => p.id)).toEqual(["id-y"]);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("server fail: rollback + toast.error", async () => {
    const qc = olusturQc();
    const id = "id-x";
    const baslangic = [ornek({ id, silindi_mi: true })];
    qc.setQueryData(ANAHTAR, baslangic);

    projeGeriYukleMock.mockResolvedValue(hata("Yetkin yok", "YETKISIZ"));

    const { result } = renderHook(() => useProjeGeriYukle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => { result.current.mutate({ id }); });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Proje geri yüklenemedi",
      expect.objectContaining({ description: "Yetkin yok" }),
    );
  });

  it("network/timeout: rollback + toast.error", async () => {
    const qc = olusturQc();
    const id = "id-x";
    const baslangic = [ornek({ id, silindi_mi: true })];
    qc.setQueryData(ANAHTAR, baslangic);

    let reddet: ((sebep: Error) => void) | null = null;
    projeGeriYukleMock.mockImplementation(
      () => new Promise((_res, rej) => { reddet = rej; }),
    );

    const { result } = renderHook(() => useProjeGeriYukle(ANAHTAR), {
      wrapper: sarici(qc),
    });

    act(() => { result.current.mutate({ id }); });

    await waitFor(() => {
      expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)?.length).toBe(0);
    });

    act(() => { reddet!(new Error("timeout")); });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(qc.getQueryData<ProjeKart[]>(ANAHTAR)).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Proje geri yüklenemedi",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});
