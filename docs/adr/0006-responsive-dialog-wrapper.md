---
adr: 0006
tarih: 2026-05-03
durum: kabul-edildi
---

# ADR-0006 — ResponsiveDialog Wrapper (Sheet ↔ Dialog)

## Bağlam

Proje genelindeki form/detay panel bileşenleri (`KurumFormSheet`, `ProjeFormSheet`,
`KullaniciDuzenleSheet`, `DavetGonderSheet`, `KartCekmece`) `<Sheet>` primitive'i
kullanıyordu. Sheet, **Kural 13** gereği mobilde alttan açılan native pattern için
zorunlu; ancak desktop ekranda (≥1024px) sağdan slide-in panel **center modal**
kadar uygun değil:

- Geniş ekranda sağ kenara yapışan dar panel ortadaki içerikten kopuk hisseder
- Form alanları yatay alanı kullanmıyor; merkez modal'da daha düzgün durur
- Plan Bölüm 1.5/C zaten "mobilde Sheet, **desktop'ta center modal**" diyor

Mevcut dosyalar Sheet'i her viewport'ta aynı şekilde gösteriyordu — kuralın
"desktop'ta modal" tarafı uygulanmamıştı.

## Karar

`components/ui/responsive-dialog.tsx` wrapper bileşeni eklendi. `useMobil()` hook'u
ile çalışma zamanında primitive seçer:

- **Mobil (<1024px):** `Sheet` (default `side="bottom"` — vaul tarzı bottom sheet)
- **Desktop (≥1024px):** `Dialog` (center modal)

API olarak shadcn'in `Dialog`/`Sheet` API'sini birebir taklit eder:
`ResponsiveDialog`, `ResponsiveDialogContent`, `ResponsiveDialogHeader`,
`ResponsiveDialogTitle`, `ResponsiveDialogDescription`, `ResponsiveDialogFooter`,
`ResponsiveDialogTrigger`, `ResponsiveDialogClose`. Tek prop farkı:
`ResponsiveDialogContent.mobilTaraf` (default `"bottom"`) — mobil tarafı override
etmek isteyen call site için.

İki primitive de `@base-ui/react/dialog` üzerine kurulu olduğundan davranış
(focus trap, escape, overlay click) tutarlı.

## Migration

5 mevcut Sheet kullanan dosya wrapper'a geçirildi:

- `app/(panel)/ayarlar/kurumlar/components/kurum-form.tsx`
- `app/(panel)/projeler/components/proje-form.tsx`
- `app/(panel)/ayarlar/kullanicilar/components/kullanici-duzenle.tsx`
- `app/(panel)/ayarlar/kullanicilar/components/davet-gonder.tsx`
- `app/(panel)/projeler/[projeId]/components/kart-cekmece.tsx`

`components/ui/sidebar.tsx` shadcn'in iç primitive'i — dokunulmadı.

## Sonuçlar

- Mobilde davranış değişmedi (Sheet zaten kuralın gereği)
- Desktop'ta artık center modal (Kural 13'ün ikinci yarısı uygulandı)
- `<Sheet>` primitive'i hâlâ erişilebilir — gerçekten her viewport'ta sheet
  isteyen yeni özellikler (örn. ileride eklenecek navigation drawer) kullanabilir
- Hydration: kapalı modal'lar render edilmediğinden SSR/CSR bp uyumsuzluğu
  görünmez; açık modal'da ilk render'da default `"desktop"` döner, hydrate
  sonrası resize ile düzelir — pratikte modal click ile açıldığı için flicker yok

## Test Notu

Wrapper saf koşullu render. Davranış testi mevcut Sheet/Dialog primitive
testleriyle güvence altında. **Kural 17** (Playwright 3 viewport) gereği
form'ların E2E testi sırasında 375px (mobil → Sheet bottom) ve 1440px
(desktop → Dialog center) iki farklı render'ın doğrulanması zorunlu — bu
iş ileriki E2E PR'larında yapılacak.
