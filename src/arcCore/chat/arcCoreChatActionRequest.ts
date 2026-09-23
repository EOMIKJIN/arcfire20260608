// 플레이어 문장 → 기존 문 1개. LLM/월드 write 없음. 테이블 이름만.

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { NPC_CAPTAINS_FROM_CSV } from '../../data/generated/csvNpcCaptains';
import {
  findBarAttendantByDisplayName,
  listUniqueBarAttendantSpokenNames,
} from '../../game/bar/patronage/barPatronageTables';
import type { ArcCoreChatWorldProposalId } from './arcCoreChatWorldProposal';

export type ArcCoreChatActionRequest = {
  id: ArcCoreChatWorldProposalId;
  attendantId?: string;
  attendantName?: string;
  captainId?: string;
  captainName?: string;
  planetId?: string;
  planetLabel?: string;
};

// 1차 절충 — LLM 의도 연동 전. 명령 화행만 문. 질문·소재·조사(가/에)는 미집행.
const INQUIRY_RE =
  /있나|있어\s*\?|없어요|없나|누구|어디|몇\s*명|어때|어떠|뭐야|무슨|어떤|들었어|how\s+(?:is|are|many)|who(?:'s|\s+is)|where|is\s+there/i;
const FACILITY_COMMAND_RE =
  /열어(?:\s*줘|라|봐)?|연결해(?:\s*줘)?|오픈(?:해(?:\s*줘)?)?|보여(?:\s*줘)|들어가(?:\s*줘)?|\bopen\b|\bshow\b/i;
const TALK_REQUEST_RE =
  /대화(?:하고\s*싶|하자|해(?:\s*줘)?|할래)|불러(?:\s*줘)?|연결해(?:\s*줘)?|말하고\s*싶|얘기하자|통화하자|talk\s+(?:to|with)|speak\s+(?:to|with)/i;
const TALK_BARE_RE = /대화|불러(?:\s*줘)?|연결해(?:\s*줘)?|말하고\s*싶|얘기하자|통화하자|talk\s+(?:to|with)|speak\s+(?:to|with)/i;
const BAR_ROLE_RE = /바걸|종업원|바텐더|attendant|bargirl|bar girl/i;
const TALK_ROSTER_RE = /대화\s*(목록|명단|리스트)|통신\s*(목록|명단)|talk\s*list/i;
const CAPTAIN_ROSTER_RE =
  /함장(?:과|와|이랑)\s*대화|함장\s*(?:목록|명단|리스트)|talk\s*(?:with|to)\s+(?:the\s+)?captains?|captain\s*talk/i;
const ARM_RE =
  /전투지역|전투\s*발생|전투발생|들어가면\s*싸우|진입하면\s*싸우|웨이브\s*걸|침공\s*걸|combat\s*zone|arm\s+(?:the\s+)?(?:wave|combat)/i;
const HERE_RE = /여기|이\s*행성|현재\s*행성|\bhere\b|this\s+planet/i;
const OPEN_TRADE_RE = /무역소|교역소|trade\s*port/i;
const OPEN_SHIP_RE = /조선소|shipyard/i;
/** 처소격 「바에」·부사 「바로」는 문 명사가 아님. */
const OPEN_BAR_RE =
  /술집|\bbar\b|바를|바\s*(?:좀\s*)?(?:열|연결|오픈|보여|들어가|open|show)|(?:^|\s)바(?:을|를)?(?=\s|$)/i;
const OPEN_SKILL_RE = /스킬\s*트리|연구실|스킬트리|skill\s*tree|research/i;
const OPEN_ECON_RE = /경제|시세|시황|economy/i;
const OPEN_DEV_RE = /행성\s*개발|개발\s*(창|패널|목록)|planet\s*dev/i;

function hasFacilityCommand(text: string): boolean {
  return FACILITY_COMMAND_RE.test(text);
}

function hasTalkRequest(text: string): boolean {
  return TALK_REQUEST_RE.test(text);
}

function hasTalkCue(text: string): boolean {
  return TALK_BARE_RE.test(text) || BAR_ROLE_RE.test(text);
}

/** 질문·소재만. 열어/연결해/대화하자 있으면 명령이 이김. */
function isNonCommandInquiry(text: string): boolean {
  if (hasFacilityCommand(text) || hasTalkRequest(text)) return false;
  return INQUIRY_RE.test(text);
}

type NameHit = { name: string; index: number };

function longestNameHit(text: string, names: readonly string[]): NameHit | null {
  let best: NameHit | null = null;
  const lower = text.toLowerCase();
  for (let i = 0; i < names.length; i++) {
    const name = names[i]!;
    if (!name) continue;
    const idx = name === name.toLowerCase() || /[A-Za-z]/.test(name)
      ? lower.indexOf(name.toLowerCase())
      : text.indexOf(name);
    if (idx < 0) continue;
    if (!best || name.length > best.name.length) best = { name, index: idx };
  }
  return best;
}

function uniqueSorted(names: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = 0; i < names.length; i++) {
    const n = names[i]!.trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  out.sort((a, b) => b.length - a.length);
  return out;
}

let attendantNamesCache: string[] | null = null;

function attendantSpokenNames(): string[] {
  if (attendantNamesCache) return attendantNamesCache;
  const raw: string[] = [];
  const rows = listUniqueBarAttendantSpokenNames();
  for (let i = 0; i < rows.length; i++) {
    raw.push(rows[i]!.ko);
    if (rows[i]!.en) raw.push(rows[i]!.en);
  }
  attendantNamesCache = uniqueSorted(raw);
  return attendantNamesCache;
}

type CaptainNameRow = { name: string; captainId: string; talk: boolean };

let captainNameRows: CaptainNameRow[] | null = null;
let captainNamesCache: string[] | null = null;

function captainNameTable(): { rows: CaptainNameRow[]; names: string[] } {
  if (captainNameRows && captainNamesCache) {
    return { rows: captainNameRows, names: captainNamesCache };
  }
  const rows: CaptainNameRow[] = [];
  const captains = NPC_CAPTAINS_FROM_CSV;
  for (let i = 0; i < captains.length; i++) {
    const c = captains[i]!;
    const ko = String(c.displayName ?? '').trim();
    const en = String(c.displayNameEn ?? '').trim();
    if (ko) {
      rows.push({ name: ko, captainId: c.id, talk: c.mainStageTalkEnabled });
      const first = ko.split(/\s+/)[0] ?? '';
      if (first.length >= 2 && first !== ko) {
        rows.push({ name: first, captainId: c.id, talk: c.mainStageTalkEnabled });
      }
    }
    if (en) {
      rows.push({ name: en, captainId: c.id, talk: c.mainStageTalkEnabled });
      const firstEn = en.split(/\s+/)[0] ?? '';
      if (firstEn.length >= 3 && firstEn !== en) {
        rows.push({ name: firstEn, captainId: c.id, talk: c.mainStageTalkEnabled });
      }
    }
  }
  captainNameRows = rows;
  captainNamesCache = uniqueSorted(rows.map((r) => r.name));
  return { rows, names: captainNamesCache };
}

function resolveCaptainId(spokenName: string): { captainId: string; captainName: string } | null {
  const rows = captainNameTable().rows;
  const lower = spokenName.toLowerCase();
  let fallback: CaptainNameRow | null = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    if (row.name !== spokenName && row.name.toLowerCase() !== lower) continue;
    if (row.talk) return { captainId: row.captainId, captainName: spokenName };
    if (!fallback) fallback = row;
  }
  if (!fallback) return null;
  return { captainId: fallback.captainId, captainName: spokenName };
}

type PlanetNameRow = { name: string; planetId: string; label: string };

let planetNameRows: PlanetNameRow[] | null = null;
let planetNamesCache: string[] | null = null;

function planetNameTable(): { rows: PlanetNameRow[]; names: string[] } {
  if (planetNameRows && planetNamesCache) {
    return { rows: planetNameRows, names: planetNamesCache };
  }
  const rows: PlanetNameRow[] = [];
  for (let i = 0; i < PlanetOccupationSeeds_FROM_BALANCE_CSV.length; i++) {
    const row = PlanetOccupationSeeds_FROM_BALANCE_CSV[i]!;
    const id = String(row.planetId ?? '').trim();
    if (!id) continue;
    const ko = String(row.alertLabelKo ?? '').trim();
    const en = String(row.alertLabelEn ?? '').trim();
    if (ko) rows.push({ name: ko, planetId: id, label: ko });
    if (en) rows.push({ name: en, planetId: id, label: ko || en });
    rows.push({ name: id, planetId: id, label: ko || id });
    const spaced = id.replace(/_/g, ' ');
    if (spaced !== id) rows.push({ name: spaced, planetId: id, label: ko || id });
  }
  planetNameRows = rows;
  planetNamesCache = uniqueSorted(rows.map((r) => r.name));
  return { rows, names: planetNamesCache };
}

function resolvePlanet(spokenName: string): { planetId: string; planetLabel: string } | null {
  const rows = planetNameTable().rows;
  const lower = spokenName.toLowerCase();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    if (row.name === spokenName || row.name.toLowerCase() === lower) {
      return { planetId: row.planetId, planetLabel: row.label };
    }
  }
  return null;
}

function matchTalkBar(text: string, currentPlanetId?: string): ArcCoreChatActionRequest | null {
  if (isNonCommandInquiry(text) || !hasTalkCue(text)) return null;
  const hit = longestNameHit(text, attendantSpokenNames());
  if (!hit) return null;
  const att = findBarAttendantByDisplayName(hit.name, currentPlanetId);
  if (!att) return null;
  return {
    id: 'talk_bar',
    attendantId: att.attendantId,
    attendantName: att.displayNameKo || hit.name,
  };
}

function matchTalkNpc(text: string): ArcCoreChatActionRequest | null {
  if (isNonCommandInquiry(text) || !hasTalkCue(text)) return null;
  const hit = longestNameHit(text, captainNameTable().names);
  if (!hit) return null;
  const cap = resolveCaptainId(hit.name);
  if (!cap) return null;
  return {
    id: 'talk_npc',
    captainId: cap.captainId,
    captainName: cap.captainName,
  };
}

function matchArmWave(
  text: string,
  currentPlanetId?: string,
): ArcCoreChatActionRequest | null {
  if (!ARM_RE.test(text)) return null;
  const hit = longestNameHit(text, planetNameTable().names);
  if (hit) {
    const planet = resolvePlanet(hit.name);
    if (planet) return { id: 'arm_wave', planetId: planet.planetId, planetLabel: planet.planetLabel };
  }
  const here = currentPlanetId?.trim() ?? '';
  if (here && HERE_RE.test(text)) {
    const planet = resolvePlanet(here);
    return {
      id: 'arm_wave',
      planetId: here,
      planetLabel: planet?.planetLabel || here,
    };
  }
  return null;
}

function matchTalkRoster(text: string): ArcCoreChatActionRequest | null {
  if (isNonCommandInquiry(text)) return null;
  if (!TALK_ROSTER_RE.test(text) && !CAPTAIN_ROSTER_RE.test(text)) return null;
  const hit = longestNameHit(text, captainNameTable().names);
  if (hit && hit.name.length >= 2 && hit.name !== '함장') return null;
  return { id: 'open_talk_roster' };
}

function matchFacility(text: string): ArcCoreChatActionRequest | null {
  if (isNonCommandInquiry(text) || !hasFacilityCommand(text)) return null;
  if (TALK_ROSTER_RE.test(text) || CAPTAIN_ROSTER_RE.test(text)) return { id: 'open_talk_roster' };
  if (OPEN_ECON_RE.test(text)) return { id: 'open_economy' };
  if (OPEN_DEV_RE.test(text)) return { id: 'open_development' };
  if (OPEN_SKILL_RE.test(text)) return { id: 'open_skilltree' };
  if (OPEN_TRADE_RE.test(text)) return { id: 'open_trade' };
  if (OPEN_SHIP_RE.test(text)) return { id: 'open_shipyard' };
  if (OPEN_BAR_RE.test(text) && !BAR_ROLE_RE.test(text)) return { id: 'open_bar' };
  return null;
}

export function parseArcCoreChatActionRequest(
  userText: string,
  opts?: { currentPlanetId?: string },
): ArcCoreChatActionRequest | null {
  const text = userText.trim();
  if (!text) return null;
  const currentPlanetId = opts?.currentPlanetId?.trim();
  return (
    matchTalkBar(text, currentPlanetId)
    ?? matchTalkRoster(text)
    ?? matchTalkNpc(text)
    ?? matchArmWave(text, currentPlanetId)
    ?? matchFacility(text)
  );
}

export function isArcCoreChatActionRequestText(
  userText: string,
  opts?: { currentPlanetId?: string },
): boolean {
  return parseArcCoreChatActionRequest(userText, opts) != null;
}
