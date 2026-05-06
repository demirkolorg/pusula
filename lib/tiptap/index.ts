// ADR-0023 — Tiptap server-side public API.
//
// Bu barrel sadece server-safe (React'siz) modülleri yeniden ihraç eder.
// Tiptap editor / extensions / suggestion render gibi client-only kodlar
// `components/tiptap/` altındadır.

export {
  tiptapDokumanSemasi,
  tiptapDugumSemasi,
  TIPTAP_MAX_DERINLIK,
  TIPTAP_MAX_DUGUM,
  TIPTAP_MAX_METIN,
  type TiptapDokuman,
  type TiptapDugumTipi,
} from "./schema";

export {
  bosTiptapDokuman,
  metinTiptapDokumana,
  tiptapDokumaniBosMu,
  tiptapDokumaniMetne,
} from "./serialize";

export { tiptapMentionIdleriniCikar } from "./mention";
