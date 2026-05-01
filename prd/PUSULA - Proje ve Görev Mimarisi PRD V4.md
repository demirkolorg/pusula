# **PUSULA: Kaymakamlık Görev Takip Sistemi \- PRD V4**

Bu belge, PUSULA sisteminin çekirdek fonksiyonlarını oluşturan Proje ve Görev mimarisini, hiyerarşik yapılandırmayı ve gelişmiş veri ilişkilerini tanımlar.

## **1\. Proje ve Birim Mimarisi**

Sistemde projeler, birimlerin ana iş kalemlerini gruplandırdığı çatılardır.

* **Çapraz Birim (Cross-Functional) Desteği:** Projeler birden fazla birimi kapsayabilir. Proje sahibi birim haricindeki birimlerden personel projeye dahil edilebilir.  
* **Yetki Yayılımı:** Kaymakamlık makamı ve Birim Müdürleri proje başlatma yetkisine sahiptir.  
* **Dosya Havuzu:** Projeye bağlı tüm görevlerde paylaşılan dosyalar, proje ana sayfasında merkezi bir "Proje Dosya Havuzu" altında konsolide edilir.

## **2\. Görev Görünürlüğü ve Bağımsız Görevler**

Her görev bir projeye bağlı olmak zorunda değildir (projectId: NULL). Görevlerin görünürlük seviyeleri iki temel kategoride yönetilir:

| Görünürlük Tipi | Erişim Kapsamı   |
| :---- | :---- |
| **PRIVATE (Özel Görev)** | Sadece görevi oluşturan ve atanan kişi görebilir. Birim müdürü dahil diğer personeller erişemez. |
| **UNIT (Birim Görevi)** | Birim müdürü ve birimdeki yetkili personeller tarafından izlenebilir. |

## **3\. Görev Hiyerarşisi ve Bağımlılık (Dependency)**

Karmaşıklığı önlemek adına sistemde hiyerarşi ve bağımlılık kavramları birbirinden ayrılmıştır.

### **3.1. Katı Hiyerarşi (Parent/Child)**

* Sistem **maksimum 2 seviye** (Görev \-\> Alt Görev) derinliği destekler.  
* Alt görevler ana işin ayrılmaz parçalarıdır.

### **3.2. Bağımlılık Sistemi (Dependency)**

Görevler arasında hiyerarşiden bağımsız olarak "A bitmeden B başlayamaz" ilişkisi kurulabilir. Bu ilişki task\_dependencies tablosu üzerinden çoktan-çoğa (N:M) mantığıyla yönetilir.

## **4\. İlerleme (Progress) ve Otomasyon Kuralları**

Veri tutarlılığını sağlamak için ilerleme hesaplamaları şu kurallara tabidir:

* **Leaf-Node Odaklı Hesaplama:** Bir üst görevin ilerlemesi, kendisine bağlı alt görevlerin (leaf nodes) tamamlanma oranına göre otomatik hesaplanır.  
* **Proje İlerlemesi:** Projedeki tüm leaf-node görevlerin (tamamlanan / toplam) oranına göre yüzde belirlenir.  
* **Proje Kapanış:** Tüm görevler tamamlandığında proje statüsü otomatik değişmez; üst amire "Kapatılabilir Projeler" bildirimi gönderilir, kapanış manuel onay ile yapılır.

## **5\. UX ve Arama Standartları**

### **5.1. Dashboard ve TanStack Table Görünümü**

* Proje listesinde her satırda görsel **Progress Bar** (İlerleme Çubuğu) ve yüzde değeri bulunacaktır.  
* Geciken görevler ve riskli projeler tablo üzerinde renkli badge'ler ve ikonlar ile vurgulanacaktır.

### **5.2. Kategorize Edilmiş Global Arama**

Arama motoru (Ctrl+K) sonuçları şu kategorilerde ayırarak sunacaktır:

* **PROJELER:** Klasör ikonu ile temsil edilir.  
* **GÖREVLER:** Checkbox ikonu ile temsil edilir.  
* **DOSYALAR:** Belge ikonu ile temsil edilir.

Arama mimarisi frontend fuzzy search ile başlayacak ancak servis seviyesinde backend entegrasyonuna hazır (abstracted) tutulacaktır.