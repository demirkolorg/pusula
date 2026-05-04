import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Audit middleware (Kural 58 KATİ AUDIT GUARD): kullaniciId yoksa yazımı
// reddediyor. Test fixture'ları (ortamKur, projeOlusturFiks vb.) eylem()
// wrapper dışında çalışıyor. Her test başında AsyncLocalStorage'a bypass
// flag'i yapıştırılır — bu test boyunca tüm db.create çağrıları izinli.
// Production/dev davranışı korunur (sadece VITEST=true ortamında bypass).
import "@/lib/audit-context"; // Storage init için side-effect import

beforeEach(() => {
  const storage = globalThis.__auditCtxStorage;
  if (storage) {
    storage.enterWith({ bypass: true });
  }
});

// Her test sonrasi DOM'u temizle (test izolasyonu).
afterEach(() => {
  cleanup();
});

// jsdom'da olmayan API'ler icin polyfill'ler.

// matchMedia: Sonner ve theme bilesenleri kullanabilir.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// ResizeObserver: shadcn / base-ui bilesenlerinin coğu kullanir.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// IntersectionObserver: react-virtual / lazy bilesenler kullanabilir.
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    root = null;
    rootMargin = "";
    thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}

// scrollTo: jsdom desteklemez, base-ui drawer/sheet bilesenleri cagirabilir.
if (typeof window !== "undefined" && !window.scrollTo) {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
}

// Sonner'i tum testlerde sessize al (sonsuz dom render onlemi).
// Toast cagrilarini izlemek icin lib/toast'a vi.spyOn kullanmak yeterli.
vi.mock("sonner", async () => {
  const actual = await vi.importActual<typeof import("sonner")>("sonner");
  const fn = vi.fn() as unknown as ((...a: unknown[]) => void) & {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
    promise: ReturnType<typeof vi.fn>;
    dismiss: ReturnType<typeof vi.fn>;
  };
  fn.success = vi.fn();
  fn.error = vi.fn();
  fn.info = vi.fn();
  fn.warning = vi.fn();
  fn.promise = vi.fn();
  fn.dismiss = vi.fn();
  return {
    ...actual,
    toast: fn,
  };
});
