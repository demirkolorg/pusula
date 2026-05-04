import * as React from "react";

// @mention parse + render. UUID v4 formatında geçen mention'ları kullanıcı
// adlarıyla zenginleştirir.
//
// Kullanım:
//   const parcalar = mentionParcala("Selam @<uuid>", uyeMap);
//   parcalar.map((p, i) => p.tip === "metin" ? p.deger : <Rozet>{p.ad}</Rozet>)

const MENTION_REGEX =
  /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

export type MentionParca =
  | { tip: "metin"; deger: string }
  | { tip: "mention"; uuid: string; ad: string | null };

export type UyeMap = Map<string, { ad: string; soyad: string }>;

export function mentionParcala(metin: string, uyeMap: UyeMap): MentionParca[] {
  const sonuc: MentionParca[] = [];
  let sonIdx = 0;
  MENTION_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MENTION_REGEX.exec(metin)) !== null) {
    if (m.index > sonIdx) {
      sonuc.push({ tip: "metin", deger: metin.slice(sonIdx, m.index) });
    }
    const uuid = m[1]!.toLowerCase();
    const u = uyeMap.get(uuid);
    sonuc.push({
      tip: "mention",
      uuid,
      ad: u ? `${u.ad} ${u.soyad}`.trim() : null,
    });
    sonIdx = m.index + m[0].length;
  }
  if (sonIdx < metin.length) {
    sonuc.push({ tip: "metin", deger: metin.slice(sonIdx) });
  }
  return sonuc;
}

// React component — yorum içeriğini parse edip mention'ları rozet olarak basar.
// Bilinmeyen UUID (proje üyesi değil veya silinmiş) için placeholder gösterir.
export function MentionliMetin({
  metin,
  uyeMap,
}: {
  metin: string;
  uyeMap: UyeMap;
}) {
  const parcalar = React.useMemo(
    () => mentionParcala(metin, uyeMap),
    [metin, uyeMap],
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
