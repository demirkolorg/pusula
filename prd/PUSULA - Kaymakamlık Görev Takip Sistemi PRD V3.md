# **PUSULA: Kaymakamlık Görev Takip Sistemi \- PRD V3**

Bu belge, bir mülki idare amirliği (Kaymakamlık) için tasarlanan, hiyerarşik yapıya uygun, denetim odaklı ve modüler görev takip sisteminin teknik ve fonksiyonel gereksinimlerini tanımlar.

## **1\. Proje Vizyonu ve Mimari Yaklaşım**

Sistem, karmaşık ve dinamik takımlar yerine, devlet kurumunun sabit hiyerarşik yapısını (Birim/Makam) temel alır. "Analysis-Plan-TODO-Coding/Action" iş akışını dijitalleştirerek, her adımın izlenebilir olduğu bir ekosistem sağlar.

### **Teknoloji Yığını (Tech Stack)**

* **Frontend:** Next.js (App Router), React, Tailwind CSS.  
* **UI Kütüphanesi & Bileşenler:** Shadcn UI (Standart olarak kullanılacaktır).  
* **Kimlik Doğrulama (Auth):** better-auth kullanılacaktır.  
* **Veri Yönetimi & State:** TanStack Query (React Query) ile sunucu durumu yönetimi sağlanacaktır.  
* **Form Yönetimi & Validasyon:** React Hook Form \+ Zod kombinasyonu ile güvenli form işlemleri yapılacaktır.  
* **Tablo Yönetimi:** TanStack Table ile veri listeleri, filtreleme ve sıralama işlemleri optimize edilecektir.  
* **Bildirimler (Toast):** Sonner kütüphanesi kullanılacaktır.  
* **Backend:** Node.js, Prisma ORM.  
* **Veritabanı:** PostgreSQL.  
* **Mobil & PWA:** Mobile-first yaklaşım ile tasarlanacak ve PWA (Progressive Web App) standartlarına uygun olarak kullanıma sunulacaktır.  
* **Depolama:** Soyutlanmış Storage Interface (Lokal Dosya Sistemi, MinIO veya S3 desteği).

## **2\. Organizasyonel Yapı ve Yetkilendirme**

Sistem, rol tabanlı erişim kontrolü (RBAC) ile yönetilir. Takımlar dinamik değil, birimler sabittir.

| Rol | Yetki Kapsamı   |
| :---- | :---- |
| **Kaymakam / Özel Kalem** | Süper Admin; tüm birimleri izleme, görev açma, eskalasyon raporlarını görme. |
| **Birim Müdürü** | Kendi birimine gelen işleri memurlara havale etme, onay/red verme, vekalet bırakma. |
| **Birim Personeli (Memur)** | Kendisine atanan görevleri yürütme, süreci raporlama, onaya sunma. |

## **3\. Temel Fonksiyonel Modüller**

### **3.1. Çekirdek Düzey Global Arama Modülü**

Kullanıcının yetki sınırları çerçevesinde görebildiği **tüm** verileri (görev başlıkları, açıklamalar, yorumlar, ekli dosyalar, log kayıtları) tarayabilen çekirdek düzeyde bir arama motoru planlanmıştır. Veritabanı seviyesinde indeksleme (Full-Text Search) kullanılarak milisaniyelik sonuçlar döndürülmesi hedeflenmektedir.

### **3.2. Otomasyon ve Bildirim Mekanizması**

Sistemdeki durum değişiklikleri ve süre aşımları otomatikleştirilmiş bir bildirim motoru üzerinden yürütülür:

* **Süre Yönetimi (Eskalasyon):** Görevin bitiş süresi (deadline) dolduğunda sistem otomatik olarak görevi "Gecikmiş" (DELAYED) statüsüne çeker ve ilgili personele, ardından bir üst amire bildirim gönderir.  
* **Onay/Ret Akışları:** Memur görevi onaya sunduğunda Birim Müdürüne anlık bildirim (In-app, Push) gider. Ret durumunda memura gerekçeli bir bildirim düşer.  
* **Arayüz Geri Bildirimleri:** Tüm başarılı eylemler, uyarılar ve hatalar **Sonner** tabanlı Toast bildirimleri ile kullanıcıya anında iletilecektir.

### **3.3. Vekalet Modülü**

İdarecilerin izinli veya görevli olduğu durumlarda sistemin tıkanmaması için tasarlanmıştır. Belirli tarih aralıklarında bir kullanıcının onay ve görme yetkileri başka bir kullanıcıya devredilir.

### **3.4. Görev Şablonları**

Rutinleşmiş kamu görevleri (örn: Bayram töreni hazırlığı, haftalık koordinasyon toplantısı) için önceden tanımlanmış alt görevler, açıklamalar ve kontrol listeleri içeren şablonlar kullanılır.

## **4\. Gelişmiş Denetim İzi ve Hata Takibi (Core Logging)**

### **4.1. İşlem Logları (Audit Log)**

Prisma Middleware düzeyinde yakalanan her veritabanı değişikliği çekirdek seviyesinde JSON formatında saklanır. Bu yapı sadece durumu değil, eski ve yeni veriyi (old\_value, new\_value) de tutar:

`{`  
  `"action": "UPDATE",`  
  `"model": "Task",`  
  `"userId": "user_id_123",`  
  `"diff": { "status": { "from": "IN_PROGRESS", "to": "DELAYED" } },`  
  `"timestamp": "2026-05-01T14:00:00Z"`  
`}`

### **4.2. Geliştirici Hata Takibi (Core Error Monitor)**

Sistem iyileştirmesi için kullanıcıların karşılaştığı her türlü engel kayıt altına alınır. Temel amaç "Kullanıcı nerede ne yaparken bu hatayı aldı?" sorusuna yanıt verebilmektir:

* **Kritik Hatalar:** 500 hataları ve sistem kırılmaları (Stack trace ile birlikte).  
* **Validasyon Uyarıları:** Zod üzerinden tetiklenen basit form hataları ve kullanıcı eylemleri izlenerek UX iyileştirmelerine ışık tutulur.  
* **Bağlam Verisi:** Hata anında kullanıcının hangi sayfada olduğu, hangi butona bastığı ve session bilgisi.

## **5\. Kullanıcı Deneyimi ve Arayüz (Layout)**

* **Shadcn UI Standardı:** Uygulamanın tüm görsel bileşenleri tutarlı, modern ve erişilebilir Shadcn standartlarına göre oluşturulacaktır.  
* **Mobil Öncelikli & PWA:** İlk tasarım mobildeki kısıtlı alan düşünülerek yapılacak, PWA standartlarıyla masaüstü ve mobile kurulabilir olacaktır.  
* **Sidebar:** Birim bazlı navigasyon ve kişisel iş listesi.  
* **Header:** Global arama (Görev ID veya Kelime) ve "Hızlı Görev Oluştur" butonu.  
* **Main Workspace:** TanStack Table ile güçlendirilmiş, veri odaklı liste veya tablo görünümleri.  
* **Right Drawer (Sağ Panel):** Göreve tıklandığında açılan, bağlamı bozmayan detay, dosya eki ve log ekranı.

## **6\. Onay Mekanizması Akış Şeması**

1. Memur işi bitirir ve "Onaya Sun" butonuna basar.  
2. Görev statüsü **PENDING\_APPROVAL** olur. Sistemin bildirim motoru tetiklenir ve Sonner toast ile kullanıcıya işlem onayı verilir.  
3. İlgili Birim Müdürü'nün "Onay Bekleyenler" sekmesine bildirim düşer.  
4. Müdür:  
   * **ONAYLA:** Görev kapatılır, arşive alınır.  
   * **REDDET:** Gerekçe girilir, görev memura geri döner (Status: REVISION). Memura bildirim gider.