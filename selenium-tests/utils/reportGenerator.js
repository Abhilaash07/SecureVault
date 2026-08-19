// selenium-tests/utils/reportGenerator.js
'use strict';

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * Colour palette for the Excel report.
 */
const COLORS = {
  headerBg: '1E2A4A',
  headerFg: '00D4FF',
  passGreen: 'D4EDDA',
  failRed: 'F8D7DA',
  skipYellow: 'FFF3CD',
  altRow: 'F5F7FF',
  white: 'FFFFFF',
  titleFg: '0A1628',
  sectionBg: 'E8F4FD',
};

/**
 * Apply header style to a row.
 */
function styleHeader(row, bgColor = COLORS.headerBg, fgColor = COLORS.headerFg) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
    cell.font = { bold: true, color: { argb: fgColor }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  row.height = 32;
}

/**
 * Apply data row style.
 */
function styleDataRow(row, status, isAlt = false) {
  const bgMap = { PASS: COLORS.passGreen, FAIL: COLORS.failRed, SKIP: COLORS.skipYellow };
  const bg = bgMap[status] || (isAlt ? COLORS.altRow : COLORS.white);
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'CCCCCC' } },
      left: { style: 'thin', color: { argb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
      right: { style: 'thin', color: { argb: 'CCCCCC' } },
    };
  });
  row.height = 22;
}

/**
 * Generate the complete Excel report.
 *
 * @param {Array} suiteResults  - Array of { suiteName, category, screen, tests: [{name,status,duration,error,timestamp}] }
 * @param {string} outputDir    - Directory to save the file
 * @param {string} filename     - Excel filename
 */
async function generateReport(suiteResults, outputDir, filename) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SecureVault QA Suite';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ── SUMMARY SHEET ──────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: '00D4FF' } },
  });

  // Title row
  summarySheet.mergeCells('A1:J1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = '🔐 SecureVault – Selenium E2E Test Report';
  titleCell.font = { bold: true, size: 16, color: { argb: '1E2A4A' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '00D4FF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 44;

  // Meta info
  summarySheet.mergeCells('A2:J2');
  const metaCell = summarySheet.getCell('A2');
  metaCell.value = `Generated: ${new Date().toLocaleString()}  |  Tool: Selenium WebDriver + Mocha + Chai`;
  metaCell.font = { italic: true, size: 10, color: { argb: '555555' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(2).height = 20;

  summarySheet.addRow([]); // spacer

  // Column definitions
  summarySheet.columns = [
    { key: 'suite', width: 28 },
    { key: 'category', width: 24 },
    { key: 'screen', width: 22 },
    { key: 'total', width: 10 },
    { key: 'passed', width: 10 },
    { key: 'failed', width: 10 },
    { key: 'skipped', width: 10 },
    { key: 'passRate', width: 12 },
    { key: 'duration', width: 14 },
    { key: 'status', width: 12 },
  ];

  const summaryHeader = summarySheet.addRow([
    'Test Suite', 'Category', 'Screen / Module',
    'Total', 'Passed', 'Failed', 'Skipped',
    'Pass Rate %', 'Duration (ms)', 'Status',
  ]);
  styleHeader(summaryHeader);

  let grandTotal = 0, grandPassed = 0, grandFailed = 0, grandSkipped = 0, grandDuration = 0;

  suiteResults.forEach((suite, idx) => {
    const passed = suite.tests.filter((t) => t.status === 'PASS').length;
    const failed = suite.tests.filter((t) => t.status === 'FAIL').length;
    const skipped = suite.tests.filter((t) => t.status === 'SKIP').length;
    const total = suite.tests.length;
    const duration = suite.tests.reduce((s, t) => s + (t.duration || 0), 0);
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    const status = failed === 0 ? 'PASS' : 'FAIL';

    grandTotal += total;
    grandPassed += passed;
    grandFailed += failed;
    grandSkipped += skipped;
    grandDuration += duration;

    const row = summarySheet.addRow([
      suite.suiteName, suite.category, suite.screen,
      total, passed, failed, skipped,
      `${passRate}%`, duration, status,
    ]);
    styleDataRow(row, status, idx % 2 === 0);

    // Colour the status cell strongly
    const statusCell = row.getCell(10);
    statusCell.font = { bold: true, color: { argb: status === 'PASS' ? '155724' : '721C24' } };
  });

  summarySheet.addRow([]); // spacer
  const totalRow = summarySheet.addRow([
    'GRAND TOTAL', '', '',
    grandTotal, grandPassed, grandFailed, grandSkipped,
    grandTotal > 0 ? `${((grandPassed / grandTotal) * 100).toFixed(1)}%` : '0.0%',
    grandDuration,
    grandFailed === 0 ? '✅ ALL PASS' : '❌ HAS FAILURES',
  ]);
  styleHeader(totalRow, '1E2A4A', grandFailed === 0 ? '00FF88' : 'FF5050');

  // ── DETAILS SHEET ──────────────────────────────────────────────────────────
  const detailSheet = workbook.addWorksheet('Test Details', {
    properties: { tabColor: { argb: 'FF5050' } },
  });

  detailSheet.mergeCells('A1:I1');
  const dtTitle = detailSheet.getCell('A1');
  dtTitle.value = '🔐 SecureVault – Detailed Test Results';
  dtTitle.font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  dtTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E2A4A' } };
  dtTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  detailSheet.getRow(1).height = 36;
  detailSheet.addRow([]);

  detailSheet.columns = [
    { key: 'no', width: 6 },
    { key: 'name', width: 52 },
    { key: 'category', width: 22 },
    { key: 'screen', width: 22 },
    { key: 'status', width: 10 },
    { key: 'duration', width: 14 },
    { key: 'error', width: 48 },
    { key: 'suite', width: 24 },
    { key: 'timestamp', width: 22 },
  ];

  const detailHeader = detailSheet.addRow([
    '#', 'Test Name', 'Category', 'Screen / Module',
    'Status', 'Duration (ms)', 'Error Message', 'Suite', 'Timestamp',
  ]);
  styleHeader(detailHeader);

  let rowNo = 1;
  suiteResults.forEach((suite) => {
    suite.tests.forEach((test, idx) => {
      const row = detailSheet.addRow([
        rowNo++,
        test.name,
        suite.category,
        suite.screen,
        test.status,
        test.duration || 0,
        test.error || '',
        suite.suiteName,
        test.timestamp || new Date().toISOString(),
      ]);
      styleDataRow(row, test.status, idx % 2 === 0);

      const statusCell = row.getCell(5);
      statusCell.font = {
        bold: true,
        color: {
          argb:
            test.status === 'PASS' ? '155724'
            : test.status === 'FAIL' ? '721C24'
            : '856404',
        },
      };
    });
  });

  // ── SAVE ────────────────────────────────────────────────────────────────────
  const filepath = path.join(outputDir, filename);
  await workbook.xlsx.writeFile(filepath);
  console.log(`\n✅ Report saved: ${filepath}\n`);
  return filepath;
}

module.exports = { generateReport };
