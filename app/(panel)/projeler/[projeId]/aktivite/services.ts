// Sprint 3 / S3-1 — Aktivite servisi barrel.
//
// ADR-0032 mega dosya bölmesi (1756 satır → 5 parça + barrel):
//   services-ortak.ts        — tipler + jsonAlan/kisalt/birimGoruntu helpers
//                              + KART_ID_ICEREN_TIPLER + kartiBulVeProjeAl
//   services-listele.ts      — kart/projeAktiviteleriniListele (cursor + JSON path)
//   services-zenginlestir.ts — zenginlestirVeOzetle (id setleri + paralel fetch)
//   services-mesaj.ts        — 14 TR mesaj üretici (proje/liste/kart/...)
//   services-diff.ts         — degisiklikleriHazirla + degerFormatla + ALAN_ETIKETI
//   services-ozet.ts         — aktiviteOzetle router + baglamCoz + projeOzeti
//
// Çağıran kod (~6 dosya) `from "./services"` veya
// `from "@/app/(panel)/projeler/[projeId]/aktivite/services"` import yolunu korur.

// =====================================================================
// Public tipler
// =====================================================================
export type {
  AlanDegisikligi,
  AktiviteOzeti,
  HamAktivite,
} from "./services-ortak";

// =====================================================================
// Public servisler
// =====================================================================
export {
  kartAktiviteleriniListele,
  projeAktiviteleriniListele,
} from "./services-listele";

export { zenginlestirVeOzetle } from "./services-zenginlestir";
