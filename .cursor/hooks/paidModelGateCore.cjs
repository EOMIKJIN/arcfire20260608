'use strict';
/**
 * 유료 Claude 전용 · Composer/Cursor 폴백 개발 배제
 * 정본: .cursor/rules/arcfire-paid-model-exclusion-gate.mdc
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
  'cursor-glock',
  'glock',
];

const DEFAULT_ALLOWED = [
  'claude-opus-4-8-thinking-high',
  'claude-sonnet-5-thinking-high',
  'claude-fable-5-thinking-high',
  'claude-4.6-sonnet-medium-thinking',
];

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

function buildPaidModelGateContext() {
  const anchor = readAnchor();
  const fallbackActive = isFallbackFlagActive();
  const allowed = anchor?.allowedPaidModels ?? DEFAULT_ALLOWED;
  const forbidden = anchor?.forbiddenFallbackAgents ?? DEFAULT_FORBIDDEN;
  const nextRenewal = anchor?.nextRenewalDate ?? '(see SUBSCRIPTION_RENEWAL_ANCHOR.json)';
  const lastRenewal = anchor?.lastRenewalDate ?? '(see SUBSCRIPTION_RENEWAL_ANCHOR.json)';

  const lines = [
    '[Arcfire Paid-Model Gate — 2026-07-11~ · 2026-08-02 강화: Composer/글록=분석전용]',
    `구독 구간(KST): ${lastRenewal} ~ ${nextRenewal} 전일 · 유료 Claude 전용 개발`,
    `허용 Task model: ${allowed.join(' | ')}`,
    `개발 금지(분석만): ${forbidden.join(' | ')} — 코드·간단한 로그/계측 diff 절대 금지`,
    '교훈: 2026-08-02 worldmap 고착방지 안전망(①③) 회귀 — 폴백이 예방 코드를 넣지 말 것',
  ];

  if (fallbackActive) {
    lines.push(
      '⚠️ API_EXHAUST_FALLBACK_ACTIVE — **문서·분석·handoff 문구만** (코드·로그 패치 초안 **폐지**).',
      `폴백 사유: ${readFallbackFlagPreview()}`,
      '폴백 세션: 코드/로그 diff·audit PASS·완료·커밋 선언 **금지** · 패치는 Opus 복구 후.',
      '첫 줄 표기: 【분석전용·개발금지】',
    );
  } else {
    lines.push(
      '🚫 Composer·글록 **분석 전용** — 코드·로그·안전망 수정 **절대 금지** (flag 있어도 코드 예외 없음).',
      '「김팀장」페르소나 ≠ Composer 코드 권한. 개발 요청 → Opus/Fable/Sonnet 전환 안내.',
      'Task 위임 model 생략·(기본)·composer slug **금지**.',
    );
  }

  lines.push('정본: .cursor/rules/arcfire-paid-model-exclusion-gate.mdc');
  return lines.join('\n');
}

function buildPaidModelUserAlert() {
  const fallbackActive = isFallbackFlagActive();
  if (fallbackActive) {
    return '⚠️ API 소진 — Composer/글록은 **분석·문서만**. 코드·로그 수정 금지 · 패치는 Opus.';
  }
  return '🚫 Composer·글록=**분석만**. 개발·로그는 **Opus(김팀장)·Fable·Sonnet만**.';
}

module.exports = {
  ANCHOR_PATH,
  FALLBACK_FLAG_PATH,
  readAnchor,
  isFallbackFlagActive,
  buildPaidModelGateContext,
  buildPaidModelUserAlert,
};
