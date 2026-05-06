-- CreateEnum
CREATE TYPE "DosyaKategori" AS ENUM ('GORSEL', 'PDF', 'OFIS_BELGESI', 'TABLO', 'SUNUM', 'METIN', 'ARSIV', 'DIGER');

-- CreateEnum
CREATE TYPE "DosyaDurumu" AS ENUM ('YUKLENIYOR', 'HAZIR', 'KARANTINA', 'HATALI');

-- CreateEnum
CREATE TYPE "DosyaGizlilik" AS ENUM ('NORMAL', 'HASSAS', 'GIZLI');

-- CreateEnum
CREATE TYPE "DosyaKaynakTipi" AS ENUM ('PROJE', 'LISTE', 'KART', 'YORUM', 'KONTROL_MADDESI', 'KULLANICI', 'BIRIM');

-- CreateEnum
CREATE TYPE "DosyaIslemeDurumu" AS ENUM ('BEKLIYOR', 'ISLENIYOR', 'TAMAMLANDI', 'BASARISIZ', 'ATLANDI');

-- CreateEnum
CREATE TYPE "DosyaErisimTipi" AS ENUM ('ONIZLEME', 'INDIRME', 'PAYLASIM');

-- AlterEnum: önceki migration 20260510000000_dosya_izin_kategori_enum'da
-- yapıldı (Postgres ADD VALUE yeni değeri aynı transaction'da kullandırmaz).

-- CreateTable
CREATE TABLE "Dosya" (
    "id" UUID NOT NULL,
    "yukleyen_id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "mime" TEXT NOT NULL,
    "uzanti" TEXT,
    "kategori" "DosyaKategori" NOT NULL,
    "boyut" INTEGER NOT NULL,
    "hash_sha256" TEXT,
    "aktif_surum_id" UUID,
    "bucket" TEXT NOT NULL,
    "depolama_yolu" TEXT NOT NULL,
    "thumbnail_yolu" TEXT,
    "onizleme_yolu" TEXT,
    "metin_icerik" TEXT,
    "durum" "DosyaDurumu" NOT NULL DEFAULT 'YUKLENIYOR',
    "gizlilik" "DosyaGizlilik" NOT NULL DEFAULT 'NORMAL',
    "virus_tarama_durumu" "DosyaIslemeDurumu" NOT NULL DEFAULT 'BEKLIYOR',
    "onizleme_durumu" "DosyaIslemeDurumu" NOT NULL DEFAULT 'BEKLIYOR',
    "metin_cikarma_durumu" "DosyaIslemeDurumu" NOT NULL DEFAULT 'BEKLIYOR',
    "indirme_sayisi" INTEGER NOT NULL DEFAULT 0,
    "son_indirme_zamani" TIMESTAMP(3),
    "silindi_mi" BOOLEAN NOT NULL DEFAULT false,
    "silinme_zamani" TIMESTAMP(3),
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,
    "arama_vektoru" tsvector,

    CONSTRAINT "Dosya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DosyaSurumu" (
    "id" UUID NOT NULL,
    "dosya_id" UUID NOT NULL,
    "surum_no" INTEGER NOT NULL,
    "yukleyen_id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "boyut" INTEGER NOT NULL,
    "hash_sha256" TEXT,
    "bucket" TEXT NOT NULL,
    "depolama_yolu" TEXT NOT NULL,
    "aciklama" TEXT,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DosyaSurumu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DosyaBaglantisi" (
    "id" UUID NOT NULL,
    "dosya_id" UUID NOT NULL,
    "kaynak_tip" "DosyaKaynakTipi" NOT NULL,
    "kaynak_id" UUID NOT NULL,
    "proje_id" UUID,
    "liste_id" UUID,
    "kart_id" UUID,
    "ekleyen_id" UUID NOT NULL,
    "birincil_mi" BOOLEAN NOT NULL DEFAULT false,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DosyaBaglantisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DosyaEtiketi" (
    "id" UUID NOT NULL,
    "proje_id" UUID,
    "ad" TEXT NOT NULL,
    "renk" TEXT,
    "olusturan_id" UUID,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DosyaEtiketi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DosyaEtiketBaglantisi" (
    "dosya_id" UUID NOT NULL,
    "etiket_id" UUID NOT NULL,

    CONSTRAINT "DosyaEtiketBaglantisi_pkey" PRIMARY KEY ("dosya_id","etiket_id")
);

-- CreateTable
CREATE TABLE "DosyaYuklemeOturumu" (
    "id" UUID NOT NULL,
    "kullanici_id" UUID NOT NULL,
    "kaynak_tip" "DosyaKaynakTipi" NOT NULL,
    "kaynak_id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "boyut" INTEGER NOT NULL,
    "depolama_yolu" TEXT NOT NULL,
    "durum" "DosyaDurumu" NOT NULL DEFAULT 'YUKLENIYOR',
    "hata" TEXT,
    "son_kullanma" TIMESTAMP(3) NOT NULL,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DosyaYuklemeOturumu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DosyaErisimLogu" (
    "id" BIGSERIAL NOT NULL,
    "dosya_id" UUID NOT NULL,
    "kullanici_id" UUID,
    "tip" "DosyaErisimTipi" NOT NULL,
    "request_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "zaman" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DosyaErisimLogu_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dosya_yukleyen_id_olusturma_zamani_idx" ON "Dosya"("yukleyen_id", "olusturma_zamani" DESC);

-- CreateIndex
CREATE INDEX "Dosya_kategori_olusturma_zamani_idx" ON "Dosya"("kategori", "olusturma_zamani" DESC);

-- CreateIndex
CREATE INDEX "Dosya_mime_idx" ON "Dosya"("mime");

-- CreateIndex
CREATE INDEX "Dosya_boyut_idx" ON "Dosya"("boyut");

-- CreateIndex
CREATE INDEX "Dosya_durum_idx" ON "Dosya"("durum");

-- CreateIndex
CREATE INDEX "Dosya_gizlilik_idx" ON "Dosya"("gizlilik");

-- CreateIndex
CREATE INDEX "Dosya_silindi_mi_olusturma_zamani_idx" ON "Dosya"("silindi_mi", "olusturma_zamani" DESC);

-- CreateIndex
CREATE INDEX "Dosya_hash_sha256_idx" ON "Dosya"("hash_sha256");

-- CreateIndex
CREATE INDEX "Dosya_arama_vektoru_idx" ON "Dosya" USING GIN ("arama_vektoru");

-- CreateIndex
CREATE INDEX "Dosya_ad_trgm_idx" ON "Dosya" USING GIN ("ad" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "DosyaSurumu_dosya_id_olusturma_zamani_idx" ON "DosyaSurumu"("dosya_id", "olusturma_zamani" DESC);

-- CreateIndex
CREATE INDEX "DosyaSurumu_hash_sha256_idx" ON "DosyaSurumu"("hash_sha256");

-- CreateIndex
CREATE UNIQUE INDEX "DosyaSurumu_dosya_id_surum_no_key" ON "DosyaSurumu"("dosya_id", "surum_no");

-- CreateIndex
CREATE INDEX "DosyaBaglantisi_kaynak_tip_kaynak_id_idx" ON "DosyaBaglantisi"("kaynak_tip", "kaynak_id");

-- CreateIndex
CREATE INDEX "DosyaBaglantisi_proje_id_idx" ON "DosyaBaglantisi"("proje_id");

-- CreateIndex
CREATE INDEX "DosyaBaglantisi_liste_id_idx" ON "DosyaBaglantisi"("liste_id");

-- CreateIndex
CREATE INDEX "DosyaBaglantisi_kart_id_idx" ON "DosyaBaglantisi"("kart_id");

-- CreateIndex
CREATE INDEX "DosyaBaglantisi_dosya_id_idx" ON "DosyaBaglantisi"("dosya_id");

-- CreateIndex
CREATE UNIQUE INDEX "DosyaBaglantisi_dosya_id_kaynak_tip_kaynak_id_key" ON "DosyaBaglantisi"("dosya_id", "kaynak_tip", "kaynak_id");

-- CreateIndex
CREATE INDEX "DosyaEtiketi_ad_idx" ON "DosyaEtiketi"("ad");

-- CreateIndex
CREATE UNIQUE INDEX "DosyaEtiketi_proje_id_ad_key" ON "DosyaEtiketi"("proje_id", "ad");

-- CreateIndex
CREATE INDEX "DosyaEtiketBaglantisi_etiket_id_idx" ON "DosyaEtiketBaglantisi"("etiket_id");

-- CreateIndex
CREATE INDEX "DosyaYuklemeOturumu_kullanici_id_olusturma_zamani_idx" ON "DosyaYuklemeOturumu"("kullanici_id", "olusturma_zamani" DESC);

-- CreateIndex
CREATE INDEX "DosyaYuklemeOturumu_durum_son_kullanma_idx" ON "DosyaYuklemeOturumu"("durum", "son_kullanma");

-- CreateIndex
CREATE INDEX "DosyaErisimLogu_dosya_id_zaman_idx" ON "DosyaErisimLogu"("dosya_id", "zaman" DESC);

-- CreateIndex
CREATE INDEX "DosyaErisimLogu_kullanici_id_zaman_idx" ON "DosyaErisimLogu"("kullanici_id", "zaman" DESC);

-- CreateIndex
CREATE INDEX "DosyaErisimLogu_tip_zaman_idx" ON "DosyaErisimLogu"("tip", "zaman" DESC);

-- AddForeignKey
ALTER TABLE "Dosya" ADD CONSTRAINT "Dosya_yukleyen_id_fkey" FOREIGN KEY ("yukleyen_id") REFERENCES "Kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DosyaSurumu" ADD CONSTRAINT "DosyaSurumu_dosya_id_fkey" FOREIGN KEY ("dosya_id") REFERENCES "Dosya"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DosyaSurumu" ADD CONSTRAINT "DosyaSurumu_yukleyen_id_fkey" FOREIGN KEY ("yukleyen_id") REFERENCES "Kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DosyaBaglantisi" ADD CONSTRAINT "DosyaBaglantisi_dosya_id_fkey" FOREIGN KEY ("dosya_id") REFERENCES "Dosya"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DosyaBaglantisi" ADD CONSTRAINT "DosyaBaglantisi_ekleyen_id_fkey" FOREIGN KEY ("ekleyen_id") REFERENCES "Kullanici"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DosyaEtiketBaglantisi" ADD CONSTRAINT "DosyaEtiketBaglantisi_dosya_id_fkey" FOREIGN KEY ("dosya_id") REFERENCES "Dosya"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DosyaEtiketBaglantisi" ADD CONSTRAINT "DosyaEtiketBaglantisi_etiket_id_fkey" FOREIGN KEY ("etiket_id") REFERENCES "DosyaEtiketi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DosyaErisimLogu" ADD CONSTRAINT "DosyaErisimLogu_dosya_id_fkey" FOREIGN KEY ("dosya_id") REFERENCES "Dosya"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- ADR-0028 — Dosya tsvector trigger (Prisma native ifade etmez)
-- ADR-0017 desenine uyar: setweight(A) ad, setweight(B) aciklama
-- F8'de etiketler ve metin_icerik için zenginleştirilecek
-- ============================================================

CREATE OR REPLACE FUNCTION arama_vektoru_dosya_guncelle() RETURNS trigger AS $$
BEGIN
  NEW."arama_vektoru" :=
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.ad, '')), 'A') ||
    setweight(to_tsvector('pusula_turkish', coalesce(NEW.aciklama, '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE TRIGGER dosya_arama_vektoru_trigger
  BEFORE INSERT OR UPDATE OF ad, aciklama ON "Dosya"
  FOR EACH ROW EXECUTE FUNCTION arama_vektoru_dosya_guncelle();

-- ============================================================
-- ADR-0028 — Dosya yönetimi izinleri (19 adet)
-- Idempotent: ON CONFLICT DO UPDATE — re-run güvenli
-- ============================================================

INSERT INTO "Izin" ("id", "kod", "ad", "aciklama", "kategori", "alt_kategori")
VALUES
  (gen_random_uuid(), 'dosya:oku', 'Dosyaları Görüntüle', 'Erişebildiği dosyaların listesini ve metadata''sını görme', 'DOSYA'::"IzinKategorisi", NULL),
  (gen_random_uuid(), 'dosya:yukle', 'Dosya Yükle', 'Bir karta, projeye veya listeye yeni dosya yükleme', 'DOSYA'::"IzinKategorisi", NULL),
  (gen_random_uuid(), 'dosya:indir', 'Dosyayı İndir', 'Erişebildiği dosyanın binary içeriğini indirme', 'DOSYA'::"IzinKategorisi", NULL),
  (gen_random_uuid(), 'dosya:onizle', 'Dosyayı Önizle', 'Görsel/PDF/metin dosyalarını tarayıcı içinde açma', 'DOSYA'::"IzinKategorisi", NULL),
  (gen_random_uuid(), 'dosya:duzenle-ad', 'Dosya Adını Düzenle', 'Yüklenmiş bir dosyanın görünen adını değiştirme', 'DOSYA'::"IzinKategorisi", 'duzenle'),
  (gen_random_uuid(), 'dosya:duzenle-aciklama', 'Dosya Açıklamasını Düzenle', 'Dosyaya açıklama ekleme veya değiştirme', 'DOSYA'::"IzinKategorisi", 'duzenle'),
  (gen_random_uuid(), 'dosya:gizlilik-duzenle', 'Dosya Gizliliğini Düzenle', 'Dosyayı NORMAL/HASSAS/GIZLI olarak işaretleme', 'DOSYA'::"IzinKategorisi", 'duzenle'),
  (gen_random_uuid(), 'dosya.etiket:ata', 'Dosyaya Etiket Ata', 'Var olan dosya etiketlerini bir dosyaya ekleme/çıkarma', 'DOSYA'::"IzinKategorisi", 'etiket'),
  (gen_random_uuid(), 'dosya.etiket:yonet', 'Dosya Etiketlerini Yönet', 'Dosya etiketi oluşturma, düzenleme ve silme', 'DOSYA'::"IzinKategorisi", 'etiket'),
  (gen_random_uuid(), 'dosya.baglanti:ekle', 'Dosyayı Bir Kaynağa Bağla', 'Bir dosyayı karta, projeye veya listeye bağlama', 'DOSYA'::"IzinKategorisi", 'baglanti'),
  (gen_random_uuid(), 'dosya.baglanti:kaldir', 'Dosya Bağlantısını Kaldır', 'Bir dosyanın bir kaynaktan bağlantısını çıkarma (dosya kalır)', 'DOSYA'::"IzinKategorisi", 'baglanti'),
  (gen_random_uuid(), 'dosya.surum:yukle', 'Yeni Dosya Sürümü Yükle', 'Var olan dosyanın üzerine yeni sürüm yükleme', 'DOSYA'::"IzinKategorisi", 'surum'),
  (gen_random_uuid(), 'dosya:kendi-sil', 'Kendi Dosyanı Sil', 'Kullanıcının kendisinin yüklediği dosyayı çöp kutusuna gönderme', 'DOSYA'::"IzinKategorisi", 'silme'),
  (gen_random_uuid(), 'dosya:baska-sil', 'Başkasının Dosyasını Sil', 'Başka bir kullanıcının yüklediği dosyayı silme (moderasyon)', 'DOSYA'::"IzinKategorisi", 'silme'),
  (gen_random_uuid(), 'dosya:geri-yukle', 'Silinmiş Dosyayı Geri Yükle', 'Çöp kutusundaki dosyayı geri getirme', 'DOSYA'::"IzinKategorisi", 'silme'),
  (gen_random_uuid(), 'dosya:kalici-sil', 'Dosyayı Kalıcı Olarak Sil', 'Storage''dan ve veritabanından geri dönüşsüz silme (yalnız makam)', 'DOSYA'::"IzinKategorisi", 'silme'),
  (gen_random_uuid(), 'dosya:toplu-islem', 'Dosyalarda Toplu İşlem', 'Birden fazla dosyada toplu silme/etiketleme/indirme', 'DOSYA'::"IzinKategorisi", 'toplu'),
  (gen_random_uuid(), 'dosya:guvenlik-yonet', 'Dosya Güvenlik Yönetimi', 'Karantina/HASSAS/GIZLI dosyaları görme, virüs tarama akışını yönetme', 'DOSYA'::"IzinKategorisi", 'guvenlik'),
  (gen_random_uuid(), 'dosya:disa-aktar', 'Dosya Listesini Dışa Aktar', 'Filtreye uyan dosya metadata''sını CSV olarak dışa aktarma', 'DOSYA'::"IzinKategorisi", 'toplu')
ON CONFLICT ("kod") DO UPDATE SET
  "ad" = EXCLUDED."ad",
  "aciklama" = EXCLUDED."aciklama",
  "kategori" = EXCLUDED."kategori",
  "alt_kategori" = EXCLUDED."alt_kategori";

-- ============================================================
-- ADR-0028 — Sistem rollerine varsayılan dosya izinleri
-- ============================================================

-- KAYMAKAM ve SUPER_ADMIN: tüm 19 dosya izni
INSERT INTO "RolIzin" ("rol_id", "izin_id")
SELECT r."id", i."id"
FROM "Rol" r
CROSS JOIN "Izin" i
WHERE r."kod" IN ('KAYMAKAM', 'SUPER_ADMIN')
  AND i."kod" IN (
    'dosya:oku', 'dosya:yukle', 'dosya:indir', 'dosya:onizle',
    'dosya:duzenle-ad', 'dosya:duzenle-aciklama', 'dosya:gizlilik-duzenle',
    'dosya.etiket:ata', 'dosya.etiket:yonet',
    'dosya.baglanti:ekle', 'dosya.baglanti:kaldir',
    'dosya.surum:yukle',
    'dosya:kendi-sil', 'dosya:baska-sil', 'dosya:geri-yukle', 'dosya:kalici-sil',
    'dosya:toplu-islem', 'dosya:guvenlik-yonet', 'dosya:disa-aktar'
  )
ON CONFLICT DO NOTHING;

-- BIRIM_AMIRI: PERSONEL kümesi + (gizlilik, etiket-yonet, baglanti-kaldir, baska-sil, geri-yukle, toplu-islem, disa-aktar)
INSERT INTO "RolIzin" ("rol_id", "izin_id")
SELECT r."id", i."id"
FROM "Rol" r
CROSS JOIN "Izin" i
WHERE r."kod" = 'BIRIM_AMIRI'
  AND i."kod" IN (
    'dosya:oku', 'dosya:yukle', 'dosya:indir', 'dosya:onizle',
    'dosya:duzenle-ad', 'dosya:duzenle-aciklama', 'dosya:gizlilik-duzenle',
    'dosya.etiket:ata', 'dosya.etiket:yonet',
    'dosya.baglanti:ekle', 'dosya.baglanti:kaldir',
    'dosya.surum:yukle',
    'dosya:kendi-sil', 'dosya:baska-sil', 'dosya:geri-yukle',
    'dosya:toplu-islem', 'dosya:disa-aktar'
  )
ON CONFLICT DO NOTHING;

-- PERSONEL: temel + kendi-sil + düzenle (kendi yüklediği için resource-level helper karar verir) + etiket-ata + baglanti-ekle + surum-yukle
INSERT INTO "RolIzin" ("rol_id", "izin_id")
SELECT r."id", i."id"
FROM "Rol" r
CROSS JOIN "Izin" i
WHERE r."kod" = 'PERSONEL'
  AND i."kod" IN (
    'dosya:oku', 'dosya:yukle', 'dosya:indir', 'dosya:onizle',
    'dosya:duzenle-ad', 'dosya:duzenle-aciklama',
    'dosya.etiket:ata', 'dosya.baglanti:ekle', 'dosya.surum:yukle',
    'dosya:kendi-sil'
  )
ON CONFLICT DO NOTHING;
