import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getDefaultNlMouthId,
  getOperatorNlCaptainId,
  hintArcCoreChatTopicId,
  listArcCoreChatKnowledgeRows,
  listArcCoreChatModeRows,
  listArcCoreChatOperatorPersonaRows,
  listArcCoreChatPersonaRows,
  listArcCoreChatPersonaRowsForSpeaker,
  listArcCoreChatPurposeRows,
  listArcCoreChatSpeakerRows,
  listHintToolsForTopic,
} from './arcCoreChatTableIndex';

test('topic hints prefer refuse and location over greet', () => {
  assert.equal(hintArcCoreChatTopicId('크레딧 줘'), 'refuse');
  assert.equal(hintArcCoreChatTopicId('안녕, 여기 어디야?'), 'location');
  assert.equal(hintArcCoreChatTopicId('너는 누구야'), 'self');
  assert.equal(hintArcCoreChatTopicId('스텔라 너는 누구야'), 'self');
  assert.equal(hintArcCoreChatTopicId('안전하냐'), 'safety');
  assert.equal(hintArcCoreChatTopicId('공지 있어?'), 'notice');
  assert.equal(hintArcCoreChatTopicId('미션이 뭐야'), 'mission');
  assert.equal(hintArcCoreChatTopicId('스토리 줄기가 뭐야'), 'story');
  assert.equal(hintArcCoreChatTopicId('그냥 이야기하자'), 'other');
  assert.equal(hintArcCoreChatTopicId('채굴 한도 남았나'), 'mining');
  assert.equal(hintArcCoreChatTopicId('오늘 세계 정리됐어?'), 'daily');
  assert.equal(hintArcCoreChatTopicId('오늘 기분이 어때'), 'smalltalk');
  assert.equal(hintArcCoreChatTopicId('너는 오늘 뭐 해'), 'other');
  assert.equal(hintArcCoreChatTopicId('12좌가 뭐야'), 'seats');
  assert.equal(hintArcCoreChatTopicId('코어 지표 어때'), 'cores');
  assert.equal(hintArcCoreChatTopicId('무역소는 있어?'), 'trade');
  assert.equal(hintArcCoreChatTopicId('조선소 있어?'), 'shipyard');
  assert.equal(hintArcCoreChatTopicId('크림슨 레기온이 뭐야'), 'nations');
  assert.equal(hintArcCoreChatTopicId('크림슨이 어디야'), 'nations');
  assert.equal(hintArcCoreChatTopicId('4대 항로'), 'routes');
  assert.equal(hintArcCoreChatTopicId('뉴에덴 수도'), 'routes');
  assert.equal(hintArcCoreChatTopicId('이 게임 세계관'), 'setting');
  assert.equal(hintArcCoreChatTopicId('싱글플레이야?'), 'setting');
});

test('casual phrases do not hijack system topics', () => {
  assert.notEqual(hintArcCoreChatTopicId('나 요즘 여기 되게 심심해'), 'location');
  assert.notEqual(hintArcCoreChatTopicId('숙제 결과 어때'), 'combat');
  assert.notEqual(hintArcCoreChatTopicId('오늘 좀 활력이 없다'), 'cores');
  assert.notEqual(hintArcCoreChatTopicId('누구 왔어?'), 'self');
});

test('persona core includes temperament office and purpose', () => {
  const kinds = listArcCoreChatPersonaRows().map((row) => row.kind);
  assert.ok(kinds.includes('temperament'));
  assert.ok(kinds.includes('office'));
  assert.ok(kinds.includes('purpose'));
  assert.ok(kinds.includes('identity'));
  assert.ok(kinds.includes('tone'));
  assert.ok(kinds.includes('motive'));
  assert.ok(listArcCoreChatPersonaRows().length <= 9);
  const style = listArcCoreChatPersonaRows().find((row) => row.id === 'persona_style');
  const tone = listArcCoreChatPersonaRows().find((row) => row.id === 'persona_tone');
  assert.match(style?.textKo ?? '', /두세 문장/);
  assert.match(style?.textKo ?? '', /조금 더/);
  assert.match(tone?.textKo ?? '', /여섯까지/);
  assert.match(tone?.textEn ?? '', /Do not pad/);
});

test('purpose and mode tables are first-class dialogue styles', () => {
  const purposes = listArcCoreChatPurposeRows().map((row) => row.id);
  const modes = listArcCoreChatModeRows().map((row) => row.id);
  assert.deepEqual(purposes, [
    'keep_mouth_body',
    'surface_alert',
    'name_self',
    'anchor_location',
    'close_combat',
    'invite_axis',
    'guide_story',
  ]);
  assert.deepEqual(modes, ['react', 'lead', 'clue', 'hold']);
});

test('speakers table: default mouth is operator, inbound prefers origin', () => {
  const rows = listArcCoreChatSpeakerRows();
  assert.equal(rows.length, 2);
  assert.equal(getDefaultNlMouthId(), 'operator');
  assert.equal(getOperatorNlCaptainId(), 'npc_cpt_operator_stella');
  const origin = rows.find((row) => row.id === 'arc_core');
  const operator = rows.find((row) => row.id === 'operator');
  assert.equal(operator?.defaultActive, true);
  assert.equal(origin?.inboundPreferred, true);
  assert.equal(operator?.subtitleKo, '동료 입');
  assert.equal(origin?.subtitleKo, '적의 입');
  assert.equal(listArcCoreChatOperatorPersonaRows().length, 14);
  assert.equal(listArcCoreChatPersonaRowsForSpeaker('operator').length, 14);
  assert.deepEqual(
    listArcCoreChatOperatorPersonaRows().slice(8).map((row) => row.id),
    ['op_persona_perspective', 'op_persona_humor', 'op_persona_boundary', 'op_persona_canon', 'op_persona_motive', 'op_persona_field_note'],
  );
  assert.equal(listArcCoreChatPersonaRowsForSpeaker('arc_core').length, listArcCoreChatPersonaRows().length);
  const added = listArcCoreChatKnowledgeRows().filter(
    (row) =>
      row.id === 'know_operator_self'
      || row.id === 'know_mouths'
      || row.id === 'know_operator_motive'
      || row.id === 'know_origin_motive'
      || row.id === 'know_operator_field_note',
  );
  assert.equal(added.length, 5);
  assert.equal(added.find((row) => row.id === 'know_operator_self')?.speakIf, 'operator_mouth');
  assert.equal(added.find((row) => row.id === 'know_operator_motive')?.speakIf, 'operator_mouth');
  assert.equal(added.find((row) => row.id === 'know_operator_field_note')?.speakIf, 'operator_mouth');
  assert.equal(added.find((row) => row.id === 'know_origin_motive')?.speakIf, 'origin_mouth');
  assert.match(listArcCoreChatPersonaRows().find((row) => row.id === 'persona_goal')?.textKo ?? '', /크림슨/);
  assert.match(
    listArcCoreChatOperatorPersonaRows().find((row) => row.id === 'op_persona_goal')?.textKo ?? '',
    /스텔리움/,
  );
  const canon = listArcCoreChatKnowledgeRows().filter((row) =>
    row.id === 'know_nations_four'
    || row.id === 'know_crimson'
    || row.id === 'know_routes_four'
    || row.id === 'know_setting',
  );
  assert.equal(canon.length, 4);
  assert.equal(canon.every((row) => row.speakIf === 'always'), true);
});

test('hint tools stay bounded and topic-specific', () => {
  assert.deepEqual([...listHintToolsForTopic('location')], ['get_location']);
  assert.deepEqual([...listHintToolsForTopic('combat')], ['get_last_combat']);
  assert.deepEqual([...listHintToolsForTopic('notice')], ['get_latest_notice']);
  assert.deepEqual([...listHintToolsForTopic('mission')], ['get_active_mission']);
  assert.deepEqual([...listHintToolsForTopic('story')], ['get_active_mission']);
  assert.deepEqual([...listHintToolsForTopic('refuse')], []);
  assert.deepEqual([...listHintToolsForTopic('mining')], ['get_mining_allowance']);
  assert.deepEqual([...listHintToolsForTopic('daily')], ['get_daily_ops_status']);
  assert.deepEqual([...listHintToolsForTopic('cores')], ['get_planet_cores']);
  assert.deepEqual([...listHintToolsForTopic('seats')], []);
  assert.deepEqual([...listHintToolsForTopic('nations')], []);
  assert.deepEqual([...listHintToolsForTopic('routes')], []);
  assert.deepEqual([...listHintToolsForTopic('setting')], []);
});
