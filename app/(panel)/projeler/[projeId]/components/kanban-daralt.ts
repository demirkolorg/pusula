// Kanban liste daralt durumu için saf logic katmanı.
// localStorage I/O + immutable Set helper'ları. React'siz, test edilebilir.
// Kural T.1 — drag-drop logic gibi UI dışı saf modüle ayrılır.

const KEY_PREFIX = "pusula:liste-daralt:";

export function daraltStorageKey(projeId: string): string {
  return `${KEY_PREFIX}${projeId}`;
}

// SSR-safe oku. window yoksa boş Set. Bozuk JSON'da boş Set + key silme
// (silinemiyorsa sessiz). Array değil ya da string olmayan elemanlar
// filtrelenir — kötü niyetli/eski format toleransı.
export function daraltilmisListeleriOku(projeId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  const anahtar = daraltStorageKey(projeId);
  let ham: string | null;
  try {
    ham = window.localStorage.getItem(anahtar);
  } catch {
    return new Set();
  }
  if (!ham) return new Set();
  try {
    const ayrik: unknown = JSON.parse(ham);
    if (!Array.isArray(ayrik)) {
      try {
        window.localStorage.removeItem(anahtar);
      } catch {
        /* yok */
      }
      return new Set();
    }
    return new Set(ayrik.filter((x): x is string => typeof x === "string"));
  } catch {
    try {
      window.localStorage.removeItem(anahtar);
    } catch {
      /* yok */
    }
    return new Set();
  }
}

// SSR-safe yaz. Boş set → key sil (storage kirliliği önle).
// Quota exceeded sessiz yutulur — UX bozulmaz, oturumda yine çalışır.
export function daraltilmisListeleriYaz(
  projeId: string,
  set: ReadonlySet<string>,
): void {
  if (typeof window === "undefined") return;
  const anahtar = daraltStorageKey(projeId);
  try {
    if (set.size === 0) {
      window.localStorage.removeItem(anahtar);
      return;
    }
    window.localStorage.setItem(anahtar, JSON.stringify(Array.from(set)));
  } catch {
    /* quota exceeded veya storage disabled — sessizce yut */
  }
}

// Immutable toggle. Yeni Set döner, orijinali mutate etmez.
export function listeDaraltToggle(
  set: ReadonlySet<string>,
  listeId: string,
): Set<string> {
  const yeni = new Set(set);
  if (yeni.has(listeId)) yeni.delete(listeId);
  else yeni.add(listeId);
  return yeni;
}

export function listeDaralt(
  set: ReadonlySet<string>,
  listeId: string,
): Set<string> {
  const yeni = new Set(set);
  yeni.add(listeId);
  return yeni;
}

export function listeGenislet(
  set: ReadonlySet<string>,
  listeId: string,
): Set<string> {
  const yeni = new Set(set);
  yeni.delete(listeId);
  return yeni;
}

// Verilen id kümesinin tamamını daraltılmış olarak işaretle. Mevcut Set'e
// ekleme yapar — başka liste id'leri korunur.
export function tumDaralt(
  set: ReadonlySet<string>,
  idler: ReadonlyArray<string>,
): Set<string> {
  const yeni = new Set(set);
  for (const id of idler) yeni.add(id);
  return yeni;
}

// Verilen id kümesini Set'ten çıkar. Hepsini-genişlet butonu için.
export function tumGenislet(
  set: ReadonlySet<string>,
  idler: ReadonlyArray<string>,
): Set<string> {
  const yeni = new Set(set);
  for (const id of idler) yeni.delete(id);
  return yeni;
}

// Var olmayan liste id'lerini Set'ten temizle. Liste silindiğinde id Set'te
// kalırsa, aynı id ile yeni liste yaratılırsa "geçmiş ruh" olarak daraltılmış
// görünür — bu fonksiyon o sızıntıyı önler.
export function gecerliListelereKirp(
  set: ReadonlySet<string>,
  gecerliIdler: ReadonlySet<string>,
): Set<string> {
  const yeni = new Set<string>();
  for (const id of set) {
    if (gecerliIdler.has(id)) yeni.add(id);
  }
  return yeni;
}

// İki Set içerik-eşit mi? useSyncExternalStore snapshot kararlılığı için.
// Aynı içerik → cache referansı korunur → gereksiz re-render yok.
export function setlerEsit(
  a: ReadonlySet<string>,
  b: ReadonlySet<string>,
): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}
