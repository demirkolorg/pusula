# ADR 0013 — Davet Bağlamı Kaynağa Göre: Proje / Liste / Kart Yetkilisi

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** ADR-0008 (saf paylaşım modeli), ADR-0010 (davet → proje yetkisi bağlamı), ADR-0012 (tek rol modeli)

## Bağlam

ADR-0010'da davet kabul edildiğinde **her zaman projeye yetkili** olarak ekleme kararı vardı (saf model gereği "proje yetkilisi alt liste/kartlara erişir" mantığıyla). Pratikte bu, kart panelinden `parsongunu@gmail.com` davet eden bir operatörün kullanıcıyı projenin tamamının yetkilisi yapmasıyla sonuçlandı — istenen değildi.

İş kuralı: **"Kişi nereden davet edildiyse oraya yetkili olarak gelir"**:
- Kart yetkili paneli'nden davet → davet kabul edildiğinde **`KartYetkilisi`** kaydı (sadece o kart)
- Liste yetkili paneli'nden davet → **`ListeYetkilisi`** kaydı (sadece o liste)
- Proje yetkili paneli'nden davet → **`ProjeYetkilisi`** kaydı (proje + alt liste/kart)

Mevcut "doğrudan ekle" akışı zaten bu üçlü ayrımı kullanıyor (kişi panelinde kart/liste/proje seçimi); davet de aynı semantiği kullanmalı.

## Karar

### 1. Üç bağlam tablosu

`DavetTokeni`'ye üç ayrı bağlam tablosu bağlanır:

```prisma
model DavetProjeBaglami { id, davet_id, proje_id, ... }   // ADR-0010
model DavetListeBaglami { id, davet_id, liste_id, ... }   // ADR-0013
model DavetKartBaglami  { id, davet_id, kart_id, ...  }   // ADR-0013
```

Hepsi `onDelete: Cascade` ile davet'e bağlı. Davet expire/iptal/kullanım → bağlamlar otomatik silinir.

**Migration:** `20260505200000_davet_liste_kart_baglami` — sadece tablo eklenir; mevcut veri etkilenmez.

### 2. `davetOlustur` üç bağlam dizisi alır

Servisin imzası `proje_baglamlari[]`, `liste_baglamlari[]`, `kart_baglamlari[]` üçünü de kabul eder. Validate edilirler (silinmiş kaynaklar reddedilir). Yetkili paneli yalnız **birini** doldurur; sıralı validate ile garantilenir.

### 3. Davet kabul flow polimorfik

`davetiKabul` action'ı kabul edildiğinde:
1. `Kullanici` oluşturur
2. `KullaniciRol` ekler (sistem rolü)
3. **Kaynak bağlamlarını yetkili kayıtlarına dönüştürür:**
   - `proje_baglamlari` → `ProjeYetkilisi.createMany`
   - `liste_baglamlari` → `ListeYetkilisi.createMany`
   - `kart_baglamlari` → `KartYetkilisi.createMany`
4. Silinmiş/expire kaynaklar atlanır (defensiv)
5. Davet kullanıldı işaretlenir → `Cascade` ile bağlamlar temizlenir

### 4. Yetkili modülü action'ları kaynak.tip'e göre dispatch

Tek action seti polimorfik girdi alır:

| Action | Girdi | Davranış |
|---|---|---|
| `projeyeDavetGonderEylem` (yetkili:davet-gonder) | `{proje_id\|liste_id\|kart_id, email, rol_id, birim_id}` | Hangi id doluysa o tür bağlam yazılır |
| `projeBekleyenDavetleriEylem` (yetkili:bekleyen-davetler) | `{proje_id\|liste_id\|kart_id}` | Yalnız o kaynağın davetleri listelenir |
| `projeDavetIptalEylem` (yetkili:davet-iptal) | `{kaynak, davet_id}` | Yalnız o kaynak bağlamı silinir; davet token diğer bağlamlarda hâlâ aktif kalabilir |
| `projeDavetYenidenGonderEylem` (yetkili:davet-yeniden-gonder) | `{kaynak, davet_id}` | Davet'in o kaynağa bağlı olduğu doğrulanır → mail tekrar gönderilir |

RBAC: tüm action'lar `yetkiZorunluProje(uid, "proje:authorize", projeId)` çağırır (kart/liste'den projeId server-side türetilir). Yani kart panelinden başka bir projenin davetini iptal etmek mümkün değil.

### 5. UI metni

`KAYNAK_KAPSAM_NOTU` haritası kaynak'a göre kullanıcıya doğru bilgi verir:
- **Proje:** "Davet kabul edilince kişi projeye yetkili olarak eklenir."
- **Liste:** "Davet kabul edilince kişi yalnız bu listeye yetkili olarak eklenir."
- **Kart:** "Davet kabul edilince kişi yalnız bu karta yetkili olarak eklenir."

### 6. Bekleyen davet listeleri bağımsız

Her panelin bekleyen davet listesi yalnız o kaynağın davetlerini gösterir — proje paneli alt liste/kart davetlerini "miras" almaz. Davet semantiği üç ayrı dünyada yaşar.

## Sonuçlar

### Pozitif
- **İş kuralı doğru:** Kart davet edilen sadece kartta, liste davet edilen sadece listede yetkili olur. UX beklentisi korunur.
- **Doğrudan ekle ile paralellik:** "Kart yetkilisi ekle" ile "kart davet et" aynı semantik kapsamda çalışır.
- **Veri ayrı:** `DavetProjeBaglami`, `DavetListeBaglami`, `DavetKartBaglami` üç ayrı tabloda; FK güvencesiyle veri kaybı yok.
- **Cascade temizlik:** Davet expire/use'da tüm bağlamlar otomatik temizlenir.

### Negatif / Takas
- **Üç tablo bakım yükü:** Proje/liste/kart için üç paralel CRUD. Polimorfik tek tablo (kaynak_tip + kaynak_id) alternatifti ama FK referans bütünlüğü kaybedilirdi (kaynak_id Liste'ye mi Kart'a mı bilinemez). Üç tablo yaklaşımı tip güvenliğine yatırım.
- **Davet kabul flow'u 3x logic:** Kabul flow'u her bağlam tipi için ayrı `createMany` döngüsü. Kabul edilebilir tekrar.
- **Bekleyen davet bütünlüğü:** Proje paneli alt davetleri görmez. Operatör kart/liste/proje panelinde gezerek bekleyenleri kontrol eder. İleride "tüm bekleyen davetler" merkezi sayfası eklenebilir.

### Genişlemeler (v2)
- **Çoklu hedef davet:** Operatör tek davet ile aynı kullanıcıya hem proje hem belirli kartları atayabilir (`davetOlustur` üç dizi destekliyor; UI henüz tek hedef akışı). Şimdilik scope dışı.
- **Bekleyen davetler merkezi panel:** `/ayarlar/davetler` sayfası tüm aktif davetleri listeler (proje/liste/kart kapsamı kolonu).
- **Audit log:** Davet kabul edildiğinde hangi kaynak yetkilisi olarak eklendiği audit'e yazılır (Prisma middleware zaten yakalıyor).

## İlgili Dosyalar

- `prisma/schema.prisma` — `DavetListeBaglami`, `DavetKartBaglami` modelleri + ters ilişkiler
- `prisma/migrations/20260505200000_davet_liste_kart_baglami/migration.sql`
- `app/(panel)/ayarlar/kullanicilar/schemas.ts` — `davetListeBaglamiSemasi`, `davetKartBaglamiSemasi`
- `app/(panel)/ayarlar/kullanicilar/services.ts` — `davetOlustur` (üç dizi), `listeBekleyenDavetleriListele`, `kartBekleyenDavetleriListele`, `listeDavetBaglamiKaldir`, `kartDavetBaglamiKaldir`
- `app/(auth)/davet/actions.ts` — kabul flow polimorfik
- `app/(panel)/projeler/[projeId]/yetkili/actions.ts` — action'lar kaynak.tip dispatch
- `app/(panel)/projeler/[projeId]/yetkili/components/yetkili-kisi-ekle-dialog.tsx` — `KAYNAK_KAPSAM_NOTU` mesajları
