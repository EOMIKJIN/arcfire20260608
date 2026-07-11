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
    '[Arcfire Paid-Model Gate — 2026-07-11~]',
    `구독 구간(KST): ${lastRenewal} ~ ${nextRenewal} 전일 · 유료 Claude 전용 개발`,
    `허용 Task model: ${allowed.join(' | ')}`,
    `개발 금지: ${forbidden.join(' | ')} (Composer·Cursor 내장 Auto/폴백/글록)`,
  ];

  if (fallbackActive) {
    lines.push(
      '⚠️ API_EXHAUST_FALLBACK_ACTIVE — 폴백 **제한 허용**(잔여 100% 마감·handoff·단일 패치 초안만).',
      `폴백 사유: ${readFallbackFlagPreview()}`,
      '폴백 세션: audit PASS·완료·커밋 선언 **금지** · 김팀장 Opus 재검수 필수.',
      '첫 줄 표기: 【폴백·검수대기】',
    );
  } else {
    lines.push(
      '🚫 Composer·Cursor 폴백(글록) **개발 참여 절대 금지** — API 소진 시에만 flag 생성 후 제한 허용.',
      'flag 경로: tools/kim-team-lead/reports/API_EXHAUST_FALLBACK_ACTIVE.flag',
      '코드 diff·tables·src·app 수정 전: 유료 Claude(Opus/Fable/Sonnet) 모델인지 확인. 아니면 **중단·전환 안내**.',
      'Task 위임 model 생략·(기본)·composer slug **금지**.',
    );
  }

  lines.push('정본: .cursor/rules/arcfire-paid-model-exclusion-gate.mdc');
  return lines.join('\n');
}

function buildPaidModelUserAlert() {
  const fallbackActive = isFallbackFlagActive();
  if (fallbackActive) {
    return '⚠️ API 소진 폴백 모드 — Composer/Auto는 **잔여 마감만**. 완료·커밋·audit PASS는 김팀장 Opus가 합니다.';
  }
  return '🚫 개발은 **Opus(김팀장)·Fable·Sonnet만**. Composer·Cursor 폴백은 API 소진 flag 없이 **코드 수정 금지**.';
}

module.exports = {
  ANCHOR_PATH,
  FALLBACK_FLAG_PATH,
  readAnchor,
  isFallbackFlagActive,
  buildPaidModelGateContext,
  buildPaidModelUserAlert,
};
