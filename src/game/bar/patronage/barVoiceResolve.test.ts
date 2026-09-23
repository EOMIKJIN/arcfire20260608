/**
 * 바 공연 오디오 — mp3 정본 · dialog/song 분리 · songId 공유
 * npx tsx --test src/game/bar/patronage/barVoiceResolve.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { BAR_ATTENDANTS_FROM_CSV, BAR_SONGS_FROM_CSV } from '../../../data/generated/csvBarPatronage';
import { BAR_VOICE_CLIPS_FROM_CSV } from '../../../data/generated/csvBarVoiceClips';
import {
  BAR_VOICE_CANONICAL_FORMAT,
  BAR_VOICE_LINE_HARD_KB,
  BAR_VOICE_SONG_HARD_KB,
  BAR_VOICE_SONG_TARGET_KB,
  estimateSharedSongBundleKb,
  resolveBarDialogVoiceClip,
  resolveBarVoiceClipForAttendant,
  resolveBarVoiceClipForSong,
} from './barVoiceResolve';

const ROOT = resolve(process.cwd());
const DIALOG_MP3 = resolve(ROOT, 'assets/audio/voice/testbargirl_01.mp3');
const SONG_MP3 = resolve(ROOT, 'assets/audio/voice/bargirlmusic01.mp3');

test('dialog clip stays short mp3', () => {
  const clip = resolveBarDialogVoiceClip(null);
  assert.ok(clip);
  assert.equal(clip.role, 'dialog');
  assert.equal(clip.format, BAR_VOICE_CANONICAL_FORMAT);
  assert.equal(clip.assetKey, 'voice/testbargirl_01');
  assert.equal(clip.loop, false);
  assert.ok(clip.durationMs >= 2900 && clip.durationMs <= 3100);
  assert.equal(statSync(DIALOG_MP3).size, clip.bytes);
  assert.ok(clip.bytes / 1024 < BAR_VOICE_LINE_HARD_KB);
});

test('performance song uses bargirlmusic01 mp3 once without loop', () => {
  const clip = resolveBarVoiceClipForSong(null);
  assert.ok(clip);
  assert.equal(clip.role, 'song');
  assert.equal(clip.format, BAR_VOICE_CANONICAL_FORMAT);
  assert.equal(clip.assetKey, 'voice/bargirlmusic01');
  assert.equal(clip.loop, false);
  assert.ok(clip.durationMs >= 16000 && clip.durationMs <= 17000);
  assert.equal(statSync(SONG_MP3).size, clip.bytes);
  assert.ok(clip.bytes / 1024 < BAR_VOICE_SONG_HARD_KB);
});

test('all songs and attendants share the music placeholder', () => {
  assert.equal(BAR_SONGS_FROM_CSV.length, 5);
  for (const song of BAR_SONGS_FROM_CSV) {
    const clip = resolveBarVoiceClipForSong(song.songId);
    assert.ok(clip, song.songId);
    assert.equal(clip.clipId, 'song_test_fallback');
    assert.equal(clip.loop, false);
  }
  assert.ok(BAR_ATTENDANTS_FROM_CSV.length >= 11);
  assert.ok(BAR_ATTENDANTS_FROM_CSV.length <= 200);
  for (const att of BAR_ATTENDANTS_FROM_CSV) {
    const clip = resolveBarVoiceClipForAttendant(att.attendantId);
    assert.ok(clip, att.attendantId);
    assert.equal(clip.assetKey, 'voice/bargirlmusic01');
  }
});

test('shared song budget stays under hard cap; unique-per-girl does not', () => {
  const shared = estimateSharedSongBundleKb({
    uniqueSongCount: BAR_SONGS_FROM_CSV.length,
    kbEach: BAR_VOICE_SONG_TARGET_KB,
  });
  const unique = estimateSharedSongBundleKb({
    uniqueSongCount: BAR_ATTENDANTS_FROM_CSV.length,
    kbEach: BAR_VOICE_SONG_TARGET_KB,
  });
  assert.equal(shared, 5 * BAR_VOICE_SONG_TARGET_KB);
  assert.ok(shared <= 5 * BAR_VOICE_SONG_HARD_KB);
  assert.ok(unique > shared * 8, 'per-attendant songs would blow the APK');
});

test('csv rows are mp3-only playable entries', () => {
  assert.ok(BAR_VOICE_CLIPS_FROM_CSV.length >= 2);
  for (const row of BAR_VOICE_CLIPS_FROM_CSV) {
    assert.equal(row.format, 'mp3');
    assert.match(row.assetKey, /^voice\//);
    assert.ok(row.role === 'dialog' || row.role === 'song');
  }
  const csv = readFileSync(resolve(ROOT, 'tables/content/bar_voice_clips.csv'), 'utf8');
  assert.match(csv, /song_test_fallback/);
  assert.match(csv, /bargirlmusic01/);
});
