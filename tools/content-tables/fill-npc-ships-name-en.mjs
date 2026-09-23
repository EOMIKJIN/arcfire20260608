/**
 * npc_ai_ships.csv — 빈 name_en만 KO 표시명 직역 주입.
 * 이미 채워진 name_en·다른 컬럼은 변경하지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../../tables/content/npc_ai_ships.csv');
const HANGUL_RE = /[\uac00-\ud7a3]/;

/** 긴 구문 우선. 기존 Player name_en 톤(Title Case · Mk. · class)에 맞춤. */
const GLOSSARY = [
  ['웨이브 적함', 'Wave Invader'],
  ['속사+돌격드론', 'Rapid Fire + Assault Drone'],
  ['속사+폭격함재기', 'Rapid Fire + Bomber Craft'],
  ['위상+단거리로켓', 'Phase + Short-Range Rocket'],
  ['커팅+유도미사일', 'Cutting + Guided Missile'],
  ['돌격로켓+스파이크드론', 'Assault Rocket + Spike Drone'],
  ['융합로켓+댄싱드론', 'Fusion Rocket + Dancing Drone'],
  ['입자포+침투함재기', 'Particle Cannon + Infiltrator Craft'],
  ['광자레이저+추적미사일', 'Photon Laser + Tracker Missile'],
  ['핵로켓+순항미사일', 'Nuclear Rocket + Cruise Missile'],
  ['반물질+아다만틴함재기', 'Antimatter + Adamantine Craft'],
  ['방위빔+전술드론', 'Defense Beam + Tactical Drone'],
  ['로켓 연발', 'Rocket Burst'],
  ['유격 로켓', 'Skirmish Rocket'],
  ['고속 로켓', 'High-Speed Rocket'],
  ['융합 로켓', 'Fusion Rocket'],
  ['중형 로켓', 'Medium Rocket'],
  ['레일 로켓', 'Rail Rocket'],
  ['근거리 로켓', 'Close-Range Rocket'],
  ['연발 로켓', 'Burst Rocket'],
  ['플라즈마 로켓', 'Plasma Rocket'],
  ['지역 로켓', 'Area Rocket'],
  ['섬멸 로켓', 'Annihilation Rocket'],
  ['가이드 로켓', 'Guided Rocket'],
  ['플라즈노바 로켓', 'Plasnova Rocket'],
  ['근격 로켓', 'Close-Assault Rocket'],
  ['하이퍼 로켓', 'Hyper Rocket'],
  ['카이로스 로켓', 'Kairos Rocket'],
  ['시귤러리티 로켓', 'Singularity Rocket'],
  ['코스메가 로켓', 'Cosmega Rocket'],
  ['서부전선 제독 기함', 'Western Front Admiral Flagship'],
  ['연합기동군단장 기함', 'Allied Mobile Corps Flagship'],
  ['항로방위사령 기함', 'Route Defense Command Flagship'],
  ['궤도방어사령 기함', 'Orbit Defense Command Flagship'],
  ['작전기획국장 기함', 'Operations Planning Flagship'],
  ['원정순항본부장 기함', 'Expedition Cruise Flagship'],
  ['요새방어사령관 기함', 'Fortress Defense Flagship'],
  ['변경초계총감 기함', 'Frontier Patrol Inspector Flagship'],
  ['무역호위총감 기함', 'Trade Escort Inspector Flagship'],
  ['특수작전장 기함', 'Special Operations Flagship'],
  ['서부전선총감 기함', 'Western Front Inspector Flagship'],
  ['기동함대사령 기함', 'Mobile Fleet Command Flagship'],
  ['정찰전단장 기함', 'Recon Flotilla Flagship'],
  ['전략지원사령 기함', 'Strategic Support Command Flagship'],
  ['스텔리움 연합장 기함', 'Stellium Alliance Flagship'],
  ['성계방위사령 기함', 'System Defense Command Flagship'],
  ['거점수비사령 기함', 'Stronghold Garrison Command Flagship'],
  ['교전지휘관 기함', 'Engagement Commander Flagship'],
  ['태양권 파견장 기함', 'Solar Sphere Detachment Flagship'],
  ['방위연합총감 기함', 'Defense Alliance Inspector Flagship'],
  ['크림슨 레기온장 기함', 'Crimson Legion Flagship'],
  ['붉은 전대사령 기함', 'Red Fleet Command Flagship'],
  ['약탈전단장 기함', 'Raider Flotilla Flagship'],
  ['혈전사령관 기함', 'Blood War Commander Flagship'],
  ['암시장 군벌 기함', 'Black Market Warlord Flagship'],
  ['심연 문지기 기함', 'Abyss Gatekeeper Flagship'],
  ['나이트폴 군주 기함', 'Nightfall Overlord Flagship'],
  ['코어 수문장 기함', 'Core Gatekeeper Flagship'],
  ['영원 군단장 기함', 'Eternity Legion Flagship'],
  ['항로 차단장 기함', 'Route Interdictor Flagship'],
  ['변경 침투장 기함', 'Frontier Infiltrator Flagship'],
  ['회항로 습격장 기함', 'Return Route Raider Flagship'],
  ['태양권 강습장 기함', 'Solar Sphere Assault Flagship'],
  ['공간 왜곡장 기함', 'Space Distortion Flagship'],
  ['전리품 감독 기함', 'Spoils Overseer Flagship'],
  ['포위전사령 기함', 'Siege War Command Flagship'],
  ['교차점 사냥꾼 기함', 'Junction Hunter Flagship'],
  ['관문 봉쇄장 기함', 'Gate Blockade Flagship'],
  ['고대 감시자 기함', 'Ancient Watcher Flagship'],
  ['왕좌 요격장 기함', 'Throne Interceptor Flagship'],
  ['중립 행정장 기함', 'Neutral Administrator Flagship'],
  ['중립 중재관 기함', 'Neutral Mediator Flagship'],
  ['유적 수호장 기함', 'Ruin Guardian Flagship'],
  ['기원 수문장 기함', 'Origin Gatekeeper Flagship'],
  ['중립 감시장 기함', 'Neutral Watcher Flagship'],
  ['베가 블루 수호', 'Vega Blue Guardian'],
  ['베가 레드 돌격', 'Vega Red Striker'],
  ['뉴에덴 블루', 'New Eden Blue'],
  ['뉴에덴 레드', 'New Eden Red'],
  ['뉴 에덴 순양함', 'New Eden Cruiser'],
  ['아르카디아 순항', 'Arcadia Patrol'],
  ['자유 화물선', 'Free Freighter'],
  ['외곽 화물선', 'Outer Freighter'],
  ['산업 화물선', 'Industrial Freighter'],
  ['연방 화물선', 'Federal Freighter'],
  ['홍월기함', 'Crimson Moon Flagship'],
  ['중립회항함', 'Neutral Return Ship'],
  ['연합기지함', 'Alliance Base Ship'],
  ['솔라경비함', 'Solar Guard Ship'],
  ['베가경비함', 'Vega Guard Ship'],
  ['베가전함', 'Vega Hull'],
  ['에덴전함', 'Eden Hull'],
  ['블루전함', 'Blue Hull'],
  ['레드전함', 'Red Hull'],
  ['모의전함', 'Mock Warship'],
  ['생존포드', 'Survival Pod'],
  ['문막기함', 'Gatewarden'],
  ['암시장함', 'Black Market Ship'],
  ['그림자함', 'Shade Ship'],
  ['수문장함', 'Gatekeeper'],
  ['총감독함', 'Chief Overseer'],
  ['지휘함', 'Command Ship'],
  ['감독함', 'Overseer'],
  ['군주함', 'Overlord'],
  ['포위함', 'Encircler'],
  ['심연함', 'Abyss Ship'],
  ['영원함', 'Eternity Ship'],
  ['전열함', 'Line Ship'],
  ['포식함', 'Predator'],
  ['은폐함', 'Cloaker'],
  ['리프트함', 'Rift Ship'],
  ['침입함', 'Invader'],
  ['차단함', 'Interdictor'],
  ['추격함', 'Pursuer'],
  ['성운함', 'Nebula Ship'],
  ['잠행함', 'Stalker'],
  ['순양함', 'Cruiser'],
  ['약탈함', 'Raider'],
  ['사냥함', 'Hunter'],
  ['강습함', 'Assault Ship'],
  ['코일함', 'Coil Ship'],
  ['침투함', 'Infiltrator'],
  ['호위함', 'Escort'],
  ['강탈함', 'Plunderer'],
  ['추적함', 'Tracker'],
  ['수집함', 'Collector'],
  ['요격함', 'Interceptor'],
  ['관측함', 'Observer'],
  ['감시함', 'Watcher'],
  ['수호함', 'Guardian'],
  ['관리함', 'Administrator'],
  ['수문함', 'Gate Ship'],
  ['근접수송', 'Close Transport'],
  ['근접무역', 'Close Trade'],
  ['순환보급', 'Circuit Supply'],
  ['정박보조', 'Dock Support'],
  ['초계연락', 'Patrol Courier'],
  ['광물운반', 'Mineral Hauler'],
  ['연료이송', 'Fuel Transfer'],
  ['구난연락', 'Rescue Courier'],
  ['화물선박', 'Cargo Vessel'],
  ['항로감시', 'Route Watch'],
  ['민간호위', 'Civilian Escort'],
  ['외곽연락', 'Outer Courier'],
  ['호송급', 'Escort-class'],
  ['ARC급', 'ARC-class'],
  ['ARC시드', 'ARC Seed'],
  ['아르카디아', 'Arcadia'],
  ['페르세우스', 'Perseus'],
  ['나이트폴', 'Nightfall'],
  ['이터니티', 'Eternity'],
  ['헬리오스', 'Helios'],
  ['시리우스', 'Sirius'],
  ['미네르바', 'Minerva'],
  ['제네시스', 'Genesis'],
  ['뉴에덴', 'New Eden'],
  ['뉴 에덴', 'New Eden'],
  ['드라코', 'Draco'],
  ['아이언', 'Iron'],
  ['오메가', 'Omega'],
  ['타이탄', 'Titan'],
  ['크림슨', 'Crimson'],
  ['섀도우', 'Shadow'],
  ['어비스', 'Abyss'],
  ['베가린', 'Vegalin'],
  ['루안다', 'Luanda'],
  ['훈텍', 'Huntek'],
  ['크로나', 'Krona'],
  ['린델', 'Lindell'],
  ['카이로', 'Cairo'],
  ['조이드', 'Zoid'],
  ['사렌', 'Saren'],
  ['하림', 'Harim'],
  ['테란', 'Terran'],
  ['미코', 'Miko'],
  ['파크', 'Park'],
  ['베라', 'Vera'],
  ['카란', 'Karan'],
  ['듀로', 'Duro'],
  ['엘라', 'Ella'],
  ['피온', 'Pion'],
  ['하렌', 'Haren'],
  ['이온', 'Ion'],
  ['제나', 'Jena'],
  ['카일', 'Kyle'],
  ['루나', 'Luna'],
  ['오스', 'Os'],
  ['세라', 'Sera'],
  ['탈로', 'Talo'],
  ['비온', 'Bion'],
  ['게일', 'Gale'],
  ['노바', 'Nova'],
  ['리안', 'Lian'],
  ['소라', 'Sora'],
  ['테온', 'Teon'],
  ['윈드', 'Wind'],
  ['제로', 'Zero'],
  ['솔라', 'Solar'],
  ['베가', 'Vega'],
  ['에덴', 'Eden'],
  ['다크', 'Dark'],
  ['블러드', 'Blood'],
  ['코어', 'Core'],
  ['기본', 'Basic'],
  ['급', '-class'],
];

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function escapeCsv(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** 이미 확정된 Player trade name_en — 재실행해도 덮지 않음 */
const LOCKED_EXISTING_EN = new Set([
  'Starter Ranger CM.I',
  'Starter Fighter Mk.I',
  'Striker Mk.II',
  'Guardian Destroyer',
  'Guardian Destroyer Mk.II',
  'Oracle Cruiser',
  'Oracle Cruiser Mk.II',
  'Sovereign Battlecruiser',
  'Sovereign Battlecruiser Apex',
  'Dreadnought',
  'Super Capital',
  'Apex Legend',
  'Wave Defense Battleship',
  'Hunter Destroyer',
  'Hunter Destroyer Mk.II',
  'Shadow Cruiser',
  'Shadow Cruiser Mk.II',
  'Raptor Battlecruiser',
  'Raptor Battlecruiser Apex',
  'Phantom Dreadnought',
  'Phantom Super Capital',
  'Phantom Legend',
]);

function translateKoName(name) {
  let out = String(name ?? '');
  for (const [ko, en] of GLOSSARY) {
    if (!ko) continue;
    out = out.split(ko).join(en);
  }
  return out
    .replace(/\s+/g, ' ')
    .replace(/(\S)\(/g, '$1 (')
    .replace(/\(\s+/g, '(')
    .replace(/([A-Za-z])(\d+)$/g, '$1 $2')
    .replace(/Hull([A-Z])$/g, 'Hull $1')
    .trim();
}

function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l, i, arr) => i < arr.length - 1 || l.trim());
  const header = parseCsvLine(lines[0]).map((h) => String(h).replace(/^\uFEFF/, '').trim());
  const nameIdx = header.indexOf('name');
  const nameEnIdx = header.indexOf('name_en');
  const idIdx = header.indexOf('id');
  if (nameIdx < 0 || nameEnIdx < 0 || idIdx < 0) {
    throw new Error('npc_ai_ships.csv missing id/name/name_en');
  }

  const leftovers = [];
  const outLines = [header.map(escapeCsv).join(',')];
  let filled = 0;
  let skipped = 0;
  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li]);
    while (cols.length < header.length) cols.push('');
    const existingEn = cols[nameEnIdx]?.trim();
    if (existingEn && LOCKED_EXISTING_EN.has(existingEn)) {
      skipped += 1;
      outLines.push(cols.map(escapeCsv).join(','));
      continue;
    }
    const en = translateKoName(cols[nameIdx]);
    if (!en || HANGUL_RE.test(en)) {
      leftovers.push({ id: cols[idIdx], name: cols[nameIdx], en });
    } else {
      cols[nameEnIdx] = en;
      filled += 1;
    }
    outLines.push(cols.map(escapeCsv).join(','));
  }

  if (leftovers.length) {
    console.error(JSON.stringify({ leftoverHangul: leftovers }, null, 2));
    throw new Error(`untranslated Hangul remains: ${leftovers.length}`);
  }

  fs.writeFileSync(CSV_PATH, `${outLines.join('\n')}\n`, 'utf8');
  console.log(`filled ${filled} empty name_en · kept ${skipped} existing`);
}

main();
