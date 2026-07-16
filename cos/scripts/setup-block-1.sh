#!/bin/bash
# Configuración del Bloque 1 — Cimientos
# Ejecutar después de clonar el repo por primera vez

set -e

echo "Configurando Bloque 1 — Cimientos"
echo "======================================="

echo "Installing dependencies..."
npm install

echo "Setting up husky..."
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional prettier eslint
npx husky install
echo 'npx lint-staged' > .husky/pre-commit
chmod +x .husky/pre-commit

echo "Setting up environment..."
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local. Edit variables before continuing."
fi

echo "Running migrations..."
npx prisma migrate deploy
npx prisma generate

echo "Seeding data..."
npx tsx prisma/seed.ts

echo "Verifying database..."
npx tsx scripts/verify-db.ts

echo "Running tests..."
npm test

echo ""
echo "Bloque 1 completado!"