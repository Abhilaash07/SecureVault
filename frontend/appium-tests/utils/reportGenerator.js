// frontend/appium-tests/utils/reportGenerator.js
'use strict';

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const COLORS = {
  headerBg: '1A1A2E',
  headerFg: '00D4FF',
  passGreen: 'D4EDDA',
  failRed: 'F8D7DA',
  skipYellow: 'FFF3CD',
  altRow: 'F0F4FF',
  white: 'FFFFFF',
};

function styleHeader(row, bg = COLORS.headerBg, fg = COLORS.headerFg) {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.font = { bold: true, color: { argb: fg }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  row.height = 30;
}

function styleDataRow(row, status, isAlt = false) {
  const bg = status === 'PASS' ? COLORS.passGreen : status === 'FAIL' ? COLORS.failRed : status === 'SKIP' ? COLORS.skipYellow : isAlt ? COLORS.altRow : COLORS.white;
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin', color: { argb: 'CCCCCC' } }, left: { style: 'thin', color: { argb: 'CCCCCC' } }, bottom: { style: 'thin', color: { argb: 'CCCCCC' } }, right: { style: 'thin', color: { argb: 'CCCCCC' } } };
  });
  row.height = 22;
}

async function generateReport(suiteResults, outputDir, filename) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SecureVault Appium QA Suite';
  workbook.created = new Date();

  // ── SUMMARY SHEET ──────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Summary', { properties: { tabColor: { argb: '00D4FF' } } });

  summarySheet.mergeCells('A1:J1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = '📱 SecureVault – Appium Mobile E2E Test Report';
  titleCell.font = { bold: true, size: 16, color: { argb: '1A1A2E' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '00D4FF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 44;

  summarySheet.mergeCells('A2:J2');
  summarySheet.getCell('A2').value = `Generated: ${new Date().toLocaleString()}  |  Tool: Appium + WebdriverIO + Mocha`;
  summarySheet.getCell('A2').font = { italic: true, size: 10, color: { argb: '666666' } };
  summarySheet.getCell('A2').alignment = { horizontal: 'center' };
  summarySheet.getRow(2).height = 20;
  summarySheet.addRow([]);

  summarySheet.columns = [
    { key: 'suite', width: 30 }, { key: 'category', width: 26 }, { key: 'screen', width: 22 },
    { key: 'total', width: 10 }, { key: 'passed', width: 10 }, { key: 'failed', width: 10 },
    { key: 'skipped', width: 10 }, { key: 'passRate', width: 12 }, { key: 'duration', width: 14 }, { key: 'status', width: 12 },
  ];

  const hRow = summarySheet.addRow(['Test Suite', 'Category', 'Screen / Module', 'Total', 'Passed', 'Failed', 'Skipped', 'Pass Rate %', 'Duration (ms)', 'Status']);
  styleHeader(hRow);

  let [grandTotal, grandPassed, grandFailed, grandSkipped, grandDuration] = [0, 0, 0, 0, 0];

  suiteResults.forEach((suite, idx) => {
    const passed = suite.tests.filter((t) => t.status === 'PASS').length;
    const failed = suite.tests.filter((t) => t.status === 'FAIL').length;
    const skipped = suite.tests.filter((t) => t.status === 'SKIP').length;
    const total = suite.tests.length;
    const duration = suite.tests.reduce((s, t) => s + (t.duration || 0), 0);
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    const overallStatus = failed === 0 ? 'PASS' : 'FAIL';
    grandTotal += total; grandPassed += passed; grandFailed += failed; grandSkipped += skipped; grandDuration += duration;
    const row = summarySheet.addRow([suite.suiteName, suite.category, suite.screen, total, passed, failed, skipped, `${passRate}%`, duration, overallStatus]);
    styleDataRow(row, overallStatus, idx % 2 === 0);
    row.getCell(10).font = { bold: true, color: { argb: overallStatus === 'PASS' ? '155724' : '721C24' } };
  });

  summarySheet.addRow([]);
  const totalRow = summarySheet.addRow(['GRAND TOTAL', '', '', grandTotal, grandPassed, grandFailed, grandSkipped, grandTotal > 0 ? `${((grandPassed / grandTotal) * 100).toFixed(1)}%` : '0%', grandDuration, grandFailed === 0 ? '✅ ALL PASS' : '❌ HAS FAILURES']);
  styleHeader(totalRow, '1A1A2E', grandFailed === 0 ? '00FF88' : 'FF5050');

  // ── DETAILS SHEET ──────────────────────────────────────────────────────────
  const detailSheet = workbook.addWorksheet('Test Details', { properties: { tabColor: { argb: 'FF5050' } } });
  detailSheet.mergeCells('A1:I1');
  detailSheet.getCell('A1').value = '📱 SecureVault – Appium Detailed Test Results';
  detailSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  detailSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A2E' } };
  detailSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  detailSheet.getRow(1).height = 36;
  detailSheet.addRow([]);

  detailSheet.columns = [
    { key: 'no', width: 6 }, { key: 'name', width: 54 }, { key: 'category', width: 24 },
    { key: 'screen', width: 22 }, { key: 'status', width: 10 }, { key: 'duration', width: 14 },
    { key: 'error', width: 50 }, { key: 'suite', width: 26 }, { key: 'timestamp', width: 22 },
  ];

  const dHeader = detailSheet.addRow(['#', 'Test Name', 'Category', 'Screen / Module', 'Status', 'Duration (ms)', 'Error Message', 'Suite', 'Timestamp']);
  styleHeader(dHeader);

  let rowNo = 1;
  suiteResults.forEach((suite) => {
    suite.tests.forEach((test, idx) => {
      const row = detailSheet.addRow([rowNo++, test.name, suite.category, suite.screen, test.status, test.duration || 0, test.error || '', suite.suiteName, test.timestamp || new Date().toISOString()]);
      styleDataRow(row, test.status, idx % 2 === 0);
      row.getCell(5).font = { bold: true, color: { argb: test.status === 'PASS' ? '155724' : test.status === 'FAIL' ? '721C24' : '856404' } };
    });
  });

  const filepath = path.join(outputDir, filename);
  try {
    await workbook.xlsx.writeFile(filepath);
    console.log(`\n✅ Appium Report saved: ${filepath}\n`);
    return filepath;
  } catch (err) {
    if (err.code === 'EBUSY') {
      const fallbackPath = path.join(outputDir, `appium-test-report-${Date.now()}.xlsx`);
      await workbook.xlsx.writeFile(fallbackPath);
      console.log(`\n⚠️ Original file was locked in Excel. Saved new report to:\n   ${fallbackPath}\n`);
      return fallbackPath;
    }
    throw err;
  }
}

module.exports = { generateReport };
