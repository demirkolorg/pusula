# Aktivite Günlüğü Modülü

`/aktivite-gunlugu`, kullanıcıya okunabilir aktivite akışıdır. Ham forensik
audit yüzeyi değildir; o kullanım `/ayarlar/denetim` altında ve sadece
`SUPER_ADMIN` için kalır.

## Katmanlar

- `schemas.ts` — Zod filtre şeması (`limit`, `cursor`, `kapsam`, `arama`,
  `islem`, `kaynak_tip`, tarih aralığı)
- `services.ts` — Prisma sorguları, kapsam filtresi, cursor pagination ve
  anlatı üretimi
- `actions.ts` — Server Actions, `aktivite:oku` RBAC kontrolü
- `hooks/aktivite-sorgulari.ts` — TanStack Query infinite query
- `components/` — filtre barı, sanallaştırılmış liste ve satır görünümü

## Yetkiler

- `aktivite:oku`: sayfa ve listeleme erişimi
- `aktivite:disa-aktar`: yüklenmiş kayıtları CSV olarak dışa aktarma

Kapsam davranışı:

- `SUPER_ADMIN` ve `KAYMAKAM` makam kapsamıyla tüm aktiviteleri görür.
- Diğer roller kendi aktivitelerini ve erişebildiği proje/liste/kart
  bağlamındaki aktiviteleri görür.
- `Sadece benim` filtresi sonuçları `kullanici_id` ile daraltır.

## Performans

- Servis her çağrıda en fazla 50 kayıt döndürür.
- Liste `@tanstack/react-virtual` ile render edilir.
- İleri sayfalama `id < cursor` koşuluyla yapılır.
