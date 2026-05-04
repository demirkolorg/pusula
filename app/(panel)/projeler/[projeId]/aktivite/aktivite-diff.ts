// Saf word-level diff (LCS tabanlı) — eski/yeni iki string'i kelimelere
// böler ve hangi parçaların ortak / sadece eskide / sadece yenide olduğunu
// işaretler. Aktivite detay modal'ında değişiklik vurgusu için kullanılır.
//
// Kural 131 (U.1) gereği React/UI'dan ayrı saf fonksiyon. Test
// `aktivite-diff.test.ts` içinde (Kural 139).

export type DiffSegment = { metin: string; tip: "ortak" | "fark" };

export type DiffSonucu = {
  eski: DiffSegment[];
  yeni: DiffSegment[];
};

// Performans tavanı — LCS O(m*n). Toplam token > LIMIT olursa diff atlanır,
// metinler tek "fark" segment'i olarak döner (vurgu yok ama UI çökmez).
const TOPLAM_TOKEN_LIMITI = 4000;

// Whitespace'i koruyarak böler — `["abc", " ", "def"]`. Bu sayede ortak
// boşluklar da LCS'te eşleşir, formatlamayı bozmayız.
function kelimeleriBol(s: string): string[] {
  if (s === "") return [];
  return s.split(/(\s+)/).filter((p) => p.length > 0);
}

// Standart LCS DP tablosu — dp[i][j] = a[0..i] ile b[0..j] LCS uzunluğu.
function lcsTablosu(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const aPrev = a[i - 1];
      const bPrev = b[j - 1];
      const sol = dp[i - 1]?.[j] ?? 0;
      const ust = dp[i]?.[j - 1] ?? 0;
      const capraz = dp[i - 1]?.[j - 1] ?? 0;
      const satir = dp[i];
      if (!satir) continue;
      satir[j] = aPrev === bPrev ? capraz + 1 : Math.max(sol, ust);
    }
  }
  return dp;
}

// Bitişik aynı tip segment'leri tek segment'e indir → daha temiz render.
function birlestir(segmentler: DiffSegment[]): DiffSegment[] {
  const sonuc: DiffSegment[] = [];
  for (const s of segmentler) {
    const son = sonuc[sonuc.length - 1];
    if (son && son.tip === s.tip) {
      son.metin += s.metin;
    } else {
      sonuc.push({ ...s });
    }
  }
  return sonuc;
}

export function aktiviteDiff(eski: string, yeni: string): DiffSonucu {
  // Birinin boş olduğu durum — tek tarafta tüm metin "fark".
  if (eski === "" && yeni === "") return { eski: [], yeni: [] };
  if (eski === "") {
    return { eski: [], yeni: [{ metin: yeni, tip: "fark" }] };
  }
  if (yeni === "") {
    return { eski: [{ metin: eski, tip: "fark" }], yeni: [] };
  }
  if (eski === yeni) {
    return {
      eski: [{ metin: eski, tip: "ortak" }],
      yeni: [{ metin: yeni, tip: "ortak" }],
    };
  }

  const a = kelimeleriBol(eski);
  const b = kelimeleriBol(yeni);

  // Performans guard — çok büyük metinde diff atla
  if (a.length + b.length > TOPLAM_TOKEN_LIMITI) {
    return {
      eski: [{ metin: eski, tip: "fark" }],
      yeni: [{ metin: yeni, tip: "fark" }],
    };
  }

  const dp = lcsTablosu(a, b);

  // Backtrack — sondan başa, segmentleri ön ekle (unshift).
  const eskiSeg: DiffSegment[] = [];
  const yeniSeg: DiffSegment[] = [];
  let i = a.length;
  let j = b.length;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      eskiSeg.unshift({ metin: a[i - 1] ?? "", tip: "ortak" });
      yeniSeg.unshift({ metin: b[j - 1] ?? "", tip: "ortak" });
      i--;
      j--;
    } else if ((dp[i - 1]?.[j] ?? 0) >= (dp[i]?.[j - 1] ?? 0)) {
      eskiSeg.unshift({ metin: a[i - 1] ?? "", tip: "fark" });
      i--;
    } else {
      yeniSeg.unshift({ metin: b[j - 1] ?? "", tip: "fark" });
      j--;
    }
  }
  while (i > 0) {
    eskiSeg.unshift({ metin: a[i - 1] ?? "", tip: "fark" });
    i--;
  }
  while (j > 0) {
    yeniSeg.unshift({ metin: b[j - 1] ?? "", tip: "fark" });
    j--;
  }

  return { eski: birlestir(eskiSeg), yeni: birlestir(yeniSeg) };
}
