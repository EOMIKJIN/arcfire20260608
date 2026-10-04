/**
 * 2026-10-04 대표님 지시 — 여성 NPC 인앱대사를 해요체(~요·~에요·~있죠)로.
 * 남자 말투 유지: 엘렌(관문순찰대장) · 니카(광산총감독) · 미레유(제독)
 * · 모라(해적제독) · 아델린(연방 해군 함장) · 세라 미온(퇴역함대장).
 * text 열만. 화자·씬 id·영어 열은 그대로.
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
    const same = prev.length === next.length && prev.every((value, i) => value === next[i]);
    return same ? orig : next.map(csvEscape).join(',');
  });
  writeFileSync(resolve(ROOT, table.rel), `${table.bom ? '\uFEFF' : ''}${outLines.join('\n')}\n`, 'utf8');
}

/** [sceneId, pageIndex, speakerNpcCaptainId, text] */
const PAGES = [
  ['ingame_dialog_01', '0', 'npc_cpt_operator_stella', '환영해요, [닉네임]님. 아르카디아에 도착하셨어요. 먼저 행성허브 하단의 [스캔] 버튼을 눌러 주세요.'],
  ['ingame_dialog_scan_main_quest', '0', 'npc_cpt_operator_stella', '스캔이 완료됐어요. 이제 허브 조작을 안내할게요.'],
  ['hub_tut_a2_mine', '0', 'npc_cpt_operator_stella', '채굴은 광물을 얻을 수 있는 가장 기본적인 일이에요. [채굴]을 눌러 주세요.'],
  ['hub_tut_a3_mine_ok', '0', 'npc_cpt_operator_stella', '궤도에서 광물이 들어와요. 무역소에서 판매할 수 있어요.'],
  ['hub_tut_a4_trade', '0', 'npc_cpt_operator_stella', '무역소를 열어 광물을 판매해 보세요.'],
  ['hub_tut_a5_sell', '0', 'npc_cpt_operator_stella', '판매가 확인됐어요. 전함은 조선소에서 확인하면 돼요.'],
  ['hub_tut_b1_shipyard', '0', 'npc_cpt_operator_stella', '조선소예요. 기함을 확인한 뒤 허브로 돌아와 주세요.'],
  ['hub_tut_c1_talk', '0', 'npc_cpt_operator_stella', '대화로 이 행성 함장과 통신할 수 있어요. 대화를 눌러 주세요.'],
  ['hub_tut_c2_bar', '0', 'npc_cpt_operator_stella', '바에는 의뢰와 소식이 있어요. 지금은 둘러보기만 하면 돼요. 수락은 하지 마세요.'],
  ['hub_tut_d1_wrap', '0', 'npc_cpt_operator_stella', '기본은 익히셨어요. 은하로 나가려면 출발을 쓰면 돼요.'],
  ['hub_tut_d2_depart', '0', 'npc_cpt_operator_stella', '출발을 누르면 은하 지도로 가요. 첫 임무가 열려요.'],
  ['ingame_dialog_wave_defense_end', '0', 'npc_cpt_operator_stella', '[닉네임]님. 전투가 끝났어요. 다시 정비한 뒤 다음 침공에 대비해 주세요.'],
  ['npc_dialog_operator_stella', '0', 'npc_cpt_operator_stella', '안녕하세요, [닉네임]님. 스텔라 아리스예요. 통신이 필요하면 이 채널을 열어 주세요.'],

  ['npc_dialog_eden_09', '0', 'npc_cpt_eden_09', '에덴 정비독 대기 줄이 길어요. 다음 슬롯은 좀 기다려야 해요. 급하면 다른 항구를 알아보세요.'],
  ['npc_dialog_vega_watch_02', '0', 'npc_cpt_vega_watch_02', '민간선 호위 중이에요. 동행 신청은 본부 채널로 부탁드려요.'],

  ['npc_dialog_solar_guard_01', '0', 'npc_cpt_solar_guard_01', '솔라 항구 항만사령부예요. 도킹 안내가 필요하면 항만 콘솔에 접속해 주세요.'],
  ['early_route_solar_hub', '0', 'npc_cpt_solar_guard_01', '솔라 항구 항만사령 이사예요. [닉네임]님, 도킹 슬롯 배정이 끝났어요. 은하 최대 무역 허브에 오신 걸 환영해요.'],
  ['early_route_solar_hub', '1', 'npc_cpt_solar_guard_01', '베가 공로 보상과 정부 지원금을 합치면 정규 전함 계약이 가능해요. 함선 정비소는 항만 콘솔 3번이에요.'],
  ['early_route_solar_hub', '2', 'npc_cpt_solar_guard_01', '구매 조건으로 첫 화물 운송이 붙어요. 무역·적재는 배송 한 번이면 몸에 배어요. 민간 구역 긴급 의료 물자 의뢰가 대기 중이에요.'],
  ['early_route_solar_hub', '3', 'npc_cpt_solar_guard_01', 'Lv5쯤 되면 무역로 순찰 의뢰가 열려요. 해적 잔당부터 치우고 미네르바 방향을 준비해 주세요. 항로 안정성이 곧 장비 업그레이드예요.'],
  ['story_dialog_obj_story_001_e', '0', 'npc_cpt_solar_guard_01', '순찰대가 열람을 허가해 줬어요. 식별 신호는 지워져 있고, 들어온 기록만 있고 나간 기록은 없어요.'],
  ['story_dialog_obj_story_001_e', '1', 'npc_cpt_solar_guard_01', '사본은 넘길게요. 이 사건은 일단 여기까지고, 그다음은 사령부가 이어받아요.'],

  ['npc_dialog_arc_pf_03', '0', 'npc_cpt_arc_pf_03', '보충 라인 3번이에요. 의료 물자를 우선으로 배송 중이에요.'],
  ['npc_dialog_arc_pf_06', '0', 'npc_cpt_arc_pf_06', '보충 라인 6번이에요. 연료셀 보급 임무를 수행 중이에요.'],
  ['npc_dialog_arc_pf_11', '0', 'npc_cpt_arc_pf_11', '보충 라인 11번이에요. 식수 정수 모듈을 옮기고 있어요.'],

  ['npc_dialog_bar_ret_02', '0', 'npc_cpt_bar_ret_02', '소식판 정리 중이에요. 미네르바 쪽 항로에 잡음이 좀 있더라고요. 조심해서 다니세요.'],
  ['early_route_minerva_bar', '0', 'npc_cpt_bar_ret_02', '미네르바·에덴 항로 소식판 미아예요. [닉네임]님, 광물 시세는 매일 변해요. 판매 타이밍이 수익의 절반이죠.'],
  ['early_route_minerva_bar', '1', 'npc_cpt_bar_ret_02', '자원 밀수꾼 소탕 의뢰가 올라왔어요. 채굴 직후엔 특히 조심하세요. 전투형·배송형 의뢰를 섞어서 하시면 돼요.'],
  ['early_route_minerva_bar', '2', 'npc_cpt_bar_ret_02', '정제광 샘플 배송은 뉴에덴 방향 연습에 좋아요. 바 의뢰와 궤도 함장 의뢰는 같은 판이에요. 중복 수락만 조심하세요.'],
  ['early_route_minerva_bar', '3', 'npc_cpt_bar_ret_02', '장비 풀세팅이 끝나면 드라코로 가세요. 성운 너머가 진짜 시험이에요. 의뢰판에서 동쪽 항로 관련 걸 챙기세요.'],
  ['story_dialog_obj_story_002_b', '0', 'npc_cpt_bar_ret_02', '소식판에 밀수조 표식이 남았더라고요. 외곽엔 호위가 붙어 있어요. 제가 할 말은 여기까지예요.'],
  ['story_dialog_obj_story_002_b', '1', 'npc_cpt_bar_ret_02', '하수인 이름은 노아 프릭이에요. 반드시 산 채로 데려오세요. 죽은 입은 아무 말도 못 하니까요.'],

  ['npc_dialog_bar_ret_14', '0', 'npc_cpt_bar_ret_14', '피 묻은 장갑은 문 밖에 두세요. 보급이면 앉으셔도 돼요. 치료는 다음 교대예요.'],
  ['npc_dialog_bar_ret_17', '0', 'npc_cpt_bar_ret_17', '코어 카운터예요. 지표 이야기는 사절이에요. 잔만 받으세요.'],

  ['npc_dialog_draco_obs_01', '0', 'npc_cpt_draco_obs_01', '드라코 성운 스펙트럼 채널이 열렸어요. 연구 궤도 순찰 중이에요. 관측 데이터는 본부로만 보내요. [닉네임]님, 항로만 유지해 주세요.'],
  ['early_route_draco_hub', '0', 'npc_cpt_draco_obs_01', '드라코 성운 관측 세레나예요. [닉네임]님, 뉴에덴 가는 유일한 통로예요. 전자기 폭풍으로 레이더가 불안정해요.'],
  ['early_route_draco_hub', '1', 'npc_cpt_draco_obs_01', '가시거리 제로 구간이에요. 수동 항법으로 돌파하고, 숨겨진 유도 기뢰부터 제거해 주세요.'],
  ['early_route_draco_hub', '2', 'npc_cpt_draco_obs_01', '성운 중심부에서 연방 함대와 합류해요. 해적 연합 요새와 호위 함대, 전면 포격전이에요. 풀 세팅 무장이 없으면 돌아가 주세요.'],
  ['early_route_draco_hub', '3', 'npc_cpt_draco_obs_01', '해적 총수 기함이 관문을 막고 있어요. 초반부 최종 보스전이에요. 격침한 뒤에야 뉴에덴 입항 허가가 열려요.'],
  ['story_dialog_story_006', '0', 'npc_cpt_draco_obs_01', '포격전 한가운데서 낯선 신호가 잡혔어요. 호위 한 척을 먼저 걷어내 주세요. 신호는 그다음에 쫓으면 돼요.'],
  ['story_dialog_story_006', '1', 'npc_cpt_draco_obs_01', '크림슨 총수가 쓰는 주파수가 아니더라고요. 함장 식별은 부탁드려요. 신호는 기함 쪽이 강해요.'],
  ['story_dialog_obj_story_006_b', '0', 'npc_cpt_draco_obs_01', '신호 주인은 기함 데드코러스고, 요새 호위대 주파수는 아니에요. 접근 허가는 제가 열어 둘게요.'],
  ['story_dialog_obj_story_006_b', '1', 'npc_cpt_draco_obs_01', '기함에 사람이 타고 있더라고요. 누구인지는 확인해 주세요. 저는 주파수만 잡았을 뿐이에요.'],
  ['story_dialog_story_027', '0', 'npc_cpt_draco_obs_01', '소사가 조건을 말하겠대요. 데드코러스는 동맹에 타지 않아요. 들어 주세요.'],
  ['story_dialog_obj_story_027_a', '0', 'npc_cpt_draco_obs_01', '기함은 움직이지 않아요. 말은 소사가 할 테니, 저는 주파수만 열어 둘게요.'],

  ['story_dialog_obj_story_009_d', '0', 'npc_cpt_story_mira_schenk', '라이트홀드를 죽인 건 장부였어요. 보급란 세 줄이 비어 있었고, 빈 장부는 아직 제가 갖고 있어요.'],
  ['story_dialog_obj_story_009_d', '1', 'npc_cpt_story_mira_schenk', '카일이 왔으니 화력은 됐고, 가온은 아직 에덴에 있어요. 다시 모이는 곳은 여기예요.'],
  ['story_dialog_story_010', '0', 'npc_cpt_story_mira_schenk', '가온이 에덴에서 기다려요. 지워진 행성 기록을 갖고 있어요. 먼저 그를 태워 주세요.'],
  ['story_dialog_story_010', '1', 'npc_cpt_story_mira_schenk', '넷이 모이면 장부와 화력과 기록이 한 줄이 돼요. 교차점은 이 허브예요.'],
  ['story_dialog_obj_story_010_d', '0', 'npc_cpt_story_mira_schenk', '화력, 장부, 지워진 행성, 그리고 함장. 라이트홀드 은폐는 우연이 아니에요. 베가 기습과 같은 손이에요.'],
  ['story_dialog_obj_story_010_d', '1', 'npc_cpt_story_mira_schenk', '장부 뒤에 이면 협정이 숨어 있어요. 결재는 이 허브에 남아 있죠. 다음엔 소개 명령서부터 열어요.'],
  ['story_dialog_story_011', '0', 'npc_cpt_story_mira_schenk', '이면은 이 허브의 결재에 남아 있어요. 전투가 아니라 소개 명령서부터 열어요.'],
  ['story_dialog_story_011', '1', 'npc_cpt_story_mira_schenk', '가온이 빈칸을 복원하고, 제가 결재를 역추적해요. 궤도는 건드리지 마세요.'],
  ['story_dialog_story_012', '0', 'npc_cpt_story_mira_schenk', '함장 이름이 반역자 명단에 올랐어요. 포위선이 이 허브 궤도에 떴어요.'],
  ['story_dialog_story_012', '1', 'npc_cpt_story_mira_schenk', '한 척이에요. 경로는 시리우스 보더예요. 거기서 끊고 섀도우로 가세요.'],
  ['story_dialog_story_017', '0', 'npc_cpt_story_mira_schenk', '돈이 없으니 암시장의 손을 빌릴 수밖에 없어요. 출처는 묻지 않아요. 닉스의 원칙이에요.'],
  ['story_dialog_story_017', '1', 'npc_cpt_story_mira_schenk', '닐과 나누세요. 세 건이면 버틸 수 있고, 그 이상은 욕심이에요.'],
  ['story_dialog_obj_story_017_e', '0', 'npc_cpt_story_mira_schenk', '거점 자금 세 건 정산을 끝냈어요. 이걸로 한 달은 버틸 수 있고, 배신할 여지는 장부에 적어 뒀어요.'],
  ['story_dialog_obj_story_017_e', '1', 'npc_cpt_story_mira_schenk', '더러운 돈이긴 해요. 그래도 거점은 살아남아요.'],
  ['story_dialog_obj_story_018_d', '0', 'npc_cpt_story_mira_schenk', '탄약 칸은 채워졌어요. 식량은 한 달이에요. 그 이상은 장부가 거부해요.'],
  ['story_dialog_obj_story_018_d', '1', 'npc_cpt_story_mira_schenk', '요새는 배로 버티는 게 아니라 장부가 버텨 주는 거예요. 재건은 여기까지로 하죠.'],
  ['story_dialog_obj_story_019_b', '0', 'npc_cpt_story_mira_schenk', '치는 순간 거점이 드러나고, 라이트홀드도 먼저 치다가 죽었어요. 그래서 저는 숨기는 쪽이에요.'],
  ['story_dialog_obj_story_019_b', '1', 'npc_cpt_story_mira_schenk', '장부가 있는 한 배신은 보여요. 화력만 믿으면 또 빈칸이 나요.'],
  ['story_dialog_story_020', '0', 'npc_cpt_story_mira_schenk', '배신 소문이 카일 칸에 붙었어요. 장부는 다르게 말해요. 가려 내죠.'],
  ['story_dialog_story_020', '1', 'npc_cpt_story_mira_schenk', '이간계면 문이 살아요. 진실이면 거점을 접어요.'],
  ['story_dialog_obj_story_020_a', '0', 'npc_cpt_story_mira_schenk', '카일 쪽에서 나간 돈은 탄약값이고, 크림슨 계좌하고는 맞지도 않아요. 소문은 이간질일 뿐이에요.'],
  ['story_dialog_obj_story_020_a', '1', 'npc_cpt_story_mira_schenk', '누가 뿌렸는지는 외곽 채널이에요. 거점 안은 깨끗해요. 가온에게 지도를 물어 주세요.'],
  ['story_dialog_story_024', '0', 'npc_cpt_story_mira_schenk', '사본은 오메가에 맡겨 주세요. 린이 통행세 대신 기록을 받기로 했고, 원본은 거점에 둘 거예요.'],
  ['story_dialog_obj_story_024_c', '0', 'npc_cpt_story_mira_schenk', '사본은 허브에 맡겼고, 원본은 여기 제가 갖고 있어요. 장부는 두 벌이라야 안전하니까요.'],
  ['story_dialog_obj_story_029_b', '0', 'npc_cpt_story_mira_schenk', '서명란은 비워 두고 날짜만 적었어요. 그래야 선서문이 살아남거든요. 원본은 거점에 남겨 둘게요.'],
  ['npc_dialog_story_mira_schenk', '0', 'npc_cpt_story_mira_schenk', '장부는 여기 있어요. 출처는 묻지 마시고요. 보여 줄 수 있는 것만 보여 주죠.'],
  ['story_dialog_obj_story_011_b', '0', 'npc_cpt_story_mira_schenk', '결재 시각은 테오 혼 피살 전이에요. 국경을 비우라는 이면이 숫자로 남았어요.'],
  ['story_dialog_obj_story_011_b', '1', 'npc_cpt_story_mira_schenk', '체포령 초안이 같은 묶음에 붙어 있어요. 가온이 열어 줄 거예요.'],
  ['story_dialog_obj_story_011_d', '0', 'npc_cpt_story_mira_schenk', '이면 합의 날짜와 테오 혼 피살은 같은 주기예요. 우연이 아니에요.'],
  ['story_dialog_obj_story_011_d', '1', 'npc_cpt_story_mira_schenk', '이걸 올리면 반역 누명이 함장 이름에 앉아요. 가온이 위험을 말할 거예요.'],
  ['story_dialog_obj_story_012_a', '0', 'npc_cpt_story_mira_schenk', '함장 이름이 반역자 명단에 올랐어요. 이면을 올린 대가고, 장부로는 지울 수가 없어요.'],
  ['story_dialog_obj_story_012_a', '1', 'npc_cpt_story_mira_schenk', '포위선이 떴어요. 한 척이에요. 가온이 경로를 열어요.'],
  ['story_dialog_obj_story_014_e', '0', 'npc_cpt_story_mira_schenk', '첫 거점 장부를 열어요. 출처 모를 돈은 표시만 하고, 출처는 묻지 않아요.'],
  ['story_dialog_obj_story_014_e', '1', 'npc_cpt_story_mira_schenk', '신뢰는 전투 뒤에 왔어요. 세렌 쪽 초대는 다음에 가리죠.'],
  ['story_dialog_obj_story_017_a', '0', 'npc_cpt_story_mira_schenk', '계좌를 동결해요. 움직이는 돈은 오늘부터 표시돼요.'],
  ['story_dialog_obj_story_017_a', '1', 'npc_cpt_story_mira_schenk', '출처는 묻지 않아요. 동결만 해요. 닐이 거래를 열어요.'],
  ['story_dialog_obj_story_019_e', '0', 'npc_cpt_story_mira_schenk', '균열은 기록해요. 판결은 하지 않아요. 엔딩의 첫 씨앗이에요.'],
  ['story_dialog_obj_story_019_e', '1', 'npc_cpt_story_mira_schenk', '거점은 유지해요. 노선은 아직 셋이에요.'],
  ['story_dialog_obj_story_020_e', '0', 'npc_cpt_story_mira_schenk', '넷이 서로를 믿어요. 이간 장부는 닫아요.'],
  ['story_dialog_obj_story_020_e', '1', 'npc_cpt_story_mira_schenk', '다음은 경보예요. 국가 이름은 아직 없어요.'],
  ['story_dialog_obj_story_022_a', '0', 'npc_cpt_story_mira_schenk', '이름 없는 동맹이에요. 깃발은 없어요. 장부에도 국가란은 비워 둬요.'],
  ['story_dialog_obj_story_022_a', '1', 'npc_cpt_story_mira_schenk', '건국은 나중의 장이에요. 오늘은 살아남은 넷과 세렌의 채널뿐이에요.'],

  ['story_dialog_obj_s034_b', '0', 'npc_cpt_sq_veil_hook', '중력 왜곡이 여기서 항로를 꺾어요. 들어갈 길은 이 한 줄뿐이고, 들어온 배엔 식별 신호가 없었어요.'],
  ['story_dialog_obj_s034_b', '1', 'npc_cpt_sq_veil_hook', '순찰 주기는 아직 못 넘겨요. 지금은 입구만 확인해 주세요. 출구를 건드리면 호위가 먼저 떠요.'],
  ['story_dialog_obj_s034_c', '0', 'npc_cpt_sq_veil_hook', '순찰은 열두 박자마다 한 번 돌아요. 그 틈에 숨은 거점이 드러나고, 출구도 그때만 열려요.'],
  ['story_dialog_obj_s034_c', '1', 'npc_cpt_sq_veil_hook', '출구는 현상금 사냥꾼이 지키더라고요. 좌표는 넘겨줬어요. 저는 주기만 기록할 뿐이에요.'],
  ['npc_dialog_sq_veil_hook', '0', 'npc_cpt_sq_veil_hook', '여기가 캠프 왜곡 구역이에요. 순찰선 도는 주기를 재고 있고, 순찰 용건이 아니면 통신은 끊어요.'],

  ['story_dialog_obj_s035_e', '0', 'npc_cpt_sq_nila_shol', '보급이 샌 이유는 이걸로 밝혀졌고, 아군이라는 말만 믿은 보고서였어요. 코어 항로 쪽 이름은 장부에만 남았어요.'],
  ['story_dialog_obj_s035_e', '1', 'npc_cpt_sq_nila_shol', '그 이름을 쫓을 사람은 따로 있어요. 저는 국경에서 본 것만 증언하고요. 요새 기록은 여기까지예요.'],
  ['npc_dialog_sq_nila_shol', '0', 'npc_cpt_sq_nila_shol', '아우라 장부에서 물자가 새고 있어요. 빼돌린 배가 아군 신호를 달았더라고요. 켓 미온한테 먼저 대조를 맡겨 주세요.'],
  ['npc_dialog_sq_nila_shol', '1', 'npc_cpt_sq_nila_shol', '저는 흔적만 쫓는 사람이에요. 아군 도장이 찍혔다고 믿지는 마세요. 정체를 밝히는 건 켓의 몫이에요.'],
  ['npc_dialog_sq_nila_shol', '2', 'npc_cpt_sq_nila_shol', '매듭은 요새에서 지을게요. 지금은 장부부터 맞추고요. 대조가 끝나면 요새에서 봐요.'],

  ['story_dialog_obj_s036_a', '0', 'npc_cpt_sq_ivy_kenn', '저는 세 줄의 수수료만 알아요. 돈은 진작에 받았고, 누가 시켰는지는 묻지 않았거든요.'],
  ['story_dialog_obj_s036_a', '1', 'npc_cpt_sq_ivy_kenn', '원본은 놀 패스가 갖고 있어요. 저는 다리만 놨을 뿐이고, 어느 세력인지는 본 적 없거든요.'],
  ['npc_dialog_sq_ivy_kenn', '0', 'npc_cpt_sq_ivy_kenn', '저는 다리만 놓는 사람이에요. 오가는 이름은 적지 않고요. 수수료는 진작에 받아 뒀거든요.'],

  ['story_dialog_obj_s037_b', '0', 'npc_cpt_sq_rhea_vin', '일련번호가 맞아요. 아크코어 주파수를 쓰는 조각이고, 요새 호위대 주파수는 아니에요.'],
  ['story_dialog_obj_s037_b', '1', 'npc_cpt_sq_rhea_vin', '호위가 상자를 지키려 들더라고요. 격파한 뒤에 사본을 드릴게요. 지금은 손대지 마세요.'],
  ['story_dialog_obj_s037_d', '0', 'npc_cpt_sq_rhea_vin', '이게 사본이에요. 아크코어의 조각이 맞고, 적의 심장을 겨눈다는 건 과장이지만요.'],
  ['story_dialog_obj_s037_d', '1', 'npc_cpt_sq_rhea_vin', '이 경로는 캠프까지 이어져요. 맞은 건 주파수뿐, 심장은 아니에요. 여기서 밝힐 수 있는 건 여기까지예요.'],
  ['npc_dialog_sq_rhea_vin', '0', 'npc_cpt_sq_rhea_vin', '항로에 상자 하나가 남아 있어요. 크림슨 쪽이 이미 손댄 물건이고, 요새 호위대가 쓰는 주파수는 아니에요.'],
  ['npc_dialog_sq_rhea_vin', '1', 'npc_cpt_sq_rhea_vin', '일련번호는 제가 대조할게요. 상자 위치만 확인해 주세요. 뚜껑은 절대 열지 마세요.'],
  ['npc_dialog_sq_rhea_vin', '2', 'npc_cpt_sq_rhea_vin', '사본은 일 끝나고 넘길게요. 케이드 림한테 위치부터 받아 주세요. 주파수 얘기는 그다음이에요.'],

  ['story_dialog_obj_s038_b', '0', 'npc_cpt_sq_lira_mon', '살아서 이 관문까지 온 날이에요. 전사자 수도 보고도 오늘은 접죠. 여기선 그런 걸 묻지 않아요.'],
  ['story_dialog_obj_s038_b', '1', 'npc_cpt_sq_lira_mon', '아르카디아 얘기는 말로만 두죠. 오늘은 그 기록을 펴지 않아요. 관문은 제가 지키고 있으니까요.'],
  ['story_dialog_obj_s038_c', '0', 'npc_cpt_sq_lira_mon', '아우라 관문의 하루를 정리해요. 출정 이야기는 아직 남겨 두고, 오늘은 거의 비어 있는 날이에요.'],
  ['story_dialog_obj_s038_c', '1', 'npc_cpt_sq_lira_mon', '칼 릿지 얘긴 흘려들었어요. 관문은 아직 닫지 않고요. 한 번 더 들르세요.'],
  ['story_dialog_obj_s038_d', '0', 'npc_cpt_sq_lira_mon', '이제 관문을 닫아요. 내일의 출정은 내일 걱정하죠. 오늘은 여기까지예요.'],
  ['story_dialog_obj_s038_d', '1', 'npc_cpt_sq_lira_mon', '빈 정박 자리 소문은 접어 두죠. 오늘 하루는 수사도 없었어요. 돌아올 곳이 있다면 그게 고향이에요.'],
  ['npc_dialog_sq_lira_mon', '0', 'npc_cpt_sq_lira_mon', '오늘은 보고서 쓰러 온 게 아니잖아요. 칼 릿지 옆자리가 비어 있어요. 전과도 손실도 오늘은 세지 말죠.'],
  ['npc_dialog_sq_lira_mon', '1', 'npc_cpt_sq_lira_mon', '저는 이 관문 기록을 맡고 있어요. 여기선 다들 말을 아껴요. 국경이니까요. 고향 얘기는 서로 묻지 않고요.'],
  ['npc_dialog_sq_lira_mon', '2', 'npc_cpt_sq_lira_mon', '관문은 제가 닫을 테니 서두르지 마세요. 우선 잔부터 내려놓고 앉으세요. 정박 자리 소문은 칼 릿지가 알아요.'],

  ['npc_dialog_anomaly_researcher', '0', 'npc_cpt_anomaly_researcher', '이상현상 조사반이에요. 유물일 수도, 위협일 수도 있어요. 정체는 수색으로만 확인돼요.'],
  ['npc_dialog_anomaly_researcher', '1', 'npc_cpt_anomaly_researcher', '이 행성 잔해를 수색해 주세요. 공개 전에는 더 말하지 않아요. 수락하면 조사를 맡길게요.'],
  ['npc_dialog_anomaly_researcher_abandon', '0', 'npc_cpt_anomaly_researcher', '조사는 아직 끝나지 않았어요. 중단하면 이 건은 즉시 닫혀요. 이미 건진 유물은 회수해요.'],
  ['npc_dialog_anomaly_researcher_abandon', '1', 'npc_cpt_anomaly_researcher', '여기서 조사를 멈출 수 있어요. 재개 방법은 없어요. 다음 이상현상을 기다려 주세요.'],

  ['story_dialog_obj_s056_c', '0', 'npc_cpt_sq_maya_belt', '문은 여기 있어요. 연 기록은 없고 잠근 기록만 있는데, 누가 잠갔는지는 적혀 있지 않아요.'],
  ['story_dialog_obj_s056_c', '1', 'npc_cpt_sq_maya_belt', '궤도에 차단용 배가 떠 있어요. 문을 건드리면 그 배가 먼저 뜰 테니, 저는 장부만 지킬게요.'],
  ['npc_dialog_sq_maya_belt', '0', 'npc_cpt_sq_maya_belt', '펄 채굴지에서 장부를 맡아요. 막힌 문을 적는 칸만 지키고, 이름은 올리지 않아요.'],
  ['npc_dialog_sq_maya_belt', '1', 'npc_cpt_sq_maya_belt', '용건이 있으면 짧게 말해 주세요. 장부 밖 이야기는 듣지 않아요. 항로는 그대로예요.'],
  ['npc_dialog_sq_maya_belt', '2', 'npc_cpt_sq_maya_belt', '수락하면 바로 이동이 시작돼요. 수행지는 다른 성계이고, 저는 여기서 문을 열어 줄게요.'],

  ['story_dialog_obj_s058_c', '0', 'npc_cpt_sq_iva_wren', '사본도 같은 칸이 비어 있어요. 합을 맞춰 봐도 사람은 나오지 않고, 빈 숫자는 빈 숫자로 남아요.'],
  ['story_dialog_obj_s058_c', '1', 'npc_cpt_sq_iva_wren', '현상금이 사본을 노려요. 격파한 뒤에 접어 주세요. 저는 대조만 해요.'],
  ['npc_dialog_sq_iva_wren', '0', 'npc_cpt_sq_iva_wren', '카론에서 틀린 숫자의 사본을 맡아 두는 게 제 일이에요. 제 몫은 그 칸뿐, 이름은 안 올려요.'],
  ['npc_dialog_sq_iva_wren', '1', 'npc_cpt_sq_iva_wren', '용건이 있으면 짧게 말해 주세요. 장부 밖 이야기는 듣지 않아요. 항로는 그대로예요.'],
  ['npc_dialog_sq_iva_wren', '2', 'npc_cpt_sq_iva_wren', '수락하면 곧바로 이동이에요. 가야 할 곳은 다른 성계지만, 문은 여기서 제가 열어 줘요.'],

  ['story_dialog_obj_s062_c', '0', 'npc_cpt_sq_sira_mek', '영수증의 이름 칸이 비어 있어요. 광물은 있는데 보낸 자는 없으니, 저는 그 공란만 봐요.'],
  ['story_dialog_obj_s062_c', '1', 'npc_cpt_sq_sira_mek', '이름을 채우지 마세요. 채운 전표는 회수돼요. 공란을 그대로 보여 주세요.'],
  ['story_dialog_obj_s062_d', '0', 'npc_cpt_sq_sira_mek', '공란은 그대로 둬요. 이 항로의 전표는 원래 그런 거고, 이름은 정본이 아니에요.'],
  ['story_dialog_obj_s062_d', '1', 'npc_cpt_sq_sira_mek', '카엘 본이 곧 도착해요. 전표는 여기서 넘어가고, 저는 인수 도장만 찍어요.'],
  ['npc_dialog_sq_sira_mek', '0', 'npc_cpt_sq_sira_mek', '오리온에서 이름 없는 영수증을 인수하는 게 제 몫이에요. 그 칸만 지키고, 누군지는 안 적어요.'],
  ['npc_dialog_sq_sira_mek', '1', 'npc_cpt_sq_sira_mek', '용건이 있으면 짧게 말해 주세요. 장부 밖 이야기는 듣지 않아요. 항로는 그대로예요.'],
  ['npc_dialog_sq_sira_mek', '2', 'npc_cpt_sq_sira_mek', '받겠다면 이동은 바로 시작돼요. 수행지는 다른 성계고, 여기 문은 제가 열어 두지요.'],
];

const pages = loadTable('tables/content/story_scene_pages.csv');
const header = pages.rows[0];
const iScene = header.indexOf('sceneId');
const iPage = header.indexOf('pageIndex');
const iText = header.indexOf('text');
const iSpeaker = header.indexOf('speakerNpcCaptainId');
let changed = 0;
const missing = [];
const speakerMismatch = [];

for (const [sceneId, pageIndex, speaker, next] of PAGES) {
  const row = pages.rows.find(
    (r, idx) => idx > 0 && r[iScene] === sceneId && String(r[iPage]) === pageIndex,
  );
  if (!row) {
    missing.push(`${sceneId}\t${pageIndex}`);
    continue;
  }
  if ((row[iSpeaker] || '').trim() !== speaker) {
    speakerMismatch.push(`${sceneId}\t${pageIndex} have=${row[iSpeaker]} want=${speaker}`);
    continue;
  }
  if (row[iText] === next) continue;
  row[iText] = next;
  changed += 1;
}

saveTable(pages);
console.log('pages', PAGES.length, 'changed', changed, 'missing', missing.length, 'speakerMismatch', speakerMismatch.length);
if (missing.length) console.log(missing.join('\n'));
if (speakerMismatch.length) console.log(speakerMismatch.join('\n'));
if (missing.length || speakerMismatch.length) process.exitCode = 1;
