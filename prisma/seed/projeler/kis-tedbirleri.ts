// Proje: 2026 Kış Tedbirleri ve Acil Müdahale Koordinasyonu
// Tekman ilçesinin kış şartlarına yönelik mülki idare koordinasyonu.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";
import { doc, h2, h3, p, ul, ol, b, i } from "../rt";

export const kisTedbirleriProjesi: ProjeSeed = {
  key: "kis",
  ad: "2026 Kış Tedbirleri ve Acil Müdahale Koordinasyonu",
  aciklama:
    "Tekman genelinde kış şartları, yol bakımı, sağlık nöbetleri, enerji altyapısı ve afet koordinasyonu. Kaymakamlık makamı talimatıyla ilgili tüm kurumların eş güdümü.",
  olusturan: "ozelAmir",
  yetkililer: ["kaymakam", "ozelAmir", "yaziAmir", "afadAmir"],
  birimler: [
    "ozelKalem",
    "yaziIsleri",
    "emniyet",
    "jandarma",
    "saglik",
    "belediye",
    "afad",
    "itfaiye",
    "kizilay",
    "karayollari",
    "tedas",
    "muhtarlik",
    "koyMuhtar",
  ],
  kapakRenk: "lacivert",
  kapakIkon: "snowflake",
  yildizli: true,
  listeler: [
    {
      ad: "Planlama & Koordinasyon",
      yetkililer: ["ozelMemur"],
      kartlar: [
        {
          key: "kis-kriz-masasi",
          baslik: "Kış kriz masası görev dağılımını onayla",
          aciklama:
            "5442 sayılı İl İdaresi Kanunu'nun 32. maddesi ve İçişleri Bakanlığı'nın 2026/04 sayılı Kış Tedbirleri Genelgesi kapsamında, Sayın Kaymakamımız başkanlığında oluşturulan ilçe kriz masasının görev dağılımı kesinleştirilecek. Bu çalışmayla; kurum temsilcileri, ilçe sınırları içerisindeki müdahale bölgeleri, 7/24 nöbet listeleri, telefon-telsiz iletişim zinciri, alternatif haberleşme yedekleri ve müdahale önceliklendirme matrisi tek bir resmi belgede toplanacaktır. Geçen yıl yaşanan tipi olayında, görev dağılımının net olmaması nedeniyle ilk müdahalede 47 dakikalık gecikme yaşanmıştı; bu sezon o tablonun tekrarlanmaması için protokol baştan kaleme alınmıştır. Görev dağılımına dahil edilecek kurumlar: İlçe Emniyet Amirliği, İlçe Jandarma Komutanlığı, İlçe Sağlık Müdürlüğü, Belediye Başkanlığı, AFAD İlçe Birimi, Karayolları 14. Şube Şefliği, TEDAŞ İşletme Şefliği, Türk Kızılay Şubesi, İtfaiye ve gerektiğinde Müftülük (cami anonsları). Her kurum kendi sorumluluğundaki bölge için bir asil + bir yedek personel ismi bildirecektir. Hazırlanan taslak 02.05.2026 tarihinde Sayın Kaymakamın onayına sunulmuş, küçük revizyonlarla geri dönmüştür. Revizyon notları: AFAD'ın 7/24 nöbet planı eklenmesi, trafik nöbet saatlerinin Emniyet+Jandarma arasında saatlik rotasyona alınması ve muhtarlıkların erken uyarı zincirine dahil edilmesi. Görev dağılımı onaylandıktan sonra A4 formatında bastırılıp tüm kurumlara EBYS üzerinden tebliğ edilecek, ayrıca Kaymakamlık makam odasında ve Özel Kalem Müdürlüğünde duvar panosuna asılacaktır. Sezon sonunda tatbikat raporu çıkarılacak ve görev dağılımının fiili performansı değerlendirilecektir.",
          aciklamaDokuman: doc(
            h2("Yasal Dayanak"),
            p(
              b("5442 sayılı İl İdaresi Kanunu'nun 32. maddesi"),
              " ve ",
              b("İçişleri Bakanlığı 2026/04 sayılı Kış Tedbirleri Genelgesi"),
              " kapsamında Sayın Kaymakamımız başkanlığındaki ilçe kriz masasının görev dağılımı tek resmi belgede kesinleştirilecektir.",
            ),
            h2("Belge Kapsamı"),
            ul(
              "Kurum temsilcileri ve müdahale bölgeleri",
              "7/24 nöbet listeleri",
              "Telefon-telsiz iletişim zinciri ve alternatif haberleşme yedekleri",
              "Müdahale önceliklendirme matrisi",
            ),
            h3("Katılımcı Kurumlar"),
            ul(
              "İlçe Emniyet Amirliği",
              "İlçe Jandarma Komutanlığı",
              "İlçe Sağlık Müdürlüğü",
              "Belediye Başkanlığı",
              "AFAD İlçe Birimi",
              "Karayolları 14. Şube Şefliği",
              "TEDAŞ İşletme Şefliği",
              "Türk Kızılay Şubesi, İtfaiye, (gerektiğinde) Müftülük",
            ),
            h2("Geçmişten Ders & Revizyon"),
            p(
              i("Geçen yıl tipi olayında görev dağılımının net olmaması nedeniyle ilk müdahalede 47 dakikalık gecikme"),
              " yaşanmıştı. Taslak 02.05.2026'da Kaymakam onayına sunuldu, küçük revizyonlarla döndü:",
            ),
            ol(
              ["AFAD'ın ", b("7/24 nöbet planı"), " eklendi"],
              ["Trafik nöbet saatleri Emniyet + Jandarma arasında ", b("saatlik rotasyon")],
              ["Muhtarlıklar ", b("erken uyarı zincirine"), " dahil edildi"],
            ),
            h3("Tebliğ & Arşiv"),
            p(
              "Belge ",
              b("EBYS"),
              " üzerinden tüm kurumlara tebliğ edilecek; Kaymakamlık makam odası ve Özel Kalem panosuna asılacaktır. Sezon sonunda fiili performans değerlendirilir.",
            ),
          ),
          etiketler: ["Acil", "Kaymakamlık"],
          yetkililer: ["ozelMemur", "ozelAmir"],
          birimler: ["emniyet", "jandarma", "afad"],
          baslangic: gunEkle(-7),
          bitis: gunEkle(2, 17),
          kontrol: [
            {
              ad: "Onay adımları",
              maddeler: [
                { metin: "Birim temsilcilerini kesinleştir", atanan: "ozelAmir", tamam: true, tamamlanmaGun: -6 },
                { metin: "Telefon zincirini güncelle", atanan: "ozelMemur2", tamam: true, tamamlanmaGun: -3 },
                { metin: "Kaymakam onayına sun", atanan: "ozelMemur" },
                { metin: "İmza dosyası matbu hale getirilecek", atanan: "yaziMemur" },
              ],
            },
            {
              ad: "Lojistik",
              maddeler: [
                { metin: "Toplantı odası akşam 17:30 hazır", atanan: "ozelMemur2", tamam: true, tamamlanmaGun: -1 },
                { metin: "Sunum ekranı + projeksiyon kontrolü", atanan: "ozelMemur2" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "ozelAmir",
              icerik:
                "Taslak görev dağılımı tarafımca hazırlandı. Nöbet kalemlerinde özellikle Karaçoban hattı ve Doğanca rampa için ek ekip ihtiyacı görünüyor. @<emniyetAmir> trafik nöbetlerini eklemenizi rica ediyorum, mümkünse saatlik rotasyon olsun.",
              gunFarki: -5,
              saat: 10,
            },
            {
              yazan: "emniyetAmir",
              icerik:
                "Saatlik rotasyon makul. Devriye saatlerini ek-2 dosyasına işledim, jandarma ile saat geçişlerinde 15 dk overlap bıraktım — vaka boşluğu olmasın diye. @<jandarmaAmir> bu plana itirazınız var mı?",
              gunFarki: -4,
              saat: 11,
              yanit: 0,
            },
            {
              yazan: "jandarmaAmir",
              icerik:
                "Plan uygundur. Karaçoban karakolu ek personel için il jandarma komutanlığından takviye talep ettik, salı günü ulaşması bekleniyor. Geç olursa rotasyona biz de overlap koyarız.",
              gunFarki: -4,
              saat: 14,
              yanit: 1,
            },
            {
              yazan: "afadAmir",
              icerik:
                "AFAD ekibinin nöbet planı 7/24 olacak şekilde güncellendi. Paletli aracın yakıt deposu da bu hafta tam dolduruldu, motorin rezervi belediye depodan ek 200 lt aldık. Sayın @<kaymakam> bilgilerinize.",
              gunFarki: -3,
              saat: 9,
              duzenlendi: true,
            },
            {
              yazan: "kaymakam",
              icerik:
                "Teşekkür ederim. Bu hafta perşembe sabahı tüm birim amirleriyle birlikte kriz masası tatbikatı yapalım — gerçek bir kar yağışı senaryosunda kim ne yapıyor, masada görelim. @<ozelMemur> davet yazılarını çıkarın.",
              gunFarki: -2,
              saat: 16,
              yanit: 3,
            },
            {
              yazan: "ozelMemur",
              icerik:
                "Davet yazıları hazırlandı, bugün öğleden sonra EBYS üzerinden dağıtıma çıkıyor. Tatbikat saati 09:00 olarak planlandı, yer makam toplantı odası.",
              gunFarki: -1,
              saat: 13,
              yanit: 4,
            },
          ],
          ekler: [
            { ad: "kriz-masasi-gorev-dagilimi.pdf", mime: "application/pdf", boyut: 184_320 },
            { ad: "telefon-zinciri-2026.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", boyut: 42_500, yukleyen: "ozelMemur" },
          ],
        },
        {
          key: "kis-genelge",
          baslik: "Valilik kış tedbirleri genelgesini ilgili kurumlara dağıt",
          aciklama:
            "Erzurum Valiliği'nin 29.10.2026 tarih ve 4521 sayılı 'Kış Mevsimi Tedbirleri ve Hazırlıkları' konulu genelgesi, ilçe sınırlarımız içerisindeki tüm bağlı ve ilgili kurumlara EBYS üzerinden ek-1 (görev tablosu) ve ek-2 (iletişim listesi) ile birlikte tebliğ edilecektir. Genelge; karla mücadele, yol bakım, içme suyu güvenliği, soba zehirlenmelerine karşı bilinçlendirme, evsiz vatandaşların barınma desteği, ilaç ve gıda stoklarının teyidi, hastane jeneratör testleri ve afet hazırlığı başlıklarını kapsamaktadır. Dağıtım planı yapılırken; Belediye Başkanlığı, İl Özel İdaresi temsilciliği, Karayolları, TEDAŞ, PTT, sağlık birimleri, eğitim kurumları, mahalle ve köy muhtarlıkları kapsama alınmıştır. Köy muhtarlıklarına ulaşımın gecikme riskine karşı PTT taahhütlü posta kanalı yedek olarak hazırda tutulacaktır. Genelgenin imza takibi 'imza dolaştırma defteri' ile yapılacak; her kurum 5 iş günü içinde tebellüğ etmiş olacaktır. Geçen sezon iki köy muhtarlığına genelge geç ulaştığı için yol durumu raporları ilk hafta toplanamamıştı; bu yıl muhtar telefonlarına da SMS ile bilgilendirme gönderilecektir. Genelge metni Kaymakamlık web sitesinde 'Duyurular' sekmesinde de yayımlanacaktır.",
          aciklamaDokuman: doc(
            h2("Yasal Kaynak"),
            p(
              b("Erzurum Valiliği 29.10.2026 tarih ve 4521 sayılı 'Kış Mevsimi Tedbirleri ve Hazırlıkları'"),
              " genelgesi ilçe sınırlarımız içindeki bağlı/ilgili kurumlara ",
              b("EBYS"),
              " üzerinden ek-1 (görev tablosu) ve ek-2 (iletişim listesi) ile tebliğ edilecektir.",
            ),
            h2("Genelge Başlıkları"),
            ul(
              "Karla mücadele ve yol bakım",
              "İçme suyu güvenliği",
              "Soba zehirlenmesi bilinçlendirme",
              "Evsiz vatandaşların barınma desteği",
              "İlaç ve gıda stoklarının teyidi",
              "Hastane jeneratör testleri ve afet hazırlığı",
            ),
            h3("Dağıtım Kapsamı"),
            ul(
              "Belediye Başkanlığı, İl Özel İdaresi temsilciliği",
              "Karayolları, TEDAŞ, PTT",
              "Sağlık birimleri, eğitim kurumları",
              "Mahalle ve köy muhtarlıkları",
            ),
            h3("Geçen Yılki Aksaklık"),
            p(
              i("Geçen sezon iki köy muhtarlığına genelge geç ulaştığı için yol durumu raporları ilk hafta toplanamamıştı."),
              " Bu yıl muhtarlara ek olarak ",
              b("SMS bilgilendirme"),
              " ve yedek ",
              b("PTT taahhütlü posta"),
              " kanalı kullanılacak; imza takibi 'imza dolaştırma defteri' ile ",
              b("5 iş günü"),
              " içinde tamamlanacaktır.",
            ),
          ),
          etiketler: ["Yazışma", "Kaymakamlık"],
          yetkililer: ["yaziAmir", "yaziMemur"],
          baslangic: gunEkle(-2),
          bitis: gunEkle(1, 16),
          kontrol: [
            {
              ad: "Dağıtım",
              maddeler: [
                { metin: "EBYS üzerinden dağıtım planı oluştur", atanan: "evrakKayit", tamam: true },
                { metin: "İmza takibi dosyasını aç", atanan: "yaziMemur2" },
                { metin: "Dağıtım listesini muhtarlıklara da ilet", atanan: "yaziMemur" },
              ],
            },
          ],
          yorumlar: [
            { yazan: "yaziAmir", icerik: "Genelge bugün öğleden sonra dağıtıma çıkıyor, ek-2 listesi son halini aldı.", gunFarki: -1 },
          ],
          ekler: [
            { ad: "valilik-genelgesi-2026-04.pdf", mime: "application/pdf", boyut: 312_000, yukleyen: "yaziMemur" },
          ],
        },
        {
          key: "kis-toplanti",
          baslik: "Haftalık değerlendirme toplantısı (her Çarşamba 14:00)",
          aciklama:
            "Kış sezonu boyunca, her Çarşamba saat 14:00'te Kaymakamlık makamında 'İlçe Kış Koordinasyon Toplantısı' yapılacak ve tüm aktif kurumlarla haftalık durum değerlendirmesi gerçekleştirilecektir. Toplantı gündemi her hafta cuma akşamına kadar Özel Kalem Müdürlüğü'ne iletilen birim raporlarından derlenir; pazartesi sabahı katılımcılara mail ile gönderilir. Toplantıda her birim kendi sorumluluk alanında geçen haftaki gelişmeleri, mevcut riskleri ve kaynak ihtiyaçlarını sunacaktır. Görüşülen başlıklar: yol durumu, tuz/solüsyon stokları, kömür yardım kuyruğu, sağlık nöbetleri, elektrik kesintileri, ihbar/şikayet yoğunluğu, okul kapanma kararları ve hava tahminine bağlı senaryo planlaması. Toplantı tutanakları Pusula sistemine girilerek AktiviteLogu'na otomatik kaydedilir; alınan kararlar ilgili karta görev olarak düşer. Sayın Kaymakamımız, makul mazeret dışında tüm birim amirlerinin bizzat katılmasını talimatlandırmıştır; vekalet sadece amirin onayıyla mümkündür. Toplantı odasında telefonların sessize alınması ve sunumların 5 dakikayla sınırlandırılması, geçen yıl yaşanan zaman aşımı sorunlarına yönelik alınan tedbirlerdir.",
          aciklamaDokuman: doc(
            h2("Toplantı Düzeni"),
            p(
              "Kış sezonu boyunca her ",
              b("Çarşamba 14:00"),
              "'te Kaymakamlık makamında ",
              b("'İlçe Kış Koordinasyon Toplantısı'"),
              " yapılacaktır. Gündem her cuma akşamına kadar Özel Kalem'e iletilen birim raporlarından derlenir, pazartesi sabahı katılımcılara mail ile gönderilir.",
            ),
            h2("Görüşülen Başlıklar"),
            ul(
              "Yol durumu",
              "Tuz / solüsyon stokları",
              "Kömür yardım kuyruğu",
              "Sağlık nöbetleri",
              "Elektrik kesintileri",
              "İhbar / şikayet yoğunluğu",
              "Okul kapanma kararları",
              "Hava tahminine bağlı senaryo planlaması",
            ),
            h3("Katılım Kuralı"),
            p(
              "Sayın Kaymakam, makul mazeret dışında ",
              b("tüm birim amirlerinin bizzat katılmasını"),
              " talimatlandırmıştır; vekalet ",
              i("sadece amirin onayıyla"),
              " mümkündür.",
            ),
            h3("Disiplin"),
            p(
              "Telefonlar sessize, sunumlar ",
              b("5 dakika"),
              " ile sınırlıdır — ",
              i("geçen yıl yaşanan zaman aşımı sorunlarına yönelik"),
              " alınan tedbirdir. Tutanaklar Pusula AktiviteLogu'na kaydedilir; kararlar ilgili karta görev olarak düşer.",
            ),
          ),
          etiketler: ["Kaymakamlık"],
          yetkililer: ["ozelAmir"],
          birimler: ["ozelKalem"],
          bitis: gunEkle(7, 14),
          yorumlar: [
            { yazan: "kaymakam", icerik: "Toplantıya tüm birim amirlerinin bizzat katılması gerekmektedir.", gunFarki: -2 },
          ],
        },
      ],
    },
    {
      ad: "Yol & Ulaşım",
      yetkililer: ["belediyeAmir"],
      birimler: ["belediye", "karayollari"],
      kartlar: [
        {
          key: "kis-yol-durumu",
          baslik: "Kırsal mahalle yol durumunu günlük takip et",
          aciklama:
            "İlçemize bağlı 38 köy ve 12 mezranın günlük yol durumu, kar yağışı ve buzlanma takibi tek bir merkezi karttan yürütülecektir. Belediye Fen İşleri ekipleri, Jandarma karakol devriyeleri ve köy muhtarlarından gelen saha bildirimleri sabah 06:00 itibarıyla derlenip Kaymakamlık brifing notuna işlenecek; aynı bilgi 'Tekman Kış Koordinasyon' WhatsApp grubuna düşürülecektir. Kapanan/kısmen açık yollar için müdahale önceliği ulaşım yoğunluğuna, sağlık aciliyeti olan vatandaş bilgisine ve okul servis güzergahına göre belirlenir. Karayolları 14. Şube Şefliği ile koordineli çalışılarak ana arterlerin (Kop geçidi, Karaçoban yolu, Pasinler hattı) sürekli açık tutulması esastır. Tüzü mücadele ile köy yolları arasında öncelik çatışması doğduğunda karar Kaymakamlık makamına intikal eder. Geçen sezon Karaağaç-Doğanca güzergahında 36 saat süren kapanma sırasında bir hasta hayatını kaybetmiş, bu olay sonrası 'kritik vaka erken uyarı zinciri' uygulamaya alınmıştır: muhtar → karakol → 112 → AFAD paletli → Kaymakam ÖKM kanalı. Günlük ulaşım durum raporu PDF olarak çıkarılıp Sayın Kaymakam imzasıyla İl AFAD'a iletilir. Hava tahmin verileri Meteoroloji İstasyonundan saatlik alınarak panele entegre edilmiştir.",
          aciklamaDokuman: doc(
            h2("Kapsam"),
            p(
              "İlçemize bağlı ",
              b("38 köy ve 12 mezranın"),
              " günlük yol durumu, kar yağışı ve buzlanma takibi tek merkezi karttan yürütülür. Belediye Fen İşleri, Jandarma devriyeleri ve köy muhtarlarından gelen saha bildirimleri sabah ",
              b("06:00"),
              " itibarıyla derlenir.",
            ),
            h2("Müdahale Önceliği"),
            ul(
              "Ulaşım yoğunluğu",
              "Sağlık aciliyeti olan vatandaş bilgisi",
              "Okul servis güzergahı",
            ),
            h3("Sürekli Açık Tutulan Ana Arterler"),
            ul(
              b("Kop geçidi"),
              b("Karaçoban yolu"),
              b("Pasinler hattı"),
            ),
            h2("Kritik Vaka Erken Uyarı Zinciri"),
            p(
              i("Geçen sezon Karaağaç-Doğanca güzergahında 36 saat süren kapanma sırasında bir hasta hayatını kaybetmişti."),
              " O olay sonrası uygulamaya alınan zincir:",
            ),
            ol(
              "Muhtar",
              "Karakol",
              "112",
              "AFAD paletli",
              "Kaymakam ÖKM kanalı",
            ),
            h3("Raporlama"),
            p(
              "Günlük ulaşım durum raporu PDF olarak çıkarılıp ",
              b("Sayın Kaymakam imzasıyla İl AFAD'a"),
              " iletilir. Meteoroloji İstasyonundan saatlik hava tahmin verisi panele entegre edilmiştir.",
            ),
          ),
          etiketler: ["Saha", "Acil"],
          yetkililer: ["belediyeFenIsleri", "jandarmaAstsubay"],
          birimler: ["jandarma", "belediye", "muhtarlik", "koyMuhtar"],
          bitis: gunEkle(5, 18),
          kontrol: [
            {
              ad: "Günlük rapor",
              maddeler: [
                { metin: "06:00 — Karayolları durum bildirimi", atanan: "belediyeFenIsleri", tamam: true },
                { metin: "07:00 — Köy muhtarlarından geri bildirim", atanan: "koyMuhtar", tamam: true },
                { metin: "08:30 — Kaymakam brifingi", atanan: "ozelMemur" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "belediyeFenIsleri",
              icerik:
                "Kop geçidi sabah saatlerinde tek şeritli açıldı, tuzlama devam ediyor. Kalsiyum klorür çözeltisi uygulanıyor — buzlanma riskine karşı 2 saat aralıklarla kontrol ekibi gönderiyorum.",
              gunFarki: -1,
              saat: 7,
            },
            {
              yazan: "koyMuhtar",
              icerik:
                "Karaağaç köyü çıkışı kar kalınlığı 60cm, greyder bekleniyor. Köyde gebe vatandaş var (dr. raporu beklemede), gerekirse @<afadAmir> paletli aracı ile hastaneye nakil isteyeceğim.",
              gunFarki: 0,
              saat: 6,
            },
            {
              yazan: "afadAmir",
              icerik:
                "Paletli araç hazır kuvvet halinde, sürücü 112 ile telsiz frekansında. @<koyMuhtar> hasta vakası gerçekleşirse doğrudan beni arayın, sağlık ekibi koordinasyonunu ben yaparım.",
              gunFarki: 0,
              saat: 7,
              yanit: 1,
            },
            {
              yazan: "belediyeAmir",
              icerik:
                "Greyder ve kepçe yola çıktı; öğleden sonra yol açık olacak. Pasinler hattındaki kar kalınlığı tahmin edilenden az, oradan boşalan iki ekibi Doğanca rampaya yönlendirdim.",
              gunFarki: 0,
              saat: 9,
            },
            {
              yazan: "kaymakam",
              icerik:
                "Sahanın koordinasyonunu beğeniyle takip ediyorum. Karaağaç-Doğanca güzergahı bu sezon kritik, geçen yılki gecikmeyi tekrarlamayalım. Akşam toplantısında özet bekliyorum.",
              gunFarki: 0,
              saat: 11,
              duzenlendi: true,
            },
          ],
          ekler: [
            { ad: "yol-durum-raporu-2026-05-04.pdf", mime: "application/pdf", boyut: 96_000, yukleyen: "belediyeFenIsleri" },
            { ad: "saha-fotograflari.zip", mime: "application/zip", boyut: 1_840_000, yukleyen: "belediyeFenIsleri" },
          ],
        },
        {
          key: "kis-tuz-stogu",
          baslik: "Tuz ve solüsyon stoğu — eksik miktarı belirle",
          aciklama:
            "İlçe genelinde karla mücadele için kullanılacak yol tuzu, kalsiyum klorür solüsyonu ve granül tuz stoklarının envanteri çıkarılacaktır. Belediye Fen İşleri deposu (kapasite 240 ton), Karayolları 14. Şube Şefliği şantiyesi (kapasite 600 ton) ve İl Özel İdaresi yedek stoku (180 ton) ayrı ayrı sayım altına alınacak; mevcut miktar ile sezon ihtiyaç tahmini karşılaştırılarak 'eksik miktar tablosu' hazırlanacaktır. Sezon ihtiyacı, geçen 5 yılın ortalama kar yağış miktarı, kapanan yol uzunluğu ve müdahale tekrarına göre hesaplanmıştır: ortalama 1.420 ton tuz + 95.000 litre solüsyon. Eksik tespit edilirse, Erzurum İl Özel İdaresi'ne resmi talep yazısı yazılacak; karşılanmazsa Bayındırlık ve İskan Bakanlığı kanalıyla DMO üzerinden temin yoluna gidilecektir. Geçen sezon Şubat ortasında stok %18'e düşmüş, acil tedarik 4 gün sürmüştü; bu yıl kritik eşik %35 olarak belirlenmiş ve eşik altına düşmeden tedarik prosedürü tetiklenmektedir. Stok sayımı her ayın ilk haftası tekrarlanır, tuz nem yutma oranına karşı depo zemin kontrolü Belediye Fen İşleri sorumluluğundadır. İhtiyaç tablosu Sayın Kaymakam'a 'Kış Stok Brifingi' formatında sunulacaktır.",
          aciklamaDokuman: doc(
            h2("Envanter Noktaları"),
            ul(
              ["Belediye Fen İşleri deposu — ", b("240 ton kapasite")],
              ["Karayolları 14. Şube Şefliği şantiyesi — ", b("600 ton kapasite")],
              ["İl Özel İdaresi yedek stoku — ", b("180 ton kapasite")],
            ),
            h2("Sezon İhtiyaç Tahmini"),
            p(
              "Geçen 5 yılın ortalama kar yağışı, kapanan yol uzunluğu ve müdahale tekrarına göre hesaplandı: ",
              b("1.420 ton tuz + 95.000 litre solüsyon"),
              ".",
            ),
            h3("Tedarik Zinciri"),
            ol(
              "Eksik → Erzurum İl Özel İdaresi'ne resmi talep yazısı",
              ["Karşılanmazsa ", b("Bayındırlık ve İskan Bakanlığı"), " kanalıyla ", b("DMO"), " üzerinden temin"],
            ),
            h3("Geçmişten Ders"),
            p(
              i("Geçen sezon Şubat ortasında stok %18'e düşmüş, acil tedarik 4 gün sürmüştü."),
              " Bu yıl kritik eşik ",
              b("%35"),
              " olarak belirlendi; eşik altına düşmeden tedarik prosedürü otomatik tetiklenir. Sayım her ayın ilk haftası tekrarlanır.",
            ),
          ),
          etiketler: ["Saha", "Yazışma"],
          yetkililer: ["belediyeAmir", "yaziMemur"],
          birimler: ["belediye", "karayollari"],
          bitis: gunEkle(3, 17),
          kontrol: [
            {
              ad: "Stok tespiti",
              maddeler: [
                { metin: "Belediye stok sayımı", atanan: "belediyeFenIsleri", tamam: true },
                { metin: "Karayolları stok sayımı", atanan: "belediyeFenIsleri" },
                { metin: "İhtiyaç tablosunu kaymakamlığa sun", atanan: "belediyeAmir" },
              ],
            },
          ],
        },
        {
          key: "kis-okul-servis",
          baslik: "Taşımalı eğitim servis güzergahlarının kış kontrolü",
          aciklama:
            "İlçemizde taşımalı eğitim kapsamındaki 10 köyden gelen 22 servis aracının kış şartlarına hazırlık denetimi yapılacaktır. Denetim İlçe Milli Eğitim Müdürlüğü ve İlçe Emniyet Trafik Tescil personelinin ortak ekibi tarafından yürütülecek; kontrol edilecek başlıklar: kar lastiği (en az 4 mm diş derinliği), zincir bulundurma zorunluluğu, sürücü ehliyeti ve psikoteknik belgesi geçerliliği, servis takip sisteminin (rehber öğretmen kamerası dahil) çalışırlığı, yakıt ısıtıcısı, ön cam buz çözücüsü ve durak güvenliği. Durak güvenliğinde özellikle kayganlaşan kavşaklarda eğim, görünürlük ve aydınlatma kriterleri değerlendirilecektir. Denetim sonucunda eksikliği tespit edilen güzergahta servis 5 iş günü süreyle askıya alınır; eksiklik giderilmezse güzergah ihalesi yenilenir. Geçen sezon Doğanca güzergahında bir servis aracı zincir takmadığı için ters dönmüş, mucize eseri yaralanma yaşanmamıştı; o olay sonrası bu denetim her sezon başında zorunlu hale gelmiştir. Şoförlere ayrıca Halk Eğitim Merkezi'nde 1 günlük 'kış sürüş' eğitimi verilecek (kura ile 2 grup). Servis takip uygulaması üzerinden veliler aracın anlık konumunu görebilmektedir.",
          aciklamaDokuman: doc(
            h2("Kapsam"),
            p(
              "Taşımalı eğitim kapsamındaki ",
              b("10 köyden 22 servis aracı"),
              " kış şartlarına hazırlık denetimine alınır. Denetimi İlçe Milli Eğitim Müdürlüğü ve İlçe Emniyet Trafik Tescil personeli ortak ekip olarak yürütür.",
            ),
            h2("Kontrol Başlıkları"),
            ul(
              ["Kar lastiği (", b("en az 4 mm diş derinliği"), ")"],
              "Zincir bulundurma zorunluluğu",
              "Sürücü ehliyeti ve psikoteknik belgesi geçerliliği",
              "Servis takip sistemi (rehber öğretmen kamerası dahil)",
              "Yakıt ısıtıcısı, ön cam buz çözücüsü",
              "Durak güvenliği (eğim, görünürlük, aydınlatma)",
            ),
            h3("Müeyyide"),
            p(
              "Eksiklik tespit edilen güzergahta servis ",
              b("5 iş günü askıya"),
              " alınır; giderilmezse ",
              b("güzergah ihalesi yenilenir"),
              ".",
            ),
            h3("Geçmişten Ders"),
            p(
              i("Geçen sezon Doğanca güzergahında bir servis aracı zincir takmadığı için ters dönmüş, mucize eseri yaralanma yaşanmamıştı."),
              " O olay sonrası denetim her sezon başında zorunludur. Şoförlere Halk Eğitim Merkezi'nde 1 günlük 'kış sürüş' eğitimi verilir (kura ile 2 grup); veliler servis takip uygulamasından aracın anlık konumunu görür.",
            ),
          ),
          etiketler: ["Eğitim", "Güvenlik"],
          yetkililer: ["milliMemur", "trafikMemur"],
          birimler: ["milliEgitim", "emniyet"],
          bitis: gunEkle(4, 17),
          kontrol: [
            {
              ad: "Sürücü & araç kontrol",
              maddeler: [
                { metin: "10 servis aracı lastik kontrolü", atanan: "trafikMemur" },
                { metin: "Sürücü belgesi taraması", atanan: "trafikMemur" },
                { metin: "Eksik araç listesini MEM'e gönder", atanan: "milliMemur" },
              ],
            },
          ],
          yorumlar: [
            { yazan: "milliAmir", icerik: "Servis takip uygulamasından canlı liste paylaşıldı.", gunFarki: -1 },
          ],
        },
      ],
    },
    {
      ad: "Sağlık & Acil Müdahale",
      yetkililer: ["saglikAmir"],
      birimler: ["saglik", "hastane", "asm"],
      kartlar: [
        {
          key: "kis-saglik-nobet",
          baslik: "Acil sağlık nöbet çizelgesini yayınla",
          aciklama:
            "Kış sezonunda artması beklenen üst solunum yolu enfeksiyonları, soba zehirlenmeleri, hipotermi vakaları ve kazalar için Tekman Devlet Hastanesi acil servisi, Aile Sağlığı Merkezleri ve 112 ambulans ekiplerinin haftalık entegre nöbet planı yayınlanacaktır. Plan; hekim, hemşire, paramedik, şoför ve teknik personeli kapsayacak şekilde 7/24 vardiya bazlı hazırlanacak; ek olarak nöbetçi eczane çizelgesi ve müracaat telefonları aynı belgeye işlenecektir. Hastane başhekimliği günlük 2 vardiya (08:00-20:00 / 20:00-08:00) ile çalışacak, ASM hekimleri rotasyonel şekilde 'evde sağlık' ve 'gezici aşılama' nöbetlerini de üstlenecektir. Çizelge Pazartesi sabahı saat 09:00'a kadar ilçe sağlık portalında yayınlanacak ve Kaymakamlık web sitesindeki 'Vatandaş Hizmetleri' sekmesine bağlanacaktır. Yoğun kar yağışı durumunda devre dışı kalabilecek köy ASM'leri için yedek hekim atama listesi de plana eklenmiştir. 112 ile yapılan koordinasyonda paletli AFAD aracı ile sağlık ekibinin köy çıkışlı vakalarda ortak hareket protokolü tanımlanmıştır. Geçen yıl bir köyde gece yarısı meydana gelen sobayla ilgili karbonmonoksit zehirlenmesinde, nöbetçi eczane bilgisinin yanlış yayınlanması nedeniyle aile yanlış adrese yönelmiş; bu yıl çift kontrol prosedürü uygulanmaktadır. Nöbet planı ayrıca 'GMK Bulvarı 14 numara' adresindeki Kaymakamlık ilan tahtasında da fiziksel olarak asılacaktır.",
          aciklamaDokuman: doc(
            h2("Yaklaşan Deadline"),
            p(
              b("Pazartesi 09:00"),
              " son yayın saati. Kış sezonunda artması beklenen üst solunum yolu enfeksiyonları, ",
              b("soba zehirlenmeleri"),
              ", hipotermi vakaları ve kazalar için Tekman Devlet Hastanesi acili, ASM'ler ve 112 ekiplerinin entegre haftalık nöbet planı.",
            ),
            h2("Plan İçeriği"),
            ul(
              "Hekim, hemşire, paramedik, şoför, teknik personel — 7/24 vardiya",
              ["Hastane başhekimliği — ", b("2 vardiya"), " (08:00-20:00 / 20:00-08:00)"],
              "ASM hekimleri rotasyonel 'evde sağlık' + 'gezici aşılama' nöbeti",
              "Nöbetçi eczane çizelgesi ve müracaat telefonları aynı belgede",
              "Devre dışı kalabilecek köy ASM'leri için yedek hekim listesi",
            ),
            h3("Yayın Kanalları"),
            ol(
              "İlçe sağlık portalı (Pazartesi 09:00)",
              "Kaymakamlık web sitesi 'Vatandaş Hizmetleri' sekmesi",
              "Kaymakamlık ilan tahtası (GMK Bulvarı 14)",
            ),
            h3("Geçen Yılki Hata"),
            p(
              i("Bir köyde gece yarısı yaşanan karbonmonoksit zehirlenmesinde nöbetçi eczane bilgisi yanlış yayınlanmış, aile yanlış adrese yönelmişti."),
              " Bu yıl ",
              b("çift kontrol prosedürü"),
              " uygulanır. Paletli AFAD aracı ile köy çıkışlı vakalarda 112 ortak hareket protokolü tanımlandı.",
            ),
          ),
          etiketler: ["Sağlık", "Acil"],
          yetkililer: ["saglikMemur", "hastaneBashekim"],
          birimler: ["saglik", "hastane", "asm", "eczane"],
          bitis: gunEkle(1, 15),
          kontrol: [
            {
              ad: "Plan hazırlığı",
              maddeler: [
                { metin: "Hastane nöbet listesini al", atanan: "hastaneBashekim", tamam: true },
                { metin: "ASM nöbet listesini al", atanan: "asmDoktor", tamam: true },
                { metin: "Nöbetçi eczaneyi haftalık tabloya ekle", atanan: "saglikMemur" },
                { metin: "Web sitesinde yayınla", atanan: "saglikMemur" },
              ],
            },
          ],
          yorumlar: [
            { yazan: "saglikAmir", icerik: "Hastane ve ASM planı birleştirildi; nöbetçi eczane ayrıca eklenecek.", gunFarki: -2 },
            { yazan: "hastaneBashekim", icerik: "112 ile koordinasyonu da listeye dahil ediyoruz.", gunFarki: -1 },
          ],
          ekler: [
            { ad: "haftalik-nobet-cizelgesi.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", boyut: 28_000, yukleyen: "saglikMemur" },
          ],
        },
        {
          key: "kis-ambulans",
          baslik: "Karla mücadele için ambulans + paletli araç koordinasyonu",
          aciklama:
            "AFAD'a tahsisli paletli kar paletli aracı ile 112 acil sağlık ekiplerinin, kar nedeniyle ulaşımın kapandığı köy ve mezralarda meydana gelen sağlık vakalarına müdahale protokolü hazırlanacaktır. Protokolde; ortak çağrı kanalı (TETRA telsiz frekansı T-7), buluşma noktaları (köy yolu kavşakları), hasta nakil sıralaması ve şoför rotasyonu kalemleri yer alır. AFAD paletli aracı toplam 6 personel + 1 sedye taşıma kapasitesine sahip olup -25°C'ye kadar çalışabilmektedir. Çağrı geldiğinde 112 dispeçeri AFAD operasyon merkezine paralel bildirim yapar; iki ekip Kop Geçidi yol ayrımında buluşur. Geçen sezon Doğanca köyünde yaşanan kalp krizi vakasında bu protokolün eksikliği nedeniyle hasta hayatını kaybetmişti; o olay sonrası protokol resmi yazıyla yeniden düzenlenmiş ve Sağlık Bakanlığı 112 Genel Müdürlüğü onayından geçmiştir. Ekiplere ortak müdahale eğitimi (Şubat ortası 2 günlük) verilecek, şoförler GPS koordinat okuma konusunda tatbikat yapacaklardır. Yakıt ikmali; AFAD aracı için Belediye akaryakıt deposu, 112 araçları için Sağlık Müdürlüğü kontörlü kart sistemi üzerinden sağlanır.",
          aciklamaDokuman: doc(
            h2("Protokol Çerçevesi"),
            p(
              "AFAD paletli aracı ile ",
              b("112 acil sağlık ekiplerinin"),
              " kar nedeniyle ulaşımın kapandığı köy ve mezralarda ortak hareket protokolü.",
            ),
            h2("Teknik Bilgiler"),
            ul(
              ["Ortak çağrı kanalı: ", b("TETRA telsiz frekansı T-7")],
              ["AFAD paletli kapasitesi: ", b("6 personel + 1 sedye")],
              ["Çalışma sıcaklığı: ", b("-25°C'ye kadar")],
              "Buluşma noktası: Kop Geçidi yol ayrımı",
              "Yakıt ikmali: AFAD → Belediye deposu, 112 → kontörlü kart",
            ),
            h3("Geçmişten Ders"),
            p(
              i("Geçen sezon Doğanca köyünde yaşanan kalp krizi vakasında bu protokolün eksikliği nedeniyle hasta hayatını kaybetmişti."),
              " Protokol resmi yazıyla yeniden düzenlenmiş ve ",
              b("Sağlık Bakanlığı 112 Genel Müdürlüğü"),
              " onayından geçmiştir.",
            ),
            h3("Eğitim & Tatbikat"),
            ol(
              "Şubat ortası 2 günlük ortak müdahale eğitimi",
              "Şoförler için GPS koordinat okuma tatbikatı",
              "112 dispeçeri ↔ AFAD operasyon merkezi paralel bildirim akışı",
            ),
          ),
          etiketler: ["Sağlık", "Acil"],
          yetkililer: ["afadAmir", "saglikAmir"],
          birimler: ["afad", "saglik"],
          bitis: gunEkle(6, 17),
          kontrol: [
            {
              ad: "Protokol",
              maddeler: [
                { metin: "Ortak çağrı kanalı belirlendi", atanan: "afadAmir", tamam: true },
                { metin: "Şoför rotasyonu hazırlandı", atanan: "afadAmir" },
              ],
            },
          ],
        },
        {
          key: "kis-grip-asisi",
          baslik: "Mevsimsel grip aşısı planı — risk gruplarına ulaş",
          aciklama:
            "Sağlık Bakanlığı'nın yayımladığı 2026-2027 sezon mevsimsel grip aşılama programı kapsamında, ilçemize tahsis edilen 4.200 doz aşının risk gruplarına ulaştırılması planlanmıştır. Öncelik sıralaması: 65 yaş üstü vatandaşlar (yaklaşık 2.300 kişi), kronik hastalığı olanlar (KOAH, kalp yetmezliği, diyabet, immün baskılanmış), sağlık çalışanları, okul ve kreş personeli, askeri birlik personeli, hamileler ve 6 ay-5 yaş çocuklar. Aşılama Aile Sağlığı Merkezleri ve TSM gezici aşılama ekibi üzerinden yürütülecek; ulaşılması güç köylere muhtarlıklar aracılığıyla randevulu çıkış yapılacaktır. ASM'lerin aşı buzdolabı sıcaklık takibi 7/24 dijital sensörle yapılır; sıcaklık aşımında otomatik SMS uyarısı tanımlıdır. Veliler için bilgilendirme metni İlçe Müftülüğü cuma vaazına ve okul WhatsApp gruplarına yansıtılacaktır. İmam Hatip Lisesi 11. sınıf öğrencileri 'gönüllü sağlık taraması' faaliyeti kapsamında randevu yönlendirme destek sağlayacaktır. Geçen yıl aşılama oranı %38'de kalmıştı; bu yıl hedef %55. Aşı reddi vakalarında zorlama yapılmaz, ancak risk grubundakilere bilgilendirme tekrarlanır.",
          aciklamaDokuman: doc(
            h2("Program & Doz"),
            p(
              b("Sağlık Bakanlığı 2026-2027 sezon mevsimsel grip aşılama"),
              " programı kapsamında ilçemize tahsis edilen ",
              b("4.200 doz"),
              " aşının risk gruplarına ulaştırılması.",
            ),
            h2("Öncelik Sıralaması"),
            ol(
              ["65 yaş üstü vatandaşlar (~", b("2.300 kişi"), ")"],
              "Kronik hastalığı olanlar (KOAH, kalp yetmezliği, diyabet, immün baskılanmış)",
              "Sağlık çalışanları",
              "Okul ve kreş personeli",
              "Askeri birlik personeli",
              "Hamileler",
              "6 ay-5 yaş çocuklar",
            ),
            h3("Saha Yürütümü"),
            ul(
              "ASM'ler + TSM gezici aşılama ekibi",
              "Ulaşılması güç köyler için muhtarlık üzerinden randevulu çıkış",
              "Aşı buzdolabı 7/24 dijital sensörle, sıcaklık aşımında otomatik SMS",
              "İmam Hatip Lisesi 11. sınıf gönüllü sağlık taraması — randevu yönlendirme",
            ),
            h3("Hedef"),
            p(
              i("Geçen yıl aşılama oranı %38'de kalmıştı."),
              " Bu yıl hedef ",
              b("%55"),
              ". Müftülük cuma vaazı ve okul WhatsApp gruplarıyla bilgilendirme yapılır; aşı reddinde zorlama yok, risk grubuna bilgilendirme tekrarlanır.",
            ),
          ),
          etiketler: ["Sağlık"],
          yetkililer: ["asmDoktor"],
          birimler: ["asm", "tsm"],
          bitis: gunEkle(14, 17),
          tamamlandi: false,
        },
      ],
    },
    {
      ad: "Enerji & Altyapı",
      yetkililer: ["tedasSef"],
      birimler: ["tedas", "afad", "itfaiye"],
      kartlar: [
        {
          key: "kis-tedas-trafo",
          baslik: "Köy trafo bakımları — fırtına öncesi son tur",
          aciklama:
            "TEDAŞ Tekman İşletme Şefliği sorumluluğundaki köyler arası 14 trafonun, kış fırtınaları öncesi son bakım turu yapılacaktır. Bakım kapsamı; izolatör temizliği, paratoner kontrolü, sigorta yenilenmesi, soğuyan yağ seviyesi, trafo direği zemin sağlamlığı ve OG (orta gerilim) hat askılarının düşme riskinin değerlendirilmesi başlıklarını içerir. Çığ ve buzlanma riski yüksek noktalar (Kop geçidi, Karaağaç-Yolüstü hattı, Doğanca rampa) önceliklendirilmiş; bu noktalardaki trafolarda yedek sigorta deposu mahalde tutulacaktır. Bakım programı sırasında planlı kesinti yapılacak köylerde muhtarlıklara 48 saat öncesinden bilgi verilir, hastane ve sağlık ocaklarına özellikle ulaşılır. Geçen sezon Yolüstü hattında bir trafo yıldırım çarpması nedeniyle 38 saat süreyle 4 köyü elektriksiz bırakmış, jenarator kapasiteleri yetersiz kalmıştı; o olay sonrası yedek mobil trafo (TEDAŞ İl Müdürlüğü envanterinde 2 adet) için Tekman'a öncelik tanınmıştır. Bakım sonrası raporlar elektronik olarak Pusula'ya yüklenir, AFAD afet yönetim panelinde haritalandırılır. Karayolu kapanması nedeniyle ulaşılamayan trafolar için drone destekli görsel inceleme alternatifi planlanmıştır.",
          aciklamaDokuman: doc(
            h2("Kapsam"),
            p(
              b("TEDAŞ Tekman İşletme Şefliği"),
              " sorumluluğundaki köyler arası ",
              b("14 trafonun"),
              " kış fırtınaları öncesi son bakım turu.",
            ),
            h2("Bakım Başlıkları"),
            ul(
              "İzolatör temizliği",
              "Paratoner kontrolü",
              "Sigorta yenilenmesi",
              "Soğuyan yağ seviyesi",
              "Trafo direği zemin sağlamlığı",
              "OG (orta gerilim) hat askıları düşme riski",
            ),
            h3("Önceliklendirilen Riskli Noktalar"),
            ul(
              b("Kop geçidi"),
              b("Karaağaç-Yolüstü hattı"),
              b("Doğanca rampa"),
            ),
            p(
              "Bu noktalarda ",
              b("yedek sigorta deposu mahalde"),
              " tutulur.",
            ),
            h3("Geçmişten Ders"),
            p(
              i("Geçen sezon Yolüstü hattında bir trafo yıldırım çarpması nedeniyle 38 saat süreyle 4 köyü elektriksiz bırakmış, jeneratör kapasiteleri yetersiz kalmıştı."),
              " O olay sonrası yedek mobil trafo (TEDAŞ İl envanterinde 2 adet) için ",
              b("Tekman'a öncelik"),
              " tanınmıştır. Ulaşılamayan trafolar için ",
              b("drone destekli görsel inceleme"),
              " alternatifi planlandı; bakım raporları Pusula'ya yüklenip AFAD afet yönetim panelinde haritalandırılır. Planlı kesintilerde muhtarlıklara 48 saat öncesinden bilgi verilir.",
            ),
          ),
          etiketler: ["Saha"],
          yetkililer: ["tedasSef"],
          birimler: ["tedas"],
          bitis: gunEkle(8, 17),
          kontrol: [
            {
              ad: "Bakım turu",
              maddeler: [
                { metin: "Karaağaç hattı kontrolü", atanan: "tedasSef", tamam: true },
                { metin: "Yolüstü hattı kontrolü", atanan: "tedasSef" },
                { metin: "Doğanca trafo değişimi", atanan: "tedasSef" },
              ],
            },
          ],
        },
        {
          key: "kis-doğalgaz-jenerator",
          baslik: "Acil servis jeneratör testi — hastane ve nüfus müdürlüğü",
          aciklama:
            "Tekman Devlet Hastanesi acil servisi, ameliyathane, yoğun bakım ve İlçe Nüfus Müdürlüğü merkez sunucu odası başta olmak üzere kritik kurum jeneratörlerinin yakıt seviyesi ve çalıştırma testleri 15 günde bir periyodik olarak yapılır. Test prosedüründe; otomatik geçiş süresi (10 saniyeyi geçmemeli), yük altında 30 dakika çalıştırma, yakıt filtresi temizliği, motor yağı seviyesi, akü voltajı ve egzoz duman rengi kontrolü yer alır. Hastane jeneratörü 250 kVA kapasiteli olup en az 12 saat kesintisiz çalışabilecek dizel rezervi tutulur; bu rezerv haftalık olarak ölçülür. Nüfus Müdürlüğü, MERNİS sistemine erişim için kesintisiz güç gerektirdiğinden 25 kVA jeneratör + UPS kombinasyonu kullanmaktadır. Belediye Başkanlığı, AFAD ve Kaymakamlık binalarındaki jeneratörler de aynı programa dahildir. Test raporları Sağlık Müdürlüğü ve Yazı İşleri Müdürlüğü tarafından arşivlenir; üç ardışık başarısız testten sonra ekipmanın yenilenmesi önerilir. Geçen kış Tekman merkezde 4 saatlik kesintide hastane otomatik geçişi 38 saniye sürmüş, bu süre kabul edilemez bulunmuştu; otomatik aktarma şalteri yenilenmiştir. Yakıt ikmali için Belediye akaryakıt deposu yedeği 2 ton dizel olarak rezerve edilmiştir.",
          aciklamaDokuman: doc(
            h2("Test Periyodu"),
            p(
              "Tekman Devlet Hastanesi acil servisi, ameliyathane, yoğun bakım ve ",
              b("İlçe Nüfus Müdürlüğü merkez sunucu odası"),
              " başta olmak üzere kritik kurum jeneratörleri ",
              b("15 günde bir"),
              " periyodik teste tabi tutulur.",
            ),
            h2("Test Prosedürü"),
            ul(
              ["Otomatik geçiş süresi: ", b("10 saniyeyi geçmemeli")],
              "Yük altında 30 dakika çalıştırma",
              "Yakıt filtresi temizliği, motor yağı seviyesi",
              "Akü voltajı ve egzoz duman rengi kontrolü",
            ),
            h3("Kapasiteler"),
            ul(
              ["Hastane: ", b("250 kVA"), " — en az 12 saat dizel rezervi (haftalık ölçüm)"],
              ["Nüfus Müdürlüğü: ", b("25 kVA + UPS"), " (MERNİS kesintisiz güç)"],
              "Belediye, AFAD, Kaymakamlık binaları aynı programa dahil",
            ),
            h3("Geçen Yılki Sorun"),
            p(
              i("Geçen kış Tekman merkezde 4 saatlik kesintide hastane otomatik geçişi 38 saniye sürmüş, bu süre kabul edilemez bulunmuştu."),
              " ",
              b("Otomatik aktarma şalteri yenilendi"),
              ". Üç ardışık başarısız testten sonra ekipman yenilenmesi önerilir; Belediye akaryakıt deposunda yakıt ikmali için ",
              b("2 ton dizel"),
              " rezerve edildi.",
            ),
          ),
          etiketler: ["Sağlık", "Kurumsal"],
          yetkililer: ["hastaneBashekim", "nufusMemur"],
          birimler: ["hastane", "nufus"],
          bitis: gunEkle(10, 17),
        },
      ],
    },
    {
      ad: "Tamamlananlar",
      kartlar: [
        {
          key: "kis-stok",
          baslik: "Kumanya ve yakıt stok listesi güncellendi",
          aciklama:
            "KÖYDES (Köy Destek Programı) ve Belediye Başkanlığı stok beyanları teyit edilmiş, ilçe genelinde acil durum kumanya ve yakıt envanteri 4 ana noktaya yayılmış olarak güncellenmiştir. Mevcut envanter: 12.500 kg un, 6.800 kg pirinç, 4.200 kg makarna, 5.400 litre ayçiçek yağı, 9.000 kg kömür, 3.200 litre dizel, 1.800 litre motorin. Eklenen 4 yeni köy depolama noktası (Doğanca muhtarlık binası, Karaağaç köy konağı, Yolüstü taziye evi, Yeniköy okul deposu) toplam 1.800 kişi/gün acil ihtiyaç karşılayabilecek kapasitededir. Stoklar Kızılay ve SYDV koordinasyonunda dağıtılır, dağıtım sırası SOSYAL-NET kayıtlı dosyalar önceliğindedir. Sezon ortasında stok denetimi tekrar yapılacaktır. Geçen sezon kumanya yetersizliği nedeniyle 11 hane 3 gün boyunca yakındaki köyden yardım almak zorunda kalmıştı; bu yıl köy depo dağılımıyla bu risk %75 azaltılmıştır.",
          aciklamaDokuman: doc(
            h2("Tamamlanan Çalışma"),
            p(
              b("KÖYDES"),
              " ve Belediye Başkanlığı stok beyanları teyit edildi; ilçe genelinde acil durum kumanya ve yakıt envanteri ",
              b("4 ana noktaya yayılmış"),
              " olarak güncellendi.",
            ),
            h2("Mevcut Envanter"),
            ul(
              "12.500 kg un",
              "6.800 kg pirinç",
              "4.200 kg makarna",
              "5.400 litre ayçiçek yağı",
              "9.000 kg kömür",
              "3.200 litre dizel",
              "1.800 litre motorin",
            ),
            h3("Yeni Köy Depo Noktaları"),
            ul(
              "Doğanca muhtarlık binası",
              "Karaağaç köy konağı",
              "Yolüstü taziye evi",
              "Yeniköy okul deposu",
            ),
            p(
              "Toplam ",
              b("1.800 kişi/gün"),
              " acil ihtiyaç karşılayabilecek kapasitede. Stoklar ",
              b("Kızılay ve SYDV"),
              " koordinasyonunda, ",
              b("SOSYAL-NET"),
              " kayıtlı dosyalar öncelikli olarak dağıtılır.",
            ),
            h3("Önceki Sezon Karşılaştırması"),
            p(
              i("Geçen sezon kumanya yetersizliği nedeniyle 11 hane 3 gün boyunca yakındaki köyden yardım almak zorunda kalmıştı."),
              " Bu yıl köy depo dağılımıyla risk ",
              b("%75 azaltıldı"),
              ". Sezon ortasında stok denetimi tekrarlanacaktır.",
            ),
          ),
          etiketler: ["Saha"],
          tamamlandi: true,
          yorumlar: [
            { yazan: "ozelAmir", icerik: "Stok tablosu nihai. Sezon ortasında tekrar gözden geçirilecek.", gunFarki: -8 },
          ],
        },
        {
          key: "kis-egitim",
          baslik: "Sürücü eğitimleri — kar lastiği & zincir",
          aciklama:
            "Tekman Halk Eğitim Merkezi'nde, kaymakamlık makam araçları, belediye hizmet araçları, sağlık 112 ekipleri, AFAD personeli ve ilçe okul servis sürücüleri olmak üzere toplam 47 sürücüye 1 günlük 'kış sürüş tekniği' eğitimi verilmiştir. Eğitim modülleri: kar lastiği seçimi ve diş derinliği kontrolü, zincir takma uygulaması, buzlu zeminde fren tekniği (ABS ile ABS'siz), tipi koşullarında görüş mesafesi yönetimi, dur-kalk durumlarında kayma önleme, donmuş yokuşlarda araç bırakma kuralları. Eğitim teorik kısımdan sonra Tekman Stadyumu otoparkında pratik tatbikatla pekiştirilmiştir. Katılımcılara katılım belgesi düzenlenmiş ve sicillerine işlenmiştir. Geçen yıl 17 sürücüye eğitim verilebilmişti; bu yıl katılım daha geniş tutulmuş ve özellikle yeni göreve başlayanlar zorunlu davete tabi tutulmuştur. Eğitim sonrası anket sonuçlarına göre memnuniyet skoru 4.7/5'tir. Eğitim videoları kayda alınarak kurumsal eğitim arşivine eklenmiştir; bir sonraki sezon yenileme eğitimi yarım gün sürecek şekilde planlanmaktadır.",
          aciklamaDokuman: doc(
            h2("Tamamlanan Eğitim"),
            p(
              b("Tekman Halk Eğitim Merkezi"),
              "'nde kaymakamlık makam araçları, belediye, 112, AFAD ve okul servis sürücüleri dahil ",
              b("toplam 47 sürücüye"),
              " 1 günlük ",
              b("'kış sürüş tekniği'"),
              " eğitimi verilmiştir.",
            ),
            h2("Eğitim Modülleri"),
            ul(
              "Kar lastiği seçimi ve diş derinliği kontrolü",
              "Zincir takma uygulaması",
              "Buzlu zeminde fren tekniği (ABS ile ABS'siz)",
              "Tipi koşullarında görüş mesafesi yönetimi",
              "Dur-kalk durumlarında kayma önleme",
              "Donmuş yokuşlarda araç bırakma kuralları",
            ),
            h3("Pratik Tatbikat"),
            p(
              "Teorik kısım sonrası ",
              b("Tekman Stadyumu otoparkında"),
              " pratik tatbikatla pekiştirildi. Katılımcılara katılım belgesi düzenlenmiş ve sicillerine işlenmiştir.",
            ),
            h3("Sonuçlar"),
            p(
              i("Geçen yıl yalnızca 17 sürücüye eğitim verilebilmişti."),
              " Bu yıl katılım genişletildi; yeni göreve başlayanlar ",
              b("zorunlu davete"),
              " tabi tutuldu. Eğitim sonrası anket memnuniyet skoru ",
              b("4.7/5"),
              ". Videolar kurumsal eğitim arşivine eklendi; gelecek sezon yarım günlük yenileme eğitimi planlanıyor.",
            ),
          ),
          etiketler: ["Eğitim"],
          tamamlandi: true,
          ekler: [
            { ad: "egitim-katilim-tutanagi.pdf", mime: "application/pdf", boyut: 64_000, yukleyen: "halkEgitimMudur" },
          ],
        },
      ],
    },
  ],
};
