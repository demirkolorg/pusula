// Proje: Sosyal Yardım Süreçleri ve Hane İncelemeleri
// SYDV mütevelli heyeti gündemi, ASHB koordinasyonu, hane saha incelemeleri.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";

export const sosyalYardimProjesi: ProjeSeed = {
  key: "sosyal",
  ad: "Sosyal Yardım ve Hane İnceleme Süreçleri",
  aciklama:
    "SYDV mütevelli heyeti gündem hazırlığı, ASHB ile sosyal inceleme koordinasyonu, hane ziyaretleri ve yardım kararlarının takibi.",
  olusturan: "sydvMemur",
  yetkililer: ["kaymakam", "sydvMemur", "asdmAmir", "sydvSosyalCalisan"],
  birimler: ["sydv", "asdm", "muftuluk", "kizilay", "muhtarlik", "koyMuhtar"],
  kapakRenk: "yesil",
  kapakIkon: "heart-handshake",
  yildizli: true,
  listeler: [
    {
      ad: "Yeni Başvurular",
      yetkililer: ["sydvMemur"],
      birimler: ["sydv"],
      kartlar: [
        {
          key: "sosyal-baş-001",
          baslik: "Başvuru #2026/0421 — Yaşlı bakım desteği",
          aciklama:
            "78 yaşındaki vatandaşımız, eşi 2024 yılında vefat etmiş ve çocukları il dışında ikamet ettiğinden tek başına yaşamaktadır. Yaşlılık nedeniyle eklem hareketleri kısıtlanmış, kendi başına evden çıkması ve günlük temel ihtiyaçlarını karşılaması zorlaşmıştır. 2828 sayılı Sosyal Hizmetler Kanunu ve 6360 sayılı Büyükşehir Yasası çerçevesinde 'Evde Bakım Hizmeti' başvurusu yapılmıştır. Süreç: SYDV sosyal çalışmacısı tarafından hane ziyareti yapılacak (yaşam koşulları, ev temizliği, beslenme imkanı, sosyal izolasyon riski değerlendirilecek), Aile Sağlığı Merkezi hekiminden 'engellilik durum raporu' alınacak, ASHB tarafından bakım hizmeti tipinin belirlenmesi (yarım gün/tam gün) yapılacak ve Mütevelli Heyeti gündemine alınacaktır. Komşu ifadelerine göre vatandaş ekonomik anlamda da zor durumdadır; gıda yardımı paketi de eklenecektir. Aile yanına yerleştirme seçeneği değerlendirilmiş, ancak vatandaşın 'evimi bırakmak istemiyorum' beyanı sonucu evde bakım modeli tercih edilmiştir. Evde bakım hizmeti haftada 3 gün, günde 4 saat olacak şekilde planlanmıştır. Hizmet sağlayıcısı belediye-SYDV ortak çalıştığı sosyal kooperatif olacaktır. Süreç gizlilik içinde yürütülmekte olup vatandaşın haysiyetine ve mahremiyetine özen gösterilmektedir. Aylık takip ziyaretleri yapılarak hizmet kalitesi denetlenecektir.",
          etiketler: ["Sosyal Yardım", "Sağlık"],
          yetkililer: ["sydvSosyalCalisan", "asdmAmir"],
          birimler: ["sydv", "asdm"],
          baslangic: gunEkle(-3),
          bitis: gunEkle(5, 17),
          kontrol: [
            {
              ad: "Süreç",
              maddeler: [
                { metin: "İlk kayıt alındı", atanan: "sydvMemur", tamam: true },
                { metin: "Sosyal inceleme randevusu verildi", atanan: "sydvSosyalCalisan", tamam: true },
                { metin: "Hane ziyareti yapıldı", atanan: "sydvSosyalCalisan" },
                { metin: "ASHB değerlendirme raporu", atanan: "asdmAmir" },
                { metin: "Mütevelli heyeti gündemine alınacak", atanan: "sydvMemur" },
              ],
            },
          ],
          yorumlar: [
            { yazan: "sydvSosyalCalisan", icerik: "Komşusunun verdiği bilgilere göre vatandaş ekonomik anlamda zor durumda.", gunFarki: -2 },
            { yazan: "asdmAmir", icerik: "Aile yanına yerleştirme seçeneği de değerlendirilebilir, görüşeceğim.", gunFarki: -1 },
          ],
        },
        {
          key: "sosyal-baş-002",
          baslik: "Başvuru #2026/0422 — Şartlı Eğitim Yardımı eksik evrak",
          aciklama:
            "Şartlı Eğitim Yardımı (ŞEY) başvurusu, ailenin 8. sınıfa devam eden çocuğu için yapılmıştır. ŞEY yönetmeliği gereği başvuru için aile gelir belgesi, çocuğun nüfus cüzdan fotokopisi, okul müdürlüğü onaylı 'düzenli devam belgesi', %80 üzeri devam taahhütnamesi ve aile beyan formu sunulması gerekir. Bu başvuruda; öğrencinin TC kimlik numarası bilgisi eksik girilmiş, devam belgesi eski tarihli, beyan formu imzasız olarak teslim edilmiştir. Eksik evrak nedeniyle başvuru 'beklemede' statüsüne alınmış, veliye otomatik SMS gönderilerek 'evrakların 7 iş günü içinde tamamlanması' talimat verilmiştir. SYDV personeli veliyi telefonla aramış, hangi belgelerin eksik olduğu birebir açıklanmış, gerekirse tarama ile mail ekleme alternatifi sunulmuştur. Veli evraklarını yarın getireceğini ifade etmiştir; tamamlandığında Mütevelli Heyeti gündemine alınacaktır. Onay verilmesi durumunda öğrenciye aylık 250 TL ŞEY tutarı banka hesabına yatırılacaktır. ŞEY yardımları öğrencinin %80 devam zorunluluğu sürdüğü sürece devam eder; düşük olursa otomatik askıya alınır.",
          etiketler: ["Sosyal Yardım", "Eğitim", "Beklemede"],
          yetkililer: ["sydvMemur"],
          bitis: gunEkle(2, 17),
          yorumlar: [
            { yazan: "sydvMemur", icerik: "Veli arandı, evraklar yarın getirilecek.", gunFarki: -1 },
          ],
        },
        {
          key: "sosyal-baş-003",
          baslik: "Başvuru #2026/0423 — Engelli aylığı yeniden değerlendirme",
          aciklama:
            "2022/65 yaş engelli aylığı sahibi vatandaşımız, son sağlık kurulu raporunu Tekman Devlet Hastanesi'nde yenilemiştir; engellilik oranı %72'den %88'e yükselmiş ve raporda 'başkasının yardımı olmadan günlük yaşam aktivitelerini sürdüremez' ibaresi yer almaktadır. Bu değişiklik, 2022 sayılı Kanun ve 5378 sayılı Engelliler Hakkında Kanun kapsamında engelli aylığı tutarını ve hak edişleri etkilemektedir. Yeni raporla birlikte aylık tutar otomatik artacak, ayrıca refakatçi yardımı, evde bakım maaşı ve özel servis hizmetlerinden faydalanma hakları doğacaktır. SYDV sosyal çalışmacısı raporun değerlendirmesini yapmış, gerekli evrakları (sağlık kurulu raporu, kimlik fotokopisi, banka hesap bildirimi, ikametgah belgesi) tamamlamıştır. Hastane bilgileri Sağlık Müdürlüğü ile teyit edilmiş, otantik olduğu doğrulanmıştır. Mütevelli Heyeti gündemine 'engelli aylığı revizyonu' başlığı altında alınacaktır. Onay sonrası ikinci ay başında yeni tutar banka hesabına yatırılacak; refakatçi maaşı için ayrı başvuru süreci başlayacaktır. Vatandaş ailesine süreç hakkında detaylı bilgilendirme yapılmış, mahremiyet kurallarına uygun şekilde takipte kalınacaktır. Bu tip dosyalar İl ASHB Müdürlüğü merkezi sistemine de işlenir.",
          etiketler: ["Sosyal Yardım", "Sağlık"],
          yetkililer: ["sydvMemur"],
          birimler: ["sydv", "hastane"],
          bitis: gunEkle(7, 17),
        },
        {
          key: "sosyal-baş-004",
          baslik: "Başvuru #2026/0424 — Konut tamir yardımı",
          aciklama:
            "Karaağaç köyünde 28.04.2026 tarihinde meydana gelen şiddetli fırtına ve dolu yağışı sonrasında, evi kamilen yıpranma noktasına gelen vatandaşımızın çatısının yarısı uçmuş, taraflardan içeri yağmur sızması sonucu oda eşyaları ciddi hasar görmüştür. Hane 6 kişiliktir (2 yetişkin, 4 küçük çocuk) ve gelir kaynağı sezonluk hayvancılıktır. 7269 sayılı Umumi Hayata Müessir Afetler Dolayısıyla Alınacak Tedbirlerle Yapılacak Yardımlara Dair Kanun ve SYDV Konut Tamir Yardımı Yönetmeliği çerçevesinde acil müdahale planlanmıştır. Süreç adımları: Köy muhtarı tarafından kesfif tutanağı düzenlendi (4 sayfa, fotoğraflarla), kadastro ölçümü ile hasar miktarı kayıt altına alındı, yapı denetim teknik personeli yapısal güvenlik raporu verecek, malzeme maliyet tahmini Belediye Fen İşleri tarafından çıkarılıp Mütevelli Heyetine sunulacaktır. İlk değerlendirmede yaklaşık 75.000 TL tutarında tamirat yapılması, geçici ikamet süresince ailenin köy konağında barındırılması planlanmaktadır. Ailenin küçük çocukları olduğundan acil sağlık taraması da yapılmıştır. Köy halkı dayanışmasıyla yatak, battaniye, kıyafet bağışları toplanmış; SYDV tarafından gıda kolisi temin edilmiştir. Çatı tamiratı tamamlanana kadar Kızılay konteynır barınma hizmeti verilecektir. Tamamlama hedefi 2 hafta içinde olup hava şartlarına bağlıdır.",
          etiketler: ["Sosyal Yardım", "Saha", "Acil"],
          yetkililer: ["sydvSosyalCalisan", "koyMuhtar"],
          birimler: ["sydv", "koyMuhtar"],
          bitis: gunEkle(4, 17),
          kontrol: [
            {
              ad: "Saha çalışması",
              maddeler: [
                { metin: "Köy muhtarı keşif tutanağı", atanan: "koyMuhtar", tamam: true },
                { metin: "Fotoğraflama yapıldı", atanan: "koyMuhtar", tamam: true },
                { metin: "Maliyet tahmini istendi", atanan: "sydvSosyalCalisan" },
                { metin: "Mütevelli heyetine sunum", atanan: "sydvMemur" },
              ],
            },
          ],
          ekler: [
            { ad: "kesif-tutanagi.pdf", mime: "application/pdf", boyut: 124_000, yukleyen: "koyMuhtar" },
            { ad: "hasar-fotograflari.zip", mime: "application/zip", boyut: 2_400_000, yukleyen: "koyMuhtar" },
          ],
        },
      ],
    },
    {
      ad: "Saha İnceleme Programı",
      yetkililer: ["sydvSosyalCalisan"],
      birimler: ["sydv", "asdm"],
      kartlar: [
        {
          key: "sosyal-saha-haftalik",
          baslik: "Haftalık saha planı (5–9 Mayıs)",
          aciklama:
            "SYDV sosyal çalışmacılarımızın 5-9 Mayıs 2026 haftası saha programı; toplam 14 hane ziyaretinden oluşmakta olup günlük yoğunluk farklılık göstermektedir. Pazartesi: Vatan Mahallesi'nde 4 hane (yaşlı bakım takibi, gıda yardımı kontrolü, çocuk eğitim takibi). Salı: Cumhuriyet Mahallesi'nde 3 hane (engelli aylığı yenileme, konut yardımı keşif, sosyal-ekonomik durum tespiti). Çarşamba: Karaağaç köyünde 4 hane (fırtına hasarı sonrası takip), Doğanca köyünde 3 hane (kronik hastalık ilaç yardımı, yaşlı sosyal izolasyon riski). Perşembe: Yolüstü ve Yeniköy köyleri ortak ziyaret. Cuma: Demirkent köyünde tek günlük yoğun program, 2 hane derin inceleme + 1 hane konut yardımı keşif. Mahalle ve köy muhtarlarına haftalık plan WhatsApp grubuyla bildirilmiş, ziyaret saatlerinin esnekleştirilmesi gerektiğinde aramaları rica edilmiştir. Saha ziyaretleri her haneye en az 45 dakika ayrılmakta, hane içindeki tüm bireylerle (özellikle çocuklar ve yaşlılar) bireysel görüşme yapılmaktadır. KVKK kapsamında veri kayıt prosedürlerine uyulmakta; aile rızası alınmadan fotoğraf çekilmemekte, beyaz veriler şifreli sistemde tutulmaktadır. Saha sonrası akşam saat 17:30'a kadar dijital rapor formuna giriş yapılır; eksik bilgiler için ertesi gün takip aranması yapılır. Saha çalışmaları ASHB ile paylaşılan ortak sistemde de raporlanmaktadır.",
          etiketler: ["Saha", "Sosyal Yardım"],
          yetkililer: ["sydvSosyalCalisan"],
          birimler: ["muhtarlik"],
          bitis: gunEkle(4, 17),
          kontrol: [
            {
              ad: "Pazartesi",
              maddeler: [
                { metin: "Vatan Mahallesi 4 hane", atanan: "sydvSosyalCalisan", tamam: true },
              ],
            },
            {
              ad: "Salı",
              maddeler: [
                { metin: "Cumhuriyet Mahallesi 3 hane", atanan: "sydvSosyalCalisan", tamam: true },
              ],
            },
            {
              ad: "Çarşamba",
              maddeler: [
                { metin: "Karaağaç köyü 4 hane", atanan: "sydvSosyalCalisan" },
                { metin: "Doğanca köyü 3 hane", atanan: "sydvSosyalCalisan" },
              ],
            },
          ],
        },
        {
          key: "sosyal-saha-aile-tipi",
          baslik: "Yeni: Risk altındaki aileler için tip dosya formatı",
          aciklama:
            "Risk altındaki aileler (aile içi şiddet, çocuk istismarı şüphesi, kronik bağımlılık, derin yoksulluk, mülteci durumu, mevsimlik tarım işçisi, evsiz vb.) için SYDV ile İlçe Aile ve Sosyal Hizmetler Müdürlüğü arasında ortak kullanılacak tek tip dosya formatı şablonu hazırlanacaktır. Şablonun amacı, iki kurumun aynı vakayı farklı kategorilerde değerlendirip mükerrer iş yapmalarını önlemek ve hızlı vaka transferi sağlamaktır. Şablon kapsamı: aile kompozisyonu (genogram), gelir-gider tablosu, eğitim-istihdam durumu, sağlık öyküsü, alkol/madde kullanım sorgusu, geçmiş şikayet/dosya bağlantıları, sosyal destek ağı tablosu, risk skoru (1-10), önerilen müdahale yolları ve sorumlu kurum eşlemesi. Tasarım çalışmasında ASHB Genel Müdürlüğü'nün 2025 yayınlı 'Vaka Yönetim Standartları'na uygunluk gözetilmektedir. Pilot olarak 5 dosya bu format ile değerlendirilecek, 1 ay sonra revizyon yapılacaktır. Eğitim çalıştayı sosyal çalışmacılar için Halk Eğitim Merkezi salonunda planlanmıştır. Şablon tamamlandıktan sonra İl SYDV ve İl ASHB Müdürlüklerine de örnek olarak iletilecektir.",
          etiketler: ["Sosyal Yardım", "Kurumsal"],
          yetkililer: ["sydvMemur", "asdmAmir"],
          bitis: gunEkle(11, 17),
        },
      ],
    },
    {
      ad: "Mütevelli Heyeti Gündemi",
      yetkililer: ["sydvMemur"],
      birimler: ["sydv", "muftuluk"],
      kartlar: [
        {
          key: "sosyal-mh-gundem",
          baslik: "Mayıs ayı mütevelli heyeti gündemi",
          aciklama:
            "SYDV Tekman Şubesi Mütevelli Heyeti aylık olağan toplantısı 15.05.2026 Cuma saat 10:00'da Sayın Kaymakamımız başkanlığında gerçekleştirilecektir. Heyet üyeleri: Kaymakam (başkan), İlçe Müftüsü (üye), İlçe Mal Müdürü (üye), İlçe Milli Eğitim Müdürü (üye), İlçe Sağlık Müdürü (üye), Belediye Başkanı (üye), Defterdarlık temsilcisi (üye) ve hayır işleri bilinen 2 vatandaş temsilci. Gündemde toplam 12 dosya değerlendirilecektir: 4 kömür yardımı (1 talep, 3 yenileme), 2 ŞEY başvurusu, 1 engelli aylığı revizyonu, 1 konut tamir yardımı (Karaağaç fırtına), 2 sağlık yardımı (kronik hasta ilaç), 1 cenaze yardımı, 1 üniversite öğrenci eğitim yardımı. Her dosya için sosyal inceleme raporu, gerekçe yazısı ve heyetin görüşü için kısa özet hazırlanmaktadır. Toplantı odası rezervasyonu yapılmış, sunum projeksiyonu kontrol edilmiş, ikram için Kaymakamlık personeli hazır tutulmuştur. Sayın Müftümüz iftar sonrası saatlerin uygun olabileceğini ifade etmişti, ancak Sayın Kaymakam saat 10:00'u uygun görmüş ve tüm üyelerin katılımı zorunlu kılınmıştır. Toplantı tutanağı bilgisayar üzerinden eş zamanlı yazılarak heyet üyelerine imzalatılacak, kararlar SOSYAL-NET sistemine kaydedilecektir. Karar verilen yardımlar 5 iş günü içinde başvuru sahiplerinin banka hesaplarına yatırılır veya ayni olarak teslim edilir.",
          etiketler: ["Kaymakamlık", "Sosyal Yardım"],
          yetkililer: ["sydvMemur", "muftu"],
          birimler: ["sydv", "muftuluk"],
          bitis: gunEkle(10, 16),
          kontrol: [
            {
              ad: "Hazırlık",
              maddeler: [
                { metin: "Gündem maddesi listesi", atanan: "sydvMemur", tamam: true },
                { metin: "Üye davet yazıları", atanan: "sydvMemur", tamam: true },
                { metin: "Dosya özetleri çoğaltılacak", atanan: "sydvMemur" },
                { metin: "Toplantı odası rezervasyonu", atanan: "ozelMemur2", tamam: true },
              ],
            },
          ],
          yorumlar: [
            { yazan: "muftu", icerik: "İftar sonrası saatler benim için uygun, gerekirse program değiştirelim.", gunFarki: -2 },
            { yazan: "kaymakam", icerik: "Saat 10:00 uygun. Tüm üyelerin katılımını bekliyorum.", gunFarki: -2 },
          ],
        },
      ],
    },
    {
      ad: "Onaylananlar",
      kartlar: [
        {
          key: "sosyal-on-001",
          baslik: "Yardım #421 onaylandı — Erzak desteği",
          aciklama:
            "Mütevelli Heyeti kararıyla 5 kişilik aileye (2 yetişkin + 3 çocuk) 1 ay süreyle 'haftalık gıda kolisi' onaylanmıştır. Koli içeriği SYDV standart paketi: 5 kg pirinç, 5 kg makarna, 4 kg un, 3 litre ayçiçek yağı, 2 kg şeker, 1 kg tuz, 5 adet salça, çay, deterjan, çocuk için süt tozu. Aileye haftalık olarak adres tesliminde gıda kolisi ulaştırılacak; teslimde imza alınacaktır. SOSYAL-NET sistemine yardım kaydı işlenmiş, dosya kapatılmıştır. Aile bir ay sonra durum değerlendirmesi için yeniden ziyaret edilecektir.",
          etiketler: ["Sosyal Yardım"],
          tamamlandi: true,
        },
        {
          key: "sosyal-on-002",
          baslik: "Yardım #418 onaylandı — Sağlık yardımı",
          aciklama:
            "SGK kapsamında olmayan yenilikçi kanser ilacı reçete edilmiş, ancak ailenin gelir durumu yetersiz olduğu için 6 aylık tedavi maliyetinin SYDV tarafından karşılanması talep edilmişti. Mütevelli Heyeti, Sağlık Müdürlüğü ve hastane onkoloji bölümünün ortak görüşü ile yardım onaylanmıştır. Aylık 8.500 TL tutarındaki ilaç bedeli Kardelen Eczanesi ile yapılan protokol kapsamında doğrudan eczaneye yatırılacaktır. Hastanın aylık tedavi takvimine uyumu, hastane yetkili hekimi tarafından izlenecek; tedaviye uyumsuzluk durumunda yardım askıya alınacaktır. Aile, sürecin başarıyla yürümesi için sosyal çalışmacı tarafından danışmanlık desteği almaktadır. Dosya 6 ay sonra yenileme için tekrar gündeme gelecektir.",
          etiketler: ["Sosyal Yardım", "Sağlık"],
          tamamlandi: true,
        },
        {
          key: "sosyal-on-003",
          baslik: "Yardım #410 reddedildi — Gelir kriteri uygunsuz",
          aciklama:
            "Başvuru sahibinin toplam hane geliri (eş + kendi maaşı + ek gelir) 3294 sayılı Kanun kapsamındaki yardım eşiğinin %38 üzerinde tespit edilmiştir. Bu oran istisnai durum kapsamında değerlendirilemediğinden Mütevelli Heyeti tarafından oy birliğiyle reddedilmiştir. Reddedilme gerekçeleri yazılı olarak hazırlanmış, başvuru sahibine PTT iadeli taahhütlü ile tebliğ edilmiş; aynı zamanda 30 gün içerisinde itiraz hakkı bulunduğu, itirazın yine SYDV Tekman Şubesi'ne yapılması gerektiği bilgisi paylaşılmıştır. Vatandaşın istihdam durumunu güçlendirmesi için İŞKUR yönlendirmesi de yapılmıştır.",
          etiketler: ["Sosyal Yardım"],
          tamamlandi: true,
        },
      ],
    },
  ],
};
