import { z } from "zod";
import { bildirimTipiSemasi } from "@/app/(panel)/bildirimler/schemas";

// Tek tercih güncellemesi — bir tip × iki kanal birden gönderilebilir.
// Optional alanlar = "değiştirme"; her ikisi de undefined olamaz (refine).
export const bildirimTercihGuncelleSemasi = z
  .object({
    tip: bildirimTipiSemasi,
    in_app_acik: z.boolean().optional(),
    email_acik: z.boolean().optional(),
  })
  .refine((v) => v.in_app_acik !== undefined || v.email_acik !== undefined, {
    message: "En az bir kanal güncellenmeli.",
  });

export type BildirimTercihGuncelle = z.infer<
  typeof bildirimTercihGuncelleSemasi
>;
