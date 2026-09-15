import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/32259/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/');
const { chromium } = require('playwright');
const out = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const failures = [];
  page.on('pageerror', e => failures.push(e.message));
  await page.goto('http://127.0.0.1:8765/学习手册.html');
  await page.getByRole('heading', { name: 'RMDB 与智能交通 一天掌握面试主线', exact: true }).waitFor();
  const counts = await page.locator('article[data-kind]').evaluateAll(els => ({
    R: els.filter(e => /^R\d/.test(e.dataset.kind)).length,
    T: els.filter(e => /^T\d/.test(e.dataset.kind)).length,
    M: els.filter(e => /^M\d/.test(e.dataset.kind)).length,
  }));
  if (JSON.stringify(counts) !== JSON.stringify({R:28,T:24,M:10})) failures.push('Card counts mismatch');
  await page.screenshot({ path: path.join(out, '阅读页面_桌面.png') });
  await page.getByLabel('查知识点', { exact: true }).fill('INCR');
  if (!(await page.locator('#T10').isVisible())) failures.push('INCR search failed');
  await page.getByLabel('筛选章节').selectOption('2');
  if (await page.locator('article[data-project="1"]:visible').count()) failures.push('Scope filter failed');
  await page.getByRole('button', { name: '收起内容', exact: true }).click();
  if (await page.locator('article:visible details[open]').count()) failures.push('Collapse failed');
  await page.getByRole('button', { name: '展开内容', exact: true }).click();
  if (!(await page.locator('#T10 details').getAttribute('open') !== null)) failures.push('Expand failed');
  await page.getByLabel('查知识点', { exact: true }).fill('不存在的检索词987');
  if (!(await page.locator('#empty').isVisible())) failures.push('No-result state failed');
  await page.getByLabel('查知识点', { exact: true }).fill('');
  await page.getByLabel('筛选章节').selectOption('all');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:8765/学习手册.html#T16');
  await page.screenshot({ path: path.join(out, '阅读页面_窄屏.png') });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  if (overflow) failures.push('Page overflows narrow viewport');
  const report = { counts, search: true, scope: true, collapse_expand: true, no_results: true, narrow_page_overflow: overflow, failures };
  fs.writeFileSync(path.join(out, '阅读页面校验.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (failures.length) process.exitCode = 1;
} finally { await browser.close(); }
