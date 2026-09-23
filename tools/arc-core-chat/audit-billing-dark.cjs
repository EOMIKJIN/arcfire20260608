#!/usr/bin/env node
/**
 * ArcCore chat — ZERO_BILL 요금 게이트 정적 감사.
 *
 * 대표님 의도: 1인 테스트에서도 종량 $1이라도 부가되면 안 됨.
 * 제공자 무료 티어 한도까지는 OK. Bedrock/Vertex LIVE는 금지.
 *
 * 허용(기본 PASS):
 * - zero_bill + vendor=free_tier + LIVE + FREE_TIER https URL + AWS URL 빈 값
 * - 또는 dark (LIVE=false · URL 빈 값)
 *
 * 종량(Bedrock) LIVE: ARC_CORE_CHAT_METERED_ACK=1 + GOLIVE_ACK=1 만
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const GATE = path.join(ROOT, 'src/arcCore/chat/arcCoreChatCloudGate.ts');
const PROVIDER = path.join(ROOT, 'src/arcCore/chat/cloudConversationalProvider.ts');
const ACK = String(process.env.ARC_CORE_CHAT_BILLING_GOLIVE_ACK || '').trim() === '1';
const METERED_ACK = String(process.env.ARC_CORE_CHAT_METERED_ACK || '').trim() === '1';

const failures = [];
const warnings = [];
const notes = [];

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function mustMatch(file, label, re, hint) {
  const src = read(file);
  if (!re.test(src)) {
    failures.push(`${label}: ${hint}`);
  } else {
    notes.push(`OK ${label}`);
  }
}

const gateSrc = read(GATE);

mustMatch(
  GATE,
  'BILLING_MODE=zero_bill',
  /export const ARC_CORE_CHAT_BILLING_MODE[^=]*=\s*'zero_bill'\s*;/,
  'BILLING_MODE 는 zero_bill 이어야 함 (종량 $0 강제)',
);

mustMatch(
  GATE,
  'metered LIVE block helper',
  /function isArcCoreChatMeteredVendorLiveBlocked/,
  '종량 벤더 LIVE 차단 헬퍼가 있어야 함',
);

mustMatch(
  GATE,
  'AWS_TURN_URL empty',
  /export const ARC_CORE_CHAT_AWS_TURN_URL\s*=\s*''\s*;/,
  'AWS_TURN_URL 이 빈 문자열이어야 함 (Bedrock Function URL 미기입)',
);

const liveTrue = /export const ARC_CORE_CHAT_CLOUD_LIVE\s*=\s*true\s*;/.test(gateSrc);
const liveFalse = /export const ARC_CORE_CHAT_CLOUD_LIVE\s*=\s*false\s*;/.test(gateSrc);
const vendorFree = /export const ARC_CORE_CHAT_CLOUD_VENDOR[^=]*=\s*'free_tier'\s*;/.test(gateSrc);
const vendorAws = /export const ARC_CORE_CHAT_CLOUD_VENDOR[^=]*=\s*'aws'\s*;/.test(gateSrc);
const vendorFirebase = /export const ARC_CORE_CHAT_CLOUD_VENDOR[^=]*=\s*'firebase'\s*;/.test(gateSrc);
const freeUrlHttps = /ARC_CORE_CHAT_FREE_TIER_TURN_URL\s*=\s*['"]https?:\/\//.test(gateSrc);
const awsUrlHttps = /ARC_CORE_CHAT_AWS_TURN_URL\s*=\s*['"]https?:\/\//.test(gateSrc);
const freeUrlEmpty = /export const ARC_CORE_CHAT_FREE_TIER_TURN_URL\s*=\s*''\s*;/.test(gateSrc);

if (METERED_ACK && ACK) {
  warnings.push('ARC_CORE_CHAT_METERED_ACK=1 — 종량(Bedrock) 경로 ACK (대표님 종량 허용)');
  notes.push('OK metered ACK mode');
} else if (vendorFree && liveTrue && freeUrlHttps && !awsUrlHttps) {
  notes.push('OK free_tier LIVE + Groq Lambda URL (ZERO_BILL)');
  warnings.push('free_tier LIVE — Groq Free 한도 내만 · 카드/Developer 전환 금지');
} else if (vendorFree && liveFalse && (freeUrlEmpty || !freeUrlHttps) && !awsUrlHttps) {
  notes.push('OK free_tier dark (LIVE=false)');
} else if (vendorAws && liveFalse && !awsUrlHttps && !freeUrlHttps) {
  notes.push('OK aws dark');
} else {
  if (liveTrue && (vendorAws || vendorFirebase) && !(METERED_ACK && ACK)) {
    failures.push('aws/firebase + LIVE: ZERO_BILL — 종량 금지 (METERED_ACK 필요)');
  }
  if (awsUrlHttps) {
    failures.push('AWS_TURN_URL https: Bedrock URL 금지 (ZERO_BILL)');
  }
  if (liveTrue && vendorFree && !freeUrlHttps) {
    failures.push('free_tier LIVE 인데 FREE_TIER_TURN_URL https 없음');
  }
  if (!vendorAws && !vendorFree && !vendorFirebase) {
    failures.push('CLOUD_VENDOR: aws|firebase|free_tier 중 하나여야 함');
  }
  if (failures.length === 0) {
    notes.push(`OK VENDOR gate parsed (live=${liveTrue})`);
  }
}

mustMatch(
  PROVIDER,
  'live gate before fetch',
  /if\s*\(\s*!isArcCoreChatCloudLive\(\)\s*\)\s*return\s*\{\s*status:\s*'unavailable'\s*\}/,
  'cloudConversationalProvider 가 LIVE 가드 없이 fetch 하면 안 됨',
);

mustMatch(
  PROVIDER,
  'empty URL abort',
  /if\s*\(\s*!cloudUrl\s*\)\s*return\s*\{\s*status:\s*'unavailable'\s*\}/,
  'cloudUrl 빈 값이면 fetch 하지 않아야 함',
);

mustMatch(
  PROVIDER,
  'node test abort',
  /if\s*\(\s*isNodeTestRuntime\(\)\s*\)\s*return\s*\{\s*status:\s*'unavailable'\s*\}/,
  '유닛 테스트 런타임에서 cloud fetch 금지',
);

mustMatch(
  PROVIDER,
  'free tier exhausted status',
  /status:\s*'free_tier_exhausted'/,
  '무료 한도 소진 시 free_tier_exhausted 상태를 돌려야 함',
);

const appSrcRoots = [path.join(ROOT, 'src'), path.join(ROOT, 'app')];
const secretRe = /AKIA[0-9A-Z]{16}|AWS_SECRET_ACCESS_KEY\s*=\s*['"][^'"]+['"]|gsk_[A-Za-z0-9]{20,}/;
for (const dir of appSrcRoots) {
  walkTs(dir, (file, text) => {
    if (secretRe.test(text)) {
      failures.push(`secret-like pattern in ${path.relative(ROOT, file)}`);
    }
  });
}
notes.push('OK no AWS/Groq secret-like literals under src/ app/');

function walkTs(dir, fn) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'generated') continue;
      walkTs(p, fn);
    } else if (/\.(ts|tsx|js|jsx)$/.test(ent.name)) {
      fn(p, fs.readFileSync(p, 'utf8'));
    }
  }
}

const reportDir = path.join(ROOT, 'tools/kim-team-lead/reports');
fs.mkdirSync(reportDir, { recursive: true });
const reportPath = path.join(reportDir, 'ARC_CORE_CHAT_BILLING_DARK_LATEST.md');
const verdict = failures.length === 0 ? 'PASS' : 'FAIL';
const md = [
  '# ArcCore chat — ZERO_BILL billing audit',
  '',
  `verdict=\`${verdict}\``,
  `checkedAt=${new Date().toISOString()}`,
  `goliveAck=${ACK ? '1' : '0'}`,
  `meteredAck=${METERED_ACK ? '1' : '0'}`,
  '',
  '## Policy',
  '- ZERO_BILL: 종량 $1 부가 금지',
  '- free_tier LIVE + Groq Lambda URL = 허용',
  '- Bedrock/Vertex LIVE = METERED_ACK 없이 금지',
  '',
  '## Notes',
  ...notes.map((n) => `- ${n}`),
  '',
  '## Warnings',
  ...(warnings.length ? warnings.map((w) => `- ${w}`) : ['- (none)']),
  '',
  '## Failures',
  ...(failures.length ? failures.map((f) => `- ${f}`) : ['- (none)']),
  '',
].join('\n');

fs.writeFileSync(reportPath, md, 'utf8');

console.log(`[audit:arc-core-chat-billing] ${verdict}`);
for (const n of notes) console.log(`  ${n}`);
for (const w of warnings) console.warn(`  WARN ${w}`);
for (const f of failures) console.error(`  FAIL ${f}`);
console.log(`  report=${path.relative(ROOT, reportPath)}`);

if (failures.length) process.exit(1);
