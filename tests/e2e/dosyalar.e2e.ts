import { test, expect, girisYap, SUPER_ADMIN } from "./fixtures/auth";

// ADR-0028 / F10 — Dosya yönetimi merkezi sayfası E2E happy path.
// Kontrol Kural 17 — 3 viewport (Pixel 7 mobile, iPad tablet, desktop).
// Senaryolar:
//   1. /dosyalar sayfası yetkili kullanıcıya açılır, başlık + filtre çubuğu render
//   2. Filtre değişikliği URL'e yansır (paylaşılabilir link)
//   3. Çöp kutusu toggle çalışır (URL'de silinmis=1)
//   4. Mobile'de tablo değil card-list görünür (Kural 15)

test.describe("Dosyalar sayfası — happy path", () => {
  test.beforeEach(async ({ page }) => {
    await girisYap(page, SUPER_ADMIN);
  });

  test("yetkili kullanıcı /dosyalar açar, başlık + filtre çubuğu görünür", async ({
    page,
  }) => {
    await page.goto("/dosyalar");

    // Başlık
    await expect(
      page.getByRole("heading", { name: /^Dosyalar$/, level: 1 }),
    ).toBeVisible();

    // Arama input'u
    await expect(
      page.getByRole("searchbox", { name: /Dosyalarda ara/i }),
    ).toBeVisible();

    // Tür ve sıralama select'leri
    await expect(
      page.getByRole("combobox", { name: /Tür filtresi/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /Sıralama/i }),
    ).toBeVisible();
  });

  test("çöp kutusu toggle URL'e silinmis=1 yansıtır", async ({ page }) => {
    await page.goto("/dosyalar");

    const toggle = page.getByRole("button", {
      name: /Çöp Kutusunu Göster/i,
    });
    await expect(toggle).toBeVisible();
    await toggle.click();

    // URL güncellenir (router.replace), sayfa state korunur
    await expect(page).toHaveURL(/silinmis=1/);

    // Buton metni "Çöp Kutusu" olur (aktif durum)
    await expect(
      page.getByRole("button", { name: /^Çöp Kutusu$/ }),
    ).toBeVisible();
  });

  test("aramada metin girilirce URL'e arama param'ı yansır (debounced)", async ({
    page,
  }) => {
    await page.goto("/dosyalar");

    await page
      .getByRole("searchbox", { name: /Dosyalarda ara/i })
      .fill("test");

    // 250ms debounce + URL replace
    await page.waitForURL(/arama=test/, { timeout: 2_000 });
  });
});

test.describe("Dosyalar sayfası — viewport adaptasyonu", () => {
  test.beforeEach(async ({ page }) => {
    await girisYap(page, SUPER_ADMIN);
  });

  test("desktop'ta tablo görünür (sm: 768px ve üstü)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dosyalar");

    // Tablo veya boş mesaj
    const tabloVeyaBosMesaj = page.locator(
      'table, p:has-text("Bu filtre ile dosya bulunamadı")',
    );
    await expect(tabloVeyaBosMesaj.first()).toBeVisible();
  });

  test("mobile'de tablo yerine card-list görünür (Kural 15)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/dosyalar");

    // Mobile'de <table> görünmemeli (kart-list veya boş mesaj)
    await expect(page.locator("table")).toHaveCount(0);
  });
});

test.describe("Dosyalar — yetki kontrolü", () => {
  test("oturum açmamış kullanıcı /giris'e yönlendirilir", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dosyalar");
    await page.waitForURL(/\/giris/, { timeout: 10_000 });
  });
});
