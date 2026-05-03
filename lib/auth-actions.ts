"use server";

import { signOut } from "@/auth";

/**
 * Server action — oturumu kapatır ve giriş ekranına yönlendirir.
 * Form action ile çağrılır (Base UI Menu kapanma akışından bağımsız).
 */
export async function cikisYapAction(): Promise<void> {
  await signOut({ redirectTo: "/giris" });
}
