import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { siraSonuna } from "@/lib/sira";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import { canKart } from "@/lib/yetki";
import { MAKAM_ROL_KODLARI } from "@/lib/roller";
import type {
  KontrolListesiGuncelle,
  KontrolListesiOlustur,
  MaddeAdayKullanicilar,
  MaddeGuncelle,
  MaddeOlustur,
} from "./schemas";

export type MaddeOzeti = {
  id: string;
  kontrol_listesi_id: string;
  metin: string;
  tamamlandi_mi: boolean;
  tamamlama_zamani: Date | null;
  tamamlayan_id: string | null;
  atanan_id: string | null;
  atanan: { ad: string; soyad: string } | null;
  bitis: Date | null;
  sira: string;
};

export type KontrolListesiOzeti = {
  id: string;
  kart_id: string;
  ad: string;
  sira: string;
  maddeler: MaddeOzeti[];
};

// =====================================================================
// Erişim doğrulama
// =====================================================================

async function kartiBulVeProjeAl(
  _birimId: string,
  kartId: string,
): Promise<{ proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const k = await db.kart.findUnique({
    where: { id: kartId },
    select: {
      liste: { select: { proje_id: true } },
    },
  });
  if (!k) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { proje_id: k.liste.proje_id };
}

async function kontrolListesiBulVeKart(
  _birimId: string,
  klId: string,
): Promise<{ kart_id: string; proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const kl = await db.kontrolListesi.findUnique({
    where: { id: klId },
    select: {
      kart_id: true,
      kart: {
        select: {
          liste: {
            select: { proje_id: true },
          },
        },
      },
    },
  });
  if (!kl) {
    throw new EylemHatasi("Kontrol listesi bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return { kart_id: kl.kart_id, proje_id: kl.kart.liste.proje_id };
}

async function maddeBul(
  _birimId: string,
  maddeId: string,
): Promise<{ kontrol_listesi_id: string; kart_id: string; proje_id: string }> {
  // Tek-birim (ADR-0007) — birim kontrolü düştü.
  const m = await db.kontrolMaddesi.findUnique({
    where: { id: maddeId },
    select: {
      kontrol_listesi_id: true,
      kontrol_listesi: {
        select: {
          kart_id: true,
          kart: {
            select: {
              liste: {
                select: {
                  proje_id: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!m) {
    throw new EylemHatasi("Madde bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  return {
    kontrol_listesi_id: m.kontrol_listesi_id,
    kart_id: m.kontrol_listesi.kart_id,
    proje_id: m.kontrol_listesi.kart.liste.proje_id,
  };
}

async function maddeAtanacakKullaniciDogrula(
  kartId: string,
  kullaniciId: string,
): Promise<void> {
  const kullanici = await db.kullanici.findUnique({
    where: { id: kullaniciId },
    select: { aktif: true, silindi_mi: true, onay_durumu: true },
  });
  if (
    !kullanici ||
    kullanici.silindi_mi ||
    !kullanici.aktif ||
    kullanici.onay_durumu !== "ONAYLANDI"
  ) {
    throw new EylemHatasi("Kullanıcı bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  // Kural V.2 (146) — atanacak kişi karta erişebilmeli; aksi halde
  // gizli kanıtlanabilir personel kart içeriğine bildirim üzerinden
  // ulaşmış olur (KVKK riski). canKart makam (Kural 50a) için true döner.
  if (!(await canKart(kullaniciId, "kart:read", kartId))) {
    throw new EylemHatasi(
      "Bu kullanıcı seçili karta erişemediği için sorumlu atanamaz.",
      HATA_KODU.GECERSIZ_GIRDI,
      { atanan_id: "Kullanıcının karta erişimi yok." },
    );
  }
}

// =====================================================================
// Aday kullanıcı arama (madde sorumlu picker'ı)
// =====================================================================

export type MaddeAdayKullanici = {
  id: string;
  ad: string;
  soyad: string;
  email: string;
  birim_ad: string | null;
};

export async function kartMaddeAdayKullanicilariniAra(
  _birimId: string,
  girdi: MaddeAdayKullanicilar,
): Promise<MaddeAdayKullanici[]> {
  // Karta erişebilen herkes: doğrudan kart yetkilisi, kart birimi,
  // liste yetkilisi, liste birimi, proje yetkilisi, proje birimi
  // veya sistem makamı (SUPER_ADMIN/KAYMAKAM — Kural 50a).
  const kart = await db.kart.findUnique({
    where: { id: girdi.kart_id },
    select: {
      yetkililer: { select: { kullanici_id: true } },
      birimler: { select: { birim_id: true } },
      liste: {
        select: {
          yetkililer: { select: { kullanici_id: true } },
          birimler: { select: { birim_id: true } },
          proje: {
            select: {
              yetkililer: { select: { kullanici_id: true } },
              birimler: { select: { birim_id: true } },
            },
          },
        },
      },
    },
  });
  if (!kart) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }

  const dogrudanIdler = Array.from(
    new Set([
      ...kart.yetkililer.map((y) => y.kullanici_id),
      ...kart.liste.yetkililer.map((y) => y.kullanici_id),
      ...kart.liste.proje.yetkililer.map((y) => y.kullanici_id),
    ]),
  );
  const birimIdler = Array.from(
    new Set([
      ...kart.birimler.map((b) => b.birim_id),
      ...kart.liste.birimler.map((b) => b.birim_id),
      ...kart.liste.proje.birimler.map((b) => b.birim_id),
    ]),
  );

  const erisimYollari = [];
  if (dogrudanIdler.length > 0) erisimYollari.push({ id: { in: dogrudanIdler } });
  if (birimIdler.length > 0) erisimYollari.push({ birim_id: { in: birimIdler } });
  // Makam (SUPER_ADMIN/KAYMAKAM) her zaman aday — proje üyesi olmasalar bile.
  erisimYollari.push({
    roller: { some: { rol: { kod: { in: MAKAM_ROL_KODLARI } } } },
  });

  const aramaQ = girdi.q?.trim() ?? "";
  const sonuc = await db.kullanici.findMany({
    where: {
      AND: [
        { silindi_mi: false, aktif: true, onay_durumu: "ONAYLANDI" },
        { OR: erisimYollari },
        ...(aramaQ
          ? [
              {
                OR: [
                  { ad: { contains: aramaQ, mode: "insensitive" as const } },
                  { soyad: { contains: aramaQ, mode: "insensitive" as const } },
                  { email: { contains: aramaQ, mode: "insensitive" as const } },
                  {
                    birim: {
                      ad: { contains: aramaQ, mode: "insensitive" as const },
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: [{ ad: "asc" }, { soyad: "asc" }],
    take: 20,
    select: {
      id: true,
      ad: true,
      soyad: true,
      email: true,
      birim: { select: { ad: true, kisa_ad: true } },
    },
  });

  return sonuc.map((k) => ({
    id: k.id,
    ad: k.ad,
    soyad: k.soyad,
    email: k.email,
    birim_ad: k.birim?.kisa_ad ?? k.birim?.ad ?? null,
  }));
}

// =====================================================================
// Kontrol Listesi CRUD
// =====================================================================

export async function kartKontrolListeleriniListele(
  birimId: string,
  kartId: string,
): Promise<KontrolListesiOzeti[]> {
  await kartiBulVeProjeAl(birimId, kartId);
  const liste = await db.kontrolListesi.findMany({
    where: { kart_id: kartId },
    orderBy: { sira: "asc" },
    select: {
      id: true,
      kart_id: true,
      ad: true,
      sira: true,
      maddeler: {
        orderBy: { sira: "asc" },
        select: {
          id: true,
          kontrol_listesi_id: true,
          metin: true,
          tamamlandi_mi: true,
          tamamlama_zamani: true,
          tamamlayan_id: true,
          atanan_id: true,
          bitis: true,
          sira: true,
          atanan: { select: { ad: true, soyad: true } },
        },
      },
    },
  });
  return liste.map((kl) => ({
    id: kl.id,
    kart_id: kl.kart_id,
    ad: kl.ad,
    sira: kl.sira,
    maddeler: kl.maddeler.map((m) => ({
      id: m.id,
      kontrol_listesi_id: m.kontrol_listesi_id,
      metin: m.metin,
      tamamlandi_mi: m.tamamlandi_mi,
      tamamlama_zamani: m.tamamlama_zamani,
      tamamlayan_id: m.tamamlayan_id,
      atanan_id: m.atanan_id,
      atanan: m.atanan,
      bitis: m.bitis,
      sira: m.sira,
    })),
  }));
}

export async function kontrolListesiOlustur(
  birimId: string,
  girdi: KontrolListesiOlustur,
): Promise<KontrolListesiOzeti> {
  await kartiBulVeProjeAl(birimId, girdi.kart_id);
  const son = await db.kontrolListesi.findFirst({
    where: { kart_id: girdi.kart_id },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const sira = siraSonuna(son?.sira ?? null);
  const yeni = await db.kontrolListesi.create({
    data: { kart_id: girdi.kart_id, ad: girdi.ad, sira },
    select: { id: true, kart_id: true, ad: true, sira: true },
  });
  yayinla(SOCKET.KONTROL_LISTESI_OLUSTUR, room.kart(girdi.kart_id), {
    kart_id: girdi.kart_id,
    kontrol_listesi: yeni,
  }).catch(() => {});
  return { ...yeni, maddeler: [] };
}

export async function kontrolListesiGuncelle(
  birimId: string,
  girdi: KontrolListesiGuncelle,
): Promise<void> {
  const { kart_id } = await kontrolListesiBulVeKart(birimId, girdi.id);
  await db.kontrolListesi.update({
    where: { id: girdi.id },
    data: { ad: girdi.ad },
  });
  yayinla(SOCKET.KONTROL_LISTESI_GUNCELLE, room.kart(kart_id), {
    kart_id,
    kontrol_listesi_id: girdi.id,
  }).catch(() => {});
}

export async function kontrolListesiSil(
  birimId: string,
  id: string,
): Promise<void> {
  const { kart_id } = await kontrolListesiBulVeKart(birimId, id);
  // Maddeler onDelete: Cascade ile birlikte gider.
  await db.kontrolListesi.delete({ where: { id } });
  yayinla(SOCKET.KONTROL_LISTESI_SIL, room.kart(kart_id), {
    kart_id,
    kontrol_listesi_id: id,
  }).catch(() => {});
}

// =====================================================================
// Madde CRUD
// =====================================================================

export async function maddeOlustur(
  birimId: string,
  girdi: MaddeOlustur,
): Promise<MaddeOzeti> {
  const { kart_id } = await kontrolListesiBulVeKart(
    birimId,
    girdi.kontrol_listesi_id,
  );
  if (girdi.atanan_id) {
    await maddeAtanacakKullaniciDogrula(kart_id, girdi.atanan_id);
  }
  const son = await db.kontrolMaddesi.findFirst({
    where: { kontrol_listesi_id: girdi.kontrol_listesi_id },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const sira = siraSonuna(son?.sira ?? null);
  const yeni = await db.kontrolMaddesi.create({
    data: {
      kontrol_listesi_id: girdi.kontrol_listesi_id,
      metin: girdi.metin,
      atanan_id: girdi.atanan_id ?? null,
      bitis: girdi.bitis ?? null,
      sira,
    },
    select: {
      id: true,
      kontrol_listesi_id: true,
      metin: true,
      tamamlandi_mi: true,
      tamamlama_zamani: true,
      tamamlayan_id: true,
      atanan_id: true,
      bitis: true,
      sira: true,
      atanan: { select: { ad: true, soyad: true } },
    },
  });
  // kart_id için kontrol listesi'ne tekrar bak (madde'nin parent zinciri)
  const kl = await db.kontrolListesi.findUnique({
    where: { id: girdi.kontrol_listesi_id },
    select: { kart_id: true },
  });
  if (kl) {
    yayinla(SOCKET.MADDE_OLUSTUR, room.kart(kl.kart_id), {
      kart_id: kl.kart_id,
      madde: yeni,
    }).catch(() => {});
  }
  return yeni;
}

export async function maddeGuncelle(
  birimId: string,
  yapanId: string,
  girdi: MaddeGuncelle,
): Promise<void> {
  const { kart_id } = await maddeBul(birimId, girdi.id);
  if (girdi.atanan_id) {
    await maddeAtanacakKullaniciDogrula(kart_id, girdi.atanan_id);
  }

  const veri: Record<string, unknown> = {};
  if (girdi.metin !== undefined) veri.metin = girdi.metin;
  if (girdi.atanan_id !== undefined) veri.atanan_id = girdi.atanan_id;
  if (girdi.bitis !== undefined) veri.bitis = girdi.bitis;
  if (girdi.tamamlandi_mi !== undefined) {
    veri.tamamlandi_mi = girdi.tamamlandi_mi;
    veri.tamamlama_zamani = girdi.tamamlandi_mi ? new Date() : null;
    veri.tamamlayan_id = girdi.tamamlandi_mi ? yapanId : null;
  }

  if (Object.keys(veri).length === 0) return;
  await db.kontrolMaddesi.update({ where: { id: girdi.id }, data: veri });
  yayinla(SOCKET.MADDE_GUNCELLE, room.kart(kart_id), {
    kart_id,
    madde_id: girdi.id,
  }).catch(() => {});
}

export async function maddeSil(birimId: string, id: string): Promise<void> {
  const { kart_id } = await maddeBul(birimId, id);
  await db.kontrolMaddesi.delete({ where: { id } });
  yayinla(SOCKET.MADDE_SIL, room.kart(kart_id), {
    kart_id,
    madde_id: id,
  }).catch(() => {});
}
