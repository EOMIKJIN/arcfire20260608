/** Firestore 게임 저장 백업 — 7일 보관 · 관리자 복구 */

export const GAME_SAVE_BACKUP_SCHEMA_VERSION = 2;

/** 복구 가능 기간 (7일) */
export const GAME_SAVE_BACKUP_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/** 자동 백업 최소 간격 — Firestore 쓰기·페이로드 폭주 방지. 7일 보관(MAX_PER_UID=28)과 정합되는 6h로 통일 */
export const GAME_SAVE_BACKUP_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** uid당 최대 스냅샷 수 (초과 시 오래된 것부터 삭제) */
export const GAME_SAVE_BACKUP_MAX_PER_UID = 28;

/** Firestore 단일 문서 1MB 한계 — 직렬화 전체 크기 상한(여유) */
export const GAME_SAVE_BACKUP_MAX_PAYLOAD_CHARS = 900_000;

/** 인라인 실패 시 payload_chunks 서브컬렉션 분할 단위(문자) */
export const GAME_SAVE_BACKUP_CHUNK_TARGET_CHARS = 380_000;

export const GAME_SAVE_BACKUP_PAYLOAD_CHUNKS_SUBCOLLECTION = 'payload_chunks';

export const GAME_SAVE_BACKUPS_SUBCOLLECTION = 'game_save_backups';

export type GameSaveBackupReason =
  | 'scheduled'
  | 'pre_purge'
  | 'manual'
  | 'admin_restore_point';

export type GameSaveBackupSnapshot = Record<string, string>;

export type GameSaveBackupPayloadMode = 'inline' | 'chunked';

export type GameSaveBackupDoc = {
  schemaVersion: number;
  uid: string;
  nickname: string | null;
  createdAtMs: number;
  expiresAtMs: number;
  reason: GameSaveBackupReason;
  appVersion: string;
  payloadMode?: GameSaveBackupPayloadMode;
  /** chunked일 때 payload_chunks 문서 수 */
  chunkCount?: number;
  /** AsyncStorage key → raw JSON string (chunked면 비어 있음) */
  snapshot: GameSaveBackupSnapshot;
  summary: {
    /** v2 — 전체 id 목록 중복 저장 금지(용량) */
    unlockedSystemCount: number;
    synthUnlockCount: number;
    currentPlanetId: string | null;
    playerLevel: number | null;
  };
  /** v2 — 백업에서 생략된 AsyncStorage 키 */
  omittedKeys?: string[];
};

/** 관리자 CLI / 인앱 — 대상 uid 문서에 1회성 복구 지시 */
export type AdminGameSaveRestorePending = {
  backupId: string;
  requestedAtMs: number;
  expiresAtMs: number;
  requestedBy: 'admin_cli' | 'admin_in_app';
};

export const ADMIN_GAME_SAVE_RESTORE_PENDING_FIELD = 'adminGameSaveRestorePending';
