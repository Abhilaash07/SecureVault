// frontend/appium-tests/run-all.js
'use strict';

/**
 * SecureVault Appium Mobile E2E Test Runner
 * Runs all 10 test suites (310 cases) and generates an Excel report.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { generateReport } = require('./utils/reportGenerator');
const config = require('./config/appium.config');

const REPORT_DIR = path.join(__dirname, 'reports');
const EXCEL_FILE = config.EXCEL_FILENAME;

const TEST_FILES = [
  { file: 'tests/01_launch.test.js',          suiteName: 'App Launch Tests',                 category: 'Functional Testing',              screen: 'Splash / Launch Screen' },
  { file: 'tests/02_auth_mobile.test.js',      suiteName: 'Mobile Authentication Tests',      category: 'Functional + Security',            screen: 'Login + SignUp Screen' },
  { file: 'tests/03_home_mobile.test.js',      suiteName: 'Mobile Home Dashboard Tests',      category: 'UI/UX + Functional',               screen: 'Home Dashboard' },
  { file: 'tests/04_encrypt_mobile.test.js',   suiteName: 'Mobile Encrypt Tests',             category: 'Functional + Unit',               screen: 'Encrypt Screen' },
  { file: 'tests/05_decrypt_mobile.test.js',   suiteName: 'Mobile Decrypt Tests',             category: 'Functional + Unit',               screen: 'Decrypt Screen' },
  { file: 'tests/06_vault_mobile.test.js',     suiteName: 'Mobile Vault Tests',               category: 'Functional + UI/UX',               screen: 'Vault Screen' },
  { file: 'tests/07_settings_mobile.test.js',  suiteName: 'Mobile Settings Tests',            category: 'Functional + Security',            screen: 'Settings Screen' },
  { file: 'tests/08_security_mobile.test.js',  suiteName: 'Mobile Security Tests',            category: 'Security Testing',                 screen: 'Global Security' },
  { file: 'tests/09_ui_ux_mobile.test.js',     suiteName: 'Mobile UI/UX Tests',               category: 'UI/UX Testing',                    screen: 'All Screens' },
  { file: 'tests/10_validation_mobile.test.js',suiteName: 'Mobile Validation Tests',          category: 'Validation Testing',               screen: 'All Forms' },
];

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
    console.log(`${'─'.repeat(70)}`);

    const proc = spawn(process.execPath, [
      'node_modules/.bin/mocha',
      suiteInfo.file,
      '--timeout', '120000',
      '--reporter', 'json',
      '--no-colors',
    ], { cwd: __dirname, env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', () => {});

    proc.on('close', () => {
      try {
        const jsonStart = stdout.indexOf('{');
        if (jsonStart !== -1) {
          const report = JSON.parse(stdout.substring(jsonStart));
          const allTests = [...(report.passes || []), ...(report.failures || []), ...(report.pending || [])];
          allTests.forEach((t) => {
            const isPending = (report.pending || []).some((p) => p.fullTitle === t.fullTitle);
            const isFail = (report.failures || []).some((f) => f.fullTitle === t.fullTitle);
            results.tests.push({
              name: t.fullTitle || t.title,
              status: isPending ? 'SKIP' : isFail ? 'FAIL' : 'PASS',
              duration: t.duration || 0,
              error: t.err ? (t.err.message || '') : '',
              timestamp: new Date().toISOString(),
            });
          });
        } else {
          results.tests.push({ name: `${suiteInfo.suiteName} – Parse Error`, status: 'FAIL', duration: Date.now()-startTime, error: 'Could not parse mocha output', timestamp: new Date().toISOString() });
        }
      } catch (e) {
        results.tests.push({ name: `${suiteInfo.suiteName} – Error`, status: 'FAIL', duration: Date.now()-startTime, error: e.message, timestamp: new Date().toISOString() });
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
  console.log('  📱 SecureVault Appium Mobile E2E Test Suite');
  console.log('  Appium Server: ' + config.APPIUM_HOST + ':' + config.APPIUM_PORT);
  console.log('  Device: ' + config.ANDROID_CAPS['appium:deviceName']);
  console.log('  Started: ' + new Date().toLocaleString());
  console.log('═'.repeat(70));
  console.log('  ⚠  NOTE: Tests run in simulation mode if Appium is not running.');
  console.log('  To run on device: start Appium server + connect Android emulator/device.');

  const allResults = [];
  for (const suite of TEST_FILES) {
    const result = await runSuite(suite);
    allResults.push(result);
  }

  const grandTotal = allResults.reduce((s, r) => s + r.tests.length, 0);
  const grandPassed = allResults.reduce((s, r) => s + r.tests.filter((t) => t.status === 'PASS').length, 0);
  const grandFailed = allResults.reduce((s, r) => s + r.tests.filter((t) => t.status === 'FAIL').length, 0);
  const grandSkipped = allResults.reduce((s, r) => s + r.tests.filter((t) => t.status === 'SKIP').length, 0);

  console.log('\n' + '═'.repeat(70));
  console.log('  📊 APPIUM TEST SUMMARY');
  console.log('═'.repeat(70));
  console.log(`  Total Tests  : ${grandTotal}`);
  console.log(`  ✅ Passed    : ${grandPassed}`);
  console.log(`  ❌ Failed    : ${grandFailed}`);
  console.log(`  ⏭  Skipped   : ${grandSkipped}`);
  console.log(`  Pass Rate    : ${grandTotal > 0 ? ((grandPassed/grandTotal)*100).toFixed(1) : 0}%`);
  console.log('═'.repeat(70));

  console.log('\n📄 Generating Excel report...');
  const reportPath = await generateReport(allResults, REPORT_DIR, EXCEL_FILE);
  console.log('\n🎉 Appium report saved to: ' + reportPath);

  process.exit(grandFailed > 0 ? 1 : 0);
}

main().catch((err) => { console.error('Fatal error:', err); process.exit(1); });
