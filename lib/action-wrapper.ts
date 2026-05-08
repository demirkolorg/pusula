import { z } from "zod";
import { auth } from "@/auth";
import { auditContext, type AuditContext } from "./audit-context";
import { istekContextAl } from "./request-context";
import { hataKaydet } from "./hata-kayit";
import { hata, ok, HATA_KODU, type Sonuc } from "./sonuc";

type SeansBilgisi = {
  kullaniciId: string;
  birimId?: string;
  email: string;
  roller: string[];
};

export type ActionContext = {
  oturum: SeansBilgisi | null;
};

type ActionConfig<S extends z.ZodTypeAny | undefined, T> = {
  ad: string;
  girdi?: S;
  girisGerekli?: boolean;
  calistir: (
    girdi: S extends z.ZodTypeAny ? z.infer<S> : undefined,
    ctx: ActionContext,
  ) => Promise<T>;
};

export function eylem<S extends z.ZodTypeAny | undefined, T>(
  cfg: ActionConfig<S, T>,
): (girdi: S extends z.ZodTypeAny ? z.infer<S> : undefined) => Promise<Sonuc<T>> {
  return async (girdi) => {
    const istekCtx = await istekContextAl();
    const oturum = await auth();

    // Runtime guard — `as` cast'i imalı, gerçek değer undefined olabilir.
    // session.user.id non-empty string değilse seans = null kabul edilir.
    const ham = oturum?.user as
      | { id?: unknown; birimId?: unknown; roller?: unknown }
      | undefined;
    const hamId = ham?.id;
    const seans: SeansBilgisi | null =
      ham && typeof hamId === "string" && hamId.length > 0
        ? {
            kullaniciId: hamId,
            birimId:
              typeof ham.birimId === "string" ? ham.birimId : undefined,
            email: oturum?.user?.email ?? "",
            roller: Array.isArray(ham.roller)
              ? (ham.roller as string[])
              : [],
          }
        : null;

    // Why: NextAuth eski bir JWT'de `token.id` yoksa session.user.id undefined
    // dönebilir. Bu durumda seans truthy olur ama kullaniciId boş kalır →
    // audit log'a kullanici_id null yazılır ("Sistem" görünür). Burada bunu
    // yakalayıp kullanıcıyı yeniden login'e yönlendiriyoruz; audit kirletilmez.
    if (cfg.girisGerekli !== false && (!seans || !seans.kullaniciId)) {
      return hata(
        "Oturum bilgisi eksik. Lütfen yeniden giriş yapın.",
        HATA_KODU.GIRIS_YOK,
      );
    }

    const auditCtx: AuditContext = {
      kullaniciId: seans?.kullaniciId,
      requestId: istekCtx.requestId,
      ip: istekCtx.ip,
      userAgent: istekCtx.userAgent,
      httpMetod: "ACTION",
      httpYol: cfg.ad,
      // Anonim akışlar (kayit, parola-sifirla, davet-kabul) için kullaniciId
      // null olur. KATİ AUDIT GUARD'ı bu durumda bypass et — yeni oluşacak
      // kullanıcının id'si henüz yok. Audit log'a kayıt yazılmaz, ama
      // domain işlemi (Kullanici.create) gerçekleşebilir.
      bypass: !seans?.kullaniciId && cfg.girisGerekli === false,
    };

    return auditContext.run(auditCtx, async () => {
      try {
        let veri: unknown = girdi;
        if (cfg.girdi) {
          const dogrulama = cfg.girdi.safeParse(girdi);
          if (!dogrulama.success) {
            const alanlar: Record<string, string> = {};
            for (const issue of dogrulama.error.issues) {
              const yol = issue.path.join(".");
              if (yol) alanlar[yol] = issue.message;
            }
            // GEÇİCİ DEBUG: production'da Zod validation hatalarını server
            // log'a yaz; client toast'ta sadece "Girdi doğrulanamadı"
            // göründüğü için hangi alanın fail ettiği görülemiyordu.
            // Sorun çözüldükten sonra bu log kaldırılacak.
            console.error(
              `[action-wrapper] Zod fail: ad=${cfg.ad}`,
              JSON.stringify(
                {
                  issues: dogrulama.error.issues.map((i) => ({
                    path: i.path,
                    code: i.code,
                    message: i.message,
                  })),
                  alanlar,
                },
                null,
                2,
              ),
            );
            return hata("Girdi doğrulanamadı.", HATA_KODU.GECERSIZ_GIRDI, alanlar);
          }
          veri = dogrulama.data;
        }

        const sonuc = await cfg.calistir(
          veri as S extends z.ZodTypeAny ? z.infer<S> : undefined,
          { oturum: seans },
        );
        return ok(sonuc);
      } catch (err) {
        if (err instanceof EylemHatasi) {
          await hataKaydet({
            seviye: err.seviye,
            hata: err,
            url: cfg.ad,
            ekstra: { kod: err.kod, alanlar: err.alanlar },
          });
          // Sprint 1 / S1-15 — DB/internal sızıntı pattern'leri jenerik
          // mesaja düşürülür. Orijinal mesaj log'da tam kalır.
          return hata(
            eylemHatasiniGuvenliMesajaCevir(err.message),
            err.kod,
            err.alanlar,
          );
        }

        await hataKaydet({
          seviye: "ERROR",
          hata: err,
          url: cfg.ad,
        });
        return hata(
          "İşlem tamamlanamadı. Tekrar deneyin.",
          HATA_KODU.IC_HATA,
        );
      }
    });
  };
}

export class EylemHatasi extends Error {
  constructor(
    mesaj: string,
    public kod: string,
    public alanlar?: Record<string, string>,
    public seviye: "WARN" | "ERROR" | "FATAL" = "WARN",
  ) {
    super(mesaj);
    this.name = "EylemHatasi";
  }
}

// Sprint 1 / S1-15 — Prisma / DB / runtime internals sızıntı pattern'leri.
// Service katmanı yanlışlıkla `throw new EylemHatasi(prismaErr.message, ...)`
// yaparsa kullanıcı schema/sütun/constraint adlarını görmez. Orijinal mesaj
// `hataKaydet` ile log'da tam tutulur.
const HASSAS_PATTERN_LISTE: ReadonlyArray<RegExp> = [
  /\bP\d{4}\b/, // Prisma error code (P2002, P2025, vb.)
  /^prisma:/i,
  /\.prisma/i,
  /constraint.*violation/i,
  /foreign key constraint/i,
  /unique constraint/i,
  /column .* does not exist/i,
  /relation .* does not exist/i,
  /database url/i,
  /at \w[\w.]*\s*\(.+:\d+:\d+\)/, // node stack frame
];

function eylemHatasiniGuvenliMesajaCevir(mesaj: string): string {
  if (mesaj.length > 500) {
    return "İşlem tamamlanamadı. Tekrar deneyin.";
  }
  for (const re of HASSAS_PATTERN_LISTE) {
    if (re.test(mesaj)) {
      return "İşlem tamamlanamadı. Tekrar deneyin.";
    }
  }
  return mesaj;
}
