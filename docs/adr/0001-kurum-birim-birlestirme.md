# ADR-0001 — Kurum ve Birim modellerini tek tabloda birleştirme

**Tarih:** 2026-05-03
**Durum:** Kabul edildi
**İlgili kurallar:** `kontrol/SKILL.md` Kural 50a (güncellenmesi gerekiyor)

## Bağlam

Pusula, tek bir kaymakamlığın görev/proje yönetim aracı olarak tasarlandı. Önceki şemada `Kurum` (multi-tenant kalıbından miras) ve `Birim` (kurum altı hiyerarşi) ayrımı vardı:

- `Kurum`: Tenant — sadece bir satır (kaymakamlık) anlamına gelirdi
- `Birim`: Kaymakamlığın iç müdürlükleri (Yazı İşleri, Hukuk İşleri vb.), `ust_birim_id` ile ağaç

İki sorun çıktı:

1. **`Kurum` tablosu pratikte tek satırlı kaldı** → `kullanici.kurum_id` her zaman aynı değer, gereksiz kolon ve sorgu maliyeti.
2. **İlçedeki dış kurumlar (eczane, okul, hastane vb.) modellenemiyordu.** Senaryoda eczane sahibi sisteme login olup kendi kurumuna atanan görevleri görebilmeliydi (multi-tenant). Bu hâliyle ne `Birim`'e ne `Kurum`'a sığıyordu.

## Karar

`Birim` modeli **kaldırıldı**. `Kurum` modeli **ilçedeki tüm kurumların düz envanterine** dönüştürüldü:

- `Kurum.kategori: KurumKategorisi` (zorunlu) — 23 kategori
- `Kurum.tip: KurumTipi` (zorunlu) — 135 tip
- `Kurum.ad: String?` (opsiyonel) — tekil tiplerde `null` (görüntülenirken `KURUM_TIP_LABEL[tip]`), çoklu tiplerde zorunlu
- Hiyerarşi yok (`ust_kurum_id` eklenmedi) — düz liste, kategori bazlı gruplama UI tarafında

Kaymakamlığın iç müdürlükleri (Yazı İşleri vb.) artık `Kurum` tablosunda ayrı satırlardır (tip=`YAZI_ISLERI_MUDURLUGU`, ad=null).

`Kullanici.birim_id` kolonu kaldırıldı. Her kullanıcı doğrudan bir `Kurum`'a bağlı (`kurum_id` zorunlu).

Yeni alanlar:
- `Kullanici.onay_durumu: KullaniciOnayDurumu` (BEKLIYOR/ONAYLANDI/REDDEDILDI) — self-register akışı için
- `Kullanici.onaylayan_id`, `onay_zamani`, `red_sebebi`
- `KartHedefKurumu` (join tablosu) — bir görev birden fazla kuruma atanabilir
- `DavetTokeni.birim_id` → `kurum_id` olarak yeniden adlandırıldı

## Sonuçlar

### Olumlu
- Şema sadeleşti: 2 tablo → 1 tablo
- Eczane/okul/hastane gibi ilçedeki tüm kurumlar modellenebiliyor
- `kategori + tip` sayesinde seed verisiyle ~50 tekil kurum otomatik oluşturulabilir
- Permissions tek alan üzerinden çalışır (`kurum_id`)

### Olumsuz / Risk
- `Birim` kullanımı 26 dosyada vardı, tamamı refactor edildi
- DB reset gerekti (dev aşamasında, prod yok — kayıp yok)
- Mevcut `BIRIM_AMIRI` rolü artık `KURUM_AMIRI` veya benzeri bir isme döner (rol seed'i güncellenecek)

## Kural 50a için yeni metin

**Eski:**
> `Kullanici.birim_id = null` sadece şu rollerde geçerli: `SUPER_ADMIN`, `KAYMAKAM`. `BIRIM_AMIRI` ve `PERSONEL` için birim ZORUNLU. Yetki kontrolünde `KAYMAKAM`/`SUPER_ADMIN` rolleri birim filtresini her zaman atlar.

**Yeni:**
> `Kullanici.kurum_id` her zaman zorunlu. Yetki kontrolünde `KAYMAKAM`/`SUPER_ADMIN` rolleri kurum filtresini atlar (tüm kurumların verisini görebilir). Diğer roller (`KURUM_AMIRI`, `PERSONEL`) yalnızca `kullanici.kurum_id` ile eşleşen kayıtları görebilir. Kart bir veya daha fazla kuruma atanabilir (`KartHedefKurumu`); kullanıcı, kurumu hedef listesinde olan kartları görür.

## İlgili Migration

`prisma/migrations/<timestamp>_simplify_kurum_remove_birim/`

## İlgili PR/Commit

Bu refactor tek bir mantıksal birim olduğu için tek commit (Kural 84 — bir commit = bir mantıksal birim).
