#!/bin/sh
set -e

echo "[entrypoint] Pusula production starter"
echo "[entrypoint] NODE_ENV=$NODE_ENV"
echo "[entrypoint] PORT=$PORT HOSTNAME=$HOSTNAME"

echo "[entrypoint] Running database migrations (prisma migrate deploy)..."
bunx prisma migrate deploy

echo "[entrypoint] Starting Next.js standalone server..."
exec bun server.js
