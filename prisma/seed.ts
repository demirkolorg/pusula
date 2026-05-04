import { PrismaClient, type BirimTipi } from "@prisma/client";
import argon2 from "argon2";
import {
  BIRIM_TIP_KATEGORI,
  BIRIM_TIP_LABEL,
  BIRIM_TIP_TEKIL,
} from "../lib/constants/birim";

const db = new PrismaClient();

const ROLLER = [
  { kod: "SUPER_ADMIN", ad: "Süper Yönetici", aciklama: "Sistemin tamamına yetkili" },
  { kod: "KAYMAKAM", ad: "Kaymakam", aciklama: "İlçenin tamamına yetkili" },
  { kod: "BIRIM_AMIRI", ad: "Birim Amiri", aciklama: "Bağlı olduğu birimda yönetici" },
  { kod: "PERSONEL", ad: "Personel", aciklama: "Standart kullanıcı" },
];

const IZINLER = [
  { kod: "proje:create", ad: "Proje Oluştur", kategori: "proje" },
  { kod: "proje:edit", ad: "Proje Düzenle", kategori: "proje" },
  { kod: "proje:delete", ad: "Proje Sil", kategori: "proje" },
  { kod: "proje:member", ad: "Proje Üyelerini Yönet", kategori: "proje" },
  { kod: "liste:create", ad: "Liste Oluştur", kategori: "liste" },
  { kod: "liste:edit", ad: "Liste Düzenle", kategori: "liste" },
  { kod: "liste:delete", ad: "Liste Sil", kategori: "liste" },
  { kod: "kart:create", ad: "Kart Oluştur", kategori: "kart" },
  { kod: "kart:edit", ad: "Kart Düzenle", kategori: "kart" },
  { kod: "kart:delete", ad: "Kart Sil", kategori: "kart" },
  { kod: "kart:move", ad: "Kart Taşı", kategori: "kart" },
  { kod: "user:invite", ad: "Kullanıcı Davet Et", kategori: "kullanici" },
  { kod: "user:edit", ad: "Kullanıcı Düzenle", kategori: "kullanici" },
  { kod: "user:delete", ad: "Kullanıcı Sil", kategori: "kullanici" },
  { kod: "user:approve", ad: "Kullanıcı Onayla / Reddet", kategori: "kullanici" },
  { kod: "audit:read", ad: "Denetim Logu Görüntüle", kategori: "ayar" },
  { kod: "errorlog:read", ad: "Hata Loglarını Görüntüle", kategori: "ayar" },
  { kod: "settings:edit", ad: "Sistem Ayarları", kategori: "ayar" },
  { kod: "birim:manage", ad: "Birim Yönetimi", kategori: "ayar" },
  { kod: "rol:manage", ad: "Rol ve İzin Yönetimi", kategori: "ayar" },
];

const PROJE_IZIN_GRUBU = [
  "proje:create",
  "proje:edit",
  "proje:member",
  "liste:create",
  "liste:edit",
  "liste:delete",
  "kart:create",
  "kart:edit",
  "kart:delete",
  "kart:move",
];

const ROL_IZINLERI: Record<string, string[]> = {
  SUPER_ADMIN: IZINLER.map((i) => i.kod),
  KAYMAKAM: [
    ...PROJE_IZIN_GRUBU,
    "proje:delete",
    "user:invite",
    "user:edit",
    "user:approve",
    "audit:read",
    "errorlog:read",
    "birim:manage",
  ],
  BIRIM_AMIRI: [...PROJE_IZIN_GRUBU, "user:invite"],
  PERSONEL: ["kart:create", "kart:edit", "kart:move"],
};

async function main() {
  console.log("Seed başladı...");

  // İzinler
  for (const izin of IZINLER) {
    await db.izin.upsert({
      where: { kod: izin.kod },
      update: { ad: izin.ad, kategori: izin.kategori },
      create: izin,
    });
  }
  console.log("✓ İzinler: " + IZINLER.length);

  // Roller
  for (const rol of ROLLER) {
    await db.rol.upsert({
      where: { kod: rol.kod },
      update: { ad: rol.ad, aciklama: rol.aciklama, sistem_rolu: true },
      create: { ...rol, sistem_rolu: true },
    });
  }
  console.log("✓ Roller: " + ROLLER.length);

  // Rol-izin matrisi
  const tumIzinler = await db.izin.findMany();
  const izinHaritasi = new Map(tumIzinler.map((i) => [i.kod, i.id]));
  const tumRoller = await db.rol.findMany();
  for (const rol of tumRoller) {
    const istenenler = ROL_IZINLERI[rol.kod] ?? [];
    for (const kod of istenenler) {
      const izinId = izinHaritasi.get(kod);
      if (!izinId) continue;
      await db.rolIzin.upsert({
        where: { rol_id_izin_id: { rol_id: rol.id, izin_id: izinId } },
        update: {},
        create: { rol_id: rol.id, izin_id: izinId },
      });
    }
  }
  console.log("✓ Rol-izin matrisi yüklendi");

  // Tekil birimler — ilçedeki tüm tekil birimler otomatik oluşturulur.
  // Çoklu birimler (eczane, okul, cami vb.) admin tarafından eklenir.
  const tekilTipler = Array.from(BIRIM_TIP_TEKIL) as BirimTipi[];
  const il = "İstanbul";
  const ilce = "Beşiktaş";

  let eklenenBirim = 0;
  for (const tip of tekilTipler) {
    const kategori = BIRIM_TIP_KATEGORI[tip];
    const mevcut = await db.birim.findFirst({
      where: { tip, silindi_mi: false },
      select: { id: true },
    });
    if (mevcut) continue;
    await db.birim.create({
      data: {
        kategori,
        tip,
        ad: null, // tekil tip — görünen ad BIRIM_TIP_LABEL[tip]
        il,
        ilce,
      },
    });
    eklenenBirim += 1;
  }
  console.log(
    `✓ Tekil birimler: ${eklenenBirim} yeni eklendi (toplam tekil tip: ${tekilTipler.length})`,
  );

  const kaymakamlik = await db.birim.findFirst({
    where: { tip: "KAYMAKAMLIK", silindi_mi: false },
    select: { id: true },
  });
  if (!kaymakamlik) {
    throw new Error("Kaymakamlık birim kaydı oluşturulamadı.");
  }

  // Demo kullanıcılar — Süper Admin ve Kaymakam Kaymakamlık'a bağlı.
  const superAdminRol = tumRoller.find((r) => r.kod === "SUPER_ADMIN");
  const kaymakamRol = tumRoller.find((r) => r.kod === "KAYMAKAM");

  const adminEmail = "admin@pusula.local";
  const adminParola = "Pusula2026!";
  const adminParolaHash = await argon2.hash(adminParola, {
    type: argon2.argon2id,
  });
  const admin = await db.kullanici.upsert({
    where: { email: adminEmail },
    update: {
      parola_hash: adminParolaHash,
      aktif: true,
      onay_durumu: "ONAYLANDI",
      birim_id: null,
    },
    create: {
      birim_id: null,
      email: adminEmail,
      parola_hash: adminParolaHash,
      ad: "Sistem",
      soyad: "Yöneticisi",
      unvan: "Süper Admin",
      aktif: true,
      onay_durumu: "ONAYLANDI",
      onay_zamani: new Date(),
      email_dogrulandi: new Date(),
    },
  });
  if (superAdminRol) {
    await db.kullaniciRol.upsert({
      where: {
        kullanici_id_rol_id: {
          kullanici_id: admin.id,
          rol_id: superAdminRol.id,
        },
      },
      update: {},
      create: { kullanici_id: admin.id, rol_id: superAdminRol.id },
    });
  }

  const kaymakamEmail = "kaymakam@pusula.local";
  const kaymakamParola = "Pusula2026!";
  const kaymakamParolaHash = await argon2.hash(kaymakamParola, {
    type: argon2.argon2id,
  });
  const kaymakam = await db.kullanici.upsert({
    where: { email: kaymakamEmail },
    update: {
      parola_hash: kaymakamParolaHash,
      aktif: true,
      onay_durumu: "ONAYLANDI",
      birim_id: null,
    },
    create: {
      birim_id: null,
      email: kaymakamEmail,
      parola_hash: kaymakamParolaHash,
      ad: "Beşiktaş",
      soyad: "Kaymakamı",
      unvan: "Kaymakam",
      aktif: true,
      onay_durumu: "ONAYLANDI",
      onay_zamani: new Date(),
      email_dogrulandi: new Date(),
    },
  });
  if (kaymakamRol) {
    await db.kullaniciRol.upsert({
      where: {
        kullanici_id_rol_id: {
          kullanici_id: kaymakam.id,
          rol_id: kaymakamRol.id,
        },
      },
      update: {},
      create: { kullanici_id: kaymakam.id, rol_id: kaymakamRol.id },
    });
  }

  // ===== Özel Kalem (BIRIM_AMIRI + PERSONEL) =====
  const ozelKalem = await db.birim.findFirst({
    where: { tip: "OZEL_KALEM", silindi_mi: false },
    select: { id: true },
  });
  if (!ozelKalem) {
    throw new Error("Özel Kalem birim kaydı oluşturulamadı.");
  }

  const birimAmiriRol = tumRoller.find((r) => r.kod === "BIRIM_AMIRI");
  const personelRol = tumRoller.find((r) => r.kod === "PERSONEL");

  const ozelKalemAmirEmail = "ozelkalem.amir@pusula.local";
  const ozelKalemMemurEmail = "ozelkalem.memur@pusula.local";
  const ozelKalemParola = "Pusula2026!";
  const ozelKalemParolaHash = await argon2.hash(ozelKalemParola, {
    type: argon2.argon2id,
  });

  const ozelKalemAmir = await db.kullanici.upsert({
    where: { email: ozelKalemAmirEmail },
    update: {
      parola_hash: ozelKalemParolaHash,
      aktif: true,
      onay_durumu: "ONAYLANDI",
      birim_id: ozelKalem.id,
    },
    create: {
      birim_id: ozelKalem.id,
      email: ozelKalemAmirEmail,
      parola_hash: ozelKalemParolaHash,
      ad: "Mehmet",
      soyad: "Yıldız",
      unvan: "Özel Kalem Müdürü",
      aktif: true,
      onay_durumu: "ONAYLANDI",
      onay_zamani: new Date(),
      email_dogrulandi: new Date(),
    },
  });
  if (birimAmiriRol) {
    await db.kullaniciRol.upsert({
      where: {
        kullanici_id_rol_id: {
          kullanici_id: ozelKalemAmir.id,
          rol_id: birimAmiriRol.id,
        },
      },
      update: {},
      create: { kullanici_id: ozelKalemAmir.id, rol_id: birimAmiriRol.id },
    });
  }

  const ozelKalemMemur = await db.kullanici.upsert({
    where: { email: ozelKalemMemurEmail },
    update: {
      parola_hash: ozelKalemParolaHash,
      aktif: true,
      onay_durumu: "ONAYLANDI",
      birim_id: ozelKalem.id,
    },
    create: {
      birim_id: ozelKalem.id,
      email: ozelKalemMemurEmail,
      parola_hash: ozelKalemParolaHash,
      ad: "Elif",
      soyad: "Kaya",
      unvan: "Özel Kalem Memuru",
      aktif: true,
      onay_durumu: "ONAYLANDI",
      onay_zamani: new Date(),
      email_dogrulandi: new Date(),
    },
  });
  if (personelRol) {
    await db.kullaniciRol.upsert({
      where: {
        kullanici_id_rol_id: {
          kullanici_id: ozelKalemMemur.id,
          rol_id: personelRol.id,
        },
      },
      update: {},
      create: { kullanici_id: ozelKalemMemur.id, rol_id: personelRol.id },
    });
  }

  console.log("");
  console.log("==========================================");
  console.log("Demo kullanıcılar:");
  console.log("  Süper Admin       : " + adminEmail + " / " + adminParola);
  console.log("  Kaymakam          : " + kaymakamEmail + " / " + kaymakamParola);
  console.log("  Özel Kalem Amiri  : " + ozelKalemAmirEmail + " / " + ozelKalemParola);
  console.log("  Özel Kalem Memuru : " + ozelKalemMemurEmail + " / " + ozelKalemParola);
  console.log("==========================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
