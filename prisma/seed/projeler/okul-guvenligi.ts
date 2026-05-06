// Proje: Okul Güvenliği ve Devamsızlık İzleme
// MEM, emniyet, jandarma, SYDV ve rehberlik servislerinin ortak yürüttüğü süreç.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";

export const okulGuvenligiProjesi: ProjeSeed = {
  key: "okul",
  ad: "Okul Güvenliği ve Devamsızlık İzleme",
  aciklama:
    "Okul çevresi güvenliği, taşımalı eğitim, kronik devamsızlık dosyalarının saha takibi ve rehberlik desteği. ÇOGEP/Aile-Okul programıyla entegre.",
  olusturan: "milliAmir",
  yetkililer: ["kaymakam", "milliAmir", "milliMemur", "ozelAmir"],
  birimler: ["milliEgitim", "emniyet", "jandarma", "asdm", "sydv", "lise", "ilkokul", "ortaokul", "imamHatip", "ramKurumu"],
  kapakRenk: "mor",
  kapakIkon: "graduation-cap",
  yildizli: true,
  listeler: [
    {
      ad: "Okul Çevresi Güvenliği",
      yetkililer: ["emniyetAmir"],
      birimler: ["emniyet", "jandarma"],
      kartlar: [
        {
          key: "okul-servis",
          baslik: "Servis güzergahı risk noktalarını işaretle",
          aciklama:
            "Taşımalı Eğitim Yönetmeliği'nin 17. maddesi ve İçişleri Bakanlığı'nın okul güvenliği genelgesi uyarınca, ilçemizdeki 10 servis güzergahı boyunca risk noktaları saha çalışmasıyla raporlanacaktır.",
          // ADR-0023 — Zengin metin örneği: heading + bullet list + bold + link.
          // UI'da kullanıcılara format paritesi göstermek amaçlı.
          aciklamaDokuman: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Yasal Dayanak" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Taşımalı Eğitim Yönetmeliği'nin ",
                  },
                  {
                    type: "text",
                    text: "17. maddesi",
                    marks: [{ type: "bold" }],
                  },
                  {
                    type: "text",
                    text: " ve İçişleri Bakanlığı'nın okul güvenliği genelgesi uyarınca, ilçemizdeki 10 servis güzergahı boyunca risk noktaları saha çalışmasıyla raporlanacaktır.",
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Risk Haritası Kapsamı" }],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          {
                            type: "text",
                            text: "Durak güvenliği",
                            marks: [{ type: "bold" }],
                          },
                          {
                            type: "text",
                            text: " (öğrenci bekleme alanı, asfalt seviyesi, görüş açısı)",
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          { type: "text", text: "Kavşak görünürlüğü ve viraj aynaları" },
                        ],
                      },
                    ],
                  },
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          { type: "text", text: "Yaya geçidi çizgileri ve hız limit levhaları" },
                        ],
                      },
                    ],
                  },
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          { type: "text", text: "Kar yağışı sonrası kayganlaşma noktaları" },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 3 },
                content: [{ type: "text", text: "Yüksek Risk Bölgeleri" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Kop Geçidi alt kısmı, Karaçoban ayrımı ve Doğanca eğimli rampa için kış aylarında ",
                  },
                  {
                    type: "text",
                    text: "kum + tuz serme rotası",
                    marks: [{ type: "italic" }],
                  },
                  { type: "text", text: " uygulanır." },
                ],
              },
              {
                type: "orderedList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "10 günlük saha turu" }],
                      },
                    ],
                  },
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Belediye + Karayolları'na yazılı bildirim" }],
                      },
                    ],
                  },
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "A3 risk haritası ve sürücü eğitimi" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          etiketler: ["Eğitim", "Saha", "Güvenlik"],
          yetkililer: ["trafikMemur", "milliMemur"],
          birimler: ["emniyet", "jandarma"],
          bitis: gunEkle(7, 16),
          kontrol: [
            {
              ad: "Saha çalışması",
              maddeler: [
                { metin: "10 servis güzergahı dolaşıldı", atanan: "trafikMemur", tamam: true, tamamlanmaGun: -10 },
                { metin: "Risk haritası çıkarıldı", atanan: "trafikMemur", tamam: true, tamamlanmaGun: -5 },
                { metin: "Levha ihtiyaç listesi belediyeye iletildi", atanan: "trafikMemur" },
                { metin: "Kayganlık önleyici plan belirlendi", atanan: "belediyeFenIsleri" },
              ],
            },
          ],
          yorumlar: [
            { yazan: "trafikMemur", icerik: "Karaçoban yolu Karayolları'na bildirildi.", gunFarki: -2 },
            { yazan: "belediyeFenIsleri", icerik: "İki adet uyarı levhası çarşamba günü montelenecek.", gunFarki: -1 },
          ],
          ekler: [
            { ad: "risk-haritasi.png", mime: "image/png", boyut: 412_000, yukleyen: "trafikMemur" },
          ],
        },
        {
          key: "okul-cevre-devriye",
          baslik: "Giriş-çıkış saatlerinde devriye planı",
          aciklama:
            "Okul Güvenlik Tedbirleri Genelgesi (2026/03) kapsamında, ilçemizdeki 12 okula sabah giriş (07:30-08:30) ve öğleden sonra çıkış (15:00-16:00) saatlerinde yaya ve araç destekli devriye konuşlandırılacaktır. Şehir merkezindeki 6 okul (Cumhuriyet İlkokulu, Atatürk Ortaokulu, Tekman Anadolu Lisesi, İmam Hatip Lisesi, Mesleki ve Teknik Anadolu Lisesi, RAM Kurumu) İlçe Emniyet Amirliği yaya devriye ekipleri tarafından, kırsal 6 okul (Karaağaç köy ilkokulu, Doğanca köy ortaokulu, Yolüstü köy ilkokulu, Yeniköy ilkokulu, Demirkent ilkokulu, Çayırlı köy ortaokulu) İlçe Jandarma Komutanlığı motorize devriyeleri tarafından kapsanacaktır. Devriye saatleri okul müdürlerine ve sınıf rehber öğretmenlerine yazılı olarak bildirilecek; öğrenci geliş-gidişlerinin yoğun olduğu okul kapısı ve yaya geçitlerinde 'görünür güvenlik' uygulanacaktır. Bu uygulamanın amacı sadece güvenlik değil, aynı zamanda akran zorbalığı, sigara/alkol yaklaşımı ve bağımlılık tehditlerine karşı caydırıcı varlık göstermektir. Bağımlılıkla mücadele kapsamında okul yakınlarındaki tütün/alkol satışında 100m yasağı denetimi de bu devriyelerle entegre yapılacaktır. Devriye raporları haftalık olarak İlçe Emniyet Amirliği tarafından Kaymakamlığa sunulur; aksaklık tespit edilen okullarda ek tedbir alınır.",
          etiketler: ["Güvenlik", "Saha"],
          yetkililer: ["emniyetMemur", "jandarmaAstsubay"],
          birimler: ["emniyet", "jandarma"],
          bitis: gunEkle(2, 17),
          kontrol: [
            {
              ad: "Plan",
              maddeler: [
                { metin: "Şehir merkezi 6 okul — emniyet", atanan: "emniyetMemur", tamam: true },
                { metin: "Kırsal 6 okul — jandarma", atanan: "jandarmaAstsubay", tamam: true },
                { metin: "Devriye saatleri okul müdürlerine iletilecek", atanan: "milliMemur" },
              ],
            },
          ],
        },
        {
          key: "okul-bagimlilik",
          baslik: "Bağımlılıkla mücadele — okul yakını sigara/alkol denetimi",
          aciklama:
            "4207 sayılı Tütün Ürünlerinin Zararlarının Önlenmesi ve Kontrolü Hakkında Kanun ile 4250 sayılı İspirto ve İspirtolu İçkiler İnhisarı Kanunu çerçevesinde, okul çevresine 100 metreden yakın mesafede tütün ve alkol satışı yasaktır. İlçe Milli Eğitim Müdürlüğü ile İlçe Emniyet Amirliği arasında imzalanan ortak protokol kapsamında, ilçemizdeki tüm 12 okul çevresinde 100 metre kuralının denetimi 30 günlük periyotlarla yapılacaktır. Denetim ekibi: Milli Eğitim Müdürlüğü temsilcisi, Emniyet Çocuk Şube personeli, İlçe Sağlık Müdürlüğü tütün denetim memuru, gerektiğinde Belediye Zabıta Müdürlüğü. Tespit edilen ihlallerde idari para cezası uygulanır, tekrarda iş yeri kapatma müeyyidesi gündeme gelir. Bağımlılıkla mücadeleye paralel olarak öğrencilere yönelik 'Yeşilay Kulübü' faaliyetleri yıl boyunca sürdürülmekte, RAM Kurumu rehberliğinde sınıf bazlı bilinçlendirme programları yürütülmektedir. Geçen yıl 3 işyerine ihtar verilmiş, 1 tanesi 7 gün kapatılmıştır. Bu yılki denetimde özellikle market kasalarındaki sigara reklamı ve gençlere satış başlığına dikkat edilecektir. Veliler için Halk Eğitim Merkezi'nde 'Aile-Bağımlılık' semineri planlanmıştır.",
          etiketler: ["Güvenlik"],
          yetkililer: ["emniyetMemur"],
          birimler: ["emniyet", "milliEgitim"],
          bitis: gunEkle(11, 17),
        },
      ],
    },
    {
      ad: "Devamsızlık Takibi",
      yetkililer: ["milliRehber"],
      birimler: ["milliEgitim", "ramKurumu"],
      kartlar: [
        {
          key: "okul-devamsizlik",
          baslik: "Kronik devamsızlık dosyalarını hane ziyaretiyle doğrula",
          aciklama:
            "Milli Eğitim Bakanlığı'nın 'İlköğretim ve Ortaöğretimde Devamsızlık' yönetmeliği ile İçişleri Bakanlığı 'ÇOGEP - Çocuk Okula Gelsin' projesi kapsamında, ilçemizde 20 günü aşan kronik devamsızlığı bulunan 17 öğrencinin durumu hane ziyaretleriyle bizzat doğrulanacaktır. Vakaların ön analizinde 6 öğrencinin sosyo-ekonomik nedenler (aile geliri yetersiz, çalışmaya başladı), 4 öğrencinin erken evlilik şüphesi, 3 öğrencinin sağlık problemleri, 2 öğrencinin akran zorbalığı, 2 öğrencinin ise aile içi şiddet ile bağlantılı olabileceği gözlemlenmiştir. Saha çalışması Rehberlik ve Araştırma Merkezi (RAM) rehber öğretmenleri ile SYDV sosyal çalışmacılarının ortak ekipleriyle yürütülecek; aileler 'sözleşmeli görüşme' formatında ziyaret edilecek, birey-aile-okul üçgeni değerlendirilmesi yapılacaktır. Erken evlilik şüphesi olan 4 dosya İlçe Aile ve Sosyal Hizmetler Müdürlüğü'ne tedbir kararı için iletilmiş; aile içi şiddet şüphesi olan 2 dosya 6284 sayılı Kanun çerçevesinde Cumhuriyet Başsavcılığı'na bildirilmiştir. Sosyo-ekonomik dosyalardan 2 hane için Şartlı Eğitim Yardımı (ŞEY) onayı süreci başlatılmıştır. Saha sonrası her vaka için bireysel takip planı hazırlanır, öğrenciye birebir mentor ataması yapılır. Sayın Kaymakamımız bu dosyaların haftalık takibini bizzat istemiş olup her cuma 'Devamsızlık İzleme Brifingi' alınacaktır. Tüm süreç çocuk hakları gözetilerek mahremiyet içinde yürütülmektedir.",
          etiketler: ["Eğitim", "Sosyal Yardım", "Beklemede"],
          yetkililer: ["sydvSosyalCalisan", "milliRehber"],
          birimler: ["sydv", "milliEgitim"],
          bitis: gunEkle(10, 17),
          kontrol: [
            {
              ad: "Dosya takibi",
              maddeler: [
                { metin: "Öğrenci listesi alınacak", atanan: "milliMemur", tamam: true },
                { metin: "Hane risk skorlaması yapıldı", atanan: "sydvSosyalCalisan", tamam: true },
                { metin: "İlk hane ziyareti planlanacak", atanan: "sydvSosyalCalisan" },
                { metin: "Rehberlik raporu hazırlanacak", atanan: "milliRehber" },
                { metin: "Kaymakamlık brifing notu çıkarılacak", atanan: "milliAmir" },
              ],
            },
            {
              ad: "Saha — Karaağaç köyü",
              maddeler: [
                { metin: "Aile reisleri ile görüşme", atanan: "sydvSosyalCalisan" },
                { metin: "Köy muhtarı bilgilendirildi", atanan: "koyMuhtar", tamam: true },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "milliRehber",
              icerik:
                "10 dosyadan 6'sı sosyo-ekonomik, 4'ü erken evlilik şüphesi içeriyor. Erken evlilik dosyaları için 5395 sayılı Kanun çerçevesinde @<asdmAmir> ile koordineli ilerleyeceğiz, mahkemeye intikal gerektirebilir.",
              gunFarki: -7,
              saat: 10,
            },
            {
              yazan: "sydvSosyalCalisan",
              icerik:
                "Sosyo-ekonomik dosyalardan iki haneye yardım dosyası açıldı, kaymakamlık onayı bekleniyor. Saha izlenimim: ailelerin asıl sıkıntısı ısınma ve ulaşım masrafı, çocuk okula gidemiyor değil — gönderecek koşulu kalmamış.",
              gunFarki: -5,
              saat: 14,
              yanit: 0,
            },
            {
              yazan: "asdmAmir",
              icerik:
                "Erken evlilik şüphesi olan 4 dosya ASHB değerlendirmesine alındı. İl Müdürlüğü uzman psikoloğu hafta içi ilçeye gelecek; @<milliRehber> görüşme planını ortak oluşturalım. Vaka mahremiyeti açısından dosya numarası dışında bilgi paylaşmıyorum.",
              gunFarki: -3,
              saat: 11,
              yanit: 0,
              duzenlendi: true,
            },
            {
              yazan: "milliRehber",
              icerik:
                "Anlaşıldı, görüşme planını çarşamba akşamına kadar size ileteceğim. Çocuk Şube'den de bir yetkili davet etmemiz uygun olur mu?",
              gunFarki: -3,
              saat: 15,
              yanit: 2,
            },
            {
              yazan: "kaymakam",
              icerik:
                "Bu dosyaların haftalık takibini bizzat istiyorum — her cuma 14:00 makamımda kısa brifing. Erken evlilik konusunda asla taviz yok, çocuğun yüksek yararını gözeterek hareket edin. Gerekirse Cumhuriyet Başsavcılığı'na suç duyurusu yapılır.",
              gunFarki: -1,
              saat: 9,
            },
            {
              yazan: "sydvSosyalCalisan",
              icerik:
                "Anladım Sayın Kaymakamım, ilk brifing bu cuma için hazır. Sosyo-ekonomik dosyalardan birinde acil kömür ihtiyacı var, bekletmeden mütevelli heyetine taşıyorum.",
              gunFarki: 0,
              saat: 8,
              yanit: 4,
            },
          ],
          ekler: [
            { ad: "devamsizlik-dosyasi.pdf", mime: "application/pdf", boyut: 230_000, yukleyen: "milliMemur" },
            { ad: "hane-ziyaret-plani.docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", boyut: 88_000 },
          ],
        },
        {
          key: "okul-iletisim",
          baslik: "Veli iletişim hattı — WhatsApp gruplarını standartlaştır",
          aciklama:
            "Milli Eğitim Bakanlığı'nın 2025/12 sayılı 'Okul-Aile İletişiminde Dijital Mecra Kullanımı' genelgesi ışığında, ilçemizdeki okullarda farklı uygulamalarla yürütülen WhatsApp veli iletişim grupları standart bir yönergeye bağlanacaktır. Yönerge taslağı şu başlıkları kapsar: grup yöneticisinin belirlenmesi (sınıf öğretmeni veya rehber öğretmen, asla yardımcı personel olamaz), grup mesai saatleri (08:00-18:00 arası), kişisel veri paylaşma yasağı (öğrenci foto/notu sadece bireysel mesajla), reklam-paylaşım yasağı, siyasi-dini ayrıştırıcı içerik yasağı, grup içi tartışma müdahale prosedürü ve dönem sonu grup arşivleme. Mevcut 47 sınıf grubunun denetiminde 12 grupta düzensizlik tespit edilmiş, bunların 4'ünde ilkokul öğretmeni gece 23:00'tan sonra mesaj attığı, 2'sinde reklam paylaşıldığı saptanmıştır. Yönerge tüm okul müdürlerinin istişaresi ile son haline getirilecek, sonra öğretmenler kuruluna sunulacaktır. KVKK kapsamında veli onam formu da bu paketle birlikte güncellenmektedir. Okul müdürleri yönergenin uygulanmasından bizzat sorumludur ve aylık denetim raporu Milli Eğitim Müdürlüğü'ne sunulacaktır. Yönerge yayın sonrası 6 ay sonra güncellenecek ve uygulamada karşılaşılan sorunlar Bakanlığa bildirilecektir.",
          etiketler: ["Eğitim"],
          yetkililer: ["milliMemur"],
          birimler: ["milliEgitim"],
          bitis: gunEkle(15, 17),
          kontrol: [
            {
              ad: "Yönerge",
              maddeler: [
                { metin: "Genelge taslağı hazırlandı", atanan: "milliMemur", tamam: true },
                { metin: "Müdür istişaresi", atanan: "liseMudur" },
                { metin: "Yayın", atanan: "milliAmir" },
              ],
            },
          ],
        },
      ],
    },
    {
      ad: "Akran Zorbalığı & Rehberlik",
      yetkililer: ["milliRehber"],
      birimler: ["ramKurumu", "asdm"],
      kartlar: [
        {
          key: "okul-akran",
          baslik: "Akran zorbalığı vakaları — vaka yönetim toplantısı",
          aciklama:
            "Son 30 gün içerisinde ilçemizdeki 4 farklı okuldan İlçe Milli Eğitim Müdürlüğü'ne intikal eden 6 akran zorbalığı vakası, Rehberlik ve Araştırma Merkezi (RAM) koordinasyonunda 'Vaka Yönetim Toplantısı'nda değerlendirilecektir. Vakalardan 3'ü fiziksel şiddet, 2'si sözel/duygusal zorbalık, 1'i siber zorbalık (sosyal medyada hakaret) niteliğindedir. Toplantıya RAM uzmanları, ilgili okulların rehber öğretmenleri, İlçe Milli Eğitim Müdürlüğü Şube Müdürü, gerektiğinde ASHB ve Çocuk Şube temsilcileri katılacaktır. Her vaka için ayrı dosya açılır; mağdur ve fail çocuk için ayrı destek planları hazırlanır. Mağdur çocuğun travması bireysel rehberlik desteğiyle ele alınırken, fail çocuğun davranış değişimi için aile-okul-RAM üçgeninde 6 haftalık program uygulanır. Vakalar 5395 sayılı Çocuk Koruma Kanunu kapsamında kabul edilen 'koruyucu ve destekleyici tedbirler' çerçevesinde değerlendirilir. Sayın Kaymakamımız vaka takibinin haftalık raporlanmasını talep etmiştir. Toplantı sonrası bilgilendirme broşürü tüm okullara dağıtılacak; öğretmenlere 'akran zorbalığı erken tespit' eğitimi verilecektir. Mahremiyet kapsamında vaka detayları dışarıya aktarılmaz, sadece istatistiki veri paylaşılır.",
          etiketler: ["Eğitim", "Acil"],
          yetkililer: ["milliRehber"],
          birimler: ["ramKurumu", "asdm"],
          bitis: gunEkle(5, 14),
          yorumlar: [
            { yazan: "milliRehber", icerik: "RAM uzmanları çarşamba 09:00 brifingi onayladı.", gunFarki: -1 },
          ],
        },
        {
          key: "okul-secim-egitim",
          baslik: "Demokrasi ve değerler eğitimi — sınıf etkinlikleri",
          aciklama:
            "Milli Eğitim Bakanlığı'nın 'Türkiye Yüzyılı Maarif Modeli' kapsamında değerler eğitimi, sınıf rehberlik dersi içeriğine entegre edilmiştir. Aylık tema rotasyonu: Eylül-saygı, Ekim-vatandaşlık ve hak-sorumluluk, Kasım-Atatürk ve cumhuriyet değerleri, Aralık-aile değerleri, Ocak-doğa sevgisi ve çevre, Şubat-dürüstlük, Mart-kadın hakları, Nisan-çocuk hakları, Mayıs-vatan sevgisi, Haziran-paylaşma. Her ay sınıf rehber öğretmenleri belirtilen temada en az 2 etkinlik düzenleyecek; etkinlik raporu MEBBİS portalına yüklenecektir. Rehberlik servisi, içerik desteği için tema kartları + video bağlantıları + okuma metinleri içeren 'Değerler Klasörü' hazırlamıştır. İlçemizdeki tüm 12 okulda eş zamanlı yürütülen bu programın ölçümü dönem sonu öğrenci anketiyle yapılır. Geçen yıl sonuçlarda 'doğa sevgisi' temasından sonra okullarda atık ayrıştırma uygulamasına başlama oranı %72'ye çıkmıştı. Etkinliklerde 5395 sayılı Çocuk Koruma Kanunu, ÇOGEP ilkeleri ve Anayasa'nın temel haklar bölümü pedagojik dilde aktarılır. Veliler için aynı tema 'Aile Bülteni' ile evlere taşınmaktadır.",
          etiketler: ["Eğitim"],
          yetkililer: ["milliRehber"],
          birimler: ["milliEgitim"],
          bitis: gunEkle(20, 17),
        },
      ],
    },
    {
      ad: "Tamamlananlar",
      kartlar: [
        {
          key: "okul-yangin",
          baslik: "Yangın tahliye tatbikatı — 12 okul",
          aciklama:
            "Binaların Yangından Korunması Hakkında Yönetmelik'in 132. maddesi gereği, ilçemizdeki 12 okulda dönem başı yangın tahliye tatbikatı Tekman Belediye İtfaiyesi ile koordineli olarak gerçekleştirilmiştir. Tatbikatlarda; alarm sisteminin çalışırlığı, tahliye yönlendirme levhalarının görünürlüğü, acil çıkış kapılarının kilitsiz olması, yangın söndürme tüplerinin dolu ve görünür olması, kat yangın hortumlarının erişilebilirliği ve sınıf öğretmenlerinin tahliye sürelerinin 5 dakikayı aşmaması test edilmiştir. Tahliye sırasında özel ihtiyaçları olan öğrenciler için 'eşleme sistemi' (her özel ihtiyaçlı öğrenciye 1 yardımcı öğrenci) uygulanmaktadır. Toplam 4.387 öğrenci ve 312 personel tatbikata katılmış, ortalama tahliye süresi 3 dakika 22 saniye olarak ölçülmüştür. Cumhuriyet İlkokulu tahliye süresi 4 dakika 51 saniyeyi bulduğu için ek tatbikat planlanmıştır. Tatbikat tutanakları İlçe Milli Eğitim Müdürlüğü'nde arşivlenmiş, ayrıca Yazı İşleri'ne resmi yazıyla bildirilmiştir.",
          etiketler: ["Güvenlik", "Eğitim"],
          tamamlandi: true,
          ekler: [
            { ad: "tatbikat-tutanagi.pdf", mime: "application/pdf", boyut: 142_000, yukleyen: "itfaiyeAmir" },
          ],
        },
      ],
    },
  ],
};
