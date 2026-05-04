import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useOptimisticMutation, eylemMutasyonu } from "./optimistic";
import { ok, hata } from "./sonuc";
import { toast } from "sonner";

// Sonner mock'u vitest.setup.ts'te global olarak tanimli; burada cagrilari izliyoruz.

type Liste = Array<{ id: string; ad: string }>;
const ANAHTAR = ["liste"] as const;

function olusturQc() {
  return new QueryClient({
    defaultOptions: {
      // gcTime: Infinity → setQueryData ile yazilan observer'siz veri silinmez.
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

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  // useFakeTimers acmis olabiliriz — geri al.
  vi.useRealTimers();
});

describe("useOptimisticMutation - happy path", () => {
  it("optimistic update hemen uygulanir, server kabul edince swap calisir", async () => {
    const qc = olusturQc();
    const baslangic: Liste = [{ id: "1", ad: "ilk" }];
    qc.setQueryData([...ANAHTAR], baslangic);

    // Kontrollu promise: sunucu cevabini biz cozumleyene kadar bekler.
    let cozumle: ((v: ReturnType<typeof ok<{ id: string; ad: string }>>) => void) | null = null;
    const sunucuFn = vi.fn(
      (vars: { id: string; ad: string }) =>
        new Promise<ReturnType<typeof ok<{ id: string; ad: string }>>>((res) => {
          cozumle = (yanit) => res(yanit ?? ok({ id: "server-" + vars.id, ad: vars.ad }));
        }),
    );

    const { result } = renderHook(
      () =>
        useOptimisticMutation<{ id: string; ad: string }, ReturnType<typeof ok<{ id: string; ad: string }>>>({
          queryKey: [...ANAHTAR],
          mutationFn: sunucuFn,
          optimistic: (old, vars) => {
            const liste = (old as Liste) ?? [];
            return [...liste, { id: vars.id, ad: vars.ad }];
          },
          swap: (old, vars, sunucuYaniti) => {
            const liste = (old as Liste) ?? [];
            const yanit = sunucuYaniti as { id: string; ad: string };
            return liste.map((x) =>
              x.id === vars.id ? { id: yanit.id, ad: yanit.ad } : x,
            );
          },
          hataMesaji: "Eklenemedi",
        }),
      { wrapper: sarici(qc) },
    );

    act(() => {
      result.current.mutate({ id: "temp-1", ad: "yeni" });
    });

    // Optimistic guncelleme HEMEN gozlemlenebilir olmali (server bekliyor).
    await waitFor(() => {
      const veri = qc.getQueryData<Liste>([...ANAHTAR]);
      expect(veri).toEqual([
        { id: "1", ad: "ilk" },
        { id: "temp-1", ad: "yeni" },
      ]);
    });

    // Server cevabi cozumle.
    act(() => {
      cozumle!(ok({ id: "server-temp-1", ad: "yeni" }));
    });

    // Swap calismali.
    await waitFor(() => {
      const veri = qc.getQueryData<Liste>([...ANAHTAR]);
      expect(veri).toEqual([
        { id: "1", ad: "ilk" },
        { id: "server-temp-1", ad: "yeni" },
      ]);
    });

    expect(sunucuFn).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("basariMesaji verilirse onSuccess'te toast.basari (sonner.success) cagrilir", async () => {
    const qc = olusturQc();
    qc.setQueryData([...ANAHTAR], [] as Liste);

    const { result } = renderHook(
      () =>
        useOptimisticMutation<void, ReturnType<typeof ok<number>>>({
          queryKey: [...ANAHTAR],
          mutationFn: async () => ok(42),
          hataMesaji: "Hata",
          basariMesaji: "Tamam",
        }),
      { wrapper: sarici(qc) },
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // lib/toast.ts her zaman options object'i ile cagiriyor (description/duration/id).
    expect(toast.success).toHaveBeenCalledWith(
      "Tamam",
      expect.objectContaining({}),
    );
  });
});

describe("useOptimisticMutation - server hata (Sonuc.hata)", () => {
  it("server Sonuc.hata donerse snapshot rollback yapilir + toast.hata cagrilir", async () => {
    const qc = olusturQc();
    const baslangic: Liste = [{ id: "1", ad: "ilk" }];
    qc.setQueryData([...ANAHTAR], baslangic);

    // Kontrollu promise: cozumlemeyi biz tetikleyelim ki optimistic ara durumu izleyebilelim.
    let cozumle: ((v: ReturnType<typeof hata>) => void) | null = null;
    const sunucuFn = vi.fn(
      () =>
        new Promise<ReturnType<typeof hata>>((res) => {
          cozumle = res;
        }),
    );

    const fn = sunucuFn as unknown as (g: {
      ad: string;
    }) => Promise<ReturnType<typeof hata>>;
    const { result } = renderHook(
      () =>
        useOptimisticMutation<{ ad: string }, unknown>({
          queryKey: [...ANAHTAR],
          mutationFn: eylemMutasyonu<{ ad: string }, unknown>(fn),
          optimistic: (old, vars) => {
            const liste = (old as Liste) ?? [];
            return [...liste, { id: "temp-x", ad: vars.ad }];
          },
          hataMesaji: "Eklenemedi",
        }),
      { wrapper: sarici(qc) },
    );

    act(() => {
      result.current.mutate({ ad: "denemece" });
    });

    // Optimistic update'in uygulandigini gor (server henuz cevap vermedi).
    await waitFor(() => {
      const veri = qc.getQueryData<Liste>([...ANAHTAR]);
      expect(veri?.length).toBe(2);
    });

    // Simdi sunucu hata yanitini cozumle.
    act(() => {
      cozumle!(hata("Yetkin yok", "YETKISIZ"));
    });

    // Rollback ve toast cagrisi olmali.
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(qc.getQueryData<Liste>([...ANAHTAR])).toEqual(baslangic);

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith(
      "Eklenemedi",
      expect.objectContaining({ description: "Yetkin yok" }),
    );
  });

  it("mutationFn dogrudan throw ederse de rollback + toast.hata calisir", async () => {
    const qc = olusturQc();
    const baslangic: Liste = [{ id: "1", ad: "ilk" }];
    qc.setQueryData([...ANAHTAR], baslangic);

    const { result } = renderHook(
      () =>
        useOptimisticMutation<{ ad: string }, never>({
          queryKey: [...ANAHTAR],
          mutationFn: async () => {
            throw new Error("network down");
          },
          optimistic: (old, vars) => {
            const liste = (old as Liste) ?? [];
            return [...liste, { id: "temp-z", ad: vars.ad }];
          },
          hataMesaji: "Baglanti yok",
        }),
      { wrapper: sarici(qc) },
    );

    act(() => {
      result.current.mutate({ ad: "x" });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(qc.getQueryData<Liste>([...ANAHTAR])).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Baglanti yok",
      expect.objectContaining({ description: "network down" }),
    );
  });
});

describe("useOptimisticMutation - network timeout simulation", () => {
  it("uzun suren bir istek reject edilince rollback + toast.hata calisir", async () => {
    // Fake timers + React Query mutation Promise zincirinde takiliyor (Vitest 4 + RQ 5).
    // Onun yerine kontrollu reject ediyoruz; semantik olarak ayni: sunucu hic cevap
    // vermiyor → "timeout" simulasyonu icin manuel reject.

    const qc = olusturQc();
    const baslangic: Liste = [{ id: "1", ad: "ilk" }];
    qc.setQueryData([...ANAHTAR], baslangic);

    let reddet: ((sebep: Error) => void) | null = null;
    const sunucuFn = vi.fn(
      () =>
        new Promise((_, rej) => {
          reddet = rej;
        }),
    );

    const { result } = renderHook(
      () =>
        useOptimisticMutation<{ ad: string }, unknown>({
          queryKey: [...ANAHTAR],
          mutationFn: sunucuFn as (v: { ad: string }) => Promise<unknown>,
          optimistic: (old, vars) => {
            const liste = (old as Liste) ?? [];
            return [...liste, { id: "temp-t", ad: vars.ad }];
          },
          hataMesaji: "Zaman asimi",
        }),
      { wrapper: sarici(qc) },
    );

    act(() => {
      result.current.mutate({ ad: "geç" });
    });

    // Optimistic update gozlemlenebilir.
    await waitFor(() => {
      expect(qc.getQueryData<Liste>([...ANAHTAR])?.length).toBe(2);
    });

    // "5 saniye sonra" timeout simulasyonu — manuel reject.
    act(() => {
      reddet!(new Error("timeout"));
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(qc.getQueryData<Liste>([...ANAHTAR])).toEqual(baslangic);
    expect(toast.error).toHaveBeenCalledWith(
      "Zaman asimi",
      expect.objectContaining({ description: "timeout" }),
    );
  });
});

describe("useOptimisticMutation - optimisticMap (coklu key)", () => {
  it("birden fazla query key'e ayri ayri update uygular", async () => {
    const qc = olusturQc();
    qc.setQueryData(["liste-a"], [{ id: "a1" }]);
    qc.setQueryData(["liste-b"], [{ id: "b1" }]);

    const { result } = renderHook(
      () =>
        useOptimisticMutation<{ ad: string }, ReturnType<typeof ok<{ ok: true }>>>({
          queryKey: ["liste-a"], // optimisticMap varken bu kullanilmaz
          mutationFn: async () => ok({ ok: true } as const),
          optimisticMap: [
            {
              queryKey: ["liste-a"],
              update: (old, vars) => [
                ...((old as Array<{ id: string; ad?: string }>) ?? []),
                { id: "temp-a", ad: vars.ad },
              ],
            },
            {
              queryKey: ["liste-b"],
              update: (old, vars) => [
                ...((old as Array<{ id: string; ad?: string }>) ?? []),
                { id: "temp-b", ad: vars.ad },
              ],
            },
          ],
          hataMesaji: "Olmadi",
        }),
      { wrapper: sarici(qc) },
    );

    act(() => {
      result.current.mutate({ ad: "ortak" });
    });

    await waitFor(() => {
      expect(qc.getQueryData(["liste-a"])).toEqual([
        { id: "a1" },
        { id: "temp-a", ad: "ortak" },
      ]);
      expect(qc.getQueryData(["liste-b"])).toEqual([
        { id: "b1" },
        { id: "temp-b", ad: "ortak" },
      ]);
    });
  });

  it("optimisticMap'te server hata olursa TUM keylerin snapshot'i geri alinir", async () => {
    const qc = olusturQc();
    qc.setQueryData(["liste-a"], [{ id: "a1" }]);
    qc.setQueryData(["liste-b"], [{ id: "b1" }]);

    const { result } = renderHook(
      () =>
        useOptimisticMutation<void, never>({
          queryKey: ["liste-a"],
          mutationFn: async () => {
            throw new Error("kapali");
          },
          optimisticMap: [
            { queryKey: ["liste-a"], update: (old) => [...((old as unknown[]) ?? []), { id: "temp-a" }] },
            { queryKey: ["liste-b"], update: (old) => [...((old as unknown[]) ?? []), { id: "temp-b" }] },
          ],
          hataMesaji: "Hata",
        }),
      { wrapper: sarici(qc) },
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(qc.getQueryData(["liste-a"])).toEqual([{ id: "a1" }]);
    expect(qc.getQueryData(["liste-b"])).toEqual([{ id: "b1" }]);
  });
});

describe("useOptimisticMutation - ekInvalidate (ikincil cache tazeleme)", () => {
  it("statik ekInvalidate ile mutation sonrasi her ek key invalidate edilir", async () => {
    const qc = olusturQc();
    qc.setQueryData(["ana"], [{ id: 1 }]);
    qc.setQueryData(["aktivite", "k1"], [{ id: "log-1" }]);

    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useOptimisticMutation<void, ReturnType<typeof ok<{ ok: true }>>>({
          queryKey: ["ana"],
          mutationFn: async () => ok({ ok: true } as const),
          ekInvalidate: [["aktivite", "k1"]],
          hataMesaji: "Hata",
        }),
      { wrapper: sarici(qc) },
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["ana"] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aktivite", "k1"],
    });
  });

  it("dinamik ekInvalidate(vars) — vars'a gore key uretir", async () => {
    const qc = olusturQc();
    qc.setQueryData(["ana"], [{ id: 1 }]);

    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useOptimisticMutation<{ kart_id: string }, ReturnType<typeof ok<{ ok: true }>>>({
          queryKey: ["ana"],
          mutationFn: async () => ok({ ok: true } as const),
          ekInvalidate: (vars) => [["aktivite", vars.kart_id]],
          hataMesaji: "Hata",
        }),
      { wrapper: sarici(qc) },
    );

    act(() => {
      result.current.mutate({ kart_id: "kart-42" });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aktivite", "kart-42"],
    });
  });

  it("server hata durumunda da ekInvalidate calisir (onSettled)", async () => {
    const qc = olusturQc();
    qc.setQueryData(["ana"], [{ id: 1 }]);

    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(
      () =>
        useOptimisticMutation<void, never>({
          queryKey: ["ana"],
          mutationFn: async () => {
            throw new Error("kapali");
          },
          ekInvalidate: [["aktivite", "k7"]],
          hataMesaji: "Hata",
        }),
      { wrapper: sarici(qc) },
    );

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Hata yolunda da onSettled tetiklenir → ek invalidate calismali.
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aktivite", "k7"],
    });
  });
});

describe("eylemMutasyonu - Sonuc<T> cozumlemesi", () => {
  it("basarili Sonuc'tan veri'yi cikarir", async () => {
    const fn = async () => ok({ x: 1 });
    const sarilmis = eylemMutasyonu(fn);
    const r = await sarilmis(undefined);
    expect(r).toEqual({ x: 1 });
  });

  it("basarisiz Sonuc'ta Error firlatir, mesaji aynen iletir", async () => {
    const fn = async () => hata("yetersiz", "YETKISIZ");
    const sarilmis = eylemMutasyonu(fn);
    await expect(sarilmis(undefined)).rejects.toThrowError("yetersiz");
  });

  it("girdiyi inner fonksiyona aynen iletir", async () => {
    const fn = vi.fn(async (g: { id: string }) => ok({ id: g.id, ek: 1 }));
    const sarilmis = eylemMutasyonu(fn);
    await sarilmis({ id: "abc" });
    expect(fn).toHaveBeenCalledWith({ id: "abc" });
  });
});
