# **PUSULA: Kaymakamlık İş Yönetim Platformu \- PRD V6**

Bu belge, PUSULA sisteminin temel taşlarını oluşturan teknik mimariyi, iş süreçlerini ve kurumsal hafıza yönetimini içeren nihai ürün gereksinim belgesidir (V6).

## **1\. Proje Vizyonu ve Stratejik Konumlandırma**

PUSULA, sadece bir görev takip sistemi değil; mülki idare amirliği bünyesindeki tüm süreçlerin, kararların, denetimlerin ve kurumsal hafızanın yönetildiği bir **İş Yönetim Platformu (Work Management Platform)** olarak kurgulanmıştır. Sistem, API-first ve olay güdümlü (event-driven) bir mimari üzerine inşa edilmektedir.

### **Teknoloji Yığını (Tech Stack)**

* **Frontend:** Next.js (App Router), React, Tailwind CSS, Shadcn UI.  
* **Auth:** better-auth.  
* **State & Veri:** TanStack Query (React Query).  
* **Form & Validasyon:** React Hook Form \+ Zod.  
* **Tablo Yönetimi:** TanStack Table (Filtreleme, sıralama ve progress bar desteği).  
* **Bildirimler:** Sonner (Toast mesajları).  
* **Backend & DB:** Node.js, Prisma ORM, PostgreSQL.

## **2\. Çekirdek Sistem Mimarisi (Core Engine)**

### **2.1. Aktivite Log Sistemi (Immutable & Deep Audit)**

Sistemdeki her hareket (görev oluşturma, durum değişikliği, atama, dosya yükleme vb.) activity\_logs tablosuna kaydedilir. Bu kayıtlar asla silinemez ve değiştirilemez. Değişiklikler old\_value ve new\_value olarak JSON formatında saklanır.

### **2.2. Soft Delete ve Arşivleme**

Veritabanında fiziksel silme işlemi yapılmaz; kayıtlar deleted\_at ve deleted\_by ile işaretlenir. Tamamlanan projeler, aktif listeleri kalabalıklaştırmamak adına arşiv sistemine taşınır.

### **2.3. Granüler Yetki Sistemi (RBAC \+ Permissions)**

| Rol | Örnek İzinler (Permissions)   |
| :---- | :---- |
| **ADMIN** | Sistem ayarları, tüm birim yönetimi, eskalasyon takibi. |
| **UNIT\_MANAGER** | Birim içi görev havalesi, onay/ret, proje başlatma. |
| **EMPLOYEE** | Görev icrası, alt görev açma, onaya sunma. |

## **3\. Görev ve Proje Yönetimi**

### **3.1. Hiyerarşi ve Bağımlılık (Dependency)**

* **Parent/Child:** Maksimum 2 seviye (Görev \-\> Alt Görev) derinlik.  
* **Dependency:** "A görevi bitmeden B başlayamaz" şeklinde esnek iş sıralaması.  
* **SLA Risk Sistemi:** Bitiş tarihine göre görevler otomatik olarak 🟢 Normal, 🟡 Riskli, 🔴 Gecikmiş olarak kodlanır.

### **3.2. İzleyici (Watcher) ve Bildirimler**

Kullanıcılar sorumlu olmadıkları görevleri takip edebilir (Watch). Bildirimler bir "Inbox" mantığıyla sunulur; kullanıcı bildirim tercihlerini (Uygulama içi, E-posta vb.) yönetebilir.

## **4\. Kurumsal Hafıza: Derkenar Sistemi**

Yorumlardan farklı olarak "Derkenarlar", göreve dair kalıcı ve resmi bilgileri barındırır. Karar (DECISION), Uyarı (WARNING), Engel (BLOCKER) ve Bilgi (INFO) etiketleri ile sınıflandırılır. Derkenarlar zengin metin (Rich Text) desteğine sahiptir ve versiyonlanır (Snapshot/History).

## **5\. Kullanıcı Deneyimi ve Operasyonel Verimlilik**

* **Kategorize Arama (Ctrl+K):** Proje, Görev, Derkenar ve Dosyalar arasında hızlı geçiş.  
* **Toplu İşlemler (Bulk Ops):** Çoklu görev seçimi ile atama, durum değişikliği ve etiketleme.  
* **Tekrarlayan İşler:** Rutin görevler (Haftalık, Aylık) otomatik oluşturulur.  
* **İş Yükü Yönetimi:** Yeni atamalarda personelin mevcut iş yüküne göre sistem uyarı verir.

## **6\. Dashboard ve Görselleştirme**

TanStack Table üzerinde dinamik Progress Bar'lar yer alır. Dashboard, kullanıcı rolüne göre özelleşmiş widget'lar (Gecikenler, Bana Atananlar, Birim İlerlemesi) ile donatılacaktır.