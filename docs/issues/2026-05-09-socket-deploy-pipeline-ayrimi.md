# Socket-Server Bağımsız Deploy Pipeline — Plan

**Oluşturulma:** 2026-05-09
**Sahibi:** —
**Statü:** 📋 Plan — uygulamaya hazır
**Tip:** Altyapı / Deploy
**Tahmini efor:** 1–3 saat (Dokploy ayar + doğrulama; Plan B uygulanırsa +2 saat)
**Bağımlılık:** Dokploy panel erişimi, sunucuda `docker service` görünürlüğü

> **Bağlam:** Pusula app commit'i → Dokploy `pusula-socket-vrpbmy` servisini de yeniden başlatıyor → bağlı tüm istemciler 400 burst'üne maruz kalıyor. Bu plan, **socket-server'ı yalnızca kendi kodu değişince deploy edilecek şekilde** ayırmayı tarif eder.
>
> Bu plan, [`2026-05-09-socket-redis-adapter-plani.md`](./2026-05-09-socket-redis-adapter-plani.md) ile **paralel** uygulanabilir; ikisi farklı sorun katmanlarını çözer:
> - **Bu plan (pipeline ayrımı):** Restart **frekansını** düşürür (sebepsiz restart'ı engeller).
> - **Redis adapter planı:** Restart **etkisini** düşürür (kaçınılmaz restart'larda session survive).
>
> Pratikte: bu plan `2-3 saat` ve `0 kod değişikliği`, Redis planı `4-8 saat` ve runtime mimari değişikliği. Önce bu, sonra (ihtiyaç varsa) o.

---

## İçindekiler

1. [Problem Tanımı](#1-problem-tanımı)
2. [Hedefler](#2-hedefler)
3. [Mevcut Durum Analizi](#3-mevcut-durum-analizi)
4. [Çözüm Seçenekleri](#4-çözüm-seçenekleri)
5. [Önerilen Mimari](#5-önerilen-mimari)
6. [Uygulama Adımları](#6-uygulama-adımları)
7. [Trigger Path Matrisi](#7-trigger-path-matrisi)
8. [Test Planı](#8-test-planı)
9. [Riskler ve Azaltma](#9-riskler-ve-azaltma)
10. [Rollback](#10-rollback)
11. [Kabul Kriterleri](#11-kabul-kriterleri)
12. [İlgili Dosyalar](#12-ilgili-dosyalar)

---

## 1. Problem Tanımı

### 1.1 Birincil Semptom

`docker service ps pusula-socket-vrpbmy` çıktısı (2026-05-09 ölçümü):

```
NAME                         CURRENT STATE                ERROR
pusula-socket-vrpbmy.1       Running 4 minutes ago
 \_ pusula-socket-vrpbmy.1   Shutdown 4 minutes ago
 \_ pusula-socket-vrpbmy.1   Shutdown 42 minutes ago
 \_ pusula-socket-vrpbmy.1   Shutdown about an hour ago
 \_ pusula-socket-vrpbmy.1   Shutdown about an hour ago
```

**Son 1 saatte 4 restart.** ERROR sütunu boş, OOM yok (60 MB / 11.68 GB), crash yok — graceful shutdown'lar. Yani container'ı **dış bir komut** kapatıyor; en olası sebep Dokploy redeploy.

### 1.2 Kanıt — Sebep Pusula App Deploy'u

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

### 1.3 Etki

- **Kullanıcı:** Her deploy'da realtime bağlantı kopuyor. Browser console'da 400 yağmuru, `Çevrimdışı...` toast'ı (commit `7748cc6` öncesi 30-60sn ölü süre, sonrası ~3-5sn).
- **Geliştirici:** Frontend mikro değişikliği (örn. typo fix) yapmak realtime'ı bozmak demek; deploy korkusu yaratıyor.
- **Sunucu:** Gereksiz CPU/IO (her redeploy = image pull + container teardown + healthcheck wait).

---

## 2. Hedefler

### 2.1 Birincil

- **H1.** `pusula-app` koduna yapılan push, `pusula-socket-vrpbmy`'yi yeniden başlatmasın.
- **H2.** `socket-server/**` veya gerçekten paylaşılan kod (lib/socket-events, lib/yetki, auth, prisma) değişince **her ikisi de** rebuild olsun (doğru davranış).
- **H3.** Hiçbir kod değişikliği gerektirmeden Dokploy ayarı ile çözülsün (Plan A); olmuyorsa minimum CI shim ile (Plan B).

### 2.2 İkincil

- **H4.** Dokploy panelinde "manual redeploy" butonu çalışır kalsın (acil deploy için).
- **H5.** Webhook'a güvenmeyen acil senaryo için sunucudan `docker service update --force pusula-socket-vrpbmy` her zaman çalışsın.

### 2.3 Hedef Olmayan

- Stateful session persistence — bu Redis adapter planının işi.
- Birden fazla socket-server replica — şu an gerek yok, in-memory presence map var ([`socket-server/index.ts:218-232`](../../socket-server/index.ts#L218-L232)).
- Socket-server'ı ayrı repo'ya çıkarmak — `lib/` paylaşımı kopyala/sync zorlaştırır; tek repo + path filter daha pragmatik.

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

**Bilinmeyen:** Dokploy'da iki servisin webhook ayarları nasıl. Önce 6.1 adımında doğrulanacak.

### 3.3 socket-server'ın Gerçek Bağımlılıkları (Build-Time)

`Dockerfile.socket`'in `COPY` adımları → image'a giren kaynak:

```dockerfile
COPY socket-server ./socket-server
COPY lib ./lib
COPY prisma ./prisma
COPY auth.ts auth.config.ts ./
COPY package.json bun.lock tsconfig.json ./
```

Yani **`lib/` tamamı, `prisma/`, `auth.ts`, `auth.config.ts`, `package.json`, `bun.lock`, `tsconfig.json`** + `socket-server/` socket-server'ın build context'i. Trigger path matrisi (§7) bu listeden türetilir.

### 3.4 pusula-app'in Gerçek Bağımlılıkları (Build-Time)

`Dockerfile`'da `COPY . .` → **her şey** dahil. Ama runtime'da `socket-server/` standalone bundle'ına girmez — Next.js `output: standalone` yalnızca `app/`, `pages/`, `lib/`'in app tarafından import edilen kısmını alır.

**Pratik sonuç:** `socket-server/` içindeki değişiklik pusula-app davranışını **etkilemez** (build cache invalidation dışında). Bu yüzden socket-only path'leri pusula-app trigger'ından hariç tutmak güvenli.

---

## 4. Çözüm Seçenekleri

### Seçenek A — Dokploy Watch Paths (önerilen)

Dokploy v0.13+ servis ayarlarında **"Watch Paths"** / **"Paths"** filter alanı var (sürüme göre isim değişebilir). Glob veya regex ile path tanımlanır; sadece eşleşen dosyalar değişince auto-deploy tetiklenir.

| Artı | Eksi |
|------|------|
| Sıfır kod değişikliği | Dokploy sürümünün desteklemesi gerek |
| Dokploy panelinden tek tıkla | Glob syntax varyasyonu (sürümler arası) |
| Her servis bağımsız ayar | Yanlış path → silent miss |

### Seçenek B — GitHub Actions ile Path-Filtered Webhook

Dokploy "Watch Paths" yoksa ya da çalışmıyorsa: Dokploy auto-deploy'u **kapat**, `dokploy/webhook` URL'lerini repo secret'larına koy, GitHub Actions `paths-filter` ile sadece ilgili servisi tetikle.

| Artı | Eksi |
|------|------|
| Tam kontrol, glob esnekliği | İki secret + bir workflow dosyası |
| Audit log GitHub'da | Manual deploy için ayrı `workflow_dispatch` lazım |
| Dokploy sürümünden bağımsız | Webhook URL'leri sızarsa kötü adam deploy edebilir |

### Seçenek C — Monorepo Split (önerilmez)

socket-server'ı ayrı repo'ya çıkar; `lib/socket-events.ts`, `lib/yetki.ts`, `auth.ts`, `prisma/schema.prisma` git submodule veya npm package olarak paylaş.

| Artı | Eksi |
|------|------|
| Net ayrım | `lib/` paylaşımı çok ağrı (submodule sync, versiyon, test) |
| | DDD/feature paritesi bozulur |
| | Geri dönüşü zor |

**Karar:** C **kapalı**. A önce, A imkansızsa B.

### Seçenek D — Auto-Deploy Kapat + Manuel (geçici fallback)

`pusula-socket-vrpbmy` servisinde auto-deploy'u kapat. Socket kodu değişince sunucuda `docker service update --force pusula-socket-vrpbmy`.

| Artı | Eksi |
|------|------|
| 5 dakikalık çözüm | Unutulur → socket eski koda kalır |
| | "Hızlı fix"in en yaygın başarısızlık modu |

**Karar:** D yalnızca A ve B'nin ikisi de imkansızsa son çare.

---

## 5. Önerilen Mimari

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

**Özetle:**
- Tek repo → iki bağımsız deploy hattı.
- Paylaşılan dosyalar (`auth.ts`, `prisma/`, `package.json`, `lib/socket-events.ts`, `lib/yetki.ts`, `lib/permissions/`) **her iki** trigger'a da yazılır → değişince ikisi de rebuild olur (doğru davranış).
- Socket-only dosyalar (`socket-server/`, `Dockerfile.socket`) sadece socket trigger'ında.
- App-only dosyalar (`app/`, `components/`, `Dockerfile`, `next.config.ts`) sadece app trigger'ında.

---

## 6. Uygulama Adımları

### 6.1 Doğrulama (sunucuda + Dokploy panelinde)

Önce mevcut durumu somut belge ile sabitle. Sunucuda:

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
4. **Deployments** sekmesinde son deploy'ların "trigger" sebebi ne yazıyor? (`webhook`, `manual`, `git`)

> **Çıkarsama:** Eğer her iki servis de aynı GitHub repo + main branch'e bağlı ve Auto Deploy açıksa, her push iki webhook'u da tetikliyor → kanıt tamam.

### 6.2 Plan A — Dokploy Watch Paths (eğer destekleniyorsa)

#### 6.2.1 `pusula-socket-vrpbmy` servisi için

**Settings → Watch Paths:**

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

#### 6.2.2 `pusula-app` servisi için

**Settings → Watch Paths:** (Dokploy'da exclude syntax varsa)

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

#### 6.2.3 Doğrulama

- `socket-server/index.ts`'te whitespace değiştir → push → **sadece** `pusula-socket-vrpbmy` deploy başlasın.
- `app/page.tsx`'te whitespace değiştir → push → **sadece** `pusula-app` deploy başlasın.
- `lib/socket-events.ts`'te whitespace değiştir → push → **ikisi de** deploy başlasın.

### 6.3 Plan B — GitHub Actions Webhook Shim (Plan A imkansızsa)

#### 6.3.1 Dokploy'da auto-deploy'u kapat

Her iki servis için: **General → Auto Deploy: OFF**.

#### 6.3.2 Webhook URL'lerini al

Dokploy → her servis → **Webhooks** sekmesi → **Manual Trigger Webhook** URL'ini kopyala. İki ayrı URL.

#### 6.3.3 GitHub repo secret'ları ekle

Settings → Secrets and variables → Actions:
- `DOKPLOY_APP_WEBHOOK` — pusula-app webhook URL
- `DOKPLOY_SOCKET_WEBHOOK` — pusula-socket webhook URL

#### 6.3.4 `.github/workflows/deploy.yml` ekle

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

#### 6.3.5 Doğrulama

Plan A'daki üç senaryoyu çalıştır + Actions sekmesinde job'ların hangisinin tetiklendiğini gör.

### 6.4 Plan D — Acil Fallback (yalnızca A ve B çalışmazsa)

`pusula-socket-vrpbmy` servisinde **Auto Deploy: OFF**. Socket kodu değişince:

```bash
# Sunucuda
docker service update --force --image pusula-socket-vrpbmy:latest pusula-socket-vrpbmy
```

CLAUDE.md veya bir runbook'a "socket değiştiğinde manuel deploy" notu ekle. **Geçici, kalıcı değil.**

---

## 7. Trigger Path Matrisi

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
| `lib/**` (diğer) | ✅ | ⚠️ | Çoğu app-only ama dikkat — bkz §9.2 |
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

## 8. Test Planı

### 8.1 Senaryo Matrisi

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

### 8.2 Yürütme

Test branch'i: `chore/deploy-pipeline-test`. Her senaryo için:

1. Tek dosya değiştir (whitespace yeterli — anlamlı diff şart değil).
2. `git commit -m "test: T<n>" && git push`.
3. Dokploy panel **Deployments** sekmesinde her iki servisi gözle.
4. Beklenen ile karşılaştır.

> Her test 2-5 dk sürer (Dokploy build + container swap). Toplam ~30-40 dk.

### 8.3 Regresyon Kontrolü

- T2 sonrası: tarayıcı açık tut, deploy sırasında 400 burst'ünü gözle. **Bekleme:** ~3-5sn içinde "Bağlantı yenilendi" toast'ı (önceki client fix'i sayesinde).
- T1 sonrası: tarayıcıda socket bağlantısı **hiç kopmamalı** (kanıt: `[socket] dinleniyor` log'u tekrar etmemeli).
- T3 sonrası: Hem app hem socket yeniden başladıktan sonra event yayını çalışıyor mu (manuel: bir kart oluştur, başka pencerede görünmeli).

---

## 9. Riskler ve Azaltma

### 9.1 R1 — Eksik trigger path → bir servis güncellenmez

**Senaryo:** `lib/permissions/karar.ts` değişti, ama socket trigger'ında `lib/permissions/**` unutulmuş → socket eski yetki mantığıyla çalışmaya devam eder.

**Azaltma:**
- Trigger matrisini (§7) PR review checklist'ine ekle.
- 2 hafta boyunca her cuma sunucuda `docker service inspect <servis> --format '{{.UpdatedAt}}'` çalıştır, son commit ile karşılaştır — drift varsa path eksik demektir.
- Daha zayıf ama otomatik: GitHub Actions'a haftalık `workflow_dispatch` ile `target: both` çalıştır.

### 9.2 R2 — `lib/**` glob çok geniş, app-only dosyalar socket'i de tetikliyor

**Senaryo:** `lib/mail.ts` değişti — socket'in işine yaramaz ama trigger'a `lib/**` yazılırsa socket de rebuild olur.

**Azaltma:**
- §7'deki gibi **socket için sadece spesifik lib dosyalarını** listele (`lib/socket-events.ts`, `lib/yetki.ts`, `lib/permissions/**`, `lib/db.ts`).
- Yanlış yön: `lib/**` socket trigger'ına koymak.
- Doğru yön: app trigger'ına `lib/**`, socket trigger'ına spesifik dosyalar.

### 9.3 R3 — Plan B webhook URL sızıntısı

**Senaryo:** `DOKPLOY_*_WEBHOOK` secret'ı public log'a düşer → kötü adam deploy tetikler.

**Azaltma:**
- GitHub Actions log'unda secret otomatik maskelenir (`***`), ama `set -x` veya `echo $URL` yazma.
- Dokploy'da webhook URL'sini **dönderebilirsen** (regenerate) ayda bir döndür.
- Webhook'lar deploy tetikler, kod inject etmez — blast radius sınırlı (eski main commit'i tekrar deploy).

### 9.4 R4 — Dokploy sürümü Watch Paths desteklemez

**Senaryo:** Plan A panelde alanı bulamıyoruz.

**Azaltma:**
- Hemen Plan B'ye geç, kod değişikliği zaten ufak.
- Veya Dokploy'u güncelle (`dokploy --version` → en son sürüm karşılaştır).

### 9.5 R5 — Manual deploy ihtiyacı

**Senaryo:** Bir hotfix push'u olmadan socket'i restart etmek lazım (örn. env değişikliği).

**Azaltma:**
- Dokploy panel **"Redeploy"** butonu her zaman çalışır (Auto Deploy off bile).
- Plan B'de `workflow_dispatch` ile `target: socket` seçilebilir.
- Sunucudan: `docker service update --force pusula-socket-vrpbmy`.

---

## 10. Rollback

Her seçenek için 60 saniyede geri dönüş:

### Plan A geri alma

1. Dokploy → her servis → **Watch Paths** alanını **boşalt** (eski davranış: her path tetikler).
2. Auto Deploy zaten açık kalıyor → push → eskisi gibi ikisi de deploy.

### Plan B geri alma

1. Dokploy → her servis → **Auto Deploy: ON** (kapatmıştık).
2. `.github/workflows/deploy.yml` dosyasını sil veya `on:` bloğunu boşalt.
3. Bir test commit at → Dokploy webhook'u eskisi gibi çalışmaya devam ediyor.

### Plan D geri alma

1. Dokploy → `pusula-socket-vrpbmy` → **Auto Deploy: ON**.

> Üç plan da non-destructive: yanlış path → "fazla deploy" olur, sıfır data kaybı.

---

## 11. Kabul Kriterleri

Plan başarılı sayılır eğer:

- [ ] **K1.** §8.1'deki 10 test senaryosunun en az 9'u beklenen davranışı verir.
- [ ] **K2.** Sadece `socket-server/index.ts` değişen bir push'tan sonra `docker service ps pusula-app | head` çıktısında **yeni Running task yok** (UpdatedAt değişmedi).
- [ ] **K3.** Sadece `app/page.tsx` değişen bir push'tan sonra tarayıcıda socket bağlantısı kopmaz; console'da `connect_error` yok.
- [ ] **K4.** Bir hafta gözlem: `docker service ps pusula-socket-vrpbmy` çıktısında 1 saatlik pencerede en fazla **1 Shutdown** (önceki: 4).
- [ ] **K5.** Manual redeploy butonu (panel) ve `workflow_dispatch` (Plan B'deyse) çalışıyor.
- [ ] **K6.** Bu plan dosyasının **statüsü** "Tamamlandı" olarak güncellendi, "Tamamlanma tarihi" + "Uygulanan plan: A/B/D" eklendi.

---

## 12. İlgili Dosyalar

### Bu plan içinde değişebilecek dosyalar

- (Plan B uygulanırsa) `.github/workflows/deploy.yml` — yeni
- Dokploy panel ayarları — kod dışı

### Referans

- [`Dockerfile`](../../Dockerfile) — pusula-app build
- [`Dockerfile.socket`](../../Dockerfile.socket) — pusula-socket build
- [`socket-server/index.ts`](../../socket-server/index.ts) — socket entrypoint
- [`hooks/use-socket.ts`](../../hooks/use-socket.ts) — client (3-strike reset eklendi, deploy ile yumuşatılır)
- [`next.config.ts`](../../next.config.ts) — `/socket.io/*` rewrite
- [`docs/deploy/sunucu-kurulum.md`](../deploy/sunucu-kurulum.md) — Dokploy kurulum referansı (12.1 Auto-Deploy bölümü)
- [`docs/issues/2026-05-09-socket-redis-adapter-plani.md`](./2026-05-09-socket-redis-adapter-plani.md) — paralel/uzun vade plan (session persistence)

### İlerleme notları

| Tarih | Adım | Sonuç |
|-------|------|-------|
| 2026-05-09 | Plan oluşturuldu | — |
| | 6.1 doğrulama | |
| | Plan A/B kararı | |
| | §8 testleri | |
| | Tamamlandı | |
