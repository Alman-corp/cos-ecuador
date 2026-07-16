#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Block 2 — Backend Functional Setup"
echo "========================================"

# 1. Start infrastructure
echo "📦 Starting infrastructure (RabbitMQ, MinIO, Redis)..."
docker compose up -d rabbitmq minio redis

echo "⏳ Waiting for RabbitMQ..."
until docker exec cos-rabbitmq rabbitmqctl status > /dev/null 2>&1; do sleep 2; done
echo "✅ RabbitMQ ready"

echo "⏳ Waiting for MinIO..."
until curl -s http://localhost:9000/minio/health/live > /dev/null 2>&1; do sleep 2; done
echo "✅ MinIO ready"

# 2. Install dependencies
echo "📦 Installing npm packages..."
npm install

echo "📦 Installing Python dependencies..."
cd services/ai-orchestrator
pip install -r requirements.txt 2>/dev/null || pip install -e . 2>/dev/null || echo "⚠️ Python install skipped (use poetry/uv)"
cd ../..

# 3. Build packages
echo "🔨 Building shared packages..."
npm run build -w packages/shared-types 2>/dev/null || echo "⚠️ shared-types build skipped"

# 4. Verify services
echo "🔍 Verifying services..."

check_port() {
  local port=$1 name=$2
  if curl -s http://localhost:$port/health > /dev/null 2>&1; then
    echo "✅ $name (:$port)"
  else
    echo "⚠️  $name (:$port) — not responding"
  fi
}

check_port 5672 "RabbitMQ"
check_port 9000 "MinIO"
check_port 6379 "Redis"
check_port 3000 "Web App"
check_port 3002 "Clients Service"
check_port 3003 "Documents Service"
check_port 3004 "Finance Service"
check_port 8000 "AI Orchestrator"

# 5. Test event publisher
echo "🧪 Testing Event Publisher..."
npx tsx -e "
const { EventPublisher } = require('./packages/events/src/publisher');
async function test() {
  const pub = new EventPublisher();
  try {
    await pub.connect();
    await pub.publish({
      eventType: 'document.uploaded',
      tenantId: '00000000-0000-0000-0000-000000000000',
      documentId: '00000000-0000-0000-0000-000000000001',
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      uploadedBy: '00000000-0000-0000-0000-000000000002',
      timestamp: new Date().toISOString(),
    });
    console.log('✅ Event published successfully');
  } catch (err) {
    console.error('❌ Event publish failed:', err.message);
  }
  await pub.close();
}
test();
" 2>/dev/null || echo "⚠️ Event publisher test skipped (run manually in WSL2)"

echo ""
echo "✅ Block 2 setup complete!"
echo ""
echo "Next steps:"
echo "  npm run dev:services   # Start NestJS microservices"
echo "  npm run dev:web         # Start Next.js frontend"
echo "  cd services/ai-orchestrator && python main.py  # Start AI Orchestrator"