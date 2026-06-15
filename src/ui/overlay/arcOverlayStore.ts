import { create } from 'zustand';
import type { LevelUpSummary, MissionReward } from '../../types';
import type { TradeProfitTip } from '../../game/tradeProfitTips';
import type { ImageSourcePropType } from 'react-native';
import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

let overlaySeq = 0;
function nextOverlayId(prefix: string): string {
  overlaySeq += 1;
  return `${prefix}-${overlaySeq}`;
}

export type ArcAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
};

export type ArcOverlayKind =
  | 'alert'
  | 'levelUp'
  | 'reward'
  | 'narrative'
  | 'blocking'
  | 'tradeQuantity'
  | 'planetEconomyInfo'
  | 'planetDevelopment';

type ArcOverlayBase = {
  id: string;
  dismissOnBackdrop?: boolean;
};

export type ArcOverlayAlertEntry = ArcOverlayBase & {
  kind: 'alert';
  title: string;
  message: string;
  buttons: ArcAlertButton[];
};

export type ArcOverlayLevelUpEntry = ArcOverlayBase & {
  kind: 'levelUp';
  summary: LevelUpSummary;
  onClose: () => void;
};

export type ArcOverlayRewardEntry = ArcOverlayBase & {
  kind: 'reward';
  reward: MissionReward;
  missionTitle: string;
  leveledUp?: boolean;
  newLevel?: number;
  levelUpDetail?: LevelUpSummary | null;
  onClose: () => void;
};

export type ArcOverlayNarrativeEntry = ArcOverlayBase & {
  kind: 'narrative';
  anchor: 'center' | 'bottom';
  label: string;
  text: string;
  typewriterKey: string;
  buttonText: '[ 다음 ]' | '[ 확인 ]';
  onPressNext: () => void;
  nextDisabled?: boolean;
  onTextComplete?: () => void;
  typewriterSpeedMs?: number;
  imageSource?: ImageSourcePropType;
  measureTextRaw?: string;
  onMeasureTextLayout?: (e: NativeSyntheticEvent<TextLayoutEventData>) => void;
  /** false — 화면 외부 버튼이 진행 담당(intro footer 등) */
  showActionButton?: boolean;
};

export type ArcOverlayBlockingEntry = ArcOverlayBase & {
  kind: 'blocking';
  message?: string;
};

export type ArcOverlayTradeQuantityEntry = ArcOverlayBase & {
  kind: 'tradeQuantity';
  mode: 'buy' | 'sell';
  title: string;
  unitPrice: number;
  maxQty: number;
  minQty?: number;
  initialQty?: number;
  stock?: number;
  demandLabel?: string;
  ownedQty?: number;
  /** 구매 모달 — 수량 ± 시 (보유 − 합계) 미리보기용 */
  playerCredits?: number;
  /** 전함·무기 구매 모달 — 테이블 기반 간단 설명(최대 3줄 UI) */
  itemDescription?: string;
  tips?: TradeProfitTip[];
  onConfirm: (qty: number) => void | Promise<void>;
};

export type ArcOverlayPlanetEconomyInfoEntry = ArcOverlayBase & {
  kind: 'planetEconomyInfo';
  planetId: string;
  planetName: string;
};

export type PlanetDevelopmentInitialView = 'list' | 'defense_satellite';

export type ArcOverlayPlanetDevelopmentEntry = ArcOverlayBase & {
  kind: 'planetDevelopment';
  planetId: string;
  planetName: string;
  initialView?: PlanetDevelopmentInitialView;
};

export type ArcOverlayEntry =
  | ArcOverlayAlertEntry
  | ArcOverlayLevelUpEntry
  | ArcOverlayRewardEntry
  | ArcOverlayNarrativeEntry
  | ArcOverlayBlockingEntry
  | ArcOverlayTradeQuantityEntry
  | ArcOverlayPlanetEconomyInfoEntry
  | ArcOverlayPlanetDevelopmentEntry;

export type ArcOverlayInput =
  | (Omit<ArcOverlayAlertEntry, 'id'> & { id?: string })
  | (Omit<ArcOverlayLevelUpEntry, 'id'> & { id?: string })
  | (Omit<ArcOverlayRewardEntry, 'id'> & { id?: string })
  | (Omit<ArcOverlayNarrativeEntry, 'id'> & { id?: string })
  | (Omit<ArcOverlayBlockingEntry, 'id'> & { id?: string })
  | (Omit<ArcOverlayTradeQuantityEntry, 'id'> & { id?: string })
  | (Omit<ArcOverlayPlanetEconomyInfoEntry, 'id'> & { id?: string })
  | (Omit<ArcOverlayPlanetDevelopmentEntry, 'id'> & { id?: string });

type ArcOverlayState = {
  stack: ArcOverlayEntry[];
  top: () => ArcOverlayEntry | null;
  present: (entry: ArcOverlayInput) => void;
  replaceTop: (entry: ArcOverlayInput) => void;
  dismiss: () => void;
  dismissAll: () => void;
  dismissWhere: (pred: (entry: ArcOverlayEntry) => boolean) => void;
  /** id 일치 항목 부분 갱신 — narrative nextDisabled 등 타자기 유지용 */
  patchOverlay: (id: string, patch: Partial<ArcOverlayEntry>) => void;
};

function withId(entry: ArcOverlayInput): ArcOverlayEntry {
  const id = entry.id ?? nextOverlayId(entry.kind);
  return { ...entry, id } as ArcOverlayEntry;
}

export const useArcOverlayStore = create<ArcOverlayState>((set, get) => ({
  stack: [],
  top: () => {
    const s = get().stack;
    return s.length > 0 ? s[s.length - 1]! : null;
  },
  present: (entry) => {
    const next = withId(entry);
    set((s) => ({ stack: [...s.stack, next] }));
  },
  replaceTop: (entry) => {
    const next = withId(entry);
    set((s) => {
      if (s.stack.length === 0) return { stack: [next] };
      return { stack: [...s.stack.slice(0, -1), next] };
    });
  },
  dismiss: () => {
    set((s) => ({ stack: s.stack.slice(0, -1) }));
  },
  dismissAll: () => set({ stack: [] }),
  dismissWhere: (pred) => {
    set((s) => ({ stack: s.stack.filter((e) => !pred(e)) }));
  },
  patchOverlay: (id, patch) => {
    set((s) => ({
      stack: s.stack.map((e) => (e.id === id ? ({ ...e, ...patch } as ArcOverlayEntry) : e)),
    }));
  },
}));

/** alert — 연속 호출 시 최상단 alert 만 교체 */
export function presentArcOverlayAlert(
  title: string,
  message: string,
  buttons?: ArcAlertButton[],
): void {
  const list =
    buttons && buttons.length > 0
      ? buttons
      : [{ text: '확인', style: 'default' as const }];
  const entry: Omit<ArcOverlayAlertEntry, 'id'> = {
    kind: 'alert',
    title,
    message,
    buttons: list,
    dismissOnBackdrop: true,
  };
  const top = useArcOverlayStore.getState().top();
  if (top?.kind === 'alert') {
    useArcOverlayStore.getState().replaceTop(entry);
  } else {
    useArcOverlayStore.getState().present(entry);
  }
}

export function dismissArcOverlay(): void {
  useArcOverlayStore.getState().dismiss();
}

export function dismissAllArcOverlays(): void {
  useArcOverlayStore.getState().dismissAll();
}

const PLANET_ECONOMY_INFO_OVERLAY_ID = 'planet-economy-info';
const PLANET_DEVELOPMENT_OVERLAY_ID = 'planet-development';

export function presentPlanetEconomyInfoOverlay(planetId: string, planetName: string): void {
  const entry: ArcOverlayInput = {
    kind: 'planetEconomyInfo',
    planetId,
    planetName,
    dismissOnBackdrop: true,
    id: PLANET_ECONOMY_INFO_OVERLAY_ID,
  };
  const top = useArcOverlayStore.getState().top();
  if (top?.kind === 'planetEconomyInfo' && top.planetId === planetId) {
    useArcOverlayStore.getState().replaceTop(entry);
  } else {
    useArcOverlayStore.getState().present(entry);
  }
}

export function presentPlanetDevelopmentOverlay(
  planetId: string,
  planetName: string,
  initialView: PlanetDevelopmentInitialView = 'list',
): void {
  const entry: ArcOverlayInput = {
    kind: 'planetDevelopment',
    planetId,
    planetName,
    initialView,
    dismissOnBackdrop: true,
    id: PLANET_DEVELOPMENT_OVERLAY_ID,
  };
  const top = useArcOverlayStore.getState().top();
  if (top?.kind === 'planetDevelopment' && top.planetId === planetId) {
    useArcOverlayStore.getState().replaceTop(entry);
  } else {
    useArcOverlayStore.getState().present(entry);
  }
}
