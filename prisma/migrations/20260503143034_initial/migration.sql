-- CreateTable
CREATE TABLE "Kurum" (
    "id" UUID NOT NULL,
    "ad" TEXT NOT NULL,
    "kisa_ad" TEXT,
    "il" TEXT,
    "ilce" TEXT,
    "logo_url" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kurum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Birim" (
    "id" UUID NOT NULL,
    "kurum_id" UUID NOT NULL,
    "ust_birim_id" UUID,
    "ad" TEXT NOT NULL,
    "kod" TEXT,
    "aciklama" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "silindi_mi" BOOLEAN NOT NULL DEFAULT false,
    "silinme_zamani" TIMESTAMP(3),
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Birim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kullanici" (
    "id" UUID NOT NULL,
    "kurum_id" UUID NOT NULL,
    "birim_id" UUID,
    "email" TEXT NOT NULL,
    "parola_hash" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "soyad" TEXT NOT NULL,
    "tc_kimlik_no" TEXT,
    "telefon" TEXT,
    "unvan" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "email_dogrulandi" TIMESTAMP(3),
    "son_giris_zamani" TIMESTAMP(3),
    "silindi_mi" BOOLEAN NOT NULL DEFAULT false,
    "silinme_zamani" TIMESTAMP(3),
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kullanici_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rol" (
    "id" UUID NOT NULL,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "sistem_rolu" BOOLEAN NOT NULL DEFAULT false,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guncelleme_zamani" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Izin" (
    "id" UUID NOT NULL,
    "kod" TEXT NOT NULL,
    "ad" TEXT NOT NULL,
    "aciklama" TEXT,
    "kategori" TEXT NOT NULL,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Izin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolIzin" (
    "rol_id" UUID NOT NULL,
    "izin_id" UUID NOT NULL,

    CONSTRAINT "RolIzin_pkey" PRIMARY KEY ("rol_id","izin_id")
);

-- CreateTable
CREATE TABLE "KullaniciRol" (
    "kullanici_id" UUID NOT NULL,
    "rol_id" UUID NOT NULL,
    "atama_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atayan_id" UUID,

    CONSTRAINT "KullaniciRol_pkey" PRIMARY KEY ("kullanici_id","rol_id")
);

-- CreateTable
CREATE TABLE "aktivite_logu" (
    "id" BIGSERIAL NOT NULL,
    "zaman" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kullanici_id" UUID,
    "oturum_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "request_id" TEXT,
    "http_metod" TEXT,
    "http_yol" TEXT,
    "islem" TEXT NOT NULL,
    "kaynak_tip" TEXT NOT NULL,
    "kaynak_id" TEXT,
    "eski_veri" JSONB,
    "yeni_veri" JSONB,
    "diff" JSONB,
    "meta" JSONB,
    "sebep" TEXT,

    CONSTRAINT "aktivite_logu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hata_logu" (
    "id" BIGSERIAL NOT NULL,
    "zaman" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seviye" TEXT NOT NULL,
    "taraf" TEXT NOT NULL,
    "request_id" TEXT,
    "kullanici_id" UUID,
    "oturum_id" TEXT,
    "ip" TEXT,
    "user_agent" TEXT,
    "url" TEXT,
    "hata_tipi" TEXT,
    "mesaj" TEXT NOT NULL,
    "stack" TEXT,
    "http_metod" TEXT,
    "http_durum" INTEGER,
    "istek_govdesi" JSONB,
    "istek_basliklari" JSONB,
    "ekstra" JSONB,
    "cozuldu_mu" BOOLEAN NOT NULL DEFAULT false,
    "cozum_notu" TEXT,

    CONSTRAINT "hata_logu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DavetTokeni" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol_id" UUID,
    "birim_id" UUID,
    "davet_eden_id" UUID NOT NULL,
    "son_kullanma" TIMESTAMP(3) NOT NULL,
    "kullanildi_mi" BOOLEAN NOT NULL DEFAULT false,
    "kullanim_zamani" TIMESTAMP(3),
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DavetTokeni_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SifirlamaTokeni" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "kullanici_id" UUID NOT NULL,
    "son_kullanma" TIMESTAMP(3) NOT NULL,
    "kullanildi_mi" BOOLEAN NOT NULL DEFAULT false,
    "olusturma_zamani" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SifirlamaTokeni_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Birim_kod_key" ON "Birim"("kod");

-- CreateIndex
CREATE INDEX "Birim_kurum_id_idx" ON "Birim"("kurum_id");

-- CreateIndex
CREATE INDEX "Birim_ust_birim_id_idx" ON "Birim"("ust_birim_id");

-- CreateIndex
CREATE INDEX "Birim_silindi_mi_idx" ON "Birim"("silindi_mi");

-- CreateIndex
CREATE UNIQUE INDEX "Kullanici_email_key" ON "Kullanici"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Kullanici_tc_kimlik_no_key" ON "Kullanici"("tc_kimlik_no");

-- CreateIndex
CREATE INDEX "Kullanici_kurum_id_idx" ON "Kullanici"("kurum_id");

-- CreateIndex
CREATE INDEX "Kullanici_birim_id_idx" ON "Kullanici"("birim_id");

-- CreateIndex
CREATE INDEX "Kullanici_email_idx" ON "Kullanici"("email");

-- CreateIndex
CREATE INDEX "Kullanici_silindi_mi_idx" ON "Kullanici"("silindi_mi");

-- CreateIndex
CREATE UNIQUE INDEX "Rol_kod_key" ON "Rol"("kod");

-- CreateIndex
CREATE UNIQUE INDEX "Izin_kod_key" ON "Izin"("kod");

-- CreateIndex
CREATE INDEX "Izin_kategori_idx" ON "Izin"("kategori");

-- CreateIndex
CREATE INDEX "RolIzin_izin_id_idx" ON "RolIzin"("izin_id");

-- CreateIndex
CREATE INDEX "KullaniciRol_rol_id_idx" ON "KullaniciRol"("rol_id");

-- CreateIndex
CREATE INDEX "aktivite_logu_kaynak_tip_kaynak_id_zaman_idx" ON "aktivite_logu"("kaynak_tip", "kaynak_id", "zaman" DESC);

-- CreateIndex
CREATE INDEX "aktivite_logu_kullanici_id_zaman_idx" ON "aktivite_logu"("kullanici_id", "zaman" DESC);

-- CreateIndex
CREATE INDEX "aktivite_logu_zaman_idx" ON "aktivite_logu"("zaman" DESC);

-- CreateIndex
CREATE INDEX "aktivite_logu_islem_idx" ON "aktivite_logu"("islem");

-- CreateIndex
CREATE INDEX "hata_logu_zaman_idx" ON "hata_logu"("zaman" DESC);

-- CreateIndex
CREATE INDEX "hata_logu_seviye_zaman_idx" ON "hata_logu"("seviye", "zaman" DESC);

-- CreateIndex
CREATE INDEX "hata_logu_cozuldu_mu_zaman_idx" ON "hata_logu"("cozuldu_mu", "zaman" DESC);

-- CreateIndex
CREATE INDEX "hata_logu_request_id_idx" ON "hata_logu"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "DavetTokeni_token_key" ON "DavetTokeni"("token");

-- CreateIndex
CREATE INDEX "DavetTokeni_token_idx" ON "DavetTokeni"("token");

-- CreateIndex
CREATE INDEX "DavetTokeni_email_idx" ON "DavetTokeni"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SifirlamaTokeni_token_key" ON "SifirlamaTokeni"("token");

-- CreateIndex
CREATE INDEX "SifirlamaTokeni_token_idx" ON "SifirlamaTokeni"("token");

-- CreateIndex
CREATE INDEX "SifirlamaTokeni_kullanici_id_idx" ON "SifirlamaTokeni"("kullanici_id");

-- AddForeignKey
ALTER TABLE "Birim" ADD CONSTRAINT "Birim_kurum_id_fkey" FOREIGN KEY ("kurum_id") REFERENCES "Kurum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Birim" ADD CONSTRAINT "Birim_ust_birim_id_fkey" FOREIGN KEY ("ust_birim_id") REFERENCES "Birim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kullanici" ADD CONSTRAINT "Kullanici_kurum_id_fkey" FOREIGN KEY ("kurum_id") REFERENCES "Kurum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kullanici" ADD CONSTRAINT "Kullanici_birim_id_fkey" FOREIGN KEY ("birim_id") REFERENCES "Birim"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolIzin" ADD CONSTRAINT "RolIzin_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolIzin" ADD CONSTRAINT "RolIzin_izin_id_fkey" FOREIGN KEY ("izin_id") REFERENCES "Izin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KullaniciRol" ADD CONSTRAINT "KullaniciRol_kullanici_id_fkey" FOREIGN KEY ("kullanici_id") REFERENCES "Kullanici"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KullaniciRol" ADD CONSTRAINT "KullaniciRol_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "Rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
