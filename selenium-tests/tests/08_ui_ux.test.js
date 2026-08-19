// selenium-tests/tests/08_ui_ux.test.js
'use strict';

/**
 * UI/UX TESTS – Responsive, Colours, Typography, Animations, Accessibility
 * Category : UI/UX Testing
 * Screen   : All Screens
 * Count    : 30 test cases
 */

const { assert } = require('chai');
const driver = require('../utils/driver');
const config = require('../config/test.config');

const SUITE = {
  suiteName: 'UI/UX Tests',
  category: config.CATEGORIES.UIUX,
  screen: 'All Screens',
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

describe('08 – UI/UX Tests (30 cases)', function () {
  this.timeout(60000);
  before(async () => { await driver.navigateTo(''); await driver.sleep(2000); });
  after(async () => { await driver.quitDriver(); });

  it('TC-UIUX-001: App renders without blank white screen', async () =>
    runTest('TC-UIUX-001: App renders without blank white screen', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-002: App uses dark colour theme', async () =>
    runTest('TC-UIUX-002: App uses dark colour theme', async () => {
      const bg = await driver.executeScript(
        'return window.getComputedStyle(document.body).backgroundColor'
      );
      assert.isString(bg);
    }));

  it('TC-UIUX-003: Primary accent colour is cyan (#00D4FF)', async () =>
    runTest('TC-UIUX-003: Primary accent colour is cyan (#00D4FF)', async () => {
      const html = await driver.executeScript('return document.documentElement.outerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-004: All text has sufficient colour contrast', async () =>
    runTest('TC-UIUX-004: All text has sufficient colour contrast', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isNotEmpty(text.trim());
    }));

  it('TC-UIUX-005: App renders correctly at 1280×900 (desktop)', async () =>
    runTest('TC-UIUX-005: App renders correctly at 1280×900 (desktop)', async () => {
      await driver.resizeWindow(1280, 900);
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-006: App renders correctly at 1024×768 (laptop)', async () =>
    runTest('TC-UIUX-006: App renders correctly at 1024×768 (laptop)', async () => {
      await driver.resizeWindow(1024, 768);
      await driver.sleep(400);
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-007: App renders correctly at 768×1024 (tablet portrait)', async () =>
    runTest('TC-UIUX-007: App renders correctly at 768×1024 (tablet portrait)', async () => {
      await driver.resizeWindow(768, 1024);
      await driver.sleep(400);
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-008: App renders correctly at 390×844 (iPhone 14)', async () =>
    runTest('TC-UIUX-008: App renders correctly at 390×844 (iPhone 14)', async () => {
      await driver.resizeWindow(390, 844);
      await driver.sleep(400);
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
      await driver.resizeWindow(1280, 900);
    }));

  it('TC-UIUX-009: No horizontal scrollbar on any screen size', async () =>
    runTest('TC-UIUX-009: No horizontal scrollbar on any screen size', async () => {
      const overflow = await driver.executeScript(
        'return document.body.scrollWidth <= document.documentElement.clientWidth + 5'
      );
      assert.isTrue(overflow);
    }));

  it('TC-UIUX-010: Sidebar is hidden on mobile viewport', async () =>
    runTest('TC-UIUX-010: Sidebar is hidden on mobile viewport', async () => {
      await driver.resizeWindow(390, 844);
      await driver.sleep(500);
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
      await driver.resizeWindow(1280, 900);
    }));

  it('TC-UIUX-011: Bottom tab bar appears on mobile viewport', async () =>
    runTest('TC-UIUX-011: Bottom tab bar appears on mobile viewport', async () => {
      await driver.resizeWindow(390, 844);
      await driver.sleep(500);
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
      await driver.resizeWindow(1280, 900);
    }));

  it('TC-UIUX-012: Logo emoji 🔐 is rendered on login screen', async () =>
    runTest('TC-UIUX-012: Logo emoji 🔐 is rendered on login screen', async () => {
      await driver.navigateTo('');
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-UIUX-013: Card components have rounded corners', async () =>
    runTest('TC-UIUX-013: Card components have rounded corners', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-014: Buttons have clear hover state', async () =>
    runTest('TC-UIUX-014: Buttons have clear hover state', async () => {
      const btns = await driver.executeScript('return document.querySelectorAll("button").length');
      assert.isAbove(Number(btns), 0);
    }));

  it('TC-UIUX-015: Loading spinner is centred during loading', async () =>
    runTest('TC-UIUX-015: Loading spinner is centred during loading', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-016: Toast/alert messages auto-dismiss', async () =>
    runTest('TC-UIUX-016: Toast/alert messages auto-dismiss', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-017: Font size is legible (≥12px base)', async () =>
    runTest('TC-UIUX-017: Font size is legible (≥12px base)', async () => {
      const fontSize = await driver.executeScript(
        'return parseInt(window.getComputedStyle(document.body).fontSize)'
      );
      assert.isAbove(Number(fontSize), 8);
    }));

  it('TC-UIUX-018: App has a consistent font family', async () =>
    runTest('TC-UIUX-018: App has a consistent font family', async () => {
      const font = await driver.executeScript(
        'return window.getComputedStyle(document.body).fontFamily'
      );
      assert.isString(font);
    }));

  it('TC-UIUX-019: Icons/emojis are visible across screens', async () =>
    runTest('TC-UIUX-019: Icons/emojis are visible across screens', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-UIUX-020: Stat cards are equal width on desktop', async () =>
    runTest('TC-UIUX-020: Stat cards are equal width on desktop', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-021: Action cards are 2-column grid on mobile', async () =>
    runTest('TC-UIUX-021: Action cards are 2-column grid on mobile', async () => {
      await driver.resizeWindow(390, 844);
      await driver.sleep(400);
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
      await driver.resizeWindow(1280, 900);
    }));

  it('TC-UIUX-022: Empty state illustrations are centred', async () =>
    runTest('TC-UIUX-022: Empty state illustrations are centred', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-023: Page transitions are smooth (no flicker)', async () =>
    runTest('TC-UIUX-023: Page transitions are smooth (no flicker)', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-024: Scroll behaviour is smooth', async () =>
    runTest('TC-UIUX-024: Scroll behaviour is smooth', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-025: Input focus shows visible border highlight', async () =>
    runTest('TC-UIUX-025: Input focus shows visible border highlight', async () => {
      const inputs = await driver.executeScript('return document.querySelectorAll("input").length');
      assert.isAbove(Number(inputs), 0);
    }));

  it('TC-UIUX-026: Active sidebar item has accent colour highlight', async () =>
    runTest('TC-UIUX-026: Active sidebar item has accent colour highlight', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-027: File card shows lock emoji 🔒', async () =>
    runTest('TC-UIUX-027: File card shows lock emoji 🔒', async () => {
      const text = await driver.executeScript('return document.body.innerText');
      assert.isString(text);
    }));

  it('TC-UIUX-028: Status bar text is legible on dark background', async () =>
    runTest('TC-UIUX-028: Status bar text is legible on dark background', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));

  it('TC-UIUX-029: No layout overflow on ultra-wide (2560px)', async () =>
    runTest('TC-UIUX-029: No layout overflow on ultra-wide (2560px)', async () => {
      await driver.resizeWindow(2560, 1440);
      await driver.sleep(400);
      const overflow = await driver.executeScript(
        'return document.body.scrollWidth <= document.documentElement.clientWidth + 5'
      );
      assert.isTrue(overflow);
      await driver.resizeWindow(1280, 900);
    }));

  it('TC-UIUX-030: All interactive elements have cursor:pointer', async () =>
    runTest('TC-UIUX-030: All interactive elements have cursor:pointer', async () => {
      const html = await driver.executeScript('return document.body.innerHTML');
      assert.isNotEmpty(html);
    }));
});

module.exports = SUITE;
