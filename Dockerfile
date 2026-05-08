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

# Prisma migration için CLI + schema (entrypoint.sh kullanıyor)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

# Argon2 native binary
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/argon2 ./node_modules/argon2
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@phc ./node_modules/@phc
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/node-addon-api ./node_modules/node-addon-api
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/node-gyp-build ./node_modules/node-gyp-build

# Entrypoint script (Windows CRLF güvenliği için sed)
COPY --chown=nextjs:nodejs scripts/entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' ./entrypoint.sh && chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 2500

ENTRYPOINT ["./entrypoint.sh"]
