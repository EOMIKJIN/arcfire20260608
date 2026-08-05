#!/usr/bin/env node
/**
 * Full i18n rescan — dict parity + used-key coverage + hangul residual class.
 * node tools/i18n-audit/_full-rescan.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const HANGUL = /[\uAC00-\uD7A3]/;

function parseDict(src) {
  const out = new Map();
  const re = /['"]([a-zA-Z0-9_.\uAC00-\uD7A3]+)['"]\s*:\s*((?:'[^']*'|"[^"]*"|`[^`]*`))/g;
  let m;
  while ((m = re.exec(src))) {
    let v = m[2];
    v = v.startsWith('`') ? v.slice(1, -1) : v.slice(1, -1);
    out.set(m[1], v);
  }
  return out;
}

function paramsOf(v) {
  return [...String(v).matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort();
}

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'generated') continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(full);
  }
}

const koSrc = fs.readFileSync(path.join(ROOT, 'src/i18n/locales/ko.ts'), 'utf8');
const enSrc = fs.readFileSync(path.join(ROOT, 'src/i18n/locales/en.ts'), 'utf8');
const K = parseDict(koSrc);
const E = parseDict(enSrc);

const onlyKo = [...K.keys()].filter((k) => !E.has(k)).sort();
const onlyEn = [...E.keys()].filter((k) => !K.has(k) && !k.startsWith('skill.')).sort();
const paramMism = [];
for (const k of K.keys()) {
  if (!E.has(k)) continue;
  const a = paramsOf(K.get(k)).join(',');
  const b = paramsOf(E.get(k)).join(',');
  if (a !== b) paramMism.push({ k, ko: a, en: b });
}
const enHangul = [...E.entries()]
  .filter(([, v]) => HANGUL.test(v))
  .map(([k, v]) => ({ k, v: v.slice(0, 80) }));

const used = new Set();
const dynamic = [];
const files = [];
walk(path.join(ROOT, 'src'), files);
walk(path.join(ROOT, 'app'), files);

const litRe = /\b(?:t|translate)\(\s*(?:[a-zA-Z_$][\w$]*\s*,\s*)?['"]([a-zA-Z0-9_.]+)['"]/g;
const dynRe = /\b(?:t|translate)\(\s*(?:[a-zA-Z_$][\w$]*\s*,\s*)?`([^`$]*\$\{)/g;

for (const f of files) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (rel.includes('/i18n/locales/') || rel.includes('/data/generated/')) continue;
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = litRe.exec(src))) used.add(m[1]);
  while ((m = dynRe.exec(src))) dynamic.push({ file: rel, sample: m[0].slice(0, 60) });
}

const missingKo = [...used].filter((k) => !K.has(k)).sort();
const missingEn = [...used].filter((k) => !E.has(k) && !k.startsWith('skill.')).sort();

// orphan dictionary keys (not referenced as literal — noisy for dynamic prefixes)
const prefixHints = [
  'noticeTag.',
  'battleStance.',
  'equip.stat.',
  'mineralStat.',
  'news.',
  'planetDev.',
  'dialog.',
  'backup.',
  'common.',
];

console.log(
  JSON.stringify(
    {
      dict: { ko: K.size, en: E.size, onlyKo, onlyEn, paramMism, enHangul },
      usage: {
        literalKeys: used.size,
        missingKo: missingKo.slice(0, 80),
        missingEn: missingEn.slice(0, 80),
        missingKoCount: missingKo.length,
        missingEnCount: missingEn.length,
        dynamicSamples: dynamic.slice(0, 40),
      },
    },
    null,
    2,
  ),
);
