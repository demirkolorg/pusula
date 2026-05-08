// Sprint 3 / S3-10 — Dosya boyutu insan-okur format helper'ı.
//
// `boyutBicim(byte)` 3 farklı dosyada birebir/yarı kopyaydı; biri GB
// ölçeğine kadar gidiyor, ikisi sadece MB. Tek noktaya toplandı.

export function boyutBicim(byte: number): string {
  if (byte < 0) return "—";
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  if (byte < 1024 * 1024 * 1024) {
    return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(byte / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
