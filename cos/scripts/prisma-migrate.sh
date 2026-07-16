#!/bin/bash
# Prisma migration wrapper: use this script to run migrations with the admin (superuser) role
# while the app uses the non-superuser bios_app role for runtime RLS enforcement.
#
# Usage: ./scripts/prisma-migrate.sh [prisma migrate args]
#
# Examples:
#   ./scripts/prisma-migrate.sh migrate dev --name add_field
#   ./scripts/prisma-migrate.sh migrate deploy
#   ./scripts/prisma-migrate.sh db push

MIGRATE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$MIGRATE_DIR/packages/prisma-schema" || exit 1

# Read admin URL from .env
ADMIN_URL=$(grep -oP 'DATABASE_URL_ADMIN="?\K[^"]+' .env 2>/dev/null || grep -oP 'DATABASE_URL_ADMIN=\K[^ ]+' .env 2>/dev/null)

if [ -z "$ADMIN_URL" ]; then
  # Fallback: use the bios URL directly
  ADMIN_URL="postgresql://bios:bios_secret@172.18.183.46:5432/bios_platform"
fi

echo "[migrate] Using admin database URL for: $@"
DATABASE_URL="$ADMIN_URL" npx prisma "$@"
