# ADR-0016 — Proje Kapak İkonu (Lucide DynamicIcon)

- **Tarih:** 2026-05-05
- **Durum:** Kabul edildi
- **İlgili kurallar:** Kontrol Kural 26 (lucide-react tek kütüphane), 49 (Zod validate), 90 (5 katman), 102 (ADR), 107 (optimistic), 131/139 (saf logic ayrımı + test)

## Bağlam

`Proje` modelinin görsel kimliği şu an yalnız `kapak_renk` (3 sistem + 12 palet token) ile sağlanıyor. Liste sayfasında 20+ proje kartı yan yana dizilince renk benzerlikleri ayırt edilebilirliği düşürüyor; özellikle "Kış Tedbirleri" vs "Kırsal Yol Bakımı" gibi konu farklılıkları sadece başlık metniyle ifade ediliyor. Kullanıcı dilek: kapak rengiyle birlikte kullanılabilen bir **ikon** alanı — emoji değil, mevcut `lucide-react` kütüphanesinden zengin bir koleksiyon arasından seçim.

## Karar

`Proje` modeline `kapak_ikon: String?` alanı eklenir. Değer = lucide-react ikon ismi (kebab-case, örn `snowflake`, `graduation-cap`, `building-2`). Render `<DynamicIcon name=...>` ile lazy import. Picker = arama + virtualized grid (3904 ikon).

### Token modeli

- Whitelist = lucide-react `iconNames` array'i (3904 öğe; v1.14.0)
- Validation: `lib/kapak-ikon.ts` içinde `Set<string>` ile O(1) `ikonMu(name): boolean` type guard
- Zod schema: `z.string().min(1).max(64).refine(ikonMu)` — geçersiz isim 400 ile reddedilir
- DB: TEXT kolon, nullable; null = ikon yok

### Render stratejisi

- **Statik import yapılmaz** (`import { Star } from "lucide-react"`) — bundle'a 3904 ikonun hepsi kaçar.
- **DynamicIcon** kullanılır: ilk render'da `dynamicIconImports[name]()` ile lazy fetch, ESM cache sonra anlık.
- İlk picker açılışında ~60-80 ikon paralel resolve → 200-300ms ısınma. Kabul edilebilir.

### Picker UX

- Popover içinde `Input` (search) + `@tanstack/react-virtual` virtualized grid
- Mobile 7 sütun, desktop 10 sütun; hücre 40×40 px (44 hit-target dış padding ile)
- Saf filtre/satır-bölme logic'i `components/ikon-secici-helper.ts`'te (Kural 131)
- "Temizle" butonu yalnızca seçim varken görünür → `null` gönderir

### Renk + İkon birlikte

İkon, kapak rengi zemini üzerinde `text-white/90` ile render edilir (12 palet rengi yeterince koyu). İkon yokken sadece renkli/gri zemin gösterilir; renk de yokken `bg-muted` + ikon yok.

## Etkilenen dosyalar

| Katman | Dosya |
|---|---|
| DB | `prisma/schema.prisma` (Proje.kapak_ikon String?) + `prisma/migrations/20260505123738_s/` (ALTER TABLE) |
| Helper | `lib/kapak-ikon.ts` (yeni) + `lib/kapak-ikon.test.ts` |
| Schemas | `app/(panel)/projeler/schemas.ts` (KAPAK_IKON refine) |
| Services | `app/(panel)/projeler/services.ts` + `[projeId]/services.ts` (ProjeKart, ProjeDetayOzeti, select/data) |
| Hooks | `hooks/proje-sorgulari.ts` + `[projeId]/hooks/detay-sorgulari.ts` (optimistic) |
| Picker | `components/ikon-secici.tsx` (yeni) + `components/ikon-secici-helper.{ts,test.ts}` |
| Form | `components/proje-form.tsx` + `proje-form-ikon-bolumu.tsx` + `proje-form-renk-bolumu.tsx` (mikro bileşenler — Kural 19) |
| Gösterim | `components/proje-kart.tsx` + `[projeId]/components/proje-baslik-kimlik.tsx` |
| i18n | `lib/i18n/tr.ts` (`tr.proje.form.*`) |
| Seed | `prisma/seed.ts` — 3 örnek projeye renk + ikon |

## Reddedilen alternatifler

- **Emoji**: Tutarsız platform render; "modern bir ikon dili" istenmiyor; aksesibilite sınırlı.
- **Statik import + 150 ikon küratörlük listesi**: Kullanıcı "zengin koleksiyon" istedi, 150 yetersiz.
- **Statik import 3904 ikon**: Bundle ~3MB şişer; kabul edilemez. DynamicIcon zorunlu.
- **Kategorize picker (Genel/İş/Eğitim...)**: Bakım yükü, 3904 ikonu manuel etiketlemek mümkün değil; arama daha hızlı.

## Riskler & Yan Notlar

- **Lucide sürüm güncellemesi** (örn 1.14 → 1.15) yeni ikonlar ekleyebilir / eski isimleri yeniden adlandırabilir. Çıkarılan bir isim DB'de kalırsa render `null` döner (DynamicIcon hata yakalar) — kullanıcı yeniden seçer. Major version değişikliklerinde Kural 145 gereği plan + README + ADR güncellenir.
- **3904-element string union** TS compile süresine eklenir. Prototype'ta sorun yok; ileride yavaşlama olursa `KapakIkonu = string` + runtime guard'a düşülebilir.
- **Audit**: `auditExtension` `Proje.update` operasyonunda `kapak_ikon` farkını otomatik `diff` JSON'una yazar — explicit bir şey gerekmez (Kural 42, 58).
- **Backward compat**: Mevcut projelerde `kapak_ikon = null`; UI tüm yerlerde nullable bilinçli render.

## Sonraki Aşama (kapsam dışı)

- Liste ve Kart için kapak ikonu (kullanıcı bu turda istemedi).
- Kategorize picker'a yükseltme (kullanım metrikleri arama yetersiz olduğunu gösterirse).
