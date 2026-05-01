# PUSULA — Konsolide Master Analiz Dökümanı

> **Doküman Tipi:** PRD Konsolidasyon & Derinlemesine Analiz
> **Kapsam:** V1, V2, V3, V4, V5, V6 ve Master PRD'lerin tek çatı altında toplanması
> **Hazırlayan:** Hızır AI (Konsolide PRD analiz görevi)
> **Tarih:** 2026-05-01
> **Hedef Kitle:** Ürün ekibi, mimar, geliştirici, QA, paydaşlar (Kaymakamlık makamı, birim müdürleri)
> **Kategori:** Master PRD (Single Source of Truth Adayı)

---

## İÇİNDEKİLER

1. [Yönetici Özeti (Executive Summary)](#1-yönetici-özeti)
2. [Doküman Evrimi ve Versiyonlama Tarihçesi](#2-doküman-evrimi-ve-versiyonlama-tarihçesi)
3. [Proje Vizyonu ve Stratejik Konumlandırma](#3-proje-vizyonu-ve-stratejik-konumlandırma)
4. [Teknoloji Yığını (Detaylı Gerekçelendirme)](#4-teknoloji-yığını-detaylı-gerekçelendirme)
5. [Organizasyonel Yapı ve Yetkilendirme (RBAC + Permissions)](#5-organizasyonel-yapı-ve-yetkilendirme)
6. [Çekirdek Sistem Mimarisi (Core Engine)](#6-çekirdek-sistem-mimarisi-core-engine)
7. [Proje Mimarisi](#7-proje-mimarisi)
8. [Görev Mimarisi](#8-görev-mimarisi)
9. [İlerleme ve Otomasyon Kuralları](#9-i̇lerleme-ve-otomasyon-kuralları)
10. [SLA / Risk Yönetimi](#10-sla--risk-yönetimi)
11. [Onay Mekanizması (Maker-Checker)](#11-onay-mekanizması-maker-checker)
12. [Vekalet Modülü](#12-vekalet-modülü)
13. [Bildirim Merkezi ve Inbox](#13-bildirim-merkezi-ve-inbox)
14. [İzleyici (Watcher) Sistemi](#14-i̇zleyici-watcher-sistemi)
15. [Tekrarlayan Görevler (Recurring Tasks)](#15-tekrarlayan-görevler)
16. [Atama Kuralları (Assignment Rules)](#16-atama-kuralları)
17. [Toplu İşlemler (Bulk Operations)](#17-toplu-i̇şlemler-bulk-operations)
18. [Görev Şablonları](#18-görev-şablonları)
19. [Kurumsal Hafıza: Derkenar Sistemi (Annotation)](#19-kurumsal-hafıza-derkenar-sistemi-annotation)
20. [Global Arama Motoru (Ctrl+K)](#20-global-arama-motoru-ctrlk)
21. [Audit Log (İşlem Logları)](#21-audit-log-i̇şlem-logları)
22. [Core Error Monitor (Geliştirici Hata Takibi)](#22-core-error-monitor)
23. [Kullanıcı Deneyimi (UX) ve Layout](#23-kullanıcı-deneyimi-ux-ve-layout)
24. [Mobile-First ve PWA Stratejisi](#24-mobile-first-ve-pwa-stratejisi)
25. [Dosya Yönetimi ve Storage Soyutlaması](#25-dosya-yönetimi-ve-storage-soyutlaması)
26. [Dashboard ve Görselleştirme](#26-dashboard-ve-görselleştirme)
27. [Veri Modeli (Konsolide Şema)](#27-veri-modeli-konsolide-şema)
28. [Kararlar ve Gerekçeleri (Decision Log)](#28-kararlar-ve-gerekçeleri-decision-log)
29. [Versiyonlar Arası Sapma / Çelişki Analizi](#29-versiyonlar-arası-sapma-çelişki-analizi)
30. [Boşluklar, Açık Sorular ve Öneriler](#30-boşluklar-açık-sorular-ve-öneriler)
31. [Sözlük (Glossary)](#31-sözlük-glossary)

---

## 1. YÖNETİCİ ÖZETİ

PUSULA, bir mülki idare amirliği (Kaymakamlık) için tasarlanmış, hiyerarşik kamu yapısına uygun, denetim odaklı, modüler ve **tam kapsamlı bir İş Yönetim Platformu** (Work Management Platform) olarak konumlandırılmıştır.

V1'den V6'ya doğru evrimleşen PRD seti, aşağıdaki dönüşümü kayda almıştır:

- **V1:** Temel görev takip sistemi (RBAC, vekalet, eskalasyon, audit log, hata takibi, mobile-first, PWA).
- **V2:** Shadcn UI standardı + çekirdek düzeyde global arama (Full-Text Search) + bildirim motoru.
- **V3:** Modern frontend ekosistemi (better-auth, TanStack Query, RHF + Zod, TanStack Table, Sonner).
- **V4:** Proje ve görev mimarisinin derinleştirilmesi (cross-functional projeler, görünürlük, hiyerarşi vs bağımlılık ayrımı, leaf-node progress hesaplama, kategorize arama).
- **V5:** Kurumsal hafıza katmanı: **Derkenar (Annotation)** sistemi — yorumlardan ayrı, kalıcı, etiketli, sabitlenebilir bilgi defteri.
- **V6:** Olay güdümlü (event-driven), API-first, immutable audit, soft delete + arşivleme, granüler permissions, watcher/inbox, recurring tasks, workload uyarısı, bulk operations.
- **Master PRD:** V1–V6 birleşik son hâli.

Sistemin asal direkleri:

1. **Sabit hiyerarşi (Birim/Makam) modeli** — kamu yapısına uygun.
2. **Analysis → Plan → TODO → Coding/Action** iş akışının dijitalleştirilmesi.
3. **Maker-Checker (memur → müdür) onay mekanizması** + revizyon döngüsü.
4. **Gecikme ve eskalasyon otomasyonu.**
5. **Vekalet (delegation) ile sürekliliğin korunması.**
6. **Immutable audit log** ile her hareketin kayıt altına alınması.
7. **Yorum (geçici) + Derkenar (kalıcı kurumsal hafıza)** ayrımı.
8. **Hiyerarşi (parent/child) ile Bağımlılık (dependency) kavramlarının kesin ayrımı.**
9. **Mobile-first + PWA** ile saha kullanılabilirliği.
10. **Soyutlanmış storage** ile ileride MinIO/S3 geçişine hazır altyapı.
11. **Categorized global search (Ctrl+K)** ve kullanıcı yetkisi sınırı içinde tüm veri tarama.
12. **Event-driven mimari** ile bildirim, log ve gelecek AI/Webhook entegrasyonlarına açık tasarım.

Bu doküman, V1-V6 evrim çizgisini koruyarak, eklenen her gereksinimi, alınan her mimari kararı ve arkasındaki gerekçeyi tek belge altında konsolide eder; çelişkileri açığa çıkarır ve eksiklikler için soru listesi sunar.

---

## 2. DOKÜMAN EVRİMİ VE VERSİYONLAMA TARİHÇESİ

PUSULA gereksinim seti **kümülatif** bir şekilde gelişmiştir. Her yeni versiyon, bir öncekinin üzerine eklemeler ve netleştirmeler getirir; kırıcı (breaking) bir mimari değişiklik yapılmamıştır.

### 2.1. Versiyon × Eklenti Matrisi

| Konu / Modül | V1 | V2 | V3 | V4 | V5 | V6 | Master |
|---|---|---|---|---|---|---|---|
| Vizyon (görev takip → Work Management Platform) | Görev takip | Görev takip | Görev takip | Çekirdek genişledi | Kurumsal hafıza eklendi | **Work Management Platform** | Birleşik |
| Tech Stack: Next.js + React + Tailwind | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tech Stack: Shadcn UI |  | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tech Stack: better-auth |  |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tech Stack: TanStack Query |  |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tech Stack: RHF + Zod |  |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tech Stack: TanStack Table |  |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tech Stack: Sonner Toast |  |  | ✓ | ✓ | ✓ | ✓ | ✓ |
| Backend: Node.js + Prisma + PostgreSQL | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Storage Soyutlaması (Local/MinIO/S3) | ✓ | ✓ | ✓ |  |  |  | ✓ |
| Mobile-first + PWA | ✓ | ✓ | ✓ |  |  |  | ✓ |
| RBAC (Kaymakam, Müdür, Memur) | ✓ | ✓ | ✓ |  |  | ✓ (genişledi) | ✓ |
| Granüler Permissions |  |  |  |  |  | ✓ | ✓ |
| Vekalet | ✓ | ✓ | ✓ |  |  | ✓ | ✓ |
| Eskalasyon (Süre + %25 Uyarı) | ✓ | ✓ | ✓ |  |  | ✓ | ✓ |
| Görev Şablonları | ✓ | ✓ | ✓ |  |  |  | ✓ |
| Audit Log (Prisma Middleware, JSON diff) | ✓ | ✓ (old/new) | ✓ |  |  | ✓ (immutable) | ✓ |
| Core Error Monitor | ✓ | ✓ | ✓ (Zod) |  |  |  | (örtük) |
| Onay Mekanizması (Maker-Checker) | ✓ | ✓ | ✓ |  |  | ✓ (çift aşamalı netlik) | ✓ |
| Bildirim Motoru (in-app, push) |  | ✓ | ✓ (Sonner) |  |  | ✓ (Inbox) | ✓ |
| Çekirdek Düzey Global Arama (FTS) |  | ✓ | ✓ | ✓ (kategorize) | ✓ (Derkenar dahil) | ✓ | ✓ |
| Sidebar / Header / Drawer Layout | ✓ | ✓ | ✓ |  |  |  | ✓ (Off-canvas) |
| Cross-functional Projeler |  |  |  | ✓ |  |  | ✓ |
| Proje Dosya Havuzu |  |  |  | ✓ |  |  | ✓ |
| Bağımsız Görev (projectId NULL) |  |  |  | ✓ |  |  | ✓ |
| Görev Görünürlüğü (PRIVATE/UNIT) |  |  |  | ✓ | ✓ |  | ✓ |
| Hiyerarşi (Max 2 seviye) |  |  |  | ✓ | ✓ | ✓ | ✓ |
| Bağımlılık (task_dependencies N:M) |  |  |  | ✓ | ✓ | ✓ | ✓ |
| Leaf-Node Progress |  |  |  | ✓ | ✓ |  | ✓ |
| Manuel Proje Kapatma |  |  |  | ✓ |  |  | ✓ |
| TanStack Table + Progress Bar + Badge |  |  |  | ✓ | ✓ | ✓ | ✓ |
| Kategorize Arama (📁✅📝📄) |  |  |  | ✓ | ✓ | ✓ | ✓ |
| Derkenar (Annotation) Sistemi |  |  |  |  | ✓ | ✓ | ✓ |
| Yorum/Derkenar Ayrımı |  |  |  |  | ✓ | ✓ | ✓ |
| Derkenar Tipleri (DECISION/WARNING/BLOCKER/INFO) |  |  |  |  | ✓ | ✓ | ✓ |
| Derkenar Versiyonlama (Snapshot) |  |  |  |  |  | ✓ | ✓ |
| API-First & Event-Driven |  |  |  |  |  | ✓ | ✓ |
| Immutable Audit Log |  |  |  |  |  | ✓ | ✓ |
| Soft Delete + Arşivleme |  |  |  |  |  | ✓ | ✓ |
| SLA Risk (🟢🟡🔴) |  |  |  |  |  | ✓ | ✓ |
| Watcher (İzleyici) |  |  |  |  |  | ✓ | ✓ |
| Inbox (Bildirim Merkezi) |  |  |  |  |  | ✓ | ✓ |
| Recurring Tasks |  |  |  |  |  | ✓ | ✓ |
| Assignment Rules |  |  |  |  |  | (örtük "Otomatik Kurallar") | ✓ |
| Bulk Operations |  |  |  |  |  | ✓ | ✓ |
| Workload (İş Yükü) Uyarısı |  |  |  |  |  | ✓ | ✓ |
| Dashboard Widget'ları |  |  |  |  |  | ✓ | ✓ |

> **Not:** Tablodaki "✓" o versiyonun **ilk** olarak konuya değindiği veya o konuyu **netleştirdiği** anı işaretler. Sonraki sürümlerde konunun kapsamı korunduğu varsayılır (kümülatif yaklaşım).

### 2.2. Versiyonların Anlamı

- **V1 → V2:** UI standartlaşması (Shadcn) + arama/bildirim altyapısı.
- **V2 → V3:** Frontend ekosistemi netleşti (Auth, State, Form, Table, Toast).
- **V3 → V4:** Görev/Proje yapısı derinleşti (görünürlük, hiyerarşi, bağımlılık, ilerleme).
- **V4 → V5:** Kalıcı kurumsal hafıza katmanı (Derkenar) eklendi.
- **V5 → V6:** Mimari ilkeler (event-driven, API-first), denetim sertleşmesi (immutable, soft delete), iş akışı zenginliği (watcher, inbox, recurring, bulk, workload).
- **Master:** V1–V6 birleştirilmiş tek hakikat (Single Source of Truth) belgesi.

### 2.3. Evrimden Çıkan Stratejik Sinyaller

1. **"Görev Takip" → "İş Yönetim Platformu"** kayma çizgisi. Sistem sadece todo değil; karar defteri, denetim mekanizması ve kurum hafızasıdır.
2. **Saf RBAC → RBAC + granüler permissions** geçişi (V6'da `project.manage`, `task.assign`, `task.approve`, `task.create`, `task.update`, `system.audit` gibi izinler).
3. **Frontend olgunlaşması:** V1'deki "React + Tailwind" V3 itibariyle modern bir ekosisteme dönüştü; bu, UX'in PRD'de **birinci sınıf** bir konu olduğuna işaret eder.
4. **Audit'in sertleşmesi:** V1 "kayıt altına alınır" → V6 "asla silinemez/değiştirilemez (immutable)".
5. **Yorum + Derkenar ayrımı**, sistemin "sohbet aracı" olmaktan çıkıp "kurum hafızası" olarak konumlandırılma niyetinin en güçlü kanıtıdır.

---

## 3. PROJE VİZYONU VE STRATEJİK KONUMLANDIRMA

### 3.1. Vizyon Cümlesi

> **PUSULA**, mülki idare amirliği bünyesindeki tüm süreçlerin, kararların, denetimlerin ve kurumsal hafızanın yönetildiği; sabit hiyerarşik yapıyı temel alan, denetlenebilir, modüler ve modern bir İş Yönetim Platformu'dur.

### 3.2. Stratejik Konumlandırma

| Boyut | Yaklaşım |
|---|---|
| **Hedef Kitle** | Mülki idare amirliği (Kaymakamlık), birim müdürleri, memurlar, idari personel. |
| **Mimari Felsefe** | Sabit hiyerarşi (Birim/Makam) — dinamik takım modeli **reddedilmiştir**. |
| **İş Akışı Modeli** | Analysis → Plan → TODO → Coding/Action (dijitalleştirilmiş). |
| **Yönetim Disiplini** | Maker-Checker (memur işi yapar, müdür onaylar). |
| **Kalite & Denetim** | Immutable audit log, soft delete, log diff (old/new). |
| **Kurum Hafızası** | Derkenar (kalıcı bilgi) + Yorum (geçici sohbet) ayrımı. |
| **Sürdürülebilirlik** | Vekalet ile süreçlerin tıkanmaması. |
| **Otomasyon** | Eskalasyon (gecikme), recurring (rutin işler), assignment rules. |
| **Modernlik** | Shadcn + Next.js App Router + better-auth + TanStack ekosistemi. |
| **Mobil Erişim** | Mobile-first tasarım + PWA (ana ekrana ekleme + temel offline). |
| **Geleceğe Hazırlık** | API-First + Event-Driven (AI/Webhook entegrasyonu için açık kapı). |

### 3.3. "Neden PUSULA?" — Çözmeye Çalıştığı Asıl Problemler

1. **Devlet bürokrasisinin sabit hiyerarşisi** ile iyi geçinmeyen "takım/grup" odaklı genel-purpose araçların (Asana, Trello, Jira) zorlanması.
2. **Vekalet** kavramı: Türk kamu yönetiminde idarecilerin izinli/görevli olması olağandır; bu süreçte iş akışının tıkanmaması zorunludur.
3. **Onay-Red-Revizyon** döngüsü: Resmi yazışma ve havale kültürünün dijital karşılığı.
4. **İzlenebilirlik (auditability):** Her hareket kim tarafından, ne zaman, hangi gerekçeyle yapıldı sorusuna **somut ve değiştirilemez** yanıt vermek.
5. **Kurum hafızası kaybı:** Yorumlarda boğulan kararlar, BLOCKER bilgileri vs. — Derkenar bunu çözer.
6. **Süre Yönetimi (Termin):** Resmi işlerde "süre dolmadan haber ver" zorunluluğu (%25 erken uyarı + otomatik gecikme statüsü + üst makama eskalasyon).
7. **Çapraz Birim çalışmalar:** Bir projede birden fazla birimden personelin koordinasyonu.
8. **Hassas/özel görev desteği:** PRIVATE görünürlük ile sadece atanan-atayan arasındaki gizli görevler.

### 3.4. Tasarım İlkeleri

1. **API-First:** Tüm yetenekler önce HTTP endpoint olarak modellenir; UI bunun bir tüketicisidir.
2. **Event-Driven:** İç olaylar (`TASK_COMPLETED`, `NOTE_CREATED`, `STATUS_CHANGED`, vb.) yayımlanır; loglama, bildirim, AI/Webhook bunları dinler.
3. **Immutable by Default:** Audit kayıtları, derkenar geçmişi (snapshot), event log silinemez.
4. **Soft Delete by Default:** Hiçbir kullanıcı verisi fiziksel olarak silinmez (`deleted_at`, `deleted_by`).
5. **Mobile-First:** Tasarım önce mobil için yapılır, masaüstü onun zenginleştirilmiş halidir.
6. **Composable UI:** Shadcn UI ile ham bileşenleri kompozisyonla zenginleştirme.
7. **Server State ≠ Client State:** TanStack Query ile sunucu durumu UI durumundan ayrılır.
8. **Validation as Contract:** Zod şemaları hem RHF hem API hem de tip türetimi için tek kaynak.

---

## 4. TEKNOLOJİ YIĞINI (Detaylı Gerekçelendirme)

### 4.1. Konsolide Tablo

| Katman | Teknoloji | İlk Eklenen Versiyon | Gerekçe |
|---|---|---|---|
| Framework | **Next.js (App Router)** | V1 | SSR/SSG, file-based routing, RSC (React Server Components), middleware, edge support. |
| UI Framework | **React** | V1 | Ekosistem, hiring, component model. |
| Stil | **Tailwind CSS** | V1 | Utility-first, hızlı prototipleme, design system disiplini. |
| Komponent | **Shadcn UI** | V2 | Tutarlı, modern, **erişilebilir** (Radix tabanlı), kopyala-yapıştır mantığı (kütüphane bağımlılığı yerine kod sahipliği). |
| Auth | **better-auth** | V3 | Modern, TypeScript-first, plugin mimarisi, session/JWT/OAuth/Email/2FA destekleri. |
| Server State | **TanStack Query (React Query)** | V3 | Cache invalidation, optimistic updates, polling, infinite queries — sunucu state'i ≠ UI state'i. |
| Form | **React Hook Form** | V3 | Uncontrolled performans, minimal re-render. |
| Validasyon | **Zod** | V3 | Şema-first; hem client (RHF) hem server hem TypeScript tip kaynağı. |
| Tablo | **TanStack Table** | V3 | Headless, sıralama/filtreleme/pagination/virtualization; progress bar ve badge entegrasyonu. |
| Toast | **Sonner** | V3 | Modern, lightweight, animasyonlu, accessible. |
| Backend Runtime | **Node.js** | V1 | Tam-stack JS, ekip uyumu. |
| ORM | **Prisma** | V1 | Type-safe DB access, migration, **middleware** (audit için kritik). |
| DB | **PostgreSQL** | V1 | ACID, JSONB, **Full-Text Search**, ileride pgvector/extensions için açık kapı. |
| Mobil | **Mobile-First Responsive + PWA** | V1 | Yerel app store sürtünmesini ortadan kaldırır; ana ekrana ekleme, basit offline cache. |
| Storage | **Soyutlanmış Storage Interface (Local / MinIO / S3)** | V1 | Lokal başlat → ihtiyaç oluşunca MinIO veya S3'e taşı; uygulama kodunda değişiklik gerekmez. |

### 4.2. Mimari Düzlemde Teknoloji Seçimlerinin Anlamları

#### Next.js App Router seçimi
- Server Components → **veri yakınlığı** (DB sorgusu component içinde, hydration maliyeti azalır).
- Route Handlers → API endpoint (`app/api/...`) — API-First için doğal yapı.
- Middleware → auth gating, route protection.
- Streaming + Suspense → büyük dashboard'larda algısal performans.

#### Prisma Middleware seçimi
- **Audit log** için "tek ortak yer" sağlar. Her INSERT/UPDATE/DELETE operasyonu yakalanabilir.
- `extends` API ile `$allModels` üzerinde `before/after` hook'ları kurulabilir.
- Soft delete uygulamasının kritik tek noktası (single point of enforcement).

#### TanStack Query seçimi
- Bildirim bazlı invalidation: bir görev güncellenince, ilgili `queryKey` invalidate edilir.
- Optimistic updates ile "Onaya Sun" gibi aksiyonlarda anlık geri bildirim.
- `staleTime` + background refetch ile **kullanıcının inbox'ı/dashboard'u** taze tutulur.

#### React Hook Form + Zod
- Tek şema → form validation + API request validation + TS tipleri.
- Validasyon hataları **Core Error Monitor**'e UX iyileştirme sinyali olarak gönderilir (V3'te netleşti).

#### TanStack Table
- Progress bar, badge, custom cell renderer'ları.
- Server-side pagination/sort/filter desteği — büyük listelerde (gecikmiş görevler, audit log) kritik.

#### Sonner
- "Onaya sunuldu", "Görev güncellendi", "Vekalet aktif" gibi geri bildirimler.
- Aksiyon butonu (Undo) destekli toast → bulk operations için faydalı.

#### Storage Soyutlaması
- Interface: `IStorageProvider { upload(), download(), delete(), getSignedUrl() }`.
- Implementasyonlar: `LocalFileSystemProvider`, `MinioProvider`, `S3Provider`.
- ENV ile provider seçimi.
- **Test edilebilirlik:** mock provider ile birim testler.

---

## 5. ORGANİZASYONEL YAPI VE YETKİLENDİRME

### 5.1. Yapısal İlke

> **Sabit hiyerarşi (Birim/Makam)**. Dinamik takım, board, workspace gibi kavramlar **bilinçli olarak reddedilmiştir.**

Bu, kamu kurumlarının organizasyon şemalarına (Kaymakam → Birim Müdürleri → Memurlar) bire bir uyum sağlayan bir **aynalama**dır.

### 5.2. Roller ve Hiyerarşi

| Rol (V1-V5) | Rol (V6/Master) | Yetki Kapsamı |
|---|---|---|
| **Kaymakam / Özel Kalem** | **ADMIN** | Süper Admin; tüm birimleri izleme, görev açma, eskalasyon raporu, sistem ayarları. |
| **Birim Müdürü** | **UNIT_MANAGER** | Kendi birimine gelen işleri memurlara havale, onay/red, vekalet bırakma, proje başlatma. |
| **Birim Personeli (Memur)** | **EMPLOYEE** | Atanan görevleri yürütme, alt görev açma, raporlama, onaya sunma. |

### 5.3. Granüler Permissions (V6)

V6'da **rol → izin paketi** ilişkisi netleştirildi:

| Rol | Örnek İzinler |
|---|---|
| **ADMIN** | `system.audit`, `system.settings`, `project.manage`, `unit.manage`, `escalation.read`, `report.read.all`. |
| **UNIT_MANAGER** | `project.create`, `project.manage.own_unit`, `task.assign`, `task.approve`, `task.reject`, `delegation.create`, `unit.member.read`. |
| **EMPLOYEE** | `task.create`, `task.update.assigned`, `task.submit_for_approval`, `subtask.create`, `note.create`, `comment.create`. |

**Önemli:** Permissions, rol-tabanlı **paket** olarak gelir; ancak veri modelinde permission'ların **ayrı tablo (permissions, role_permissions, user_permissions)** olarak yönetilmesi tasarım esnekliği için önerilir (gelecekte rol-dışı per-user override).

### 5.4. Çapraz Birim Çalışma (Cross-Functional)

- Bir proje birden fazla birime ait olabilir (V4).
- Proje sahibi birim, dışındaki birimlerden personeli **görev bazında** projeye dahil edebilir.
- Yetki yayılımı: Kaymakam ve Birim Müdürleri proje başlatma yetkisine sahiptir.

### 5.5. Vekalet ile Yetki Devri

Bkz. [§12 Vekalet Modülü](#12-vekalet-modülü). Vekalet, bir kullanıcının **sahip olduğu yetkilerin alt kümesini** belirli tarih aralığında başka bir kullanıcıya geçici olarak verir. Tüm vekaleten yapılan işlemler `"X adına Y tarafından yapılmıştır"` formatında loglanır.

---

## 6. ÇEKİRDEK SİSTEM MİMARİSİ (Core Engine)

### 6.1. API-First Tasarım

**Prensipler:**
- Her domain etkileşimi REST endpoint ile başlar (`POST /tasks/{id}/assign`, `POST /tasks/{id}/submit-for-approval`, `POST /annotations`, `POST /delegations`, vb.).
- UI bunun bir tüketicisidir (TanStack Query ile).
- Endpoint'ler **domain odaklı** isimlendirilir, CRUD odaklı değil.

**Örnek endpoint kataloğu:**
- `POST /projects` (proje oluştur)
- `POST /projects/{id}/close-request` (kapatma talebi)
- `POST /tasks` (görev oluştur)
- `POST /tasks/{id}/assign` (havale)
- `POST /tasks/{id}/submit-for-approval`
- `POST /tasks/{id}/approve`
- `POST /tasks/{id}/reject` (gerekçe ile)
- `POST /tasks/{id}/dependencies` (bağımlılık ekle)
- `POST /tasks/{id}/watch` / `DELETE /tasks/{id}/watch`
- `POST /annotations` / `PATCH /annotations/{id}` / `POST /annotations/{id}/pin`
- `POST /delegations`
- `GET /search?q=...&category=...`
- `GET /inbox`
- `GET /audit-logs?entity=...&id=...`

### 6.2. Event-Driven Mimari

**Olay (Event) Sözlüğü (örneklem):**

| Event | Tetikleyici | Dinleyiciler |
|---|---|---|
| `TASK_CREATED` | Yeni görev oluşumu | Bildirim, audit, dashboard cache invalidation. |
| `TASK_ASSIGNED` | Havale | Bildirim (atanan + watcher), workload counter güncellemesi. |
| `TASK_STATUS_CHANGED` | Statü değişimi | Audit, bildirim, eskalasyon (DELAYED'a geçişte). |
| `TASK_COMPLETED` | Tamamlanma | Parent task progress recompute, project progress recompute. |
| `TASK_REJECTED` | Müdür red etti | Memura gerekçeli bildirim. |
| `TASK_DELAYED` | Cron/scheduler tetikli | Üst amire eskalasyon bildirimi. |
| `NOTE_CREATED` | Derkenar oluşumu | Audit, watcher bildirimi (opsiyonel). |
| `NOTE_PINNED` | Sabitleme | Audit. |
| `FILE_UPLOADED` | Dosya yükleme | Audit, dashboard recompute. |
| `DELEGATION_CREATED` | Vekalet kuruldu | Hem devreden hem alana bildirim. |
| `DELEGATION_EXPIRED` | Süre doldu | Otomatik kapatma + bildirim. |

**Faydaları:**
- Bildirim, log, metrik, AI/Webhook gibi **yan endişeler** ana iş kodundan ayrışır.
- Yeni bir dinleyici eklemek, mevcut akışı değiştirmeden mümkündür (Open-Closed prensibi).
- Test edilebilirlik artar (event'ler kontrat olarak doğrulanır).

### 6.3. Immutable Audit Log

Bkz. [§21 Audit Log](#21-audit-log-i̇şlem-logları).

- **DB Trigger veya Prisma Middleware** ile yakalanır.
- `activity_logs` tablosuna yazılır.
- **Asla silinemez/değiştirilemez** (DB seviyesinde `UPDATE`/`DELETE` izni revoke edilir; append-only).
- `old_value` ve `new_value` JSON olarak saklanır.

### 6.4. Soft Delete ve Arşivleme

**Soft Delete:**
- Tüm domain tablolarında `deleted_at: DateTime?` ve `deleted_by: String?` kolonları.
- Prisma middleware: `findMany`/`findUnique` çağrılarında `deleted_at IS NULL` filtresi otomatik eklenir.
- "Çöp kutusu" / "geri al" senaryosu mümkündür (politika kararı sonrası).

**Arşivleme:**
- Tamamlanan **projeler** (V6/Master) aktif görünümden çıkar, arşive taşınır.
- Arşivdeki kayıtlar **aramada erişilebilir kalır** (categorized search'te ayrı sekme önerilir).
- Arşivleme manuel onayla yapılır (otomatik kapatmak yasak; bkz. §9).

### 6.5. RBAC + Permissions Uygulama Stratejisi

- **Middleware seviyesinde** route bazlı koruma (Next.js middleware + better-auth session).
- **Service seviyesinde** `requirePermission(user, 'task.approve', context)` çağrıları.
- **DB seviyesinde** Row-Level Security (RLS) opsiyonel ama önerilir (özellikle PRIVATE görevlerde).
- Vekalet: efektif izin = `user.permissions ∪ delegated_permissions(active_delegation)`.

---

## 7. PROJE MİMARİSİ

### 7.1. Tanım

**Proje:** Birimlerin ana iş kalemlerini gruplandıran çatı yapı (V4). Bir proje:
- 1+ birime aittir (cross-functional).
- N adet göreve sahiptir (görevler bağımsız da olabilir, projectId NULL).
- Bir dosya havuzu içerir.
- Proje sahibi (creator) + üyeler (members) listesi tutar.
- Manuel kapatma sürecine tabidir.

### 7.2. Cross-Functional Yapı

- Bir proje birden fazla birime üye personel barındırabilir.
- Proje sahibi birim, **dışındaki** birimlerden personel ekleyebilir.
- Üye eklenirken üyenin birim müdürünün onayı gerekip gerekmediği **açık soru** (bkz. §30).

### 7.3. Proje Başlatma Yetkisi

- **ADMIN (Kaymakam):** her birim için.
- **UNIT_MANAGER:** kendi birimi için.
- **EMPLOYEE:** proje başlatma yetkisi yoktur (sadece bağımsız görev veya kendisine açılan projedeki alt görev).

### 7.4. Proje Dosya Havuzu

- Projeye bağlı tüm görevlerde paylaşılan **veya** doğrudan proje düzeyinde yüklenen dosyalar **konsolide** olarak proje ana sayfasında görünür.
- Dosyalar görev bazında da yüklenebilir; "Project Files" view'ı bunların birleşik halidir.
- Storage soyutlaması (Local/MinIO/S3) ile arka uçta saklanır.
- Dosya silme: soft delete + audit log.

### 7.5. Manuel Proje Kapatma

- **Tüm leaf-node görevler tamamlandığında** sistem statüyü otomatik kapatmaz.
- Üst amire (Birim Müdürü veya Kaymakam) **"Kapatılabilir Projeler"** bildirimi gider.
- Manuel onay ile arşive taşınır (`status = ARCHIVED`).
- Bu, kamu yönetiminde "raporlama-değerlendirme-resmi kapatma" döngüsünün dijital karşılığıdır.

### 7.6. Proje Statü Modeli (Önerilen)

| Statü | Anlam |
|---|---|
| `DRAFT` | Henüz başlatılmamış. |
| `ACTIVE` | Aktif çalışma. |
| `ON_HOLD` | Geçici durdurma. |
| `READY_TO_CLOSE` | Tüm leaf görevler bitti, kapatma onayı bekliyor. |
| `CLOSED` (veya `ARCHIVED`) | Resmi kapatıldı, arşivde. |

### 7.7. Proje Üyelik Modeli

- `project_members(project_id, user_id, role_in_project)` çoktan-çoğa.
- Role örnekleri: `OWNER`, `MEMBER`, `OBSERVER` (proje düzeyinde, kurumsal RBAC ile dik).

---

## 8. GÖREV MİMARİSİ

### 8.1. Görev Tipleri

| Tip | Tanım |
|---|---|
| **Proje Görevi** | `projectId` doludur. |
| **Bağımsız Görev** | `projectId = NULL`. Yine atanır, takip edilir. |

### 8.2. Görev Görünürlüğü

| Görünürlük | Erişim Kapsamı |
|---|---|
| **PRIVATE** | Yalnızca **oluşturan** ve **atanan**. Birim müdürü dahil **hiç kimse** görmez. |
| **UNIT** | Birim müdürü ve birimdeki yetkili personel izleyebilir. |

**Önemli senaryo:** Hassas/kişisel/ön araştırma niteliğindeki görevler (örn. bir personelin kendi performans değerlendirmesi için tuttuğu hatırlatmalar) PRIVATE olarak işaretlenir.

> **Sapma uyarısı:** V6/Master'da PRIVATE/UNIT eksenine ek olarak "PROJECT" görünürlüğü açıkça yazılmamış olsa da, projeye dahil olmayan birim üyelerinin proje görevlerini görüp göremeyeceği **netleştirilmelidir** (bkz. §30 Açık Sorular).

### 8.3. Hiyerarşi (Parent / Child) — Maksimum 2 Seviye

- Görev → Alt Görev (child).
- Alt görev altında **alt-alt görev YOK** (yasak).
- Amaç: aşırı kırılım, "ağaç içinde kaybolma" probleminden kaçınmak. Kamu işlerinde 2 seviyenin yetkin olduğu varsayımı.

### 8.4. Bağımlılık (Dependency) — N:M

- `task_dependencies(task_id, depends_on_task_id, type)` tablosu.
- "A bitmeden B başlayamaz" ilişkisi.
- Hiyerarşiden bağımsız: child task başka bir parent'ın child'ına bağımlı olabilir.
- **Cycle (döngü) önleme:** ekleme anında graf taraması, döngü tespit edilirse reddetilir.

### 8.5. Hiyerarşi vs Bağımlılık — Kavramsal Ayrım

| Boyut | Hiyerarşi | Bağımlılık |
|---|---|---|
| **Amaç** | İş kırılımı (decomposition) | İş sıralaması (sequencing) |
| **Yapı** | Ağaç (max 2 seviye) | Yönlü asiklik graf (DAG) |
| **İlerleme Etkisi** | Parent ilerlemesi child'lardan hesaplanır | Bağımlı görev dependency biten kadar başlatılamaz |
| **Tablo** | `tasks.parent_id` (self-referansh) | `task_dependencies` (N:M) |

### 8.6. Görev Statü Modeli

| Statü | Anlam |
|---|---|
| `TODO` | Atandı ama başlamadı. |
| `IN_PROGRESS` | Aktif çalışma. |
| `BLOCKED` | Bir BLOCKER nedeniyle (Derkenar tipi) durdu. |
| `PENDING_APPROVAL` | Memur onaya sundu. |
| `APPROVED` (veya `DONE` / `CLOSED`) | Müdür onayladı, görev kapandı. |
| `REVISION` | Müdür reddetti, memura geri döndü. |
| `DELAYED` | Süre aştı (otomatik). |
| `CANCELLED` | İptal (manuel + audit). |

### 8.7. Görev Alanları (Önerilen Şema)

```
Task {
  id: cuid
  projectId: String?  // null → bağımsız
  parentId: String?   // null → top-level
  unitId: String      // hangi birime ait
  createdById: String
  assigneeId: String?
  visibility: Visibility   // PRIVATE | UNIT
  title: String
  description: String      // markdown/rich text
  status: TaskStatus
  priority: Priority       // LOW | NORMAL | HIGH | CRITICAL
  deadline: DateTime?
  startDate: DateTime?
  progress: Int (0-100)    // leaf değilse türetilmiş
  riskLevel: RiskLevel     // NORMAL | RISKY | DELAYED (SLA)
  templateId: String?      // hangi şablondan üretildi
  recurringRuleId: String?
  createdAt: DateTime
  updatedAt: DateTime
  deletedAt: DateTime?
  deletedById: String?
}
```

---

## 9. İLERLEME VE OTOMASYON KURALLARI

### 9.1. Leaf-Node Odaklı Hesaplama

- Bir parent görevin ilerlemesi, child'larının (leaf node'ların) tamamlanma oranıdır.
- Formül: `progress = (completed_leaf_count / total_leaf_count) * 100`.
- "Completed" tanımı: `status ∈ {APPROVED, DONE, CLOSED}`.

### 9.2. Proje İlerlemesi

- Projedeki **tüm leaf-node** görevler dikkate alınır.
- Parent görevler hesaplamada **doğrudan** sayılmaz (yalnızca türetilmiş progress'leri vardır).
- Bağımsız görevler proje hesaplamasında yer almaz.

### 9.3. Manuel Proje Kapatma

- Tüm leaf görevler `APPROVED`/`DONE` olduğunda statü otomatik **değişmez**.
- Üst amire "Kapatılabilir Projeler" bildirimi gönderilir (Inbox + Toast + opsiyonel email).
- Üst amir manuel olarak `CLOSED` durumuna alır.

### 9.4. Recompute Tetikleyicileri

- `TASK_COMPLETED` event'i → parent task progress recompute → parent'ın parent'ı varsa proje progress recompute.
- `TASK_DELETED` (soft) → recompute (silinen görev hesaba katılmaz).
- `TASK_STATUS_REVERTED` (örn. APPROVED'dan REVISION'a) → recompute.

### 9.5. Veri Tutarlılığı

- Recompute **transactional** olmalıdır.
- Optimistic UI: TanStack Query ile UI'da hemen güncelle, server confirm gelince doğrula.
- İlk tasarımda **eventually consistent** dashboard sayaçları kabul edilebilir; gerçek zamanlı **WebSocket / SSE** sonraki faza bırakılabilir.

---

## 10. SLA / RİSK YÖNETİMİ

### 10.1. Renk Kodları (V6)

| Renk | Anlam | Kural |
|---|---|---|
| 🟢 **NORMAL** | Yeterli süre var | `remaining_time > 25% * total_time` |
| 🟡 **RISKY** | Süre azalıyor | `remaining_time <= 25% * total_time` ve `> 0` |
| 🔴 **DELAYED** | Süre doldu | `remaining_time <= 0` |

> **V1 ile uyum:** "Sürenin dolmasına %25 kala uyarı" V1'de tanımlandı. V6 bunu görsel SLA kategorisine dönüştürdü.

### 10.2. Otomatik Eskalasyon Akışı

1. Cron / scheduled job dakikada bir çalışır.
2. `deadline < now` ve `status ∉ {APPROVED, CANCELLED}` görevler tespit edilir.
3. Statü `DELAYED` olarak işaretlenir.
4. `TASK_DELAYED` event'i fırlatılır.
5. Bildirim:
   - **Atanan personele** in-app + push.
   - **Birim Müdürüne** in-app + push.
   - Belirli eşiği aşan gecikmelerde **Kaymakam'a** raporlama (dashboard widget).

### 10.3. İş Yükü (Workload) Analizi

V6'da gelen **proaktif** kontrol:
- Bir personele yeni görev atanırken sistem mevcut **açık** ve **kritik** iş yükünü analiz eder.
- Eşik aşılıyorsa atayıcıya uyarı: *"Bu personelin mevcut iş yükü yüksek (5 kritik açık görev). Yine de atamak istiyor musunuz?"*
- Eşik politikası **konfigüre edilebilir** olmalı (örn. role bazlı, birim bazlı).

---

## 11. ONAY MEKANİZMASI (Maker-Checker)

### 11.1. Akış (V1 → V6 boyunca tutarlı, V3'te Sonner Toast eklendi)

```
┌────────────────────────────┐
│  EMPLOYEE: "Onaya Sun"     │
└────────────┬───────────────┘
             ▼
   status = PENDING_APPROVAL
   event: TASK_SUBMITTED_FOR_APPROVAL
             ▼
   Sonner Toast (memura): "Onaya gönderildi"
   In-app + Push (müdüre): "Onay bekleyen yeni iş"
             ▼
   Müdür "Onay Bekleyenler" sekmesinde görür
             ▼
        ┌─────────────────────────┐
        │  Karar                  │
        └─┬──────────────────┬────┘
          │                  │
       ONAYLA              REDDET
          │                  │
          ▼                  ▼
   status = APPROVED   status = REVISION
   görev arşive        gerekçe zorunlu
   audit log + event   Memura bildirim
                       audit log + event
```

### 11.2. Maker-Checker İlkesi (V6'daki Açık Vurgu)

- Aynı kişi hem maker hem checker olamaz.
- Memur kendi görevini onaylayamaz.
- Müdür kendi açtığı (kendisinin assignee olduğu) görevde **ek bir checker** gerektirir → Kaymakam veya başka müdür.

### 11.3. Red Gerekçesi

- `rejection_reason: String` (zorunlu, en az N karakter).
- Otomatik bir **Derkenar (Annotation)** olarak görev içine `WARNING` tipinde eklenmesi önerilir → kurum hafızası.

### 11.4. Onay Sonrası

- `status = APPROVED`.
- Görev "arşive alınır" — bunun anlamı: aktif listelerden çıkar; aramalarda görünür.
- Audit log: `{"action": "APPROVE", "by": ..., "task_id": ..., "timestamp": ...}`.
- Parent task ve proje progress recompute.

---

## 12. VEKALET MODÜLÜ

### 12.1. Amaç

İdarecilerin (Kaymakam, Birim Müdürleri) izinli/görevli olduğu zaman dilimlerinde sistemin tıkanmaması.

### 12.2. Çalışma Şekli

- Kullanıcı `[start, end]` tarih aralığı için yetkilerini başka bir kullanıcıya devreder.
- Sistem **her etkili izin kontrolünde** aktif vekaletleri kontrol eder:
  - `effective_permissions(user) = own_permissions ∪ Σ(delegated_permissions where active)`
- Vekaleten yapılan işlemler **çift kayıt** ile loglanır:
  - Audit log entry: `{ "actor_id": Y, "on_behalf_of": X, "action": ..., "timestamp": ... }`
  - UI'da görüntü: *"X adına Y tarafından yapılmıştır"*.

### 12.3. Veri Modeli (Önerilen)

```
Delegation {
  id            String   @id @default(cuid())
  delegatorId   String   // X (devreden)
  delegateeId   String   // Y (alan)
  startDate     DateTime
  endDate       DateTime
  scope         Json?    // hangi izinler/birimler (opsiyonel)
  reason        String?
  status        DelegationStatus  // ACTIVE, EXPIRED, REVOKED
  createdAt     DateTime @default(now())
  revokedAt     DateTime?
  revokedById   String?
}
```

### 12.4. Ek Senaryolar

- **Acil iptal:** Devreden kullanıcı vekaleti `endDate`'den önce sonlandırabilir (`status = REVOKED`).
- **Otomatik bitiş:** `endDate` geldiğinde scheduler `EXPIRED` yapar; `DELEGATION_EXPIRED` event'i.
- **Çakışma:** Aynı `delegatorId` için aktif iki vekalet olamaz (DB constraint + service kontrol).
- **Yetkinin yetkiye verilmesi:** Vekaleten alan kişi **kendi** vekaleti yapamaz (zincir devre dışı).

---

## 13. BİLDİRİM MERKEZİ VE INBOX

### 13.1. Tasarım Felsefesi (V6)

- **Inbox** = "yapılması/görmesi gereken" filtrelenmiş bildirimler. **Push-spam değil**, kullanıcı odaklı.
- Kullanıcı tercihleri (Notification Preferences) ile kanal yönetimi:
  - In-app (zorunlu varsayılan).
  - Push (PWA push notifications).
  - E-posta (kritik eskalasyonlar için önerilir).

### 13.2. Bildirim Kategorileri

| Kategori | Örnek |
|---|---|
| **Atama** | "Size yeni görev havale edildi." |
| **Onay** | "Onayınızı bekleyen 1 yeni görev var." |
| **Red** | "Görev revizyonda: <gerekçe>." |
| **Eskalasyon** | "Görev gecikmiş: <görev adı>." |
| **Vekalet** | "Bugünden itibaren X adına yetkilisiniz." |
| **Watcher** | "İzlediğiniz görevde yeni Derkenar." |
| **Sistem** | "Tamamlanan proje X kapatma onayı bekliyor." |

### 13.3. Bildirim Veri Modeli (Önerilen)

```
Notification {
  id          String
  userId      String
  type        NotificationType
  title       String
  body        String
  link        String?     // ilgili sayfa
  payload     Json?
  readAt      DateTime?
  createdAt   DateTime
}
```

### 13.4. Sonner Toast Entegrasyonu (V3)

- Tüm anlık geri bildirim "X başarılı / Y hatası / Z uyarısı" Sonner ile.
- Kalıcı bildirimler Inbox'ta tutulur; Toast sadece anlık.

---

## 14. İZLEYİCİ (WATCHER) SİSTEMİ

### 14.1. Tanım (V6)

- Bir kullanıcı, sorumlu olmadığı bir görevi **izlemeye alabilir** ("Watch" butonu).
- İzlenen görevde olan değişiklikler (statü, atanan, derkenar, dosya) izleyiciye bildirim olarak düşer.

### 14.2. Veri Modeli (Önerilen)

```
TaskWatcher {
  taskId    String
  userId    String
  createdAt DateTime
  @@id([taskId, userId])
}
```

### 14.3. Bildirim Filtresi

- Watcher bildirimleri **özet** olarak gönderilir (her küçük yorumda spam yapma).
- Önerilen: sadece kritik event'lerde (statü değişimi, derkenar, dosya, gecikme) bildirim — yorum/küçük edit'lerde değil.

---

## 15. TEKRARLAYAN GÖREVLER (Recurring Tasks)

### 15.1. İhtiyaç (V6)

Rutin kamu görevleri:
- **Haftalık:** Pazartesi koordinasyon toplantısı raporu.
- **Aylık:** Ay sonu denetim formu.
- **Yıllık:** Bayram töreni hazırlığı.

### 15.2. Veri Modeli

```
RecurringRule {
  id          String
  templateId  String?  // hangi şablonu kullansın
  cron        String   // CRON ifadesi (veya yapılandırılmış schedule)
  ownerId     String   // hangi kullanıcı/birim adına oluşur
  unitId      String?
  startDate   DateTime
  endDate     DateTime?
  active      Boolean
  lastFiredAt DateTime?
  ...
}
```

### 15.3. Şablon Bağlantısı

- Recurring rule, bir Görev Şablonu'na (bkz. §18) referans verir.
- Tetiklendiğinde şablondan yeni `Task` instance'ı yaratır + ilgili kullanıcıya atar.

---

## 16. ATAMA KURALLARI (Assignment Rules)

### 16.1. Tanım (V6 örtük)

> "*Belirli departmanlara düşen işler için Assignment Rules modülleri bulunur.*"

Anlamı: kuralın koşullarını sağlayan görevler **otomatik** olarak hedef birime/personele atanır.

### 16.2. Örnek Kurallar

- *"Konu = `Beyaz Masa Şikayeti` ise Yazı İşleri Birimi → Memur A."*
- *"Tag = `Kırsal Hizmet` ise → Köylere Hizmet Birim Müdürü."*

### 16.3. Veri Modeli (Önerilen)

```
AssignmentRule {
  id          String
  name        String
  conditions  Json    // tag/category/title regex/...
  target      Json    // unitId / userId / round-robin set
  priority    Int     // birden fazla kural eşleşirse hangisi öncelikli
  active      Boolean
}
```

### 16.4. Çakışma & Override

- Birden fazla kural eşleşirse `priority` belirler.
- Manuel atama her zaman kuralın üzerindedir (manual override).

---

## 17. TOPLU İŞLEMLER (Bulk Operations)

### 17.1. Kapsam (V6 / Master)

TanStack Table'da çoklu satır seçimi → toplu eylem:
- Toplu atama (assignee değişikliği).
- Toplu durum değişikliği.
- Toplu etiket (tag) ekleme.
- Toplu silme (soft delete).
- Toplu deadline güncelleme.

### 17.2. UX Önerileri

- Seçilen sayı header'da gösterilir.
- Aksiyon menüsü "context bar" şeklinde alt veya üstte sabit.
- Sonner toast ile sonuç + **Undo** aksiyonu (5 sn).

### 17.3. Audit

- Bulk işlem **tek bir** `bulk_operation_id` ile gruplanır; tek tek audit kayıtları bu id ile bağlanır → "geri al" mümkün.

---

## 18. GÖREV ŞABLONLARI

### 18.1. Tanım (V1)

Rutinleşmiş kamu görevleri için önceden tanımlı:
- Alt görev seti.
- Açıklamalar.
- Kontrol listeleri.
- Varsayılan atayıcı/atanan/etiketler/deadline offset.

### 18.2. Örnekler

- "Bayram Töreni Hazırlığı"
- "Haftalık Koordinasyon Toplantısı"
- "Yıllık Denetim Raporu"

### 18.3. Veri Modeli

```
TaskTemplate {
  id              String
  name            String
  description     String
  ownerUnitId     String?
  defaultPriority Priority
  defaultDeadlineOffsetDays Int
  subtaskBlueprints Json   // [{title, description, ...}]
  checklist       Json
  tags            String[]
  active          Boolean
  createdById     String
  createdAt       DateTime
}
```

### 18.4. Kullanım

- Yeni görev oluşturma sihirbazında "Şablondan başlat" seçeneği.
- Recurring rule içinden referans.

---

## 19. KURUMSAL HAFIZA: DERKENAR SİSTEMİ (Annotation)

V5'in en kritik kavramsal eklentisi.

### 19.1. Yorum vs Derkenar Ayrımı

| Boyut | **Yorum (Comment)** | **Derkenar (Annotation)** |
|---|---|---|
| **Amaç** | Anlık iletişim, sohbet ("Dosyayı yükledim") | Kalıcı bağlamsal not, resmi açıklama, karar defteri |
| **Karakter** | Hızlı, geçici, akışkan | Sabitlenebilir, zengin metin, etiketli |
| **Düzenleme** | Yazıldığı gibi kalır (veya kısa pencere) | Versiyonlu (snapshot) düzenlenebilir |
| **Pin** | Yok | Var (`isPinned`) |
| **Format** | Plain/markdown | Rich text (HTML/Markdown), tablo, dosya gömme |
| **Aramada** | Dahil ama düşük öncelik | Ayrı kategori (📝 DERKENARLAR) |
| **Karar Değeri** | Yok | Resmi (DECISION tipinde) |

### 19.2. Derkenar Tipleri (V5 + V6)

| Tip | Anlamı | UI Renk/İkon (Önerilen) |
|---|---|---|
| **DECISION** | Toplantı/üst makam kararları | 🟦 Mavi |
| **WARNING** | Süreçle ilgili dikkat edilmesi gereken hususlar | 🟧 Turuncu |
| **BLOCKER** | İlerlemeyi durduran iç/dış etkenler ("Belediye onayı bekleniyor") | 🟥 Kırmızı |
| **INFO** | Genel bağlamsal açıklamalar | 🟩 Yeşil |
| **NOTE** (V5 schema'da) | Genel not | ⬜ Nötr |

### 19.3. Veri Modeli (V5 schema, korunmalı)

```prisma
model TaskNote {
  id          String   @id @default(cuid())
  taskId      String
  authorId    String
  title       String?
  content     String   // Rich text format (HTML/Markdown)
  type        NoteType // DECISION, WARNING, BLOCKER, INFO, NOTE
  isPinned    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 19.4. Versiyonlama (V6)

- Her düzenleme bir **snapshot** kaydı oluşturur (`task_note_versions` tablosu).
- Ulaşılabilir: kim, ne zaman, ne yazdı, neyi neye değiştirdi.
- Snapshot **immutable**.

### 19.5. BLOCKER Derkenarı ile Statü Bağlantısı

- `BLOCKER` tipinde bir derkenar açıldığında görev statüsü otomatik `BLOCKED` yapılabilir (politika kararı).
- Engel kalktığında Derkenar `resolved` işaretlenir → statü `IN_PROGRESS`'e döner.

### 19.6. Aramada Yer Alması

- Categorized search'te (Ctrl+K) ayrı sekme: 📝 DERKENARLAR.
- Görev içine girmeden doğrudan kurum hafızasında arama yapılabilir.

---

## 20. GLOBAL ARAMA MOTORU (Ctrl+K)

### 20.1. Felsefe

> **Çekirdek düzey:** kullanıcının yetki sınırları çerçevesinde **görebildiği TÜM verileri** (görev başlıkları, açıklamalar, yorumlar, derkenarlar, ekli dosyalar, log kayıtları) tarayabilen bir arama motoru.

### 20.2. Kategoriler

Sonuçlar **simgelerle** ayrıştırılır (V4 + V5):

- 📁 **PROJELER**
- ✅ **GÖREVLER**
- 📝 **DERKENARLAR**
- 📄 **DOSYALAR**

> Yorumlar (Comments) opsiyonel olarak ayrı kategori veya görev sonuçlarına nested olarak eklenebilir.

### 20.3. Implementasyon Stratejisi

| Faz | Yaklaşım |
|---|---|
| **Faz 1 (MVP)** | Frontend fuzzy search (Fuse.js, lokal index — sadece görünür/cache'lenmiş veri için). |
| **Faz 2** | PostgreSQL Full-Text Search (`tsvector`, `tsquery`, GIN index). |
| **Faz 3** | Elasticsearch / Meilisearch (ölçek + tipo toleransı + relevance tuning). |

> V4'te söz edilen "*Arama mimarisi frontend fuzzy search ile başlayacak ancak servis seviyesinde backend entegrasyonuna hazır (abstracted) tutulacaktır*" — abstraction ile kademeli geçiş garantilenir.

### 20.4. Yetki Filtresi (Kritik)

- Arama indeksi kullanıcı yetkisinden bağımsız tutulur, ama **sorgu sonrası** RBAC filtresi uygulanır.
- PRIVATE görevler indekste olabilir ama yalnızca `creator` veya `assignee` görür.
- Birim filtreleri unit_id bazlı uygulanır.
- Vekalet aktifse efektif izinler vekalet kapsamına genişler.

### 20.5. Performans

- Veritabanı seviyesinde indeksleme (V2: "milisaniyelik sonuçlar").
- Sorgu cache'i (TanStack Query + server response cache).
- `LIMIT 20` per category önerilir; "View all" ile detay.

---

## 21. AUDIT LOG (İŞLEM LOGLARI)

### 21.1. Felsefe

Her veritabanı değişikliği yakalanır, **immutable** olarak saklanır.

### 21.2. Yakalama Noktası

- **Tercihen** Prisma Middleware (V1).
- **Veya** DB Trigger (V6'da alternatif olarak gösterildi).
- **Veya** her iki yöntemin kombinasyonu (uygulama seviyesi + DB safety net).

### 21.3. Schema (V1-V6 evrim)

```json
{
  "action": "UPDATE",
  "model": "Task",
  "userId": "user_id_123",
  "diff": {
    "status": { "from": "IN_PROGRESS", "to": "DELAYED" }
  },
  "timestamp": "2026-05-01T14:00:00Z"
}
```

V2/V6 ekleri:
- **`old_value`** ve **`new_value`** ayrı alanlar (V2).
- **`actor_id`** + **`on_behalf_of_id`** (vekalet için).
- **`ip`**, **`user_agent`**, **`session_id`** (forensic için önerilir).
- **`bulk_operation_id`** (toplu işlem grubu için).

### 21.4. Önerilen Tablo

```
ActivityLog {
  id              String   @id @default(cuid())
  action          String   // CREATE | UPDATE | DELETE | APPROVE | REJECT | ...
  model           String   // Task | Project | TaskNote | ...
  entityId        String
  actorId         String
  onBehalfOfId    String?  // vekalet
  oldValue        Json?
  newValue        Json?
  diff            Json?
  ip              String?
  userAgent       String?
  sessionId       String?
  bulkOperationId String?
  timestamp       DateTime @default(now())
}
```

### 21.5. Immutable Politika

- DB seviyesinde `UPDATE`/`DELETE` izni **uygulama kullanıcısına verilmez** (sadece owner DBA).
- Append-only.
- Yedekleme: regular DB backup yeterli; ek olarak **WORM** (Write Once Read Many) storage opsiyonel.

### 21.6. Erişim Kontrolü

- Audit log **sadece ADMIN** + **denetim rolü** tarafından görüntülenebilir.
- Personel kendi yaptığı işlemleri görebilir (kişisel günlük); başkalarınınkini göremez.

---

## 22. CORE ERROR MONITOR

### 22.1. Felsefe

> *"Kullanıcı nerede ne yaparken bu hatayı aldı?"* sorusuna yanıt veren mekanizma (V2).

### 22.2. Kayıt Türleri

| Tür | Örnek | Kaynak |
|---|---|---|
| **Kritik Hatalar** | 500, sistem kırılması | Stack trace + request id. |
| **Validasyon Uyarıları** | Form alanı yanlış doldurma | **Zod** hata mesajları (V3). |
| **Bağlam Verisi** | Sayfa yolu, tıklanan buton, session | UI tarafından gönderilir. |

### 22.3. Hedef

- **UX iyileştirmesi** (formun hangi alanı sürekli yanlış dolduruluyor?).
- **Geliştirici tarafı debug**.
- **Güvenlik** (anomali tespiti — opsiyonel ileri faz).

### 22.4. Implementasyon Önerisi

- Frontend: window.onerror + React error boundary + fetch interceptor → POST /errors.
- Backend: Express/Next route handler error middleware.
- Saklama: `error_logs` tablosu (audit log'tan ayrı, çünkü hassasiyet farklı).

### 22.5. Saklama Politikası

- Audit gibi immutable olmasına gerek yok.
- N gün sonra arşivlenebilir (örn. 90 gün → cold storage).

---

## 23. KULLANICI DENEYİMİ (UX) VE LAYOUT

### 23.1. Layout (V1-V6 boyunca tutarlı)

```
┌────────────────────────────────────────────────────────────────────┐
│ HEADER: Global Search (Ctrl+K)  [Hızlı Görev Oluştur]  [Inbox] [👤]│
├──────────┬─────────────────────────────────────────┬───────────────┤
│          │                                         │               │
│ SIDEBAR  │           MAIN WORKSPACE                │  RIGHT DRAWER │
│          │           (TanStack Table /             │  (Off-Canvas) │
│ Birim    │            Liste / Kanban)              │               │
│ Bazlı    │                                         │   - Detay     │
│ Menü     │                                         │   - Yorumlar  │
│          │                                         │   - Derkenar  │
│ Kişisel  │                                         │   - Dosyalar  │
│ İş       │                                         │   - Loglar    │
│ Listesi  │                                         │               │
│          │                                         │               │
└──────────┴─────────────────────────────────────────┴───────────────┘
```

### 23.2. Bileşen Detayları

| Bölge | İçerik |
|---|---|
| **Header** | Logo, Global arama, Hızlı görev oluştur, Bildirimler (badge), Profil. |
| **Sidebar** | Dashboard, Birimim, Bana Atananlar, Onay Bekleyenler (UNIT_MANAGER), Gecikmiş, Arşiv, Ayarlar. |
| **Main Workspace** | Liste/Tablo görünümü; mobile'da kart yığını. Filtreler, sıralama, bulk seçim. |
| **Right Drawer** | Görev detayı **off-canvas** açılır (sayfa değişmez, bağlam korunur). Tab'lar: Detay / Yorumlar / Derkenarlar / Dosyalar / Loglar. |

### 23.3. UX İlkeleri

1. **Bağlamı bozma:** Görev tıklamasında URL değişebilir (deep link) ama kullanıcı **listeyi kaybetmez** (drawer kullanır).
2. **Klavye-ilk:** Ctrl+K arama, J/K navigation, E (edit), A (assign) gibi shortcut'lar (gelecek faz).
3. **Geri bildirim her aksiyonda:** Sonner toast ile (V3).
4. **Yükleme durumları:** Skeleton loading (Shadcn).
5. **Empty states:** Anlamlı boş durum (örn. "Henüz onay bekleyen iş yok 🎉").
6. **Hata durumları:** Error boundary + Core Error Monitor'e gönder + kullanıcıya dostane mesaj.
7. **Erişilebilirlik:** Shadcn (Radix tabanlı) → ARIA, keyboard nav, screen reader uyumlu.

### 23.4. Görev Listesi Görselleştirme

- TanStack Table satırlarında:
  - **Progress Bar** (% değer ile).
  - **SLA Badge** (🟢 / 🟡 / 🔴).
  - **Atanan avatar(lar)**.
  - **Deadline** (relative time: "2 gün içinde").
  - **Tag chip'leri**.

### 23.5. Hızlı Görev Oluştur

- Header'da global butondan modal açılır.
- Şablondan başlat seçeneği.
- Validasyon (Zod) hataları inline.
- Submit → Toast + drawer'a yönlendir.

---

## 24. MOBILE-FIRST VE PWA STRATEJİSİ

### 24.1. Mobile-First İlkesi

- İlk tasarım her zaman mobil için yapılır.
- Masaüstü "fazla yer var, daha çok bilgi göster" yaklaşımı ile zenginleştirilir.
- Mobil → dikey kart yapısı; masaüstü → tablo.

### 24.2. PWA Kapsamı (V1-V3, Master)

| Özellik | MVP | İleri Faz |
|---|---|---|
| Ana ekrana ekleme (Add to Home) | ✓ | ✓ |
| Offline cached liste görüntüleme | ✓ | ✓ |
| Offline yazma + sync | — | ✓ (kuyruğa al, online olunca gönder) |
| Push notification | — / opsiyonel | ✓ |
| Native-app benzeri UX | ✓ | ✓ |

### 24.3. Service Worker Stratejisi

- **Network-first** (taze veri öncelikli, çevrimdışıysa cache).
- API çağrıları için **stale-while-revalidate** uygun.
- Statik varlıklar için **cache-first**.

### 24.4. Manifest

- Theme color, splash screen, icon set (192/512).
- `display: standalone`.
- App ID, name, short_name net belirlenmeli.

---

## 25. DOSYA YÖNETİMİ VE STORAGE SOYUTLAMASI

### 25.1. Soyutlama (V1)

```typescript
interface IStorageProvider {
  upload(file: Buffer | Stream, key: string, metadata?: object): Promise<UploadResult>
  download(key: string): Promise<Buffer | Stream>
  delete(key: string): Promise<void>
  getSignedUrl(key: string, expiresIn?: number): Promise<string>
  exists(key: string): Promise<boolean>
}
```

### 25.2. Sağlayıcılar

| Sağlayıcı | Kullanım Senaryosu |
|---|---|
| **LocalFileSystemProvider** | Dev / küçük kurum / on-prem. |
| **MinioProvider** | Self-hosted S3 uyumlu — kurum içi. |
| **S3Provider** | Public cloud (AWS S3 / DigitalOcean Spaces / Cloudflare R2). |

### 25.3. Konfigürasyon

ENV değişkenleri:
```
STORAGE_PROVIDER=local|minio|s3
STORAGE_LOCAL_PATH=./uploads
STORAGE_MINIO_ENDPOINT=...
STORAGE_MINIO_ACCESS_KEY=...
STORAGE_S3_BUCKET=...
STORAGE_S3_REGION=...
```

### 25.4. Dosya Politikaları

- Max boyut (örn. 50 MB tek dosya, 200 MB bir görev üzerine toplam — politika).
- İzinli MIME türleri (resmi belge formatları + ofis dosyaları + resim + PDF).
- Antivirüs taraması (önerilir, ileri faz).
- Görüntüleme: signed URL (kısa expiry).

### 25.5. Proje Dosya Havuzu

- Görev bazlı yüklenen dosyalar otomatik proje havuzunda görünür (V4).
- Doğrudan proje seviyesinde de yüklenebilir.
- Dashboard'da: "Proje X — 47 dosya, 320 MB".

---

## 26. DASHBOARD VE GÖRSELLEŞTİRME

### 26.1. Rol Bazlı Widget'lar (V6)

| Rol | Widget Setleri |
|---|---|
| **ADMIN (Kaymakam)** | Tüm birim ilerlemeleri, gecikmiş işler, eskalasyon raporları, kapatılabilir projeler, yüksek-risk personel iş yükü. |
| **UNIT_MANAGER** | Birim ilerlemesi, onay bekleyenler, ekibim — açık işler, gecikmeler, watcher özetleri. |
| **EMPLOYEE** | Bana atananlar, yaklaşan deadlineler, revizyondaki işlerim, bildirimlerim. |

### 26.2. Görselleştirme Bileşenleri

- **Progress Bar** (proje + parent task) — ince, % yüzde değeriyle.
- **SLA Badge** (🟢🟡🔴).
- **Stat card** (sayısal: "12 açık görev").
- **Trend chart** (haftalık tamamlama trendi — opsiyonel).
- **Kanban / Liste / Tablo** geçişi (kullanıcı tercihi).

### 26.3. TanStack Table Özellikleri

- Server-side pagination.
- Sıralama, çoklu filtre.
- Çoklu seçim → bulk operations.
- Custom cell renderer (progress bar, badge, avatar).

---

## 27. VERİ MODELİ (Konsolide Şema)

> Aşağıdaki şema, V1-V6 boyunca dağınık olarak tanımlanan modellerin **konsolide** ve **önerilen** halidir. Master PRD'deki tüm kavramları kapsar.

### 27.1. Çekirdek Modeller

```prisma
// Birim
model Unit {
  id          String   @id @default(cuid())
  name        String   @unique
  code        String   @unique
  parentUnitId String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}

// Kullanıcı
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  unitId       String
  role         Role     // ADMIN | UNIT_MANAGER | EMPLOYEE
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())
  // better-auth alanları ayrıca
}

// İzinler (granüler)
model Permission {
  id    String @id @default(cuid())
  key   String @unique  // örn. "task.approve"
  description String?
}

model RolePermission {
  role         Role
  permissionId String
  @@id([role, permissionId])
}

model UserPermissionOverride {
  userId       String
  permissionId String
  granted      Boolean   // true=ekstra ver, false=role'den çıkar
  @@id([userId, permissionId])
}
```

### 27.2. Proje & Görev

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  ownerUnitId String
  status      ProjectStatus  // DRAFT | ACTIVE | ON_HOLD | READY_TO_CLOSE | CLOSED
  createdById String
  createdAt   DateTime @default(now())
  closedAt    DateTime?
  closedById  String?
  deletedAt   DateTime?
  deletedById String?
}

model ProjectMember {
  projectId   String
  userId      String
  roleInProject String  // OWNER | MEMBER | OBSERVER
  createdAt   DateTime @default(now())
  @@id([projectId, userId])
}

enum Visibility { PRIVATE UNIT }

model Task {
  id          String   @id @default(cuid())
  projectId   String?  // null = bağımsız
  parentId    String?  // max 2 seviye → child'ın child'ı yasak
  unitId      String
  createdById String
  assigneeId  String?
  visibility  Visibility @default(UNIT)
  title       String
  description String?
  status      TaskStatus
  priority    Priority   @default(NORMAL)
  deadline    DateTime?
  startDate   DateTime?
  progress    Int        @default(0)
  riskLevel   RiskLevel  @default(NORMAL)
  templateId  String?
  recurringRuleId String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?
  deletedById String?
}

model TaskDependency {
  taskId          String
  dependsOnTaskId String
  type            DependencyType @default(BLOCKS)
  createdAt       DateTime @default(now())
  @@id([taskId, dependsOnTaskId])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  BLOCKED
  PENDING_APPROVAL
  APPROVED
  REVISION
  DELAYED
  CANCELLED
}

enum Priority { LOW NORMAL HIGH CRITICAL }
enum RiskLevel { NORMAL RISKY DELAYED }
```

### 27.3. Yorum & Derkenar

```prisma
model Comment {
  id        String   @id @default(cuid())
  taskId    String
  authorId  String
  content   String
  createdAt DateTime @default(now())
  deletedAt DateTime?
}

enum NoteType { DECISION WARNING BLOCKER INFO NOTE }

model TaskNote {  // Derkenar (Annotation)
  id          String   @id @default(cuid())
  taskId      String
  authorId    String
  title       String?
  content     String   // Rich text (HTML/Markdown)
  type        NoteType
  isPinned    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TaskNoteVersion {
  id         String   @id @default(cuid())
  taskNoteId String
  snapshot   Json     // tüm alan değerlerinin o anki hali
  editedById String
  editedAt   DateTime @default(now())
}
```

### 27.4. Watcher, Bildirim, Vekalet

```prisma
model TaskWatcher {
  taskId    String
  userId    String
  createdAt DateTime @default(now())
  @@id([taskId, userId])
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String
  title     String
  body      String?
  link      String?
  payload   Json?
  readAt    DateTime?
  createdAt DateTime @default(now())
}

model NotificationPreference {
  userId      String   @id
  inApp       Boolean  @default(true)
  push        Boolean  @default(true)
  email       Boolean  @default(false)
  // tip bazlı override için ayrıca tablo eklenebilir
}

enum DelegationStatus { ACTIVE EXPIRED REVOKED }

model Delegation {
  id          String   @id @default(cuid())
  delegatorId String
  delegateeId String
  startDate   DateTime
  endDate     DateTime
  scope       Json?
  reason      String?
  status      DelegationStatus  @default(ACTIVE)
  createdAt   DateTime @default(now())
  revokedAt   DateTime?
  revokedById String?
}
```

### 27.5. Tekrarlayan Görev, Şablon, Atama Kuralı

```prisma
model TaskTemplate {
  id              String   @id @default(cuid())
  name            String
  description     String?
  ownerUnitId     String?
  defaultPriority Priority @default(NORMAL)
  defaultDeadlineOffsetDays Int?
  subtaskBlueprints Json?
  checklist       Json?
  tags            String[]
  active          Boolean  @default(true)
  createdById     String
  createdAt       DateTime @default(now())
}

model RecurringRule {
  id          String   @id @default(cuid())
  templateId  String?
  cron        String
  ownerId     String?
  unitId      String?
  startDate   DateTime
  endDate     DateTime?
  active      Boolean  @default(true)
  lastFiredAt DateTime?
  createdAt   DateTime @default(now())
}

model AssignmentRule {
  id          String   @id @default(cuid())
  name        String
  conditions  Json     // tag, kategori, regex, vs.
  target      Json     // unitId / userId / roundRobinSet
  priority    Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

### 27.6. Audit & Error

```prisma
model ActivityLog {
  id              String   @id @default(cuid())
  action          String
  model           String
  entityId        String
  actorId         String
  onBehalfOfId    String?
  oldValue        Json?
  newValue        Json?
  diff            Json?
  ip              String?
  userAgent       String?
  sessionId       String?
  bulkOperationId String?
  timestamp       DateTime @default(now())
  // append-only — DB user'a UPDATE/DELETE izni verilmez
}

model ErrorLog {
  id        String   @id @default(cuid())
  level     String   // CRITICAL | WARNING | VALIDATION
  message   String
  stack     String?
  userId    String?
  url       String?
  action    String?  // tıklanan buton / aksiyon
  payload   Json?
  sessionId String?
  createdAt DateTime @default(now())
}
```

### 27.7. Dosya

```prisma
model FileAttachment {
  id          String   @id @default(cuid())
  taskId      String?
  projectId   String?
  uploadedById String
  fileName    String
  storageKey  String   // provider'da nesne anahtarı
  size        Int      // bytes
  mimeType    String
  createdAt   DateTime @default(now())
  deletedAt   DateTime?
  deletedById String?
}
```

### 27.8. Tag (Etiket) — Önerilen

```prisma
model Tag {
  id        String  @id @default(cuid())
  name      String  @unique
  color     String?
}

model TaskTag {
  taskId String
  tagId  String
  @@id([taskId, tagId])
}
```

---

## 28. KARARLAR VE GEREKÇELERİ (Decision Log)

### 28.1. Mimari Kararlar

| # | Karar | Gerekçe | Kaynak |
|---|---|---|---|
| **D-001** | **Sabit hiyerarşi (Birim/Makam)** modeli, dinamik takım yerine. | Devlet kurumu yapısının ayna karşılığı; "takım kurma/dağıtma" karmaşası yok. | V1 §1 |
| **D-002** | RBAC ile yetkilendirme, **3 ana rol**. | Net ve anlaşılır hiyerarşi; permissions ile granülerlik (V6). | V1 §2 + V6 §2.3 |
| **D-003** | **Hiyerarşi ≠ Bağımlılık.** | İş kırılımı ile sıralamayı karıştırmamak; UI ve veri modelinde sadelik. | V4 §3 |
| **D-004** | **Max 2 seviye hiyerarşi.** | Ağaç içinde kaybolmayı önlemek; pratik kamu görevlerinin kırılım derinliği. | V4 §3.1 |
| **D-005** | **Leaf-node odaklı progress.** | Parent görevin manuel ilerleme girilmesi yanıltıcı; child'lardan türetmek tutarlı. | V4 §4 |
| **D-006** | **Manuel proje kapatma.** | Kamu yönetiminde resmi "kapatma kararı" zorunlu; otomatik kapatma yetkisiz. | V4 §4 |
| **D-007** | **PRIVATE / UNIT görünürlük.** | Hassas görevler + ekip içi şeffaflık dengesi. | V4 §2 |
| **D-008** | **Yorum (Comment) ≠ Derkenar (Annotation).** | Sohbet ile kurum kararı/uyarı/engelinin karıştırılması kurumsal hafızayı yok ediyor. | V5 §2 |
| **D-009** | **Derkenar kategorileri:** DECISION/WARNING/BLOCKER/INFO/NOTE. | Bağlamsal bilginin sınıflandırılması, aramada filtreleme. | V5 §2.1 |
| **D-010** | **API-First + Event-Driven.** | Loglama/bildirim/AI/Webhook gibi yan endişeleri ana iş kodundan ayırmak. | V6 §2 (vizyon) |
| **D-011** | **Immutable Audit Log.** | Yasal/idari denetim gereksinimi; veri bütünlüğü. | V6 §2.1 |
| **D-012** | **Soft Delete + Arşivleme** (hard delete yasak). | Geri alınabilirlik; denetim izi. | V6 §2.2 |
| **D-013** | **Vekalet "X adına Y" loglaması.** | Sorumluluğun açıkça belirtilmesi. | V1 §3.1 + V6 §6 |
| **D-014** | **Maker-Checker (memur-müdür) onay.** | Kamu yönetiminde standart kontrol mekanizması. | V1 §6 + V6 §6 |
| **D-015** | **Mobile-First + PWA.** | Saha kullanım, app store sürtünmesi yok, offline temel destek. | V1 §1, V2 §5 |
| **D-016** | **Storage Soyutlaması.** | Dağıtım esnekliği (lokal → on-prem MinIO → cloud S3). | V1 §1 |
| **D-017** | **Categorized Global Search.** | Çekirdek arama: kullanıcı yetkisi içinde her şey aranabilir, kategorize gösterilir. | V2 §3.1, V4 §5.2, V5 §4 |
| **D-018** | **Frontend fuzzy → DB FTS → ES** kademeli geçiş. | MVP hızlandırma; abstraction ile sonradan değişim ucuz. | V4 §5.2 |
| **D-019** | **better-auth** seçimi. | Modern, TypeScript-first, plugin mimarisi. | V3 §1 |
| **D-020** | **TanStack Query** seçimi. | Server state'i UI state'inden ayırma; cache invalidation otomasyonu. | V3 §1 |
| **D-021** | **RHF + Zod** seçimi. | Tek şema → form, API, TS tipi türetimi. | V3 §1 |
| **D-022** | **TanStack Table** seçimi. | Headless, pagination/sort/filter, custom cell. | V3 §1 |
| **D-023** | **Sonner Toast** seçimi. | Modern, accessible, hafif. | V3 §1 |
| **D-024** | **Shadcn UI** standardı. | Erişilebilir (Radix), kopyala-yapıştır kod sahipliği. | V2 §1 |
| **D-025** | **SLA renkleri (🟢🟡🔴).** | Görsel olarak risk anlaşılabilir; eskalasyon tetikleyici. | V6 §3.1 |
| **D-026** | **Watcher** sistemi. | Sorumlu olmayan ama izlemesi gereken kullanıcılar için. | V6 §3.2 |
| **D-027** | **Inbox merkezi bildirim.** | Spam yerine derli toplu kullanıcı odaklı bildirim deneyimi. | V6 §3.2 |
| **D-028** | **Cross-functional projeler.** | Birim sınırlarını aşan işler için. | V4 §1 |
| **D-029** | **Proje Dosya Havuzu.** | Dağılan dosyaların tek noktada konsolidasyonu. | V4 §1 |
| **D-030** | **Bağımsız görev (projectId NULL).** | Her görevin proje altında olma zorunluluğu yok. | V4 §2 |
| **D-031** | **Recurring Tasks.** | Rutin kamu işlerini el ile oluşturma yükünü kaldırır. | V6 §6 |
| **D-032** | **Assignment Rules.** | Belirli kategoriler otomatik birime/kişiye düşer. | V6 §6 |
| **D-033** | **Bulk Operations.** | Yöneticinin verimliliği için kritik. | V6 §5 |
| **D-034** | **Workload uyarısı.** | Personel aşırı yüklenmesin, üst yönetim risk alarak değil bilinçli atasın. | V6 §5 |
| **D-035** | **Off-canvas Drawer** detay görünümü. | Bağlamı bozmadan detay; kullanıcı listede kalır. | V1 §5 |

### 28.2. Politika Kararları

| # | Politika |
|---|---|
| **P-001** | Süre dolmasına %25 kala otomatik uyarı bildirimi (V1). |
| **P-002** | Süre dolduğunda görev otomatik `DELAYED` (V1 + V6 SLA). |
| **P-003** | Reddedilen görev `REVISION` statüsüne döner ve gerekçe zorunludur (V1). |
| **P-004** | Vekalet aktifse efektif izin = kendi izinler ∪ devredilen izinler. |
| **P-005** | Vekaleten alan kişi alt-vekalet veremez. |
| **P-006** | PRIVATE görev müdür dahil hiç kimseye gözükmez (sadece creator + assignee). |
| **P-007** | Tüm leaf görevler bittiğinde proje **otomatik kapanmaz**; üst amire bildirim gider. |
| **P-008** | Audit log silinemez/değiştirilemez (DB seviye). |
| **P-009** | Hard delete yasak; tüm silmeler `deleted_at` + `deleted_by`. |
| **P-010** | Maker-Checker: aynı kişi hem maker hem checker olamaz. |
| **P-011** | Bulk operation tek `bulk_operation_id` ile gruplanır → toplu undo. |

---

## 29. VERSİYONLAR ARASI SAPMA / ÇELİŞKİ ANALİZİ

> Bu bölüm, V1-V6 arasındaki ufak terminoloji ve odak farklarını **şeffaf şekilde** kayda geçirir; Master PRD'de bunlar konsolide edilmiştir.

### 29.1. Terminoloji Sapmaları

| Konu | V1-V5 Terimi | V6 Terimi | Master |
|---|---|---|---|
| Süper Admin | "Kaymakam / Özel Kalem" | "ADMIN" | Hem hem (insan rol = Kaymakam, sistem rol = ADMIN). |
| Birim Müdürü | "Birim Müdürü" | "UNIT_MANAGER" | Aynı. |
| Memur | "Birim Personeli (Memur)" | "EMPLOYEE" | Aynı. |
| Görev statüsü | "PENDING_APPROVAL", "REVISION" | Aynı + DELAYED | Aynı. |
| Süre dolmuş görev | "Gecikmiş" | "DELAYED" + 🔴 | Aynı. |

### 29.2. Odak Sapmaları

| Konu | V1-V3 | V4-V5 | V6 / Master |
|---|---|---|---|
| Storage soyutlaması | Açıkça yazıldı | Bahsedilmedi | Master'da geri yazıldı |
| PWA | Açıkça yazıldı | Bahsedilmedi | Master'da geri yazıldı |
| Mobile-first | Açıkça yazıldı | Bahsedilmedi | Master'da geri yazıldı |
| Görev şablonları | V1-V3'te detaylı | V4-V6'da bahsedilmedi | Master'da örtük |
| Core Error Monitor | V1-V3'te detaylı | V4-V6'da bahsedilmedi | Master'da bahsedilmiyor (örtük varsayılır) |

> **Sonuç:** V4-V5 spesifik konulara (proje/görev mimarisi, derkenar) odaklandığı için bazı V1-V3 başlıklarını **es geçmiştir**, kaldırmamıştır. Master PRD bu anlamı koruyup birleştirir. **Bu konsolide doküman bunu açıkça not eder.**

### 29.3. Çelişki Yok (Yapısal)

- V1'den V6'ya kadar **mimari iskelet** (Birim/Makam, Maker-Checker, Audit Log, Vekalet, Mobile-First) **tutarlı** kalmıştır.
- Hiçbir versiyonda önceki bir kararın **iptali/değişimi** yoktur — yalnızca eklemeler ve detaylandırmalar.
- Bu, PRD setinin **kümülatif** ve **breaking-change içermez** yapıda evrildiğini gösterir.

### 29.4. Netleştirilmesi Gereken Noktalar

| Konu | Sorun |
|---|---|
| `APPROVED` vs `DONE` vs `CLOSED` | V1 "kapatılır, arşive alınır" diyor. Statü adı netleştirilmeli. |
| Proje görünürlüğü | Görev için PRIVATE/UNIT var ama proje düzeyinde görünürlük yok. |
| Memur'un proje başlatma yetkisi | V4 "Kaymakam ve Müdürler" diyor ama EMPLOYEE'ye izin var mı, yok mu? |
| Cross-functional üye eklemek | Diğer birim müdürünün onayı gerekli mi? |
| BLOCKER derkenar → BLOCKED statü | Otomatik bağlantı önerildi (bu doküman) ama PRD'de net değil. |
| "Watcher" + PRIVATE | PRIVATE göreve watcher eklenebilir mi? (varsayılan: hayır.) |
| Audit log retention | Süresiz mi, regülasyona göre N yıl mı? |
| Dosya boyut/format limiti | Politika net değil. |
| Bildirim email kanalı | V6 watcher/Inbox'ta belirtildi ama sağlayıcı (SES, Mailgun, SMTP) seçimi yok. |

---

## 30. BOŞLUKLAR, AÇIK SORULAR VE ÖNERİLER

### 30.1. Eksik Konular

1. **Authentication detay:** better-auth seçildi ama 2FA, SSO (e-Devlet entegrasyonu?), password policy, session timeout net değil.
2. **e-Devlet entegrasyonu:** Mülki idare için kritik olabilir; PRD'de yok.
3. **DEAS / EBYS entegrasyonu:** Resmi yazışma sistemleri ile köprü?
4. **Raporlama / Export:** Excel/PDF export, periyodik kurum raporu?
5. **Bayram/Hafta sonu/Resmi tatil takvimi:** Deadline hesaplamada tatiller dikkate alınacak mı?
6. **Çoklu dil desteği:** Türkçe-İngilizce? (Şu an Türkçe odaklı.)
7. **Tema (Dark/Light/Sistem):** UI tercihi.
8. **Erişim logları (Login/Logout):** Audit log içinde mi, ayrı mı?
9. **Yedekleme & Disaster Recovery:** RPO/RTO hedefleri.
10. **Performans hedefleri:** SLA (örn. p95 < 500ms), eşzamanlı kullanıcı sayısı.
11. **Tahmin (estimation) ve harcanan süre (time tracking):** Görev üzerinde bir alan olacak mı?
12. **Etiket (Tag) yönetimi:** Yönetici tarafından mı tanımlanır, kullanıcı serbest mi?
13. **Takvim görünümü:** Görevlerin Gantt veya takvim üzerinde gösterimi?
14. **Test stratejisi:** Unit / Integration / E2E (Playwright?) — PRD'de yok.
15. **CI/CD:** Deploy stratejisi (zero-downtime denildi ama nasıl?).
16. **Monitoring & Observability:** Application monitoring (Sentry?), DB monitoring.
17. **GDPR / KVKK:** Kişisel veri politikası, kullanıcı verilerinin silme talebi.
18. **Kullanıcı davet/oluşturma akışı:** Self-signup yok mu, sadece admin oluşturuyor mu?
19. **Profil sayfası:** Kullanıcı kendi tercihlerini, bildirimlerini buradan mı yönetir?
20. **Yardım & Onboarding:** Yeni kullanıcı için tour, tooltip, dokümantasyon.

### 30.2. Açık Sorular (Karar Gerektiren)

| # | Soru | Önerilen Cevap |
|---|---|---|
| Q1 | Memur (EMPLOYEE) bağımsız görev oluşturabilir mi? | **Evet**, kendi atadığı PRIVATE görev için. UNIT görev müdür onayı gerekir. |
| Q2 | Proje görünürlüğü kavramı eklenecek mi? | **Evet**, PUBLIC_TO_UNITS / PRIVATE_TO_PROJECT olarak ayrılabilir. |
| Q3 | Çapraz birim üye eklemede dış birim müdürü onayı gerekli mi? | **Önerilen evet** — 2-step onay. |
| Q4 | BLOCKER derkenar otomatik `status = BLOCKED` yapsın mı? | **Önerilen evet**, opsiyonel kapatma ile. |
| Q5 | Audit log retention süresi? | **Önerilen 10 yıl** (kamu denetim). |
| Q6 | Email bildirim sağlayıcı? | **SMTP başla**, sonra ihtiyaca göre Mailgun/SES. |
| Q7 | Tatil takvimi entegrasyonu? | **Evet**, resmi tatiller deadline hesabında dikkate alınmalı. |
| Q8 | Time tracking? | **MVP'de yok**, ileri faz. |
| Q9 | Dark mode? | **MVP'de Shadcn üzerinden ücretsiz gelir, ayar verilebilir.** |
| Q10 | Public API (3rd party erişim)? | **Şimdilik yok**, ileride event'ler webhook olarak dışa açılabilir. |

### 30.3. Önerilen Yol Haritası (Yüksek Düzeyde)

#### Faz 0 — Hazırlık (1-2 hafta)
- Kurum onayları, hosting (on-prem vs cloud), DB altyapı, CI/CD setup, repo & branch stratejisi.

#### Faz 1 — MVP (4-6 hafta)
- better-auth + 3 rol (ADMIN, UNIT_MANAGER, EMPLOYEE).
- Birim/Kullanıcı CRUD.
- Proje CRUD + üyelik.
- Görev CRUD + atama + statü değişimi.
- Onay mekanizması (PENDING_APPROVAL, APPROVED, REVISION).
- Audit log (Prisma middleware).
- Soft delete altyapı.
- Frontend Shadcn UI + TanStack ekosistemi.
- Sonner toast.
- Mobile-responsive.
- Lokal storage provider.

#### Faz 2 — Çekirdek Genişleme (3-4 hafta)
- Vekalet modülü.
- Eskalasyon (cron + DELAYED + bildirim).
- SLA renkleri.
- Categorized global search (DB FTS).
- Right Drawer detay.
- Bildirim Inbox + push (PWA).
- Görünürlük (PRIVATE/UNIT).
- Hiyerarşi (parent/child max 2).
- Bağımlılık (task_dependencies + cycle koruma).

#### Faz 3 — Kurumsal Hafıza & Otomasyon (3-4 hafta)
- Yorum sistemi.
- Derkenar (Annotation) sistemi + tipler + pin + versiyon.
- Görev şablonları.
- Recurring tasks.
- Assignment rules.
- Bulk operations.
- Watcher.

#### Faz 4 — İleri Yetenekler (3-4 hafta)
- Workload uyarısı.
- Manuel proje kapatma akışı.
- Proje dosya havuzu.
- Storage MinIO / S3 provider.
- Dashboard widget'ları (rol bazlı).
- Core Error Monitor (frontend hata toplayıcı + dashboard).
- Granüler permissions (overrides).
- PWA push notifications.

#### Faz 5 — Üretim Sertleştirme (2-3 hafta)
- Performans tuning, p95 SLA hedefleri.
- Yedekleme + DR.
- Monitoring + observability (Sentry/Prometheus/Grafana).
- Denetim/penetrasyon testi.
- Kullanıcı kabul testleri (UAT) — kaymakamlık pilot kullanıcılar.
- Dokümantasyon (kullanıcı + admin + geliştirici).

#### Faz 6 — Genişleme (Sonraki sürümler)
- E-devlet/EBYS/DYS entegrasyonu.
- Webhook / Public API.
- AI asistan (Derkenar özetleme, görev önerme).
- Elasticsearch geçişi.
- Time tracking.
- Gantt görünümü.

---

## 31. SÖZLÜK (Glossary)

| Terim | Açıklama |
|---|---|
| **Birim** | Kaymakamlık altındaki organizasyon birimleri (örn. Yazı İşleri, Mal Müdürlüğü). |
| **Makam** | Hiyerarşinin tepesindeki rol (Kaymakam, Özel Kalem). |
| **Vekalet** | Bir kullanıcının yetkilerinin belirli süre için başka bir kullanıcıya devri. |
| **Eskalasyon** | Süre aşımı veya başka bir sorun nedeniyle problemin üst makama otomatik raporlanması. |
| **Maker-Checker** | "Yapan" (memur) ile "onaylayan" (müdür) ayrımı; aynı kişi olamaz. |
| **Görev (Task)** | Atanan, yapılan ve takip edilen iş kalemi. |
| **Alt Görev (Subtask)** | Bir görevin parçası olan child görev. |
| **Bağımsız Görev** | Hiçbir projeye bağlı olmayan görev (`projectId = NULL`). |
| **Hiyerarşi** | İş kırılım yapısı (parent → child); max 2 seviye. |
| **Bağımlılık (Dependency)** | "A bitmeden B başlayamaz" tipi sıralama ilişkisi. |
| **Leaf Node** | Hiyerarşinin en alt ucundaki child'ı olmayan görev. |
| **PRIVATE Görev** | Yalnızca creator + assignee'nin görebildiği görev. |
| **UNIT Görev** | Birim müdürü + birim yetkili personellerinin görebildiği görev. |
| **Yorum (Comment)** | Geçici, kronolojik sohbet akışı mesajı. |
| **Derkenar (Annotation)** | Kalıcı, bağlamsal, etiketli (DECISION/WARNING/BLOCKER/INFO/NOTE), pinlenebilir, versiyonlu kurumsal not. |
| **Inbox** | Kullanıcıya özel toplanmış bildirim merkezi. |
| **Watcher** | Kendisine atanmamış görevi izleyen kullanıcı. |
| **SLA** | Service Level Agreement; deadline'a göre 🟢/🟡/🔴 renk kodu. |
| **Recurring Task** | CRON tabanlı tekrar oluşturulan görev. |
| **Assignment Rule** | Koşul bazlı otomatik atama kuralı. |
| **Bulk Operation** | Çoklu seçim ile toplu eylem (atama, silme, etiket vb.). |
| **Audit Log** | Immutable, append-only sistem hareket günlüğü. |
| **Soft Delete** | `deleted_at` ile işaretleme; fiziksel silme yok. |
| **Storage Provider** | Local / MinIO / S3 üzerinde dosya saklama soyutlaması. |
| **PWA** | Progressive Web App — yüklenebilir, offline-yetenekli web uygulaması. |
| **Off-Canvas Drawer** | Sağdan açılan, sayfayı yenilemeyen detay paneli. |
| **Core Error Monitor** | Frontend/backend hata + validasyon uyarı toplayıcı. |
| **Categorized Search** | Sonuçların 📁 Projeler, ✅ Görevler, 📝 Derkenarlar, 📄 Dosyalar olarak ayrılması. |
| **Maker-Checker İlkesi** | Bir aksiyon iki farklı kişi tarafından (yapan + onaylayan) yapılır. |
| **Cross-functional Proje** | Birden fazla birime üye olan proje. |
| **Proje Dosya Havuzu** | Bir projedeki tüm görevlerin dosyalarının konsolide görüntüsü. |
| **Manuel Proje Kapatma** | Otomatik değil, üst amir onayı ile yapılan kapatma. |
| **Snapshot (Versiyonlama)** | Bir derkenarın düzenleme öncesi durumunun saklanması. |
| **Granüler Permission** | Rol-üstü, izin-anahtarı bazlı yetkilendirme (örn. `task.approve`). |

---

## EK A — KAPSAM ÖZET TABLOSU (Hızlı Referans)

| Alan | Kapsam |
|---|---|
| **Frontend** | Next.js App Router, React, Tailwind, Shadcn UI, TanStack Query/Table, RHF + Zod, Sonner, better-auth, PWA. |
| **Backend** | Node.js, Prisma ORM, PostgreSQL, API-First REST endpoints, Event-Driven. |
| **Auth** | better-auth (session, opsiyonel 2FA/SSO ileri faz). |
| **Storage** | Soyutlanmış (Local/MinIO/S3). |
| **Roller** | ADMIN, UNIT_MANAGER, EMPLOYEE + granüler permissions. |
| **Hiyerarşi** | Birim/Makam sabit; görevde max 2 seviye parent/child. |
| **Bağımlılık** | task_dependencies (N:M, DAG, cycle koruma). |
| **Görünürlük** | PRIVATE / UNIT. |
| **İlerleme** | Leaf-node odaklı, otomatik recompute. |
| **SLA** | 🟢 Normal, 🟡 Riskli, 🔴 Gecikmiş + %25 erken uyarı. |
| **Onay** | Maker-Checker (memur → müdür); reddetme gerekçeli + REVISION. |
| **Vekalet** | Tarih aralığı + scope; "X adına Y" log. |
| **Yorum vs Derkenar** | Geçici sohbet vs kalıcı kurum hafızası (DECISION/WARNING/BLOCKER/INFO/NOTE). |
| **Bildirim** | Inbox merkezi + Sonner toast + opsiyonel push/email. |
| **Watcher** | Sorumluluk dışı izleme. |
| **Otomasyon** | Eskalasyon (cron), Recurring Tasks, Assignment Rules. |
| **Toplu İşlem** | Bulk atama/silme/etiket + bulk_operation_id ile undo. |
| **Şablon** | Görev şablonları (alt görev/checklist/öntanım). |
| **Arama** | Categorized (Ctrl+K), abstracted (Frontend → DB FTS → ES). |
| **Audit** | Immutable, append-only, JSON diff (old/new). |
| **Soft Delete** | Tüm domain entity'ler için. |
| **Mobil** | Mobile-first responsive + PWA (offline cached read). |
| **Dosya** | Görev + Proje + Proje Havuzu; soyutlanmış storage. |
| **Dashboard** | Rol bazlı widget'lar (Gecikenler, Bana Atananlar, Birim İlerlemesi, Kapatılabilirler). |
| **Layout** | Sidebar + Header + Main + Off-Canvas Drawer. |

---

## EK B — KAVRAMSAL DİYAGRAMLAR (Metin Tabanlı)

### B.1. Onay Akış Diyagramı

```
[EMPLOYEE: Görev İcrası]
        │
        ▼
[Onaya Sun] ──── Sonner Toast: "Onaya gönderildi"
        │
        ▼
status = PENDING_APPROVAL
        │
        ▼
[Bildirim → UNIT_MANAGER]
        │
        ▼
[Manager Karar Verir]
        │
        ├─── ONAYLA ───→ status = APPROVED ──→ Arşive ──→ Audit Log
        │
        └─── REDDET ───→ status = REVISION ──→ Memura bildirim ──→ Audit Log
                          (Gerekçe zorunlu)         (gerekçe gösterilir)
```

### B.2. Hiyerarşi vs Bağımlılık

```
HİYERARŞİ (max 2 seviye):
   Görev A
     ├── Alt Görev A1
     └── Alt Görev A2

BAĞIMLILIK (DAG):
   Görev X ─────depends_on────→ Görev Y
   Alt Görev A1 ──depends_on──→ Görev B
```

### B.3. Vekalet Etki Alanı

```
Kullanıcı X (delegator)
   yetkiler: { task.approve, project.create, ... }
        │
        │ delegation [start, end]
        ▼
Kullanıcı Y (delegatee)
   efektif yetkiler:
     own_permissions ∪ delegated(scope)
        │
        ▼
Audit log: {
  "actor_id": Y,
  "on_behalf_of": X,
  "action": "TASK_APPROVED",
  "timestamp": ...
}
UI'da gösterim: "Kaymakam (X) adına Y tarafından onaylanmıştır."
```

### B.4. SLA Eskalasyonu

```
Cron job (her dakika)
        │
        ▼
SELECT tasks WHERE deadline < now() AND status NOT IN (APPROVED, CANCELLED)
        │
        ▼
For each task:
  status = DELAYED
  riskLevel = DELAYED
  emit TASK_DELAYED event
        │
        ▼
Listeners:
  - Audit Log Writer
  - Notification Sender → assignee + manager + (eşik ise) admin
  - Dashboard Cache Invalidator
```

### B.5. Categorized Search Akışı

```
Kullanıcı: Ctrl+K → "denetim raporu"
        │
        ▼
Frontend: TanStack Query
        │
        ▼
GET /search?q=denetim+raporu&user=...
        │
        ▼
Backend:
  1. Yetki çıkarımı (kullanıcının erişebildiği unit/project/task seti)
  2. PostgreSQL FTS sorgusu (tsvector, GIN index)
  3. Sonuçları kategorize et: 📁 / ✅ / 📝 / 📄
  4. Per-category limit 20
        │
        ▼
Frontend: Sonuç listesi (kategori başlıklı, simgeli)
```

### B.6. Yorum vs Derkenar Kullanım Modeli

```
Görev: "X Belediye ile koordinasyon"
   │
   ├── Yorumlar (akışkan, kronolojik):
   │     [Memur]: "Belediye ile görüşme talep ettim."
   │     [Memur]: "Cevap bekliyorum."
   │     [Memur]: "Toplantı 15 Mayıs için onaylandı."
   │
   └── Derkenarlar (kalıcı, etiketli, sabitlenebilir):
        📌 [DECISION] Kaymakam toplantı kararı
            "Ortak çalışma grubu kurulacak. Lider: Yazı İşleri Müdürü."
            (created 2026-04-15, edited 2026-04-20 — versiyon 2)

        📌 [BLOCKER] Belediye Onayı Bekleniyor
            "Belediye Başkanlığı Resmî yazısı gelmeden adım atılamaz."
            (resolved: 2026-04-25)

        [WARNING] Bütçe Kısıtı
            "Toplam harcama 100.000 TL'yi aşamaz."
```

---

## EK C — RİSK & MİTİGASYON ÖZETİ

| Risk | Etki | Mitigasyon |
|---|---|---|
| **Kullanıcı adoption düşük** | Sistem kullanılmazsa kurum hafızası oluşmaz. | UX odaklı, mobile-first, hızlı arama, anlamlı bildirim. |
| **Audit log büyümesi** | Zamanla performans düşer. | Partitioning (monthly), arşiv soğuk depolamaya. |
| **Search performans** | FTS yeterli olmayabilir. | Abstraction ile Elasticsearch'e geçiş hazır. |
| **PRIVATE görev sızıntısı** | Yetkilendirme zafiyeti. | Service-level + DB RLS + audit log + erişim testleri. |
| **Vekalet abuse** | Geniş scope ile yetki kötüye kullanım. | Scope kısıtla, kısa süre, audit, üst makam onayı (politika). |
| **Workload uyarısı yanılması** | Eşik yanlış ayarlıysa sürekli uyarı/sustur kapatılır. | Eşik konfigürasyonu role/birim bazlı; kullanıcı feedback ile ayar. |
| **PWA offline çatışması** | Offline yazma yapılmasının risk. | MVP'de read-only offline; sonra sync queue. |
| **Storage geçişi** | Lokal'den MinIO/S3'e taşıma kesintiye yol açabilir. | Soyutlama + migration script + dual-write window. |
| **Silinen veri kaybı** | Soft delete bypass edilirse. | DB user'a hard delete izni vermeden + tüm endpoint testleri. |
| **Eskalasyon spam'i** | Aynı görev sürekli eskalasyon mesajı çıkarır. | "Daha önce bildirildi" guard + günlük dijital özet. |

---

## EK D — KRİTİK BİLEŞEN İLİŞKİ HARİTASI

```
                    ┌────────────────────────┐
                    │      better-auth       │
                    │  (session, RBAC kapı)  │
                    └───────────┬────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        [Frontend UI]      [Middleware]     [Service Layer]
        Next.js + RSC      auth gating      requirePermission()
              │                 │                 │
   TanStack Query/Table         │            Prisma + Middleware
   RHF + Zod, Sonner            │                 │
              │                 ▼                 ▼
              │           [API-First Routes]     [DB: PostgreSQL]
              │                 │                 │
              ▼                 ▼                 │
        [Cached State]     [Event Bus] ─────→ [Audit Log Writer]
                                │                 │
                                ▼                 │
                          [Listeners]             │
                          - Notification          │
                          - Workload counter      │
                          - Dashboard cache inv.  │
                          - (gelecek) AI/Webhook  │
                                                  ▼
                                          [Storage Abstraction]
                                          Local | MinIO | S3
```

---

## SON SÖZ

PUSULA, mülki idare amirliğinin gerçek dünya hiyerarşik yapısını **dijitale ayna tutarak**, hem **operasyonel verimliliği** (görev takibi, atama, eskalasyon) hem de **stratejik kurumsal hafızayı** (Derkenar, audit log, versiyonlama) tek çatı altında toplayan, **olay-güdümlü** ve **API-First** bir İş Yönetim Platformudur.

V1'den V6'ya çizdiği evrim çizgisi, sistemin bir **görev takip aracından** **kurum kayıtlarının dijital omurgasına** dönüşümünü kayda almıştır. Bu konsolide doküman, V1-V6 ve Master PRD'lerin tüm kararlarını, gerekçelerini, planlarını, mantıklarını **eksiksiz** bir araya getirmiş; ayrıca versiyonlar arasındaki sapmaları, açık soruları, eksiklikleri ve önerilen yol haritasını şeffafça ortaya koymuştur.

Bu doküman bundan böyle PUSULA için **tek hakikat (Single Source of Truth)** adayıdır; ekipler bir konuda belirsizlik yaşadığında **önce buraya bakmalıdır**.

---

**Doküman Sonu — Toplam: 31 Ana Bölüm + 4 Ek**
