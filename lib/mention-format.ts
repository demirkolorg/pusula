export const MENTION_UUID_REGEX =
  /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

export type MentionKisi = {
  ad: string;
  soyad: string;
};

export type MentionKisiMap = ReadonlyMap<string, MentionKisi>;

export function mentionAdi(kisi: MentionKisi | undefined): string | null {
  if (!kisi) return null;
  const ad = `${kisi.ad} ${kisi.soyad}`.trim();
  return ad.length > 0 ? ad : null;
}

export function mentionIdleriniCikar(
  metin: string | null | undefined,
): string[] {
  if (!metin) return [];
  const sonuc = new Set<string>();
  MENTION_UUID_REGEX.lastIndex = 0;
  let eslesme: RegExpExecArray | null;
  while ((eslesme = MENTION_UUID_REGEX.exec(metin)) !== null) {
    if (eslesme[1]) sonuc.add(eslesme[1].toLowerCase());
  }
  return Array.from(sonuc);
}

export function mentionlariGorunenMetneCevir(
  metin: string,
  kisiMap: MentionKisiMap,
): string {
  MENTION_UUID_REGEX.lastIndex = 0;
  return metin.replace(MENTION_UUID_REGEX, (_tam, id: string) => {
    const ad = mentionAdi(kisiMap.get(id.toLowerCase()));
    return `@${ad ?? "kullanıcı"}`;
  });
}

export function mentionlariDuzenlemeMetnineCevir(
  metin: string,
  kisiMap: MentionKisiMap,
): { metin: string; cozumlemeMapi: Map<string, string> } {
  const cozumlemeMapi = new Map<string, string>();
  const uuidAdMapi = new Map<string, string>();

  function benzersizAd(baseAd: string, uuid: string): string {
    const onceki = uuidAdMapi.get(uuid);
    if (onceki) return onceki;

    let aday = baseAd;
    let sira = 2;
    while (cozumlemeMapi.has(aday) && cozumlemeMapi.get(aday) !== uuid) {
      aday = `${baseAd} ${sira}`;
      sira += 1;
    }
    uuidAdMapi.set(uuid, aday);
    cozumlemeMapi.set(aday, uuid);
    return aday;
  }

  MENTION_UUID_REGEX.lastIndex = 0;
  const gorunenMetin = metin.replace(MENTION_UUID_REGEX, (_tam, id: string) => {
    const uuid = id.toLowerCase();
    const ad = mentionAdi(kisiMap.get(uuid)) ?? "kullanıcı";
    return `@${benzersizAd(ad, uuid)}`;
  });

  return { metin: gorunenMetin, cozumlemeMapi };
}
