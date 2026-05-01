# **PUSULA: Kaymakamlık Görev Takip Sistemi \- PRD V5 (Kurumsal Hafıza)**

Bu belge, PUSULA sisteminin V5 sürümü ile birlikte gelen "Derkenar" (Kurumsal Hafıza) modülünü ve V1-V4 arasındaki tüm teknik ve fonksiyonel gereksinimleri kapsar.

## **1\. Proje Vizyonu ve Mimari Yaklaşım**

* **Frontend:** Next.js (App Router), React, Tailwind CSS, Shadcn UI.  
* **Kimlik Doğrulama:** better-auth.  
* **State & Veri Yönetimi:** TanStack Query (React Query).  
* **Form & Validasyon:** React Hook Form \+ Zod.  
* **Tablo Yönetimi:** TanStack Table (Progress bar, badge entegrasyonlu).  
* **Bildirimler:** Sonner (Toast bildirimleri).  
* **Backend & DB:** Node.js, Prisma ORM, PostgreSQL.

## **2\. Derkenar (Kurumsal Hafıza) ve Yorum Ayrımı**

Sistemde iletişimi sağlayan geçici yorumlar ile kalıcı kurumsal bilgiyi sağlayan derkenarlar kesin bir çizgiyle ayrılmıştır.

| Modül | Kullanım Amacı | Özellikler   |
| :---- | :---- | :---- |
| **Yorum (Comment)** | Anlık iletişim, kronolojik sohbet akışı ("Dosyayı yükledim"). | Hızlı, geçici, akışkan. |
| **Derkenar (Annotation)** | Kalıcı bağlamsal not, resmi açıklama, karar defteri. | Sabitlenebilir (pinned), zengin metin (rich text), etiketli. |

### **2.1. Derkenar Tipleri (Kategorizasyon)**

* **DECISION (Karar):** Toplantı veya üst makam kararları.  
* **WARNING (Uyarı):** Süreçle ilgili dikkat edilmesi gereken hususlar.  
* **BLOCKER (Engel):** Görevin ilerlemesini durduran dış veya iç etkenler (Örn: "Belediye onayı bekleniyor").  
* **INFO (Bilgi):** Genel bağlamsal açıklamalar.

### **2.2. Teknik Veri Modeli (task\_notes)**

`model TaskNote {`  
  `id          String   @id @default(cuid())`  
  `taskId      String`  
  `authorId    String`  
  `title       String?`  
  `content     String   // Rich text format (HTML/Markdown)`  
  `type        NoteType // DECISION, WARNING, BLOCKER, INFO, NOTE`  
  `isPinned    Boolean  @default(false)`  
  `createdAt   DateTime @default(now())`  
  `updatedAt   DateTime @updatedAt`  
`}`

## **3\. Proje ve Görev Mimarisi (V4 Özeti)**

* **Görünürlük:** Görevler PRIVATE (sadece atanan/atayan) veya UNIT (birim içi görünür) olarak işaretlenebilir.  
* **Hiyerarşi vs Bağımlılık:** İş kırılımı için katı hiyerarşi (Maksimum 2 seviye: Parent \-\> Child). İş sıralaması için esnek task\_dependencies (A bitmeden B başlayamaz) kullanılır.  
* **İlerleme (Progress):** Proje ve ana görev ilerlemeleri, alt görevlerin (leaf-nodes) tamamlanma durumuna göre otomatik hesaplanır.

## **4\. Global Arama ve Kategorizasyon**

Kategori bazlı gelişmiş arama motoru (Ctrl+K) sonuçları şu şekilde ayrıştırır:

* 📁 **PROJELER**  
* ✅ **GÖREVLER**  
* 📝 **DERKENARLAR:** Görev içine girilmeden doğrudan kurum hafızasında arama yapılabilmesini sağlar.  
* 📄 **DOSYALAR**