/**
 * 김클로드 QUEST_DIALOGUE_REWRITE_PROPOSAL.md v2.0 일괄 반영.
 * 문자열만. id·체인·영문 컬럼 불변. 전량 build:content-tables 금지.
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

function stringifyCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';
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
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n/g, '\\n');
}

function fromCsvStoryText(text) {
  return String(text ?? '')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n');
}

function colIndex(header, name) {
  const i = header.indexOf(name);
  if (i < 0) throw new Error(`missing column ${name} in ${header.join(',')}`);
  return i;
}

const P = (lines) => lines.join('\n');

/** sceneId + pageIndex → new Korean text */
const PAGE_NEW = {
  'intro01\t0':
    '은하계 동부를 손에 넣은 크림슨 레기온은\n끈질기고 은밀한 움직임 끝에\n마침내 깊숙한 어둠의 구역 안에\n잠들어 있던 아크코어를 찾아낸다.\n\n',
  'mission_clear_mission_001\t0':
    '임무 완료 보고입니다.\n\n「첫 비행」 임무가 완료되었습니다.\n베가 전초기지 도착을 확인했습니다.\n\n[닉네임]님, 다음 임무를 준비하십시오.',
  'mission_clear_mission_002\t0':
    '임무 완료 보고입니다.\n\n「해적 소탕」 임무가 완료되었습니다.\n교전 결과를 기록했습니다.\n\n보상이 지급되었습니다.',
  'mission_clear_mission_003\t0':
    '임무 완료 보고입니다.\n\n「무역 루트 개척」 임무가 완료되었습니다.\n구매와 배달 조건을 모두 충족했습니다.\n\n[닉네임]님, 수고하셨습니다.',

  'story_dialog_story_001\t0': P(['관문 순찰대 엘렌이다, [닉네임].', '아르카디아 거주구에서 살인이 났다.', '동기도, 짚을 단서도 없다.']),
  'story_dialog_story_001\t1': P(['시신 신원은 확인됐다.', '원한도 빚도 정치도 얽힌 게 없다.', '그렇다고 우발 사고도 아니다.']),
  'story_dialog_story_001\t2': P(['잔해에서 살아 돌아온 너에게 맡기겠다.', '솔라 항구 술집부터 탐문해라.', '도킹 기록은 그다음이다.']),
  'story_dialog_obj_story_001_b\t0': P(['솔라 지점의 한로다.', '도킹장에서 얼굴 하나를 봤다.', '목격자라면 그 얼굴이겠지.']),
  'story_dialog_obj_story_001_b\t1': P(['그날 밤 식별 신호를 지운 배가', '민간 정박 자리를 스쳐 갔다.', '먼저 관문 순찰대에 보고부터 해라.']),
  'story_dialog_obj_story_001_d\t0': P(['돌아왔군, [닉네임].', '술집에서 들은 내용은 기록에 남겼다.']),
  'story_dialog_obj_story_001_d\t1': P(['진짜 증거는 솔라 항만사령부에 있다.', '이사 벤트에게 도킹 기록을 받아와라.', '그걸로 이번 건은 끝이다.']),
  'story_dialog_obj_story_001_e\t0': P(['순찰대가 기록 열람을 허가했다.', '식별 신호가 지워져 있다.', '들어온 기록만 있고 나간 기록이 없다.']),
  'story_dialog_obj_story_001_e\t1': P(['사본은 넘기겠다.', '이 사건은 일단 여기서 마무리다.', '그다음은 사령부가 이어받는다.']),

  'story_dialog_story_002\t0': P(['도킹 기록의 출항 칸이 비어 있다.', '흔적은 미네르바 밀수조로 이어진다.', '솔라를 거쳐 간다.']),
  'story_dialog_story_002\t1': P(['하수인부터 잡아라.', '피해자가 누구였는지는', '그자의 입에서 나온다.']),
  'story_dialog_obj_story_002_b\t0': P(['소식판에 밀수조 표식이 남았더군.', '외곽엔 호위가 붙어 있다네.', '내가 할 말은 여기까지네.']),
  'story_dialog_obj_story_002_b\t1': P(['하수인 이름은 노아 프릭이라네.', '반드시 산 채로 데려오게.', '죽은 입은 아무 말도 못 하니까.']),
  'story_dialog_obj_story_002_d\t0': P(['나는 손에 피 묻힌 쪽이 아니다.', '돈만 받고 길만 열어 줬다.', '내 이름은 묻지 마라.']),
  'story_dialog_obj_story_002_d\t1': P(['죽은 사람은 테오 혼이다.', '국경 방어 함대 함장 내정자였다.', '내가 아는 건 그게 전부다.']),
  'story_dialog_obj_story_002_e\t0': P(['사령부에는 통보해 뒀다.', '출정은 미룰 수 없는데', '지휘할 사람이 없다.']),
  'story_dialog_obj_story_002_e\t1': P(['함장 자리가 빈 채로 출정한다.', '다음 일은 그 빈자리에서 시작된다.', '아르카디아로 돌아가라.']),

  'story_dialog_story_003\t0': P(['테오 혼의 자리가 비었다.', '출정은 내일이다.', '함대는 기다려 주지 않는다.']),
  'story_dialog_story_003\t1': P(['네 이름이 사건 기록에 올라 있다.', '오늘부로 함장 대행이다.', '베가 전초기지로 가라.']),
  'story_dialog_obj_story_003_a\t0': P(['인수인계할 시간은 없다.', '함대는 이미 베가에 가 있다.', '늦으면 국경이 먼저 무너진다.']),
  'story_dialog_obj_story_003_a\t1': P(['관문 통과는 엘렌이 열어 준다.', '정찰 보고는 믿지 마라.', '살아 돌아오는 것이 명령이다.']),
  'story_dialog_obj_story_003_b\t0': P(['대행 출정 허가가 떨어졌다.', '관문은 열어 두겠다.', '베가 전초기지가 곧 국경이다.']),
  'story_dialog_obj_story_003_b\t1': P(['정찰이 보고한 규모를 믿지 마라.', '도착하는 순간 전열이 바뀐다.', '통신은 짧게 끊어라.']),

  'story_dialog_obj_story_004_b\t1': P(['아르카디아로 귀환해라.', '사령부가 기다리고 있다.', '전사자 수는 나중에 센다.']),

  'story_dialog_story_005\t0': P(['살아 돌아왔군.', '집무실에서 보자.', '지금 와라.']),
  'story_dialog_story_005\t1': P(['전사자 보고는 나중에 받겠다.', '먼저 내 질문부터 들어라.', '이번 전멸보다 오래된 이야기다.']),
  'story_dialog_obj_story_005_a\t0': P(['오래전 내가 등을 돌린 동료가 있다.', '이름은 다렐 소사.', '내가 그를 버렸다.']),
  'story_dialog_obj_story_005_a\t1': P(['복수는 누가 하느냐고 물었지.', '답 대신 좌표를 주겠다.', '드라코 성운. 그리고 다렐 소사.']),

  'story_dialog_story_006\t0': P(['포격전 중에 낯선 신호가 잡혔다.', '호위 한 척을 먼저 부숴라.', '그다음 신호를 쫓는다.']),
  'story_dialog_story_006\t1': P(['크림슨 총수가 쓰는 주파수가 아니다.', '함장 식별은 네가 해라.', '신호는 기함 쪽이 강하다.']),
  'story_dialog_obj_story_006_b\t0': P(['신호의 주인은 기함 데드코러스다.', '요새 호위대 주파수가 아니다.', '접근 허가를 열어 주겠다.']),
  'story_dialog_obj_story_006_b\t1': P(['기함에 사람이 타고 있다.', '누구인지는 네가 확인해라.', '나는 주파수만 잡았을 뿐이다.']),
  'story_dialog_obj_story_006_c\t0': P(['나는 이번 기습의 주모자가 아니다.', '코발이 버린 사람이다.', '데드코러스는 내 배다.']),
  'story_dialog_obj_story_006_c\t1': P(['이 균열은 여기서 닫히지 않는다.', '라이트홀드라는 이름은 아직 이르다.', '우리는 다시 만나게 된다.']),

  'npc_dialog_story_noah_frick\t0': P(['더 할 말은 없다.', '심문은 끝났잖나.', '돈은 이미 받았고.']),
  'npc_dialog_story_ian_koval\t0': P(['집무 채널이다.', '급한 용건 아니면 끊겠다.', '가만히 서 있지만 마라.']),
  'npc_dialog_story_darel_sosa\t0': P(['데드코러스는 아직 움직이지 않는다.', '지금은 말로만 상대해 주지.', '코발이 준 좌표는 맞았다.']),

  'npc_dialog_sq_orren_bask\t0': P(['요새 정보반의 오렌이다.', '캠프 방향에 지도에 없는 좌표가 있다.', '식별 신호를 지운 배가 드나든다.']),
  'npc_dialog_sq_orren_bask\t1': P(['같은 수법을 솔라에서 봤다는 자가 있다.', '출항 기록만 통째로 빈 배였다더군.', '나는 그 항구엔 발을 들이지 않는다.']),
  'npc_dialog_sq_orren_bask\t2': P(['캠프 왜곡 구역은 베일 훅이 맡는다.', '그를 찾아가 입구부터 확인해라.', '정식 수사로는 올리지 마라. 아직은.']),
  'npc_dialog_sq_veil_hook\t0': P(['여기가 캠프 왜곡 구역이다.', '순찰선이 도는 주기를 재고 있다.', '순찰 용건 아니면 통신 끊는다.']),
  'npc_dialog_sq_nila_shol\t0': P(['아우라 보급 장부에서 물자가 샌다.', '빼돌린 배가 아군 신호를 달고 있다.', '켓 미온에게 먼저 대조를 맡겨라.']),
  'npc_dialog_sq_nila_shol\t1': P(['나는 흔적만 쫓는 사람이다.', '아군 도장이 찍혔다고 믿지는 마라.', '정체를 밝히는 건 켓의 몫이다.']),
  'npc_dialog_sq_nila_shol\t2': P(['매듭은 요새에서 짓겠다.', '지금은 장부부터 맞춰라.', '대조가 끝나면 요새에서 보자.']),
  'npc_dialog_sq_tolin_grave\t0': P(['요새 순찰대 톨린이다.', '용건 없으면 통신 끊겠다.', '여긴 아군 채널이야. 걱정 말고.']),
  'npc_dialog_sq_noll_pass\t0': P(['장부 세 줄이 비어 있다.', '금액은 적혀 있는데 보낸 자가 없다.', '수수료는 아이비 켄이 안다.']),
  'npc_dialog_sq_noll_pass\t1': P(['장부엔 실명이 없다.', '피 냄새는 없다. 남은 건 수수료뿐이다.', '원본은 내가 쥐고 있다.']),
  'npc_dialog_sq_noll_pass\t2': P(['어느 세력 돈이냐고는 묻지 마라.', '수수료만 확인하고 돌아와라.', '그때 원본을 펴 보이겠다.']),
  'npc_dialog_sq_ivy_kenn\t0': P(['나는 다리만 놓는다.', '오가는 이름은 적지 않는다.', '수수료는 진작에 받아 뒀고.']),
  'npc_dialog_sq_rhea_vin\t0': P(['항로에 상자 하나가 남아 있다.', '크림슨 쪽 손을 이미 탄 물건이다.', '요새 호위대가 쓰는 주파수가 아니다.']),
  'npc_dialog_sq_rhea_vin\t1': P(['일련번호는 내가 대조하겠다.', '너는 상자 위치만 확인해라.', '뚜껑은 절대 열지 마라.']),
  'npc_dialog_sq_rhea_vin\t2': P(['사본은 일 끝나고 넘기겠다.', '케이드 림에게 위치부터 받아라.', '주파수 얘기는 그다음이다.']),
  'npc_dialog_sq_kade_rim\t0': P(['나는 상자 일련번호만 적는다.', '안에 뭐가 들었는지는 안 본다.', '나머지는 레아에게 넘겨라.']),
  'npc_dialog_sq_lira_mon\t0': P(['오늘은 보고서 쓰러 온 게 아니잖아.', '칼 릿지 옆자리가 비어 있다.', '전과도 손실도 오늘은 세지 말자.']),
  'npc_dialog_sq_lira_mon\t1': P(['나는 이 관문 기록을 맡고 있다.', '여기선 다들 말을 아껴. 국경이니까.', '고향 얘기는 서로 묻지 않는다.']),
  'npc_dialog_sq_lira_mon\t2': P(['관문은 내가 닫을 테니 서두르지 마라.', '우선 잔부터 내려놓고 앉아.', '정박 자리 소문은 칼 릿지가 안다.']),
  'npc_dialog_sq_kett_mion\t0': P(['아우라 국경 장부를 맡고 있다.', '나는 식별 신호만 대조한다.', '장부에 없는 얘기면 여기까지다.']),
  'npc_dialog_sq_cal_ridge\t0': P(['아우라 국경의 술집이다.', '오늘은 출격 얘기 안 해도 된다.', '잔부터 내려놓고 앉아라.']),

  'story_dialog_obj_s034_b\t0': P(['중력 왜곡이 여기서 항로를 꺾는다.', '들어갈 길은 이 한 줄뿐이다.', '들어온 배엔 식별 신호가 없었다.']),
  'story_dialog_obj_s034_b\t1': P(['순찰 주기는 아직 못 넘긴다.', '지금은 입구만 확인해라.', '출구를 건드리면 호위가 먼저 뜬다.']),
  'story_dialog_obj_s034_c\t0': P(['순찰은 열두 박자로 돈다.', '그 틈에 숨은 거점이 드러난다.', '출구는 그때만 열린다.']),
  'story_dialog_obj_s034_c\t1': P(['출구는 현상금 사냥꾼이 지킨다.', '좌표는 넘겨줬다.', '나는 주기만 기록할 뿐이다.']),
  'story_dialog_obj_s034_e\t0': P(['신호를 지운 수법이 같다.', '아르카디아 살인사건 때 그 손이다.', '이름은 여전히 어디에도 없다.']),
  'story_dialog_obj_s034_e\t1': P(['정식 수사로는 올리지 않는다.', '같은 은폐 수법이 캠프까지 왔다.', '지워진 신호 건은 여기서 접는다.']),

  'story_dialog_obj_s035_a\t0': P(['같은 식별 신호가 장부에 있다.', '보급이 비어 나간 날과 날짜가 같다.', '흔적은 요새 필드로 이어진다.']),
  'story_dialog_obj_s035_a\t1': P(['장부에 찍힌 이름은 톨린 그레이브다.', '줄곧 아군 순찰대라고 말해 왔다.', '나는 장부만 대조했을 뿐이다.']),
  'story_dialog_obj_s035_b\t0': P(['요새 순찰대다.', '나는 이쪽 사람이야.', '내 식별 신호는 의심할 것 없다.']),
  'story_dialog_obj_s035_b\t1': P(['보급이 샜다는 건 사실이 아니다.', '아우라 장부 쪽 착오야.', '다음 채널에서 증명해 주지.']),
  'story_dialog_obj_s035_c\t0': P(['켓의 대조 결과를 들이댈 줄은 몰랐군.', '아군 주파수는 닫았다.', '이쪽이 내 진짜 채널이다.']),
  'story_dialog_obj_s035_c\t1': P(['내 호위가 곧 뜬다.', '말은 여기까지다.', '통신은 끊겠다.']),
  'story_dialog_obj_s035_e\t0': P(['보급이 샌 이유는 이걸로 밝혀졌다.', '아군이라는 말만 믿은 보고서였다.', '코어 항로 쪽 이름은 장부에만 남았다.']),
  'story_dialog_obj_s035_e\t1': P(['그 이름을 쫓을 사람은 따로 있다.', '나는 국경에서 본 것만 증언한다.', '요새 기록은 여기까지다.']),

  'story_dialog_obj_s036_a\t0': P(['나는 세 줄의 수수료만 안다.', '돈은 진작에 받았고.', '누가 시켰는지는 묻지 않았다.']),
  'story_dialog_obj_s036_a\t1': P(['원본은 놀 패스가 갖고 있다.', '나는 다리만 놨을 뿐이야.', '어느 세력인지는 본 적 없다.']),
  'story_dialog_obj_s036_b\t0': P(['문제는 이 세 줄이다.', '보낸 자리만 비어 있다.', '금액은 그대로 적혀 있고.']),
  'story_dialog_obj_s036_b\t1': P(['사본을 노리는 배가 붙었다.', '장부는 아직 내 손에 있다.', '저 호위부터 끊어라.']),
  'story_dialog_obj_s036_d\t0': P(['세 줄 다 소속 없는 계좌로 흘렀다.', '주인을 밝힐 수 없는 돈이다.', '전표엔 캠프 쪽이라고만 적혀 있다.']),
  'story_dialog_obj_s036_d\t1': P(['출처까지가 내가 아는 전부다.', '누가 받았는지는 여기 없다.', '장부는 여기서 끝이다.']),

  'story_dialog_obj_s037_a\t0': P(['상자는 하나뿐이다.', '크림슨 쪽 장갑 자국이 남아 있다.', '일련번호는 레아에게 넘기겠다.']),
  'story_dialog_obj_s037_a\t1': P(['나는 위치만 적는 사람이다.', '뚜껑은 열지 않는다.', '전표만 챙겨 가라.']),
  'story_dialog_obj_s037_b\t0': P(['일련번호가 맞다.', '아크코어 주파수를 쓰는 조각이다.', '요새 호위대 주파수가 아니다.']),
  'story_dialog_obj_s037_b\t1': P(['호위가 상자를 지키려 든다.', '격파한 뒤에 사본을 주겠다.', '지금은 손대지 마라.']),
  'story_dialog_obj_s037_d\t0': P(['이게 사본이다.', '아크코어의 조각이 맞다.', '적의 심장을 겨눈다는 건 과장이고.']),
  'story_dialog_obj_s037_d\t1': P(['이 경로는 캠프까지 이어진다.', '맞은 건 주파수뿐, 심장은 아니다.', '여기서 밝힐 수 있는 건 여기까지다.']),

  'story_dialog_obj_s038_a\t0': P(['오늘은 수사하러 온 거 아니잖아.', '솔라에 빈 정박 자리가 있었다더군.', '그 살인사건 얘기 말이야.']),
  'story_dialog_obj_s038_a\t1': P(['그 얘긴 내일 해도 늦지 않다.', '잔은 여기 있고.', '앉아라.']),
  'story_dialog_obj_s038_b\t0': P(['살아서 이 관문까지 온 날이다.', '전사자 수도 보고도 오늘은 접자.', '여기선 그런 걸 묻지 않는다.']),
  'story_dialog_obj_s038_b\t1': P(['아르카디아 얘기는 말로만 두자.', '오늘은 그 기록을 펴지 않는다.', '관문은 내가 지키고 있으니까.']),
  'story_dialog_obj_s038_c\t0': P(['아우라 관문의 하루를 정리한다.', '출정 이야기는 아직 남겨 둔다.', '오늘은 거의 비어 있는 날이다.']),
  'story_dialog_obj_s038_c\t1': P(['칼 릿지가 한 말은 적어 뒀다.', '관문은 아직 닫지 않는다.', '한 번 더 들러라.']),
  'story_dialog_obj_s038_d\t0': P(['이제 관문을 닫는다.', '내일의 출정은 내일 걱정하자.', '오늘은 여기까지다.']),
  'story_dialog_obj_s038_d\t1': P(['빈 정박 자리 소문은 접어 두자.', '오늘 하루는 수사도 없었고.', '돌아올 곳이 있다면 그게 고향이다.']),
};

const PAGE_KEEP = new Set([
  'story_dialog_story_004\t0',
  'story_dialog_story_004\t1',
  'story_dialog_obj_story_004_b\t0',
]);

const MISSION_DESC = {
  mission_001: '연방 사령부가 내린 첫 임무다. 베가 전초기지로 이동해 지휘관을 만나라.',
  mission_002: '아르카디아 주변의 해적선 1척을 격파하고 돌아오라.',
  mission_004: '중립 구역의 뉴 에덴으로 이동해 현지 상황을 파악하라.',
  story_001:
    '아르카디아 거주구에서 동기를 알 수 없는 살인 사건이 일어났다. 솔라 항구로 가 술집에서 목격자를 탐문하고, 관문 순찰대에 중간보고한 뒤 항만사령부에서 도킹 기록을 확보한다.',
  story_002:
    '비어 있는 출항 기록을 쫓아 미네르바 밀수조에 닿는다. 하수인 노아 프릭을 심문하면, 피해자가 국경 방어 함대의 함장 내정자였다는 사실이 드러난다.',
  story_003:
    '살해된 함장의 자리가 빈 채 출정이 다가온다. 사건 기록에 이름이 오른 당신이 함장 대행으로 지명되어 베가 전초 국경에 투입된다.',
  story_004:
    '베가 전초 국경에서 정찰 보고를 훨씬 넘는 규모의 기습을 받는다. 아군 함대는 무너지고 살아남은 것은 당신 하나뿐이다. 아르카디아로 귀환한다.',
  story_005:
    '생환 직후 이안 코발이 전멸 경위를 묻는다. 그리고 오래전 자신이 버린 옛 동료 이야기를 꺼내며, 답 대신 드라코 성운의 좌표와 다렐 소사라는 이름을 건넨다.',
  story_006:
    '드라코 포격전에서 잡힌 낯선 신호를 쫓는다. 기함 데드코러스를 지휘하는 자는 크림슨 총수가 아니라, 코발이 버렸던 옛 동료 다렐 소사다.',
  sandbox_034:
    '요새 정보반의 오렌 바스크가 캠프 방향에서 식별 신호를 지운 배를 포착했다. 왜곡 구역까지 쫓아가 확인하면, 아르카디아 살인사건 당시 솔라 항구에서 기록을 지우던 수법과 같은 손이다.',
  sandbox_035:
    '아우라 국경의 보급 장부에서 물자가 새고 있다. 빼돌린 배는 아군 식별 신호를 달고 있었다. 켓 미온이 대조한 장부를 들고 요새로 향하면, 아군 행세를 하던 자의 가면이 벗겨진다.',
  sandbox_036:
    '코어 항로의 장부 세 줄에 금액만 있고 보낸 자가 없다. 수수료는 이미 누군가 챙겼지만 이름은 어디에도 남지 않았다. 장부를 노리는 호위를 걷어내면, 캠프 방향의 소속 없는 계좌 하나만 남는다.',
  sandbox_037:
    '크림슨의 손을 탄 상자 하나가 코어 항로에 남아 있다. 요새 호위대가 쓰지 않는 아크코어 주파수를 달고 있다. 상자가 지나온 경로를 사본으로 떠 보면 그 끝은 캠프 베이스로 이어진다.',
  sandbox_038:
    '오늘은 출격도 임무도 없다. 아우라 국경의 술집에서 칼 릿지와 리라 몬 곁에 잠시 앉는다. 솔라의 빈 정박 자리 소문은 술자리 이야기로 흘려보내고, 하루는 여기서 접는다.',
};

const MISSION_TITLE = { story_003: '대행 출정' };

const OBJ_DESC = {
  obj_001_a: '베가 전초기지에 진입하라',
  obj_002_a: '해적 전투기 1대를 격파하라',
  obj_003_a: '솔라 항구에서 식량 팩 10개를 구매하라',
  obj_003_b: '미네르바로 배달하라',
  obj_004_a: '뉴 에덴에 도착하라',
  obj_005_a: '오메가 스테이션에 도착하라',
  obj_story_001_b: '솔라 항구 술집에서 목격자를 탐문하라',
  obj_story_001_d: '관문 순찰대장 엘렌과 대화하라',
  obj_story_001_e: '이사 벤트에게 도킹 기록을 받아라',
  obj_story_002_b: '미네르바 술집에서 밀수조 단서를 확보하라',
  obj_story_002_c: '미네르바 외곽의 호위 해적 1척을 격파하라',
  obj_story_002_e: '광산 총감독 니카 스톤에게 지휘 공백을 확인하라',
  obj_story_003_b: '엘렌에게 대행 출정 지시를 확인하라',
  obj_story_004_a: '베가 국경을 덮친 기습 함대를 격파하라',
  obj_story_004_b: '베가 순찰지휘관 하르만 돌에게 생존을 보고하라',
  obj_story_006_a: '드라코 요새의 호위 1척을 격파하라',
  obj_story_006_b: '성운 관측장 세레나 드릴에게 신호를 확인하라',
  obj_story_006_c: '기함의 다렐 소사와 대면하라',
  obj_s034_b: '베일 훅에게 캠프 입구 위치를 확인하라',
  obj_s034_c: '베일 훅에게 순찰선 주기를 받아라',
  obj_s034_d: '캠프 출구를 지키는 현상금 사냥꾼을 격파하라',
  obj_s034_e: '오렌 바스크에게 지워진 식별 신호를 보고하라',
  obj_s035_a: '켓 미온과 식별 신호를 대조하라',
  obj_s035_c: '톨린 그레이브의 위장 교신을 엿들어라',
  obj_s035_d: '톨린을 엄호하는 순양함을 격파하라',
  obj_s035_e: '요새에서 닐라 숄과 증언을 매듭지어라',
  obj_s036_a: '아이비 켄에게 중개 수수료를 물어라',
  obj_s036_b: '놀 패스에게 장부 원본을 받아 내라',
  obj_s036_d: '놀 패스에게 출처 없는 자금의 행방을 확인하라',
  obj_s037_a: '케이드 림에게 항로 상자 위치를 확인하라',
  obj_s037_b: '레아 빈과 상자 일련번호를 대조하라',
  obj_s037_c: '상자를 호위하는 전투기를 격파하라',
  obj_s037_d: '레아 빈에게서 파편 사본을 받아라',
  obj_s038_a: '술집에서 칼 릿지와 한잔 나눠라',
  obj_s038_b: '리라 몬에게 국경의 사정을 들어라',
  obj_s038_c: '리라 몬과 아우라 관문을 함께 둘러보라',
  obj_s038_d: '리라 몬과 하루를 마무리하고 관문을 나서라',
};

function longestLineLen(text) {
  let max = 0;
  for (const line of String(text).split('\n')) {
    if (line.length > max) max = line.length;
  }
  return max;
}

const mismatches = [];
let pageChanged = 0;
let pageKept = 0;

const pages = loadTable('tables/content/story_scene_pages.csv');
const pH = pages.rows[0];
const iScene = colIndex(pH, 'sceneId');
const iPage = colIndex(pH, 'pageIndex');
const iText = colIndex(pH, 'text');

for (let r = 1; r < pages.rows.length; r += 1) {
  const row = pages.rows[r];
  const key = `${row[iScene]}\t${row[iPage]}`;
  const next = PAGE_NEW[key];
  if (next == null) continue;
  if (fromCsvStoryText(row[iText]) === fromCsvStoryText(next)) {
    pageKept += 1;
    continue;
  }
  row[iText] = toCsvStoryText(next);
  pageChanged += 1;
}

const expectedKeys = Object.keys(PAGE_NEW);
for (const key of expectedKeys) {
  const [sceneId, pageIndex] = key.split('\t');
  const found = pages.rows.some(
    (row, idx) => idx > 0 && row[iScene] === sceneId && String(row[iPage]) === pageIndex,
  );
  if (!found) mismatches.push(`missing page ${key}`);
}

saveTable(pages);

const missions = loadTable('tables/content/missions.csv');
const mH = missions.rows[0];
const iMid = colIndex(mH, 'id');
const iMtitle = colIndex(mH, 'title');
const iMdesc = colIndex(mH, 'description');
let missionChanged = 0;
for (let r = 1; r < missions.rows.length; r += 1) {
  const row = missions.rows[r];
  const id = row[iMid];
  if (MISSION_TITLE[id] && row[iMtitle] !== MISSION_TITLE[id]) {
    row[iMtitle] = MISSION_TITLE[id];
    missionChanged += 1;
  }
  if (MISSION_DESC[id] && row[iMdesc] !== MISSION_DESC[id]) {
    row[iMdesc] = MISSION_DESC[id];
    missionChanged += 1;
  }
}
saveTable(missions);

const objs = loadTable('tables/content/mission_objectives.csv');
const oH = objs.rows[0];
const iOid = colIndex(oH, 'id');
const iOdesc = colIndex(oH, 'description');
let objChanged = 0;
for (let r = 1; r < objs.rows.length; r += 1) {
  const row = objs.rows[r];
  const id = row[iOid];
  if (!OBJ_DESC[id]) continue;
  if (row[iOdesc] === OBJ_DESC[id]) continue;
  row[iOdesc] = OBJ_DESC[id];
  objChanged += 1;
}
saveTable(objs);

const spine = loadTable('tables/content/main_story_quests.csv');
const sH = spine.rows[0];
const iSbind = colIndex(sH, 'bindMissionId');
const iStitle = colIndex(sH, 'titlePlaceholderKo');
let spineChanged = 0;
for (let r = 1; r < spine.rows.length; r += 1) {
  if (spine.rows[r][iSbind] === 'story_003' && spine.rows[r][iStitle] === '대타 출정') {
    spine.rows[r][iStitle] = '대행 출정';
    spineChanged += 1;
  }
}
saveTable(spine);

const steps = loadTable('tables/content/main_story_chain_steps.csv');
const stH = steps.rows[0];
const iStBind = colIndex(stH, 'bindMissionId');
const iStTitle = colIndex(stH, 'titlePlaceholderKo');
for (let r = 1; r < steps.rows.length; r += 1) {
  if (steps.rows[r][iStBind] === 'story_003' && steps.rows[r][iStTitle] === '대타 출정') {
    steps.rows[r][iStTitle] = '대행 출정';
    spineChanged += 1;
  }
}
saveTable(steps);

const scenes = loadTable('tables/content/story_scenes.csv');
const scH = scenes.rows[0];
const iScId = colIndex(scH, 'id');
const iScTitle = colIndex(scH, 'displayName');
const SCENE_TITLE = {
  story_dialog_story_003: '메인스토리·대행 출정',
  story_dialog_obj_s034_e: '서브·지워진 식별 신호',
  story_dialog_obj_s035_a: '서브·식별 신호 대조',
};
let sceneTitleChanged = 0;
for (let r = 1; r < scenes.rows.length; r += 1) {
  const id = scenes.rows[r][iScId];
  if (SCENE_TITLE[id] && scenes.rows[r][iScTitle] !== SCENE_TITLE[id]) {
    scenes.rows[r][iScTitle] = SCENE_TITLE[id];
    sceneTitleChanged += 1;
  }
}
saveTable(scenes);

const caps = loadTable('tables/content/npc_ai_captains.csv');
const cH = caps.rows[0];
const iCid = colIndex(cH, 'id');
const iCbio = colIndex(cH, 'bioShort');
const CAP_BIO = {
  npc_cpt_sq_orren_bask: '요새에서 캠프 쪽 지워진 식별 신호를 추적한다. 서브 암흑 의뢰.',
  npc_cpt_sq_kett_mion: '아우라 국경에서 식별 신호를 대조한다. 서브 이중인격자.',
};
let capChanged = 0;
for (let r = 1; r < caps.rows.length; r += 1) {
  const id = caps.rows[r][iCid];
  if (CAP_BIO[id] && caps.rows[r][iCbio] !== CAP_BIO[id]) {
    caps.rows[r][iCbio] = CAP_BIO[id];
    capChanged += 1;
  }
}
saveTable(caps);

let over20 = 0;
for (const [key, text] of Object.entries(PAGE_NEW)) {
  if (key.startsWith('intro01') || key.startsWith('mission_clear_')) continue;
  const max = longestLineLen(text);
  if (max > 20) {
    over20 += 1;
    console.log(`WARN line>20 ${key} max=${max}`);
  }
}

console.log(
  JSON.stringify(
    {
      pageChanged,
      pageExpected: expectedKeys.length,
      pageKeepListed: PAGE_KEEP.size,
      missionFieldWrites: missionChanged,
      objChanged,
      spineChanged,
      sceneTitleChanged,
      capChanged,
      over20,
      mismatches,
    },
    null,
    2,
  ),
);

if (mismatches.length) process.exit(1);
