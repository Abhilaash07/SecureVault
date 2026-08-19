// frontend/appium-tests/config/appium.config.js
'use strict';

module.exports = {
  // Appium server settings
  APPIUM_HOST: process.env.APPIUM_HOST || '127.0.0.1',
  APPIUM_PORT: parseInt(process.env.APPIUM_PORT || '4723'),

  // Android capabilities (update with your device UDID / emulator)
  ANDROID_CAPS: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.DEVICE_NAME || 'Android Emulator',
    'appium:udid': process.env.DEVICE_UDID || 'emulator-5554',
    'appium:platformVersion': process.env.PLATFORM_VERSION || '13',
    'appium:app': process.env.APP_PATH || './SecureVault.apk',
    'appium:appPackage': 'com.securevault.app',
    'appium:appActivity': '.MainActivity',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:autoGrantPermissions': true,
    'appium:newCommandTimeout': 120,
  },

  // iOS capabilities (optional)
  IOS_CAPS: {
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:deviceName': process.env.IOS_DEVICE || 'iPhone 14',
    'appium:platformVersion': '16.0',
    'appium:app': process.env.IOS_APP_PATH || './SecureVault.app',
    'appium:noReset': false,
    'appium:autoAcceptAlerts': true,
    'appium:newCommandTimeout': 120,
  },

  // Test credentials
  DEMO_EMAIL: 'demo@securevault.com',
  DEMO_PASSWORD: 'demo123',
  TEST_EMAIL: process.env.TEST_EMAIL || 'test@securevault.com',
  TEST_PASSWORD: process.env.TEST_PASSWORD || 'Test@1234!',

  // Timeouts (ms)
  ELEMENT_TIMEOUT: 20000,
  SHORT_WAIT: 800,
  MEDIUM_WAIT: 2000,
  LONG_WAIT: 5000,
  ANIMATION_WAIT: 1200,

  // Report
  REPORT_OUTPUT_DIR: './reports',
  EXCEL_FILENAME: 'appium-test-report.xlsx',

  // Screen names for reporting
  SCREENS: {
    SPLASH: 'Splash / Launch Screen',
    LOGIN: 'Login Screen',
    SIGNUP: 'SignUp Screen',
    HOME: 'Home Dashboard',
    ENCRYPT: 'Encrypt Screen',
    DECRYPT: 'Decrypt Screen',
    VAULT: 'Vault Screen',
    SETTINGS: 'Settings Screen',
  },

  // Categories
  CATEGORIES: {
    FUNCTIONAL: 'Functional Testing',
    UNIT: 'Unit Testing',
    UIUX: 'UI/UX Testing',
    VALIDATION: 'Validation Testing',
    SECURITY: 'Security Testing',
    PERFORMANCE: 'Performance Testing',
  },
};
