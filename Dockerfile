# syntax=docker/dockerfile:1.7
# Pusula production Dockerfile — Bun 1.3 + Next.js 16 standalone + Prisma 6 + argon2 native

# =============================================================================
# Stage 1: deps — bağımlılıkları yükle (argon2 native compile için build araçları)
# =============================================================================
FROM oven/bun:1.3 AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY prisma ./prisma

RUN bun install --frozen-lockfile

# =============================================================================
# Stage 2: builder — Prisma generate + Next.js build (standalone output)
# =============================================================================
FROM oven/bun:1.3 AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build-time placeholder env'ler — Next.js prerender sırasında PrismaClient
# init veya diğer side-effect import'ların fail etmemesi için. Runtime'da
# Dokploy gerçek değerleri ile override eder.
ENV DATABASE_URL="postgres://placeholder:placeholder@localhost:5432/placeholder?schema=public"
ENV AUTH_SECRET="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
ENV AUTH_URL="http://localhost:2500"
ENV AUTH_TRUST_HOST="true"
ENV MINIO_ENDPOINT="localhost"
ENV MINIO_PORT="9000"
ENV MINIO_USE_SSL="false"
ENV MINIO_BUCKET="placeholder"
ENV MINIO_ACCESS_KEY="placeholder"
ENV MINIO_SECRET_KEY="placeholder"
ENV MAIL_PROVIDER="resend"
ENV MAIL_FROM="Pusula <onboarding@resend.dev>"
ENV RESEND_API_KEY="re_placeholder"
ENV NEXT_PUBLIC_BASE_URL="https://pusulaportal.com"
# NEXT_PUBLIC_SOCKET_URL boş → client current origin'i kullanır;
# Next.js rewrite (`/socket.io/*` → SOCKET_INTERNAL_URL) trafiği
# socket-server'a forward eder. Cookie aynı origin'de kalır,
# subdomain için ek auth ayarına gerek yok.
ENV NEXT_PUBLIC_SOCKET_URL=""
ENV SOCKET_INTERNAL_TOKEN="placeholder-build-time-only"

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN bunx prisma generate
RUN bun run build

# =============================================================================
# Stage 3: runner — production runtime (slim, non-root)
# =============================================================================
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=2500
ENV HOSTNAME=0.0.0.0
ENV TZ=Europe/Istanbul

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

# Next.js standalone server.js + minimal node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma schema + tüm node_modules
# Önceden sadece prisma + argon2 alt-paketleri kopyalıyorduk; ancak Prisma 6
# CLI'nin `@prisma/config` paketi `effect` gibi transitive dependency'lere
# bağlı (Cannot find package 'effect' hatası). Tüm node_modules'u kopyalamak
# image'ı ~300-500 MB büyütür ama tek kaynaklı hata yüzeyini sıfırlar.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
# lib/ klasörü Next standalone'a bundle edilmiş ama dosya olarak yok.
# prisma/seed.ts gibi maintenance script'leri lib'den import ettiği için
# runner'a da kopyalıyoruz. Birkaç MB ekstra, runtime davranışı etkilenmez.
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib

# Entrypoint script (Windows CRLF güvenliği için sed)
COPY --chown=nextjs:nodejs scripts/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 2500

ENTRYPOINT ["./entrypoint.sh"]
