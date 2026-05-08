// Sprint 3 / S3-9 — Metin işlemleri için ortak helper.
//
// `kisalt` fonksiyonu codebase'de 3+ yerde duplicate yazılmıştı
// (audit-kaynak-etiket, bildirimler/tetikleyiciler, genel-arama/services).
// Tek nokta: ellipsis "…" karakteri, sınırın altındaysa olduğu gibi döner.

export function kisalt(metin: string, uzunluk = 90): string {
  if (uzunluk <= 0) return "";
  return metin.length <= uzunluk
    ? metin
    : `${metin.slice(0, uzunluk - 1)}…`;
}
