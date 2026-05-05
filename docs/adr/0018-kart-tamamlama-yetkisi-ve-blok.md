# ADR 0018 — Kart ve Madde Tamamlama: Yetki, Sert Blok ve Görsel Dil

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** ADR-0014 (granüler izin kataloğu), ADR-0015 (RBAC yönetim paneli), Kart modeli (Bölüm G — Prisma).

## Bağlam

Kanban kartında "tamamlandı" işareti UX olarak Trello/Asana mantığında çalışmalıdır: başlığın solunda yuvarlak buton; tamamlanmamış kartta hover'da görünür (kontur), tamamlanmışsa her zaman görünür (yeşil tik). Aynı görsel dil kontrol listesi maddeleri için de geçerlidir.

Mevcut katalogda `KART_TARIH_TAMAMLANDI` kodu **"tarih" alt-kategorisinde** ve PERSONEL'e default verilmiş; ancak:

1. Tamamlama "tarih" değil — semantik olarak `temel` aksiyonudur (ADR-0014'te de "temel" altında listelenmiş — kod yanlış kategoride).
2. `Kart` modelinde `tamamlandi_mi` alanı yoktu; kod tanımlı olmasına rağmen kullanılamıyordu.
3. Tamamlama kararı kurumsal süreçte üst karar — PERSONEL'in default'ta her kartı kapatabilmesi sorumluluğu sulandırır.
4. Yetkisiz kullanıcı için "iş bittiğini bildirme" mekanizması yoktu.

## Karar

### 1. Veri modeli

`Kart` modeline 3 alan eklenir (zaten yapıldı, bu ADR ile sabitleniyor):

```prisma
tamamlandi_mi      Boolean   @default(false)
tamamlanma_zamani  DateTime?
tamamlayan_id      String?   @db.Uuid
@@index([liste_id, tamamlandi_mi])
```

`KontrolMaddesi` zaten aynı 3 alana sahip — değişiklik yok.

### 2. İzin kodu rename + yeniden konumlandırma

| Eski | Yeni | Kategori | Alt-kategori |
|------|------|----------|--------------|
| `KART_TARIH_TAMAMLANDI` (`kart.tarih:tamamlandi`) | **`KART_TAMAMLA`** (`kart:tamamla`) | KART | (yok — temel) |

`KART_TAMAMLA` yeni izin kodu olarak `IZIN_KODLARI` enum'una eklenir, eski kod kaldırılır. `IZIN_ALT_KATEGORI`'den çıkar (temel kategori altta yoksa). Tanım açıklaması korunur.

### 3. Default rol dağılımı (Karar 12 — sıkı)

| Rol | KART_TAMAMLA |
|-----|--------------|
| `SUPER_ADMIN` | ✓ (TUM_IZIN_KODLARI üzerinden otomatik) |
| `KAYMAKAM` | ✓ (TUM_KART_IZINLERI üzerinden otomatik) |
| `BIRIM_AMIRI` | ✗ |
| `PERSONEL` | ✗ |

`PERSONEL_KART` ve `BIRIM_AMIRI_KART` listelerinden `KART_TARIH_TAMAMLANDI` referansı kaldırılır. Yeni `KART_TAMAMLA` her iki listeye de **eklenmez** — ihtiyaç duyulan rol için açıkça izin verilir (RBAC paneli üzerinden).

`KAYMAKAM` `TUM_KART_IZINLERI`'ni kategori filtresi ile aldığı için yeni kod otomatik dahildir; ek satır gerekmez.

### 4. `kart:edit` alias'ından ayrıştırma

`lib/permissions-eslesme.ts` içinde `"kart:edit"` çatı izninin parçaları arasından `KART_TARIH_TAMAMLANDI` çıkarılır. Tamamlama ayrı bir aksiyon olur:

```ts
"kart:tamamla": [IZIN_KODLARI.KART_TAMAMLA],
```

Bu yeni mapping `lib/yetki.ts:canKart` policy'sine eklenir.

### 5. Server tarafı yetki kontrolü

`kartGuncelleEylem` action'ında, girdi'de `tamamlandi_mi` alanı varsa **standart `kart:edit` kontrolüne EK olarak** ayrı bir kontrol uygulanır:

```ts
await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:edit", girdi.id);
if (girdi.tamamlandi_mi !== undefined) {
  await yetkiZorunluKart(ctx.oturum?.kullaniciId, "kart:tamamla", girdi.id);
}
```

Atanan/yetkili olmak izinden bağımsız hak vermez (Karar 4B-tutarlı). Yetkisi olmayan kullanıcının `kartGuncelle` çağrısı reddedilir.

Madde tarafı (`kontrolMaddesiGuncelleEylem` veya muadili) için aynı kontrol — `tamamlandi_mi` alanı geliyorsa parent kart üzerinde `kart:tamamla` kontrolü.

### 6. Sert blok — kontrol listesi yarımken kapatma yasak

Server `kartGuncelle`'de:

```ts
if (girdi.tamamlandi_mi === true) {
  const eksik = await db.kontrolMaddesi.count({
    where: {
      kontrol_listesi: { kart_id: girdi.id },
      tamamlandi_mi: false,
    },
  });
  if (eksik > 0) {
    throw new EylemHatasi(
      "Kontrol listesindeki tüm maddeler tamamlanmadan kart kapatılamaz.",
      HATA_KODU.GECERSIZ_DURUM,
    );
  }
}
```

Bu kural arşiv durumundan **bağımsız** uygulanır (Karar 3 — arşivli kart için de blok geçerli). UI'da toggle preemptive olarak disabled kalır + tooltip "Kontrol listesi tamamlanmadan kapatılamaz". Server reddi ek savunma katmanı.

### 7. Yetkisiz kullanıcı davranışı (PR-1 kapsamı)

Yetkisiz kullanıcıda toggle **disabled (gri)** görünür; tıklanamaz, tooltip "Tamamlama yetkiniz yok". Tamamlanma durumu görünür ama değiştirilemez. **Öneri/onay flow'u (5C) ayrı PR-2'ye bırakılır** (bağımsız modül büyüklüğünde — bkz. ADR-0019, henüz yazılmadı).

### 8. Audit log mesajı

`kartGuncelle`'de `tamamlandi_mi` değişimi olduğunda audit log'a özel bir aktivite kaydı yazılır (Kural 42 + 6A formatı):

- `tamamlandi_mi: false → true` → "{ad_soyad}, '{kart_baslik}' kartını tamamlandı olarak işaretledi"
- `tamamlandi_mi: true → false` → "{ad_soyad}, '{kart_baslik}' kartını yeniden açtı"

Madde için aynı format: "{ad_soyad}, '{madde_metin}' maddesini tamamlandı olarak işaretledi" / "...maddeyi yeniden açtı".

### 9. Realtime echo

Tamamlama mevcut `KART_GUNCELLE` socket event'ine düşer (yeni event eklenmez). Kart modal/kart-mini frontend'i `kart_id` ile invalidate eder; tamamlanma alanları cache içinde gelir.

### 10. Görsel dil

Kart ve madde için **aynı `<KartTamamlaToggle>` component reuse edilir** (Karar 9A):

- Boyut: `sm` (KartMini ve madde) / `md` (KartModalBaslik).
- Renk: `text-emerald-600` (tamamlandı), `text-muted-foreground` (boş).
- İkon: `lucide-react/CheckCircle2` (tamamlandı), `lucide-react/Circle` (boş).
- Hover-only görünürlük sadece `hoverdaGorunur` prop'u true iken (KartMini'de).

### 11. Gecikti badge (ek karar 3B)

`bitis < new Date() && !tamamlandi_mi` durumunda KartMini ve KartModalMetaChips'te kırmızı **"Gecikti"** rozeti. `bitis === null` ise rozet yok. Tamamlanan kart, bitiş tarihi geçmiş bile olsa rozet göstermez.

## Sonuçlar

### Olumlu
- Tamamlama yetkisi kuruluş hiyerarşisine uygun (sadece kaymakam seviyesi default).
- Yarım kontrol listesi → kapalı kart bug'ı engellenir (data integrity).
- Yorum + mention + atanan üzerinden iş bittiğini bildirme zaten mümkün; öneri flow PR-2'ye ertelendi.
- Kart ve madde tek dilde — kullanıcı zihinsel modeli basit.
- Gecikti badge, kullanıcının yapılması gereken işi gözden kaçırmamasını sağlar.

### Olumsuz / Risk
- BIRIM_AMIRI'ın varsayılan olarak kart kapatamaması, ilçe genelinde kapatma trafiğini KAYMAKAM'a yığabilir. RBAC paneli üzerinden BIRIM_AMIRI rolüne `KART_TAMAMLA` eklenebilir; bu karar operasyonel deneyimden sonra revize edilebilir.
- Yetkisiz kullanıcının disabled buton görmesi UX olarak küçük bir sürtüşme; PR-2'deki öneri flow'u tamamlanana kadar yorum + mention pratiği tek alternatif.
- `KART_TARIH_TAMAMLANDI` rename'i mevcut DB'lerde kayıtlı izin satırını etkiler (kod string'i değişti); migration sırasında `Izin.kod` UPDATE edilir veya yeni kod insert + eski sil.

## Migration etkisi

Tek migration adımında:
1. `Kart.tamamlandi_mi/tamamlanma_zamani/tamamlayan_id` alanları + index + FK eklenir.
2. Veri taşıma SQL'i (raw): `Izin` tablosunda `kod = 'kart.tarih:tamamlandi'` satırı `kod = 'kart:tamamla'` olarak update edilir; `RolIzin` referansları korunur (sadece `Izin.kod` değişir, id sabit).
3. Seed yeniden çalıştırıldığında `TUM_IZIN_KODLARI` yeni kodu içerir; PERSONEL ve BIRIM_AMIRI default listelerinden çıkmıştır.

```bash
bun prisma migrate dev --name kart_tamamla_yetki_ve_alanlar
```

Migration adı plan'da belirtilenle aynı olmalı (Kural 38–39).

## İlgili kurallar

- Kural 6A — audit metni Türkçe.
- Kural 42 — Audit middleware bypass yasak.
- Kural 50 + V.2 — Resource-level RBAC zorunlu.
- Kural 91 — Modül DONE kriteri (test, audit, optimistic, screenshot).
- Kural 116 — Optimistic UI client-only; audit her zaman gerçek transaction'ı kaydeder.

## İleri kararlar (PR-2'ye bırakılan)

- Yetkisiz kullanıcı için "Tamamlandı önerisi" flow'u (5C).
- Madde için aynı flow (8B).
- `Kart.tamamlanma_oneri_durumu` + 3 yeni server action + bildirim sistemi entegrasyonu.
- ADR-0019'da belgelenecek.
