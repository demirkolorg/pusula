# **PUSULA: Kaymakamlık İş Yönetim Platformu \- Master PRD (V1-V6 Birleşik)**

Bu belge, PUSULA sisteminin V1'den V6'ya kadar olan tüm tasarım, mimari, teknik ve fonksiyonel gereksinimlerini tek bir çatı altında birleştiren nihai **Master PRD** (Ürün Gereksinimleri Dokümanı) dosyasıdır.

## **1\. Proje Vizyonu ve Stratejik Konumlandırma**

Pusula, basit bir görev takip aracından ziyade; mülki idare amirliği bünyesindeki tüm süreçlerin, kararların, denetimlerin ve kurumsal hafızanın yönetildiği tam kapsamlı bir **"Work Management Platform"** (İş Yönetim Platformu) olarak tasarlanmıştır. Sistem, devlet kurumunun sabit hiyerarşik yapısını temel alırken, API-first ve olay güdümlü (event-driven) bir mimari ile modern ve denetlenebilir bir ekosistem sağlar.

## **2\. Teknoloji Yığını (Tech Stack)**

* **Frontend:** Next.js (App Router), React, Tailwind CSS.  
* **UI Kütüphanesi:** Shadcn UI (Standart olarak kullanılacaktır).  
* **Kimlik Doğrulama:** better-auth.  
* **State & Veri Yönetimi:** TanStack Query (React Query).  
* **Form & Validasyon:** React Hook Form \+ Zod.  
* **Tablo Yönetimi:** TanStack Table (Filtreleme, sıralama ve progress bar desteği).  
* **Bildirimler:** Sonner (Toast mesajları).  
* **Backend:** Node.js, Prisma ORM.  
* **Veritabanı:** PostgreSQL.  
* **Erişim & Platform:** Mobile-first yaklaşım, PWA uyumlu, zero-downtime güncellemelere uygun.  
* **Depolama:** Soyutlanmış Storage Interface (Lokal, MinIO veya S3).

## **3\. Çekirdek Sistem Mimarisi (Core Engine)**

### **3.1. Aktivite Log Sistemi (Immutable & Deep Audit)**

Sistemdeki her hareket (görev oluşturma, durum değişikliği, atama, dosya yükleme vb.) activity\_logs tablosuna kaydedilir. Bu kayıtlar asla silinemez ve düzenlenemez. Prisma middleware veya DB trigger seviyesinde değişiklikler old\_value ve new\_value olarak JSON formatında saklanır.

### **3.2. Soft Delete ve Arşivleme**

Veritabanında fiziksel silme (Hard Delete) yapılmaz. Silinen kayıtlar deleted\_at ve deleted\_by sütunları ile işaretlenir. Tamamlanan projeler arşiv sistemine taşınır, aktif görünümden kalkar ancak aramalarda erişilebilir kalır.

### **3.3. API-First ve Event-Driven Tasarım**

Backend uç noktaları domain odaklı tasarlanır (Örn: POST /tasks/{id}/assign). Sistem TASK\_COMPLETED, NOTE\_CREATED gibi olayları (event) fırlatır; bildirim, loglama ve olası AI/Webhook modülleri bu olayları dinler.

### **3.4. Granüler Yetki Sistemi (RBAC \+ Permissions)**

| Rol | Kapsam ve Örnek İzinler (Permissions)   |
| :---- | :---- |
| **ADMIN (Kaymakam/Özel Kalem)** | Tüm birimleri izleme, sistem ayarları, proje oluşturma. (project.manage, system.audit) |
| **UNIT\_MANAGER (Birim Müdürü)** | Kendi birimini yönetme, görev havalesi, onay/ret işlemleri. (task.assign, task.approve) |
| **EMPLOYEE (Personel)** | Kendisine atanan görevleri yapma, alt görev açma, onaya sunma. (task.create, task.update) |

## **4\. Proje ve Görev Yönetimi Mimarisi**

### **4.1. Proje Yapısı**

Projeler, çapraz birim (cross-functional) çalışmaya uygundur. Projeye bağlı tüm görevlerdeki dosyalar "Proje Dosya Havuzu"nda toplanır. Proje kapanışları otomatik değil, manuel onay mekanizmasıyla yapılır.

### **4.2. Görev Görünürlüğü (Bağımsız Görevler)**

Projesi olmayan (projectId: NULL) bağımsız görevler atanabilir. Görünürlük 2 tiptir:

* **PRIVATE:** Sadece oluşturan ve atanan görür. Birim müdürü erişemez.  
* **UNIT:** Birim müdürü ve yetkili birim personeli izleyebilir.

### **4.3. Hiyerarşi (Parent/Child) ve Bağımlılık (Dependency)**

Sistem karmaşıklığını önlemek için Hiyerarşi ve Bağımlılık ayrılmıştır.

* **Hiyerarşi:** İş kırılımı için kullanılır. Maksimum 2 seviye (Görev \-\> Alt Görev) derinliğe izin verilir. İlerleme, sadece en alt uçtaki (leaf-node) görevlerin oranına göre hesaplanır.  
* **Bağımlılık (Dependency):** İş sıralaması içindir (A bitmeden B başlayamaz). Hiyerarşiden bağımsız olarak task\_dependencies tablosu ile yönetilir.

### **4.4. İş Yükü ve Risk (SLA) Yönetimi**

Görevler deadline \- remaining work hesaplamasına göre 🟢 Normal, 🟡 Riskli, 🔴 Gecikmiş olarak renk kodlarıyla işaretlenir. Sistem, yeni görev atanırken personelin mevcut açık/kritik iş yükünü analiz ederek uyarı verir.

## **5\. Kurumsal Hafıza: Derkenar Sistemi**

### **5.1. Yorum ve Derkenar Ayrımı**

Yorumlar (Comments) geçici kronolojik sohbeti temsil ederken, **Derkenarlar (Annotations)** görevin kalıcı bilgi deposu ve resmi karar kayıtlarıdır (mini-wiki).

### **5.2. Derkenar Özellikleri**

* Zengin metin (Rich Text) desteği vardır, dosya ve tablo eklenebilir.  
* Sabitlenebilir (Pin) ve yetki dahilinde düzenlenebilir. Değişiklikler versiyonlanır (Snapshot).  
* **Kategoriler:** Karar (DECISION), Uyarı (WARNING), Engel (BLOCKER), Bilgi (INFO).

## **6\. Otomasyon ve Bildirim Merkezi**

* **Onay Mekanizması:** Memur işi bitirince görevi "Onaya Sunar". Müdür onaylar veya red gerekçesiyle revizyona gönderir. Onay, çift aşamalı (Maker-Checker) bir süreçtir.  
* **Vekalet Modülü:** İzinli idareciler yetkilerini devredebilir. İşlemler "X adına Y" olarak loglanır.  
* **Inbox ve Watchers:** Bildirim spam'ini önlemek için Inbox yapısı kullanılır. Atanmayan kullanıcılar görevleri izlemeye (Watch) alabilir.  
* **Otomatik Kurallar:** Rutin işler için Recurring Tasks ve belirli departmanlara düşen işler için Assignment Rules modülleri bulunur.

## **7\. Kullanıcı Deneyimi (UX) ve Arayüz**

### **7.1. Global Arama Modülü (Ctrl+K)**

Yetki sınırları dahilinde aranabilir tüm veriler kategorize edilerek listelenir. Sonuçlar simgelerle ayrıştırılır: 📁 Projeler, ✅ Görevler, 📝 Derkenarlar, 📄 Dosyalar. Arama motoru ileride Full-Text Search veya Elasticsearch entegrasyonuna uygun tasarlanır.

### **7.2. Dashboard ve TanStack Table**

* Proje listelerinde anlık durumu belirten ince Progress Bar'lar (% yüzde değeriyle birlikte) yer alır.  
* Dashboard; "Geciken İşler", "Bana Atananlar", "Riskli Projeler" gibi kullanıcı rolüne göre şekillenen widget'lar sunar.  
* Tablolarda çoklu seçim yapılarak toplu (Bulk) atama, etiket (Tag) ekleme veya statü değiştirme imkanı sunulur.

### **7.3. Layout Düzeni**

Sol tarafta birim bazlı menü (Sidebar), üstte global araçlar (Header) ve ortada geniş çalışma alanı (Main Workspace) bulunur. Görev detaylarına tıklandığında sayfa yenilenmeden ekranın sağından açılan bir panel (Off-Canvas Drawer) kullanılır.