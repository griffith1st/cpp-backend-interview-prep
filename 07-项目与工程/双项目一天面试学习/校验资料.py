"""Validate the authored study pack, not the underlying project behavior."""
from pathlib import Path
from collections import Counter
from urllib.parse import unquote
import re
import json
import hashlib

root = Path(__file__).resolve().parent
main_names = [
    '00_从这里开始.md', '01_RMDB知识点与分层问答.md', '02_ITMS知识点与追问.md',
    '03_综合模拟与速记.md', '04_覆盖矩阵与学习记录.md', '05_技能与模板来源.md',
    '06_证据与口径边界.md',
]
errors = []
stats = {}
for name, prefix, total in [(main_names[1], 'R', 28), (main_names[2], 'T', 24)]:
    text = (root / name).read_text(encoding='utf-8')
    heads = list(re.finditer(r'^#{2,3} (' + prefix + r'\d{2})[^\n]*', text, re.M))
    ids = [m[1] for m in heads]
    expected = [f'{prefix}{i:02d}' for i in range(1, total + 1)]
    if ids != expected:
        errors.append(f'{name}: IDs {ids} do not match {expected}')
    fields = ['简历锚点', '学习目标', '必要概念', r'主问|主问题', r'60\s*秒',
              '常见误答', r'自测验收|口述验收', '源码依据', r'小例子|状态走查']
    for i, m in enumerate(heads):
        block = text[m.start():heads[i+1].start() if i+1 < len(heads) else len(text)]
        for field in fields:
            if not re.search(field, block): errors.append(f'{m[1]}: missing {field}')
        for n in range(1, 4):
            if not re.search(r'追问\s*' + str(n) + r'.*?答', block):
                errors.append(f'{m[1]}: missing followup {n} or its answer')
    stats[prefix] = {'cards': len(heads), 'P0': sum('P0' in h[0] for h in heads),
                     'P1': sum('P1' in h[0] for h in heads),
                     'followups': len(re.findall(r'\*\*追问\s*[123]', text))}

mock = (root / main_names[3]).read_text(encoding='utf-8')
stats['mock'] = {'cards': len(re.findall(r'^### M\d{2}', mock, re.M)),
                 'followups': len(re.findall(r'\*\*追问[一二]', mock))}
if stats['mock'] != {'cards': 10, 'followups': 20}: errors.append('Mock count mismatch')

local_count = 0
external_count = 0
source_hashes = {}
checked_docs = sorted(set(root.glob('*.md')) | set((root / 'evidence').glob('*.md')))
checked_docs = [p for p in checked_docs if p.name not in {'双项目面试学习总册.md', '质量校验报告.md'}]
for doc in checked_docs:
    text = doc.read_text(encoding='utf-8')
    if '\ufffd' in text: errors.append(f'{doc.name}: replacement glyph')
    if text.count('```') % 2: errors.append(f'{doc.name}: unmatched code fence')
    for raw in re.findall(r'\[[^\]\n]+\]\(([^)\n]+)\)', text):
        target = unquote(raw.strip('<>'))
        if re.match(r'https?://', target):
            external_count += 1
            continue
        if target.startswith('#'): continue
        target = target.split('#')[0]
        lineno = None
        match = re.search(r':(\d+)$', target)
        if match: lineno, target = int(match[1]), target[:match.start()]
        target = re.sub(r'^/([A-Za-z]:/)', r'\1', target)
        file = Path(target) if re.match(r'[A-Za-z]:/', target) else doc.parent / target
        local_count += 1
        if file.is_dir():
            continue
        if not file.is_file():
            errors.append(f'{doc.name}: missing linked file {target}')
            continue
        if lineno is not None and file.suffix.lower() not in {'.docx', '.pdf'}:
            line_count = len(file.read_text(encoding='utf-8', errors='replace').splitlines())
            if not 1 <= lineno <= line_count:
                errors.append(f'{doc.name}: line {lineno} outside {target} ({line_count})')
        # Hash only cited project-source files; never include their contents or credential values.
        if 'git_compare/rmdb/' in file.as_posix() or 'source_repos/itms-bd/' in file.as_posix():
            source_hashes[file.as_posix()] = hashlib.sha256(file.read_bytes()).hexdigest()

report = {'scope': 'learning document structure and local reference integrity only',
          'counts': stats, 'local_links_checked': local_count,
          'external_links_listed_not_network_checked': external_count,
          'source_files_hashed': len(source_hashes), 'errors': errors}
(root / 'evidence' / '资料校验.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
(root / 'evidence' / '源码引用指纹.json').write_text(json.dumps(source_hashes, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(bool(errors))
