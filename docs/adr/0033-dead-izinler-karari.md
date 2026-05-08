# ADR-0033 — Dead izinlerin (KART_KOPYALA, KART_ILISKI_*) durumu

**Durum:** Onaylandı (Sprint 4 / S4-17)
**Tarih:** 2026-05-08
**İlişkili:** Tarama raporu Sprint 4 / S4-17

## Bağlam

Tarama raporu `lib/permissions-katalog.ts`'de 3 izin kodunun
implement edilmemiş feature'lar için tanımlı olduğunu tespit etti:

- `KART_KOPYALA` — Trello tarzı kart duplicate; kullanıcılar kart şablon
  davranışı ister.
- `KART_ILISKI_KUR` / `KART_ILISKI_KALDIR` — kart-arası ilişkilendirme
  (örn. "engelliyor", "alt-görev").

Plan'ın kararı: **(A)** implement et veya **(B)** katalog/seed/roller'dan
kaldır.

## Karar

**Hibrit yaklaşım**:

1. **Katalogta TANIM olarak kalsın** (`lib/permissions-katalog.ts`'in
   `IZIN_KODLARI`, `KATEGORI_ESLESMESI`, `IZIN_TANIMLARI`, `TUM_IZIN_KODLARI`
   bölümleri). İzin kodu silmek geri dönüşsüz; gelecekte feature
   implement edildiğinde yeniden eklemek karışıklık yaratır.

2. **Varsayılan rol izin listelerinden kaldırılsın**
   (`VARSAYILAN_ROL_IZINLERI` map → `BIRIM_AMIRI_KART` listesi):
   - Kullanıcılar olmayan eylem için izinli görünmesin.
   - Sidebar/buton koşulları false döner — UI'da hayalet aksiyon yok.
   - Audit logs gerçek aksiyonlardan üretilir (false-positive log
     olmaz).

3. **`permissions-eslesme.ts`'te eski kod genişletmesi
   güncellendi**: legacy `kart:edit` eski kodu artık `KART_KOPYALA` ve
   `KART_ILISKI_KUR`'a genişlemiyor. Eski rollerin bu izinleri
   otomatik almasını engeller.

## Sonuçlar

- Yeni roller (BIRIM_AMIRI varsayılanı dahil) bu 3 izini almaz.
- Mevcut rollerde bu izin atanmışsa `KullaniciRol` üzerinden manuel
  veriliyor — toplu temizlik gerekmez (kullanılmadığı için zarar yok),
  ancak ileride ayrı bir migration ile temizlenebilir.
- Feature implement edildiğinde:
  1. Action + service + UI eklenir.
  2. ADR (yeni numaralı) "feature implement edildi" diye not düşer.
  3. `BIRIM_AMIRI_KART` ve `permissions-eslesme.ts` listelerine
     izin kodu yeniden eklenir.

## Risk

- **Düşük**: Sadece varsayılan atama listesi değişti; kod yolu
  etkilenmedi. Mevcut KullaniciRol kayıtları korunuyor.

## Plan Maddesi

- Tarama raporu Sprint 4 / S4-17 — bu ADR ile karar tamam.
