const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRawUnsafe('SELECT 1 as test')
  .then(r => { console.log('OK:', JSON.stringify(r)); p.$disconnect(); })
  .catch(e => { console.log('FAIL:', e.message); p.$disconnect(); });
