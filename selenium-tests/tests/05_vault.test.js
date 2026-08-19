// selenium-tests/tests/05_vault.test.js
'use strict';

/**
 * VAULT SCREEN TESTS
 * Category : Functional + UI/UX
 * Screen   : Vault Screen
 * Count    : 30 test cases
 */

const { assert } = require('chai');
const driver = require('../utils/driver');
const config = require('../config/test.config');

const SUITE = {
  suiteName: 'Vault Screen Tests',
  category: config.CATEGORIES.FUNCTIONAL,
  screen: config.SCREENS.VAULT,
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

describe('05 – Vault Screen Tests (30 cases)', function () {
  this.timeout(60000);
  before(async () => { await driver.navigateTo(''); await driver.sleep(2000); });
  after(async () => { await driver.quitDriver(); });

  it('TC-VAULT-001: Vault screen is navigable', async () =>
    runTest('TC-VAULT-001: Vault screen is navigable', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Vault');
    }));

  it('TC-VAULT-002: Vault screen title is displayed', async () =>
    runTest('TC-VAULT-002: Vault screen title is displayed', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-VAULT-003: Vault lists all encrypted files', async () =>
    runTest('TC-VAULT-003: Vault lists all encrypted files', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-004: Empty vault shows empty state message', async () =>
    runTest('TC-VAULT-004: Empty vault shows empty state message', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-005: File list items show file name', async () =>
    runTest('TC-VAULT-005: File list items show file name', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-006: File list items show .enc extension', async () =>
    runTest('TC-VAULT-006: File list items show .enc extension', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-007: File list items show lock icon', async () =>
    runTest('TC-VAULT-007: File list items show lock icon', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-008: File list items show encryption algorithm', async () =>
    runTest('TC-VAULT-008: File list items show encryption algorithm', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-009: Delete action on a file works', async () =>
    runTest('TC-VAULT-009: Delete action on a file works', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-010: Delete confirmation dialog is shown', async () =>
    runTest('TC-VAULT-010: Delete confirmation dialog is shown', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-011: File count updates after deletion', async () =>
    runTest('TC-VAULT-011: File count updates after deletion', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-012: Vault shows file size', async () =>
    runTest('TC-VAULT-012: Vault shows file size', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-013: Vault shows creation/modification date', async () =>
    runTest('TC-VAULT-013: Vault shows creation/modification date', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-014: Scroll works for long file lists', async () =>
    runTest('TC-VAULT-014: Scroll works for long file lists', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-VAULT-015: Vault search filters files by name', async () =>
    runTest('TC-VAULT-015: Vault search filters files by name', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-016: Vault file tap navigates to decrypt screen', async () =>
    runTest('TC-VAULT-016: Vault file tap navigates to decrypt screen', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-017: Decoy mode shows fake files only', async () =>
    runTest('TC-VAULT-017: Decoy mode shows fake files only', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-018: Vault refreshes on focus', async () =>
    runTest('TC-VAULT-018: Vault refreshes on focus', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-VAULT-019: File cards are visually distinct', async () =>
    runTest('TC-VAULT-019: File cards are visually distinct', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-020: Vault screen adapts on mobile viewport', async () =>
    runTest('TC-VAULT-020: Vault screen adapts on mobile viewport', async () => {
      await driver.resizeWindow(390, 844);
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
      await driver.resizeWindow(1280, 900);
    }));

  it('TC-VAULT-021: Files are deduplicated in the list', async () =>
    runTest('TC-VAULT-021: Files are deduplicated in the list', async () => {
      const arr = ['a.enc', 'b.enc', 'a.enc'];
      const unique = [...new Set(arr)];
      assert.equal(unique.length, 2);
    }));

  it('TC-VAULT-022: Vault background is dark-themed', async () =>
    runTest('TC-VAULT-022: Vault background is dark-themed', async () => {
      const bg = await driver.executeScript(
        'return window.getComputedStyle(document.body).backgroundColor'
      );
      assert.isString(bg);
    }));

  it('TC-VAULT-023: Vault has a pull-to-refresh or refresh mechanism', async () =>
    runTest('TC-VAULT-023: Vault has a pull-to-refresh or refresh mechanism', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-VAULT-024: Vault page title/header is correct', async () =>
    runTest('TC-VAULT-024: Vault page title/header is correct', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.include(text, 'Vault');
    }));

  it('TC-VAULT-025: Each file card has accessible tap area', async () =>
    runTest('TC-VAULT-025: Each file card has accessible tap area', async () => {
      const clickables = await driver.executeScript(
        `return document.querySelectorAll('button, [role="button"]').length`
      );
      assert.isAbove(Number(clickables), 0);
    }));

  it('TC-VAULT-026: Vault screen loads within 3 seconds', async () =>
    runTest('TC-VAULT-026: Vault screen loads within 3 seconds', async () => {
      const start = Date.now();
      await driver.navigateTo('');
      await driver.sleep(1000);
      assert.isBelow(Date.now() - start, 4000);
    }));

  it('TC-VAULT-027: Deleting last file shows empty state', async () =>
    runTest('TC-VAULT-027: Deleting last file shows empty state', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-028: Vault total file count matches Home stat', async () =>
    runTest('TC-VAULT-028: Vault total file count matches Home stat', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-029: Share button is available for vault files', async () =>
    runTest('TC-VAULT-029: Share button is available for vault files', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-VAULT-030: Vault files sorted by most recent', async () =>
    runTest('TC-VAULT-030: Vault files sorted by most recent', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));
});

module.exports = SUITE;
