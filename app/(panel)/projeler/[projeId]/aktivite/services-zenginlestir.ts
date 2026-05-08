// Sprint 3 / S3-1 — Aktivite servisi parça dosyası: zenginleştirme orchestrator.
// ADR-0032 mega dosya bölmesi.
//
// İçerik: zenginlestirVeOzetle — ham AktiviteLogu kayıtlarını UI'ya hazır
// AktiviteOzeti'ye çevirir. ID setlerini toplar (kullanıcı, etiket, atanan,
// birim, liste, eklenti, bağlam kart/liste/proje), paralel fetch eder, map'leri
// kurar ve aktiviteOzetle'yi her kayıt için çağırır.

import { db } from "@/lib/db";
import {
  mentionKisiMapiGetir,
} from "@/lib/mention-server";
import {
  type AktiviteOzeti,
  type BaglamMaplari,
  type IdMaplar,
  birimGoruntu,
  jsonAlan,
} from "./services-ortak";
import { aktiviteOzetle } from "./services-ozet";

// Ortak: ham aktivitelerden id setlerini topla, join'le ve özetle.
// kart + proje servisleri arasında DRY kazanımı (id toplama + map kurulum
// pattern'i tek noktada).
// Public — ana sayfa "Son Aktiviteler" widget'ı da bu fonksiyonu kullanır:
// kullanıcı bağlamına göre filtrelenmiş ham audit kayıtlarını user-friendly
// `AktiviteOzeti[]`'na çevirir (mesaj + diff + baglam çözümü).
export async function zenginlestirVeOzetle(
  ham: Array<{
    id: bigint;
    zaman: Date;
    kullanici_id: string | null;
    islem: string;
    kaynak_tip: string;
    kaynak_id: string | null;
    yeni_veri: unknown;
    eski_veri: unknown;
    diff: unknown;
  }>,
): Promise<AktiviteOzeti[]> {
  const kullaniciIdler = Array.from(
    new Set(ham.map((a) => a.kullanici_id).filter((x): x is string => !!x)),
  );
  const kullanicilar = kullaniciIdler.length
    ? await db.kullanici.findMany({
        where: { id: { in: kullaniciIdler } },
        select: { id: true, ad: true, soyad: true },
      })
    : [];
  const kullaniciMap = new Map(kullanicilar.map((k) => [k.id, k]));

  const etiketIdler = new Set<string>();
  const atananIdler = new Set<string>();
  const birimIdler = new Set<string>();
  const listeIdler = new Set<string>();
  const eklentiIdler = new Set<string>();
  const yorumMetinleri: string[] = [];
  // Bağlam ID setleri — proje/kart/liste/kontrol-listesi adlarını çekmek için.
  const baglamKartIdler = new Set<string>();
  const baglamListeIdler = new Set<string>();
  const baglamKlIdler = new Set<string>();
  const baglamProjeIdler = new Set<string>();
  for (const a of ham) {
    if (a.kaynak_tip === "KartEtiket") {
      const ePost = (a.yeni_veri as { etiket_id?: string } | null)?.etiket_id;
      const ePre = (a.eski_veri as { etiket_id?: string } | null)?.etiket_id;
      if (ePost) etiketIdler.add(ePost);
      if (ePre) etiketIdler.add(ePre);
    }
    if (
      a.kaynak_tip === "KartYetkilisi" ||
      a.kaynak_tip === "ProjeYetkilisi" ||
      a.kaynak_tip === "ListeYetkilisi"
    ) {
      const uPost = (a.yeni_veri as { kullanici_id?: string } | null)
        ?.kullanici_id;
      const uPre = (a.eski_veri as { kullanici_id?: string } | null)
        ?.kullanici_id;
      if (uPost) atananIdler.add(uPost);
      if (uPre) atananIdler.add(uPre);
    }
    if (
      a.kaynak_tip === "KartBirimi" ||
      a.kaynak_tip === "ProjeBirimi" ||
      a.kaynak_tip === "ListeBirimi"
    ) {
      const kPost = (a.yeni_veri as { birim_id?: string } | null)?.birim_id;
      const kPre = (a.eski_veri as { birim_id?: string } | null)?.birim_id;
      if (kPost) birimIdler.add(kPost);
      if (kPre) birimIdler.add(kPre);
    }
    const diff = a.diff as Record<string, { eski: unknown; yeni: unknown }> | null;
    if (diff) {
      const idAlan = (k: string, set: Set<string>) => {
        const e = diff[k]?.eski;
        const y = diff[k]?.yeni;
        if (typeof e === "string") set.add(e);
        if (typeof y === "string") set.add(y);
      };
      idAlan("liste_id", listeIdler);
      idAlan("atanan_id", atananIdler);
      idAlan("tamamlayan_id", atananIdler);
      idAlan("kapak_dosya_id", eklentiIdler);
    }
    if (a.kaynak_tip === "Yorum") {
      const icerik =
        jsonAlan<string>(a.yeni_veri, "icerik") ??
        jsonAlan<string>(a.eski_veri, "icerik");
      if (icerik) yorumMetinleri.push(icerik);
    }

    // Bağlam çıkarımı — her aktivitenin "hangi liste, hangi kart" olduğunu
    // ileride join'leyebilmek için ID'leri topla.
    if (a.kaynak_tip === "Kart" && a.kaynak_id) {
      baglamKartIdler.add(a.kaynak_id);
    }
    if (a.kaynak_tip === "Liste" && a.kaynak_id) {
      baglamListeIdler.add(a.kaynak_id);
    }
    if (
      a.kaynak_tip === "Yorum" ||
      a.kaynak_tip === "Eklenti" ||
      // Sprint 2 / S2-15 — ADR-0028: yeni Dosya kayıtları kaynak_tip="Dosya"
      // ile geliyor; bağlam çıkarımı eskisinin yanında çalışmalı.
      a.kaynak_tip === "Dosya" ||
      a.kaynak_tip === "KontrolListesi" ||
      a.kaynak_tip === "KartEtiket" ||
      a.kaynak_tip === "KartYetkilisi" ||
      a.kaynak_tip === "KartBirimi"
    ) {
      const kid =
        (a.yeni_veri as { kart_id?: string } | null)?.kart_id ??
        (a.eski_veri as { kart_id?: string } | null)?.kart_id;
      if (kid) baglamKartIdler.add(kid);
    }
    if (a.kaynak_tip === "KontrolMaddesi") {
      const klid =
        (a.yeni_veri as { kontrol_listesi_id?: string } | null)
          ?.kontrol_listesi_id ??
        (a.eski_veri as { kontrol_listesi_id?: string } | null)
          ?.kontrol_listesi_id;
      if (klid) baglamKlIdler.add(klid);
    }
    if (a.kaynak_tip === "ListeYetkilisi" || a.kaynak_tip === "ListeBirimi") {
      const lid =
        (a.yeni_veri as { liste_id?: string } | null)?.liste_id ??
        (a.eski_veri as { liste_id?: string } | null)?.liste_id;
      if (lid) baglamListeIdler.add(lid);
    }
    // Proje düzeyi kayıtlar — proje_id JSON path
    if (a.kaynak_tip === "Proje" && a.kaynak_id) {
      baglamProjeIdler.add(a.kaynak_id);
    }
    if (
      a.kaynak_tip === "ProjeYetkilisi" ||
      a.kaynak_tip === "ProjeBirimi" ||
      a.kaynak_tip === "Etiket"
    ) {
      const pid =
        (a.yeni_veri as { proje_id?: string } | null)?.proje_id ??
        (a.eski_veri as { proje_id?: string } | null)?.proje_id;
      if (pid) baglamProjeIdler.add(pid);
    }
  }

  // KontrolMaddesi'ler için kontrol_listesi → kart_id eşleşmesi:
  // önce ilgili KontrolListesi'leri çekerek kart_id'leri öğren, sonra
  // o kart_id'leri baglamKartIdler'a ekle (kart adını da çekebilelim).
  const kontrolListesiKartMap = new Map<string, string>();
  if (baglamKlIdler.size > 0) {
    const klKayitlar = await db.kontrolListesi.findMany({
      where: { id: { in: Array.from(baglamKlIdler) } },
      select: { id: true, kart_id: true },
    });
    for (const kl of klKayitlar) {
      kontrolListesiKartMap.set(kl.id, kl.kart_id);
      baglamKartIdler.add(kl.kart_id);
    }
  }

  // Bağlam liste ID'lerini, kartların liste_id'leriyle birleştirmeden
  // önce kartları çekmemiz gerek. Önce kartlar, sonra kartın liste_id
  // dahil edip o ID'leri de listeIdler'a ekle ve listeleri çek.
  const baglamKartlar =
    baglamKartIdler.size > 0
      ? await db.kart.findMany({
          where: { id: { in: Array.from(baglamKartIdler) } },
          select: { id: true, baslik: true, liste_id: true },
        })
      : [];
  for (const k of baglamKartlar) {
    baglamListeIdler.add(k.liste_id);
  }

  const [
    etiketler,
    atananlar,
    birimler,
    listeler,
    eklentiAdlar,
    baglamListeler,
    yorumMentionKisiMap,
  ] = await Promise.all([
    etiketIdler.size > 0
      ? db.etiket.findMany({
          where: { id: { in: Array.from(etiketIdler) } },
          select: { id: true, ad: true, renk: true },
        })
      : Promise.resolve([]),
    atananIdler.size > 0
      ? db.kullanici.findMany({
          where: { id: { in: Array.from(atananIdler) } },
          select: { id: true, ad: true, soyad: true },
        })
      : Promise.resolve([]),
    birimIdler.size > 0
      ? db.birim.findMany({
          where: { id: { in: Array.from(birimIdler) } },
          select: { id: true, ad: true, kisa_ad: true, tip: true },
        })
      : Promise.resolve([]),
    listeIdler.size > 0
      ? db.liste.findMany({
          where: { id: { in: Array.from(listeIdler) } },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
    // Sprint 2 / S2-15 — ADR-0028 F8/F9: Eklenti read-only, kart kapak
    // dosya id'leri Dosya tablosunda. Backfill (prisma/scripts/
    // backfill-eklenti-dosya.ts) ile eski Eklenti id'leri Dosya'da da
    // mevcut → tek lookup yeter.
    eklentiIdler.size > 0
      ? db.dosya.findMany({
          where: { id: { in: Array.from(eklentiIdler) } },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
    baglamListeIdler.size > 0
      ? db.liste.findMany({
          where: { id: { in: Array.from(baglamListeIdler) } },
          select: { id: true, ad: true, proje_id: true },
        })
      : Promise.resolve([]),
    mentionKisiMapiGetir(yorumMetinleri),
  ]);

  // Bağlam listelerinden çıkan proje_id'leri proje fetch setine ekle ve
  // proje kayıtlarını çek (kart→liste→proje zinciri için).
  for (const l of baglamListeler) {
    baglamProjeIdler.add(l.proje_id);
  }
  const baglamProjeler =
    baglamProjeIdler.size > 0
      ? await db.proje.findMany({
          where: { id: { in: Array.from(baglamProjeIdler) } },
          select: { id: true, ad: true },
        })
      : [];

  const etiketMap = new Map(etiketler.map((e) => [e.id, e]));
  const atananMap = new Map(atananlar.map((u) => [u.id, u]));
  const birimMap = new Map(
    birimler.map((k) => [k.id, birimGoruntu(k)] as const),
  );
  const listeMap = new Map(listeler.map((l) => [l.id, l.ad] as const));
  const eklentiAdMap = new Map(
    eklentiAdlar.map((e) => [e.id, e.ad] as const),
  );

  const idMaplar: IdMaplar = {
    liste: listeMap,
    kullanici: new Map(atananlar.map((u) => [u.id, `${u.ad} ${u.soyad}`])),
    eklenti: eklentiAdMap,
    birim: birimMap,
  };

  const baglamMaplari: BaglamMaplari = {
    kart: new Map(baglamKartlar.map((k) => [k.id, k])),
    liste: new Map(baglamListeler.map((l) => [l.id, l])),
    proje: new Map(baglamProjeler.map((p) => [p.id, p])),
    kontrolListesi: kontrolListesiKartMap,
  };

  return ham.map((a) =>
    aktiviteOzetle(
      a,
      kullaniciMap,
      etiketMap,
      atananMap,
      birimMap,
      idMaplar,
      baglamMaplari,
      yorumMentionKisiMap,
    ),
  );
}
