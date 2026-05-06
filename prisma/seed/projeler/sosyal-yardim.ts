// Proje: Sosyal Yardım Süreçleri ve Hane İncelemeleri
// SYDV mütevelli heyeti gündemi, ASHB koordinasyonu, hane saha incelemeleri.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";
import { doc, h2, h3, p, ul, ol, b, i } from "../rt";

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
          aciklamaDokuman: doc(
            h2("Vaka Özeti"),
            p(
              b("78 yaşında"),
              " vatandaşımız, eşinin ",
              b("2024"),
              " yılında vefatından sonra tek başına yaşamaktadır. Çocukları il dışında ikamet ettiğinden günlük destek alamamakta, eklem hareket kısıtlılığı nedeniyle temel ihtiyaçlarını karşılamakta zorlanmaktadır.",
            ),
            h2("Yasal Dayanak"),
            p(
              b("2828 sayılı Sosyal Hizmetler Kanunu"),
              " ve ",
              b("6360 sayılı Büyükşehir Yasası"),
              " çerçevesinde ",
              b("Evde Bakım Hizmeti"),
              " başvurusu açılmıştır.",
            ),
            h2("Süreç Adımları"),
            ol(
              "SYDV sosyal çalışmacısı tarafından hane ziyareti — yaşam koşulları, beslenme imkânı ve sosyal izolasyon riski değerlendirilir.",
              "Aile Sağlığı Merkezi hekiminden engellilik durum raporu alınır.",
              "ASHB tarafından bakım hizmeti tipinin belirlenmesi (yarım gün / tam gün).",
              "Dosyanın Mütevelli Heyeti gündemine alınması.",
            ),
            h3("Tercih Edilen Model"),
            p(
              "Aile yanına yerleştirme değerlendirilmiş; vatandaşın ",
              i("evimi bırakmak istemiyorum"),
              " beyanı üzerine ",
              b("haftada 3 gün, günde 4 saat"),
              " evde bakım modeli tercih edilmiştir. Hizmet sağlayıcı, ",
              b("Belediye-SYDV ortak sosyal kooperatifi"),
              " olacaktır.",
            ),
            h3("Ek Destekler ve Takip"),
            ul(
              "Komşu ifadeleri ışığında ekonomik destek için gıda yardımı paketi eklenmiştir.",
              "Aylık takip ziyaretleriyle hizmet kalitesi denetlenecektir.",
              "Süreç KVKK ve mahremiyet ilkeleri gözetilerek yürütülmektedir.",
            ),
          ),
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
            {
              yazan: "sydvSosyalCalisan",
              icerik:
                "Hane ziyaretini bugün gerçekleştirdim. Vatandaş 78 yaşında, eklem ağrıları nedeniyle pazara çıkamıyor; komşuları gönüllü olarak alışverişine yardım ediyor ama düzensiz. Ekonomik durumu yetersiz, emekli aylığı dışında geliri yok. @<asdmAmir> evde bakım hizmeti uygun mu?",
              gunFarki: -3,
              saat: 16,
            },
            {
              yazan: "asdmAmir",
              icerik:
                "Evde bakım hizmeti uygun. Aile yanına yerleştirme seçeneğini de görüştüm; çocukları İstanbul'da, vatandaş 'evimi bırakmak istemiyorum' dedi — saygı duyuyoruz. Haftada 3 gün 4 saat olacak şekilde planlayalım, hizmet sağlayıcı SYDV-Belediye ortak kooperatifi.",
              gunFarki: -2,
              saat: 10,
              yanit: 0,
            },
            {
              yazan: "sydvSosyalCalisan",
              icerik:
                "Mütevelli heyetine bu hafta sunuyorum. Aşı takvimi ve sağlık raporu için @<asmDoktor>'dan randevu istedim, salı saat 11'de evde ziyaret yapacaklar.",
              gunFarki: -1,
              saat: 13,
              yanit: 1,
            },
            {
              yazan: "asmDoktor",
              icerik:
                "Salı 11:00 ev ziyareti programıma alındı. Yaşlılık dönemi rutin tetkikler + grip aşısı + B12 düzeyi bakacağım. Sonuçları sosyal inceleme raporu ekine koyarım.",
              gunFarki: -1,
              saat: 17,
              yanit: 2,
              duzenlendi: true,
            },
          ],
        },
        {
          key: "sosyal-baş-002",
          baslik: "Başvuru #2026/0422 — Şartlı Eğitim Yardımı eksik evrak",
          aciklama:
            "Şartlı Eğitim Yardımı (ŞEY) başvurusu, ailenin 8. sınıfa devam eden çocuğu için yapılmıştır. ŞEY yönetmeliği gereği başvuru için aile gelir belgesi, çocuğun nüfus cüzdan fotokopisi, okul müdürlüğü onaylı 'düzenli devam belgesi', %80 üzeri devam taahhütnamesi ve aile beyan formu sunulması gerekir. Bu başvuruda; öğrencinin TC kimlik numarası bilgisi eksik girilmiş, devam belgesi eski tarihli, beyan formu imzasız olarak teslim edilmiştir. Eksik evrak nedeniyle başvuru 'beklemede' statüsüne alınmış, veliye otomatik SMS gönderilerek 'evrakların 7 iş günü içinde tamamlanması' talimat verilmiştir. SYDV personeli veliyi telefonla aramış, hangi belgelerin eksik olduğu birebir açıklanmış, gerekirse tarama ile mail ekleme alternatifi sunulmuştur. Veli evraklarını yarın getireceğini ifade etmiştir; tamamlandığında Mütevelli Heyeti gündemine alınacaktır. Onay verilmesi durumunda öğrenciye aylık 250 TL ŞEY tutarı banka hesabına yatırılacaktır. ŞEY yardımları öğrencinin %80 devam zorunluluğu sürdüğü sürece devam eder; düşük olursa otomatik askıya alınır.",
          aciklamaDokuman: doc(
            h2("Başvuru Bilgisi"),
            p(
              b("Şartlı Eğitim Yardımı (ŞEY)"),
              " başvurusu, ailenin ",
              b("8. sınıfa"),
              " devam eden çocuğu için yapılmıştır. Başvuru ",
              b("beklemede"),
              " statüsüne alınmıştır.",
            ),
            h2("Eksik Evraklar"),
            ul(
              "Öğrencinin TC kimlik numarası bilgisi eksik girilmiş.",
              "Düzenli devam belgesi eski tarihli.",
              "Aile beyan formu imzasız teslim edilmiş.",
            ),
            h3("Yönetmelik Gereği Aranan Belgeler"),
            ul(
              "Aile gelir belgesi",
              "Çocuğun nüfus cüzdan fotokopisi",
              "Okul müdürlüğü onaylı düzenli devam belgesi",
              "%80 üzeri devam taahhütnamesi",
              "Aile beyan formu",
            ),
            h2("Yapılan İşlemler"),
            ol(
              "Veliye otomatik SMS — evrakların 7 iş günü içinde tamamlanması.",
              "SYDV personelinin veliyi araması, eksiklerin birebir açıklanması.",
              "Tarama ile mail ekleme alternatifinin sunulması.",
            ),
            p(
              i("Veli evraklarını yarın getireceğini ifade etmiştir"),
              "; tamamlandığında dosya Mütevelli Heyeti gündemine alınacaktır.",
            ),
            h3("Onay Sonrası"),
            p(
              "Onay durumunda öğrenciye ",
              b("aylık 250 TL"),
              " ŞEY tutarı banka hesabına yatırılır. ",
              b("%80 devam"),
              " zorunluluğu sürdüğü sürece devam eder; düşük olursa otomatik askıya alınır.",
            ),
          ),
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
          aciklamaDokuman: doc(
            h2("Vaka Özeti"),
            p(
              b("2022/65 yaş engelli aylığı"),
              " sahibi vatandaşımız, son sağlık kurulu raporunu ",
              b("Tekman Devlet Hastanesi"),
              "'nde yenilemiştir. Engellilik oranı ",
              b("%72'den %88'e"),
              " yükselmiş; raporda ",
              i("başkasının yardımı olmadan günlük yaşam aktivitelerini sürdüremez"),
              " ibaresi yer almaktadır.",
            ),
            h2("Yasal Dayanak"),
            p(
              b("2022 sayılı Kanun"),
              " ve ",
              b("5378 sayılı Engelliler Hakkında Kanun"),
              " kapsamında aylık tutar ve hak edişler revize edilecektir.",
            ),
            h3("Doğacak Yeni Haklar"),
            ul(
              "Aylık tutarın otomatik artışı",
              "Refakatçi yardımı",
              "Evde bakım maaşı",
              "Özel servis hizmetlerinden faydalanma",
            ),
            h2("Tamamlanan Evraklar"),
            ul(
              "Sağlık kurulu raporu",
              "Kimlik fotokopisi",
              "Banka hesap bildirimi",
              "İkametgah belgesi",
            ),
            p(
              "Hastane bilgileri Sağlık Müdürlüğü ile teyit edilmiş, ",
              b("otantik olduğu"),
              " doğrulanmıştır.",
            ),
            h3("Süreç Sonrası"),
            p(
              "Mütevelli Heyeti gündemine ",
              b("engelli aylığı revizyonu"),
              " başlığı altında alınacaktır. Onay sonrası ikinci ay başında yeni tutar banka hesabına yatırılır; refakatçi maaşı için ayrı başvuru başlatılır. Dosya ",
              b("İl ASHB Müdürlüğü"),
              " merkezi sistemine de işlenir.",
            ),
          ),
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
          aciklamaDokuman: doc(
            h2("Olay & Hasar Tespiti"),
            p(
              b("28.04.2026"),
              " tarihinde ",
              b("Karaağaç köyünde"),
              " meydana gelen şiddetli fırtına ve dolu yağışı sonrası vatandaşımızın çatısının yarısı uçmuş, içeri sızan yağmur oda eşyalarına ciddi hasar vermiştir. Hane ",
              b("6 kişilik"),
              " (2 yetişkin, 4 küçük çocuk); gelir kaynağı ",
              i("sezonluk hayvancılık"),
              ".",
            ),
            h2("Yasal Dayanak"),
            p(
              b("7269 sayılı Umumi Hayata Müessir Afetler Kanunu"),
              " ve ",
              b("SYDV Konut Tamir Yardımı Yönetmeliği"),
              " çerçevesinde acil müdahale planlanmıştır.",
            ),
            h2("Saha Adımları"),
            ol(
              "Köy muhtarı tarafından 4 sayfa fotoğraflı keşif tutanağı düzenlendi.",
              "Kadastro ölçümü ile hasar miktarı kayıt altına alındı.",
              "Yapı denetim teknik personeli yapısal güvenlik raporu verecek.",
              "Belediye Fen İşleri malzeme maliyet tahminini Mütevelli Heyetine sunacak.",
            ),
            h3("İlk Plan"),
            ul(
              b("Yaklaşık 75.000 TL"),
              "Geçici ikamet için ailenin köy konağında barındırılması",
              "Çatı tamamlanana kadar Kızılay konteynır barınma hizmeti",
              "Küçük çocuklara acil sağlık taraması",
            ),
            h3("Toplum Dayanışması"),
            p(
              i("Köy halkı dayanışmasıyla"),
              " yatak, battaniye ve kıyafet bağışları toplanmış; SYDV tarafından gıda kolisi temin edilmiştir. Tamamlama hedefi ",
              b("2 hafta"),
              " olup hava şartlarına bağlıdır.",
            ),
          ),
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
          aciklamaDokuman: doc(
            h2("Haftalık Hedef"),
            p(
              b("5–9 Mayıs 2026"),
              " haftası boyunca toplam ",
              b("14 hane"),
              " ziyareti planlanmıştır. Günlük yoğunluk farklılık göstermektedir.",
            ),
            h2("Günlük Program"),
            ol(
              "Pazartesi — Vatan Mahallesi 4 hane (yaşlı bakım, gıda yardımı, çocuk eğitim)",
              "Salı — Cumhuriyet Mahallesi 3 hane (engelli aylığı, konut keşif, sosyo-ekonomik tespit)",
              "Çarşamba — Karaağaç köyü 4 hane (fırtına takibi) + Doğanca köyü 3 hane (ilaç yardımı, izolasyon riski)",
              "Perşembe — Yolüstü ve Yeniköy köyleri ortak ziyaret",
              "Cuma — Demirkent köyü 2 hane derin inceleme + 1 hane konut keşif",
            ),
            h3("Saha Standartları"),
            ul(
              "Her haneye en az 45 dakika ayrılır.",
              "Çocuk ve yaşlılarla bireysel görüşme yapılır.",
              "Muhtarlara WhatsApp grubuyla program bildirilir; saat esnetilmesinde aranır.",
            ),
            h3("KVKK & Raporlama"),
            p(
              i("Aile rızası"),
              " alınmadan fotoğraf çekilmez, hassas veriler şifreli sistemde tutulur. Saha sonrası ",
              b("17:30'a kadar"),
              " dijital rapor formuna giriş yapılır; çalışmalar ",
              b("ASHB"),
              " ile paylaşılan ortak sistemde raporlanır.",
            ),
          ),
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
          aciklamaDokuman: doc(
            h2("Amaç"),
            p(
              "SYDV ile ",
              b("İlçe Aile ve Sosyal Hizmetler Müdürlüğü"),
              " arasında ortak kullanılacak tek tip dosya formatı; ",
              i("mükerrer iş"),
              "i önler ve hızlı vaka transferi sağlar.",
            ),
            h3("Hedef Vaka Tipleri"),
            ul(
              "Aile içi şiddet, çocuk istismarı şüphesi",
              "Kronik bağımlılık ve derin yoksulluk",
              "Mülteci, mevsimlik tarım işçisi, evsiz",
            ),
            h2("Şablon Kapsamı"),
            ul(
              "Aile kompozisyonu (genogram)",
              "Gelir-gider tablosu, eğitim-istihdam durumu",
              "Sağlık öyküsü, alkol/madde kullanım sorgusu",
              "Geçmiş şikâyet/dosya bağlantıları, sosyal destek ağı",
              b("Risk skoru 1–10"),
              "Önerilen müdahale yolları ve sorumlu kurum eşlemesi",
            ),
            h3("Standart & Pilot"),
            p(
              b("ASHB Genel Müdürlüğü"),
              "'nün 2025 yayınlı ",
              i("Vaka Yönetim Standartları"),
              "'na uyum gözetilmektedir. Pilot olarak ",
              b("5 dosya"),
              " bu format ile değerlendirilecek, 1 ay sonra revizyon yapılacaktır. Sosyal çalışmacılar için ",
              b("Halk Eğitim Merkezi"),
              " salonunda eğitim çalıştayı planlanmıştır.",
            ),
          ),
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
          aciklamaDokuman: doc(
            h2("Toplantı"),
            p(
              b("SYDV Tekman Şubesi Mütevelli Heyeti"),
              " aylık olağan toplantısı ",
              b("15.05.2026 Cuma saat 10:00"),
              "'da Sayın Kaymakamımız başkanlığında yapılacaktır.",
            ),
            h3("Heyet Üyeleri"),
            ul(
              "Kaymakam (başkan)",
              "İlçe Müftüsü, İlçe Mal Müdürü, İlçe Milli Eğitim Müdürü",
              "İlçe Sağlık Müdürü, Belediye Başkanı, Defterdarlık temsilcisi",
              "Hayır işleri bilinen 2 vatandaş temsilci",
            ),
            h2("Gündem — 12 Dosya"),
            ol(
              "4 kömür yardımı (1 talep, 3 yenileme)",
              "2 ŞEY başvurusu",
              "1 engelli aylığı revizyonu",
              "1 konut tamir yardımı (Karaağaç fırtına)",
              "2 sağlık yardımı (kronik hasta ilaç)",
              "1 cenaze yardımı, 1 üniversite öğrenci eğitim yardımı",
            ),
            h3("Hazırlık"),
            p(
              "Her dosya için sosyal inceleme raporu, gerekçe yazısı ve heyet görüşü için kısa özet hazırlanmaktadır. Toplantı odası rezervasyonu yapılmış, projeksiyon kontrol edilmiş, ikram hazır tutulmuştur.",
            ),
            p(
              i("Sayın Müftümüz iftar sonrası saatlerin uygun olabileceğini"),
              " ifade etmişti; ancak ",
              b("Sayın Kaymakam saat 10:00'u uygun görmüş"),
              " ve tüm üyelerin katılımı zorunlu kılınmıştır.",
            ),
            h3("Karar Sonrası"),
            p(
              "Tutanak eş zamanlı yazılarak imzalatılır; kararlar ",
              b("SOSYAL-NET"),
              " sistemine işlenir. Onaylanan yardımlar ",
              b("5 iş günü"),
              " içinde banka hesabına yatar veya ayni teslim edilir.",
            ),
          ),
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
          aciklamaDokuman: doc(
            h2("Karar"),
            p(
              b("Mütevelli Heyeti"),
              " kararıyla ",
              b("5 kişilik aileye"),
              " (2 yetişkin + 3 çocuk) ",
              b("1 ay süreyle haftalık gıda kolisi"),
              " onaylanmıştır.",
            ),
            h3("Koli İçeriği — SYDV Standart Paketi"),
            ul(
              "5 kg pirinç, 5 kg makarna, 4 kg un",
              "3 litre ayçiçek yağı, 2 kg şeker, 1 kg tuz",
              "5 adet salça, çay, deterjan",
              "Çocuk için süt tozu",
            ),
            h3("Teslim & Takip"),
            p(
              "Koliler ",
              i("haftalık olarak adres teslimi"),
              " yapıldı; tesliminde imza alındı. ",
              b("SOSYAL-NET"),
              " sistemine yardım kaydı işlenip dosya kapatıldı. Bir ay sonra durum değerlendirmesi için yeniden ziyaret planlandı.",
            ),
          ),
          etiketler: ["Sosyal Yardım"],
          tamamlandi: true,
        },
        {
          key: "sosyal-on-002",
          baslik: "Yardım #418 onaylandı — Sağlık yardımı",
          aciklama:
            "SGK kapsamında olmayan yenilikçi kanser ilacı reçete edilmiş, ancak ailenin gelir durumu yetersiz olduğu için 6 aylık tedavi maliyetinin SYDV tarafından karşılanması talep edilmişti. Mütevelli Heyeti, Sağlık Müdürlüğü ve hastane onkoloji bölümünün ortak görüşü ile yardım onaylanmıştır. Aylık 8.500 TL tutarındaki ilaç bedeli Kardelen Eczanesi ile yapılan protokol kapsamında doğrudan eczaneye yatırılacaktır. Hastanın aylık tedavi takvimine uyumu, hastane yetkili hekimi tarafından izlenecek; tedaviye uyumsuzluk durumunda yardım askıya alınacaktır. Aile, sürecin başarıyla yürümesi için sosyal çalışmacı tarafından danışmanlık desteği almaktadır. Dosya 6 ay sonra yenileme için tekrar gündeme gelecektir.",
          aciklamaDokuman: doc(
            h2("Karar"),
            p(
              b("SGK kapsamında olmayan"),
              " yenilikçi kanser ilacı için ailenin gelir durumu yetersiz olduğundan ",
              b("6 aylık tedavi maliyetinin"),
              " SYDV tarafından karşılanması ",
              b("Mütevelli Heyeti"),
              " kararıyla onaylandı.",
            ),
            h3("Ortak Görüş"),
            p(
              "Karar; ",
              b("Sağlık Müdürlüğü"),
              " ve hastane onkoloji bölümünün ortak görüşüyle alınmıştır.",
            ),
            h2("Ödeme & Takip"),
            ul(
              "Aylık 8.500 TL ilaç bedeli, Kardelen Eczanesi protokolü ile doğrudan eczaneye yatırıldı.",
              "Hastanın tedavi uyumu hastane yetkili hekimi tarafından izlenir.",
              "Uyumsuzluk halinde yardım askıya alınır.",
            ),
            p(
              i("Aileye sosyal çalışmacı danışmanlık desteği"),
              " sağlanmaktadır. Dosya ",
              b("6 ay sonra yenileme"),
              " için tekrar gündeme gelecektir.",
            ),
          ),
          etiketler: ["Sosyal Yardım", "Sağlık"],
          tamamlandi: true,
        },
        {
          key: "sosyal-on-003",
          baslik: "Yardım #410 reddedildi — Gelir kriteri uygunsuz",
          aciklama:
            "Başvuru sahibinin toplam hane geliri (eş + kendi maaşı + ek gelir) 3294 sayılı Kanun kapsamındaki yardım eşiğinin %38 üzerinde tespit edilmiştir. Bu oran istisnai durum kapsamında değerlendirilemediğinden Mütevelli Heyeti tarafından oy birliğiyle reddedilmiştir. Reddedilme gerekçeleri yazılı olarak hazırlanmış, başvuru sahibine PTT iadeli taahhütlü ile tebliğ edilmiş; aynı zamanda 30 gün içerisinde itiraz hakkı bulunduğu, itirazın yine SYDV Tekman Şubesi'ne yapılması gerektiği bilgisi paylaşılmıştır. Vatandaşın istihdam durumunu güçlendirmesi için İŞKUR yönlendirmesi de yapılmıştır.",
          aciklamaDokuman: doc(
            h2("Karar"),
            p(
              "Başvuru sahibinin toplam hane geliri (eş + kendi maaşı + ek gelir) ",
              b("3294 sayılı Kanun"),
              " kapsamındaki yardım eşiğinin ",
              b("%38 üzerinde"),
              " tespit edildi. İstisnai durum kapsamına girmediğinden ",
              b("Mütevelli Heyeti"),
              " tarafından ",
              i("oy birliğiyle"),
              " reddedildi.",
            ),
            h3("Tebliğ"),
            p(
              "Gerekçeler yazılı hazırlandı, başvuru sahibine ",
              b("PTT iadeli taahhütlü"),
              " ile tebliğ edildi. ",
              b("30 gün içinde"),
              " itiraz hakkı bulunduğu, itirazın yine SYDV Tekman Şubesi'ne yapılması gerektiği bildirildi.",
            ),
            h3("Yönlendirme"),
            ul("İstihdam durumunu güçlendirmek için İŞKUR yönlendirmesi yapıldı."),
          ),
          etiketler: ["Sosyal Yardım"],
          tamamlandi: true,
        },
      ],
    },
  ],
};
