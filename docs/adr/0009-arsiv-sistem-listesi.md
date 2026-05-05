# ADR-0009 — Arşiv Sistem Listesi

- **Tarih:** 2026-05-05
- **Durum:** Kabul edildi
- **İlgili kurallar:** Kontrol Kural 38 (migration), 50/146 (resource RBAC), 90 (5 katman), 102 (ADR), 107 (optimistic), T.13 (granüler yetki)

## Bağlam

Mevcut "arşiv" davranışı: kartın `arsiv_mi=true` flag'i set edilir, `kartGorunurlukWhere` filtresi onu kanban/liste'den gizler. Sorun: arşivlenmiş kartları **görüntülemek** için UI yok — kart kanban'dan kaybolur, sadece direkt link/kod ile kart modalı açılarak erişilir. Toplu görünüm yok, geri yükleme keşfedilebilir değil.

## Karar

Her projede otomatik bir **sistem listesi** olacak: `tip = ARSIV`. Arşivlenen kartlar bu listeye taşınır; UI bu listeyi kanban'da en sağda, sabit pozisyonda, korumalı olarak gösterir.

### Veri modeli

```prisma
enum ListeTipi {
  NORMAL
  ARSIV
}

model Liste {
  // ... mevcut alanlar
  tip ListeTipi @default(NORMAL)
}

model Kart {
  // ... mevcut alanlar
  arsiv_oncesi_liste_id String?   @db.Uuid  // arşivden çıkarken geri yüklenecek liste
  arsiv_zamani         DateTime?
}

// Partial unique: her projede sadece TEK Arşiv listesi
@@unique([proje_id, tip], where: { tip: ARSIV })  // SQL ile partial index
```

### Davranış kuralları

1. **Otomatik oluşturma:** `projeOlustur` her yeni projede `tip=ARSIV, ad="Arşiv", sira="ZZZZ"` (sabit en son) liste oluşturur.
2. **Arşivle aksiyonu (`kartArsivToggle({id, arsiv:true})`):**
   - `kart.liste_id` → `arsiv_oncesi_liste_id` olarak saklanır
   - Kart hedef Arşiv listesine taşınır, `arsiv_mi=true`, `arsiv_zamani=now()`
3. **Arşivden çıkar (`kartArsivToggle({id, arsiv:false})`):**
   - `arsiv_oncesi_liste_id` varsa oraya taşı; yoksa projenin ilk NORMAL listesine
   - `arsiv_mi=false`, `arsiv_oncesi_liste_id=null`, `arsiv_zamani=null`
4. **Drag-drop:**
   - Kart bir NORMAL listeden Arşiv listesine sürüklenirse → arşivle (yukarıdaki kural 2)
   - Arşiv listesinden NORMAL listeye sürüklenirse → arşivden çıkar (yukarıdaki kural 3 ama hedef = sürüklenen liste)
5. **Liste sırası:** Arşiv listesi `sira="ZZZZ"` (LexoRank "Z" prefix'i sona ekleme garantisi). NORMAL listeler arasındaki `siraSonuna` çağrısı Arşiv'in **bir önceki** komşusunu döndürür → Arşiv hep en sağda kalır.
5a. **Boşken gizleme (UX):** Kanban'da Arşiv listesi `kartlar.length === 0` ise render edilmez (görsel gürültü); ilk kart arşivlenince görünür olur. `detay.listeler` server tarafında canonical kalır (cache/optimistic mutation `arsivListesi`'ni hala bulabilsin), sadece render filtrelenir. Yan etki: arşiv listesi gizliyken drag-drop ile arşivleme yapılamaz; bu durumda sağ tık menüsü → "Arşivle" tek yoldur. Liste 1+ karta ulaşınca drag-drop yolu da geri gelir.
6. **Sistem listesi koruması:**
   - `listeSil(arsiv_listesi_id)` → reddedilir (`HATA_KODU.YETKISIZ`)
   - `listeGuncelle(arsiv_listesi_id, {ad})` → reddedilir
   - `listeyeSiraVer(arsiv_listesi_id)` → reddedilir
   - DnD `useSortable({disabled: tip==='ARSIV'})` → kullanıcı sürükleyemez; başka liste Arşiv'in sağına atılamaz (`siraArasi(arsiv.sira, null)` çağrılmaz)
7. **Yetki (Kural 138):** Kartı arşive taşıma `kart:tasi` + `kart:edit` yetkisi gerektirir; Arşiv listesinin **kendisini** yönetme yetkisi yoktur (sistem listesi).

## Migration adımları

```sql
-- 1. enum oluştur
CREATE TYPE "ListeTipi" AS ENUM ('NORMAL', 'ARSIV');

-- 2. Liste'ye tip kolonu ekle
ALTER TABLE "Liste" ADD COLUMN "tip" "ListeTipi" NOT NULL DEFAULT 'NORMAL';

-- 3. Kart'a yardımcı kolonlar ekle
ALTER TABLE "Kart" ADD COLUMN "arsiv_oncesi_liste_id" UUID;
ALTER TABLE "Kart" ADD COLUMN "arsiv_zamani" TIMESTAMP(3);

-- 4. Her projeye Arşiv listesi seed et (sira="ZZZZ")
INSERT INTO "Liste" ("id", "proje_id", "ad", "sira", "tip", "guncelleme_zamani")
SELECT gen_random_uuid(), p.id, 'Arşiv', 'ZZZZ', 'ARSIV', NOW()
FROM "Proje" p;

-- 5. Mevcut arsiv_mi=true kartları her projenin Arşiv listesine taşı
UPDATE "Kart" k
SET "liste_id" = arsiv_l.id,
    "arsiv_oncesi_liste_id" = k.liste_id,
    "arsiv_zamani" = COALESCE(k.guncelleme_zamani, NOW())
FROM "Liste" l, "Liste" arsiv_l
WHERE k.liste_id = l.id
  AND k.arsiv_mi = TRUE
  AND arsiv_l.proje_id = l.proje_id
  AND arsiv_l.tip = 'ARSIV';

-- 6. Partial unique constraint
CREATE UNIQUE INDEX "Liste_proje_id_arsiv_unique"
  ON "Liste" ("proje_id")
  WHERE "tip" = 'ARSIV';
```

## Sonuç

- **+** Arşivlenen kartlar görüntülenebilir, geri yüklenebilir; UI bütünlüğü artar
- **+** Geri yükleme önceki listeye gider — kullanıcı bağlamını korur
- **+** Drag-drop "Arşiv'e at" doğal bir UX
- **−** Her proje ekstra bir liste taşır (boş projede bile) — pratik olarak sorun değil
- **−** Migration'da mevcut arşivli kartlar taşınır → veri konumu değişir; arsiv_oncesi_liste_id geri yükleme için doğru set edilir

## Geri çevrilme

Bu karar geri alınırsa: Arşiv listesindeki tüm kartlar `arsiv_oncesi_liste_id`'ye taşınır, sonra Arşiv listeleri silinir, `tip` kolonu DROP edilir. `arsiv_mi` flag'i tek truth source'a geri döner.
