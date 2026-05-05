import type { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { kaymakamRoluMu, makamRoluMu, ROL_KODLARI } from "@/lib/roller";

type PolitikaDb = Pick<typeof db, "rol" | "kullaniciRol" | "davetTokeni">;

type RolOzet = {
  id: string;
  kod: string;
};

type RolPolitikasi = {
  roller: RolOzet[];
  makamMi: boolean;
  kaymakamMi: boolean;
};

type RolPolitikaGirdisi = {
  rolIdleri: string[];
  birimId: string | null;
  haricKullaniciId?: string;
  davetKontrol?: boolean;
};

function alanHatasi(alan: string, mesaj: string): never {
  throw new EylemHatasi(mesaj, HATA_KODU.GECERSIZ_GIRDI, { [alan]: mesaj });
}

function rolPolitikasiHesapla(
  roller: RolOzet[],
  birimId: string | null,
): RolPolitikasi {
  const makamRolleri = roller.filter((rol) => makamRoluMu(rol.kod));
  const birimRolleri = roller.filter((rol) => !makamRoluMu(rol.kod));

  if (makamRolleri.length > 1 || (makamRolleri.length > 0 && birimRolleri.length > 0)) {
    alanHatasi("rol_idleri", "Makam rolleri birim rolleri ile birlikte atanamaz.");
  }
  if (makamRolleri.length > 0 && birimId) {
    alanHatasi("birim_id", "Kaymakam ve Süper Yönetici birime bağlanamaz.");
  }
  if (makamRolleri.length === 0 && !birimId) {
    alanHatasi("birim_id", "Birim amiri ve personel için birim seçimi zorunludur.");
  }

  return {
    roller,
    makamMi: makamRolleri.length > 0,
    kaymakamMi: makamRolleri.some((rol) => kaymakamRoluMu(rol.kod)),
  };
}

async function rolOzetleriniAl(
  tx: PolitikaDb,
  rolIdleri: string[],
): Promise<RolOzet[]> {
  const tekilIdler = Array.from(new Set(rolIdleri));
  if (tekilIdler.length !== rolIdleri.length) {
    alanHatasi("rol_idleri", "Aynı rol birden fazla seçilemez.");
  }
  if (tekilIdler.length === 0) return [];

  const roller = await tx.rol.findMany({
    where: { id: { in: tekilIdler } },
    select: { id: true, kod: true },
  });
  if (roller.length !== tekilIdler.length) {
    alanHatasi("rol_idleri", "Seçilen rollerden biri geçerli değil.");
  }
  return roller;
}

async function kaymakamTekilDogrula(
  tx: PolitikaDb,
  haricKullaniciId?: string,
): Promise<void> {
  const mevcut = await tx.kullaniciRol.findFirst({
    where: {
      rol: { kod: ROL_KODLARI.KAYMAKAM },
      kullanici: { silindi_mi: false },
      ...(haricKullaniciId ? { kullanici_id: { not: haricKullaniciId } } : {}),
    },
    select: {
      kullanici: { select: { ad: true, soyad: true, email: true } },
    },
  });
  if (!mevcut) return;

  const ad = `${mevcut.kullanici.ad} ${mevcut.kullanici.soyad}`;
  throw new EylemHatasi(
    `Sistemde zaten Kaymakam rolüne sahip bir kullanıcı var: ${ad} (${mevcut.kullanici.email}).`,
    HATA_KODU.CAKISMA,
    { rol_idleri: "Kaymakam rolü yalnızca bir kullanıcıya atanabilir." },
  );
}

async function aktifKaymakamDavetiYokDogrula(
  tx: PolitikaDb,
  kaymakamRolId: string,
): Promise<void> {
  const mevcut = await tx.davetTokeni.findFirst({
    where: {
      rol_id: kaymakamRolId,
      kullanildi_mi: false,
      son_kullanma: { gt: new Date() },
    },
    select: { email: true },
  });
  if (!mevcut) return;

  throw new EylemHatasi(
    `Kaymakam rolü için zaten geçerli bir davet var: ${mevcut.email}.`,
    HATA_KODU.CAKISMA,
    { rol_id: "Kaymakam rolü için ikinci davet oluşturulamaz." },
  );
}

export async function rolAtamaPolitikasiniDogrula(
  tx: PolitikaDb,
  girdi: RolPolitikaGirdisi,
): Promise<RolPolitikasi> {
  const roller = await rolOzetleriniAl(tx, girdi.rolIdleri);
  const politika = rolPolitikasiHesapla(roller, girdi.birimId);
  if (!politika.kaymakamMi) return politika;

  await kaymakamTekilDogrula(tx, girdi.haricKullaniciId);
  if (girdi.davetKontrol) {
    const kaymakamRol = roller.find((rol) => kaymakamRoluMu(rol.kod));
    if (kaymakamRol) await aktifKaymakamDavetiYokDogrula(tx, kaymakamRol.id);
  }
  return politika;
}

export async function kullaniciKaymakamRoluneSahipMi(
  tx: PolitikaDb,
  kullaniciId: string,
): Promise<boolean> {
  const kayit = await tx.kullaniciRol.findFirst({
    where: {
      kullanici_id: kullaniciId,
      rol: { kod: ROL_KODLARI.KAYMAKAM },
    },
    select: { kullanici_id: true },
  });
  return !!kayit;
}
