import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('C:/Users/32259/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/');
const { marked } = require('marked');
const root = path.dirname(fileURLToPath(import.meta.url));
const files = [
  '00_从这里开始.md', '01_RMDB知识点与分层问答.md', '02_ITMS知识点与追问.md',
  '03_综合模拟与速记.md', '04_覆盖矩阵与学习记录.md', '05_技能与模板来源.md',
  '06_证据与口径边界.md',
];
// Normalize label spacing so CommonMark renders Chinese labels as bold consistently.
for (const filename of [...files, '01_RMDB证据索引.md', 'evidence/itms核查.md']) {
  const target = path.join(root, filename);
  if (!fs.existsSync(target)) continue;
  let md = fs.readFileSync(target, 'utf8').replaceAll('\r\n', '\n');
  md = md.replace(/\*\*([^*\n]+)\*\*(?=[^\s*])/g, '$& ')
    .replace(/([^\n])(\*\*(?:学习目标|必要概念|小例子|状态走查|常见误答|自测验收|源码依据|口述验收)[^*]*\*\*)/g, '$1\n\n$2')
    .replace(/([^\n])\n(\*\*)/g, '$1\n\n$2')
    .replace(/\]\(([A-Za-z]:\/)/g, '](/$1');
  fs.writeFileSync(target, md, 'utf8');
}
const combined = files.map(filename => {
  let inCode = false;
  return fs.readFileSync(path.join(root, filename), 'utf8').split('\n').map(line => {
    if (line.startsWith('```')) { inCode = !inCode; return line; }
    return !inCode && /^#{1,5} /.test(line) ? '#' + line : line;
  }).join('\n');
}).join('\n\n---\n\n');
fs.writeFileSync(path.join(root, '双项目面试学习总册.md'), '# RMDB 与智能交通面试学习总册\n\n汇编日期 2026-09-16。按知识点组织，配合一天学习路线与复测记录使用。\n\n' + combined, 'utf8');
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const nav = [];
const counts = { RMDB: 0, ITMS: 0, mock: 0 };
let sections = '';
for (const [di, filename] of files.entries()) {
  const md = fs.readFileSync(path.join(root, filename), 'utf8');
  const title = md.match(/^# (.+)$/m)?.[1] || filename;
  nav.push(`<a href="#doc-${di}">${esc(title)}</a>`);
  const tokens = marked.lexer(md);
  let chunks = [], chunk = null;
  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 1) continue;
    const q = token.type === 'heading' && /^([RTM]\d{2})(?:[｜\s]|$)/.exec(token.text);
    if (token.type === 'heading' && (token.depth === 2 || q)) {
      if (chunk) chunks.push(chunk);
      const qid = q?.[1];
      if (qid?.startsWith('R')) counts.RMDB++;
      if (qid?.startsWith('T')) counts.ITMS++;
      if (qid?.startsWith('M')) counts.mock++;
      chunk = { title: token.text, tokens: [], qid, id: qid || `d${di}s${chunks.length}` };
    } else {
      if (!chunk) chunk = { title: '阅读说明', tokens: [], id: `d${di}s-intro` };
      chunk.tokens.push(token);
    }
  }
  if (chunk) chunks.push(chunk);
  const body = chunks.map(c => {
    const content = marked.parser(c.tokens);
    return `<article id="${c.id}" data-project="${di}" data-kind="${c.qid || ''}"><details open><summary>${esc(c.title)}</summary><div class="cardbody">${content}</div></details></article>`;
  }).join('\n');
  sections += `<section id="doc-${di}" class="chapter"><h2>${esc(title)}</h2>${body}</section>`;
}
// Keep chapter navigation inside the combined edition. Source-file links remain usable locally.
sections = sections.replace(/href="([^"]+)"/g, (whole, raw) => {
  let href; try { href = decodeURI(raw); } catch { return whole; }
  const fi = files.indexOf(href.split('#')[0]);
  if (fi >= 0) return `href="#doc-${fi}"`;
  const local = href.replace(/^\/([A-Za-z]:\/)/, '$1');
  if (/^[A-Za-z]:\//.test(local)) {
    return `href="${pathToFileURL(local.replace(/:\d+$/, '')).href}" title="本机源码文件"`;
  }
  return whole;
});
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RMDB 与智能交通 一天面试学习手册</title>
<style>
:root{color-scheme:light;--ink:#20221f;--muted:#676d65;--line:#d9ded5;--paper:#f4f5ef;--accent:#315c43}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:115px}body{margin:0;color:var(--ink);background:var(--paper);font:16px/1.8 'Segoe UI','Microsoft YaHei',sans-serif}a{color:var(--accent);text-underline-offset:3px}header{padding:35px 4vw 24px;border-bottom:1px solid var(--line);background:#e9ede3}header p{margin:4px 0;color:var(--muted)}header .eyebrow{letter-spacing:.12em;font-size:12px;font-weight:700}h1{font-size:clamp(27px,3vw,42px);line-height:1.35;margin:9px 0}h2{font-size:27px;line-height:1.45;margin:32px 0 20px}h3{font-size:20px}.stats{font-size:14px;margin-top:16px}.toolbar{position:sticky;top:0;z-index:5;background:#fffef9ee;backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:12px 4vw;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.toolbar input{flex:1;min-width:200px;font:inherit;padding:8px 12px;border:1px solid #9fa99b;border-radius:6px}button,select{font:inherit;font-size:14px;min-height:40px;padding:7px 11px;background:#fff;border:1px solid #a9b2a4;border-radius:6px;color:var(--ink);cursor:pointer}button:hover{background:#edf1e8}#status{font-size:13px;color:var(--muted)}.layout{display:grid;grid-template-columns:260px minmax(0,960px);gap:32px;max-width:1360px;padding:25px 4vw 80px;margin:auto}nav{position:sticky;top:120px;align-self:start;max-height:calc(100vh - 140px);overflow:auto;font-size:14px}nav a{display:block;padding:9px 8px;margin:3px 0;border-left:2px solid var(--line);text-decoration:none}nav a:hover{border-color:var(--accent);background:#e8ede2}nav .note{padding:14px 8px;font-size:12px;color:var(--muted)}main{min-width:0}.chapter{margin-bottom:48px}article{margin-bottom:16px;background:#fffefb;border:1px solid var(--line);border-radius:8px;overflow:hidden}summary{padding:16px 21px;cursor:pointer;font-size:18px;font-weight:650;line-height:1.5;background:#f8f9f3}details[open]>summary{border-bottom:1px solid var(--line)}.cardbody{padding:5px 23px 18px;overflow-wrap:anywhere}.cardbody>p{margin:15px 0}table{display:block;max-width:100%;overflow-x:auto;border-collapse:collapse;font-size:14px;margin:20px 0}td,th{border:1px solid var(--line);padding:9px 12px;vertical-align:top;min-width:100px}th{background:#e7ecdf;text-align:left}tr:nth-child(even){background:#f8f9f3}blockquote{border-left:3px solid #71896e;background:#f1f4ec;margin:20px 0;padding:5px 20px}pre{padding:14px;background:#eef1e9;overflow:auto;border-radius:5px;font:13px/1.7 Consolas,monospace}code{font-family:Consolas,monospace;font-size:.91em;background:#eef1e9;padding:1px 4px}pre code{padding:0}li{margin:6px 0}[hidden]{display:none!important}footer{text-align:center;font-size:13px;color:var(--muted);padding:25px;border-top:1px solid var(--line)}#empty{padding:30px;background:white}a:focus-visible,summary:focus-visible,button:focus-visible{outline:3px solid #b69842;outline-offset:3px}
@media(max-width:900px){html{scroll-padding-top:180px}.layout{display:block;padding:16px 4vw 50px}nav{position:static;max-height:none;display:flex;flex-wrap:wrap;gap:4px;margin-bottom:22px}nav a{font-size:12px;padding:6px}.note{display:none}.toolbar{gap:6px}header{padding-top:22px}.cardbody{padding:4px 16px 15px}summary{padding:14px 16px}}
@media print{body{background:white;font-size:10pt}header{padding:0;background:white}.toolbar,nav,footer,#empty{display:none}.layout{display:block;max-width:none;padding:0}.chapter{break-before:page}.chapter:first-child{break-before:auto}article{border:0;border-radius:0;margin:12pt 0}summary{background:white;padding:5pt 0;font-size:14pt;break-after:avoid}.cardbody{padding:0}table{display:table;font-size:9pt}pre{white-space:pre-wrap}a{color:inherit;text-decoration:none}h2{font-size:20pt}}
</style></head><body>
<header><p class="eyebrow">2026 · 项目面试学习</p><h1>RMDB 与智能交通<br>一天掌握面试主线</h1><p>先学机制，再答主问，最后用追问检验理解。</p><div class="stats">${counts.RMDB} 个 RMDB 知识点 · ${counts.ITMS} 个智能交通知识点 · ${counts.mock} 组综合模拟 · 含答案与源码依据</div></header>
<div class="toolbar"><label for="search">查知识点</label><input id="search" placeholder="例如 pin、TTL、回滚、Compose" type="search"><select id="scope" aria-label="筛选章节"><option value="all">全部章节</option><option value="1">RMDB</option><option value="2">智能交通</option><option value="3">综合模拟</option></select><button id="fold">收起内容</button><button id="expand">展开内容</button><button id="print">打印</button><span id="status" aria-live="polite"></span></div>
<div class="layout"><nav aria-label="手册目录">${nav.join('')}<div class="note">第一次按路线阅读。复习时先收起内容，口述后再展开核对。分数和错误原句记入学习记录。</div></nav><main>${sections}<p id="empty" hidden>没有找到对应知识点，请换一个关键词或选择全部章节。</p></main></div>
<footer>依据当前简历与本地源码整理 · 测试方案与已验证结果分别记录</footer>
<script>
const cards=[...document.querySelectorAll('article')];
const search=document.getElementById('search'),scope=document.getElementById('scope');
cards.forEach(c=>c.dataset.search=c.textContent.toLocaleLowerCase());
function filter(){const q=search.value.trim().toLocaleLowerCase();let n=0;for(const c of cards){c.hidden=!((scope.value==='all'||c.dataset.project===scope.value)&&(!q||c.dataset.search.includes(q)));if(!c.hidden){n++;if(q)c.querySelector('details').open=true}}for(const s of document.querySelectorAll('.chapter'))s.hidden=![...s.querySelectorAll('article')].some(c=>!c.hidden);document.getElementById('empty').hidden=n>0;document.getElementById('status').textContent=n+' 个内容块'}
search.addEventListener('input',filter);scope.addEventListener('change',filter);
document.getElementById('fold').onclick=()=>cards.filter(c=>!c.hidden).forEach(c=>c.querySelector('details').open=false);
document.getElementById('expand').onclick=()=>cards.filter(c=>!c.hidden).forEach(c=>c.querySelector('details').open=true);
document.getElementById('print').onclick=()=>{cards.filter(c=>!c.hidden).forEach(c=>c.querySelector('details').open=true);window.print()};
function revealHash(){let el=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(!el)return;search.value='';scope.value='all';filter();let d=el.querySelector('details');if(d)d.open=true;el.scrollIntoView()}
window.addEventListener('hashchange',revealHash);filter();if(location.hash)revealHash();
</script></body></html>`;
fs.writeFileSync(path.join(root, '学习手册.html'), html, 'utf8');
console.log(JSON.stringify({ files: files.length, ...counts, bytes: Buffer.byteLength(html), output: path.join(root, '学习手册.html') }));
