import { db } from "@/lib/db";
import {
  mentionIdleriniCikar,
  mentionlariGorunenMetneCevir,
  type MentionKisiMap,
} from "@/lib/mention-format";

export async function mentionKisiMapiGetir(
  metinler: ReadonlyArray<string | null | undefined>,
): Promise<MentionKisiMap> {
  const idler = new Set<string>();
  for (const metin of metinler) {
    for (const id of mentionIdleriniCikar(metin)) idler.add(id);
  }
  if (idler.size === 0) return new Map();

  const kisiler = await db.kullanici.findMany({
    where: { id: { in: Array.from(idler) } },
    select: { id: true, ad: true, soyad: true },
  });
  return new Map(kisiler.map((k) => [k.id, { ad: k.ad, soyad: k.soyad }]));
}

export function mentionliMetniGorunurYap(
  metin: string,
  kisiMap: MentionKisiMap,
): string {
  return mentionlariGorunenMetneCevir(metin, kisiMap);
}
