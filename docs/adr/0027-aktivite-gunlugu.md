# ADR-0027 — Kullanıcı Odaklı Aktivite Günlüğü ve Forensik Denetim Ayrımı

- **Tarih:** 2026-05-06
- **Durum:** Kabul edildi
- **İlgili kural:** Kontrol Bölüm J (audit), Bölüm O (5 katman), Bölüm P (cursor + virtualization)
- **İlgili ADR:** ADR-0024 (sidebar RBAC), ADR-0026 (ana sayfa kapsamı)

## Bağlam

Tek denetim sayfası hem kullanıcıya gösterilecek aktivite akışını hem de ham
audit kayıtlarını taşımaya çalışıyordu. Bu iki kullanım farklıdır:

- Ekip ve makam kullanıcıları "kim, nerede, ne yaptı?" sorusuna hızlı yanıt ister.
- Süper yönetici forensik incelemede IP, request id, HTTP yolu, user-agent,
  gerekçe ve ham JSON diff görmek ister.
- `KAYMAKAM` rolünün tüm veriye erişmesi gerekir, ama ham forensik audit
  yüzeyi gereksiz ve fazla ayrıcalıklı bir alandır.

## Karar

İki ayrı yüzey oluşturuldu:

1. `/aktivite-gunlugu`
   - Yetki: `aktivite:oku`
   - Dışa aktarma: `aktivite:disa-aktar`
   - Cursor tabanlı, 50 kayıt limitli ve sanallaştırılmış liste
   - Türkçe tek cümle anlatı (`aktiviteAnlati`)
   - Kapsam filtresi (`kapsamWhere`): makam tümünü, diğer roller kendi ve
     erişebildiği proje/liste/kart bağlamındaki aktiviteleri görür

2. `/ayarlar/denetim`
   - Ham forensik audit yüzeyi olarak kaldı
   - Erişim sadece `SUPER_ADMIN` rolüyle sınırlandı
   - IP, HTTP, request id, oturum id, user-agent, gerekçe ve JSON diff alanları
     açıkça gösterilir

Aktivite mesajları `lib/aktivite` altında paylaşılan yardımcılarla tek kaynağa
indirildi. Proje aktivite modülündeki olgun zenginleştirme fonksiyonu şimdilik
public API olarak re-export edilir; yeni anlatı ve kapsam modülleri bu
zenginleştirilmiş `AktiviteOzeti` tipini tüketir.

## Sonuçlar

### Olumlu

- Kullanıcı/makam akışı ham audit gürültüsünden ayrıldı.
- Sidebar görünürlüğü yeni aktivite izinleriyle hizalandı.
- Ana sayfa "Son Aktiviteler" linki artık kullanıcı odaklı aktivite günlüğüne
  gider.
- Forensik audit yüzeyi daha net adlandırıldı ve süper yöneticiyle sınırlandı.

### Olumsuz / Riskler

- Aktivite zenginleştirme fonksiyonunun kaynağı halen proje route klasöründe.
  Bu ADR kapsamındaki public API bunu stabilize eder; ileride route dışına tam
  taşıma ayrı küçük refactor olarak yapılabilir.
- Serbest metin arama `aramaBigIntIdleri` üzerinden audit tablosunda ilgili
  metin kolonlarını tarar; yüksek hacimde ek trigram index gerekebilir.

## Test Planı

- `lib/aktivite/anlati.test.ts` — Türkçe tek cümle anlatı
- `lib/aktivite/kapsam.test.ts` — makam ve erişim OR matrisi
- `lib/aktivite/idari-mesaj.test.ts` — idari kaynak mesajları
- `lib/sidebar-yetki.test.ts` — aktivite ve forensik denetim menü RBAC'ı

## Referanslar

- [app/(panel)/aktivite-gunlugu](../../app/(panel)/aktivite-gunlugu)
- [lib/aktivite](../../lib/aktivite)
- [app/(panel)/ayarlar/denetim](../../app/(panel)/ayarlar/denetim)
- [lib/sidebar-yetki.ts](../../lib/sidebar-yetki.ts)
