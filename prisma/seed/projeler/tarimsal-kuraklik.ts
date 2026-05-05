// Proje: Tarımsal Kuraklık ve Hasar Tespit Komisyonu
// İl Tarım Müdürlüğü ile koordineli süreç + TARSİM, ziraat odası, mal müdürlüğü.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";

export const tarimsalKuraklikProjesi: ProjeSeed = {
  key: "tarim",
  ad: "Tarımsal Kuraklık ve Hasar Tespit Komisyonu",
  aciklama:
    "İlçe tarım müdürlüğü öncülüğünde, hasar tespit komisyonlarının kurulması, saha çalışmaları, çiftçi başvurularının değerlendirilmesi.",
  olusturan: "tarimAmir",
  yetkililer: ["kaymakam", "tarimAmir", "ormanSefi"],
  birimler: ["tarim", "ormanIsletme", "ziraatOdasi", "mal", "muhtarlik", "koyMuhtar", "kizilay"],
  kapakRenk: "amber",
  kapakIkon: "wheat",
  yildizli: false,
  listeler: [
    {
      ad: "Komisyon Kurulumu",
      yetkililer: ["tarimAmir"],
      birimler: ["tarim"],
      kartlar: [
        {
          key: "tarim-komisyon",
          baslik: "Hasar tespit komisyonu üyeleri belirlendi",
          aciklama:
            "5363 sayılı Tarım Sigortaları Kanunu ve 2090 sayılı Tabii Afetlerden Zarar Gören Çiftçilere Yapılacak Yardımlar Hakkında Kanun çerçevesinde, ilçemizde 2026 yılı kuraklık ve dolu kaynaklı hasar tespiti yapacak komisyon Kaymakamlık makamı oluru ile teşkil edilmiştir. Komisyon başkanlığını İlçe Tarım ve Orman Müdürü Sn. Faruk Can yürütecek; üyeler şu kurumlardan teşekkül edecektir: Tekman Ziraat Odası temsilcisi (Bn. Cemal Tunç), her köyün muhtarı (saha kontrol için), Tekman İlçe Mal Müdürlüğü temsilcisi (Bn. Hilal Doğan), 2 ziraat mühendisi (Tarım Müd. kadrolu), 1 hukuk müşaviri (gerekli görülürse). Komisyonun görevleri: 1) hasar gören parsellerin tespiti, 2) hasar oranının yüzdelik olarak değerlendirilmesi (%0 - %100 ölçek), 3) çiftçi başvurularının değerlendirilmesi, 4) tutanak ve fotoğraflama, 5) hak ediş listelerinin hazırlanması, 6) İl Tarım Müdürlüğü'ne raporlama. Komisyon kararları gizli oylama ile alınır, çoğunluk sağlanır. Komisyon oluşturma kararı resmi olarak yayımlanmış, üye tebligatları yapılmıştır. Geçen yıl benzer komisyon 4 ay içinde 287 dosyayı sonuçlandırmıştı; bu yıl 312 başvuru için süreç başlatılmaktadır.",
          etiketler: ["Kaymakamlık", "Kurumsal"],
          tamamlandi: true,
          ekler: [
            { ad: "komisyon-onayı.pdf", mime: "application/pdf", boyut: 78_000, yukleyen: "tarimAmir" },
          ],
        },
        {
          key: "tarim-egitim",
          baslik: "Komisyon üyelerine 1 günlük eğitim",
          aciklama:
            "Hasar tespit komisyonu üyelerine, saha çalışmasında standardı sağlamak amacıyla 1 günlük eğitim verilecektir. Eğitim içerik başlıkları: 1) Hasar tespit ölçütleri (Türkiye Tarım Sigortaları Havuzu - TARSİM standardı), buğday-arpa-yulaf için yüzdelik hasar değerlendirme tabloları, 2) Saha fotoğraflama (parsel sınırları, sağlam ve hasarlı bitki fotoğrafları, GPS damgalı), 3) GPS RTK cihazı kullanımı (komisyona 4 cihaz tahsis edilmiştir), 4) İl Tarım Bakanlığı'nın saha veri giriş portalı 'TARSAFE' kullanımı, 5) Çiftçi ile iletişim ve sahada karar verme süreçleri, 6) İtirazların değerlendirilmesi ve mahkemelik dosyaların gerekli evrak tutma kuralları. Eğitim İlçe Tarım Müdürü tarafından koordine edilecek, İl Tarım Müdürlüğü'nden 1 uzman eğitici davet edilecektir. Yer: Tekman Halk Eğitim Merkezi büyük salon. Süre: 09:00-17:00 (öğlen yemeği belediye tarafından karşılanacak). Eğitim sonunda komisyon üyelerine sertifika ve operasyonel kit (klipsli zarf, fotoğraf etiketi, mıknatıslı not defteri, GPS cihazı) teslim edilecektir.",
          etiketler: ["Eğitim"],
          yetkililer: ["tarimAmir"],
          birimler: ["tarim"],
          bitis: gunEkle(3, 17),
        },
      ],
    },
    {
      ad: "Saha Tespit",
      yetkililer: ["tarimAmir"],
      birimler: ["tarim", "ziraatOdasi", "muhtarlik", "koyMuhtar"],
      kartlar: [
        {
          key: "tarim-saha-1",
          baslik: "Karaağaç köyü hasar tespit (5 köy 1. tur)",
          aciklama:
            "Komisyonun 1. saha tur programı kapsamında, 312 başvurunun toplam dağılımı 5 köyde gerçekleştirilecektir: Karaağaç (50 hane), Doğanca (64 hane), Yolüstü (48 hane), Yeniköy (80 hane), Demirkent (70 hane). Saha programı şu sırayla yürütülecektir: 1. gün - Karaağaç (kuraklığın en yoğun yaşandığı köy), 2-3. günler - Doğanca, 4. gün - Yolüstü, 5-6. günler - Yeniköy, 7-8. günler - Demirkent. Her sahada komisyon üyeleri sabah 08:00'de muhtarlık binasında toplanır, ölçüm cihazları kontrol edilir, başvuru listesi gözden geçirilir, hangi parselin hangi saatte ziyaret edileceği planlanır. Saha çalışmasında her parsel için: GPS koordinatı alınır, hasar oranı %0-100 ölçeğinde değerlendirilir, fotoğraf çekilir, çiftçinin tutanak imzası alınır. Çiftçinin itirazı varsa not edilir. Karaağaç sahası tamamlandığında ilk değerlendirmeye göre 50 haneden 38'inde orta seviye buğday hasarı (%30-60), 7 hanede ağır hasar (%60+), 5 hanede hafif hasar (%30 altı) tespit edilmiştir. Köy içme suyu kaynağında da kuruma tehlikesi başladığı muhtarlık tarafından bildirilmiş, kara komisyonun bu konu için ayrı not düşmüştür. Saha sonrası raporlar dijital ortamda toplanır.",
          etiketler: ["Saha"],
          yetkililer: ["tarimAmir", "koyMuhtar"],
          birimler: ["tarim", "koyMuhtar"],
          bitis: gunEkle(7, 17),
          kontrol: [
            {
              ad: "Saha programı",
              maddeler: [
                { metin: "Karaağaç — 50 hane", atanan: "tarimAmir", tamam: true },
                { metin: "Doğanca — 64 hane", atanan: "tarimAmir" },
                { metin: "Yolüstü — 48 hane", atanan: "tarimAmir" },
                { metin: "Yeniköy — 80 hane", atanan: "tarimAmir" },
                { metin: "Demirkent — 70 hane", atanan: "tarimAmir" },
              ],
            },
          ],
          yorumlar: [
            { yazan: "tarimAmir", icerik: "Karaağaç bitti, 38 hanede orta seviye buğday hasarı tespit edildi.", gunFarki: -2 },
            { yazan: "koyMuhtar", icerik: "Köyümüzde hayvan içme suyu kaynağı da kuruyor, ek not eklendi.", gunFarki: -1 },
          ],
        },
        {
          key: "tarim-fotograf",
          baslik: "Saha fotoğraflama ve GPS işaretleme dosyası",
          aciklama:
            "Komisyon saha çalışmaları sırasında çekilen fotoğraflar ve GPS koordinatları, ulusal veri ambarına entegre edilmek üzere İl Tarım Müdürlüğü'nün TARSAFE portalına yüklenecektir. Fotoğraf standartları: her parsel için en az 4 fotoğraf (parselin 4 köşesi + genel görünüm), 12 megapiksel üzeri çözünürlük, GPS metadata damgası, fotoğraf üzerinde tarih-saat damgası. Cihaz olarak komisyona dağıtılan dijital fotoğraf makineleri (4 adet) ile saha tabletleri (3 adet) kullanılacaktır. GPS işaretlemesinde RTK cihazı ile metrik hassasiyet (±2 cm) sağlanmaktadır. Sahada toplanan veriler akşam 17:00-19:00 arası TARSAFE'e yüklenir, görsel doğrulama yapılır. Toplam 312 hane için yaklaşık 1.500 fotoğraf ve 1.000 koordinat noktasının portala işlenmesi beklenmektedir. Yetersiz veri içeren dosyalar tekrar saha ziyaretine bildirilir. Verilerin TARSAFE'e yüklenmesinden sonra il koordinasyon merkezi onayı alındığında çiftçi başvuru süreci 'değerlendirme' aşamasına geçer. Geçen yıl 17 dosyada GPS koordinat eksikliği tespit edilmiş, tekrar sahaya çıkılmıştı; bu yıl çift kontrol prosedürü uygulanmaktadır.",
          etiketler: ["Saha", "Kurumsal"],
          yetkililer: ["tarimAmir"],
          bitis: gunEkle(10, 17),
        },
      ],
    },
    {
      ad: "Başvuru Değerlendirme",
      yetkililer: ["tarimAmir"],
      birimler: ["tarim", "ziraatOdasi"],
      kartlar: [
        {
          key: "tarim-tarsim",
          baslik: "TARSİM kapsamı dışındaki çiftçi listesi",
          aciklama:
            "TARSİM (Türkiye Tarım Sigortaları Havuzu) sigortası bulunmayan çiftçilerin listesi 312 başvuru içerisinden tasniflenmiş, toplam 89 hane TARSİM kapsamı dışında olduğu tespit edilmiştir. Sigortasız çiftçiler 2090 sayılı Kanun çerçevesinde devlet kaynaklı 'tabii afet desteği' başvurusu yapabilmektedir; bu süreç TARSİM tazminatından farklı işler. Süreç adımları: 1) sigortasız çiftçi listesi tarım müdürlüğünce çıkarıldı, 2) her bir çiftçinin hasar oranı, parsel büyüklüğü ve ürün cinsi raporlandı, 3) Tarım ve Orman Bakanlığı'nın tabii afet destek kalemleri ile eşleştirme yapılacak, 4) Bakanlık portalına başvuru paketi yüklenecek. Destek kalemleri arasında: tohum desteği, gübre desteği, mazot ücretsiz tahsisi, hayvan yemi desteği yer almaktadır. Hasar oranı %30 üzerinde olan parseller önceliklidir. Sigortasız bir çiftçinin neden sigorta yaptırmadığı da kayıt altına alınır (maddi imkansızlık, bilgisizlik, ihmali, sigortayı yaramamış geçmişi). Bu veriler kullanılarak gelecek sezon TARSİM bilinçlendirme kampanyası planlanmaktadır. Geçen yıl tabii afet desteğinden yararlanan çiftçi sayısı 23'tü; bu yıl 89'a çıktığı için Bakanlığa ek bütçe talebi yazılacaktır.",
          etiketler: ["Saha", "Kaymakamlık"],
          yetkililer: ["tarimAmir"],
          birimler: ["ziraatOdasi", "tarim"],
          bitis: gunEkle(14, 17),
        },
        {
          key: "tarim-itiraz",
          baslik: "Hasar oranı itirazları — 11 başvuru",
          aciklama:
            "1. tur saha çalışması sonrasında, komisyon tarafından belirlenen hasar oranlarına 11 çiftçi yazılı itiraz dilekçesi sunmuştur. İtiraz gerekçeleri: 'hasarın daha yüksek olduğu', 'parselin yanlış belirlendiği', 'farklı parselin değerlendirilmediği', 'ölçüm hatası' kapsamında yer almaktadır. 2090 sayılı Kanun ve Hasar Tespit Yönetmeliği çerçevesinde, itirazların değerlendirilmesi için 2. tur saha kontrolü yapılması zorunludur. Komisyon, 11 başvurunun her biri için yeni bir saha ziyaret programı çıkaracak; ilk tur ekibi yerine farklı 2 ziraat mühendisi (objektif değerlendirme için) görevlendirilecektir. Bu sefer ölçümlere bağımsız bilirkişi olarak Ziraat Odası temsilcisi de katılır. İtirazlar 18 Mayıs'a kadar sonuçlandırılacak; sonuç itirazcı çiftçiye yazılı olarak tebliğ edilir. İtiraz reddedilirse çiftçi idare mahkemesi yoluna başvurabilir; kabul edilirse hasar oranı revize edilir ve hak ediş tazminatı yeniden hesaplanır. Geçen yılki süreçte 7 itiraz incelenmiş, 3'ü kabul, 4'ü reddedilmişti. Bu yıl itiraz oranı yüksek olduğundan komisyon objektifliği açısından üç farklı uzmanın katılımı önerilmektedir.",
          etiketler: ["Saha", "Beklemede"],
          yetkililer: ["tarimAmir"],
          bitis: gunEkle(18, 17),
        },
      ],
    },
  ],
};
