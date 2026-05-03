import { test as base, expect, type Page } from "@playwright/test";

// Demo kullanıcılar — seed.ts'te oluşturulur.
export const SUPER_ADMIN = {
  email: "admin@pusula.local",
  parola: "Pusula2026!",
};

export const KAYMAKAM = {
  email: "kaymakam@pusula.local",
  parola: "Pusula2026!",
};

/**
 * Pusula login akışı: /giris sayfasından credentials ile giriş yap, panele yönlendir.
 */
export async function girisYap(
  page: Page,
  user: { email: string; parola: string },
): Promise<void> {
  await page.goto("/giris");
  await page.getByLabel(/e-?posta/i).fill(user.email);
  await page.getByLabel(/parola/i).fill(user.parola);
  await page.getByRole("button", { name: /giriş yap|giris yap/i }).click();
  // Panele yönlendirme: ana sayfa veya /ana-sayfa
  await page.waitForURL(/\/(ana-sayfa|projeler|$)/, { timeout: 10_000 });
}

export async function cikisYap(page: Page): Promise<void> {
  // Sidebar veya header'da çıkış butonu (varsa). Şimdilik cookies sil.
  await page.context().clearCookies();
}

type PusulaFixtures = {
  girisYapilmis: Page;
};

export const test = base.extend<PusulaFixtures>({
  girisYapilmis: async ({ page }, use) => {
    await girisYap(page, SUPER_ADMIN);
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture callback'i, React hook değil
    await use(page);
    await cikisYap(page);
  },
});

export { expect };
