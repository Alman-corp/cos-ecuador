import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const totalRequests = new Counter('total_requests');

const endpoints = [
  {
    name: 'iva_calculate',
    method: 'POST',
    path: '/api/v1/tax/iva/calculate',
    payload: () => ({
      baseImponible: Math.round((Math.random() * 10000 + 100) * 100) / 100,
      ivaPercent: Math.random() > 0.3 ? 15 : 0,
      retencionFuente: Math.random() > 0.6 ? 100 : 0,
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
      ingresos: Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1, valor: Math.round((Math.random() * 15000 + 500) * 100) / 100,
      })),
      gastos: Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1, valor: Math.round((Math.random() * 8000 + 200) * 100) / 100,
      })),
      deduccionesPersonales: [
        { tipo: 'vivienda', valor: Math.round(Math.random() * 5000 * 100) / 100 },
        { tipo: 'educacion', valor: Math.round(Math.random() * 3000 * 100) / 100 },
      ],
    }),
  },
  {
    name: 'retenciones_calculate',
    method: 'POST',
    path: '/api/v1/tax/retenciones/calculate',
    payload: () => ({
      tipoRetencion: Math.random() > 0.5 ? 'fuente' : 'iva',
      baseImponible: Math.round((Math.random() * 5000 + 100) * 100) / 100,
      porcentaje: Math.random() > 0.5 ? 2 : 1,
      sujetoPasivo: `RUC-${Math.floor(Math.random() * 9999999999)}`,
      concepto: 'Servicios profesionales',
    }),
  },
  {
    name: 'ats_generate',
    method: 'POST',
    path: '/api/v1/tax/ats/generate',
    payload: () => ({
      periodo: `${2026}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
      tipoRegistro: 'mensual',
      transacciones: Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, i) => ({
        tipoComprobante: 'factura',
        numeroComprobante: `001-001-${String(i + 1).padStart(8, '0')}`,
        baseImponible: Math.round((Math.random() * 1000 + 10) * 100) / 100,
        iva: Math.round((Math.random() * 150) * 100) / 100,
        retencion: Math.round((Math.random() * 50) * 100) / 100,
      })),
    }),
  },
  {
    name: 'health',
    method: 'GET',
    path: '/health',
    payload: null,
  },
];

export const options = {
  vus: 30,
  duration: '30m',
  thresholds: {
    http_req_duration: ['p(95) < 4000', 'avg < 2000'],
    http_req_failed: ['rate < 0.01'],
    errors: ['rate < 0.01'],
    response_time: ['p(95) < 4000'],
    'response_time{endpoint:iva_calculate}': ['p(95) < 4000'],
    'response_time{endpoint:renta_calculate}': ['p(95) < 4000'],
    'response_time{endpoint:retenciones_calculate}': ['p(95) < 4000'],
    'response_time{endpoint:ats_generate}': ['p(95) < 5000'],
  },
  tags: {
    test: 'soak',
    environment: __ENV.ENV || 'local',
  },
};

export default function () {
  group('Soak Test - Rotating Endpoints', function () {
    const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
    const url = `${BASE_URL}${ep.path}`;
    const requestId = `k6-soak-${Date.now()}-${__VU}-${__ITER}`;

    const params = {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
      tags: { endpoint: ep.name, type: 'soak' },
      timeout: '30s',
    };

    let res;
    if (ep.method === 'GET') {
      res = http.get(url, params);
    } else {
      const payload = ep.payload();
      res = http.post(url, JSON.stringify(payload), params);
    }

    totalRequests.add(1);
    responseTime.add(res.timings.duration);

    const success = check(res, {
      [`${ep.name} status is 200`]: (r) => r.status === 200,
      [`${ep.name} response time < 4000ms`]: (r) => r.timings.duration < 4000,
    });

    if (!success) {
      errorRate.add(1);
      console.warn(`[WARN] Soak test ${ep.name} failed: status=${res.status}, duration=${res.timings.duration}ms at ${new Date().toISOString()}`);
    } else {
      errorRate.add(0);
    }
  });

  sleep(Math.random() * 3 + 1);
}
