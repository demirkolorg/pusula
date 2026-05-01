# **PUSULA: Kaymakamlık Görev Takip Sistemi \- PRD (Ürün Gereksinim Belgesi)**

Bu belge, bir mülki idare amirliği (Kaymakamlık) için tasarlanan, hiyerarşik yapıya uygun, denetim odaklı ve modüler görev takip sisteminin teknik ve fonksiyonel gereksinimlerini tanımlar.

## **1\. Proje Vizyonu ve Mimari Yaklaşım**

Sistem, karmaşık ve dinamik takımlar yerine, devlet kurumunun sabit hiyerarşik yapısını (Birim/Makam) temel alır. "Analysis-Plan-TODO-Coding/Action" iş akışını dijitalleştirerek, her adımın izlenebilir olduğu bir ekosistem sağlar.

### **Teknoloji Yığını (Tech Stack)**

* **Frontend:** Next.js (App Router), React, Tailwind CSS.  
* **Backend:** Node.js, Prisma ORM.  
* **Veritabanı:** PostgreSQL.  
* **Mobil:** Mobile-first Responsive Design \+ PWA (Progressive Web App).  
* **Depolama:** Soyutlanmış Storage Interface (Lokal Dosya Sistemi, MinIO veya S3 desteği).

## **2\. Organizasyonel Yapı ve Yetkilendirme**

Sistem, rol tabanlı erişim kontrolü (RBAC) ile yönetilir. Takımlar dinamik değil, birimler sabittir.

| Rol | Yetki Kapsamı   |
| :---- | :---- |
| **Kaymakam / Özel Kalem** | Süper Admin; tüm birimleri izleme, görev açma, eskalasyon raporlarını görme. |
| **Birim Müdürü** | Kendi birimine gelen işleri memurlara havale etme, onay/red verme, vekalet bırakma. |
| **Birim Personeli (Memur)** | Kendisine atanan görevleri yürütme, süreci raporlama, onaya sunma. |

## **3\. Temel Fonksiyonel Modüller**

### **3.1. Vekalet Modülü**

İdarecilerin izinli veya görevli olduğu durumlarda sistemin tıkanmaması için tasarlanmıştır. Belirli tarih aralıklarında bir kullanıcının onay ve görme yetkileri başka bir kullanıcıya devredilir. Bu süreçte yapılan tüm işlemler "X adına Y tarafından yapılmıştır" şeklinde loglanır.

### **3.2. Süre Yönetimi ve Eskalasyon**

* **Termin Takibi:** Her görev için bir son tarih (deadline) belirlenir.  
* **Otomatik Uyarı:** Sürenin dolmasına %25 kala sorumlu personele bildirim gider.  
* **Eskalasyon:** Süre dolduğunda görev otomatik olarak "Gecikmiş" statüsüne geçer ve bir üst makama (Birim Müdürü veya Kaymakam) dashboard üzerinden raporlanır.

### **3.3. Görev Şablonları**

Rutinleşmiş kamu görevleri (örn: Bayram töreni hazırlığı, haftalık koordinasyon toplantısı) için önceden tanımlanmış alt görevler, açıklamalar ve kontrol listeleri içeren şablonlar kullanılır.

## **4\. Gelişmiş Denetim İzi ve Hata Takibi (Core Logging)**

### **4.1. İşlem Logları (Audit Log)**

Prisma Middleware düzeyinde yakalanan her veritabanı değişikliği JSON formatında saklanır:

`{`  
  `"action": "UPDATE",`  
  `"model": "Task",`  
  `"userId": "user_id_123",`  
  `"diff": { "status": { "from": "IN_PROGRESS", "to": "PENDING_APPROVAL" } },`  
  `"timestamp": "2026-05-01T14:00:00Z"`  
`}`

### **4.2. Geliştirici Hata Takibi (Core Error Monitor)**

Sistem iyileştirmesi için kullanıcıların karşılaştığı her türlü engel kayıt altına alınır:

* **Kritik Hatalar:** 500 hataları ve sistem kırılmaları (Stack trace ile birlikte).  
* **Validasyon Uyarıları:** Kullanıcının formu yanlış doldurma sıklığı (UX iyileştirmesi için).  
* **Bağlam Verisi:** Hata anında kullanıcının hangi sayfada olduğu, hangi butona bastığı ve session bilgisi.

## **5\. Kullanıcı Deneyimi ve Arayüz (Layout)**

* **Sidebar:** Birim bazlı navigasyon ve kişisel iş listesi.  
* **Header:** Global arama (Görev ID veya Kelime) ve "Hızlı Görev Oluştur" butonu.  
* **Main Workspace:** Liste veya Tablo görünümü. Masaüstünde geniş veri sunumu, mobil cihazlarda ise dikey kart yapısı.  
* **Right Drawer (Sağ Panel):** Göreve tıklandığında açılan, bağlamı bozmayan detay, dosya eki ve log ekranı.  
* **Mobile-First & PWA:** İlk tasarım mobildeki kısıtlı alan düşünülerek yapılacak. PWA desteği ile ana ekrana ekleme ve basit offline yetenekler (önbelleğe alınmış listeleri görme) sunulacak.

## **6\. Onay Mekanizması Akış Şeması**

1. Memur işi bitirir ve "Onaya Sun" butonuna basar.  
2. Görev statüsü **PENDING\_APPROVAL** olur.  
3. İlgili Birim Müdürü'nün "Onay Bekleyenler" sekmesine bildirim düşer.  
4. Müdür:  
   * **ONAYLA:** Görev kapatılır, arşive alınır.  
   * **REDDET:** Gerekçe girilir, görev memura geri döner (Status: REVISION).