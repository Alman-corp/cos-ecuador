import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

const errorRate = new Rate('errors');
const rentaCalculationTime = new Trend('renta_calculation_time');
const proyeccionTime = new Trend('proyeccion_time');
const totalRequests = new Counter('total_requests');

export const options = {
  stages: [
    { target: 5, duration: '1m' },
    { target: 30, duration: '2m' },
    { target: 30, duration: '2m' },
    { target: 0, duration: '1m' },
  ],
  thresholds: {
    http_req_duration: ['p(95) < 3000'],
    http_req_failed: ['rate < 0.02'],
    errors: ['rate < 0.02'],
    renta_calculation_time: ['p(95) < 3000'],
    proyeccion_time: ['p(95) < 3000'],
  },
  tags: {
    test: 'renta-calculation',
    environment: __ENV.ENV || 'local',
  },
};

const TIPOS_CONTRIBUYENTE = ['persona_natural', 'persona_juridica', 'sociedad'];
const ACTIVIDADES = ['comercio', 'servicios', 'manufactura', 'agricultura', 'construccion', 'transporte', 'educacion', 'salud'];

function generateRentaPayload() {
  const ingresosMensuales = Math.random() * 20000 + 500;
  const gastosMensuales = ingresosMensuales * (Math.random() * 0.6 + 0.2);

  const ingresos = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    valor: Math.round((ingresosMensuales * (1 + (Math.random() - 0.5) * 0.2)) * 100) / 100,
    tipo: 'ingresos_ordinarios',
    detalle: `Ingresos mes ${i + 1}`,
  }));

  const gastos = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    valor: Math.round((gastosMensuales * (1 + (Math.random() - 0.5) * 0.2)) * 100) / 100,
    tipo: Math.random() > 0.6 ? 'gastos_administrativos' : 'costos_directos',
    detalle: `Gastos mes ${i + 1}`,
  }));

  const tieneDeducciones = Math.random() > 0.3;
  const deducciones = tieneDeducciones ? [
    {
      tipo: 'vivienda',
      valor: Math.round(Math.random() * 5000 * 100) / 100,
      descripcion: 'Intereses hipotecarios',
    },
    {
      tipo: 'educacion',
      valor: Math.round(Math.random() * 3000 * 100) / 100,
      descripcion: 'Gastos educativos',
    },
    {
      tipo: 'salud',
      valor: Math.round(Math.random() * 2000 * 100) / 100,
      descripcion: 'Gastos salud',
    },
  ] : [];

  return {
    tipoContribuyente: TIPOS_CONTRIBUYENTE[Math.floor(Math.random() * TIPOS_CONTRIBUYENTE.length)],
    actividadEconomica: ACTIVIDADES[Math.floor(Math.random() * ACTIVIDADES.length)],
    periodoFiscal: 2026,
    ingresos: ingresos,
    gastos: gastos,
    deduccionesPersonales: deducciones,
    tieneDeclaracionAnterior: Math.random() > 0.5,
    ingresosAnioAnterior: Math.round(ingresosMensuales * 12 * (Math.random() * 0.3 + 0.8) * 100) / 100,
    impuestoRetenidoAnterior: Math.round(Math.random() * 3000 * 100) / 100,
    proyeccionMeses: Math.floor(Math.random() * 6) + 6,
  };
}

export default function () {
  const payload = generateRentaPayload();
  const requestId = `k6-renta-${Date.now()}-${__VU}-${__ITER}`;

  group('Renta Calculation', function () {
    const calcUrl = `${BASE_URL}/api/v1/tax/renta/calculate`;
    const calcParams = {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId,
      },
      tags: { endpoint: 'renta_calculate', type: 'load' },
      timeout: '30s',
    };

    const calcRes = http.post(calcUrl, JSON.stringify(payload), calcParams);

    totalRequests.add(1);
    rentaCalculationTime.add(calcRes.timings.duration);

    const calcSuccess = check(calcRes, {
      'Renta calculation status is 200': (r) => r.status === 200,
      'Renta calculation response time < 3000ms': (r) => r.timings.duration < 3000,
    });

    if (!calcSuccess) {
      errorRate.add(1);
      console.warn(`[WARN] Renta calc failed: status=${calcRes.status}, duration=${calcRes.timings.duration}ms, vu=${__VU}, iter=${__ITER}`);
    } else {
      errorRate.add(0);
      try {
        const body = JSON.parse(calcRes.body);
        if (body.impuestoCalculado !== undefined) {
          check(body, {
            'Calculated tax is non-negative': (b) => b.impuestoCalculado >= 0,
          });
        }
      } catch (e) {
        console.warn(`[WARN] Could not parse renta response: ${e.message}`);
      }
    }

    sleep(Math.random() * 2 + 1);
  });

  group('Renta Proyeccion', function () {
    const proyUrl = `${BASE_URL}/api/v1/tax/renta/proyeccion`;
    const proyParams = {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': `${requestId}-proy`,
      },
      tags: { endpoint: 'renta_proyeccion', type: 'load' },
      timeout: '30s',
    };

    const proyPayload = {
      ingresosMensuales: payload.ingresos.reduce((s, i) => s + i.valor, 0) / 12,
      gastosMensuales: payload.gastos.reduce((s, g) => s + g.valor, 0) / 12,
      mesesProyeccion: payload.proyeccionMeses,
      tipoContribuyente: payload.tipoContribuyente,
      actividadEconomica: payload.actividadEconomica,
      periodoFiscal: payload.periodoFiscal,
    };

    const proyRes = http.post(proyUrl, JSON.stringify(proyPayload), proyParams);

    totalRequests.add(1);
    proyeccionTime.add(proyRes.timings.duration);

    const proySuccess = check(proyRes, {
      'Proyeccion status is 200': (r) => r.status === 200,
      'Proyeccion response time < 3000ms': (r) => r.timings.duration < 3000,
    });

    if (!proySuccess) {
      errorRate.add(1);
      console.warn(`[WARN] Proyeccion failed: status=${proyRes.status}, duration=${proyRes.timings.duration}ms`);
    }

    sleep(Math.random() * 2 + 1);
  });
}
