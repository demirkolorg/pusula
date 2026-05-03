import { z } from "zod";
import { auth } from "@/auth";
import { auditContext, type AuditContext } from "./audit-context";
import { istekContextAl } from "./request-context";
import { hataKaydet } from "./hata-kayit";
import { hata, ok, HATA_KODU, type Sonuc } from "./sonuc";

type SeansBilgisi = {
  kullaniciId: string;
  kurumId?: string;
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

    const seans: SeansBilgisi | null = oturum?.user
      ? {
          kullaniciId: (oturum.user as { id: string }).id,
          kurumId: (oturum.user as { kurumId?: string }).kurumId,
          email: oturum.user.email ?? "",
          roller: (oturum.user as { roller?: string[] }).roller ?? [],
        }
      : null;

    if (cfg.girisGerekli !== false && !seans) {
      return hata("Bu işlem için giriş yapmalısınız.", HATA_KODU.GIRIS_YOK);
    }

    const auditCtx: AuditContext = {
      kullaniciId: seans?.kullaniciId,
      requestId: istekCtx.requestId,
      ip: istekCtx.ip,
      userAgent: istekCtx.userAgent,
      httpMetod: "ACTION",
      httpYol: cfg.ad,
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
          return hata(err.message, err.kod, err.alanlar);
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
