// Sprint 3 / S3-2 — Proje detay servisi parça dosyası: kart işlemleri.
// ADR-0032 mega dosya bölmesi.
//
// İçerik:
//   - kartOlustur / Guncelle / Sil / GeriYukle
//   - ADR-0019 tamamlama akışı: Oneri / Onay / Reddet
//   - listeKartlariniRebalance + kartiTasi (drag-drop)
//   - kartArsivToggle (arşiv ↔ normal taşıma)

import { ListeTipi, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { siraArasi, siraSonuna } from "@/lib/sira";
import { EylemHatasi } from "@/lib/action-wrapper";
import { HATA_KODU } from "@/lib/sonuc";
import { yayinla } from "@/lib/realtime";
import { SOCKET, room } from "@/lib/socket-events";
import {
  tiptapDokumaniBosMu,
  tiptapDokumaniMetne,
  type TiptapDokuman,
} from "@/lib/tiptap";
import type {
  KartArsiv,
  KartGuncelle,
  KartOlustur,
  KartTamamlamaOneri,
  KartTamamlamaOnay,
  KartTamamlamaReddet,
  KartTasi,
} from "./schemas";
import {
  type ListeKartOzeti,
  kaynakErisimi,
  projeyeErisimDogrula,
  listeyiBulVeProjeAl,
  kartiBulVeProjeAl,
} from "./services-ortak";
import { arsivListesiniSagla } from "./services-liste";

// =====================================================================
// Kart CRUD
// =====================================================================

export async function kartOlustur(
  kullaniciId: string,
  girdi: KartOlustur,
): Promise<ListeKartOzeti & { liste_id: string }> {
  const { proje_id } = await listeyiBulVeProjeAl(kullaniciId, girdi.liste_id);
  await projeyeErisimDogrula(kullaniciId, proje_id);
  const erisim = await kaynakErisimi(kullaniciId);

  const son = await db.kart.findFirst({
    where: { liste_id: girdi.liste_id },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const sira = siraSonuna(son?.sira ?? null);

  const yeni = await db.kart.create({
    data: {
      liste_id: girdi.liste_id,
      baslik: girdi.baslik.trim(),
      // ADR-0023 — Yeni kart boş açıklama ile başlar; modal'dan Tiptap ile
      // düzenlenir. Prisma JSON kolonu için DbNull (SQL NULL) kullanılır.
      aciklama_dokuman: Prisma.DbNull,
      aciklama_metin: null,
      sira,
      olusturan_id: kullaniciId,
      yetkililer: { create: { kullanici_id: kullaniciId } },
      birimler: erisim.birimId
        ? { create: { birim_id: erisim.birimId } }
        : undefined,
    },
    select: {
      id: true,
      liste_id: true,
      baslik: true,
      aciklama_dokuman: true,
      aciklama_metin: true,
      sira: true,
      kapak_renk: true,
      bitis: true,
      arsiv_mi: true,
      silindi_mi: true,
      tamamlandi_mi: true,
    },
  });

  const sonuc = {
    id: yeni.id,
    liste_id: yeni.liste_id,
    baslik: yeni.baslik,
    aciklama_dokuman: (yeni.aciklama_dokuman ?? null) as TiptapDokuman | null,
    aciklama_metin: yeni.aciklama_metin,
    sira: yeni.sira,
    kapak_renk: yeni.kapak_renk,
    kapak: null,
    bitis: yeni.bitis,
    arsiv_mi: yeni.arsiv_mi,
    silindi_mi: yeni.silindi_mi,
    tamamlandi_mi: yeni.tamamlandi_mi,
    // Yeni kart YOK durumunda doğar (default DB). Realtime alıcısı UI tip
    // kontrolünü geçsin diye explicit set.
    tamamlanma_oneri_durumu: "YOK" as const,
    tamamlanma_oneren_id: null,
    tamamlanma_oneren: null,
    tamamlanma_oneri_zamani: null,
    tamamlanma_red_sebebi: null,
    yetkili_sayisi: 1,
    etiket_sayisi: 0,
    yorum_sayisi: 0,
    ek_sayisi: 0,
    madde_toplam: 0,
    madde_tamamlanan: 0,
  };
  yayinla(SOCKET.KART_OLUSTUR, room.proje(proje_id), {
    proje_id,
    kart: sonuc,
  }).catch(() => {});
  return sonuc;
}

export async function kartGuncelle(
  birimId: string,
  girdi: KartGuncelle,
): Promise<void> {
  const { proje_id } = await kartiBulVeProjeAl(birimId, girdi.id);
  await projeyeErisimDogrula(birimId, proje_id);

  // ADR-0018 — Sert blok: kart kapanırken (true geçişinde) tüm kontrol
  // listesi maddeleri tamamlanmış olmalı. UI bunu önceden disabled ederek
  // gösterir; bu kontrol ek savunma katmanı (race condition / API kötüye
  // kullanım). Yeniden açma (false) için kontrol yok.
  if (girdi.tamamlandi_mi === true) {
    const eksik = await db.kontrolMaddesi.count({
      where: {
        kontrol_listesi: { kart_id: girdi.id },
        tamamlandi_mi: false,
      },
    });
    if (eksik > 0) {
      // CAKISMA — kart durumu (yarım kontrol listesi) ile istenen sonuç (tamam)
      // arasındaki tutarsızlık. GECERSIZ_GIRDI değil çünkü girdi şema-geçerli.
      throw new EylemHatasi(
        "Kontrol listesindeki tüm maddeler tamamlanmadan kart kapatılamaz.",
        HATA_KODU.CAKISMA,
      );
    }
  }

  const veri: Record<string, unknown> = {};
  if (girdi.baslik !== undefined) veri.baslik = girdi.baslik.trim();
  // ADR-0023 — Açıklama Tiptap doc; plaintext denormalize alanı server'da
  // türetilir (client güveni yok). null gelirse SQL NULL'a yazılır.
  if (girdi.aciklama_dokuman !== undefined) {
    if (
      girdi.aciklama_dokuman === null ||
      tiptapDokumaniBosMu(girdi.aciklama_dokuman)
    ) {
      veri.aciklama_dokuman = Prisma.DbNull;
      veri.aciklama_metin = null;
    } else {
      veri.aciklama_dokuman = girdi.aciklama_dokuman as Prisma.InputJsonValue;
      veri.aciklama_metin = tiptapDokumaniMetne(girdi.aciklama_dokuman) || null;
    }
  }
  if (girdi.kapak_renk !== undefined) veri.kapak_renk = girdi.kapak_renk;
  if (girdi.baslangic !== undefined) veri.baslangic = girdi.baslangic;
  if (girdi.bitis !== undefined) veri.bitis = girdi.bitis;
  if (girdi.arsiv_mi !== undefined) veri.arsiv_mi = girdi.arsiv_mi;
  // tamamlandi_mi true ⇒ tamamlanma_zamani=now() + tamamlayan_id=ctx.kullanici.
  // false ⇒ ikisini de temizle. Bu mapping client'tan gelen ham boolean'ı
  // güvenilir denormalize alanlara dönüştürür (audit + raporlama tutarlı).
  // ADR-0019 — Doğrudan tamamlandı=true (yetkili kullanıcı) öneri akışını
  // bypass etmiş olur; var olan öneri/red kayıtları sıfırlanır (atomicity).
  if (girdi.tamamlandi_mi !== undefined) {
    veri.tamamlandi_mi = girdi.tamamlandi_mi;
    veri.tamamlanma_zamani = girdi.tamamlandi_mi ? new Date() : null;
    veri.tamamlayan_id = girdi.tamamlandi_mi ? birimId : null;
    if (girdi.tamamlandi_mi) {
      veri.tamamlanma_oneri_durumu = "YOK";
      veri.tamamlanma_oneren_id = null;
      veri.tamamlanma_oneri_zamani = null;
      veri.tamamlanma_red_sebebi = null;
    }
  }

  await db.kart.update({ where: { id: girdi.id }, data: veri });
  yayinla(SOCKET.KART_GUNCELLE, room.proje(proje_id), {
    proje_id,
    kart_id: girdi.id,
  }).catch(() => {});
}

// =====================================================================
// ADR-0019 — Kart tamamlama öneri/onay/red
// =====================================================================

// Yetkisiz kullanıcı kart kapatıldığını bildirir. Durum YOK veya REDDEDILDI
// olabilir; her iki durumda da BEKLIYOR'a geçer (REDDEDILDI'den geri dönüş =
// "yeniden öneri" senaryosu — red_sebebi temizlenir).
export async function kartTamamlamaOneri(
  birimId: string,
  girdi: KartTamamlamaOneri,
): Promise<void> {
  const { proje_id } = await kartiBulVeProjeAl(birimId, girdi.id);
  await projeyeErisimDogrula(birimId, proje_id);

  const kart = await db.kart.findUnique({
    where: { id: girdi.id },
    select: {
      tamamlandi_mi: true,
      tamamlanma_oneri_durumu: true,
    },
  });
  if (!kart) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  if (kart.tamamlandi_mi) {
    throw new EylemHatasi("Kart zaten tamamlanmış.", HATA_KODU.CAKISMA);
  }
  if (kart.tamamlanma_oneri_durumu === "BEKLIYOR") {
    throw new EylemHatasi(
      "Bu kart için zaten bekleyen bir öneri var.",
      HATA_KODU.CAKISMA,
    );
  }

  // ADR-0018 — Sert blok: "Tamamlandığını bildir" de bir kart kapatma yoludur.
  // Kontrol listesi yarımken doğrudan tamamlama (`kartGuncelle`) ve onay
  // (`kartTamamlamaOnay`) bloklanıyor; öneri yolu da aynı kuralı uygulamalı.
  // Aksi halde yetkili kullanıcıya yarım kontrol listesiyle öneri ulaşır,
  // onay aşamasında reddolur — gereksiz bildirim trafiği + yanlış sinyal.
  const eksik = await db.kontrolMaddesi.count({
    where: {
      kontrol_listesi: { kart_id: girdi.id },
      tamamlandi_mi: false,
    },
  });
  if (eksik > 0) {
    throw new EylemHatasi(
      "Kontrol listesindeki tüm maddeler tamamlanmadan kart kapatılamaz.",
      HATA_KODU.CAKISMA,
    );
  }

  await db.kart.update({
    where: { id: girdi.id },
    data: {
      tamamlanma_oneri_durumu: "BEKLIYOR",
      tamamlanma_oneren_id: birimId,
      tamamlanma_oneri_zamani: new Date(),
      tamamlanma_red_sebebi: null,
    },
  });
  yayinla(SOCKET.KART_GUNCELLE, room.proje(proje_id), {
    proje_id,
    kart_id: girdi.id,
  }).catch(() => {});
}

// Yetkili kullanıcı bekleyen öneriyi onaylar → kart tamamlanır.
// Sert blok (kontrol listesi yarım) burada da geçerli (kartGuncelle ile aynı
// kural — onay aslında "kapat" aksiyonunun yetkili tarafından yapılan hali).
export async function kartTamamlamaOnay(
  birimId: string,
  girdi: KartTamamlamaOnay,
): Promise<{ onerenId: string | null }> {
  const { proje_id } = await kartiBulVeProjeAl(birimId, girdi.id);
  await projeyeErisimDogrula(birimId, proje_id);

  const kart = await db.kart.findUnique({
    where: { id: girdi.id },
    select: {
      tamamlanma_oneri_durumu: true,
      tamamlanma_oneren_id: true,
    },
  });
  if (!kart) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  if (kart.tamamlanma_oneri_durumu !== "BEKLIYOR") {
    throw new EylemHatasi("Onaylanacak bekleyen öneri yok.", HATA_KODU.CAKISMA);
  }

  // Sert blok kontrol listesi
  const eksik = await db.kontrolMaddesi.count({
    where: {
      kontrol_listesi: { kart_id: girdi.id },
      tamamlandi_mi: false,
    },
  });
  if (eksik > 0) {
    throw new EylemHatasi(
      "Kontrol listesindeki tüm maddeler tamamlanmadan kart kapatılamaz.",
      HATA_KODU.CAKISMA,
    );
  }

  await db.kart.update({
    where: { id: girdi.id },
    data: {
      tamamlandi_mi: true,
      tamamlanma_zamani: new Date(),
      tamamlayan_id: birimId,
      tamamlanma_oneri_durumu: "YOK",
      tamamlanma_oneren_id: null,
      tamamlanma_oneri_zamani: null,
      tamamlanma_red_sebebi: null,
    },
  });
  yayinla(SOCKET.KART_GUNCELLE, room.proje(proje_id), {
    proje_id,
    kart_id: girdi.id,
  }).catch(() => {});
  return { onerenId: kart.tamamlanma_oneren_id };
}

// Yetkili kullanıcı bekleyen öneriyi reddeder → durum REDDEDILDI + sebep.
export async function kartTamamlamaReddet(
  birimId: string,
  girdi: KartTamamlamaReddet,
): Promise<{ onerenId: string | null }> {
  const { proje_id } = await kartiBulVeProjeAl(birimId, girdi.id);
  await projeyeErisimDogrula(birimId, proje_id);

  const kart = await db.kart.findUnique({
    where: { id: girdi.id },
    select: {
      tamamlanma_oneri_durumu: true,
      tamamlanma_oneren_id: true,
    },
  });
  if (!kart) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  if (kart.tamamlanma_oneri_durumu !== "BEKLIYOR") {
    throw new EylemHatasi(
      "Reddedilecek bekleyen öneri yok.",
      HATA_KODU.CAKISMA,
    );
  }

  await db.kart.update({
    where: { id: girdi.id },
    data: {
      tamamlanma_oneri_durumu: "REDDEDILDI",
      tamamlanma_red_sebebi: girdi.sebep?.trim() || null,
      // oneren_id korunur — kim önerdi bilgisi audit ve "geçmiş" bilgisi.
      // oneri_zamani da korunur.
    },
  });
  yayinla(SOCKET.KART_GUNCELLE, room.proje(proje_id), {
    proje_id,
    kart_id: girdi.id,
  }).catch(() => {});
  return { onerenId: kart.tamamlanma_oneren_id };
}

// =====================================================================
// Kart sil / geri yükle
// =====================================================================

export async function kartSil(birimId: string, id: string): Promise<void> {
  const { proje_id } = await kartiBulVeProjeAl(birimId, id);
  await projeyeErisimDogrula(birimId, proje_id);
  await db.kart.update({
    where: { id },
    data: { silindi_mi: true, silinme_zamani: new Date() },
  });
  yayinla(SOCKET.KART_SIL, room.proje(proje_id), {
    proje_id,
    kart_id: id,
  }).catch(() => {});
}

export async function kartGeriYukle(
  birimId: string,
  id: string,
): Promise<void> {
  const { proje_id } = await kartiBulVeProjeAl(birimId, id);
  await projeyeErisimDogrula(birimId, proje_id);
  await db.kart.update({
    where: { id },
    data: { silindi_mi: false, silinme_zamani: null },
  });
  yayinla(SOCKET.KART_GERI_YUKLE, room.proje(proje_id), {
    proje_id,
    kart_id: id,
  }).catch(() => {});
}

// =====================================================================
// LexoRank rebalance + kart taşıma (drag-drop)
// =====================================================================

// LexoRank "0" tabanına ulaşıldığında bir listenin tüm kartlarını yeniden
// sıralayıp sira string'lerini geniş aralıklara dağıtır (rebalance).
// Mevcut sıralama korunur — sadece sira string'leri değişir.
async function listeKartlariniRebalance(listeId: string): Promise<void> {
  const kartlar = await db.kart.findMany({
    where: { liste_id: listeId },
    orderBy: { sira: "asc" },
    select: { id: true },
  });
  if (kartlar.length === 0) return;

  // M, T, Z, ZM, ... gibi geniş aralıklı yeni sıralar üret.
  const yeniSiralar: string[] = [];
  let son: string | null = null;
  for (let i = 0; i < kartlar.length; i++) {
    const yeni = siraSonuna(son);
    yeniSiralar.push(yeni);
    son = yeni;
  }

  await db.$transaction(
    kartlar.map((k, i) =>
      db.kart.update({ where: { id: k.id }, data: { sira: yeniSiralar[i] } }),
    ),
  );
}

export async function kartiTasi(
  birimId: string,
  girdi: KartTasi,
): Promise<{ sira: string; liste_id: string }> {
  // ADR-0009 — taşınan kartın mevcut listesi + hedef liste tipini birlikte oku
  // (NORMAL ↔ ARSIV geçişlerinde arsiv_mi/arsiv_oncesi_liste_id de güncellenir).
  const kart = await db.kart.findUnique({
    where: { id: girdi.id },
    select: {
      liste_id: true,
      arsiv_oncesi_liste_id: true,
      liste: { select: { proje_id: true, tip: true } },
    },
  });
  if (!kart) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  const kaynakProjeId = kart.liste.proje_id;
  const kaynakTip = kart.liste.tip;

  const hedefListe = await db.liste.findUnique({
    where: { id: girdi.hedef_liste_id },
    select: { proje_id: true, tip: true },
  });
  if (!hedefListe) {
    throw new EylemHatasi("Hedef liste bulunamadı.", HATA_KODU.BULUNAMADI);
  }
  const hedefProjeId = hedefListe.proje_id;
  const hedefTip = hedefListe.tip;

  // Aynı proje içinde olmalı (proje arası taşıma şu anda kapsam dışı).
  // Plan S3: drag-drop "proje içi/arası" yazıyor — proje arası ileride
  // ProjeYetkilisi yetki kontrolü ile genişletilir; MVP'de proje içi kabul.
  if (kaynakProjeId !== hedefProjeId) {
    throw new EylemHatasi(
      "Kart şu anda sadece aynı proje içinde taşınabilir.",
      HATA_KODU.YETKISIZ,
    );
  }

  await projeyeErisimDogrula(birimId, hedefProjeId);

  // Komşu kartları oku ve doğrula
  async function komsulariOku() {
    const [onceki, sonraki] = await Promise.all([
      girdi.onceki_id
        ? db.kart.findUnique({
            where: { id: girdi.onceki_id },
            select: { sira: true, liste_id: true },
          })
        : null,
      girdi.sonraki_id
        ? db.kart.findUnique({
            where: { id: girdi.sonraki_id },
            select: { sira: true, liste_id: true },
          })
        : null,
    ]);
    if (onceki && onceki.liste_id !== girdi.hedef_liste_id) {
      throw new EylemHatasi(
        "Önceki kart hedef listeden değil.",
        HATA_KODU.YETKISIZ,
      );
    }
    if (sonraki && sonraki.liste_id !== girdi.hedef_liste_id) {
      throw new EylemHatasi(
        "Sonraki kart hedef listeden değil.",
        HATA_KODU.YETKISIZ,
      );
    }
    return { onceki, sonraki };
  }

  let { onceki, sonraki } = await komsulariOku();

  // siraArasi LexoRank "0" tabanına çarpabilir — hedef liste rebalance edip
  // tekrar dene.
  let yeniSira: string;
  try {
    yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
  } catch (err) {
    if (err instanceof Error && err.message.includes("alfabe tabanı")) {
      // Hedef listenin sıralarını rebalance et, komşuları yeniden oku, tekrar dene
      await listeKartlariniRebalance(girdi.hedef_liste_id);
      const yeni = await komsulariOku();
      onceki = yeni.onceki;
      sonraki = yeni.sonraki;
      yeniSira = siraArasi(onceki?.sira ?? null, sonraki?.sira ?? null);
    } else {
      throw err;
    }
  }

  // ADR-0009 — drag-drop ile NORMAL ↔ ARSIV geçişinde arşiv state'i güncellenir.
  const arsivVerisi: Prisma.KartUncheckedUpdateInput = {};
  if (kaynakTip === ListeTipi.NORMAL && hedefTip === ListeTipi.ARSIV) {
    // Arşivle: eski liste id'sini sakla
    arsivVerisi.arsiv_mi = true;
    arsivVerisi.arsiv_oncesi_liste_id = kart.liste_id;
    arsivVerisi.arsiv_zamani = new Date();
  } else if (kaynakTip === ListeTipi.ARSIV && hedefTip === ListeTipi.NORMAL) {
    // Arşivden çıkar
    arsivVerisi.arsiv_mi = false;
    arsivVerisi.arsiv_oncesi_liste_id = null;
    arsivVerisi.arsiv_zamani = null;
  }

  await db.kart.update({
    where: { id: girdi.id },
    data: {
      liste_id: girdi.hedef_liste_id,
      sira: yeniSira,
      ...arsivVerisi,
    },
  });
  yayinla(SOCKET.KART_TASI, room.proje(hedefProjeId), {
    proje_id: hedefProjeId,
    kart_id: girdi.id,
    liste_id: girdi.hedef_liste_id,
    sira: yeniSira,
  }).catch(() => {});

  return { sira: yeniSira, liste_id: girdi.hedef_liste_id };
}

// =====================================================================
// ADR-0009 — Kart arşivle/arşivden çıkar (sistem ARSIV listesine taşır veya
// arsiv_oncesi_liste_id'ye geri yükler). Bağlam menüsü ve kart modalı bunu
// kullanır; drag-drop alternatif yol.
// =====================================================================

export async function kartArsivToggle(
  birimId: string,
  girdi: KartArsiv,
): Promise<{ liste_id: string }> {
  const kart = await db.kart.findUnique({
    where: { id: girdi.id },
    select: {
      liste_id: true,
      arsiv_oncesi_liste_id: true,
      liste: { select: { proje_id: true, tip: true } },
    },
  });
  if (!kart) {
    throw new EylemHatasi("Kart bulunamadı.", HATA_KODU.BULUNAMADI);
  }

  const projeId = kart.liste.proje_id;
  await projeyeErisimDogrula(birimId, projeId);

  let hedefListeId: string;
  const guncelleme: Prisma.KartUncheckedUpdateInput = {};

  if (girdi.arsiv) {
    // ARŞİVLE
    if (kart.liste.tip === ListeTipi.ARSIV) {
      // Zaten arşivde — no-op
      return { liste_id: kart.liste_id };
    }
    hedefListeId = await arsivListesiniSagla(projeId);
    guncelleme.arsiv_mi = true;
    guncelleme.arsiv_oncesi_liste_id = kart.liste_id;
    guncelleme.arsiv_zamani = new Date();
  } else {
    // ARŞİVDEN ÇIKAR
    if (kart.liste.tip === ListeTipi.NORMAL) {
      // Zaten arşiv değil — no-op
      return { liste_id: kart.liste_id };
    }
    // Önceki liste hala mevcut mu?
    let geriDonusListeId: string | null = null;
    if (kart.arsiv_oncesi_liste_id) {
      const eski = await db.liste.findUnique({
        where: { id: kart.arsiv_oncesi_liste_id },
        select: { id: true, tip: true, proje_id: true },
      });
      if (
        eski &&
        eski.tip === ListeTipi.NORMAL &&
        eski.proje_id === projeId
      ) {
        geriDonusListeId = eski.id;
      }
    }
    if (!geriDonusListeId) {
      // Önceki liste yoksa veya silinmişse, projenin ilk NORMAL listesine
      const ilkNormal = await db.liste.findFirst({
        where: { proje_id: projeId, tip: ListeTipi.NORMAL },
        orderBy: { sira: "asc" },
        select: { id: true },
      });
      if (!ilkNormal) {
        throw new EylemHatasi(
          "Geri yüklenecek normal liste bulunamadı.",
          HATA_KODU.BULUNAMADI,
        );
      }
      geriDonusListeId = ilkNormal.id;
    }
    hedefListeId = geriDonusListeId;
    guncelleme.arsiv_mi = false;
    guncelleme.arsiv_oncesi_liste_id = null;
    guncelleme.arsiv_zamani = null;
  }

  // Hedef listenin sonuna ekle
  const sonKart = await db.kart.findFirst({
    where: { liste_id: hedefListeId },
    orderBy: { sira: "desc" },
    select: { sira: true },
  });
  const yeniSira = siraSonuna(sonKart?.sira ?? null);

  await db.kart.update({
    where: { id: girdi.id },
    data: {
      liste_id: hedefListeId,
      sira: yeniSira,
      ...guncelleme,
    },
  });

  yayinla(SOCKET.KART_TASI, room.proje(projeId), {
    proje_id: projeId,
    kart_id: girdi.id,
    liste_id: hedefListeId,
    sira: yeniSira,
  }).catch(() => {});

  return { liste_id: hedefListeId };
}
