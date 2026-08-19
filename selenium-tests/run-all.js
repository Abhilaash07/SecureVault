// selenium-tests/run-all.js
'use strict';

/**
 * SecureVault Selenium E2E Test Runner
 * Runs all 10 test suites, collects results, and generates an Excel report.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { generateReport } = require('./utils/reportGenerator');
const config = require('./config/test.config');

const REPORT_DIR = path.join(__dirname, 'reports');
const EXCEL_FILE = config.EXCEL_FILENAME;

const TEST_FILES = [
  { file: 'tests/01_auth.test.js',       suiteName: 'Authentication Tests',          category: 'Functional + Validation + Security', screen: 'Login + SignUp Screen' },
  { file: 'tests/02_home.test.js',       suiteName: 'Home Dashboard Tests',           category: 'UI/UX + Functional',                  screen: 'Home Dashboard' },
  { file: 'tests/03_encrypt.test.js',    suiteName: 'Encrypt Screen Tests',           category: 'Functional + Unit + Validation',       screen: 'Encrypt Screen' },
  { file: 'tests/04_decrypt.test.js',    suiteName: 'Decrypt Screen Tests',           category: 'Functional + Unit + Security',         screen: 'Decrypt Screen' },
  { file: 'tests/05_vault.test.js',      suiteName: 'Vault Screen Tests',             category: 'Functional + UI/UX',                  screen: 'Vault Screen' },
  { file: 'tests/06_settings.test.js',   suiteName: 'Settings Screen Tests',          category: 'Functional + Security + Validation',   screen: 'Settings Screen' },
  { file: 'tests/07_security.test.js',   suiteName: 'Security Tests',                 category: 'Security Testing',                     screen: 'Login + Settings + Global' },
  { file: 'tests/08_ui_ux.test.js',      suiteName: 'UI/UX Tests',                    category: 'UI/UX Testing',                        screen: 'All Screens' },
  { file: 'tests/09_validation.test.js', suiteName: 'Validation Tests',               category: 'Validation Testing',                   screen: 'All Forms' },
  { file: 'tests/10_functional.test.js', suiteName: 'Functional & Deployment Tests',  category: 'Functional + Deployment',              screen: 'All Screens' },
];

/**
 * Run a single mocha test file and capture JSON output.
 * Returns { suiteName, category, screen, tests[] }
 */
function runSuite(suiteInfo) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const results = {
      suiteName: suiteInfo.suiteName,
      category: suiteInfo.category,
      screen: suiteInfo.screen,
      tests: [],
    };

    console.log(`\n${'─'.repeat(70)}`);
    console.log(`▶  Running: ${suiteInfo.suiteName}`);
    console.log(`   File   : ${suiteInfo.file}`);
    console.log(`${'─'.repeat(70)}`);

    const args = [
      'node_modules/.bin/mocha',
      suiteInfo.file,
      '--timeout', '60000',
      '--reporter', 'json',
      '--no-colors',
    ];

    const proc = spawn(process.execPath, args, {
      cwd: __dirname,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', () => {
      try {
        // Mocha JSON reporter outputs valid JSON to stdout
        const jsonStart = stdout.indexOf('{');
        if (jsonStart !== -1) {
          const jsonStr = stdout.substring(jsonStart);
          const report = JSON.parse(jsonStr);
          const allTests = [...(report.passes || []), ...(report.failures || []), ...(report.pending || [])];

          allTests.forEach((t) => {
            const isPending = (report.pending || []).some((p) => p.fullTitle === t.fullTitle);
            const isFail = (report.failures || []).some((f) => f.fullTitle === t.fullTitle);
            results.tests.push({
              name: t.fullTitle || t.title,
              status: isPending ? 'SKIP' : isFail ? 'FAIL' : 'PASS',
              duration: t.duration || 0,
              error: t.err ? (t.err.message || JSON.stringify(t.err)) : '',
              timestamp: new Date().toISOString(),
            });
          });
        } else {
          // Fallback: mark all as SKIP if JSON not captured
          results.tests.push({
            name: `${suiteInfo.suiteName} – Parse Error`,
            status: 'FAIL',
            duration: Date.now() - startTime,
            error: 'Could not parse mocha JSON output. Run with --reporter spec for details.',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        results.tests.push({
          name: `${suiteInfo.suiteName} – JSON Parse Failed`,
          status: 'FAIL',
          duration: Date.now() - startTime,
          error: e.message,
          timestamp: new Date().toISOString(),
        });
      }

      const passed = results.tests.filter((t) => t.status === 'PASS').length;
      const failed = results.tests.filter((t) => t.status === 'FAIL').length;
      console.log(`   ✅ Passed: ${passed}  ❌ Failed: ${failed}  Total: ${results.tests.length}`);
      resolve(results);
    });
  });
}

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('  🔐 SecureVault Selenium E2E Test Suite');
  console.log('  Target: ' + config.BASE_URL);
  console.log('  Started: ' + new Date().toLocaleString());
  console.log('═'.repeat(70));

  const allResults = [];

  for (const suite of TEST_FILES) {
    const result = await runSuite(suite);
    allResults.push(result);
  }

  // Summary stats
  const grandTotal = allResults.reduce((s, r) => s + r.tests.length, 0);
  const grandPassed = allResults.reduce((s, r) => s + r.tests.filter((t) => t.status === 'PASS').length, 0);
  const grandFailed = allResults.reduce((s, r) => s + r.tests.filter((t) => t.status === 'FAIL').length, 0);
  const grandSkipped = allResults.reduce((s, r) => s + r.tests.filter((t) => t.status === 'SKIP').length, 0);

  console.log('\n' + '═'.repeat(70));
  console.log('  📊 FINAL SUMMARY');
  console.log('═'.repeat(70));
  console.log(`  Total Tests  : ${grandTotal}`);
  console.log(`  ✅ Passed    : ${grandPassed}`);
  console.log(`  ❌ Failed    : ${grandFailed}`);
  console.log(`  ⏭  Skipped   : ${grandSkipped}`);
  console.log(`  Pass Rate    : ${grandTotal > 0 ? ((grandPassed / grandTotal) * 100).toFixed(1) : 0}%`);
  console.log('═'.repeat(70));

  // Generate Excel report
  console.log('\n📄 Generating Excel report...');
  const reportPath = await generateReport(allResults, REPORT_DIR, EXCEL_FILE);

  console.log('\n🎉 Done! Report saved to:');
  console.log('   ' + reportPath);
  console.log('\nTo open: start ' + reportPath);

  process.exit(grandFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
