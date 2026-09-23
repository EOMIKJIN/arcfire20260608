// ============================================================
// 바 공연 오디오 해석 — dialog / song 분리, songId 공유
// 정본: tables/content/bar_voice_clips.csv
// ============================================================

import {
  BAR_VOICE_CLIPS_FROM_CSV,
  type BarVoiceClipCsvRow,
  type BarVoiceClipRole,
} from '../../../data/generated/csvBarVoiceClips';
import { getBarAttendantById } from './barPatronageTables';

/** 재생 포맷 정본. voice 폴더는 mp3만 유지. */
export const BAR_VOICE_CANONICAL_FORMAT = 'mp3';

/**
 * 대사 실측(testbargirl_01): 2.95s · 320kbps mono · 117KB.
 * 곡 플레이스홀더(bargirlmusic01): 16.5s · 320kbps mono · 647KB.
 * 대사 목표 48~64kbps / 곡 목표 96~128kbps. 종업원 수만큼 복제 금지.
 */
export const BAR_VOICE_LINE_TARGET_KB = 32;
export const BAR_VOICE_LINE_HARD_KB = 160;
export const BAR_VOICE_SONG_TARGET_KB = 1800;
export const BAR_VOICE_SONG_HARD_KB = 2500;

type RoleIndex = {
  bySong: Map<string, BarVoiceClipCsvRow>;
  fallback: BarVoiceClipCsvRow | null;
};

let indexes: Record<BarVoiceClipRole, RoleIndex> | null = null;

function normalizeRole(raw: string | undefined): BarVoiceClipRole {
  return String(raw ?? '').trim().toLowerCase() === 'dialog' ? 'dialog' : 'song';
}

function getIndexes(): Record<BarVoiceClipRole, RoleIndex> {
  if (indexes) return indexes;
  const dialog: RoleIndex = { bySong: new Map(), fallback: null };
  const song: RoleIndex = { bySong: new Map(), fallback: null };
  const bucket: Record<BarVoiceClipRole, RoleIndex> = { dialog, song };
  for (let i = 0; i < BAR_VOICE_CLIPS_FROM_CSV.length; i++) {
    const row = BAR_VOICE_CLIPS_FROM_CSV[i]!;
    if (String(row.format ?? '').trim().toLowerCase() !== BAR_VOICE_CANONICAL_FORMAT) continue;
    const role = normalizeRole(row.role);
    const target = bucket[role];
    const songId = String(row.songId ?? '').trim();
    if (!songId) {
      if (!target.fallback) target.fallback = row;
      continue;
    }
    if (!target.bySong.has(songId)) target.bySong.set(songId, row);
  }
  indexes = bucket;
  return bucket;
}

function resolveByRole(
  role: BarVoiceClipRole,
  songId?: string | null,
): BarVoiceClipCsvRow | null {
  const { bySong, fallback } = getIndexes()[role];
  const id = String(songId ?? '').trim();
  if (id) {
    const hit = bySong.get(id);
    if (hit) return hit;
  }
  return fallback;
}

export function resolveBarVoiceClipForSong(songId?: string | null): BarVoiceClipCsvRow | null {
  return resolveByRole('song', songId);
}

export function resolveBarDialogVoiceClip(songId?: string | null): BarVoiceClipCsvRow | null {
  return resolveByRole('dialog', songId);
}

export function resolveBarVoiceClipForAttendant(
  attendantId?: string | null,
): BarVoiceClipCsvRow | null {
  const att = attendantId ? getBarAttendantById(attendantId) : undefined;
  return resolveBarVoiceClipForSong(att?.songId);
}

export function resolveBarDialogVoiceClipForAttendant(
  attendantId?: string | null,
): BarVoiceClipCsvRow | null {
  const att = attendantId ? getBarAttendantById(attendantId) : undefined;
  return resolveBarDialogVoiceClip(att?.songId);
}

export function estimateSharedSongBundleKb(params: {
  uniqueSongCount: number;
  kbEach: number;
}): number {
  const n = Math.max(0, Math.floor(params.uniqueSongCount));
  const kb = Math.max(0, Math.floor(params.kbEach));
  return n * kb;
}
