// Şablon formu için saf liste manipülasyon yardımcıları.
// Kontrol U.1 — UI'dan ayrı, React'siz, deterministik.
// Kontrol U.9 — unit test ZORUNLU (sablon-form-helper.test.ts).

export type SablonListeTaslagi = {
  ad: string;
  wip_limit: number | null;
};

export function listeEkle(
  listeler: readonly SablonListeTaslagi[],
): SablonListeTaslagi[] {
  return [...listeler, { ad: "", wip_limit: null }];
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
