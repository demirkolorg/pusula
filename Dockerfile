FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# ── Bağımlılıklar ───────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# ── Builder ─────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bunx prisma generate
RUN bun run build

# ── Runner ───────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 2500
ENV PORT=2500
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "server.js"]
