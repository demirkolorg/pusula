"use server";

import type { BirimTipi, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { eylem } from "@/lib/action-wrapper";
import { yetkiZorunlu, IZIN_KODLARI } from "@/lib/permissions";
import { aramaBigIntIdleri } from "@/lib/arama";
import { birimGorunenAd } from "@/lib/constants/birim";
import {
  mentionKisiMapiGetir,
  mentionliMetniGorunurYap,
} from "@/lib/mention-server";
import { denetimListeSemasi } from "./schemas";

export type DenetimSatiri = {
  id: string;
  zaman: Date;
  islem: string;
  kaynak_tip: string;
  kaynak_id: string | null;
  kaynak_etiket: string | null;
  kullanici_id: string | null;
  kullanici_ad: string | null;
  ip: string | null;
  http_yol: string | null;
  http_metod: string | null;
  request_id: string | null;
  diff: unknown;
  eski_veri: unknown;
  yeni_veri: unknown;
  meta: unknown;
};

type KaynakEtiketGirdi = {
  kaynak_tip: string;
  kaynak_id: string | null;
  eski_veri: unknown;
  yeni_veri: unknown;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function etiketAnahtari(tip: string, id: string): string {
  return `${tip}:${id}`;
}

function jsonKayit(deger: unknown): Record<string, unknown> | null {
  if (!deger || typeof deger !== "object" || Array.isArray(deger)) return null;
  return deger as Record<string, unknown>;
}

function kaynakVerisi(satir: KaynakEtiketGirdi): Record<string, unknown> | null {
  return jsonKayit(satir.yeni_veri) ?? jsonKayit(satir.eski_veri);
}

function jsonMetin(
  veri: Record<string, unknown> | null,
  alan: string,
): string | null {
  const deger = veri?.[alan];
  if (typeof deger === "string") return deger;
  if (typeof deger === "number" || typeof deger === "bigint") return String(deger);
  return null;
}

function kisalt(metin: string, uzunluk = 90): string {
  return metin.length <= uzunluk ? metin : `${metin.slice(0, uzunluk - 1)}…`;
}

function kullaniciEtiketi(k: { ad: string; soyad: string }): string {
  return `${k.ad} ${k.soyad}`.trim();
}

function birimEtiketi(b: {
  ad: string | null;
  kisa_ad: string | null;
  tip: BirimTipi;
}): string {
  return b.kisa_ad ?? birimGorunenAd({ ad: b.ad, tip: b.tip });
}

function uuidIdleri(idler: ReadonlySet<string> | undefined): string[] {
  return Array.from(idler ?? []).filter((id) => UUID_REGEX.test(id));
}

function bigintIdleri(idler: ReadonlySet<string> | undefined): bigint[] {
  const sonuc: bigint[] = [];
  for (const id of idler ?? []) {
    try {
      sonuc.push(BigInt(id));
    } catch {
      // UUID kaynaklı olmayan id alanları BigInt tablolarda yok sayılır.
    }
  }
  return sonuc;
}

function kaynakIdSetleri(
  satirlar: ReadonlyArray<KaynakEtiketGirdi>,
): Map<string, Set<string>> {
  const sonuc = new Map<string, Set<string>>();
  for (const satir of satirlar) {
    if (!satir.kaynak_id) continue;
    const set = sonuc.get(satir.kaynak_tip) ?? new Set<string>();
    set.add(satir.kaynak_id);
    sonuc.set(satir.kaynak_tip, set);
  }
  return sonuc;
}

type ReferansIdleri = {
  kullanici: Set<string>;
  birim: Set<string>;
  proje: Set<string>;
  liste: Set<string>;
  kart: Set<string>;
  etiket: Set<string>;
  rol: Set<string>;
  izin: Set<string>;
  davet: Set<string>;
  kontrolListesi: Set<string>;
};

function referansIdleriniTopla(
  satirlar: ReadonlyArray<KaynakEtiketGirdi>,
): ReferansIdleri {
  const ref: ReferansIdleri = {
    kullanici: new Set(),
    birim: new Set(),
    proje: new Set(),
    liste: new Set(),
    kart: new Set(),
    etiket: new Set(),
    rol: new Set(),
    izin: new Set(),
    davet: new Set(),
    kontrolListesi: new Set(),
  };
  const kullaniciAlanlari = new Set([
    "kullanici_id",
    "yazan_id",
    "yukleyen_id",
    "tamamlayan_id",
    "tamamlanma_oneren_id",
    "atanan_id",
    "olusturan_id",
    "davet_eden_id",
    "alici_id",
    "ureten_id",
    "onaylayan_id",
  ]);

  for (const satir of satirlar) {
    for (const veri of [jsonKayit(satir.eski_veri), jsonKayit(satir.yeni_veri)]) {
      if (!veri) continue;
      for (const [alan, deger] of Object.entries(veri)) {
        if (typeof deger !== "string" || !UUID_REGEX.test(deger)) continue;
        if (kullaniciAlanlari.has(alan)) ref.kullanici.add(deger);
        else if (alan === "birim_id") ref.birim.add(deger);
        else if (alan === "proje_id") ref.proje.add(deger);
        else if (alan === "liste_id" || alan === "arsiv_oncesi_liste_id") {
          ref.liste.add(deger);
        } else if (alan === "kart_id") ref.kart.add(deger);
        else if (alan === "etiket_id") ref.etiket.add(deger);
        else if (alan === "rol_id") ref.rol.add(deger);
        else if (alan === "izin_id") ref.izin.add(deger);
        else if (alan === "davet_id") ref.davet.add(deger);
        else if (alan === "kontrol_listesi_id") ref.kontrolListesi.add(deger);
      }
    }
  }

  return ref;
}

function birlesikEtiket(
  birincil: string | null | undefined,
  ikincil: string | null | undefined,
): string | null {
  if (birincil && ikincil) return `${birincil} - ${ikincil}`;
  return birincil ?? ikincil ?? null;
}

function veriEtiketi(veri: Record<string, unknown> | null): string | null {
  for (const alan of ["baslik", "ad", "metin", "icerik", "email", "mesaj", "kod"]) {
    const deger = jsonMetin(veri, alan);
    if (deger) return kisalt(deger);
  }
  return null;
}

async function kaynakEtiketleriOlustur(
  satirlar: ReadonlyArray<KaynakEtiketGirdi>,
): Promise<Array<string | null>> {
  if (satirlar.length === 0) return [];
  const kaynakIdleri = kaynakIdSetleri(satirlar);
  const ref = referansIdleriniTopla(satirlar);

  const projeIdleri = [
    ...uuidIdleri(kaynakIdleri.get("Proje")),
    ...uuidIdleri(kaynakIdleri.get("ProjeSablonu")),
    ...uuidIdleri(ref.proje),
  ];
  const listeIdleri = [
    ...uuidIdleri(kaynakIdleri.get("Liste")),
    ...uuidIdleri(ref.liste),
  ];
  const kartIdleri = [
    ...uuidIdleri(kaynakIdleri.get("Kart")),
    ...uuidIdleri(ref.kart),
  ];
  const kullaniciIdleri = [
    ...uuidIdleri(kaynakIdleri.get("Kullanici")),
    ...uuidIdleri(ref.kullanici),
  ];
  const birimIdleri = [
    ...uuidIdleri(kaynakIdleri.get("Birim")),
    ...uuidIdleri(ref.birim),
  ];
  const rolIdleri = [
    ...uuidIdleri(kaynakIdleri.get("Rol")),
    ...uuidIdleri(ref.rol),
  ];
  const izinIdleri = [
    ...uuidIdleri(kaynakIdleri.get("Izin")),
    ...uuidIdleri(ref.izin),
  ];
  const davetIdleri = [
    ...uuidIdleri(kaynakIdleri.get("DavetTokeni")),
    ...uuidIdleri(ref.davet),
  ];
  const kontrolListesiIdleri = [
    ...uuidIdleri(kaynakIdleri.get("KontrolListesi")),
    ...uuidIdleri(ref.kontrolListesi),
  ];

  const [
    projeler,
    sablonlar,
    listeler,
    kartlar,
    yorumlar,
    eklentiler,
    kontrolListeleri,
    kontrolMaddeleri,
    etiketler,
    kullanicilar,
    birimler,
    roller,
    izinler,
    davetler,
    bildirimler,
    mailKuyrugu,
  ] = await Promise.all([
    projeIdleri.length
      ? db.proje.findMany({
          where: { id: { in: Array.from(new Set(projeIdleri)) } },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
    uuidIdleri(kaynakIdleri.get("ProjeSablonu")).length
      ? db.projeSablonu.findMany({
          where: { id: { in: uuidIdleri(kaynakIdleri.get("ProjeSablonu")) } },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
    listeIdleri.length
      ? db.liste.findMany({
          where: { id: { in: Array.from(new Set(listeIdleri)) } },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
    kartIdleri.length
      ? db.kart.findMany({
          where: { id: { in: Array.from(new Set(kartIdleri)) } },
          select: { id: true, baslik: true },
        })
      : Promise.resolve([]),
    uuidIdleri(kaynakIdleri.get("Yorum")).length
      ? db.yorum.findMany({
          where: { id: { in: uuidIdleri(kaynakIdleri.get("Yorum")) } },
          select: { id: true, icerik: true },
        })
      : Promise.resolve([]),
    uuidIdleri(kaynakIdleri.get("Eklenti")).length
      ? db.eklenti.findMany({
          where: { id: { in: uuidIdleri(kaynakIdleri.get("Eklenti")) } },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
    kontrolListesiIdleri.length
      ? db.kontrolListesi.findMany({
          where: { id: { in: Array.from(new Set(kontrolListesiIdleri)) } },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
    uuidIdleri(kaynakIdleri.get("KontrolMaddesi")).length
      ? db.kontrolMaddesi.findMany({
          where: { id: { in: uuidIdleri(kaynakIdleri.get("KontrolMaddesi")) } },
          select: { id: true, metin: true },
        })
      : Promise.resolve([]),
    uuidIdleri(kaynakIdleri.get("Etiket")).concat(uuidIdleri(ref.etiket)).length
      ? db.etiket.findMany({
          where: {
            id: {
              in: Array.from(
                new Set([
                  ...uuidIdleri(kaynakIdleri.get("Etiket")),
                  ...uuidIdleri(ref.etiket),
                ]),
              ),
            },
          },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
    kullaniciIdleri.length
      ? db.kullanici.findMany({
          where: { id: { in: Array.from(new Set(kullaniciIdleri)) } },
          select: { id: true, ad: true, soyad: true },
        })
      : Promise.resolve([]),
    birimIdleri.length
      ? db.birim.findMany({
          where: { id: { in: Array.from(new Set(birimIdleri)) } },
          select: { id: true, ad: true, kisa_ad: true, tip: true },
        })
      : Promise.resolve([]),
    rolIdleri.length
      ? db.rol.findMany({
          where: { id: { in: Array.from(new Set(rolIdleri)) } },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
    izinIdleri.length
      ? db.izin.findMany({
          where: { id: { in: Array.from(new Set(izinIdleri)) } },
          select: { id: true, ad: true },
        })
      : Promise.resolve([]),
    davetIdleri.length
      ? db.davetTokeni.findMany({
          where: { id: { in: Array.from(new Set(davetIdleri)) } },
          select: { id: true, email: true },
        })
      : Promise.resolve([]),
    bigintIdleri(kaynakIdleri.get("Bildirim")).length
      ? db.bildirim.findMany({
          where: { id: { in: bigintIdleri(kaynakIdleri.get("Bildirim")) } },
          select: { id: true, baslik: true },
        })
      : Promise.resolve([]),
    bigintIdleri(kaynakIdleri.get("BildirimMailKuyrugu")).length
      ? db.bildirimMailKuyrugu.findMany({
          where: {
            id: { in: bigintIdleri(kaynakIdleri.get("BildirimMailKuyrugu")) },
          },
          select: { id: true, baslik: true },
        })
      : Promise.resolve([]),
  ]);

  const projeMap = new Map(projeler.map((p) => [p.id, p.ad]));
  const listeMap = new Map(listeler.map((l) => [l.id, l.ad]));
  const kartMap = new Map(kartlar.map((k) => [k.id, k.baslik]));
  const kullaniciMap = new Map(
    kullanicilar.map((k) => [k.id, kullaniciEtiketi(k)]),
  );
  const birimMap = new Map(birimler.map((b) => [b.id, birimEtiketi(b)]));
  const rolMap = new Map(roller.map((r) => [r.id, r.ad]));
  const izinMap = new Map(izinler.map((i) => [i.id, i.ad]));
  const davetMap = new Map(davetler.map((d) => [d.id, d.email]));
  const kontrolListesiMap = new Map(kontrolListeleri.map((k) => [k.id, k.ad]));
  const etiketMap = new Map(etiketler.map((e) => [e.id, e.ad]));
  const yorumMentionKisiMap = await mentionKisiMapiGetir(
    yorumlar.map((y) => y.icerik),
  );

  const dogrudan = new Map<string, string>();
  for (const p of projeler) dogrudan.set(etiketAnahtari("Proje", p.id), p.ad);
  for (const p of sablonlar) {
    dogrudan.set(etiketAnahtari("ProjeSablonu", p.id), p.ad);
  }
  for (const l of listeler) dogrudan.set(etiketAnahtari("Liste", l.id), l.ad);
  for (const k of kartlar) dogrudan.set(etiketAnahtari("Kart", k.id), k.baslik);
  for (const y of yorumlar) {
    dogrudan.set(
      etiketAnahtari("Yorum", y.id),
      kisalt(mentionliMetniGorunurYap(y.icerik, yorumMentionKisiMap)),
    );
  }
  for (const e of eklentiler) dogrudan.set(etiketAnahtari("Eklenti", e.id), e.ad);
  for (const k of kontrolListeleri) {
    dogrudan.set(etiketAnahtari("KontrolListesi", k.id), k.ad);
  }
  for (const k of kontrolMaddeleri) {
    dogrudan.set(etiketAnahtari("KontrolMaddesi", k.id), k.metin);
  }
  for (const e of etiketler) dogrudan.set(etiketAnahtari("Etiket", e.id), e.ad);
  for (const k of kullanicilar) {
    dogrudan.set(etiketAnahtari("Kullanici", k.id), kullaniciEtiketi(k));
  }
  for (const b of birimler) dogrudan.set(etiketAnahtari("Birim", b.id), birimEtiketi(b));
  for (const r of roller) dogrudan.set(etiketAnahtari("Rol", r.id), r.ad);
  for (const i of izinler) dogrudan.set(etiketAnahtari("Izin", i.id), i.ad);
  for (const d of davetler) {
    dogrudan.set(etiketAnahtari("DavetTokeni", d.id), d.email);
  }
  for (const b of bildirimler) {
    dogrudan.set(etiketAnahtari("Bildirim", b.id.toString()), b.baslik);
  }
  for (const b of mailKuyrugu) {
    dogrudan.set(
      etiketAnahtari("BildirimMailKuyrugu", b.id.toString()),
      b.baslik,
    );
  }

  return satirlar.map((satir) => {
    if (satir.kaynak_id) {
      const etiket = dogrudan.get(etiketAnahtari(satir.kaynak_tip, satir.kaynak_id));
      if (etiket) return etiket;
    }

    const veri = kaynakVerisi(satir);
    const kullanici = kullaniciMap.get(jsonMetin(veri, "kullanici_id") ?? "");
    const birim = birimMap.get(jsonMetin(veri, "birim_id") ?? "");
    const proje = projeMap.get(jsonMetin(veri, "proje_id") ?? "");
    const liste = listeMap.get(jsonMetin(veri, "liste_id") ?? "");
    const kart = kartMap.get(jsonMetin(veri, "kart_id") ?? "");
    const etiket = etiketMap.get(jsonMetin(veri, "etiket_id") ?? "");
    const rol = rolMap.get(jsonMetin(veri, "rol_id") ?? "");
    const izin = izinMap.get(jsonMetin(veri, "izin_id") ?? "");
    const davet = davetMap.get(jsonMetin(veri, "davet_id") ?? "");
    const kontrolListesi = kontrolListesiMap.get(
      jsonMetin(veri, "kontrol_listesi_id") ?? "",
    );

    switch (satir.kaynak_tip) {
      case "ProjeYetkilisi":
        return birlesikEtiket(kullanici, proje);
      case "ListeYetkilisi":
        return birlesikEtiket(kullanici, liste);
      case "KartYetkilisi":
        return birlesikEtiket(kullanici, kart);
      case "ProjeBirimi":
        return birlesikEtiket(birim, proje);
      case "ListeBirimi":
        return birlesikEtiket(birim, liste);
      case "KartBirimi":
        return birlesikEtiket(birim, kart);
      case "KartEtiket":
        return birlesikEtiket(etiket, kart);
      case "KullaniciRol":
        return birlesikEtiket(kullanici, rol);
      case "RolIzin":
        return birlesikEtiket(rol, izin);
      case "DavetProjeBaglami":
        return birlesikEtiket(davet, proje);
      case "DavetListeBaglami":
        return birlesikEtiket(davet, liste);
      case "DavetKartBaglami":
        return birlesikEtiket(davet, kart);
      case "KontrolMaddesi":
        return birlesikEtiket(veriEtiketi(veri), kontrolListesi);
      default:
        return veriEtiketi(veri);
    }
  });
}

export const denetimListele = eylem({
  ad: "denetim:liste",
  girdi: denetimListeSemasi,
  calistir: async (girdi, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.DENETIM_OKU);

    const where: Prisma.AktiviteLoguWhereInput = {};
    if (girdi.islem) where.islem = girdi.islem;
    if (girdi.kaynak_tip) where.kaynak_tip = girdi.kaynak_tip;
    if (girdi.kullanici_id) where.kullanici_id = girdi.kullanici_id;
    if (girdi.baslangic || girdi.bitis) {
      where.zaman = {};
      if (girdi.baslangic) where.zaman.gte = new Date(girdi.baslangic);
      if (girdi.bitis) where.zaman.lte = new Date(girdi.bitis);
    }
    if (girdi.arama) {
      const idler = await aramaBigIntIdleri({
        tablo: "aktivite_logu",
        sutunlar: ["kaynak_id", "kaynak_tip", "http_yol", "request_id"],
        arama: girdi.arama,
      });
      if (idler !== null) {
        if (idler.length === 0) return { kayitlar: [], toplam: 0 };
        where.id = { in: idler };
      }
    }

    const [toplam, satirlar] = await db.$transaction([
      db.aktiviteLogu.count({ where }),
      db.aktiviteLogu.findMany({
        where,
        orderBy: { zaman: "desc" },
        skip: (girdi.sayfa - 1) * girdi.sayfaBoyutu,
        take: girdi.sayfaBoyutu,
      }),
    ]);

    const kullaniciIdleri = Array.from(
      new Set(
        satirlar
          .map((s) => s.kullanici_id)
          .filter((v): v is string => !!v),
      ),
    );
    const kullanicilar =
      kullaniciIdleri.length > 0
        ? await db.kullanici.findMany({
            where: { id: { in: kullaniciIdleri } },
            select: { id: true, ad: true, soyad: true, email: true },
          })
        : [];
    const kullaniciMap = new Map(
      kullanicilar.map((k) => [k.id, `${k.ad} ${k.soyad}`]),
    );
    const kaynakEtiketleri = await kaynakEtiketleriOlustur(satirlar);

    const kayitlar: DenetimSatiri[] = satirlar.map((s, index) => ({
      id: s.id.toString(),
      zaman: s.zaman,
      islem: s.islem,
      kaynak_tip: s.kaynak_tip,
      kaynak_id: s.kaynak_id,
      kaynak_etiket: kaynakEtiketleri[index] ?? null,
      kullanici_id: s.kullanici_id,
      kullanici_ad: s.kullanici_id
        ? (kullaniciMap.get(s.kullanici_id) ?? null)
        : null,
      ip: s.ip,
      http_yol: s.http_yol,
      http_metod: s.http_metod,
      request_id: s.request_id,
      diff: s.diff,
      eski_veri: s.eski_veri,
      yeni_veri: s.yeni_veri,
      meta: s.meta,
    }));

    return { kayitlar, toplam };
  },
});

export const kaynakTipleriniGetir = eylem({
  ad: "denetim:kaynak-tipleri",
  calistir: async (_g, ctx) => {
    await yetkiZorunlu(ctx.oturum?.kullaniciId, IZIN_KODLARI.DENETIM_OKU);
    const tipler = await db.aktiviteLogu.findMany({
      distinct: ["kaynak_tip"],
      select: { kaynak_tip: true },
      orderBy: { kaynak_tip: "asc" },
      take: 100,
    });
    return tipler.map((t) => t.kaynak_tip);
  },
});
