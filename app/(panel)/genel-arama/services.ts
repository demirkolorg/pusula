// Genel Arama service — tsvector + pg_trgm UNION ALL sorgu, app-level yetki filtre.
// ADR-0017 + Kontrol Kural 71 (Prisma.sql template literal — raw query güvenliği)
// + Kural 50a (SUPER_ADMIN/KAYMAKAM filtre bypass).

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { kullaniciErisimBilgisi } from "@/lib/yetki";
import { tsqueryyeCevir } from "./genel-arama-helper";
import type { AramaSorgusu } from "./schemas";
import type { AramaSonucu } from "./tipler";

/**
 * Genel arama: 9 tabloyu UNION ALL ile arar, yetki filtresi uygular,
 * rank'a göre sıralar, limit'e indirger.
 *
 * Yetki modeli (Kontrol Kural 50a + ADR-0017):
 * - Makam (SUPER_ADMIN/KAYMAKAM, izinler.has("*")): tüm tabloları filtre olmadan arar.
 * - Diğer kullanıcılar: erişebildikleri proje ID'leri ile filtrelenir
 *   (proje-yetkili / proje-birim / liste-yetkili / liste-birim / kart-yetkili
 *   / kart-birim — `lib/yetki.ts` mantığı ile aynı).
 *
 * Performans: her tablo için tsvector GIN index, fuzzy fallback için pg_trgm
 * GIN index. Tek sorguda paralel UNION ALL → 9 alt-plan.
 */
export async function genelArama(
  girdi: AramaSorgusu,
  kullaniciId: string,
): Promise<AramaSonucu[]> {
  const tsq = tsqueryyeCevir(girdi.sorgu);
  if (!tsq) return [];

  const erisim = await kullaniciErisimBilgisi(kullaniciId);
  const erisimliProjeIdleri = erisim.makam
    ? null // Makam: filtre yok
    : await kullanicininErisimliProjeIdleriniCek(kullaniciId, erisim.birimId);

  // Makam değilse ve erişebileceği proje yoksa, proje-bağlı tablolar boş döner.
  // Sadece kullanici/birim global aranabilir kalır.
  if (!erisim.makam && erisimliProjeIdleri && erisimliProjeIdleri.length === 0) {
    return aramaSadeceKullaniciBirim(tsq, girdi);
  }

  return aramaTumTablolar(tsq, girdi, erisim.makam, erisimliProjeIdleri ?? []);
}

/**
 * Kullanıcının erişebildiği proje ID'leri. `lib/yetki.ts` `canProje` mantığı
 * ile aynı (proje-yetkili / proje-birim / alt liste-yetkili / kart-yetkili
 * üzerinden miras). Tek sorguda toplanır.
 */
async function kullanicininErisimliProjeIdleriniCek(
  kullaniciId: string,
  birimId: string | null,
): Promise<string[]> {
  const projeler = await db.proje.findMany({
    where: {
      OR: [
        // Doğrudan proje yetkili
        { yetkililer: { some: { kullanici_id: kullaniciId } } },
        // Doğrudan proje birim (kullanıcının biriminin atandığı projeler)
        ...(birimId ? [{ birimler: { some: { birim_id: birimId } } }] : []),
        // Alt liste yetkili / liste birim
        {
          listeler: {
            some: {
              OR: [
                { yetkililer: { some: { kullanici_id: kullaniciId } } },
                ...(birimId ? [{ birimler: { some: { birim_id: birimId } } }] : []),
                // Kart yetkili / kart birim
                {
                  kartlar: {
                    some: {
                      OR: [
                        { yetkililer: { some: { kullanici_id: kullaniciId } } },
                        ...(birimId
                          ? [{ birimler: { some: { birim_id: birimId } } }]
                          : []),
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    select: { id: true },
  });
  return projeler.map((p) => p.id);
}

type HamSonuc = {
  tip: string;
  id: string;
  baslik: string;
  detay: string | null;
  rank: number;
  parent_a: string | null;
  parent_b: string | null;
};

/**
 * Tüm 9 tabloyu UNION ALL ile arar. Makam ise yetki filtresi uygulanmaz;
 * normal kullanıcı için proje_id IN (erisilebilir) clause'u var.
 */
async function aramaTumTablolar(
  tsq: string,
  girdi: AramaSorgusu,
  makam: boolean,
  erisilebilirProjeIdleri: string[],
): Promise<AramaSonucu[]> {
  // Makam: TRUE; aksi halde proje_id IN (...) — boşsa hiçbir kayıt eşleşmez.
  const projeFiltreSql = makam
    ? Prisma.sql`TRUE`
    : Prisma.sql`p.proje_id IN (${Prisma.join(erisilebilirProjeIdleri.map((id) => Prisma.sql`${id}::uuid`))})`;

  const kartProjeFiltreSql = makam
    ? Prisma.sql`TRUE`
    : Prisma.sql`l.proje_id IN (${Prisma.join(erisilebilirProjeIdleri.map((id) => Prisma.sql`${id}::uuid`))})`;

  // Yorum/Madde/Eklenti kart üzerinden bağlı; iki seviye join ile proje_id alınır.
  const yorumProjeFiltreSql = makam
    ? Prisma.sql`TRUE`
    : Prisma.sql`l2.proje_id IN (${Prisma.join(erisilebilirProjeIdleri.map((id) => Prisma.sql`${id}::uuid`))})`;

  const tipler = girdi.tipler ?? null;
  const tipDahilMi = (t: string) => !tipler || tipler.includes(t as never);

  const parcalar: Prisma.Sql[] = [];

  if (tipDahilMi("kart")) {
    parcalar.push(Prisma.sql`
      SELECT 'kart' AS tip, k.id::text AS id, k.baslik AS baslik,
             k.aciklama AS detay,
             ts_rank(k.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             l.proje_id::text AS parent_a, k.liste_id::text AS parent_b
      FROM "Kart" k
      INNER JOIN "Liste" l ON l.id = k.liste_id
      WHERE k.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND k.silindi_mi = FALSE AND k.arsiv_mi = FALSE
        AND ${kartProjeFiltreSql}
    `);
  }

  if (tipDahilMi("yorum")) {
    parcalar.push(Prisma.sql`
      SELECT 'yorum' AS tip, y.id::text AS id,
             LEFT(y.icerik, 200) AS baslik, NULL AS detay,
             ts_rank(y.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             y.kart_id::text AS parent_a, NULL AS parent_b
      FROM "Yorum" y
      INNER JOIN "Kart" k2 ON k2.id = y.kart_id
      INNER JOIN "Liste" l2 ON l2.id = k2.liste_id
      WHERE y.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND y.silindi_mi = FALSE
        AND ${yorumProjeFiltreSql}
    `);
  }

  if (tipDahilMi("madde")) {
    parcalar.push(Prisma.sql`
      SELECT 'madde' AS tip, m.id::text AS id, m.metin AS baslik, NULL AS detay,
             ts_rank(m.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             m.kontrol_listesi_id::text AS parent_a, kl.kart_id::text AS parent_b
      FROM "KontrolMaddesi" m
      INNER JOIN "KontrolListesi" kl ON kl.id = m.kontrol_listesi_id
      INNER JOIN "Kart" k3 ON k3.id = kl.kart_id
      INNER JOIN "Liste" l3 ON l3.id = k3.liste_id
      WHERE m.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND ${makam ? Prisma.sql`TRUE` : Prisma.sql`l3.proje_id IN (${Prisma.join(erisilebilirProjeIdleri.map((id) => Prisma.sql`${id}::uuid`))})`}
    `);
  }

  if (tipDahilMi("eklenti")) {
    parcalar.push(Prisma.sql`
      SELECT 'eklenti' AS tip, e.id::text AS id, e.ad AS baslik, NULL AS detay,
             ts_rank(e.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             e.kart_id::text AS parent_a, NULL AS parent_b
      FROM "Eklenti" e
      INNER JOIN "Kart" k4 ON k4.id = e.kart_id
      INNER JOIN "Liste" l4 ON l4.id = k4.liste_id
      WHERE e.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND e.silindi_mi = FALSE
        AND ${makam ? Prisma.sql`TRUE` : Prisma.sql`l4.proje_id IN (${Prisma.join(erisilebilirProjeIdleri.map((id) => Prisma.sql`${id}::uuid`))})`}
    `);
  }

  if (tipDahilMi("kullanici")) {
    parcalar.push(Prisma.sql`
      SELECT 'kullanici' AS tip, u.id::text AS id,
             u.ad || ' ' || u.soyad AS baslik,
             u.email AS detay,
             ts_rank(u.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             u.soyad AS parent_a, NULL AS parent_b
      FROM "Kullanici" u
      WHERE u.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND u.silindi_mi = FALSE
    `);
  }

  if (tipDahilMi("birim")) {
    parcalar.push(Prisma.sql`
      SELECT 'birim' AS tip, b.id::text AS id,
             coalesce(b.ad, b.kisa_ad, '') AS baslik,
             b.kisa_ad AS detay,
             ts_rank(b.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             NULL AS parent_a, NULL AS parent_b
      FROM "Birim" b
      WHERE b.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND b.silindi_mi = FALSE
    `);
  }

  if (tipDahilMi("etiket")) {
    parcalar.push(Prisma.sql`
      SELECT 'etiket' AS tip, et.id::text AS id, et.ad AS baslik, et.renk AS detay,
             ts_rank(et.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             et.proje_id::text AS parent_a, NULL AS parent_b
      FROM "Etiket" et
      WHERE et.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND ${makam ? Prisma.sql`TRUE` : Prisma.sql`et.proje_id IN (${Prisma.join(erisilebilirProjeIdleri.map((id) => Prisma.sql`${id}::uuid`))})`}
    `);
  }

  if (tipDahilMi("proje")) {
    parcalar.push(Prisma.sql`
      SELECT 'proje' AS tip, p.id::text AS id, p.ad AS baslik, p.aciklama AS detay,
             ts_rank(p.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             NULL AS parent_a, NULL AS parent_b
      FROM "Proje" p
      WHERE p.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND p.silindi_mi = FALSE
        AND ${projeFiltreSql.text === "TRUE" ? Prisma.sql`TRUE` : Prisma.sql`p.id IN (${Prisma.join(erisilebilirProjeIdleri.map((id) => Prisma.sql`${id}::uuid`))})`}
    `);
  }

  if (tipDahilMi("liste")) {
    parcalar.push(Prisma.sql`
      SELECT 'liste' AS tip, li.id::text AS id, li.ad AS baslik, NULL AS detay,
             ts_rank(li.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             li.proje_id::text AS parent_a, NULL AS parent_b
      FROM "Liste" li
      WHERE li.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND li.arsiv_mi = FALSE
        AND ${makam ? Prisma.sql`TRUE` : Prisma.sql`li.proje_id IN (${Prisma.join(erisilebilirProjeIdleri.map((id) => Prisma.sql`${id}::uuid`))})`}
    `);
  }

  if (parcalar.length === 0) return [];

  const birlesim = parcalar.reduce((acc, p, i) =>
    i === 0 ? p : Prisma.sql`${acc} UNION ALL ${p}`,
  );

  const limit = girdi.limit;
  const sorgu = Prisma.sql`
    ${birlesim}
    ORDER BY rank DESC
    LIMIT ${limit}
  `;

  const ham = await db.$queryRaw<HamSonuc[]>(sorgu);
  return hamSonucuTipliyeCevir(ham);
}

/**
 * Erişebileceği proje yoksa sadece global tabloları (Kullanici, Birim) ara.
 * Kullanıcı sistemde yeni — henüz proje atanmamış senaryosu.
 */
async function aramaSadeceKullaniciBirim(
  tsq: string,
  girdi: AramaSorgusu,
): Promise<AramaSonucu[]> {
  const tipler = girdi.tipler ?? null;
  const tipDahilMi = (t: string) => !tipler || tipler.includes(t as never);

  const parcalar: Prisma.Sql[] = [];

  if (tipDahilMi("kullanici")) {
    parcalar.push(Prisma.sql`
      SELECT 'kullanici' AS tip, u.id::text AS id,
             u.ad || ' ' || u.soyad AS baslik,
             u.email AS detay,
             ts_rank(u.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             u.soyad AS parent_a, NULL AS parent_b
      FROM "Kullanici" u
      WHERE u.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND u.silindi_mi = FALSE
    `);
  }
  if (tipDahilMi("birim")) {
    parcalar.push(Prisma.sql`
      SELECT 'birim' AS tip, b.id::text AS id,
             coalesce(b.ad, b.kisa_ad, '') AS baslik,
             b.kisa_ad AS detay,
             ts_rank(b.arama_vektoru, to_tsquery('pusula_turkish', ${tsq})) AS rank,
             NULL AS parent_a, NULL AS parent_b
      FROM "Birim" b
      WHERE b.arama_vektoru @@ to_tsquery('pusula_turkish', ${tsq})
        AND b.silindi_mi = FALSE
    `);
  }

  if (parcalar.length === 0) return [];

  const birlesim = parcalar.reduce((acc, p, i) =>
    i === 0 ? p : Prisma.sql`${acc} UNION ALL ${p}`,
  );
  const ham = await db.$queryRaw<HamSonuc[]>(Prisma.sql`
    ${birlesim} ORDER BY rank DESC LIMIT ${girdi.limit}
  `);
  return hamSonucuTipliyeCevir(ham);
}

/** Ham SQL sonucunu typed AramaSonucu[]'a çevirir (parent_a/parent_b yorumlama). */
function hamSonucuTipliyeCevir(ham: HamSonuc[]): AramaSonucu[] {
  return ham.map((r): AramaSonucu => {
    const temel = {
      id: r.id,
      baslik: r.baslik,
      detay: r.detay,
      rank: Number(r.rank),
    };
    switch (r.tip) {
      case "kart":
        return { ...temel, tip: "kart", proje_id: r.parent_a!, liste_id: r.parent_b! };
      case "yorum":
        return { ...temel, tip: "yorum", kart_id: r.parent_a! };
      case "madde":
        return {
          ...temel,
          tip: "madde",
          kontrol_listesi_id: r.parent_a!,
          kart_id: r.parent_b!,
        };
      case "eklenti":
        return { ...temel, tip: "eklenti", kart_id: r.parent_a! };
      case "kullanici":
        return {
          ...temel,
          tip: "kullanici",
          soyad: r.parent_a ?? "",
          email: r.detay ?? "",
        };
      case "birim":
        return { ...temel, tip: "birim" };
      case "etiket":
        return { ...temel, tip: "etiket", proje_id: r.parent_a!, renk: r.detay ?? "" };
      case "proje":
        return { ...temel, tip: "proje" };
      case "liste":
        return { ...temel, tip: "liste", proje_id: r.parent_a! };
      default:
        throw new Error(`Bilinmeyen arama sonucu tipi: ${r.tip}`);
    }
  });
}
