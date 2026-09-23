/**
 * QUEST_DIALOGUE_REWRITE_PROPOSAL.md §13 남녀 말투 반영.
 * 문자열만. gender 컬럼·초상은 이번 스크립트 밖.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else {
        field += ch;
      }
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csvEscape(field) {
  const s = String(field ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function loadTable(rel) {
  const raw = readFileSync(resolve(ROOT, rel), 'utf8');
  const bom = raw.charCodeAt(0) === 0xfeff;
  const text = (bom ? raw.slice(1) : raw).replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  const rows = lines.map((line) => parseCsv(`${line}\n`)[0] ?? []);
  if (rows[0]?.[0]) rows[0][0] = rows[0][0].replace(/^\uFEFF/, '');
  return { rel, bom, lines, rows };
}

function saveTable(table) {
  const outLines = table.lines.map((orig, idx) => {
    const next = table.rows[idx] ?? [];
    const prev = parseCsv(`${orig}\n`)[0] ?? [];
    const same =
      prev.length === next.length && prev.every((value, i) => value === next[i]);
    return same ? orig : next.map(csvEscape).join(',');
  });
  writeFileSync(
    resolve(ROOT, table.rel),
    `${table.bom ? '\uFEFF' : ''}${outLines.join('\n')}\n`,
    'utf8',
  );
}

function toCsvStoryText(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\n/g, '\\n');
}

function fromCsvStoryText(text) {
  return String(text ?? '').replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');
}

const P = (lines) => lines.join('\n');

const PAGE_NEW = {
  'story_dialog_story_001\t0': P([
    '관문 순찰대 엘렌이다, [닉네임].',
    '아르카디아 거주구에서 살인이 났는데',
    '동기도 짚을 단서도 없다.',
  ]),
  'story_dialog_story_001\t1': P([
    '시신 신원은 확인됐다.',
    '원한도 빚도 정치도 얽힌 게 없고',
    '그렇다고 우발 사고도 아니다.',
  ]),
  'story_dialog_obj_story_001_d\t1': P([
    '진짜 증거는 솔라 항만사령부에 있고',
    '이사 벤트가 도킹 기록을 쥐고 있다.',
    '받아 오면 이번 건은 끝이다.',
  ]),
  'story_dialog_story_002\t0': P([
    '도킹 기록의 출항 칸이 비어 있다.',
    '흔적은 미네르바 밀수조로 이어지고',
    '솔라를 거쳐 간다.',
  ]),
  'story_dialog_story_006\t0': P([
    '포격전 한가운데서 낯선 신호가 잡혔다.',
    '호위 한 척을 먼저 걷어내 줘.',
    '신호는 그다음에 쫓는다.',
  ]),
  'story_dialog_story_006\t1': P([
    '크림슨 총수가 쓰는 주파수가 아니더군.',
    '함장 식별은 네가 해 줘.',
    '신호는 기함 쪽이 강하다.',
  ]),
  'story_dialog_obj_story_006_b\t0': P([
    '신호 주인은 기함 데드코러스고',
    '요새 호위대 주파수가 아니다.',
    '접근 허가는 내가 열어 두겠다.',
  ]),
  'story_dialog_obj_story_006_b\t1': P([
    '기함에 사람이 타고 있더군.',
    '누구인지는 네가 확인해 줘.',
    '나는 주파수만 잡았을 뿐이다.',
  ]),
  'story_dialog_obj_story_002_e\t1': P([
    '함장 자리가 빈 채로 출정하게 됐고',
    '다음 일은 그 빈자리에서 시작될 거다.',
    '아르카디아로 돌아가라.',
  ]),
  'story_dialog_obj_story_001_b\t0': P([
    '솔라 지점의 한로일세.',
    '도킹장에서 얼굴 하나를 봤네.',
    '목격자라면 그 얼굴이겠지.',
  ]),
  'story_dialog_obj_story_001_b\t1': P([
    '그날 밤 식별 신호를 지운 배가',
    '민간 정박 자리를 스쳐 갔네.',
    '관문 순찰대에 먼저 보고하게.',
  ]),
  'npc_dialog_sq_orren_bask\t2': P([
    '캠프 왜곡 구역은 베일 훅이 맡는다.',
    '찾아가서 입구부터 확인해라.',
    '정식 수사로는 올리지 마라. 아직은.',
  ]),
  'npc_dialog_sq_nila_shol\t0': P([
    '아우라 장부에서 물자가 새고 있어.',
    '빼돌린 배가 아군 신호를 달았더군.',
    '켓 미온한테 먼저 대조를 맡겨.',
  ]),
  'npc_dialog_sq_nila_shol\t1': P([
    '나는 흔적만 쫓는 사람이야.',
    '아군 도장이 찍혔다고 믿지는 마.',
    '정체를 밝히는 건 켓의 몫이고.',
  ]),
  'npc_dialog_sq_nila_shol\t2': P([
    '매듭은 요새에서 짓겠어.',
    '지금은 장부부터 맞추고.',
    '대조가 끝나면 요새에서 보자.',
  ]),
  'story_dialog_obj_s035_e\t0': P([
    '보급이 샌 이유는 이걸로 밝혀졌고',
    '아군이라는 말만 믿은 보고서였어.',
    '코어 항로 쪽 이름은 장부에만 남았다.',
  ]),
  'story_dialog_obj_s035_e\t1': P([
    '그 이름을 쫓을 사람은 따로 있어.',
    '나는 국경에서 본 것만 증언하고.',
    '요새 기록은 여기까지다.',
  ]),
  'npc_dialog_sq_veil_hook\t0': P([
    '여기가 캠프 왜곡 구역이다.',
    '순찰선 도는 주기를 재고 있고',
    '순찰 용건 아니면 통신은 끊는다.',
  ]),
  'story_dialog_obj_s034_b\t0': P([
    '중력 왜곡이 여기서 항로를 꺾는다.',
    '들어갈 길은 이 한 줄뿐이고',
    '들어온 배엔 식별 신호가 없었다.',
  ]),
  'story_dialog_obj_s034_b\t1': P([
    '순찰 주기는 아직 못 넘긴다.',
    '지금은 입구만 확인해 줘.',
    '출구를 건드리면 호위가 먼저 뜬다.',
  ]),
  'story_dialog_obj_s034_c\t1': P([
    '출구는 현상금 사냥꾼이 지키더군.',
    '좌표는 넘겨줬고.',
    '나는 주기만 기록할 뿐이다.',
  ]),
  'npc_dialog_sq_ivy_kenn\t0': P([
    '나는 다리만 놓는 사람이야.',
    '오가는 이름은 적지 않고.',
    '수수료는 진작에 받아 뒀거든.',
  ]),
  'story_dialog_obj_s036_a\t0': P([
    '나는 세 줄의 수수료만 알아.',
    '돈은 진작에 받았고.',
    '누가 시켰는지는 묻지 않았거든.',
  ]),
  'story_dialog_obj_s036_a\t1': P([
    '원본은 놀 패스가 갖고 있어.',
    '나는 다리만 놨을 뿐이고.',
    '어느 세력인지는 본 적 없거든.',
  ]),
  'npc_dialog_sq_rhea_vin\t0': P([
    '항로에 상자 하나가 남아 있어.',
    '크림슨 쪽이 이미 손댄 물건이고.',
    '요새 호위대가 쓰는 주파수가 아니다.',
  ]),
  'npc_dialog_sq_rhea_vin\t1': P([
    '일련번호는 내가 대조할게.',
    '너는 상자 위치만 확인해 줘.',
    '뚜껑은 절대 열지 마.',
  ]),
  'npc_dialog_sq_rhea_vin\t2': P([
    '사본은 일 끝나고 넘길게.',
    '케이드 림한테 위치부터 받아 줘.',
    '주파수 얘기는 그다음이고.',
  ]),
  'story_dialog_obj_s037_b\t0': P([
    '일련번호가 맞아.',
    '아크코어 주파수를 쓰는 조각이고.',
    '요새 호위대 주파수는 아니야.',
  ]),
  'story_dialog_obj_s037_b\t1': P([
    '호위가 상자를 지키려 들더군.',
    '격파한 뒤에 사본을 줄게.',
    '지금은 손대지 마.',
  ]),
  'story_dialog_obj_s037_d\t0': P([
    '이게 사본이야.',
    '아크코어의 조각이 맞고.',
    '적의 심장을 겨눈다는 건 과장이지만.',
  ]),
  'story_dialog_obj_s037_d\t1': P([
    '이 경로는 캠프까지 이어져.',
    '맞은 건 주파수뿐, 심장은 아니고.',
    '여기서 밝힐 수 있는 건 여기까지다.',
  ]),
  'npc_dialog_sq_lira_mon\t0': P([
    '오늘은 보고서 쓰러 온 게 아니잖아.',
    '칼 릿지 옆자리가 비어 있어.',
    '전과도 손실도 오늘은 세지 말자.',
  ]),
  'npc_dialog_sq_lira_mon\t1': P([
    '나는 이 관문 기록을 맡고 있어.',
    '여기선 다들 말을 아껴. 국경이니까.',
    '고향 얘기는 서로 묻지 않고.',
  ]),
  'npc_dialog_sq_lira_mon\t2': P([
    '관문은 내가 닫을 테니 서두르지 마.',
    '우선 잔부터 내려놓고 앉아.',
    '정박 자리 소문은 칼 릿지가 알아.',
  ]),
  'story_dialog_obj_s038_b\t0': P([
    '살아서 이 관문까지 온 날이야.',
    '전사자 수도 보고도 오늘은 접자.',
    '여기선 그런 걸 묻지 않아.',
  ]),
  'story_dialog_obj_s038_b\t1': P([
    '아르카디아 얘기는 말로만 두자.',
    '오늘은 그 기록을 펴지 않아.',
    '관문은 내가 지키고 있으니까.',
  ]),
  'story_dialog_obj_s038_c\t0': P([
    '아우라 관문의 하루를 정리해.',
    '출정 이야기는 아직 남겨 두고.',
    '오늘은 거의 비어 있는 날이야.',
  ]),
  'story_dialog_obj_s038_c\t1': P([
    '칼 릿지 얘긴 흘려들었어.',
    '관문은 아직 닫지 않고.',
    '한 번 더 들러.',
  ]),
  'story_dialog_obj_s038_d\t0': P([
    '이제 관문을 닫아.',
    '내일의 출정은 내일 걱정하자.',
    '오늘은 여기까지야.',
  ]),
  'story_dialog_obj_s038_d\t1': P([
    '빈 정박 자리 소문은 접어 두자.',
    '오늘 하루는 수사도 없었고.',
    '돌아올 곳이 있다면 그게 고향이다.',
  ]),
  'npc_dialog_sq_noll_pass\t0': P([
    '장부 세 줄이 비어 있다.',
    '금액은 적혀 있는데 보낸 자가 없지.',
    '수수료는 아이비 켄이 안다.',
  ]),
  'npc_dialog_sq_noll_pass\t1': P([
    '장부엔 실명이 없다.',
    '피 냄새도 없지. 수수료만 남았다.',
    '원본은 내가 쥐고 있다.',
  ]),
  'story_dialog_obj_s036_b\t0': P([
    '문제는 이 세 줄이다.',
    '보낸 자리만 비어 있지.',
    '금액은 그대로 적혀 있고.',
  ]),
  'story_dialog_obj_story_001_e\t0': P([
    '순찰대가 열람을 허가해 줬다.',
    '식별 신호는 지워져 있고',
    '들어온 기록만 있고 나간 기록이 없다.',
  ]),
  'story_dialog_obj_story_001_e\t1': P([
    '사본은 넘기겠다.',
    '이 사건은 일단 여기까지고',
    '그다음은 사령부가 이어받는다.',
  ]),
};

const pages = loadTable('tables/content/story_scene_pages.csv');
const header = pages.rows[0];
const iScene = header.indexOf('sceneId');
const iPage = header.indexOf('pageIndex');
const iText = header.indexOf('text');
let changed = 0;
const missing = [];
const over21 = [];

for (const [key, next] of Object.entries(PAGE_NEW)) {
  const [sceneId, pageIndex] = key.split('\t');
  const row = pages.rows.find(
    (r, idx) => idx > 0 && r[iScene] === sceneId && String(r[iPage]) === pageIndex,
  );
  if (!row) {
    missing.push(key);
    continue;
  }
  for (const line of fromCsvStoryText(next).split('\n')) {
    if (line.length > 21) over21.push(`${key} ${line.length} ${line}`);
  }
  if (fromCsvStoryText(row[iText]) === fromCsvStoryText(next)) continue;
  row[iText] = toCsvStoryText(next);
  changed += 1;
}

saveTable(pages);

console.log(JSON.stringify({ changed, expected: Object.keys(PAGE_NEW).length, missing, over21 }, null, 2));
if (missing.length || over21.length) process.exit(1);
