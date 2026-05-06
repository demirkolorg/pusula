// Tüm proje şablonlarını tek listede toplar.
// Sıralama: en güncel/aktif olanlar en üstte (UI'da yıldızlı görünüm).

import type { ProjeSeed } from "../tipler";
import { kisTedbirleriProjesi } from "./kis-tedbirleri";
import { okulGuvenligiProjesi } from "./okul-guvenligi";
import { vatandasTalepleriProjesi } from "./vatandas-talepleri";
import { sosyalYardimProjesi } from "./sosyal-yardim";
import { saglikKoordinasyonProjesi } from "./saglik-koordinasyon";
import { sinavGuvenligiProjesi } from "./sinav-guvenligi";
import { resmiTorenProjesi } from "./resmi-toren";
import { tarimsalKuraklikProjesi } from "./tarimsal-kuraklik";
import { kurbanBayramiProjesi } from "./kurban-bayrami";
import { muhtarlarToplantisiProjesi } from "./muhtarlar-toplantisi";
import { isyeriPazarDenetimProjesi } from "./isyeri-pazar-denetim";

export const PROJELER: ProjeSeed[] = [
  kisTedbirleriProjesi,
  vatandasTalepleriProjesi,
  muhtarlarToplantisiProjesi,
  okulGuvenligiProjesi,
  sosyalYardimProjesi,
  saglikKoordinasyonProjesi,
  sinavGuvenligiProjesi,
  resmiTorenProjesi,
  kurbanBayramiProjesi,
  isyeriPazarDenetimProjesi,
  tarimsalKuraklikProjesi,
];
