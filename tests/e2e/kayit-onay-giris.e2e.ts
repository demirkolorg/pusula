import { test, expect, girisYap, SUPER_ADMIN } from "./fixtures/auth";

// Self-register → Kaymakamlık personeli onaylar → Yeni kullanıcı giriş yapar.
// Plan: ADR-0001 self-register akışı.

test.describe.serial("Kayıt → Onay → Giriş akışı", () => {
  // Her test çalıştırmasında benzersiz email kullan ki idempotent olsun.
  const benzersiz = `e2e-${Date.now()}@test.local`;
  const parola = "Test1234!";

  test("yeni kullanıcı kayıt sayfasında BEKLIYOR durumunda hesap oluşturur", async ({
    page,
  }) => {
    await page.goto("/kayit");

    // Kayıt formu render olmuş mu?
    await expect(page.getByText("Pusula — Kayıt")).toBeVisible();

    await page.locator("#ad").fill("E2E");
    await page.locator("#soyad").fill("Test");
    await page.locator("#email").fill(benzersiz);

    // Kurum select — id="kurum" SelectTrigger
    await page.locator("#kurum").click();
    await page.getByRole("option").first().click();

    await page.locator("#parola").fill(parola);
    await page.locator("#parolaTekrar").fill(parola);

    await page.getByRole("button", { name: /^Kayıt Ol$/i }).click();

    // Onay bekleme ekranı (h2: "Kayıt başarılı")
    await expect(page.getByText("Kayıt başarılı")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("BEKLIYOR durumundaki kullanıcı giriş yapamaz", async ({ page }) => {
    await page.goto("/giris");
    await page.locator("#email").fill(benzersiz);
    await page.locator("#parola").fill(parola);
    await page.getByRole("button", { name: /^Giriş Yap$/i }).click();

    // Login fail — hâlâ /giris yolunda
    await page.waitForTimeout(2_000);
    await expect(page).toHaveURL(/\/giris/);
  });

  test("yetkili kullanıcı onay-bekleyenler sayfasından onaylar", async ({
    page,
  }) => {
    await girisYap(page, SUPER_ADMIN);
    await page.goto("/ayarlar/onay-bekleyenler");

    await expect(page.getByText(/onay bekleyen kay/i)).toBeVisible();

    // Bekleyen kayıt görünmeli
    await expect(page.getByText(benzersiz)).toBeVisible({ timeout: 10_000 });

    // Onayla butonuna tıkla (kart içinde)
    const kart = page
      .locator("div")
      .filter({ has: page.getByText(benzersiz) })
      .last();
    await kart.getByRole("button", { name: /^Onayla$/i }).click();

    // Liste güncellenince kayıt gözükmemeli (optimistic update)
    await expect(page.getByText(benzersiz)).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test("onaylanan kullanıcı giriş yapabilir", async ({ page }) => {
    await page.goto("/giris");
    await page.locator("#email").fill(benzersiz);
    await page.locator("#parola").fill(parola);
    await page.getByRole("button", { name: /^Giriş Yap$/i }).click();

    // Panele yönlendirilir (giris sayfasından çıkmalı)
    await page.waitForURL((url) => !url.pathname.startsWith("/giris"), {
      timeout: 10_000,
    });
    await expect(page).not.toHaveURL(/\/giris/);
  });
});
