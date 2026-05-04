import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auditContext } from "./audit-context";
import { yayinla } from "./realtime";
import { SOCKET, room } from "./socket-events";

// Server-side realtime emit helper testi.
// Kural 80 framework boundary istisnası: global fetch mock'lanır (network
// I/O), services'in business logic'i hâlâ izole edilmedi.

describe("yayinla", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("audit-context'ten request_id ve kullanici_id alıp zarfa ekler", async () => {
    await auditContext.run(
      {
        kullaniciId: "u-1",
        requestId: "r-42",
      },
      async () => {
        await yayinla(SOCKET.KART_OLUSTUR, room.proje("p-1"), {
          kart_id: "k-1",
        });
      },
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(typeof url).toBe("string");
    const govde = JSON.parse((init as RequestInit).body as string);
    expect(govde).toMatchObject({
      event: SOCKET.KART_OLUSTUR,
      room: "proje:p-1",
      payload: {
        request_id: "r-42",
        ureten_id: "u-1",
        room: "proje:p-1",
        veri: { kart_id: "k-1" },
      },
    });
  });

  it("audit context yoksa request_id/ureten_id null", async () => {
    await yayinla(SOCKET.YORUM_OLUSTUR, room.kart("k-99"), { x: 1 });

    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const govde = JSON.parse(init.body as string);
    expect(govde.payload.request_id).toBeNull();
    expect(govde.payload.ureten_id).toBeNull();
  });

  it("Bearer internal token gönderir", async () => {
    await yayinla(SOCKET.BILDIRIM_YENI, room.kullanici("u-1"), {});
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toMatch(/^Bearer /);
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("fetch fail olursa hata fırlatmaz (fail-silent)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    // Hata fırlatılmamalı
    await expect(
      yayinla(SOCKET.KART_GUNCELLE, room.proje("p-1"), {}),
    ).resolves.toBeUndefined();
  });

  it("AbortController ile fetch'e signal geçirir (timeout altyapısı)", async () => {
    await yayinla(SOCKET.KART_SIL, room.proje("p-1"), {});
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});
