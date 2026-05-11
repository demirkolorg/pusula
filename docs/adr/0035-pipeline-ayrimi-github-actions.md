# ADR-0035 — pusula-app ve pusula-socket için bağımsız deploy pipeline

**Durum:** Uygulamada (Katman 1)
**Tarih:** 2026-05-11
**İlişkili:** [`docs/issues/2026-05-09-socket-realtime-saglamlik-plani.md`](../issues/2026-05-09-socket-realtime-saglamlik-plani.md) §5 (Katman 1)

## Bağlam

Pusula production'da iki Dokploy servisi var: `pusula-app` (Next.js, port 2500) ve `pusula-socket-vrpbmy` (Bun socket-server, port 2501). Her ikisi de aynı GitHub repo'ya bağlı, `main` branch'i izliyor, Auto Deploy açık.

Sonuç: `git push origin main` her zaman **her iki servisi** yeniden başlatıyor. Sunucu çıktısı (2026-05-09 ölçümü):

```
docker service ps pusula-socket-vrpbmy
NAME                         CURRENT STATE                ERROR
pusula-socket-vrpbmy.1       Running 4 minutes ago
 \_ pusula-socket-vrpbmy.1   Shutdown 4 minutes ago
 \_ pusula-socket-vrpbmy.1   Shutdown 42 minutes ago
 \_ pusula-socket-vrpbmy.1   Shutdown about an hour ago
 \_ pusula-socket-vrpbmy.1   Shutdown about an hour ago
```

Son 1 saatte 4 restart. ERROR sütunu boş, OOM yok (60 MB / 11.68 GB), crash yok — graceful shutdown. Restart frekansı git commit sıklığı ile birebir korele → orchestrator (Dokploy) "sen kapan, yeni image deploy ediyorum" diyor.

Etki:
- Browser polling worker eski `sid` ile 400 burst alıyor (Engine.io "Session ID unknown"). Client tarafı 3-strike reset (commit `7748cc6`) ölü süreyi 30-60sn → 3-5sn'ye indirdi ama "Çevrimdışı" toast'ı her deploy'da flash ediyor.
- App-only mikro değişiklikler (typo, CSS tweak) socket bağlantılarını bozmak anlamına geliyor.
- `socket-server/` standalone Next.js bundle'ına hiç girmiyor — pratik olarak `pusula-app`'in `socket-server/` değişikliğine duyarlı olması yanlış.

## Değerlendirilen Seçenekler

### A — Dokploy Watch Paths (panel ayarı)

Dokploy v0.13+ servis ayarlarında "Watch Paths" filter alanı (sürüme göre isim varyasyonu) ile glob bazlı trigger filtrelemesi.

| Artı | Eksi |
|------|------|
| Sıfır kod değişikliği | Dokploy sürümünün desteklemesi şart |
| Panel tek tıkla | Glob syntax sürümler arası fark gösterebilir |

### B — GitHub Actions ile path-filtered webhook (seçilen)

Dokploy auto-deploy kapalı, GitHub Actions `dorny/paths-filter@v3` ile sadece ilgili servisin Dokploy webhook'unu çağırıyor.

| Artı | Eksi |
|------|------|
| Dokploy sürümünden bağımsız, audit log GitHub'da | İki repo secret + bir workflow dosyası |
| Path matrisi kodda — review edilebilir | `workflow_dispatch` ile manuel deploy fallback'i ayrıca lazım |
| Plan A'dan geri dönüş kolay | Webhook URL'i sızarsa kötü adam deploy tetikleyebilir (blast radius: eski main commit'ini tekrar deploy — kod inject etmez) |

### C — Monorepo split (reddedildi)

`socket-server/`'ı ayrı repo'ya çıkar, `lib/socket-events.ts`, `lib/yetki.ts`, `auth.ts`, `prisma/schema.prisma` submodule veya npm package olarak paylaş.

Reddedildi: `lib/` paylaşımı (özellikle yetki ve auth) submodule sync veya iç npm package kurulumu gerektirir; tek geliştiricili monorepo için fayda/maliyet negatif. Geri dönüşü zor.

### D — Auto-deploy kapat + manuel `docker service update` (reddedildi)

Reddedildi: "unutulur, eski koda kalır" — operasyonel hata kaynağı.

## Karar

**Plan B — GitHub Actions path-filtered webhook.**

- [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) `dorny/paths-filter@v3` ile `app` ve `socket` outputs üretir; her job ilgili Dokploy webhook'unu `curl -fsS -X POST --max-time 30` ile çağırır.
- `workflow_dispatch` ile manuel tetikleme (`target: app | socket | both`).
- Paylaşılan dosyalar (`auth.ts`, `auth.config.ts`, `prisma/**`, `package.json`, `bun.lock`, `tsconfig.json`, `lib/socket-events.ts`, `lib/yetki.ts`, `lib/permissions/**`, `lib/db.ts`, `.dockerignore`) her iki path listesinde de yer alır → değişince ikisi de rebuild olur.
- Dokploy panel ayarı: her iki servisin **Auto Deploy: ON** kalır (Dokploy webhook endpoint'i `if (!autoDeploy) return 400` kontrolü yapar — refresh token URL'inin çalışması için ON şart). Buna rağmen Dokploy push event'i almaz çünkü **GitHub repo webhook'u silinir** (Settings → Webhooks → Delete). Push'u sadece bizim Actions yakalar, refresh token URL'i ile path-filtered olarak Dokploy'a iletir.
- GitHub Actions secret'ları: `DOKPLOY_APP_WEBHOOK` ve `DOKPLOY_SOCKET_WEBHOOK` her servisin **General → Refresh Token** URL'i ile doldurulur (`https://dokploy.<host>/api/deploy/<refresh_token>` formatı).

## Sonuçlar

**Olumlu:**
- App-only commit'lerinde socket server restart olmaz → kullanıcı socket bağlantı kopması yaşamaz.
- Path matrisi kodda görünür → kod review'unda hangi değişiklik hangi servisi tetikler net.
- Manuel deploy hâlâ Dokploy panel "Redeploy" butonu + `workflow_dispatch` ile mümkün.

**Olumsuz / Dikkat:**
- Yeni eklenen ortak dosya path'leri her iki filtre listesinde de güncellenmeli (R1 — Eksik trigger path → bir servis güncellenmez). Plan §8.1/R1 azaltma maddeleri uygulanmalı.
- `lib/**` glob'u app trigger'ında geniş; socket trigger'ında spesifik dosyalar listelendi (R2). Yeni paylaşılan modül eklendiğinde socket listesine de eklenmesi gerek.
- GitHub Actions ücretsiz tier yeterli (public repo değil ama Pusula günde <50 commit alıyor, ayda 2000 dk limit çok altında).

**Rollback:**
- Dokploy → her iki servis → **Auto Deploy: ON** geri aç.
- `.github/workflows/deploy.yml` sil veya `on:` bloğunu boşalt.
- 60sn içinde eski davranışa dönülür, data kaybı yok.

## Yanlış Tavsiye Düzeltmesi (2026-05-11)

İlk uygulama sırasında "Dokploy → Auto Deploy: OFF" tavsiye edilmişti. Bu YANLIŞ. Dokploy webhook endpoint'inin kaynak kodu (`apps/dokploy/pages/api/deploy/[refreshToken].ts` canary branch):

```ts
if (!application?.autoDeploy) {
    res.status(400).json({ message: "Automatic deployments are disabled..." });
    return;
}
```

Yani **`autoDeploy` flag'i webhook tetiklemesi için de zorunlu**. Doğru yaklaşım: Dokploy'da Auto Deploy: ON kalmalı, **GitHub'taki repo webhook'u silinmeli** (Settings → Webhooks → Delete). Push'a sadece bizim Actions reaksiyon verir.

T1 testi (commit `4ca2606`) ilk run'da bu yüzden 400 ile fail etmişti; webhook silindikten + Auto Deploy: ON yapıldıktan sonra re-run başarılı oldu.

## Test Sonuçları (2026-05-11 smoke test)

| Senaryo | Değişiklik | deploy-app | deploy-socket | Sonuç |
|---------|-----------|:---:|:---:|:---:|
| T10 | `README.md` | skipped | skipped | ✅ |
| T1 | `app/page.tsx` | success | skipped | ✅ |
| T2 | `socket-server/index.ts` | skipped | success | ✅ |

3/3 senaryo beklenen davranışı verdi. Plan §10.1 K1.1 (≥9/10 senaryo) karşılandı.

## Sonraki Adımlar

1. 1 hafta gözlem: `docker service ps pusula-socket-vrpbmy` çıktısında 1 saatlik pencerede en fazla 1 Shutdown bekleniyor (önceki: 4).
2. Plan §12.2 karar noktası: Katman 1 yeterli mi yoksa Katman 2 (Redis adapter) gerekli mi?
