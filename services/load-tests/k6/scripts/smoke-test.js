import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95) < 500'],
    http_req_failed: ['rate < 0.01'],
    errors: ['rate < 0.01'],
  },
  tags: {
    test: 'smoke',
    environment: __ENV.ENV || 'local',
  },
};

const endpoints = [
  { method: 'GET', url: '/health', name: 'health' },
  { method: 'GET', url: '/api/v1/tax/iva/rates', name: 'iva_rates' },
  { method: 'GET', url: '/api/v1/tax/retenciones/rates', name: 'retenciones_rates' },
  { method: 'GET', url: '/api/v1/tax/renta/parameters', name: 'renta_parameters' },
  { method: 'GET', url: '/api/v1/tax/ats/status', name: 'ats_status' },
  { method: 'GET', url: '/api/v1/sri/status', name: 'sri_status' },
];

export default function () {
  group('Endpoint Smoke Tests', function () {
    for (const ep of endpoints) {
      const url = `${BASE_URL}${ep.url}`;
      const params = {
        tags: { endpoint: ep.name, type: 'smoke' },
        timeout: '10s',
      };

      const res = http.request(ep.method, url, null, params);

      const success = check(res, {
        [`${ep.name} status is 200`]: (r) => r.status === 200,
        [`${ep.name} response time < 500ms`]: (r) => r.timings.duration < 500,
      });

      errorRate.add(!success);
      responseTime.add(res.timings.duration);

      if (!success) {
        console.warn(`[WARN] ${ep.name} failed: status=${res.status}, duration=${res.timings.duration}ms`);
      }

      sleep(1);
    }
  });
}
