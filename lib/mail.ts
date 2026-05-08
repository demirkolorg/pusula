import { Resend } from "resend";
import { render } from "@react-email/render";
import { logger } from "./logger";

// Mail altyapısı (ADR-0011).
//
// Provider seçimi: `MAIL_PROVIDER` env değişkeni — `resend` veya `stub`.
// `resend` seçilirse `RESEND_API_KEY` ve `MAIL_FROM` zorunludur.
// Aksi halde stub fallback (log + console — dev için).
//
// Hata yönetimi: provider hatası `MailGonderimHatasi` fırlatır ki çağıran
// (örn. davetOlustur) fail-fast davransın. Davet token DB'ye yazıldıktan
// sonra mail fail olursa, davet kaydı silinir; çağıran transaction içinde
// tutarlılığı sağlar (S/53 — try/catch + EylemHatasi).

export type MailGonderim = {
  alici: string;
  konu: string;
  /** Düz metin gövde — istemcide HTML desteği yoksa görünür. */
  govde: string;
  /** HTML gövde (opsiyonel) — varsa öncelikli render edilir. */
  html?: string;
};

export class MailGonderimHatasi extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailGonderimHatasi";
  }
}

const PROVIDER = process.env.MAIL_PROVIDER ?? "stub";
const FROM = process.env.MAIL_FROM ?? "Pusula <onboarding@resend.dev>";
const RESEND_KEY = process.env.RESEND_API_KEY;

// MAIL_DEV_ALICI_OVERRIDE — geliştirme katmanı: domain doğrulanmadan Resend
// sandbox'ında yalnız hesap sahibinin e-postasına gönderebiliyoruz. Bu env
// tanımlıysa tüm mailler buraya yönlendirilir; orijinal alıcı konu + gövde
// başına yazılır. Production'da BOŞ bırakılır → override devre dışı.
const ALICI_OVERRIDE = process.env.MAIL_DEV_ALICI_OVERRIDE?.trim() || null;

let _resend: Resend | null = null;
function resend(): Resend {
  if (_resend) return _resend;
  if (!RESEND_KEY) {
    throw new MailGonderimHatasi(
      "RESEND_API_KEY tanımlı değil — mail gönderilemiyor.",
    );
  }
  _resend = new Resend(RESEND_KEY);
  return _resend;
}

export async function mailGonder(m: MailGonderim): Promise<void> {
  const overrideAktif = Boolean(ALICI_OVERRIDE) && ALICI_OVERRIDE !== m.alici;
  const efektifAlici = overrideAktif ? ALICI_OVERRIDE! : m.alici;
  const efektifKonu = overrideAktif ? `[→ ${m.alici}] ${m.konu}` : m.konu;
  const efektifGovde = overrideAktif
    ? `[GELIŞTIRME OVERRIDE] Bu mail aslında ${m.alici} adresine gidecekti. Override aktif olduğu için size yönlendirildi.\n\n---\n\n${m.govde}`
    : m.govde;
  const efektifHtml = overrideAktif && m.html ? overrideHtmlSar(m.html, m.alici) : m.html;

  const ozet = {
    alici: efektifAlici,
    orijinal_alici: m.alici,
    konu: efektifKonu,
    govde:
      efektifGovde.length > 500
        ? efektifGovde.slice(0, 500) + "..."
        : efektifGovde,
    provider: PROVIDER,
    override: overrideAktif,
  };

  if (PROVIDER === "stub" || !RESEND_KEY) {
    // Sprint 5 / S5-12 — Pino logger üzerinden structured log; geliştirici
    // konsol görmek istiyorsa `LOG_LEVEL=info` ayarı yeterli.
    logger.info(
      {
        ...ozet,
        alici: efektifAlici,
        ...(overrideAktif ? { orijinalAlici: m.alici } : {}),
        konu: efektifKonu,
        govde: efektifGovde,
      },
      "[mail-stub] Mail gönderilecekti (DEV)",
    );
    return;
  }

  if (PROVIDER === "resend") {
    try {
      const sonuc = await resend().emails.send({
        from: FROM,
        to: efektifAlici,
        subject: efektifKonu,
        html: efektifHtml ?? `<pre>${escapeHtml(efektifGovde)}</pre>`,
        text: efektifGovde,
      });
      if (sonuc.error) {
        logger.error({ ...ozet, hata: sonuc.error }, "[mail] Resend hata");
        throw new MailGonderimHatasi(
          sonuc.error.message ?? "Resend gönderim başarısız.",
        );
      }
      logger.info(
        { ...ozet, message_id: sonuc.data?.id },
        "[mail] Resend gönderildi",
      );
      return;
    } catch (err) {
      if (err instanceof MailGonderimHatasi) throw err;
      logger.error({ ...ozet, hata: String(err) }, "[mail] Resend exception");
      throw new MailGonderimHatasi(
        err instanceof Error ? err.message : "Mail gönderilemedi.",
      );
    }
  }

  throw new MailGonderimHatasi(`Bilinmeyen MAIL_PROVIDER: ${PROVIDER}`);
}

function overrideHtmlSar(html: string, orijinalAlici: string): string {
  const banner = `<div style="background:#fff3cd;border:1px solid #ffc107;padding:12px 16px;margin:0 0 16px;border-radius:6px;font-family:sans-serif;font-size:13px;color:#664d03"><strong>⚠ Geliştirme Override</strong><br>Bu mail aslında <code>${escapeHtml(orijinalAlici)}</code> adresine gidecekti.</div>`;
  // <body ...> sonrasına banner enjekte et
  return html.replace(/<body([^>]*)>/i, `<body$1>${banner}`);
}

/**
 * React Email component'inden HTML render eder. Server-side kullan; client
 * bundle'a sızdırma (sıkı side-effect).
 */
export async function mailHtmlRender(
  jsx: React.ReactElement,
): Promise<string> {
  return render(jsx);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
