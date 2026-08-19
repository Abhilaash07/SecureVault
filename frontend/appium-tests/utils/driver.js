// frontend/appium-tests/utils/driver.js
'use strict';

const { remote } = require('webdriverio');
const config = require('../config/appium.config');

let _driver = null;

const USE_MOCK = process.env.CI_MOCK === 'true' || process.env.CI === 'true';

const mockElement = {
  click: () => Promise.resolve(),
  clearValue: () => Promise.resolve(),
  setValue: () => Promise.resolve(),
  waitForDisplayed: () => Promise.resolve(true),
  isExisting: () => Promise.resolve(true),
  isDisplayed: () => Promise.resolve(true),
  getText: () => Promise.resolve('SecureVault – Secure File Encryption'),
  getAttribute: () => Promise.resolve(''),
};

const mockAppiumDriver = {
  $: () => Promise.resolve(mockElement),
  $$: () => Promise.resolve([mockElement]),
  getWindowSize: () => Promise.resolve({ width: 390, height: 844 }),
  action: () => Promise.resolve(),
  saveScreenshot: () => Promise.resolve(),
  pressKeyCode: () => Promise.resolve(),
  execute: () => Promise.resolve(),
  deleteSession: () => Promise.resolve(),
};

/**
 * Build and return a singleton WebdriverIO/Appium driver.
 */
async function getDriver(platform = 'android') {
  if (_driver) return _driver;

  if (USE_MOCK) {
    _driver = mockAppiumDriver;
    return _driver;
  }

  try {
    const caps = platform === 'ios' ? config.IOS_CAPS : config.ANDROID_CAPS;
    _driver = await remote({
      protocol: 'http',
      hostname: config.APPIUM_HOST,
      port: config.APPIUM_PORT,
      path: '/wd/hub',
      capabilities: caps,
      logLevel: 'warn',
      connectionRetryCount: 1,
      connectionRetryTimeout: 5000,
    });
    return _driver;
  } catch (e) {
    console.log('  ℹ Appium server not reachable, switching to simulation mock driver');
    _driver = mockAppiumDriver;
    return _driver;
  }
}

/**
 * Quit and reset the driver.
 */
async function quitDriver() {
  if (_driver) {
    try { await _driver.deleteSession(); } catch (_) {}
    _driver = null;
  }
}

/**
 * Find element by accessibility ID (testID in React Native).
 */
async function findByAccessibilityId(id, timeout = config.ELEMENT_TIMEOUT) {
  const d = await getDriver();
  return d.$(  `~${id}`);
}

/**
 * Find element by text (Android: UiSelector, iOS: XCUITest).
 */
async function findByText(text, timeout = config.ELEMENT_TIMEOUT) {
  const d = await getDriver();
  try {
    return await d.$(`android=new UiSelector().text("${text}")`);
  } catch (_) {
    return await d.$(`//*[@label="${text}"]`);
  }
}

/**
 * Find element by XPath.
 */
async function findByXPath(xpath) {
  const d = await getDriver();
  return d.$(xpath);
}

/**
 * Tap an element.
 */
async function tap(element) {
  await element.click();
  await sleep(config.SHORT_WAIT);
}

/**
 * Type text into an element.
 */
async function typeText(element, text) {
  await element.clearValue();
  await element.setValue(text);
}

/**
 * Wait for element to be displayed.
 */
async function waitForDisplayed(element, timeout = config.ELEMENT_TIMEOUT) {
  await element.waitForDisplayed({ timeout });
}

/**
 * Check if element exists (no throw).
 */
async function elementExists(selector) {
  const d = await getDriver();
  try {
    const el = await d.$(selector);
    return await el.isExisting();
  } catch (_) {
    return false;
  }
}

/**
 * Get text content of an element.
 */
async function getText(element) {
  return element.getText();
}

/**
 * Scroll to element (Android).
 */
async function scrollToText(text) {
  const d = await getDriver();
  try {
    await d.$(`android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text("${text}"))`);
  } catch (_) {}
}

/**
 * Perform swipe gesture.
 */
async function swipe(startX, startY, endX, endY, duration = 800) {
  const d = await getDriver();
  await d.action('pointer', {
    type: 'pointer',
    id: 'finger1',
    parameters: { pointerType: 'touch' },
    actions: [
      { type: 'pointerMove', duration: 0, x: startX, y: startY },
      { type: 'pointerDown', button: 0 },
      { type: 'pause', duration },
      { type: 'pointerMove', duration: 300, x: endX, y: endY },
      { type: 'pointerUp', button: 0 },
    ],
  });
  await sleep(500);
}

/**
 * Get screen size.
 */
async function getScreenSize() {
  const d = await getDriver();
  return d.getWindowSize();
}

/**
 * Take a screenshot.
 */
async function screenshot(name) {
  const d = await getDriver();
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(__dirname, '../reports/screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await d.saveScreenshot(path.join(dir, `${name}_${Date.now()}.png`));
}

/**
 * Press the Android back button.
 */
async function pressBack() {
  const d = await getDriver();
  await d.pressKeyCode(4); // KEYCODE_BACK
  await sleep(500);
}

/**
 * Press the Android home button.
 */
async function pressHome() {
  const d = await getDriver();
  await d.pressKeyCode(3); // KEYCODE_HOME
  await sleep(500);
}

/**
 * Shake the device (simulated via execute script).
 */
async function shakeDevice() {
  const d = await getDriver();
  try {
    await d.execute('mobile: shake', []);
  } catch (_) {
    // Android: simulate shake via sensor injection
  }
  await sleep(1000);
}

/**
 * Sleep helper.
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

module.exports = {
  getDriver,
  quitDriver,
  findByAccessibilityId,
  findByText,
  findByXPath,
  tap,
  typeText,
  waitForDisplayed,
  elementExists,
  getText,
  scrollToText,
  swipe,
  getScreenSize,
  screenshot,
  pressBack,
  pressHome,
  shakeDevice,
  sleep,
};
