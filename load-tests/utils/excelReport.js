// load-tests/utils/excelReport.js
'use strict';

/**
 * Generates an Excel report from k6 JSON output.
 * Sheet 1: Summary – key metrics at a glance
 * Sheet 2: Raw Details – per-metric breakdown
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

function styleHeader(row, bg = '1A1A2E', fg = '00D4FF') {
  row.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    c.font = { bold: true, color: { argb: fg }, size: 11 };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} };
  });
  row.height = 30;
}

function styleDataRow(row, isAlt = false) {
  row.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAlt ? 'F0F4FF' : 'FFFFFF' } };
    c.alignment = { vertical: 'middle', wrapText: true };
    c.border = { top:{style:'thin',color:{argb:'CCCCCC'}}, left:{style:'thin',color:{argb:'CCCCCC'}}, bottom:{style:'thin',color:{argb:'CCCCCC'}}, right:{style:'thin',color:{argb:'CCCCCC'}} };
  });
  row.height = 22;
}

async function generateLoadReport(k6Data, outputDir, filename) {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SecureVault Load Test Suite';
  workbook.created = new Date();

  const m = k6Data.metrics || {};
  const state = k6Data.state || {};

  const dur = m.http_req_duration || { values: {} };
  const reqs = m.http_reqs || { values: { count: 0 } };
  const failed = m.http_req_failed || { values: { rate: 0 } };
  const errRate = m.error_rate || { values: { rate: 0 } };
  const vus = m.vus_max || { values: { max: 0 } };
  const dataSent = m.data_sent || { values: { count: 0 } };
  const dataRecv = m.data_received || { values: { count: 0 } };

  const testDurationSec = (state.testRunDurationMs || 60000) / 1000;
  const rps = reqs.values.count > 0 ? (reqs.values.count / testDurationSec).toFixed(2) : 'N/A';

  // ── SUMMARY SHEET ─────────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Summary', { properties: { tabColor: { argb: '00D4FF' } } });

  // Title
  summarySheet.mergeCells('A1:D1');
  const title = summarySheet.getCell('A1');
  title.value = '⚡ SecureVault – Load Test Report';
  title.font = { bold: true, size: 18, color: { argb: 'FFFFFF' } };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0A0D1A' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  summarySheet.getRow(1).height = 50;

  // Meta
  summarySheet.mergeCells('A2:D2');
  summarySheet.getCell('A2').value = `Generated: ${new Date().toLocaleString()}  |  Tool: k6 Load Testing Framework`;
  summarySheet.getCell('A2').font = { italic: true, size: 10, color: { argb: '555555' } };
  summarySheet.getCell('A2').alignment = { horizontal: 'center' };
  summarySheet.getRow(2).height = 20;
  summarySheet.addRow([]);

  summarySheet.columns = [
    { key: 'metric', width: 32 },
    { key: 'value',  width: 22 },
    { key: 'target', width: 22 },
    { key: 'status', width: 16 },
  ];

  const hRow = summarySheet.addRow(['Metric', 'Value', 'Threshold / Target', 'Status']);
  styleHeader(hRow);

  const avgDur = (dur.values?.avg || 0);
  const minDur = (dur.values?.min || 0);
  const maxDur = (dur.values?.max || 0);
  const p50 = (dur.values?.['p(50)'] || 0);
  const p90 = (dur.values?.['p(90)'] || 0);
  const p95 = (dur.values?.['p(95)'] || 0);
  const p99 = (dur.values?.['p(99)'] || 0);
  const errRateVal = ((errRate.values?.rate || 0) * 100).toFixed(2);
  const failRateVal = ((failed.values?.rate || 0) * 100).toFixed(2);

  const summaryRows = [
    { metric: '🎯 Test Scenario',          value: 'Baseline – 300 VUs × 60s',     target: '300 concurrent users',    status: 'INFO' },
    { metric: '⏱  Test Duration (s)',       value: `${testDurationSec.toFixed(0)}s`,target: '60 seconds',              status: 'INFO' },
    { metric: '👥 Max Virtual Users (VUs)', value: String(vus.values?.max || 300),  target: '300',                     status: vus.values?.max >= 300 ? 'PASS' : 'WARN' },
    { metric: '📤 Total Requests',          value: String(reqs.values.count || 0),  target: '>1000',                   status: reqs.values.count > 1000 ? 'PASS' : 'WARN' },
    { metric: '🚀 Requests Per Second',     value: `${rps} req/sec`,               target: '>10 req/sec',             status: parseFloat(rps) > 10 ? 'PASS' : 'WARN' },
    { metric: '⚡ Avg Response Time',       value: `${avgDur.toFixed(1)}ms`,        target: '<500ms',                  status: avgDur < 500 ? 'PASS' : avgDur < 2000 ? 'WARN' : 'FAIL' },
    { metric: '🟢 Min Response Time',       value: `${minDur.toFixed(1)}ms`,        target: 'Informational',           status: 'INFO' },
    { metric: '🔴 Max Response Time',       value: `${maxDur.toFixed(1)}ms`,        target: '<10,000ms',               status: maxDur < 10000 ? 'PASS' : 'FAIL' },
    { metric: '📊 Median (P50)',            value: `${p50.toFixed(1)}ms`,           target: '<500ms',                  status: p50 < 500 ? 'PASS' : 'WARN' },
    { metric: '📈 P90 Response Time',       value: `${p90.toFixed(1)}ms`,           target: '<1000ms',                 status: p90 < 1000 ? 'PASS' : 'WARN' },
    { metric: '📈 P95 Response Time',       value: `${p95.toFixed(1)}ms`,           target: '<2000ms (k6 threshold)',   status: p95 < 2000 ? 'PASS' : 'FAIL' },
    { metric: '📈 P99 Response Time',       value: `${p99.toFixed(1)}ms`,           target: '<5000ms (k6 threshold)',   status: p99 < 5000 ? 'PASS' : 'FAIL' },
    { metric: '❌ HTTP Error Rate',         value: `${errRateVal}%`,               target: '<5% (k6 threshold)',       status: parseFloat(errRateVal) < 5 ? 'PASS' : 'FAIL' },
    { metric: '🚫 HTTP Failed Rate',        value: `${failRateVal}%`,              target: '<5% (k6 threshold)',       status: parseFloat(failRateVal) < 5 ? 'PASS' : 'FAIL' },
    { metric: '📤 Data Sent (bytes)',       value: formatBytes(dataSent.values?.count || 0), target: 'Informational', status: 'INFO' },
    { metric: '📥 Data Received (bytes)',   value: formatBytes(dataRecv.values?.count || 0), target: 'Informational', status: 'INFO' },
  ];

  summaryRows.forEach((r, idx) => {
    const row = summarySheet.addRow([r.metric, r.value, r.target, r.status]);
    styleDataRow(row, idx % 2 === 0);
    const statusCell = row.getCell(4);
    statusCell.font = {
      bold: true,
      color: {
        argb: r.status === 'PASS' ? '155724' : r.status === 'FAIL' ? '721C24' : r.status === 'WARN' ? '856404' : '0A1628',
      },
    };
  });

  // ── DETAILS SHEET ─────────────────────────────────────────────────────────
  const detailSheet = workbook.addWorksheet('Raw Metrics', { properties: { tabColor: { argb: 'FF5050' } } });
  detailSheet.mergeCells('A1:E1');
  detailSheet.getCell('A1').value = '⚡ SecureVault – k6 Raw Metric Details';
  detailSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFF' } };
  detailSheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A2E' } };
  detailSheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  detailSheet.getRow(1).height = 36;
  detailSheet.addRow([]);

  detailSheet.columns = [
    { key: 'metricName', width: 36 },
    { key: 'type',       width: 14 },
    { key: 'count',      width: 14 },
    { key: 'rate',       width: 14 },
    { key: 'avg',        width: 14 },
    { key: 'min',        width: 14 },
    { key: 'med',        width: 14 },
    { key: 'max',        width: 14 },
    { key: 'p90',        width: 14 },
    { key: 'p95',        width: 14 },
    { key: 'p99',        width: 14 },
  ];

  const dHeader = detailSheet.addRow(['Metric Name', 'Type', 'Count / Passes', 'Rate / Fails', 'Avg', 'Min', 'Median', 'Max', 'P90', 'P95', 'P99']);
  styleHeader(dHeader);

  let rowIdx = 0;
  Object.entries(k6Data.metrics || {}).forEach(([name, metric]) => {
    const v = metric.values || {};
    const row = detailSheet.addRow([
      name,
      metric.type || '',
      v.count ?? v.passes ?? '',
      v.rate != null ? (v.rate * 100).toFixed(2) + '%' : v.fails ?? '',
      v.avg != null ? v.avg.toFixed(2) : '',
      v.min != null ? v.min.toFixed(2) : '',
      v['p(50)'] != null ? v['p(50)'].toFixed(2) : v.med != null ? v.med.toFixed(2) : '',
      v.max != null ? v.max.toFixed(2) : '',
      v['p(90)'] != null ? v['p(90)'].toFixed(2) : '',
      v['p(95)'] != null ? v['p(95)'].toFixed(2) : '',
      v['p(99)'] != null ? v['p(99)'].toFixed(2) : '',
    ]);
    styleDataRow(row, rowIdx++ % 2 === 0);
  });

  // Save
  const filepath = path.join(outputDir, filename);
  await workbook.xlsx.writeFile(filepath);
  console.log(`\n✅ Load Test Excel Report saved: ${filepath}`);
  return filepath;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

module.exports = { generateLoadReport };
