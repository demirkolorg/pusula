#!/bin/sh
set -e

echo "[entrypoint] Pusula production starter"
echo "[entrypoint] NODE_ENV=$NODE_ENV"
echo "[entrypoint] PORT=$PORT HOSTNAME=$HOSTNAME"

echo "[entrypoint] Running database migrations (prisma migrate deploy)..."
# bunx kullanma — node_modules/.bin/prisma yoksa registry'den latest (Prisma 7)
# çekip schema validation hatası veriyor. Doğrudan local CLI'yi çağır.
node ./node_modules/prisma/build/index.js migrate deploy

echo "[entrypoint] Starting Next.js standalone server..."
exec bun server.js
