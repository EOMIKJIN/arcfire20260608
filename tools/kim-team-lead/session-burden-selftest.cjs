'use strict';
const fs = require('fs');
const path = require('path');
const core = require('../../.cursor/hooks/sessionBurdenCore.cjs');

const big = 'C:\\Users\\eomsp\\.cursor\\projects\\d-arcfire20260607\\agent-transcripts\\f5b4de2f-59a3-4976-a790-b111089c383b\\f5b4de2f-59a3-4976-a790-b111089c383b.jsonl';
const small = path.join(__dirname, '../../.cursor/hooks/sessionBurdenCore.cjs');

function reset() {
  for (const p of [core.STATE_PATH, core.HANDOFF_PATH, core.ACK_PATH]) {
    try { fs.unlinkSync(p); } catch { /* absent */ }
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

reset();
const sized = core.bucketForBytes(fs.statSync(big).size);
assert(sized.level === 'hard' && sized.bucket >= 2, `big bucket ${JSON.stringify(sized)}`);
assert(core.bucketForBytes(fs.statSync(small).size).level === 'ok', 'small should be ok');

const first = core.noteTranscript({ conversation_id: 'heavy-1', transcript_path: big, prompt: '계속 작업' });
assert(first && first.additional_context.includes('[session-burden]'), 'first notice missing');
const second = core.noteTranscript({ conversation_id: 'heavy-1', transcript_path: big, prompt: '또' });
assert(second == null, 'second notice should be silent');
assert(core.noteTranscript({ conversation_id: 'light-1', transcript_path: small, prompt: '짧음' }) == null, 'small should be silent');

const compact = core.noteCompact({
  conversation_id: 'heavy-1',
  transcript_path: big,
  is_first_compaction: true,
  context_usage_percent: 90,
  message_count: 40,
});
assert(compact && compact.user_message.includes('[세션 부담]'), 'compact notice missing');
assert(core.noteCompact({ conversation_id: 'heavy-1', is_first_compaction: false }) == null, 'compact debounce');

const resume = core.noteResume({ conversation_id: 'new-chat', session_id: 'new-chat' });
assert(resume && resume.additional_context.includes('[session-burden-resume]'), 'resume missing');
assert(core.noteResume({ conversation_id: 'new-chat' }) == null, 'resume once per chat');
assert(core.noteResume({ conversation_id: 'heavy-1' }) == null, 'heavy chat must not resume itself');

core.markAck();
reset();
core.noteTranscript({ conversation_id: 'heavy-2', transcript_path: big, prompt: 'x' });
core.markAck();
assert(core.noteResume({ conversation_id: 'newer' }) == null, 'acked resume should be silent');

reset();
process.stdout.write('session-burden selftest PASS\n');
