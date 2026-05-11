# Socket / Realtime Sağlamlık Planı — Pipeline Ayrımı + Redis Adapter

**Oluşturulma:** 2026-05-09
**Sahibi:** —
**Statü:** 🚧 Devam ediyor — Katman 1 uygulandı (Plan B, ADR-0035), sunucu tarafı bekleniyor; Katman 2 değerlendirmede
**Tip:** Altyapı / Realtime + Deploy
**Tahmini efor:** Katman 1: 1–3 saat · Katman 2: 4–8 saat
**Bağımlılık:** Dokploy panel erişimi, sunucuda `docker service` görünürlüğü, Traefik label edit izni

> **Bağlam:** Pusula app commit'i `git push origin main` → Dokploy `pusula-socket-vrpbmy` servisini de yeniden başlatıyor → bağlı tüm istemcilerin Engine.io session ID'leri sunucuda artık yok → 400 burst, "Çevrimdışı..." toast'ı.
>
> Kısa vadeli müdahale [`hooks/use-socket.ts`](../../hooks/use-socket.ts) içine ardışık 3 `connect_error` sonrası transport reset eklendi (commit `7748cc6` öncesi/sonrası satır 28-76). Bu plan **kalıcı çözümü iki katmanda** tarif eder ve önceki iki ayrı planı (`socket-deploy-pipeline-ayrimi.md` + `socket-redis-adapter-plani.md`) tek dokümanda birleştirir.
>
> **İki katman:**
> - **Katman 1 — Pipeline ayrımı:** Restart **frekansını** düşürür. App commit'i socket'i bozmaz. Sıfır kod (Plan A) veya minimal CI (Plan B).
> - **Katman 2 — Redis adapter + sticky session:** Restart **etkisini** sıfırlar. Kaçınılmaz restart'larda session ve queued event'ler survive eder. Yatay ölçek hazırlığı.

---

## İçindekiler

1. [Problem Tanımı](#1-problem-tanımı)
2. [Hedefler](#2-hedefler)
3. [Mevcut Durum Analizi](#3-mevcut-durum-analizi)
4. [Çözüm Stratejisi — 3 Katman](#4-çözüm-stratejisi--3-katman)
5. [Katman 1 — Pipeline Ayrımı](#5-katman-1--pipeline-ayrımı)
6. [Katman 2 — Redis Adapter + Sticky Session](#6-katman-2--redis-adapter--sticky-session)
7. [Test Planı](#7-test-planı)
8. [Riskler ve Azaltma](#8-riskler-ve-azaltma)
9. [Rollback](#9-rollback)
10. [Kabul Kriterleri](#10-kabul-kriterleri)
11. [Açık Sorular](#11-açık-sorular)
12. [Yapılma Sırası — Roadmap](#12-yapılma-sırası--roadmap)
13. [İlgili Dosyalar](#13-ilgili-dosyalar)
14. [İlerleme Notları](#14-ilerleme-notları)

---

## 1. Problem Tanımı

### 1.1 Birincil Semptom

```
Browser polling worker → /socket.io/?EIO=4&transport=polling&sid=<eski_sid>
Sunucu (yeni instance) → 400 "Session ID unknown"
socket.io-client default reconnection: yavaş toparlanma
Kullanıcı: "Çevrimdışı..." toast'ı, F5 basana kadar 30-60sn ölü süre
```

Commit `7748cc6` ile client tarafında 3-strike reset eklendi → ölü süre **30-60sn → 3-5sn**'ye indi. Ama **kök sebep yerinde duruyor**.

### 1.2 Kanıt — Sunucu Çıktısı (2026-05-09)

```
docker service ps pusula-socket-vrpbmy
NAME                         CURRENT STATE                ERROR
pusula-socket-vrpbmy.1       Running 4 minutes ago
 \_ pusula-socket-vrpbmy.1   Shutdown 4 minutes ago
 \_ pusula-socket-vrpbmy.1   Shutdown 42 minutes ago
 \_ pusula-socket-vrpbmy.1   Shutdown about an hour ago
 \_ pusula-socket-vrpbmy.1   Shutdown about an hour ago
```

**Son 1 saatte 4 restart.**

| Sinyal | Bulgu | Yorum |
|--------|-------|-------|
| ERROR sütunu | Boş | Crash/OOM/non-zero exit yok |
| Memory | 60 MB / 11.68 GB | OOM imkansız |
| Limits | `{}` (boş) | Resource limit baskısı yok |
| Restart policy | `"any"` (varsayılan) | Suçsuz; manuel müdahale değil |
| Crash öncesi log | Normal `[yayinla]` + `handshake` | Hata fırlatmadan kapanmış |
| Yeni instance log | Hemen `[socket] dinleniyor` | Graceful SIGTERM → yeni task |
| Son 5 git commit | `fix(deploy/realtime/socket/seo)` | Yoğun deploy aktivitesi |

**Sonuç:** Container ayağa kalkıp normal çalışıyor, sonra orchestrator (Dokploy) "sen kapan, yeni image deploy ediyorum" diyor. Restart sıklığı git commit sıklığı ile birebir korele.

### 1.3 Kök Neden — Çoklu Katman

| # | Sebep | Katman | Çözüm |
|---|-------|--------|-------|
| 1 | `pusula-app` commit'i `pusula-socket`'i de tetikliyor | Frekans | Katman 1 (pipeline ayrımı) |
| 2 | Stateful socket server, stateless deploy gibi davranılıyor | Etki | Katman 2 (Redis adapter) |
| 3 | `connectionStateRecovery` in-memory tutuluyor | Etki | Katman 2 (adapter-aware recovery) |
| 4 | Tek instance varsayımı | Ölçek | Katman 2 (multi-instance ready) |

### 1.4 Etki

- **Kullanıcı:** Her deploy'da realtime bağlantı kopuyor. Mevcut 3-strike fix sayesinde ~3-5sn ölü süre, ama "Çevrimdışı" toast'ı flash ediyor.
- **Geliştirici:** Frontend mikro değişikliği (örn. typo fix) yapmak realtime'ı bozmak demek; deploy korkusu yaratıyor.
- **Sunucu:** Gereksiz CPU/IO (her redeploy = image pull + container teardown + healthcheck wait).
- **Gelecek:** Yatay ölçek (multi-instance) yapamıyoruz; presence map ve adapter in-memory.

---

## 2. Hedefler

### 2.1 Birincil (Katman 1 hedefleri — zorunlu)

- **H1.** `pusula-app` koduna yapılan push, `pusula-socket-vrpbmy`'yi yeniden başlatmasın.
- **H2.** `socket-server/**` veya gerçekten paylaşılan kod (lib/socket-events, lib/yetki, auth, prisma) değişince **her ikisi de** rebuild olsun (doğru davranış).
- **H3.** Hiçbir kod değişikliği gerektirmeden Dokploy ayarı ile çözülsün (Plan A); olmuyorsa minimum CI shim ile (Plan B).

### 2.2 Birincil (Katman 2 hedefleri — orta vade zorunlu)

- **H4.** Deploy sırasında bağlı kullanıcılar **görsel kesinti yaşamasın** (toast bile çıkmasın, ideal).
- **H5.** Birden fazla `pusula-socket` instance'ı çalıştırabilelim (yatay ölçek hazır).
- **H6.** Mevcut event sözleşmesi (`SOCKET.*`, `EventZarfi<T>`) **bozulmasın** — frontend kod değişikliği minimum.

### 2.3 İkincil (nice-to-have)

- **H7.** Dokploy panelinde "manual redeploy" butonu çalışır kalsın (acil deploy için).
- **H8.** Webhook'a güvenmeyen acil senaryo için sunucudan `docker service update --force pusula-socket-vrpbmy` her zaman çalışsın.
- **H9.** WebSocket transport'unu geri etkinleştir (şu an polling-only; sticky session ile mümkün).
- **H10.** Redis'i ileride başka use-case'lere de hazırla: rate limit, Next.js `unstable_cache`, BullMQ.

### 2.4 Kapsam Dışı

- **Multi-region deploy** (tek bölge — TR-VDS7).
- **Redis Cluster** (single Redis instance yeterli, < 1000 eşzamanlı kullanıcı).
- **Socket.io Admin UI** (ayrı iş).
- **Socket-server'ı ayrı repo'ya çıkarmak** — `lib/` paylaşımı kopyala/sync zorlaştırır; tek repo + path filter daha pragmatik.

---

## 3. Mevcut Durum Analizi

### 3.1 Repo Yapısı

```
pusula/
├── Dockerfile              ← pusula-app (Next.js standalone, port 2500)
├── Dockerfile.socket       ← pusula-socket (Bun socket-server, port 2501)
├── socket-server/
│   └── index.ts            ← socket-server entrypoint
├── lib/
│   ├── socket-events.ts    ← PAYLAŞIMLI (event isimleri + zarf tipi)
│   ├── yetki.ts            ← PAYLAŞIMLI (canKart, canProje)
│   ├── permissions/        ← PAYLAŞIMLI (yetki.ts'in bağımlılıkları)
│   ├── db.ts               ← PAYLAŞIMLI (Prisma client)
│   ├── realtime.ts         ← APP-ONLY (server action → /yayinla wrapper)
│   └── ... (app-only)
├── auth.ts, auth.config.ts ← PAYLAŞIMLI (NextAuth — /api/oturum üzerinden)
├── prisma/schema.prisma    ← PAYLAŞIMLI (her iki Dockerfile prisma generate çalıştırır)
└── ...
```

### 3.2 Dokploy Servisleri

| Servis | Image | Port | Auto-Deploy | Watch Paths |
|--------|-------|------|-------------|-------------|
| `pusula-app` | `pusula-app:latest` | 2500 | ? (doğrulanacak) | ? |
| `pusula-socket-vrpbmy` | `pusula-socket-vrpbmy:latest` | 2501 | ? (doğrulanacak) | ? |
| `pusula-redis` | (yok — Katman 2 ile eklenecek) | 6379 | n/a | n/a |

### 3.3 Server Tarafı — `socket-server/index.ts`

Mevcut yapı:
```ts
const io = new Server(httpServer, {
  cors: { origin: APP_URL, credentials: true },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,  // ← in-memory!
  },
});
```

**Eksiklikler:**
- ❌ Adapter belirtilmemiş → default in-memory adapter
- ❌ `connectionStateRecovery` in-memory store kullanıyor
- ❌ Graceful shutdown handler yok (SIGTERM yakalanmıyor)
- ❌ Sticky session ihtiyacını client iletmiyor (cookie/header yok)
- ❌ Health check Redis durumunu yansıtmıyor (henüz Redis yok)

### 3.4 Client Tarafı — `hooks/use-socket.ts`

```ts
const opts = {
  withCredentials: true,
  autoConnect: false,
  transports: ["polling"],   // ← WebSocket kapalı
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
};
```

**Mevcut yorum (satır 53-57):**
> Production'da long-polling tek transport: Next.js rewrite ile same-origin proxy üzerinden çalışır; WebSocket upgrade rewrite tarafından desteklenmediği için pas geçilir. Latency farkı pratik olarak yok (~10-20 ms).

**Bu varsayım yanlış değil ama eksik:** Doğru sticky session + Traefik WS desteği ile WebSocket upgrade çalışır, latency 10x iyileşir. Katman 2 o kapıyı açar.

**3-strike reset (commit 7748cc6):** Ardışık 3 `connect_error` görünce `disconnect()` + 500ms sonra `connect()`. Engine.io'nun yavaş recovery'sini bypass ediyor. Katman 1 ve Katman 2 sonrası bile defansif olarak kalır.

### 3.5 Socket-Server'ın Build-Time Bağımlılıkları

`Dockerfile.socket`'in `COPY` adımları → image'a giren kaynak:

```dockerfile
COPY socket-server ./socket-server
COPY lib ./lib
COPY prisma ./prisma
COPY auth.ts auth.config.ts ./
COPY package.json bun.lock tsconfig.json ./
```

**Yani:** `lib/` tamamı, `prisma/`, `auth.ts`, `auth.config.ts`, `package.json`, `bun.lock`, `tsconfig.json` + `socket-server/` socket-server'ın build context'i. Trigger path matrisi (§5.4) bu listeden türetilir.

### 3.6 pusula-app'in Build-Time Bağımlılıkları

`Dockerfile`'da `COPY . .` → **her şey** dahil. Ama runtime'da `socket-server/` standalone bundle'ına girmez — Next.js `output: standalone` yalnızca `app/`, `pages/`, `lib/`'in app tarafından import edilen kısmını alır.

**Pratik sonuç:** `socket-server/` içindeki değişiklik pusula-app davranışını **etkilemez** (build cache invalidation dışında). Bu yüzden socket-only path'leri pusula-app trigger'ından hariç tutmak güvenli.

### 3.7 Bağımlı Kod Yerleri (Realtime Yüzeyi)

`pusula-socket` üzerinden geçen tüm event'ler:
- [`socket-server/index.ts`](../../socket-server/index.ts) — ana sunucu
- [`lib/socket-events.ts`](../../lib/socket-events.ts) — event sözleşmeleri
- [`lib/realtime.ts`](../../lib/realtime.ts) — server action → broadcast HTTP wrapper (`/yayinla`)
- [`hooks/use-socket.ts`](../../hooks/use-socket.ts) — client hook
- Bütün `useSocketEvent` çağrıları (project-wide grep)

**Etki:** Adapter swap **sadece** `socket-server/index.ts` dosyasını değiştirir. Geri kalan her şey transparan.

### 3.8 Deploy Tarafı — `docs/deploy/sunucu-kurulum.md`

- §8.8'de WebSocket support: ENABLE yazılı ama Traefik label'larda sticky session yok.
- Redis servisi mevcut değil (Dokploy'un kendi `dokploy-redis`'i var ama o paneli için, Pusula'ya verilemez).
- §10'da backup stratejisinde Redis yok; eklenmesi opsiyonel — pub/sub + session state ephemeral, AOF persistence yeterli.

---

## 4. Çözüm Stratejisi — 3 Katman

```
                ┌──────────────────────────────────────────────┐
                │  KATMAN 0 — Client 3-strike reset            │
                │  Statü: ✅ Yapıldı (commit 7748cc6)          │
                │  Etki: Ölü süre 30-60sn → 3-5sn              │
                └──────────────────────────────────────────────┘
                                    │
                                    ▼
                ┌──────────────────────────────────────────────┐
                │  KATMAN 1 — Pipeline Ayrımı                  │
                │  Statü: 📋 Plan hazır                        │
                │  Etki: Restart frekansı saatlik → haftalık   │
                │  Efor: 1-3 saat (Plan A) veya +2 (Plan B)   │
                │  Risk: Düşük (rollback 60sn)                 │
                └──────────────────────────────────────────────┘
                                    │
                                    ▼
                ┌──────────────────────────────────────────────┐
                │  KATMAN 2 — Redis Adapter + Sticky Session  │
                │  Statü: 📋 Plan hazır, değerlendirmede       │
                │  Etki: Restart sırasında 0sn ölü süre        │
                │       + multi-instance hazır                 │
                │  Efor: 4-8 saat                              │
                │  Risk: Orta (yeni servis + sticky session)  │
                └──────────────────────────────────────────────┘
```

**Strateji:**

1. **Katman 0** zaten yapıldı — defansif baseline.
2. **Katman 1**'i bu hafta uygula: hızlı kazanç, sıfır mimari değişiklik. Çoğu deploy zaten app-only — frekans dramatik düşer.
3. **Katman 2**'yi 2-3 hafta gözle, gerçekten gerekli mi karar ver. Eğer Katman 1 sonrası restart sıklığı çok azaldıysa Katman 2 "scale ihtiyacı varsa" tetikleyicisine bağlanabilir.

**Bağımsızlık:** Katmanlar bağımsız uygulanabilir, biri olmadan diğeri çalışır.

---

## 5. Katman 1 — Pipeline Ayrımı

### 5.1 Çözüm Seçenekleri

#### Seçenek A — Dokploy Watch Paths (önerilen)

Dokploy v0.13+ servis ayarlarında **"Watch Paths"** / **"Paths"** filter alanı var (sürüme göre isim değişebilir). Glob veya regex ile path tanımlanır; sadece eşleşen dosyalar değişince auto-deploy tetiklenir.

| Artı | Eksi |
|------|------|
| Sıfır kod değişikliği | Dokploy sürümünün desteklemesi gerek |
| Dokploy panelinden tek tıkla | Glob syntax varyasyonu (sürümler arası) |
| Her servis bağımsız ayar | Yanlış path → silent miss |

#### Seçenek B — GitHub Actions ile Path-Filtered Webhook

Dokploy "Watch Paths" yoksa ya da çalışmıyorsa: Dokploy auto-deploy'u **kapat**, `dokploy/webhook` URL'lerini repo secret'larına koy, GitHub Actions `paths-filter` ile sadece ilgili servisi tetikle.

| Artı | Eksi |
|------|------|
| Tam kontrol, glob esnekliği | İki secret + bir workflow dosyası |
| Audit log GitHub'da | Manual deploy için ayrı `workflow_dispatch` lazım |
| Dokploy sürümünden bağımsız | Webhook URL'leri sızarsa kötü adam deploy edebilir |

#### Seçenek C — Monorepo Split (önerilmez)

socket-server'ı ayrı repo'ya çıkar; `lib/socket-events.ts`, `lib/yetki.ts`, `auth.ts`, `prisma/schema.prisma` git submodule veya npm package olarak paylaş.

| Artı | Eksi |
|------|------|
| Net ayrım | `lib/` paylaşımı çok ağrı (submodule sync, versiyon, test) |
| | DDD/feature paritesi bozulur |
| | Geri dönüşü zor |

**Karar:** C **kapalı**. A önce, A imkansızsa B.

#### Seçenek D — Auto-Deploy Kapat + Manuel (geçici fallback)

`pusula-socket-vrpbmy` servisinde auto-deploy'u kapat. Socket kodu değişince sunucuda `docker service update --force pusula-socket-vrpbmy`.

| Artı | Eksi |
|------|------|
| 5 dakikalık çözüm | Unutulur → socket eski koda kalır |
| | "Hızlı fix"in en yaygın başarısızlık modu |

**Karar:** D yalnızca A ve B'nin ikisi de imkansızsa son çare.

### 5.2 Önerilen Mimari

```
                    ┌─ git push origin main ─┐
                    │                        │
                    ▼                        ▼
        ┌─────────────────────┐  ┌─────────────────────┐
        │  GitHub Webhook /   │  │  GitHub Webhook /   │
        │  GitHub Actions     │  │  GitHub Actions     │
        └─────────┬───────────┘  └──────────┬──────────┘
                  │                          │
       paths matching:              paths matching:
       app/, components/,           socket-server/,
       lib/!socket-events,          lib/socket-events.ts,
       lib/!yetki,                  lib/yetki.ts,
       auth.ts, prisma/,            lib/permissions/,
       Dockerfile, package.json     auth.ts, prisma/,
                  │                  Dockerfile.socket,
                  │                  package.json
                  ▼                          ▼
        ┌─────────────────────┐  ┌─────────────────────┐
        │  Dokploy            │  │  Dokploy            │
        │  pusula-app deploy  │  │  pusula-socket dpl. │
        └─────────────────────┘  └─────────────────────┘
```

**Özet:**
- Tek repo → iki bağımsız deploy hattı.
- Paylaşılan dosyalar (`auth.ts`, `prisma/`, `package.json`, `lib/socket-events.ts`, `lib/yetki.ts`, `lib/permissions/`) **her iki** trigger'a da yazılır → değişince ikisi de rebuild olur.
- Socket-only dosyalar (`socket-server/`, `Dockerfile.socket`) sadece socket trigger'ında.
- App-only dosyalar (`app/`, `components/`, `Dockerfile`, `next.config.ts`) sadece app trigger'ında.

### 5.3 Uygulama Adımları

#### 5.3.1 Doğrulama (sunucuda + Dokploy panelinde)

Sunucuda:

```bash
# A) Image son güncellenme zamanı — restart sıklığını teyit et
docker service inspect pusula-socket-vrpbmy --format '{{.UpdatedAt}}'
docker service inspect pusula-app --format '{{.UpdatedAt}}'

# B) Servisin GitHub bağlantısını ve branch'ini gör (Dokploy state'i)
docker service inspect pusula-socket-vrpbmy \
  --format '{{json .Spec.Labels}}' | jq

# C) Son 24 saatlik image build geçmişi (registry'de)
docker service ps pusula-socket-vrpbmy --no-trunc
```

Dokploy panelinde:

1. `pusula-app` → **General** → **Auto Deploy** açık mı?
2. `pusula-socket-vrpbmy` → **General** → **Auto Deploy** açık mı?
3. İkisinin de **Watch Paths** / **Paths** alanı var mı? (Sürüm tespiti)
4. **Deployments** sekmesinde son deploy'ların "trigger" sebebi ne yazıyor?

> **Çıkarsama:** Eğer her iki servis de aynı GitHub repo + main branch'e bağlı ve Auto Deploy açıksa, her push iki webhook'u da tetikliyor → kanıt tamam.

#### 5.3.2 Plan A — Dokploy Watch Paths (eğer destekleniyorsa)

**`pusula-socket-vrpbmy` servisi için Watch Paths:**

```
socket-server/**
lib/socket-events.ts
lib/yetki.ts
lib/permissions/**
lib/db.ts
auth.ts
auth.config.ts
prisma/schema.prisma
prisma/migrations/**
Dockerfile.socket
.dockerignore
package.json
bun.lock
tsconfig.json
```

**`pusula-app` servisi için Watch Paths** (Dokploy'da exclude syntax varsa):

```
!socket-server/**
!Dockerfile.socket
**
```

Dokploy exclude syntax desteklemezse, daha güvenli **whitelist** yaklaşımı:

```
app/**
components/**
hooks/**
lib/**
public/**
auth.ts
auth.config.ts
middleware.ts
next.config.ts
tailwind.config.*
prisma/**
Dockerfile
package.json
bun.lock
tsconfig.json
scripts/entrypoint.sh
```

> **Not:** `lib/socket-events.ts` ve `lib/yetki.ts` her iki listede de var — bu kasıtlı, paylaşımlı kod.

#### 5.3.3 Plan B — GitHub Actions Webhook Shim (Plan A imkansızsa)

**1) Dokploy'da auto-deploy'u kapat.** Her iki servis: **General → Auto Deploy: OFF**.

**2) Webhook URL'lerini al.** Dokploy → her servis → **Webhooks** sekmesi → **Manual Trigger Webhook** URL'ini kopyala.

**3) GitHub repo secret'ları ekle.** Settings → Secrets and variables → Actions:
- `DOKPLOY_APP_WEBHOOK` — pusula-app webhook URL
- `DOKPLOY_SOCKET_WEBHOOK` — pusula-socket webhook URL

**4) `.github/workflows/deploy.yml` ekle:**

```yaml
name: Deploy
on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      target:
        description: "Manuel deploy hedefi"
        required: true
        type: choice
        options: [app, socket, both]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      app: ${{ steps.filter.outputs.app }}
      socket: ${{ steps.filter.outputs.socket }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            shared: &shared
              - 'auth.ts'
              - 'auth.config.ts'
              - 'lib/socket-events.ts'
              - 'lib/yetki.ts'
              - 'lib/permissions/**'
              - 'lib/db.ts'
              - 'prisma/**'
              - 'package.json'
              - 'bun.lock'
              - 'tsconfig.json'
            app:
              - *shared
              - 'app/**'
              - 'components/**'
              - 'hooks/**'
              - 'lib/**'
              - 'public/**'
              - 'middleware.ts'
              - 'next.config.ts'
              - 'tailwind.config.*'
              - 'Dockerfile'
              - 'scripts/entrypoint.sh'
            socket:
              - *shared
              - 'socket-server/**'
              - 'Dockerfile.socket'
              - '.dockerignore'

  deploy-app:
    needs: detect-changes
    if: |
      needs.detect-changes.outputs.app == 'true' ||
      github.event.inputs.target == 'app' ||
      github.event.inputs.target == 'both'
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsSL -X POST "${{ secrets.DOKPLOY_APP_WEBHOOK }}"

  deploy-socket:
    needs: detect-changes
    if: |
      needs.detect-changes.outputs.socket == 'true' ||
      github.event.inputs.target == 'socket' ||
      github.event.inputs.target == 'both'
    runs-on: ubuntu-latest
    steps:
      - run: curl -fsSL -X POST "${{ secrets.DOKPLOY_SOCKET_WEBHOOK }}"
```

> `*shared` YAML anchor'ı `dorny/paths-filter` v3'te desteklenir; v2 ise her listede tekrarla.

#### 5.3.4 Plan D — Acil Fallback

`pusula-socket-vrpbmy` servisinde **Auto Deploy: OFF**. Socket kodu değişince:

```bash
docker service update --force --image pusula-socket-vrpbmy:latest pusula-socket-vrpbmy
```

CLAUDE.md veya runbook'a "socket değiştiğinde manuel deploy" notu ekle. **Geçici, kalıcı değil.**

### 5.4 Trigger Path Matrisi

| Path | pusula-app trigger? | pusula-socket trigger? | Gerekçe |
|------|:---:|:---:|---|
| `app/**` | ✅ | ❌ | Next.js route'ları, sadece app |
| `components/**` | ✅ | ❌ | React component'leri |
| `hooks/**` | ✅ | ❌ | React hook'ları (use-socket vb.) |
| `public/**` | ✅ | ❌ | Static asset |
| `middleware.ts` | ✅ | ❌ | Next.js middleware |
| `next.config.ts` | ✅ | ❌ | Next config (rewrite vb.) |
| `tailwind.config.*` | ✅ | ❌ | Tailwind |
| `Dockerfile` | ✅ | ❌ | Sadece app build |
| `scripts/entrypoint.sh` | ✅ | ❌ | Sadece app entrypoint |
| `socket-server/**` | ❌ | ✅ | Sadece socket entrypoint |
| `Dockerfile.socket` | ❌ | ✅ | Sadece socket build |
| `lib/socket-events.ts` | ✅ | ✅ | **Paylaşımlı** event sözleşmesi |
| `lib/yetki.ts` | ✅ | ✅ | **Paylaşımlı** auth helper |
| `lib/permissions/**` | ✅ | ✅ | yetki.ts bağımlılığı |
| `lib/db.ts` | ✅ | ✅ | **Paylaşımlı** Prisma client |
| `lib/**` (diğer) | ✅ | ⚠️ | Çoğu app-only ama dikkat — bkz §8 R2 |
| `auth.ts`, `auth.config.ts` | ✅ | ✅ | **Paylaşımlı** — `/api/oturum` forward eder |
| `prisma/schema.prisma` | ✅ | ✅ | Generated client her iki image'da |
| `prisma/migrations/**` | ✅ | ✅ | Her iki image migration deploy etmiyor ama schema'ya bağlı |
| `package.json`, `bun.lock` | ✅ | ✅ | Bağımlılık değişince ikisi de |
| `tsconfig.json` | ✅ | ✅ | Path alias değişikliği etkiler |
| `.dockerignore` | ✅ | ✅ | Build context her ikisinde |
| `docs/**`, `tests/**`, `*.md` | ❌ | ❌ | Build'e girmez (`.dockerignore`'da) |
| `.claude/**`, `CLAUDE.md` | ❌ | ❌ | `.dockerignore`'da |

> **Önemli:** Plan A'da Dokploy whitelist yaklaşımı kullanılırsa, "✅" olan tüm path'ler ilgili servisin watch listesine yazılır. Exclude yaklaşımı destekleniyorsa app trigger'ında `!socket-server/**` + `!Dockerfile.socket` yeterli.

---

## 6. Katman 2 — Redis Adapter + Sticky Session

### 6.1 Önerilen Mimari

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Browser    │────▶│   Traefik    │────▶│ pusula-socket #1 │
│ (sid: X)    │     │  (sticky:    │     │                  │
└─────────────┘     │   io cookie) │     └────────┬─────────┘
                    │              │              │ pub/sub
                    │              │     ┌────────▼─────────┐
                    │              │────▶│ pusula-socket #2 │
                    └──────────────┘     │  (gelecekte)     │
                                         └────────┬─────────┘
                                                  │
                                         ┌────────▼─────────┐
                                         │  pusula-redis    │
                                         │  (adapter +      │
                                         │   session store) │
                                         └──────────────────┘
```

### 6.2 Bileşenler

| Bileşen | Rol | Versiyon (önerilen) |
|---------|-----|---------------------|
| `@socket.io/redis-adapter` | Pub/sub broadcast cross-instance | `^8.x` (socket.io v4 ile uyumlu) |
| `@socket.io/redis-streams-adapter` | Alternatif: Streams tabanlı, message guarantee | Değerlendir, ama RedisAdapter v8 yeterli |
| `redis` veya `ioredis` | Redis client | `redis@^4` veya `ioredis@^5` |
| `pusula-redis` Dokploy servisi | Redis 7-alpine | `redis:7-alpine` |
| Traefik sticky session | `io` cookie veya custom cookie ile aynı pod'a yönlendirme | Traefik label config |

### 6.3 Connection State Recovery — Redis-Backed

Socket.io v4.6+ `connectionStateRecovery` adapter-aware:
- Redis adapter kullanıldığında recovery state Redis'te tutulur
- TTL = `maxDisconnectionDuration` (mevcut: 2dk — yeterli)
- Restart sonrası istemci aynı `sid + offset` ile gelirse → tüm queued event'leri Redis'ten alır

### 6.4 Sticky Session Stratejisi

**Seçenekler:**

| Yöntem | Artı | Eksi |
|--------|------|------|
| Traefik `loadBalancer.sticky.cookie` | Standart, Dokploy'da label ile aktif | Cookie-based; SameSite ayarı dikkat |
| `io` cookie (Engine.io built-in) | Socket.io kendi yönetir | Traefik bunu okumaz, Layer 7 inspection lazım |
| IP hash | Cookie'siz | Mobile/NAT'lı kullanıcılar farklı pod'lara dağılabilir |

**Karar:** Traefik cookie sticky → Engine.io `io` cookie ile karıştırma; Traefik'in kendi `_pusula_sticky` cookie'sini kullan.

```yaml
# Dokploy panel → pusula-socket → Advanced → Traefik Labels
- traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.name=_pusula_sticky
- traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.secure=true
- traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.samesite=lax
- traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.httponly=true
```

### 6.5 Graceful Shutdown

```ts
// socket-server/index.ts (eklenecek)
const SHUTDOWN_TIMEOUT_MS = 15_000;

function gracefulShutdown(signal: string): void {
  console.log(`[socket] ${signal} alındı, graceful shutdown başlıyor`);
  io.close(() => {
    console.log("[socket] Tüm bağlantılar kapatıldı");
    httpServer.close(() => {
      console.log("[socket] HTTP server kapatıldı");
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.log("[socket] Timeout — zorla kapatılıyor");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
```

**Dokploy default:** SIGTERM → 10sn → SIGKILL. Termination grace period 30s'e çıkartılmalı (Dokploy panel ayarı).

### 6.6 Uygulama Adımları

> **Sıra:** Her adım ayrı commit. Her commit `bun run verifier` geçmeli (Kural 86).

#### 6.6.1 Bağımlılık Ekleme

```bash
bun add @socket.io/redis-adapter redis
# ALTERNATİF: bun add @socket.io/redis-adapter ioredis
```

**Karar noktası:** `redis@4` (resmi, modern API) vs `ioredis` (battle-tested, Sentinel desteği). Pusula tek-instance Redis kullanacağı için `redis@4` yeterli, daha az bağımlılık. (Kural 4: yeni paket = saldırı yüzeyi → CVE check.)

#### 6.6.2 Dokploy'da `pusula-redis` Servisi

Dokploy panel:
- **Add Service → Database → Redis**
- Name: `pusula-redis`
- Image: `redis:7-alpine`
- Port: 6379 (sadece internal — dış erişim YOK)
- Volume: `pusula-redis-data` → `/data` (AOF persistence için)
- Command: `redis-server --appendonly yes --requirepass <güçlü-parola>`
- Environment: `TZ=Europe/Istanbul`

Bağlantı string'i (internal):
```
redis://default:<parola>@pusula-redis:6379
```

**Backup:** Redis state ephemeral (sadece session recovery + pub/sub). AOF persistence kullanıcıya görünmez bir şekilde 2dk'lık recovery'i koruyor — restart'ta restore yeterli, off-site backup gereksiz.

#### 6.6.3 Server Kod Değişikliği

[`socket-server/index.ts`](../../socket-server/index.ts):

```ts
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL && process.env.NODE_ENV === "production") {
  throw new Error("REDIS_URL ortam değişkeni production'da zorunludur.");
}

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

const io = new Server(httpServer, {
  cors: { origin: APP_URL, credentials: true },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
  },
  adapter: createAdapter(pubClient, subClient),  // ← KEY CHANGE
});
```

**Dev fallback:** `REDIS_URL` set edilmediyse → in-memory adapter'a düş, uyarı log'la. Lokal geliştirmede Redis çalıştırma zorunluluğu yok (mevcut deneyim bozulmasın).

#### 6.6.4 Client Kod Değişikliği

[`hooks/use-socket.ts`](../../hooks/use-socket.ts):

```ts
const opts = {
  withCredentials: true,
  autoConnect: false,
  transports: ["websocket", "polling"],  // ← WebSocket öncelikli
  upgrade: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
};
```

**ÖNEMLİ:** WebSocket transport sticky session ile çalışır; ilk handshake long-poll, sonra WS'ye upgrade. Sticky session yoksa upgrade fail'inde polling'e fallback. Mevcut `_ardisikHataSayisi` reset logic'i KALSIN (defansif kod).

#### 6.6.5 Env Değişkenleri

`.env.example` ve Dokploy panel:

```bash
# pusula-socket için yeni:
REDIS_URL=redis://default:<parola>@pusula-redis:6379

# pusula-app için: (rate-limit Redis'e taşınırsa, ayrı planda)
# REDIS_URL=redis://default:<parola>@pusula-redis:6379
```

#### 6.6.6 Traefik Sticky Session

Dokploy → `pusula-socket` servisi → **Advanced → Traefik Labels** (§6.4'teki label'lar).

#### 6.6.7 Graceful Shutdown Handler

`socket-server/index.ts` sonuna §6.5'teki kod parçası eklenir.

Dokploy → `pusula-socket` → **Advanced → Termination grace period**: `30s` (default 10s).

#### 6.6.8 Health Check Genişletme

Mevcut `/saglik` endpoint'i sadece `{ ok: true, ts }` dönüyor. Redis bağlantısını da check etsin:

```ts
if (req.url === "/saglik" && req.method === "GET") {
  const redisOk = pubClient.isReady;
  res.writeHead(redisOk ? 200 : 503, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: redisOk, redis: redisOk, ts: Date.now() }));
  return;
}
```

#### 6.6.9 Dokümantasyon Güncellemesi

- [ ] [`docs/deploy/sunucu-kurulum.md`](../deploy/sunucu-kurulum.md) §7'ye "Redis servisi" alt bölümü ekle
- [ ] §8.8'de socket-server env list'ine `REDIS_URL` ekle
- [ ] §8.8'de Traefik sticky session label'larını ekle
- [ ] `docs/adr/NNNN-socket-redis-adapter.md` ADR yaz (Kural 102 — büyük teknik karar)
- [ ] `CHANGELOG.md` "Değişen" altına satır

---

## 7. Test Planı

### 7.1 Katman 1 — Pipeline Senaryo Matrisi

| # | Değişiklik | Beklenen pusula-app | Beklenen pusula-socket |
|---|-----------|:---:|:---:|
| T1 | `app/page.tsx` whitespace | Deploy | — |
| T2 | `socket-server/index.ts` whitespace | — | Deploy |
| T3 | `lib/socket-events.ts` (yeni event) | Deploy | Deploy |
| T4 | `auth.ts` (auth callback değişimi) | Deploy | Deploy |
| T5 | `prisma/schema.prisma` (yeni alan) | Deploy | Deploy |
| T6 | `Dockerfile` (app build optimizasyonu) | Deploy | — |
| T7 | `Dockerfile.socket` (socket runtime fix) | — | Deploy |
| T8 | `docs/issues/foo.md` (sadece doc) | — | — |
| T9 | `package.json` (yeni dep ekle) | Deploy | Deploy |
| T10 | `README.md` | — | — |

**Yürütme:** Test branch'i `chore/deploy-pipeline-test`. Her senaryo için:
1. Tek dosya değiştir (whitespace yeterli — anlamlı diff şart değil).
2. `git commit -m "test: T<n>" && git push`.
3. Dokploy panel **Deployments** sekmesinde her iki servisi gözle.
4. Beklenen ile karşılaştır.

> Her test 2-5 dk sürer. Toplam ~30-40 dk.

### 7.2 Katman 1 — Regresyon Kontrolü

- T2 sonrası: tarayıcı açık tut, deploy sırasında 400 burst'ünü gözle. **Beklenti:** ~3-5sn içinde "Bağlantı yenilendi" toast'ı (3-strike fix sayesinde).
- T1 sonrası: tarayıcıda socket bağlantısı **hiç kopmamalı** (kanıt: `[socket] dinleniyor` log'u tekrar etmemeli).
- T3 sonrası: Hem app hem socket yeniden başladıktan sonra event yayını çalışıyor mu (manuel: bir kart oluştur, başka pencerede görünmeli).

### 7.3 Katman 2 — Birim Testler (yeni)

`socket-server/index.test.ts` (yeni):
- Adapter swap'in event ulaştırmayı bozmadığı (in-memory mock Redis)
- Graceful shutdown handler SIGTERM'de `io.close()` çağırıyor mu
- Health check Redis down olduğunda 503 dönüyor mu

> Not: socket.io test edilmesi normalde fixture-heavy. **Saf logic varsa ayır** (Kural 131): adapter init logic'i, shutdown logic'i pure fonksiyon olarak çıkar, onlara test yaz.

### 7.4 Katman 2 — Integration Testler

`docker-compose.test.yml` (geçici):
- 1 Redis + 2 socket-server instance ayağa kaldır
- Frontend simülasyonu: `socket.io-client` ile #1'e bağlan, server action `/yayinla` ile #2 üzerinden broadcast yap → #1'deki client event'i alıyor mu

### 7.5 Katman 2 — Manuel Deploy Senaryosu (En Kritik)

| # | Adım | Beklenen |
|---|------|----------|
| 1 | Tarayıcıda Pusula açık, kart sayfasında, başka kullanıcı kart düzenliyor | Realtime update geliyor |
| 2 | `pusula-socket` rebuild trigger | — |
| 3 | Container restart (10-30sn) | Tarayıcıda **toast çıkmamalı** veya sadece "Bağlantı yenileniyor..." (1sn'lik) |
| 4 | Restart sonrası başka kullanıcı kart düzenliyor | Realtime update geliyor (kayıp event yok) |
| 5 | DevTools Network → WS frame'leri akıyor | Polling'e fallback olmamış |

### 7.6 Katman 2 — Yük Testi (opsiyonel)

`k6` ile 100 eşzamanlı socket bağlantısı, 5dk boyunca event akışı, deploy mid-test → recovery rate >95%.

### 7.7 Lokal Geliştirme Doğrulaması

`REDIS_URL` set edilmemiş → server in-memory adapter'a düşüyor, uyarı log'u var, tüm event'ler çalışıyor (mevcut dev workflow bozulmadı).

---

## 8. Riskler ve Azaltma

### 8.1 Katman 1 Riskleri

#### R1 — Eksik trigger path → bir servis güncellenmez

**Senaryo:** `lib/permissions/karar.ts` değişti, ama socket trigger'ında `lib/permissions/**` unutulmuş → socket eski yetki mantığıyla çalışmaya devam eder.

**Azaltma:**
- Trigger matrisini (§5.4) PR review checklist'ine ekle.
- 2 hafta boyunca her cuma sunucuda `docker service inspect <servis> --format '{{.UpdatedAt}}'` çalıştır, son commit ile karşılaştır — drift varsa path eksik demektir.
- Daha zayıf ama otomatik: GitHub Actions'a haftalık `workflow_dispatch` ile `target: both` çalıştır.

#### R2 — `lib/**` glob çok geniş

**Senaryo:** `lib/mail.ts` değişti — socket'in işine yaramaz ama trigger'a `lib/**` yazılırsa socket de rebuild olur.

**Azaltma:**
- §5.4'teki gibi **socket için sadece spesifik lib dosyalarını** listele.
- Yanlış yön: `lib/**` socket trigger'ına koymak.
- Doğru yön: app trigger'ına `lib/**`, socket trigger'ına spesifik dosyalar.

#### R3 — Plan B webhook URL sızıntısı

**Senaryo:** `DOKPLOY_*_WEBHOOK` secret'ı public log'a düşer → kötü adam deploy tetikler.

**Azaltma:**
- GitHub Actions log'unda secret otomatik maskelenir (`***`), ama `set -x` veya `echo $URL` yazma.
- Dokploy'da webhook URL'sini **dönderebilirsen** (regenerate) ayda bir döndür.
- Webhook'lar deploy tetikler, kod inject etmez — blast radius sınırlı (eski main commit'i tekrar deploy).

#### R4 — Dokploy sürümü Watch Paths desteklemez

**Azaltma:** Hemen Plan B'ye geç, kod değişikliği zaten ufak. Veya Dokploy'u güncelle.

#### R5 — Manual deploy ihtiyacı

**Azaltma:**
- Dokploy panel **"Redeploy"** butonu her zaman çalışır (Auto Deploy off bile).
- Plan B'de `workflow_dispatch` ile `target: socket` seçilebilir.
- Sunucudan: `docker service update --force pusula-socket-vrpbmy`.

### 8.2 Katman 2 Riskleri

| Risk | Etki | Olasılık | Azaltma |
|------|------|----------|---------|
| Redis down → tüm socket trafiği durur | Kritik | Düşük | Redis AOF + Dokploy auto-restart; monitor + alert; in-memory fallback **production'da YASAK** ama health check 503 → Traefik trafiği kesmez (sticky), istemci reconnect döngüsünde kalır |
| Sticky cookie 3rd-party domain'de blocked | Orta | Düşük | SameSite=Lax + Secure; aynı domain üstünden serve ediliyor zaten (`socket.pusula.example.com`) |
| Pub/sub mesaj büyüklüğü Redis limit'i aşar | Düşük | Çok düşük | Pusula event payload'ları küçük (kart ID + meta); 32MB hard limit'in çok altında |
| `connectionStateRecovery` Redis-backed varsayımı yanlışsa | Orta | Düşük | Resmi docs ile doğrula (socket.io v4.6+ adapter-aware); manuel deploy testinde gözle gör |
| Yeni bağımlılık CVE'si | Düşük | Düşük | `bun audit` ekle; `redis@4` ve `@socket.io/redis-adapter@8` battle-tested |
| Graceful shutdown timeout'u kısa → bağlantı kopması | Düşük | Orta | Dokploy panel'de 30sn; ayrıca `io.close()` callback ile gerçek bitiş bekleniyor |
| Dev environment Redis ihtiyacı yeni geliştiriciyi yavaşlatır | Düşük | Yüksek | In-memory fallback (§6.6.3) ile dev'de Redis opsiyonel |
| Redis parolası leak | Yüksek | Düşük | Sadece internal network; Dokploy secret manager; rotate edilebilir |

---

## 9. Rollback

### 9.1 Katman 1 Rollback

#### Plan A geri alma

1. Dokploy → her servis → **Watch Paths** alanını **boşalt** (eski davranış: her path tetikler).
2. Auto Deploy zaten açık kalıyor → push → eskisi gibi ikisi de deploy.

#### Plan B geri alma

1. Dokploy → her servis → **Auto Deploy: ON** (kapatmıştık).
2. `.github/workflows/deploy.yml` dosyasını sil veya `on:` bloğunu boşalt.
3. Bir test commit at → Dokploy webhook'u eskisi gibi çalışmaya devam ediyor.

#### Plan D geri alma

1. Dokploy → `pusula-socket-vrpbmy` → **Auto Deploy: ON**.

> Üç plan da non-destructive: yanlış path → "fazla deploy" olur, sıfır data kaybı.

### 9.2 Katman 2 Rollback

#### Anlık Rollback

Dokploy → `pusula-socket` → **Deployments → Rollback** → eski commit'e dön.

#### Adapter Geri Alma (Kod)

Tek commit'te toplu geri alma:
```bash
git revert <commit-hash>  # adapter ekleyen commit
```

- `REDIS_URL` env'i kaldır (zarar yok, ignore edilir).
- `pusula-redis` Dokploy servisi şimdilik **bırakılır** (silmeden, çünkü 2. denemede tekrar lazım olur).

#### Veri Kaybı?

**Yok.** Redis sadece ephemeral session state ve pub/sub channel. Audit log + business data Postgres'te. Rollback Postgres'e dokunmaz.

---

## 10. Kabul Kriterleri

### 10.1 Katman 1 Kriterleri

- [ ] **K1.1** §7.1'deki 10 test senaryosunun en az 9'u beklenen davranışı verir.
- [ ] **K1.2** Sadece `socket-server/index.ts` değişen bir push'tan sonra `docker service ps pusula-app | head` çıktısında **yeni Running task yok** (UpdatedAt değişmedi).
- [ ] **K1.3** Sadece `app/page.tsx` değişen bir push'tan sonra tarayıcıda socket bağlantısı kopmaz; console'da `connect_error` yok.
- [ ] **K1.4** Bir hafta gözlem: `docker service ps pusula-socket-vrpbmy` çıktısında 1 saatlik pencerede en fazla **1 Shutdown** (önceki: 4).
- [ ] **K1.5** Manual redeploy butonu (panel) ve `workflow_dispatch` (Plan B'deyse) çalışıyor.
- [ ] **K1.6** Bu plan dosyasının §14 İlerleme Notları bölümü güncellendi (uygulanan plan: A/B/D + tarih).

### 10.2 Katman 2 Kriterleri

- [ ] **K2.1** `socket-server/index.ts` Redis adapter ile çalışıyor (production env'de).
- [ ] **K2.2** `pusula-redis` Dokploy servisi healthy.
- [ ] **K2.3** Traefik sticky session cookie set ediliyor (DevTools'tan doğrula).
- [ ] **K2.4** WebSocket transport upgrade çalışıyor (DevTools → Network → WS frame).
- [ ] **K2.5** Manuel deploy testi (§7.5): restart sırasında kullanıcı görünür kesinti yaşamıyor.
- [ ] **K2.6** Birim testler PASS, `bun run verifier` PASS (Kural 86).
- [ ] **K2.7** Health check `/saglik` Redis durumunu yansıtıyor.
- [ ] **K2.8** `docs/deploy/sunucu-kurulum.md` ve `docs/adr/NNNN-*.md` yazıldı.
- [ ] **K2.9** `CHANGELOG.md` güncellendi.
- [ ] **K2.10** Lokal dev workflow bozulmadı (REDIS_URL set edilmeden çalışıyor).
- [ ] **K2.11** Graceful shutdown 30sn içinde tüm bağlantıları temiz kapatıyor.

---

## 11. Açık Sorular

> Plan onayı sırasında karar verilecek noktalar.

### 11.1 Katman 1

1. **Dokploy versiyonu Watch Paths destekliyor mu?** §5.3.1 doğrulamasında belli olur.
2. **Webhook URL'leri bilinçli olarak rotate edilecek mi?** Plan B kullanılacaksa.

### 11.2 Katman 2

3. **Redis client:** `redis@4` mü, `ioredis@5` mi? (Öneri: `redis@4` — daha az dep)
4. **Sticky cookie ismi:** `_pusula_sticky` mi, başka bir şey mi?
5. **WebSocket transport'unu hemen aç mı, ayrı commit'te mi aç?** (Öneri: ayrı commit — adapter swap kendi başına test edilsin, WS upgrade ayrı risk)
6. **Rate-limit'i de Redis'e taşımak bu plana eklensin mi?** (Öneri: hayır — ayrı plan, scope creep'i engelle)
7. **Connection state recovery TTL'i 2dk yeterli mi?** (Öneri: evet — kullanıcı 2dk+ offline ise zaten yeni session açsın)

### 11.3 Strateji

8. **Katman 2'ye gerçekten ihtiyaç var mı?** Katman 1 sonrası 1-2 hafta gözle: deploy frekansı haftalık 1-2'ye düştüyse Katman 2 belki gerekmez (defer). Sadece scale ihtiyacı veya "toast hâlâ rahatsız ediyor" geri bildirimi gelirse uygula.

---

## 12. Yapılma Sırası — Roadmap

### 12.1 Hafta 1 — Katman 1 (Pipeline Ayrımı)

```
1. §5.3.1 doğrulama (sunucu + Dokploy panel)
2. Plan A/B kararı (Dokploy versiyonuna göre)
3. Plan A: Watch Paths ayarı
   veya
   Plan B: GitHub Actions deploy.yml + secret'lar
4. §7.1 test matrisi (T1-T10)
5. 1 hafta gözlem: restart frekansı dropping?
6. §10.1 Katman 1 kabul kriterleri tikleme
```

**Çıktı:** Restart frekansı saatlik → haftalık. Çoğu deploy app-only, socket dokunulmuyor.

### 12.2 Karar Noktası — Katman 2 Gerekli mi?

```
EĞER 1 haftalık gözlem sonucu:
  - Restart sıklığı düştü ✅
  - Mevcut 3-strike client fix yeterince smooth (kullanıcı şikayet yok)
THEN:
  Katman 2'yi DEFER et — scale ihtiyacı çıkana kadar bekle
ELSE:
  Katman 2'yi başlat (12.3'e geç)
```

### 12.3 Hafta 2-3 — Katman 2 (Redis Adapter, gerekli ise)

```
1. bun add @socket.io/redis-adapter redis
2. Dokploy → pusula-redis servisi oluştur
3. socket-server/index.ts → adapter ekle, dev fallback yaz
4. socket-server/index.ts → graceful shutdown + health check Redis-aware
5. Lokal test (Redis container'lı + container'sız)
6. Dokploy → REDIS_URL env, Traefik sticky labels, grace period 30s
7. Staging deploy → manuel deploy senaryosu (§7.5)
8. hooks/use-socket.ts → WebSocket transport aç (ayrı commit)
9. Tekrar manuel test
10. ADR + docs + CHANGELOG
11. Production deploy
12. 1 hafta gözlem (deploy sırasında toast yok kontrolü)
13. §10.2 Katman 2 kabul kriterleri tikleme
```

**Çıktı:** Deploy sırasında 0sn ölü süre. Multi-instance hazır. WebSocket transport aktif (10x latency iyileşmesi).

---

## 13. İlgili Dosyalar

### 13.1 Değişecek

#### Katman 1
- (Plan B uygulanırsa) `.github/workflows/deploy.yml` — yeni
- Dokploy panel ayarları — kod dışı

#### Katman 2
- [`socket-server/index.ts`](../../socket-server/index.ts) — adapter wire-up + graceful shutdown + health check
- [`hooks/use-socket.ts`](../../hooks/use-socket.ts) — `transports: ["websocket", "polling"]` + `upgrade: true`
- [`Dockerfile.socket`](../../Dockerfile.socket) — değişiklik yok (env-driven)
- [`package.json`](../../package.json) — yeni dep'ler
- [`docs/deploy/sunucu-kurulum.md`](../deploy/sunucu-kurulum.md) — §7, §8, §10 güncellemeleri
- [`CHANGELOG.md`](../../CHANGELOG.md) — değişiklik notu

### 13.2 Yeni

- `docs/adr/NNNN-socket-redis-adapter.md` — ADR (Kural 102, Katman 2 için)
- `socket-server/index.test.ts` — birim test (Katman 2 — adapter init logic ayrılırsa)
- (opsiyonel) `docker-compose.test.yml` — multi-instance test (Katman 2)

### 13.3 Referans

- [`Dockerfile`](../../Dockerfile) — pusula-app build
- [`Dockerfile.socket`](../../Dockerfile.socket) — pusula-socket build
- [`socket-server/index.ts`](../../socket-server/index.ts) — socket entrypoint
- [`hooks/use-socket.ts`](../../hooks/use-socket.ts) — client (3-strike reset eklendi, deploy ile yumuşatılır)
- [`next.config.ts`](../../next.config.ts) — `/socket.io/*` rewrite
- [`docs/deploy/sunucu-kurulum.md`](../deploy/sunucu-kurulum.md) — Dokploy kurulum referansı
- Socket.io Redis adapter docs: https://socket.io/docs/v4/redis-adapter/
- Connection state recovery: https://socket.io/docs/v4/connection-state-recovery
- Traefik sticky session: https://doc.traefik.io/traefik/routing/services/#sticky-sessions
- Mevcut kısa vadeli fix: [`hooks/use-socket.ts:28-76`](../../hooks/use-socket.ts#L28-L76)

---

## 14. İlerleme Notları

| Tarih | Katman | Adım | Sonuç |
|-------|--------|------|-------|
| 2026-05-09 | 0 | Client 3-strike reset (commit 7748cc6) | ✅ Yapıldı |
| 2026-05-09 | — | Birleşik plan oluşturuldu | ✅ |
| 2026-05-11 | 1 | §5.3.1 doğrulama (sunucu çıktısı kanıt) | ✅ Yapıldı |
| 2026-05-11 | 1 | Plan A/B kararı | ✅ Plan B seçildi |
| 2026-05-11 | 1 | `.github/workflows/deploy.yml` yazıldı | ✅ Yapıldı |
| 2026-05-11 | 1 | ADR-0035 yazıldı | ✅ Yapıldı |
| 2026-05-11 | 1 | CHANGELOG güncellendi | ✅ Yapıldı |
| | 1 | Sunucu: Auto Deploy OFF + webhook secret'lar (kullanıcı eylemi) | ⏳ Bekleniyor |
| | 1 | §7.1 testleri (10 senaryo) | ⏳ Sunucu hazırlığı sonrası |
| | 1 | §10.1 kriterler | ⏳ |
| | — | Katman 2 karar noktası (§12.2) | ⏳ 1 hafta gözlem sonrası |
| | 2 | Bağımlılık + Redis servisi | |
| | 2 | Adapter swap + graceful shutdown | |
| | 2 | Sticky session + WS upgrade | |
| | 2 | §7.5 manuel deploy testi | |
| | 2 | §10.2 kriterler | |
