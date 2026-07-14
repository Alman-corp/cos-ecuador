import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const totalRequests = new Counter('total_requests');

const IVA_WEIGHT = 40;
const RENTA_WEIGHT = 20;
const RETENCIONES_WEIGHT = 15;
const HEALTH_WEIGHT = 10;
const ATS_WEIGHT = 10;
const SRI_WEIGHT = 5;
const TOTAL_WEIGHT = IVA_WEIGHT + RENTA_WEIGHT + RETENCIONES_WEIGHT + HEALTH_WEIGHT + ATS_WEIGHT + SRI_WEIGHT;

export const options = {
  vus: 20,
  duration: '5m',
  thresholds: {
    http_req_duration: ['p(95) < 3000'],
    http_req_failed: ['rate < 0.02'],
    errors: ['rate < 0.02'],
  },
  tags: {
    test: 'mixed-workload',
    environment: __ENV.ENV || 'local',
  },
};

function pickEndpoint() {
  const roll = Math.random() * TOTAL_WEIGHT;
  if (roll < IVA_WEIGHT) return 'iva';
  if (roll < IVA_WEIGHT + RENTA_WEIGHT) return 'renta';
  if (roll < IVA_WEIGHT + RENTA_WEIGHT + RETENCIONES_WEIGHT) return 'retenciones';
  if (roll < IVA_WEIGHT + RENTA_WEIGHT + RETENCIONES_WEIGHT + HEALTH_WEIGHT) return 'health';
  if (roll < IVA_WEIGHT + RENTA_WEIGHT + RETENCIONES_WEIGHT + HEALTH_WEIGHT + ATS_WEIGHT) return 'ats';
  return 'sri';
}

function generateIVAPayload() {
  return {
    baseImponible: Math.round((Math.random() * 10000 + 100) * 100) / 100,
    ivaPercent: Math.random() > 0.3 ? 15 : 0,
    retencionFuente: Math.random() > 0.6 ? (Math.random() > 0.5 ? 100 : 30) : 0,
    tipoComprobante: Math.random() > 0.5 ? 'factura' : 'liquidacion',
    numeroComprobante: `001-001-${String(Math.floor(Math.random() * 99999999)).padStart(8, '0')}`,
    fechaEmision: new Date().toISOString().split('T')[0],
    subtotal: Math.round((Math.random() * 9000 + 100) * 100) / 100,
  };
}

function generateRentaPayload() {
  return {
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
  };
}

function generateRetencionesPayload() {
  return {
    tipoRetencion: Math.random() > 0.5 ? 'fuente' : 'iva',
    baseImponible: Math.round((Math.random() * 5000 + 100) * 100) / 100,
    porcentaje: Math.random() > 0.5 ? 2 : 1,
    sujetoPasivo: `RUC-${Math.floor(Math.random() * 9999999999)}`,
    concepto: 'Servicios profesionales',
  };
}

function generateATSPayload() {
  const numTransactions = Math.floor(Math.random() * 50) + 10;
  const transacciones = Array.from({ length: numTransactions }, (_, i) => ({
    tipoComprobante: Math.random() > 0.5 ? 'factura' : 'nota_credito',
    numeroComprobante: `001-001-${String(i + 1).padStart(8, '0')}`,
    baseImponible: Math.round((Math.random() * 1000 + 10) * 100) / 100,
    iva: Math.round((Math.random() * 150) * 100) / 100,
    retencion: Math.round((Math.random() * 50) * 100) / 100,
  }));

  return {
    periodo: `${2026}${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
    tipoRegistro: 'mensual',
    transacciones: transacciones,
  };
}

function callEndpoint(type) {
  const requestId = `k6-mixed-${Date.now()}-${__VU}-${__ITER}`;

  switch (type) {
    case 'iva': {
      const payload = generateIVAPayload();
      const res = http.post(`${BASE_URL}/api/v1/tax/iva/calculate`, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
        tags: { endpoint: 'iva_calculate', type: 'mixed' },
        timeout: '30s',
      });
      return check(res, {
        'IVA status 200': (r) => r.status === 200,
        'IVA response time < 3000ms': (r) => r.timings.duration < 3000,
      });
    }

    case 'renta': {
      const payload = generateRentaPayload();
      const res = http.post(`${BASE_URL}/api/v1/tax/renta/calculate`, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
        tags: { endpoint: 'renta_calculate', type: 'mixed' },
        timeout: '30s',
      });
      return check(res, {
        'Renta status 200': (r) => r.status === 200,
        'Renta response time < 3000ms': (r) => r.timings.duration < 3000,
      });
    }

    case 'retenciones': {
      const payload = generateRetencionesPayload();
      const res = http.post(`${BASE_URL}/api/v1/tax/retenciones/calculate`, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
        tags: { endpoint: 'retenciones_calculate', type: 'mixed' },
        timeout: '30s',
      });
      return check(res, {
        'Retenciones status 200': (r) => r.status === 200,
        'Retenciones response time < 3000ms': (r) => r.timings.duration < 3000,
      });
    }

    case 'health': {
      const res = http.get(`${BASE_URL}/health`, {
        tags: { endpoint: 'health', type: 'mixed' },
        timeout: '10s',
      });
      return check(res, {
        'Health status 200': (r) => r.status === 200,
        'Health response time < 500ms': (r) => r.timings.duration < 500,
      });
    }

    case 'ats': {
      const payload = generateATSPayload();
      const res = http.post(`${BASE_URL}/api/v1/tax/ats/generate`, JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
        tags: { endpoint: 'ats_generate', type: 'mixed' },
        timeout: '60s',
      });
      return check(res, {
        'ATS status 200': (r) => r.status === 200,
        'ATS response time < 3000ms': (r) => r.timings.duration < 3000,
      });
    }

    case 'sri': {
      const res = http.get(`${BASE_URL}/api/v1/sri/contributors/RUC-${Math.floor(Math.random() * 9999999999)}`, {
        tags: { endpoint: 'sri_query', type: 'mixed' },
        timeout: '30s',
      });
      return check(res, {
        'SRI query status 200': (r) => r.status === 200,
        'SRI response time < 3000ms': (r) => r.timings.duration < 3000,
      });
    }
  }
}

export default function () {
  group('Mixed Workload', function () {
    const endpointType = pickEndpoint();
    totalRequests.add(1);

    const success = callEndpoint(endpointType);

    if (!success) {
      errorRate.add(1);
      console.warn(`[WARN] Mixed workload request failed: endpoint=${endpointType}, vu=${__VU}, iter=${__ITER}`);
    } else {
      errorRate.add(0);
    }
  });

  sleep(Math.random() * 2 + 1);
}
