# PUSULA — Konsolide Ana Çözümleme Belgesi (Türkçe Sürüm)

> **Belge Tipi:** Ürün Gereksinim Belgesi (ÜGB) Birleştirme & Derinlemesine Çözümleme
> **Kapsam:** S1, S2, S3, S4, S5, S6 ve Ana ÜGB'lerin tek çatı altında toplanması
> **Hazırlayan:** Hızır YZ (Birleşik ÜGB çözümleme görevi)
> **Tarih:** 2026-05-01
> **Hedef Kitle:** Ürün ekibi, mimar, geliştirici, kalite güvence, paydaşlar (Kaymakamlık makamı, birim müdürleri)
> **Sınıflandırma:** Ana ÜGB (Tek Doğru Kaynak Adayı)

---

## İÇİNDEKİLER

1. [Yönetici Özeti](#1-yönetici-özeti)
2. [Belge Evrimi ve Sürüm Tarihçesi](#2-belge-evrimi-ve-sürüm-tarihçesi)
3. [Proje Vizyonu ve Stratejik Konumlandırma](#3-proje-vizyonu-ve-stratejik-konumlandırma)
4. [Teknoloji Yığını (Ayrıntılı Gerekçelendirme)](#4-teknoloji-yığını-ayrıntılı-gerekçelendirme)
5. [Kurumsal Yapı ve Yetkilendirme (Rol Tabanlı Erişim Kontrolü + İzinler)](#5-kurumsal-yapı-ve-yetkilendirme)
6. [Çekirdek Sistem Mimarisi](#6-çekirdek-sistem-mimarisi)
7. [Proje Mimarisi](#7-proje-mimarisi)
8. [Görev Mimarisi](#8-görev-mimarisi)
9. [İlerleme ve Kendiliğinden Çalışma Kuralları](#9-i̇lerleme-ve-kendiliğinden-çalışma-kuralları)
10. [Hizmet Süresi Anlaşması ve Risk Yönetimi](#10-hizmet-süresi-anlaşması-ve-risk-yönetimi)
11. [Onay Düzeneği (Yapan-Doğrulayan)](#11-onay-düzeneği-yapan-doğrulayan)
12. [Vekâlet Modülü](#12-vekâlet-modülü)
13. [Bildirim Merkezi ve Gelen Kutusu](#13-bildirim-merkezi-ve-gelen-kutusu)
14. [İzleyici Sistemi](#14-i̇zleyici-sistemi)
15. [Yinelenen Görevler](#15-yinelenen-görevler)
16. [Atama Kuralları](#16-atama-kuralları)
17. [Toplu İşlemler](#17-toplu-i̇şlemler)
18. [Görev Kalıpları](#18-görev-kalıpları)
19. [Kurumsal Hafıza: Derkenar Sistemi](#19-kurumsal-hafıza-derkenar-sistemi)
20. [Genel Arama Motoru (Ctrl+K)](#20-genel-arama-motoru-ctrlk)
21. [Denetim Günlüğü (İşlem Kayıtları)](#21-denetim-günlüğü-i̇şlem-kayıtları)
22. [Çekirdek Hata Gözlemcisi](#22-çekirdek-hata-gözlemcisi)
23. [Kullanıcı Deneyimi ve Yerleşim](#23-kullanıcı-deneyimi-ve-yerleşim)
24. [Önce Mobil ve İlerlemeli Web Uygulaması Stratejisi](#24-önce-mobil-ve-i̇lerlemeli-web-uygulaması-stratejisi)
25. [Dosya Yönetimi ve Depolama Soyutlaması](#25-dosya-yönetimi-ve-depolama-soyutlaması)
26. [Gösterge Paneli ve Görselleştirme](#26-gösterge-paneli-ve-görselleştirme)
27. [Veri Modeli (Birleştirilmiş Şema)](#27-veri-modeli-birleştirilmiş-şema)
28. [Kararlar ve Gerekçeleri (Karar Günlüğü)](#28-kararlar-ve-gerekçeleri-karar-günlüğü)
29. [Sürümler Arası Sapma / Çelişki Çözümlemesi](#29-sürümler-arası-sapma--çelişki-çözümlemesi)
30. [Boşluklar, Açık Sorular ve Öneriler](#30-boşluklar-açık-sorular-ve-öneriler)
31. [Sözlük](#31-sözlük)

---

## 1. YÖNETİCİ ÖZETİ

PUSULA, bir mülki idare amirliği (Kaymakamlık) için tasarlanmış; aşamalı kamu yapısına uygun, denetim odaklı, modüler ve **tam kapsamlı bir İş Yönetim Sahanlığı** (Work Management Platform) olarak konumlandırılmıştır.

S1'den S6'ya doğru evrimleşen ÜGB seti, aşağıdaki dönüşümü kayda almıştır:

- **S1:** Temel görev takip dizgesi (rol tabanlı erişim, vekâlet, üst makama taşıma, denetim günlüğü, hata izleme, önce mobil tasarım, ilerlemeli web uygulaması).
- **S2:** Shadcn UI ölçünü + çekirdek düzeyde genel arama (tam metin arama) + bildirim motoru.
- **S3:** Çağdaş ön yüz ekosistemi (better-auth, TanStack Query, React Hook Form + Zod, TanStack Table, Sonner).
- **S4:** Proje ve görev mimarisinin derinleştirilmesi (birim aşan projeler, görünürlük, ast-üst ilişkisi ile bağlılık ayrımı, uç düğüm odaklı ilerleme hesabı, sınıflandırılmış arama).
- **S5:** Kurumsal hafıza katmanı: **Derkenar (Annotation)** sistemi — yorumlardan ayrı, kalıcı, etiketli, sabitlenebilir bilgi defteri.
- **S6:** Olay güdümlü, önce arayüz tabanlı, değiştirilemez denetim, yumuşak silme + arşivleme, ince taneli izinler, izleyici/gelen kutusu, yinelenen görevler, iş yükü uyarısı, toplu işlemler.
- **Ana ÜGB:** S1–S6 birleşik son hâli.

Sistemin asal direkleri:

1. **Sabit aşama (Birim/Makam) modeli** — kamu yapısına uygun.
2. **Çözümle → Planla → Yapılacaklar → Uygulama** iş akışının sayısallaştırılması.
3. **Yapan-Doğrulayan (memur → müdür) onay düzeneği** + düzeltme döngüsü.
4. **Gecikme ve üst makama taşıma kendiliğinden çalışması.**
5. **Vekâlet (yetki devri) ile sürekliliğin korunması.**
6. **Değiştirilemez denetim günlüğü** ile her hareketin kayıt altına alınması.
7. **Yorum (geçici) + Derkenar (kalıcı kurumsal hafıza)** ayrımı.
8. **Ast-üst ilişkisi (üst-alt görev) ile Bağlılık (görev sıralaması) kavramlarının kesin ayrımı.**
9. **Önce mobil + ilerlemeli web uygulaması** ile saha kullanılabilirliği.
10. **Soyutlanmış depolama** ile ileride MinIO/S3 geçişine hazır altyapı.
11. **Sınıflandırılmış genel arama (Ctrl+K)** ve kullanıcı yetkisi sınırı içinde tüm veri tarama.
12. **Olay güdümlü mimari** ile bildirim, kayıt ve ileride yapay zekâ/web kanca tümleşimlerine açık tasarım.

Bu belge, S1-S6 evrim çizgisini koruyarak, eklenen her gereksinimi, alınan her mimari kararı ve arkasındaki gerekçeyi tek belge altında birleştirir; çelişkileri açığa çıkarır ve eksiklikler için soru listesi sunar.

---

## 2. BELGE EVRİMİ VE SÜRÜM TARİHÇESİ

PUSULA gereksinim seti **birikimli** bir biçimde gelişmiştir. Her yeni sürüm, bir öncekinin üzerine eklemeler ve netleştirmeler getirir; geriye dönük uyumsuzluk içeren mimari değişiklik yapılmamıştır.

### 2.1. Sürüm × Eklenti Çizelgesi

| Konu / Modül | S1 | S2 | S3 | S4 | S5 | S6 | Ana |
|---|---|---|---|---|---|---|---|
| Vizyon (görev takip → İş Yönetim Sahanlığı) | Görev takip | Görev takip | Görev takip | Çekirdek genişledi | Kurumsal hafıza eklendi | **İş Yönetim Sahanlığı** | Birleşik |
| Teknoloji: Next.js + React + Tailwind | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teknoloji: Shadcn UI |  | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teknoloji: better-auth |  |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teknoloji: TanStack Query |  |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teknoloji: React Hook Form + Zod |  |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teknoloji: TanStack Table |  |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teknoloji: Sonner Bildirim |  |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| Sunucu: Bun (Node.js uyumlu) + Prisma + PostgreSQL | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Depolama Soyutlaması (Yerel/MinIO/S3) | ✓ | ✓ | ✓ |  |  |  | ✓ |
| Önce Mobil + İlerlemeli Web Uygulaması | ✓ | ✓ | ✓ |  |  |  | ✓ |
| Rol Tabanlı Erişim (Kaymakam, Müdür, Memur) | ✓ | ✓ | ✓ |  |  | ✓ (genişledi) | ✓ |
| İnce Taneli İzinler |  |  |  |  |  | ✓ | ✓ |
| Vekâlet | ✓ | ✓ | ✓ |  |  | ✓ | ✓ |
| Üst Makama Taşıma (Süre + %25 Uyarı) | ✓ | ✓ | ✓ |  |  | ✓ | ✓ |
| Görev Kalıpları | ✓ | ✓ | ✓ |  |  |  | ✓ |
| Denetim Günlüğü (Prisma Ara Katman, JSON fark) | ✓ | ✓ (eski/yeni) | ✓ |  |  | ✓ (değiştirilemez) | ✓ |
| Çekirdek Hata Gözlemcisi | ✓ | ✓ | ✓ (Zod) |  |  |  | (örtük) |
| Onay Düzeneği (Yapan-Doğrulayan) | ✓ | ✓ | ✓ |  |  | ✓ (iki aşamalı netlik) | ✓ |
| Bildirim Motoru (uygulama içi, anlık) |  | ✓ | ✓ (Sonner) |  |  | ✓ (Gelen Kutusu) | ✓ |
| Çekirdek Düzey Genel Arama (Tam Metin) |  | ✓ | ✓ | ✓ (sınıflandırılmış) | ✓ (Derkenar dahil) | ✓ | ✓ |
| Kenar Çubuğu / Üst Çubuk / Çekmece Yerleşimi | ✓ | ✓ | ✓ |  |  |  | ✓ (yandan açılır) |
| Birim Aşan Projeler |  |  |  | ✓ |  |  | ✓ |
| Proje Dosya Havuzu |  |  |  | ✓ |  |  | ✓ |
| Bağımsız Görev (proje kimliği BOŞ) |  |  |  | ✓ |  |  | ✓ |
| Görev Görünürlüğü (ÖZEL/BİRİM) |  |  |  | ✓ | ✓ |  | ✓ |
| Ast-Üst İlişkisi (En Çok 2 Düzey) |  |  |  | ✓ | ✓ | ✓ | ✓ |
| Bağlılık (görev_bağlılıkları çoktan-çoğa) |  |  |  | ✓ | ✓ | ✓ | ✓ |
| Uç Düğüm İlerlemesi |  |  |  | ✓ | ✓ |  | ✓ |
| Elle Proje Kapatma |  |  |  | ✓ |  |  | ✓ |
| TanStack Table + İlerleme Çubuğu + Rozet |  |  |  | ✓ | ✓ | ✓ | ✓ |
| Sınıflandırılmış Arama (📁✅📝📄) |  |  |  | ✓ | ✓ | ✓ | ✓ |
| Derkenar Sistemi |  |  |  |  | ✓ | ✓ | ✓ |
| Yorum/Derkenar Ayrımı |  |  |  |  | ✓ | ✓ | ✓ |
| Derkenar Tipleri (KARAR/UYARI/ENGEL/BİLGİ) |  |  |  |  | ✓ | ✓ | ✓ |
| Derkenar Sürümleme (Anlık Görüntü) |  |  |  |  |  | ✓ | ✓ |
| Önce Arayüz + Olay Güdümlü |  |  |  |  |  | ✓ | ✓ |
| Değiştirilemez Denetim Günlüğü |  |  |  |  |  | ✓ | ✓ |
| Yumuşak Silme + Arşivleme |  |  |  |  |  | ✓ | ✓ |
| Hizmet Süresi Riski (🟢🟡🔴) |  |  |  |  |  | ✓ | ✓ |
| İzleyici |  |  |  |  |  | ✓ | ✓ |
| Gelen Kutusu (Bildirim Merkezi) |  |  |  |  |  | ✓ | ✓ |
| Yinelenen Görevler |  |  |  |  |  | ✓ | ✓ |
| Atama Kuralları |  |  |  |  |  | (örtük "Kendiliğinden Çalışan Kurallar") | ✓ |
| Toplu İşlemler |  |  |  |  |  | ✓ | ✓ |
| İş Yükü Uyarısı |  |  |  |  |  | ✓ | ✓ |
| Gösterge Paneli Bileşenleri |  |  |  |  |  | ✓ | ✓ |

> **Not:** Çizelgedeki "✓" o sürümün **ilk** olarak konuya değindiği veya o konuyu **netleştirdiği** anı işaretler. Sonraki sürümlerde konunun kapsamı korunduğu varsayılır (birikimli yaklaşım).

### 2.2. Sürümlerin Anlamı

- **S1 → S2:** Arayüz ölçünleşmesi (Shadcn) + arama/bildirim altyapısı.
- **S2 → S3:** Ön yüz ekosistemi netleşti (Kimlik Doğrulama, Durum, Form, Çizelge, Bildirim).
- **S3 → S4:** Görev/Proje yapısı derinleşti (görünürlük, ast-üst, bağlılık, ilerleme).
- **S4 → S5:** Kalıcı kurumsal hafıza katmanı (Derkenar) eklendi.
- **S5 → S6:** Mimari ilkeler (olay güdümlü, önce arayüz), denetim sertleşmesi (değiştirilemez, yumuşak silme), iş akışı zenginliği (izleyici, gelen kutusu, yinelenen, toplu, iş yükü).
- **Ana:** S1–S6 birleştirilmiş tek doğru (Single Source of Truth) belgesi.

### 2.3. Evrimden Çıkan Stratejik İmler

1. **"Görev Takip" → "İş Yönetim Sahanlığı"** kayma çizgisi. Sistem yalnızca yapılacaklar değil; karar defteri, denetim düzeneği ve kurum hafızasıdır.
2. **Saf rol tabanlı → rol tabanlı + ince taneli izinler** geçişi (S6'da `proje.yönet`, `görev.ata`, `görev.onayla`, `görev.oluştur`, `görev.güncelle`, `dizge.denetim` gibi izinler).
3. **Ön yüz olgunlaşması:** S1'deki "React + Tailwind" S3 itibarıyla çağdaş bir ekosisteme dönüştü; bu, kullanıcı deneyiminin ÜGB'de **birinci sınıf** bir konu olduğuna işaret eder.
4. **Denetimin sertleşmesi:** S1 "kayıt altına alınır" → S6 "asla silinemez/değiştirilemez".
5. **Yorum + Derkenar ayrımı**, sistemin "sohbet aracı" olmaktan çıkıp "kurum hafızası" olarak konumlandırılma niyetinin en güçlü kanıtıdır.

---

## 3. PROJE VİZYONU VE STRATEJİK KONUMLANDIRMA

### 3.1. Vizyon Tümcesi

> **PUSULA**, mülki idare amirliği bünyesindeki tüm süreçlerin, kararların, denetimlerin ve kurumsal hafızanın yönetildiği; sabit aşama yapısını temel alan, denetlenebilir, modüler ve çağdaş bir İş Yönetim Sahanlığıdır.

### 3.2. Stratejik Konumlandırma

| Boyut | Yaklaşım |
|---|---|
| **Hedef Kitle** | Mülki idare amirliği (Kaymakamlık), birim müdürleri, memurlar, idari personel. |
| **Mimari Felsefe** | Sabit aşama (Birim/Makam) — devingen takım modeli **bilinçli reddedilmiştir**. |
| **İş Akışı Modeli** | Çözümle → Planla → Yapılacaklar → Uygulama (sayısallaştırılmış). |
| **Yönetim Disiplini** | Yapan-Doğrulayan (memur işi yapar, müdür onaylar). |
| **Nitelik & Denetim** | Değiştirilemez denetim günlüğü, yumuşak silme, eski/yeni değer farkı. |
| **Kurum Hafızası** | Derkenar (kalıcı bilgi) + Yorum (geçici sohbet) ayrımı. |
| **Sürdürülebilirlik** | Vekâlet ile süreçlerin tıkanmaması. |
| **Kendiliğinden Çalışma** | Üst makama taşıma (gecikme), yinelenen (rutin işler), atama kuralları. |
| **Çağdaşlık** | Shadcn + Next.js App Router + better-auth + TanStack ekosistemi. |
| **Mobil Erişim** | Önce mobil tasarım + ilerlemeli web uygulaması (ana ekrana ekleme + temel çevrimdışı). |
| **Geleceğe Hazırlık** | Önce arayüz + olay güdümlü (yapay zekâ/web kanca tümleşimi için açık kapı). |

### 3.3. "Neden PUSULA?" — Çözmeye Çalıştığı Asıl Sorunlar

1. **Kamu yönetiminin sabit aşaması** ile iyi geçinmeyen "takım/grup" odaklı genel amaçlı araçların (Asana, Trello, Jira) zorlanması.
2. **Vekâlet** kavramı: Türk kamu yönetiminde idarecilerin izinli/görevli olması olağandır; bu süreçte iş akışının tıkanmaması zorunludur.
3. **Onay-Red-Düzeltme** döngüsü: Resmi yazışma ve havale kültürünün sayısal karşılığı.
4. **İzlenebilirlik:** Her hareket kim tarafından, ne zaman, hangi gerekçeyle yapıldı sorusuna **somut ve değiştirilemez** yanıt vermek.
5. **Kurum hafızası kaybı:** Yorumlarda boğulan kararlar, ENGEL bilgileri vs. — Derkenar bunu çözer.
6. **Süre Yönetimi (Bitim Tarihi):** Resmi işlerde "süre dolmadan haber ver" zorunluluğu (%25 erken uyarı + kendiliğinden gecikme durumu + üst makama taşıma).
7. **Birim aşan çalışmalar:** Bir projede birden fazla birimden personelin eşgüdümü.
8. **Duyarlı/özel görev desteği:** ÖZEL görünürlük ile yalnızca atanan-atayan arasındaki gizli görevler.

### 3.4. Tasarım İlkeleri

1. **Önce Arayüz:** Tüm yetenekler önce HTTP uç noktası olarak modellenir; arayüz bunun bir tüketicisidir.
2. **Olay Güdümlü:** İç olaylar (`GÖREV_TAMAMLANDI`, `DERKENAR_OLUŞTURULDU`, `DURUM_DEĞİŞTİ`, vb.) yayımlanır; kayıt tutma, bildirim, yapay zekâ/web kanca bunları dinler.
3. **Öntanımlı Değiştirilemez:** Denetim kayıtları, derkenar geçmişi (anlık görüntü), olay günlüğü silinemez.
4. **Öntanımlı Yumuşak Silme:** Hiçbir kullanıcı verisi fiziksel olarak silinmez (`silinme_tarihi`, `silen_kişi`).
5. **Önce Mobil:** Tasarım önce mobil için yapılır, masaüstü onun zenginleştirilmiş hâlidir.
6. **Birleştirilebilir Arayüz:** Shadcn UI ile ham bileşenleri bileşim ile zenginleştirme.
7. **Sunucu Durumu ≠ İstemci Durumu:** TanStack Query ile sunucu durumu arayüz durumundan ayrılır.
8. **Sözleşme Olarak Doğrulama:** Zod şemaları hem React Hook Form hem uç nokta hem de tip türetimi için tek kaynak.

---

## 4. TEKNOLOJİ YIĞINI (Ayrıntılı Gerekçelendirme)

### 4.1. Birleştirilmiş Çizelge

| Katman | Teknoloji | İlk Eklendiği Sürüm | Gerekçe |
|---|---|---|---|
| Çatı | **Next.js (App Router)** | S1 | Sunucuda işleme, dosya tabanlı yönlendirme, sunucu bileşenleri, ara katman, kenar desteği. |
| Arayüz Çatısı | **React** | S1 | Ekosistem, işe alım, bileşen modeli. |
| Biçem | **Tailwind CSS** | S1 | Yardımcı sınıf öncelikli, hızlı örneklem, tasarım dizgesi disiplini. |
| Bileşen | **Shadcn UI** | S2 | Tutarlı, çağdaş, **erişilebilir** (Radix tabanlı), kopyala-yapıştır mantığı (kütüphane bağımlılığı yerine kod sahipliği). |
| Kimlik Doğrulama | **better-auth** | S3 | Çağdaş, tip öncelikli, eklenti mimarisi, oturum/jeton/açık yetkilendirme/eposta/iki adımlı destekler. |
| Sunucu Durumu | **TanStack Query** | S3 | Önbellek geçersizleştirme, iyimser güncellemeler, yoklama, sonsuz sorgular — sunucu durumu ≠ arayüz durumu. |
| Form | **React Hook Form** | S3 | Kontrolsüz başarım, en az yeniden çizim. |
| Doğrulama | **Zod** | S3 | Şema öncelikli; hem istemci (React Hook Form) hem sunucu hem TypeScript tip kaynağı. |
| Çizelge | **TanStack Table** | S3 | Görselsiz, sıralama/süzme/sayfalama/sanallaştırma; ilerleme çubuğu ve rozet tümleşimi. |
| Bildirim Kutusu | **Sonner** | S3 | Çağdaş, hafif, devinimli, erişilebilir. |
| Sunucu Çalıştırıcısı | **Bun** (Node.js uyumlu) | S1 (B-Ç18 ile güncellendi) | Tam yığın JavaScript/TypeScript; yerleşik test çalıştırıcı + paket yöneticisi + bundler. `npm`/`pnpm`/`yarn` YASAK. |
| Paket Yöneticisi | **Bun** (`bun install`, `bun add`, `bun.lockb`) | B-Ç18 | 10-20 kat daha hızlı kurulum, lock dosyası binary, monorepo tooling gerekmez. |
| Nesne-İlişkisel Eşleştirici | **Prisma** | S1 | Tip güvenli veritabanı erişimi, geçiş, **ara katman** (denetim için kritik). |
| Veritabanı | **PostgreSQL** | S1 | İşlem güvenliği, JSON ikilisi, **tam metin arama**, ileride pgvector/eklentiler için açık kapı. |
| Mobil | **Önce Mobil Duyarlı + İlerlemeli Web Uygulaması** | S1 | Yerel uygulama mağazası sürtünmesini ortadan kaldırır; ana ekrana ekleme, basit çevrimdışı önbellek. |
| Depolama | **Soyutlanmış Depolama Arayüzü (Yerel / MinIO / S3)** | S1 | Yerel başla → gereksinim oluşunca MinIO veya S3'e taşı; uygulama kodunda değişiklik gerekmez. |

### 4.2. Mimari Düzlemde Teknoloji Seçimlerinin Anlamları

#### Next.js App Router Seçimi
- Sunucu Bileşenleri → **veri yakınlığı** (veritabanı sorgusu bileşen içinde, sıvılaştırma maliyeti azalır).
- Yol İşleyicileri → uç nokta (`app/api/...`) — Önce Arayüz için doğal yapı.
- Ara Katman → kimlik doğrulama kapısı, yol koruma.
- Akış + Bekletme → büyük gösterge panellerinde algısal başarım.

#### Prisma Ara Katmanı Seçimi
- **Denetim günlüğü** için "tek ortak yer" sağlar. Her ekleme/güncelleme/silme işlemi yakalanabilir.
- `extends` arayüzü ile `$allModels` üzerinde `before/after` kancaları kurulabilir.
- Yumuşak silme uygulamasının kritik tek noktası (yaptırım için tek nokta).

#### TanStack Query Seçimi
- Bildirim tabanlı geçersizleştirme: bir görev güncellenince, ilgili `sorguAnahtarı` geçersizleşir.
- İyimser güncellemeler ile "Onaya Sun" gibi eylemlerde anlık geri bildirim.
- `bayatlamaSüresi` + arka plan yeniden çekme ile **kullanıcının gelen kutusu/gösterge paneli** taze tutulur.

#### React Hook Form + Zod
- Tek şema → form doğrulama + uç nokta isteği doğrulama + TypeScript tipleri.
- Doğrulama hataları **Çekirdek Hata Gözlemcisi**'ne kullanıcı deneyimi iyileştirme imi olarak gönderilir (S3'te netleşti).

#### TanStack Table
- İlerleme çubuğu, rozet, özel hücre çizici.
- Sunucu tarafı sayfalama/sıralama/süzme desteği — büyük listelerde (gecikmiş görevler, denetim günlüğü) kritik.

#### Sonner
- "Onaya sunuldu", "Görev güncellendi", "Vekâlet etkin" gibi geri bildirimler.
- Eylem düğmesi (Geri Al) destekli bildirim → toplu işlemler için yararlı.

#### Depolama Soyutlaması
- Arayüz: `IDepolamaSağlayıcı { yükle(), indir(), sil(), imzalıBağlantıAl() }`.
- Uygulamalar: `YerelDosyaDizgesiSağlayıcı`, `MinioSağlayıcı`, `S3Sağlayıcı`.
- Ortam değişkeni ile sağlayıcı seçimi.
- **Sınanabilirlik:** sahte sağlayıcı ile birim sınamaları.

---

## 5. KURUMSAL YAPI VE YETKİLENDİRME

### 5.1. Yapısal İlke

> **Sabit aşama (Birim/Makam)**. Devingen takım, tahta, çalışma alanı gibi kavramlar **bilinçli olarak reddedilmiştir.**

Bu, kamu kurumlarının kuruluş şemalarına (Kaymakam → Birim Müdürleri → Memurlar) bire bir uyum sağlayan bir **yansıtmadır**.

### 5.2. Roller ve Aşama

| Rol (S1-S5) | Rol (S6/Ana) | Yetki Kapsamı |
|---|---|---|
| **Kaymakam / Özel Kalem** | **YÖNETİCİ** | Üst Yönetici; tüm birimleri izleme, görev açma, üst makama taşıma raporu, dizge ayarları. |
| **Birim Müdürü** | **BİRİM_MÜDÜRÜ** | Kendi birimine gelen işleri memurlara havale, onay/red, vekâlet bırakma, proje başlatma. |
| **Birim Personeli (Memur)** | **PERSONEL** | Atanan görevleri yürütme, alt görev açma, raporlama, onaya sunma. |

### 5.3. İnce Taneli İzinler (S6)

S6'da **rol → izin paketi** ilişkisi netleştirildi:

| Rol | Örnek İzinler |
|---|---|
| **YÖNETİCİ** | `dizge.denetim`, `dizge.ayarlar`, `proje.yönet`, `birim.yönet`, `üstmakam.oku`, `rapor.oku.tümü`. |
| **BİRİM_MÜDÜRÜ** | `proje.oluştur`, `proje.yönet.kendi_birim`, `görev.ata`, `görev.onayla`, `görev.reddet`, `vekâlet.oluştur`, `birim.üye.oku`. |
| **PERSONEL** | `görev.oluştur`, `görev.güncelle.atanmış`, `görev.onaya_sun`, `altgörev.oluştur`, `derkenar.oluştur`, `yorum.oluştur`. |

**Önemli:** İzinler, rol tabanlı **paket** olarak gelir; ancak veri modelinde izinlerin **ayrı çizelge (izinler, rol_izinleri, kullanıcı_izinleri)** olarak yönetilmesi tasarım esnekliği için önerilir (gelecekte rol dışı kullanıcı bazlı geçersiz kılma).

### 5.4. Birim Aşan Çalışma

- Bir proje birden fazla birime ait olabilir (S4).
- Proje sahibi birim, dışındaki birimlerden personeli **görev tabanında** projeye katabilir.
- Yetki yayılımı: Kaymakam ve Birim Müdürleri proje başlatma yetkisine iyedir.

### 5.5. Vekâlet ile Yetki Devri

Bkz. [§12 Vekâlet Modülü](#12-vekâlet-modülü). Vekâlet, bir kullanıcının **iyesi olduğu yetkilerin alt kümesini** belirli tarih aralığında başka bir kullanıcıya geçici olarak verir. Tüm vekâleten yapılan işlemler `"X adına Y tarafından yapılmıştır"` biçiminde kayıt altına alınır.

---

## 6. ÇEKİRDEK SİSTEM MİMARİSİ

### 6.1. Önce Arayüz Tasarımı

**İlkeler:**
- Her etki alanı etkileşimi REST uç noktası ile başlar (`POST /görevler/{id}/ata`, `POST /görevler/{id}/onaya-sun`, `POST /derkenarlar`, `POST /vekâletler`, vb.).
- Arayüz bunun bir tüketicisidir (TanStack Query ile).
- Uç noktalar **etki alanı odaklı** adlandırılır, oluştur-oku-güncelle-sil odaklı değil.

**Örnek uç nokta dizini:**
- `POST /projeler` (proje oluştur)
- `POST /projeler/{id}/kapatma-istegi` (kapatma isteği)
- `POST /görevler` (görev oluştur)
- `POST /görevler/{id}/ata` (havale)
- `POST /görevler/{id}/onaya-sun`
- `POST /görevler/{id}/onayla`
- `POST /görevler/{id}/reddet` (gerekçe ile)
- `POST /görevler/{id}/bağlılıklar` (bağlılık ekle)
- `POST /görevler/{id}/izle` / `DELETE /görevler/{id}/izle`
- `POST /derkenarlar` / `PATCH /derkenarlar/{id}` / `POST /derkenarlar/{id}/sabitle`
- `POST /vekâletler`
- `GET /arama?s=...&sınıf=...`
- `GET /gelen-kutusu`
- `GET /denetim-günlükleri?varlık=...&id=...`

### 6.2. Olay Güdümlü Mimari

**Olay Sözlüğü (örneklem):**

| Olay | Tetikleyici | Dinleyiciler |
|---|---|---|
| `GÖREV_OLUŞTURULDU` | Yeni görev oluşumu | Bildirim, denetim, gösterge paneli önbellek geçersizleştirme. |
| `GÖREV_ATANDI` | Havale | Bildirim (atanan + izleyici), iş yükü sayacı güncellemesi. |
| `GÖREV_DURUMU_DEĞİŞTİ` | Durum değişimi | Denetim, bildirim, üst makama taşıma (GECİKTİ'ye geçişte). |
| `GÖREV_TAMAMLANDI` | Tamamlanma | Üst görev ilerlemesi yeniden hesaplama, proje ilerlemesi yeniden hesaplama. |
| `GÖREV_REDDEDİLDİ` | Müdür reddetti | Memura gerekçeli bildirim. |
| `GÖREV_GECİKTİ` | Zamanlayıcı tetikli | Üst makama taşıma bildirimi. |
| `DERKENAR_OLUŞTURULDU` | Derkenar oluşumu | Denetim, izleyici bildirimi (seçimlik). |
| `DERKENAR_SABİTLENDİ` | Sabitleme | Denetim. |
| `DOSYA_YÜKLENDİ` | Dosya yükleme | Denetim, gösterge paneli yeniden hesaplama. |
| `VEKÂLET_OLUŞTURULDU` | Vekâlet kuruldu | Hem devreden hem alana bildirim. |
| `VEKÂLET_SÜRESİ_DOLDU` | Süre doldu | Kendiliğinden kapatma + bildirim. |

**Yararları:**
- Bildirim, kayıt, ölçüt, yapay zekâ/web kanca gibi **yan kaygılar** ana iş kodundan ayrışır.
- Yeni bir dinleyici eklemek, var olan akışı değiştirmeden olanaklıdır (Açık-Kapalı ilkesi).
- Sınanabilirlik artar (olaylar sözleşme olarak doğrulanır).

### 6.3. Değiştirilemez Denetim Günlüğü

Bkz. [§21 Denetim Günlüğü](#21-denetim-günlüğü-i̇şlem-kayıtları).

- **Veritabanı tetikleyicisi veya Prisma ara katmanı** ile yakalanır.
- `etkinlik_günlükleri` çizelgesine yazılır.
- **Asla silinemez/değiştirilemez** (veritabanı düzeyinde `GÜNCELLE`/`SİL` yetkileri geri çekilir; yalnızca ekleme).
- `eski_değer` ve `yeni_değer` JSON olarak saklanır.

### 6.4. Yumuşak Silme ve Arşivleme

**Yumuşak Silme:**
- Tüm etki alanı çizelgelerinde `silinme_tarihi: TarihSaat?` ve `silen_kişi: Metin?` sütunları.
- Prisma ara katmanı: `çoklu_bul`/`tekli_bul` çağrılarında `silinme_tarihi NULL` süzgeci kendiliğinden eklenir.
- "Çöp kutusu" / "geri al" senaryosu olanaklıdır (politika kararı sonrası).

**Arşivleme:**
- Tamamlanan **projeler** (S6/Ana) etkin görünümden çıkar, arşive taşınır.
- Arşivdeki kayıtlar **aramada erişilebilir kalır** (sınıflandırılmış aramada ayrı sekme önerilir).
- Arşivleme elle onayla yapılır (kendiliğinden kapatmak yasak; bkz. §9).

### 6.5. Rol Tabanlı + İzinler Uygulama Yaklaşımı

- **Ara katman düzeyinde** yol tabanlı koruma (Next.js ara katman + better-auth oturum).
- **Hizmet düzeyinde** `izinGerekli(kullanıcı, 'görev.onayla', bağlam)` çağrıları.
- **Veritabanı düzeyinde** Satır Düzeyi Güvenliği (Row-Level Security) seçimlik ama önerilir (özellikle ÖZEL görevlerde).
- Vekâlet: etkin izin = `kullanıcı.izinler ∪ devredilen_izinler(etkin_vekâlet)`.

---

## 7. PROJE MİMARİSİ

### 7.1. Tanım

**Proje:** Birimlerin ana iş kalemlerini öbekleyen çatı yapı (S4). Bir proje:
- 1+ birime aittir (birim aşan).
- N adet göreve iyedir (görevler bağımsız da olabilir, proje kimliği BOŞ).
- Bir dosya havuzu içerir.
- Proje sahibi (oluşturan) + üyeler dizinini tutar.
- Elle kapatma sürecine bağlıdır.

### 7.2. Birim Aşan Yapı

- Bir proje birden fazla birime üye personel barındırabilir.
- Proje sahibi birim, **dışındaki** birimlerden personel ekleyebilir.
- Üye eklenirken üyenin birim müdürünün onayı gerekip gerekmediği **açık soru** (bkz. §30).

### 7.3. Proje Başlatma Yetkisi

- **YÖNETİCİ (Kaymakam):** her birim için.
- **BİRİM_MÜDÜRÜ:** kendi birimi için.
- **PERSONEL:** proje başlatma yetkisi yoktur (yalnızca bağımsız görev veya kendisine açılan projedeki alt görev).

### 7.4. Proje Dosya Havuzu

- Projeye bağlı tüm görevlerde paylaşılan **veya** doğrudan proje düzeyinde yüklenen dosyalar **birleştirilmiş** olarak proje ana sayfasında görünür.
- Dosyalar görev tabanında da yüklenebilir; "Proje Dosyaları" görünümü bunların birleşik hâlidir.
- Depolama soyutlaması (Yerel/MinIO/S3) ile arka uçta saklanır.
- Dosya silme: yumuşak silme + denetim günlüğü.

### 7.5. Elle Proje Kapatma

- **Tüm uç düğüm görevler tamamlandığında** dizge durumu kendiliğinden kapatmaz.
- Üst amire (Birim Müdürü veya Kaymakam) **"Kapatılabilir Projeler"** bildirimi gider.
- Elle onay ile arşive taşınır (`durum = ARŞİVLENDİ`).
- Bu, kamu yönetiminde "raporlama-değerlendirme-resmi kapatma" döngüsünün sayısal karşılığıdır.

### 7.6. Proje Durum Modeli (Önerilen)

| Durum | Anlam |
|---|---|
| `TASLAK` | Henüz başlatılmamış. |
| `ETKİN` | Etkin çalışma. |
| `BEKLEMEDE` | Geçici durdurma. |
| `KAPATILMAYA_HAZIR` | Tüm uç görevler bitti, kapatma onayı bekliyor. |
| `KAPATILDI` (veya `ARŞİVLENDİ`) | Resmi kapatıldı, arşivde. |

### 7.7. Proje Üyelik Modeli

- `proje_üyeleri(proje_kimliği, kullanıcı_kimliği, projedeki_rol)` çoktan-çoğa.
- Rol örnekleri: `SAHİP`, `ÜYE`, `GÖZLEMCİ` (proje düzeyinde, kurumsal rol tabanlı erişim ile dik).

---

## 8. GÖREV MİMARİSİ

### 8.1. Görev Tipleri

| Tip | Tanım |
|---|---|
| **Proje Görevi** | `proje_kimliği` doludur. |
| **Bağımsız Görev** | `proje_kimliği = BOŞ`. Yine atanır, takip edilir. |

### 8.2. Görev Görünürlüğü

| Görünürlük | Erişim Kapsamı |
|---|---|
| **ÖZEL** | Yalnızca **oluşturan** ve **atanan**. Birim müdürü dahil **hiç kimse** görmez. |
| **BİRİM** | Birim müdürü ve birimdeki yetkili personel izleyebilir. |

**Önemli senaryo:** Duyarlı/kişisel/ön araştırma niteliğindeki görevler (örn. bir personelin kendi başarım değerlendirmesi için tuttuğu anımsatmalar) ÖZEL olarak imlenir.

> **Sapma uyarısı:** S6/Ana'da ÖZEL/BİRİM ekseninde "PROJE" görünürlüğü açıkça yazılmamış olsa da, projeye dahil olmayan birim üyelerinin proje görevlerini görüp göremeyeceği **netleştirilmelidir** (bkz. §30 Açık Sorular).

### 8.3. Ast-Üst İlişkisi (Üst / Alt) — En Çok 2 Düzey

- Görev → Alt Görev.
- Alt görev altında **alt-alt görev YOK** (yasak).
- Amaç: aşırı parçalanma, "ağaç içinde kaybolma" sorunundan kaçınmak. Kamu işlerinde 2 düzeyin yetkin olduğu varsayımı.

### 8.4. Bağlılık (Sıralama) — Çoktan Çoğa

- `görev_bağlılıkları(görev_kimliği, bağlı_olduğu_görev_kimliği, tip)` çizelgesi.
- "A bitmeden B başlayamaz" ilişkisi.
- Ast-üst ilişkisinden bağımsız: alt görev başka bir üstün altındakine bağımlı olabilir.
- **Döngü önleme:** ekleme anında çizge taraması, döngü saptanırsa reddedilir.

### 8.5. Ast-Üst ile Bağlılık — Kavramsal Ayrım

| Boyut | Ast-Üst İlişkisi | Bağlılık |
|---|---|---|
| **Amaç** | İş parçalama | İş sıralama |
| **Yapı** | Ağaç (en çok 2 düzey) | Yönlü döngüsüz çizge |
| **İlerleme Etkisi** | Üst ilerlemesi alttan hesaplanır | Bağımlı görev ön koşulu biten kadar başlatılamaz |
| **Çizelge** | `görevler.üst_kimliği` (kendine başvurulu) | `görev_bağlılıkları` (çoktan çoğa) |

### 8.6. Görev Durum Modeli

| Durum | Anlam |
|---|---|
| `YAPILACAK` | Atandı ama başlamadı. |
| `SÜRÜYOR` | Etkin çalışma. |
| `ENGELLENDİ` | Bir ENGEL derkenarı nedeniyle durdu. |
| `ONAY_BEKLİYOR` | Memur onaya sundu. |
| `ONAYLANDI` (veya `BİTTİ` / `KAPALI`) | Müdür onayladı, görev kapandı. |
| `DÜZELTME` | Müdür reddetti, memura geri döndü. |
| `GECİKTİ` | Süre aştı (kendiliğinden). |
| `İPTAL` | İptal (elle + denetim). |

### 8.7. Görev Alanları (Önerilen Şema)

```
Görev {
  kimlik: cuid
  projeKimliği: Metin?    // boş → bağımsız
  üstKimliği: Metin?      // boş → en üst düzey
  birimKimliği: Metin     // hangi birime ait
  oluşturanKimliği: Metin
  atananKimliği: Metin?
  görünürlük: Görünürlük   // ÖZEL | BİRİM
  başlık: Metin
  açıklama: Metin          // biçim/zengin metin
  durum: GörevDurumu
  öncelik: Öncelik         // DÜŞÜK | OLAĞAN | YÜKSEK | KRİTİK
  bitimTarihi: TarihSaat?
  başlangıçTarihi: TarihSaat?
  ilerleme: TamSayı (0-100) // uç değilse türetilmiş
  riskDüzeyi: RiskDüzeyi    // OLAĞAN | RİSKLİ | GECİKTİ
  kalıpKimliği: Metin?      // hangi kalıptan üretildi
  yinelenenKuralKimliği: Metin?
  oluşturulmaTarihi: TarihSaat
  güncellenmeTarihi: TarihSaat
  silinmeTarihi: TarihSaat?
  silenKimliği: Metin?
}
```

---

## 9. İLERLEME VE KENDİLİĞİNDEN ÇALIŞMA KURALLARI

### 9.1. Uç Düğüm Odaklı Hesaplama

- Bir üst görevin ilerlemesi, alt görevlerinin (uç düğümlerin) tamamlanma oranıdır.
- Bağıntı: `ilerleme = (tamamlanan_uç_sayısı / toplam_uç_sayısı) * 100`.
- "Tamamlandı" tanımı: `durum ∈ {ONAYLANDI, BİTTİ, KAPALI}`.

### 9.2. Proje İlerlemesi

- Projedeki **tüm uç düğüm** görevler dikkate alınır.
- Üst görevler hesaplamada **doğrudan** sayılmaz (yalnızca türetilmiş ilerlemeleri vardır).
- Bağımsız görevler proje hesaplamasında yer almaz.

### 9.3. Elle Proje Kapatma

- Tüm uç görevler `ONAYLANDI`/`BİTTİ` olduğunda durum kendiliğinden **değişmez**.
- Üst amire "Kapatılabilir Projeler" bildirimi gönderilir (Gelen Kutusu + Sonner Bildirim + seçimlik eposta).
- Üst amir elle olarak `KAPALI` durumuna alır.

### 9.4. Yeniden Hesaplama Tetikleyicileri

- `GÖREV_TAMAMLANDI` olayı → üst görev ilerlemesi yeniden hesaplanır → üstün üstü varsa proje ilerlemesi yeniden hesaplanır.
- `GÖREV_SİLİNDİ` (yumuşak) → yeniden hesapla (silinen görev hesaba katılmaz).
- `GÖREV_DURUMU_GERİ_ALINDI` (örn. ONAYLANDI'dan DÜZELTME'ye) → yeniden hesapla.

### 9.5. Veri Tutarlılığı

- Yeniden hesaplama **işlem güvenli** olmalıdır.
- İyimser arayüz: TanStack Query ile arayüzde hemen güncelle, sunucu onayı gelince doğrula.
- İlk tasarımda **eninde sonunda tutarlı** gösterge paneli sayaçları kabul edilebilir; gerçek zamanlı **WebSocket / Sunucu Gönderimli Olaylar** sonraki evreye bırakılabilir.

---

## 10. HİZMET SÜRESİ ANLAŞMASI VE RİSK YÖNETİMİ

### 10.1. Renk Kodları (S6)

| Renk | Anlam | Kural |
|---|---|---|
| 🟢 **OLAĞAN** | Yeterli süre var | `kalan_süre > 25% * toplam_süre` |
| 🟡 **RİSKLİ** | Süre azalıyor | `kalan_süre <= 25% * toplam_süre` ve `> 0` |
| 🔴 **GECİKTİ** | Süre doldu | `kalan_süre <= 0` |

> **S1 ile uyum:** "Sürenin dolmasına %25 kala uyarı" S1'de tanımlandı. S6 bunu görsel hizmet süresi sınıfına dönüştürdü.

### 10.2. Üst Makama Taşıma Akışı

1. Zamanlayıcı / planlı iş dakikada bir çalışır.
2. `bitim_tarihi < şimdi` ve `durum ∉ {ONAYLANDI, İPTAL}` görevler saptanır.
3. Durum `GECİKTİ` olarak imlenir.
4. `GÖREV_GECİKTİ` olayı yayımlanır.
5. Bildirim:
   - **Atanan personele** uygulama içi + anlık.
   - **Birim Müdürüne** uygulama içi + anlık.
   - Belirli eşiği aşan gecikmelerde **Kaymakam'a** raporlama (gösterge paneli bileşeni).

### 10.3. İş Yükü Çözümlemesi

S6'da gelen **öncül** denetim:
- Bir personele yeni görev atanırken dizge var olan **açık** ve **kritik** iş yükünü çözümler.
- Eşik aşılıyorsa atayıcıya uyarı: *"Bu personelin var olan iş yükü yüksek (5 kritik açık görev). Yine de atamak istiyor musunuz?"*
- Eşik politikası **ayarlanabilir** olmalı (örn. rol tabanlı, birim tabanlı).

---

## 11. ONAY DÜZENEĞİ (YAPAN-DOĞRULAYAN)

### 11.1. Akış (S1 → S6 boyunca tutarlı, S3'te Sonner bildirimi eklendi)

```
┌──────────────────────────────┐
│  PERSONEL: "Onaya Sun"       │
└─────────────┬────────────────┘
              ▼
   durum = ONAY_BEKLİYOR
   olay: GÖREV_ONAYA_SUNULDU
              ▼
   Sonner bildirimi (memura): "Onaya gönderildi"
   Uygulama içi + Anlık (müdüre): "Onay bekleyen yeni iş"
              ▼
   Müdür "Onay Bekleyenler" sekmesinde görür
              ▼
        ┌────────────────────────┐
        │  Karar                 │
        └─┬──────────────────┬───┘
          │                  │
       ONAYLA              REDDET
          │                  │
          ▼                  ▼
   durum = ONAYLANDI    durum = DÜZELTME
   görev arşive          gerekçe zorunlu
   denetim günlüğü      Memura bildirim
   + olay               denetim günlüğü + olay
```

### 11.2. Yapan-Doğrulayan İlkesi (S6'daki Açık Vurgu)

- Aynı kişi hem yapan hem doğrulayan olamaz.
- Memur kendi görevini onaylayamaz.
- Müdür kendi açtığı (kendisinin atanan olduğu) görevde **ek bir doğrulayan** ister → Kaymakam veya başka müdür.

### 11.3. Red Gerekçesi

- `red_gerekçesi: Metin` (zorunlu, en az N karakter).
- Kendiliğinden bir **Derkenar** olarak görev içine `UYARI` tipinde eklenmesi önerilir → kurum hafızası.

### 11.4. Onay Sonrası

- `durum = ONAYLANDI`.
- Görev "arşive alınır" — bunun anlamı: etkin listelerden çıkar; aramalarda görünür.
- Denetim günlüğü: `{"eylem": "ONAYLA", "yapan": ..., "görev_kimliği": ..., "zaman_damgası": ...}`.
- Üst görev ve proje ilerlemesi yeniden hesaplanır.

---

## 12. VEKÂLET MODÜLÜ

### 12.1. Amaç

İdarecilerin (Kaymakam, Birim Müdürleri) izinli/görevli olduğu zaman dilimlerinde dizgenin tıkanmaması.

### 12.2. Çalışma Biçimi

- Kullanıcı `[başlangıç, bitiş]` tarih aralığı için yetkilerini başka bir kullanıcıya devreder.
- Dizge **her etkili izin denetiminde** etkin vekâletleri denetler:
  - `etkin_izinler(kullanıcı) = kendi_izinler ∪ Σ(devredilen_izinler ki etkin)`
- Vekâleten yapılan işlemler **çift kayıt** ile saklanır:
  - Denetim günlüğü kaydı: `{ "eyleyen_kimliği": Y, "adına": X, "eylem": ..., "zaman_damgası": ... }`
  - Arayüzde görüntü: *"X adına Y tarafından yapılmıştır"*.

### 12.3. Veri Modeli (Önerilen)

```
Vekâlet {
  kimlik          Metin    @id @default(cuid())
  devredenKimliği Metin    // X (devreden)
  alanKimliği     Metin    // Y (alan)
  başlangıçTarihi TarihSaat
  bitişTarihi     TarihSaat
  kapsam          JSON?    // hangi izinler/birimler (seçimlik)
  gerekçe         Metin?
  durum           VekâletDurumu  // ETKİN, SÜRESİ_DOLDU, GERİ_ALINDI
  oluşturulmaTarihi TarihSaat @default(now())
  geriAlınmaTarihi TarihSaat?
  geriAlanKimliği  Metin?
}
```

### 12.4. Ek Senaryolar

- **Acil iptal:** Devreden kullanıcı vekâleti `bitiş_tarihi`nden önce sonlandırabilir (`durum = GERİ_ALINDI`).
- **Kendiliğinden bitiş:** `bitiş_tarihi` geldiğinde zamanlayıcı `SÜRESİ_DOLDU` yapar; `VEKÂLET_SÜRESİ_DOLDU` olayı.
- **Çakışma:** Aynı `devreden_kimliği` için etkin iki vekâlet olamaz (veritabanı kısıtı + hizmet denetimi).
- **Yetkinin yetkiye verilmesi:** Vekâleten alan kişi **kendi** vekâletini yapamaz (zincir devre dışı).

---

## 13. BİLDİRİM MERKEZİ VE GELEN KUTUSU

### 13.1. Tasarım Felsefesi (S6)

- **Gelen Kutusu** = "yapılması/görmesi gereken" süzgeçten geçmiş bildirimler. **Bildirim taşkını değil**, kullanıcı odaklı.
- Kullanıcı tercihleri (Bildirim Tercihleri) ile kanal yönetimi:
  - Uygulama içi (zorunlu öntanımlı).
  - Anlık (ilerlemeli web uygulaması anlık bildirimleri).
  - Eposta (kritik üst makama taşımalar için önerilir).

### 13.2. Bildirim Sınıfları

| Sınıf | Örnek |
|---|---|
| **Atama** | "Size yeni görev havale edildi." |
| **Onay** | "Onayınızı bekleyen 1 yeni görev var." |
| **Red** | "Görev düzeltmede: <gerekçe>." |
| **Üst Makama Taşıma** | "Görev gecikti: <görev adı>." |
| **Vekâlet** | "Bugünden başlayarak X adına yetkilisiniz." |
| **İzleyici** | "İzlediğiniz görevde yeni Derkenar." |
| **Dizge** | "Tamamlanan proje X kapatma onayı bekliyor." |

### 13.3. Bildirim Veri Modeli (Önerilen)

```
Bildirim {
  kimlik      Metin
  kullanıcıKimliği Metin
  tip         BildirimTipi
  başlık      Metin
  gövde       Metin
  bağlantı    Metin?     // ilgili sayfa
  yük         JSON?
  okunmaTarihi TarihSaat?
  oluşturulmaTarihi TarihSaat
}
```

### 13.4. Sonner Bildirim Tümleşimi (S3)

- Tüm anlık geri bildirim "X başarılı / Y hatası / Z uyarısı" Sonner ile.
- Kalıcı bildirimler Gelen Kutusu'nda tutulur; Sonner yalnızca anlık.

---

## 14. İZLEYİCİ SİSTEMİ

### 14.1. Tanım (S6)

- Bir kullanıcı, sorumlu olmadığı bir görevi **izlemeye alabilir** ("İzle" düğmesi).
- İzlenen görevde olan değişiklikler (durum, atanan, derkenar, dosya) izleyiciye bildirim olarak düşer.

### 14.2. Veri Modeli (Önerilen)

```
Görevİzleyicisi {
  görevKimliği    Metin
  kullanıcıKimliği Metin
  oluşturulmaTarihi TarihSaat
  @@id([görevKimliği, kullanıcıKimliği])
}
```

### 14.3. Bildirim Süzgeci

- İzleyici bildirimleri **özet** olarak gönderilir (her küçük yorumda taşkın yapma).
- Önerilen: yalnızca kritik olaylarda (durum değişimi, derkenar, dosya, gecikme) bildirim — yorum/küçük düzenlemelerde değil.

---

## 15. YİNELENEN GÖREVLER

### 15.1. Gereksinim (S6)

Rutin kamu görevleri:
- **Haftalık:** Pazartesi eşgüdüm toplantısı raporu.
- **Aylık:** Ay sonu denetim formu.
- **Yıllık:** Bayram töreni hazırlığı.

### 15.2. Veri Modeli

```
YinelenenKural {
  kimlik       Metin
  kalıpKimliği Metin?   // hangi kalıbı kullansın
  zamanlama    Metin    // CRON deyimi (veya yapılandırılmış zamanlama)
  sahipKimliği Metin    // hangi kullanıcı/birim adına oluşur
  birimKimliği Metin?
  başlangıçTarihi TarihSaat
  bitişTarihi  TarihSaat?
  etkin        Mantıksal
  sonÇalışma   TarihSaat?
  ...
}
```

### 15.3. Kalıp Bağlantısı

- Yinelenen kural, bir Görev Kalıbına (bkz. §18) başvuru verir.
- Tetiklendiğinde kalıptan yeni `Görev` örneği yaratır + ilgili kullanıcıya atar.

---

## 16. ATAMA KURALLARI

### 16.1. Tanım (S6 örtük)

> "*Belirli birimlere düşen işler için Atama Kuralları modülleri bulunur.*"

Anlamı: kuralın koşullarını sağlayan görevler **kendiliğinden** olarak hedef birime/personele atanır.

### 16.2. Örnek Kurallar

- *"Konu = `Beyaz Masa Şikâyeti` ise Yazı İşleri Birimi → Memur A."*
- *"Etiket = `Kırsal Hizmet` ise → Köylere Hizmet Birim Müdürü."*

### 16.3. Veri Modeli (Önerilen)

```
AtamaKuralı {
  kimlik       Metin
  ad           Metin
  koşullar     JSON     // etiket/sınıf/başlık örüntüsü/...
  hedef        JSON     // birimKimliği / kullanıcıKimliği / sıralı dağıtım kümesi
  öncelik      TamSayı  // birden fazla kural eşleşirse hangisi öncelikli
  etkin        Mantıksal
}
```

### 16.4. Çakışma & Geçersiz Kılma

- Birden fazla kural eşleşirse `öncelik` belirler.
- Elle atama her zaman kuralın üzerindedir (elle geçersiz kılma).

---

## 17. TOPLU İŞLEMLER

### 17.1. Kapsam (S6 / Ana)

TanStack Table'da çoklu satır seçimi → toplu eylem:
- Toplu atama (atanan değişikliği).
- Toplu durum değişikliği.
- Toplu etiket ekleme.
- Toplu silme (yumuşak silme).
- Toplu bitim tarihi güncelleme.

### 17.2. Kullanıcı Deneyimi Önerileri

- Seçilen sayı üst çubukta gösterilir.
- Eylem menüsü "bağlam çubuğu" biçiminde alt veya üstte sabit.
- Sonner bildirimi ile sonuç + **Geri Al** eylemi (5 sn).

### 17.3. Denetim

- Toplu işlem **tek bir** `toplu_işlem_kimliği` ile öbeklenir; tek tek denetim kayıtları bu kimlik ile bağlanır → "geri al" olanaklı.

---

## 18. GÖREV KALIPLARI

### 18.1. Tanım (S1)

Rutinleşmiş kamu görevleri için önceden tanımlı:
- Alt görev kümesi.
- Açıklamalar.
- Denetim listeleri.
- Öntanımlı atayan/atanan/etiketler/bitim tarihi öteleme.

### 18.2. Örnekler

- "Bayram Töreni Hazırlığı"
- "Haftalık Eşgüdüm Toplantısı"
- "Yıllık Denetim Raporu"

### 18.3. Veri Modeli

```
GörevKalıbı {
  kimlik          Metin
  ad              Metin
  açıklama        Metin
  sahipBirimKimliği Metin?
  öntanımlıÖncelik Öncelik
  öntanımlıBitimÖtelemeGün TamSayı
  altGörevTaslakları JSON   // [{başlık, açıklama, ...}]
  denetimListesi  JSON
  etiketler       Metin[]
  etkin           Mantıksal
  oluşturanKimliği Metin
  oluşturulmaTarihi TarihSaat
}
```

### 18.4. Kullanım

- Yeni görev oluşturma sihirbazında "Kalıptan başlat" seçeneği.
- Yinelenen kural içinden başvuru.

---

## 19. KURUMSAL HAFIZA: DERKENAR SİSTEMİ

S5'in en kritik kavramsal eklentisi.

### 19.1. Yorum ile Derkenar Ayrımı

| Boyut | **Yorum** | **Derkenar** |
|---|---|---|
| **Amaç** | Anlık iletişim, sohbet ("Dosyayı yükledim") | Kalıcı bağlamsal not, resmi açıklama, karar defteri |
| **Karakter** | Hızlı, geçici, akışkan | Sabitlenebilir, zengin metin, etiketli |
| **Düzenleme** | Yazıldığı gibi kalır (veya kısa pencere) | Sürümlü (anlık görüntü) düzenlenebilir |
| **Sabitleme** | Yok | Var (`sabitlendi`) |
| **Biçim** | Düz/biçimli | Zengin metin, çizelge, dosya gömme |
| **Aramada** | Dahil ama düşük öncelik | Ayrı sınıf (📝 DERKENARLAR) |
| **Karar Değeri** | Yok | Resmi (KARAR tipinde) |

### 19.2. Derkenar Tipleri (S5 + S6)

| Tip | Anlamı | Arayüz Renk/Simge (Önerilen) |
|---|---|---|
| **KARAR** | Toplantı/üst makam kararları | 🟦 Mavi |
| **UYARI** | Süreçle ilgili dikkat edilmesi gereken hususlar | 🟧 Turuncu |
| **ENGEL** | İlerlemeyi durduran iç/dış etkenler ("Belediye onayı bekleniyor") | 🟥 Kırmızı |
| **BİLGİ** | Genel bağlamsal açıklamalar | 🟩 Yeşil |
| **NOT** (S5 şemasında) | Genel not | ⬜ Yansız |

### 19.3. Veri Modeli (S5 şeması, korunmalı)

```prisma
model GörevDerkenarı {
  kimlik           Metin    @id @default(cuid())
  görevKimliği     Metin
  yazarKimliği     Metin
  başlık           Metin?
  içerik           Metin    // Zengin metin biçimi (HTML/Biçimli)
  tip              DerkenarTipi // KARAR, UYARI, ENGEL, BİLGİ, NOT
  sabitlendi       Mantıksal @default(false)
  oluşturulmaTarihi TarihSaat @default(now())
  güncellenmeTarihi TarihSaat @updatedAt
}
```

### 19.4. Sürümleme (S6)

- Her düzenleme bir **anlık görüntü** kaydı oluşturur (`görev_derkenar_sürümleri` çizelgesi).
- Erişilebilir: kim, ne zaman, ne yazdı, neyi neye değiştirdi.
- Anlık görüntü **değiştirilemez**.

### 19.5. ENGEL Derkenarı ile Durum Bağlantısı

- `ENGEL` tipinde bir derkenar açıldığında görev durumu kendiliğinden `ENGELLENDİ` yapılabilir (politika kararı).
- Engel kalktığında derkenar `çözüldü` imlenir → durum `SÜRÜYOR`'a döner.

### 19.6. Aramada Yer Alması

- Sınıflandırılmış aramada (Ctrl+K) ayrı sekme: 📝 DERKENARLAR.
- Görev içine girmeden doğrudan kurum hafızasında arama yapılabilir.

---

## 20. GENEL ARAMA MOTORU (Ctrl+K)

### 20.1. Felsefe

> **Çekirdek düzey:** kullanıcının yetki sınırları çerçevesinde **görebildiği TÜM verileri** (görev başlıkları, açıklamalar, yorumlar, derkenarlar, ekli dosyalar, kayıt girdileri) tarayabilen bir arama motoru.

### 20.2. Sınıflar

Sonuçlar **simgelerle** ayrıştırılır (S4 + S5):

- 📁 **PROJELER**
- ✅ **GÖREVLER**
- 📝 **DERKENARLAR**
- 📄 **DOSYALAR**

> Yorumlar seçimlik olarak ayrı sınıf veya görev sonuçlarına iç içe eklenebilir.

### 20.3. Uygulama Yaklaşımı

| Evre | Yaklaşım |
|---|---|
| **Evre 1 (Asgari Uygulanabilir Ürün)** | Ön yüz bulanık arama (Fuse.js, yerel dizin — yalnızca görünür/önbelleklenmiş veri için). |
| **Evre 2** | PostgreSQL Tam Metin Arama (`tsvector`, `tsquery`, GIN dizin). |
| **Evre 3** | Elasticsearch / Meilisearch (ölçek + yazım hatası toleransı + uygunluk ayarı). |

> S4'te söz edilen "*Arama mimarisi ön yüz bulanık arama ile başlayacak ancak hizmet düzeyinde arka uç tümleşimine hazır (soyutlanmış) tutulacaktır*" — soyutlama ile aşamalı geçiş güvence altına alınır.

### 20.4. Yetki Süzgeci (Kritik)

- Arama dizini kullanıcı yetkisinden bağımsız tutulur, ama **sorgu sonrası** rol tabanlı erişim süzgeci uygulanır.
- ÖZEL görevler dizinde olabilir ama yalnızca `oluşturan` veya `atanan` görür.
- Birim süzgeçleri birim kimliği tabanında uygulanır.
- Vekâlet etkin ise etkili izinler vekâlet kapsamına genişler.

### 20.5. Başarım

- Veritabanı düzeyinde dizinleme (S2: "milisaniyelik sonuçlar").
- Sorgu önbelleği (TanStack Query + sunucu yanıtı önbelleği).
- Sınıf başına `LIMIT 20` önerilir; "Tümünü gör" ile ayrıntı.

---

## 21. DENETİM GÜNLÜĞÜ (İŞLEM KAYITLARI)

### 21.1. Felsefe

Her veritabanı değişikliği yakalanır, **değiştirilemez** olarak saklanır.

### 21.2. Yakalama Noktası

- **Yeğleyerek** Prisma ara katmanı (S1).
- **Veya** veritabanı tetikleyicisi (S6'da seçenek olarak gösterildi).
- **Veya** her iki yöntemin bileşimi (uygulama düzeyi + veritabanı güvenlik ağı).

### 21.3. Şema (S1-S6 evrim)

```json
{
  "eylem": "GÜNCELLE",
  "model": "Görev",
  "kullanıcıKimliği": "kullanıcı_id_123",
  "fark": {
    "durum": { "eski": "SÜRÜYOR", "yeni": "GECİKTİ" }
  },
  "zamanDamgası": "2026-05-01T14:00:00Z"
}
```

S2/S6 ekleri:
- **`eski_değer`** ve **`yeni_değer`** ayrı alanlar (S2).
- **`eyleyen_kimliği`** + **`adına_kimliği`** (vekâlet için).
- **`ip`**, **`tarayıcı_imi`**, **`oturum_kimliği`** (adli inceleme için önerilir).
- **`toplu_işlem_kimliği`** (toplu işlem öbeği için).

### 21.4. Önerilen Çizelge

```
EtkinlikGünlüğü {
  kimlik          Metin    @id @default(cuid())
  eylem           Metin    // OLUŞTUR | GÜNCELLE | SİL | ONAYLA | REDDET | ...
  model           Metin    // Görev | Proje | GörevDerkenarı | ...
  varlıkKimliği   Metin
  eyleyenKimliği  Metin
  adınaKimliği    Metin?  // vekâlet
  eskiDeğer       JSON?
  yeniDeğer       JSON?
  fark            JSON?
  ip              Metin?
  tarayıcıİmi     Metin?
  oturumKimliği   Metin?
  topluİşlemKimliği Metin?
  zamanDamgası    TarihSaat @default(now())
}
```

### 21.5. Değiştirilemez Politika

- Veritabanı düzeyinde `GÜNCELLE`/`SİL` yetkileri **uygulama kullanıcısına verilmez** (yalnızca sahip yöneticisi).
- Yalnızca ekleme.
- Yedekleme: olağan veritabanı yedeklemesi yeterli; ek olarak **bir kez yaz, çok kez oku** (Write Once Read Many) deposu seçimlik.

### 21.6. Erişim Denetimi

- Denetim günlüğü **yalnızca YÖNETİCİ** + **denetim rolü** tarafından görüntülenebilir.
- Personel kendi yaptığı işlemleri görebilir (kişisel günlük); başkalarınınkini göremez.

---

## 22. ÇEKİRDEK HATA GÖZLEMCİSİ

### 22.1. Felsefe

> *"Kullanıcı nerede ne yaparken bu hatayı aldı?"* sorusuna yanıt veren düzenek (S2).

### 22.2. Kayıt Türleri

| Tür | Örnek | Kaynak |
|---|---|---|
| **Kritik Hatalar** | 500, dizge çökmesi | Yığın izi + istek kimliği. |
| **Doğrulama Uyarıları** | Form alanı yanlış doldurma | **Zod** hata iletileri (S3). |
| **Bağlam Verisi** | Sayfa yolu, tıklanan düğme, oturum | Arayüz tarafından gönderilir. |

### 22.3. Hedef

- **Kullanıcı deneyimi iyileştirmesi** (formun hangi alanı sürekli yanlış dolduruluyor?).
- **Geliştirici tarafı hata ayıklama**.
- **Güvenlik** (anormallik saptama — seçimlik ileri evre).

### 22.4. Uygulama Önerisi

- Ön yüz: window.onerror + React hata sınırı + getirici ara katman → POST /hatalar.
- Arka uç: Express/Next yol işleyicisi hata ara katmanı.
- Saklama: `hata_günlükleri` çizelgesi (denetim günlüğünden ayrı, çünkü duyarlılık ayrı).

### 22.5. Saklama Politikası

- Denetim gibi değiştirilemez olmasına gerek yok.
- N gün sonra arşivlenebilir (örn. 90 gün → soğuk depo).

---

## 23. KULLANICI DENEYİMİ VE YERLEŞİM

### 23.1. Yerleşim (S1-S6 boyunca tutarlı)

```
┌────────────────────────────────────────────────────────────────────┐
│ ÜST ÇUBUK: Genel Arama (Ctrl+K) [Hızlı Görev]  [Gelen Kutusu] [👤] │
├──────────┬─────────────────────────────────────────┬───────────────┤
│          │                                         │               │
│ KENAR    │           ANA ÇALIŞMA ALANI             │  SAĞ ÇEKMECE  │
│ ÇUBUĞU   │           (TanStack Table /             │  (Yandan)     │
│          │            Liste / Kanban)              │               │
│ Birim    │                                         │   - Ayrıntı   │
│ Tabanlı  │                                         │   - Yorumlar  │
│ Menü     │                                         │   - Derkenar  │
│          │                                         │   - Dosyalar  │
│ Kişisel  │                                         │   - Kayıtlar  │
│ İş       │                                         │               │
│ Listesi  │                                         │               │
│          │                                         │               │
└──────────┴─────────────────────────────────────────┴───────────────┘
```

### 23.2. Bileşen Ayrıntıları

| Bölge | İçerik |
|---|---|
| **Üst Çubuk** | Logo, Genel arama, Hızlı görev oluştur, Bildirimler (sayaç), Kullanıcı. |
| **Kenar Çubuğu** | Gösterge Paneli, Birimim, Bana Atananlar, Onay Bekleyenler (BİRİM_MÜDÜRÜ), Gecikmiş, Arşiv, Ayarlar. |
| **Ana Çalışma Alanı** | Liste/Çizelge görünümü; mobilde kart yığını. Süzgeçler, sıralama, toplu seçim. |
| **Sağ Çekmece** | Görev ayrıntısı **yandan açılır** (sayfa değişmez, bağlam korunur). Sekmeler: Ayrıntı / Yorumlar / Derkenarlar / Dosyalar / Kayıtlar. |

### 23.3. Kullanıcı Deneyimi İlkeleri

1. **Bağlamı bozma:** Görev tıklamasında URL değişebilir (derin bağlantı) ama kullanıcı **listeyi yitirmez** (çekmece kullanır).
2. **Önce klavye:** Ctrl+K arama, J/K dolaşma, E (düzenle), A (ata) gibi kısa yollar (gelecek evre).
3. **Her eylemde geri bildirim:** Sonner bildirimi ile (S3).
4. **Yükleme durumları:** İskelet yükleme (Shadcn).
5. **Boş durumlar:** Anlamlı boş durum (örn. "Henüz onay bekleyen iş yok 🎉").
6. **Hata durumları:** Hata sınırı + Çekirdek Hata Gözlemcisi'ne gönder + kullanıcıya sıcak ileti.
7. **Erişilebilirlik:** Shadcn (Radix tabanlı) → erişilebilirlik nitelikleri, klavye dolaşımı, ekran okuyucu uyumu.

### 23.4. Görev Listesi Görselleştirme

- TanStack Table satırlarında:
  - **İlerleme Çubuğu** (% değer ile).
  - **Hizmet Süresi Rozeti** (🟢 / 🟡 / 🔴).
  - **Atanan görsel(leri)**.
  - **Bitim tarihi** (göreceli zaman: "2 gün içinde").
  - **Etiket düğmeleri**.

### 23.5. Hızlı Görev Oluştur

- Üst çubukta genel düğmeden kalkık pencere açılır.
- Kalıptan başlat seçeneği.
- Doğrulama (Zod) hataları satır içi.
- Gönder → Bildirim + çekmeceye yönlendir.

---

## 24. ÖNCE MOBİL VE İLERLEMELİ WEB UYGULAMASI STRATEJİSİ

### 24.1. Önce Mobil İlkesi

- İlk tasarım her zaman mobil için yapılır.
- Masaüstü "fazla yer var, daha çok bilgi göster" yaklaşımı ile zenginleştirilir.
- Mobil → dikey kart yapısı; masaüstü → çizelge.

### 24.2. İlerlemeli Web Uygulaması Kapsamı (S1-S3, Ana)

| Özellik | Asgari | İleri Evre |
|---|---|---|
| Ana ekrana ekleme | ✓ | ✓ |
| Çevrimdışı önbelleklenmiş liste görüntüleme | ✓ | ✓ |
| Çevrimdışı yazma + eşitleme | — | ✓ (kuyruğa al, çevrim içi olunca gönder) |
| Anlık bildirim | — / seçimlik | ✓ |
| Yerel uygulama benzeri kullanıcı deneyimi | ✓ | ✓ |

### 24.3. Hizmet Çalışanı Yaklaşımı

- **Önce ağ** (taze veri öncelikli, çevrimdışıysa önbellek).
- Uç nokta çağrıları için **bayatken sun-yenile** uygun.
- Durağan varlıklar için **önce önbellek**.

### 24.4. Bildirim Dosyası

- Tema rengi, açılış ekranı, simge kümesi (192/512).
- `display: standalone`.
- Uygulama kimliği, ad, kısa ad net belirlenmeli.

---

## 25. DOSYA YÖNETİMİ VE DEPOLAMA SOYUTLAMASI

### 25.1. Soyutlama (S1)

```typescript
arayüz IDepolamaSağlayıcı {
  yükle(dosya: Tampon | Akış, anahtar: Metin, üstveri?: nesne): Söz<YüklemeSonucu>
  indir(anahtar: Metin): Söz<Tampon | Akış>
  sil(anahtar: Metin): Söz<boş>
  imzalıBağlantıAl(anahtar: Metin, sonErme?: sayı): Söz<Metin>
  varMı(anahtar: Metin): Söz<Mantıksal>
}
```

### 25.2. Sağlayıcılar

| Sağlayıcı | Kullanım Senaryosu |
|---|---|
| **YerelDosyaDizgesiSağlayıcı** | Geliştirme / küçük kurum / kurum içi. |
| **MinioSağlayıcı** | Kendiliğinden barındırılan S3 uyumlu — kurum içi. |
| **S3Sağlayıcı** | Ortak bulut (AWS S3 / DigitalOcean Spaces / Cloudflare R2). |

### 25.3. Yapılandırma

Ortam değişkenleri:
```
DEPOLAMA_SAĞLAYICI=yerel|minio|s3
DEPOLAMA_YEREL_YOL=./yüklemeler
DEPOLAMA_MINIO_UÇNOKTA=...
DEPOLAMA_MINIO_ERIŞIM_ANAHTARI=...
DEPOLAMA_S3_KOVA=...
DEPOLAMA_S3_BÖLGE=...
```

### 25.4. Dosya Politikaları

- En çok boyut (örn. 50 MB tek dosya, 200 MB bir görev üzerine toplam — politika).
- İzinli içerik tipleri (resmi belge biçimleri + büro dosyaları + resim + PDF).
- Kötücül yazılım taraması (önerilir, ileri evre).
- Görüntüleme: imzalı bağlantı (kısa son erme).

### 25.5. Proje Dosya Havuzu

- Görev tabanlı yüklenen dosyalar kendiliğinden proje havuzunda görünür (S4).
- Doğrudan proje düzeyinde de yüklenebilir.
- Gösterge panelinde: "Proje X — 47 dosya, 320 MB".

---

## 26. GÖSTERGE PANELİ VE GÖRSELLEŞTİRME

### 26.1. Rol Tabanlı Bileşenler (S6)

| Rol | Bileşen Kümeleri |
|---|---|
| **YÖNETİCİ (Kaymakam)** | Tüm birim ilerlemeleri, gecikmiş işler, üst makama taşıma raporları, kapatılabilir projeler, yüksek riskli personel iş yükü. |
| **BİRİM_MÜDÜRÜ** | Birim ilerlemesi, onay bekleyenler, takımım — açık işler, gecikmeler, izleyici özetleri. |
| **PERSONEL** | Bana atananlar, yaklaşan bitim tarihleri, düzeltmedeki işlerim, bildirimlerim. |

### 26.2. Görselleştirme Bileşenleri

- **İlerleme Çubuğu** (proje + üst görev) — ince, % değeriyle.
- **Hizmet Süresi Rozeti** (🟢🟡🔴).
- **Sayı Kartı** (sayısal: "12 açık görev").
- **Eğilim Grafiği** (haftalık tamamlama eğilimi — seçimlik).
- **Kanban / Liste / Çizelge** geçişi (kullanıcı tercihi).

### 26.3. TanStack Table Özellikleri

- Sunucu tarafı sayfalama.
- Sıralama, çoklu süzgeç.
- Çoklu seçim → toplu işlemler.
- Özel hücre çizici (ilerleme çubuğu, rozet, görsel).

---

## 27. VERİ MODELİ (Birleştirilmiş Şema)

> Aşağıdaki şema, S1-S6 boyunca dağınık olarak tanımlanan modellerin **birleştirilmiş** ve **önerilen** hâlidir. Ana ÜGB'deki tüm kavramları kapsar.

### 27.1. Çekirdek Modeller

```prisma
// Birim
model Birim {
  kimlik       Metin    @id @default(cuid())
  ad           Metin    @unique
  kod          Metin    @unique
  üstBirimKimliği Metin?
  etkin        Mantıksal @default(true)
  oluşturulmaTarihi TarihSaat @default(now())
}

// Kullanıcı
model Kullanıcı {
  kimlik       Metin    @id @default(cuid())
  eposta       Metin    @unique
  ad           Metin
  birimKimliği Metin
  rol          Rol      // YÖNETİCİ | BİRİM_MÜDÜRÜ | PERSONEL
  etkin        Mantıksal @default(true)
  oluşturulmaTarihi TarihSaat @default(now())
  // better-auth alanları ayrıca
}

// İzinler (ince taneli)
model İzin {
  kimlik    Metin @id @default(cuid())
  anahtar   Metin @unique  // örn. "görev.onayla"
  açıklama  Metin?
}

model Rolİzni {
  rol         Rol
  izinKimliği Metin
  @@id([rol, izinKimliği])
}

model Kullanıcıİznİstisnası {
  kullanıcıKimliği Metin
  izinKimliği      Metin
  verildi          Mantıksal   // doğru=ekstra ver, yanlış=rolden çıkar
  @@id([kullanıcıKimliği, izinKimliği])
}
```

### 27.2. Proje & Görev

```prisma
model Proje {
  kimlik       Metin    @id @default(cuid())
  ad           Metin
  açıklama     Metin?
  sahipBirimKimliği Metin
  durum        ProjeDurumu  // TASLAK | ETKİN | BEKLEMEDE | KAPATILMAYA_HAZIR | KAPALI
  oluşturanKimliği Metin
  oluşturulmaTarihi TarihSaat @default(now())
  kapatılmaTarihi TarihSaat?
  kapatanKimliği  Metin?
  silinmeTarihi   TarihSaat?
  silenKimliği    Metin?
}

model ProjeÜyesi {
  projeKimliği    Metin
  kullanıcıKimliği Metin
  projedekiRol    Metin   // SAHİP | ÜYE | GÖZLEMCİ
  oluşturulmaTarihi TarihSaat @default(now())
  @@id([projeKimliği, kullanıcıKimliği])
}

enum Görünürlük { ÖZEL BİRİM }

model Görev {
  kimlik       Metin    @id @default(cuid())
  projeKimliği Metin?   // boş = bağımsız
  üstKimliği   Metin?   // en çok 2 düzey → altın altı yasak
  birimKimliği Metin
  oluşturanKimliği Metin
  atananKimliği Metin?
  görünürlük   Görünürlük @default(BİRİM)
  başlık       Metin
  açıklama     Metin?
  durum        GörevDurumu
  öncelik      Öncelik    @default(OLAĞAN)
  bitimTarihi  TarihSaat?
  başlangıçTarihi TarihSaat?
  ilerleme     TamSayı    @default(0)
  riskDüzeyi   RiskDüzeyi @default(OLAĞAN)
  kalıpKimliği Metin?
  yinelenenKuralKimliği Metin?
  oluşturulmaTarihi TarihSaat @default(now())
  güncellenmeTarihi TarihSaat @updatedAt
  silinmeTarihi   TarihSaat?
  silenKimliği    Metin?
}

model GörevBağlılığı {
  görevKimliği         Metin
  bağlıOlduğuGörevKimliği Metin
  tip                  BağlılıkTipi @default(ENGELLER)
  oluşturulmaTarihi    TarihSaat @default(now())
  @@id([görevKimliği, bağlıOlduğuGörevKimliği])
}

enum GörevDurumu {
  YAPILACAK
  SÜRÜYOR
  ENGELLENDİ
  ONAY_BEKLİYOR
  ONAYLANDI
  DÜZELTME
  GECİKTİ
  İPTAL
}

enum Öncelik { DÜŞÜK OLAĞAN YÜKSEK KRİTİK }
enum RiskDüzeyi { OLAĞAN RİSKLİ GECİKTİ }
```

### 27.3. Yorum & Derkenar

```prisma
model Yorum {
  kimlik       Metin    @id @default(cuid())
  görevKimliği Metin
  yazarKimliği Metin
  içerik       Metin
  oluşturulmaTarihi TarihSaat @default(now())
  silinmeTarihi    TarihSaat?
}

enum DerkenarTipi { KARAR UYARI ENGEL BİLGİ NOT }

model GörevDerkenarı {
  kimlik           Metin    @id @default(cuid())
  görevKimliği     Metin
  yazarKimliği     Metin
  başlık           Metin?
  içerik           Metin    // Zengin metin (HTML/Biçimli)
  tip              DerkenarTipi
  sabitlendi       Mantıksal @default(false)
  oluşturulmaTarihi TarihSaat @default(now())
  güncellenmeTarihi TarihSaat @updatedAt
}

model GörevDerkenarSürümü {
  kimlik       Metin    @id @default(cuid())
  derkenarKimliği Metin
  anlıkGörüntü JSON     // tüm alan değerlerinin o anki hâli
  düzenleyenKimliği Metin
  düzenlemeTarihi TarihSaat @default(now())
}
```

### 27.4. İzleyici, Bildirim, Vekâlet

```prisma
model Görevİzleyicisi {
  görevKimliği    Metin
  kullanıcıKimliği Metin
  oluşturulmaTarihi TarihSaat @default(now())
  @@id([görevKimliği, kullanıcıKimliği])
}

model Bildirim {
  kimlik       Metin    @id @default(cuid())
  kullanıcıKimliği Metin
  tip          Metin
  başlık       Metin
  gövde        Metin?
  bağlantı     Metin?
  yük          JSON?
  okunmaTarihi TarihSaat?
  oluşturulmaTarihi TarihSaat @default(now())
}

model BildirimTercihi {
  kullanıcıKimliği Metin    @id
  uygulamaİçi      Mantıksal @default(true)
  anlık            Mantıksal @default(true)
  eposta           Mantıksal @default(false)
  // tip tabanlı geçersiz kılma için ayrıca çizelge eklenebilir
}

enum VekâletDurumu { ETKİN SÜRESİ_DOLDU GERİ_ALINDI }

model Vekâlet {
  kimlik           Metin    @id @default(cuid())
  devredenKimliği  Metin
  alanKimliği      Metin
  başlangıçTarihi  TarihSaat
  bitişTarihi      TarihSaat
  kapsam           JSON?
  gerekçe          Metin?
  durum            VekâletDurumu  @default(ETKİN)
  oluşturulmaTarihi TarihSaat @default(now())
  geriAlınmaTarihi TarihSaat?
  geriAlanKimliği  Metin?
}
```

### 27.5. Yinelenen Görev, Kalıp, Atama Kuralı

```prisma
model GörevKalıbı {
  kimlik          Metin    @id @default(cuid())
  ad              Metin
  açıklama        Metin?
  sahipBirimKimliği Metin?
  öntanımlıÖncelik Öncelik @default(OLAĞAN)
  öntanımlıBitimÖtelemeGün TamSayı?
  altGörevTaslakları JSON?
  denetimListesi  JSON?
  etiketler       Metin[]
  etkin           Mantıksal @default(true)
  oluşturanKimliği Metin
  oluşturulmaTarihi TarihSaat @default(now())
}

model YinelenenKural {
  kimlik       Metin    @id @default(cuid())
  kalıpKimliği Metin?
  zamanlama    Metin
  sahipKimliği Metin?
  birimKimliği Metin?
  başlangıçTarihi TarihSaat
  bitişTarihi  TarihSaat?
  etkin        Mantıksal @default(true)
  sonÇalışma   TarihSaat?
  oluşturulmaTarihi TarihSaat @default(now())
}

model AtamaKuralı {
  kimlik       Metin    @id @default(cuid())
  ad           Metin
  koşullar     JSON     // etiket, sınıf, örüntü, vs.
  hedef        JSON     // birimKimliği / kullanıcıKimliği / sıralı dağıtım kümesi
  öncelik      TamSayı  @default(0)
  etkin        Mantıksal @default(true)
  oluşturulmaTarihi TarihSaat @default(now())
}
```

### 27.6. Denetim & Hata

```prisma
model EtkinlikGünlüğü {
  kimlik          Metin    @id @default(cuid())
  eylem           Metin
  model           Metin
  varlıkKimliği   Metin
  eyleyenKimliği  Metin
  adınaKimliği    Metin?
  eskiDeğer       JSON?
  yeniDeğer       JSON?
  fark            JSON?
  ip              Metin?
  tarayıcıİmi     Metin?
  oturumKimliği   Metin?
  topluİşlemKimliği Metin?
  zamanDamgası    TarihSaat @default(now())
  // yalnızca ekleme — veritabanı kullanıcısına GÜNCELLE/SİL yetkisi verilmez
}

model HataGünlüğü {
  kimlik       Metin    @id @default(cuid())
  düzey        Metin    // KRİTİK | UYARI | DOĞRULAMA
  ileti        Metin
  yığın        Metin?
  kullanıcıKimliği Metin?
  url          Metin?
  eylem        Metin?  // tıklanan düğme / eylem
  yük          JSON?
  oturumKimliği Metin?
  oluşturulmaTarihi TarihSaat @default(now())
}
```

### 27.7. Dosya

```prisma
model DosyaEki {
  kimlik       Metin    @id @default(cuid())
  görevKimliği Metin?
  projeKimliği Metin?
  yükleyenKimliği Metin
  dosyaAdı     Metin
  depolamaAnahtarı Metin   // sağlayıcıda nesne anahtarı
  boyut        TamSayı     // bayt
  içerikTipi   Metin
  oluşturulmaTarihi TarihSaat @default(now())
  silinmeTarihi    TarihSaat?
  silenKimliği     Metin?
}
```

### 27.8. Etiket — Önerilen

```prisma
model Etiket {
  kimlik    Metin   @id @default(cuid())
  ad        Metin   @unique
  renk      Metin?
}

model GörevEtiketi {
  görevKimliği Metin
  etiketKimliği Metin
  @@id([görevKimliği, etiketKimliği])
}
```

---

## 28. KARARLAR VE GEREKÇELERİ (KARAR GÜNLÜĞÜ)

### 28.1. Mimari Kararlar

| # | Karar | Gerekçe | Kaynak |
|---|---|---|---|
| **K-001** | **Sabit aşama (Birim/Makam)** modeli, devingen takım yerine. | Kamu kurumu yapısının ayna karşılığı; "takım kurma/dağıtma" karmaşası yok. | S1 §1 |
| **K-002** | Rol tabanlı yetkilendirme, **3 ana rol**. | Net ve anlaşılır aşama; izinler ile incelik (S6). | S1 §2 + S6 §2.3 |
| **K-003** | **Ast-Üst İlişkisi ≠ Bağlılık.** | İş parçalama ile sıralamayı karıştırmamak; arayüz ve veri modelinde sadelik. | S4 §3 |
| **K-004** | **En çok 2 düzey ast-üst.** | Ağaç içinde kaybolmayı önlemek; uygulamada kamu görevlerinin parçalanma derinliği. | S4 §3.1 |
| **K-005** | **Uç düğüm odaklı ilerleme.** | Üst görevin elle ilerleme girilmesi yanıltıcı; alttakilerden türetmek tutarlı. | S4 §4 |
| **K-006** | **Elle proje kapatma.** | Kamu yönetiminde resmi "kapatma kararı" zorunlu; kendiliğinden kapatma yetkisiz. | S4 §4 |
| **K-007** | **ÖZEL / BİRİM görünürlük.** | Duyarlı görevler + takım içi saydamlık dengesi. | S4 §2 |
| **K-008** | **Yorum ≠ Derkenar.** | Sohbet ile kurum kararı/uyarı/engelin karıştırılması kurumsal hafızayı yok ediyor. | S5 §2 |
| **K-009** | **Derkenar sınıfları:** KARAR/UYARI/ENGEL/BİLGİ/NOT. | Bağlamsal bilginin sınıflandırılması, aramada süzgeç. | S5 §2.1 |
| **K-010** | **Önce Arayüz + Olay Güdümlü.** | Kayıt tutma/bildirim/yapay zekâ/web kanca gibi yan kaygıları ana iş kodundan ayırmak. | S6 §2 (vizyon) |
| **K-011** | **Değiştirilemez Denetim Günlüğü.** | Yasal/idari denetim gereksinimi; veri bütünlüğü. | S6 §2.1 |
| **K-012** | **Yumuşak Silme + Arşivleme** (sert silme yasak). | Geri alınabilirlik; denetim izi. | S6 §2.2 |
| **K-013** | **Vekâlet "X adına Y" kayıtlama.** | Sorumluluğun açıkça belirtilmesi. | S1 §3.1 + S6 §6 |
| **K-014** | **Yapan-Doğrulayan (memur-müdür) onay.** | Kamu yönetiminde ölçünlü denetim düzeneği. | S1 §6 + S6 §6 |
| **K-015** | **Önce Mobil + İlerlemeli Web Uygulaması.** | Saha kullanımı, uygulama mağazası sürtünmesi yok, çevrimdışı temel destek. | S1 §1, S2 §5 |
| **K-016** | **Depolama Soyutlaması.** | Dağıtım esnekliği (yerel → kurum içi MinIO → bulut S3). | S1 §1 |
| **K-017** | **Sınıflandırılmış Genel Arama.** | Çekirdek arama: kullanıcı yetkisi içinde her şey aranabilir, sınıflandırılmış gösterilir. | S2 §3.1, S4 §5.2, S5 §4 |
| **K-018** | **Ön yüz bulanık → veritabanı tam metin → Elasticsearch** aşamalı geçiş. | Asgari uygulanabilir ürün hızlandırma; soyutlama ile sonradan değişim ucuz. | S4 §5.2 |
| **K-019** | **better-auth** seçimi. | Çağdaş, tip öncelikli, eklenti mimarisi. | S3 §1 |
| **K-020** | **TanStack Query** seçimi. | Sunucu durumunu arayüz durumundan ayırma; önbellek geçersizleştirme kendiliğinden. | S3 §1 |
| **K-021** | **React Hook Form + Zod** seçimi. | Tek şema → form, uç nokta, TypeScript tipi türetimi. | S3 §1 |
| **K-022** | **TanStack Table** seçimi. | Görselsiz, sayfalama/sıralama/süzme, özel hücre. | S3 §1 |
| **K-023** | **Sonner Bildirim** seçimi. | Çağdaş, erişilebilir, hafif. | S3 §1 |
| **K-024** | **Shadcn UI** ölçünü. | Erişilebilir (Radix), kopyala-yapıştır kod sahipliği. | S2 §1 |
| **K-025** | **Hizmet süresi renkleri (🟢🟡🔴).** | Görsel olarak risk anlaşılabilir; üst makama taşıma tetikleyici. | S6 §3.1 |
| **K-026** | **İzleyici** sistemi. | Sorumlu olmayan ama izlemesi gereken kullanıcılar için. | S6 §3.2 |
| **K-027** | **Gelen Kutusu** merkezi bildirim. | Bildirim taşkını yerine derli toplu kullanıcı odaklı bildirim deneyimi. | S6 §3.2 |
| **K-028** | **Birim aşan projeler.** | Birim sınırlarını aşan işler için. | S4 §1 |
| **K-029** | **Proje Dosya Havuzu.** | Dağılan dosyaların tek noktada birleştirilmesi. | S4 §1 |
| **K-030** | **Bağımsız görev (proje kimliği BOŞ).** | Her görevin proje altında olma zorunluluğu yok. | S4 §2 |
| **K-031** | **Yinelenen Görevler.** | Rutin kamu işlerini elle oluşturma yükünü kaldırır. | S6 §6 |
| **K-032** | **Atama Kuralları.** | Belirli sınıflar kendiliğinden birime/kişiye düşer. | S6 §6 |
| **K-033** | **Toplu İşlemler.** | Yöneticinin verimliliği için kritik. | S6 §5 |
| **K-034** | **İş yükü uyarısı.** | Personel aşırı yüklenmesin, üst yönetim risk alarak değil bilinçli atasın. | S6 §5 |
| **K-035** | **Yandan açılır çekmece** ayrıntı görünümü. | Bağlamı bozmadan ayrıntı; kullanıcı listede kalır. | S1 §5 |

### 28.2. Politika Kararları

| # | Politika |
|---|---|
| **P-001** | Süre dolmasına %25 kala kendiliğinden uyarı bildirimi (S1). |
| **P-002** | Süre dolduğunda görev kendiliğinden `GECİKTİ` (S1 + S6 hizmet süresi). |
| **P-003** | Reddedilen görev `DÜZELTME` durumuna döner ve gerekçe zorunludur (S1). |
| **P-004** | Vekâlet etkin ise etkili izin = kendi izinler ∪ devredilen izinler. |
| **P-005** | Vekâleten alan kişi alt-vekâlet veremez. |
| **P-006** | ÖZEL görev müdür dahil hiç kimseye gözükmez (yalnızca oluşturan + atanan). |
| **P-007** | Tüm uç görevler bittiğinde proje **kendiliğinden kapanmaz**; üst amire bildirim gider. |
| **P-008** | Denetim günlüğü silinemez/değiştirilemez (veritabanı düzeyi). |
| **P-009** | Sert silme yasak; tüm silmeler `silinme_tarihi` + `silen_kişi`. |
| **P-010** | Yapan-Doğrulayan: aynı kişi hem yapan hem doğrulayan olamaz. |
| **P-011** | Toplu işlem tek `toplu_işlem_kimliği` ile öbeklenir → toplu geri al. |

---

## 29. SÜRÜMLER ARASI SAPMA / ÇELİŞKİ ÇÖZÜMLEMESİ

> Bu bölüm, S1-S6 arasındaki ufak terim ve odak ayrımlarını **saydam biçimde** kayda geçirir; Ana ÜGB'de bunlar birleştirilmiştir.

### 29.1. Terim Sapmaları

| Konu | S1-S5 Terimi | S6 Terimi | Ana |
|---|---|---|---|
| Üst Yönetici | "Kaymakam / Özel Kalem" | "YÖNETİCİ" | Hem hem (insan rolü = Kaymakam, dizge rolü = YÖNETİCİ). |
| Birim Müdürü | "Birim Müdürü" | "BİRİM_MÜDÜRÜ" | Aynı. |
| Memur | "Birim Personeli (Memur)" | "PERSONEL" | Aynı. |
| Görev durumu | "ONAY_BEKLİYOR", "DÜZELTME" | Aynı + GECİKTİ | Aynı. |
| Süre dolmuş görev | "Gecikmiş" | "GECİKTİ" + 🔴 | Aynı. |

### 29.2. Odak Sapmaları

| Konu | S1-S3 | S4-S5 | S6 / Ana |
|---|---|---|---|
| Depolama soyutlaması | Açıkça yazıldı | Söz edilmedi | Ana'da geri yazıldı |
| İlerlemeli Web Uygulaması | Açıkça yazıldı | Söz edilmedi | Ana'da geri yazıldı |
| Önce mobil | Açıkça yazıldı | Söz edilmedi | Ana'da geri yazıldı |
| Görev kalıpları | S1-S3'te ayrıntılı | S4-S6'da söz edilmedi | Ana'da örtük |
| Çekirdek Hata Gözlemcisi | S1-S3'te ayrıntılı | S4-S6'da söz edilmedi | Ana'da söz edilmiyor (örtük varsayılır) |

> **Sonuç:** S4-S5 belirli konulara (proje/görev mimarisi, derkenar) odaklandığı için bazı S1-S3 başlıklarını **es geçmiştir**, kaldırmamıştır. Ana ÜGB bu anlamı koruyup birleştirir. **Bu birleştirilmiş belge bunu açıkça not eder.**

### 29.3. Çelişki Yok (Yapısal)

- S1'den S6'ya kadar **mimari iskelet** (Birim/Makam, Yapan-Doğrulayan, Denetim Günlüğü, Vekâlet, Önce Mobil) **tutarlı** kalmıştır.
- Hiçbir sürümde önceki bir kararın **iptali/değişimi** yoktur — yalnızca eklemeler ve ayrıntılandırmalar.
- Bu, ÜGB setinin **birikimli** ve **uyumsuzluk içermez** yapıda evrildiğini gösterir.

### 29.4. Netleştirilmesi Gereken Noktalar

| Konu | Sorun |
|---|---|
| `ONAYLANDI` vs `BİTTİ` vs `KAPALI` | S1 "kapatılır, arşive alınır" diyor. Durum adı netleştirilmeli. |
| Proje görünürlüğü | Görev için ÖZEL/BİRİM var ama proje düzeyinde görünürlük yok. |
| Memurun proje başlatma yetkisi | S4 "Kaymakam ve Müdürler" diyor ama PERSONEL'e izin var mı, yok mu? |
| Birim aşan üye eklemek | Diğer birim müdürünün onayı gerekli mi? |
| ENGEL derkenar → ENGELLENDİ durumu | Kendiliğinden bağlantı önerildi (bu belge) ama ÜGB'de net değil. |
| "İzleyici" + ÖZEL | ÖZEL göreve izleyici eklenebilir mi? (öntanımlı: hayır.) |
| Denetim günlüğü saklama süresi | Süresiz mi, mevzuata göre N yıl mı? |
| Dosya boyut/biçim sınırı | Politika net değil. |
| Bildirim eposta kanalı | S6 izleyici/Gelen Kutusu'nda belirtildi ama sağlayıcı (SES, Mailgun, SMTP) seçimi yok. |

---

## 30. BOŞLUKLAR, AÇIK SORULAR VE ÖNERİLER

### 30.1. Eksik Konular

1. **Kimlik doğrulama ayrıntısı:** better-auth seçildi ama iki adımlı doğrulama, tekli oturum (e-Devlet tümleşimi?), parola politikası, oturum zaman aşımı net değil.
2. **e-Devlet tümleşimi:** Mülki idare için kritik olabilir; ÜGB'de yok.
3. **DEAS / Elektronik Belge Yönetim Sistemi tümleşimi:** Resmi yazışma dizgeleri ile köprü?
4. **Raporlama / Dışa aktarma:** Excel/PDF dışa aktarma, dönemsel kurum raporu?
5. **Bayram/Hafta sonu/Resmi tatil takvimi:** Bitim tarihi hesabında tatiller dikkate alınacak mı?
6. **Çoklu dil desteği:** Türkçe-İngilizce? (Şu an Türkçe odaklı.)
7. **Tema (Karanlık/Aydınlık/Dizge):** Arayüz tercihi.
8. **Erişim kayıtları (Giriş/Çıkış):** Denetim günlüğü içinde mi, ayrı mı?
9. **Yedekleme & Felaket Kurtarma:** Kurtarma noktası hedefi/Kurtarma süresi hedefi sayıları.
10. **Başarım hedefleri:** Hizmet süresi anlaşması (örn. yüzde 95 < 500ms), eşzamanlı kullanıcı sayısı.
11. **Tahmin (kestirim) ve harcanan süre takibi:** Görev üzerinde bir alan olacak mı?
12. **Etiket yönetimi:** Yönetici tarafından mı tanımlanır, kullanıcı serbest mi?
13. **Takvim görünümü:** Görevlerin Gantt veya takvim üzerinde gösterimi?
14. **Sınama yaklaşımı:** Birim / Tümleşim / Uçtan Uca (Playwright?) — ÜGB'de yok.
15. **Sürekli Tümleşim/Sürekli Dağıtım:** Yayın yaklaşımı (kesintisiz denildi ama nasıl?).
16. **İzleme & Gözlemlenebilirlik:** Uygulama izleme (Sentry?), veritabanı izleme.
17. **Genel Veri Koruma Yönetmeliği / Kişisel Verilerin Korunması Kanunu:** Kişisel veri politikası, kullanıcı verilerinin silme isteği.
18. **Kullanıcı çağrı/oluşturma akışı:** Kendiliğinden kayıt yok mu, yalnızca yönetici mi oluşturuyor?
19. **Kullanıcı sayfası:** Kullanıcı kendi tercihlerini, bildirimlerini buradan mı yönetir?
20. **Yardım & Aşinalaşma:** Yeni kullanıcı için tur, ipucu, belge.

### 30.2. Açık Sorular (Karar Gerektiren)

| # | Soru | Önerilen Yanıt |
|---|---|---|
| S1 | PERSONEL bağımsız görev oluşturabilir mi? | **Evet**, kendi atadığı ÖZEL görev için. BİRİM görevi müdür onayı ister. |
| S2 | Proje görünürlüğü kavramı eklenecek mi? | **Evet**, BİRİMLERE_AÇIK / PROJEYE_ÖZEL olarak ayrılabilir. |
| S3 | Birim aşan üye eklemede dış birim müdürü onayı gerekli mi? | **Önerilen evet** — 2 adımlı onay. |
| S4 | ENGEL derkenar kendiliğinden `durum = ENGELLENDİ` yapsın mı? | **Önerilen evet**, seçimlik kapatma ile. |
| S5 | Denetim günlüğü saklama süresi? | **Önerilen 10 yıl** (kamu denetimi). |
| S6 | Eposta bildirim sağlayıcısı? | **SMTP başla**, sonra gereksinime göre Mailgun/SES. |
| S7 | Tatil takvimi tümleşimi? | **Evet**, resmi tatiller bitim tarihi hesabında dikkate alınmalı. |
| S8 | Süre takibi? | **Asgari uygulanabilir üründe yok**, ileri evre. |
| S9 | Karanlık tema? | **Asgari uygulanabilir üründe Shadcn üzerinden ücretsiz gelir, ayar verilebilir.** |
| S10 | Ortak uç nokta (3. taraf erişimi)? | **Şimdilik yok**, ileride olaylar web kanca olarak dışa açılabilir. |

### 30.3. Önerilen Yol Haritası (Yüksek Düzeyde)

#### Evre 0 — Hazırlık (1-2 hafta)
- Kurum onayları, barındırma (kurum içi vs bulut), veritabanı altyapısı, Sürekli Tümleşim/Dağıtım kurulumu, depo & dal yaklaşımı.

#### Evre 1 — Asgari Uygulanabilir Ürün (4-6 hafta)
- better-auth + 3 rol (YÖNETİCİ, BİRİM_MÜDÜRÜ, PERSONEL).
- Birim/Kullanıcı ekle-düzenle-sil.
- Proje ekle-düzenle-sil + üyelik.
- Görev ekle-düzenle-sil + atama + durum değişimi.
- Onay düzeneği (ONAY_BEKLİYOR, ONAYLANDI, DÜZELTME).
- Denetim günlüğü (Prisma ara katmanı).
- Yumuşak silme altyapısı.
- Ön yüz Shadcn UI + TanStack ekosistemi.
- Sonner bildirimi.
- Mobil uyumlu.
- Yerel depolama sağlayıcısı.

#### Evre 2 — Çekirdek Genişleme (3-4 hafta)
- Vekâlet modülü.
- Üst makama taşıma (zamanlayıcı + GECİKTİ + bildirim).
- Hizmet süresi renkleri.
- Sınıflandırılmış genel arama (veritabanı tam metin arama).
- Sağ Çekmece ayrıntı.
- Bildirim Gelen Kutusu + anlık (ilerlemeli web uygulaması).
- Görünürlük (ÖZEL/BİRİM).
- Ast-üst (en çok 2 düzey).
- Bağlılık (görev_bağlılıkları + döngü koruması).

#### Evre 3 — Kurumsal Hafıza & Kendiliğinden Çalışma (3-4 hafta)
- Yorum sistemi.
- Derkenar sistemi + tipler + sabitleme + sürüm.
- Görev kalıpları.
- Yinelenen görevler.
- Atama kuralları.
- Toplu işlemler.
- İzleyici.

#### Evre 4 — İleri Yetenekler (3-4 hafta)
- İş yükü uyarısı.
- Elle proje kapatma akışı.
- Proje dosya havuzu.
- Depolama MinIO / S3 sağlayıcısı.
- Gösterge paneli bileşenleri (rol tabanlı).
- Çekirdek Hata Gözlemcisi (ön yüz hata toplayıcı + gösterge paneli).
- İnce taneli izinler (geçersiz kılma).
- İlerlemeli web uygulaması anlık bildirimleri.

#### Evre 5 — Üretim Sertleştirme (2-3 hafta)
- Başarım ayarı, yüzde 95 hizmet süresi anlaşması hedefleri.
- Yedekleme + Felaket Kurtarma.
- İzleme + gözlemlenebilirlik (Sentry/Prometheus/Grafana).
- Denetim/sızma sınaması.
- Kullanıcı kabul sınamaları — kaymakamlık öncül kullanıcılar.
- Belge (kullanıcı + yönetici + geliştirici).

#### Evre 6 — Genişleme (Sonraki sürümler)
- e-Devlet/Elektronik Belge Yönetim Sistemi/Doküman Yönetim Sistemi tümleşimi.
- Web Kanca / Ortak Uç Nokta.
- Yapay zekâ asistanı (Derkenar özetleme, görev önerme).
- Elasticsearch geçişi.
- Süre takibi.
- Gantt görünümü.

---

## 31. SÖZLÜK

| Terim | Açıklama |
|---|---|
| **Birim** | Kaymakamlık altındaki kuruluş birimleri (örn. Yazı İşleri, Mal Müdürlüğü). |
| **Makam** | Aşamanın tepesindeki rol (Kaymakam, Özel Kalem). |
| **Vekâlet** | Bir kullanıcının yetkilerinin belirli süre için başka bir kullanıcıya devri. |
| **Üst Makama Taşıma** | Süre aşımı veya başka bir sorun nedeniyle sorunun üst makama kendiliğinden raporlanması. |
| **Yapan-Doğrulayan** | "Yapan" (memur) ile "doğrulayan" (müdür) ayrımı; aynı kişi olamaz. |
| **Görev** | Atanan, yapılan ve takip edilen iş kalemi. |
| **Alt Görev** | Bir görevin parçası olan alt öğe. |
| **Bağımsız Görev** | Hiçbir projeye bağlı olmayan görev (`proje_kimliği = BOŞ`). |
| **Ast-Üst İlişkisi** | İş parçalama yapısı (üst → alt); en çok 2 düzey. |
| **Bağlılık** | "A bitmeden B başlayamaz" türü sıralama ilişkisi. |
| **Uç Düğüm** | Aşamanın en alt ucundaki alt öğesi olmayan görev. |
| **ÖZEL Görev** | Yalnızca oluşturan + atananın görebildiği görev. |
| **BİRİM Görevi** | Birim müdürü + birim yetkili personellerinin görebildiği görev. |
| **Yorum** | Geçici, zaman dizinli sohbet akışı iletisi. |
| **Derkenar** | Kalıcı, bağlamsal, etiketli (KARAR/UYARI/ENGEL/BİLGİ/NOT), sabitlenebilir, sürümlü kurumsal not. |
| **Gelen Kutusu** | Kullanıcıya özel toplanmış bildirim merkezi. |
| **İzleyici** | Kendisine atanmamış görevi izleyen kullanıcı. |
| **Hizmet Süresi Anlaşması** | Bitim tarihine göre 🟢/🟡/🔴 renk kodu. |
| **Yinelenen Görev** | Zamanlama tabanlı yeniden oluşturulan görev. |
| **Atama Kuralı** | Koşul tabanlı kendiliğinden atama kuralı. |
| **Toplu İşlem** | Çoklu seçim ile toplu eylem (atama, silme, etiket vb.). |
| **Denetim Günlüğü** | Değiştirilemez, yalnızca eklemeli dizge hareket günlüğü. |
| **Yumuşak Silme** | `silinme_tarihi` ile imleme; fiziksel silme yok. |
| **Depolama Sağlayıcısı** | Yerel / MinIO / S3 üzerinde dosya saklama soyutlaması. |
| **İlerlemeli Web Uygulaması** | Yüklenebilir, çevrimdışı yetenekli web uygulaması (Progressive Web App). |
| **Yandan Açılır Çekmece** | Sağdan açılan, sayfayı yenilemeyen ayrıntı paneli. |
| **Çekirdek Hata Gözlemcisi** | Ön yüz/arka uç hata + doğrulama uyarı toplayıcısı. |
| **Sınıflandırılmış Arama** | Sonuçların 📁 Projeler, ✅ Görevler, 📝 Derkenarlar, 📄 Dosyalar olarak ayrılması. |
| **Yapan-Doğrulayan İlkesi** | Bir eylem iki ayrı kişi tarafından (yapan + doğrulayan) yapılır. |
| **Birim Aşan Proje** | Birden fazla birime üye olan proje. |
| **Proje Dosya Havuzu** | Bir projedeki tüm görevlerin dosyalarının birleştirilmiş görüntüsü. |
| **Elle Proje Kapatma** | Kendiliğinden değil, üst amir onayı ile yapılan kapatma. |
| **Anlık Görüntü (Sürümleme)** | Bir derkenarın düzenleme öncesi durumunun saklanması. |
| **İnce Taneli İzin** | Rol üstü, izin anahtarı tabanlı yetkilendirme (örn. `görev.onayla`). |

---

## EK A — KAPSAM ÖZET ÇİZELGESİ (Hızlı Başvuru)

| Alan | Kapsam |
|---|---|
| **Ön Yüz** | Next.js App Router, React, Tailwind, Shadcn UI, TanStack Query/Table, React Hook Form + Zod, Sonner, better-auth, İlerlemeli Web Uygulaması. |
| **Arka Uç** | **Bun** (Node.js uyumlu çalıştırıcı + paket yöneticisi), Prisma, PostgreSQL, Önce Arayüz REST uç noktaları, Olay Güdümlü. |
| **Kimlik Doğrulama** | better-auth (oturum, seçimlik iki adımlı/tekli oturum ileri evre). |
| **Depolama** | Soyutlanmış (Yerel/MinIO/S3). |
| **Roller** | YÖNETİCİ, BİRİM_MÜDÜRÜ, PERSONEL + ince taneli izinler. |
| **Aşama** | Birim/Makam sabit; görevde en çok 2 düzey üst/alt. |
| **Bağlılık** | görev_bağlılıkları (çoktan çoğa, yönlü döngüsüz çizge, döngü koruması). |
| **Görünürlük** | ÖZEL / BİRİM. |
| **İlerleme** | Uç düğüm odaklı, kendiliğinden yeniden hesaplama. |
| **Hizmet Süresi** | 🟢 Olağan, 🟡 Riskli, 🔴 Gecikti + %25 erken uyarı. |
| **Onay** | Yapan-Doğrulayan (memur → müdür); reddetme gerekçeli + DÜZELTME. |
| **Vekâlet** | Tarih aralığı + kapsam; "X adına Y" kayıt. |
| **Yorum vs Derkenar** | Geçici sohbet vs kalıcı kurum hafızası (KARAR/UYARI/ENGEL/BİLGİ/NOT). |
| **Bildirim** | Gelen Kutusu merkezi + Sonner bildirimi + seçimlik anlık/eposta. |
| **İzleyici** | Sorumluluk dışı izleme. |
| **Kendiliğinden Çalışma** | Üst makama taşıma (zamanlayıcı), Yinelenen Görevler, Atama Kuralları. |
| **Toplu İşlem** | Toplu atama/silme/etiket + toplu_işlem_kimliği ile geri al. |
| **Kalıp** | Görev kalıpları (alt görev/denetim listesi/öntanım). |
| **Arama** | Sınıflandırılmış (Ctrl+K), soyutlanmış (Ön yüz → veritabanı tam metin → Elasticsearch). |
| **Denetim** | Değiştirilemez, yalnızca ekleme, JSON fark (eski/yeni). |
| **Yumuşak Silme** | Tüm etki alanı varlıkları için. |
| **Mobil** | Önce mobil uyumlu + İlerlemeli Web Uygulaması (çevrimdışı önbellekli okuma). |
| **Dosya** | Görev + Proje + Proje Havuzu; soyutlanmış depolama. |
| **Gösterge Paneli** | Rol tabanlı bileşenler (Gecikenler, Bana Atananlar, Birim İlerlemesi, Kapatılabilirler). |
| **Yerleşim** | Kenar Çubuğu + Üst Çubuk + Ana + Yandan Açılır Çekmece. |

---

## EK B — KAVRAMSAL ÇİZİMLER (Metin Tabanlı)

### B.1. Onay Akış Çizimi

```
[PERSONEL: Görev Yürütme]
        │
        ▼
[Onaya Sun] ──── Sonner Bildirim: "Onaya gönderildi"
        │
        ▼
durum = ONAY_BEKLİYOR
        │
        ▼
[Bildirim → BİRİM_MÜDÜRÜ]
        │
        ▼
[Müdür Karar Verir]
        │
        ├─── ONAYLA ───→ durum = ONAYLANDI ──→ Arşive ──→ Denetim Günlüğü
        │
        └─── REDDET ───→ durum = DÜZELTME ──→ Memura bildirim ──→ Denetim Günlüğü
                          (Gerekçe zorunlu)        (gerekçe gösterilir)
```

### B.2. Ast-Üst ile Bağlılık

```
AST-ÜST İLİŞKİSİ (en çok 2 düzey):
   Görev A
     ├── Alt Görev A1
     └── Alt Görev A2

BAĞLILIK (yönlü döngüsüz çizge):
   Görev X ─────bağlı_olduğu────→ Görev Y
   Alt Görev A1 ──bağlı_olduğu──→ Görev B
```

### B.3. Vekâlet Etki Alanı

```
Kullanıcı X (devreden)
   yetkiler: { görev.onayla, proje.oluştur, ... }
        │
        │ vekâlet [başlangıç, bitiş]
        ▼
Kullanıcı Y (alan)
   etkili yetkiler:
     kendi_izinler ∪ devredilen(kapsam)
        │
        ▼
Denetim günlüğü: {
  "eyleyen_kimliği": Y,
  "adına": X,
  "eylem": "GÖREV_ONAYLANDI",
  "zaman_damgası": ...
}
Arayüzde gösterim: "Kaymakam (X) adına Y tarafından onaylanmıştır."
```

### B.4. Hizmet Süresi Üst Makama Taşıma

```
Zamanlayıcı (her dakika)
        │
        ▼
SEÇ görevler NEREDE bitim_tarihi < şimdi() VE durum NOT IN (ONAYLANDI, İPTAL)
        │
        ▼
Her görev için:
  durum = GECİKTİ
  riskDüzeyi = GECİKTİ
  yayımla: GÖREV_GECİKTİ olayı
        │
        ▼
Dinleyiciler:
  - Denetim Günlüğü Yazıcı
  - Bildirim Gönderici → atanan + müdür + (eşik ise) yönetici
  - Gösterge Paneli Önbellek Geçersizleştirici
```

### B.5. Sınıflandırılmış Arama Akışı

```
Kullanıcı: Ctrl+K → "denetim raporu"
        │
        ▼
Ön Yüz: TanStack Query
        │
        ▼
GET /arama?s=denetim+raporu&kullanıcı=...
        │
        ▼
Arka Uç:
  1. Yetki çıkarımı (kullanıcının erişebildiği birim/proje/görev kümesi)
  2. PostgreSQL tam metin arama sorgusu (tsvector, GIN dizin)
  3. Sonuçları sınıflandır: 📁 / ✅ / 📝 / 📄
  4. Sınıf başına sınır 20
        │
        ▼
Ön Yüz: Sonuç listesi (sınıf başlıklı, simgeli)
```

### B.6. Yorum ile Derkenar Kullanım Modeli

```
Görev: "X Belediye ile eşgüdüm"
   │
   ├── Yorumlar (akışkan, zaman dizinli):
   │     [Memur]: "Belediye ile görüşme isteği gönderdim."
   │     [Memur]: "Yanıt bekliyorum."
   │     [Memur]: "Toplantı 15 Mayıs için onaylandı."
   │
   └── Derkenarlar (kalıcı, etiketli, sabitlenebilir):
        📌 [KARAR] Kaymakam toplantı kararı
            "Ortak çalışma öbeği kurulacak. Önder: Yazı İşleri Müdürü."
            (oluşturma 2026-04-15, düzenlenme 2026-04-20 — sürüm 2)

        📌 [ENGEL] Belediye Onayı Bekleniyor
            "Belediye Başkanlığı resmî yazısı gelmeden adım atılamaz."
            (çözüldü: 2026-04-25)

        [UYARI] Bütçe Sınırı
            "Toplam harcama 100.000 TL'yi aşamaz."
```

---

## EK C — RİSK & AZALTMA ÖZETİ

| Risk | Etki | Azaltma |
|---|---|---|
| **Kullanıcı benimsemesi düşük** | Dizge kullanılmazsa kurum hafızası oluşmaz. | Kullanıcı deneyimi odaklı, önce mobil, hızlı arama, anlamlı bildirim. |
| **Denetim günlüğü büyümesi** | Zamanla başarım düşer. | Bölümleme (aylık), arşiv soğuk depoya. |
| **Arama başarımı** | Tam metin arama yeterli olmayabilir. | Soyutlama ile Elasticsearch'e geçiş hazır. |
| **ÖZEL görev sızıntısı** | Yetkilendirme zafiyeti. | Hizmet düzeyinde + veritabanı satır düzeyi güvenliği + denetim günlüğü + erişim sınamaları. |
| **Vekâlet kötüye kullanım** | Geniş kapsamla yetki kötüye kullanım. | Kapsam sınırlandır, kısa süre, denetim, üst makam onayı (politika). |
| **İş yükü uyarısı yanılması** | Eşik yanlış ayarlıysa sürekli uyarı/sustur kapatılır. | Eşik yapılandırması rol/birim tabanlı; kullanıcı geri bildirim ile ayar. |
| **İlerlemeli Web Uygulaması çevrimdışı çatışması** | Çevrimdışı yazma yapılmasının riski. | Asgari uygulanabilir üründe yalnızca okuma çevrimdışı; sonra eşitleme kuyruğu. |
| **Depolama geçişi** | Yerelden MinIO/S3'e taşıma kesintiye yol açabilir. | Soyutlama + geçiş betiği + çift yazım penceresi. |
| **Silinen veri yitimi** | Yumuşak silme atlanırsa. | Veritabanı kullanıcısına sert silme yetkisi vermeden + tüm uç nokta sınamaları. |
| **Üst makama taşıma taşkını** | Aynı görev sürekli taşıma iletisi çıkarır. | "Daha önce bildirildi" koruyucu + günlük sayısal özet. |

---

## EK D — KRİTİK BİLEŞEN İLİŞKİ ÇİZGESİ

```
                    ┌────────────────────────┐
                    │      better-auth       │
                    │  (oturum, RBAC kapı)   │
                    └───────────┬────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        [Ön Yüz Arayüzü]   [Ara Katman]      [Hizmet Katmanı]
        Next.js + RSC      auth kapısı       izinGerekli()
              │                 │                 │
   TanStack Query/Table         │            Prisma + Ara Katman
   React Hook Form + Zod, Sonner│                 │
              │                 ▼                 ▼
              │           [Önce Arayüz Yolları] [Veritabanı: PostgreSQL]
              │                 │                 │
              ▼                 ▼                 │
        [Önbelleklenmiş Durum] [Olay Yolu] ─→ [Denetim Günlüğü Yazıcı]
                                │                 │
                                ▼                 │
                          [Dinleyiciler]          │
                          - Bildirim              │
                          - İş yükü sayacı        │
                          - Gösterge paneli       │
                            önbellek geçersizleş. │
                          - (gelecek) yapay zekâ/ │
                            web kanca             │
                                                  ▼
                                          [Depolama Soyutlaması]
                                          Yerel | MinIO | S3
```

---

## SON SÖZ

PUSULA, mülki idare amirliğinin gerçek dünya aşama yapısını **sayısala ayna tutarak**, hem **işletim verimliliğini** (görev takibi, atama, üst makama taşıma) hem de **stratejik kurumsal hafızayı** (Derkenar, denetim günlüğü, sürümleme) tek çatı altında toplayan, **olay güdümlü** ve **önce arayüz** tabanlı bir İş Yönetim Sahanlığıdır.

S1'den S6'ya çizdiği evrim çizgisi, dizgenin bir **görev takip aracından** **kurum kayıtlarının sayısal omurgasına** dönüşümünü kayda almıştır. Bu birleştirilmiş belge, S1-S6 ve Ana ÜGB'lerin tüm kararlarını, gerekçelerini, planlarını, mantıklarını **eksiksiz** bir araya getirmiş; ayrıca sürümler arasındaki sapmaları, açık soruları, eksiklikleri ve önerilen yol haritasını saydamca ortaya koymuştur.

Bu belge bundan böyle PUSULA için **tek doğru kaynak** adayıdır; ekipler bir konuda belirsizlik yaşadığında **önce buraya bakmalıdır**.

---

**Belge Sonu — Toplam: 31 Ana Bölüm + 5 Ek**

---

## EK F — B EVRESİ EK KARARLAR (2026-05-01 Oturumu, ikinci tur)

### F.1. Kimlik Doğrulama (B-Ç16 Tehdit Modeli Sonrası)

| Karar | Değer | Etki |
|---|---|---|
| **F-1** TOTP 2FA | **HAYIR** — kullanılmayacak. Yerine: **eposta tabanlı tek kullanımlık parola (Input OTP)** her giriş sonrası değil, **kritik eylemlerde** veya **yeni cihaz girişlerinde** kullanılır. | better-auth `emailOTP` eklentisi. Kullanıcı eposta ile gelen 6 haneli kodu girer. UI: shadcn `InputOTP` bileşeni. |
| **F-2** Bulut sağlayıcı | **TÜRKİYE YEREL SUNUCU** | Veri ülke içinde kalır. KVKK uyumu sıkı. Sağlayıcılar: TRTNet, Vargonen, Türk Telekom Bulut, NetInternet, vb. Hizmet seti AWS'ten dar olduğu için bazı bileşenler değişir (aşağıda). |

### F.2. F-2 Sonucu Bulut Altyapı Değişiklikleri

AWS odaklı B-Ç13 belgesindeki bileşenler şu yerel karşılıklara dönüştürülür:

| AWS | Türkiye Yerel Karşılığı |
|---|---|
| Route 53 | Sağlayıcı DNS (veya Cloudflare DNS — Cloudflare yerel sunucuya yönlendirir) |
| CloudFront | **Cloudflare** (kenar küresel, ana yük yerel sunucuda) — alternatif: Sağlayıcı CDN |
| AWS WAF | Cloudflare WAF |
| ALB | nginx / HAProxy / sağlayıcı yük dengeleyici |
| ECS Fargate | **Docker Swarm / Kubernetes (k3s)** sanal sunucularda — veya yönetilen K8s (varsa) |
| RDS PostgreSQL | Yönetilen PostgreSQL (sağlayıcı sunarsa) **veya** kendi yönetilen PostgreSQL (yedek + replikasyon ile) |
| ElastiCache Redis | Self-hosted Redis (Sentinel ile) |
| S3 | **MinIO** (S3 uyumlu, kendi sunucularda) — depolama soyutlaması zaten S3+MinIO destekli |
| S3 Glacier | Soğuk yedek diski (uzun saklama için ayrı sunucu) |
| EventBridge + Lambda | systemd timer veya BullMQ + Redis |
| CloudWatch | Prometheus + Grafana + Loki |
| Secrets Manager | HashiCorp Vault (opsiyonel) **veya** B-10 kararına göre `.env` (sade) |
| CodeArtifact | GitHub Container Registry (GHCR) — uluslararası ama yalnızca konteyner imajı |

### F.3. F-1 Sonucu Eposta OTP Tasarımı

#### Veri Modeli Eklemesi

Mevcut better-auth `Doğrulama` modeli yeterli. Tip eklenir:

```prisma
model Doğrulama {
  kimlik       Metin    @id @default(cuid())
  tanımlayıcı  Metin    // örn. "kullanıcıKimliği:tip" → "ck...:GİRİŞ" / "ck...:KRİTİK_ONAY" / "ck...:CİHAZ"
  değer        Metin    // 6 haneli kod (hash)
  sonGeçerlilik TarihSaat  // 5 dk
  oluşturulmaTarihi TarihSaat @default(now())
}
```

#### OTP Tetikleme Senaryoları

| Senaryo | Tetikleyici | OTP Gerekli mi? |
|---|---|---|
| **Olağan giriş** | Eposta + parola doğru | HAYIR (sadece oturum açılır) |
| **Yeni cihaz/tarayıcı girişi** | Cihaz parmak izi tanınmıyor | EVET — `CİHAZ` OTP |
| **Parola değişimi** | Profilde "Parolayı değiştir" | EVET — `KRİTİK_ONAY` OTP |
| **Eposta değişimi** | Profilde eposta güncelleme | EVET — eski + yeni epostaya OTP |
| **Vekâlet oluşturma** | Yeni vekâlet kaydet | EVET — `KRİTİK_ONAY` OTP |
| **Görev onayla / reddet (BİRİM_MÜDÜRÜ)** | Onay/red eylemi | **OPSİYONEL** — varsayılan HAYIR (B-Ç12 zaten yeterli koruma); sonra konfigüre edilebilir. |
| **Yönetici kritik ayar değişimi** | Sistem ayarları, izin yönetimi | EVET — `KRİTİK_ONAY` OTP |
| **Toplu silme** | 50+ görev silme | EVET — `KRİTİK_ONAY` OTP |

#### Uygulama Akışı

```
Kullanıcı → POST /api/v1/kimlik/giriş (eposta + parola)
       ↓
Sunucu doğrular
       ↓
Cihaz parmak izi tanınıyor mu? (CİHAZ_GÜVENİLİR çerez kontrolü)
       ↓
EVET ──────────→ Oturum aç, dön (200)
       │
HAYIR ─────────→ OTP üret (6 hane), Doğrulama kaydı oluştur
                  ↓
                Eposta gönder ("PUSULA giriş kodunuz: 123456")
                  ↓
                Yanıt: { "otpGerekli": true, "otpKimliği": "..." }
                  ↓
Kullanıcı kodu girer → POST /api/v1/kimlik/giriş-otp-doğrula
                  ↓
Doğru ise oturum aç + cihazı güvenilir işaretle (90 gün)
```

#### UI Bileşeni (Shadcn `InputOTP`)

```
┌─ OTP Doğrulama ────────────────────────────────────┐
│  PUSULA — Yeni cihaz tespit edildi                 │
│                                                    │
│  E-posta adresinize 6 haneli bir kod gönderildi.   │
│  m***@kaymakamlik.gov.tr                           │
│                                                    │
│        ┌─┐ ┌─┐ ┌─┐  ┌─┐ ┌─┐ ┌─┐                   │
│        │1│ │2│ │3│  │4│ │5│ │6│                   │
│        └─┘ └─┘ └─┘  └─┘ └─┘ └─┘                   │
│                                                    │
│  Kod 5 dakika içinde geçerlidir.                   │
│  ☐ Bu cihazı 90 gün boyunca güvenilir say          │
│                                                    │
│  Kod gelmedi mi? [Yeniden gönder] (60 sn sonra)    │
│                                                    │
│            [İptal]              [Doğrula]          │
└────────────────────────────────────────────────────┘
```

#### Eposta Şablonu

```
Konu: PUSULA — Giriş Doğrulama Kodunuz

Sayın Mehmet Y.,

PUSULA hesabınıza yeni bir cihazdan giriş denemesi yapıldı.

Doğrulama Kodunuz: 123456

Bu kod 5 dakika içinde geçerliliğini yitirir.

Cihaz: Chrome on Windows
Konum: Ankara, Türkiye (yaklaşık)
Tarih: 03.05.2026 14:23

Bu girişi siz yapmadıysanız, lütfen hemen parolanızı değiştirin
ve kaymakamlık IT birimine bildirin.

— PUSULA Otomatik Bildirim
```

#### Cihaz Güvenilirliği

```prisma
model GüvenilirCihaz {
  kimlik       Metin    @id @default(cuid())
  kullanıcıKimliği Metin
  cihazParmakİzi Metin   // tarayıcı + IP + UA hash
  ad           Metin?    // "Mehmet Beyin Macbook'u"
  sonKullanım  TarihSaat
  sonGeçerlilik TarihSaat // 90 gün
  oluşturulmaTarihi TarihSaat @default(now())
}
```

Kullanıcı profilde güvenilir cihazları görür ve istediğini iptal edebilir.

### F.4. Güncellenen Tehdit Modeli (B-Ç16 ek)

| Tehdit | Önceki Önlem | Yeni Önlem (F-1) |
|---|---|---|
| Parola sızdırma | bcrypt + politika | + Yeni cihaz OTP (atak vektörü kapanır) |
| Phishing | Eğitim | + Yeni cihaz OTP |
| Kritik eylem ele geçirme | — | + Eposta OTP gerekiyor (kritik eylemlerde) |

> **Sonuç:** F-1 (eposta OTP) ile TOTP 2FA olmadan da kritik eylem koruması sağlanır. Eposta erişimi kullanıcının ek bir güven katmanıdır.

---

**Belge Sonu — Toplam: 31 Ana Bölüm + 6 Ek**

---

## EK E — KARAR GÜNLÜĞÜ (2026-05-01 Oturumu)

> Bu ek, ürün sahibi ile yapılan A → B → C plan oturumunda alınmış olan kararları kayda alır. §30 Açık Sorular ve §30 Stratejik Kararlar bu kararlarla **kilitlenmiştir**.

### E.1. A Bölümü — Açık Sorular (§30.2 Kilitlendi)

| # | Soru | Karar | Not |
|---|---|---|---|
| **S1** | PERSONEL bağımsız görev oluşturabilir mi? | **EVET** | Kendi adına ÖZEL. BİRİM görevi için müdür onayı. |
| **S2** | Proje görünürlüğü (BİRİMLERE_AÇIK / PROJEYE_ÖZEL) | **EVET** | Veri modeline `Proje.görünürlük` alanı eklenecek. |
| **S3** | Birim aşan üye eklemede dış birim müdür onayı | **EVET** | 2 adımlı onay akışı. Veri modeline `proje_üye_isteği` çizelgesi eklenecek. |
| **S4** | ENGEL derkenarı → `durum = ENGELLENDİ` | **EVET, SEÇİMLİK** | Derkenar oluşturulurken `durumOtomatikAyarla` kutucuğu. |
| **S5** | Denetim günlüğü saklama süresi | **10 YIL** | Aylık bölümleme + 1 yıldan eski kayıtlar soğuk depoya. |
| **S6** | Eposta sağlayıcı | **SMTP → MAILGUN/SES** | Soyutlanmış `IEpostaSağlayıcı` arayüzü. |
| **S7** | Resmi tatil takvimi bitim tarihi hesabında | **EVET** | `resmi_tatil_takvimi` çizelgesi + iş günü hesabı yardımcısı. |
| **S8** | Süre takibi (time tracking) | **ASGARİ ÜRÜNDE YOK** | Evre 6'ya bırakıldı. |
| **S9** | Karanlık tema | **EVET** | Shadcn `next-themes` tümleşimi; kullanıcı tercihi. |
| **S10** | Ortak uç nokta (3. taraf API) | **HAYIR** | Gelecekte de planlanmıyor. Web kanca da yok. |

### E.2. B Bölümü — Stratejik Kararlar (Kilitlendi)

| # | Konu | Karar | Sonuç (Doğrudan Etki) |
|---|---|---|---|
| **B-1** | Barındırma | **BULUT** | AWS / Azure / DigitalOcean gibi sağlayıcılarda dağıtım. Yerel barındırma yok. Veritabanı yönetimli (RDS / Cloud SQL / Neon vb.). |
| **B-2** | e-Devlet tümleşimi | **HAYIR** | Tek oturum yok. Kullanıcılar yalnızca eposta + parola (better-auth). |
| **B-3** | EBYS köprüsü | **HAYIR** | Resmi yazışma dışa aktarımı yalnızca PDF/Excel olarak yönetilecek. |
| **B-4** | Pilot kaymakamlık | **ÖNEMLİ DEĞİL (ŞİMDİLİK)** | Genel amaçlı tasarlanacak; sonraki evrede kullanıcı kabul sınamaları için pilot seçilebilir. |
| **B-5** | Başarım hedefleri | **EVET** | Yüzde 95 < 500 ms uç nokta yanıt süresi hedefi. Eşzamanlı 200 kullanıcı varsayımı. |
| **B-6** | Yedekleme | **STANDART** | Kurtarma Noktası Hedefi: 24 saat. Kurtarma Süresi Hedefi: 4 saat. Günlük tam + saatlik artımlı yedek. |
| **B-7** | Sınama yaklaşımı | **STANDART** | Vitest (birim + tümleşim), Playwright (uçtan uca kritik akışlar), Prisma sınama veritabanı, kapsam hedefi yüzde 70+. |
| **B-8** | Sürekli Tümleşim/Dağıtım | **GITHUB ACTIONS** | İş akışları: lint → tip kontrol → birim sınama → uçtan uca sınama → derleme → dağıtım. |
| **B-9** | Depo yapısı | **TEK NEXT.JS PROJESİ (B-Ç18)** | Monorepo (apps/* + packages/*) **KALDIRILDI**. Yerine: tek Next.js + özellik bazlı + mikro bileşen. **Bun** paket yöneticisi (Turborepo + pnpm YASAK). |
| **B-10** | Gizli yönetimi | **`.env`** | Doppler/Vault yok. `.env.example` depoda; gerçek `.env` dağıtım sağlayıcısının ortam değişkenleri panelinde. |

### E.3. C Bölümü — Yol Sırası (Kilitlendi)

**A → B → C sırası** seçildi.

- **A (Kararlar):** ✅ Tamamlandı (yukarıda).
- **B (Çizim + Varlık-İlişki):** 🟡 **Şimdi başlıyoruz.** Çıktılar: yerleşim çizimi seti, varlık-ilişki çizgesi (Prisma şeması görselleştirilmiş), olay akış çizgeleri, açık nokta uç nokta sözleşmesi taslağı.
- **C (Evre 1 Asgari Ürün Ayrıntı Plan):** ⏸ Bekliyor. B bittiğinde başlanacak. Çıktılar: kullanıcı öyküleri, kabul ölçütleri, sprint dağılımı, görev kırılımı.

### E.4. B Evresi İçin Çıkacak Çizim & Belge Listesi

| # | Çıktı | Sahip | Öncelik |
|---|---|---|---|
| **B-Ç1** | Üst düzey mimari çizgesi (ön yüz / arka uç / depolama / olay yolu) | Mimar | YÜKSEK |
| **B-Ç2** | Varlık-İlişki Çizgesi (29 model) | Mimar + Veritabanı uzmanı | YÜKSEK |
| **B-Ç3** | Yerleşim çizimi: Gösterge Paneli (3 rol için) | Tasarımcı | YÜKSEK |
| **B-Ç4** | Yerleşim çizimi: Görev listesi + Sağ Çekmece | Tasarımcı | YÜKSEK |
| **B-Ç5** | Yerleşim çizimi: Genel Arama (Ctrl+K) | Tasarımcı | ORTA |
| **B-Ç6** | Yerleşim çizimi: Derkenar düzenleyicisi | Tasarımcı | ORTA |
| **B-Ç7** | Yerleşim çizimi: Onay akışı (memur + müdür ekranları) | Tasarımcı | YÜKSEK |
| **B-Ç8** | Yerleşim çizimi: Vekâlet kurma sihirbazı | Tasarımcı | ORTA |
| **B-Ç9** | Açık Uç Nokta Sözleşmesi (OpenAPI 3.0) — çekirdek uç noktalar | Mimar + Arka Uç | YÜKSEK |
| **B-Ç10** | Olay Sözlüğü (her olay için yük şeması) | Mimar | YÜKSEK |
| **B-Ç11** | Tasarım imleri (renk, yazı tipi, aralık — Shadcn üzerine kurum kimliği) | Tasarımcı | ORTA |
| **B-Ç12** | Yetki / İzin haritası (rol × izin matrisi) | Mimar + Güvenlik | YÜKSEK |
| **B-Ç13** | Bulut altyapı çizgesi (B-1 kararına göre) | Bulut Uzmanı | YÜKSEK |
| **B-Ç14** | GitHub Actions iş akış kataloğu (B-8'e göre) | DevOps | ORTA |
| **B-Ç15** | ⚠ KALDIRILDI — yerine **B-Ç18** | — | — |
| **B-Ç16** | Tehdit modeli (B-2 ile e-Devlet yokluğunda kimlik doğrulama riskleri) | Güvenlik | ORTA |
| **B-Ç17** | Genel arama tasarımı (Evre 2) | Mimar + Veritabanı | YÜKSEK |
| **B-Ç18** | **Proje yapısı + Mikro bileşen stratejisi** (özellik bazlı, tek Next.js) | Mimar + Ön Yüz | **YÜKSEK — KRİTİK** |

### E.5. Proje Yapısı — TEK NEXT.JS + ÖZELLİK BAZLI (B-Ç18 Kararı)

> **B-9 (eski monorepo kararı) KALDIRILDI.** Yerine B-Ç18'deki **tek Next.js projesi + özellik bazlı + mikro bileşen** yapısı kabul edildi.

Tam belge: [docs/proje-yapısı/B-Ç18-proje-yapısı-ve-bileşen-stratejisi.md](../proje-yapısı/B-Ç18-proje-yapısı-ve-bileşen-stratejisi.md)

```
pusula/
├── app/                              # ★ Next.js App Router
│   ├── (auth)/                       # yol öbeği — kimlik
│   ├── (dashboard)/                  # yol öbeği — uygulama
│   │   ├── layout.tsx
│   │   ├── projeler/                 # ÖZELLİK
│   │   │   ├── page.tsx
│   │   │   ├── [kimlik]/
│   │   │   ├── components/           # özelliğe özel
│   │   │   ├── hooks/
│   │   │   ├── actions.ts
│   │   │   ├── schemas.ts
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── gorevler/                 # ÖZELLİK
│   │   ├── derkenarlar/              # ÖZELLİK
│   │   ├── vekalet/
│   │   └── ...
│   └── api/                          # ★ REST uç noktaları
│       └── v1/
│           └── ...
├── components/                       # ★ PAYLAŞIMLI MİKRO BİLEŞENLER
│   ├── ui/                           # Shadcn primitives
│   ├── data-table/
│   ├── form/
│   ├── feedback/
│   ├── layout/
│   ├── badges/
│   ├── search/                       # Ctrl+K
│   └── ...
├── lib/                              # ★ Genel altyapı
│   ├── auth/
│   ├── prisma/
│   ├── permissions/
│   ├── event-bus/
│   ├── storage/
│   ├── email/
│   └── audit/
├── hooks/                            # paylaşımlı React kancaları
├── types/                            # paylaşımlı tipler
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── e2e/
├── tests/
├── altyapi/
├── .github/workflows/
├── docs/
└── package.json                      # tek kök
```

**Asal kurallar (B-Ç18):**
- Tek Next.js projesi (`apps/*`, `packages/*` YOK)
- Özellik bazlı: her özellik kendi klasöründe (sayfa + bileşen + kanca + şema + actions)
- Mikro bileşen: ≤150 satır, tek sorumluluk, bileşim
- Yeniden kullanılabilirlik: 1 özellikte → özellik içinde / 2+ özellikte → kök `components/`
- Çapraz özellik importu yasak
- ESLint kuralları yapıyı zorlar

### E.6. Sınanmış Kararlardan Türeyen Veri Modeli Eklemeleri

**S2 (Proje görünürlüğü) için:**
```prisma
enum ProjeGörünürlüğü { BİRİMLERE_AÇIK PROJEYE_ÖZEL }

model Proje {
  // ... mevcut alanlar
  görünürlük ProjeGörünürlüğü @default(BİRİMLERE_AÇIK)
}
```

**S3 (Birim aşan üye onay isteği) için:**
```prisma
enum ÜyelikİsteğiDurumu { BEKLİYOR ONAYLANDI REDDEDİLDİ İPTAL_EDİLDİ }

model ProjeÜyelikİsteği {
  kimlik         Metin    @id @default(cuid())
  projeKimliği   Metin
  davetEdilenKimliği Metin
  davetEdenKimliği   Metin
  hedefBirimMüdürKimliği Metin // onay verecek dış birim müdürü
  durum          ÜyelikİsteğiDurumu @default(BEKLİYOR)
  redGerekçesi   Metin?
  oluşturulmaTarihi TarihSaat @default(now())
  yanıtTarihi    TarihSaat?
}
```

**S7 (Resmi tatil takvimi) için:**
```prisma
enum TatilTipi { RESMİ_TATİL HAFTA_SONU İDARİ_İZİN }

model ResmiTatil {
  kimlik     Metin    @id @default(cuid())
  tarih      TarihSaat @unique
  ad         Metin
  tip        TatilTipi
  açıklama   Metin?
  oluşturulmaTarihi TarihSaat @default(now())
}
```

> **Not:** Bitim tarihi hesaplama yardımcısı (`işGünüEkle(başlangıç, gün)`) bu çizelgeyi sorgulayarak resmi tatilleri atlayacak.

### E.7. Hizmet Sözleşmesi Hedefleri (B-5 Kararı Sonucu)

| Ölçüt | Hedef |
|---|---|
| Uç nokta yanıt süresi (yüzde 95) | < 500 ms |
| Uç nokta yanıt süresi (yüzde 99) | < 1500 ms |
| Genel arama yanıt süresi | < 300 ms (yerel sonuç), < 800 ms (tam metin) |
| Eşzamanlı kullanıcı varsayımı | 200 |
| Çalışma süresi hedefi | yüzde 99.5 (yıllık ~44 saat kesinti) |
| Sayfa ilk anlamlı boyama | < 1.8 sn (mobil 4G) |

### E.8. Sınama Yaklaşımı (B-7 Kararı Sonucu)

| Tür | Araç | Kapsam Hedefi | Tetikleyici |
|---|---|---|---|
| **Birim Sınamaları** | Vitest | yüzde 70+ | Her PR + her gece |
| **Tümleşim Sınamaları** | Vitest + Prisma sınama veritabanı | Kritik akışlar yüzde 100 | Her PR |
| **Uçtan Uca Sınamaları** | Playwright | Her ana kullanıcı akışı | Her PR (kritik) + her gece (tümü) |
| **Tip Denetimi** | tsc | yüzde 100 | Her PR |
| **Lint** | ESLint + Prettier | yüzde 100 | Her PR |
| **Erişilebilirlik** | axe-core (Playwright tümleşik) | WCAG 2.2 AA | Her PR (uçtan uca içinde) |
| **Başarım** | Lighthouse CI | Skor > 85 | Her gece |
| **Güvenlik** | npm audit + OWASP ZAP | Yüksek/Kritik = 0 | Her gece |

### E.9. GitHub Actions İş Akışları (B-8 Kararı Sonucu)

```
.github/workflows/
├── pr.yml                  # Her PR için: lint, tip, birim, tümleşim
├── e2e.yml                 # Her PR için: kritik uçtan uca; her gece: tümü
├── deploy-staging.yml      # main dalı → hazırlık
├── deploy-production.yml   # release etiket → üretim (elle onay)
├── nightly.yml             # Lighthouse, OWASP, tam uçtan uca, kapsam raporu
├── dependency-update.yml   # Renovate haftalık
└── audit-log-archive.yml   # Aylık 1 yıldan eski denetim günlüğünü soğuk depoya
```

---

## SIRADAKI ADIM

**B Evresi'ne başlıyoruz.** Önerilen sıralama:

1. **B-Ç1** Üst düzey mimari çizgesi (önce bunu görsel olarak çizmem en doğal, çünkü diğer çıktılar buna dayanır).
2. **B-Ç2** Varlık-ilişki çizgesi (veritabanı modelinin görsel hali — 29 model + ilişkiler).
3. **B-Ç12** Yetki/izin haritası (rol × izin matrisi — kod bağımlılığı düşük, hemen üretilebilir).
4. **B-Ç9** Açık uç nokta sözleşmesi (OpenAPI 3.0).
5. **B-Ç10** Olay sözlüğü (yük şemaları).
6. **B-Ç3..B-Ç8** Yerleşim çizimleri (tasarım odaklı — tasarımcı agent'larla).
7. **B-Ç13..B-Ç16** Bulut altyapı + tehdit modeli + iş akışları.

**Soru:** B-Ç1'den (mimari çizge) mi başlayalım, yoksa farklı bir sırayı mı tercih edersin?

