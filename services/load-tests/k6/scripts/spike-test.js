import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Gauge, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const maxResponseTime = new Gauge('max_response_time');
const recoveryTime = new Gauge('recovery_time_ms');
const totalRequests = new Counter('total_requests');
const failedRequests = new Counter('failed_requests');

export const options = {
  stages: [
    { target: 0, duration: '1m' },
    { target: 100, duration: '30s' },
    { target: 100, duration: '2m' },
    { target: 300, duration: '30s' },
    { target: 300, duration: '1m' },
    { target: 0, duration: '30s' },
  ],
  thresholds: {
    http_req_duration: ['max < 15000'],
    http_req_failed: ['rate < 0.10'],
    errors: ['rate < 0.10'],
    response_time: ['max < 15000'],
  },
  tags: {
    test: 'spike',
    environment: __ENV.ENV || 'local',
  },
};

const endpoints = [
  {
    name: 'iva_calculate',
    method: 'POST',
    path: '/api/v1/tax/iva/calculate',
    payload: () => ({
      baseImponible: Math.round((Math.random() * 10000 + 100) * 100) / 100,
      ivaPercent: Math.random() > 0.3 ? 15 : 0,
      retencionFuente: Math.random() > 0.5 ? 100 : 0,
      tipoComprobante: 'factura',
      numeroComprobante: `001-001-${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}`,
      fechaEmision: new Date().toISOString().split('T')[0],
      subtotal: Math.round((Math.random() * 9000 + 100) * 100) / 100,
    }),
  },
  {
    name: 'renta_calculate',
    method: 'POST',
    path: '/api/v1/tax/renta/calculate',
    payload: () => ({
      tipoContribuyente: 'persona_natural',
      periodoFiscal: 2026,
      ingresos: [{ mes: 1, valor: 5000 }, { mes: 2, valor: 5200 }, { mes: 3, valor: 5100 }],
      gastos: [{ mes: 1, valor: 2000 }, { mes: 2, valor: 2100 }, { mes: 3, valor: 2050 }],
      deduccionesPersonales: [{ tipo: 'vivienda', valor: 3000 }],
    }),
  },
  {
    name: 'health',
    method: 'GET',
    path: '/health',
    payload: null,
  },
];

let iterationTimestamps = [];
const RECOVERY_WINDOW_MS = 30000;

export default function () {
  group('Spike Test', function () {
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    const url = `${BASE_URL}${ep.path}`;
    const requestId = `k6-spike-${Date.now()}-${__VU}-${__ITER}`;

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
      tags: { endpoint: ep.name, type: 'spike' },
      timeout: '60s',
    };

    const startTime = Date.now();

    let res;
    if (ep.method === 'GET') {
      res = http.get(url, params);
    } else {
      const payload = ep.payload();
      res = http.post(url, JSON.stringify(payload), params);
    }

    const elapsed = Date.now() - startTime;

    totalRequests.add(1);
    responseTime.add(res.timings.duration);
    maxResponseTime.add(res.timings.duration);

    const success = check(res, {
      [`${ep.name} status is 200`]: (r) => r.status === 200,
      [`${ep.name} response time < 15000ms`]: (r) => r.timings.duration < 15000,
    });

    if (!success) {
      errorRate.add(1);
      failedRequests.add(1);
      console.warn(`[WARN] Spike test ${ep.name} failed: status=${res.status}, duration=${res.timings.duration}ms, vu=${__VU}`);
    } else {
      errorRate.add(0);
    }

    const now = Date.now();
    iterationTimestamps = iterationTimestamps.filter((t) => now - t < RECOVERY_WINDOW_MS);
    iterationTimestamps.push(now);

    if (iterationTimestamps.length >= 2) {
      const oldestInWindow = iterationTimestamps[0];
      const newestInWindow = iterationTimestamps[iterationTimestamps.length - 1];
      if (newestInWindow - oldestInWindow < RECOVERY_WINDOW_MS && iterationTimestamps.length > 10) {
        const avgDuration = res.timings.duration;
        if (avgDuration < 500) {
          recoveryTime.add(elapsed);
          console.log(`[RECOVERY] System recovered within window. Current response time: ${avgDuration}ms, requests in last 30s: ${iterationTimestamps.length}`);
        }
      }
    }
  });

  sleep(Math.random() * 1.5 + 0.3);
}
