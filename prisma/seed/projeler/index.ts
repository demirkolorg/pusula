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

export const PROJELER: ProjeSeed[] = [
  kisTedbirleriProjesi,
  vatandasTalepleriProjesi,
  okulGuvenligiProjesi,
  sosyalYardimProjesi,
  saglikKoordinasyonProjesi,
  sinavGuvenligiProjesi,
  resmiTorenProjesi,
  tarimsalKuraklikProjesi,
];
