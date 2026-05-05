// Proje: İlçe Hıfzıssıhha Kurulu ve Sağlık Koordinasyonu
// İlçe Sağlık Müdürlüğü, hastane, ASM, eczane, halk sağlığı koordinasyonu.

import type { ProjeSeed } from "../tipler";
import { gunEkle } from "../yardimcilar";

export const saglikKoordinasyonProjesi: ProjeSeed = {
  key: "saglik",
  ad: "İlçe Hıfzıssıhha Kurulu ve Halk Sağlığı Koordinasyonu",
  aciklama:
    "Kaymakam başkanlığında aylık toplanan İlçe Hıfzıssıhha Kurulu kararlarının takibi, salgın izleme, halk sağlığı bilgilendirme.",
  olusturan: "saglikAmir",
  yetkililer: ["kaymakam", "saglikAmir", "hastaneBashekim", "asmDoktor"],
  birimler: ["saglik", "hastane", "asm", "tsm", "eczane", "milliEgitim", "belediye", "muftuluk"],
  kapakRenk: "kırmızı",
  kapakIkon: "stethoscope",
  yildizli: true,
  listeler: [
    {
      ad: "Hıfzıssıhha Kurulu",
      yetkililer: ["saglikAmir"],
      birimler: ["saglik"],
      kartlar: [
        {
          key: "saglik-hk-toplanti",
          baslik: "Mayıs Hıfzıssıhha Kurulu toplantısı — gündem hazırlığı",
          aciklama:
            "1593 sayılı Umumi Hıfzıssıhha Kanunu'nun 23. maddesi gereği Sayın Kaymakamımızın başkanlığında ayda bir defa toplanan İlçe Hıfzıssıhha Kurulu, Mayıs ayı olağan toplantısı için 12.05.2026 Cuma saat 14:00'te Kaymakamlık makamında gerçekleştirilecektir. Kurul üyeleri: Kaymakam (başkan), İlçe Sağlık Müdürü (sekreter), Tekman Devlet Hastanesi Başhekimi, Belediye Başkanı, İlçe Tarım ve Orman Müdürü, İlçe Milli Eğitim Müdürü, Müftü, Veteriner Hekim, Eczacılar Odası temsilcisi. Gündemde 7 ana başlık yer alacaktır: 1) Üst solunum yolu vakalarında %23 artış ve müdahale planı, 2) İçme suyu numune sonuçları (8 köy), 3) Ramazan sonrası halk sağlığı durumu, 4) Gıda işletmeleri rutin denetim raporu (12 işletme), 5) Sokak hayvanları aşılama ve kısırlaştırma programı (Belediye Veteriner), 6) Mevsimsel grip aşı programı, 7) Okul kantin denetim sonuçları. Hazırlık dokümanları İlçe Sağlık Müdürlüğü tarafından hazırlanmakta, üyelere 3 gün önceden iletilmektedir. Sayın Kaymakam toplantıya tüm üyelerin bizzat katılmasını istemiş, hastane idarecileri de gerekli gördükleri konuda söz alabilecektir. Toplantı tutanağı resmi karar olarak yayımlanır, kararlar Sağlık Bakanlığı Halk Sağlığı Genel Müdürlüğü'ne raporlanır. Toplantı odası, sunum ekranı ve ikram (su, kurabiye, çay) hazır tutulacaktır.",
          etiketler: ["Kaymakamlık", "Sağlık"],
          yetkililer: ["saglikAmir", "ozelMemur"],
          birimler: ["saglik", "ozelKalem"],
          bitis: gunEkle(7, 14),
          kontrol: [
            {
              ad: "Hazırlık",
              maddeler: [
                { metin: "Gündem maddeleri belirlendi", atanan: "saglikAmir", tamam: true },
                { metin: "Üye davet yazıları", atanan: "yaziMemur2", tamam: true },
                { metin: "Veri tabloları (TSM)", atanan: "saglikMemur" },
                { metin: "Toplantı odası ve ikram", atanan: "ozelMemur2", tamam: true },
                { metin: "Karar taslakları", atanan: "saglikAmir" },
              ],
            },
          ],
          yorumlar: [
            { yazan: "kaymakam", icerik: "Toplantıya tüm hastane idarecilerinin de katılmasını rica ediyorum.", gunFarki: -3 },
            { yazan: "hastaneBashekim", icerik: "Sayın Kaymakamım, bizzat katılacağım.", gunFarki: -3 },
          ],
          ekler: [
            { ad: "gundem-mayis-2026.pdf", mime: "application/pdf", boyut: 86_000, yukleyen: "saglikMemur" },
          ],
        },
        {
          key: "saglik-hk-su",
          baslik: "İçme suyu numune sonuçları — köy sular",
          aciklama:
            "İnsani Tüketim Amaçlı Sular Hakkında Yönetmelik kapsamında, ilçemizdeki 8 köyün (Karaağaç, Doğanca, Yolüstü, Yeniköy, Demirkent, Çayırlı, Akkayalar, Boyacı) içme suyu kaynaklarından TSM ekipleri tarafından mevsim numune ölçümü alınmıştır. Numuneler bakteriyolojik (E.coli, koliform), kimyasal (nitrat, sülfat, ağır metal), fiziksel (bulanıklık, pH, iletkenlik) parametrelerin tamamı için Erzurum Halk Sağlığı Laboratuvarı'na gönderilmiştir. Sonuçlar 7 iş günü içinde gelecektir. Geçen yıl Doğanca köyü kaynağında E.coli ve toplam koliform tespit edilmişti; klorlama sistemi yenilenmiş, takip numunelerinde düzelme görülmüştü. Bu yıl da klorlama cihazlarının çalışırlığı da denetlenmektedir. Numune sonuçları bağlı olarak Köy Hizmetleri Genel Müdürlüğü'ne raporlanır; problemli kaynaklar için belediye + KÖYDES projesinde dezenfeksiyon yatırımı planlaması yapılır. Kalitesiz su tespit edilen köylerde halka 'kaynatın+kullanın' uyarısı yapılır, alternatif olarak Belediye su tankeri devreye alınır. Numune sonuçları Hıfzıssıhha Kuruluna sunulacak; halk bilgilendirmesi için Kaymakamlık duyuru panosunda da yer alacaktır.",
          etiketler: ["Sağlık", "Saha"],
          yetkililer: ["saglikMemur"],
          birimler: ["tsm", "belediye"],
          bitis: gunEkle(4, 17),
          kontrol: [
            {
              ad: "Numuneler",
              maddeler: [
                { metin: "Karaağaç kaynak", atanan: "saglikMemur", tamam: true },
                { metin: "Doğanca kaynak", atanan: "saglikMemur", tamam: true },
                { metin: "Yolüstü kaynak", atanan: "saglikMemur" },
                { metin: "Sonuçlar tabloya işlenecek", atanan: "saglikMemur" },
              ],
            },
          ],
        },
      ],
    },
    {
      ad: "Salgın & Bulaşıcı Hastalık İzlem",
      yetkililer: ["asmDoktor"],
      birimler: ["asm", "hastane", "tsm"],
      kartlar: [
        {
          key: "saglik-ust-solunum",
          baslik: "Üst solunum yolu vakalarında artış — koordinasyon",
          aciklama:
            "Tekman Devlet Hastanesi acil servisi ve ASM'lerden alınan verilere göre son 2 haftada üst solunum yolu enfeksiyonu (URI) vaka sayısı %23 artmıştır. Vakaların büyük kısmı 5-12 yaş arası çocuklar ile 65+ yaş yaşlılarda yoğunlaşmaktadır. Hastane mikrobiyoloji laboratuvarı RSV, Influenza A/B ve Parainfluenza virüslerinin sezondan kalan döngüsü olarak tanımlamıştır. Müdahale planı kapsamında: 1) Tüm 12 okula 'havalandırma + el yıkama + maske önerisi' bilgilendirme afişi gönderilecek, 2) Kamu kurumlarında ortak alanlarda havalandırma sıklığı saatte 1'e yükseltilecek, 3) Halk Eğitim Merkezi salonu kullanım yoğunluğu azaltılacak, 4) Sosyal medya hesaplarından bilgilendirme paylaşımları yapılacak, 5) Sağlık Bakanlığı'nın 'önleyici sağlık' kampanyasına paralel halk afişi merkezi yerlere asılacak, 6) Hastane yatak doluluğu ve ilaç stoğu günlük takip edilecek. ASM seviyesinde hekimler, hastaların reçetesinde gereksiz antibiyotik kullanımını azaltma hedefi koyulmuştur. Hastane vaka sayısı raporu Hıfzıssıhha Kurulunda gündeme alınacaktır. Toplum genelinde panik yaratmaktan kaçınılacak, ancak risk grubu (yaşlı, kronik hasta, hamile) bireyler için kalabalık alanlarda maske önerisi resmen yapılmıştır.",
          etiketler: ["Sağlık", "Acil"],
          yetkililer: ["asmDoktor", "hastaneBashekim"],
          birimler: ["asm", "hastane", "milliEgitim"],
          bitis: gunEkle(3, 17),
          kontrol: [
            {
              ad: "Eylem",
              maddeler: [
                { metin: "Okullara bilgilendirme afişi", atanan: "milliMemur", tamam: true },
                { metin: "Halk Eğitim afişi", atanan: "halkEgitimMudur" },
                { metin: "Sosyal medya bilgilendirmesi", atanan: "saglikMemur" },
                { metin: "Hastane vaka sayısı raporu", atanan: "hastaneBashekim" },
              ],
            },
          ],
          yorumlar: [
            { yazan: "asmDoktor", icerik: "ASM düzeyinde maske öneriyoruz, kalabalık alanlarda dikkat.", gunFarki: -2 },
          ],
          ekler: [
            { ad: "vaka-istatistikleri.xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", boyut: 38_000, yukleyen: "saglikMemur" },
          ],
        },
        {
          key: "saglik-asi-takvimi",
          baslik: "Çocukluk dönemi aşı takvimi — dönem sonu eksikleri",
          aciklama:
            "Sağlık Bakanlığı Halk Sağlığı Genel Müdürlüğü'nün yıllık çocukluk dönemi aşı takvimi taraması yapılmış, ilçemizdeki ASM kayıtlarına göre 23 çocuğun (0-6 yaş aralığında) aşı takviminde eksik olduğu tespit edilmiştir. Eksik aşı türleri: 8 çocuğun BCG, 5 çocuğun Hepatit B, 4 çocuğun KKK (Kızamık-Kızamıkçık-Kabakulak), 3 çocuğun OPV, 2 çocuğun DBT-IPA-Hib hatırlatma, 1 çocuğun HPV. Eksiklik sebepleri büyük ölçüde aile-aşılama randevusu uyumsuzluğu ve kırsal kesimde ulaşım zorluğudur. Ailelere otomatik SMS bildirimi gönderilmiş, hatırlatılmamasına rağmen 11 aile randevu almamıştır; bu aileler ASM hekimleri tarafından telefonla aranacak, gerekirse evde aşılama hizmeti planlanacaktır. Aşı reddi olan ailelerde hekim danışmanlığı + aile mahkemesi yönlendirmesi (zorunluluk değil, mevzuat gereği bilgilendirme) yapılacaktır. Geçen yıl ilçemiz aşılama oranı %94 olmuş, hedef bu yıl %97'ye çıkartmaktır. Eksik aşılar Mayıs sonuna kadar tamamlandığında dönem hedefi karşılanmış olacaktır. Aşılama performansı il müdürlüğüne aylık raporlanmaktadır. Aşı zincirinin doğru çalışması için ASM buzdolabı sıcaklık logları her sabah kontrol edilmektedir.",
          etiketler: ["Sağlık"],
          yetkililer: ["asmDoktor"],
          birimler: ["asm"],
          bitis: gunEkle(8, 17),
        },
      ],
    },
    {
      ad: "Halk Sağlığı Bilgilendirme",
      yetkililer: ["halkEgitimMudur"],
      birimler: ["halkEgitim", "muftuluk", "tsm"],
      kartlar: [
        {
          key: "saglik-mufti-vaaz",
          baslik: "Cuma vaazı koordinasyonu — bağışıklık & beslenme",
          aciklama:
            "İlçe Müftülüğü ile İlçe Sağlık Müdürlüğü arasında periyodik olarak yürütülen 'Sağlıklı Yaşam Temalı Cuma Vaazı' programı kapsamında, bu hafta vaaz konusu 'Bağışıklığı Güçlendiren Beslenme ve Hijyen' olarak belirlenmiştir. Hutbe metninde yer alacak başlıklar: 1) Mevsim geçişlerinde dengeli beslenmenin önemi (taze sebze-meyve tüketimi, fast food'dan kaçınma), 2) Hijyen ve abdest arasındaki bağlantı (Peygamberimizin temizliğe verdiği önem), 3) Aşılamanın dini sakıncasının olmadığı (Diyanet İşleri Başkanlığı'nın resmi açıklamasıyla), 4) Yaşlı bakımı ve aile dayanışması, 5) Çocukların aşı takvimine uyum gösterme zorunluluğu. Hutbe taslağı Diyanet İşleri Başkanlığı'na bildirilerek onay alınacak, sonra ilçedeki tüm 18 camide aynı içerikte okunacaktır. Sayın Müftümüz hutbe taslağını bu akşam diyanete iletecektir. Cuma vaazı sosyal medyaya da kısa video kliplerle yansıtılarak vatandaşa daha geniş ulaşılması hedeflenmektedir. Bu programın geçen yılki etkisi sağlık kuruluşlarına müracaat sayısında %12 artış olarak ölçülmüştür; sağlığa yönelik bilgilendirme cami minberinden yapıldığında etki açıkça görülmektedir.",
          etiketler: ["Sağlık", "Kurumsal"],
          yetkililer: ["muftu"],
          birimler: ["muftuluk"],
          bitis: gunEkle(2, 12),
          yorumlar: [
            { yazan: "muftu", icerik: "Hutbe taslağı bu akşam diyanete iletilecek.", gunFarki: -1 },
          ],
        },
        {
          key: "saglik-egitim-okul",
          baslik: "Okul hijyen eğitimi — 1. ve 2. sınıflar",
          aciklama:
            "Tekman ilçesinde 5 ilkokul (Cumhuriyet İlkokulu, Karaağaç köy ilkokulu, Doğanca köy ilkokulu, Yolüstü köy ilkokulu, Yeniköy ilkokulu) bünyesinde 1. ve 2. sınıflara yönelik 'Temizliğin İmandan Geliyor Olduğu' programlı 'el hijyeni' eğitimi düzenlenecektir. Toplam 1.500 öğrenciye, 5 hafta süreyle haftada 1 ders saati olmak üzere ASM aile hekimleri ve hemşireler tarafından eğitim verilecektir. Eğitim modülleri: el yıkama tekniği (yaklaşık 20 saniye, sabunlu su, parmak araları), öksürük-hapşırık adabı (dirsek bükerek), sıvı tüketim alışkanlığı, yemekten önce/sonra el yıkama, oyuncak temizliği, evcil hayvan dokunması sonrası temizlik, banyo/sınav-kantin sonrası ellerin temizlenmesi. Görsel materyaller (poster, çıkartma) Sağlık Bakanlığı Halk Sağlığı Genel Müdürlüğü materyallerinden alınmıştır. Ayrıca 'Ulu mikrop avcısı' başlıklı çocuk dostu animasyon video projeksiyondan izlettirilecek. Eğitim sonrası test (5 soru, görsel) yapılarak öğrencilerin ne kadar bilgi aldığı ölçülecektir. Veliler için aile bilgilendirme broşürü dağıtılacak, eğitim videosunun YouTube linki sınıf WhatsApp gruplarına paylaşılacaktır. Hijyen eğitiminin uzun vadeli etkisi, okul revir başvuru sayısının azalmasıyla ölçülecektir.",
          etiketler: ["Sağlık", "Eğitim"],
          yetkililer: ["asmDoktor", "milliRehber"],
          birimler: ["asm", "milliEgitim"],
          bitis: gunEkle(13, 17),
        },
      ],
    },
    {
      ad: "Eczane & İlaç",
      yetkililer: ["saglikMemur"],
      birimler: ["eczane", "saglik"],
      kartlar: [
        {
          key: "saglik-nobet-eczane",
          baslik: "Mayıs nöbetçi eczane çizelgesi yayınlandı",
          aciklama:
            "Tekman ilçesindeki 4 eczane (Kardelen, Yıldız, Şifa, Merkez) için Mayıs ayı nöbetçi çizelgesi Eczacı Odası işbirliğiyle hazırlanmış ve İl Sağlık Müdürlüğü portalında yayınlanmıştır. Çizelge prensipleri: 24 saat eczane bulunması zorunluluğu, hafta sonu nöbet rotasyonu, dini bayram günlerinde özel sıralama, halk sağlığı mahallesi öncelikli açık olma. Mayıs ayı boyunca her gece bir eczane nöbetçi olarak hizmet verecek; nöbet bilgileri Kaymakamlık web sitesi, ilçe gazetesi, hastane acil servis koridoru, mahalle muhtarlık panoları ve sosyal medya hesaplarında ilan edilmiştir. Geçen yıl yayın hatasından dolayı vatandaş yanlış eczaneye yönlendirilmiş, ailenin acil ilaç ihtiyacı geç karşılanmıştı; o olay sonrası çift kontrol prosedürü uygulanmaktadır.",
          etiketler: ["Sağlık"],
          tamamlandi: true,
        },
        {
          key: "saglik-temel-ilac",
          baslik: "Acil ilaç stoğu denetimi — 4 eczane",
          aciklama:
            "Sağlık Bakanlığı'nın 'Eczanelerde Bulundurulması Zorunlu Acil İlaç Listesi' tebliği kapsamında, ilçemizdeki 4 eczanede stok denetimi yapılacaktır. Denetim ekibi: İlçe Sağlık Müdürlüğü ilaç denetim memuru + Eczacı Odası temsilcisi. Kontrol edilecek ilaç kalemleri: insülin (acil hipoglisemik), epinefrin enjektör (anafilaksi), nitrogliserin (kalp krizi), salbutamol (astım), atropin (intoksikasyon), naloksen (opioid intoksikasyonu), aktif kömür (zehirlenme), antibiyotik (geniş spektrum), ağrı kesici (parasetamol-ibuprofen), antipiretik (ateş düşürücü). Eksikliği tespit edilen eczanelere 'tespit tutanağı' düzenlenir; 7 gün içinde stok temin etmeleri istenir. Tekrar denetimde eksik bulunursa cezai işlem uygulanır. Geçen denetimde 1 eczanede insülin stoğu tükenmek üzereydi; tedarik tamamlanmıştı. Eczacı Odası, ilçe çapında ortak stok platformu kullanılması önerisi getirmiştir; pilot olarak değerlendirilecektir.",
          etiketler: ["Sağlık"],
          yetkililer: ["saglikMemur"],
          birimler: ["eczane"],
          bitis: gunEkle(6, 17),
        },
      ],
    },
  ],
};
