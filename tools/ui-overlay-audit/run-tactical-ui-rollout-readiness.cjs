#!/usr/bin/env node
/**
 * Tactical UI 전면 교체 준비 — 리스크·레거시·마이그레이션 갭 정적 감사
 * npm run audit:ui-overlay:tactical-readiness
 *
 * FAIL = 전면 교체 착수 전 반드시 해소
 * WARN = kind 전환 시 Content 별 수동 QA·패치 필요
 * INFO = 현황 스냅샷
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OVERLAY_ROOT = path.join(ROOT, 'src/ui/overlay');
const CONTENT_DIR = path.join(OVERLAY_ROOT, 'content');
const REPORT_DIR = path.join(__dirname, 'reports');

const FAIL = [];
const WARN = [];
const INFO = [];

function read(rel) {
  const full = path.join(ROOT, rel.replace(/\//g, path.sep));
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : '';
}

function walkTs(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walkTs(full, out);
      continue;
    }
    if (/\.(tsx|ts)$/.test(name)) out.push(full);
  }
  return out;
}

function rel(full) {
  return path.relative(ROOT, full).replace(/\\/g, '/');
}

// ── 1. 레거시 bypass / 이중 호스트 ──
const legacyModalFiles = [
  'src/components/LevelUpModal.tsx',
  'src/components/RewardModal.tsx',
];
for (const f of legacyModalFiles) {
  if (fs.existsSync(path.join(ROOT, f))) {
    WARN.push({
      id: 'legacy-modal-bypass',
      file: f,
      note: 'ArcOverlayHost 우회 가능 — 전면 교체 전 삭제 또는 @deprecated 유지 + import 0 확인',
    });
  }
}

const legacyHost = read('src/ui/overlay/ArcMessageModalHost.tsx');
if (legacyHost.includes('ArcOverlayHost')) {
  INFO.push('ArcMessageModalHost → ArcOverlayHost alias 유지 (OK)');
}

// ── 2. phosphor deprecated card shell 잔존 import ──
const deprecatedPhosphorKeys = [
  'phosphorOverlay.cardShell',
  'phosphorOverlay.cardBody',
  'phosphorOverlay.cardBodyFill',
  'phosphorOverlay.cardBodyLg',
  'phosphorOverlay.card,',
  'phosphorOverlay.card ',
];
for (const file of walkTs(CONTENT_DIR)) {
  const text = fs.readFileSync(file, 'utf8');
  for (const key of deprecatedPhosphorKeys) {
    if (text.includes(key)) {
      FAIL.push({
        id: 'deprecated-phosphor-card-shell',
        file: rel(file),
        note: `${key} 사용 — ArcOverlayCard 로 통합 후 제거`,
      });
    }
  }
}

// ── 3. RN Modal (overlay 외) ──
function walkModal(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'tools') continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walkModal(full);
      continue;
    }
    if (!/\.(tsx|ts)$/.test(name)) continue;
    const r = rel(full);
    if (r.includes('src/ui/overlay/')) continue;
    const text = fs.readFileSync(full, 'utf8');
    if (/\bModal\b/.test(text) && /from ['"]react-native['"]/.test(text) && /<Modal[\s>]/.test(text)) {
      FAIL.push({ id: 'rn-modal', file: r, note: 'RN Modal — ArcOverlayHost kind 사용' });
    }
  }
}
walkModal(path.join(ROOT, 'src'));
walkModal(path.join(ROOT, 'app'));

// ── 4. Content kind 별 visualTheme 전파 (tactical 준비) ──
const OVERLAY_KINDS = [
  { kind: 'planetEconomyInfo', file: 'src/ui/overlay/content/PlanetEconomyInfoOverlayContent.tsx', required: true },
  { kind: 'planetDevelopment', file: 'src/ui/overlay/content/PlanetDevelopmentOverlayContent.tsx', required: false },
  { kind: 'settings', file: 'src/ui/overlay/content/SettingsOverlayContent.tsx', required: false },
  { kind: 'bmShop', file: 'src/ui/overlay/content/BmShopOverlayContent.tsx', required: false },
  { kind: 'tradeQuantity', file: 'src/ui/overlay/content/TradeQuantityOverlayContent.tsx', required: false },
  { kind: 'alert', file: 'src/ui/overlay/content/AlertOverlayContent.tsx', required: false },
  { kind: 'levelUp', file: 'src/ui/overlay/content/LevelUpOverlayContent.tsx', required: false },
  { kind: 'reward', file: 'src/ui/overlay/content/RewardOverlayContent.tsx', required: false },
  { kind: 'waveResult', file: 'src/ui/overlay/content/WaveResultOverlayContent.tsx', required: false },
];

const rolloutText = read('src/ui/overlay/tacticalOverlayRollout.ts');
for (const { kind, file, required } of OVERLAY_KINDS) {
  const text = read(file);
  if (!text) continue;
  const flagOn = new RegExp(`${kind}:\\s*true`).test(rolloutText);
  const hasVisualTheme = /visualTheme/.test(text) || /resolveArcOverlayVisualTheme/.test(text);
  const passesShell =
    /HeavyUiOverlayShell/.test(text) || /ArcOverlayCard/.test(text);

  if (flagOn && !hasVisualTheme) {
    FAIL.push({
      id: 'tactical-flag-without-visualTheme',
      file,
      note: `kind ${kind} 플래그 ON 이지만 visualTheme 미전파`,
    });
  }
  if (flagOn && !passesShell) {
    WARN.push({ id: 'tactical-no-shell', file, note: `${kind} — 셸 경로 확인 필요` });
  }
  if (!flagOn && required === false && !hasVisualTheme && passesShell) {
    INFO.push(`pending migration: ${kind} (${file}) — phosphor only, visualTheme 미연결`);
  }
}

// ── 5. tactical ON 시 알려진 혼합 토큰 갭 ──
const knownGaps = [
  {
    file: 'src/ui/overlay/content/PlanetInfoPortraitSlot.tsx',
    note: 'tactical bleed 슬롯 — phosphor border/bg 하드코딩 (전환 시 visualTheme 필요)',
  },
  {
    file: 'src/ui/heavyUiDataSession/HeavyUiOverlayShell.tsx',
    note: 'loading/error — phosphorAccent 고정 (tactical kind 확대 시 수정)',
  },
  {
    file: 'src/ui/overlay/ArcOverlayCard.tsx',
    note: 'tactical = phosphor base + override merge — 전면 교체 시 exclusive style set 검토',
  },
  {
    file: 'src/ui/overlay/ArcOverlayTitleHeader.tsx',
    note: 'subtitle 색 — tactical 전용 토큰 미분리',
  },
];
for (const g of knownGaps) {
  WARN.push({ id: 'known-theme-gap', file: g.file, note: g.note });
}

// ── 6. 중복 카드 셸 (동일 Content 내 ArcOverlayCard 2회 이상 JSX) ──
for (const file of walkTs(CONTENT_DIR)) {
  const text = fs.readFileSync(file, 'utf8');
  const matches = text.match(/<ArcOverlayCard[\s>]/g);
  if (matches && matches.length > 1) {
    WARN.push({
      id: 'multi-card-in-content',
      file: rel(file),
      note: `ArcOverlayCard ${matches.length}회 — loading/ready 분기 중복 렌더 회귀 주의`,
    });
  }
}

// ── 7. HeavyUiOverlayShell visualTheme 미전달 ──
const heavyUiCallers = walkTs(path.join(ROOT, 'src')).filter((f) => {
  const t = fs.readFileSync(f, 'utf8');
  return t.includes('HeavyUiOverlayShell') && !f.includes('HeavyUiOverlayShell.tsx');
});
for (const file of heavyUiCallers) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('visualTheme')) {
    WARN.push({
      id: 'heavy-ui-no-visualTheme',
      file: rel(file),
      note: 'HeavyUiOverlayShell visualTheme 미전달 — kind 롤아웃 시 추가',
    });
  }
}

// ── 8. baseline 스냅샷 ──
const enabledMatch = rolloutText.match(/listTacticalEnabledOverlayKinds[\s\S]*?planetEconomyInfo/);
INFO.push(`baseline frozen: ${read('src/ui/overlay/tacticalOverlayRollout.ts').match(/TACTICAL_UI_BASELINE_FROZEN_AT = '([^']+)'/)?.[1] ?? '?'}`);
INFO.push(`tactical enabled kinds: planetEconomyInfo (preview flag)`);

// ── Report ──
fs.mkdirSync(REPORT_DIR, { recursive: true });
const stamp = new Date().toISOString();
const lines = [
  '# Tactical UI Rollout Readiness Audit',
  '',
  `Generated: ${stamp}`,
  '',
  `| Severity | Count |`,
  `|----------|-------|`,
  `| FAIL | ${FAIL.length} |`,
  `| WARN | ${WARN.length} |`,
  `| INFO | ${INFO.length} |`,
  '',
];

function section(title, items, formatter) {
  lines.push(`## ${title}`, '');
  if (items.length === 0) {
    lines.push('_None_', '');
    return;
  }
  for (const item of items) {
    lines.push(formatter(item));
  }
  lines.push('');
}

section('FAIL (전면 교체 전 해소)', FAIL, (v) =>
  typeof v === 'string' ? `- ${v}` : `- \`${v.file}\` · ${v.id}: ${v.note}`,
);
section('WARN (kind별 전환 시 처리)', WARN, (v) => `- \`${v.file}\` · ${v.id}: ${v.note}`);
section('INFO', INFO, (v) => `- ${v}`);

const reportPath = path.join(REPORT_DIR, 'tactical-rollout-readiness-latest.md');
fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');

console.log(lines.join('\n'));
process.exit(FAIL.length > 0 ? 1 : 0);
