// ADR-0028 / F5 — Kart eklenti şemaları artık yeni `dosyalar` modülüne
// delege edilen compatibility wrapper'ı için sadeleştirildi.
//
// Eski 2-aşamalı upload `kart_id + depolama_yolu` taşıyordu; yeni akışta
// upload oturumu sunucu tarafında yaratılır ve client `oturum_id` taşır.
// UI bu schema değişikliğine F5 commit'inde uyarlandı.

import { z } from "zod";

const uuid = z.string().uuid();
const dosyaAdi = z.string().trim().min(1).max(255);
const mimeTipi = z.string().trim().min(1).max(200);

export const yuklemeBaslatSemasi = z.object({
  kart_id: uuid,
  ad: dosyaAdi,
  mime: mimeTipi,
  boyut: z.number().int().positive(),
});

export const yuklemeOnaylaSemasi = z.object({
  kart_id: uuid,
  oturum_id: uuid,
});

export const eklentiSilSemasi = z.object({ id: uuid });
export const eklentiIndirSemasi = z.object({ id: uuid });
export const kartEklentileriListeleSemasi = z.object({ kart_id: uuid });

export type YuklemeBaslat = z.infer<typeof yuklemeBaslatSemasi>;
export type YuklemeOnayla = z.infer<typeof yuklemeOnaylaSemasi>;
export type EklentiSil = z.infer<typeof eklentiSilSemasi>;
export type EklentiIndir = z.infer<typeof eklentiIndirSemasi>;
export type KartEklentileriListele = z.infer<
  typeof kartEklentileriListeleSemasi
>;
