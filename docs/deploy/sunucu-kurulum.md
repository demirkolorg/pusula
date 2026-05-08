# Pusula Production Sunucu Kurulum Rehberi

> **Sunucu:** Hosting Dünyam TR-VDS7 (4 Çekirdek · 12 GB RAM · 70 GB SSD · Limitsiz · Türkiye)
> **Orkestrasyon:** Dokploy (self-hosted PaaS)
> **Hedef stack:** Next.js 16 + Bun · Socket.io · PostgreSQL 16 · MinIO · Traefik
> **Doküman amacı:** Sunucu kiralandığı andan, Pusula'nın canlıya çıktığı ana kadar adım adım takip listesi.
>
> Bu doküman bir rehberdir, körü körüne kopyala-yapıştır değil. Her adımda **DUR-OKU-ANLA-UYGULA** prensibine uy.

---

## İçindekiler

1. [Ön Hazırlık (Sunucuyu kiralamadan önce)](#1-ön-hazırlık)
2. [Sunucu Kiralama ve İlk Erişim](#2-sunucu-kiralama-ve-ilk-erişim)
3. [Sistem Hardening (Güvenlik Sertleştirme)](#3-sistem-hardening)
4. [Docker ve Bağımlılık Kurulumu](#4-docker-ve-bağımlılık-kurulumu)
5. [Dokploy Kurulumu](#5-dokploy-kurulumu)
6. [Domain ve DNS Ayarları](#6-domain-ve-dns-ayarları)
7. [Pusula İçin Servis Hazırlığı](#7-pusula-için-servis-hazırlığı)
8. [Pusula Uygulamasını Deploy Etme](#8-pusula-uygulamasını-deploy-etme)
9. [Veritabanı Migration ve İlk Seed](#9-veritabanı-migration-ve-ilk-seed)
10. [Backup Stratejisi](#10-backup-stratejisi)
11. [Monitoring ve Loglama](#11-monitoring-ve-loglama)
12. [Sürekli Deployment (CI/CD)](#12-sürekli-deployment-cicd)
13. [Sorun Giderme ve Rollback](#13-sorun-giderme-ve-rollback)
14. [Bakım Takvimi](#14-bakım-takvimi)

---

## 1. Ön Hazırlık

Sunucuyu kiralamadan ÖNCE şunları hazırlamış ol:

### 1.1 Domain Adı

Pusula için bir domain belirlemen lazım. Tipik yapı:

| Hostname | Amaç |
|----------|------|
| `pusula.example.com` | Ana uygulama (Next.js) |
| `socket.pusula.example.com` | Socket.io server |
| `dokploy.example.com` | Dokploy yönetim paneli |
| `s3.pusula.example.com` | MinIO API (dosya URL'leri için) |
| `s3-console.pusula.example.com` | MinIO yönetim konsolu |

> Eğer domain yoksa: Cloudflare üzerinden bir domain alabilirsin (~10 USD/yıl). Cloudflare DNS önerilir; ileride DDoS koruması ve cache için kullanışlı.

### 1.2 SSH Anahtar Çifti

Yerel makinende SSH anahtarın yoksa oluştur:

```bash
# Windows (PowerShell) veya WSL
ssh-keygen -t ed25519 -C "pusula-prod" -f ~/.ssh/pusula_prod
```

Çıkan **public key**'i (`~/.ssh/pusula_prod.pub`) yanında bulundur — sunucuya yükleyeceğiz.

### 1.3 Şifre Yöneticisi Hazırlığı

Sunucu kurulumunda **çok sayıda parola** üreteceksin. Bitwarden / 1Password / KeePassXC açık olsun. Üreteceklerimiz:

- Sunucu yeni kullanıcı parolası
- PostgreSQL parolası (Pusula app için)
- PostgreSQL parolası (Dokploy için — otomatik üretilir)
- MinIO root user/password
- MinIO Pusula service account access key/secret
- NextAuth `AUTH_SECRET` (32+ byte random)
- Resend API key (mail için, hesap aç)
- Cloudflare API token (DNS için, opsiyonel)

### 1.4 Kontrol Listesi

Bu maddeleri tamamlamadan sunucuyu kiralama:

- [ ] Domain alındı / DNS yönetim paneline erişimim var
- [ ] SSH anahtar çifti oluşturuldu, public key elimde
- [ ] Şifre yöneticisi hazır
- [ ] Resend hesabı açıldı, mail gönderici domain'i doğrulandı (SPF/DKIM)
- [ ] Bu dokümanı baştan sona okudum
- [ ] Yerel makinede `ssh`, `git`, `curl` kurulu

---

## 2. Sunucu Kiralama ve İlk Erişim

### 2.1 Sipariş

Hosting Dünyam panelinden **TR-VDS7** siparişi:

- İşletim sistemi: **Ubuntu 24.04 LTS** (Dokploy resmi destek)
- Lokasyon: Türkiye (varsayılan)
- Parola tipi: Güçlü otomatik üretilen (mail ile gelir)

> **Not:** Ubuntu 22.04 da çalışır. Debian 12 da olur ama Dokploy dokümantasyonu çoğunlukla Ubuntu üzerinden.

### 2.2 Sunucu Bilgilerini Kaydet

Mail ile gelen bilgileri şifre yöneticisine kaydet:
- Sunucu IP adresi (örn. `185.x.x.x`)
- Root parolası
- Panel erişim bilgileri (yeniden başlatma, snapshot için)

### 2.3 İlk SSH Bağlantısı

```bash
# Yerel makineden
ssh root@SUNUCU_IP
```

İlk bağlantıda fingerprint sorulur, `yes` yaz. Root parolasını gir.

İçeri girdiğinde **uname** ve **disk** kontrolü yap:

```bash
uname -a
df -h
free -h
nproc
```

Beklenen: 4 CPU, 12 GB RAM, ~70 GB disk göstermeli. Yanlışsa **panelden iptal et**.

### 2.4 Snapshot Al (varsa)

Panelde "Snapshot" özelliği varsa, **temiz Ubuntu** snapshotunu al. Kurulum bozulursa baştan başlamak için sigorta.

---

## 3. Sistem Hardening

### 3.1 Sistem Güncellemesi

```bash
apt update && apt upgrade -y
apt install -y curl wget git vim ufw fail2ban htop ncdu unzip ca-certificates gnupg lsb-release
reboot
```

Reboot sonrası tekrar SSH ile bağlan.

### 3.2 Hostname ve Timezone

```bash
hostnamectl set-hostname pusula-prod
timedatectl set-timezone Europe/Istanbul
date  # kontrol: TRT göstermeli
```

`/etc/hosts` dosyasına da ekle:

```bash
echo "127.0.1.1 pusula-prod" >> /etc/hosts
```

### 3.3 Yeni Yönetici Kullanıcı

Root ile uzun süre çalışma. Sudo'lu bir kullanıcı oluştur:

```bash
adduser deploy
usermod -aG sudo deploy
```

Parolayı şifre yöneticisine kaydet.

SSH anahtarını bu kullanıcıya yükle:

```bash
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
# Yerel makinende çalıştır (yeni terminal):
# scp ~/.ssh/pusula_prod.pub root@SUNUCU_IP:/home/deploy/.ssh/authorized_keys

# Sunucuda devam:
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
```

**Yeni terminal aç ve test et** (mevcut root oturumu kapatma henüz):

```bash
ssh -i ~/.ssh/pusula_prod deploy@SUNUCU_IP
sudo whoami  # root yazmalı, deploy parolasını isteyecek
```

Çalışıyorsa devam.

### 3.4 SSH Hardening

`/etc/ssh/sshd_config.d/hardening.conf` adında yeni dosya:

```bash
sudo vim /etc/ssh/sshd_config.d/hardening.conf
```

İçerik:

```
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
AllowUsers deploy
```

> **Opsiyonel ama önerilir:** SSH portunu değiştir (örn. `Port 2222`). Bunu yaparsan UFW kuralında da aynı portu aç.

Servisi yenile:

```bash
sudo systemctl reload ssh
```

**ÖNEMLİ:** Mevcut root oturumunu KAPATMA. Yeni bir terminal aç ve `deploy` ile bağlanabildiğini DOĞRULA. Çalışmıyorsa eski oturumdan düzelt.

### 3.5 Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
# Dokploy panelini IP-kısıtlı açmak istersen:
# sudo ufw allow from KENDI_IP_IM to any port 3000 comment 'Dokploy panel'
sudo ufw enable
sudo ufw status verbose
```

### 3.6 fail2ban

SSH brute-force korumasi:

```bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vim /etc/fail2ban/jail.local
```

`[sshd]` bölümünü bul, şu hale getir:

```
[sshd]
enabled = true
port    = 22
maxretry = 3
bantime = 1h
findtime = 10m
```

Başlat:

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status
```

### 3.7 Swap Dosyası

12 GB RAM yeterli ama `next build` ve OOM senaryolarına karşı 4 GB swap:

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
free -h  # Swap satırı 4Gi göstermeli
```

### 3.8 Otomatik Güvenlik Güncellemesi

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades  # Yes seç
```

### 3.9 Hardening Kontrol Listesi

- [ ] Root SSH login kapalı
- [ ] Parolayla SSH login kapalı (sadece key)
- [ ] UFW aktif, sadece 22/80/443 açık
- [ ] fail2ban çalışıyor
- [ ] Swap aktif
- [ ] `deploy` kullanıcısı sudo'lu, SSH key ile giriyor
- [ ] Otomatik güvenlik güncellemesi açık

---

## 4. Docker ve Bağımlılık Kurulumu

### 4.1 Docker Engine

Resmi Docker repo:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Doğrulama:

```bash
sudo docker run --rm hello-world
docker --version
docker compose version
```

### 4.2 Deploy Kullanıcısını Docker Grubuna Ekle

```bash
sudo usermod -aG docker deploy
# Çıkış yap, tekrar gir
exit
ssh -i ~/.ssh/pusula_prod deploy@SUNUCU_IP
docker ps  # parolasız çalışmalı
```

### 4.3 Docker Daemon Yapılandırması

`/etc/docker/daemon.json`:

```bash
sudo vim /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-address-pools": [
    { "base": "172.20.0.0/16", "size": 24 }
  ]
}
```

Yeniden başlat:

```bash
sudo systemctl restart docker
```

> Log limiti olmadan Docker logları diski hızla doldurabilir. Bu ayar zorunlu.

---

## 5. Dokploy Kurulumu

### 5.1 Resmi Kurulum Komutu

Dokploy resmi tek komut script'i:

```bash
curl -sSL https://dokploy.com/install.sh | sudo sh
```

> Script Docker Swarm'ı init eder, Traefik'i ayağa kaldırır, Dokploy konteynerini başlatır. 2-3 dakika sürer.

### 5.2 Kurulum Sonrası

Script bittiğinde panel adresini yazar:

```
http://SUNUCU_IP:3000
```

Tarayıcıdan aç. **İlk açılışta admin hesabı oluşturma ekranı** çıkar:

- Email: kendi mailin
- Password: GÜÇLÜ parola (şifre yöneticisine kaydet)

Bu hesap **superadmin**, sonradan ekstra kullanıcı eklenebilir.

### 5.3 Dokploy Servisleri Kontrolü

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Görmen gereken konteynerler:
- `dokploy-traefik` (80, 443, 8080)
- `dokploy-postgres` (Dokploy'un kendi DB'si)
- `dokploy-redis`
- `dokploy` (panel, port 3000)

### 5.4 Dokploy'u Subdomain'e Bağlama

Panel `IP:3000` üzerinden çalışmasın, `dokploy.example.com` üzerinden HTTPS ile çalışsın:

1. DNS panelinde `dokploy.example.com` → A record → SUNUCU_IP
2. Dokploy paneline gir → **Settings** → **Server**
3. Domain: `dokploy.example.com`, HTTPS: enable, Let's Encrypt
4. Kaydet → Traefik otomatik sertifika alır

Sertifika alındıktan sonra UFW'den 3000 portunu kapat:

```bash
sudo ufw delete allow 3000
```

### 5.5 Dokploy Kontrol Listesi

- [ ] Panel açıldı, admin hesabı oluşturuldu
- [ ] Subdomain bağlandı, HTTPS çalışıyor
- [ ] Traefik dashboard erişilebilir (opsiyonel, basic auth ile)
- [ ] Port 3000 firewall'da kapatıldı

---

## 6. Domain ve DNS Ayarları

DNS sağlayıcında (Cloudflare önerilir) **A record**'lar:

| Hostname | Tip | Değer | Proxy |
|----------|-----|-------|-------|
| `pusula.example.com` | A | SUNUCU_IP | DNS only (önce), sonra Proxy |
| `socket.pusula.example.com` | A | SUNUCU_IP | DNS only (WebSocket için) |
| `dokploy.example.com` | A | SUNUCU_IP | DNS only |
| `s3.pusula.example.com` | A | SUNUCU_IP | DNS only |
| `s3-console.pusula.example.com` | A | SUNUCU_IP | DNS only |

> **Uyarı:** Cloudflare proxy (turuncu bulut) WebSocket için ek konfigürasyon ister. İlk kurulumda hepsini "DNS only" (gri bulut) bırak. Çalışınca tek tek aç.

DNS propagasyonu 5-30 dk arası. Kontrol:

```bash
dig pusula.example.com +short
# SUNUCU_IP dönmeli
```

---

## 7. Pusula İçin Servis Hazırlığı

Dokploy panelinde **Project** → **Create Project** → "Pusula" oluştur. İçine üç servis ekleyeceğiz:

1. PostgreSQL (database)
2. MinIO (object storage)
3. Pusula app (Next.js, Bun runtime)
4. Socket.io server (Bun)

### 7.1 PostgreSQL Servisi

Dokploy'da **Add Service → Database → PostgreSQL**:

- Name: `pusula-postgres`
- Image: `postgres:16-alpine`
- Database name: `pusula`
- Username: `pusula`
- Password: **güçlü parola üret, kaydet**
- Port: `5432` (sadece internal)
- Volume: `pusula-pg-data` → `/var/lib/postgresql/data`

**Environment** sekmesi:

```
TZ=Europe/Istanbul
PGTZ=Europe/Istanbul
```

> Pusula'nın `docker-compose.yml`'sindeki ayarlarla bire bir aynı.

Deploy → "Healthy" olduğunu bekle.

**Internal hostname:** `pusula-postgres` (Dokploy network'unde diğer servisler bu hostname'le erişir).

**Connection string:**
```
postgresql://pusula:PAROLA@pusula-postgres:5432/pusula
```

### 7.2 MinIO Servisi

**Add Service → Application → Docker** (manuel image):

- Name: `pusula-minio`
- Image: `minio/minio:latest`
- Command: `server /data --console-address ":9001"`
- Port mappings: 9000 (API), 9001 (Console)
- Volume: `pusula-minio-data` → `/data`

**Environment**:

```
MINIO_ROOT_USER=pusula_minio_admin
MINIO_ROOT_PASSWORD=<güçlü-parola>
MINIO_BROWSER_REDIRECT_URL=https://s3-console.pusula.example.com
```

**Domains** sekmesi (HTTPS için):

| Host | Container Port | HTTPS |
|------|----------------|-------|
| `s3.pusula.example.com` | 9000 | Let's Encrypt |
| `s3-console.pusula.example.com` | 9001 | Let's Encrypt |

Deploy → S3 console subdomain'inden giriş yap. Burada Pusula için **bucket** ve **service account** oluşturacağız:

1. **Buckets → Create Bucket**: `pusula-files`
2. **Identity → Service Accounts → Create**:
   - Access Key, Secret Key üret → kaydet
   - Policy: bucket'a `read+write` ver

### 7.3 Servis Hazırlığı Kontrol Listesi

- [ ] PostgreSQL "healthy"
- [ ] MinIO API HTTPS ile açılıyor
- [ ] MinIO console HTTPS ile açılıyor, login OK
- [ ] `pusula-files` bucket'ı oluşturuldu
- [ ] MinIO service account access/secret key kayıtlı
- [ ] PostgreSQL connection string kayıtlı

---

## 8. Pusula Uygulamasını Deploy Etme

### 8.1 GitHub Repo Bağlantısı

Dokploy → **Settings → Git Providers → GitHub** → OAuth ile bağla. Erişim ver.

### 8.2 Pusula App Servisi

**Add Service → Application**:

- Name: `pusula-app`
- Source: GitHub → `<senin-repo>/pusula`
- Branch: `main`
- Build Type: **Dockerfile** (önerilir, aşağıda Dockerfile örneği)

### 8.3 Dockerfile Hazırlığı (Repo'ya eklenecek)

Pusula'da henüz prod Dockerfile yoksa, repo köküne `Dockerfile`:

```dockerfile
# Build stage
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.3 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bunx prisma generate
RUN bun run build

# Runtime stage
FROM oven/bun:1.3-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=2500
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 2500

CMD ["bun", "run", "server.js"]
```

> `next.config.ts` içine `output: 'standalone'` eklenmeli — eğer yoksa ekle.

### 8.4 Environment Variables (Dokploy panelinden)

Pusula app servisinin **Environment** sekmesine:

```bash
# --- Çekirdek ---
NODE_ENV=production
PORT=2500
TZ=Europe/Istanbul

# --- Database ---
# Sprint 5 / S5-6 — Production connection pool parametreleri:
#   connection_limit: 10 (single-pod default; pgbouncer arkasındaysa 1-3)
#   pool_timeout=20: query bekleme süresi sn (default 10)
#   connect_timeout=10: ilk bağlantı kuruluş süresi sn
DATABASE_URL=postgresql://pusula:DB_PAROLA@pusula-postgres:5432/pusula?schema=public&connection_limit=10&pool_timeout=20&connect_timeout=10

# --- NextAuth ---
AUTH_SECRET=<openssl rand -base64 32 ile üret>
AUTH_URL=https://pusula.example.com
AUTH_TRUST_HOST=true

# --- MinIO / S3 ---
S3_ENDPOINT=https://s3.pusula.example.com
S3_REGION=us-east-1
S3_BUCKET=pusula-files
S3_ACCESS_KEY=<MinIO service account access key>
S3_SECRET_KEY=<MinIO service account secret>
S3_FORCE_PATH_STYLE=true

# --- Mail (Resend) ---
RESEND_API_KEY=<re_ ile başlayan key>
RESEND_FROM=Pusula <noreply@example.com>

# --- Socket ---
NEXT_PUBLIC_SOCKET_URL=https://socket.pusula.example.com
```

> **DİKKAT:** Tam env değişkeni listesi için repo içindeki `.env.example` dosyasına bak. Yukarıdaki liste beklenen yapıdır, projedeki gerçek isimlerle eşleştir.

### 8.5 Domain ve HTTPS

**Domains** sekmesi:

- Host: `pusula.example.com`
- Container Port: `2500`
- HTTPS: enable, Let's Encrypt

### 8.6 Resource Limits

**Advanced → Resources**:

- Memory limit: `2 GB`
- Memory reservation: `512 MB`
- CPU limit: `2`

> 12 GB RAM'in tamamını tek servise verme; build sırasında zaten geçici olarak 4 GB+ kullanır, ayrıca PostgreSQL, MinIO, Dokploy, Socket için yer kalmalı.

### 8.7 Deploy

**Deploy** butonu → ilk build 5-10 dakika sürer (lock dosyası, Prisma generate, Next build).

Build logu izle. Yeşil olunca:

```bash
curl -I https://pusula.example.com
# HTTP/2 200 dönmeli
```

### 8.8 Socket.io Server Servisi

Aynı repo, farklı entry point. **Add Service → Application**:

- Name: `pusula-socket`
- Source: aynı GitHub repo
- Build Type: Dockerfile (ayrı bir `Dockerfile.socket`)

Repo köküne `Dockerfile.socket`:

```dockerfile
FROM oven/bun:1.3 AS deps
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM oven/bun:1.3-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV SOCKET_PORT=2501
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 2501
CMD ["bun", "run", "socket-server/index.ts"]
```

Dockerfile yolu: Service ayarlarında **Dockerfile path** = `Dockerfile.socket`.

**Environment** (aynı DATABASE_URL ve AUTH_SECRET — pool params için S5-6):

```
NODE_ENV=production
SOCKET_PORT=2501
DATABASE_URL=postgresql://pusula:DB_PAROLA@pusula-postgres:5432/pusula
AUTH_SECRET=<aynı secret>
TZ=Europe/Istanbul
```

**Domains**:

- Host: `socket.pusula.example.com`
- Container Port: `2501`
- HTTPS: enable
- **WebSocket support: ENABLE** (Traefik için sticky)

### 8.9 Deploy Kontrol Listesi

- [ ] `pusula-app` deploy başarılı, HTTPS açık
- [ ] `pusula-socket` deploy başarılı, WebSocket bağlantısı kuruluyor
- [ ] Tarayıcıdan giriş ekranı görünüyor
- [ ] Login deneme yapılabilir (DB bağlantısı OK)

---

## 9. Veritabanı Migration ve İlk Seed

### 9.1 Migration Çalıştırma

Dokploy → `pusula-app` servisi → **Terminal** sekmesi (konteynere bash):

```bash
bunx prisma migrate deploy
```

> `migrate dev` DEĞİL, `migrate deploy`. Production'da pending migration'ları uygular, prompt göstermez.

Çıktıda "Database is now in sync" görmelisin.

### 9.2 İlk Süperadmin

Pusula'da seed script'i var (`prisma/seed.ts`). İçinde süperadmin oluşturma logic'i varsa:

```bash
bun run prisma/seed.ts
```

Yoksa Prisma Studio veya doğrudan SQL ile süperadmin kullanıcı oluştur:

```bash
# Dokploy → pusula-postgres → Terminal
psql -U pusula -d pusula
```

Pusula'nın user oluşturma logic'ine göre `argon2` ile hash'lenmiş bir parola lazım. **En temizi**: app içinde bir CLI komutu varsa onu çalıştır. Yoksa geçici olarak bir API endpoint açıp ilk kullanıcıyı oluştur, sonra kapat.

### 9.3 MinIO Bucket Politikası Doğrulama

Pusula'nın dosya yükleme akışını test et:
1. Süperadmin ile login
2. Bir projede dosya yükle (PDF)
3. MinIO konsoluna gir → `pusula-files` bucket'ında dosyayı gör
4. URL'yi tarayıcıda aç → indirme/önizleme çalışmalı

Çalışmıyorsa: MinIO service account'ın bucket policy'si `readwrite` olmalı.

---

## 10. Backup Stratejisi

### 10.1 PostgreSQL Otomatik Backup

Dokploy'da **Backups** özelliği:

- `pusula-postgres` → **Backups → Add Schedule**
- Frequency: `0 3 * * *` (her gün 03:00 TRT)
- Retention: 7 günlük
- Destination: S3 (MinIO bucket'ı `pusula-backups` veya off-site)

### 10.2 MinIO Backup

MinIO için ayrı bir mirror script. Sunucuda `/home/deploy/backup-minio.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=/home/deploy/backups/minio
mkdir -p "$BACKUP_DIR"

docker run --rm \
  --network=dokploy-network \
  -v "$BACKUP_DIR:/backup" \
  minio/mc:latest \
  bash -c "
    mc alias set src https://s3.pusula.example.com ACCESS SECRET &&
    mc mirror src/pusula-files /backup/pusula-files-$TIMESTAMP
  "

# 7 günden eski backupları sil
find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \;
```

Cron'a ekle:

```bash
chmod +x /home/deploy/backup-minio.sh
crontab -e
# Ekle:
0 4 * * * /home/deploy/backup-minio.sh >> /home/deploy/backups/minio.log 2>&1
```

### 10.3 Off-site Backup (KRİTİK)

Sunucu yangın/disk arızası senaryosunda yerel backup işe yaramaz. **Hetzner Storage Box** (~3 EUR/ay, 1 TB) veya **Backblaze B2** öneriyorum.

Rclone ile günlük sync:

```bash
sudo apt install -y rclone
rclone config  # interaktif setup
# Sonra cron'a:
# 0 5 * * * rclone sync /home/deploy/backups offsite:pusula-backups
```

### 10.4 Backup Test Etme

**Test edilmeyen backup, backup değildir.** Ayda bir kez:

1. Backup dosyasını rastgele bir dev sunucuya restore et
2. PostgreSQL `pg_restore` ile yükle
3. Pusula'yı bu data ile başlat → çalışıyorsa OK

### 10.5 Backup Kontrol Listesi

- [ ] PostgreSQL günlük backup aktif (Dokploy)
- [ ] MinIO günlük mirror aktif (cron)
- [ ] Off-site backup aktif (rclone)
- [ ] İlk backup test restore başarılı

---

## 11. Monitoring ve Loglama

### 11.1 Dokploy Built-in Monitoring

Panel → her servis için **Monitoring** sekmesi: CPU, RAM, network grafikleri. İlk hafta için yeterli.

### 11.2 Uptime Monitor

Harici uptime check için **UptimeRobot** (ücretsiz, 50 monitor) veya **BetterStack**:

- `https://pusula.example.com` → 1 dk interval
- `https://socket.pusula.example.com` → 5 dk interval
- Mail/Telegram alert

### 11.3 Log Aggregation (opsiyonel, ileride)

İlk fazda Dokploy'un kendi log viewer'ı yeterli. Trafik artınca:

- **Loki + Grafana** (self-hosted, hafif)
- **Better Stack Logs** (managed, ücretsiz tier)

### 11.4 Error Tracking

Pusula'da `pino` zaten var. Production error tracking için **Sentry**:

- Free tier: 5K event/ay
- Pusula'ya `@sentry/nextjs` ekle, env'e `SENTRY_DSN` ver

---

## 12. Sürekli Deployment (CI/CD)

### 12.1 Auto-Deploy on Push

Dokploy GitHub entegrasyonu zaten kuruldu (Adım 8.1). Servis ayarlarında:

- **Auto Deploy: ON**
- **Branch: main**
- **Build trigger: push to main**

`git push origin main` her yapıldığında Dokploy:
1. Webhook alır
2. Repo'yu çeker
3. Dockerfile build eder
4. Eski konteyneri durdurmadan yenisini başlatır (zero-downtime)
5. Health check geçerse trafiği yeni konteynere döndürür

### 12.2 Preview Environments (opsiyonel)

PR başına geçici environment için Dokploy'un **Preview Deployments** özelliği:

- Her PR → ayrı subdomain (örn. `pr-42.pusula.example.com`)
- PR kapanınca otomatik silinir
- DB için ayrı schema veya ayrı container

> Şimdilik atla, MVP sonrasında düşün.

### 12.3 Migration Stratejisi

`bunx prisma migrate deploy` her deploy'da otomatik çalışmalı. Bunun için Dockerfile'da CMD'den önce migration run eden bir entrypoint script:

```dockerfile
COPY --chown=nextjs:nodejs scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]
CMD ["bun", "run", "server.js"]
```

`scripts/entrypoint.sh`:

```bash
#!/usr/bin/env bash
set -e
echo "[entrypoint] Running migrations..."
bunx prisma migrate deploy
echo "[entrypoint] Starting app..."
exec "$@"
```

> Migration başarısız olursa konteyner ayağa kalkmaz, eski versiyon çalışmaya devam eder.

---

## 13. Sorun Giderme ve Rollback

### 13.1 Hızlı Rollback

Deploy bozulursa:

- Dokploy → servis → **Deployments** sekmesi
- Önceki başarılı deploy → **Rollback** butonu
- 30 sn içinde eski versiyona döner

### 13.2 Sık Karşılaşılan Sorunlar

**"Database connection failed"**
- `DATABASE_URL` içindeki hostname `pusula-postgres` mi? `localhost` ise yanlış.
- Aynı Dokploy network'unde mi? Her iki servis aynı projede olmalı.

**"NextAuth error: Invalid CSRF"**
- `AUTH_URL` HTTPS mi?
- `AUTH_TRUST_HOST=true` set mi?
- Domain ve cookie domain uyuşuyor mu?

**"MinIO upload failed"**
- `S3_ENDPOINT` HTTPS mi?
- `S3_FORCE_PATH_STYLE=true` mu? (MinIO için zorunlu)
- Bucket policy `readwrite` mı?

**WebSocket bağlanmıyor**
- Cloudflare proxy AÇIK mı? Aç + WebSocket support enable.
- Traefik ayarlarında "WebSocket" işareti var mı?

**Build OOM (out of memory)**
- Dockerfile'da `NODE_OPTIONS="--max-old-space-size=2048"` ekle
- Ya da Dokploy resource limit'i geçici olarak 4 GB yap

### 13.3 Acil Durum Erişimi

Panel çökerse SSH ile elle müdahale:

```bash
# Tüm konteyner durumu
docker ps -a

# Servisin loglarını gör
docker logs -f pusula-app --tail 100

# Servisi yeniden başlat
docker restart pusula-app

# Konteyner içine gir
docker exec -it pusula-app sh

# Disk doluysa
docker system prune -a --volumes  # DİKKAT, kullanılmayan volume'ları siler
```

---

## 14. Bakım Takvimi

| Sıklık | İş |
|--------|-----|
| **Her push** | Otomatik deploy + migration (Dokploy) |
| **Günlük 03:00** | PostgreSQL backup |
| **Günlük 04:00** | MinIO mirror |
| **Günlük 05:00** | Off-site backup sync |
| **Haftalık** | `apt update && apt upgrade` (deploy kullanıcısı ile) |
| **Haftalık** | `docker system prune` (kullanılmayan image temizliği) |
| **Aylık** | Backup restore testi |
| **Aylık** | Disk kullanımı kontrolü (`df -h`, `ncdu /`) |
| **3 aylık** | SSL sertifika kontrolü (Let's Encrypt otomatik ama gözle bak) |
| **3 aylık** | Dokploy güncelleme (panel içinden) |
| **6 aylık** | Bağımlılık güvenlik taraması (`bun audit`) |
| **Yıllık** | Disaster recovery tatbikatı (sıfırdan kurulum simülasyonu) |

---

## Ekler

### A. Önemli Komut Cüzdanı

```bash
# Sunucu kaynak izleme
htop
docker stats

# Disk
df -h
ncdu /var/lib/docker

# Log
docker logs -f pusula-app --tail 200
journalctl -u docker -n 100

# Servis yeniden başlatma
docker restart pusula-app
docker restart pusula-socket

# DB hızlı sorgu
docker exec -it pusula-postgres psql -U pusula -d pusula -c "SELECT COUNT(*) FROM \"User\";"
```

### B. Acil Durum İletişim Listesi

- **Hosting Dünyam destek:** (sipariş mailindeki ticket sistemi)
- **Domain sağlayıcı:** ____
- **Resend (mail):** dashboard.resend.com
- **DNS sağlayıcı:** Cloudflare dashboard

### C. Okuma Listesi

- Dokploy resmi docs: https://docs.dokploy.com
- Next.js standalone deploy: https://nextjs.org/docs/app/api-reference/next-config-js/output
- Prisma deployment guide: https://www.prisma.io/docs/orm/prisma-client/deployment
- MinIO production checklist: https://min.io/docs/minio/linux/operations/checklists/thresholds.html

---

## Tamamlama Kontrolü

Tüm bu adımlar bittiğinde:

- [ ] `https://pusula.example.com` HTTPS ile açılıyor
- [ ] Login → süperadmin girişi yapılabiliyor
- [ ] Bir proje oluşturulabiliyor
- [ ] Dosya yüklenip indirilebiliyor (MinIO çalışıyor)
- [ ] Realtime bildirim geliyor (socket çalışıyor)
- [ ] Mail gönderimi çalışıyor (Resend test maili)
- [ ] `git push origin main` → otomatik deploy başlıyor
- [ ] Backup dosyaları `/home/deploy/backups/` altında oluşuyor
- [ ] UptimeRobot "UP" gösteriyor

Hepsine tik atıldıysa: **Pusula production'da.**
