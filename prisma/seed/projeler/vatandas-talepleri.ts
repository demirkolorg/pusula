// Proje: Vatandaş Talepleri ve Kurum Yazışmaları
// Açık kapı, CIMER, BIMER, dilekçe ve kurum görüş yazıları takibi.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";
import { doc, h2, h3, p, ul, ol, b, i } from "../rt";

export const vatandasTalepleriProjesi: ProjeSeed = {
  key: "evrak",
  ad: "Vatandaş Talepleri ve Kurum Yazışmaları",
  aciklama:
    "Kaymakamlık makamına gelen taleplerin (CIMER, dilekçe, açık kapı) kurumlar arası yazışma ve cevap takibi. Tüm dosyalar 30 gün içinde sonuçlanacak.",
  olusturan: "yaziAmir",
  yetkililer: ["kaymakam", "yaziAmir", "yaziMemur", "yaziIsleriMudur"],
  birimler: ["yaziIsleri", "ozelKalem", "mal", "nufus", "belediye", "tapuKadastro", "sydv", "tarim"],
  kapakRenk: "kahve",
  kapakIkon: "file-text",
  yildizli: true,
  listeler: [
    {
      ad: "Gelen Evrak",
      yetkililer: ["evrakKayit"],
      birimler: ["yaziIsleri"],
      kartlar: [
        {
          key: "evrak-yardim-talebi",
          baslik: "Isınma yardımı başvurusu — kurum görüşleri",
          aciklama:
            "Vatandaş, 24.04.2026 tarih ve EBYS-2026/1421 sayılı dilekçesiyle 5 nüfuslu hanesi için kış sezonu kömür yardımı talep etmiştir. Başvuru, 3294 sayılı Sosyal Yardımlaşma ve Dayanışmayı Teşvik Kanunu çerçevesinde değerlendirilmektedir. Sürecin işleyişi: önce Sosyal Yardımlaşma ve Dayanışma Vakfı (SYDV) Tekman Şubesi sosyo-ekonomik inceleme yapacak, sonra İlçe Mal Müdürlüğü stok teyidi (kömür dağıtım envanteri) verecek, son aşamada Kaymakamlık makam olur'u alınarak dağıtım planına eklenecektir. SYDV inceleme raporunda hane gelir tutarı, çocuk sayısı, kronik hasta varlığı, ısınma sistemi tipi, ev sahibi/kiracı durumu ve mevcut yakacak miktarı sorgulanır. Bu başvuruda saha incelemesi 02.05.2026'da gerçekleştirilmiş, hane skoru uygun bulunmuş; haneye 2 ton kömür + 200 kg odun tahsisi önerilmiştir. Mal Müdürlüğü stoğunda yeterli kömür mevcut olup, sezon sonuna kadar 18 hane daha karşılanabilecek envanter raporlanmıştır. Onay sonrası kömür Belediye Fen İşleri tarafından eve teslim edilecek; teslim tutanağı imzalı olarak SYDV dosyasına eklenecektir. Vatandaşın benzer başvurusu 2024 ve 2025 yıllarında da onaylanmıştı; bu yıl Ramazan dönemi sonrası yapıldığı için iyileştirme programı tablosunda öncelik verilmiştir.",
          aciklamaDokuman: doc(
            h2("Yasal Dayanak"),
            p(
              "Başvuru ", b("3294 sayılı Sosyal Yardımlaşma ve Dayanışmayı Teşvik Kanunu"),
              " çerçevesinde değerlendirilmektedir. Dilekçe ", b("24.04.2026 tarih ve EBYS-2026/1421"),
              " sayı ile kayda alınmıştır.",
            ),
            h2("Süreç"),
            ol(
              "SYDV Tekman Şubesi sosyo-ekonomik inceleme",
              "İlçe Mal Müdürlüğü stok teyidi (kömür envanteri)",
              "Kaymakamlık makam olur'u ve dağıtım planına ekleme",
            ),
            p(
              "İnceleme kriterleri: ", b("hane geliri"), ", çocuk sayısı, kronik hasta varlığı, ısınma sistemi tipi, ev sahibi/kiracı durumu ve mevcut yakacak miktarı.",
            ),
            h2("Saha Tespiti"),
            p(
              "Saha incelemesi ", b("02.05.2026"), " tarihinde tamamlandı; hane skoru uygun bulundu. Tahsis önerisi: ",
              b("2 ton kömür + 200 kg odun"), ".",
            ),
            ul(
              "Mal Müdürlüğü stoğu yeterli — sezon sonuna kadar 18 hane daha karşılanabilir.",
              "Teslimat Belediye Fen İşleri tarafından eve yapılacak, imzalı tutanak SYDV dosyasına eklenecek.",
            ),
            h3("Tarihçe"),
            p(
              i("Vatandaşın 2024 ve 2025 başvuruları da onaylanmıştı"),
              "; bu yıl Ramazan sonrası başvuru yapıldığı için iyileştirme programı tablosunda önceliklendirilmiştir.",
            ),
          ),
          etiketler: ["Yazışma", "Sosyal Yardım", "Beklemede"],
          yetkililer: ["malAmir", "sydvMemur"],
          birimler: ["sydv", "mal"],
          bitis: gunEkle(4, 16),
          kontrol: [
            {
              ad: "İnceleme",
              maddeler: [
                { metin: "SYDV inceleme raporu", atanan: "sydvMemur", tamam: true },
                { metin: "Mal müdürlüğü stok kontrolü", atanan: "malAmir" },
                { metin: "Kaymakamlık olur'una sun", atanan: "yaziMemur" },
              ],
            },
          ],
          yorumlar: [
            { yazan: "sydvMemur", icerik: "Saha inceleme tamamlandı, hane skoru uygun.", gunFarki: -2 },
          ],
          ekler: [
            { ad: "dilekce-tarama.pdf", mime: "application/pdf", boyut: 76_000, yukleyen: "evrakKayit" },
          ],
        },
        {
          key: "evrak-yol-talebi",
          baslik: "Mahalle içi yol bakım talebine cevap yazısı",
          aciklama:
            "Vatan Mahallesi Muhtarlığı tarafından 21.04.2026 tarih ve 47 sayılı dilekçeyle, mahalle sınırları içerisindeki 3 ayrı sokakta (Çınar Sokak, Sevgi Sokak, Tunç Caddesi yan kısmı) asfalt zeminin bozulduğu, çukurların oluştuğu ve yağış sonrası su birikimine sebep olduğu bildirilerek bakım/yama yapılması talep edilmiştir. Talep edilen güzergahlar Cumhuriyet İlkokulu öğrenci servis hattı üzerinde yer aldığından, çocuk güvenliği açısından önceliklendirilmiştir. Belediye Fen İşleri ekibinin saha keşfi 02.05.2026 tarihinde yapılmış; toplam 142 metre alanda yaklaşık 18 ton asfalt malzemesine ihtiyaç duyulduğu raporlanmıştır. Belediye keşif notu Yazı İşleri Müdürlüğü'ne ulaştığında, vatandaşa verilecek cevap yazısı taslağı hazırlanacak; cevapta keşif sonucu, planlanan müdahale tarihi ve sorumlu birim belirtilecektir. Yağışlı dönem geçtikten sonra bakım Mayıs ayı sonu - Haziran başı arasında tamamlanması öngörülmektedir. Geçen yıl benzer 7 talep gelmiş, 5'i tamamlanmıştır. Muhtarlığa ayrıca telefonla bilgi verilmiş; muhtar Hüseyin Bal süreçten memnuniyetini bildirmiştir. Yazı, Sayın Kaymakamımızın imzasıyla muhtarlığa tebliğ edilecek, bir nüshası ilgili ŞikayetTakip dosyasında saklanacaktır.",
          aciklamaDokuman: doc(
            h2("Talep"),
            p(
              b("Vatan Mahallesi Muhtarlığı"), ", ", b("21.04.2026 tarih ve 47 sayılı"),
              " dilekçeyle 3 sokakta (Çınar Sokak, Sevgi Sokak, Tunç Caddesi yan kısmı) asfalt bozukluğu ve çukurların yağış sonrası su biriktirdiğini bildirmiş; bakım/yama talep etmiştir.",
            ),
            p(
              "Güzergahlar ", b("Cumhuriyet İlkokulu öğrenci servis hattı"),
              " üzerinde olduğundan ", i("çocuk güvenliği"), " açısından önceliklendirilmiştir.",
            ),
            h2("Saha Keşfi"),
            p(
              "Belediye Fen İşleri ekibinin keşfi ", b("02.05.2026"),
              " tarihinde yapıldı. Toplam ", b("142 metre"), " alanda yaklaşık ",
              b("18 ton asfalt malzemesi"), " ihtiyacı raporlandı.",
            ),
            h2("Cevap Süreci"),
            ol(
              "Belediye keşif notu Yazı İşleri'ne ulaştığında cevap yazısı taslağı hazırlanır",
              "Cevapta keşif sonucu, planlanan müdahale tarihi ve sorumlu birim yer alır",
              "Sayın Kaymakamımızın imzasıyla muhtarlığa tebliğ, bir nüsha ŞikayetTakip dosyasında saklanır",
            ),
            p(
              "Bakım, yağışlı dönem sonrası ", b("Mayıs sonu - Haziran başı"),
              " arasında tamamlanacaktır. ", i("Geçen yıl benzer 7 talepten 5'i sonuçlandırılmıştı"), ".",
            ),
          ),
          etiketler: ["Yazışma", "Saha"],
          yetkililer: ["belediyeAmir", "yaziMemur2"],
          birimler: ["belediye", "muhtarlik"],
          bitis: gunEkle(8, 16),
          kontrol: [
            {
              ad: "Adımlar",
              maddeler: [
                { metin: "Muhtarlık dilekçesi tarandı", atanan: "evrakKayit", tamam: true },
                { metin: "Belediye keşif notu istendi", atanan: "yaziMemur2", tamam: true },
                { metin: "Cevap yazısı taslağı hazırlanacak", atanan: "yaziMemur2" },
              ],
            },
          ],
          yorumlar: [
            { yazan: "muhtar", icerik: "Hızlandırılırsa öğrenci servisleri için faydalı olur, teşekkürler.", gunFarki: -3 },
            { yazan: "belediyeAmir", icerik: "Keşif salı günü çıkıyor, ham veri bu hafta içinde elinizde.", gunFarki: -2 },
          ],
        },
        {
          key: "evrak-cimer-mera",
          baslik: "CIMER #2026/3491 — Mera tahsis itirazı",
          aciklama:
            "Cumhurbaşkanlığı İletişim Merkezi (CIMER) üzerinden 2026/3491 numarayla iletilen başvuruda, Doğanca köyü Karaçay mevkii mera alanlarının köy tüzel kişiliğine tahsis edildiği, ancak başvuru sahibinin atalarına ait şahsi mülkiyetin de bu sınırlara dahil edildiği iddiasıyla itiraz dilekçesi alınmıştır. 4342 sayılı Mera Kanunu'nun 13. maddesi gereği itirazlar İlçe Mera Komisyonu tarafından incelenir; komisyon İlçe Tarım ve Orman Müdürü başkanlığında, ziraat odası temsilcisi, köy muhtarı, ziraat mühendisi ve hukuk müşaviri katılımıyla toplanır. Dosya İlçe Tarım Müdürlüğü'ne sevk edilmiş, tarım envanter kayıtları ve tapu kayıtları karşılaştırmalı olarak değerlendirilmektedir. İtiraz değerlendirme süresi 30 gündür; süreç sonunda ya itiraz reddedilir (gerekçe ile başvuru sahibine tebliğ) ya da kabul edilirse mera sınırları yeniden çizdirilir. Geçen yıl Yolüstü mevkiinde benzer bir itiraz reddedilmiş, başvuru sahibi idari yargı yoluna gitmiş; halen davası devam etmektedir. Tarafların hak kaybı yaşanmaması için tüm görüşmeler tutanak altına alınmaktadır. Dosyanın bilirkişi incelemesi gerekirse mahkeme süreciyle paralel ilerletilecektir.",
          aciklamaDokuman: doc(
            h2("Başvuru"),
            p(
              "CIMER ", b("2026/3491"), " sayılı başvuruda, ", b("Doğanca köyü Karaçay mevkii"),
              " mera alanlarının köy tüzel kişiliğine tahsisinde başvuru sahibinin atalarına ait ", i("şahsi mülkiyetin"),
              " sınırlara dahil edildiği iddia edilmektedir.",
            ),
            h2("Yasal Çerçeve"),
            p(
              b("4342 sayılı Mera Kanunu'nun 13. maddesi"), " gereği itirazlar ",
              b("İlçe Mera Komisyonu"), " tarafından incelenir.",
            ),
            h3("Komisyon Üyeleri"),
            ul(
              "İlçe Tarım ve Orman Müdürü (başkan)",
              "Ziraat Odası temsilcisi",
              "Köy muhtarı",
              "Ziraat mühendisi",
              "Hukuk müşaviri",
            ),
            h2("Değerlendirme"),
            p(
              "Dosya İlçe Tarım Müdürlüğü'ne sevk edildi; tarım envanter kayıtları ve tapu kayıtları ",
              b("karşılaştırmalı"), " incelenmektedir. Değerlendirme süresi ", b("30 gün"), ".",
            ),
            ul(
              "İtiraz reddi → gerekçeli olarak başvurana tebliğ",
              "İtiraz kabulü → mera sınırları yeniden çizdirilir",
            ),
            p(
              i("Geçen yıl Yolüstü mevkiinde benzer bir itiraz reddedilmiş, başvuru sahibi idari yargıya gitmiş; davası halen sürüyor"),
              ". Tüm görüşmeler tutanak altına alınmakta, gerekirse bilirkişi incelemesi mahkeme süreciyle paralel yürütülecektir.",
            ),
          ),
          etiketler: ["Yazışma", "Saha"],
          yetkililer: ["tarimAmir", "yaziMemur"],
          birimler: ["tarim"],
          bitis: gunEkle(12, 17),
          kontrol: [
            {
              ad: "Süreç",
              maddeler: [
                { metin: "Dosya tarım müdürlüğüne sevk", atanan: "yaziMemur", tamam: true },
                { metin: "Mera Komisyonu gündemine alındı", atanan: "tarimAmir" },
                { metin: "İtiraz değerlendirme tutanağı", atanan: "tarimAmir" },
              ],
            },
          ],
        },
        {
          key: "evrak-isim-tashih",
          baslik: "İsim tashihi başvurusu — adli makamlara intikal",
          aciklama:
            "1958 doğumlu vatandaş, nüfus kayıtlarında ad/soyadında 'Memmet' olarak yazılan ismin aslında 'Mehmet' olduğunu, bu hatanın çocukluk döneminde yapılan kayıt sırasında yapıldığını belgelerle birlikte dilekçe ekinde sunmuştur. 5490 sayılı Nüfus Hizmetleri Kanunu'nun 35. maddesi gereği, ad/soyad değişikliği ancak Asliye Hukuk Mahkemesi kararıyla mümkündür. İlçe Nüfus Müdürlüğü, başvuru sahibine bu konuyu yazılı olarak bildirecek, mahkemeye nasıl başvurabileceği hususunda yönlendirme yapacaktır. Dilekçe örneği, gerekli belgeler (kimlik fotokopisi, eski okul belgesi, askerlik belgesi vb.), dava açma rehberi ve adli yardım için Cumhuriyet Başsavcılığı UYAP başvuru bilgisi vatandaşa A4 broşür halinde verilecektir. 80 yaş üstü vatandaşlar için Tekman Adliyesi'nde gönüllü hukuk öğrencileri tarafından 'evde dilekçe yazma' desteği sağlanmaktadır; bu hizmet de yönlendirme paketinde yer alacaktır. Süreçte vatandaşın takipte kalması, gerekirse aile yakınlarının da bilgilendirilmesi için iletişim bilgisi alınmıştır. Hizmet, 30 gün içinde tamamlanması beklenen dosya kategorisindedir; dosya kapanışında vatandaşa SMS ile bilgi verilecektir.",
          aciklamaDokuman: doc(
            h2("Başvuru"),
            p(
              b("1958 doğumlu vatandaş"), ", nüfus kaydındaki ", b("'Memmet'"), " isminin aslında ",
              b("'Mehmet'"), " olduğunu, hatanın çocukluk döneminde kayıt sırasında yapıldığını belgelerle dilekçesine eklemiştir.",
            ),
            h2("Yasal Çerçeve"),
            p(
              b("5490 sayılı Nüfus Hizmetleri Kanunu'nun 35. maddesi"),
              " gereği ad/soyad değişikliği ancak ", b("Asliye Hukuk Mahkemesi"), " kararıyla mümkündür.",
            ),
            h2("Yönlendirme"),
            p("İlçe Nüfus Müdürlüğü, başvurana yazılı bildirim yapacak ve mahkemeye nasıl başvuracağı konusunda yönlendirme verecektir."),
            h3("Vatandaşa Verilecek Paket"),
            ul(
              "Dilekçe örneği",
              "Gerekli belgeler listesi (kimlik fotokopisi, eski okul belgesi, askerlik belgesi)",
              "Dava açma rehberi",
              "Cumhuriyet Başsavcılığı UYAP başvuru bilgisi",
              "Tekman Adliyesi'nde gönüllü hukuk öğrencilerinin 'evde dilekçe yazma' desteği",
            ),
            p(
              i("80 yaş üstü vatandaşlar için"), " evde dilekçe yazma desteği yönlendirme paketinde yer alacaktır. Aile yakınlarına da bilgilendirme için iletişim alınmıştır.",
            ),
            h3("Süre"),
            p("Dosya, ", b("30 gün"), " içinde tamamlanması beklenen kategorideki hizmettir; kapanışta vatandaşa ", b("SMS"), " ile bilgi verilecektir."),
          ),
          etiketler: ["Yazışma"],
          yetkililer: ["nufusMemur"],
          birimler: ["nufus"],
          bitis: gunEkle(2, 17),
        },
        {
          key: "evrak-tapu",
          baslik: "Köy yerleşik alan sınırı — tapu kadastro değerlendirmesi",
          aciklama:
            "Yeniköy Mahallesi muhtarlığı, mahalle ile bitişik komşu köy Demirkent arasında yerleşik alan sınırının tartışmalı olduğunu belirten yazıyı Kaymakamlığa intikal ettirmiştir. Sorun, 5403 sayılı Toprak Koruma ve Arazi Kullanımı Kanunu kapsamında tarım arazisi sınırlandırması ile 5393 sayılı Belediye Kanunu kapsamındaki yerleşik alan sınırı arasındaki örtüşme tartışmasından kaynaklanmaktadır. Tekman Tapu Müdürlüğü ve Erzurum Kadastro Müdürlüğü'nden ortak inceleme istenecek; bu kapsamda kadastro arazi paftası, 1958 yılı orijinal tapu kayıtları ve hava fotoğrafları karşılaştırılacaktır. Saha incelemesinde ölçüm GNSS RTK cihazıyla yapılacak; her iki köy muhtarı, tapu memuru, jeoloji teknisyeni ve hukuk görevlisi katılacaktır. Komisyon raporu hazırlandıktan sonra Sayın Kaymakamlık makamına sunulacak; gerektiğinde resmi sınır kararı için İl İdare Kurulu gündemine alınacaktır. Bu tip sınır anlaşmazlıkları ortalama 60-90 gün arası sonuçlanmakta olup, tarafların itirazı durumunda idari yargı yoluna gidilebilmektedir. Geçen yıl Çayırlı-Doğanca arasında benzer bir sorun yargı kararıyla çözüme ulaşmıştır. Dosya tüm aşamalarıyla şeffaf yürütülecek, taraflara sürekli bilgilendirme yapılacaktır.",
          aciklamaDokuman: doc(
            h2("Sorun"),
            p(
              b("Yeniköy Mahallesi muhtarlığı"), ", komşu köy ", b("Demirkent"),
              " ile arasındaki yerleşik alan sınırının tartışmalı olduğunu Kaymakamlığa intikal ettirmiştir.",
            ),
            h2("Yasal Çerçeve"),
            p(
              "Tartışma; ", b("5403 sayılı Toprak Koruma ve Arazi Kullanımı Kanunu"),
              " kapsamındaki tarım arazisi sınırlandırması ile ", b("5393 sayılı Belediye Kanunu"),
              " kapsamındaki yerleşik alan sınırı arasındaki örtüşmeden kaynaklanır.",
            ),
            h2("İnceleme"),
            p(
              b("Tekman Tapu Müdürlüğü"), " ve ", b("Erzurum Kadastro Müdürlüğü"), " ortak inceleme yapacaktır.",
            ),
            ul(
              "Kadastro arazi paftası",
              "1958 yılı orijinal tapu kayıtları",
              "Hava fotoğrafları karşılaştırması",
              "Saha ölçümü GNSS RTK cihazıyla",
            ),
            h3("Saha Ekibi"),
            ul(
              "Her iki köy muhtarı",
              "Tapu memuru",
              "Jeoloji teknisyeni",
              "Hukuk görevlisi",
            ),
            h2("Çıktı"),
            p(
              "Komisyon raporu Kaymakamlık makamına sunulur; gerekirse resmi sınır kararı için ", b("İl İdare Kurulu"),
              " gündemine alınır. Süreç ortalama ", b("60-90 gün"), " sürmektedir.",
            ),
            p(
              i("Geçen yıl Çayırlı-Doğanca arasında benzer sorun yargı kararıyla çözülmüştü"),
              ". Dosya tüm aşamalarıyla şeffaf yürütülecek, taraflara sürekli bilgilendirme yapılacaktır.",
            ),
          ),
          etiketler: ["Yazışma", "Saha"],
          yetkililer: ["tapuMudur"],
          birimler: ["tapuKadastro"],
          bitis: gunEkle(17, 17),
        },
      ],
    },
    {
      ad: "Süreçte / Cevap Bekleyen",
      yetkililer: ["yaziMemur"],
      birimler: ["yaziIsleri"],
      kartlar: [
        {
          key: "evrak-bimer-egitim",
          baslik: "BIMER #44871 — Servis ücreti şikayeti",
          aciklama:
            "Bilgi Edinme Kanunu kapsamında BIMER üzerinden 44871 numara ile iletilen şikayette, Atatürk Ortaokulu öğrenci servis ücretinin geçen yıla göre %38 oranında zamlandığı, çevredeki ilçelere göre fahiş olduğu ve veli bütçesini zorladığı belirtilmektedir. Şikayet, 6502 sayılı Tüketicinin Korunması Hakkında Kanun ile İl Tarife Tespit Komisyonu kararları çerçevesinde değerlendirilmektedir. İlçe Milli Eğitim Müdürlüğü servis ihale dosyasını incelemiş; ücret tarifesinin ilçe encümeni kararıyla belirlendiği, akaryakıt ve sigorta zammından dolayı %26 artışın belgelenebilir olduğu, kalan %12'lik bölümün ise toplu taşıma fiyat endeksindeki artışla orantılı olduğu raporlanmıştır. Mali makam görüşü olarak, servis araç sahiplerinin gelirlerinin artmadığı, eğer ücret düşürülürse servis hizmetinin durabileceği değerlendirilmektedir. Cevap taslağında: artışın gerekçesi şeffaf biçimde açıklanacak, geliri yetersiz aileler için Şartlı Eğitim Yardımı (ŞEY) yönlendirmesi yapılacak, gelecek yıl için tarife görüşmelerinde velilerin de görüş bildirebilmesi için kamuoyu istişaresi düzenleneceği belirtilecektir. Cevap, BIMER kanalıyla resmi prosedüre uygun şekilde 30 gün içinde gönderilecektir.",
          aciklamaDokuman: doc(
            h2("Şikayet"),
            p(
              b("BIMER #44871"), " ile iletilen şikayette ", b("Atatürk Ortaokulu"),
              " servis ücretinin geçen yıla göre ", b("%38 oranında"),
              " zamlandığı, çevre ilçelere göre fahiş olduğu ve veli bütçesini zorladığı belirtilmektedir.",
            ),
            h2("Yasal Çerçeve"),
            p(
              b("6502 sayılı Tüketicinin Korunması Hakkında Kanun"), " ile ",
              b("İl Tarife Tespit Komisyonu"), " kararları çerçevesinde değerlendirilmektedir.",
            ),
            h2("İnceleme Bulguları"),
            ul(
              "Tarife ilçe encümeni kararıyla belirlenmiş",
              "Akaryakıt ve sigorta zammı kaynaklı %26 artış belgelenebilir",
              "Kalan %12 toplu taşıma fiyat endeksiyle orantılı",
            ),
            p(
              i("Mali makam görüşü"), ": servis araç sahiplerinin gelirleri artmamış; ücret düşürülürse hizmetin durma riski mevcuttur.",
            ),
            h2("Cevap Taslağı"),
            ol(
              "Artışın gerekçesi şeffaf biçimde açıklanır",
              "Geliri yetersiz aileler için Şartlı Eğitim Yardımı (ŞEY) yönlendirmesi",
              "Gelecek yıl tarife görüşmelerinde veli görüşü için kamuoyu istişaresi taahhüdü",
            ),
            p("Cevap, BIMER kanalıyla resmi prosedüre uygun şekilde ", b("30 gün içinde"), " gönderilecektir."),
          ),
          etiketler: ["Yazışma", "Eğitim"],
          yetkililer: ["milliMemur"],
          birimler: ["milliEgitim"],
          bitis: gunEkle(6, 17),
          yorumlar: [
            { yazan: "milliMemur", icerik: "İhale dosyası incelendi, ücret tarifesi mevzuata uygun. Cevap taslağı hazırlanıyor.", gunFarki: -1 },
          ],
        },
        {
          key: "evrak-cimer-orman",
          baslik: "CIMER #2026/3812 — Ağaç kesim şikayeti",
          aciklama:
            "CIMER'e 2026/3812 numarayla iletilen başvuruda, Karaağaç köyü Çamlık mevkiinde son 1 hafta içinde izinsiz olarak yaklaşık 30 adet meşe ağacının kesildiği ve gizlice kamyonla taşındığı bildirilmiştir. 6831 sayılı Orman Kanunu'nun 91. maddesi ve 4915 sayılı Kara Avcılığı Kanunu çerçevesinde Orman İşletme Şefliği saha incelemesi yapmakla görevlendirilmiştir. Saha ekibi 04.05.2026 tarihinde mevkiyi ziyaret etmiş, kesim izleri ve kütüklerin DNA ölçümünü almış, bölgenin uydu fotoğraflarını karşılaştırmıştır. İlk değerlendirmede 17 adet meşe ağacının izinsiz kesildiği, kalanların ise eski kesim olduğu tespit edilmiştir. İhlal Cumhuriyet Başsavcılığı'na suç duyurusu olarak iletilecek; faillerin tespiti için Jandarma istihbaratı devreye alınacaktır. Köyde yapılan istihbarat çalışmalarında 2 şüpheli ismi öne çıkmıştır. Ormancılık idaresi ihlal alanına yeni dikim yaparak rehabilitasyon programı uygulayacaktır. Bu tür ihlallerin caydırılması için köy meydanına ve mahalle camisi panosuna 'Ormansız bir gelecek olamaz' afişi asılacaktır. Cevap CIMER üzerinden başvuru sahibine bilgi verilecek, ancak şüpheli kimliği gizliliği nedeniyle paylaşılmayacaktır. Vakanın tutanak ve fotoğrafları seed kapsamında dosyaya işlenmiştir.",
          aciklamaDokuman: doc(
            h2("İhbar"),
            p(
              b("CIMER 2026/3812"), " ile ", b("Karaağaç köyü Çamlık mevkii"),
              "nde son 1 hafta içinde izinsiz olarak yaklaşık ", b("30 adet meşe ağacının"),
              " kesildiği ve kamyonla taşındığı bildirilmiştir.",
            ),
            h2("Yasal Dayanak"),
            ul(
              b("6831 sayılı Orman Kanunu — 91. madde"),
              b("4915 sayılı Kara Avcılığı Kanunu"),
            ),
            h2("Saha İncelemesi"),
            p(
              "Orman İşletme Şefliği ekibi ", b("04.05.2026"),
              " tarihinde sahayı ziyaret etti; kesim izleri, kütük DNA ölçümleri ve uydu fotoğrafı karşılaştırması yapıldı.",
            ),
            ul(
              b("17 ağaç"), " izinsiz kesim olarak tespit edildi",
              "Kalanlar eski kesim — vaka dışı",
              i("Köy istihbaratında 2 şüpheli ismi öne çıkmıştır"),
            ),
            h2("Aksiyon"),
            ol(
              "Cumhuriyet Başsavcılığı'na suç duyurusu",
              "Faillerin tespiti için Jandarma istihbaratı",
              "İhlal alanına yeni dikim ile rehabilitasyon programı",
              "Köy meydanı ve cami panosuna caydırıcı afiş",
            ),
            p(
              i("Cevap CIMER üzerinden başvurana iletilir"),
              "; şüpheli kimliği gizlilik nedeniyle paylaşılmaz.",
            ),
          ),
          etiketler: ["Saha", "Yazışma"],
          yetkililer: ["ormanSefi"],
          birimler: ["ormanIsletme"],
          bitis: gunEkle(9, 17),
          ekler: [
            { ad: "saha-inceleme-formu.pdf", mime: "application/pdf", boyut: 64_000, yukleyen: "ormanSefi" },
          ],
        },
        {
          key: "evrak-elektrik",
          baslik: "Elektrik kesintisi şikayeti — TEDAŞ açıklaması",
          aciklama:
            "Cumhuriyet Mahallesi sakinleri tarafından imzalı dilekçeyle, mahallede son bir hafta içerisinde 3 kez (Pazartesi 4 saat, Çarşamba 2 saat, Cuma 6 saat) elektrik kesintisi yaşandığı, bu durumun frigorifik buzdolaplarındaki gıda kayıpları ve evden çalışan vatandaşların iş kaybına yol açtığı bildirilmiştir. TEDAŞ Tekman İşletme Şefliği'nden teknik rapor talep edilmiş; rapor kesintilerin nedeni, sürelerinin makul olup olmadığı, planlı/plansız ayrımı ve önümüzdeki dönem için yatırım planı hakkında detay içerecektir. Ön değerlendirmede; pazartesi kesintisinin Tekman tarafı OG hat bakımı (planlı, ancak yeterli bildirim yapılmamış), çarşamba kesintisinin trafo arızası (plansız), cuma kesintisinin ise rüzgar fırtınasında yıldırım çarpması (plansız) kaynaklı olduğu öğrenilmiştir. Vatandaşa verilecek cevap yazısında; TEDAŞ açıklaması, 4628 sayılı Elektrik Piyasası Kanunu çerçevesinde tüketici hakları, EPDK şikayet kanalı yönlendirmesi ve TEDAŞ tarafından mahalleye 12 ay içinde yapılması planlanan 'orta gerilim ring hattı' yatırım bilgisi yer alacaktır. Plansız kesintiler için TEDAŞ standart tazminat prosedürü işletilecektir.",
          aciklamaDokuman: doc(
            h2("Şikayet"),
            p(
              b("Cumhuriyet Mahallesi"), " sakinlerinin imzalı dilekçesinde son bir hafta içinde ", b("3 elektrik kesintisi"),
              " yaşandığı, gıda kayıpları ve iş kaybına yol açtığı belirtilmiştir.",
            ),
            ul(
              "Pazartesi — 4 saat",
              "Çarşamba — 2 saat",
              "Cuma — 6 saat",
            ),
            h2("TEDAŞ Ön Değerlendirme"),
            ul(
              "Pazartesi: ", b("OG hat bakımı"), " (planlı; ", i("yeterli bildirim yapılmamış"), ")",
              "Çarşamba: trafo arızası (plansız)",
              "Cuma: yıldırım çarpması (plansız)",
            ),
            h2("Cevap İçeriği"),
            ol(
              "TEDAŞ teknik açıklaması",
              b("4628 sayılı Elektrik Piyasası Kanunu"), " çerçevesinde tüketici hakları",
              "EPDK şikayet kanalı yönlendirmesi",
              "TEDAŞ'ın mahalleye 12 ay içinde planladığı orta gerilim ring hattı yatırımı",
            ),
            p("Plansız kesintiler için ", b("TEDAŞ standart tazminat prosedürü"), " işletilecektir."),
          ),
          etiketler: ["Yazışma"],
          yetkililer: ["tedasSef"],
          birimler: ["tedas"],
          bitis: gunEkle(3, 17),
        },
      ],
    },
    {
      ad: "Açık Kapı Notları",
      yetkililer: ["ozelMemur"],
      birimler: ["ozelKalem"],
      kartlar: [
        {
          key: "evrak-acik-kapi-engelli",
          baslik: "Engelli rampası talebi — açık kapı 02.05.2026",
          aciklama:
            "02.05.2026 tarihindeki Sayın Kaymakam Açık Kapı Günü'nde, %72 ortopedik engelli olan vatandaşımız tekerlekli sandalyesiyle gelerek; ev önündeki cadde ve evi ile yakın market arasındaki kaldırımda engelli rampasının bulunmadığını, bu nedenle günlük temel ihtiyaçlarını karşılamakta zorlandığını şahsen ifade etmiştir. Sayın Kaymakamımız makam defterine 'İvedi olarak değerlendirilsin, vatandaşa 7 gün içinde geri dönüş yapılsın' notunu düşmüştür. 5378 sayılı Engelliler Hakkında Kanun ve Erişilebilirlik Standartları Yönetmeliği gereği belediyeler, kamu binaları ve toplu kullanım alanlarındaki engelsiz erişimi sağlamakla yükümlüdür. Belediye Fen İşleri sorumluluğunda, talep edilen güzergah üzerindeki 4 farklı noktada (ev önü, market önü, eczane önü, otobüs durağı) engelli rampası, asfalt yamasında yön belirleyici çizgiler ve görme engelliler için sarı çizgi-tampon yapılacaktır. Maliyet yaklaşık 28.500 TL olup belediye bütçesinden karşılanacaktır. İşin Mayıs ayı sonuna kadar tamamlanması planlanmıştır. Vatandaşa Engelli Hakları Federasyonu, ASHB ulaşım desteği ve evde sağlık hizmeti yönlendirmeleri de bilgi notuyla iletilecektir. Sayın Kaymakam konuyla bizzat ilgilendiğini, hızlı çözüm beklediğini gerek belediye başkanına gerekse fen işleri sorumlusuna iletmiştir.",
          aciklamaDokuman: doc(
            h2("Talep"),
            p(
              b("02.05.2026"), " Açık Kapı Günü'nde ", b("%72 ortopedik engelli"),
              " vatandaşımız tekerlekli sandalyesiyle makama gelerek ev-market arası kaldırımda engelli rampası olmadığını ve günlük ihtiyaçlarını karşılamakta zorlandığını ifade etmiştir.",
            ),
            p(
              i("Sayın Kaymakamımızın makam defteri notu"), ": ",
              b("\"İvedi olarak değerlendirilsin, vatandaşa 7 gün içinde geri dönüş yapılsın\""), ".",
            ),
            h2("Yasal Dayanak"),
            p(
              b("5378 sayılı Engelliler Hakkında Kanun"), " ve ",
              b("Erişilebilirlik Standartları Yönetmeliği"),
              " gereği belediyeler, kamu binaları ve toplu kullanım alanlarında engelsiz erişimi sağlamakla yükümlüdür.",
            ),
            h2("Yapılacak İşler"),
            ul(
              "Ev önü engelli rampası",
              "Market önü engelli rampası",
              "Eczane önü engelli rampası",
              "Otobüs durağı engelli rampası",
              "Görme engelliler için sarı çizgi-tampon ve yön belirleyici çizgiler",
            ),
            p(
              "Maliyet ", b("~28.500 TL"), ", belediye bütçesinden karşılanacaktır. Tamamlanma hedefi ", b("Mayıs sonu"), ".",
            ),
            h3("Ek Yönlendirmeler"),
            ul(
              "Engelli Hakları Federasyonu",
              "ASHB ulaşım desteği",
              "Evde sağlık hizmeti",
            ),
          ),
          etiketler: ["Sosyal Yardım", "Saha"],
          yetkililer: ["belediyeFenIsleri"],
          birimler: ["belediye"],
          bitis: gunEkle(7, 17),
          yorumlar: [
            { yazan: "kaymakam", icerik: "Konuyla bizzat ilgileniyorum, hızlı çözüm istiyorum.", gunFarki: -1 },
          ],
        },
        {
          key: "evrak-acik-kapi-burs",
          baslik: "Üniversite öğrencisi burs talebi",
          aciklama:
            "Atatürk Üniversitesi Tıp Fakültesi 3. sınıf öğrencisi, açık kapı gününde Kaymakamlık makamına gelerek ailesinin maddi durumunun zayıfladığını, baba emekli olmadan vefat ettiği için annenin tek başına 3 çocuğa baktığını ve bu nedenle eğitim masraflarını karşılamakta zorlandığını dile getirmiştir. Talep ettiği destek tipleri: SYDV ödenek desteği, ilçe belediyesi öğrenci bursu, KYK destek başvurusu yenilenmesi ve ders kitabı yardımı. SYDV Mütevelli Heyeti Mayıs gündemine 'Eğitim Yardımı' başlığı altında alınacaktır. Vakıf bütçesinden aylık 2.500 TL tutarında 9 ay süreli (eğitim dönemi) destek planlaması yapılmıştır. Belediye Başkanlığı bütçesinden ise dönemlik 5.000 TL kitap-malzeme yardımı için Kaymakamlık görüşü olumlu bildirilecektir. KYK ek burs başvurusu için öğrenci yönlendirilmiştir. Tüm dosyalar mahremiyet kapsamında değerlendirilmektedir; öğrencinin ismi sadece dosya numarasıyla anılır. Eğitimde başarılı olan ve maddi imkansızlık nedeniyle riske giren öğrenciler 'Stratejik Önemli Vakıf Dosyası' kategorisine alınmaktadır. Sayın Kaymakamımız bu tür dosyalarda 'eğitim hakkı vatandaşlık görevidir' ilkesini benimsemiştir.",
          aciklamaDokuman: doc(
            h2("Başvuran"),
            p(
              b("Atatürk Üniversitesi Tıp Fakültesi 3. sınıf öğrencisi"),
              ", açık kapı gününde makama gelerek babasının emekli olmadan vefat ettiğini, annenin tek başına 3 çocuğa baktığını ve eğitim masraflarını karşılamakta zorlandığını ifade etmiştir.",
            ),
            h2("Talep Edilen Destekler"),
            ul(
              "SYDV ödenek desteği",
              "İlçe belediyesi öğrenci bursu",
              "KYK destek başvurusu yenilenmesi",
              "Ders kitabı yardımı",
            ),
            h2("Planlanan Destek"),
            ol(
              i("SYDV Mütevelli Heyeti Mayıs gündemine"), " 'Eğitim Yardımı' başlığıyla alınacak",
              "Vakıf bütçesinden ", b("aylık 2.500 TL × 9 ay"), " destek planlaması",
              "Belediye Başkanlığı bütçesinden ", b("dönemlik 5.000 TL kitap-malzeme yardımı"), " için Kaymakamlık olumlu görüşü",
              "KYK ek burs başvurusu için öğrenci yönlendirildi",
            ),
            h3("Mahremiyet"),
            p(
              "Tüm dosyalar mahremiyet kapsamındadır; öğrencinin ismi yalnızca ", b("dosya numarasıyla"), " anılır. Bu dosya ",
              b("'Stratejik Önemli Vakıf Dosyası'"), " kategorisindedir.",
            ),
            p(i("Sayın Kaymakamımızın ilkesi: \"eğitim hakkı vatandaşlık görevidir\"."))
          ),
          etiketler: ["Sosyal Yardım"],
          yetkililer: ["sydvMemur"],
          birimler: ["sydv"],
          bitis: gunEkle(15, 17),
        },
      ],
    },
    {
      ad: "Kapanan",
      kartlar: [
        {
          key: "evrak-nufus",
          baslik: "Nüfus kayıt örneği yönlendirmesi tamamlandı",
          aciklama:
            "Vatandaş tarafından nüfus kayıt örneği talebi için Kaymakamlığa yapılan başvuru sonrasında, 5490 sayılı Nüfus Hizmetleri Kanunu kapsamında bu hizmetin doğrudan İlçe Nüfus Müdürlüğü tarafından sunulduğu hatırlatılmış ve başvuru sahibi randevu alarak işlem masasına yönlendirilmiştir. e-Devlet üzerinden de bu hizmetin alınabileceği bilgisi paylaşılmış, görme engelli vatandaşımız olduğu için Nüfus Müdürlüğü personeli yardımıyla işlemin tamamlanması koordine edilmiştir. Dosya başarıyla kapatılmıştır.",
          aciklamaDokuman: doc(
            h2("Sonuç"),
            p(
              i("Dosya başarıyla kapatılmıştır"),
              ". Vatandaşın nüfus kayıt örneği talebi yönlendirme ile tamamlandı.",
            ),
            h2("Yapılan İşlem"),
            p(
              b("5490 sayılı Nüfus Hizmetleri Kanunu"),
              " kapsamında hizmetin doğrudan İlçe Nüfus Müdürlüğü tarafından sunulduğu hatırlatıldı.",
            ),
            ol(
              "Vatandaş randevu alarak işlem masasına yönlendirildi",
              "e-Devlet üzerinden alternatif erişim bilgisi paylaşıldı",
              b("Görme engelli"), " vatandaşımız için Nüfus Müdürlüğü personeli destek verdi",
            ),
          ),
          etiketler: ["Yazışma"],
          tamamlandi: true,
        },
        {
          key: "evrak-bimer-coplu",
          baslik: "BIMER — Çöp toplama saatleri (kapandı)",
          aciklama:
            "Belediye çöp toplama saatlerinin sabah erken (05:00) yapılması nedeniyle gürültü şikayeti olarak BIMER üzerinden iletilen başvuruda; 5326 sayılı Kabahatler Kanunu'nun gürültü kontrolü hükümleri çerçevesinde ve Çevre, Şehircilik ve İklim Değişikliği Bakanlığı genelgesi ışığında değerlendirme yapılmıştır. Belediye Başkanlığı çöp toplama programı yeniden düzenlenmiş, merkez mahallelerde toplama saati 06:30'a çekilmiş, çöp kamyonu uyarı sesleri gece modu olarak ayarlanmış ve şoförlere 'sessiz operasyon' eğitimi verilmiştir. Vatandaşa cevap yazısı PTT ile iletilmiş, dosya kapatılmıştır. Geri bildirim: vatandaş memnuniyetini telefonla bildirmiş, teşekkür notu eklenmiştir.",
          aciklamaDokuman: doc(
            h2("Sonuç"),
            p(
              i("Dosya kapatılmıştır"), ". Çözüm uygulamaya alındı, vatandaş ", b("memnuniyet"),
              " bildirdi.",
            ),
            h2("Yasal Çerçeve"),
            p(
              b("5326 sayılı Kabahatler Kanunu"), " gürültü kontrolü hükümleri ve Çevre, Şehircilik ve İklim Değişikliği Bakanlığı genelgesi.",
            ),
            h2("Alınan Önlemler"),
            ul(
              "Merkez mahallelerde toplama saati ", b("06:30'a"), " çekildi",
              "Çöp kamyonu uyarı sesleri ", b("gece modu"), " olarak ayarlandı",
              "Şoförlere 'sessiz operasyon' eğitimi verildi",
              "Cevap yazısı PTT ile iletildi",
            ),
            p(i("Geri bildirim: vatandaş memnuniyetini telefonla bildirmiş, teşekkür notu dosyaya eklenmiştir."))
          ),
          etiketler: ["Yazışma"],
          tamamlandi: true,
        },
        {
          key: "evrak-cimer-park",
          baslik: "CIMER — Park güvenliği talebi (kapandı)",
          aciklama:
            "CIMER üzerinden Cumhuriyet Parkı'nda akşam saatlerinde ışıklandırmanın yetersizliği ve devriye eksikliği sebebiyle güvenlik şikayetleri alınmıştı. 5393 sayılı Belediye Kanunu ve 2559 sayılı Polis Vazife ve Salahiyet Kanunu çerçevesinde, Belediye 4 adet 30W LED aydınlatma direği eklemiş, mevcut direklerin lambaları halojenden LED'e dönüştürülmüş, çalı alanları gece görünürlüğü artırmak için budanmıştır. Emniyet ekibi park bölgesinde devriye saatlerini arttırmış, gece 21:00-23:00 arası iki ek devriye konuşlandırılmıştır. Park girişine güvenlik kamerası kurulmuş ve kayıtlar Emniyet ekipleri tarafından izlenmektedir. Vatandaşa CIMER cevap kanalı üzerinden geri bildirim yapılmış, çözüm sonrası şikayet dosyası kapatılmıştır.",
          aciklamaDokuman: doc(
            h2("Sonuç"),
            p(
              i("Şikayet dosyası kapatılmıştır"), ". ", b("Cumhuriyet Parkı"),
              " güvenlik ve aydınlatma çözümü tamamlandı.",
            ),
            h2("Yasal Çerçeve"),
            p(
              b("5393 sayılı Belediye Kanunu"), " ve ", b("2559 sayılı Polis Vazife ve Salahiyet Kanunu"),
              " çerçevesinde değerlendirildi.",
            ),
            h2("Belediye Tarafından Yapılanlar"),
            ul(
              b("4 adet 30W LED"), " aydınlatma direği eklendi",
              "Mevcut direklerin lambaları halojenden LED'e dönüştürüldü",
              "Çalı alanları gece görünürlüğü için budandı",
            ),
            h2("Emniyet Tarafından Yapılanlar"),
            ul(
              "Park bölgesinde devriye saatleri artırıldı",
              b("21:00-23:00"), " arası 2 ek devriye konuşlandırıldı",
              "Park girişine güvenlik kamerası kuruldu",
            ),
            p("Vatandaşa CIMER cevap kanalı üzerinden geri bildirim yapıldı."),
          ),
          etiketler: ["Yazışma", "Güvenlik"],
          tamamlandi: true,
        },
      ],
    },
  ],
};
