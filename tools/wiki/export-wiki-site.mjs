// 게임소개 위키 → 독립 배포 폴더 (GitHub 저장소·Pages 용)
// node tools/wiki/export-wiki-site.mjs [출력폴더=D:\arcfire-wiki]
// 위키는 저장소 안에서 ../assets/images/... 를 가리킨다. 배포본은 쓰는 이미지만 img/ 로 복사하고 경로를 바꾼다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(ROOT, '게임소개페이지');
const OUT = path.resolve(process.argv[2] || 'D:\\arcfire-wiki');
const PREFIX = '../assets/images/';
const IMG_DIR = 'img/';

const used = new Set();
const rewrite = (text) => text.replace(/\.\.\/assets\/images\/([^"'\s)]+)/g, (_, rel) => {
  used.add(rel);
  return `${IMG_DIR}${rel}`;
});

/** 공개 배포본 — 페이지 하단 「정본:」 줄(내부 문서·코드 경로)을 뺀다 (2026-10-05 대표님 지시) */
let strippedNotes = 0;
function stripSourceNotes(html) {
  return html.replace(/[ \t]*<div class="source-note">[\s\S]*?<\/div>[ \t]*\r?\n?/g, () => {
    strippedNotes += 1;
    return '';
  });
}

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (e.isDirectory()) copyTree(a, b);
    else if (/\.html$/i.test(e.name)) fs.writeFileSync(b, rewrite(stripSourceNotes(fs.readFileSync(a, 'utf8'))), 'utf8');
    else if (/\.(js|css)$/i.test(e.name)) fs.writeFileSync(b, rewrite(fs.readFileSync(a, 'utf8')), 'utf8');
    else fs.copyFileSync(a, b);
  }
}

// 배포 폴더의 .git 은 보존하고 나머지만 교체
fs.mkdirSync(OUT, { recursive: true });
for (const e of fs.readdirSync(OUT)) {
  if (e === '.git') continue;
  fs.rmSync(path.join(OUT, e), { recursive: true, force: true });
}
copyTree(SRC, OUT);

let bytes = 0;
let missing = 0;
for (const rel of used) {
  const from = path.join(ROOT, 'assets', 'images', rel);
  if (!fs.existsSync(from)) { missing += 1; continue; }
  const to = path.join(OUT, IMG_DIR, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  bytes += fs.statSync(from).size;
}
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, 'README.md'), [
  '# 아크파이어 위키',
  '',
  '게임 소개 위키 정적 사이트. `index.html`부터 연다.',
  '',
  `원본: 게임 저장소 \`게임소개페이지/\` · 생성 \`tools/wiki/export-wiki-site.mjs\` · ${new Date().toISOString().slice(0, 10)}`,
  '',
].join('\n'), 'utf8');
console.log(`out=${OUT} images=${used.size} copiedMB=${(bytes / 1048576).toFixed(1)} missing=${missing} sourceNotesStripped=${strippedNotes}`);
