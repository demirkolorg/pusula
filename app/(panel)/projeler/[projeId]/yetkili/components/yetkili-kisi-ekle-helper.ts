// Saf yardımcılar — UI'sız, test edilebilir (Kontrol Kural 131, 139).
//
// Why: dialog içerisindeki email tespiti / davet eligibility logic'i UI bileşeninden
// ayrılmıştır; jsdom gerekmeden doğrudan unit test edilebilir.

const EMAIL_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailFormatindaMi(deger: string): boolean {
  const temiz = deger.trim().toLowerCase();
  if (!temiz) return false;
  return EMAIL_DESENI.test(temiz);
}

export type DavetUygunlugu =
  | { tip: "uygun"; email: string }
  | { tip: "kayitli"; email: string }
  | { tip: "bekleyen"; email: string }
  | { tip: "format-yok" };

export function davetUygunlugunuHesapla(args: {
  arama: string;
  adayEmailleri: ReadonlyArray<string>;
  bekleyenDavetEmailleri: ReadonlyArray<string>;
}): DavetUygunlugu {
  const ham = args.arama.trim().toLowerCase();
  if (!emailFormatindaMi(ham)) return { tip: "format-yok" };
  if (args.adayEmailleri.some((e) => e.toLowerCase() === ham)) {
    return { tip: "kayitli", email: ham };
  }
  if (args.bekleyenDavetEmailleri.some((e) => e.toLowerCase() === ham)) {
    return { tip: "bekleyen", email: ham };
  }
  return { tip: "uygun", email: ham };
}
