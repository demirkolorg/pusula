# ADR-0022 — Makam (SUPER_ADMIN / KAYMAKAM) Tüm Bildirimlerin Otomatik Alıcısı

- **Durum:** Kabul edildi
- **Tarih:** 2026-05-06
- **Bağlantılar:** Kural 50a, ADR-0005 (Resource-Level RBAC), ADR-0008 (Saf Görünürlük), ADR-0019 (Kart Tamamlama Önerisi)

## Bağlam

Kural 50a uyarınca `SUPER_ADMIN` ve `KAYMAKAM` rolleri yetki kontrolünde **birim filtresini her zaman atlar** — tüm projelere makam katmanı erişimi vardır. Bu erişim politikası RBAC katmanında uygulanmıştı (`lib/yetki.ts`), ancak **bildirim alıcı seçimi katmanında uygulanmamıştı**.

`app/(panel)/bildirimler/tetikleyiciler.ts` içindeki `kartYetkiliAliciMap` ve diğer alıcı toplama fonksiyonları sadece **açık üyelikleri** (proje yetkilisi, liste yetkilisi, kart yetkilisi, kart birim üyeleri) topluyordu. Makam kullanıcıları bu listelerde yer almadığı için (`birim_id = null` olduğunda birim üyeliği üzerinden de yakalanmıyor) sistemdeki etkinliklerin büyük çoğunluğunda hiç bildirim almıyordu.

Tek istisna: `kartTamamlamaYetkilileriniBul` (ADR-0019) — `KART_TAMAMLA` izinli kullanıcılar arasında `*` izinli (makam) kullanıcılar açıkça union ediliyordu. Bu da sadece 4 tipi kapsıyordu: `KART_TAMAMLAMA_ONERILDI`, `MADDE_TAMAMLAMA_ONERILDI` (+ onay/red dönüşleri öneren'e gittiği için makam dışı).

Sonuç: Makam kullanıcıları sistem genelinde sıfır bildirim alıyordu.

## Karar

`bildirimUret` (services.ts) **tek nokta** üzerinden makam alıcı genişletmesi yapar:

```ts
async function makamAliciIdler(): Promise<string[]> {
  const liste = await db.kullanici.findMany({
    where: {
      aktif: true,
      silindi_mi: false,
      onay_durumu: "ONAYLANDI",
      roller: {
        some: { rol: { kod: { in: ["SUPER_ADMIN", "KAYMAKAM"] } } },
      },
    },
    select: { id: true },
  });
  return liste.map((k) => k.id);
}

// bildirimUret içinde:
const makamlar = await makamAliciIdler();
const benzersiz = Array.from(
  new Set([...girdi.alici_idler, ...makamlar]),
).filter((id) => id !== girdi.ureten_id);
```

Aynı union `emailKanaliYayinla` içinde de uygulanır (e-mail kanalı bağımsız akış).

## Sonuçlar

### Pozitif

- **Tutarlılık:** Tüm bildirim tipleri (~17 tetikleyici) tek noktada kapsanır. Yeni tetikleyici eklendiğinde otomatik faydalanır.
- **RBAC ile hizalı:** Kural 50a'nın bildirim katmanına yansıması netleşir.
- **Opt-out korunur:** Makam kullanıcı `BildirimTercih` (tip-bazlı), `KartSusturma` veya `ProjeSusturma` (kaynak-bazlı) ile gürültüyü kontrol edebilir. Süzgeçler union'dan sonra çalışır.
- **Üreten dışlama korunur:** Makam üreten ise (`ureten_id == makam_id`) kendine bildirim atılmaz — mevcut filtre.
- **Audit ve realtime etkilenmez:** Bildirim DB kaydı + Socket.io broadcast standart akıştadır.

### Negatif

- **DB sorgusu:** Her `bildirimUret` çağrısında ek `findMany` (rol join). Tipik prod yükünde dakikada birkaç bildirim → kabul edilebilir. Hot path olursa `unstable_cache` (Kural 98) veya in-memory TTL cache eklenir.
- **Gürültü:** Makam kullanıcı her sistem etkinliğini görür. Bu kullanıcı tarafından `BildirimTercih` ile çözülür.
- **E-posta dijest yükü:** Email kuyruğu (Adım 4 / Faz 5.5) makam alıcıları için de batch oluşturur. Cron 5dk pencerede grupladığı için patlama riski düşük.

## Alternatifler

1. **Tetikleyici-bazlı opt-in liste** — sadece "yönetimsel" tipler için makam dahil et. **Reddedildi:** Tutarsızlık + bakım yükü; her yeni tip için karar gerekir.
2. **`kartYetkiliAliciMap` içinde union** — sadece kart-bazlı tetikleyicileri kapsar; `tetikleListeSilindi`, `tetikleProjeUyeEklendi` gibi direkt-alıcı tetikleyiciler dışta kalır. **Reddedildi:** Yine eksik kapsama.
3. **Makamı her projeye `ProjeYetkilisi` olarak otomatik ekle** — DB seviyesinde çözüm. **Reddedildi:** RBAC zaten bypass yapıyor; çift veri saklama anlamı yok + `ProjeYetkilisi` tablosu şişer.

## Test

- `app/(panel)/bildirimler/services.test.ts` içinde 3 yeni test:
  1. SUPER_ADMIN + KAYMAKAM alıcı listesinde olmasa bile otomatik dahil
  2. Üreten makam ise kendine bildirim atılmaz (mevcut davranış korunur)
  3. Makam `BildirimTercih` ile in_app kapattığında dahil edilmez (süzgeç çalışır)

## Geri Alma

`makamAliciIdler` çağrısı kaldırılır, `benzersiz` array sadece `girdi.alici_idler`'den üretilir. Makam kullanıcıları yine sıfır bildirim alır (önceki davranışa döner).
