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
import { useT } from '../../../i18n';

type Props = {
  isTactical: boolean;
};

function formatBackupLine(
  item: GameSaveBackupListItem,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const d = new Date(item.createdAtMs);
  const date = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const reasonKey = `backup.reason.${item.reason}`;
  const reasonLabel = t(reasonKey);
  const reason = reasonLabel !== reasonKey ? reasonLabel : item.reason;
  return t('backup.line', {
    date,
    reason,
    synth: item.summary.synthUnlockCount,
    level: item.summary.playerLevel ?? '?',
  });
}

function formatRestoreError(
  t: (key: string, params?: Record<string, string | number>) => string,
  error?: string,
): string {
  switch (error) {
    case 'backup_expired':
      return t('backup.error.expired');
    case 'backup_empty':
      return t('backup.error.empty');
    case 'apply_failed':
      return t('backup.error.apply');
    case 'pending_write_timeout':
      return t('backup.error.pendingTimeout');
    default:
      return t('backup.error.notFound');
  }
}

export const GameSaveBackupSection = memo(function GameSaveBackupSection({ isTactical }: Props) {
  const t = useT();
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
        setListHint(t('backup.listTimeout'));
      } else if (result.status === 'error') {
        setListHint(t('backup.listError'));
      }
    } finally {
      if (seq === reloadSeqRef.current) setListLoading(false);
    }
  }, [playerUid, t]);

  const busy = listLoading || actionBusy;

  const onManualBackup = useCallback(async () => {
    const uid = await resolveGameSaveBackupUid(playerUid);
    if (!uid) return;
    setBackupUid(uid);
    setActionBusy(true);
    try {
      const result = await uploadManualGameSaveBackup(uid);
      if (result.ok) {
        showArcAlert(t('backup.ok.title'), t('backup.ok.body'));
        void reload();
      } else {
        const reason =
          result.skipped === 'payload_too_large'
            ? t('backup.fail.payloadTooLarge')
            : result.skipped === 'interval'
              ? t('backup.fail.interval')
              : result.skipped === 'upload_failed'
                ? t('backup.fail.upload')
                : t('backup.fail.generic');
        showArcAlert(t('backup.fail.title'), reason);
      }
    } finally {
      setActionBusy(false);
    }
  }, [playerUid, reload, t]);

  const onRestore = useCallback(
    async (backupId: string) => {
      const uid = await resolveGameSaveBackupUid(playerUid);
      if (!uid) return;
      setBackupUid(uid);
      setActionBusy(true);
      try {
        const result = await restoreGameSaveBackupToLocal(uid, backupId);
        if (result.ok) {
          showArcAlert(t('backup.restore.ok.title'), t('backup.restore.ok.body'));
        } else {
          showArcAlert(t('backup.restore.fail.title'), formatRestoreError(t, result.error));
        }
      } finally {
        setActionBusy(false);
      }
    },
    [playerUid, t],
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
          showArcAlert(t('backup.restore.pendingOk.title'), t('backup.restore.pendingOk.body'));
        } else {
          showArcAlert(
            t('backup.restore.pendingFail.title'),
            formatRestoreError(t, pending.error),
          );
        }
      } finally {
        setActionBusy(false);
      }
    },
    [playerUid, t],
  );

  if (!backupUid) return null;

  const labelStyle = isTactical ? styles.labelTactical : styles.label;
  const hintStyle = isTactical ? styles.hintTactical : styles.hint;
  const rowStyle = isTactical ? styles.rowTactical : styles.row;

  return (
    <>
      <View style={phosphorOverlay.divider} />
      <Text style={phosphorOverlay.sectionLabel}>{t('backup.sectionTitle')}</Text>
      <Text style={hintStyle}>{t('backup.sectionHint')}</Text>
      <Pressable style={rowStyle} onPress={() => void onManualBackup()} disabled={busy}>
        <Text style={labelStyle}>{t('backup.manual')}</Text>
      </Pressable>
      <Pressable style={rowStyle} onPress={() => void reload()} disabled={busy}>
        <Text style={labelStyle}>{t('backup.refresh')}</Text>
      </Pressable>
      {listLoading ? (
        <ActivityIndicator color={OVERLAY_TOKENS.phosphorAccent} style={styles.spinner} />
      ) : null}
      {listHint ? <Text style={hintStyle}>{listHint}</Text> : null}
      {!listLoaded && !listLoading ? (
        <Text style={hintStyle}>{t('backup.listPrompt')}</Text>
      ) : null}
      {listLoaded && items.length === 0 && !listLoading ? (
        <Text style={hintStyle}>{t('backup.listEmpty')}</Text>
      ) : null}
      {items.map((item) => (
        <View key={item.backupId} style={styles.backupBlock}>
          <Text style={hintStyle} numberOfLines={2}>
            {formatBackupLine(item, t)}
          </Text>
          <View style={styles.btnRow}>
            <Pressable style={rowStyle} onPress={() => void onRestore(item.backupId)} disabled={busy}>
              <Text style={labelStyle}>{t('backup.restore.now')}</Text>
            </Pressable>
            <Pressable
              style={rowStyle}
              onPress={() => void onQueueBootRestore(item.backupId)}
              disabled={busy}
            >
              <Text style={labelStyle}>{t('backup.restore.nextBoot')}</Text>
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
