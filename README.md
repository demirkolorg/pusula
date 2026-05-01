# PUSULA

> Mülki idare amirliği (Kaymakamlık) için tasarlanmış, hiyerarşik yapıya uygun, denetim odaklı, modüler **İş Yönetim Sahanlığı**.

## Vizyon

PUSULA, mülki idare amirliği bünyesindeki tüm süreçlerin, kararların, denetimlerin ve kurumsal hafızanın yönetildiği; sabit aşama yapısını temel alan, denetlenebilir, modüler ve çağdaş bir İş Yönetim Sahanlığıdır.

## Asal Direkler

1. Sabit aşama (Birim/Makam) modeli — kamu yapısına uygun.
2. **Yapan-Doğrulayan** (memur → müdür) onay düzeneği + düzeltme döngüsü.
3. Gecikme ve üst makama taşıma kendiliğinden çalışması.
4. **Vekâlet** (yetki devri) ile sürekliliğin korunması.
5. **Değiştirilemez denetim günlüğü** ile her hareketin kayıt altına alınması.
6. **Yorum (geçici) + Derkenar (kalıcı kurumsal hafıza)** ayrımı.
7. **Önce mobil + ilerlemeli web uygulaması** ile saha kullanılabilirliği.
8. **Sınıflandırılmış genel arama (Ctrl+K)**.
9. **Olay güdümlü mimari** ile bildirim, kayıt ve gelecek tümleşimlere açık tasarım.

## Teknoloji Yığını

- **Ön Yüz:** Next.js (App Router), React, Tailwind CSS, Shadcn UI
- **Kimlik Doğrulama:** better-auth (eposta + parola + InputOTP)
- **Sunucu Durumu:** TanStack Query
- **Form & Doğrulama:** React Hook Form + Zod
- **Çizelge:** TanStack Table
- **Bildirim:** Sonner
- **Arka Uç:** Node.js, Prisma ORM
- **Veritabanı:** PostgreSQL
- **Depolama:** MinIO (S3 uyumlu) — soyutlanmış arayüz
- **Önbellek:** Redis
- **Mobil:** Önce mobil + İlerlemeli Web Uygulaması (PWA)

## Belgeler

Tüm tasarım, gereksinim ve plan belgeleri:

### Ana Ürün Gereksinim Belgesi (ÜGB)

- [PUSULA — Ana ÜGB](docs/ana-ügb/PUSULA-Ana-ÜGB.md) — V1-V6 ve Master PRD'lerin birleştirilmiş, kararlar dahil, **tek doğru kaynak** belgesi

### Tasarım & Mimari (B Evresi Çıktıları)

- [B-Ç1 — Üst Düzey Mimari](docs/mimari/B-Ç1-üst-düzey-mimari.md)
- [B-Ç2 — Varlık-İlişki Çizgesi](docs/varlık-ilişki/B-Ç2-varlık-ilişki-çizgesi.md)
- [B-Ç9 — Açık Uç Nokta Sözleşmesi](docs/açık-uç-nokta/B-Ç9-açık-uç-nokta-sözleşmesi.md)
- [B-Ç10 — Olay Sözlüğü](docs/olay/B-Ç10-olay-sözlüğü.md)
- [B-Ç12 — Yetki/İzin Matrisi](docs/yetki/B-Ç12-yetki-izin-matrisi.md)
- [B-Ç3-Ç8 — Yerleşim Çizimleri](docs/yerleşim/B-Ç3-Ç8-yerleşim-çizimleri.md)
- [B-Ç11/Ç13/Ç14/Ç15/Ç16 — Tasarım İmleri, Bulut, CI/CD, Tehdit](docs/bulut/B-Ç11-Ç13-Ç14-Ç15-Ç16-altyapı-tasarım-güvenlik.md)
- [B-Ç17 — Genel Arama Tasarımı](docs/arama/B-Ç17-genel-arama-tasarımı.md)
- **[B-Ç18 — Proje Yapısı + Mikro Bileşen Stratejisi (KRİTİK)](docs/proje-yapısı/B-Ç18-proje-yapısı-ve-bileşen-stratejisi.md)**

### Ürün Planı (C Evresi)

- [C Evresi — MVP Ayrıntı Plan](docs/ürün-planı/C-Evresi-MVP-ayrıntı-plan.md)

## Roller

| Rol | Kapsam |
|---|---|
| **YÖNETİCİ** (Kaymakam) | Tüm birimleri izleme, sistem ayarları, proje oluşturma. |
| **BİRİM_MÜDÜRÜ** | Kendi birimine gelen işleri memurlara havale, onay/red. |
| **PERSONEL** (Memur) | Atanan görevleri yürütme, alt görev açma, onaya sunma. |

## Pilot

İlk pilot: **Tekman Kaymakamlığı (Erzurum)**.

## Altyapı

- **Sağlayıcı:** HostingDünyam (TR yerel) — **TR-VDS7** sınıfı
- **Sunucu:** 4 çekirdek E5-2699-v4 / 12 GB DDR4 ECC RAM / 70 GB SSD / Limitsiz trafik / ₺580/ay
- **Domain:** `pusulaportal.com` (TurHost'ta kayıtlı, Cloudflare DNS ile HD sunucuya yönlendirilir)
- **Cloudflare:** DNS + DDoS koruma + WAF + CDN + SSL kenar (ücretsiz plan)
- **TLS:** Let's Encrypt (sunucuda) + Cloudflare Edge (kenar)
- **Yedekleme:** Yerel günlük + Cloudflare R2 haftalık (gpg+AES-256)
- **Aylık altyapı maliyeti:** ~₺580 (sunucu) + ~₺50 (R2) + 0 (Cloudflare ücretsiz) ≈ **₺630**

## Proje Yapısı (B-Ç18 — KRİTİK)

**Tek Next.js projesi** (apps/* veya monorepo YOK). API yol öbeği ile ayrılmış. **Özellik bazlı + mikro bileşen** ilkeleri sıkı uygulanır.

```
pusula/
├── app/
│   ├── (auth)/                # kimlik akışları
│   ├── (dashboard)/           # uygulama
│   │   ├── projeler/          # ÖZELLİK (kendi components/, hooks/, schemas.ts)
│   │   ├── gorevler/          # ÖZELLİK
│   │   └── ...
│   └── api/v1/                # REST uç noktaları
├── components/                # paylaşımlı mikro bileşenler (data-table, form, ui)
├── lib/                       # genel altyapı (auth, prisma, permissions, audit)
├── hooks/                     # paylaşımlı kancalar
├── types/
└── prisma/
```

**Asal Kurallar:**
- Bileşen ≤150 satır, tek sorumluluk
- 1 özellikte → özellik içinde / 2+ özellikte → kök `components/`
- Çapraz özellik importu yasak
- TR karakter klasör/dosya adında yasak
- `any` yasak

Ayrıntı: [B-Ç18 belgesi](docs/proje-yapısı/B-Ç18-proje-yapısı-ve-bileşen-stratejisi.md)

## Geliştirme

> **Paket Yöneticisi:** **Bun** (zorunlu — npm/pnpm/yarn YASAK).
> Kurulum: https://bun.sh — `curl -fsSL https://bun.sh/install | bash`

```bash
# Bağımlılıkları kur
bun install

# Geliştirme sunucusu
bun dev

# Sınamalar
bun test
bun run test:unit
bun run test:integration
bun run e2e

# Tip + lint kontrolleri
bun run typecheck
bun run lint

# Veritabanı
bun run db:migrate
bun run db:seed
bun run db:studio
```

## Plan Durumu

- ✅ A Evresi — 10 açık soru + 10 stratejik karar **kilitlendi**
- ✅ B Evresi — 17 mimari/tasarım/altyapı çıktısı **tamamlandı**
- ✅ C Evresi — MVP ayrıntı plan + 13 epik + 100+ kullanıcı öyküsü **hazır**
- 🟡 Sprint 0 — Hazırlık (başlatılacak)

## Lisans

Bu proje kamu kurumları için tasarlanmıştır. Lisans bilgisi proje sahibi tarafından eklenecektir.

## İletişim

Geliştirici: demirkol.abdullah93@gmail.com

