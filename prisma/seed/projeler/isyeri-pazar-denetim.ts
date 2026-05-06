// Proje: İş Yeri Ruhsat ve Pazar Denetim Süreçleri
// İşyeri açma/kapatma ruhsatları, mahalle pazarı denetimi, gıda satış güvenliği,
// hijyen standartları ve vatandaş şikayetlerinin değerlendirilmesi.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";
import { doc, h2, h3, p, ul, ol, b, i } from "../rt";

export const isyeriPazarDenetimProjesi: ProjeSeed = {
  key: "denetim",
  ad: "İş Yeri Ruhsat ve Pazar Denetim Süreçleri",
  aciklama:
    "Tekman ilçesinde 3572 sayılı İşyeri Açma ve Çalışma Ruhsatlarına Dair Kanun kapsamında yeni iş yeri başvurularının değerlendirilmesi, gayrisıhhi müessese ruhsatları, mahalle pazarı tezgah ve gıda denetimi, fırın hijyen kontrolü, ruhsatsız iş yerlerinin kapatılması ve vatandaş şikayetleri üzerine yürütülen denetim faaliyetlerinin koordinasyonu.",
  olusturan: "yaziAmir",
  yetkililer: ["kaymakam", "yaziAmir", "belediyeAmir", "saglikAmir"],
  birimler: [
    "yaziIsleri",
    "belediye",
    "saglik",
    "tsm",
    "tarim",
    "emniyet",
    "vergi",
    "mal",
  ],
  kapakRenk: "amber",
  kapakIkon: "store",
  yildizli: false,
  listeler: [
    {
      ad: "Ruhsat Başvuruları",
      yetkililer: ["yaziAmir"],
      birimler: ["yaziIsleri", "belediye"],
      kartlar: [
        {
          key: "denetim-yeni-ruhsat",
          baslik: "Mayıs ayı yeni iş yeri ruhsat başvurularının değerlendirilmesi",
          aciklama:
            "3572 sayılı İşyeri Açma ve Çalışma Ruhsatlarına Dair Kanun ile İşyeri Açma ve Çalışma Ruhsatlarına İlişkin Yönetmelik kapsamında, Mayıs ayında ilçemize yapılan 14 yeni iş yeri ruhsat başvurusu değerlendirilecektir. Başvurular sıhhi (12) ve gayrisıhhi (2) müessese olarak ayrılmaktadır.",
          aciklamaDokuman: doc(
            h2("Yasal Dayanak"),
            p(
              b("3572 sayılı İşyeri Açma ve Çalışma Ruhsatlarına Dair Kanun"),
              " ve İşyeri Açma ve Çalışma Ruhsatlarına İlişkin Yönetmelik gereği, ilçemizde sıhhi müesseselere Belediye, gayrisıhhi müesseselere Kaymakamlık ruhsat verir.",
            ),
            h3("Mayıs Başvuruları"),
            ul(
              "Bakkal/market — 5 başvuru",
              "Kahvaltı salonu / restoran — 3 başvuru",
              "Fırın — 1 başvuru",
              "Berber / kuaför — 2 başvuru",
              "Manav — 1 başvuru",
              "Akaryakıt istasyonu (gayrisıhhi) — 1 başvuru",
              "Mermer atölyesi (gayrisıhhi) — 1 başvuru",
            ),
            h3("Değerlendirme Süreci"),
            ol(
              "Başvuru evrak kontrolü — Yazı İşleri",
              "Saha kontrol heyeti (Belediye + Sağlık + İtfaiye)",
              "Eksiklik tespit edilirse 30 gün süre tanınır",
              "Onay sonrası ruhsat düzenlenir",
              "Gayrisıhhi başvurularda Kaymakam imzası gerekir",
            ),
          ),
          etiketler: ["Yazışma", "Kaymakamlık"],
          yetkililer: ["yaziAmir", "yaziMemur", "belediyeAmir"],
          birimler: ["yaziIsleri", "belediye"],
          baslangic: gunEkle(-5),
          bitis: gunEkle(12, 17),
          kontrol: [
            {
              ad: "Başvuru süreci",
              maddeler: [
                { metin: "14 başvuru evrak kontrolü", atanan: "yaziMemur", tamam: true, tamamlanmaGun: -2 },
                { metin: "Saha heyeti programı", atanan: "belediyeAmir" },
                { metin: "İlk 8 başvuru saha kontrolü", atanan: "belediyeFenIsleri" },
                { metin: "Gayrisıhhi 2 başvuru — kaymakam imzası", atanan: "ozelMemur" },
              ],
            },
            {
              ad: "Tedarik / yazışma",
              maddeler: [
                { metin: "İtfaiye uygunluk yazıları", atanan: "itfaiyeAmir" },
                { metin: "Sağlık uygunluk yazıları", atanan: "saglikMemur" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "yaziAmir",
              icerik:
                "Bu ay başvuru sayısı geçen aya göre arttı. Akaryakıt istasyonu başvurusu için Çevre ve Şehircilik il müdürlüğü görüşü beklemekteyiz, bu süreç 45 günü bulabilir. @<belediyeAmir> saha heyetini bu hafta toplayabilir miyiz?",
              gunFarki: -1,
              saat: 10,
            },
            {
              yazan: "belediyeAmir",
              icerik:
                "Saha heyeti perşembe sabahı toplanıyor. İtfaiyeden yangın tedbirleri için araç ayarladık, sağlık ekibi de eşlik edecek. Akaryakıt başvurusunda zemin ve drenaj kritik, ek inceleme planlıyoruz.",
              gunFarki: 0,
              saat: 9,
              yanit: 0,
            },
            {
              yazan: "kaymakam",
              icerik:
                "Yatırımcılarımıza süreç hızı kritik — başvurular gereksiz uzamasın. Mevzuata uygun olmayan başvuruları net şekilde gerekçelendirin, eksiklik mektubu hazırlanırken vatandaşa hangi belge gerektiği açıkça yazılsın.",
              gunFarki: 0,
              saat: 14,
            },
          ],
          ekler: [
            { ad: "mayis-ruhsat-basvurulari.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", boyut: 38_000 },
          ],
        },
        {
          key: "denetim-gayrisihhi",
          baslik: "Gayrisıhhi müessese ruhsatları — akaryakıt ve mermer atölyesi",
          aciklama:
            "Gayrisıhhi müessese statüsündeki akaryakıt istasyonu ve mermer atölyesi başvuruları, Çevresel Etki Değerlendirmesi (ÇED), İtfaiye uygunluk raporu, zemin etüdü ve komşu muvafakatnamesi gerektirmektedir. Süreç ortalama 60-90 gün sürmektedir.",
          aciklamaDokuman: doc(
            h2("Gayrisıhhi Müessese Süreci"),
            p(
              "İşyeri Açma Yönetmeliği ek-1 listede yer alan ",
              b("gayrisıhhi müesseseler (1., 2., 3. sınıf)"),
              " özel inceleme prosedürüne tabidir. Akaryakıt 1. sınıf, mermer atölyesi 2. sınıf gayrisıhhi olarak değerlendirilir.",
            ),
            h3("İstenen Belgeler"),
            ul(
              "Çevresel Etki Değerlendirmesi (ÇED) raporu / muafiyet belgesi",
              "İtfaiye yangın tedbirleri uygunluk raporu",
              "Zemin etüdü ve statik proje (mühendis onaylı)",
              "Komşu muvafakatnamesi (50 m yarıçap)",
              "İmar durumu belgesi",
              "Tapu / kira sözleşmesi",
            ),
            h3("Karar Mercii"),
            p(
              "Tüm belgeler tamamlandıktan sonra ",
              i("Kaymakamlık inceleme heyeti"),
              " yerinde görüşür ve raporunu Sayın Kaymakam'ın onayına sunar.",
            ),
          ),
          etiketler: ["Yazışma", "Beklemede"],
          yetkililer: ["yaziAmir", "ozelAmir"],
          birimler: ["yaziIsleri", "belediye"],
          bitis: gunEkle(45, 17),
        },
        {
          key: "denetim-firin-hijyen",
          baslik: "Yeni fırın başvurusu — hijyen ve gıda güvenliği denetimi",
          aciklama:
            "Yeni Mahalle'de açılması planlanan fırının ruhsat başvurusu, Toplum Sağlığı Merkezi (TSM) ve Tarım Müdürlüğü gıda denetim ekibinin ortak incelemesinden geçecektir. Hamur hazırlama alanı, fırın bacası, ürün sergileme dolabı ve personel hijyeni kontrol edilecektir.",
          aciklamaDokuman: doc(
            h2("Fırın Denetim Kalemleri"),
            p(
              "5996 sayılı Veteriner Hizmetleri, Bitki Sağlığı, Gıda ve Yem Kanunu ile ",
              b("Türk Gıda Kodeksi"),
              " gereği fırın hijyen denetimi zorunludur.",
            ),
            h3("Saha Kontrolü"),
            ul(
              "Hamur hazırlama alanı zemini ve duvarları (yıkanabilir)",
              "Fırın bacası — kapasiteye uygun çekiş",
              "Ürün sergileme dolabı — sıcaklık ve cam koruma",
              "Personel sağlık raporu (HBV, HCV taraması)",
              "Bonbon (önlük + bone) zorunluluğu",
              "Un ve katkı maddesi etiket kontrolü",
            ),
            h3("Sonuç"),
            p(
              "Eksiklik tespit edilirse ",
              b("30 gün süre"),
              " verilir; sürede giderilmezse başvuru reddedilir.",
            ),
          ),
          etiketler: ["Sağlık", "Saha"],
          yetkililer: ["saglikAmir", "tarimAmir"],
          birimler: ["saglik", "tsm", "tarim"],
          bitis: gunEkle(8, 17),
        },
      ],
    },
    {
      ad: "Pazar & Gıda Denetim",
      yetkililer: ["belediyeAmir", "tarimAmir"],
      birimler: ["belediye", "tarim", "saglik"],
      kartlar: [
        {
          key: "denetim-pazar-hijyen",
          baslik: "Mahalle pazarı tezgah denetimi — Cuma pazarı saha kontrolü",
          aciklama:
            "Tekman merkez Cuma pazarında Belediye Zabıta, Tarım Müdürlüğü gıda kontrolörü ve Sağlık Müdürlüğü hijyen denetçisi ortak ekibi ile haftalık tezgah denetimi yapılmaktadır. Denetimde gıda etiket bilgisi, sıcaklık takibi, terazi kalibrasyonu ve tezgah hijyeni kontrol edilir.",
          aciklamaDokuman: doc(
            h2("Cuma Pazarı Denetimi"),
            p(
              "Tekman merkezde her cuma kurulan pazaryerinde yaklaşık ",
              b("180 tezgah"),
              " açılmaktadır. Belediye, Tarım ve Sağlık ekipleri ortak haftalık denetim yürütmektedir.",
            ),
            h3("Denetim Kalemleri"),
            ol(
              "Gıda etiket bilgisi (üretim/son kullanma tarihi)",
              "Soğuk zincir gerektirenler için sıcaklık ölçümü",
              "Terazi metrolojik kalibrasyon damgası",
              "Tezgah hijyeni — açıkta ürün satışı yasağı",
              "Satıcı sicil belgesi ve sağlık raporu",
              "Pazaryeri fiyat tarifesi panosu",
            ),
            h3("Yaptırımlar"),
            ul(
              "İlk ihlal — yazılı uyarı",
              "İkinci ihlal — idari para cezası (5996 sayılı Kanun)",
              "Üçüncü ihlal — tezgah ruhsatının iptali",
              "Bozuk gıda — anında imha tutanağı",
            ),
          ),
          etiketler: ["Sağlık", "Saha"],
          yetkililer: ["belediyeAmir", "tarimAmir", "saglikMemur"],
          birimler: ["belediye", "tarim", "saglik"],
          baslangic: gunEkle(0),
          bitis: gunEkle(7, 13),
          kontrol: [
            {
              ad: "Saha denetim",
              maddeler: [
                { metin: "Denetim ekibi sabah 07:00'de pazarda", atanan: "belediyeAmir", tamam: true },
                { metin: "180 tezgah hızlı tarama", atanan: "tarimAmir" },
                { metin: "Tutanak hazırlama", atanan: "saglikMemur" },
                { metin: "Haftalık rapor — Kaymakamlığa", atanan: "belediyeAmir" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "tarimAmir",
              icerik:
                "Bu cuma pazarında 4 satıcıya etiket eksiği için yazılı uyarı verildi. Bir tanesi geçen hafta da uyarı almış, ikinci kez olduğu için idari ceza tutanağı düzenleniyor. Soğuk zincir genel olarak iyi durumda.",
              gunFarki: 0,
              saat: 11,
            },
          ],
          ekler: [
            { ad: "pazar-denetim-tutanagi-mayis.pdf", mime: "application/pdf", boyut: 86_000 },
          ],
        },
        {
          key: "denetim-gida-etiket",
          baslik: "Market gıda etiket denetimi — son kullanma tarihi taraması",
          aciklama:
            "İlçemizdeki 28 marketin gıda etiket denetimi planlanmıştır. Özellikle son kullanma tarihi geçmiş ürünlerin raftan kaldırılması ve raf temizliği üzerinde durulacaktır. Geçen ay 3 markette tarihi geçmiş ürün tespit edilmişti.",
          aciklamaDokuman: doc(
            h2("Market Denetimi"),
            p(
              "Tarım Müdürlüğü gıda kontrol ekibi ve Belediye Zabıta birimi ortak çalışmasıyla, ilçemizdeki ",
              b("28 markette"),
              " etiket ve son kullanma tarihi denetimi yapılacaktır.",
            ),
            h3("Denetim Önceliği"),
            ul(
              "Süt ürünleri (yoğurt, peynir, ayran)",
              "Et ve şarküteri reyonu",
              "Hazır gıda paketleri (konserve, hazır çorba)",
              "Çocuk ürünleri (mama, bebek bezi, atıştırmalık)",
              "İthal gıda — Türkçe etiket zorunluluğu",
            ),
            h3("Geçmiş Ay Sonuçları"),
            p(
              "Nisan ayı denetiminde 3 markette ",
              i("toplam 47 adet tarihi geçmiş ürün"),
              " tespit edilmiş, ürünler imha edilmiş ve markette idari ceza uygulanmıştır.",
            ),
          ),
          etiketler: ["Sağlık", "Saha"],
          yetkililer: ["tarimAmir"],
          birimler: ["tarim", "belediye"],
          bitis: gunEkle(14, 17),
        },
        {
          key: "denetim-firin-rutin",
          baslik: "Aylık rutin fırın hijyen denetimi — 6 fırın",
          aciklama:
            "İlçemizdeki 6 ekmek fırınının aylık rutin hijyen denetimi yapılmaktadır. Personel sağlık raporu, hamur hazırlama hijyeni, ekmek depo şartları ve tartı tarifesi kontrol edilecektir. Ekmek gramajı standartlarına uyum titizlikle takip edilmektedir.",
          aciklamaDokuman: doc(
            h2("Fırın Denetim Programı"),
            p(
              "Türk Gıda Kodeksi Ekmek Tebliği gereği, ekmek üretimi yapan fırınlar ",
              b("ayda en az bir kez"),
              " denetlenir. Ekmek gramajı 200 gr ± %5 toleransı içinde olmalıdır.",
            ),
            h3("Denetim Kalemleri"),
            ul(
              "Personel sağlık karnesi (3 ay geçerli)",
              "Hamur hazırlama alan hijyeni",
              "Un kalitesi ve katkı oranı",
              "Pişirme sıcaklığı ve süresi (HACCP)",
              "Ekmek depo / sergileme alanı",
              "Tartı kalibrasyon damgası",
              "Ekmek gramaj ölçümü",
            ),
          ),
          etiketler: ["Sağlık"],
          yetkililer: ["saglikMemur", "tarimAmir"],
          birimler: ["saglik", "tarim"],
          bitis: gunEkle(20, 17),
        },
      ],
    },
    {
      ad: "Şikayetler",
      yetkililer: ["yaziAmir"],
      birimler: ["yaziIsleri", "belediye"],
      kartlar: [
        {
          key: "denetim-vatandas-sikayet",
          baslik: "Vatandaş şikayeti — ruhsatsız iş yeri ihbarı",
          aciklama:
            "Kaymakamlık iletişim kutusuna ulaşan vatandaş şikayeti üzerine, Yeni Mahalle'de ruhsatsız faaliyet gösterdiği iddia edilen oto tamir atölyesi denetlenecektir. Ruhsatsız faaliyet tespit edildiği takdirde 3572 sayılı Kanun gereği faaliyetin durdurulması işlemi başlatılır.",
          aciklamaDokuman: doc(
            h2("Şikayet Detayı"),
            p(
              "Vatandaş ihbarı: Yeni Mahalle 14. Sokak No:8'de bir oto tamir atölyesinin ",
              b("ruhsatsız çalıştığı"),
              " ve geceleri gürültü yaptığı bildirilmiştir.",
            ),
            h3("Süreç"),
            ol(
              "Yazı İşleri'nde dosya açılır",
              "Belediye Zabıta yerinde tespit yapar",
              "Ruhsat varsa — şikayet konusu (gürültü) için ayrı işlem",
              "Ruhsat yoksa — faaliyetin durdurulması mührü",
              "30 gün içinde ruhsat alınırsa açılır, alınmazsa kapatılır",
            ),
            h3("Şikayetçi Geri Dönüşü"),
            p(
              i("3071 sayılı Dilekçe Hakkı Kanunu"),
              " gereği şikayetçiye 15 gün içinde yazılı bilgilendirme yapılır.",
            ),
          ),
          etiketler: ["Yazışma", "Saha"],
          yetkililer: ["yaziAmir", "belediyeAmir"],
          birimler: ["yaziIsleri", "belediye"],
          baslangic: gunEkle(-2),
          bitis: gunEkle(10, 17),
          kontrol: [
            {
              ad: "Şikayet işlem",
              maddeler: [
                { metin: "Şikayet dilekçesi kayıt", atanan: "evrakKayit", tamam: true, tamamlanmaGun: -2 },
                { metin: "Belediye Zabıta saha tespiti", atanan: "belediyeAmir" },
                { metin: "Ruhsat sorgulama", atanan: "yaziMemur" },
                { metin: "Şikayetçiye bilgilendirme", atanan: "yaziMemur" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "belediyeAmir",
              icerik:
                "Saha tespitine yarın gidiyoruz. Adres bilinen bir nokta, daha önce de işlem yapılmış. Eğer hala ruhsatsız ise 3572 sayılı Kanun gereği mührüyoruz.",
              gunFarki: -1,
              saat: 11,
            },
          ],
        },
        {
          key: "denetim-pazar-fiyat",
          baslik: "Pazar fiyat şikayetleri ve fahiş fiyat denetimi",
          aciklama:
            "Cuma pazarında bazı sebze-meyve fiyatlarının emsallerine göre yüksek olduğuna dair vatandaş şikayetleri alınmıştır. Belediye Zabıta ekipleri 6502 sayılı Tüketicinin Korunması Hakkında Kanun çerçevesinde fahiş fiyat denetimi yapacaktır.",
          aciklamaDokuman: doc(
            h2("Fahiş Fiyat Denetimi"),
            p(
              "6502 sayılı Tüketicinin Korunması Hakkında Kanun ve ",
              b("Haksız Fiyat Değerlendirme Kurulu kararları"),
              " çerçevesinde, fahiş fiyat uygulayan satıcılar idari yaptırıma tabidir.",
            ),
            h3("Tespit Yöntemi"),
            ul(
              "Hal fiyatı vs pazar fiyatı karşılaştırması",
              "Aynı ürün diğer satıcılarda fiyat karşılaştırması",
              "Toptan-perakende fiyat farkı analizi",
              "Vatandaş şikayet kayıtları derlenir",
            ),
            h3("Yaptırım"),
            p(
              "Fahiş fiyat tespit edilirse Ticaret Bakanlığı'nın belirlediği ",
              b("idari para cezası"),
              " uygulanır; tekrarda iş yeri kapatma gündeme gelir.",
            ),
          ),
          etiketler: ["Saha", "Beklemede"],
          yetkililer: ["belediyeAmir"],
          birimler: ["belediye", "vergi"],
          bitis: gunEkle(15, 17),
        },
      ],
    },
    {
      ad: "Tamamlananlar",
      kartlar: [
        {
          key: "denetim-ruhsatsiz-kapatma",
          baslik: "Ruhsatsız iş yerinin kapatılması — Mart şikayeti sonucu",
          aciklama:
            "Mart ayında vatandaş şikayeti üzerine başlatılan ruhsatsız iş yeri denetimi sonuçlanmıştır. Söz konusu iş yerine 30 gün süre tanınmış, sürede ruhsat başvurusu yapılmadığı için 3572 sayılı Kanun gereği mühür tutanağı düzenlenmiş ve faaliyeti durdurulmuştur.",
          aciklamaDokuman: doc(
            h2("Sonuç"),
            p(
              "Mart şikayeti sonucu açılan dosyada işyeri sahibine ",
              b("30 gün ruhsat başvurusu süresi"),
              " tanınmış; sürede başvuru yapılmamıştır.",
            ),
            ul(
              "İşyeri ön cephesi mühürlendi",
              "Mühür tutanağı imzalandı",
              "Sahibine bildirim yapıldı (tebligat)",
              "İşyeri sahibinin itiraz hakkı 7 gün",
            ),
            p(
              i("Süreç şeffaf yürütülmüş"),
              " ve kanun çerçevesinde kalınmıştır.",
            ),
          ),
          etiketler: ["Yazışma", "Kurumsal"],
          tamamlandi: true,
          yorumlar: [
            { yazan: "yaziAmir", icerik: "Mühür tutanağı arşive konuldu, dosya kapatıldı.", gunFarki: -8 },
          ],
          ekler: [
            { ad: "muhur-tutanagi-mart.pdf", mime: "application/pdf", boyut: 72_000 },
          ],
        },
      ],
    },
  ],
};
