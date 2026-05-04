# Pusula

Kaymakamlık görev yönetim sistemi. Trello tarzı kanban + liste görünümü, RBAC, audit log, optimistic UI.

> **Stack:** Next.js 16 (App Router) · React 19 · Bun · Prisma 6 · Postgres · NextAuth · shadcn/ui · TanStack Query/Table · dnd-kit · Vitest · Playwright

## Gereksinimler

- **Node.js 22 LTS** (`.nvmrc`)
- **Bun 1.3+** (zorunlu — `npm`/`yarn`/`pnpm` YASAK, kontrol Kural 1)
- **Docker** (Postgres + MinIO için)
- Windows/macOS/Linux

## Hızlı Başlangıç

```bash
# 1. Bağımlılıkları kur
bun install

# 2. Docker servisleri ayağa kaldır (Postgres + MinIO)
bun run db:up

# 3. Veritabanı migration + seed
bun run db:migrate
bun run db:seed

# 4. Geliştirme sunucusu (port 2500)
bun run dev
```

→ http://localhost:2500

### Demo Kullanıcılar

Seed sonrası:
- **Süper Admin** — `admin@pusula.local` / `Pusula2026!`
- **Kaymakam** — `kaymakam@pusula.local` / `Pusula2026!`

## Komutlar

| Komut | İşlevi |
|-------|--------|
| `bun run dev` | Geliştirme sunucusu (port 2500) |
| `bun run build` | Production build |
| `bun run start` | Production sunucusu |
| `bun run lint` | ESLint |
| `bun run test` | Vitest unit + integration |
| `bun run test:watch` | Vitest watch modu |
| `bun run test:coverage` | Coverage raporu |
| `bun run e2e` | Playwright E2E (3 viewport) |
| `bun run e2e:ui` | Playwright UI modu |
| `bun run db:up` / `db:down` | Docker servisleri |
| `bun run db:migrate` | Prisma migration (dev) |
| `bun run db:seed` | Seed data (faker-tr) |
| `bun run db:reset` | DB sıfırla + seed |
| `bun run db:studio` | Prisma Studio |
| `bun run db:generate` | Prisma client regenerate |

## Mimari

- **App Router** (`app/(panel)/`, `app/(auth)/`)
- **Server Actions** default — REST sadece dış sistem callback (kontrol Kural 48)
- **Türkçe identifier'lar** (klasör/route/DB tablo); JS/TS değişken İngilizce (kontrol Kural 6)
- **Optimistic UI** her server-state mutation için (`lib/optimistic.ts`, kontrol Kural 107-116)
- **Resource-level RBAC** (`lib/yetki.ts`, kontrol Kural 146)
- **Çekirdek audit + hata logu** (`lib/audit-middleware.ts`, `lib/hata-kayit.ts`)

Detay: [`docs/plan.md`](docs/plan.md)

## Geliştirme Kuralları

Tüm kod yazımı, refactoring, PR öncesi `.claude/skills/kontrol/SKILL.md` kuralları enforce edilir (147 kural). Kategoriler:

| Bölüm | Konu |
|-------|------|
| A | Paket & araç (Bun zorunlu) |
| B | Dil & lokalleştirme (Türkçe) |
| C | Mobile-first |
| D | Komponent & UI (shadcn) |
| E | Klasör & dosya yapısı |
| F | TypeScript (strict) |
| G | DB & Prisma |
| H | Server Actions / API |
| I | Realtime (Socket.io) |
| J | Audit & hata logu |
| K | Bildirim (Sonner) |
| L | Güvenlik |
| M | Test (TDD) |
| N | Git & commit |
| O | Modül akışı |
| P | Performans |
| Q | Dokümantasyon |
| R | CI/CD |
| S | Optimistic UI |
| T | Drag-drop mimarisi |
| U | Genel mimari ilkeler |

## Mimari Kararlar (ADR)

`docs/adr/` altında:
- [0001 — Birim + Birim birleştirme](docs/adr/0001-birim-birim-birlestirme.md)
- [0002 — Mimari audit (2026-05-04)](docs/adr/0002-mimari-audit-2026-05-04.md)
- [0003 — Next 16 proxy migration](docs/adr/0003-next16-proxy-migration.md)
- [0004 — Güvenlik omurgası](docs/adr/0004-guvenlik-omurgasi.md)
- [0005 — Resource-level RBAC](docs/adr/0005-resource-level-rbac.md)

## Test

```bash
bun run test:db:setup  # ilk kez — pusula_test DB oluştur
bun run test           # tüm testler (151+ test)
bun run e2e            # Playwright (3 viewport: mobile, tablet, desktop)
```

## Lisans

İçeride kullanım — kaymakamlıklara özgü deployment.
