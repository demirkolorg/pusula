// Sprint 4 / S4-16 — Profil yönetimi servis katmanı.

import argon2 from "argon2";
import { db } from "@/lib/db";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import type { ProfilGuncelle, ParolaDegistir } from "./schemas";

export async function profiliGuncelle(
  kullaniciId: string,
  girdi: ProfilGuncelle,
): Promise<void> {
  // Boş string'leri null'a çevir — DB'de optional alanlar.
  const unvan = girdi.unvan.trim().length > 0 ? girdi.unvan.trim() : null;
  const telefon =
    girdi.telefon.trim().length > 0 ? girdi.telefon.trim() : null;
  await db.kullanici.update({
    where: { id: kullaniciId },
    data: {
      ad: girdi.ad.trim(),
      soyad: girdi.soyad.trim(),
      unvan,
      telefon,
    },
  });
}

export async function parolayiDegistir(
  kullaniciId: string,
  girdi: ParolaDegistir,
): Promise<void> {
  const k = await db.kullanici.findUnique({
    where: { id: kullaniciId },
    select: { parola_hash: true },
  });
  if (!k) {
    throw new EylemHatasi("Kullanıcı bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  const dogru = await argon2.verify(k.parola_hash, girdi.mevcutParola);
  if (!dogru) {
    throw new EylemHatasi(
      "Mevcut parola hatalı.",
      HATA_KODU.GECERSIZ_GIRDI,
      { mevcutParola: "Mevcut parola hatalı." },
    );
  }
  const yeniHash = await argon2.hash(girdi.yeniParola, {
    type: argon2.argon2id,
  });
  await db.kullanici.update({
    where: { id: kullaniciId },
    data: { parola_hash: yeniHash },
  });
}
