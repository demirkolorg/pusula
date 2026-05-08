"use server";

// Sprint 4 / S4-16 — Profil yönetimi server action'ları.
// Audit log otomatik (Kural 42) — Kullanici update'i middleware tarafından
// yakalanır; parola_hash değişikliği audit'e DEĞİL HataLogu'na değil normal
// AktiviteLogu'na yazılır (parola alanı maskelendi — Kural 59).

import { revalidatePath } from "next/cache";
import { eylem } from "@/lib/action-wrapper";
import { kullaniciIdAl } from "@/lib/action-helpers";
import {
  parolaDegistirSemasi,
  profilGuncelleSemasi,
} from "./schemas";
import { parolayiDegistir, profiliGuncelle } from "./services";

export const profilGuncelleEylem = eylem({
  ad: "profil:guncelle",
  girdi: profilGuncelleSemasi,
  calistir: async (girdi, ctx) => {
    const kullaniciId = kullaniciIdAl(ctx);
    await profiliGuncelle(kullaniciId, girdi);
    revalidatePath("/profil");
    return { id: kullaniciId };
  },
});

export const parolaDegistirEylem = eylem({
  ad: "profil:parola-degistir",
  girdi: parolaDegistirSemasi,
  calistir: async (girdi, ctx) => {
    const kullaniciId = kullaniciIdAl(ctx);
    await parolayiDegistir(kullaniciId, girdi);
    return { degistirildi: true } as const;
  },
});
