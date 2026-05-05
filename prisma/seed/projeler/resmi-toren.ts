// Proje: 19 Mayıs Atatürk'ü Anma Gençlik ve Spor Bayramı Hazırlıkları
// Mülki amir tarafından koordine edilen resmi tören süreci.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";

export const resmiTorenProjesi: ProjeSeed = {
  key: "toren",
  ad: "19 Mayıs Atatürk'ü Anma Gençlik ve Spor Bayramı Hazırlıkları",
  aciklama:
    "Tören programı, kortej, çelenk sunumu, halk oyunları, gençlik gösterileri ve protokol koordinasyonu.",
  olusturan: "ozelAmir",
  yetkililer: ["kaymakam", "ozelAmir", "milliAmir"],
  birimler: ["ozelKalem", "milliEgitim", "belediye", "emniyet", "lise", "imamHatip", "ortaokul", "genclikSpor", "muftuluk"],
  kapakRenk: "kırmızı",
  kapakIkon: "flag",
  yildizli: true,
  listeler: [
    {
      ad: "Program & Protokol",
      yetkililer: ["ozelAmir"],
      birimler: ["ozelKalem"],
      kartlar: [
        {
          key: "toren-program",
          baslik: "Resmi tören programı kesinleşti",
          aciklama:
            "19 Mayıs Atatürk'ü Anma Gençlik ve Spor Bayramı kapsamında ilçemizde gerçekleştirilecek resmi tören programı kesinleşmiştir. Program akışı: 07:30 saygı duruşu ve İstiklal Marşı (Hükümet Konağı önü), 08:30 Atatürk Anıtı'nda çelenk sunumu (Kaymakamlık + Milli Eğitim + Belediye + Garnizon), 09:00 saygı duruşu sırasında 81 saniye İstiklal Marşı, 10:00 stadyumda halk oyunları, gençlik gösterileri, bandolar, 11:30 Sayın Kaymakamlığın 19 Mayıs konuşması, 12:30 protokol için stadyumda kokteyl, 13:00 protokol öğle yemeği (Kaymakamlık makamı), 14:00 öğleden sonra etkinlikler (gençlik koşusu, satranç turnuvası, kitap okuma yarışması), 17:00 Halk Eğitim Merkezi'nde gençlere yönelik 'Atatürk ve Cumhuriyet' konferansı. Program protokol, dini görevliler, askeri yetkililer, eğitim temsilcileri ve geniş gençlik kitlesinin katılacağı şekilde tasarlanmıştır. Resmi açılışta yaklaşık 800 kişi, gün boyunca 3.500 vatandaş katılım beklenmektedir. Program A4 boyutta basılarak protokol mensuplarına teslim edilmiştir; PDF kopyası Kaymakamlık web sitesinde yayınlanmıştır.",
          etiketler: ["Kaymakamlık", "Kurumsal"],
          tamamlandi: true,
          ekler: [
            { ad: "tören-programı-19mayis-2026.pdf", mime: "application/pdf", boyut: 124_000, yukleyen: "ozelMemur" },
          ],
        },
        {
          key: "toren-protokol-davet",
          baslik: "Protokol davet listesi ve mektupları",
          aciklama:
            "19 Mayıs törenine davet edilecek protokol mensupları listesi Özel Kalem Müdürlüğü tarafından hazırlanmış ve Sayın Kaymakamımızın onayından geçmiştir. Liste kapsamı: Erzurum Vali Yardımcısı, AK Parti ve CHP milletvekilleri, Tekman Belediye Başkanı, Adliye Hakimleri, Cumhuriyet Başsavcısı, Garnizon Komutanı, Müftü, Tüm Birim Amirleri (35 kişi), Okul Müdürleri (28 kişi), Köy Muhtarları (38 kişi), Mahalle Muhtarları (12 kişi), İlçe Yönetim Kurulu Üyeleri (5 kişi), Şehit Yakınları Derneği Başkanı, Gaziler Derneği Başkanı, Esnaf Odası Başkanı, Ziraat Odası Başkanı, Eczacılar Odası Başkanı, yerel basın temsilcileri (5 kanal), Engelliler Federasyonu Tekman temsilcisi, Anne Üst Birliği başkanı. Toplam 195 davetli için protokol davetiyesi hazırlanmıştır. Davetiyeler altın yaldızlı zarflarda, kişiye özel gümüş süslemeli kartlarda matbu olarak hazırlanmış, Türk Bayrağı ve Atatürk silüeti bulunmaktadır. RSVP takip tablosu Excel'de oluşturulmuş, davetli isimleri sıraya göre yerleşim planına işlenmiştir. Geç katılım bildirimleri için belirlenen son tarih 15.05.2026'dır. PTT'ye taahhütlü olarak teslim edilmiş, takip kodları kayıt altına alınmıştır. Geçen yıl bir muhtarın daveti elinde olmadığını söylemesi üzerine bu yıl çift kanaldan (PTT + e-Devlet bildirimi) gönderim yapılmaktadır.",
          etiketler: ["Kaymakamlık"],
          yetkililer: ["ozelMemur", "ozelMemur2"],
          birimler: ["ozelKalem"],
          bitis: gunEkle(8, 17),
          kontrol: [
            {
              ad: "Davet listesi",
              maddeler: [
                { metin: "Liste güncellendi", atanan: "ozelMemur", tamam: true },
                { metin: "Mektuplar matbaada", atanan: "ozelMemur2", tamam: true },
                { metin: "PTT'ye iletildi", atanan: "ozelMemur" },
                { metin: "RSVP takip tablosu açıldı", atanan: "ozelMemur" },
              ],
            },
          ],
        },
        {
          key: "toren-celenk",
          baslik: "Çelenk siparişi & temin",
          aciklama:
            "19 Mayıs töreninde Atatürk Anıtı'na sunulacak resmi çelenkler için 4 ayrı kurum adına sipariş verilmiştir: Kaymakamlık, Milli Eğitim Müdürlüğü, Belediye Başkanlığı ve Tekman Garnizon Komutanlığı. Çelenk standart boyutu 1.5 metre yükseklik, beyaz karanfil ve kırmızı gül kombinasyonu, kurum amblemli kurdele ile tasarlanmıştır. Sipariş Tekman'daki en köklü çiçekçi 'Karanfil Çiçekçilik'ten verilmiş, ödeme her kurumun kendi bütçesinden yapılmaktadır. Çelenkler tören günü sabah 07:00'de Atatürk Anıtı önüne teslim edilecek; protokol sırasında her kurum amiri kendi çelenklerini koyacaktır. Şehit ailelerinin koyacağı 1 ek çelenk de hazırlanmaktadır.",
          etiketler: ["Kurumsal"],
          tamamlandi: true,
        },
      ],
    },
    {
      ad: "Stadyum & Gösteri Provası",
      yetkililer: ["milliMemur"],
      birimler: ["milliEgitim", "lise", "imamHatip", "genclikSpor"],
      kartlar: [
        {
          key: "toren-prova-1",
          baslik: "Genel prova (15.05.2026 — 13:00)",
          aciklama:
            "19 Mayıs töreninin genel provası 15.05.2026 Cuma saat 13:00'te Tekman Stadyumu'nda gerçekleştirilecektir. Provaya katılacak ekipler: 4 farklı okul halk oyunları ekibi (Tekman Anadolu Lisesi 'Bar', İmam Hatip 'Erzurum oyunları', Atatürk Ortaokulu 'Çayda Çıra', Cumhuriyet İlkokulu 'Tıka' minik versiyonu), Halk Eğitim Merkezi bandosu, dans gösteri ekipleri, gençlik koşusu ekibi ve kortej ekibi. Toplam 213 öğrenci, 47 öğretmen-koreograf prova kapsamına alınmaktadır. Prova sırasında ses sistemi, sahne dekorasyonu, kostüm dağıtımı, ışıklandırma simülasyonu ve final sıralaması test edilir. Kostümler çoğunlukla okul müdürlükleri kasasından çıkarılmıştır; eksik kostümler matbaadan kiralanmıştır. Sahne ve podyum belediye tarafından kurulur. Stadyum tahsis yazısı Belediye Spor İşleri Müdürlüğü'nden alınmıştır; saat 12:00-15:00 arası başka faaliyet planlanmamıştır. Prova sırasında 1 ambulans + sıhhi tedbir 1 kişi hazır kuvvet tutulacaktır. Su ikram noktası kurulmuş; öğrenciler için sandviç dağıtımı yapılacaktır. Geçen yılki provada bir öğrencinin sıcaktan baygınlık geçirmesi sonrasında bu yıl ek su ve gölge tedbiri alınmıştır.",
          etiketler: ["Eğitim"],
          yetkililer: ["liseMudur", "imamHatipMudur", "milliMemur"],
          birimler: ["lise", "imamHatip", "ortaokul"],
          bitis: gunEkle(10, 13),
          kontrol: [
            {
              ad: "Hazırlıklar",
              maddeler: [
                { metin: "Stadyum tahsis yazısı", atanan: "yaziMemur", tamam: true },
                { metin: "Ses sistemi kurulumu", atanan: "halkEgitimMudur" },
                { metin: "Su ikram noktası", atanan: "ozelMemur2", tamam: true },
                { metin: "Sıhhi tedbir — 1 ambulans", atanan: "saglikMemur" },
              ],
            },
          ],
        },
        {
          key: "toren-genc-gosteri",
          baslik: "Gençlik dans ve halk oyunları gösterileri",
          aciklama:
            "Gençliğin Atatürk'e armağanı kapsamında, ilçemizin 3 farklı eğitim kurumundan derlenen toplam 78 öğrenci dans ve halk oyunları gösterilerini sunacaktır. Ekip dağılımı: Anadolu Lisesi - 24 öğrenci 'Erzurum Bar' (geleneksel halk oyunu), İmam Hatip - 22 öğrenci 'Modern Dans' (Atatürk'e ithaf), Atatürk Ortaokulu - 32 öğrenci 'Coşku Dansı' (gençlik temalı koreografi). Kostümler okul müdürlüklerinin kostüm sandığında hazır halde olup, eksiksiz şekilde tamamlanmıştır. Müzik listesi 19 Mayıs marşı, gençlik şarkıları (Aşkın Nur Yengi 'Gençlik Marşı', Mustafa Sandal 'İste'), modern halk oyunu enstrümantal versiyonları, Atatürk'e dair konuşma kayıtları içerir. Müzik dosyaları MP3 formatında ses sistemi operatörüne teslim edilmiştir. Dans hocaları gönüllü olarak çalışmakta olup haftalık prova programı hazırlanmıştır. Sahne kostüm değişimi için kulis alanı stadyumda hazırlanmaktadır. Velilere bilgilendirme yapılmış, çocukların güvenliği için her ekibin başında 1 öğretmen kalmaktadır.",
          etiketler: ["Eğitim"],
          yetkililer: ["liseMudur"],
          birimler: ["lise"],
          bitis: gunEkle(13, 17),
        },
        {
          key: "toren-bando",
          baslik: "Bando provası — İstiklal Marşı + 19 Mayıs marşı",
          aciklama:
            "Tekman Halk Eğitim Merkezi bünyesinde faaliyet gösteren amatör bandonun (12 sanatçı) 19 Mayıs töreni provası başarıyla tamamlanmıştır. Bandoda yer alan enstrümanlar: 3 trompet, 2 trombon, 2 saksafon, 1 klarnet, 1 davul, 1 zil, 1 bateri, 1 bas tuba. Provada üç ana eser çalışılmıştır: 1) İstiklal Marşı (saygı duruşu sonrası, 81 saniye), 2) 19 Mayıs Atatürk'ü Anma Marşı (orijinal beste, 4 dakika), 3) Gençlik Marşı (kortej geçişi sırasında çalınacak, 3 dakika). Bando şefi olarak Halk Eğitim Merkezi müzik öğretmeni Sn. Ferhat Akın görev yapmaktadır. Prova sırasında ses tonları, ritim uyumu ve ekip senkronizasyonu test edilmiş; düzeltmeler yapılmıştır. Üniformalar kırmızı ceket-siyah pantolon kombinasyonu olup ütülü halde hazır tutulmaktadır.",
          etiketler: ["Eğitim", "Kurumsal"],
          tamamlandi: true,
        },
      ],
    },
    {
      ad: "Güvenlik & Lojistik",
      yetkililer: ["emniyetAmir"],
      birimler: ["emniyet", "belediye", "saglik"],
      kartlar: [
        {
          key: "toren-guvenlik-plan",
          baslik: "Tören günü güvenlik planı",
          aciklama:
            "19 Mayıs tören günü için kapsamlı güvenlik planı İlçe Emniyet Amirliği tarafından hazırlanmış ve İlçe Jandarma Komutanlığı ile koordineli yürütülecektir. Plan kapsamında: 1) Hükümet Konağı önündeki açılış alanına X-ray detektörü ve metal dedektör konuşlandırılacak (törene gelenlerin geçişi için), 2) Atatürk Anıtı çevresinde 360 derece kamera koruması, 3) Stadyum giriş kapısında 4 noktada dedektör, 4) Kortej güzergahında 12 noktada güvenlik personeli, 5) Sayın Vali Yardımcısı için VIP koruma protokolü uygulanacak, 6) Stadyum içerisinde sivil polis 8 personel devriye yapacak, 7) Drone gözetimi yedek olarak hazır tutulacak. Toplam 47 polis, 28 jandarma, 12 sivil savunma personeli görev alacaktır. Plan ÖSYM sınav günü deneyimine benzer şekilde tasarlanmıştır. Olası senaryolar: bireysel taşkın, yumruklaşma, sahte bomba ihbarı, drone uçuşu, kalp krizi/baygınlık. Acil durum müdahale ekibi (AKM-AFAD ortak) hazır kuvvet halinde tutulacaktır. Geçen yıl olaysız geçen tören için bu yıl da tedbirler arttırılarak sürdürülmektedir.",
          etiketler: ["Güvenlik", "Kaymakamlık"],
          yetkililer: ["emniyetAmir", "trafikMemur"],
          birimler: ["emniyet"],
          bitis: gunEkle(13, 17),
          kontrol: [
            {
              ad: "Plan",
              maddeler: [
                { metin: "Güzergah krokisi", atanan: "trafikMemur", tamam: true },
                { metin: "X-ray talebi", atanan: "emniyetMemur" },
                { metin: "VIP koruma planı", atanan: "emniyetAmir" },
              ],
            },
          ],
        },
        {
          key: "toren-saglik",
          baslik: "Sağlık tedbiri — 1 ambulans + 2 sağlık personeli",
          aciklama:
            "Tören günü tüm güzergah ve stadyum alanı için 1 ambulans + 2 sağlık personeli (1 doktor, 1 paramedik) hazır kuvvet halinde tutulacaktır. Stadyum girişinde 'Acil Sağlık Noktası' kurulacak; renkli çadırla işaretlenecek, kolayca tanınabilir hale getirilecektir. Olası vakalar: bayılma (sıcak, kalabalık), gençlik koşusu sırasında yaralanma, soluk darlığı, alerji ataki, küçük kesilmeler. Sağlık çadırında temel ilaç deposu, oksijen kullanımı, ilk yardım kiti, defibrilatör (otomatik) bulunmaktadır. Personel 112 ekibinden seçilmiş, 5 saat görev alacaktır. Daha ciddi durumlar için Tekman Devlet Hastanesi ile direkt iletişim hattı açılmaktadır.",
          etiketler: ["Sağlık"],
          yetkililer: ["saglikMemur"],
          birimler: ["saglik"],
          bitis: gunEkle(13, 8),
        },
        {
          key: "toren-temizlik",
          baslik: "Anıt çevresi ve stadyum temizliği",
          aciklama:
            "Tören günü öncesi 16.05.2026 Salı günü, Belediye Temizlik İşleri Müdürlüğü ekipleri Atatürk Anıtı, Hükümet Konağı önü, kortej güzergahı (Cumhuriyet Caddesi, Atatürk Caddesi) ve Tekman Stadyumu çevresinde derinlemesine temizlik yapacaktır. Temizlik kapsamı: cadde-yoldaki çöp toplama, anıt çevresinde kuru yapraklar ve toz, stadyum tribün koltukları silinmesi, sahil yan duvarlarının basınçlı su ile yıkanması, ışıkların açılma testi, peyzaj alanlarına çiçek yenilenmesi, atık konteynerlerinin gizlenmesi/yeri değiştirilmesi. Belediye temizlik ekibi sabah 06:00'dan akşam 18:00'e kadar 14 personel ile çalışacaktır. Tören sonrası 19.05.2026 akşamı da temizlik organizasyonu yapılacaktır. Temizlik çalışması Ahşap köprü ve geçiş yollarındaki güvenliği de etkileyecek şekilde tüm güzergah dahil edilmiştir.",
          etiketler: ["Saha"],
          yetkililer: ["belediyeFenIsleri"],
          birimler: ["belediye"],
          bitis: gunEkle(11, 17),
        },
      ],
    },
    {
      ad: "Basın & Yayın",
      yetkililer: ["ozelMemur"],
      birimler: ["ozelKalem"],
      kartlar: [
        {
          key: "toren-basin",
          baslik: "Yerel basın bilgilendirme & akreditasyon",
          aciklama:
            "19 Mayıs törenini haberleştirmek üzere 5 yerel medya organı (Tekman Haber, Erzurum Doğu Pusulası, Tekman Yerel TV, Doğu Anadolu Gazetesi, Tekman Radyo) için akreditasyon kartları hazırlanmıştır. Akreditasyon kartında muhabirin adı-soyadı, kurumu, fotoğrafı, kaymakamlık logosu ve özel barkod bulunmaktadır; bu sistem program alanına yetkisiz girişi engellemekte ve protokol mensuplarının fotoğraflanma gizliliğini sağlamaktadır. Program akışı, fotoğraf izinleri ve röportaj bölgesi her muhabire önceden iletilmiştir. Sayın Kaymakamımız konuşma sonrası kısa basın toplantısı için 15 dakika ayıracaktır. Akreditasyon listesini Sayın Kaymakam bizzat onaylamış, basın koordinasyonu için Özel Kalem Müdürlüğü görev almıştır. Sosyal medya yayınları için fotoğraf-video paylaşım protokolü hazırlanmıştır.",
          etiketler: ["Kaymakamlık", "Kurumsal"],
          yetkililer: ["ozelMemur"],
          birimler: ["ozelKalem"],
          bitis: gunEkle(11, 17),
          yorumlar: [
            { yazan: "ozelAmir", icerik: "Akreditasyon listesini bizzat onaylayacağım, tamamlanınca getirin.", gunFarki: -1 },
          ],
        },
        {
          key: "toren-konusma",
          baslik: "Kaymakam konuşma metni",
          aciklama:
            "Sayın Kaymakamımızın 19 Mayıs töreninde yapacağı konuşma metni hazırlanmaktadır. Konuşma süresi yaklaşık 12 dakika olarak planlanmış olup, içerikte şu temalar yer alacaktır: 1) Atatürk'ün 19 Mayıs 1919'da Samsun'a çıkışının tarihi anlamı, 2) Milli Mücadele'nin başlangıcı ve halk dayanışması, 3) Cumhuriyetin kuruluşundan günümüze değin kazanımlar, 4) Atatürk'ün gençliğe hitabı ve emanetleri, 5) Tekman gençlerinin sahip olduğu fırsatlar (eğitim, kültür, spor), 6) Çocuk-genç-genç dayanışması ve gönüllülük, 7) Atatürk ilke ve inkılaplarının çağdaş yansımaları, 8) Milli birlik ve beraberlik mesajı. Sayın Kaymakam, geçmiş yıllardaki konuşmalardan farklı olarak bu yıl 'Atatürk'ün 1919'daki yolculuğu' ve 'gençlik gücüne vurgu' temalarına odaklanılmasını talimatlandırmıştır. Metin Özel Kalem Müdürlüğü tarafından taslak olarak hazırlanmış, Sayın Kaymakamın bizzat revize ettiği son versiyonu protokol kit'ine eklenecektir. Konuşma sırasında protokol için duyuru anonsu hazır tutulacak, ses sistemi 2 yedek mikrofon ile çalışacaktır.",
          etiketler: ["Kaymakamlık"],
          yetkililer: ["ozelAmir"],
          bitis: gunEkle(12, 17),
          yorumlar: [
            { yazan: "kaymakam", icerik: "Bu sene Atatürk'ün 1919'daki yolculuğuna ve gençliğe odaklanalım.", gunFarki: -2 },
          ],
        },
      ],
    },
  ],
};
