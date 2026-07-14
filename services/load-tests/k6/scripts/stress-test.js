import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Gauge, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const errorRate = new Rate('errors');
const calculationTime = new Trend('calculation_time');
const requestRate = new Rate('request_rate');
const inflectionPoint = new Gauge('inflection_point_seconds');
const totalRequests = new Counter('total_requests');
const failedRequests = new Counter('failed_requests');

export const options = {
  stages: [
    { target: 50, duration: '1m' },
    { target: 100, duration: '1m' },
    { target: 150, duration: '1m30s' },
    { target: 200, duration: '1m30s' },
    { target: 200, duration: '10m' },
    { target: 100, duration: '1m' },
    { target: 0, duration: '1m' },
  ],
  thresholds: {
    http_req_duration: ['p(99) < 10000', 'avg < 3000'],
    http_req_failed: ['rate < 0.05'],
    errors: ['rate < 0.05'],
    calculation_time: ['p(99) < 10000'],
  },
  tags: {
    test: 'stress',
    environment: __ENV.ENV || 'local',
  },
};

let stageStartTime = 0;
let previousAvgDuration = 0;
let breakingPointDetected = false;

function generateIVAPayload() {
  const baseImponible = Math.random() * 10000 + 100;
  return {
    baseImponible: Math.round(baseImponible * 100) / 100,
    ivaPercent: Math.random() > 0.3 ? 15 : 0,
    retencionFuente: Math.random() > 0.6 ? (Math.random() > 0.5 ? 100 : 30) : 0,
    retencionIva: Math.random() > 0.7 ? (Math.random() > 0.5 ? 30 : 10) : 0,
    tipoComprobante: Math.random() > 0.5 ? 'factura' : 'liquidacion',
    numeroComprobante: `001-001-${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}`,
    fechaEmision: new Date().toISOString().split('T')[0],
    subtotal: Math.round((Math.random() * 9000 + 100) * 100) / 100,
    descuento: Math.round(Math.random() * 500 * 100) / 100,
    moneda: 'USD',
  };
}

export default function () {
  const elapsed = __ITER === 0 ? 0 : (Date.now() - stageStartTime) / 1000;

  group('Stress Test - IVA Calculation', function () {
    const payload = generateIVAPayload();
    const url = `${BASE_URL}/api/v1/tax/iva/calculate`;

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': `k6-stress-${Date.now()}-${__VU}-${__ITER}`,
      },
      tags: { endpoint: 'iva_calculate', type: 'stress' },
      timeout: '60s',
    };

    const res = http.post(url, JSON.stringify(payload), params);

    totalRequests.add(1);
    calculationTime.add(res.timings.duration);

    const success = check(res, {
      'Stress test status is 200': (r) => r.status === 200,
      'Stress test response time < 10000ms': (r) => r.timings.duration < 10000,
    });

    if (!success) {
      errorRate.add(1);
      failedRequests.add(1);
      console.warn(`[WARN] Stress test failure: status=${res.status}, duration=${res.timings.duration}ms, vu=${__VU}`);
    } else {
      errorRate.add(0);
      try {
        const body = JSON.parse(res.body);
        if (body.ivaCalculado !== undefined) {
          check(body, {
            'Stress test IVA is valid': (b) => b.ivaCalculado >= 0,
          });
        }
      } catch (e) {
        console.warn(`[WARN] Failed to parse stress response: ${e.message}`);
      }
    }

    const currentAvgDuration = res.timings.duration;
    if (previousAvgDuration > 0 && !breakingPointDetected) {
      const ratio = currentAvgDuration / previousAvgDuration;
      if (ratio > 2.0 && currentAvgDuration > 2000) {
        breakingPointDetected = true;
        inflectionPoint.add(elapsed);
        console.warn(`[BREAKING] System degradation detected at ~${Math.floor(elapsed)}s into test. Response time jumped ${ratio.toFixed(2)}x (${Math.floor(previousAvgDuration)}ms -> ${Math.floor(currentAvgDuration)}ms)`);
      }
    }
    previousAvgDuration = currentAvgDuration;
  });

  const thinkTime = Math.random() * 1 + 0.2;
  sleep(thinkTime);
}

export function teardown() {
  if (breakingPointDetected) {
    console.log(`[RESULT] Breaking point was detected during the stress test. Check inflection_point_seconds metric.`);
  } else {
    console.log(`[RESULT] No breaking point detected within tested load. System handled up to 200 concurrent VUs.`);
  }
  console.log(`[RESULT] Total requests sent: ${totalRequests.name}`);
}
