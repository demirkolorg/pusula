# ADR 0018 — Çöp Kutusu (Soft Delete + Geri Yükle + Kalıcı Sil)

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** `docs/plan.md` Bölüm 6 (#3), Sprint S7, ADR-0005 (resource-level RBAC).

## Bağlam

Plan'ın 1.5 ve Bölüm 6/#3 maddesinde "Silinen kart/liste/proje 30 gün geri yüklenebilir, sonra hard delete" çekirdek kararı var. S3-S5 boyunca soft-delete altyapısı tüm ana modellerde kuruldu (`silindi_mi` + `silinme_zamani`), ancak kullanıcının silinen kayıtları **görüp** geri yükleyebileceği bir **çöp kutusu** UI yok. Bu ADR çöp kutusunun kapsamını, yetki modelini, ve hard-delete politikasını kayıt altına alır.

## Karar

### 1) Kapsam (v1): 4 tip — Proje, Kart, Yorum, Eklenti

| Tip | Soft-delete alanı | Çöp kutusunda görünür mü? | Kim geri yükleyebilir? |
|-----|-------------------|---------------------------|------------------------|
| **Proje** | `Proje.silindi_mi` + `silinme_zamani` | ✅ | Proje yetkilisi + Makam |
| **Kart** | `Kart.silindi_mi` + `silinme_zamani` | ✅ | Kart/proje yetkilisi + Makam |
| **Yorum** | `Yorum.silindi_mi` + `silinme_zamani` | ✅ | Yazan kişi + proje yetkilisi |
| **Eklenti** | `Eklenti.silindi_mi` + `silinme_zamani` | ✅ | Yükleyen + proje yetkilisi |
| **Liste** | YOK (soft-delete yok) | ❌ | — (zaten arşiv var) |
| **Birim, Kullanici** | `silindi_mi` var | v2 — admin restore | — |
| **KontrolMaddesi, Etiket** | YOK | ❌ | — |

**v1 dışı (v2'ye ertelendi):**
- **Birim/Kullanici restore:** sadece `SUPER_ADMIN` rolünden yapılır, KVKK kapsamında ayrı bir admin sayfası gerekir (`/ayarlar/sistem/cop-kutusu`).
- **KontrolMaddesi:** kart yaşam döngüsü ile silinir, tek başına çöp kutusunda anlamı yok.
- **Etiket:** proje silinince zaten `onDelete: Cascade` ile gider; kullanılmayan etiket "silindi" değil, sadece referansız.

### 2) Yetki Modeli

Çöp kutusu **proje bağlamlı**. Bir kullanıcı çöp kutusunu açtığında:

- **Makam (SUPER_ADMIN/KAYMAKAM):** tüm silinmiş Proje/Kart/Yorum/Eklenti'leri görür ve geri yükleyebilir.
- **Normal kullanıcı:**
  - Erişebileceği projelerin (proje/liste/kart yetkili veya birim) silinmiş içeriklerini görür.
  - **Proje** geri yükleme: sadece projenin doğrudan yetkilisi veya makam.
  - **Kart/Yorum/Eklenti:** ait olduğu projeye yetkili olan herkes geri yükleyebilir.
- **Yorum/Eklenti yazarı:** proje yetkilisi olmasa bile **kendi** yazdığı yorumu/yüklediği eklentiyi geri yükleyebilir.

Yetki kontrolü `lib/yetki.ts` mevcut helper'larıyla (`canProje`, `canKart`) yapılır; yorum/eklenti için kart üzerinden cascade.

### 3) İşlemler

| Aksiyon | Etki | Optimistic? |
|---------|------|-------------|
| **Geri yükle** (`silindi_mi = false`, `silinme_zamani = null`) | Kayıt aktif olur | ✅ — Sonner `gerial` 5sn (Kural 65) |
| **Kalıcı sil** (gerçek `delete`) | Kayıt + bağlı tüm `Cascade` ilişkiler tamamen silinir | ❌ — onay dialog zorunlu (geri alınamaz) |
| **Tümünü geri yükle** (toplu, opsiyonel) | v2 — toplu işlem (Kural 113) | — |
| **Tümünü kalıcı sil** | v2 — admin için | — |

### 4) 30 Gün Hard Delete (Otomatik Temizlik)

**v1:** manuel cron yok; admin panelinde "30 günden eski silinmiş kayıtları temizle" butonu (`/ayarlar/sistem/cop-kutusu-temizlik`).

**v2:** `node-cron` veya GitHub Actions scheduled workflow ile günde bir kez `DELETE WHERE silinme_zamani < NOW() - INTERVAL '30 days'`. Eklentilerin MinIO dosyaları da silinir (orphan storage temizleme).

### 5) UI

- **Route:** `/cop-kutusu` — tüm onaylı kullanıcılar erişir (yetki filtresi sonuçları daraltır).
- **Tab Bar:** Proje (varsayılan) / Kart / Yorum / Eklenti — sayaç pill ile (komut paleti tasarımı paritesi, Altay).
- **Liste:** TanStack Table (Kontrol Kural 23a) — kolonlar: ad/başlık, proje (kart için), silinme zamanı, silen kişi (audit log'dan), aksiyonlar (geri yükle / kalıcı sil).
- **Mobile:** card-based liste (Kural 15).
- **Optimistic geri yükle:** Sonner `gerial` 5sn — kullanıcı yanlışlıkla geri yüklerse yine 5sn içinde "Geri Al"'a basabilir (silindi_mi = true tekrar).
- **Kalıcı sil:** AlertDialog — "Bu işlem geri alınamaz" + onay metni gerekir (kayıt başlığını yazar).

### 6) Audit

Geri yükle/kalıcı sil işlemleri Audit middleware ile otomatik loglanır (Kural 42). `islem` alanı: `RESTORE` (yeni) veya `HARD_DELETE` (yeni).

### 7) Sidebar Linki

`AppSidebar`'a "Çöp Kutusu" linki — Trash2 ikonu, alt seviyede ("Çöp Kutusu" altında "Tümü/Proje/Kart/Yorum/Eklenti" alt menü yok, tab bar yeterli).

## Sonuçlar

- **Kapsam:** Proje, Kart, Yorum, Eklenti — Liste hariç (soft-delete yok).
- **Yetki:** proje bağlamlı + yazar geri-yükleme.
- **Hard delete:** v1 manuel admin butonu, v2 cron.
- **UI:** `/cop-kutusu` route, tab bar + DataTable + onay dialog.
- **Audit:** RESTORE / HARD_DELETE event'leri.

## İlgili Kurallar

- **Kontrol Kural 40** — Soft delete + çöp kutusu çekirdek prensibi.
- **Kontrol Kural 50** — RBAC her action başında.
- **Kontrol Kural 65** — `gerial` Sonner 5sn (geri yüklemede).
- **Kontrol Kural 90** — 5 katman.
- **Kontrol Kural 23a** — TanStack DataTable.

## Açık Sorular (v2)

- Tek liste yerine "tip-bazlı tab" mı, "kayıt-bazlı arama" mı? v1: tab.
- "Tümünü kalıcı sil" toplu işlem (v2 — admin için, Kural 113).
- Eklenti dosyası MinIO'dan ne zaman silinir? Hard delete'te eş zamanlı.
