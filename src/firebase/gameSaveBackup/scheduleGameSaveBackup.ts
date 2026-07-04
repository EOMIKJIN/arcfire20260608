import { GAME_SAVE_BACKUP_MIN_INTERVAL_MS } from './gameSaveBackupContract';
import {
  resolveGameSaveBackupUid,
  uploadGameSaveBackup,
  uploadGameSaveBackupIfDue,
} from './gameSaveBackupService';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/** 클라우드 동기화 성공 후 — 6h 간격 자동 백업 (debounce) */
export function scheduleGameSaveBackupAfterCloudSync(uid: string): void {
  if (!uid?.trim()) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void uploadGameSaveBackupIfDue(uid, 'scheduled', GAME_SAVE_BACKUP_MIN_INTERVAL_MS).catch(() => {
      /* offline — Firestore queue */
    });
  }, 1200);
}

export function cancelScheduledGameSaveBackup(): void {
  if (!debounceTimer) return;
  clearTimeout(debounceTimer);
  debounceTimer = null;
}

/** 계정 purge 직전 — 최대 12s 대기 후 진행(업로드 지연 시 purge 블로킹 방지) */
const PRE_PURGE_BACKUP_MAX_WAIT_MS = 12_000;

export async function uploadPrePurgeGameSaveBackup(uid: string): Promise<void> {
  const resolved = await resolveGameSaveBackupUid(uid);
  if (!resolved) return;
  cancelScheduledGameSaveBackup();
  await Promise.race([
    uploadGameSaveBackup(resolved, 'pre_purge'),
    new Promise<void>((resolve) => {
      setTimeout(resolve, PRE_PURGE_BACKUP_MAX_WAIT_MS);
    }),
  ]);
}

/** 수동 백업 — 대용량 chunk 업로드 상한 */
const MANUAL_BACKUP_MAX_WAIT_MS = 45_000;

export async function uploadManualGameSaveBackup(
  uid: string,
): Promise<{ ok: boolean; backupId?: string; skipped?: string }> {
  const resolved = await resolveGameSaveBackupUid(uid);
  if (!resolved) return { ok: false, skipped: 'missing_uid' };
  return Promise.race([
    uploadGameSaveBackup(resolved, 'manual'),
    new Promise<{ ok: boolean; skipped: string }>((resolve) => {
      setTimeout(() => resolve({ ok: false, skipped: 'upload_failed' }), MANUAL_BACKUP_MAX_WAIT_MS);
    }),
  ]);
}
