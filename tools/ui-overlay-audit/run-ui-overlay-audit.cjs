#!/usr/bin/env node
/**
 * UI 오버레이 통합 점검 — RN Modal·Alert.alert·레거시 inline overlay 잔존 탐지
 * npm run audit:ui-overlay
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const SCAN_DIRS = ['app', 'src'];
const SKIP = new Set(['node_modules', '.git', 'tools', 'functions']);

const violations = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(tsx|ts|jsx|js)$/.test(name)) continue;
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (rel.includes('ui/overlay/')) continue;
    if (rel.includes('RewardModal.tsx') || rel.includes('LevelUpModal')) continue;
    if (rel.includes('ArcMessageModalHost')) continue;
    const text = fs.readFileSync(full, 'utf8');

    if (/\bModal\b/.test(text) && /from ['"]react-native['"]/.test(text) && /<Modal[\s>]/.test(text)) {
      violations.push({ file: rel, rule: 'RN Modal 사용 금지 — ArcOverlayHost kind 사용' });
    }
    if (/\bAlert\.alert\s*\(/.test(text)) {
      violations.push({ file: rel, rule: 'Alert.alert 금지 — showArcAlert 사용' });
    }
    if (/IngameDialogOverlay/.test(text)) {
      violations.push({ file: rel, rule: 'IngameDialogOverlay 삭제됨 — useArcNarrativeOverlay 또는 NarrativeDialogRow' });
    }
    if (/updateGateOverlay/.test(text)) {
      violations.push({ file: rel, rule: 'updateGateOverlay 인라인 금지 — arcOverlayStore alert' });
    }
    if (/paddingBottom:\s*72\b/.test(text)) {
      violations.push({ file: rel, rule: '하단 magic 72px — resolveOverlayBottomAnchorPad 사용' });
    }
  }
}

for (const d of SCAN_DIRS) {
  walk(path.join(ROOT, d));
}

const contractPath = path.join(ROOT, 'src/ui/overlay/overlayAlertContract.ts');
const storePath = path.join(ROOT, 'src/ui/overlay/arcOverlayStore.ts');
const contractText = fs.readFileSync(contractPath, 'utf8');
const storeText = fs.readFileSync(storePath, 'utf8');
if (!/ARC_ALERT_DEFAULT_AUTO_DISMISS_MS\s*=\s*30_000/.test(contractText)) {
  violations.push({
    file: 'src/ui/overlay/overlayAlertContract.ts',
    rule: 'alert 기본 자동 닫힘 30s 상수(ARC_ALERT_DEFAULT_AUTO_DISMISS_MS) 필수',
  });
}
if (!/resolveArcAlertAutoDismissMs/.test(storeText)) {
  violations.push({
    file: 'src/ui/overlay/arcOverlayStore.ts',
    rule: 'presentArcOverlayAlert — resolveArcAlertAutoDismissMs 적용 필수',
  });
}

const reportDir = path.join(__dirname, 'reports');
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, 'latest.md');
const lines = [
  '# UI Overlay Integration Audit',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  violations.length === 0
    ? '**PASS** — 위반 없음.'
    : `**FAIL** — ${violations.length}건`,
  '',
];
if (violations.length > 0) {
  for (const v of violations) {
    lines.push(`- \`${v.file}\`: ${v.rule}`);
  }
}
fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
console.log(lines.join('\n'));
process.exit(violations.length > 0 ? 1 : 0);
