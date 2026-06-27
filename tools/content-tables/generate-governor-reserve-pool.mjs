#!/usr/bin/env node
/**
 * 총사령관 예비 함장 풀 — 스텔리움(블루) / 크림슨(레드) / 중립 각 20·20·5
 * 산출: planet_governor_reserve_commanders.csv + npc_ai_captains append + story scenes
 */
import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const TABLE = resolve(ROOT, 'tables', 'content');
const RESERVE_CSV = resolve(TABLE, 'planet_governor_reserve_commanders.csv');

const BLUE_SHIPS = [
  'npc_blue_fleet_1', 'npc_blue_fleet_2', 'npc_blue_fleet_3', 'npc_blue_fleet_4',
  'npc_blue_fleet_5', 'npc_blue_fleet_6', 'npc_gov_minerva_flagship', 'npc_gov_iron_flagship',
  'npc_gov_helios_flagship', 'npc_solar_guard_1', 'npc_solar_guard_2', 'npc_vega_guard_1',
];
const RED_SHIPS = [
  'npc_enemy_arcadia_01', 'npc_enemy_solar_01', 'npc_enemy_minerva_01', 'npc_enemy_vega_01',
  'npc_enemy_eden_01', 'npc_enemy_iron_01', 'npc_enemy_draco_01', 'npc_enemy_omega_01',
  'npc_enemy_sirius_01', 'npc_enemy_crimson_01', 'npc_enemy_dark_01', 'npc_enemy_blood_01',
];
const NEUTRAL_SHIPS = ['npc_gov_helios_flagship', 'npc_enemy_shadow_01', 'npc_enemy_titan_03'];

const BLUE_POOL = [
  ['01', '카일 델', '제독', '서부전선 제독', 'federation_military'],
  ['02', '리나 오르', '대장', '연합기동군단장', 'federation'],
  ['03', '마르셀 킨', '군단장', '항로방위사령', 'border_watch'],
  ['04', '세라 몬트', '함대장', '궤도방어사령', 'federation_military'],
  ['05', '토바스 린', '전략장', '작전기획국장', 'federation'],
  ['06', '유리아 벡', '순항사령', '원정순항본부장', 'federation_military'],
  ['07', '헬레나 쿠', '방어사령', '요새방어사령관', 'border_watch'],
  ['08', '이안 크로스', '초계장', '변경초계총감', 'border_watch'],
  ['09', '노바 스톤', '호위사령', '무역호위총감', 'federation'],
  ['10', '알렉스 드레', '특임장', '특수작전장', 'federation_military'],
  ['11', '한설 율', '전선장', '서부전선총감', 'federation_military'],
  ['12', '길버트 안', '기동장', '기동함대사령', 'federation'],
  ['13', '페네 장', '정찰장', '정찰전단장', 'border_watch'],
  ['14', '오스카 민', '지원장', '전략지원사령', 'miners_guild'],
  ['15', '카렌 송', '연합장', '스텔리움 연합장', 'federation'],
  ['16', '비토 델', '성계장', '성계방위사령', 'federation_military'],
  ['17', '클라라 하', '수비장', '거점수비사령', 'federation'],
  ['18', '마르틴 네오', '교전장', '교전지휘관', 'federation_military'],
  ['19', '엘라 솔', '태양장', '태양권 파견장', 'energy_corp'],
  ['20', '로젤린 파크', '방위장', '방위연합총감', 'federation'],
];

const RED_POOL = [
  ['01', '발크 크림손', '군주', '크림슨 군단장', 'pirates'],
  ['02', '세라 피멸', '전대장', '붉은 전대사령', 'pirates'],
  ['03', '가론 매', '약탈장', '약탈전단장', 'void_walkers'],
  ['04', '이자벨 프리스트', '혈전장', '혈전사령관', 'trade_coalition'],
  ['05', '다리우스 솔', '암흑장', '암시장 군벌', 'black_market'],
  ['06', '맥시밀 게이트', '문지기', '심연 문지기', 'unknown'],
  ['07', '노아 달', '야습장', '나이트폴 군주', 'dark_lords'],
  ['08', '에밀 코어빈', '수문장', '코어 수문장', 'ancients'],
  ['09', '라일리 에테', '영원장', '영원 군단장', 'ancients'],
  ['10', '빅터 타우', '차단장', '항로 차단장', 'archaeologists'],
  ['11', '조나단 페르', '침투장', '변경 침투장', 'pirates'],
  ['12', '클로 오메', '습격장', '회항로 습격장', 'pirates'],
  ['13', '헬릭스 플레임', '강습장', '태양권 강습장', 'energy_corp'],
  ['14', '미라 식스', '왜곡장', '공간 왜곡장', 'void_walkers'],
  ['15', '코르빈 블레드', '전리장', '전리품 감독', 'trade_coalition'],
  ['16', '아르테 진홍', '포위장', '포위전사령', 'pirates'],
  ['17', '폴렉스 델타', '사냥장', '교차점 사냥꾼', 'pirates'],
  ['18', '세레스 이본', '봉쇄장', '관문 봉쇄장', 'unknown'],
  ['19', '제로 그라비', '감시장', '고대 감시자', 'ancients'],
  ['20', '엔드 피니', '왕좌장', '왕좌 요격장', 'ancients'],
];

const NEUTRAL_POOL = [
  ['01', '태온 스틸', '관리인', '중립 행정장', 'energy_corp'],
  ['02', '메리 클라', '중재장', '중립 중재관', 'black_market'],
  ['03', '토르가드', '유적장', '유적 수호장', 'archaeologists'],
  ['04', '노아 제네시스', '수문장', '기원 수문장', 'creators'],
  ['05', '플로라 이리', '감시장', '중립 감시장', 'ancients'],
];

function sideMeta(side) {
  if (side === 'BLUE') {
    return {
      combatTeam: 'blue',
      dialogSceneId: 'npc_dialog_gov_blue_reserve',
      friendly: 'federation|federation_military|border_watch|miners_guild',
      hostile: 'pirates|trade_coalition|void_walkers|scavengers',
      talk: 'TRUE',
      rankDefault: '대장',
    };
  }
  if (side === 'RED') {
    return {
      combatTeam: 'red',
      dialogSceneId: 'npc_dialog_gov_red_hostile',
      friendly: 'pirates|trade_coalition|void_walkers|scavengers|dark_lords|ancients',
      hostile: 'federation|federation_military|border_watch|independent',
      talk: 'FALSE',
      rankDefault: '군주',
    };
  }
  return {
    combatTeam: 'none',
    dialogSceneId: 'npc_dialog_gov_neutral_reserve',
    friendly: 'independent|scientists|energy_corp|archaeologists',
    hostile: 'pirates|trade_coalition',
    talk: 'TRUE',
    rankDefault: '관리인',
  };
}

function findShipTemplateLine(shipsText, shipId) {
  for (const line of shipsText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const comma = line.indexOf(',');
    if (comma < 0) continue;
    const secondComma = line.indexOf(',', comma + 1);
    if (secondComma < 0) continue;
    const id = line.slice(comma + 1, secondComma);
    if (id === shipId) return line;
  }
  throw new Error(`generate-governor-reserve-pool: template ship missing ${shipId}`);
}

function cloneReserveShipLine(templateLine, { shipId, shipName, captainId, suffixTag }) {
  const parts = templateLine.split(',');
  parts[0] = 'combat';
  parts[1] = shipId;
  parts[2] = shipName;
  parts[5] = captainId;
  if (parts.length > 31) {
    parts[31] = suffixTag;
  }
  return parts.join(',');
}

function buildRows(side, pool, ships, shipTemplatesText) {
  const meta = sideMeta(side);
  return pool.map(([ord, name, rankKo, titleKo, factionId], idx) => {
    const sideKey = side.toLowerCase();
    const captainId = `npc_cpt_gov_reserve_${sideKey}_${ord}`;
    const assignedShipId = `npc_ship_gov_reserve_${sideKey}_${ord}`;
    const templateShipId = ships[idx % ships.length];
    const shipLine = cloneReserveShipLine(findShipTemplateLine(shipTemplatesText, templateShipId), {
      shipId: assignedShipId,
      shipName: `${titleKo} 기함`,
      captainId,
      suffixTag: `GOV-RES-${side}-${ord}`,
    });
    return {
      captainId,
      occupationSide: side,
      rankKo,
      governorTitleKo: titleKo,
      displayName: name,
      factionId,
      dialogSceneId: meta.dialogSceneId,
      assignedShipId,
      reserveOrder: String(Number(ord)),
      enabled: 'true',
      notesKo: `${side === 'BLUE' ? '스텔리움' : side === 'RED' ? '크림슨' : '중립'} 예비 총사령관 ${ord}`,
      npcLine: [
        captainId, name, rankKo, factionId, 'standard', 'garrison',
        `${titleKo} — 점령지 파견 예비 총사령관 후보.`, 'general', meta.combatTeam,
        meta.friendly, meta.hostile,
        'arcadia_prime', 'arcadia_prime', 'arcadia', 'arcadia',
        assignedShipId, '12', '0', '110', '55', '18',
        'FALSE', '', '', 'FALSE', meta.talk, '2', meta.dialogSceneId,
        '', '', '', '',
      ].join(','),
      shipLine,
    };
  });
}

const shipsPath = resolve(TABLE, 'npc_ai_ships.csv');
const shipTemplatesText = readFileSync(shipsPath, 'utf8');

const all = [
  ...buildRows('BLUE', BLUE_POOL, BLUE_SHIPS, shipTemplatesText),
  ...buildRows('RED', RED_POOL, RED_SHIPS, shipTemplatesText),
  ...buildRows('NEUTRAL', NEUTRAL_POOL, NEUTRAL_SHIPS, shipTemplatesText),
];

const header =
  'captainId,occupationSide,rankKo,governorTitleKo,dialogSceneId,assignedShipId,reserveOrder,enabled,notesKo\n';
const body = all
  .map(
    (r) =>
      `${r.captainId},${r.occupationSide},${r.rankKo},${r.governorTitleKo},${r.dialogSceneId},${r.assignedShipId},${r.reserveOrder},${r.enabled},${r.notesKo}`,
  )
  .join('\n');
writeFileSync(RESERVE_CSV, header + body + '\n', 'utf8');

const captainsPath = resolve(TABLE, 'npc_ai_captains.csv');
const captainsLines = readFileSync(captainsPath, 'utf8').trimEnd().split(/\r?\n/);
const headerLine = captainsLines[0];
const filtered = captainsLines.filter(
  (line, idx) => idx === 0 || !line.startsWith('npc_cpt_gov_reserve_'),
);
const toAppend = all.filter((r) => !filtered.some((line) => line.startsWith(r.captainId + ',')));
writeFileSync(
  captainsPath,
  [...filtered, ...toAppend.map((r) => r.npcLine)].join('\n') + '\n',
  'utf8',
);

const shipLines = shipTemplatesText.trimEnd().split(/\r?\n/);
const shipFiltered = shipLines.filter(
  (line, idx) => idx === 0 || !line.includes(',npc_ship_gov_reserve_'),
);
writeFileSync(
  shipsPath,
  [...shipFiltered, ...all.map((r) => r.shipLine)].join('\n') + '\n',
  'utf8',
);

function ensureStoryScene(sceneId, displayName, speakerCaptainId, labelKo, textKo, labelEn, textEn) {
  const scenesPath = resolve(TABLE, 'story_scenes.csv');
  const pagesPath = resolve(TABLE, 'story_scene_pages.csv');
  let scenes = readFileSync(scenesPath, 'utf8');
  if (!scenes.includes(sceneId)) {
    appendFileSync(
      scenesPath,
      `${sceneId},${displayName},manual,,repeat,4,none,/(game)/planet,TRUE,80,FALSE,0,FALSE,0\n`,
      'utf8',
    );
  }
  let pages = readFileSync(pagesPath, 'utf8');
  if (!pages.includes(`${sceneId},0,`)) {
    const textEsc = `"${textKo.replace(/\n/g, '\\n').replace(/"/g, '""')}"`;
    const textEnEsc = `"${textEn.replace(/\n/g, '\\n').replace(/"/g, '""')}"`;
    const labelEnEsc = labelEn.includes(',') ? `"${labelEn}"` : labelEn;
    appendFileSync(
      pagesPath,
      `${sceneId},0,${labelKo},${textEsc},,${speakerCaptainId},ingame_dialog,compact,100,${textEnEsc},${labelEnEsc}\n`,
      'utf8',
    );
  }
}

ensureStoryScene(
  'npc_dialog_gov_blue_reserve',
  '블루 총사령관 예비',
  'npc_cpt_gov_reserve_blue_01',
  '[ 행성 총사령관 ]',
  '[닉네임], 스텔리움 연합 소속 행성총사령관이다.\n전선 교전으로 이 거점 점령·방어 임무를 맡았다.\n협력 채널은 열려 있다.',
  '[ Planet Commander ]',
  '[Pilot], Stellium Alliance planetary commander.\nAssigned to hold this front after recent combat.\nCooperation channels remain open.',
);

ensureStoryScene(
  'npc_dialog_gov_neutral_reserve',
  '중립 총사령관 예비',
  'npc_cpt_gov_reserve_neutral_01',
  '[ 행성 관리인 ]',
  '중립 행정 위탁 구역이다.\n아크코어 중재 하에 점령 상태가 갱신되었다.\n무장 침입은 보고 대상이다.',
  '[ Planet Administrator ]',
  'Neutral-administered sector.\nOccupation updated under ArcCore arbitration.\nArmed intrusion must be reported.',
);

console.log(`reserve_rows=${all.length} csv=${RESERVE_CSV}`);
console.log(`npc_captains_written=${toAppend.length}`);
console.log(`npc_ships_written=${all.length}`);
