// Şablon formu için saf liste manipülasyon yardımcıları.
// Kontrol U.1 — UI'dan ayrı, React'siz, deterministik.
// Kontrol U.9 — unit test ZORUNLU (sablon-form-helper.test.ts).

export type SablonListeTaslagi = {
  ad: string;
  wip_limit: number | null;
  // Sprint 3 / S3-19 — React render'larında stable key için lokal id.
  // UI tarafı sadece key olarak kullanır; persist edilmez (opsiyonel field).
  _tempId?: string;
};

let _sayac = 0;
function tempId(): string {
  _sayac += 1;
  return `liste-taslak-${_sayac}-${Math.random().toString(36).slice(2, 8)}`;
}

export function listeEkle(
  listeler: readonly SablonListeTaslagi[],
): SablonListeTaslagi[] {
  return [...listeler, { ad: "", wip_limit: null, _tempId: tempId() }];
}

export function listeSil(
  listeler: readonly SablonListeTaslagi[],
  index: number,
): SablonListeTaslagi[] {
  if (index < 0 || index >= listeler.length) return [...listeler];
  return listeler.filter((_, i) => i !== index);
}

export function listeyiYukariTasi(
  listeler: readonly SablonListeTaslagi[],
  index: number,
): SablonListeTaslagi[] {
  if (index <= 0 || index >= listeler.length) return [...listeler];
  const sonuc = [...listeler];
  const oncesi = sonuc[index - 1];
  const mevcut = sonuc[index];
  if (!oncesi || !mevcut) return [...listeler];
  sonuc[index - 1] = mevcut;
  sonuc[index] = oncesi;
  return sonuc;
}

export function listeyiAsagiTasi(
  listeler: readonly SablonListeTaslagi[],
  index: number,
): SablonListeTaslagi[] {
  if (index < 0 || index >= listeler.length - 1) return [...listeler];
  const sonuc = [...listeler];
  const sonrasi = sonuc[index + 1];
  const mevcut = sonuc[index];
  if (!sonrasi || !mevcut) return [...listeler];
  sonuc[index + 1] = mevcut;
  sonuc[index] = sonrasi;
  return sonuc;
}

export function listeGuncelle(
  listeler: readonly SablonListeTaslagi[],
  index: number,
  yenile: Partial<SablonListeTaslagi>,
): SablonListeTaslagi[] {
  if (index < 0 || index >= listeler.length) return [...listeler];
  return listeler.map((l, i) => (i === index ? { ...l, ...yenile } : l));
}
