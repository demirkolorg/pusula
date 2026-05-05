// Adım 3 — Bildirim sistemi telemetri sayaçları.
//
// In-memory counter (Map). Her çağrıda artar, /api/bildirim-metrikler
// endpoint'i tarafından okunabilir + Prometheus formatında dökülebilir.
// Server restart'ta sıfırlanır — gözlemlenebilirlik için "since-boot"
// metrikleri yeterli; long-term metric için Prometheus/OpenTelemetry
// scrape eder.
//
// Tasarım notu: Birden fazla Next.js instance'ı varsa (Faz 6.2 Redis
// adapter ile yatay ölçek), her instance kendi sayacını tutar; aggregator
// (Prometheus) tüm instance'ları toplar. Şimdilik tek instance.

import { logger } from "./logger";

type SayacAnahtari =
  | "bildirim.uretildi.toplam"
  | "bildirim.uretildi.in_app_dustu"
  | "bildirim.uretildi.email_dustu"
  | "bildirim.uretildi.susturma_dustu"
  | "bildirim.tipi"
  | "bildirim.email.gonderildi"
  | "bildirim.email.basarisiz"
  | "bildirim.cron.tetiklendi"
  | "bildirim.cron.basarisiz"
  | "socket.broadcast.basarili"
  | "socket.broadcast.basarisiz"
  // ADR-0020 — öneri retention cron'u
  | "oneri.retention.tetiklendi"
  | "oneri.retention.basarisiz";

// Prometheus best practice: snake_case + base unit. Anahtarları
// `bildirim_uretildi_toplam` formatına çevirme yardımcısı.
function promKey(k: string): string {
  return k.replace(/\./g, "_");
}

const sayaclar = new Map<string, number>();

/**
 * Sayaç artır. `etiketler` opsiyonel — `tip:YORUM_MENTION` gibi label
 * isteniyorsa anahtara `{tip}` formatı eklenir.
 */
export function metrikArttir(
  anahtar: SayacAnahtari,
  artis = 1,
  etiketler?: Record<string, string>,
): void {
  const tam = etiketler
    ? `${anahtar}|${Object.entries(etiketler)
        .map(([k, v]) => `${k}=${v}`)
        .join(",")}`
    : anahtar;
  sayaclar.set(tam, (sayaclar.get(tam) ?? 0) + artis);
}

/**
 * Tüm sayaçları snapshot olarak döndür. /api/bildirim-metrikler
 * endpoint'i kullanır.
 */
export function metrikSnapshot(): Record<string, number> {
  return Object.fromEntries(sayaclar);
}

/**
 * Prometheus exposition format'ında çıktı üret. `# HELP` + `# TYPE` +
 * sayaç satırları. Endpoint `/api/bildirim-metrikler?format=prom` için.
 */
export function prometheusOlarak(): string {
  const satirlar: string[] = [];
  const grup = new Map<string, Array<{ etiket: string; deger: number }>>();
  for (const [tam, deger] of sayaclar) {
    const [anahtar, etiketStr = ""] = tam.split("|");
    if (!anahtar) continue;
    const arr = grup.get(anahtar) ?? [];
    arr.push({ etiket: etiketStr, deger });
    grup.set(anahtar, arr);
  }
  for (const [anahtar, satirlarGrubu] of grup) {
    const promName = promKey(anahtar);
    satirlar.push(`# HELP ${promName} Bildirim sistemi sayacı`);
    satirlar.push(`# TYPE ${promName} counter`);
    for (const s of satirlarGrubu) {
      const labels = s.etiket
        ? `{${s.etiket
            .split(",")
            .map((e) => {
              const [k, v] = e.split("=");
              return `${k}="${v}"`;
            })
            .join(",")}}`
        : "";
      satirlar.push(`${promName}${labels} ${s.deger}`);
    }
  }
  return satirlar.join("\n") + "\n";
}

/**
 * Periyodik logger dump — 5dk'da bir tüm sayaçları structured log olarak
 * yazar. Production'da Prometheus scrape varsa gereksiz; dev'de gözlem.
 */
export function metrikLogDump(): void {
  const snapshot = metrikSnapshot();
  if (Object.keys(snapshot).length === 0) return;
  logger.info({ metrikler: snapshot }, "[bildirim-metrik] periyodik dump");
}
