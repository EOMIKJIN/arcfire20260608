'use strict';
/**
 * 김팀장 핵심=글록 4.5 · Composer/Cursor Auto 폴백 분석 전용
 * 정본: .cursor/rules/arcfire-paid-model-exclusion-gate.mdc
 * 앵커: tools/kim-team-lead/reports/SUBSCRIPTION_RENEWAL_ANCHOR.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const ANCHOR_PATH = path.join(ROOT, 'tools', 'kim-team-lead', 'reports', 'SUBSCRIPTION_RENEWAL_ANCHOR.json');
const FALLBACK_FLAG_PATH = path.join(ROOT, 'tools', 'kim-team-lead', 'reports', 'API_EXHAUST_FALLBACK_ACTIVE.flag');

const DEFAULT_FORBIDDEN = [
  'composer',
  'composer-2.5',
  'composer-2.5-fast',
  'cursor-auto',
  'cursor-auto-fallback',
  'default',
];

const DEFAULT_ALLOWED = [
  'cursor-grok-4.5-high-fast',
  'claude-opus-4-8-thinking-high',
  'claude-sonnet-5-thinking-high',
  'claude-fable-5-thinking-high',
  'claude-4.6-sonnet-medium-thinking',
];

const DEFAULT_KIM_CORE = {
  displayName: 'glock 4.5',
  displayNameKo: '글록 4.5',
  taskSlug: 'cursor-grok-4.5-high-fast',
};

function readAnchor() {
  try {
    if (!fs.existsSync(ANCHOR_PATH)) return null;
    return JSON.parse(fs.readFileSync(ANCHOR_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function isFallbackFlagActive() {
  try {
    return fs.existsSync(FALLBACK_FLAG_PATH);
  } catch {
    return false;
  }
}

function readFallbackFlagPreview() {
  try {
    if (!fs.existsSync(FALLBACK_FLAG_PATH)) return '';
    const text = fs.readFileSync(FALLBACK_FLAG_PATH, 'utf8').trim();
    return text.split('\n')[0]?.slice(0, 120) || 'active';
  } catch {
    return 'active';
  }
}

function resolveKimCore(anchor) {
  const core = anchor?.kimTeamLeadCoreModel;
  if (!core || typeof core !== 'object') return DEFAULT_KIM_CORE;
  return {
    displayName: core.displayName || DEFAULT_KIM_CORE.displayName,
    displayNameKo: core.displayNameKo || DEFAULT_KIM_CORE.displayNameKo,
    taskSlug: core.taskSlug || DEFAULT_KIM_CORE.taskSlug,
  };
}

function buildPaidModelGateContext() {
  const anchor = readAnchor();
  const fallbackActive = isFallbackFlagActive();
  const allowed = anchor?.allowedPaidModels ?? DEFAULT_ALLOWED;
  const forbidden = anchor?.forbiddenFallbackAgents ?? DEFAULT_FORBIDDEN;
  const nextRenewal = anchor?.nextRenewalDate ?? '(see SUBSCRIPTION_RENEWAL_ANCHOR.json)';
  const lastRenewal = anchor?.lastRenewalDate ?? '(see SUBSCRIPTION_RENEWAL_ANCHOR.json)';
  const kim = resolveKimCore(anchor);

  const lines = [
    '[Arcfire Model Gate — 2026-08-04: 김팀장 핵심=글록 4.5 · Composer/Auto=분석전용]',
    `김팀장 핵심 모델: ${kim.displayName} (${kim.displayNameKo}) · Task slug=${kim.taskSlug}`,
    `구독 구간(KST): ${lastRenewal} ~ ${nextRenewal} 전일`,
    `허용 Task model: ${allowed.join(' | ')}`,
    `개발 금지(분석만): ${forbidden.join(' | ')} — Composer·Cursor Auto/미지정 (글록 4.5와 구분)`,
    '교훈: 2026-08-02 worldmap 고착방지 — Composer/미지정 Auto가 예방 코드를 넣지 말 것',
  ];

  if (fallbackActive) {
    lines.push(
      '⚠️ API_EXHAUST_FALLBACK_ACTIVE — Composer/Auto는 **문서·분석만** (코드·로그 패치 금지).',
      `폴백 사유: ${readFallbackFlagPreview()}`,
      `가능하면 김팀장 핵심(${kim.displayName}) 세션에서 개발.`,
      '첫 줄 표기(Composer/Auto): 【분석전용·개발금지】',
    );
  } else {
    lines.push(
      `✅ 김팀장(${kim.displayName}) 세션 = 코드·검수·런타임 개발 허용.`,
      '🚫 Composer·Cursor Auto/미지정 = 분석 전용 — 코드·로그·안전망 수정 금지.',
      `Task 김팀장 위임 기본 model=${kim.taskSlug} · 생략·(기본)·composer **금지**.`,
    );
  }

  lines.push('정본: .cursor/rules/arcfire-paid-model-exclusion-gate.mdc · ANCHOR kimTeamLeadCoreModel');
  return lines.join('\n');
}

function buildPaidModelUserAlert() {
  const anchor = readAnchor();
  const kim = resolveKimCore(anchor);
  const fallbackActive = isFallbackFlagActive();
  if (fallbackActive) {
    return `⚠️ API 소진 — Composer/Auto는 분석·문서만. 개발은 김팀장 핵심(${kim.displayName}) 세션.`;
  }
  return `김팀장 핵심=${kim.displayName}(개발 허용) · Composer/Auto=분석만.`;
}

module.exports = {
  ANCHOR_PATH,
  FALLBACK_FLAG_PATH,
  readAnchor,
  isFallbackFlagActive,
  resolveKimCore,
  buildPaidModelGateContext,
  buildPaidModelUserAlert,
};
