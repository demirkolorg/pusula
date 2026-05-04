import { z } from "zod";

export const BILDIRIM_TIPLERI = [
  "YORUM_MENTION",
  "KART_UYE_ATAMA",
  "MADDE_ATAMA",
  "BITIS_YAKLASIYOR",
  "BITIS_GECTI",
  "YORUM_EKLENDI",
  "EKLENTI_YUKLENDI",
] as const;

export const bildirimTipiSemasi = z.enum(BILDIRIM_TIPLERI);
export type BildirimTipi = z.infer<typeof bildirimTipiSemasi>;

export const bildirimleriListeleSemasi = z.object({
  // Sadece okunmamışları, sadece okunmuşları, ya da hepsi
  filtre: z.enum(["hepsi", "okunmamis", "okunmus"]).default("hepsi"),
  // Sayfalama: cursor BigInt id (string)
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const bildirimOkuduIsaretleSemasi = z.object({
  ids: z.array(z.string()).min(1).max(100),
});

export const tumunuOkuduIsaretleSemasi = z.object({});

export type BildirimleriListele = z.infer<typeof bildirimleriListeleSemasi>;
export type BildirimOkuduIsaretle = z.infer<typeof bildirimOkuduIsaretleSemasi>;
