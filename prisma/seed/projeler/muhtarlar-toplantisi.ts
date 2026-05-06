// Proje: Aylık Muhtarlar Toplantısı ve KÖYDES Koordinasyonu
// 38 köy + 12 mahalle muhtarıyla aylık toplantı, KÖYDES yatırım takibi,
// köy talep ve dilekçelerinin kaymakamlık makamı koordinasyonunda değerlendirilmesi.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";
import { doc, h2, h3, p, ul, ol, b, i } from "../rt";

export const muhtarlarToplantisiProjesi: ProjeSeed = {
  key: "muhtarlar",
  ad: "Aylık Muhtarlar Toplantısı ve KÖYDES Koordinasyonu",
  aciklama:
    "Tekman ilçesinde 38 köy ve 12 mahalle muhtarıyla her ayın ilk çarşambası gerçekleştirilen aylık toplantı; KÖYDES (Köy Destek) yatırım programı kapsamındaki yol-su-elektrik projelerinin saha takibi; köy talep dilekçelerinin değerlendirilmesi ve muhtar maaş ödemeleri ile e-Devlet muhtar yetkilerinin tanıtım koordinasyonu.",
  olusturan: "ozelAmir",
  yetkililer: ["kaymakam", "ozelAmir", "yaziAmir"],
  birimler: [
    "ozelKalem",
    "yaziIsleri",
    "muhtarlik",
    "koyMuhtar",
    "belediye",
    "karayollari",
    "tedas",
    "ptt",
    "tarim",
  ],
  kapakRenk: "lacivert",
  kapakIkon: "users-round",
  yildizli: true,
  listeler: [
    {
      ad: "Toplantı Hazırlığı",
      yetkililer: ["ozelAmir", "ozelMemur"],
      birimler: ["ozelKalem", "yaziIsleri"],
      kartlar: [
        {
          key: "muhtar-toplanti-mayis",
          baslik: "Mayıs ayı muhtarlar toplantısı gündeminin hazırlanması",
          aciklama:
            "Mayıs 2026 muhtarlar toplantısı, ayın ilk çarşambası saat 14:00'te Kaymakamlık makam toplantı salonunda gerçekleştirilecektir. Gündem; KÖYDES yatırım ilerlemesi, köy taleplerinin değerlendirilmesi, yaz dönemi yangın hazırlığı, hasat öncesi tarım destekleri ve e-Devlet muhtar modülü bilgilendirmesi başlıklarından oluşmaktadır.",
          aciklamaDokuman: doc(
            h2("Toplantı Bilgileri"),
            p(
              b("Tarih:"),
              " Her ayın ilk çarşambası, saat 14:00. ",
              b("Yer:"),
              " Kaymakamlık makam toplantı salonu. ",
              b("Katılım:"),
              " 38 köy + 12 mahalle muhtarı + ilgili daire amirleri.",
            ),
            h3("Mayıs Gündemi"),
            ol(
              "Açılış konuşması — Sayın Kaymakam",
              "Nisan toplantısı kararlarının takibi",
              "KÖYDES yatırım ilerleme raporu (Karayolları + Belediye)",
              "Köy talep dilekçelerinin değerlendirilmesi (38 dilekçe)",
              "Yaz dönemi yangın ve afet hazırlığı — AFAD brifingi",
              "Hasat öncesi tarım destekleri — Tarım Müdürlüğü",
              "e-Devlet muhtar modülü tanıtımı — PTT",
              "Soru-cevap ve dilek-temenni",
            ),
            h3("Ön Hazırlık"),
            ul(
              "Davet yazıları EBYS üzerinden 5 gün önce gönderildi",
              "Her muhtara köy bazlı dosya hazırlandı",
              "İkram listesi ve toplantı odası lojistiği — Özel Kalem",
              "Toplantı tutanağı için kayıt cihazı — Yazı İşleri",
            ),
          ),
          etiketler: ["Kaymakamlık", "Kurumsal"],
          yetkililer: ["ozelAmir", "ozelMemur"],
          birimler: ["ozelKalem"],
          baslangic: gunEkle(-3),
          bitis: gunEkle(2, 14),
          kontrol: [
            {
              ad: "Hazırlık adımları",
              maddeler: [
                { metin: "Davet yazıları gönderildi", atanan: "yaziMemur", tamam: true, tamamlanmaGun: -2 },
                { metin: "Gündem maddeleri kesinleşti", atanan: "ozelAmir", tamam: true, tamamlanmaGun: -1 },
                { metin: "Toplantı odası ve sunum hazırlığı", atanan: "ozelMemur2" },
                { metin: "Tutanak şablonu hazır", atanan: "yaziMemur2" },
              ],
            },
            {
              ad: "Lojistik",
              maddeler: [
                { metin: "İkram (çay-kurabiye) hazırlığı", atanan: "ozelMemur2" },
                { metin: "Mikrofon ve ses sistemi testi", atanan: "ozelMemur2" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "ozelAmir",
              icerik:
                "Davet yazıları gönderildi, geri dönüş 32 muhtardan geldi. Doğanca ve Yolüstü muhtarlarından henüz teyit yok, telefonla aranacaklar. @<ozelMemur> aramaları sen üstlenebilir misin?",
              gunFarki: -1,
              saat: 10,
            },
            {
              yazan: "ozelMemur",
              icerik:
                "Tabii, bu öğleden sonra arıyorum. Doğanca muhtarı geçen ay sağlık raporundaydı, vekili katılabilir muhtemelen.",
              gunFarki: -1,
              saat: 14,
              yanit: 0,
            },
            {
              yazan: "kaymakam",
              icerik:
                "Mayıs gündemi yoğun ama her muhtara söz hakkı tanıyalım. Köy taleplerinde özellikle içme suyu ve sokak aydınlatmasına öncelik verin. Toplantıyı 14:00-17:00 arasında bitirelim.",
              gunFarki: 0,
              saat: 9,
            },
          ],
          ekler: [
            { ad: "mayis-gundem.pdf", mime: "application/pdf", boyut: 96_000, yukleyen: "ozelAmir" },
            { ad: "muhtar-davet-listesi.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", boyut: 24_000 },
          ],
        },
        {
          key: "muhtar-katilim-takip",
          baslik: "Aylık katılım takibi ve mazeret değerlendirmesi",
          aciklama:
            "Muhtarların aylık toplantı katılım oranı resmi olarak takip edilmektedir. Üst üste 3 toplantıya mazeretsiz katılmayan muhtarlar hakkında 442 sayılı Köy Kanunu gereği değerlendirme yapılır. Mazeret bildirimi yazılı veya EBYS üzerinden Özel Kalem Müdürlüğü'ne iletilmelidir.",
          aciklamaDokuman: doc(
            h2("Katılım Takibi"),
            p(
              "442 sayılı Köy Kanunu ve 5393 sayılı Belediye Kanunu çerçevesinde, muhtarların ",
              b("aylık koordinasyon toplantısına katılımı görev sorumluluğudur"),
              ". Mazeretsiz devamsızlık disiplin değerlendirmesi gerektirir.",
            ),
            h3("Geçmiş 3 Ay Tablosu"),
            ul(
              "Şubat — 50 muhtardan 47 katılım (3 mazeretli)",
              "Mart — 50 muhtardan 45 katılım (4 mazeretli, 1 mazeretsiz)",
              "Nisan — 50 muhtardan 48 katılım (2 mazeretli)",
            ),
            h3("Mazeret Türleri"),
            ol(
              "Sağlık raporu — kabul",
              "Aile yakınının vefatı — kabul",
              "Birinci derece akrabalık merasimi — kabul",
              "Hava muhalefeti (yol kapanması) — kabul",
              "Diğer — Kaymakamlık makamı takdiri",
            ),
          ),
          etiketler: ["Kurumsal", "Yazışma"],
          yetkililer: ["ozelMemur"],
          birimler: ["ozelKalem"],
          bitis: gunEkle(5, 17),
        },
        {
          key: "muhtar-onceki-tutanak",
          baslik: "Nisan toplantısı tutanak takibi ve karar uygulama raporu",
          aciklama:
            "Nisan 2026 muhtarlar toplantısında alınan 14 karardan 9'u tamamlanmış, 4'ü süreçte, 1'i bütçe nedeniyle ertelenmiştir. Mayıs toplantısında her karar tek tek değerlendirilecek ve geciken kalemler için sorumlu birimlerden açıklama istenecektir.",
          aciklamaDokuman: doc(
            h2("Karar Takip Tablosu"),
            p(
              "Nisan toplantısında alınan toplam ",
              b("14 karardan"),
              " 9'u tamamlandı, 4'ü süreçte, 1'i ertelendi.",
            ),
            h3("Tamamlanan Kararlar"),
            ul(
              "Karaağaç köyü içme suyu deposu — onarıldı",
              "Demirkent yol bakımı — yapıldı",
              "Yolüstü sokak aydınlatması — 8 lamba değişti",
              "5 köyde muhtar telefon hattı tahsisi — PTT",
            ),
            h3("Süreçte Olanlar"),
            ol(
              "Doğanca köyü kanalizasyon — proje aşaması (Belediye)",
              "Yeniköy köy okulu çatı tamiri — ihalede (Mal Müd.)",
              "3 köyde TEDAŞ trafosu yenileme — Eylül planı",
              "Köy yangın söndürme tüpü dağıtımı — devam",
            ),
            h3("Ertelenenler"),
            p(
              i("Çayırlı köyü taziye evi inşaatı"),
              " — bütçe yetersizliği nedeniyle 2027'ye ertelendi.",
            ),
          ),
          etiketler: ["Yazışma"],
          yetkililer: ["yaziAmir", "yaziMemur"],
          birimler: ["yaziIsleri"],
          bitis: gunEkle(2, 13),
        },
      ],
    },
    {
      ad: "KÖYDES Yatırımları",
      yetkililer: ["belediyeAmir"],
      birimler: ["belediye", "karayollari", "tedas"],
      kartlar: [
        {
          key: "muhtar-koydes-yol",
          baslik: "KÖYDES yol yapım projeleri — Mayıs ilerleme raporu",
          aciklama:
            "2026 KÖYDES programı kapsamında ilçemize 8 yol projesi tahsis edilmiştir. Toplam 47 km köy yolunun stabilize/asfalt yenilenmesi planlanmaktadır. Mayıs sonu itibarıyla 3 proje tamamlanmış, 4 proje yapım aşamasında, 1 proje hava şartları nedeniyle ertelenmiştir.",
          aciklamaDokuman: doc(
            h2("KÖYDES Yol Programı 2026"),
            p(
              "İçişleri Bakanlığı tarafından yürütülen ",
              b("Köy Destek (KÖYDES) Programı"),
              " kapsamında ilçemize tahsis edilen 8 yol projesinin Mayıs ilerleme raporu aşağıdadır. Toplam bütçe 14,2 milyon TL.",
            ),
            h3("Tamamlanan Projeler"),
            ul(
              "Karaağaç-Yolüstü hattı (8 km) — asfalt yenileme tamam",
              "Demirkent köyü içi yol (3 km) — stabilize tamam",
              "Yeniköy ulaşım yolu (5 km) — asfalt tamam",
            ),
            h3("Yapım Aşamasında"),
            ol(
              "Doğanca-Çayırlı bağlantı yolu (12 km) — %65 ilerleme",
              "Karaçoban hattı tamiri (7 km) — %40 ilerleme",
              "5 köy menfez ve drenaj — %50 ilerleme",
              "Bayram öncesi tamamlanması beklenen kısımlar var",
            ),
            h3("Ertelenen"),
            p(
              "Yüksek rakımdaki ",
              b("Tepe köyü asfalt"),
              " projesi, kar erimesinin gecikmesi nedeniyle Haziran sonuna ertelendi.",
            ),
          ),
          etiketler: ["Saha", "Kurumsal"],
          yetkililer: ["belediyeAmir", "belediyeFenIsleri"],
          birimler: ["belediye", "karayollari"],
          baslangic: gunEkle(-15),
          bitis: gunEkle(15, 17),
          kontrol: [
            {
              ad: "Saha kontrolü",
              maddeler: [
                { metin: "3 tamamlanan proje saha kontrolü", atanan: "belediyeFenIsleri", tamam: true },
                { metin: "Doğanca-Çayırlı yol denetimi", atanan: "belediyeFenIsleri" },
                { metin: "İlerleme raporu kaymakamlığa sunulacak", atanan: "belediyeAmir" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "belediyeAmir",
              icerik:
                "Karaağaç-Yolüstü hattı tamamlandı, açılışı muhtarımız ile yaptık. Doğanca-Çayırlı yolunda asfalt makinesi arızası nedeniyle 3 günlük gecikme oldu, hafta sonuna kadar telafi edilecek.",
              gunFarki: -2,
              saat: 11,
            },
            {
              yazan: "kaymakam",
              icerik:
                "Tamamlanan projeleri Mayıs toplantısında muhtarlarımıza tek tek bildirin. Doğanca-Çayırlı yolu kritik, takipçisi olun. @<belediyeAmir> haftalık fotoğraflı rapor istiyorum.",
              gunFarki: -1,
              saat: 9,
              yanit: 0,
            },
          ],
          ekler: [
            { ad: "koydes-ilerleme-mayis.pdf", mime: "application/pdf", boyut: 312_000 },
            { ad: "saha-fotograflari.zip", mime: "application/zip", boyut: 2_400_000, yukleyen: "belediyeFenIsleri" },
          ],
        },
        {
          key: "muhtar-koydes-su",
          baslik: "KÖYDES içme suyu projeleri — depo yenileme ve hat kontrolü",
          aciklama:
            "İlçemizdeki 12 köyde içme suyu deposu yenileme veya hat tamiri ihtiyacı bulunmaktadır. KÖYDES bütçesinden 6 köy için onay alınmış, kalan 6 köy 2027 programına eklenmiştir. Mayıs ayı içerisinde 2 köy deposunun yenileme işi tamamlanacaktır.",
          aciklamaDokuman: doc(
            h2("İçme Suyu Programı"),
            p(
              "Köy içme suyu altyapısı, ",
              b("442 sayılı Köy Kanunu"),
              " kapsamında muhtarlık yetkisinde olmakla birlikte yatırım finansmanı KÖYDES üzerinden sağlanır.",
            ),
            h3("2026 Onaylı Projeler"),
            ul(
              "Karaağaç köyü 100m³ depo yenileme — Mayıs içinde tamam",
              "Doğanca köyü hat tamiri (1.2 km) — Mayıs içinde tamam",
              "Yolüstü pompaj sistemi yenileme — Haziran",
              "Demirkent klorlama sistemi — Temmuz",
              "Yeniköy ana hat (2 km) — Ağustos",
              "Çayırlı yedek depo (60m³) — Eylül",
            ),
            h3("Su Kalitesi"),
            p(
              "Tüm köy depoları ",
              i("İl Sağlık Müdürlüğü laboratuvarında 3 ayda bir mikrobiyolojik analize"),
              " tabi tutulmaktadır. Mayıs ayı sonuçları temizdir.",
            ),
          ),
          etiketler: ["Sağlık", "Saha"],
          yetkililer: ["belediyeAmir", "saglikAmir"],
          birimler: ["belediye", "saglik"],
          bitis: gunEkle(20, 17),
        },
        {
          key: "muhtar-koydes-elektrik",
          baslik: "TEDAŞ ile sokak aydınlatması ve trafo yenileme koordinasyonu",
          aciklama:
            "TEDAŞ Tekman İşletme Şefliği ile yapılan koordinasyonda, 8 köyde sokak aydınlatması yenileme, 3 köyde trafo değişikliği planlanmıştır. Yatırım programı yıl sonuna kadar tamamlanacaktır. Muhtarlık şikayetleri merkezi takip sistemine alınmıştır.",
          aciklamaDokuman: doc(
            h2("Elektrik Altyapı Programı"),
            p(
              "TEDAŞ ve İlçe Kaymakamlığı arasında imzalanan ",
              b("2026 İşbirliği Protokolü"),
              " kapsamında köy elektrik altyapı yatırımları aşağıda listelenmiştir.",
            ),
            h3("Sokak Aydınlatması"),
            ul(
              "8 köyde toplam 124 lamba LED dönüşümü",
              "Ortalama enerji tasarrufu: %62",
              "Şikayet bildirim hattı: ALO 186",
              "Muhtarlardan gelen 18 talep dilekçesi karşılandı",
            ),
            h3("Trafo Yenileme"),
            ol(
              "Karaçoban hattı 250 kVA trafo — Haziran",
              "Doğanca köyü 100 kVA trafo — Temmuz",
              "Yolüstü hattı 160 kVA trafo — Eylül",
            ),
          ),
          etiketler: ["Saha", "Kurumsal"],
          yetkililer: ["tedasSef"],
          birimler: ["tedas"],
          bitis: gunEkle(25, 17),
        },
      ],
    },
    {
      ad: "Köy Talepleri",
      yetkililer: ["yaziAmir"],
      birimler: ["yaziIsleri", "muhtarlik", "koyMuhtar"],
      kartlar: [
        {
          key: "muhtar-talep-dilekce",
          baslik: "Mayıs ayı köy talep dilekçeleri — değerlendirme ve sevk",
          aciklama:
            "Mayıs ayında muhtarlıklar tarafından Yazı İşleri Müdürlüğü'ne intikal eden 38 köy talep dilekçesi tek tek değerlendirilecektir. Talepler genellikle yol bakım, içme suyu, sokak aydınlatması, sağlık ocağı personeli ve yangın söndürme tüpü konularını içermektedir.",
          aciklamaDokuman: doc(
            h2("Talep Dağılımı"),
            p(
              "Mayıs ayı içerisinde 38 köyden gelen toplam ",
              b("38 dilekçe"),
              " konularına göre sınıflandırıldı:",
            ),
            ul(
              "Yol bakım talepleri — 12 dilekçe",
              "İçme suyu / arıza — 8 dilekçe",
              "Sokak aydınlatması — 7 dilekçe",
              "Sağlık ocağı personel talebi — 4 dilekçe",
              "Yangın söndürme tüpü — 3 dilekçe",
              "Köy konağı tamir — 2 dilekçe",
              "Diğer (eğitim, ulaşım) — 2 dilekçe",
            ),
            h3("Sevk Süreci"),
            ol(
              "Yazı İşleri'nde ön değerlendirme",
              "İlgili birime havale (Belediye, TEDAŞ, MEB, vb.)",
              "15 gün içinde cevap zorunluluğu",
              "Cevap muhtara EBYS + posta ile bildirilir",
              "Çözülmeyen talepler bir sonraki toplantı gündeminde",
            ),
            p(
              i("3071 sayılı Dilekçe Hakkının Kullanılmasına Dair Kanun"),
              " gereği her dilekçeye yazılı cevap verilmesi zorunludur.",
            ),
          ),
          etiketler: ["Yazışma", "Kaymakamlık"],
          yetkililer: ["yaziAmir", "yaziMemur", "evrakKayit"],
          birimler: ["yaziIsleri"],
          baslangic: gunEkle(-5),
          bitis: gunEkle(8, 17),
          kontrol: [
            {
              ad: "Dilekçe işlem",
              maddeler: [
                { metin: "Dilekçeler ön değerlendirildi", atanan: "evrakKayit", tamam: true },
                { metin: "İlgili birimlere havale yapıldı", atanan: "yaziMemur", tamam: true },
                { metin: "15 gün içinde cevap takibi", atanan: "yaziMemur2" },
                { metin: "Mayıs toplantısında brifing", atanan: "yaziAmir" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "yaziAmir",
              icerik:
                "38 dilekçenin 32'sine cevap verildi. 6 dilekçe TEDAŞ ve Karayolları'nda bekliyor. @<tedasSef> Karaçoban hattı dilekçesine bu hafta cevap verebilir misiniz?",
              gunFarki: -1,
              saat: 13,
            },
          ],
          ekler: [
            { ad: "mayis-dilekce-listesi.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", boyut: 56_000 },
          ],
        },
        {
          key: "muhtar-maas-odeme",
          baslik: "Muhtar maaş ödemeleri — Mal Müdürlüğü koordinasyonu",
          aciklama:
            "442 sayılı Köy Kanunu kapsamında, muhtarlara ödenen aylık ödenek İçişleri Bakanlığı bütçesinden Mal Müdürlüğü kanalıyla yapılmaktadır. Mayıs ayı ödemesi, ay sonu itibarıyla 50 muhtarın hesabına havale edilecektir. Ödenek tutarı brüt 8.500 TL'dir.",
          aciklamaDokuman: doc(
            h2("Muhtar Ödenekleri"),
            p(
              "442 sayılı Köy Kanunu ve 2025 yılı Bakanlar Kurulu kararıyla belirlenen muhtar ödeneği ",
              b("brüt 8.500 TL/ay"),
              " olup, kesintiler sonrası net 7.420 TL olarak ödenmektedir.",
            ),
            h3("Ödeme Süreci"),
            ol(
              "Her ayın son haftası — Mal Müd. ödenek talebi",
              "İçişleri Bakanlığı bütçe transferi",
              "Banka havalesi — Ziraat Bankası kanalıyla",
              "Ödeme dekontu Yazı İşleri'ne arşivlenir",
            ),
            h3("İletişim"),
            p(
              "Ödeme ile ilgili sorular için ",
              b("İlçe Mal Müdürlüğü maaş servisi"),
              " — dahili 124. Banka değişikliği sadece dilekçe ile yapılır.",
            ),
          ),
          etiketler: ["Yazışma", "Kurumsal"],
          yetkililer: ["malAmir", "malMemur"],
          birimler: ["mal"],
          bitis: gunEkle(28, 17),
        },
      ],
    },
    {
      ad: "Tamamlananlar",
      kartlar: [
        {
          key: "muhtar-edevlet-tanitim",
          baslik: "e-Devlet muhtar yetkileri tanıtım eğitimi",
          aciklama:
            "İçişleri Bakanlığı'nın yeni yayınladığı e-Devlet muhtar modülü tanıtım eğitimi, PTT Tekman müdürlüğü işbirliğiyle 50 muhtara verilmiştir. Eğitim sonunda muhtarlar artık ikametgâh belgesi, vukuatlı nüfus kayıt örneği ve köy nüfus durumu sorgulama yetkilerini elektronik olarak kullanabilmektedir.",
          aciklamaDokuman: doc(
            h2("e-Devlet Muhtar Modülü"),
            p(
              "İçişleri Bakanlığı'nın 2026 yılı dijitalleşme çalışmaları kapsamında ",
              b("muhtarlara özel e-Devlet modülü"),
              " devreye alınmıştır. 50 muhtarımız eğitime katılmış ve modül kullanımı hakkında bilgilendirilmiştir.",
            ),
            h3("Yeni Yetkiler"),
            ul(
              "İkametgâh belgesi düzenleme — elektronik imzalı",
              "Vukuatlı nüfus kayıt örneği sorgulama",
              "Köy nüfus durumu raporu",
              "Adres beyan ve değişiklik takibi",
              "İmza onayı (sınırlı kapsam)",
            ),
            h3("Eğitim Çıktıları"),
            ol(
              "50 muhtara katılım belgesi düzenlendi",
              "Modül kullanım kılavuzu PDF olarak dağıtıldı",
              "PTT'de teknik destek noktası tanımlandı",
              "Bir aylık takip değerlendirmesi yapılacak",
            ),
          ),
          etiketler: ["Eğitim", "Kurumsal"],
          tamamlandi: true,
          yorumlar: [
            { yazan: "ozelAmir", icerik: "Eğitim memnuniyeti yüksek, tüm muhtarlar modülü aktif kullanıyor.", gunFarki: -10 },
          ],
          ekler: [
            { ad: "edevlet-tanitim-tutanagi.pdf", mime: "application/pdf", boyut: 124_000 },
          ],
        },
      ],
    },
  ],
};
