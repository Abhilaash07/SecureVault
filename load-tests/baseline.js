// load-tests/baseline.js
/**
 * SecureVault k6 Baseline / Load Test Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Scenario : 300 virtual users (VUs) running for 60 seconds
 * Target   : SecureVault web app (or its backend endpoints)
 *
 * Metrics collected:
 *   - Requests per second (RPS)
 *   - Response time: Avg, Min, Max, P50, P90, P95, P99
 *   - HTTP error rate
 *   - Throughput (bytes/s)
 *
 * Usage:
 *   k6 run --out json=results.json baseline.js
 *   (or via: node run-load-test.js)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ── Custom Metrics ─────────────────────────────────────────────────────────
const errorRate = new Rate('error_rate');
const loginSuccess = new Counter('login_success_count');
const pageLoadTime = new Trend('page_load_time', true);

// ── Test Configuration ─────────────────────────────────────────────────────
export const options = {
  scenarios: {
    baseline_load: {
      executor: 'constant-vus',
      vus: 300,
      duration: '1m',
      gracefulStop: '10s',
    },
    ramp_up_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 100 },
        { duration: '30s', target: 300 },
        { duration: '15s', target: 0 },
      ],
      gracefulStop: '10s',
      startTime: '70s', // after baseline
    },
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s',  target: 500 },
        { duration: '10s', target: 500 },
        { duration: '5s',  target: 0 },
      ],
      gracefulStop: '5s',
      startTime: '140s', // after stress
    },
  },
  thresholds: {
    // 95% of all requests must finish below 2000ms
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    // Error rate must be below 5%
    error_rate: ['rate<0.05'],
    // At least 95% of requests must succeed
    http_req_failed: ['rate<0.05'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

// ── Base URL ───────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';

// ── Helpers ────────────────────────────────────────────────────────────────
function randomEmail() {
  return `loadtest_${Math.floor(Math.random() * 100000)}@test.com`;
}

// ── Main VU function ───────────────────────────────────────────────────────
export default function () {
  const vuId = __VU;
  const iterationId = __ITER;

  // ── 1. Load the main page (Home / Login) ──────────────────────────────
  const startTime = Date.now();
  const pageRes = http.get(`${BASE_URL}/`, {
    tags: { name: 'GET /' },
    headers: { 'Accept': 'text/html,application/xhtml+xml' },
  });
  pageLoadTime.add(Date.now() - startTime);

  check(pageRes, {
    'Home page status is 200': (r) => r.status === 200,
    'Home page has content':   (r) => r.body && r.body.length > 100,
    'Response time < 2000ms':  (r) => r.timings.duration < 2000,
  });

  errorRate.add(pageRes.status !== 200);

  sleep(0.2);

  // ── 2. Simulate login POST (if API exists) ─────────────────────────────
  const loginPayload = JSON.stringify({
    email: vuId % 10 === 0 ? 'demo@securevault.com' : randomEmail(),
    password: vuId % 10 === 0 ? 'demo123' : 'testpassword',
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    tags: { name: 'POST /api/auth/login' },
    headers: { 'Content-Type': 'application/json' },
  });

  const loginOk = check(loginRes, {
    'Login endpoint reachable': (r) => r.status < 500,
    'Login response < 3000ms': (r) => r.timings.duration < 3000,
  });

  if (loginOk && loginRes.status === 200) {
    loginSuccess.add(1);
  }
  errorRate.add(loginRes.status >= 500);

  sleep(0.3);

  // ── 3. Load static assets ──────────────────────────────────────────────
  const staticRes = http.get(`${BASE_URL}/static/js/main.js`, {
    tags: { name: 'GET /static/js/main.js' },
  });
  check(staticRes, {
    'Static asset reachable': (r) => r.status < 500,
  });

  sleep(0.2);

  // ── 4. Simulate vault file list API ───────────────────────────────────
  const vaultRes = http.get(`${BASE_URL}/api/vault/files`, {
    tags: { name: 'GET /api/vault/files' },
    headers: {
      'Authorization': 'Bearer demo_token',
      'Content-Type': 'application/json',
    },
  });
  check(vaultRes, {
    'Vault API reachable': (r) => r.status < 500,
    'Vault response < 2000ms': (r) => r.timings.duration < 2000,
  });
  errorRate.add(vaultRes.status >= 500);

  sleep(0.5);

  // ── 5. Simulate encrypt request ────────────────────────────────────────
  const encryptPayload = JSON.stringify({
    filename: `test_file_${vuId}_${iterationId}.pdf`,
    algorithm: 'ChaCha20-SHA512',
    passwordHash: 'sha512hashvalue',
  });

  const encRes = http.post(`${BASE_URL}/api/encrypt`, encryptPayload, {
    tags: { name: 'POST /api/encrypt' },
    headers: { 'Content-Type': 'application/json' },
  });
  check(encRes, {
    'Encrypt endpoint reachable': (r) => r.status < 500,
    'Encrypt response < 5000ms': (r) => r.timings.duration < 5000,
  });

  sleep(0.5);

  // ── 6. Simulate decrypt request ────────────────────────────────────────
  const decRes = http.post(`${BASE_URL}/api/decrypt`, JSON.stringify({
    filename: 'test_file.pdf.enc',
    passwordHash: 'sha512hashvalue',
  }), {
    tags: { name: 'POST /api/decrypt' },
    headers: { 'Content-Type': 'application/json' },
  });
  check(decRes, {
    'Decrypt endpoint reachable': (r) => r.status < 500,
    'Decrypt response < 5000ms': (r) => r.timings.duration < 5000,
  });

  sleep(0.3);

  // ── 7. Load settings page ──────────────────────────────────────────────
  const settingsRes = http.get(`${BASE_URL}/settings`, {
    tags: { name: 'GET /settings' },
  });
  check(settingsRes, {
    'Settings page reachable': (r) => r.status < 500,
  });

  sleep(0.2);
}

// ── Summary handler ────────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: false }),
    'results.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, opts) {
  const m = data.metrics;
  const dur = m.http_req_duration || {};
  const rps = m.http_reqs ? (m.http_reqs.values.count / (data.state.testRunDurationMs / 1000)).toFixed(1) : 'N/A';

  return `
╔══════════════════════════════════════════════════════════════════╗
║          SecureVault – Load Test Summary Report                  ║
╠══════════════════════════════════════════════════════════════════╣
║  Scenario     : Baseline (300 VUs × 60s)                        ║
║  Total Requests: ${String(m.http_reqs?.values?.count || 0).padEnd(10)}                             ║
║  Requests/sec : ${String(rps).padEnd(10)}                             ║
╠══════════════════════════════════════════════════════════════════╣
║  Response Time (http_req_duration):                              ║
║    Avg     : ${String((dur.values?.avg || 0).toFixed(1) + 'ms').padEnd(12)}                         ║
║    Min     : ${String((dur.values?.min || 0).toFixed(1) + 'ms').padEnd(12)}                         ║
║    Max     : ${String((dur.values?.max || 0).toFixed(1) + 'ms').padEnd(12)}                         ║
║    Median  : ${String((dur.values?.['p(50)'] || 0).toFixed(1) + 'ms').padEnd(12)}                   ║
║    P90     : ${String((dur.values?.['p(90)'] || 0).toFixed(1) + 'ms').padEnd(12)}                   ║
║    P95     : ${String((dur.values?.['p(95)'] || 0).toFixed(1) + 'ms').padEnd(12)}                   ║
║    P99     : ${String((dur.values?.['p(99)'] || 0).toFixed(1) + 'ms').padEnd(12)}                   ║
╠══════════════════════════════════════════════════════════════════╣
║  Error Rate   : ${String(((m.error_rate?.values?.rate || 0) * 100).toFixed(2) + '%').padEnd(10)}    ║
║  Failed Reqs  : ${String(m.http_req_failed?.values?.passes || 0).padEnd(10)}                        ║
╚══════════════════════════════════════════════════════════════════╝
`;
}
