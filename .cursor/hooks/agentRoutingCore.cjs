'use strict';
/**
 * Arcfire 에이전트 페르소나 라우팅 — sessionStart / beforeSubmitPrompt 공용
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const LOCK_PATH = path.join(ROOT, '.cursor', 'session-persona-lock.json');
const BADGE_PATH = path.join(ROOT, 'tools', 'kim-team-lead', 'reports', 'ACTIVE_AGENT_BADGE.md');

const PERSONAS = {
  economy: {
    id: 'economy',
    label: '김경제',
    emoji: '💹',
    scope: '실시간 감시 · mem/crash 탐지 · audit:balance-ops · **개발 업데이트 시 메모리 즉각 재검수·handoff 보고**',
    avoid: '코드·CSV·SIM 수정 금지 — 김팀장 세션에서만 개발',
  },
  teamlead: {
    id: 'teamlead',
    label: '김팀장',
    emoji: '🛠️',
    scope: '유일한 사용자 지시 · 개발·경제 코드·UI·연동 · 김경제 감시 배정',
    avoid: '김경제 세션에 코드 지시 금지(감시·점검 배정만)',
  },
  fable: {
    id: 'fable',
    label: 'Fable (Table-First 구현)',
    emoji: '📊',
    scope: 'tables/·CSV·시드·점유·소유권·총사령관·NPC·카탈로그·registry·72단계·build:*-tables',
    avoid: 'Skia·UI·arcCore 틱·일일배치·STAGE·메모리 → 김팀장',
  },
  sonnet: {
    id: 'sonnet',
    label: 'Sonnet (Trouble-shooter)',
    emoji: '🔧',
    scope: 'logcat·크래시·tsc·adb',
    avoid: '대규모 기능 설계',
  },
};

function readStdinJson() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function readLock() {
  try {
    if (!fs.existsSync(LOCK_PATH)) return null;
    const j = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));
    if (!j || typeof j.persona !== 'string') return null;
    return PERSONAS[j.persona] ? j : null;
  } catch {
    return null;
  }
}

function writeLock(personaId, reason) {
  const p = PERSONAS[personaId];
  if (!p) return null;
  const payload = {
    persona: personaId,
    label: p.label,
    reason: reason || 'user',
    lockedAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });
  fs.writeFileSync(LOCK_PATH, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function clearLock() {
  try {
    if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH);
  } catch {
    /* ignore */
  }
}

function extractPromptText(input) {
  if (!input || typeof input !== 'object') return '';
  const parts = [];
  if (typeof input.prompt === 'string') parts.push(input.prompt);
  if (typeof input.text === 'string') parts.push(input.text);
  if (typeof input.message === 'string') parts.push(input.message);
  if (Array.isArray(input.messages)) {
    for (const m of input.messages) {
      if (m && typeof m.text === 'string') parts.push(m.text);
      if (m && typeof m.content === 'string') parts.push(m.content);
    }
  }
  return parts.join('\n');
}

function classifyPrompt(text) {
  const t = String(text || '');
  const lower = t.toLowerCase();

  if (/@김경제|@arceconomy|@economy|김경제\s*에이전트|김경제로\s*전환/i.test(t)) {
    return { personaId: 'economy', reason: 'explicit @김경제 (감시·점검 전용 세션)' };
  }
  if (/@김팀장|@teamlead|김팀장\s*에이전트|김팀장으로\s*전환/i.test(t)) {
    return { personaId: 'teamlead', reason: 'explicit @김팀장' };
  }
  if (/@fable|@페이블|페이블로\s*전환|72단계|tables\/|build:.*-tables|item_defs|planet_occupation|ownership_|planet_governor|npc_ai_|seedplanetoccupation|reconcilecsv|governor.*reserve|mission.*catalog|build:content-tables|build:balance-tables/i.test(t)) {
    return { personaId: 'fable', reason: 'Table-First·Fable 키워드' };
  }
  if (/@sonnet|logcat|sigsegv|크래시|oom/i.test(lower)) {
    return { personaId: 'sonnet', reason: '디버그 키워드' };
  }
  // arcCore 일일배치·SIM·경제 런타임 → 김팀장
  if (/경제\s*런타임|일일\s*배치|daily\s*ops|sim:economy|audit:balance|runarccoredailyopsbatch|aabs|price_elasticity|planet_development_aggregate|facility_.*_level_policy/i.test(t)) {
    return { personaId: 'teamlead', reason: '경제·일일배치 런타임 → 김팀장' };
  }
  if (/skia|reanimated|nativereclaim|stage.*memory|planet\.tsx|worldmap\.tsx|overlay|행성개발\s*ui|worklet|sigsegv/i.test(lower)) {
    return { personaId: 'teamlead', reason: 'Skia·UI·STAGE·메모리 → 김팀장' };
  }
  // 점령·소유·행성·NPC 테이블 맥락 (Table-First 구현)
  if (/점령|점유|소유권|총사령관|행성\s*시드|voronoi.*점|planet_holds|clanwar/i.test(t)) {
    return { personaId: 'fable', reason: '점유·소유 Table-First → Fable' };
  }
  return { personaId: 'teamlead', reason: '기본(미분류·런타임) → 김팀장' };
}

function applyLockCommands(text) {
  if (/김경제로\s*전환|@김경제\s*에이전트|세션.*김경제/i.test(text)) {
    return writeLock('economy', 'user_switch_economy');
  }
  if (/김팀장으로\s*전환|@김팀장\s*에이전트|세션.*김팀장/i.test(text)) {
    return writeLock('teamlead', 'user_switch_teamlead');
  }
  if (/페이블로\s*전환|@fable\s*에이전트|@페이블|세션.*페이블|세션.*fable/i.test(text)) {
    return writeLock('fable', 'user_switch_fable');
  }
  return null;
}

function resolveActivePersona(promptText) {
  applyLockCommands(promptText);
  const lock = readLock();
  if (lock && PERSONAS[lock.persona]) {
    return {
      persona: PERSONAS[lock.persona],
      source: 'lock',
      lock,
      classified: classifyPrompt(promptText),
    };
  }
  const classified = classifyPrompt(promptText);
  return {
    persona: PERSONAS[classified.personaId],
    source: 'classified',
    classified,
    lock: null,
  };
}

function writeBadge(active, promptPreview) {
  const p = active.persona;
  const lines = [
    '# Arcfire Active Agent Badge',
    '',
    `> **자동 갱신** — 메시지 전송·세션 시작 시 Hook이 갱신합니다. Cursor에서 이 파일을 열어 두면 페르소나를 확인할 수 있습니다.`,
    '',
    `| 항목 | 값 |`,
    `|------|-----|`,
    `| **현재 페르소나** | ${p.emoji} **${p.label}** |`,
    `| 결정 방식 | ${active.source === 'lock' ? '세션 잠금 (session-persona-lock.json)' : '이번 메시지 자동 분류'} |`,
    `| 전담 | ${p.scope} |`,
    `| 위임 | ${p.avoid} |`,
    `| 갱신 시각 | ${new Date().toISOString()} |`,
    '',
    active.lock
      ? `**잠금**: ${active.lock.reason} · ${active.lock.lockedAt}`
      : '_잠금 없음 — `@김경제` / `김경제로 전환` / `@김팀장` / `김팀장으로 전환`으로 고정_',
    '',
    active.classified && active.source === 'lock' && active.classified.personaId !== p.id
      ? `⚠️ 이번 메시지는 **${PERSONAS[active.classified.personaId].label}** 쪽으로도 보입니다. 잠금을 풀고 전환하려면 반대 페르소나로 전환 문구를 입력하세요.`
      : '',
    '',
    '## 전환 명령 (이 채팅에 입력)',
    '- `김경제로 전환` · `@김경제` → **감시·점검 전용** 세션 잠금 (코드 수정 없음)',
    '- `김팀장으로 전환` · `@김팀장` → 개발 총괄(런타임·Skia·STAGE) 세션 잠금',
    '- `페이블로 전환` · `@Fable` · `@페이블` → **Table-First 구현** 세션 잠금',
    '',
    '## 파일',
    '- 잠금 상태: `.cursor/session-persona-lock.json`',
    '- 정본: `.cursor/rules/gemini-code-agent-routing.mdc`',
    '',
    promptPreview
      ? `## 마지막 메시지 미리보기\n\n${promptPreview.slice(0, 200).replace(/\n/g, ' ')}…`
      : '',
    '',
  ];
  fs.mkdirSync(path.dirname(BADGE_PATH), { recursive: true });
  fs.writeFileSync(BADGE_PATH, lines.filter(Boolean).join('\n'), 'utf8');
}

function buildAgentContext(active) {
  const p = active.persona;
  const lines = [
    `[Arcfire Active Agent — ${p.emoji} ${p.label}]`,
    `source=${active.source} · scope=${p.scope}`,
    `위임=${p.avoid}`,
    `배지 파일(사용자 확인용): tools/kim-team-lead/reports/ACTIVE_AGENT_BADGE.md`,
    '응답 첫 줄에 반드시: 「【' + p.label + '】」 한 줄 표시.',
  ];
  if (p.id === 'teamlead' || p.id === 'fable') {
    lines.push(
      '개발규칙1순위(무조건): 코드 diff 전 [pss-pre-dev] 3줄 · 완료 전 audit:memory:all+tsc · 개발 후 mem-post-dev-recheck.',
    );
  }
  if (p.id === 'economy') {
    lines.push(
      '김경제: 코드 수정 금지 · src/app/tables 변경 감지 시 mem-post-dev-recheck handoff 같은 턴.',
    );
  }
  return lines.join('\n');
}

function buildUserAlert(active, promptText) {
  const p = active.persona;
  const classified = active.classified;
  if (!classified || active.source !== 'lock') {
    return `【${p.label}】 이번 메시지 기준 자동 분류 (${classified?.reason || ''}). 고정: 「김경제로 전환」 또는 「김팀장으로 전환」`;
  }
  if (classified.personaId !== p.id) {
    const suggested = PERSONAS[classified.personaId];
    return `⚠️ 세션은 【${p.label}】로 잠금되어 있습니다. 이번 요청은 【${suggested.label}】에 가깝습니다. 전환: 「${suggested.label === '김경제' ? '김경제' : '김팀장'}로 전환」`;
  }
  return `【${p.label}】 세션 작동 중 (잠금 유지). 배지: tools/kim-team-lead/reports/ACTIVE_AGENT_BADGE.md`;
}

module.exports = {
  PERSONAS,
  LOCK_PATH,
  BADGE_PATH,
  readStdinJson,
  resolveActivePersona,
  writeBadge,
  buildAgentContext,
  buildUserAlert,
  clearLock,
};
