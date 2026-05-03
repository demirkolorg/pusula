import { test, expect, girisYap, SUPER_ADMIN } from "./fixtures/auth";

// Kurum CRUD akışı: liste görüntüleme → kategori filtre → yeni kurum oluşturma
// → düzenleme → silme. ADR-0001 sonrası /ayarlar/kurumlar route'u.

test.describe("Kurum CRUD akışı", () => {
  const benzersiz = `E2E Eczane ${Date.now()}`;

  test("liste sayfası açılır, seed kurumları görünür", async ({ page }) => {
    await girisYap(page, SUPER_ADMIN);
    await page.goto("/ayarlar/kurumlar");

    await expect(
      page.getByRole("heading", { name: /kurumlar/i }),
    ).toBeVisible();

    // Seed: KAYMAKAMLIK gibi tekil bir kayıt mutlaka var
    await expect(page.getByText("Kaymakamlık").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("yeni kurum (çoklu tip = Eczane) ekler ve listede görünür", async ({
    page,
  }) => {
    await girisYap(page, SUPER_ADMIN);
    await page.goto("/ayarlar/kurumlar");

    await page.getByRole("button", { name: /yeni kurum/i }).click();

    // Sheet açılınca kategori "MULKI_IDARE" default. SAGLIK seç.
    const kategori = page.getByLabel(/^Kategori$/i);
    await kategori.click();
    await page.getByRole("option", { name: /sağlık/i }).click();

    // Tip otomatik ilk SAGLIK tipine geçer (ILCE_SAGLIK_MUDURLUGU). ECZANE seç.
    const tip = page.getByLabel(/^Tip$/i);
    await tip.click();
    await page.getByRole("option", { name: /^Eczane$/i }).click();

    // Çoklu tip: ad zorunlu
    await page.getByLabel(/^Ad/i).fill(benzersiz);

    await page.getByRole("button", { name: /^Kaydet$/i }).click();

    // Toast veya satır gözükmesi — optimistic + invalidate
    await expect(page.getByText(benzersiz).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("kategori filtresi çalışır (Sağlık seçilince diğerleri gizlenir)", async ({
    page,
  }) => {
    await girisYap(page, SUPER_ADMIN);
    await page.goto("/ayarlar/kurumlar");

    // Filtre: Sağlık
    const filtre = page.getByRole("combobox").filter({ hasText: /tüm kate/i });
    await filtre.click();
    await page.getByRole("option", { name: /sağlık/i }).click();

    // Eczane görünmeli (önceki testten kalmadıysa kaymakamlık olmamalı)
    await expect(page.getByText(/Kaymakamlık$/).first()).not.toBeVisible({
      timeout: 5_000,
    });
  });

  test("oluşturulan kurum silinebilir (soft delete)", async ({ page }) => {
    await girisYap(page, SUPER_ADMIN);
    await page.goto("/ayarlar/kurumlar");

    // Önceki testte oluşturulan benzersiz eczaneyi bul, sil butonuna bas
    const satir = page.getByText(benzersiz).first().locator("xpath=ancestor::tr|ancestor::div[contains(@class,'card')]");
    if ((await satir.count()) === 0) {
      // Mobile card view veya farklı yapı — text'in yakınındaki sil butonuna git
      await page
        .locator(`text="${benzersiz}"`)
        .first()
        .scrollIntoViewIfNeeded();
    }

    await page
      .getByRole("button", { name: /^Sil$|sil$/i })
      .last()
      .click();

    // Onay diyaloğu
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: /^Sil$/i })
      .click();

    // Toast: silindi
    await expect(page.getByText(/silindi/i).first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
