# ADR 0012 — Tek Rol Modeli: Proje-İçi Seviye Kaldırıldı

**Tarih:** 2026-05-05
**Durum:** Kabul edildi
**Bağlam:** ADR-0005 (resource-level RBAC), ADR-0008 (saf paylaşım modeli), ADR-0010 (davet → proje yetkisi bağlamı) — bu ADR ADR-0010'un "İki ayrı yetki kavramı" bölümünü ve `ProjeYetkilisi.seviye` modelini **supersede eder**.

## Bağlam

Pusula'da iki farklı "yetki" kavramı paralel yürüyordu:

| Kavram | Tablo | Değerler | Anlam |
|---|---|---|---|
| **Sistem rolü** | `Rol` + `KullaniciRol` | SUPER_ADMIN, KAYMAKAM, BIRIM_AMIRI, PERSONEL | RBAC izinleri (PROJE_OLUSTUR, KART_DUZENLE, ...) |
| **Proje seviyesi** | `ProjeYetkilisi.seviye` | ADMIN, NORMAL, IZLEYICI | Proje-içi yetki gradasyonu |

Operasyonel sahada bu iki kavramı ayırmak **kullanıcı bilişsel yükünü artırıyor** ve şu sorunları doğurdu:

1. **Kavram karışıklığı:** Davet form'unda "Proje yetkisi: Yönetici/Üye" seçeneği gösterilirken aynı kullanıcı **sistem rolü olmadan** sisteme alınabiliyordu (rolsüz kullanıcı = RBAC ihlali).
2. **Tutarsız uygulama:** Liste yetkilisi (`ListeYetkilisi`) ve Kart yetkilisi (`KartYetkilisi`) **seviye taşımıyor**, yalnız `ProjeYetkilisi` taşıyor. Yani aynı sistem üç farklı yerde "yetkili olmak" için üç farklı veri modeli kullanıyordu — UX ve kod tekrarı.
3. **Çift karar noktası:** Eylem yetkisi hem sistem rolünden hem proje seviyesinden geliyor. Karar matrisi: `(rol izinleri ∩ proje seviye izinleri)` — tahmin edilmesi zor, gelecek izinler için yeni satır gerekiyor.
4. **IZLEYICI ihtiyacı yoktu:** Kullanıcı tarafında istek çıkmadı; "salt okur" gerektiğinde kart/liste birim atamaları zaten çözüyordu.

## Karar

### 1. `ProjeYetkilisi.seviye` kaldırıldı

`ProjeYetkilisi` artık sadece **kişi-proje bağlantısı** tutar. Seviye yok, ek alan yok. `DavetProjeBaglami.seviye` da kaldırıldı; `ProjeYetkiSeviyesi` enum'u şemadan çıktı.

**Migration:** `20260505180000_proje_yetki_seviyesi_kaldir` — `ALTER TABLE DROP COLUMN` (10 ProjeUyesi.seviye + 1 DavetProjeBaglami.seviye değeri **bilinçli olarak atılır**; yetkili kayıtları korunur).

### 2. Tek otorite kaynağı: sistem rolü

Aksiyon yetkisi yalnız **sistem rolünden** gelir (`Rol.izinler` → `IZIN_KODLARI`):
- `IZIN_KODLARI.PROJE_DUZENLE` — kim projeyi düzenleyebilir
- `IZIN_KODLARI.PROJE_SIL` — kim projeyi silebilir
- `IZIN_KODLARI.PROJE_YETKILI_YONET` — kim yetkili atayabilir/davet edebilir
- `IZIN_KODLARI.KART_OLUSTUR/DUZENLE/SIL/TASI` — kart aksiyonları
- ... (mevcut tüm IZIN_KODLARI)

`canProje/canListe/canKart` artık **erişim katmanını** kontrol eder ("bu kullanıcı bu kaynağa ulaşabilir mi"). Aksiyon kontrolü action wrapper'larında `yetkiZorunlu(user, IZIN_KODU)` ile yapılır (ZATEN yapılıyordu, çift kontrol kalkmadı, sadece seviye ayrımı kalktı).

### 3. IZLEYICI tamamen kaldırıldı

Sistemin hiçbir yerinde IZLEYICI seviyesi/rolü yok. "Salt okur" gerekirse:
- Birim ataması ile (kullanıcı projeyi görür, sistem rolü PERSONEL ise düzenleyemez ama PERSONEL'in PROJE_DUZENLE izni varsa düzenler — bu sistem rolünün ayarıdır).
- İleride ihtiyaç çıkarsa **yeni sistem rolü** (örn. `IZLEYICI_ROL`) eklenecek, proje-içi seviye değil.

### 4. Davet form'u: tek alan = sistem rolü

Davet adımında artık **tek yetki seçimi** var: **Sistem rolü** (zorunlu). Birim alanı politikaya göre (PERSONEL/BIRIM_AMIRI ise zorunlu, KAYMAKAM/SUPER_ADMIN için yok). Eski "Proje yetki seviyesi: Yönetici/Üye" alanı kaldırıldı.

### 5. Davet → kabul akışı

`davetiKabul` action'ı:
- `Kullanici` oluşturur
- `KullaniciRol` ekler (sistem rolü)
- `ProjeYetkilisi` ekler (her proje bağlamı için, **seviye yok**)
- `DavetProjeBaglami` Cascade ile temizlenir

### 6. "Son yetkili koruma" kuralı yeniden yorumlandı

Eski: "Son ADMIN çıkarılamaz."
Yeni: "Son yetkili çıkarılamaz." (proje sahipsiz kalmasın). Makam rolleri (SUPER_ADMIN/KAYMAKAM) zaten her projeyi görür ve düzenler — yetkili listesi tamamen boş kalsa bile bunlar erişebilir.

### 7. Geçiş etkisi (kod kapsamı)

Bu kararla aşağıdakiler güncellendi:

| Yer | Değişim |
|---|---|
| `prisma/schema.prisma` | `ProjeYetkiSeviyesi` enum, `ProjeYetkilisi.seviye`, `DavetProjeBaglami.seviye` kaldırıldı |
| `lib/yetki.ts` | `SEVIYE_IZINLERI` matrisi silindi; can* fonksiyonları sadece erişim kontrol eder |
| `app/(panel)/projeler/services.ts` | `projeOlustur` → yetkili create'inde seviye yok |
| `app/(panel)/projeler/[projeId]/yetkili/services.ts` | `projeYetkilisiSeviyeGuncelle` silindi; `projeyeYetkiliKaldir` "son yetkili" koruması |
| `app/(panel)/projeler/[projeId]/yetkili/actions.ts` | `projeYetkilisiSeviyeGuncelleEylem` silindi |
| `app/(panel)/projeler/[projeId]/yetkili/yetkili-adaptor.ts` | `seviyeGuncelle` adaptör fonksiyonu silindi; `ekle()` seviye almıyor |
| `app/(panel)/projeler/[projeId]/yetkili/yetkili-optimistic.ts` | `optimistikSeviyeGuncelle` silindi; `optimistikKisiEkle` seviye almıyor |
| `app/(panel)/projeler/[projeId]/yetkili/yetkili-tipler.ts` | `YetkiliKisiOzeti.seviye`, `BekleyenDavetOzeti.seviye`, `seviyeDestekliMi` silindi |
| `app/(panel)/projeler/[projeId]/yetkili/components/yetkili-kisi-sutunu.tsx` | `KisiSeviyeKontrolu` component'i silindi |
| `app/(panel)/projeler/[projeId]/yetkili/components/yetkili-kisi-ekle-dialog.tsx` | "Proje yetki seviyesi" select'i kaldırıldı; davet form'unda sadece sistem rolü + birim |
| `app/(panel)/projeler/[projeId]/yorum/services.ts` | "ADMIN ise sil" → `IZIN_KODLARI.PROJE_YETKILI_YONET` izniyle |
| `app/(panel)/projeler/[projeId]/eklenti/services.ts` | "ADMIN ise sil" → `IZIN_KODLARI.PROJE_YETKILI_YONET` izniyle |
| `app/(panel)/projeler/[projeId]/components/mention-dropdown.tsx` | "Admin" rozeti kaldırıldı |
| `app/(panel)/projeler/[projeId]/aktivite/services.ts` | `ProjeYetkilisi.seviye` etiketi `ALAN_ETIKETI` haritasından kaldırıldı |
| `app/(auth)/davet/actions.ts` | Davet kabul flow'u `ProjeYetkilisi` create'i seviye'siz |
| `app/(panel)/projeler/[projeId]/yetkili/hooks.ts` | `useProjeYetkilisiSeviyeGuncelle` silindi; `optimistic` taslakta seviye yok |
| `prisma/seed.ts` | Tüm `ProjeYetkilisi` seed verileri seviye'siz |

## Sonuçlar

### Pozitif
- **Tek kavram, tek karar yeri:** Bir kullanıcının ne yapabileceği sadece sistem rolüne bakılarak anlaşılır.
- **UX sadelik:** Davet form'unda iki yerine bir yetki seçimi.
- **Kod sadeleşmesi:** ~10 dosyada `seviye` parametre/alan/select silindi; hooks/services/actions üçlüsü daha öngörülebilir.
- **Liste/kart yetkilisi ile paralellik:** Üç tip yetkili (proje/liste/kart) artık aynı veri modeline sahip — tutarlı.
- **IZLEYICI yok:** Operasyonel kullanım sade, ihtiyaç çıkarsa sistem rolü olarak eklenir.

### Negatif / Takas
- **Granüler yetki kaybı:** Eskiden bir kullanıcı projeye `NORMAL` eklenip kart silmesi engellenebiliyordu (`SEVIYE_IZINLERI.NORMAL`'de `kart:delete` yok). Yeni modelde kullanıcının sistem rolünde `KART_SIL` izni varsa proje yetkilisi olduğu tüm projelerde silebilir. Bu, **rol matrisi tasarımına** taşındı (ileride PERSONEL'e KART_SIL verme/vermeme kararı).
- **Mevcut seviye verisi atıldı:** ADMIN olarak işaretli kullanıcılar artık sadece "yetkili" — operasyonel ayrıcalık kaybedildi. Bunu telafi için: kritik projelerde sistem rolü `BIRIM_AMIRI` veya `KAYMAKAM` olan kullanıcılar zaten erişimi koruyor.

### Genişlemeler (v2)
- **Yeni sistem rolü `IZLEYICI` veya `PROJE_UYESI`:** İhtiyaç çıkarsa Rol tablosuna eklenir, izin matrisi tanımlanır. Schema değişikliği gerekmez.
- **Proje-spesifik izin override:** ileride bir kullanıcı tek bir projede farklı kurallara tabi olmak isterse `ProjeYetkilisi`'na izin override JSON kolonu eklenebilir — ama öncelikle sistem rolüyle çözüm denenecek.

## İlgili Dosyalar

- `prisma/migrations/20260505180000_proje_yetki_seviyesi_kaldir/migration.sql`
- `prisma/schema.prisma` — `ProjeYetkiSeviyesi` enum YOK, `ProjeYetkilisi`/`DavetProjeBaglami` seviye kolonu YOK
- `lib/yetki.ts` — `SEVIYE_IZINLERI` matrisi YOK
- `docs/adr/0010-davet-proje-baglami.md` — bu ADR ile güncellenmiş bağlam
