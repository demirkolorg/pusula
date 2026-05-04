// Saf query key tanımları — actions.ts veya hooks.ts'i import etmeden
// (test'te next-auth import zincirini ağa düşürmeden) kullanılabilsin diye
// ayrılmıştır. Diğer modüllerin `ekInvalidate` listesinde aktivite log'unu
// tazelemek için bu dosyayı import etmesi yeterli.

export const KART_AKTIVITELERI_KEY = "kart-aktiviteleri";

export function kartAktiviteleriKey(kartId: string) {
  return [KART_AKTIVITELERI_KEY, kartId] as const;
}
