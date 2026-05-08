// Pusula seed orchestrator.
// Veri tanımları prisma/seed/ altındaki tematik modüllerde — bu dosya sadece
// orkestrasyon yapar (temizle → roller → birimler → kullanıcılar → projeler → destek).

import {
  ListeTipi,
  Prisma,
  PrismaClient,
  type BirimTipi,
  type IzinKategorisi,
} from "@prisma/client";
import argon2 from "argon2";
import { BIRIM_TIP_KATEGORI } from "../lib/constants/birim";
import { MENTION_UUID_REGEX } from "../lib/mention-format";
import {
  IZIN_ALT_KATEGORI,
  IZIN_KATEGORI,
  IZIN_TANIMLARI,
  TUM_IZIN_KODLARI,
  VARSAYILAN_ROL_IZINLERI,
  type IzinKodu,
} from "../lib/permissions-katalog";
import { siraSonuna } from "../lib/sira";

import { metinTiptapDokumana, tiptapDokumaniMetne } from "../lib/tiptap";

import { BIRIMLER } from "./seed/birimler";
import { destekVerileriniYukle } from "./seed/destek";
import { KULLANICILAR } from "./seed/kullanicilar";
import { PROJELER } from "./seed/projeler";
import {
  IL,
  ILCE,
  PAROLA,
  VARSAYILAN_ETIKETLER,
  type BirimAnahtar,
  type EtiketKayit,
  type Idli,
  type KartSeed,
  type KullaniciAnahtar,
  type KullaniciKayit,
  type ProjeSeed,
  type SeedCtx,
} from "./seed/tipler";
import { al, gunEkle, siraUretici } from "./seed/yardimcilar";

const db = new PrismaClient();

const ROLLER = [
  { kod: "SUPER_ADMIN", ad: "Süper Yönetici", aciklama: "Sistemin tamamına yetkili" },
  { kod: "KAYMAKAM", ad: "Kaymakam", aciklama: "İlçenin tamamına yetkili" },
  { kod: "BIRIM_AMIRI", ad: "Birim Amiri", aciklama: "Bağlı olduğu birimde yönetici" },
  { kod: "PERSONEL", ad: "Personel", aciklama: "Standart kullanıcı" },
];

const IZINLER: Array<{
  kod: IzinKodu;
  ad: string;
  aciklama: string;
  kategori: IzinKategorisi;
  alt_kategori: string | null;
}> = TUM_IZIN_KODLARI.map((kod) => {
  const tanim = IZIN_TANIMLARI[kod];
  const kategori = IZIN_KATEGORI[kod];
  if (!tanim || !kategori) {
    throw new Error(`İzin kataloğu eksik: ${kod}`);
  }
  return {
    kod,
    ad: tanim.ad,
    aciklama: tanim.aciklama,
    kategori,
    alt_kategori: IZIN_ALT_KATEGORI[kod] ?? null,
  };
});

const ROL_IZINLERI: Record<string, IzinKodu[]> = VARSAYILAN_ROL_IZINLERI;

async function temizle(): Promise<void> {
  await db.yorum.updateMany({ data: { yanit_yorum_id: null } });
  await db.$transaction([
    db.bildirim.deleteMany(),
    db.aktiviteLogu.deleteMany(),
    db.hataLogu.deleteMany(),
    db.sifirlamaTokeni.deleteMany(),
    db.davetTokeni.deleteMany(),
    db.yorum.deleteMany(),
    db.eklenti.deleteMany(),
    db.kontrolMaddesi.deleteMany(),
    db.kontrolListesi.deleteMany(),
    db.kartEtiket.deleteMany(),
    db.kartYetkilisi.deleteMany(),
    db.kartBirimi.deleteMany(),
    db.kart.deleteMany(),
    db.etiket.deleteMany(),
    db.listeYetkilisi.deleteMany(),
    db.listeBirimi.deleteMany(),
    db.liste.deleteMany(),
    db.projeYetkilisi.deleteMany(),
    db.projeBirimi.deleteMany(),
    db.proje.deleteMany(),
    db.kullaniciRol.deleteMany(),
    db.rolIzin.deleteMany(),
    db.kullanici.deleteMany(),
    db.rol.deleteMany(),
    db.izin.deleteMany(),
    db.birim.deleteMany(),
  ]);
}

async function rolVeIzinleriYukle(): Promise<Map<string, Idli>> {
  await db.izin.createMany({ data: IZINLER });
  await db.rol.createMany({
    data: ROLLER.map((rol) => ({ ...rol, sistem_rolu: true })),
  });
  const izinler = new Map((await db.izin.findMany()).map((izin) => [izin.kod, izin]));
  const roller = new Map((await db.rol.findMany()).map((rol) => [rol.kod, rol]));
  await db.rolIzin.createMany({
    data: Object.entries(ROL_IZINLERI).flatMap(([rolKod, izinKodlari]) => {
      const rol = al(roller, rolKod, "Rol");
      return izinKodlari.map((izinKod) => ({
        rol_id: rol.id,
        izin_id: al(izinler, izinKod, "İzin").id,
      }));
    }),
  });
  return roller;
}

async function birimleriYukle(): Promise<Map<BirimAnahtar, Idli>> {
  const birimler = new Map<BirimAnahtar, Idli>();
  for (const birim of BIRIMLER) {
    const tip: BirimTipi = birim.tip;
    const kayit = await db.birim.create({
      data: {
        tip,
        kategori: BIRIM_TIP_KATEGORI[tip],
        ad: birim.ad,
        kisa_ad: birim.kisa_ad,
        il: IL,
        ilce: ILCE,
      },
      select: { id: true },
    });
    birimler.set(birim.key, kayit);
  }
  return birimler;
}

async function kullanicilariYukle(
  roller: Map<string, Idli>,
  birimler: Map<BirimAnahtar, Idli>,
): Promise<Map<KullaniciAnahtar, KullaniciKayit>> {
  const parolaHash = await argon2.hash(PAROLA, { type: argon2.argon2id });
  const kullanicilar = new Map<KullaniciAnahtar, KullaniciKayit>();
  for (const seed of KULLANICILAR) {
    const onay = seed.onay ?? "ONAYLANDI";
    const kullanici = await db.kullanici.create({
      data: {
        birim_id: seed.birim ? al(birimler, seed.birim, "Birim").id : null,
        email: seed.email,
        parola_hash: parolaHash,
        ad: seed.ad,
        soyad: seed.soyad,
        unvan: seed.unvan,
        aktif: seed.aktif ?? true,
        onay_durumu: onay,
        onay_zamani: onay === "ONAYLANDI" ? gunEkle(-45) : null,
        red_sebebi: seed.red_sebebi ?? null,
        email_dogrulandi: onay === "ONAYLANDI" ? gunEkle(-45) : null,
      },
      select: { id: true, email: true, ad: true, soyad: true },
    });
    await db.kullaniciRol.create({
      data: {
        kullanici_id: kullanici.id,
        rol_id: al(roller, seed.rol, "Rol").id,
        atayan_id: null,
      },
    });
    kullanicilar.set(seed.key, kullanici);
  }
  return kullanicilar;
}

async function etiketleriYukle(
  projeId: string,
  etiketler: Array<{ ad: string; renk: string }>,
): Promise<Map<string, EtiketKayit>> {
  await db.etiket.createMany({ data: etiketler.map((etiket) => ({ ...etiket, proje_id: projeId })) });
  return new Map((await db.etiket.findMany({ where: { proje_id: projeId } })).map((e) => [e.ad, e]));
}

// Yorum içeriğindeki `@<KullaniciAnahtar>` placeholder'larını gerçek kullanıcı
// UUID'sine çevirir → MENTION_UUID_REGEX (`@<uuid>`) ile uyumlu hale gelir,
// UI mention parser'ı doğrudan kişi adıyla render eder. Bilinmeyen anahtar
// kalsa olduğu gibi geçer (UI'da düz metin gözükür, hata vermez).
function mentionDoldur(
  icerik: string,
  ctx: SeedCtx,
): string {
  return icerik.replace(/@<([a-zA-Z0-9_]+)>/g, (_tam, anahtar: string) => {
    const k = ctx.kullanicilar.get(anahtar as KullaniciAnahtar);
    return k ? `@${k.id}` : `@${anahtar}`;
  });
}

async function kartOlustur(args: {
  listeId: string;
  sira: string;
  seed: KartSeed;
  ctx: SeedCtx;
  etiketler: Map<string, EtiketKayit>;
  olusturanId: string;
}): Promise<Idli> {
  const { listeId, sira, seed, ctx, etiketler, olusturanId } = args;
  // ADR-0023 — Tiptap zengin metin. Seed'de `aciklamaDokuman` verilirse onu
  // kullan, yoksa düz `aciklama` string'ini paragraf doc'una sar.
  const dokuman = seed.aciklamaDokuman ?? metinTiptapDokumana(seed.aciklama);
  const aciklamaMetin = seed.aciklamaDokuman
    ? tiptapDokumaniMetne(seed.aciklamaDokuman)
    : seed.aciklama;
  const tamamlandi = seed.tamamlandi === true;
  const kart = await db.kart.create({
    data: {
      liste_id: listeId,
      baslik: seed.baslik,
      // Prisma Json bridging — TiptapDokuman tip-uyumlu InputJsonValue.
      aciklama_dokuman: dokuman as Prisma.InputJsonValue,
      aciklama_metin: aciklamaMetin || null,
      sira,
      bitis: seed.bitis ?? null,
      baslangic: seed.baslangic ?? null,
      kapak_renk: tamamlandi ? "secondary" : "primary",
      olusturan_id: olusturanId,
      // Kart bütün-tamamlandı işareti (Trello pattern). UI'da yetkili
      // toggle'lar; seed'de örnek dağılım için doğrudan set ediyoruz.
      tamamlandi_mi: tamamlandi,
      tamamlanma_zamani: tamamlandi ? gunEkle(-2, 16) : null,
      tamamlayan_id: tamamlandi ? olusturanId : null,
      arsiv_mi: seed.arsiv ?? false,
      arsiv_zamani: seed.arsiv ? gunEkle(-3, 17) : null,
    },
    select: { id: true },
  });
  ctx.kartlar.set(seed.key, kart);

  if (seed.etiketler.length) {
    await db.kartEtiket.createMany({
      data: seed.etiketler.map((ad) => ({ kart_id: kart.id, etiket_id: al(etiketler, ad, "Etiket").id })),
    });
  }
  if (seed.yetkililer?.length) {
    await db.kartYetkilisi.createMany({
      data: seed.yetkililer.map((k) => ({
        kart_id: kart.id,
        kullanici_id: al(ctx.kullanicilar, k, "Kullanıcı").id,
      })),
    });
  }
  if (seed.birimler?.length) {
    await db.kartBirimi.createMany({
      data: seed.birimler.map((b) => ({
        kart_id: kart.id,
        birim_id: al(ctx.birimler, b, "Birim").id,
      })),
    });
  }
  for (const kontrol of seed.kontrol ?? []) {
    const kontrolSira = siraUretici();
    const kl = await db.kontrolListesi.create({
      data: { kart_id: kart.id, ad: kontrol.ad, sira: kontrolSira() },
      select: { id: true },
    });
    const maddeSira = siraUretici();
    await db.kontrolMaddesi.createMany({
      data: kontrol.maddeler.map((madde) => ({
        kontrol_listesi_id: kl.id,
        metin: madde.metin,
        sira: maddeSira(),
        atanan_id: madde.atanan ? al(ctx.kullanicilar, madde.atanan, "Kullanıcı").id : null,
        tamamlandi_mi: madde.tamam ?? false,
        tamamlama_zamani: madde.tamam
          ? gunEkle(madde.tamamlanmaGun ?? -1, 14 + (kart.id.length % 5))
          : null,
      })),
    });
  }
  // Yorum 2-pas: önce her yorum yaratılır (ID elde edilir), sonra `yanit`
  // index'i olanlar için `yanit_yorum_id` update edilir.
  const yorumIdler: string[] = [];
  if (seed.yorumlar?.length) {
    for (let i = 0; i < seed.yorumlar.length; i++) {
      const y = seed.yorumlar[i]!;
      const olusturma = gunEkle(y.gunFarki ?? -3 + i, y.saat ?? 11);
      const yorum = await db.yorum.create({
        data: {
          kart_id: kart.id,
          yazan_id: al(ctx.kullanicilar, y.yazan, "Kullanıcı").id,
          icerik: mentionDoldur(y.icerik, ctx),
          olusturma_zamani: olusturma,
          duzenlendi_mi: y.duzenlendi === true,
          // Düzenlenmiş yorumlarda guncelleme_zamani > olusturma_zamani — UI
          // "düzenlendi" rozeti için bu farkı kullanır.
          guncelleme_zamani:
            y.duzenlendi === true
              ? new Date(olusturma.getTime() + 90 * 60_000)
              : olusturma,
        },
        select: { id: true },
      });
      yorumIdler.push(yorum.id);
    }
    // 2. pas — yanıt zinciri
    for (let i = 0; i < seed.yorumlar.length; i++) {
      const y = seed.yorumlar[i]!;
      const yanitIdx = y.yanit;
      if (yanitIdx === undefined) continue;
      const hedef = yorumIdler[yanitIdx];
      const kaynak = yorumIdler[i];
      if (!hedef || !kaynak || hedef === kaynak) continue;
      await db.yorum.update({
        where: { id: kaynak },
        data: { yanit_yorum_id: hedef },
      });
    }
  }
  if (seed.ekler?.length) {
    await db.eklenti.createMany({
      data: seed.ekler.map((ek) => ({
        kart_id: kart.id,
        yukleyen_id: al(ctx.kullanicilar, ek.yukleyen ?? "yaziMemur", "Kullanıcı").id,
        ad: ek.ad,
        mime: ek.mime,
        boyut: ek.boyut,
        depolama_yolu: `seed/${kart.id}/${ek.ad}`,
      })),
    });
  }
  // MENTION_UUID_REGEX'i runtime'da bir kez ısıt — node sıkı export tree-shaking
  // ile lazy alır, ilk yorum sonrası sıcak kalsın.
  void MENTION_UUID_REGEX;
  return kart;
}

async function projeOlustur(args: { proje: ProjeSeed; ctx: SeedCtx; sira: string }): Promise<void> {
  const { proje: p, ctx, sira } = args;
  const olusturanId = al(ctx.kullanicilar, p.olusturan, "Kullanıcı").id;

  const proje = await db.proje.create({
    data: {
      ad: p.ad,
      aciklama: p.aciklama,
      kapak_renk: p.kapakRenk ?? null,
      kapak_ikon: p.kapakIkon ?? null,
      sira,
      yildizli_mi: p.yildizli ?? false,
      arsiv_mi: p.arsiv ?? false,
      arsiv_zamani: p.arsiv ? gunEkle(-30) : null,
      olusturan_id: olusturanId,
    },
    select: { id: true },
  });

  await db.liste.create({
    data: {
      proje_id: proje.id,
      ad: "Arşiv",
      sira: "ZZZZ",
      tip: ListeTipi.ARSIV,
    },
  });

  const yetkililer = Array.from(new Set(p.yetkililer));
  await db.projeYetkilisi.createMany({
    data: yetkililer.map((k) => ({
      proje_id: proje.id,
      kullanici_id: al(ctx.kullanicilar, k, "Kullanıcı").id,
    })),
    skipDuplicates: true,
  });

  const projeBirimler = Array.from(new Set(p.birimler));
  await db.projeBirimi.createMany({
    data: projeBirimler.map((b) => ({
      proje_id: proje.id,
      birim_id: al(ctx.birimler, b, "Birim").id,
    })),
    skipDuplicates: true,
  });

  const etiketler = await etiketleriYukle(proje.id, p.etiketler ?? VARSAYILAN_ETIKETLER);

  const listeSira = siraUretici();
  for (const listeSeed of p.listeler) {
    const liste = await db.liste.create({
      data: { proje_id: proje.id, ad: listeSeed.ad, sira: listeSira() },
      select: { id: true },
    });
    if (listeSeed.yetkililer?.length) {
      await db.listeYetkilisi.createMany({
        data: listeSeed.yetkililer.map((k) => ({
          liste_id: liste.id,
          kullanici_id: al(ctx.kullanicilar, k, "Kullanıcı").id,
        })),
        skipDuplicates: true,
      });
    }
    if (listeSeed.birimler?.length) {
      await db.listeBirimi.createMany({
        data: listeSeed.birimler.map((b) => ({
          liste_id: liste.id,
          birim_id: al(ctx.birimler, b, "Birim").id,
        })),
        skipDuplicates: true,
      });
    }
    const kartSira = siraUretici();
    for (const kartSeed of listeSeed.kartlar) {
      await kartOlustur({
        listeId: liste.id,
        sira: kartSira(),
        seed: kartSeed,
        ctx,
        etiketler,
        olusturanId,
      });
    }
  }
}

async function projeleriYukle(ctx: SeedCtx): Promise<void> {
  let sonProjeSira: string | null = null;
  for (const proje of PROJELER) {
    sonProjeSira = siraSonuna(sonProjeSira);
    await projeOlustur({ proje, ctx, sira: sonProjeSira });
  }
}

async function main(): Promise<void> {
  // Sprint 1 / S1-18 — production safeguard.
  // Seed `temizle()` ile tüm tabloları boşaltıp baştan dolduruyor; production
  // veritabanına yanlışlıkla çalıştırılırsa katastrofik. NODE_ENV production
  // veya DATABASE_URL localhost dışında bir host gösteriyorsa açıkça onay
  // (`PUSULA_SEED_PROD_OK=evet`) gerekir.
  const url = process.env.DATABASE_URL ?? "";
  const localhostMu = /@(?:localhost|127\.0\.0\.1|::1)[:/]/.test(url);
  const productionMu = process.env.NODE_ENV === "production";
  const onaylandi = process.env.PUSULA_SEED_PROD_OK === "evet";
  if ((productionMu || !localhostMu) && !onaylandi) {
    console.error(
      "[seed] Production veya localhost dışı DB tespit edildi. Devam etmek " +
        "için PUSULA_SEED_PROD_OK=evet ortam değişkeni gereklidir.\n" +
        `  NODE_ENV=${process.env.NODE_ENV ?? "(yok)"}\n` +
        `  DATABASE_URL host=${url.replace(/^.*@/, "").split("/")[0] ?? "(parse edilemedi)"}`,
    );
    process.exit(2);
  }

  console.log("Seed başlıyor: mevcut veri temizlenecek.");
  await temizle();
  const roller = await rolVeIzinleriYukle();
  const birimler = await birimleriYukle();
  const kullanicilar = await kullanicilariYukle(roller, birimler);
  const ctx: SeedCtx = { birimler, kullanicilar, kartlar: new Map() };
  await projeleriYukle(ctx);
  await destekVerileriniYukle(db, ctx);
  console.log("Seed tamamlandı.");
  console.log(`  Birim:      ${BIRIMLER.length}`);
  console.log(`  Kullanıcı:  ${KULLANICILAR.length}`);
  console.log(`  Proje:      ${PROJELER.length}`);
  console.log(`  Kart:       ${ctx.kartlar.size}`);
  console.log(`Giriş parolası tüm seed kullanıcılarında: ${PAROLA}`);
  console.log("Örnek hesaplar: admin@pusula.local, kaymakam@tekman.gov.tr, ozelkalem.amir@tekman.gov.tr");
}

main()
  .catch((hata) => {
    console.error(hata);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
