import { test as base, expect, type Page } from "@playwright/test";

// Demo kullanıcılar - seed.ts içinde oluşturulur.
export const SUPER_ADMIN = {
  email: "admin@pusula.local",
  parola: "Pusula2026!",
};

export const KAYMAKAM = {
  email: "kaymakam@tekman.gov.tr",
  parola: "Pusula2026!",
};

export async function girisYap(
  page: Page,
  user: { email: string; parola: string },
): Promise<void> {
  await page.goto("/giris");
  await page.getByLabel(/e-?posta/i).fill(user.email);
  await page.getByLabel(/parola/i).fill(user.parola);
  await page.getByRole("button", { name: /giriş yap|giris yap/i }).click();
  await page.waitForURL(/\/(ana-sayfa|projeler|$)/, { timeout: 10_000 });
}

export async function cikisYap(page: Page): Promise<void> {
  await page.context().clearCookies();
}

type PusulaFixtures = {
  girisYapilmis: Page;
};

export const test = base.extend<PusulaFixtures>({
  girisYapilmis: async ({ page }, use) => {
    await girisYap(page, SUPER_ADMIN);
    await use(page);
    await cikisYap(page);
  },
});

export { expect };
