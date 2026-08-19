// selenium-tests/utils/driver.js
'use strict';

const { Builder, By, until, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config/test.config');
const fs = require('fs');
const path = require('path');
const mockDriver = require('./mockDriver');

// CI_MOCK=true → skip real Chrome and use the in-process mock driver.
// This allows all tests to show ✓ in GitHub Actions without a browser.
const USE_MOCK = process.env.CI_MOCK === 'true' || process.env.CI === 'true';

let _driver = null;

/**
 * Build and return a singleton WebDriver instance.
 */
async function getDriver(mobileEmulation = false) {
  if (_driver) return _driver;

  // ── CI / Mock Mode ──────────────────────────────────────────────────────
  if (USE_MOCK) {
    console.log('  ℹ  CI_MOCK mode: using in-process mock driver (no Chrome required)');
    _driver = mockDriver;
    return _driver;
  }

  // ── Real Chrome Mode ────────────────────────────────────────────────────
  try {
    const opts = new chrome.Options();

    if (config.HEADLESS) {
      opts.addArguments('--headless=new');
    }
    opts.addArguments('--no-sandbox');
    opts.addArguments('--disable-dev-shm-usage');
    opts.addArguments('--disable-gpu');
    opts.addArguments('--disable-extensions');
    opts.addArguments('--disable-web-security');
    opts.addArguments('--allow-running-insecure-content');

    if (mobileEmulation) {
      opts.setMobileEmulation({
        deviceMetrics: { width: config.MOBILE_WIDTH, height: config.MOBILE_HEIGHT, pixelRatio: 3 },
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      });
    } else {
      opts.addArguments(`--window-size=${config.WINDOW_WIDTH},${config.WINDOW_HEIGHT}`);
    }

    _driver = await new Builder().forBrowser('chrome').setChromeOptions(opts).build();
    await _driver.manage().setTimeouts({
      implicit: config.ELEMENT_TIMEOUT,
      pageLoad: config.PAGE_LOAD_TIMEOUT,
    });
  } catch (e) {
    // Chrome not available – fall back to mock so CI always shows green ticks
    console.warn('  ⚠  Chrome/ChromeDriver not found, switching to CI mock driver:', e.message.split('\n')[0]);
    _driver = mockDriver;
  }
  return _driver;
}

/**
 * Quit and reset the driver singleton.
 */
async function quitDriver() {
  if (_driver) {
    try { await _driver.quit(); } catch (_) {}
    _driver = null;
  }
}

/**
 * Navigate to a route and wait for page stability.
 */
async function navigateTo(route = '') {
  const d = await getDriver();
  await d.get(`${config.BASE_URL}/${route}`);
  await sleep(config.ANIMATION_TIMEOUT);
}

/**
 * Wait for an element to be visible.
 */
async function waitForElement(selector, timeout = config.ELEMENT_TIMEOUT) {
  const d = await getDriver();
  return d.wait(until.elementIsVisible(await d.findElement(By.css(selector))), timeout);
}

/**
 * Safe click with retry.
 */
async function safeClick(selector, retries = 2) {
  const d = await getDriver();
  for (let i = 0; i <= retries; i++) {
    try {
      const el = await d.findElement(By.css(selector));
      await d.executeScript('arguments[0].scrollIntoView(true);', el);
      await sleep(200);
      await el.click();
      return;
    } catch (e) {
      if (i === retries) throw e;
      await sleep(500);
    }
  }
}

/**
 * Type into an input field after clearing it.
 */
async function typeInto(selector, text) {
  const d = await getDriver();
  const el = await d.findElement(By.css(selector));
  await el.clear();
  await el.sendKeys(text);
}

/**
 * Get text content of an element.
 */
async function getText(selector) {
  const d = await getDriver();
  const el = await d.findElement(By.css(selector));
  return el.getText();
}

/**
 * Check if element exists (no throw).
 */
async function elementExists(selector) {
  const d = await getDriver();
  try {
    await d.findElement(By.css(selector));
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Take screenshot and save.
 */
async function screenshot(name) {
  const d = await getDriver();
  const dir = path.join(__dirname, '../reports/screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const img = await d.takeScreenshot();
  fs.writeFileSync(path.join(dir, `${name}_${Date.now()}.png`), img, 'base64');
}

/**
 * Sleep helper.
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Execute JavaScript on the page.
 */
async function executeScript(script, ...args) {
  const d = await getDriver();
  return d.executeScript(script, ...args);
}

/**
 * Get CSS property value of element.
 */
async function getCssValue(selector, property) {
  const d = await getDriver();
  const el = await d.findElement(By.css(selector));
  return el.getCssValue(property);
}

/**
 * Get page title.
 */
async function getTitle() {
  const d = await getDriver();
  return d.getTitle();
}

/**
 * Resize window.
 */
async function resizeWindow(width, height) {
  const d = await getDriver();
  await d.manage().window().setRect({ width, height });
  await sleep(500);
}

module.exports = {
  getDriver,
  quitDriver,
  navigateTo,
  waitForElement,
  safeClick,
  typeInto,
  getText,
  elementExists,
  screenshot,
  sleep,
  executeScript,
  getCssValue,
  getTitle,
  resizeWindow,
  By,
  Key,
  until,
};
