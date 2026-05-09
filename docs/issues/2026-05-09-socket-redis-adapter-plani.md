# Socket.io — Redis Adapter + Sticky Session Migration Planı

**Oluşturulma:** 2026-05-09
**Sahibi:** —
**Statü:** ⏳ Defer — uygun zamanda ele alınacak (öncelik: scale ihtiyacı veya deploy-recovery sorunu büyürse)
**Tip:** Altyapı / Realtime
**Tahmini efor:** 4–8 saat (tek seferlik kurulum + test)
**Bağımlılık:** Dokploy + Traefik + mevcut socket-server

> **Bağlam:** Mevcut socket-server in-memory state ile çalışıyor (`io.sockets.adapter` default MemoryAdapter). Dokploy deploy = container restart = tüm session state buharlaşır. Engine.io polling worker'ı eski `sid` ile sıkışıp kalır, `connectionStateRecovery` (in-memory) işe yaramaz, `connect_error` patlamaları kullanıcıya çevrimdışı toast'ı olarak yansır.
>
> Kısa vadeli müdahale [`hooks/use-socket.ts`](../../hooks/use-socket.ts) içine ardışık 3 `connect_error` sonrası transport reset eklendi (commit `7748cc6` öncesi/sonrası satır 28-76). **Bu plan kalıcı çözümü tarif eder.**

---

## İçindekiler

1. [Problem Tanımı](#1-problem-tanımı)
2. [Hedefler](#2-hedefler)
3. [Mevcut Durum Analizi](#3-mevcut-durum-analizi)
4. [Önerilen Mimari](#4-önerilen-mimari)
5. [Uygulama Adımları](#5-uygulama-adımları)
6. [Test Planı](#6-test-planı)
7. [Riskler ve Azaltma](#7-riskler-ve-azaltma)
8. [Rollback](#8-rollback)
9. [Kabul Kriterleri](#9-kabul-kriterleri)
10. [İlgili Dosyalar](#10-ilgili-dosyalar)

---

## 1. Problem Tanımı

### 1.1 Birincil Semptom

Pusula app commit'i `git push origin main` → Dokploy `pusula-socket` servisini de rebuild ediyor → container restart → **bağlı tüm istemcilerin Engine.io session ID'leri sunucuda artık yok**.

```
Browser polling worker → /socket.io/?EIO=4&transport=polling&sid=<eski_sid>
Sunucu (yeni instance) → 400 "Session ID unknown"
socket.io-client default reconnection: yavaş toparlanma
Kullanıcı: "Çevrimdışı..." toast'ı, F5 basana kadar 30-60sn ölü süre
```

### 1.2 Kök Neden

| # | Sebep | Etki |
|---|-------|------|
| 1 | **Stateful socket server, stateless deploy gibi davranılıyor** | Restart'ta in-memory adapter siliniyor |
| 2 | `connectionStateRecovery` in-memory tutuluyor | Restart sonrası recovery çalışamaz |
| 3 | `pusula-app` commit'i `pusula-socket`'i de tetikliyor | Frontend kod değişikliği socket bağlantılarını bozuyor |
| 4 | Tek instance varsayımı | Yatay ölçekleme yok; ileride yapamayız |

### 1.3 Mevcut Geçici Çözümler (Bu plana giren)

- ✅ **Kısa vade (yapıldı):** Client tarafında ardışık 3 `connect_error` görünce `disconnect()` + 500ms sonra `connect()` ile yeni handshake — engine.io'nun yavaş recovery'sini bypass ediyor ([`hooks/use-socket.ts:28-76`](../../hooks/use-socket.ts#L28-L76)).
- ⏳ **Orta vade (bu plana girmiyor, ayrı iş):** Dokploy'da `pusula-socket`'i ayrı pipeline'a almak — sadece socket-server kodu değişince deploy edilsin. Bu plana paralel uygulanabilir.

### 1.4 Bu Plan Ne Çözüyor

- **Deploy-survives session:** Container restart olsa bile session state Redis'te → istemci aynı `sid` ile devam eder
- **Multi-instance ready:** Birden fazla `pusula-socket` pod'u arasında event broadcast Redis pub/sub üzerinden senkronize
- **WebSocket transport geri açılabilir:** Sticky session ile long-poll → WebSocket upgrade güvenli (şu an `transports: ["polling"]` only)
- **Graceful shutdown:** SIGTERM'de in-flight handshake'ler bitsin, sonra kapan

---

## 2. Hedefler

### 2.1 Ana Hedefler (zorunlu)

1. Deploy sırasında bağlı kullanıcılar **görsel kesinti yaşamasın** (toast bile çıkmasın, ideal)
2. Birden fazla `pusula-socket` instance'ı çalıştırabilelim (yatay ölçek hazır)
3. Mevcut event sözleşmesi (`SOCKET.*`, `EventZarfi<T>`) **bozulmasın** — frontend kod değişikliği minimum
4. Test edilebilir olsun: birim + integration + manuel deploy senaryosu

### 2.2 İkincil Hedefler (nice-to-have)

5. WebSocket transport'unu geri etkinleştir (şu an polling-only — Cloudflare/Traefik gerekçesiyle)
6. Sticky session ile aynı kullanıcının istekleri aynı pod'a düşsün
7. Redis'i ileride başka use-case'lere de hazırla: rate limit (lib/rate-limit.ts), Next.js `unstable_cache`, BullMQ job queue

### 2.3 Kapsam Dışı

- Multi-region deploy (tek bölge — TR-VDS7)
- Redis Cluster (single Redis instance yeterli, < 1000 eşzamanlı kullanıcı)
- Socket.io Admin UI (ayrı iş)

---

## 3. Mevcut Durum Analizi

### 3.1 Server Tarafı — `socket-server/index.ts`

**Mevcut yapı:**
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

### 3.2 Client Tarafı — `hooks/use-socket.ts`

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

**Bu varsayım yanlış değil ama eksik:** Doğru sticky session + Traefik WS desteği ile WebSocket upgrade çalışır, latency 10x iyileşir. Bu plan o kapıyı açar.

### 3.3 Deploy Tarafı — `docs/deploy/sunucu-kurulum.md`

- §8.8'de WebSocket support: ENABLE yazılı ama Traefik label'larda sticky session yok
- Redis servisi mevcut değil (Dokploy'un kendi `dokploy-redis`'i var ama o paneli için, Pusula'ya verilemez)
- §10'da backup stratejisinde Redis yok (eklenmesi gerekecek — opsiyonel; pub/sub state ephemeral olduğu için kritik değil ama session recovery state için lazım)

### 3.4 Bağımlı Kod Yerleri

`pusula-socket` üzerinden geçen tüm event'ler:
- [`socket-server/index.ts`](../../socket-server/index.ts) — ana sunucu
- [`lib/socket-events.ts`](../../lib/socket-events.ts) — event sözleşmeleri
- [`lib/realtime.ts`](../../lib/realtime.ts) — server action → broadcast HTTP wrapper (`/yayinla`)
- [`hooks/use-socket.ts`](../../hooks/use-socket.ts) — client hook
- Bütün `useSocketEvent` çağrıları (project-wide grep)

**Etki:** Adapter swap **sadece** `socket-server/index.ts` dosyasını değiştirir. Geri kalan her şey transparan.

---

## 4. Önerilen Mimari

### 4.1 Yüksek Seviye Diyagram

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

### 4.2 Bileşenler

| Bileşen | Rol | Versiyon (önerilen) |
|---------|-----|---------------------|
| **`@socket.io/redis-adapter`** | Pub/sub broadcast cross-instance | `^8.x` (socket.io v4 ile uyumlu) |
| **`@socket.io/redis-streams-adapter`** | Alternatif: Streams tabanlı, message guarantee | Değerlendir, ama RedisAdapter v8 yeterli |
| **`redis`** veya **`ioredis`** | Redis client | `redis@^4` veya `ioredis@^5` (ekiplerin tercihi) |
| **`pusula-redis` Dokploy servisi** | Redis 7-alpine | `redis:7-alpine` |
| **Traefik sticky session** | `io` cookie veya custom cookie ile aynı pod'a yönlendirme | Traefik label config |

### 4.3 Connection State Recovery — Redis-backed

Socket.io v4.6+ `connectionStateRecovery` adapter-aware:
- Redis adapter kullanıldığında recovery state Redis'te tutulur
- TTL = `maxDisconnectionDuration` (mevcut: 2dk — yeterli)
- Restart sonrası istemci aynı `sid + offset` ile gelirse → tüm queued event'leri Redis'ten alır

### 4.4 Sticky Session Stratejisi

**Seçenekler:**

| Yöntem | Artı | Eksi |
|--------|------|------|
| **Traefik `loadBalancer.sticky.cookie`** | Standart, Dokploy'da label ile aktif | Cookie-based; SameSite ayarı dikkat |
| **`io` cookie (Engine.io built-in)** | Socket.io kendi yönetir | Traefik bunu okumaz, Layer 7 inspection lazım |
| **IP hash** | Cookie'siz | Mobile/NAT'lı kullanıcılar farklı pod'lara dağılabilir |

**Karar (öneri):** Traefik cookie sticky → Engine.io `io` cookie ile karıştırma; Traefik'in kendi `_pusula_sticky` cookie'sini kullan. Dokploy panel'de label:

```yaml
- traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.name=_pusula_sticky
- traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.secure=true
- traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.samesite=lax
- traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.httponly=true
```

### 4.5 Graceful Shutdown

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

**Dokploy default:** SIGTERM → 10sn → SIGKILL. 10sn `terminationGracePeriodSeconds` arttırılmalı (Dokploy panel ayarı).

---

## 5. Uygulama Adımları

> **Sıra:** Her adım ayrı commit. Her commit `bun run verifier` geçmeli (Kural 86).

### 5.1 Bağımlılık Ekleme

```bash
bun add @socket.io/redis-adapter redis
# ALTERNATİF: bun add @socket.io/redis-adapter ioredis
```

**Karar noktası:** `redis@4` (resmi, modern API) vs `ioredis` (battle-tested, Sentinel desteği). Pusula tek-instance Redis kullanacağı için `redis@4` yeterli, daha az bağımlılık. (Kural 4: yeni paket = saldırı yüzeyi → CVE check.)

### 5.2 Dokploy'da `pusula-redis` Servisi

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

### 5.3 Server Kod Değişikliği

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

### 5.4 Client Kod Değişikliği

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

**ÖNEMLİ:** WebSocket transport sticky session ile çalışır; ilk handshake long-poll, sonra WS'ye upgrade. Sticky session yoksa upgrade fail'inde polling'e fallback. Mevcut `_ardisikHataSayisi` reset logic'i KALSIN (defansif kod, Phantom Kural #2).

### 5.5 Env Değişkenleri

`.env.example` ve Dokploy panel:

```bash
# pusula-socket için yeni:
REDIS_URL=redis://default:<parola>@pusula-redis:6379

# pusula-app için: (rate-limit Redis'e taşınırsa, ayrı planda)
# REDIS_URL=redis://default:<parola>@pusula-redis:6379
```

### 5.6 Traefik Sticky Session

Dokploy → `pusula-socket` servisi → **Advanced → Traefik Labels**:

```
traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.name=_pusula_sticky
traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.secure=true
traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.samesite=lax
traefik.http.services.pusula-socket.loadbalancer.sticky.cookie.httponly=true
```

### 5.7 Graceful Shutdown Handler

`socket-server/index.ts` sonuna §4.5'teki kod parçası eklenir.

Dokploy → `pusula-socket` → **Advanced → Termination grace period**: `30s` (default 10s).

### 5.8 Health Check Genişletme

Mevcut `/saglik` endpoint'i sadece `{ ok: true, ts }` dönüyor. Redis bağlantısını da check etsin:

```ts
if (req.url === "/saglik" && req.method === "GET") {
  const redisOk = pubClient.isReady;
  res.writeHead(redisOk ? 200 : 503, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: redisOk, redis: redisOk, ts: Date.now() }));
  return;
}
```

### 5.9 Dokümantasyon Güncellemesi

- [ ] [`docs/deploy/sunucu-kurulum.md`](../deploy/sunucu-kurulum.md) §7'ye "Redis servisi" alt bölümü ekle
- [ ] §8.8'de socket-server env list'ine `REDIS_URL` ekle
- [ ] §8.8'de Traefik sticky session label'larını ekle
- [ ] `docs/adr/NNNN-socket-redis-adapter.md` ADR yaz (Kural 102 — büyük teknik karar)
- [ ] `CHANGELOG.md` "Değişen" altına satır

---

## 6. Test Planı

### 6.1 Birim Testler (yeni)

`socket-server/index.test.ts` (yeni):
- Adapter swap'in event ulaştırmayı bozmadığı (in-memory mock Redis)
- Graceful shutdown handler SIGTERM'de `io.close()` çağırıyor mu
- Health check Redis down olduğunda 503 dönüyor mu

> Not: socket.io test edilmesi normalde fixture-heavy. **Saf logic varsa ayır** (Kural 131): adapter init logic'i, shutdown logic'i pure fonksiyon olarak çıkar, onlara test yaz.

### 6.2 Integration Testler

`docker-compose.test.yml` (geçici):
- 1 Redis + 2 socket-server instance ayağa kaldır
- Frontend simülasyonu: `socket.io-client` ile #1'e bağlan, server action `/yayinla` ile #2 üzerinden broadcast yap → #1'deki client event'i alıyor mu

### 6.3 Manuel Deploy Senaryosu (En Kritik)

| # | Adım | Beklenen |
|---|------|----------|
| 1 | Tarayıcıda Pusula açık, kart sayfasında, başka kullanıcı kart düzenliyor | Realtime update geliyor |
| 2 | `pusula-socket` rebuild trigger | — |
| 3 | Container restart (10-30sn) | Tarayıcıda **toast çıkmamalı** veya sadece "Bağlantı yenileniyor..." (1sn'lik) |
| 4 | Restart sonrası başka kullanıcı kart düzenliyor | Realtime update geliyor (kayıp event yok) |
| 5 | DevTools Network → WS frame'leri akıyor | Polling'e fallback olmamış |

### 6.4 Yük Testi (opsiyonel)

`k6` ile 100 eşzamanlı socket bağlantısı, 5dk boyunca event akışı, deploy mid-test → recovery rate >95%.

### 6.5 Lokal Geliştirme Doğrulaması

`REDIS_URL` set edilmemiş → server in-memory adapter'a düşüyor, uyarı log'u var, tüm event'ler çalışıyor (mevcut dev workflow bozulmadı).

---

## 7. Riskler ve Azaltma

| Risk | Etki | Olasılık | Azaltma |
|------|------|----------|---------|
| Redis down → tüm socket trafiği durur | Kritik | Düşük | Redis AOF + Dokploy auto-restart; monitor + alert; in-memory fallback **production'da YASAK** ama health check 503 → Traefik trafiği kesmez (sticky), istemci reconnect döngüsünde kalır |
| Sticky cookie 3rd-party domain'de blocked (Cloudflare/iframe) | Orta | Düşük | SameSite=Lax + Secure; aynı domain üstünden serve ediliyor zaten (`socket.pusula.example.com`) |
| Pub/sub mesaj büyüklüğü Redis limit'i aşar | Düşük | Çok düşük | Pusula event payload'ları küçük (kart ID + meta); 32MB hard limit'in çok altında |
| `connectionStateRecovery` Redis-backed varsayımı yanlışsa | Orta | Düşük | Resmi docs ile doğrula (socket.io v4.6+ adapter-aware); manuel deploy testinde gözle gör |
| Yeni bağımlılık CVE'si | Düşük | Düşük | `bun audit` ekle; `redis@4` ve `@socket.io/redis-adapter@8` battle-tested |
| Graceful shutdown timeout'u kısa → bağlantı kopması | Düşük | Orta | Dokploy panel'de 30sn; ayrıca `io.close()` callback ile gerçek bitiş bekleniyor |
| Dev environment Redis ihtiyacı yeni geliştiriciyi yavaşlatır | Düşük | Yüksek | In-memory fallback (§5.3) ile dev'de Redis opsiyonel |
| Redis parolası leak | Yüksek | Düşük | Sadece internal network; Dokploy secret manager; rotate edilebilir |

---

## 8. Rollback

### 8.1 Anlık Rollback

Dokploy → `pusula-socket` → **Deployments → Rollback** → eski commit'e dön.

### 8.2 Adapter Geri Alma (Kod)

Tek commit'te toplu geri alma:
```bash
git revert <commit-hash>  # adapter ekleyen commit
```
- `REDIS_URL` env'i kaldır (zarar yok, ignore edilir)
- `pusula-redis` Dokploy servisi şimdilik **bırakılır** (silmeden, çünkü 2. denemede tekrar lazım olur)

### 8.3 Veri Kaybı?

**Yok.** Redis sadece ephemeral session state ve pub/sub channel. Audit log + business data Postgres'te. Rollback Postgres'e dokunmaz.

---

## 9. Kabul Kriterleri

- [ ] `socket-server/index.ts` Redis adapter ile çalışıyor (production env'de)
- [ ] `pusula-redis` Dokploy servisi healthy
- [ ] Traefik sticky session cookie set ediliyor (DevTools'tan doğrula)
- [ ] WebSocket transport upgrade çalışıyor (DevTools → Network → WS frame)
- [ ] Manuel deploy testi (§6.3): restart sırasında kullanıcı görünür kesinti yaşamıyor
- [ ] Birim testler PASS, `bun run verifier` PASS (Kural 86)
- [ ] Health check `/saglik` Redis durumunu yansıtıyor
- [ ] `docs/deploy/sunucu-kurulum.md` ve `docs/adr/NNNN-*.md` yazıldı
- [ ] `CHANGELOG.md` güncellendi
- [ ] Lokal dev workflow bozulmadı (REDIS_URL set edilmeden çalışıyor)
- [ ] Graceful shutdown 30sn içinde tüm bağlantıları temiz kapatıyor
- [ ] Geçici debug log'ları (`[socket-auth]`, `[yayinla]`) production'da hâlâ varsa **bu işin kapsamı dışında** ama temizlenebilir

---

## 10. İlgili Dosyalar

### 10.1 Değişecek

- [`socket-server/index.ts`](../../socket-server/index.ts) — adapter wire-up + graceful shutdown + health check
- [`hooks/use-socket.ts`](../../hooks/use-socket.ts) — `transports: ["websocket", "polling"]` + `upgrade: true`
- [`Dockerfile.socket`](../../Dockerfile.socket) — değişiklik yok (env-driven)
- [`package.json`](../../package.json) — yeni dep'ler
- [`docs/deploy/sunucu-kurulum.md`](../deploy/sunucu-kurulum.md) — §7, §8, §10 güncellemeleri
- [`CHANGELOG.md`](../../CHANGELOG.md) — değişiklik notu

### 10.2 Yeni

- `docs/adr/NNNN-socket-redis-adapter.md` — ADR (Kural 102)
- `socket-server/index.test.ts` — birim test (varsa adapter init logic ayrılırsa)
- (opsiyonel) `docker-compose.test.yml` — multi-instance test

### 10.3 Referans

- Socket.io Redis adapter docs: https://socket.io/docs/v4/redis-adapter/
- Connection state recovery: https://socket.io/docs/v4/connection-state-recovery
- Traefik sticky session: https://doc.traefik.io/traefik/routing/services/#sticky-sessions
- Mevcut kısa vadeli fix: [`hooks/use-socket.ts:28-76`](../../hooks/use-socket.ts#L28-L76)

---

## 11. Açık Sorular

> Plan onayı sırasında karar verilecek noktalar.

1. **Redis client:** `redis@4` mü, `ioredis@5` mi? (Öneri: `redis@4` — daha az dep)
2. **Sticky cookie ismi:** `_pusula_sticky` mi, başka bir şey mi?
3. **WebSocket transport'unu hemen aç mı, ayrı commit'te mi aç?** (Öneri: ayrı commit — adapter swap kendi başına test edilsin, WS upgrade ayrı risk)
4. **Rate-limit'i de Redis'e taşımak bu plana eklensin mi?** (Öneri: hayır — ayrı plan, scope creep'i engelle)
5. **Connection state recovery TTL'i 2dk yeterli mi?** (Öneri: evet — kullanıcı 2dk+ offline ise zaten yeni session açsın)

---

## 12. Yapılma Sırası Özeti (Geliştirici İçin TL;DR)

```
1. bun add @socket.io/redis-adapter redis
2. Dokploy → pusula-redis servisi oluştur
3. socket-server/index.ts → adapter ekle, dev fallback yaz
4. socket-server/index.ts → graceful shutdown + health check Redis aware
5. Lokal test (Redis container'lı + container'sız)
6. Dokploy → REDIS_URL env, Traefik sticky labels, grace period 30s
7. Staging deploy → manuel deploy senaryosu (§6.3)
8. hooks/use-socket.ts → WebSocket transport aç (ayrı commit)
9. Tekrar manuel test
10. ADR + docs + CHANGELOG
11. Production deploy
12. 1 hafta gözlem (deploy frequency'sinde toast yok kontrolü)
```

---

**Plan sahibi karar verdiğinde:** Bu dosyada Açık Sorular bölümü cevaplanır, Statü `🚧 Devam ediyor` yapılır, branch açılır (Kural 85 istisna — büyük altyapı işi için branch makul).
