import { z } from "zod";

import { KURUM_ADI_MAX, UYGULAMA_ADI_MAX } from "@/lib/stores/kurum-ayari-store";

export const genelAyarSemasi = z.object({
  kurumAdi: z
    .string()
    .trim()
    .min(2, "En az 2 karakter olmalı.")
    .max(KURUM_ADI_MAX, `En fazla ${KURUM_ADI_MAX} karakter olabilir.`),
  uygulamaAdi: z
    .string()
    .trim()
    .min(2, "En az 2 karakter olmalı.")
    .max(UYGULAMA_ADI_MAX, `En fazla ${UYGULAMA_ADI_MAX} karakter olabilir.`),
});

export type GenelAyarFormu = z.infer<typeof genelAyarSemasi>;
