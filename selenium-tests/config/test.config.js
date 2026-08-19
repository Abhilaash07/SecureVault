// selenium-tests/config/test.config.js
'use strict';

module.exports = {
  // Base URL for the SecureVault web app (expo web)
  BASE_URL: process.env.BASE_URL || 'http://localhost:8081',

  // Demo credentials (bypass Firebase)
  DEMO_EMAIL: 'demo@securevault.com',
  DEMO_PASSWORD: 'demo123',

  // Test user credentials (update with a real Firebase test account)
  TEST_EMAIL: process.env.TEST_EMAIL || 'test@securevault.com',
  TEST_PASSWORD: process.env.TEST_PASSWORD || 'Test@1234!',

  // Selenium browser settings
  BROWSER: process.env.BROWSER || 'chrome',
  HEADLESS: process.env.HEADLESS !== 'false',
  WINDOW_WIDTH: 1280,
  WINDOW_HEIGHT: 900,
  MOBILE_WIDTH: 390,
  MOBILE_HEIGHT: 844,

  // Timeouts
  PAGE_LOAD_TIMEOUT: 30000,
  ELEMENT_TIMEOUT: 15000,
  ANIMATION_TIMEOUT: 1500,
  SHORT_WAIT: 500,

  // Retry
  MAX_RETRIES: 2,

  // Report output
  REPORT_OUTPUT_DIR: './reports',
  EXCEL_FILENAME: 'selenium-test-report.xlsx',

  // Test identifiers used across test files
  SCREENS: {
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
    DEPLOYMENT: 'Deployment/Status Testing',
  },
};
