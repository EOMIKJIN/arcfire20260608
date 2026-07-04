import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { TACTICAL_OVERLAY } from '../tacticalOverlayStyles';
import { phosphorOverlay } from './phosphorOverlayStyles';
import { usePlayerStore } from '../../../store/playerStore';
import type { GameSaveBackupListItem } from '../../../firebase/gameSaveBackup/gameSaveBackupService';
import {
  listGameSaveBackupsForUid,
  resolveGameSaveBackupUid,
  restoreGameSaveBackupToLocal,
  setAdminGameSaveRestorePending,
} from '../../../firebase/gameSaveBackup/gameSaveBackupService';
import { uploadManualGameSaveBackup } from '../../../firebase/gameSaveBackup/scheduleGameSaveBackup';
import { showArcAlert } from '../../../utils/showArcAlert';

type Props = {
  isTactical: boolean;
};

function formatBackupLine(item: GameSaveBackupListItem): string {
  const d = new Date(item.createdAtMs);
  const date = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const reasonLabel =
    item.reason === 'pre_purge'
      ? '초기화 직전'
      : item.reason === 'scheduled'
        ? '자동'
        : item.reason === 'manual'
          ? '수동'
          : item.reason;
  return `${date} · ${reasonLabel} · synth ${item.summary.synthUnlockCount} · Lv${item.summary.playerLevel ?? '?'}`;
}

function formatRestoreError(error?: string): string {
  switch (error) {
    case 'backup_expired':
      return '백업 보관 기간(7일)이 지났습니다.';
    case 'backup_empty':
      return '백업 데이터가 비어 있습니다.';
    case 'apply_failed':
      return '로컬 저장소에 적용하지 못했습니다. 앱 재시작 후 다시 시도하세요.';
    case 'pending_write_timeout':
      return '복구 예약 저장 시간이 초과되었습니다. 네트워크 확인 후 다시 시도하세요.';
    default:
      return '백업을 찾을 수 없거나 불러오지 못했습니다.';
  }
}

export const GameSaveBackupSection = memo(function GameSaveBackupSection({ isTactical }: Props) {
  const player = usePlayerStore((s) => s.player);
  const playerUid = player?.uid ?? '';

  const [backupUid, setBackupUid] = useState(playerUid);
  const [listLoading, setListLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [listLoaded, setListLoaded] = useState(false);
  const [listHint, setListHint] = useState<string | null>(null);
  const [items, setItems] = useState<GameSaveBackupListItem[]>([]);
  const reloadSeqRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void resolveGameSaveBackupUid(playerUid).then((uid) => {
      if (!cancelled && uid) setBackupUid(uid);
    });
    return () => {
      cancelled = true;
    };
  }, [playerUid]);

  const reload = useCallback(async () => {
    const uid = await resolveGameSaveBackupUid(playerUid);
    if (!uid) return;
    setBackupUid(uid);
    const seq = ++reloadSeqRef.current;
    setListLoading(true);
    setListHint(null);
    try {
      const result = await listGameSaveBackupsForUid(uid, 12);
      if (seq !== reloadSeqRef.current) return;
      setItems(result.items);
      setListLoaded(true);
      if (result.status === 'timeout') {
        setListHint('목록 조회 시간이 초과되었습니다. 네트워크 확인 후 다시 시도하세요.');
      } else if (result.status === 'error') {
        setListHint('목록을 불러오지 못했습니다. 잠시 후 다시 시도하세요.');
      }
    } finally {
      if (seq === reloadSeqRef.current) setListLoading(false);
    }
  }, [playerUid]);

  const busy = listLoading || actionBusy;

  const onManualBackup = useCallback(async () => {
    const uid = await resolveGameSaveBackupUid(playerUid);
    if (!uid) return;
    setBackupUid(uid);
    setActionBusy(true);
    try {
      const result = await uploadManualGameSaveBackup(uid);
      if (result.ok) {
        showArcAlert('백업 완료', '클라우드에 저장했습니다.');
        void reload();
      } else {
        const reason =
          result.skipped === 'payload_too_large'
            ? '저장 데이터가 너무 큽니다. 잠시 후 다시 시도하거나 개발자에게 문의하세요.'
            : result.skipped === 'interval'
              ? '6시간 이내 자동 백업이 이미 있습니다.'
              : result.skipped === 'upload_failed'
                ? '네트워크 오류로 백업 업로드에 실패했습니다.'
                : '백업에 실패했습니다. 네트워크 연결을 확인해 주세요.';
        showArcAlert('백업 실패', reason);
      }
    } finally {
      setActionBusy(false);
    }
  }, [playerUid, reload]);

  const onRestore = useCallback(
    async (backupId: string) => {
      const uid = await resolveGameSaveBackupUid(playerUid);
      if (!uid) return;
      setBackupUid(uid);
      setActionBusy(true);
      try {
        const result = await restoreGameSaveBackupToLocal(uid, backupId);
        if (result.ok) {
          showArcAlert(
            '복구 완료',
            '저장 데이터를 불러왔습니다. 앱을 한 번 재시작하거나 행성 허브를 다시 열어 주세요.',
          );
        } else {
          showArcAlert('복구 실패', formatRestoreError(result.error));
        }
      } finally {
        setActionBusy(false);
      }
    },
    [playerUid],
  );

  const onQueueBootRestore = useCallback(
    async (backupId: string) => {
      const uid = await resolveGameSaveBackupUid(playerUid);
      if (!uid) return;
      setBackupUid(uid);
      setActionBusy(true);
      try {
        const pending = await setAdminGameSaveRestorePending(uid, backupId, 'admin_in_app');
        if (pending.ok) {
          showArcAlert('복구 예약', '다음 앱 실행 시 선택한 백업으로 자동 복구됩니다.');
        } else {
          showArcAlert('복구 예약 실패', formatRestoreError(pending.error));
        }
      } finally {
        setActionBusy(false);
      }
    },
    [playerUid],
  );

  if (!backupUid) return null;

  const labelStyle = isTactical ? styles.labelTactical : styles.label;
  const hintStyle = isTactical ? styles.hintTactical : styles.hint;
  const rowStyle = isTactical ? styles.rowTactical : styles.row;

  return (
    <>
      <View style={isTactical ? phosphorOverlay.divider : phosphorOverlay.divider} />
      <Text style={isTactical ? phosphorOverlay.sectionLabel : phosphorOverlay.sectionLabel}>
        게임 저장 백업 · 복구 (7일)
      </Text>
      <Text style={hintStyle}>
        클라우드에 최대 7일간 보관됩니다. 계정 초기화 직전·6시간마다 자동 백업됩니다.
      </Text>
      <Pressable style={rowStyle} onPress={() => void onManualBackup()} disabled={busy}>
        <Text style={labelStyle}>지금 백업하기</Text>
      </Pressable>
      <Pressable style={rowStyle} onPress={() => void reload()} disabled={busy}>
        <Text style={labelStyle}>백업 목록 새로고침</Text>
      </Pressable>
      {listLoading ? (
        <ActivityIndicator color={OVERLAY_TOKENS.phosphorAccent} style={styles.spinner} />
      ) : null}
      {listHint ? <Text style={hintStyle}>{listHint}</Text> : null}
      {!listLoaded && !listLoading ? (
        <Text style={hintStyle}>「백업 목록 새로고침」을 눌러 클라우드 백업 목록을 확인하세요.</Text>
      ) : null}
      {listLoaded && items.length === 0 && !listLoading ? (
        <Text style={hintStyle}>저장된 백업이 없습니다. 플레이 후 자동 생성되거나 위에서 수동 백업하세요.</Text>
      ) : null}
      {items.map((item) => (
        <View key={item.backupId} style={styles.backupBlock}>
          <Text style={hintStyle} numberOfLines={2}>
            {formatBackupLine(item)}
          </Text>
          <View style={styles.btnRow}>
            <Pressable style={rowStyle} onPress={() => void onRestore(item.backupId)} disabled={busy}>
              <Text style={labelStyle}>이 백업으로 복구</Text>
            </Pressable>
            <Pressable
              style={rowStyle}
              onPress={() => void onQueueBootRestore(item.backupId)}
              disabled={busy}
            >
              <Text style={labelStyle}>다음 실행 시 복구</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: OVERLAY_TOKENS.phosphorAccent,
  },
  labelTactical: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: TACTICAL_OVERLAY.labelInk,
  },
  hint: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: OVERLAY_TOKENS.valueContentColor,
    marginBottom: SPACING.sm,
  },
  hintTactical: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: TACTICAL_OVERLAY.labelInk,
    opacity: 0.75,
    marginBottom: SPACING.sm,
  },
  row: {
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  rowTactical: {
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  backupBlock: {
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(107, 212, 255, 0.2)',
  },
  btnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  spinner: {
    marginVertical: SPACING.sm,
  },
});

/** @deprecated GameSaveBackupSection */
export const GameSaveBackupAdminSection = GameSaveBackupSection;
