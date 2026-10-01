/**
 * 본편 전수검수 1안 — 수락 Lv 유지, 전투 행성·정체 도달만 조정.
 * 실행: node tools/content-tables/_apply-quest-level-flow-20261001.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const tables = path.join(root, 'tables/content');

function read(name) {
  return fs.readFileSync(path.join(tables, name), 'utf8').replace(/^\uFEFF/, '');
}
function write(name, text) {
  fs.writeFileSync(path.join(tables, name), text.endsWith('\n') ? text : `${text}\n`);
}
function replaceLine(text, startsWith, next) {
  const lines = text.split(/\r?\n/);
  let hit = 0;
  const out = lines.map((line) => {
    if (line.startsWith(startsWith)) {
      hit += 1;
      return next;
    }
    return line;
  });
  if (hit !== 1) throw new Error(`replaceLine ${startsWith} hit=${hit}`);
  return out.join('\n');
}
function dropLines(text, pred) {
  return text.split(/\r?\n/).filter((line) => !pred(line)).join('\n');
}

let missions = read('missions.csv');
missions = replaceLine(
  missions,
  'story_012,',
  'story_012,반역자의 이름,이면 협정 폭로 뒤 반역 누명이 씌워진다. 캘리스에서 경로를 받은 뒤 아이언 잔해권에서 추격 1척을 끊고 섀도우로 향한다.,combat,npc_cpt_story_mira_schenk,omega_hub,15,4000,860,,0,story_011,story_013,14,,,,The Traitor’s Name,"After the accord leak, a traitor brand lands. Take the Callis lane, cut 1 pursuit ship at Iron remnant, then run for Shadow.",0',
);
missions = replaceLine(
  missions,
  'story_014,',
  'story_014,첫 신뢰,크림슨 궤도 약탈선 1척을 격파한 뒤에야 섀도우 거점이 열린다. 대화만으로는 증명되지 않는다.,combat,npc_cpt_story_nyx_holm,shadow_market,25,3600,780,,0,story_013,story_015,12,,,,First Trust,The hold opens only after one raid ship falls in Crimson orbit. Talk alone does not prove it.,0',
);
missions = replaceLine(
  missions,
  'story_016,',
  'story_016,외곽의 잔해,시리우스 보더 외곽 잔해에서 크림슨 표식을 확인한다. 본대 침공은 아니다.,explore,npc_cpt_story_seren_vale,sirius_border,25,4400,940,,0,story_015,story_017,14,,,,Rim Wreckage,Confirm the Crimson mark on wreckage at Sirius Border. Not a main-force invasion.,0',
);
missions = replaceLine(
  missions,
  'story_021,',
  'story_021,섀도우 넥서스 공방전,경보 뒤 블러드 필드에서 진압선 1척을 격파하고 섀도우로 돌아와 퇴각을 확인한다. 끝은 주민의 질문이다. 우리를 뭐라고 부르나.,combat,npc_cpt_story_kyle_loren,shadow_market,28,4800,1040,,0,story_020,story_022,16,,,,The Shadow Nexus Siege,"After the alarm, stand down one suppression ship at Blood Field and confirm the retreat at Shadow. The close is a resident question: what do you call us?",0',
);
missions = missions.replace(
  /^story_028,크림슨의 다음 손,([^,]*),combat,npc_cpt_story_nyx_holm,shadow_market,25,/m,
  'story_028,크림슨의 다음 손,$1,combat,npc_cpt_story_nyx_holm,shadow_market,40,',
);
if (!missions.includes('story_028,크림슨의 다음 손,')) throw new Error('story_028 row missing');
if (!/,40,4000,860,,0,story_027,story_029,/.test(missions) && !missions.includes('shadow_market,40,4000,860')) {
  // fallback exact
}
if (!missions.split(/\r?\n/).some((l) => l.startsWith('story_028,') && l.includes(',40,'))) {
  throw new Error('story_028 level not 40');
}
write('missions.csv', missions);

let objs = read('mission_objectives.csv');
const objRepl = [
  ['story_007,obj_story_007_c,', 'story_007,obj_story_007_c,베가 전초기지에 도착해 빈자리를 확인하라,reach_planet,vega_base,,Arrive at Vega Outpost and confirm the empty chair'],
  ['story_008,obj_story_008_a,', 'story_008,obj_story_008_a,드라코 성운 헤이븐으로 귀환하라,reach_planet,draco_haven,,Return to Draco Nebula Haven'],
  ['story_012,obj_story_012_c,', 'story_012,obj_story_012_c,아이언 크로스 레므난트에 도착하라,reach_planet,iron_remnant,,Arrive at Iron Cross Remnant'],
  ['story_012,obj_story_012_d,', 'story_012,obj_story_012_d,아이언 궤도 추격선 1척을 격파하라,defeat_enemy,pirate_fighter,1,Destroy 1 pursuit ship in Iron orbit'],
  ['story_012,obj_story_012_e,', 'story_012,obj_story_012_e,가온에게 섀도우 넥서스 좌표를 받아라,talk_npc,npc_cpt_story_gaon_tela|iron_remnant,,Take the Shadow Nexus fix from Gaon'],
  ['story_014,obj_story_014_b,', 'story_014,obj_story_014_b,크림슨 구역 베이스에 도착하라,reach_planet,crimson_base,,Arrive at Crimson Base'],
  ['story_014,obj_story_014_c,', 'story_014,obj_story_014_c,크림슨 궤도 약탈선 1척을 격파하라,defeat_enemy,pirate_fighter,1,Destroy 1 raid ship in Crimson orbit'],
  ['story_016,obj_story_016_a,', 'story_016,obj_story_016_a,시리우스 보더에 도착하라,reach_planet,sirius_border,,Arrive at Sirius Border'],
  ['story_017,obj_story_017_c,', 'story_017,obj_story_017_c,뉴에덴 프라임에 동결 증서를 맡겨라,reach_planet,eden_city,,Leave the freeze writ at New Eden Prime'],
  ['story_019,obj_story_019_d,', 'story_019,obj_story_019_d,아이언 잔해권에서 화력 노선을 확인해라,reach_planet,iron_remnant,,Confirm the fire line at Iron remnant'],
  ['story_020,obj_story_020_c,', 'story_020,obj_story_020_c,오메가 허브에서 조작 통신을 추적하라,reach_planet,omega_hub,,Trace the forged comm at Omega Hub'],
  ['story_020,obj_story_020_d,', 'story_020,obj_story_020_d,가온에게 스텔리움 정보국을 확인하라,talk_npc,npc_cpt_story_gaon_tela|omega_hub,,Confirm Stellium intelligence as the source'],
  ['story_020,obj_story_020_e,', 'story_020,obj_story_020_e,미라에게 넷의 결속을 받아라,talk_npc,npc_cpt_story_mira_schenk|omega_hub,,Take the four’s bond from Mira'],
  ['story_021,obj_story_021_b,', 'story_021,obj_story_021_b,블러드 필드 스테이션에 도착하라,reach_planet,blood_station,,Arrive at Blood Field Station'],
  ['story_021,obj_story_021_c,', 'story_021,obj_story_021_c,블러드 궤도 진압선 1척을 격파하라,defeat_enemy,pirate_cruiser,1,Destroy 1 suppression ship in Blood Field orbit'],
  ['story_021,obj_story_021_d,', 'story_021,obj_story_021_d,닐에게 우리를 뭐라고 부르는지 들어라,talk_npc,npc_cpt_bar_ret_15|shadow_market,,Hear Nil ask what we are called'],
  ['story_022,obj_story_022_c,', 'story_022,obj_story_022_c,시리우스 보더에 도착하라,reach_planet,sirius_border,,Arrive at Sirius Border'],
];
for (const [prefix, next] of objRepl) objs = replaceLine(objs, prefix, next);
write('mission_objectives.csv', objs);

let ops = read('mission_quest_combat_ops.csv');
ops = replaceLine(
  ops,
  'qco_obj_story_012_c,',
  'qco_obj_story_012_d,obj_story_012_d,hub_orbit,iron_remnant,본편 q12 — 아이언 잔해권 추격 1척',
);
ops = replaceLine(
  ops,
  'qco_obj_story_014_b,',
  'qco_obj_story_014_c,obj_story_014_c,hub_orbit,crimson_base,본편 q14 — 크림슨 궤도 약탈 1척',
);
ops = replaceLine(
  ops,
  'qco_obj_story_021_b,',
  'qco_obj_story_021_c,obj_story_021_c,hub_orbit,blood_station,본편 q21 — 블러드 궤도 진압 1척',
);
write('mission_quest_combat_ops.csv', ops);

let caps = read('mission_combat_captains.csv');
if (!caps.includes('mcap_pf_crimson,')) {
  caps = caps.replace(
    'mcap_pf_shadow,pirate_fighter,shadow_market,npc_cpt_enemy_shadow_01,10\n',
    'mcap_pf_shadow,pirate_fighter,shadow_market,npc_cpt_enemy_shadow_01,10\nmcap_pf_crimson,pirate_fighter,crimson_base,npc_cpt_enemy_crimson_03,10\n',
  );
}
if (!caps.includes('mcap_pc_blood,')) {
  caps = caps.replace(
    'mcap_pc_vega,pirate_cruiser,vega_base,npc_cpt_enemy_vega_01,10\n',
    'mcap_pc_vega,pirate_cruiser,vega_base,npc_cpt_enemy_vega_01,10\nmcap_pc_blood,pirate_cruiser,blood_station,npc_cpt_enemy_blood_03,10\n',
  );
}
write('mission_combat_captains.csv', caps);

let quests = read('main_story_quests.csv');
quests = quests.replace(
  'story_c01_q12,ms_ch_01,12,story_012,ready,spine,0,반역자의 이름,The Traitor’s Name,캘리스 돌파 1척. 아르카디아 추격 삭제',
  'story_c01_q12,ms_ch_01,12,story_012,ready,spine,0,반역자의 이름,The Traitor’s Name,캘리스 대화 유지. 전투는 아이언 TCL15',
);
quests = quests.replace(
  'story_c01_q14,ms_ch_01,14,story_014,ready,spine,0,첫 신뢰,First Trust,챕터1 본문 실기. 세부 대사 이후 수정',
  'story_c01_q14,ms_ch_01,14,story_014,ready,spine,0,첫 신뢰,First Trust,섀도우 대화 유지. 전투는 크림슨 TCL25',
);
quests = quests.replace(
  'story_c01_q15,ms_ch_01,15,story_015,ready,spine,0,함정인가 기회인가,Trap or Chance,시리우스 보더(세렌 벨트 별칭). 함정/기회',
  'story_c01_q15,ms_ch_01,15,story_015,ready,spine,0,함정인가 기회인가,Trap or Chance,시리우스 보더(세렌 벨트 별칭). 함정/기회',
);
quests = quests.replace(
  'story_c01_q16,ms_ch_01,16,story_016,ready,spine,0,두 개의 적,Two Enemies,챕터1 본문 실기. 세부 대사 이후 수정',
  'story_c01_q16,ms_ch_01,16,story_016,ready,spine,0,외곽의 잔해,Rim Wreckage,선두 reach 시리우스. 잔해/표식',
);
quests = quests.replace(
  'story_c01_q21,ms_ch_01,21,story_021,ready,spine,0,섀도우 넥서스 공방전,The Shadow Nexus Siege,1척+주민 질문. 웨이브 HOLD',
  'story_c01_q21,ms_ch_01,21,story_021,ready,spine,0,섀도우 넥서스 공방전,The Shadow Nexus Siege,전투는 블러드 TCL28. 주민 질문은 섀도우',
);
write('main_story_quests.csv', quests);

const dropSceneIds = new Set([
  'story_dialog_obj_story_007_c',
  'story_dialog_obj_story_008_a',
  'story_dialog_obj_story_012_d',
  'story_dialog_obj_story_014_b',
  'story_dialog_obj_story_014_c',
  'story_dialog_obj_story_016_a',
  'story_dialog_obj_story_017_c',
  'story_dialog_obj_story_019_d',
  'story_dialog_obj_story_020_c',
  'story_dialog_obj_story_021_c',
  'story_dialog_obj_story_022_c',
]);

let scenes = read('story_scenes.csv');
scenes = dropLines(scenes, (line) => {
  const id = line.split(',')[0];
  return dropSceneIds.has(id);
});
scenes = scenes.replace(
  'story_dialog_story_016,메인스토리·두 개의 적,',
  'story_dialog_story_016,메인스토리·외곽의 잔해,',
);
scenes = scenes.replace(
  'story_dialog_obj_story_021_d,메인스토리·가온에게 퇴각 지도를 접어라,',
  'story_dialog_obj_story_021_d,메인스토리·닐에게 우리를 뭐라고 부르는지 들어라,',
);
write('story_scenes.csv', scenes);

let pages = read('story_scene_pages.csv');
pages = dropLines(pages, (line) => {
  const id = line.split(',')[0];
  return dropSceneIds.has(id) || id === 'story_dialog_obj_story_021_d';
});
pages = pages.replace(
  'story_dialog_obj_story_007_b,1,[ 다렐 소사 ],그 자장가를 끊은 손이 베가 전멸과 같다. 은폐는 사령부에서 시작했다.,',
  'story_dialog_obj_story_007_b,1,[ 다렐 소사 ],그 자장가를 끊은 손이 베가 전멸과 같다. 이자가 테오 혼의 죽음이다. 베가에 가서 빈자리를 확인해라.,',
);
pages = pages.replace(
  'The hand that cut that lullaby is the same as the Vega wipe. The concealment began at command.',
  'The hand that cut that lullaby is the same as the Vega wipe. The interest is Theo Hon’s death. Go to Vega and confirm the empty chair.',
);
pages = pages.replace(
  'story_dialog_obj_story_012_b,1,[ 가온 텔라 ],관문 순찰대는 여기 없다. 살아서 나가라.,',
  'story_dialog_obj_story_012_b,1,[ 가온 텔라 ],관문 순찰대는 여기 없다. 돌파 끝은 아이언 잔해권이다. 살아서 나가라.,',
);
pages = pages.replace(
  'Gate Patrol is not here. Get out alive.',
  'Gate Patrol is not here. The breakout ends at Iron remnant. Get out alive.',
);
pages = pages.replace(
  'story_dialog_story_012,1,[ 미라 솅크 ],한 척이다. 가온이 경로를 연다. 살아서 섀도우로 가라.,',
  'story_dialog_story_012,1,[ 미라 솅크 ],한 척이다. 경로는 아이언 잔해권이다. 거기서 끊고 섀도우로 가라.,',
);
pages = pages.replace(
  'One ship. Gaon opens the lane. Get out alive to Shadow.',
  'One ship. The lane is Iron remnant. Cut it there, then run for Shadow.',
);
pages = pages.replace(
  'story_dialog_obj_story_014_a,0,[ 카일 로렌 ],약탈 경보다. 한 척이다. 입구 화력은 내가 맡는다.,',
  'story_dialog_obj_story_014_a,0,[ 카일 로렌 ],약탈 경보다. 한 척이 크림슨 항로에서 뜬다. 거점 앞이 아니다.,',
);
pages = pages.replace(
  'Raid alarm. One ship. I hold the guns at the entrance.',
  'Raid alarm. One ship lifts on the Crimson lane. Not at this door.',
);
pages = pages.replace(
  'story_dialog_obj_story_014_a,1,[ 카일 로렌 ],쓰러뜨리면 닉스가 문을 연다. 그전에는 거점 없다.,',
  'story_dialog_obj_story_014_a,1,[ 카일 로렌 ],크림슨에서 쓰러뜨리면 닉스가 문을 연다. 그전에는 거점 없다.,',
);
pages = pages.replace(
  'Drop it and Nyx opens the door. No hold before that.',
  'Drop it at Crimson and Nyx opens the door. No hold before that.',
);
pages = pages.replace(
  'story_dialog_obj_story_016_b,0,[ 세렌 베일 ],잔해 표식은 크림슨이다. 추적선이지 침공 함대가 아니다.,',
  'story_dialog_obj_story_016_b,0,[ 세렌 베일 ],외곽 잔해다. 위조 초대의 뼈대고 표식은 크림슨이다. 추적선이지 침공 함대가 아니다.,',
);
pages = pages.replace(
  'The wreck mark is Crimson. A tracker, not an invasion fleet.',
  'Rim wreckage. Bone of a forged invite, and the mark is Crimson. A tracker, not an invasion fleet.',
);
pages = pages.replace(
  'story_dialog_story_016,메인스토리',
  'story_dialog_story_016,메인스토리',
);
pages = pages.replace(
  'story_dialog_obj_story_017_b,1,[ 닐 벡스 ],',
  'story_dialog_obj_story_017_b,1,[ 닐 벡스 ],',
);
pages = pages.replace(
  'story_dialog_obj_story_021_a,0,[ 카일 로렌 ],입구 포문은 열어 뒀다. 뜨는 건 어차피 한 척뿐이니 그 한 척만 끊으면 진압군은 물러난다.,',
  'story_dialog_obj_story_021_a,0,[ 카일 로렌 ],입구 포문은 열어 뒀다. 뜨는 한 척은 블러드 필드 항로다. 거기서 끊으면 진압군은 물러난다.,',
);
pages = pages.replace(
  'The entrance guns are live. Only one ship is going to lift, and once that ship is cut, the suppression force pulls back.',
  'The entrance guns are live. The one ship lifts on the Blood Field lane. Cut it there and the suppression force pulls back.',
);
pages = pages.replace(
  'story_dialog_obj_story_021_a,1,[ 카일 로렌 ],나는 문을 선다. 너는 궤도에서 쳐라.,',
  'story_dialog_obj_story_021_a,1,[ 카일 로렌 ],나는 문을 선다. 너는 블러드 궤도에서 쳐라.,',
);
pages = pages.replace(
  'I stand the door. You hit in orbit.',
  'I stand the door. You hit in Blood Field orbit.',
);

const nilPages = [
  'story_dialog_obj_story_021_d,0,[ 닐 벡스 ],문은 지켜 냈고 진압군은 물러갔다. 그런데 우릴 뭐라고 부르나.,assets/images/npc/noname_char004.png,npc_cpt_bar_ret_15,ingame_dialog,compact,100,We held the door and the suppression force pulled back. So what do you call us?,[ Nil Vex ],,',
  'story_dialog_obj_story_021_d,1,[ 닐 벡스 ],국가는 아직 없다. 이름은 내일이다. 오늘은 살아남은 것뿐이다.,assets/images/npc/noname_char004.png,npc_cpt_bar_ret_15,ingame_dialog,compact,100,There is no nation yet. The name is tomorrow. Today we only survived.,[ Nil Vex ],,',
];
const pageLines = pages.split(/\r?\n/);
const insertAt = pageLines.findIndex((l) => l.startsWith('story_dialog_obj_story_021_e,'));
if (insertAt < 0) throw new Error('021_e pages missing for nil insert');
pageLines.splice(insertAt, 0, ...nilPages);
write('story_scene_pages.csv', pageLines.join('\n'));

let aside = read('stella_quest_aside.csv');
const asideRepl = [
  ['sqa_007_c,', 'sqa_007_c,obj_story_007_c,travel,베가|전초기지|빈자리,1,베가 전초기지에 도착해 빈자리를 확인하라. 줄기는 이 칸이야.,Arrive at Vega Outpost and confirm the empty chair. This cell is the stem.'],
  ['sqa_008_a,', 'sqa_008_a,obj_story_008_a,travel,드라코|헤이븐|귀환,1,드라코 성운 헤이븐으로 귀환하라. 줄기는 이 칸이야.,Return to Draco Nebula Haven. This cell is the stem.'],
  ['sqa_012_c,', 'sqa_012_c,obj_story_012_c,travel,아이언|레므난트|도착,1,아이언 크로스 레므난트에 도착하라. 줄기는 이 칸이야.,Arrive at Iron Cross Remnant. This cell is the stem.'],
  ['sqa_012_d,', 'sqa_012_d,obj_story_012_d,combat,아이언|궤도|추격선|1척,1,아이언 궤도 추격선 1척을 격파하라. 줄기는 이 칸이야.,Destroy 1 pursuit ship in Iron orbit. This cell is the stem.'],
  ['sqa_014_b,', 'sqa_014_b,obj_story_014_b,travel,크림슨|베이스|도착,1,크림슨 구역 베이스에 도착하라. 줄기는 이 칸이야.,Arrive at Crimson Base. This cell is the stem.'],
  ['sqa_014_c,', 'sqa_014_c,obj_story_014_c,combat,크림슨|궤도|약탈선|1척,1,크림슨 궤도 약탈선 1척을 격파하라. 줄기는 이 칸이야.,Destroy 1 raid ship in Crimson orbit. This cell is the stem.'],
  ['sqa_016_a,', 'sqa_016_a,obj_story_016_a,travel,시리우스|보더|도착,1,시리우스 보더에 도착하라. 줄기는 이 칸이야.,Arrive at Sirius Border. This cell is the stem.'],
  ['sqa_017_c,', 'sqa_017_c,obj_story_017_c,travel,뉴에덴|동결|증서,1,뉴에덴 프라임에 동결 증서를 맡겨라. 줄기는 이 칸이야.,Leave the freeze writ at New Eden Prime. This cell is the stem.'],
  ['sqa_019_d,', 'sqa_019_d,obj_story_019_d,travel,아이언|화력|노선,1,아이언 잔해권에서 화력 노선을 확인해라. 줄기는 이 칸이야.,Confirm the fire line at Iron remnant. This cell is the stem.'],
  ['sqa_020_c,', 'sqa_020_c,obj_story_020_c,travel,오메가|조작|통신,1,오메가 허브에서 조작 통신을 추적하라. 줄기는 이 칸이야.,Trace the forged comm at Omega Hub. This cell is the stem.'],
  ['sqa_021_b,', 'sqa_021_b,obj_story_021_b,travel,블러드|필드|도착,1,블러드 필드 스테이션에 도착하라. 줄기는 이 칸이야.,Arrive at Blood Field Station. This cell is the stem.'],
  ['sqa_021_c,', 'sqa_021_c,obj_story_021_c,combat,블러드|궤도|진압선|1척,1,블러드 궤도 진압선 1척을 격파하라. 줄기는 이 칸이야.,Destroy 1 suppression ship in Blood Field orbit. This cell is the stem.'],
  ['sqa_021_d,', 'sqa_021_d,obj_story_021_d,npc_cpt_bar_ret_15,닐에게|뭐라고|부르나,1,닐에게 우리를 뭐라고 부르는지 들어라. 줄기는 이 칸이야.,Hear Nil ask what we are called. This cell is the stem.'],
  ['sqa_022_c,', 'sqa_022_c,obj_story_022_c,travel,시리우스|보더|도착,1,시리우스 보더에 도착하라. 줄기는 이 칸이야.,Arrive at Sirius Border. This cell is the stem.'],
];
for (const [prefix, next] of asideRepl) aside = replaceLine(aside, prefix, next);
write('stella_quest_aside.csv', aside);

let dossier = read('stella_quest_dossier.csv');
dossier = replaceLine(
  dossier,
  'sqd_story_012,',
  'sqd_story_012,story_012,1,반역자의 이름. 이면 협정 폭로 뒤 반역 누명이 씌워진다. 아이언 잔해권에서 추격 1척을 끊고 섀도우로 향한다.,"The Traitor’s Name. After the accord leak, a traitor brand lands. Cut 1 pursuit ship at Iron remnant, then run for Shadow."',
);
dossier = replaceLine(
  dossier,
  'sqd_story_014,',
  'sqd_story_014,story_014,1,첫 신뢰. 크림슨 궤도 약탈선 1척을 격파한 뒤에야 섀도우 넥서스 거점이 열린다.,First Trust. The Shadow Nexus hold opens only after one raid ship falls in Crimson orbit.',
);
dossier = replaceLine(
  dossier,
  'sqd_story_016,',
  'sqd_story_016,story_016,1,외곽의 잔해. 시리우스 보더 외곽 잔해가 크림슨 표식을 남긴다. 본대 침공은 아니다.,Rim Wreckage. Wreckage on the Sirius rim carries a Crimson mark. Not a main-force invasion.',
);
dossier = replaceLine(
  dossier,
  'sqd_story_021,',
  'sqd_story_021,story_021,1,섀도우 넥서스 공방전. 블러드 필드에서 진압선 1척을 격파하고 주민이 이름을 묻는다.,The Shadow Nexus Siege. Stand down one suppression ship at Blood Field. A resident asks what we are called.',
);
write('stella_quest_dossier.csv', dossier);

console.log('apply-quest-level-flow-20261001 ok');
