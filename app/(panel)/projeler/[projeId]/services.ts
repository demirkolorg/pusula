// Sprint 3 / S3-2 — Proje detay servisi barrel.
//
// ADR-0032 mega dosya bölmesi (1350 satır → 4 parça + barrel):
//   services-ortak.ts   — tipler + helpers + projeyiZiyaretEt
//   services-liste.ts   — liste CRUD + sıralama + sistem ARSIV listesi
//   services-kart.ts    — kart CRUD + tamamlama 3 + taşı + arşiv toggle
//   services-detay.ts   — projeDetay + projedeTumKartlar (read)
//
// Çağıran kod (~115 dosya) `from "./services"` import yolunu korur.

// =====================================================================
// Tipler (barrel re-export)
// =====================================================================
export type {
  KartKapakOzeti,
  ListeKartOzeti,
  ListeOzeti,
  ProjeDetayOzeti,
  LisedeKart,
} from "./services-ortak";

// =====================================================================
// Ortak helpers (sadece projeyiZiyaretEt public; diğer helpers internal)
// =====================================================================
export { projeyiZiyaretEt } from "./services-ortak";

// =====================================================================
// Liste işlemleri
// =====================================================================
export {
  arsivListesiniSagla,
  listeOlustur,
  listeGuncelle,
  listeSil,
  listeyeSiraVer,
} from "./services-liste";

// =====================================================================
// Kart işlemleri
// =====================================================================
export {
  kartOlustur,
  kartGuncelle,
  kartSil,
  kartGeriYukle,
  kartiTasi,
  kartArsivToggle,
  kartTamamlamaOneri,
  kartTamamlamaOnay,
  kartTamamlamaReddet,
} from "./services-kart";

// =====================================================================
// Read / liste görünümü
// =====================================================================
export { projeDetayiniGetir, projedeTumKartlar } from "./services-detay";
