/**
 * 함장 개인미션 템플릿 — `tables/content/captain_personal_mission_templates.csv` 정본.
 * 전량 `build:content-tables`에 넣지 않음(대표님 지시 전 테이블 빌드 금지). 이 파일이 런타임 사본.
 */
import type { MissionObjective, MissionType } from '../../types';

export type CaptainPersonalMissionTemplateRow = {
  id: string;
  familyId: string;
  type: MissionType;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  objectiveType: MissionObjective['type'];
  objectiveTarget: string;
  objectiveQty: number;
  objectiveDesc: string;
  objectiveDescEn: string;
  rewardCredits: number;
  rewardExp: number;
  levelRequired: number;
  dc: number;
  timeLimitHours: number;
  story1: string;
  story1En: string;
  story2: string;
  story2En: string;
  ask: string;
  askEn: string;
};

export const CAPTAIN_PERSONAL_MISSION_TEMPLATES_FROM_CSV: CaptainPersonalMissionTemplateRow[] = [
  {
    id: 'cp_favor_cargo',
    familyId: 'favor_cargo',
    type: 'explore',
    title: '묶인 화물',
    titleEn: 'Tied Cargo',
    description: '맡긴 화물이 다른 허브에 묶였다. 가서 확인해 달라.',
    descriptionEn: 'Cargo I left is stuck at another hub. Check it for me.',
    objectiveType: 'reach_planet',
    objectiveTarget: '__discovery_planet__',
    objectiveQty: 1,
    objectiveDesc: '묶인 화물 거점 착륙',
    objectiveDescEn: 'Land at the hub holding the cargo',
    rewardCredits: 700,
    rewardExp: 180,
    levelRequired: 1,
    dc: 7,
    timeLimitHours: 48,
    story1: '통신이 닿아서 다행이다. 내가 맡긴 화물이 다른 거점에 묶여 꼼짝을 못 한다.',
    story1En: 'Good you answered. Cargo I left is stuck at another hub.',
    story2: '세관이든 부두든 누가 붙잡고 있는지 가서 눈으로 확인해 주게.',
    story2En: 'Customs or dock — I need someone to see it in person.',
    ask: '부탁이다. {dest}에 가서 그 화물을 확인해 달라. {reward}',
    askEn: 'Please check that cargo at {dest}. {reward}',
  },
  {
    id: 'cp_old_debt',
    familyId: 'old_debt',
    type: 'travel',
    title: '옛 빚',
    titleEn: 'Old Debt',
    description: '옛 전우에게 빚을 갚고 싶다. 그 거점에 가 달라.',
    descriptionEn: 'I owe an old comrade. Go to their hub.',
    objectiveType: 'reach_planet',
    objectiveTarget: '__discovery_planet__',
    objectiveQty: 1,
    objectiveDesc: '옛 전우 거점 방문',
    objectiveDescEn: "Visit the old comrade's hub",
    rewardCredits: 650,
    rewardExp: 160,
    levelRequired: 1,
    dc: 7,
    timeLimitHours: 48,
    story1: '예전에 목숨을 빚진 전우가 있다. 아직 그 빚을 못 갚았다.',
    story1En: 'I still owe a comrade who once saved my life.',
    story2: '내가 직접 가면 추적에 걸린다. 자네가 그 거점에 가서 안부를 전해 주게.',
    story2En: 'If I go myself I get tailed. Carry word to that hub.',
    ask: '{dest}에 들러 그 빚을 대신 전해 달라. {reward}',
    askEn: 'Stop at {dest} and settle that debt for me. {reward}',
  },
  {
    id: 'cp_escort_kin',
    familyId: 'escort_kin',
    type: 'travel',
    title: '가족 항로',
    titleEn: 'Kin on the Lane',
    description: '가족이 탄 항로가 불안하다. 연결 성계를 확인해 달라.',
    descriptionEn: 'Family is on a shaky lane. Check the linked system.',
    objectiveType: 'reach_system',
    objectiveTarget: '__neighbor_system__',
    objectiveQty: 1,
    objectiveDesc: '연결 성계 도착',
    objectiveDescEn: 'Arrive at the linked system',
    rewardCredits: 720,
    rewardExp: 190,
    levelRequired: 1,
    dc: 8,
    timeLimitHours: 48,
    story1: '내 가족이 탄 수송이 이 항로를 지난다. 요즘 소식이 끊겼다.',
    story1En: 'My family is on a transport along this lane. Word stopped.',
    story2: '직접 호위할 여유는 없다. 연결 성계만 한번 봐 주면 숨이 트인다.',
    story2En: 'I cannot escort them. Just check the linked system.',
    ask: '연결 성계로 가서 항로가 살았는지 확인해 달라. {reward}',
    askEn: 'Confirm the linked system is still open. {reward}',
  },
  {
    id: 'cp_hunt_mark',
    familyId: 'hunt_mark',
    type: 'combat',
    title: '아는 얼굴',
    titleEn: 'A Face I Know',
    description: '얼굴을 아는 약탈자를 찾는다.',
    descriptionEn: 'I am hunting a raider I know by face.',
    objectiveType: 'defeat_enemy',
    objectiveTarget: 'pirate_fighter',
    objectiveQty: 1,
    objectiveDesc: '약탈자 격파',
    objectiveDescEn: 'Defeat the raider',
    rewardCredits: 800,
    rewardExp: 200,
    levelRequired: 1,
    dc: 8,
    timeLimitHours: 24,
    story1: '그 해적 얼굴을 안다. 예전에 우리 쪽을 털고 사라진 놈이다.',
    story1En: "I know that pirate's face. They hit our side and vanished.",
    story2: '현상금 게시판이 아니라 내 일이다. 항로에서 그 전투기를 끊어 주게.',
    story2En: 'This is not a bounty board job. Cut that fighter on the lane.',
    ask: '그 약탈자를 격파해 달라. {reward}',
    askEn: 'Hunt that raider down. {reward}',
  },
  {
    id: 'cp_talk_witness',
    familyId: 'talk_witness',
    type: 'explore',
    title: '목격자',
    titleEn: 'The Witness',
    description: '목격자 함장에게 말을 전해 달라.',
    descriptionEn: 'Carry a word to a witness captain.',
    objectiveType: 'talk_npc',
    objectiveTarget: '__dest_bar_host__',
    objectiveQty: 1,
    objectiveDesc: '목격자 함장과 대화',
    objectiveDescEn: 'Talk to the witness captain',
    rewardCredits: 680,
    rewardExp: 170,
    levelRequired: 1,
    dc: 7,
    timeLimitHours: 48,
    story1: '그 일에 입을 연 함장이 있다. 내가 가면 입을 닫는다.',
    story1En: 'A captain saw it. If I go they go silent.',
    story2: '자네가 그 함장에게만 한마디 전해 주면 된다. 긴 말은 필요 없다.',
    story2En: 'Just pass one line to that captain. No speech.',
    ask: '목적지 함장에게 내 말을 전해 달라. {reward}',
    askEn: 'Tell the witness captain for me. {reward}',
  },
  {
    id: 'cp_rumor_check',
    familyId: 'rumor_check',
    type: 'explore',
    title: '소문 확인',
    titleEn: 'Rumor Check',
    description: '소문을 확인하고 돌아와 달라.',
    descriptionEn: 'Check a rumor and come back.',
    objectiveType: 'reach_planet',
    objectiveTarget: '__discovery_planet__',
    objectiveQty: 1,
    objectiveDesc: '소문 거점 착륙',
    objectiveDescEn: 'Land at the rumored hub',
    rewardCredits: 640,
    rewardExp: 150,
    levelRequired: 1,
    dc: 7,
    timeLimitHours: 48,
    story1: '이상한 소문이 돌더라. 내가 퍼뜨린 것도 아닌데 내 이름까지 섞였다.',
    story1En: 'A rumor is going around with my name in it.',
    story2: '가서 그 거점이 정말 그런지 눈으로만 보고 와 주게.',
    story2En: 'Go look. I only need to know if the place matches the rumor.',
    ask: '{dest}에 착륙해 소문이 사실인지 확인해 달라. {reward}',
    askEn: 'Land at {dest} and see if the rumor holds. {reward}',
  },
];
