'use strict';
/**
 * Cursor `stop` 훅 — (옵트인) 아크코어 자기 최적화 핸드오프 안내
 *
 * `.cursor/trigger-arc-self-optimize-on-stop` 파일이 있을 때만 1회 동작:
 * - 플래그 삭제 후 `followup_message` 로 다음 단계 안내
 * - 자동 루프 방지: 플래그는 1회용
 *
 * 플래그 생성: 프로젝트 루트에서 빈 파일 생성
 *   `New-Item .cursor/trigger-arc-self-optimize-on-stop -ItemType File`
 */
const fs = require('fs');
const path = require('path');

const flag = path.join(__dirname, '..', 'trigger-arc-self-optimize-on-stop');

function main() {
  let stdin = '';
  try {
    stdin = fs.readFileSync(0, 'utf8');
  } catch {
    stdin = '';
  }
  void stdin;

  if (!fs.existsSync(flag)) {
    process.stdout.write(JSON.stringify({}));
    return;
  }
  try {
    fs.unlinkSync(flag);
  } catch {
    /* ignore */
  }

  const msg = [
    '[아크코어 자기 최적화 — Cursor 에이전트]',
    '1) 터미널에서 `npm run audit:arc-self-optimize:pack` 실행',
    '2) 생성된 `tools/arc-core-self-optimize/outbox/cursor-handoff.md` 를 Cloud Agent(또는 새 채팅)에 첨부',
    '3) 프롬프트는 동일 폴더의 `PROMPT_TEMPLATE.md` 지시를 따름 — `src/arcCore` 및 연결 경로만 수정, 테이블·무역 규약 유지',
  ].join('\n');

  process.stdout.write(JSON.stringify({ followup_message: msg }));
}

main();
