import { PrismaClient, type KurumTipi } from "@prisma/client";
import argon2 from "argon2";
import {
  KURUM_TIP_KATEGORI,
  KURUM_TIP_LABEL,
  KURUM_TIP_TEKIL,
} from "../lib/constants/kurum";

const db = new PrismaClient();

const ROLLER = [
  { kod: "SUPER_ADMIN", ad: "Süper Yönetici", aciklama: "Sistemin tamamına yetkili" },
  { kod: "KAYMAKAM", ad: "Kaymakam", aciklama: "İlçenin tamamına yetkili" },
  { kod: "KURUM_AMIRI", ad: "Kurum Amiri", aciklama: "Bağlı olduğu kurumda yönetici" },
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
  { kod: "kurum:manage", ad: "Kurum Yönetimi", kategori: "ayar" },
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
    "kurum:manage",
  ],
  KURUM_AMIRI: [...PROJE_IZIN_GRUBU, "user:invite"],
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

  // Tekil kurumlar — ilçedeki tüm tekil kurumlar otomatik oluşturulur.
  // Çoklu kurumlar (eczane, okul, cami vb.) admin tarafından eklenir.
  const tekilTipler = Array.from(KURUM_TIP_TEKIL) as KurumTipi[];
  const il = "İstanbul";
  const ilce = "Beşiktaş";

  let eklenenKurum = 0;
  for (const tip of tekilTipler) {
    const kategori = KURUM_TIP_KATEGORI[tip];
    const mevcut = await db.kurum.findFirst({
      where: { tip, silindi_mi: false },
      select: { id: true },
    });
    if (mevcut) continue;
    await db.kurum.create({
      data: {
        kategori,
        tip,
        ad: null, // tekil tip — görünen ad KURUM_TIP_LABEL[tip]
        il,
        ilce,
      },
    });
    eklenenKurum += 1;
  }
  console.log(
    `✓ Tekil kurumlar: ${eklenenKurum} yeni eklendi (toplam tekil tip: ${tekilTipler.length})`,
  );

  const kaymakamlik = await db.kurum.findFirst({
    where: { tip: "KAYMAKAMLIK", silindi_mi: false },
    select: { id: true },
  });
  if (!kaymakamlik) {
    throw new Error("Kaymakamlık kurum kaydı oluşturulamadı.");
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
      kurum_id: kaymakamlik.id,
    },
    create: {
      kurum_id: kaymakamlik.id,
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
      kurum_id: kaymakamlik.id,
    },
    create: {
      kurum_id: kaymakamlik.id,
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

  console.log("");
  console.log("==========================================");
  console.log("Demo kullanıcılar:");
  console.log("  Süper Admin : " + adminEmail + " / " + adminParola);
  console.log("  Kaymakam    : " + kaymakamEmail + " / " + kaymakamParola);
  console.log("  Kurum       : " + KURUM_TIP_LABEL.KAYMAKAMLIK);
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
