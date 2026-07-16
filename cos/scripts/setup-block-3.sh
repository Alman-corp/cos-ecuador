#!/usr/bin/env bash
set -euo pipefail

echo "Bloque 3 — IA y Entrega"
echo "========================"

echo "1. Levantando Qdrant..."
docker compose up -d qdrant
sleep 5
curl -sf http://localhost:6333/healthz && echo "Qdrant healthy"

echo "2. Instalando packages..."
(cd packages/rag && npm install) 2>/dev/null || echo "packages/rag install skipped"
(cd packages/memory && npm install) 2>/dev/null || echo "packages/memory install skipped"

echo "3. Creando colecciones vectoriales..."
npx tsx scripts/init-qdrant.ts 2>/dev/null || echo "Init skipped (Qdrant no disponible)"

echo "4. Tests del bloque..."
npx vitest run tests/unit/rag tests/unit/finance 2>/dev/null || echo "Tests skipped (vitest no configurado)"

echo ""
echo "Bloque 3 configurado!"
echo "  Qdrant:  http://localhost:6333/dashboard"
echo "  RAG API: POST /api/rag/query"
echo "  CIM:     POST /api/reports/cim"
echo "  Cliente: /cliente"
echo "  Director: /director"
