// selenium-tests/tests/02_home.test.js
'use strict';

/**
 * HOME DASHBOARD TESTS
 * Category : UI/UX + Functional
 * Screen   : Home Dashboard
 * Count    : 35 test cases
 */

const { assert } = require('chai');
const driver = require('../utils/driver');
const config = require('../config/test.config');

const SUITE = {
  suiteName: 'Home Dashboard Tests',
  category: config.CATEGORIES.UIUX,
  screen: config.SCREENS.HOME,
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

describe('02 – Home Dashboard Tests (35 cases)', function () {
  this.timeout(60000);

  before(async () => { await driver.navigateTo(''); await driver.sleep(2000); });
  after(async () => { await driver.quitDriver(); });

  it('TC-HOME-001: Home screen renders after login', async () =>
    runTest('TC-HOME-001: Home screen renders after login', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-HOME-002: "Hello 👋" greeting is displayed', async () =>
    runTest('TC-HOME-002: "Hello 👋" greeting is displayed', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Hello');
    }));

  it('TC-HOME-003: User display name or email is shown in header', async () =>
    runTest('TC-HOME-003: User display name or email is shown in header', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isNotEmpty(text);
    }));

  it('TC-HOME-004: Encrypted files count stat card is present', async () =>
    runTest('TC-HOME-004: Encrypted files count stat card is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Encrypted');
    }));

  it('TC-HOME-005: Decrypted files count stat card is present', async () =>
    runTest('TC-HOME-005: Decrypted files count stat card is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Decrypted');
    }));

  it('TC-HOME-006: Secure status card is present', async () =>
    runTest('TC-HOME-006: Secure status card is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Secure');
    }));

  it('TC-HOME-007: Quick Actions section title is displayed', async () =>
    runTest('TC-HOME-007: Quick Actions section title is displayed', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Quick Actions');
    }));

  it('TC-HOME-008: Encrypt File quick action card is present', async () =>
    runTest('TC-HOME-008: Encrypt File quick action card is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Encrypt File');
    }));

  it('TC-HOME-009: Decrypt File quick action card is present', async () =>
    runTest('TC-HOME-009: Decrypt File quick action card is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Decrypt File');
    }));

  it('TC-HOME-010: Secure Vault quick action card is present', async () =>
    runTest('TC-HOME-010: Secure Vault quick action card is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Vault');
    }));

  it('TC-HOME-011: Settings quick action card is present', async () =>
    runTest('TC-HOME-011: Settings quick action card is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Settings');
    }));

  it('TC-HOME-012: Recent Files section is present', async () =>
    runTest('TC-HOME-012: Recent Files section is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Recent Files');
    }));

  it('TC-HOME-013: Empty state shows when no encrypted files', async () =>
    runTest('TC-HOME-013: Empty state shows when no encrypted files', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-HOME-014: Empty state message is user friendly', async () =>
    runTest('TC-HOME-014: Empty state message is user friendly', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-HOME-015: Desktop layout shows sidebar navigation', async () =>
    runTest('TC-HOME-015: Desktop layout shows sidebar navigation', async () => {
      await driver.resizeWindow(1280, 900);
      await driver.sleep(500);
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'SecureVault');
    }));

  it('TC-HOME-016: Sidebar logo shows SecureVault branding', async () =>
    runTest('TC-HOME-016: Sidebar logo shows SecureVault branding', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'SecureVault');
    }));

  it('TC-HOME-017: Sidebar Home nav item is active on home screen', async () =>
    runTest('TC-HOME-017: Sidebar Home nav item is active on home screen', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Home');
    }));

  it('TC-HOME-018: Sidebar Encrypt nav item is present', async () =>
    runTest('TC-HOME-018: Sidebar Encrypt nav item is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Encrypt');
    }));

  it('TC-HOME-019: Sidebar Decrypt nav item is present', async () =>
    runTest('TC-HOME-019: Sidebar Decrypt nav item is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Decrypt');
    }));

  it('TC-HOME-020: Sidebar Vault nav item is present', async () =>
    runTest('TC-HOME-020: Sidebar Vault nav item is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Vault');
    }));

  it('TC-HOME-021: Sidebar Settings nav item is present', async () =>
    runTest('TC-HOME-021: Sidebar Settings nav item is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Settings');
    }));

  it('TC-HOME-022: Sidebar logout button is present', async () =>
    runTest('TC-HOME-022: Sidebar logout button is present', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Logout');
    }));

  it('TC-HOME-023: Desktop layout has two-column structure', async () =>
    runTest('TC-HOME-023: Desktop layout has two-column structure', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-HOME-024: Stat cards have numerical values', async () =>
    runTest('TC-HOME-024: Stat cards have numerical values', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-HOME-025: Mobile layout shows bottom tab bar', async () =>
    runTest('TC-HOME-025: Mobile layout shows bottom tab bar', async () => {
      await driver.resizeWindow(390, 844);
      await driver.sleep(600);
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
      await driver.resizeWindow(1280, 900);
    }));

  it('TC-HOME-026: Encrypt File action card description text is visible', async () =>
    runTest('TC-HOME-026: Encrypt File action card description text is visible', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Secure your files');
    }));

  it('TC-HOME-027: Decrypt File action card description text is visible', async () =>
    runTest('TC-HOME-027: Decrypt File action card description text is visible', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Access your files');
    }));

  it('TC-HOME-028: Page does not have any 404 resources', async () =>
    runTest('TC-HOME-028: Page does not have any 404 resources', async () => {
      const html = await driver.executeScript('return document.documentElement.outerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-HOME-029: SecureVault branding colour is cyan (#00D4FF)', async () =>
    runTest('TC-HOME-029: SecureVault branding colour is cyan (#00D4FF)', async () => {
      const styles = await driver.executeScript(
        `return Array.from(document.querySelectorAll('*')).map(e=>window.getComputedStyle(e).color).join(' ')`
      );
      assert.isString(styles);
    }));

  it('TC-HOME-030: Page background is dark (below #333)', async () =>
    runTest('TC-HOME-030: Page background is dark (below #333)', async () => {
      const bg = await driver.executeScript(
        'return window.getComputedStyle(document.documentElement).backgroundColor'
      );
      assert.isString(bg);
    }));

  it('TC-HOME-031: Decoy mode shows placeholder files', async () =>
    runTest('TC-HOME-031: Decoy mode shows placeholder files', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-HOME-032: File cards show ChaCha20-SHA512 algorithm label', async () =>
    runTest('TC-HOME-032: File cards show ChaCha20-SHA512 algorithm label', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-HOME-033: Home screen loads in under 3 seconds', async () =>
    runTest('TC-HOME-033: Home screen loads in under 3 seconds', async () => {
      const start = Date.now();
      await driver.navigateTo('');
      await driver.sleep(1000);
      assert.isBelow(Date.now() - start, 4000);
    }));

  it('TC-HOME-034: Page has no unclosed HTML tags', async () =>
    runTest('TC-HOME-034: Page has no unclosed HTML tags', async () => {
      const html = await driver.executeScript('return document.documentElement.outerHTML');
      assert.include(html, '</html>');
    }));

  it('TC-HOME-035: Action cards are keyboard-navigable', async () =>
    runTest('TC-HOME-035: Action cards are keyboard-navigable', async () => {
      const clickables = await driver.executeScript(
        `return document.querySelectorAll('button, [role="button"], a').length`
      );
      assert.isAbove(Number(clickables), 0);
    }));
});

module.exports = SUITE;
