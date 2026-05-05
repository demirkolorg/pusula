import * as React from "react";
import {
  MENTION_UUID_REGEX,
  mentionAdi,
} from "./mention-format";

// @mention parse + render. UUID v4 formatında geçen mention'ları kullanıcı
// adlarıyla zenginleştirir.
//
// Kullanım:
//   const parcalar = mentionParcala("Selam @<uuid>", kisiMap);
//   parcalar.map((p, i) => p.tip === "metin" ? p.deger : <Rozet>{p.ad}</Rozet>)

export type MentionParca =
  | { tip: "metin"; deger: string }
  | { tip: "mention"; uuid: string; ad: string | null };

export type KisiMap = Map<string, { ad: string; soyad: string }>;

export function mentionParcala(metin: string, kisiMap: KisiMap): MentionParca[] {
  const sonuc: MentionParca[] = [];
  let sonIdx = 0;
  MENTION_UUID_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MENTION_UUID_REGEX.exec(metin)) !== null) {
    if (m.index > sonIdx) {
      sonuc.push({ tip: "metin", deger: metin.slice(sonIdx, m.index) });
    }
    const uuid = m[1]!.toLowerCase();
    const u = kisiMap.get(uuid);
    sonuc.push({
      tip: "mention",
      uuid,
      ad: mentionAdi(u),
    });
    sonIdx = m.index + m[0].length;
  }
  if (sonIdx < metin.length) {
    sonuc.push({ tip: "metin", deger: metin.slice(sonIdx) });
  }
  return sonuc;
}

// React component — yorum içeriğini parse edip mention'ları rozet olarak basar.
// Bilinmeyen UUID (proje yetkilisi değil veya silinmiş) için placeholder gösterir.
export function MentionliMetin({
  metin,
  kisiMap,
}: {
  metin: string;
  kisiMap: KisiMap;
}) {
  const parcalar = React.useMemo(
    () => mentionParcala(metin, kisiMap),
    [metin, kisiMap],
  );
  return (
    <>
      {parcalar.map((p, i) => {
        if (p.tip === "metin") {
          return <React.Fragment key={i}>{p.deger}</React.Fragment>;
        }
        return (
          <span
            key={i}
            className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 inline-flex items-center rounded px-1 py-0 text-[0.95em] font-medium"
            title={p.ad ?? "Bilinmeyen kullanıcı"}
          >
            @{p.ad ?? "kullanıcı"}
          </span>
        );
      })}
    </>
  );
}
