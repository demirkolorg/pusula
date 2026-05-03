// Fractional / lexicographic ordering helper.
// Plan: docs/plan.md Bölüm 1.5/F · Kontrol Kural 110.
//
// LexoRank — Figma "fractional-indexing" referans algoritmasının basit hâli.
// Alfabe: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" (36 karakter, base-36).
// Sadece bu daraltılmış alfabe → string '<' karşılaştırması ASCII sırasıyla
// alfabetik sırayla aynıdır, locale farkı yok.
//
// Kullanıcı tarafında SIRALAMA ZORUNLU YAKLAŞIM:
//   liste.sort((a, b) => (a.sira < b.sira ? -1 : a.sira > b.sira ? 1 : 0))
// `localeCompare` KULLANMA — bazı locale'lerde küçük harf önce gelir,
// alfabemiz sadece büyük harf ama yine de garantili davranış için bu kuralı tut.

const ALFABE = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const N = ALFABE.length; // 36
const ORTA = Math.floor(N / 2); // 'I' (18)

export const SIRA_BAS = "M"; // ilk eleman için iyi bir orta nokta
export const SIRA_ALFABE = ALFABE;

function bul(c: string): number {
  const i = ALFABE.indexOf(c);
  if (i < 0) {
    throw new Error(`siraArasi: geçersiz karakter "${c}" — alfabe dışı`);
  }
  return i;
}

function harf(i: number): string {
  if (i < 0 || i >= N) {
    throw new Error(`siraArasi: indeks aralık dışı ${i}`);
  }
  return ALFABE[i]!;
}

// İki sıra string'i arasında strict olarak büyüyen yeni bir string üretir.
// Hem `a` hem `b` null olabilir (sırasıyla -∞ ve +∞ gibi davranır).
export function siraArasi(
  a: string | null,
  b: string | null,
): string {
  // İki taraf da boş — alfabenin ortası.
  if (!a && !b) return harf(ORTA);

  // Sadece `b` var: b'den önce gelen.
  if (!a && b) {
    return oncesini(b);
  }

  // Sadece `a` var: a'dan sonra gelen.
  if (a && !b) {
    return sonrasini(a);
  }

  // İki taraf da var: a < b olmalı.
  return arasinda(a!, b!);
}

// `b`'den kesin önce gelen bir string üret.
// LexoRank sınırlaması: b "0...0" ile bitiyorsa öncesi üretilemez (alfabe tabanı).
// Pratik uyum için SIRA_BAS = "M" — başa ekleme ~5 iterasyon güvenli.
function oncesini(b: string): string {
  if (!b) return harf(ORTA);

  const ilkIndeks = bul(b[0]!);

  if (ilkIndeks > 0) {
    // 0 ile ilkIndeks arasında en az 1 karakter var — ortayı al.
    return harf(Math.floor(ilkIndeks / 2));
  }

  // b "0..." ile başlıyor.
  if (b.length === 1) {
    // b == "0" — alfabe tabanı, öncesi imkansız.
    throw new Error(
      "siraArasi: alfabe tabanı '0' karakterinden önce gelen sıra üretilemez. " +
        "Pratik kullanımda SIRA_BAS='M' ile başlayıp ~5 ardışık başa ekleme güvenli.",
    );
  }

  // b = "0..." uzunluk > 1, "0" prefix'i koru, kalan kısmın öncesini üret.
  return "0" + oncesini(b.slice(1));
}

// `a`'dan kesin sonra gelen bir string üret.
// Sona ekleme sınırsızdır — `a` "Z...Z" ile bitse bile prefix'le genişler.
function sonrasini(a: string): string {
  if (!a) return harf(ORTA);

  const ilkIndeks = bul(a[0]!);

  if (ilkIndeks < N - 1) {
    // ilkIndeks ile (N-1) arasında en az 1 karakter var — ortayı al.
    return harf(Math.ceil((ilkIndeks + N) / 2));
  }

  // a "Z..." ile başlıyor — "Z" prefix'i koru, kalan kısmın sonrasını üret.
  if (a.length === 1) {
    // a == "Z" — "Z" prefix'le orta karakter ekle ("ZM" gibi).
    return "Z" + harf(ORTA);
  }

  return "Z" + sonrasini(a.slice(1));
}

// `a` < `b` olmak üzere, ikisi arasında bir string üret.
function arasinda(a: string, b: string): string {
  if (a >= b) {
    throw new Error(`siraArasi: önceki (${a}) sonrakine (${b}) eşit veya sonra.`);
  }

  // Ortak prefix bul.
  let i = 0;
  const minLen = Math.min(a.length, b.length);
  while (i < minLen && a[i] === b[i]) i++;
  const prefix = a.slice(0, i);

  // a tamamen b'nin prefix'i durumunda (örn. a="A", b="AC"): prefix sonrası
  // sadece b'nin uzantısının "öncesini" üret.
  if (i >= a.length) {
    return prefix + oncesini(b.slice(i));
  }

  // İki tarafın i'inci karakterleri farklı (a[i] < b[i]).
  const ai = bul(a[i]!);
  const bi = bul(b[i]!);

  if (bi - ai >= 2) {
    // Aralarında en az bir karakter var — ortayı al.
    const ortak = Math.floor((ai + bi) / 2);
    return prefix + harf(ortak);
  }

  // ai + 1 === bi — a'nın i'inci karakterini koru, sonrasında a'dan sonra gelen
  // bir string üret (b'yi geçmeden, çünkü artık b ile farklı karakterdeyiz).
  return prefix + a[i]! + sonrasini(a.slice(i + 1) || harf(0));
}

// Listenin sonuna eklemek için.
export function siraSonuna(sonElemanSira: string | null): string {
  if (!sonElemanSira) return SIRA_BAS;
  return siraArasi(sonElemanSira, null);
}

// Listenin başına eklemek için.
export function siraBasina(ilkElemanSira: string | null): string {
  if (!ilkElemanSira) return SIRA_BAS;
  return siraArasi(null, ilkElemanSira);
}

// UI'da sıralama için yardımcı — `localeCompare` kullanmadan ASCII compare.
export function siraKarsilastir(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
