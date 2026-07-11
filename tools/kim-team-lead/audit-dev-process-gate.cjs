'use strict';
/**
 * Cursor 개발 프로세스 게이트 무결성 검증
 * npm run audit:dev-process-gate
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const HOOKS_JSON = path.join(ROOT, '.cursor', 'hooks.json');

const REQUIRED_HOOKS = [
  '.cursor/hooks/on-before-submit-prompt-paid-model-gate.cjs',
  '.cursor/hooks/on-session-start-paid-model-gate.cjs',
  '.cursor/hooks/paidModelGateCore.cjs',
  '.cursor/hooks/on-before-submit-prompt-pss-pre-dev-gate.cjs',
  '.cursor/hooks/on-session-start-pss-pre-dev-brief.cjs',
  '.cursor/hooks/on-session-start-mem-post-dev-trigger.cjs',
  '.cursor/hooks/on-session-start-kim-claude-handoff-review.cjs',
  '.cursor/hooks/on-before-submit-prompt-kim-claude-handoff-review.cjs',
  '.cursor/hooks/on-before-submit-prompt-agent-routing.cjs',
  '.cursor/hooks/on-before-submit-prompt-incident-auto-fix.cjs',
];

const REQUIRED_RULES = [
  '.cursor/rules/arcfire-memory-leak-audit-first.mdc',
  '.cursor/rules/arcfire-main-lead-agent.mdc',
  '.cursor/rules/arcfire-paid-model-exclusion-gate.mdc',
];

function main() {
  const failures = [];

  for (const rel of REQUIRED_HOOKS) {
    if (!fs.existsSync(path.join(ROOT, rel))) failures.push(`missing hook: ${rel}`);
  }
  for (const rel of REQUIRED_RULES) {
    if (!fs.existsSync(path.join(ROOT, rel))) failures.push(`missing rule: ${rel}`);
  }

  let hooks;
  try {
    hooks = JSON.parse(fs.readFileSync(HOOKS_JSON, 'utf8'));
  } catch {
    failures.push('hooks.json unreadable');
    hooks = null;
  }

  if (hooks) {
    const session = (hooks.hooks?.sessionStart ?? []).map((h) => h.command);
    const before = (hooks.hooks?.beforeSubmitPrompt ?? []).map((h) => h.command);
    if (!session.some((c) => String(c).includes('pss-pre-dev-brief'))) {
      failures.push('hooks.json: sessionStart missing pss-pre-dev-brief');
    }
    if (!session.some((c) => String(c).includes('mem-post-dev-trigger'))) {
      failures.push('hooks.json: sessionStart missing mem-post-dev-trigger');
    }
    if (!session.some((c) => String(c).includes('kim-claude-handoff-review'))) {
      failures.push('hooks.json: sessionStart missing kim-claude-handoff-review');
    }
    if (!before.some((c) => String(c).includes('paid-model-gate'))) {
      failures.push('hooks.json: beforeSubmitPrompt missing paid-model-gate');
    }
    if (!session.some((c) => String(c).includes('paid-model-gate'))) {
      failures.push('hooks.json: sessionStart missing paid-model-gate');
    }
    if (!before.some((c) => String(c).includes('pss-pre-dev-gate'))) {
      failures.push('hooks.json: beforeSubmitPrompt missing pss-pre-dev-gate');
    }
    if (!before.some((c) => String(c).includes('kim-claude-handoff-review'))) {
      failures.push('hooks.json: beforeSubmitPrompt missing kim-claude-handoff-review');
    }
  }

  if (!fs.existsSync(path.join(ROOT, 'tools/kim-team-lead/reports/SUBSCRIPTION_RENEWAL_ANCHOR.json'))) {
    failures.push('missing SUBSCRIPTION_RENEWAL_ANCHOR.json');
  }
  if (!fs.existsSync(path.join(ROOT, 'tools/kim-team-lead/run-mem-post-dev-recheck.cjs'))) {
    failures.push('missing run-mem-post-dev-recheck.cjs');
  }
  if (!fs.existsSync(path.join(ROOT, 'tools/kim-team-lead/reports/kim-claude-handoff-pending.md'))) {
    failures.push('missing kim-claude-handoff-pending.md');
  }
  if (!fs.existsSync(path.join(ROOT, 'CLAUDE.md'))) {
    failures.push('missing CLAUDE.md');
  }

  if (failures.length) {
    console.error('FAIL audit:dev-process-gate');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log('PASS audit:dev-process-gate — hooks · rules · recheck script OK');
}

main();
