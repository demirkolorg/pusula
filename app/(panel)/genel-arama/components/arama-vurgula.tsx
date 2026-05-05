"use client";

// Arama sonucu için Türkçe-duyarsız metin vurgulayıcı.
// `<mark>` ile sarı arka plan; mevcut metnin orijinal hali korunur (case-insensitive
// eşleşme yapılır ama gösterimde orijinal slice kullanılır).
//
// Kontrol Kural 70 — markdown/HTML render edilmiyor; düz metin <mark> içinde,
// XSS riski yok.

import { turkceNormalize } from "@/lib/arama";

type Props = {
  metin: string;
  sorgu: string;
  className?: string;
};

export function AramaVurgula({ metin, sorgu, className }: Props) {
  if (!sorgu || sorgu.length < 2) {
    return <span className={className}>{metin}</span>;
  }

  // Sorguyu kelimelere böl — çoklu kelime aramada her kelime ayrı vurgulanır.
  // Boş kelimeleri ve tek karakterleri atla (gürültü).
  const kelimeler = sorgu
    .trim()
    .split(/\s+/)
    .map((k) => turkceNormalize(k))
    .filter((k) => k.length >= 2);

  if (kelimeler.length === 0) {
    return <span className={className}>{metin}</span>;
  }

  const normMetin = turkceNormalize(metin);

  // Tüm kelimelerin tüm geçişlerini bul — [start, end] aralıkları.
  const araliklar: Array<[number, number]> = [];
  for (const kelime of kelimeler) {
    let nereden = 0;
    while (nereden < normMetin.length) {
      const idx = normMetin.indexOf(kelime, nereden);
      if (idx === -1) break;
      araliklar.push([idx, idx + kelime.length]);
      nereden = idx + kelime.length;
    }
  }

  if (araliklar.length === 0) {
    return <span className={className}>{metin}</span>;
  }

  // Aralıkları birleştir (overlap'leri kaldır).
  araliklar.sort((a, b) => a[0] - b[0]);
  const birlesik: Array<[number, number]> = [araliklar[0]!];
  for (let i = 1; i < araliklar.length; i++) {
    const son = birlesik[birlesik.length - 1]!;
    const [bas, bit] = araliklar[i]!;
    if (bas <= son[1]) {
      son[1] = Math.max(son[1], bit);
    } else {
      birlesik.push([bas, bit]);
    }
  }

  const parcalar: React.ReactNode[] = [];
  let onceki = 0;
  birlesik.forEach(([bas, bit], i) => {
    if (bas > onceki) parcalar.push(metin.slice(onceki, bas));
    parcalar.push(
      <mark
        key={i}
        className="bg-yellow-200 dark:bg-yellow-800/60 text-inherit rounded-sm px-0.5"
      >
        {metin.slice(bas, bit)}
      </mark>,
    );
    onceki = bit;
  });
  if (onceki < metin.length) parcalar.push(metin.slice(onceki));

  return <span className={className}>{parcalar}</span>;
}
