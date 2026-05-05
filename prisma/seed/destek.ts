// Destek verileri: bildirimler, davet/sıfırlama tokenleri, hata logu, aktivite logu.
// Sistemi "bir süredir kullanılıyor" hissi verecek yoğunlukta.

import type { PrismaClient } from "@prisma/client";
import type { SeedCtx } from "./tipler";
import { al, gunEkle } from "./yardimcilar";

export async function destekVerileriniYukle(db: PrismaClient, ctx: SeedCtx): Promise<void> {
  await bildirimleriYukle(db, ctx);
  await tokenleriYukle(db, ctx);
  await hataLogunuYukle(db, ctx);
  await aktiviteLogunuYukle(db, ctx);
}

async function bildirimleriYukle(db: PrismaClient, ctx: SeedCtx): Promise<void> {
  const admin = al(ctx.kullanicilar, "admin", "Kullanıcı");
  const kaymakam = al(ctx.kullanicilar, "kaymakam", "Kullanıcı");
  const ozelAmir = al(ctx.kullanicilar, "ozelAmir", "Kullanıcı");
  const ozelMemur = al(ctx.kullanicilar, "ozelMemur", "Kullanıcı");
  const yaziAmir = al(ctx.kullanicilar, "yaziAmir", "Kullanıcı");
  const yaziMemur = al(ctx.kullanicilar, "yaziMemur", "Kullanıcı");
  const milliAmir = al(ctx.kullanicilar, "milliAmir", "Kullanıcı");
  const milliMemur = al(ctx.kullanicilar, "milliMemur", "Kullanıcı");
  const milliRehber = al(ctx.kullanicilar, "milliRehber", "Kullanıcı");
  const saglikAmir = al(ctx.kullanicilar, "saglikAmir", "Kullanıcı");
  const saglikMemur = al(ctx.kullanicilar, "saglikMemur", "Kullanıcı");
  const sydvSosyalCalisan = al(ctx.kullanicilar, "sydvSosyalCalisan", "Kullanıcı");
  const sydvMemur = al(ctx.kullanicilar, "sydvMemur", "Kullanıcı");
  const emniyetAmir = al(ctx.kullanicilar, "emniyetAmir", "Kullanıcı");
  const trafikMemur = al(ctx.kullanicilar, "trafikMemur", "Kullanıcı");
  const tarimAmir = al(ctx.kullanicilar, "tarimAmir", "Kullanıcı");
  const koyMuhtar = al(ctx.kullanicilar, "koyMuhtar", "Kullanıcı");

  const krizMasasi = al(ctx.kartlar, "kis-kriz-masasi", "Kart");
  const yolDurumu = al(ctx.kartlar, "kis-yol-durumu", "Kart");
  const saglikNobet = al(ctx.kartlar, "kis-saglik-nobet", "Kart");
  const okulServis = al(ctx.kartlar, "okul-servis", "Kart");
  const okulDevamsizlik = al(ctx.kartlar, "okul-devamsizlik", "Kart");
  const evrakYardim = al(ctx.kartlar, "evrak-yardim-talebi", "Kart");
  const evrakAcikKapi = al(ctx.kartlar, "evrak-acik-kapi-engelli", "Kart");
  const sosyalKonut = al(ctx.kartlar, "sosyal-baş-004", "Kart");
  const sinavTrafik = al(ctx.kartlar, "sinav-trafik", "Kart");
  const torenProtokol = al(ctx.kartlar, "toren-protokol-davet", "Kart");
  const tarimSaha = al(ctx.kartlar, "tarim-saha-1", "Kart");
  const saglikUstSolunum = al(ctx.kartlar, "saglik-ust-solunum", "Kart");

  await db.bildirim.createMany({
    data: [
      // Yeni atama bildirimleri
      { alici_id: ozelMemur.id, ureten_id: admin.id, tip: "KART_YETKILI_ATAMA", baslik: "Sistem Yöneticisi sizi bir kartta yetkilendirdi", ozet: "Kış kriz masası görev dağılımını onayla", kart_id: krizMasasi.id, olusturma_zamani: gunEkle(-3, 10) },
      { alici_id: yaziMemur.id, ureten_id: yaziAmir.id, tip: "KART_YETKILI_ATAMA", baslik: "Selim Demir sizi bir kartta yetkilendirdi", ozet: "Valilik kış tedbirleri genelgesini ilgili kurumlara dağıt", olusturma_zamani: gunEkle(-2, 11) },
      { alici_id: milliMemur.id, ureten_id: milliAmir.id, tip: "KART_YETKILI_ATAMA", baslik: "Ayşe Çelik sizi bir kartta yetkilendirdi", ozet: "Servis güzergahı risk noktalarını işaretle", kart_id: okulServis.id, olusturma_zamani: gunEkle(-4, 9) },
      { alici_id: trafikMemur.id, ureten_id: emniyetAmir.id, tip: "KART_YETKILI_ATAMA", baslik: "Hakan Polat sizi bir kartta yetkilendirdi", ozet: "Sınav günü trafik düzenlemesi planı", kart_id: sinavTrafik.id, olusturma_zamani: gunEkle(-1, 13) },
      { alici_id: sydvSosyalCalisan.id, ureten_id: sydvMemur.id, tip: "KART_YETKILI_ATAMA", baslik: "Fatma Öztürk sizi bir kartta yetkilendirdi", ozet: "Konut tamir yardımı saha incelemesi", kart_id: sosyalKonut.id, olusturma_zamani: gunEkle(-2, 14) },

      // Bitiş tarihi yaklaşıyor / geçti
      { alici_id: ozelMemur.id, ureten_id: null, tip: "BITIS_YAKLASIYOR", baslik: "Kart bitiş tarihi yaklaşıyor", ozet: "Kış kriz masası görev dağılımını onayla", kart_id: krizMasasi.id, meta: { bitis: gunEkle(2, 17).toISOString() }, olusturma_zamani: gunEkle(-1, 8) },
      { alici_id: saglikMemur.id, ureten_id: null, tip: "BITIS_YAKLASIYOR", baslik: "Kart bitiş tarihi yaklaşıyor", ozet: "Acil sağlık nöbet çizelgesini yayınla", kart_id: saglikNobet.id, meta: { bitis: gunEkle(1, 15).toISOString() }, olusturma_zamani: gunEkle(0, 9) },
      { alici_id: yaziMemur.id, ureten_id: null, tip: "BITIS_GECTI", baslik: "Kart bitiş tarihi geçti", ozet: "Mahalle içi yol bakım talebine cevap yazısı", olusturma_zamani: gunEkle(0, 10) },

      // Mention bildirimleri
      { alici_id: emniyetAmir.id, ureten_id: ozelAmir.id, tip: "YORUM_MENTION", baslik: "Mehmet Yıldız sizden bahsetti", ozet: "@emniyetAmir trafik nöbetlerini ekleyebilir mi?", kart_id: krizMasasi.id, olusturma_zamani: gunEkle(-3, 11) },
      { alici_id: koyMuhtar.id, ureten_id: tarimAmir.id, tip: "YORUM_MENTION", baslik: "Faruk Can sizden bahsetti", ozet: "Karaağaç bitti, 38 hanede orta seviye buğday hasarı tespit edildi.", kart_id: tarimSaha.id, olusturma_zamani: gunEkle(-2, 14) },

      // Yorum eklendi
      { alici_id: ozelMemur.id, ureten_id: emniyetAmir.id, tip: "YORUM_EKLENDI", baslik: "Hakan Polat yorum yazdı", ozet: "Devriye saatleri eklendi, dosyayı paylaştım.", kart_id: krizMasasi.id, olusturma_zamani: gunEkle(-2, 15) },
      { alici_id: ozelAmir.id, ureten_id: kaymakam.id, tip: "YORUM_EKLENDI", baslik: "Murat Aksoy yorum yazdı", ozet: "Toplantıya tüm birim amirlerinin bizzat katılması gerekmektedir.", olusturma_zamani: gunEkle(-2, 9) },
      { alici_id: milliRehber.id, ureten_id: kaymakam.id, tip: "YORUM_EKLENDI", baslik: "Murat Aksoy yorum yazdı", ozet: "Bu dosyaların haftalık takibini istiyorum, her cuma rapor.", kart_id: okulDevamsizlik.id, olusturma_zamani: gunEkle(0, 10) },

      // Eklenti yüklendi
      { alici_id: ozelAmir.id, ureten_id: yaziMemur.id, tip: "EKLENTI_YUKLENDI", baslik: "Derya Şahin dosya yükledi", ozet: "valilik-genelgesi-2026-04.pdf", olusturma_zamani: gunEkle(-1, 11) },
      { alici_id: milliAmir.id, ureten_id: trafikMemur.id, tip: "EKLENTI_YUKLENDI", baslik: "Erdem Sönmez dosya yükledi", ozet: "risk-haritasi.png", kart_id: okulServis.id, olusturma_zamani: gunEkle(-2, 16) },

      // Madde ataması
      { alici_id: ozelMemur.id, ureten_id: ozelAmir.id, tip: "MADDE_ATAMA", baslik: "Mehmet Yıldız sizi bir maddeye atadı", ozet: "Kaymakam onayına sun", kart_id: krizMasasi.id, olusturma_zamani: gunEkle(-2, 10) },
      { alici_id: sydvSosyalCalisan.id, ureten_id: sydvMemur.id, tip: "MADDE_ATAMA", baslik: "Fatma Öztürk sizi bir maddeye atadı", ozet: "İlk hane ziyareti planlanacak", kart_id: okulDevamsizlik.id, olusturma_zamani: gunEkle(-1, 13) },

      // Okunmuş bildirimler
      { alici_id: kaymakam.id, ureten_id: ozelAmir.id, tip: "YORUM_EKLENDI", baslik: "Mehmet Yıldız yorum yazdı", ozet: "Taslak görev dağılımı hazır.", kart_id: krizMasasi.id, okundu_mu: true, okuma_zamani: gunEkle(-2, 18), olusturma_zamani: gunEkle(-3, 11) },
      { alici_id: ozelAmir.id, ureten_id: kaymakam.id, tip: "YORUM_EKLENDI", baslik: "Murat Aksoy yorum yazdı", ozet: "Akreditasyon listesini bizzat onaylayacağım.", kart_id: torenProtokol.id, okundu_mu: true, okuma_zamani: gunEkle(-1, 9), olusturma_zamani: gunEkle(-1, 8) },
      { alici_id: yaziAmir.id, ureten_id: yaziMemur.id, tip: "EKLENTI_YUKLENDI", baslik: "Derya Şahin dosya yükledi", ozet: "dilekce-tarama.pdf", kart_id: evrakYardim.id, okundu_mu: true, okuma_zamani: gunEkle(-2, 16), olusturma_zamani: gunEkle(-3, 14) },

      // Açık kapı bildirimi
      { alici_id: ozelAmir.id, ureten_id: kaymakam.id, tip: "KART_YETKILI_ATAMA", baslik: "Murat Aksoy sizi bir kartta yetkilendirdi", ozet: "Engelli rampası talebi — açık kapı 02.05.2026", kart_id: evrakAcikKapi.id, olusturma_zamani: gunEkle(-1, 11) },

      // Sağlık koordinasyon
      { alici_id: saglikAmir.id, ureten_id: kaymakam.id, tip: "YORUM_EKLENDI", baslik: "Murat Aksoy yorum yazdı", ozet: "Toplantıya tüm hastane idarecilerinin de katılmasını rica ediyorum.", kart_id: saglikUstSolunum.id, olusturma_zamani: gunEkle(-3, 10) },
    ],
  });
}

async function tokenleriYukle(db: PrismaClient, ctx: SeedCtx): Promise<void> {
  const admin = al(ctx.kullanicilar, "admin", "Kullanıcı");
  const kaymakam = al(ctx.kullanicilar, "kaymakam", "Kullanıcı");

  const personelRol = await db.rol.findUnique({ where: { kod: "PERSONEL" } });
  const birimAmiriRol = await db.rol.findUnique({ where: { kod: "BIRIM_AMIRI" } });

  // Davet tokenleri
  await db.davetTokeni.createMany({
    data: [
      {
        token: "seed-davet-muhtar-2026",
        email: "muhtar.adayi@tekman.gov.tr",
        birim_id: al(ctx.birimler, "muhtarlik", "Birim").id,
        rol_id: personelRol?.id,
        davet_eden_id: admin.id,
        son_kullanma: gunEkle(14),
      },
      {
        token: "seed-davet-itfaiye-2026",
        email: "yeni.itfaiyeci@tekman.bel.tr",
        birim_id: al(ctx.birimler, "itfaiye", "Birim").id,
        rol_id: personelRol?.id,
        davet_eden_id: kaymakam.id,
        son_kullanma: gunEkle(7),
      },
      {
        token: "seed-davet-asm-hekim",
        email: "yeni.aile.hekimi@tekman.gov.tr",
        birim_id: al(ctx.birimler, "asm", "Birim").id,
        rol_id: birimAmiriRol?.id,
        davet_eden_id: kaymakam.id,
        son_kullanma: gunEkle(10),
      },
      {
        token: "seed-davet-suresi-bitmis",
        email: "eski.davet@tekman.gov.tr",
        birim_id: al(ctx.birimler, "halkEgitim", "Birim").id,
        rol_id: personelRol?.id,
        davet_eden_id: admin.id,
        son_kullanma: gunEkle(-3),
      },
      {
        token: "seed-davet-kullanildi",
        email: "kullanilmis@tekman.gov.tr",
        birim_id: al(ctx.birimler, "yaziIsleri", "Birim").id,
        rol_id: personelRol?.id,
        davet_eden_id: admin.id,
        son_kullanma: gunEkle(20),
        kullanildi_mi: true,
        kullanim_zamani: gunEkle(-2, 14),
      },
    ],
  });

  // Sıfırlama tokenleri
  await db.sifirlamaTokeni.createMany({
    data: [
      {
        token: "seed-sifirlama-yazi-2026",
        kullanici_id: al(ctx.kullanicilar, "yaziMemur", "Kullanıcı").id,
        son_kullanma: gunEkle(1),
      },
      {
        token: "seed-sifirlama-saglik-2026",
        kullanici_id: al(ctx.kullanicilar, "saglikMemur", "Kullanıcı").id,
        son_kullanma: gunEkle(-1),
        kullanildi_mi: true,
      },
    ],
  });
}

async function hataLogunuYukle(db: PrismaClient, ctx: SeedCtx): Promise<void> {
  const admin = al(ctx.kullanicilar, "admin", "Kullanıcı");
  const ozel = al(ctx.kullanicilar, "ozelMemur", "Kullanıcı");
  const yazi = al(ctx.kullanicilar, "yaziMemur", "Kullanıcı");
  const milli = al(ctx.kullanicilar, "milliMemur", "Kullanıcı");
  const sydv = al(ctx.kullanicilar, "sydvMemur", "Kullanıcı");

  await db.hataLogu.createMany({
    data: [
      {
        seviye: "ERROR",
        taraf: "server",
        kullanici_id: admin.id,
        url: "/projeler",
        mesaj: "Geçici entegrasyon hatası — EBYS bağlantısı zaman aşımı",
        hata_tipi: "GatewayTimeout",
        http_metod: "GET",
        http_durum: 504,
        zaman: gunEkle(-7, 10),
      },
      {
        seviye: "WARN",
        taraf: "client",
        kullanici_id: ozel.id,
        url: "/bildirimler",
        mesaj: "Bildirim socket bağlantısı yeniden kuruldu",
        cozuldu_mu: true,
        cozum_notu: "Socket otomatik reconnect başarılı.",
        zaman: gunEkle(-5, 14),
      },
      {
        seviye: "ERROR",
        taraf: "server",
        kullanici_id: yazi.id,
        url: "/projeler/evrak/kart/evrak-yardim-talebi",
        mesaj: "PDF preview servisi cevap vermedi",
        hata_tipi: "ServiceUnavailable",
        http_metod: "GET",
        http_durum: 503,
        zaman: gunEkle(-3, 11),
      },
      {
        seviye: "INFO",
        taraf: "server",
        kullanici_id: admin.id,
        url: "/api/log/hata",
        mesaj: "Sistem health-check başarılı.",
        cozuldu_mu: true,
        zaman: gunEkle(-1, 9),
      },
      {
        seviye: "WARN",
        taraf: "client",
        kullanici_id: milli.id,
        url: "/projeler/okul",
        mesaj: "Drag-drop sırasında ağ kesintisi — değişiklik yerel kuyrukta tutuldu",
        cozuldu_mu: true,
        cozum_notu: "Reconnect sonrası sunucuya gönderildi.",
        zaman: gunEkle(-2, 16),
      },
      {
        seviye: "ERROR",
        taraf: "client",
        kullanici_id: sydv.id,
        url: "/projeler/sosyal/kart/sosyal-baş-004",
        mesaj: "Eklenti yükleme başarısız — boyut limiti aşıldı",
        hata_tipi: "PayloadTooLarge",
        http_metod: "POST",
        http_durum: 413,
        cozuldu_mu: true,
        cozum_notu: "Dosya sıkıştırılarak yeniden yüklendi.",
        zaman: gunEkle(-4, 13),
      },
      {
        seviye: "FATAL",
        taraf: "server",
        kullanici_id: null,
        url: "/api/cron/bildirim-tarama",
        mesaj: "Cron job başlatma hatası — DB pool yorgun",
        hata_tipi: "DatabasePoolExhausted",
        http_durum: 500,
        cozuldu_mu: true,
        cozum_notu: "Pool size artırıldı + auto-retry stratejisi devreye alındı.",
        zaman: gunEkle(-9, 3),
      },
    ],
  });
}

async function aktiviteLogunuYukle(db: PrismaClient, ctx: SeedCtx): Promise<void> {
  const admin = al(ctx.kullanicilar, "admin", "Kullanıcı");
  const kaymakam = al(ctx.kullanicilar, "kaymakam", "Kullanıcı");
  const ozel = al(ctx.kullanicilar, "ozelMemur", "Kullanıcı");
  const ozelAmir = al(ctx.kullanicilar, "ozelAmir", "Kullanıcı");
  const yaziAmir = al(ctx.kullanicilar, "yaziAmir", "Kullanıcı");
  const yaziMemur = al(ctx.kullanicilar, "yaziMemur", "Kullanıcı");
  const milliAmir = al(ctx.kullanicilar, "milliAmir", "Kullanıcı");
  const milliMemur = al(ctx.kullanicilar, "milliMemur", "Kullanıcı");
  const trafikMemur = al(ctx.kullanicilar, "trafikMemur", "Kullanıcı");
  const sydvMemur = al(ctx.kullanicilar, "sydvMemur", "Kullanıcı");
  const saglikAmir = al(ctx.kullanicilar, "saglikAmir", "Kullanıcı");
  const tarimAmir = al(ctx.kullanicilar, "tarimAmir", "Kullanıcı");

  const krizMasasi = al(ctx.kartlar, "kis-kriz-masasi", "Kart");
  const okulDevamsizlik = al(ctx.kartlar, "okul-devamsizlik", "Kart");
  const evrakYardim = al(ctx.kartlar, "evrak-yardim-talebi", "Kart");
  const sosyalSaha = al(ctx.kartlar, "sosyal-saha-haftalik", "Kart");
  const tarimSaha = al(ctx.kartlar, "tarim-saha-1", "Kart");
  const sinavTrafik = al(ctx.kartlar, "sinav-trafik", "Kart");

  await db.aktiviteLogu.createMany({
    data: [
      // Proje ve kart oluşturma
      { kullanici_id: admin.id, islem: "CREATE", kaynak_tip: "Proje", kaynak_id: krizMasasi.id, yeni_veri: { ad: "Kış Tedbirleri" }, zaman: gunEkle(-12, 9) },
      { kullanici_id: ozelAmir.id, islem: "CREATE", kaynak_tip: "Kart", kaynak_id: krizMasasi.id, yeni_veri: { baslik: "Kış kriz masası görev dağılımını onayla" }, zaman: gunEkle(-7, 10) },
      { kullanici_id: milliAmir.id, islem: "CREATE", kaynak_tip: "Kart", kaynak_id: okulDevamsizlik.id, yeni_veri: { baslik: "Kronik devamsızlık dosyalarını hane ziyaretiyle doğrula" }, zaman: gunEkle(-9, 11) },

      // Yetki atamaları
      { kullanici_id: yaziAmir.id, islem: "CREATE", kaynak_tip: "KartYetkilisi", kaynak_id: krizMasasi.id, yeni_veri: { kart_id: krizMasasi.id, kullanici_id: ozel.id }, zaman: gunEkle(-3, 12) },
      { kullanici_id: milliAmir.id, islem: "CREATE", kaynak_tip: "KartYetkilisi", kaynak_id: okulDevamsizlik.id, yeni_veri: { kart_id: okulDevamsizlik.id, kullanici_id: milliMemur.id }, zaman: gunEkle(-4, 14) },

      // Bitiş tarihi güncellemeleri
      { kullanici_id: ozel.id, islem: "UPDATE", kaynak_tip: "Kart", kaynak_id: krizMasasi.id, diff: { bitis: { eski: null, yeni: gunEkle(2, 17).toISOString() } }, zaman: gunEkle(-2, 14) },
      { kullanici_id: ozel.id, islem: "UPDATE", kaynak_tip: "Kart", kaynak_id: krizMasasi.id, diff: { aciklama: { eski: "Görev dağılımı netleşecek", yeni: "Nöbet listeleri ve müdahale matrisleri netleştirilecek." } }, zaman: gunEkle(-2, 15) },

      // Yorum eklemeleri
      { kullanici_id: ozelAmir.id, islem: "CREATE", kaynak_tip: "Yorum", kaynak_id: krizMasasi.id, yeni_veri: { kart_id: krizMasasi.id, icerik_uzunlugu: 86 }, zaman: gunEkle(-3, 11) },
      { kullanici_id: kaymakam.id, islem: "CREATE", kaynak_tip: "Yorum", kaynak_id: okulDevamsizlik.id, yeni_veri: { kart_id: okulDevamsizlik.id, icerik_uzunlugu: 64 }, zaman: gunEkle(0, 10) },

      // Eklenti yüklemeleri
      { kullanici_id: yaziMemur.id, islem: "CREATE", kaynak_tip: "Eklenti", kaynak_id: krizMasasi.id, yeni_veri: { ad: "valilik-genelgesi-2026-04.pdf", boyut: 312000 }, zaman: gunEkle(-1, 11) },
      { kullanici_id: trafikMemur.id, islem: "CREATE", kaynak_tip: "Eklenti", kaynak_id: sinavTrafik.id, yeni_veri: { ad: "risk-haritasi.png", boyut: 412000 }, zaman: gunEkle(-2, 16) },

      // Kart taşıma (drag-drop)
      { kullanici_id: ozelAmir.id, islem: "MOVE", kaynak_tip: "Kart", kaynak_id: krizMasasi.id, diff: { liste: { eski: "Planlama", yeni: "Saha Koordinasyonu" } }, sebep: "Yetkililer atandı, sahaya geçti", zaman: gunEkle(-5, 13) },

      // Liste sıralama
      { kullanici_id: ozelAmir.id, islem: "REORDER", kaynak_tip: "Liste", kaynak_id: null, diff: { sira: { eski: "X", yeni: "Y" } }, zaman: gunEkle(-6, 11) },

      // Birim ve yetkili işlemleri
      { kullanici_id: admin.id, islem: "CREATE", kaynak_tip: "ProjeYetkilisi", kaynak_id: null, yeni_veri: { proje_key: "kis", kullanici: "kaymakam" }, zaman: gunEkle(-12, 10) },
      { kullanici_id: admin.id, islem: "CREATE", kaynak_tip: "ProjeBirimi", kaynak_id: null, yeni_veri: { birim: "afad" }, zaman: gunEkle(-12, 10) },

      // Davet ve sıfırlama
      { kullanici_id: admin.id, islem: "CREATE", kaynak_tip: "DavetTokeni", kaynak_id: null, yeni_veri: { email: "muhtar.adayi@tekman.gov.tr" }, zaman: gunEkle(-1, 9) },
      { kullanici_id: admin.id, islem: "CREATE", kaynak_tip: "SifirlamaTokeni", kaynak_id: null, yeni_veri: { kullanici: "yaziMemur" }, zaman: gunEkle(-1, 11) },

      // SYDV — saha aktivitesi
      { kullanici_id: sydvMemur.id, islem: "UPDATE", kaynak_tip: "KontrolMaddesi", kaynak_id: sosyalSaha.id, diff: { tamamlandi_mi: { eski: false, yeni: true } }, zaman: gunEkle(-3, 16) },

      // Sağlık koordinasyon
      { kullanici_id: saglikAmir.id, islem: "CREATE", kaynak_tip: "KontrolListesi", kaynak_id: null, yeni_veri: { ad: "Hıfzıssıhha gündemi" }, zaman: gunEkle(-4, 10) },

      // Tarım — saha tespit
      { kullanici_id: tarimAmir.id, islem: "UPDATE", kaynak_tip: "Kart", kaynak_id: tarimSaha.id, diff: { aciklama_uzunlugu: { eski: 80, yeni: 120 } }, zaman: gunEkle(-2, 12) },

      // Yazı işleri evrak
      { kullanici_id: yaziMemur.id, islem: "CREATE", kaynak_tip: "Eklenti", kaynak_id: evrakYardim.id, yeni_veri: { ad: "dilekce-tarama.pdf" }, zaman: gunEkle(-3, 14) },

      // Login/logout
      { kullanici_id: kaymakam.id, islem: "LOGIN", kaynak_tip: "Kullanici", kaynak_id: kaymakam.id, ip: "10.10.5.21", user_agent: "Mozilla/5.0 (X11) Pusula/1.0", zaman: gunEkle(0, 8) },
      { kullanici_id: ozelAmir.id, islem: "LOGIN", kaynak_tip: "Kullanici", kaynak_id: ozelAmir.id, ip: "10.10.5.42", zaman: gunEkle(0, 9) },
      { kullanici_id: milliAmir.id, islem: "LOGIN", kaynak_tip: "Kullanici", kaynak_id: milliAmir.id, ip: "10.10.6.31", zaman: gunEkle(-1, 8) },
      { kullanici_id: kaymakam.id, islem: "LOGOUT", kaynak_tip: "Kullanici", kaynak_id: kaymakam.id, zaman: gunEkle(-1, 18) },
    ],
  });
}
