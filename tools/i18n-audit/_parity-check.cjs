const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', '..');
const ko = fs.readFileSync(path.join(root, 'src/i18n/locales/ko.ts'), 'utf8');
const en = fs.readFileSync(path.join(root, 'src/i18n/locales/en.ts'), 'utf8');

function parseDict(src) {
  const out = new Map();
  const re = /['"]([a-zA-Z0-9_.]+)['"]\s*:\s*((?:'[^']*'|"[^"]*"|`[^`]*`))/g;
  let m;
  while ((m = re.exec(src))) {
    let v = m[2];
    if (v.startsWith('`')) v = v.slice(1, -1);
    else v = v.slice(1, -1);
    out.set(m[1], v);
  }
  return out;
}

function paramsOf(v) {
  return [...v.matchAll(/\{(\w+)\}/g)].map((x) => x[1]).sort();
}

const K = parseDict(ko);
const E = parseDict(en);
const onlyK = [...K.keys()].filter((k) => !E.has(k)).sort();
const onlyE = [...E.keys()].filter((k) => !K.has(k) && !k.startsWith('skill.')).sort();
const mism = [];
for (const k of K.keys()) {
  if (!E.has(k)) continue;
  const a = paramsOf(K.get(k)).join(',');
  const b = paramsOf(E.get(k)).join(',');
  if (a !== b) mism.push({ k, ko: a, en: b });
}
const enHangul = [...E.entries()].filter(([, v]) => /[가-힣]/.test(v)).map(([k, v]) => ({ k, v: v.slice(0, 80) }));
console.log(JSON.stringify({ ko: K.size, en: E.size, onlyKo: onlyK, onlyEn: onlyE, paramMism: mism, enHangul }, null, 2));
