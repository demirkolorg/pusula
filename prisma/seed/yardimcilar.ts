// Pusula seed — paylaşılan yardımcı fonksiyonlar.

import { siraSonuna } from "../../lib/sira";
import { REFERANS_TARIH } from "./tipler";

export function gunEkle(gun: number, saat = 9): Date {
  return new Date(REFERANS_TARIH.getTime() + gun * 86_400_000 + (saat - 9) * 3_600_000);
}

export function al<T>(map: Map<string, T>, key: string, ad: string): T {
  const deger = map.get(key);
  if (!deger) throw new Error(`${ad} bulunamadı: ${key}`);
  return deger;
}

export function siraUretici(): () => string {
  let son: string | null = null;
  return () => {
    son = siraSonuna(son);
    return son;
  };
}
