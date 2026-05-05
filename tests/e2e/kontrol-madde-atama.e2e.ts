import { test, expect, girisYap, SUPER_ADMIN } from "./fixtures/auth";

// Kontrol maddesi sorumlu atama akışı.
// Seed verisi (prisma/seed.ts):
//   - "2026 Kış Tedbirleri" projesi → "Planlama" listesi → "Kış kriz masası" kartı
//   - Kontrol listesi "Onay adımları" → 2 madde:
//       "Birim temsilcilerini kesinleştir" → atanan: Mehmet Y. (ozelAmir), tamam
//       "Kaymakam onayına sun" → atanan: Elif K. (ozelMemur)
// Akış: rozete tıkla → popover aç → atananı değiştir → rozet güncellenir.

test.describe("Kontrol maddesi sorumlu atama", () => {
  test.beforeEach(async ({ page }) => {
    await girisYap(page, SUPER_ADMIN);
  });

  test("rozete tıklanınca popover açılır, ada göre arama listeler", async ({
    page,
  }) => {
    await page.goto("/projeler");
    await page
      .getByRole("link", { name: /2026 Kış Tedbirleri/i })
      .first()
      .click();

    // Kart modal aç
    await page
      .getByRole("button", { name: /Kış kriz masası görev dağılımını onayla/i })
      .first()
      .click();

    // Atanan rozetine tıkla — "Elif K." (ozelMemur) seedde "Kaymakam onayına sun" maddesinde
    const rozet = page
      .getByRole("button", { name: /Sorumlu: Elif Kaya/i })
      .first();
    await expect(rozet).toBeVisible({ timeout: 10_000 });
    await rozet.click();

    // Popover açıldı: header görünür
    await expect(page.getByText(/Sorumlu kişi/i)).toBeVisible();

    // Mevcut atanan listede görünür + "Sorumluluğu kaldır" butonu var
    await expect(
      page.getByRole("button", { name: /Sorumluluğu kaldır/i }),
    ).toBeVisible();

    // Arama yap → adaylardan biri görünmeli
    await page
      .getByPlaceholder(/Sorumlu olarak atanacak kişiyi ara/i)
      .fill("Mehmet");
    await expect(
      page.getByRole("button", { name: /Mehmet/i }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("X butonu sorumluluğu kaldırır, rozet placeholder'a düşer", async ({
    page,
  }) => {
    await page.goto("/projeler");
    await page
      .getByRole("link", { name: /2026 Kış Tedbirleri/i })
      .first()
      .click();
    await page
      .getByRole("button", { name: /Kış kriz masası görev dağılımını onayla/i })
      .first()
      .click();

    const rozet = page
      .getByRole("button", { name: /Sorumlu: Elif Kaya/i })
      .first();
    await rozet.click();
    await page.getByRole("button", { name: /Sorumluluğu kaldır/i }).click();

    // Optimistic — popover kapanır, rozet kaybolur (placeholder buton görünmez,
    // hover'da görünür ama yine de "Sorumlu: Elif" rozeti olmamalı)
    await expect(rozet).toHaveCount(0, { timeout: 5_000 });
  });
});
