// Geriye dönük uyumluluk için ince proxy — `useBreakpoint() === "mobile"` ile aynı.
// Kontrol Kural 16: tek breakpoint kaynağı (`hooks/use-breakpoint.ts`).
// Yeni kod doğrudan `useBreakpoint`/`useMobil` kullanmalı.
export { useMobil as useIsMobile } from "./use-breakpoint";
