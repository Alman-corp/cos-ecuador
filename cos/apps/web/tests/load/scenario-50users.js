import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const analysisDuration = new Trend('analysis_duration');

const COMPANIES = [
  { name: 'ACME Manufacturing', taxId: 'EC-1791234567001' },
  { name: 'TechNova Solutions', taxId: 'MX-TNS200125'},
  { name: 'AgroIndustrial del Valle', taxId: 'CO-890123456' },
  { name: 'Constructora Horizonte', taxId: 'PE-20123456789' },
  { name: 'RetailGroup Iberia', taxId: 'ES-B12345678' },
];

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 25 },
    { duration: '3m', target: 50 },
    { duration: '2m', target: 25 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    errors: ['rate<0.1'],
  },
};

export default function () {
  group('Due Diligence Flow', () => {
    const company = COMPANIES[Math.floor(Math.random() * COMPANIES.length)];

    group('Start Analysis', () => {
      const payload = JSON.stringify({
        companyName: company.name,
        taxId: company.taxId,
        industry: 'General',
      });

      const res = http.post(`${BASE_URL}/api/due-diligence/start`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      check(res, {
        'analysis started (200/201)': (r) => r.status === 200 || r.status === 201,
        'has jobId': (r) => {
          try { return JSON.parse(r.body).jobId !== undefined; }
          catch { return false; }
        },
      });

      errorRate.add(res.status !== 200 && res.status !== 201);
    });

    group('List Companies', () => {
      const res = http.get(`${BASE_URL}/api/due-diligence/companies`);
      check(res, { 'companies listed (200)': (r) => r.status === 200 });
    });

    group('Get Jobs', () => {
      const res = http.get(`${BASE_URL}/api/due-diligence/jobs`);
      check(res, { 'jobs listed (200)': (r) => r.status === 200 });
    });

    group('Health Check', () => {
      const res = http.get(`${BASE_URL}/api/health`);
      check(res, { 'health ok (200)': (r) => r.status === 200 });
    });
  });

  sleep(1);
}
