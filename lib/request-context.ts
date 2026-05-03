import { headers } from "next/headers";

export const ISTEK_BASLIK = "x-request-id";

export async function istekIdAl(): Promise<string | undefined> {
  const baslik = await headers();
  return baslik.get(ISTEK_BASLIK) ?? undefined;
}

export async function istekContextAl(): Promise<{
  requestId?: string;
  ip?: string;
  userAgent?: string;
}> {
  const baslik = await headers();
  const ip =
    baslik.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    baslik.get("x-real-ip") ??
    undefined;
  return {
    requestId: baslik.get(ISTEK_BASLIK) ?? undefined,
    ip,
    userAgent: baslik.get("user-agent") ?? undefined,
  };
}
