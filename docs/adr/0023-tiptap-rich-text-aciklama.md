# ADR-0023 — Kart Açıklamasında Tiptap Zengin Metin

- **Durum:** Kabul edildi
- **Tarih:** 2026-05-08
- **Bağlantılar:** Kural 18 (shadcn/ui), Kural 23 (TanStack Query), Kural 70 (XSS), Kural 90 (modül katmanı), Kural 107-116 (Optimistic UI)
- **Kapsam:** Faz 1 — Yalnızca `Kart.aciklama`. `Proje.aciklama`, `Yorum.icerik`, `KontrolMaddesi.metin` ayrı modüller olarak Faz 2'de gelir.

## Bağlam

Kart modal'ında açıklama alanı düz `<Textarea>` ile yazılıyor, kaydetme `onBlur → kartGuncelle({ aciklama: string })` üzerinden raw string olarak DB'ye gidiyordu. Yorum kodlarındaki "markdown-light: **bold** / • bullet" notu sadece niyet belgesi — render edilen yer yoktu, kullanıcı `**` yazarsa ham karakterler görünüyordu.

Talep: Trello/Linear paritesinde **bold, italik, üstü çizili, başlık (H1-H3), liste, link, kod** desteği. Mevcut audit log + arama altyapısı ile uyumlu çalışmalı, mobil 360px'te degrade olmamalı, çoklu kullanıcı edit'inde optimistic UI'yı bozmamalı.

Değerlendirilen formatlar:

| Format | Artı | Eksi |
|---|---|---|
| HTML string | Render kolay | Her render'da DOMPurify zorunlu (Kural 70); XSS yüzeyi büyür |
| **Tiptap JSON (ProseMirror Doc)** ✓ | Semantic; mention/diff/audit-friendly; safe renderer (XSS açısı yok) | Şema değişikliği; client/server iki tip yönetimi |
| Markdown | Taşınabilir | Roundtrip kayıplı; mention için özel syntax |

Diğer adaylar (Lexical, Slate, Plate, BlockNote, Novel) Tiptap'ın headless + shadcn dostu API'sine kıyasla ya overkill ya da ekosistem desteği daha az.

## Karar

### K1 — Saklama: İki kolon (doc + denormalize plaintext)

```prisma
model Kart {
  aciklama_dokuman Json?           // ProseMirror doc (TiptapDokuman)
  aciklama_metin   String? @db.Text // server'da türetilen plaintext
}
```

`aciklama_metin` üç sebeple ayrı kolon:

1. **Liste/kanban line-clamp** — 50+ kart render'ında her seferinde Tiptap parse pahalı.
2. **Audit diff** — mevcut LCS word-diff sistemi ([aktivite-diff.ts](app/(panel)/projeler/[projeId]/aktivite/aktivite-diff.ts)) plaintext üzerinden çalışıyor, bozulmuyor.
3. **Full-text search trigger** — [tsvector trigger](prisma/migrations/20260507000000_global_arama_tsvector_altyapisi/migration.sql) Postgres `to_tsvector('pusula_turkish', ...)` plaintext bekler.

Plaintext **sadece server tarafında** türetilir (`tiptapDokumaniMetne(doc)`); client şema reddedilir (Kural 49).

### K2 — Toolbar Seti (MVP)

- **Inline:** bold, italic, strike, code
- **Block:** paragraph, heading (H1/H2/H3), bullet list, ordered list
- **Insert:** link (Popover URL input)

Hariç tutulan (Faz 2): mention, table, image, embed, blockquote, horizontal rule, code block. Mention kullanıcı tarafından açıklamada talep edilmedi; Yorum'la birlikte tek mention extension'ı kurulacak (mevcut `lib/mention-format.ts` regex sistemi yorumlarda kalır).

### K3 — Edit Pattern: onBlur Debounced

Tiptap `onUpdate` her keystroke tetiklenir. Mutation 300ms+ gecikmeyle kuyruk yapılır → 1500ms idle veya focus kaybı/Ctrl+Enter ile teslim. `useOptimisticMutation` (Kural 107-116) cache'i anında günceller; debounce sadece **server fetch sayısını** azaltır — UX'e şeffaftır.

Kullanıcı vazgeçerse modal kapatılırken kuyruktaki son taslak flush edilir (component unmount cleanup).

### K4 — DoS Koruması

`tiptapDokumanSemasi` Zod refinement:
- Maks 1000 düğüm
- Maks 10 derinlik
- Tek text node maks 10K karakter

Server her `kartGuncelle` çağrısında parse eder; aşan payload reddedilir.

### K5 — Audit Diff Stratejisi

Audit middleware otomatik `aciklama_dokuman` ve `aciklama_metin` field değişimlerini yakalar. UI tarafında:

- **Aktivite mesajı:** `diff.aciklama_metin` varsa "kartın açıklamasını değiştirdi" — `aciklama_dokuman` mesaj üretmez (her keystroke'ta JSON değişir, gürültü olur).
- **Denetim diyaloğu:** `aciklama_metin` "Açıklama" etiketiyle, `aciklama_dokuman` "Açıklama (zengin metin)" etiketiyle ayrı satırlarda görünür.

MVP'de Tiptap-aware semantic diff yok; plaintext word-LCS yeterli kabul edildi.

### K6 — Şema Migration: Fresh Start

Kullanıcı onayı ile mevcut `aciklama` string kolonu **dönüştürülmeden drop edildi**, DB reset + seed ile baştan başlandı. Production benzeri ortamda bu pattern uygulanamaz; üretim deploy'unda 3-step migration gerekir (add → backfill → drop). MVP scope'u dev DB.

## Sonuçlar

### Mimari

- `lib/tiptap/` — server-safe (schema, serialize, mention çıkarma).
- `components/tiptap/` — client-only (editor, toolbar, link popover).
- Editor lazy yüklenmez; modal hep dynamic import kapsamında zaten (responsive-dialog).

### Etki

| Katman | Değişiklik |
|---|---|
| Schema | `aciklama` drop, `aciklama_dokuman` + `aciklama_metin` add, tsvector trigger plaintext'e bağlandı |
| Zod | `kartOlusturSemasi.aciklama` kaldırıldı (yeni kart boş başlar), `kartGuncelleSemasi.aciklama_dokuman` eklendi |
| Service | `kartGuncelle` plaintext'i türetip tek transaction'da yazar |
| Hook | `useKartGuncelle` optimistic update'te plaintext'i de senkronize eder |
| UI | KartModalAciklama Tiptap editor; kart-liste/arama/export plaintext kullanır |
| Seed | `aciklamaDokuman?` opsiyonel alan; bir kart (`okul-servis`) zengin metin örneğiyle |
| Audit | Diff alan etiketi `aciklama` → `aciklama_metin` + `aciklama_dokuman` |

### Bozulanlar

- `KartOlustur.aciklama` API yüzeyi kaldırıldı (kanban-liste yeni kart oluşturmada zaten boş başlatıyordu).
- Test fixture `kartOlusturFiks(ops.aciklama: string)` korundu; otomatik Tiptap doc'a sarıldı.

### Açık Riskler

- **Mention yok:** Açıklamada `@` kullanılamaz. Kullanıcı talep etmedi; Faz 2'de Yorum'la beraber gelecek.
- **Realtime conflict:** İki kullanıcı aynı anda edit ederse son yazan kazanır (Tiptap CRDT/Yjs entegrasyonu yok). MVP kabulü; modal "kart üzerinde başka biri çalışıyor" rozeti yok.
- **Bundle:** Tiptap + ProseMirror ~80KB minified. Modal lazy import zaten vardı, ek maliyet kabul edilir.

## İlgili Dosyalar

- [lib/tiptap/schema.ts](lib/tiptap/schema.ts), [lib/tiptap/serialize.ts](lib/tiptap/serialize.ts), [lib/tiptap/mention.ts](lib/tiptap/mention.ts)
- [components/tiptap/tiptap-editor.tsx](components/tiptap/tiptap-editor.tsx), [components/tiptap/tiptap-toolbar.tsx](components/tiptap/tiptap-toolbar.tsx)
- [app/(panel)/projeler/[projeId]/components/kart-modal-aciklama.tsx](app/(panel)/projeler/[projeId]/components/kart-modal-aciklama.tsx)
- [prisma/migrations/20260508000000_kart_aciklama_tiptap_dokuman](prisma/migrations/20260508000000_kart_aciklama_tiptap_dokuman/migration.sql)
