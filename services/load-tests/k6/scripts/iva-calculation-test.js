import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const errorRate = new Rate('errors');
const calculationTime = new Trend('calculation_time');
const totalRequests = new Counter('total_requests');
const failedRequests = new Counter('failed_requests');

export const options = {
  stages: [
    { target: 10, duration: '30s' },
    { target: 50, duration: '1m30s' },
    { target: 100, duration: '3m' },
    { target: 50, duration: '1m' },
    { target: 0, duration: '30s' },
  ],
  thresholds: {
    http_req_duration: ['p(95) < 2000', 'p(99) < 5000'],
    http_req_failed: ['rate < 0.01'],
    errors: ['rate < 0.01'],
    calculation_time: ['p(95) < 2000', 'p(99) < 5000'],
  },
  tags: {
    test: 'iva-calculation',
    environment: __ENV.ENV || 'local',
  },
};

function generateIVAPayload() {
  const baseImponible = Math.random() * 10000 + 100;
  const ivaPercent = Math.random() > 0.3 ? 15 : 0;
  const hasRetencion = Math.random() > 0.6;
  const retencionPercent = hasRetencion ? (Math.random() > 0.5 ? 100 : 30) : 0;
  const hasFactura = Math.random() > 0.5;

  return {
    baseImponible: Math.round(baseImponible * 100) / 100,
    ivaPercent: ivaPercent,
    retencionFuente: retencionPercent,
    retencionIva: hasRetencion ? (Math.random() > 0.5 ? 30 : 10) : 0,
    tipoComprobante: hasFactura ? 'factura' : 'liquidacion',
    numeroComprobante: hasFactura ? `001-001-${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}` : '',
    fechaEmision: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: Math.round((Math.random() * 9000 + 100) * 100) / 100,
    descuento: Math.random() > 0.7 ? Math.round(Math.random() * 500 * 100) / 100 : 0,
    moneda: 'USD',
  };
}

export default function () {
  group('IVA Calculation', function () {
    const payload = generateIVAPayload();
    const url = `${BASE_URL}/api/v1/tax/iva/calculate`;

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': `k6-iva-${Date.now()}-${__VU}-${__ITER}`,
      },
      tags: { endpoint: 'iva_calculate', type: 'load' },
      timeout: '30s',
    };

    const res = http.post(url, JSON.stringify(payload), params);

    totalRequests.add(1);
    calculationTime.add(res.timings.duration);

    const success = check(res, {
      'IVA calculation status is 200': (r) => r.status === 200,
      'IVA calculation response time < 2000ms': (r) => r.timings.duration < 2000,
    });

    if (!success) {
      errorRate.add(1);
      failedRequests.add(1);
      console.warn(`[WARN] IVA calc failed: status=${res.status}, duration=${res.timings.duration}ms, vu=${__VU}, iter=${__ITER}`);
    } else {
      errorRate.add(0);

      try {
        const body = JSON.parse(res.body);
        if (body.ivaCalculado !== undefined) {
          check(body, {
            'IVA calculated value is positive': (b) => b.ivaCalculado >= 0,
          });
        }
        if (body.total) {
          check(body, {
            'Total includes IVA': (b) => b.total >= b.subtotal,
          });
        }
      } catch (e) {
        console.warn(`[WARN] Could not parse IVA response body: ${e.message}`);
      }
    }
  });

  sleep(Math.random() * 2 + 0.5);
}
