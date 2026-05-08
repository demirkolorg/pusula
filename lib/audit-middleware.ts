import { Prisma } from "@prisma/client";
import { auditContext, maskeleHassas } from "./audit-context";
import { logger } from "./logger";

// Sprint 2 / S2-1 — write-heavy + audit kritik olmayan modeller listeye eklendi.
// Audit middleware her yazma için 2-3 ek query (eski_veri lookup + yeni_veri
// snapshot + AktiviteLogu insert) yapıyor. Aşağıdaki modeller saniyede
// onlarca yazma alabilir; audit gerekmez, atlamak amplifikasyonu kapatır.
const ATLA = new Set([
  "AktiviteLogu",
  "HataLogu",
  "Oturum",
  "SifirlamaTokeni",
  // Ana sayfa "son ziyaret" widget'ı için her proje açılışında upsert edilir
  // — audit log'a yazmak gürültü olur, kullanıcı niyetiyle alınmış aksiyon değil.
  "ProjeZiyareti",
  // Bildirimler kullanıcı eylemlerinden türetilen üretim sonucu — audit
  // gerektiren işlem ana eylemde (kart güncelleme, vb.) zaten kaydedilir.
  "Bildirim",
  // Mail kuyruğu yine türetilmiş; cron her 5 dk'da onlarca satır yazıp
  // güncelliyor.
  "BildirimMailKuyrugu",
]);

const YAZMA_ISLEMLERI = new Set([
  "create",
  "createMany",
  "update",
  "updateMany",
  "upsert",
  "delete",
  "deleteMany",
]);

type IslemTipi =
  | "create"
  | "createMany"
  | "update"
  | "updateMany"
  | "upsert"
  | "delete"
  | "deleteMany";

function islemKodu(
  op: IslemTipi,
  eskiVeri: Record<string, unknown> | undefined,
): string {
  switch (op) {
    case "create":
    case "createMany":
      return "CREATE";
    case "update":
    case "updateMany":
      return "UPDATE";
    case "upsert":
      // upsert ekleme dalına girdiyse (önceki kayıt yok) CREATE,
      // güncelleme dalına girdiyse UPDATE.
      return eskiVeri ? "UPDATE" : "CREATE";
    case "delete":
    case "deleteMany":
      return "DELETE";
  }
}

function modelKucukHarf(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

// Prisma `Json` kolonu primitif olmayan tipleri (Date, BigInt, Buffer, Decimal,
// Map, Set, Symbol, Function, RegExp, Error) native serialize ederken bilgi
// kaybediyor — Date instance'ları `{}` boş object olarak yazılıyor, Buffer'lar
// keys'siz array, BigInt direkt yazılamıyor. Bu nedenle eski_veri / yeni_veri /
// diff'i DB'ye yazmadan önce TÜM değerleri JSON-safe string/primitif'e
// indirgemek ZORUNLU.
//
// Kapsam:
//  - Date              → ISO string ("2026-05-30T17:00:00.000Z")
//  - BigInt            → string ("12345")
//  - Buffer/UInt8Array → base64 string
//  - Symbol            → açıklayıcı string ("Symbol(x)")
//  - Function          → "[Function: name]"
//  - RegExp            → string ("/pattern/flags")
//  - Map               → { [key]: value } object
//  - Set               → array
//  - Error             → { name, message, stack? } object
//  - Prisma.Decimal    → string (toString() varsa)
//  - Object (POJO)     → recursive
//  - Array             → recursive
//  - undefined         → null (JSON tipinde temsil edilemez)
//  - Diğer primitif    → olduğu gibi
//
// Cycle koruması: WeakSet ile döngüsel referansları "[Circular]" string'iyle
// keser; yoksa stack overflow olur.
function jsonGuvenli(v: unknown, gorulen?: WeakSet<object>): unknown {
  // Primitif null/undefined/bool/number/string fast-path
  if (v === null) return null;
  if (v === undefined) return null;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    // NaN / Infinity JSON'da geçersiz → string'e çevir.
    if (typeof v === "number" && !Number.isFinite(v)) return String(v);
    return v;
  }
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "symbol") return v.description ? `Symbol(${v.description})` : v.toString();
  if (typeof v === "function") return `[Function: ${v.name || "anonymous"}]`;

  // Object branş — cycle guard
  if (typeof v !== "object") return String(v);
  const izle = gorulen ?? new WeakSet<object>();
  if (izle.has(v as object)) return "[Circular]";
  izle.add(v as object);

  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v.toISOString();
  }
  if (v instanceof RegExp) return v.toString();
  if (v instanceof Error) {
    return {
      name: v.name,
      message: v.message,
      ...(v.stack ? { stack: v.stack } : {}),
    };
  }
  // Buffer / Uint8Array → base64
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(v)) {
    return v.toString("base64");
  }
  if (v instanceof Uint8Array) {
    return Buffer.from(v).toString("base64");
  }
  if (v instanceof Map) {
    const o: Record<string, unknown> = {};
    for (const [k, val] of v.entries()) {
      o[String(k)] = jsonGuvenli(val, izle);
    }
    return o;
  }
  if (v instanceof Set) {
    return Array.from(v).map((it) => jsonGuvenli(it, izle));
  }
  if (Array.isArray(v)) {
    return v.map((it) => jsonGuvenli(it, izle));
  }
  // Prisma.Decimal & benzeri custom toJSON — toString() ile temsil edilebilirse
  // string'e çevir (Decimal'in primitif eşdeğeri).
  const ctorAd =
    (v as { constructor?: { name?: string } }).constructor?.name ?? null;
  if (ctorAd === "Decimal" || ctorAd === "PrismaDecimal") {
    const t = v as { toString: () => string };
    return typeof t.toString === "function" ? t.toString() : null;
  }
  // POJO / sınıf instance — kendi toJSON'u varsa ondan başla, yoksa keys'i tara
  const yanal = v as { toJSON?: () => unknown };
  if (typeof yanal.toJSON === "function") {
    try {
      return jsonGuvenli(yanal.toJSON(), izle);
    } catch {
      // toJSON throw ederse generic object yoluna düş
    }
  }
  const o: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    o[k] = jsonGuvenli(val, izle);
  }
  return o;
}

// Diff hesaplaması da `jsonGuvenli` üzerinden geçer — Date/BigInt/Buffer'ı
// karşılaştırırken native JSON.stringify yanlış sonuç verir (Date → "{}",
// BigInt → throw). Önce iki tarafı normalize edip, normalize edilmiş halleri
// karşılaştırırız ve diff'e de normalize edilmiş halleri yazarız (DB'ye
// yazılırken tekrar dönüştürülmesine gerek kalmaz).
function diffHesapla(
  eski: Record<string, unknown> | undefined,
  yeni: Record<string, unknown> | undefined,
): Record<string, { eski: unknown; yeni: unknown }> | undefined {
  if (!eski || !yeni) return undefined;
  const eskiNorm = jsonGuvenli(eski) as Record<string, unknown>;
  const yeniNorm = jsonGuvenli(yeni) as Record<string, unknown>;
  const sonuc: Record<string, { eski: unknown; yeni: unknown }> = {};
  const anahtarlar = new Set([
    ...Object.keys(eskiNorm),
    ...Object.keys(yeniNorm),
  ]);
  for (const k of anahtarlar) {
    const a = eskiNorm[k];
    const b = yeniNorm[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      sonuc[k] = { eski: a, yeni: b };
    }
  }
  return Object.keys(sonuc).length > 0 ? sonuc : undefined;
}

function kaynakIdAl(deger: unknown): string | undefined {
  if (deger && typeof deger === "object" && "id" in deger) {
    const id = (deger as { id: unknown }).id;
    if (typeof id === "string" || typeof id === "number" || typeof id === "bigint") {
      return String(id);
    }
  }
  return undefined;
}

type ParentClient = {
  aktiviteLogu: {
    create: (args: { data: Prisma.AktiviteLoguCreateInput }) => Promise<unknown>;
  };
  [model: string]: unknown;
};

export const auditExtension = Prisma.defineExtension((client) => {
  const parent = client as unknown as ParentClient;

  return client.$extends({
    name: "audit-loglayici",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const ctx = auditContext.get();
          const yazma = YAZMA_ISLEMLERI.has(operation);
          const atlanir = !model || ATLA.has(model);
          const bypass = ctx?.bypass === true;

          if (!yazma || atlanir || bypass) {
            return query(args as Parameters<typeof query>[0]);
          }

          const op = operation as IslemTipi;

          let eskiVeri: Record<string, unknown> | undefined;
          const where = (args as { where?: unknown }).where;
          if (
            (op === "update" || op === "delete" || op === "upsert") &&
            where &&
            typeof where === "object"
          ) {
            try {
              const modelClient = parent[modelKucukHarf(model)] as
                | { findUnique: (a: { where: unknown }) => Promise<unknown> }
                | undefined;
              if (modelClient && typeof modelClient.findUnique === "function") {
                const onceki = await modelClient.findUnique({ where });
                if (onceki && typeof onceki === "object") {
                  eskiVeri = maskeleHassas(onceki) as Record<string, unknown>;
                }
              }
            } catch {

            }
          }

          // Kural 58 — KATİ AUDIT GUARD: yazım operasyonu var ama audit
          // context yoksa veya kullaniciId boşsa, hiçbir yazıma izin verme.
          // Sessiz null kabul = "Sistem" görünen kayıtların kaynağı; bu yola
          // hard fail koyarak eksik sarmalama bug'ını anında görünür yapıyoruz.
          //
          // İstisna kaçışları:
          //  - `auditContext.run({ bypass: true, ... })` → cron/seed/migration
          //  - `auditContext.run({ kullaniciId: <SISTEM_USER_ID> })` → otomatik
          //    sistem işlemi için açık sistem kullanıcısı atama
          //
          // İki seçenek de YOKSA → throw. AktiviteLogu.kullanici_id = null
          // satırı bir daha asla yazılmaz.
          if (!ctx?.kullaniciId) {
            throw new Error(
              `[audit] Yazım reddedildi: ${model}.${operation} ` +
                `audit-context dışından çağrıldı (kullaniciId yok). ` +
                `Çağrıyı eylem() wrapper içine alın veya auditContext.run({ ` +
                `kullaniciId, ... }) / { bypass: true } ile sarmalayın. ` +
                `İPUCU: auditContext.run callback'i ZORUNLU async olmalı ve ` +
                `içindeki tüm DB çağrıları await edilmeli — sync callback ` +
                `lazy Promise döndürünce context erkenden kapanır.`,
            );
          }

          const sonuc = await query(args as Parameters<typeof query>[0]);

          try {
            const yeniVeri =
              sonuc && typeof sonuc === "object" && !Array.isArray(sonuc)
                ? (maskeleHassas(sonuc) as Record<string, unknown>)
                : undefined;

            const kaynakId =
              kaynakIdAl(sonuc) ??
              (where ? kaynakIdAl(where) : undefined);

            const diff = diffHesapla(eskiVeri, yeniVeri);

            // JSON kolonlarına yazmadan önce Date/BigInt değerlerini
            // ISO string'e normalize et (yukarıdaki açıklamaya bkz).
            const eskiVeriSafe = jsonGuvenli(eskiVeri) as
              | Prisma.InputJsonValue
              | undefined;
            const yeniVeriSafe = jsonGuvenli(yeniVeri) as
              | Prisma.InputJsonValue
              | undefined;
            const diffSafe = jsonGuvenli(diff) as
              | Prisma.InputJsonValue
              | undefined;

            await parent.aktiviteLogu.create({
              data: {
                zaman: new Date(),
                // Yukarıdaki KATİ AUDIT GUARD nedeniyle ctx.kullaniciId
                // burada her zaman doludur — null olamaz.
                kullanici_id: ctx.kullaniciId,
                oturum_id: ctx?.oturumId ?? null,
                ip: ctx?.ip ?? null,
                user_agent: ctx?.userAgent ?? null,
                request_id: ctx?.requestId ?? null,
                http_metod: ctx?.httpMetod ?? null,
                http_yol: ctx?.httpYol ?? null,
                islem: islemKodu(op, eskiVeri),
                kaynak_tip: model,
                kaynak_id: kaynakId ?? null,
                eski_veri: eskiVeriSafe ?? Prisma.JsonNull,
                yeni_veri: yeniVeriSafe ?? Prisma.JsonNull,
                diff: diffSafe ?? Prisma.JsonNull,
                meta: jsonGuvenli({ prisma_op: operation }) as Prisma.InputJsonValue,
                sebep: ctx?.sebep ?? null,
              },
            });
          } catch (err) {
            // Sprint 3 / S3-17 — `console.error` → Pino logger.
            logger.warn(
              { err: err instanceof Error ? err.message : String(err) },
              "[audit] log yazılamadı",
            );
          }

          return sonuc;
        },
      },
    },
  });
});
