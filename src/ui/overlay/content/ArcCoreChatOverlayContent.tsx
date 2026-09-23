import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { resolveDictionaryLocale, useT } from '../../../i18n';
import { useAppSettingsStore } from '../../../store/appSettingsStore';
import {
  resolveChatSpeakerChrome,
  toggleNlMouthId,
} from '../../../arcCore/chat/resolveChatSpeakerChrome';
import { isArcCoreOriginPlayerTalkUnlocked } from '../../../arcCore/chat/arcCoreOriginTalkUnlock';
import { FONTS, SPACING } from '../../../utils/theme';
import {
  isArcCoreChatSessionOpenerReason,
  useArcCoreChatStore,
} from '../../../store/arcCoreChatStore';
import { submitArcCoreBackchannelMessage } from '../../../arcCore/chat/presentArcCoreBackchannel';
import {
  chunkEndOffsets,
  delayMsForChatTurnChunk,
} from '../../../arcCore/chat/splitArcCoreChatReplyTurns';
import {
  isArcCoreBootChatFirstActive,
  isArcCoreBootChatFirstStartPhrase,
} from '../../../arcCore/chat/arcCoreBootChatFirstGate';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcButton } from '../ArcButton';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { TACTICAL_OVERLAY } from '../tacticalOverlayStyles';
import { t as tStatic } from '../../../i18n';
import { ArcCoreLensIcon } from '../../arcCore/ArcCoreLensIcon';
import { ARC_CORE_LENS_BUBBLE_PX, ARC_CORE_LENS_HEADER_PX } from '../../../game/arcCoreSymbolAssets';

/** 스크롤 먼저 → 그다음 타이핑. 문장 전체가 한 번에 뜨지 않게 */
const CHAT_TYPE_INTERVAL_MS = 28;
const CHAT_TYPE_CHARS = 2;
const CHAT_SENTENCE_PAUSE_TICKS = 4;
const CHAT_SCROLL_SETTLE_MS = 160;
const CHAT_THINK_MS = 2000;
const CHAT_BREATH_MS = 520;
const CHAT_BREATH_SCALE = 0.72;
/** 대사 아래·생각 중. 옆에 붙이던 16은 숨숨이 안 보임 */
const CHAT_TURN_LENS_PX = 22;
const SENTENCE_END_RE = /[.!?。\n]/;
/** 아이콘은 채팅 줄 3배. 인사는 한 줄(최장 「다시 돌아오셨군요.」)에 맞춤 */
const CHAT_WELCOME_LENS_PX = ARC_CORE_LENS_BUBBLE_PX * 3;
/** 본문 위 스텔라 얼굴만 4배. 헤더·아크코어 렌즈는 현행 유지 */
const CHAT_WELCOME_FACE_PX = CHAT_WELCOME_LENS_PX * 4;
const CHAT_WELCOME_FONT_PX = 18;
const CHAT_WELCOME_LINE_PX = 24;

type Props = {
  onClose: () => void;
  /** keep-mount 후면일 때 입력·포커스·호흡 루프 정지 */
  surfaceActive?: boolean;
};

export const ArcCoreChatOverlayContent = memo(function ArcCoreChatOverlayContent({
  onClose,
  surfaceActive = true,
}: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('arcCoreChat');
  const messages = useArcCoreChatStore((s) => s.sessionMessages);
  const activeSpeakerId = useArcCoreChatStore((s) => s.activeSpeakerId);
  const locale = resolveDictionaryLocale(useAppSettingsStore((s) => s.locale));
  const speakerChrome = useMemo(
    () => resolveChatSpeakerChrome(activeSpeakerId, locale),
    [activeSpeakerId, locale],
  );
  const welcome = useMemo(() => {
    for (let i = 0; i < messages.length; i += 1) {
      const row = messages[i];
      if (row && isArcCoreChatSessionOpenerReason(row.reason)) return row;
    }
    return null;
  }, [messages]);
  const chatMessages = useMemo(
    () => messages.filter((row) => !isArcCoreChatSessionOpenerReason(row.reason)),
    [messages],
  );
  const chatting = useMemo(
    () => chatMessages.some((row) => row.role === 'user' || row.role === 'arc'),
    [chatMessages],
  );
  const showWelcomeHero = welcome != null && !chatting;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  /** 개발자 진단 전용 — cloud NL vs 로컬 템플릿 확인용. 게임 로직·저장 상태와 무관, __DEV__ 빌드에만 렌더 */
  const [lastDebug, setLastDebug] = useState<{
    providerId: 'local' | 'cloud';
    fallbackUsed: boolean;
  } | null>(null);
  const [typing, setTyping] = useState<{ id: string; full: string; shown: number } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const typePauseRef = useRef(0);
  const typeChunkEndsRef = useRef<number[]>([]);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollWaitResolveRef = useRef<(() => void) | null>(null);
  const thinkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breathLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const breathScaleRef = useRef(new Animated.Value(1));
  const breathScale = breathScaleRef.current;

  const scrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    });
  }, []);

  const waitFrame = useCallback(() => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }, []);

  const waitScrollSettle = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
      if (scrollWaitResolveRef.current) {
        const prev = scrollWaitResolveRef.current;
        scrollWaitResolveRef.current = null;
        prev();
      }
      scrollWaitResolveRef.current = resolve;
      scrollTimerRef.current = setTimeout(() => {
        scrollTimerRef.current = null;
        scrollWaitResolveRef.current = null;
        resolve();
      }, CHAT_SCROLL_SETTLE_MS);
    });
  }, []);

  const normalizeScrollThen = useCallback(async () => {
    scrollToLatest();
    await waitFrame();
    await waitScrollSettle();
    if (!mountedRef.current) return;
    scrollToLatest();
    await waitFrame();
  }, [scrollToLatest, waitFrame, waitScrollSettle]);

  const stopBreath = useCallback(() => {
    if (breathLoopRef.current) {
      breathLoopRef.current.stop();
      breathLoopRef.current = null;
    }
    breathScale.setValue(1);
  }, [breathScale]);

  const startBreath = useCallback(() => {
    stopBreath();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathScale, {
          toValue: CHAT_BREATH_SCALE,
          duration: CHAT_BREATH_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathScale, {
          toValue: 1,
          duration: CHAT_BREATH_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    breathLoopRef.current = loop;
    loop.start();
  }, [breathScale, stopBreath]);

  const waitThinkBeat = useCallback(() => {
    return new Promise<void>((resolve) => {
      if (thinkTimerRef.current) {
        clearTimeout(thinkTimerRef.current);
        thinkTimerRef.current = null;
      }
      thinkTimerRef.current = setTimeout(() => {
        thinkTimerRef.current = null;
        resolve();
      }, CHAT_THINK_MS);
    });
  }, []);

  useEffect(() => {
    const applyHeight = (next: number) => {
      setKeyboardHeight(Math.max(0, Math.round(next)));
    };
    const onShow = (e: { endCoordinates?: { height?: number } }) => {
      applyHeight(e.endCoordinates?.height ?? 0);
    };
    const onHide = () => {
      applyHeight(0);
    };
    const subs = [
      Keyboard.addListener('keyboardDidShow', onShow),
      Keyboard.addListener('keyboardDidHide', onHide),
    ];
    if (Platform.OS === 'ios') {
      subs.push(Keyboard.addListener('keyboardWillShow', onShow));
      subs.push(Keyboard.addListener('keyboardWillHide', onHide));
    }
    return () => {
      for (let i = 0; i < subs.length; i += 1) {
        subs[i]?.remove();
      }
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
        scrollTimerRef.current = null;
      }
      if (thinkTimerRef.current) {
        clearTimeout(thinkTimerRef.current);
        thinkTimerRef.current = null;
      }
      if (breathLoopRef.current) {
        breathLoopRef.current.stop();
        breathLoopRef.current = null;
      }
      const resolve = scrollWaitResolveRef.current;
      scrollWaitResolveRef.current = null;
      resolve?.();
    };
  }, []);

  useEffect(() => {
    if (keyboardHeight <= 0) return;
    scrollToLatest();
  }, [keyboardHeight, scrollToLatest]);

  useEffect(() => {
    if (!thinking) return;
    scrollToLatest();
  }, [thinking, scrollToLatest]);

  useEffect(() => {
    if (!surfaceActive) {
      Keyboard.dismiss();
      stopBreath();
      return;
    }
  }, [surfaceActive, stopBreath]);

  useEffect(() => {
    if (!surfaceActive || busy) return;
    const focusId = setTimeout(() => {
      inputRef.current?.focus();
    }, 280);
    return () => {
      clearTimeout(focusId);
    };
  }, [busy, surfaceActive]);

  useEffect(() => {
    if (!typing || typing.shown >= typing.full.length) return;
    const timer = setInterval(() => {
      if (typePauseRef.current > 0) {
        typePauseRef.current -= 1;
        return;
      }
      setTyping((cur) => {
        if (!cur) return cur;
        const nextShown = Math.min(cur.full.length, cur.shown + CHAT_TYPE_CHARS);
        const last = cur.full.charAt(nextShown - 1);
        const ends = typeChunkEndsRef.current;
        let chunkEnd = -1;
        for (let i = 0; i < ends.length; i += 1) {
          if (ends[i] === nextShown) {
            chunkEnd = ends[i]!;
            break;
          }
        }
        if (chunkEnd > 0) {
          let prev = 0;
          for (let i = 0; i < ends.length; i += 1) {
            const at = ends[i]!;
            if (at < chunkEnd) prev = at;
          }
          typePauseRef.current = Math.max(
            CHAT_SENTENCE_PAUSE_TICKS,
            Math.ceil(delayMsForChatTurnChunk(cur.full.slice(prev, chunkEnd)) / CHAT_TYPE_INTERVAL_MS),
          );
        } else if (SENTENCE_END_RE.test(last)) {
          typePauseRef.current = CHAT_SENTENCE_PAUSE_TICKS;
        }
        return nextShown === cur.shown ? cur : { ...cur, shown: nextShown };
      });
      scrollToLatest();
    }, CHAT_TYPE_INTERVAL_MS);
    return () => {
      clearInterval(timer);
    };
  }, [typing?.id, typing?.shown === typing?.full.length, scrollToLatest]);

  useEffect(() => {
    if (!typing) return;
    if (typing.shown < typing.full.length) return;
    setTyping(null);
    busyRef.current = false;
    setBusy(false);
    scrollToLatest();
  }, [typing, scrollToLatest]);

  const onSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || busyRef.current) return;
    if (isArcCoreBootChatFirstActive() && isArcCoreBootChatFirstStartPhrase(text)) {
      setDraft('');
      Keyboard.dismiss();
      inputRef.current?.blur();
      const result = await submitArcCoreBackchannelMessage(text);
      if (result.dismissedForTitle) return;
    }
    busyRef.current = true;
    setBusy(true);
    setDraft('');
    setThinking(true);
    startBreath();
    scrollToLatest();
    let result: Awaited<ReturnType<typeof submitArcCoreBackchannelMessage>>;
    try {
      const settled = await Promise.all([
        submitArcCoreBackchannelMessage(text),
        waitThinkBeat(),
      ]);
      result = settled[0];
    } catch {
      result = { ok: false, reply: null };
    }
    if (!mountedRef.current) return;
    setThinking(false);
    stopBreath();
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log('[arcCoreChat] provider=', result.providerId, 'fallback=', result.fallbackUsed);
      setLastDebug(
        result.providerId
          ? { providerId: result.providerId, fallbackUsed: Boolean(result.fallbackUsed) }
          : null,
      );
    }
    if (!result.ok || !result.reply) {
      useArcCoreChatStore.getState().appendMessage({
        role: 'system',
        text: tStatic('arcCoreChat.fail'),
      });
      busyRef.current = false;
      setBusy(false);
      scrollToLatest();
      return;
    }
    await normalizeScrollThen();
    const arc = useArcCoreChatStore.getState().appendMessage({
      role: 'arc',
      text: result.reply,
      reason: 'manual',
      speakerId: useArcCoreChatStore.getState().activeSpeakerId,
    });
    if (!mountedRef.current || !arc) {
      busyRef.current = false;
      return;
    }
    typePauseRef.current = 0;
    typeChunkEndsRef.current = chunkEndOffsets(result.reply);
    setTyping({ id: arc.id, full: result.reply, shown: 0 });
  }, [draft, normalizeScrollThen, scrollToLatest, startBreath, stopBreath, waitThinkBeat]);

  const footer = useMemo(
    () => (
      <View style={styles.composer}>
        {__DEV__ && lastDebug ? (
          <Text style={styles.devBadge}>
            [dev] {lastDebug.providerId}
            {lastDebug.fallbackUsed ? '(fallback)' : ''}
          </Text>
        ) : null}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={
              activeSpeakerId === 'operator'
                ? t('arcCoreChat.operator.placeholder')
                : t('arcCoreChat.placeholder')
            }
            placeholderTextColor={TACTICAL_OVERLAY.labelInk}
            showSoftInputOnFocus={surfaceActive}
            caretHidden={false}
            editable={surfaceActive}
            autoFocus={false}
            maxLength={500}
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              void onSend();
            }}
          />
          <ArcButton
            label={t('arcCoreChat.send')}
            visualTheme={visualTheme}
            intent="primary"
            compact
            disabled={!surfaceActive || busy || !draft.trim()}
            busy={busy}
            onPress={() => {
              void onSend();
            }}
          />
        </View>
        <View style={styles.toolRow}>
          <View
            style={styles.toolSlot}
            accessibilityRole="image"
            accessibilityLabel={t('arcCoreChat.toolSlot')}
          />
          <View
            style={styles.toolSlot}
            accessibilityRole="image"
            accessibilityLabel={t('arcCoreChat.toolSlot')}
          />
        </View>
      </View>
    ),
    [activeSpeakerId, busy, draft, lastDebug, onSend, surfaceActive, t, visualTheme],
  );

  const onToggleSpeaker = useCallback(() => {
    if (busyRef.current) return;
    const chat = useArcCoreChatStore.getState();
    const next = toggleNlMouthId(chat.activeSpeakerId);
    if (next === 'arc_core' && !isArcCoreOriginPlayerTalkUnlocked()) return;
    chat.setActiveSpeakerId(next);
  }, []);

  const canToggleSpeaker =
    isArcCoreOriginPlayerTalkUnlocked() || activeSpeakerId === 'arc_core';

  const headerPortrait = speakerChrome.useLens || !speakerChrome.portrait ? (
    <ArcCoreLensIcon
      size={ARC_CORE_LENS_HEADER_PX}
      accessibilityLabel={speakerChrome.title}
    />
  ) : (
    <Image
      source={speakerChrome.portrait}
      style={styles.headerPortrait}
      resizeMode="contain"
      accessibilityLabel={speakerChrome.title}
    />
  );

  const headerLeading = useMemo(
    () => (
      canToggleSpeaker ? (
        <Pressable
          onPress={onToggleSpeaker}
          accessibilityRole="button"
          accessibilityLabel={t('arcCoreChat.switchMouth')}
        >
          {headerPortrait}
        </Pressable>
      ) : (
        headerPortrait
      )
    ),
    [canToggleSpeaker, headerPortrait, onToggleSpeaker, t],
  );

  return (
    <KeyboardAvoidingView
      style={styles.fillShell}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
      collapsable={false}
    >
    <ArcOverlayCard
      layout="fill"
      visualTheme={visualTheme}
      title={speakerChrome.title}
      leading={headerLeading}
      onClose={onClose}
      footer={footer}
      scrollViewRef={scrollRef}
      keyboardDismissMode="none"
      bodyStyle={styles.chatBody}
      style={styles.fillCard}
    >
      {showWelcomeHero ? (
        <View style={styles.welcomeHero}>
          {speakerChrome.useLens || !speakerChrome.portrait ? (
            <ArcCoreLensIcon
              size={CHAT_WELCOME_LENS_PX}
              accessibilityLabel={speakerChrome.title}
            />
          ) : (
            <Image
              source={speakerChrome.portrait}
              style={styles.welcomeFace}
              resizeMode="contain"
              accessibilityLabel={speakerChrome.title}
            />
          )}
          <Text
            style={styles.welcomeText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {welcome.text}
          </Text>
        </View>
      ) : chatMessages.length === 0 && !thinking ? (
        <Text style={styles.empty}>{t('arcCoreChat.empty')}</Text>
      ) : (
        <>
          {chatMessages.map((m) => {
            const revealing = typing != null && typing.id === m.id;
            const body = revealing ? typing.full.slice(0, typing.shown) : m.text;
            const caret = revealing && typing.shown < typing.full.length ? '▌' : '';
            if (m.role === 'user') {
              return (
                <View key={m.id} style={styles.rowUser}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userBody}>{body}</Text>
                  </View>
                </View>
              );
            }
            if (m.role === 'system') {
              return (
                <View key={m.id} style={styles.rowSystem}>
                  <Text style={styles.systemBody}>{body}</Text>
                </View>
              );
            }
            return (
              <View key={m.id} style={styles.rowArc}>
                <Text style={styles.arcBody}>
                  {body}
                  {caret}
                </Text>
                <View style={styles.lensSlot}>
                  <ArcCoreLensIcon
                    size={CHAT_TURN_LENS_PX}
                    accessibilityLabel={t('arcCore.symbolA11y')}
                  />
                </View>
              </View>
            );
          })}
          {thinking ? (
            <View
              style={styles.rowArc}
              accessibilityRole="image"
              accessibilityLabel={t('arcCoreChat.thinking')}
            >
              <Animated.View style={[styles.lensSlot, { transform: [{ scale: breathScale }] }]}>
                <ArcCoreLensIcon
                  size={CHAT_TURN_LENS_PX}
                  accessibilityLabel={t('arcCoreChat.thinking')}
                />
              </Animated.View>
            </View>
          ) : null}
        </>
      )}
    </ArcOverlayCard>
    </KeyboardAvoidingView>
  );
});

const styles = StyleSheet.create({
  fillShell: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 0,
    justifyContent: 'flex-end',
  },
  fillCard: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    minHeight: 0,
  },
  chatBody: {
    backgroundColor: TACTICAL_OVERLAY.insetBg,
  },
  empty: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: TACTICAL_OVERLAY.labelInk,
    paddingVertical: SPACING.md,
  },
  headerPortrait: {
    width: ARC_CORE_LENS_HEADER_PX,
    height: ARC_CORE_LENS_HEADER_PX,
  },
  welcomeFace: {
    width: CHAT_WELCOME_FACE_PX,
    height: CHAT_WELCOME_FACE_PX * 1.4,
  },
  welcomeHero: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  welcomeText: {
    marginTop: SPACING.md,
    fontFamily: FONTS.mono,
    fontSize: CHAT_WELCOME_FONT_PX,
    lineHeight: CHAT_WELCOME_LINE_PX,
    textAlign: 'center',
    color: TACTICAL_OVERLAY.valueInk,
  },
  rowUser: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  userBubble: {
    maxWidth: '80%',
    backgroundColor: TACTICAL_OVERLAY.cardBg,
    borderWidth: 1,
    borderColor: TACTICAL_OVERLAY.insetBorder,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  userBody: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    lineHeight: 20,
    color: TACTICAL_OVERLAY.valueInk,
  },
  rowArc: {
    width: '100%',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: SPACING.md,
  },
  arcBody: {
    alignSelf: 'stretch',
    fontFamily: FONTS.mono,
    fontSize: 13,
    lineHeight: 20,
    color: TACTICAL_OVERLAY.valueInk,
  },
  lensSlot: {
    width: CHAT_TURN_LENS_PX,
    height: CHAT_TURN_LENS_PX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowSystem: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  systemBody: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    lineHeight: 18,
    color: TACTICAL_OVERLAY.labelInk,
  },
  composer: {
    width: '100%',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingTop: 4,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: TACTICAL_OVERLAY.insetBorder,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
  },
  devBadge: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: TACTICAL_OVERLAY.labelInk,
    opacity: 0.6,
    paddingHorizontal: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  input: {
    flex: 1,
    minHeight: 36,
    paddingHorizontal: 4,
    color: TACTICAL_OVERLAY.valueInk,
    fontFamily: FONTS.mono,
    fontSize: 13,
  },
  toolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: 4,
  },
  toolSlot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: TACTICAL_OVERLAY.labelInk,
    opacity: 0.35,
    flexShrink: 0,
  },
});
