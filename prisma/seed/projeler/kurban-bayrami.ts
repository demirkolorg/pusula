// Proje: Kurban Bayramı Hazırlık ve Koordinasyonu
// İlçe genelinde kesim yerleri, hijyen, atık imha, bayram namazı güvenliği,
// ihtiyaç sahibi ailelere bayram yardımı koordinasyonu (Haziran 2026).

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";
import { doc, h2, h3, p, ul, ol, b, i } from "../rt";

export const kurbanBayramiProjesi: ProjeSeed = {
  key: "kurban",
  ad: "Kurban Bayramı Hazırlık ve Koordinasyonu",
  aciklama:
    "Tekman ilçesi genelinde Kurban Bayramı kesim yerlerinin tespiti, veteriner ve hijyen denetimi, atık imha protokolü, deri toplama, bayram namazı yer-zaman planlaması, kortej ve cami güvenliği ile ihtiyaç sahibi ailelere bayram gıda yardımı dağıtımının kaymakamlık makamı eşgüdümünde yürütülmesi.",
  olusturan: "muftu",
  yetkililer: ["kaymakam", "muftu", "saglikAmir", "belediyeAmir"],
  birimler: [
    "muftuluk",
    "saglik",
    "belediye",
    "tarim",
    "emniyet",
    "jandarma",
    "itfaiye",
    "mal",
    "sydv",
  ],
  kapakRenk: "yesil",
  kapakIkon: "moon",
  yildizli: false,
  listeler: [
    {
      ad: "Kesim Yerleri & Hijyen",
      yetkililer: ["belediyeAmir", "tarimAmir"],
      birimler: ["belediye", "tarim", "saglik"],
      kartlar: [
        {
          key: "kurban-kesim-yer",
          baslik: "Toplu kesim alanlarının tespiti ve onaya sunulması",
          aciklama:
            "Diyanet İşleri Başkanlığı ve Belediye ortak çalışmasıyla ilçe genelinde 6 toplu kesim alanı belirlenecek; alanlar Kaymakamlık makam onayına sunulacaktır. Şehir merkezinde belediye mezbahası, kırsalda 5 muhtarlık merkezi seçildi.",
          aciklamaDokuman: doc(
            h2("Yasal Dayanak"),
            p(
              "Diyanet İşleri Başkanlığı'nın ",
              b("2026/03 sayılı Kurban Hizmetleri Genelgesi"),
              " ve 5996 sayılı Veteriner Hizmetleri Kanunu çerçevesinde, ilçe sınırları içerisinde ",
              b("uygun olmayan yerlerde kurban kesimi yasaktır"),
              ". Belediye ile Müftülük ortak çalışmasıyla yeterli sayıda toplu kesim alanı tahsis edilecektir.",
            ),
            h3("Belirlenen Alanlar"),
            ul(
              "Tekman Belediye Mezbahası — şehir merkezi (kapasite 80 büyükbaş/gün)",
              "Karaağaç köyü muhtarlık avlusu — kuzey kırsal hat",
              "Doğanca köyü taziye evi yanı — güney kırsal hat",
              "Yolüstü köyü harman yeri — batı hat",
              "Yeniköy köyü cami arkası — doğu hat",
              "Demirkent köyü stadyum yanı — merkez köyler",
            ),
            h3("Onay Süreci"),
            p(
              "Alanların ",
              i("zemin sertliği, su erişimi, atık tahliye altyapısı"),
              " ve halka açıklık kriterleri Belediye Fen İşleri tarafından raporlanacak; rapor Sayın Kaymakamımızın onayına sunulacaktır.",
            ),
          ),
          etiketler: ["Kaymakamlık", "Saha"],
          yetkililer: ["belediyeAmir", "muftu"],
          birimler: ["belediye", "muftuluk"],
          baslangic: gunEkle(2),
          bitis: gunEkle(10, 17),
          kontrol: [
            {
              ad: "Saha tespiti",
              maddeler: [
                { metin: "Mezbaha kapasite raporu", atanan: "belediyeFenIsleri", tamam: true, tamamlanmaGun: -1 },
                { metin: "5 köy alanı zemin kontrolü", atanan: "belediyeFenIsleri" },
                { metin: "Müftülük ortak imza", atanan: "muftu" },
                { metin: "Kaymakam onayı", atanan: "ozelMemur" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "muftu",
              icerik:
                "Belirlenen 6 alanın 5'i Diyanet kriterlerine uygun. Demirkent stadyum yanı yağmurda çamurlaşıyor, alternatif olarak köy okul bahçesi düşünülebilir. @<belediyeAmir> görüşünüzü alalım.",
              gunFarki: 0,
              saat: 10,
            },
            {
              yazan: "belediyeAmir",
              icerik:
                "Demirkent için okul bahçesi uygun değil — eğitim alanı. Stadyum yanına 2 ton mıcır + drenaj kanalı yapacağız, perşembeye kadar zemin oturur. Mezbaha hattı şu an %80 dolu, bayrama hazır.",
              gunFarki: 0,
              saat: 14,
              yanit: 0,
            },
          ],
          ekler: [
            { ad: "kesim-alanlari-haritasi.pdf", mime: "application/pdf", boyut: 256_000, yukleyen: "belediyeFenIsleri" },
          ],
        },
        {
          key: "kurban-veteriner",
          baslik: "Veteriner kontrol ekipleri ve sağlık denetimi",
          aciklama:
            "İlçe Tarım ve Orman Müdürlüğü bünyesindeki 4 veteriner hekim, kesim alanlarında bayram boyunca rotasyonlu nöbet tutacak. Kesim öncesi büyükbaş ve küçükbaş hayvanların sağlık kontrolü, kulak küpesi/pasaport doğrulaması ve şarbon-tüberküloz taraması yapılacaktır.",
          aciklamaDokuman: doc(
            h2("Veteriner Nöbet Planı"),
            p(
              "İlçe Tarım ve Orman Müdürlüğü emrindeki ",
              b("4 veteriner hekim"),
              " ve 2 veteriner sağlık teknikeri, bayramın ",
              i("3 günü boyunca"),
              " 6 kesim alanına dönüşümlü olarak konuşlanacaktır.",
            ),
            h3("Denetim Kalemleri"),
            ul(
              "Kulak küpesi ve pasaport (TÜRKVET) doğrulaması",
              "Kesim öncesi klinik muayene (ateş, gözle muayene, hareket gözlemi)",
              "Şarbon, brusella, tüberküloz şüpheli hayvan tespiti",
              "Kesim sonrası karkas muayenesi ve sağlık raporu",
              "Hasta hayvan tespitinde kesimin durdurulması ve karantina",
            ),
            h3("Vatandaşa Çağrı"),
            p(
              "Kesilecek hayvanın küpesiz olması ",
              b("yasal işlem gerektirir"),
              ". Vatandaşlarımızın bayram öncesi hayvan satın alırken küpe ve pasaport bilgisini istemesi rica olunur.",
            ),
          ),
          etiketler: ["Sağlık", "Saha"],
          yetkililer: ["tarimAmir", "saglikAmir"],
          birimler: ["tarim", "saglik"],
          baslangic: gunEkle(15),
          bitis: gunEkle(35, 18),
          kontrol: [
            {
              ad: "Veteriner görevlendirme",
              maddeler: [
                { metin: "Nöbet çizelgesi hazırlanacak", atanan: "tarimAmir" },
                { metin: "Mobil muayene seti hazırlanacak", atanan: "tarimAmir" },
                { metin: "İl Müdürlüğü'nden ek teknisyen talebi", atanan: "tarimAmir" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "tarimAmir",
              icerik:
                "4 hekim mevcut nüfusa göre yeterli ama bayram öncesi hayvan girişi yoğun olduğu için il müdürlüğünden 2 ek tekniker istedik, sözlü onay alındı, resmi yazı çıkıyor.",
              gunFarki: 1,
              saat: 11,
            },
          ],
          ekler: [
            { ad: "veteriner-nobet-cizelgesi.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", boyut: 32_000 },
          ],
        },
        {
          key: "kurban-atik-imha",
          baslik: "Atık imha protokolü ve sakatat toplama planı",
          aciklama:
            "Belediye Temizlik İşleri ve İlçe Sağlık Müdürlüğü ortak protokolüyle, kesim sonrası iç organ ve kan atıklarının çevre ve halk sağlığı kurallarına uygun şekilde toplanması, taşınması ve imhası planlanacaktır. Yakma fırını yerine kireçli gömme tercih edilmektedir.",
          aciklamaDokuman: doc(
            h2("Atık Yönetimi"),
            p(
              "2872 sayılı Çevre Kanunu ve ",
              b("Atık Yönetimi Yönetmeliği"),
              " gereği, kesim atıkları açıkta bırakılamaz. Belediye temizlik araçları her kesim alanını ",
              i("2 saatte bir"),
              " devre alarak atık toplayacaktır.",
            ),
            h3("İmha Yöntemi"),
            ol(
              "Kan ve sıvı atıklar — drenaj kanalına; kireç eklemesi yapılacak",
              "İç organ atıkları — ağzı kapalı konteynerle Belediye atık alanına",
              "Atık alanında 1.5 metre derinlikte çukura dökülecek + sönmemiş kireç",
              "Üzeri 60 cm toprak ile örtülecek, koordinat kaydı tutulacak",
            ),
            h3("Halk Sağlığı"),
            p(
              "Vatandaşların kesim atıklarını ",
              b("sokak ve dere kenarlarına bırakması yasaktır"),
              ". Belediye Zabıta ekipleri uyarı ve gerektiğinde idari ceza uygulayacaktır.",
            ),
          ),
          etiketler: ["Sağlık", "Acil"],
          yetkililer: ["belediyeAmir", "saglikAmir"],
          birimler: ["belediye", "saglik"],
          bitis: gunEkle(38, 17),
        },
      ],
    },
    {
      ad: "Bayram Namazı & Güvenlik",
      yetkililer: ["muftu", "emniyetAmir"],
      birimler: ["muftuluk", "emniyet", "jandarma", "itfaiye"],
      kartlar: [
        {
          key: "kurban-bayram-namazi",
          baslik: "Bayram namazı yer ve zaman bilgisinin duyurusu",
          aciklama:
            "İlçe Müftülüğü bayram namazı saatini astronomi takvimine göre belirleyip, ilçe merkezi ve 38 köy camiisinin namaz yerini, vatandaşlara afiş, sosyal medya ve cami anonsları ile duyuracaktır. Açık alan namazı için stadyum hazırlığı yedek planda tutulmaktadır.",
          aciklamaDokuman: doc(
            h2("Namaz Vakti"),
            p(
              "Diyanet İşleri Başkanlığı namaz vakti hesaplamasına göre Tekman için ",
              b("güneş doğuşundan 45 dakika sonra"),
              " bayram namazı vaktine girilir. Kesin saat bayram öncesi 3 gün içinde Müftülük tarafından açıklanacaktır.",
            ),
            h3("Cami ve Açık Alan Listesi"),
            ul(
              "Tekman Merkez Cami — ana namaz yeri",
              "Yeni Cami, Kale Cami, Çarşı Cami — merkez yardımcı camiler",
              "38 köy cami — yerel imamların önderliğinde",
              "Tekman Stadyumu — havanın açık olması durumunda açık alan alternatifi (5.000 kişilik)",
            ),
            h3("Duyuru Kanalları"),
            ol(
              "Cami minarelerinden anons (3 gün önceden)",
              "Kaymakamlık ve Müftülük sosyal medya hesapları",
              "Belediye dijital tabela ekranları",
              "Mahalle ve köy muhtarlarına SMS bilgilendirme",
            ),
          ),
          etiketler: ["Kurumsal", "Yazışma"],
          yetkililer: ["muftu"],
          birimler: ["muftuluk"],
          baslangic: gunEkle(20),
          bitis: gunEkle(33, 12),
          kontrol: [
            {
              ad: "Duyuru hazırlığı",
              maddeler: [
                { metin: "Diyanet vakit hesabı doğrulandı", atanan: "muftu" },
                { metin: "Afiş tasarımı (matbaa)", atanan: "muftu" },
                { metin: "Sosyal medya duyurusu", atanan: "ozelMemur2" },
                { metin: "Köy muhtarlarına SMS", atanan: "ozelMemur" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "muftu",
              icerik:
                "Vakit Diyanet portalı ile teyit edildi, açıklamayı bayrama 5 gün kala yapacağız. @<belediyeAmir> dijital tabelalara giriş için tasarım dosyasını cuma akşam ileteceğim.",
              gunFarki: 1,
              saat: 9,
            },
          ],
        },
        {
          key: "kurban-namaz-guvenlik",
          baslik: "Cami çevresi güvenlik ve trafik düzenlemesi",
          aciklama:
            "İlçe Emniyet Amirliği merkez camileri çevresinde, İlçe Jandarma Komutanlığı köy camileri çevresinde bayram namazı saatinde güvenlik ve trafik düzenlemesi yapacaktır. Merkez Cami önündeki ana cadde namaz saati boyunca araç trafiğine kapatılacaktır.",
          aciklamaDokuman: doc(
            h2("Güvenlik Planı"),
            p(
              "Bayram namazı; bir araya gelen ",
              b("yoğun cemaat"),
              " ve sınırlı park alanı nedeniyle özel güvenlik ve trafik tedbirleri gerektirmektedir. Aşağıdaki düzenlemeler İlçe Emniyet ve Jandarma tarafından uygulanacaktır.",
            ),
            h3("Tedbirler"),
            ul(
              "Merkez Cami önü — namaz saatinden 30 dk önce trafiğe kapatma",
              "Çevre yollarda alternatif güzergah levhaları",
              "Cami giriş-çıkış noktalarında çift yönlü yaya yönlendirme",
              "Yangın söndürme aracı yakın bekleme — itfaiye",
              "112 ambulans nöbetçi araç merkez camide hazır kuvvet",
            ),
            h3("Köy Camileri"),
            p(
              "38 köy camisi için ",
              i("jandarma motorize ekibi"),
              " rotasyonel kontrole çıkacak; herhangi bir olağanüstü durumda telsiz ihbar zinciri devreye girer.",
            ),
          ),
          etiketler: ["Güvenlik", "Saha"],
          yetkililer: ["emniyetAmir", "jandarmaAmir"],
          birimler: ["emniyet", "jandarma", "itfaiye"],
          baslangic: gunEkle(28),
          bitis: gunEkle(33, 11),
        },
        {
          key: "kurban-fitre-koordinasyon",
          baslik: "Fitre miktarı ve toplama kanallarının koordinasyonu",
          aciklama:
            "Diyanet İşleri Başkanlığı'nın 2026 fitre miktarı açıklaması doğrultusunda, ilçemizdeki fitre toplama merkezi olan Müftülük + Türk Kızılay + camiler ortak çalışacak; toplanan fitreler SYDV ile koordineli şekilde ihtiyaç sahiplerine ulaştırılacaktır.",
          aciklamaDokuman: doc(
            h2("Fitre Koordinasyonu"),
            p(
              "Fitre, dini bir vecibe olmasının yanı sıra ",
              b("ihtiyaç sahibi vatandaşlarımıza ulaşan önemli bir sosyal yardım kanalıdır"),
              ". Toplanma ve dağıtım süreci şeffaf yürütülmelidir.",
            ),
            h3("Toplama Noktaları"),
            ul(
              "İlçe Müftülüğü — ana koordinasyon merkezi",
              "Türk Kızılay Tekman Şubesi",
              "Tüm cami imamları",
              "Online — Diyanet Vakfı portalı (vatandaş tercihi)",
            ),
            h3("Dağıtım"),
            p(
              "Toplanan fitreler, ",
              i("SYDV kayıtlı ihtiyaç sahibi listesi"),
              " esas alınarak ASDM koordinasyonuyla aile bazlı paket halinde dağıtılır.",
            ),
          ),
          etiketler: ["Sosyal Yardım", "Kurumsal"],
          yetkililer: ["muftu", "sydvMemur"],
          birimler: ["muftuluk", "sydv"],
          bitis: gunEkle(32, 18),
        },
      ],
    },
    {
      ad: "Bayram Yardımları",
      yetkililer: ["sydvMemur"],
      birimler: ["sydv", "mal"],
      kartlar: [
        {
          key: "kurban-yardim-paketi",
          baslik: "İhtiyaç sahibi ailelere bayram gıda paketi dağıtımı",
          aciklama:
            "Sosyal Yardımlaşma ve Dayanışma Vakfı (SYDV) bütçesinden 320 ihtiyaç sahibi aileye bayram özel gıda paketi dağıtımı planlanmıştır. Paket içeriği; et konservesi, pirinç, makarna, ayçiçek yağı, bulgur, baklagil ve şekerden oluşmakta; ek olarak çocuklu ailelere bayram harçlığı zarfı eklenmektedir.",
          aciklamaDokuman: doc(
            h2("Yardım Programı"),
            p(
              "3294 sayılı Sosyal Yardımlaşma ve Dayanışmayı Teşvik Kanunu çerçevesinde, ",
              b("SYDV mütevelli heyet kararı"),
              " ile bayram gıda paketi dağıtımı onaylanmıştır. Hedef: 320 aile, toplam bütçe 480.000 TL.",
            ),
            h3("Paket İçeriği"),
            ul(
              "Et konservesi (3 kutu)",
              "Pirinç (5 kg), makarna (2 paket), bulgur (3 kg)",
              "Ayçiçek yağı (5 lt), şeker (2 kg), baklagil (3 kg)",
              "Çocuklu hanelere — bayram harçlığı zarfı (50-150 TL)",
            ),
            h3("Dağıtım Planı"),
            ol(
              "SOSYAL-NET kayıtlı 320 aile listesi onaylandı",
              "Paketler bayrama 3 gün kala hazır olacak",
              "Bayramın 1. günü sabah saatlerinde dağıtım — eve teslim",
              "Köy ve uzak haneler için belediye + jandarma desteği",
            ),
          ),
          etiketler: ["Sosyal Yardım", "Saha"],
          yetkililer: ["sydvMemur", "sydvSosyalCalisan"],
          birimler: ["sydv", "asdm"],
          baslangic: gunEkle(18),
          bitis: gunEkle(33, 16),
          kontrol: [
            {
              ad: "Hazırlık",
              maddeler: [
                { metin: "Mütevelli heyet kararı", atanan: "sydvMemur", tamam: true, tamamlanmaGun: -2 },
                { metin: "İhale ve tedarik", atanan: "sydvMemur" },
                { metin: "Aile listesi son hali", atanan: "sydvSosyalCalisan" },
                { metin: "Dağıtım rotası", atanan: "sydvSosyalCalisan" },
              ],
            },
          ],
          yorumlar: [
            {
              yazan: "sydvMemur",
              icerik:
                "Mütevelli kararı geçti, ihale teklif toplama bu hafta. Geçen yıl 280 aile dağıtmıştık, bu yıl listeyi 320'ye çıkardık çünkü kayıt başvurusu artmış. @<kaymakam> bilgilerinize.",
              gunFarki: 2,
              saat: 13,
            },
          ],
          ekler: [
            { ad: "yardim-paketi-listesi.pdf", mime: "application/pdf", boyut: 184_000 },
          ],
        },
        {
          key: "kurban-deri-toplama",
          baslik: "Kurban derisi toplama — Türk Hava Kurumu koordinasyonu",
          aciklama:
            "Kurban derilerinin Türk Hava Kurumu (THK) tarafından toplanması için, ilçe genelinde 4 toplama noktası belirlenecek. Müftülük cami imamları aracılığıyla vatandaşları THK'ya bağış konusunda bilgilendirecek; toplanan deriler TIR ile İl Müdürlüğü'ne aktarılacaktır.",
          aciklamaDokuman: doc(
            h2("Deri Toplama"),
            p(
              "2860 sayılı Yardım Toplama Kanunu kapsamında, kurban derilerinin toplanması ",
              b("Türk Hava Kurumu (THK)"),
              " yetkisinde olup, gelir hava sporları ve havacılık eğitimine aktarılır.",
            ),
            h3("Toplama Noktaları"),
            ul(
              "Tekman Belediye otoparkı (merkez ana nokta)",
              "Yeni Mahalle pazaryeri girişi",
              "Karaağaç köyü muhtarlık avlusu",
              "Doğanca köyü cami yanı",
            ),
            h3("Operasyon"),
            p(
              "Toplama 3 gün boyunca yapılacak; ",
              i("THK'nın Erzurum'dan tahsis ettiği kamyon"),
              " bayramın 4. günü ilçeden ayrılacaktır. Vatandaşlar isterse derilerini doğrudan THK kapı bağışı olarak da verebilir.",
            ),
          ),
          etiketler: ["Kurumsal"],
          yetkililer: ["muftu", "belediyeAmir"],
          birimler: ["muftuluk", "belediye"],
          bitis: gunEkle(36, 17),
        },
      ],
    },
    {
      ad: "Tamamlananlar",
      kartlar: [
        {
          key: "kurban-kurul-toplanti",
          baslik: "İl Kurban Hizmetleri Kurulu ile koordinasyon toplantısı",
          aciklama:
            "Erzurum İl Kurban Hizmetleri Kurulu Tekman ilçe brifingi tamamlanmış, il koordinasyon kararları yerel uygulamaya alınmıştır. Toplantıda ilçemiz için 6 kesim alanı, 4 deri toplama noktası ve 320 aile yardım kotası teyit edilmiştir.",
          aciklamaDokuman: doc(
            h2("Toplantı Sonucu"),
            p(
              "İl Kurban Hizmetleri Kurulu kararıyla, Tekman ilçesi için belirlenen tüm kapasiteler ",
              b("onaylanmıştır"),
              ". İl müdürlüğü ek tekniker ve veteriner desteğini söz vermiştir.",
            ),
            ul(
              "6 kesim alanı — onaylandı",
              "4 deri toplama noktası — onaylandı",
              "320 aile yardım paketi — onaylandı",
              "İl bütçesinden ek 80.000 TL — tahsis edildi",
            ),
          ),
          etiketler: ["Kaymakamlık", "Kurumsal"],
          tamamlandi: true,
          yorumlar: [
            { yazan: "muftu", icerik: "Toplantı tutanağı arşive konuldu, il müdürlüğü ek tekniker desteğini verdi.", gunFarki: -3 },
          ],
        },
      ],
    },
  ],
};
