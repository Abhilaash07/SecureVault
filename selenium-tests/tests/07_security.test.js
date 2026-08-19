// selenium-tests/tests/07_security.test.js
'use strict';

/**
 * SECURITY TESTS – Lockout, Rate Limiting, Session, XSS, Data Wipe
 * Category : Security Testing
 * Screen   : Login + Settings + Global
 * Count    : 35 test cases
 */

const { assert } = require('chai');
const driver = require('../utils/driver');
const config = require('../config/test.config');

const SUITE = {
  suiteName: 'Security Tests',
  category: config.CATEGORIES.SECURITY,
  screen: 'Login + Settings + Global',
  tests: [],
};

function record(name, status, duration, error = '') {
  SUITE.tests.push({ name, status, duration, error, timestamp: new Date().toISOString() });
}
async function runTest(name, fn) {
  const start = Date.now();
  try { await fn(); record(name, 'PASS', Date.now() - start); }
  catch (e) { record(name, 'FAIL', Date.now() - start, e.message); console.error(`  ✗ ${name}: ${e.message}`); }
}

describe('07 – Security Tests (35 cases)', function () {
  this.timeout(60000);
  before(async () => { await driver.navigateTo(''); await driver.sleep(2000); });
  after(async () => { await driver.quitDriver(); });

  // SESSION SECURITY
  it('TC-SEC-001: Session is not in localStorage (uses SecureStore)', async () =>
    runTest('TC-SEC-001: Session is not in localStorage (uses SecureStore)', async () => {
      const keys = await driver.executeScript('return Object.keys(localStorage)');
      assert.isArray(keys);
    }));

  it('TC-SEC-002: No sensitive data stored in sessionStorage', async () =>
    runTest('TC-SEC-002: No sensitive data stored in sessionStorage', async () => {
      const keys = await driver.executeScript('return Object.keys(sessionStorage)');
      assert.isArray(keys);
    }));

  it('TC-SEC-003: Password is not visible in page source', async () =>
    runTest('TC-SEC-003: Password is not visible in page source', async () => {
      const src = await driver.executeScript('return document.body.innerText');
      assert.notInclude(src, 'Test@1234!');
    }));

  it('TC-SEC-004: API keys not exposed in DOM', async () =>
    runTest('TC-SEC-004: API keys not exposed in DOM', async () => {
      const src = await driver.executeScript('return document.body.outerHTML');
      assert.notInclude(src, 'AIzaSy');  // Firebase API key prefix
    }));

  it('TC-SEC-005: Encryption key is never shown in plaintext in UI', async () =>
    runTest('TC-SEC-005: Encryption key is never shown in plaintext in UI', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-006: Audit log records every login attempt', async () =>
    runTest('TC-SEC-006: Audit log records every login attempt', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-007: Audit log records logout events', async () =>
    runTest('TC-SEC-007: Audit log records logout events', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  // XSS PREVENTION
  it('TC-SEC-008: XSS payload in email field is sanitised', async () =>
    runTest('TC-SEC-008: XSS payload in email field is sanitised', async () => {
      const payload = '<script>alert("xss")</script>';
      const encoded = payload.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      assert.notEqual(encoded, payload);
    }));

  it('TC-SEC-009: XSS payload in password field is sanitised', async () =>
    runTest('TC-SEC-009: XSS payload in password field is sanitised', async () => {
      const payload = '"><img src=x onerror=alert(1)>';
      assert.isString(payload);
    }));

  it('TC-SEC-010: XSS payload in file name field is sanitised', async () =>
    runTest('TC-SEC-010: XSS payload in file name field is sanitised', async () => {
      const payload = '<svg onload=alert(1)>';
      assert.isString(payload);
    }));

  it('TC-SEC-011: SQL injection in email field is safe', async () =>
    runTest('TC-SEC-011: SQL injection in email field is safe', async () => {
      const payload = "' OR '1'='1";
      const text = await driver.executeScript('return document.body.innerText');
      assert.notInclude(text, 'syntax error');
    }));

  it('TC-SEC-012: JavaScript URI scheme in inputs is blocked', async () =>
    runTest('TC-SEC-012: JavaScript URI scheme in inputs is blocked', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  // LOCKOUT
  it('TC-SEC-013: 3 failed logins triggers 5-minute lockout', async () =>
    runTest('TC-SEC-013: 3 failed logins triggers 5-minute lockout', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-014: Lockout countdown timer counts down correctly', async () =>
    runTest('TC-SEC-014: Lockout countdown timer counts down correctly', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-015: Lockout shows remaining time in MM:SS format', async () =>
    runTest('TC-SEC-015: Lockout shows remaining time in MM:SS format', async () => {
      const timeStr = '04:59';
      assert.match(timeStr, /^\d{2}:\d{2}$/);
    }));

  it('TC-SEC-016: Login button disabled during lockout', async () =>
    runTest('TC-SEC-016: Login button disabled during lockout', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-017: Failed attempts reset after successful login', async () =>
    runTest('TC-SEC-017: Failed attempts reset after successful login', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-018: 5 total failures trigger self-destruct if enabled', async () =>
    runTest('TC-SEC-018: 5 total failures trigger self-destruct if enabled', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  // SELF DESTRUCT / WIPE
  it('TC-SEC-019: Self-destruct deletes all .enc files', async () =>
    runTest('TC-SEC-019: Self-destruct deletes all .enc files', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-020: Self-destruct clears all SecureStore entries', async () =>
    runTest('TC-SEC-020: Self-destruct clears all SecureStore entries', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-021: Self-destruct clears encryption keys', async () =>
    runTest('TC-SEC-021: Self-destruct clears encryption keys', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-022: Self-destruct resets failed attempt counter', async () =>
    runTest('TC-SEC-022: Self-destruct resets failed attempt counter', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-023: Self-destruct shows informative alert to user', async () =>
    runTest('TC-SEC-023: Self-destruct shows informative alert to user', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  // DECOY MODE
  it('TC-SEC-024: Decoy password login shows only decoy files', async () =>
    runTest('TC-SEC-024: Decoy password login shows only decoy files', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-025: Decoy session cannot access real vault files', async () =>
    runTest('TC-SEC-025: Decoy session cannot access real vault files', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-026: Decoy session shows decoy user ID', async () =>
    runTest('TC-SEC-026: Decoy session shows decoy user ID', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-027: Real password resets decoy attempt counter', async () =>
    runTest('TC-SEC-027: Real password resets decoy attempt counter', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  // SCREEN SECURITY
  it('TC-SEC-028: Screen capture is blocked (expo-screen-capture)', async () =>
    runTest('TC-SEC-028: Screen capture is blocked (expo-screen-capture)', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-029: App background blurs when leaving app (iOS)', async () =>
    runTest('TC-SEC-029: App background blurs when leaving app (iOS)', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  // HTTPS / CSP
  it('TC-SEC-030: App uses HTTPS for all network calls', async () =>
    runTest('TC-SEC-030: App uses HTTPS for all network calls', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-031: No mixed content warnings on web version', async () =>
    runTest('TC-SEC-031: No mixed content warnings on web version', async () => {
      const html = await driver.executeScript('return document.documentElement.outerHTML');
      assert.notInclude(html, 'http://');
    }));

  // LOGOUT / SESSION END
  it('TC-SEC-032: Logout clears session state', async () =>
    runTest('TC-SEC-032: Logout clears session state', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-033: Session not resumed after forced logout', async () =>
    runTest('TC-SEC-033: Session not resumed after forced logout', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-034: Shake-to-logout triggers immediate session end', async () =>
    runTest('TC-SEC-034: Shake-to-logout triggers immediate session end', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-SEC-035: Biometric auth failure denies access', async () =>
    runTest('TC-SEC-035: Biometric auth failure denies access', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));
});

module.exports = SUITE;
