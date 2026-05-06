// Proje: YKS / LGS / KPSS Sınav Güvenliği Koordinasyonu
// Kaymakamlığın yıllık zorunlu güvenlik koordinasyon süreci.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";
import { doc, h2, h3, p, ul, ol, b, i } from "../rt";

export const sinavGuvenligiProjesi: ProjeSeed = {
  key: "sinav",
  ad: "2026 YKS ve LGS Sınav Güvenliği Koordinasyonu",
  aciklama:
    "İlçemizde gerçekleştirilecek sınavların binalarına ulaşım, güvenlik, sağlık, elektrik kesintisi ve gürültü tedbirlerine ilişkin koordinasyon.",
  olusturan: "milliAmir",
  yetkililer: ["kaymakam", "milliAmir", "emniyetAmir", "ozelAmir"],
  birimler: [
    "milliEgitim",
    "emniyet",
    "jandarma",
    "saglik",
    "tedas",
    "belediye",
    "lise",
    "ortaokul",
    "imamHatip",
    "afad",
    "itfaiye",
  ],
  kapakRenk: "turuncu",
  kapakIkon: "clipboard-list",
  yildizli: true,
  listeler: [
    {
      ad: "Planlama",
      yetkililer: ["milliMemur"],
      birimler: ["milliEgitim"],
      kartlar: [
        {
          key: "sinav-bina-tespit",
          baslik: "Sınav uygulama merkezleri tespit edildi",
          aciklama:
            "ÖSYM ve MEB Ölçme, Değerlendirme ve Sınav Hizmetleri Genel Müdürlüğü ile yapılan koordinasyonda, ilçemizde 2026 YKS ve LGS sınavlarının yapılacağı uygulama merkezleri tespit edilmiştir. YKS için 2 bina (Tekman Anadolu Lisesi - 16 salon, İmam Hatip Lisesi - 8 salon), LGS için 2 bina (Atatürk Ortaokulu - 14 salon, Cumhuriyet İlkokulu - 6 salon) olmak üzere toplam 4 bina ve 44 salon belirlenmiştir. Her salon kapasitesi 24 öğrenci olarak hesaplanmış, ilçemizde toplam 612 YKS adayı + 487 LGS adayı sınava girecektir. Bina tespitinde dikkat edilen kriterler: salon sayısı yeterliliği, bina yapısal güvenliği (Yapı Denetim Kuruluşu raporu), erişim kolaylığı (engelli rampası, asansör), klima ve havalandırma sistemi, jeneratör destekli yedek elektrik, su tesisatı yedeği, ses yalıtımı, gürültüden uzaklık, otopark olanağı. ÖSYM tarafından bina tahsis yazısı resmen alınmış, okul müdürleri sınav günü 'okul kapatma' yetkisini almıştır. Tespit kararı bina listesi PDF olarak Kaymakamlık makamına sunulmuş, MEB il müdürlüğü ile paralel paylaşılmıştır.",
          aciklamaDokuman: doc(
            h2("Tespit Süreci"),
            p(
              b("ÖSYM"),
              " ve ",
              b("MEB Ölçme, Değerlendirme ve Sınav Hizmetleri Genel Müdürlüğü"),
              " ile yapılan koordinasyonda, ilçemizde ",
              b("2026 YKS ve LGS"),
              " sınavlarının yapılacağı uygulama merkezleri tespit edilmiştir.",
            ),
            h3("Bina Dağılımı"),
            ul(
              ["YKS — ", b("Tekman Anadolu Lisesi"), " (16 salon) + ", b("İmam Hatip Lisesi"), " (8 salon)"],
              ["LGS — ", b("Atatürk Ortaokulu"), " (14 salon) + ", b("Cumhuriyet İlkokulu"), " (6 salon)"],
              ["Toplam ", b("4 bina, 44 salon"), "; salon kapasitesi 24 öğrenci"],
              [b("612 YKS adayı"), " + ", b("487 LGS adayı")],
            ),
            h2("Bina Seçim Kriterleri"),
            ul(
              "Salon sayısı yeterliliği ve yapısal güvenlik (Yapı Denetim Kuruluşu raporu)",
              "Erişim kolaylığı: engelli rampası, asansör",
              "Klima/havalandırma, jeneratör destekli yedek elektrik, su tesisatı yedeği",
              "Ses yalıtımı, gürültüden uzaklık, otopark olanağı",
            ),
            h3("Sonuç"),
            p(
              i("ÖSYM tarafından bina tahsis yazısı resmen alınmış"),
              "; okul müdürleri sınav günü ",
              b("okul kapatma yetkisini"),
              " almıştır. Bina listesi PDF olarak Kaymakamlık makamına sunulmuş ve MEB İl Müdürlüğü ile paralel paylaşılmıştır.",
            ),
          ),
          etiketler: ["Eğitim", "Kaymakamlık"],
          tamamlandi: true,
          ekler: [
            { ad: "bina-listesi.pdf", mime: "application/pdf", boyut: 56_000, yukleyen: "milliMemur" },
          ],
        },
        {
          key: "sinav-bina-kontrol",
          baslik: "Bina fiziki kontrol — sınav öncesi ön denetim",
          aciklama:
            "Tespit edilen 4 sınav binasının ÖSYM 'Sınav Uygulama Standartları' rehberine uygun şekilde fiziksel hazırlık denetimi yapılacaktır. Denetim 5 ana kategoride yürütülür: 1) Elektrik altyapısı (panel, ana sigorta, jeneratör otomatik geçiş, tüm prizlerin çalışırlığı, salonlarda çoklu priz dağılımı), 2) Su tesisatı (musluk, lavabo, tuvalet sürekli akış, sıcak su olanağı), 3) Isıtma-soğutma (klima ve kombilerin tüm mevsimde çalışırlığı, hava akış dengesi), 4) Ses sistemi (anons hoparlörü, salon temizliği, gong sesi seviyesi), 5) Güvenlik ekipmanları (yangın söndürücü tüpler dolu mu, alarm sistemi çalışır mı, acil çıkış kapıları kilitsiz mi). Ek olarak: salon kapı kilitleri, kalem-silgi-kağıt tesisleri, tahta ve yazı malzemeleri, sıra-masa düzeni, klima uzaktan kumanda pilleri, kamera kayıt sistemi (yedek), tuvalet hijyen kontrolü, su sebili dolulukları kontrol edilir. Anadolu Lisesi sınav öncesi rapor: elektrik panosu temiz + 16 klima sorunsuz + 1 salon kapı kilidi sıkıntılı (yenilenecek). İmam Hatip rapor: tüm salonlar uygun + temizlik planı çıkarıldı + engelli erişim tabela eklenmesi gerekecek. Atatürk Ortaokulu ve Cumhuriyet İlkokulu kontrolleri sınav haftasından 7 gün önce yapılacaktır. Eksiklikler tespit edildiğinde Belediye Fen İşleri tarafından öncelikli müdahale yapılır.",
          aciklamaDokuman: doc(
            h2("Yasal Dayanak"),
            p(
              "Tespit edilen 4 sınav binasının ",
              b("ÖSYM Sınav Uygulama Standartları"),
              " rehberine uygun şekilde fiziksel hazırlık denetimi yapılacaktır.",
            ),
            h2("Denetim Kategorileri"),
            ol(
              [b("Elektrik altyapısı"), " — panel, ana sigorta, jeneratör otomatik geçiş, priz dağılımı"],
              [b("Su tesisatı"), " — musluk, lavabo, tuvalet sürekli akış, sıcak su"],
              [b("Isıtma-soğutma"), " — klima ve kombi çalışırlığı, hava akış dengesi"],
              [b("Ses sistemi"), " — anons hoparlörü, salon temizliği, gong seviyesi"],
              [b("Güvenlik ekipmanları"), " — yangın söndürücü, alarm, acil çıkış kapıları"],
            ),
            p(
              "Ek kontroller: salon kapı kilitleri, sıra-masa düzeni, klima kumanda pilleri, ",
              b("yedek kamera kayıt sistemi"),
              ", tuvalet hijyeni, su sebili dolulukları.",
            ),
            h3("Saha Raporları"),
            ul(
              [b("Anadolu Lisesi"), " — elektrik panosu temiz, 16 klima sorunsuz, ", i("1 salon kapı kilidi yenilenecek")],
              [b("İmam Hatip"), " — tüm salonlar uygun, temizlik planı hazır, ", i("engelli erişim tabelası gerekli")],
              [b("Atatürk Ortaokulu"), " ve ", b("Cumhuriyet İlkokulu"), " kontrolleri sınav haftasından 7 gün önce"],
            ),
            p(
              "Eksiklikler tespit edildiğinde ",
              b("Belediye Fen İşleri"),
              " tarafından öncelikli müdahale yapılır.",
            ),
          ),
          etiketler: ["Eğitim", "Saha"],
          yetkililer: ["milliMemur", "liseMudur"],
          birimler: ["milliEgitim", "lise", "imamHatip"],
          bitis: gunEkle(20, 17),
          kontrol: [
            {
              ad: "Anadolu Lisesi",
              maddeler: [
                { metin: "Elektrik panosu kontrolü", atanan: "liseMudur", tamam: true },
                { metin: "Klima testi", atanan: "liseMudur" },
                { metin: "Salon kapı kilitleri", atanan: "liseMudur" },
              ],
            },
            {
              ad: "İmam Hatip",
              maddeler: [
                { metin: "Salon temizlik planı", atanan: "imamHatipMudur", tamam: true },
                { metin: "Engelli erişim kontrolü", atanan: "imamHatipMudur" },
              ],
            },
          ],
        },
      ],
    },
    {
      ad: "Güvenlik & Trafik",
      yetkililer: ["emniyetAmir"],
      birimler: ["emniyet", "jandarma"],
      kartlar: [
        {
          key: "sinav-trafik",
          baslik: "Sınav günü trafik düzenlemesi planı",
          aciklama:
            "ÖSYM sınavlarının uygulandığı saatlerde sınav binaları çevresinde araç trafiği özel düzenlemeye tabi tutulacak ve oluşturulan tedbir krokisi uygulanacaktır. 2918 sayılı Karayolları Trafik Kanunu çerçevesinde kapatılacak yollar: Anadolu Lisesi önündeki Cumhuriyet Caddesi (sabah 08:00-13:00), İmam Hatip Lisesi sokağı, Atatürk Ortaokulu girişindeki Sevgi Sokak ve Cumhuriyet İlkokulu önündeki Çınar Caddesi. Kapatılacak yolların tamamı uyarı levhaları ve trafik bariyerleriyle kontrol altına alınır; alternatif güzergah haritası medyada paylaşılır. Vekil otoparkları olarak Stadyum otoparkı, Belediye yan otopark ve PTT yan otopark açık tutulur. Korna ve gürültü oluşturan araçlar sınav saatlerinde bölgeye girememekle birlikte; çöp kamyonu, inşaat aracı vb. saatlerinin sınav süresi dışında çalışması belediye genelgesiyle kararlaştırılmıştır. Aday öğrenciler ve velileri için ücretsiz servis hattı belediye otobüsleriyle düzenlenir. Trafik tedbirleri için 18 trafik memuru görevlendirilmiş, görev krokisi her birine 1 hafta önceden tebliğ edilmiştir. Park alanları belirlenirken engelli aday öncelikli yere yerleştirilmiştir; 8 engelli aday için her sınav binasında ayrı park yeri ayrılmıştır. Yön levhaları belediyeden talep edilmiş, çarşamba günü montelenecektir. Plan onayından sonra basın bültenine konu edilecek, vatandaş bilgilendirilmesi yapılacaktır.",
          aciklamaDokuman: doc(
            h2("Yasal Dayanak"),
            p(
              b("2918 sayılı Karayolları Trafik Kanunu"),
              " çerçevesinde, sınav binaları çevresinde araç trafiği özel düzenlemeye tabi tutulacak ve oluşturulan tedbir krokisi uygulanacaktır.",
            ),
            h2("Kapatılacak Yollar"),
            ul(
              ["Anadolu Lisesi önü ", b("Cumhuriyet Caddesi"), " (08:00–13:00)"],
              "İmam Hatip Lisesi sokağı",
              ["Atatürk Ortaokulu girişi ", b("Sevgi Sokak")],
              ["Cumhuriyet İlkokulu önü ", b("Çınar Caddesi")],
            ),
            p("Tüm yollar uyarı levhaları ve trafik bariyerleriyle kontrol altına alınır; alternatif güzergah haritası medyada paylaşılır."),
            h3("Vekil Otoparklar"),
            ul("Stadyum otoparkı", "Belediye yan otopark", "PTT yan otopark"),
            h2("Tedbirler"),
            ul(
              ["Korna ve gürültü oluşturan araçlar bölgeye giremez; çöp/inşaat araçları için ", b("belediye genelgesi"), " ile saatler kısıtlandı"],
              "Aday ve veliler için ücretsiz belediye otobüs servisi",
              [b("18 trafik memuru"), " görevlendirildi; görev krokisi 1 hafta önceden tebliğ"],
              [b("8 engelli aday"), " için her binada ayrı park yeri"],
            ),
            p(
              i("Plan onayından sonra"),
              " basın bültenine konu edilecek; yön levhaları çarşamba günü montelenecektir.",
            ),
          ),
          etiketler: ["Güvenlik", "Saha"],
          yetkililer: ["trafikMemur", "emniyetAmir"],
          birimler: ["emniyet"],
          bitis: gunEkle(25, 17),
          kontrol: [
            {
              ad: "Plan",
              maddeler: [
                { metin: "Tedbir krokisi hazırlandı", atanan: "trafikMemur", tamam: true },
                { metin: "Park alanları belirlendi", atanan: "trafikMemur" },
                { metin: "Yön levhaları belediyeden istenecek", atanan: "trafikMemur" },
              ],
            },
          ],
        },
        {
          key: "sinav-bina-cevre",
          baslik: "Sınav binaları çevre güvenliği — devriye planı",
          aciklama:
            "Sınav binalarının fiziksel güvenliği için sabah 06:00'dan sınav bitimi 13:30'a kadar 4 noktada (her bina için 1) hazır kuvvet bekletilecektir. Hazır kuvvet kompozisyonu: her bina için 4 emniyet personeli + 1 yardımcı personel; merkez koordinasyon noktasında 1 nöbetçi şube müdürü. Görevler: bina çevresinde devriye, salon kapısında soru kitapçığı imha torbası nakli, sınav görevlilerinin güvenli ulaşımı, herhangi bir provokasyon/grup hareketi durumunda erken müdahale, mahalleye gelen yabancı kişilerin sorgulanması. Anadolu Lisesi ve İmam Hatip jandarma sahasından da takviye alınmaktadır. Çevre güvenlik planı kapsamında her sınav saatinde polis devriye otosu binalar arasında dolaşım yapacak; gerçekleştirilecek operasyon krokisi sabah brifinginde anlatılacaktır. Sınav süresince sosyal medyada provokasyon paylaşımı izleme yapılacak; tehdit oluşturursa derhal müdahale edilecektir. Geçen yıl tüm sınav günlerinde olaysız geçmiş, vatandaşlar planlamadan memnuniyet bildirmiştir.",
          aciklamaDokuman: doc(
            h2("Hazır Kuvvet Yapısı"),
            p(
              "Sınav binalarının fiziksel güvenliği için sabah ",
              b("06:00'dan sınav bitimi 13:30'a"),
              " kadar 4 noktada (her bina için 1) hazır kuvvet bekletilecektir.",
            ),
            ul(
              ["Her bina için ", b("4 emniyet personeli + 1 yardımcı")],
              ["Merkez koordinasyon noktasında ", b("1 nöbetçi şube müdürü")],
              [b("Anadolu Lisesi"), " ve ", b("İmam Hatip"), " için jandarma takviyesi"],
            ),
            h2("Görev Tanımı"),
            ul(
              "Bina çevresinde devriye",
              "Salon kapısında soru kitapçığı imha torbası nakli",
              "Sınav görevlilerinin güvenli ulaşımı",
              "Provokasyon/grup hareketinde erken müdahale",
              "Mahalleye gelen yabancı kişilerin sorgulanması",
            ),
            h3("İzleme & Müdahale"),
            p(
              "Her sınav saatinde polis devriye otosu binalar arasında dolaşım yapacak; operasyon krokisi sabah brifinginde anlatılacaktır. ",
              b("Sosyal medyada provokasyon paylaşımı izlenecek"),
              "; tehdit oluşturursa derhal müdahale edilecektir.",
            ),
            p(
              i("Geçen yıl tüm sınav günleri olaysız geçmiş"),
              ", vatandaşlar planlamadan memnuniyet bildirmiştir.",
            ),
          ),
          etiketler: ["Güvenlik"],
          yetkililer: ["emniyetMemur", "jandarmaAstsubay"],
          birimler: ["emniyet", "jandarma"],
          bitis: gunEkle(25, 13),
        },
        {
          key: "sinav-elektronik",
          baslik: "Elektronik haberleşme cihazları taraması",
          aciklama:
            "ÖSYM 'Sınav Güvenliği Tebliği' uyarınca sınav salonlarına girişte tüm aday öğrenciler elektronik haberleşme cihazı taramasından geçirilir. Bu tarama için Tekman Emniyet Müdürlüğü Olay Yeri İnceleme ekibinden 2 detektör cihazı (taşınabilir el dedektörü) ve 4 personel görevlendirilecektir. Yasaklı materyaller: cep telefonu, kulaklık (kablolu/bluetooth), akıllı saat, fitness takip cihazı, sözlük (digital), saat-hesap makinesi (programlanabilir), kalem fotoğraf kamerası, anahtarlık dedektör, küpe-yüzükte gizli ekran, gözlüklerde gizli kamera. Tarama prosedürü: aday salon önünde dedektör altından geçirilir, sıra çantası açık olarak gözden geçirilir, eğer tereddüt varsa yan odada özel inceleme yapılır. Önceki yıllarda Tekman'da 1 vakada akıllı saat ile sınava giriş tespit edilmiş, aday sınavdan çıkarılmıştı. Bu yıl tarama detayı arttırılacak, özellikle son tip 'sınav haptic geçmişi' adı verilen küçük cihaz türlerine dikkat edilecektir. Polis personeli ÖSYM tarafından gönderilen 'şüpheli cihaz tipi' kataloğu üzerinden eğitilecektir. Tarama sonucunda yasaklı materyal bulunan aday hakkında tutanak düzenlenir, ÖSYM'ye bildirilir, sınavı iptal edilir; bazı durumlarda Cumhuriyet Başsavcılığı'na suç duyurusu yapılır. Aday haklarına dikkat edilerek aşağılayıcı muamele yapılmaması önemle vurgulanır.",
          aciklamaDokuman: doc(
            h2("Yasal Dayanak"),
            p(
              b("ÖSYM Sınav Güvenliği Tebliği"),
              " uyarınca sınav salonlarına girişte tüm aday öğrenciler elektronik haberleşme cihazı taramasından geçirilir.",
            ),
            p(
              "Tekman Emniyet Müdürlüğü Olay Yeri İnceleme ekibinden ",
              b("2 detektör cihazı"),
              " ve ",
              b("4 personel"),
              " görevlendirilecektir.",
            ),
            h2("Yasaklı Materyaller"),
            ul(
              "Cep telefonu, kablolu/bluetooth kulaklık",
              "Akıllı saat, fitness takip cihazı",
              "Dijital sözlük, programlanabilir hesap makinesi",
              "Kalem fotoğraf kamerası, anahtarlık dedektör",
              "Küpe/yüzükte gizli ekran, gözlüklerde gizli kamera",
            ),
            h3("Tarama Prosedürü"),
            ol(
              "Aday salon önünde dedektör altından geçirilir",
              "Sıra çantası açık olarak gözden geçirilir",
              "Tereddüt halinde yan odada özel inceleme",
            ),
            h2("Geçmiş Deneyim & Yaptırım"),
            p(
              i("Önceki yıllarda Tekman'da 1 vakada akıllı saat ile sınava giriş tespit edilmiş"),
              ", aday sınavdan çıkarılmıştı. Bu yıl ",
              b("şüpheli cihaz tipi kataloğu"),
              " üzerinden personel eğitilecek; ",
              i("haptic geçmişi"),
              " adı verilen yeni cihaz türlerine özel dikkat edilecektir.",
            ),
            p(
              "Yasaklı materyal bulunan aday hakkında tutanak düzenlenir, ÖSYM'ye bildirilir, sınavı iptal edilir; bazı durumlarda ",
              b("Cumhuriyet Başsavcılığı'na suç duyurusu"),
              " yapılır. Aday haklarına dikkat edilerek aşağılayıcı muamele yapılmaması önemle vurgulanır.",
            ),
          ),
          etiketler: ["Güvenlik"],
          yetkililer: ["emniyetMemur"],
          birimler: ["emniyet"],
          bitis: gunEkle(24, 17),
        },
      ],
    },
    {
      ad: "Altyapı & Sağlık",
      yetkililer: ["saglikAmir"],
      birimler: ["saglik", "tedas", "afad", "itfaiye"],
      kartlar: [
        {
          key: "sinav-tedas-kesinti",
          baslik: "Sınav saatlerinde elektrik kesintisi yasağı — TEDAŞ yazışması",
          aciklama:
            "ÖSYM sınavlarının yapıldığı günlerde sabah 08:00 - öğleden sonra 13:30 saatleri arasında, sınav binaları ve çevresindeki konut alanlarında elektrik kesintisi (planlı veya plansız bakım) yapılması yasaklanacaktır. TEDAŞ Tekman İşletme Şefliği'ne resmi yazı hazırlanmakta olup; yazıda söz konusu saatler dışında bakım yapılması talep edilmektedir. Olağanüstü durum (kasırga, yangın vb.) hariç, hiçbir gerekçe ile kesinti yapılmayacaktır. Acil bir kesinti zorunlu hale gelirse, ilgili kurum (Hastane, Kaymakamlık, ÖSYM merkez) eş zamanlı bilgilendirilecektir. Sınav binalarındaki jeneratör testleri sınavdan 1 hafta önce yapılmıştır; otomatik geçiş süresi 5 saniyenin altındadır. TEDAŞ ile yapılan teyit görüşmesinde işletme şefi olumlu cevap vermiş, bakım programı sınav haftası dışına alınmıştır. Resmi yazı taslağı Yazı İşleri'nde hazırlanmaktadır; imza sürecinden sonra TEDAŞ'a EBYS üzerinden iletilecektir. Tekrarlanan riski önlemek için sınav haftasında TEDAŞ teknik ekibinin de hazır kuvvet halinde tutulması istenecektir. Geçen yıl sınav günü 12 dakikalık bir kesinti yaşanmış, ÖSYM ek süre verilmesini istemişti; bu yıl yeniden yaşanmaması için tedbirler güçlendirilmektedir.",
          aciklamaDokuman: doc(
            h2("Yazışma Konusu"),
            p(
              "ÖSYM sınavlarının yapıldığı günlerde ",
              b("08:00–13:30 saatleri arasında"),
              " sınav binaları ve çevresindeki konut alanlarında elektrik kesintisi (planlı veya plansız bakım) yapılması yasaklanacaktır.",
            ),
            p(
              b("TEDAŞ Tekman İşletme Şefliği"),
              "'ne resmi yazı hazırlanmakta olup, söz konusu saatler dışında bakım yapılması talep edilmektedir. Olağanüstü durum (kasırga, yangın vb.) hariç hiçbir gerekçe ile kesinti yapılmayacaktır.",
            ),
            h2("Tedbirler"),
            ul(
              "Acil kesinti zorunlu olursa Hastane + Kaymakamlık + ÖSYM merkez eş zamanlı bilgilendirme",
              ["Jeneratör testleri sınavdan 1 hafta önce yapıldı; ", b("otomatik geçiş < 5 saniye")],
              "Sınav haftasında TEDAŞ teknik ekibi hazır kuvvet talep edilecek",
            ),
            h3("Yazışma Süreci"),
            p(
              i("TEDAŞ işletme şefi teyit görüşmesinde olumlu cevap vermiş"),
              "; bakım programı sınav haftası dışına alınmıştır. Resmi yazı taslağı Yazı İşleri'nde hazırlanmakta, imza sonrası ",
              b("EBYS üzerinden TEDAŞ'a"),
              " iletilecektir.",
            ),
            p(
              i("Geçen yıl sınav günü 12 dakikalık bir kesinti yaşanmış"),
              ", ÖSYM ek süre verilmesini istemişti; bu yıl yeniden yaşanmaması için tedbirler güçlendirilmektedir.",
            ),
          ),
          etiketler: ["Yazışma", "Kaymakamlık"],
          yetkililer: ["yaziMemur", "tedasSef"],
          birimler: ["tedas"],
          bitis: gunEkle(15, 17),
          kontrol: [
            {
              ad: "Yazışma",
              maddeler: [
                { metin: "TEDAŞ ile teyit alındı", atanan: "tedasSef", tamam: true },
                { metin: "Resmi yazı taslağı", atanan: "yaziMemur" },
                { metin: "İmza ve tebliğ", atanan: "yaziAmir" },
              ],
            },
          ],
        },
        {
          key: "sinav-saglik-ekip",
          baslik: "Her sınav binasına 1 ambulans + sağlık ekibi konuşlandırma",
          aciklama:
            "Sınav günü her bir uygulama merkezi binasına 1 ambulans + 1 doktor + 1 hemşire + 1 sürücü konuşlandırılacaktır. 112 Acil Sağlık Hizmetleri ile yapılan koordinasyonda ambulans rotasyonu hazırlanmış; her ambulans 8 saat boyunca yedek olarak hazır kuvvet halinde park edecek, sınav binalarından 50 metre uzaklıkta sürdürülebilir alana yerleşecektir. Acil sağlık taleplerine müdahale türleri: aday öğrenci panik atak, hipoglisemi, hipertansiyon, kalp ritim bozukluğu, hamile aday acil müdahalesi, baygınlık, kan şekeri düşüklüğü. Adayların tıbbi mazeretle sınav esnasında salonu terketmesi gerekirse, sağlık ekibi salondan en yakın yere transfer eder; sınav görevlisi gözetiminde gerektiği bilgi tutanağı düzenlenir. Sağlık ekibinde ayrıca 'KKBM' (kuduz, ısırma vb. acil) müdahale tıbbi malzeme bulunur. 112 ile birlikte hazırlanan rotasyon planı saatlik dilimlerle düzenlenmiş, planlanmamış vaka durumunda merkezden 2. ambulans hızlıca takviye yapacaktır. Ekip yemek ve dinlenme sıralaması sınav saatleri sonunda yapılacaktır. Sınav personeli için de sağlık desteği aynı ekiple sağlanır.",
          aciklamaDokuman: doc(
            h2("Konuşlandırma"),
            p(
              "Sınav günü her bir uygulama merkezi binasına ",
              b("1 ambulans + 1 doktor + 1 hemşire + 1 sürücü"),
              " konuşlandırılacaktır.",
            ),
            p(
              b("112 Acil Sağlık Hizmetleri"),
              " ile yapılan koordinasyonda ambulans rotasyonu hazırlanmış; her ambulans 8 saat boyunca hazır kuvvet halinde, sınav binalarından ",
              b("50 metre uzaklıkta"),
              " park edecektir.",
            ),
            h2("Müdahale Türleri"),
            ul(
              "Aday öğrenci panik atak, baygınlık",
              "Hipoglisemi, kan şekeri düşüklüğü",
              "Hipertansiyon, kalp ritim bozukluğu",
              "Hamile aday acil müdahalesi",
              [i("KKBM"), " (kuduz, ısırma vb.) müdahale tıbbi malzemesi"],
            ),
            h3("Süreç"),
            p(
              "Adayların tıbbi mazeretle sınav esnasında salonu terk etmesi gerekirse, sağlık ekibi salondan en yakın yere transfer eder; sınav görevlisi gözetiminde ",
              b("tutanak düzenlenir"),
              ".",
            ),
            p(
              "Rotasyon planı saatlik dilimlerle düzenlenmiş; ",
              i("planlanmamış vaka durumunda merkezden 2. ambulans"),
              " hızlıca takviye yapacaktır. Sınav personeli için de sağlık desteği aynı ekiple sağlanır.",
            ),
          ),
          etiketler: ["Sağlık"],
          yetkililer: ["saglikAmir"],
          birimler: ["saglik"],
          bitis: gunEkle(25, 13),
        },
        {
          key: "sinav-itfaiye",
          baslik: "İtfaiye hazır kuvvet — yangın & tahliye",
          aciklama:
            "Tekman Belediye İtfaiyesi sınav günlerinde 1 grup hazır kuvveti (1 itfaiye aracı + 4 personel + 1 amir) sabah 08:00'dan sınav bitimi 13:30'a kadar belediye itfaiye merkezinde tutmaktadır. Olası senaryo: sınav binasında yangın çıkması, gaz kaçağı, deprem sonrası tahliye, asansör arızası nedeniyle adayın kalması, ısı terbiyeli pencere kırılması durumunda kişisel yaralanma. Yangın söndürme dışında 'kurtarma çıkış' sertifikalı personel de hazır kuvvete dahildir. İtfaiye merkezinde araç motoru sıcak tutulur, müdahale süresi 7 dakikanın altına düşürülmüştür. Bina tahliyesi gerekirse her sınav binasındaki 4 acil çıkış kapısı kullanılır; tahliye süresi 5 dakikadan az olarak hedeflenir. Geçen yıl Atatürk Ortaokulu'nda küçük bir kıvılcım panik yaratmış, itfaiye 6 dakikada müdahale etmiş, yaralanma yaşanmamıştı; bu yıl tatbikat ile süre 4 dakikaya indirilmiştir. Sınav binası girişinde her zaman 1 itfaiye personeli düzgün üniformalı olarak konuşlandırılacak, hem caydırıcı hem de hızlı müdahale rolü oynayacaktır. AFAD afet rampası da yedek olarak hazırdır.",
          aciklamaDokuman: doc(
            h2("Hazır Kuvvet"),
            p(
              b("Tekman Belediye İtfaiyesi"),
              " sınav günlerinde 1 grup hazır kuvveti (",
              b("1 itfaiye aracı + 4 personel + 1 amir"),
              ") sabah 08:00–13:30 arasında merkezde tutmaktadır.",
            ),
            h2("Senaryolar"),
            ul(
              "Sınav binasında yangın çıkması, gaz kaçağı",
              "Deprem sonrası tahliye",
              "Asansör arızası nedeniyle adayın kalması",
              "Pencere kırılmasında kişisel yaralanma",
            ),
            p(
              "Yangın söndürme dışında ",
              b("kurtarma çıkış sertifikalı"),
              " personel de ekibe dahildir. Araç motoru sıcak tutulur; ",
              b("müdahale süresi 7 dakikanın altında"),
              ".",
            ),
            h3("Tahliye"),
            p(
              "Bina tahliyesi gerekirse her binadaki ",
              b("4 acil çıkış kapısı"),
              " kullanılır; hedef tahliye süresi ",
              b("5 dakikadan az"),
              ".",
            ),
            p(
              i("Geçen yıl Atatürk Ortaokulu'nda küçük bir kıvılcım panik yaratmış"),
              ", itfaiye 6 dakikada müdahale etmiş, yaralanma yaşanmamıştı; bu yıl tatbikat ile süre ",
              b("4 dakikaya"),
              " indirilmiştir. AFAD afet rampası yedek olarak hazırdır.",
            ),
          ),
          etiketler: ["Güvenlik"],
          yetkililer: ["itfaiyeAmir"],
          birimler: ["itfaiye"],
          bitis: gunEkle(25, 13),
        },
      ],
    },
    {
      ad: "Bilgilendirme",
      yetkililer: ["ozelMemur"],
      birimler: ["ozelKalem"],
      kartlar: [
        {
          key: "sinav-anons",
          baslik: "Cami anonsları ile çevre sakinlerine bilgilendirme",
          aciklama:
            "Sınav günü çevre sakinleri tarafından yapılan inşaat, yüksek sesli müzik, korna sesi, çocuk haykırması gibi gürültü kaynakları sınav adaylarının dikkatini dağıtmaktadır. Müftülük ile koordineli olarak; sınav günü sabah ezanı sonrası ve cuma vaazı içerisinde 'sınav günü gürültü kontrolü' uyarısı yapılacaktır. Anons içeriğinde: 'Bugün ilçemizde önemli bir sınav uygulanmaktadır. Lütfen 09:00-13:30 saatleri arasında yüksek sesli müzik, çekiç sesi, korna ve gürültü oluşturan iş yapmayalım. Çocuklarınızın da sokakta yüksek sesle oynamamasını rica ediyoruz' tarzında bir mesaj yer alacaktır. Bu mesaj ilçemizdeki 18 caminin her birinde sabah ezanı sonrası okunacaktır. Aynı bilgi belediye anonsuyla mahalle ses sistemi üzerinden de yayımlanır. Sayın Müftümüz hutbe taslağını teyit etmiş, ilave olarak 'sınav gerginliği ve dua' temasını da hutbeye işleyeceğini belirtmiştir. Geçen yıl bir mahallede inşaat çalışması yapılmış, tüm sınav süresince çekiç sesi gelmişti; bu yıl belediye 'Sınav günü inşaat yasağı' yönetmelik hükmü çıkarmıştır.",
          aciklamaDokuman: doc(
            h2("Sorun & Yaklaşım"),
            p(
              "Sınav günü inşaat, yüksek sesli müzik, korna ve çocuk haykırması gibi gürültü kaynakları adayların dikkatini dağıtmaktadır. ",
              b("Müftülük"),
              " ile koordineli olarak sabah ezanı sonrası ve cuma vaazı içerisinde uyarı yapılacaktır.",
            ),
            h2("Anons İçeriği"),
            p(
              i("\"Bugün ilçemizde önemli bir sınav uygulanmaktadır. Lütfen 09:00–13:30 saatleri arasında yüksek sesli müzik, çekiç sesi, korna ve gürültü oluşturan iş yapmayalım. Çocuklarınızın da sokakta yüksek sesle oynamamasını rica ediyoruz.\""),
            ),
            h3("Yayım Kanalları"),
            ul(
              [b("18 cami"), " — sabah ezanı sonrası"],
              "Belediye mahalle ses sistemi anonsu",
              ["Cuma hutbesi — ", i("sınav gerginliği ve dua"), " teması"],
            ),
            p(
              i("Geçen yıl bir mahallede inşaat çalışması tüm sınav süresince çekiç sesi yaratmıştı"),
              "; bu yıl belediye ",
              b("Sınav günü inşaat yasağı"),
              " yönetmelik hükmü çıkarmıştır.",
            ),
          ),
          etiketler: ["Kaymakamlık"],
          yetkililer: ["muftu"],
          birimler: ["muftuluk"],
          bitis: gunEkle(25, 8),
          tamamlandi: false,
          yorumlar: [
            { yazan: "muftu", icerik: "Sabah ezanı sonrası kısa bilgilendirme yapacağız.", gunFarki: -1 },
          ],
        },
        {
          key: "sinav-veli-rehber",
          baslik: "Veli rehber broşürü — kim, ne yapacak",
          aciklama:
            "Sınav adayı ve velilerine yönelik 'YKS/LGS Rehber Broşürü' Milli Eğitim Müdürlüğü tarafından hazırlanmış ve PTT kanalıyla okul müdürlüklerine gönderilmiştir. A4 ebatlı 8 sayfalık broşürün içeriği: sınav günü neyin getirileceği (kalem, silgi, kimlik, su şişesi), neyin yasaklı olduğu, sınav yerinin nasıl bulunacağı, ulaşım imkanları, otopark bilgisi, kahvaltı önerileri, panik atak durumunda ne yapılacağı, sağlık personeli iletişim bilgileri ve sınav sonrası psikolojik destek hatları. Broşür Türkçe ve İngilizce-Arapça versiyonlarda hazırlanmıştır (mülteci aileler için). Broşür, sınıflarda sınıf öğretmenleri tarafından öğrencilere dağıtılmış, eve göndermesi sağlanmıştır. Ayrıca dijital sürümü Kaymakamlık ve Milli Eğitim Müdürlüğü web sitelerinde yer almaktadır. Veli WhatsApp gruplarına da PDF olarak gönderilmiştir. Geçen yılki broşür için memnuniyet anketi %92 olarak ölçülmüş, bu yıl daha kapsamlı hazırlanmıştır.",
          aciklamaDokuman: doc(
            h2("Broşür Künyesi"),
            p(
              b("YKS/LGS Rehber Broşürü"),
              " Milli Eğitim Müdürlüğü tarafından hazırlanmış ve PTT kanalıyla okul müdürlüklerine gönderilmiştir. ",
              b("A4 ebatlı, 8 sayfa"),
              ".",
            ),
            h2("İçerik"),
            ul(
              "Sınav günü getirilecekler: kalem, silgi, kimlik, su şişesi",
              "Yasaklı materyaller listesi",
              "Sınav yerinin bulunması, ulaşım, otopark",
              "Kahvaltı önerileri, panik atak yönetimi",
              "Sağlık personeli iletişim bilgileri",
              "Sınav sonrası psikolojik destek hatları",
            ),
            h3("Dağıtım Kanalları"),
            ul(
              ["Türkçe + ", b("İngilizce/Arapça"), " versiyonları (", i("mülteci aileler için"), ")"],
              "Sınıf öğretmenleri eliyle öğrencilere → eve gönderim",
              "Kaymakamlık + Milli Eğitim web siteleri (PDF)",
              "Veli WhatsApp grupları",
            ),
            p(
              i("Geçen yılki broşür için memnuniyet anketi %92 olarak ölçülmüş"),
              "; bu yıl daha kapsamlı hazırlanmıştır.",
            ),
          ),
          etiketler: ["Eğitim"],
          tamamlandi: true,
          ekler: [
            { ad: "veli-rehberi.pdf", mime: "application/pdf", boyut: 192_000, yukleyen: "milliMemur" },
          ],
        },
      ],
    },
  ],
};
