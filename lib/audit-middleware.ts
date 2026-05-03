import { Prisma } from "@prisma/client";
import { auditContext, maskeleHassas } from "./audit-context";

const ATLA = new Set([
  "AktiviteLogu",
  "HataLogu",
  "Oturum",
  "SifirlamaTokeni",
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

function islemKodu(op: IslemTipi): string {
  switch (op) {
    case "create":
    case "createMany":
      return "CREATE";
    case "update":
    case "updateMany":
    case "upsert":
      return "UPDATE";
    case "delete":
    case "deleteMany":
      return "DELETE";
  }
}

function modelKucukHarf(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
}

function diffHesapla(
  eski: Record<string, unknown> | undefined,
  yeni: Record<string, unknown> | undefined,
): Record<string, { eski: unknown; yeni: unknown }> | undefined {
  if (!eski || !yeni) return undefined;
  const sonuc: Record<string, { eski: unknown; yeni: unknown }> = {};
  const anahtarlar = new Set([...Object.keys(eski), ...Object.keys(yeni)]);
  for (const k of anahtarlar) {
    const a = eski[k];
    const b = yeni[k];
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

            await parent.aktiviteLogu.create({
              data: {
                zaman: new Date(),
                kullanici_id: ctx?.kullaniciId ?? null,
                oturum_id: ctx?.oturumId ?? null,
                ip: ctx?.ip ?? null,
                user_agent: ctx?.userAgent ?? null,
                request_id: ctx?.requestId ?? null,
                http_metod: ctx?.httpMetod ?? null,
                http_yol: ctx?.httpYol ?? null,
                islem: islemKodu(op),
                kaynak_tip: model,
                kaynak_id: kaynakId ?? null,
                eski_veri: (eskiVeri as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                yeni_veri: (yeniVeri as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                diff: (diff as Prisma.InputJsonValue) ?? Prisma.JsonNull,
                meta: { prisma_op: operation } as Prisma.InputJsonValue,
                sebep: ctx?.sebep ?? null,
              },
            });
          } catch (err) {
            if (process.env.NODE_ENV !== "production") {

              console.error("[audit] log yazılamadı:", err);
            }
          }

          return sonuc;
        },
      },
    },
  });
});
