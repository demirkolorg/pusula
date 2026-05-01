# B-Ç3 ... B-Ç8 — Yerleşim Çizimleri Seti

> **Çıktı No:** B-Ç3, B-Ç4, B-Ç5, B-Ç6, B-Ç7, B-Ç8
> **Sahip:** Tasarımcı
> **Öncelik:** YÜKSEK (B-Ç3, B-Ç4, B-Ç7) / ORTA (B-Ç5, B-Ç6, B-Ç8)
> **Bağlı Kararlar:** K-024 (Shadcn UI), K-035 (Off-Canvas Drawer), §23 yerleşim, S9 (Karanlık tema)
> **Tarih:** 2026-05-01

---

## 1. AMACI

Asgari uygulanabilir ürün için **6 ana ekranın** ASCII tabanlı yerleşim çizimini sunar. Bu çizimler tasarım imleri (B-Ç11) belgesi ile birlikte gerçek tasarım dosyalarına (Figma) dönüşür.

## 2. YERLEŞİM SİSTEMİ

### 2.1. Genel Çatı

```
┌─ ÜST ÇUBUK ────────────────────────────────────────────────────────────┐
│ [Logo PUSULA]   [🔍 Ctrl+K Ara]            [+ Yeni]  [🔔 12]  [👤 ▾] │
├─ KENAR ──┬─ ANA ÇALIŞMA ALANI ─────────────────┬─ SAĞ ÇEKMECE (varsa) ─┤
│          │                                     │                       │
│  Menü    │  Liste / Çizelge / Pano             │   Görev Detayı        │
│          │                                     │   Yorumlar/Derkenarlar│
│          │                                     │                       │
└──────────┴─────────────────────────────────────┴───────────────────────┘
```

### 2.2. Kırılma Noktaları

| Kırılma | Genişlik | Davranış |
|---|---|---|
| Mobil | < 640 px | Kenar çubuğu çekmece (sol ikondan açılır), Ana alan tam genişlik, kart yığını. |
| Tablet | 640-1024 px | Kenar 64 px daraltılmış (yalnızca ikon), Ana alan + sağ çekmece bindirmeli. |
| Masaüstü | ≥ 1024 px | Tam yerleşim. |

### 2.3. Ölçek

```
Kenar:    240 px (geniş) / 64 px (dar)
Üst Çubuk: 56 px
Sağ Çekmece: 480 px (sabit overlay)
İçerik aralığı: 16 px (sm), 24 px (md), 32 px (lg)
```

---

## 3. B-Ç3 — GÖSTERGE PANELİ (3 Rol İçin)

### 3.1. PERSONEL Gösterge Paneli (Mobil)

```
┌──────────────────────────────────┐
│ ☰  PUSULA   🔍   🔔3  👤        │
├──────────────────────────────────┤
│  Hoş geldin, Ayşe                │
│  ─────────────────────────       │
│  📊 Bana Atananlar               │
│  ┌────────────────────────────┐  │
│  │ 🔴 [GECİKTİ]               │  │
│  │ Bayram töreni hazırlığı    │  │
│  │ Bitim: 30 Nis (1 gün önce) │  │
│  │ ⏵ Onaya Sun                │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🟡 [RİSKLİ]                │  │
│  │ Haftalık rapor             │  │
│  │ Bitim: 3 May (2 gün)       │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │ 🟢 [OLAĞAN]                │  │
│  │ Personel listesi güncelle  │  │
│  │ Bitim: 10 May (9 gün)      │  │
│  └────────────────────────────┘  │
│                                  │
│  📝 Düzeltmedeki İşlerim   (1)   │
│  ↳ "Yazışma örneği eksik..."     │
│                                  │
│  🔔 Bildirimlerim          (3)   │
│  ↳ Yeni atama: ...               │
│                                  │
│  [+ Yeni Görev]                  │
└──────────────────────────────────┘
```

### 3.2. BİRİM_MÜDÜRÜ Gösterge Paneli (Masaüstü)

```
┌─ ÜST ─────────────────────────────────────────────────────────────────────────┐
│ PUSULA  🔍 Ara...               [+ Yeni]  [🔔 8]  Mehmet Y. (Yazı İşleri Md.)│
├─ KENAR ────┬─ ANA ──────────────────────────────────────────────────────────┤
│ 🏠 Ana     │  Mehmet'in Panosu — Yazı İşleri Birimi             📅 1 May 2026│
│ 📋 Birimim │                                                                 │
│ ✅ Onay    │  ┌────────────┬────────────┬────────────┬──────────────────┐   │
│   (4)      │  │  ⏳ Onay   │  🔴 Geciken│  🟡 Riskli │  📊 Birim         │   │
│ 🟡 Riskli  │  │  Bekleyen │  Görevler  │  Görevler  │  İlerleme         │   │
│ 🔴 Gecikti │  │     4     │     2      │     7      │   ███████░░ 72%  │   │
│ 📊 Rapor   │  └────────────┴────────────┴────────────┴──────────────────┘   │
│ 🗓 Vekâlet │                                                                 │
│ ⚙ Ayarlar  │  ⏳ ONAY BEKLİYOR (4)                              [Tümünü Gör]│
│            │  ┌──────────────────────────────────────────────────────────┐  │
│            │  │ Personel    │ Görev               │ Süre        │ Aksiyon │  │
│            │  │─────────────┼─────────────────────┼─────────────┼─────────│  │
│            │  │ Ayşe K.     │ Bayram töreni       │ 🔴 1g önce  │ [Aç ▸] │  │
│            │  │ Burak D.    │ Personel listesi    │ 🟢 9g       │ [Aç ▸] │  │
│            │  │ Cem T.      │ Yazışma örneği      │ 🟡 2g       │ [Aç ▸] │  │
│            │  │ Demet Y.    │ Toplantı tutanağı   │ 🟢 5g       │ [Aç ▸] │  │
│            │  └──────────────────────────────────────────────────────────┘  │
│            │                                                                 │
│            │  📈 EKİBİM — AÇIK İŞLER                                        │
│            │  ┌──────────────────────────────────────────────────────────┐  │
│            │  │ Personel   │ Açık │ Kritik │ Riskli │ İş Yükü Eşiği      │  │
│            │  │────────────┼──────┼────────┼────────┼────────────────────│  │
│            │  │ Ayşe K.    │  6   │   2    │   3    │ 🟡 Yüksek         │  │
│            │  │ Burak D.   │  3   │   0    │   1    │ 🟢 Olağan         │  │
│            │  │ Cem T.     │  9   │   4    │   2    │ 🔴 Aşırı          │  │
│            │  │ Demet Y.   │  4   │   1    │   0    │ 🟢 Olağan         │  │
│            │  └──────────────────────────────────────────────────────────┘  │
│            │                                                                 │
│            │  🗓 BUGÜN VEKALETEN İŞLEM YAPILANLAR                           │
│            │  ↳ Hayri B. (sizin adınıza) → 2 görev onayladı                 │
│            │                                                                 │
└────────────┴────────────────────────────────────────────────────────────────┘
```

### 3.3. YÖNETİCİ (Kaymakam) Gösterge Paneli (Masaüstü)

```
┌─ ÜST ─────────────────────────────────────────────────────────────────────────┐
│ PUSULA  🔍                       [+ Yeni]  [🔔 23]  Sayın Kaymakam (Yönetici)│
├─ KENAR ────┬─ ANA ──────────────────────────────────────────────────────────┤
│ 🏠 Ana     │  KAYMAKAMLIK GENEL DURUM                            📅 1 May 2026│
│ 🏢 Birimler│                                                                 │
│ 📊 Rapor   │  ┌────────────┬────────────┬────────────┬──────────────────┐   │
│ 🗓 Vekâlet │  │ 🔴 Geciken │ ⏳ Onay   │ 📁 Aktif   │ ✅ Kapatılabilir │   │
│ 📂 Arşiv   │  │  Görevler  │  Bekleyen │  Projeler  │  Projeler        │   │
│ 🛡 Denetim │  │     17     │     12    │     34     │      3           │   │
│ ⚙ Sistem   │  └────────────┴────────────┴────────────┴──────────────────┘   │
│            │                                                                 │
│            │  📊 BİRİM İLERLEMELERİ                                         │
│            │  ┌──────────────────────────────────────────────────────────┐  │
│            │  │ Birim                  │ İlerleme        │ Risk          │  │
│            │  │────────────────────────┼─────────────────┼───────────────│  │
│            │  │ Yazı İşleri            │ ███████░░ 72%   │ 🟢            │  │
│            │  │ Mal Müdürlüğü          │ █████░░░░ 51%   │ 🟡 (3 risk)  │  │
│            │  │ Köylere Hizmet         │ ████░░░░░ 38%   │ 🔴 (5 gecik) │  │
│            │  │ İlçe Tarım             │ ████████░ 84%   │ 🟢            │  │
│            │  │ İlçe Sağlık            │ ██░░░░░░░ 22%   │ 🟡 (1 risk)  │  │
│            │  └──────────────────────────────────────────────────────────┘  │
│            │                                                                 │
│            │  ⚠ ÜST MAKAMA TAŞINAN GECİKMELER (eşik aşıldı)                 │
│            │  ┌──────────────────────────────────────────────────────────┐  │
│            │  │ Görev          │ Birim         │ Atanan      │ Süre     │  │
│            │  │────────────────┼───────────────┼─────────────┼──────────│  │
│            │  │ İçişleri yazı  │ Yazı İşleri   │ Ayşe K.     │ 5 gün önce│ │
│            │  │ Köy bütçe rap. │ Köylere Hzm.  │ Cem T.      │ 3 gün önce│ │
│            │  └──────────────────────────────────────────────────────────┘  │
│            │                                                                 │
│            │  ✅ KAPATILABİLİR PROJELER                                     │
│            │  ↳ "2025 yılı denetim projesi" — Tüm görevler tamam (kapat ▸) │
│            │                                                                 │
└────────────┴────────────────────────────────────────────────────────────────┘
```

### 3.4. Karanlık Tema Önizleme (S9)

```
Aydınlık tema temel renkleri:
  Arka plan:  beyaz (#FFFFFF)
  Yazı:       koyu gri (#1A1A1A)
  Vurgu:      lacivert (#1E40AF)
  SLA Yeşil:  #059669
  SLA Sarı:   #D97706
  SLA Kırmızı:#DC2626

Karanlık tema:
  Arka plan:  koyu gri (#0A0A0A)
  Yazı:       açık gri (#E5E5E5)
  Vurgu:      mavi (#3B82F6)
  SLA renkleri korunur, kontrast ayarlanır
```

`next-themes` ile geçiş; kullanıcı tercihi `localStorage`'da, sunucu önbelleğine yansıtılmaz.

---

## 4. B-Ç4 — GÖREV LİSTESİ + SAĞ ÇEKMECE

### 4.1. Liste Görünümü (Masaüstü)

```
┌─ ÜST ─────────────────────────────────────────────────────────────────────────┐
│ PUSULA  🔍                       [+ Yeni Görev]  [🔔]  👤                    │
├─ KENAR ────┬─ ANA ──────────────────────────────────────────────────────────┤
│            │  Görevler — Yazı İşleri                                          │
│            │                                                                 │
│            │  ┌─ Süzgeçler ─────────────────────────────────────────────┐   │
│            │  │ Durum: [Tümü ▾] | Risk: [Tümü ▾] | Atanan: [Tümü ▾]  │   │
│            │  │ Etiket: [+] | Tarih: [Bu hafta ▾] | [Süzgeçleri Sıfırla]│   │
│            │  └─────────────────────────────────────────────────────────┘   │
│            │                                                                 │
│            │  ☐ Toplu Seçim   |  Sırala: [Bitim ↑ ▾]                        │
│            │  ┌──────────────────────────────────────────────────────────┐  │
│            │  │☐│ ID │ Başlık            │Atanan │Durum     │Risk│Bitim   │  │
│            │  │─┼────┼──────────────────┼───────┼──────────┼────┼────────│  │
│            │  │☐│ #142│ Bayram töreni    │Ayşe K.│ONAY_BEK. │🔴  │1g önce │  │
│            │  │ │    │ ████████░░ 80%   │       │          │    │        │  │
│            │  │─┼────┼──────────────────┼───────┼──────────┼────┼────────│  │
│            │  │☐│ #144│ Yazışma örneği   │Cem T. │DÜZELTME  │🟡  │2g sonra│  │
│            │  │ │    │ ████░░░░░░ 40%   │       │          │    │        │  │
│            │  │─┼────┼──────────────────┼───────┼──────────┼────┼────────│  │
│            │  │☐│ #146│ Personel listesi │Burak D│SÜRÜYOR   │🟢  │9g sonra│  │
│            │  │ │    │ ██░░░░░░░░ 20%   │       │          │    │        │  │
│            │  └──────────────────────────────────────────────────────────┘  │
│            │                                                                 │
│            │  ◀ 1 2 3 ... ▶  [20 ▾] / sayfa                                │
│            │                                                                 │
└────────────┴────────────────────────────────────────────────────────────────┘
```

**Toplu Seçim Aktif:**

```
┌────────────────────────────────────────────────────────────────────────┐
│  ✓ 3 görev seçildi   [Ata] [Durum Değiştir] [Etiket] [Sil]    [İptal] │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2. Sağ Çekmece — Görev Detayı (Açık Hâl)

```
┌─ ANA (yarı saydam ört) ────────┬─ SAĞ ÇEKMECE 480px ──────────────────┐
│  (liste arka planda görülür)   │                                       │
│                                │  ✕  #142 — Bayram töreni hazırlığı   │
│                                │  ─────────────────────────────────    │
│                                │  🔴 ONAY_BEKLİYOR  ⚠ Gecikti (1g)    │
│                                │  Atanan: 👤 Ayşe K.  Müdür: Mehmet Y.│
│                                │  Bitim: 30 Nis 2026  Öncelik: YÜKSEK │
│                                │  Etiketler: [Tören] [Önemli]          │
│                                │                                       │
│                                │  Sekmeler:                            │
│                                │  ▼ Detay │ Yorum(8) │ Derkenar(3) │ │
│                                │   Dosya(2) │ Kayıt                  │ │
│                                │  ─────────────────────────────────    │
│                                │                                       │
│                                │  AÇIKLAMA                             │
│                                │  19 Mayıs Bayram töreni için tüm     │
│                                │  hazırlıkların tamamlanması...        │
│                                │                                       │
│                                │  İLERLEME                             │
│                                │  ████████░░ 80%                       │
│                                │                                       │
│                                │  ALT GÖREVLER (3)                     │
│                                │  ✅ Davetiyeleri hazırla              │
│                                │  ✅ Salon rezervasyonu                │
│                                │  ⏳ Konuşma metni hazırla             │
│                                │                                       │
│                                │  BAĞLILIK                             │
│                                │  ⏵ Bekliyor: #138 Belediye yazısı   │
│                                │                                       │
│                                │  EYLEMLER                             │
│                                │  [✅ Onayla]   [❌ Reddet]            │
│                                │  [⏵ Yeniden Ata]   [⋯ Diğer]         │
│                                │                                       │
└────────────────────────────────┴───────────────────────────────────────┘
```

### 4.3. Mobil Görev Listesi

```
┌────────────────────────────────┐
│ ☰ PUSULA       🔍   🔔  👤    │
├────────────────────────────────┤
│ Görevler — Yazı İşleri         │
│ [Tümü▾] [Risk▾] [+]            │
│ ────────────────────────────── │
│ ┌────────────────────────────┐ │
│ │🔴 #142 Bayram töreni       │ │
│ │ Ayşe K. · Onay Bekliyor    │ │
│ │ ████████░░ 80% · 1g önce   │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │🟡 #144 Yazışma örneği      │ │
│ │ Cem T. · Düzeltme          │ │
│ │ ████░░░░░░ 40% · 2g sonra │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │🟢 #146 Personel listesi    │ │
│ │ Burak D. · Sürüyor         │ │
│ │ ██░░░░░░░░ 20% · 9g sonra  │ │
│ └────────────────────────────┘ │
│                                │
│   [+ Yeni Görev]               │
└────────────────────────────────┘
```

Görev tıklanınca: tam ekran modaller (mobil; çekmece masaüstü gibi davranmaz).

---

## 5. B-Ç5 — GENEL ARAMA (Ctrl+K)

```
┌─ Komut Modu Modal ───────────────────────────────────────────────┐
│  🔍  yazışma örneği_                                       Esc ✕ │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📁 PROJELER (2)                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📁 2026 Yazışma Standartları                               │ │
│  │   "Tüm birimlerde resmi yazışma örnekleri..."              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ✅ GÖREVLER (5)                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✅ #144 Yazışma örneği güncelle                            │ │
│  │   Yazı İşleri · 🟡 Riskli · Cem T.                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✅ #98 Yazışma şablonları arşivi                           │ │
│  │   Mal Müdürlüğü · ✅ Onaylandı                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📝 DERKENARLAR (3)                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📝 [KARAR] Yazışma kuralları                                │ │
│  │   Görev #98 · "Tüm yazışmalarda imza bloğu..."             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📄 DOSYALAR (1)                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 📄 yazisma-orneği-2026.pdf                                 │ │
│  │   Görev #98 · 2.4 MB · Cem T.                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ▼ Tüm sonuçları gör                                             │
└──────────────────────────────────────────────────────────────────┘

Klavye:
  ↑ ↓     gezinti
  ↵       seç
  Tab     kategori değiştir
  Esc     kapat
```

---

## 6. B-Ç6 — DERKENAR DÜZENLEYİCİSİ

### 6.1. Sağ Çekmecede Derkenar Sekmesi

```
┌─ SAĞ ÇEKMECE ───────────────────────────────────────────────┐
│ ✕  #142 — Bayram töreni                                     │
│ ─────────────────────────────────────────────────────       │
│ Detay │ Yorum(8) │ ▼Derkenar(3) │ Dosya(2) │ Kayıt          │
│ ─────────────────────────────────────────────────────       │
│                                                              │
│ [+ Yeni Derkenar ▾]                                          │
│  ↳ KARAR / UYARI / ENGEL / BİLGİ / NOT                       │
│                                                              │
│ ─────────────────────────────────────────────────────       │
│ 📌 [KARAR] Tören saati değişikliği                           │
│ Yazan: Mehmet Y. · 2 gün önce · Sürüm 2 (1 düzenleme)       │
│ ─────────────────────                                        │
│ Tören saati 10:00'dan 11:00'a alındı.                       │
│ İlçe Sağlık Müdürü ile koordinasyon sağlanmıştır.           │
│                                                              │
│ [Sürüm Geçmişi] [Sabit Kaldır] [Düzenle]                    │
│                                                              │
│ ─────────────────────────────────────────────────────       │
│ 🟧 [UYARI] Hava durumu                                       │
│ Yazan: Ayşe K. · 1 gün önce                                  │
│ ─────────────────────                                        │
│ Yağmur ihtimali yüksek, çadır rezervi yapılmalı.             │
│                                                              │
│ ─────────────────────────────────────────────────────       │
│ 🟥 [ENGEL] (✅ Çözüldü)   Belediye onayı bekleniyor          │
│ Yazan: Cem T. · 5 gün önce · Çözüldü: 1 gün önce            │
│ ─────────────────────                                        │
│ Belediye Başkanlığı resmi yazısı gelmeden tören iptal       │
│ edilebilir. Yazı geldikten sonra çözüldü.                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 6.2. Derkenar Düzenleyici Modal

```
┌─ Yeni Derkenar ────────────────────────────────────────────────┐
│  ✕                                                              │
├────────────────────────────────────────────────────────────────┤
│  Tip:  [KARAR ▾]                                                │
│        ◯ KARAR  ◯ UYARI  ◯ ENGEL  ◯ BİLGİ  ◯ NOT              │
│                                                                 │
│  Başlık: [____________________________________________]         │
│                                                                 │
│  İçerik:                                                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ B  I  U  S  | H1 H2 H3 | • ─ |  🔗  📎  ⌐⌐  ⊞         │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │                                                         │  │
│  │ Buraya zengin metin yazın...                           │  │
│  │                                                         │  │
│  │                                                         │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ☐ Sabitle (üst sırada göster)                                 │
│  ☐ ENGEL ise görev durumunu otomatik ENGELLENDİ yap (S4)      │
│                                                                 │
│  [İptal]                                          [Kaydet]      │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. B-Ç7 — ONAY AKIŞI EKRANLARI

### 7.1. Memur Tarafı — "Onaya Sun" Akışı

**Adım 1: Görev tamamla, "Onaya Sun" tıkla**

```
┌─ Görev Detay (Sağ Çekmece) ─────────────────────────┐
│  #142 Bayram töreni hazırlığı                       │
│  ...                                                 │
│  EYLEMLER                                            │
│  [Onaya Sun ▶]   [Yeniden Ata]   [İptal]            │
└──────────────────────────────────────────────────────┘
                       │
                       ▼ tıklanır
┌─ Onaya Sun Doğrulama ──────────────────────────────┐
│  Görevi onaya sunmak istediğinizden emin misiniz?  │
│  Sunduktan sonra düzenleme yapamazsınız.           │
│                                                    │
│  Müdüre not (isteğe bağlı):                        │
│  [______________________________________________]  │
│                                                    │
│  [İptal]                              [Evet, Sun]  │
└────────────────────────────────────────────────────┘
                       │
                       ▼ onayla
┌─ Sonner Bildirim ─────────────────────────────────┐
│  ✓ Görev onaya gönderildi.                        │
│    [Görüntüle]                          [Kapat]   │
└───────────────────────────────────────────────────┘
```

### 7.2. Müdür Tarafı — "Onay Bekleyenler" Sayfası

```
┌─ ÜST ─────────────────────────────────────────────────────────────────┐
│ PUSULA  🔍                       [+ Yeni]  [🔔 8]  Mehmet Y.         │
├─ KENAR ────┬─ ANA ──────────────────────────────────────────────────┤
│ 🏠 Ana     │  ⏳ Onay Bekleyen Görevler — Yazı İşleri              │
│ ✅ Onay(4) │                                                         │
│            │  ┌──────────────────────────────────────────────────┐   │
│            │  │#142 Bayram töreni     │ Ayşe K. │ Süre: 1g önce │   │
│            │  │ ████████░░ 80%        │ 🔴 GECİKTİ              │   │
│            │  │ [Aç ▸]  [✓ Onayla]  [✕ Reddet]                 │   │
│            │  └──────────────────────────────────────────────────┘   │
│            │  ┌──────────────────────────────────────────────────┐   │
│            │  │#144 Yazışma örneği    │ Cem T.  │ Süre: 2g     │   │
│            │  │ █████░░░░░ 50%        │ 🟢 OLAĞAN               │   │
│            │  │ [Aç ▸]  [✓ Onayla]  [✕ Reddet]                 │   │
│            │  └──────────────────────────────────────────────────┘   │
│            │  ...                                                    │
└────────────┴────────────────────────────────────────────────────────┘
```

### 7.3. Reddetme Modal'ı (Gerekçe Zorunlu)

```
┌─ Görevi Reddet ────────────────────────────────────────────────┐
│  ✕                                                              │
├────────────────────────────────────────────────────────────────┤
│  Görev: #142 Bayram töreni hazırlığı                            │
│  Atanan: Ayşe K.                                                │
│                                                                 │
│  ⚠ Reddetme Gerekçesi (zorunlu, en az 10 karakter)             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Konuşma metni eksik. Hava durumu uyarısı dikkate       │  │
│  │ alınmamış. Düzelterek tekrar gönderiniz.               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ✓ Bu gerekçeyi otomatik UYARI tipinde derkenar olarak ekle    │
│                                                                 │
│  Görev durumu: ONAY_BEKLİYOR → DÜZELTME                         │
│  Memur (Ayşe K.) bilgilendirilecek.                            │
│                                                                 │
│  [İptal]                                            [Reddet]    │
└────────────────────────────────────────────────────────────────┘
```

### 7.4. Onaylama Doğrulama (Maker-Checker Önlemi)

```
┌─ Görevi Onayla ───────────────────────────────────────────────┐
│  ✕                                                             │
├───────────────────────────────────────────────────────────────┤
│  Görev: #142 Bayram töreni hazırlığı                           │
│  Atanan: Ayşe K.                                               │
│  Onaylayan: Mehmet Y. (Yazı İşleri Md.)                        │
│                                                                │
│  ✓ Yapan-Doğrulayan kuralı sağlandı (atanan ≠ onaylayan)       │
│                                                                │
│  Onaylandıktan sonra:                                          │
│  • Görev arşive alınır                                         │
│  • Memura bildirim gönderilir                                  │
│  • Proje ilerlemesi yeniden hesaplanır                         │
│                                                                │
│  Müdür notu (isteğe bağlı):                                    │
│  [____________________________________________________]        │
│                                                                │
│  [İptal]                                          [Onayla]     │
└───────────────────────────────────────────────────────────────┘
```

### 7.5. Müdür Kendi Atadığı Görevi Onaylamaya Çalışır

```
┌─ Onay Engellendi ─────────────────────────────────────────────┐
│  ⚠ Bu görev size atandı. Yapan-Doğrulayan kuralı gereği       │
│    kendi görevinizi onaylayamazsınız.                          │
│                                                                │
│  Önerilen Aksiyonlar:                                          │
│  • Görevi başka birim müdürüne yeniden ata                    │
│  • Kaymakam'a (yöneticiye) onay için yönlendir                │
│                                                                │
│  [Kaymakam'a Yönlendir]   [Yeniden Ata]   [İptal]            │
└───────────────────────────────────────────────────────────────┘
```

---

## 8. B-Ç8 — VEKÂLET KURMA SİHİRBAZI

### 8.1. Adım 1 — Genel Bilgi

```
┌─ Yeni Vekâlet — Adım 1/3 ─────────────────────────────────────┐
│  ✕                                                             │
├───────────────────────────────────────────────────────────────┤
│                                                                │
│  Vekâlet vereceğiniz kişiyi seçin.                             │
│                                                                │
│  Vekâlet Alacak Kişi: [🔍 Hayri Bey ▾]                         │
│    ↳ Yazı İşleri Şefi (aynı birim)                             │
│                                                                │
│  Geçerlilik Tarihi:                                            │
│    Başlangıç: [📅 03.05.2026 09:00]                            │
│    Bitiş:     [📅 10.05.2026 17:00]                            │
│    Süre: 7 gün 8 saat                                          │
│                                                                │
│  Gerekçe (isteğe bağlı, kuruma görünür):                       │
│  [____________________________________________________]        │
│  Yıllık izin                                                   │
│                                                                │
│              [İptal]              [Sonraki ▶]                  │
└───────────────────────────────────────────────────────────────┘
```

### 8.2. Adım 2 — Yetki Kapsamı

```
┌─ Yeni Vekâlet — Adım 2/3 ─────────────────────────────────────┐
│  ✕                                                             │
├───────────────────────────────────────────────────────────────┤
│  Hangi yetkilerinizi devretmek istiyorsunuz?                   │
│                                                                │
│  ◯ Tüm yetkilerim (rolüm ne yapabiliyorsa)                     │
│  ●  Belirli yetkiler:                                          │
│                                                                │
│    GÖREV YETKİLERİ                                             │
│    ☑ Görev onaylama (görev.onayla)                             │
│    ☑ Görev reddetme (görev.reddet)                             │
│    ☐ Görev atama (görev.ata)                                   │
│    ☐ Görev silme                                               │
│                                                                │
│    PROJE YETKİLERİ                                             │
│    ☐ Proje oluşturma                                           │
│    ☐ Proje kapatma                                             │
│                                                                │
│    DERKENAR YETKİLERİ                                          │
│    ☐ Derkenar sabitleme                                        │
│                                                                │
│    [▾ Tüm yetkileri göster (12 daha)]                          │
│                                                                │
│         [◀ Geri]              [Sonraki ▶]                      │
└───────────────────────────────────────────────────────────────┘
```

### 8.3. Adım 3 — Özet & Onay

```
┌─ Yeni Vekâlet — Adım 3/3 — Özet ──────────────────────────────┐
│  ✕                                                             │
├───────────────────────────────────────────────────────────────┤
│  Vekâlet Özeti                                                 │
│  ──────────────                                                │
│                                                                │
│  Devreden:    Mehmet Y. (siz)                                  │
│  Alan:        Hayri B. (Yazı İşleri Şefi)                      │
│  Geçerlilik:  03 May 09:00 → 10 May 17:00                      │
│  Süre:        7 gün 8 saat                                     │
│  Gerekçe:     Yıllık izin                                      │
│                                                                │
│  Devredilen Yetkiler (2):                                      │
│  • görev.onayla                                                │
│  • görev.reddet                                                │
│                                                                │
│  ⚠ Önemli Notlar                                              │
│  • Vekâlet süresince Hayri B. sizin adınıza işlem yapacak.    │
│  • Tüm işlemler "Mehmet Y. adına Hayri B." olarak loglanacak.  │
│  • Gerektiğinde dilediğiniz an iptal edebilirsiniz.            │
│                                                                │
│         [◀ Geri]                       [✓ Vekâleti Oluştur]    │
└───────────────────────────────────────────────────────────────┘
```

### 8.4. Vekâlet Listesi — Kendi Verdiklerim

```
┌─ Vekâletlerim ──────────────────────────────────────────────────┐
│  Verdiğim Vekâletler │ Aldığım Vekâletler                       │
│  ─────────────────────                                          │
│                                                                  │
│  AKTİF VEKÂLETLER                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Hayri B.                            [03 May - 10 May]      │ │
│  │ 2 yetki: görev.onayla, görev.reddet                        │ │
│  │ Gerekçe: Yıllık izin                                       │ │
│  │ [Görüntüle] [Yetki Genişlet] [✕ İptal Et]                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  GEÇMİŞ                                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Ayşe K.    [12 Nis - 15 Nis] · ✅ Tamamlandı              │ │
│  │ Tüm yetkiler · 8 işlem yapıldı                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Burak D.   [01 Mar - 05 Mar] · ⚠ İptal Edildi (siz)       │ │
│  │ 3 yetki · 0 işlem yapıldı                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 8.5. "X Adına Y" Etiketi (Diğer Ekranlarda)

Vekâleten yapılan her eylem ekranlarda şöyle gösterilir:

```
┌─ Görev Kayıt Geçmişi ──────────────────────────────────┐
│  03 May 2026 14:23                                      │
│  👤 Hayri B. (Mehmet Y. adına)  görevİ ONAYLADI        │
│  Görev statüsü: ONAY_BEKLİYOR → ONAYLANDI               │
│                                                         │
│  03 May 2026 11:05                                      │
│  👤 Ayşe K.   görevİ ONAYA SUNDU                        │
│  ...                                                    │
└────────────────────────────────────────────────────────┘
```

```
┌─ Bildirim ─────────────────────────────────────────────┐
│  📬 #142 Bayram töreni                                 │
│     Hayri B. (Mehmet Y. adına) görevinizi onayladı.    │
│     03 May 14:23                                        │
└────────────────────────────────────────────────────────┘
```

---

## 9. KOMPONENT ENVANTERİ (Shadcn UI Karşılığı)

| Yerleşim Bölümü | Shadcn UI Komponenti |
|---|---|
| Üst çubuk + arama | `Input` + `Command` (Ctrl+K için `CommandDialog`) |
| Bildirim simgesi | `Popover` + `Badge` |
| Kullanıcı dropdown | `DropdownMenu` |
| Kenar çubuğu | `Sheet` (mobil) + custom Sidebar (masaüstü) |
| Görev kartı (mobil) | `Card` + `Progress` + `Badge` |
| Görev tablosu | `Table` (TanStack Table headless üzerine) |
| SLA rozetleri | `Badge` (variant: success/warning/destructive) |
| Sağ Çekmece | `Sheet` (yandan açılır, side="right") |
| Onay/Red modal | `AlertDialog` |
| Derkenar düzenleyici | `Dialog` + zengin metin (örn. Tiptap entegrasyonu) |
| Vekâlet sihirbazı | `Dialog` + adım göstergesi (`Tabs` veya `Stepper`) |
| Toplu seçim çubuğu | Sabit `Card` + butonlar |
| İlerleme çubuğu | `Progress` |
| Sonner Toast | `Toaster` (sonner) |
| Form alanları | `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup` |
| Tarih seçici | `Calendar` + `Popover` (resmi tatil takvimi entegre) |

---

## 10. ERİŞİLEBİLİRLİK NOTLARI

| Bölüm | Erişilebilirlik Önlemi |
|---|---|
| **Renk** | SLA renkleri yalnız renk değil, simge + metin de taşır. Renk körlüğüne uyumlu. |
| **Klavye** | Tüm modaller, çekmece, listeler klavye ile dolaşılabilir. Tab + Shift+Tab. |
| **Ekran okuyucu** | ARIA etiketleri Shadcn (Radix) tabanlı; örn. `role="dialog"`, `aria-label`. |
| **Tıklama hedefi** | En az 44 × 44 px (mobilde). |
| **Kontrast** | WCAG 2.2 AA: aydınlık modda 4.5:1 metin, karanlık modda 4.5:1 metin. |
| **Süzgeç sıfırla** | Klavye kısayolu önerilen: `Esc` |
| **Form hata** | Inline + ARIA `aria-invalid` + `aria-describedby`. |

---

## 11. SIRADAKİ ÇIKTIYA GEÇİŞ

Yerleşim çizimleri tamamlandı. **B-Ç11 Tasarım İmleri** belgesi (renk paleti, yazı tipi, aralık) bu çizimlerin gerçek tasarım dosyalarına dönüştürülmesi için temel sağlayacak.

**Kalan çıktılar:** B-Ç11, B-Ç13, B-Ç14, B-Ç15, B-Ç16.

**Bir sonraki çıktı: B-Ç11 — Tasarım İmleri (Design Tokens).**
