/**
 * 이동중 전투 패럴랙스 — 좌상→우하 동일 대각, 겹마다 속도·위상만 다름.
 * require/Skia 없음 (node 테스트용).
 *
 * 베이크 성운: cover(max 변). 구름: 정사각(짧은 변×1.25), 겹마다 다른 속도.
 * 위·아래 72/54는 구름 다음 검은 fill 덮개. 뷰 인셋·clipRect 아님.
 */
import { STAGE_BOTTOM_MIN_INSET_PX, STAGE_TOP_INSET_PX } from '../stages/layout';

/** space_cd01·02 두 장만 흐른다 (03 제거 · 대표님 2026-10-07). */
export const TRANSIT_SPACE_CD_COUNT = 2;
/** 동시에 흘리는 장 수 — 1~2장. 타일 격자로 화면을 메우지 않음. */
export const TRANSIT_CLOUD_LAYER_COUNT = 2;
/** 같은 대각, 겹마다 다른 속도. 빨라지지 않음. */
export const TRANSIT_CLOUD_LAYER_SPEEDS_PX_PER_SEC = [1.15, 1.7] as const;
export const TRANSIT_CLOUD_SPEED_CAP_PX_PER_SEC = 2.4;
/** 0.5 = 화면 중앙에서 시작, 0 = 화면 밖에서 들어온다. */
export const TRANSIT_CLOUD_LAYER_WRAP_PHASE_FRAC = [0.5, 0] as const;
export const TRANSIT_CLOUD_LAYER_ALPHA = [0.40, 0.34] as const;
/** 짧은 변 × 1.25. 정사각 +30%라 가로가 차 보인다. */
export const TRANSIT_CLOUD_SPRITE_FILL_FRAC = 1.25;
/** 구름이 화면 밖으로 완전히 나간 뒤 되돌아가기 전 여유(px). */
export const TRANSIT_CLOUD_OFFSCREEN_MARGIN_PX = 24;
/** 틱에서 SkImage.width() 금지(JsiSkImage::width SIGSEGV). */
export const TRANSIT_SPACE_CD_NATIVE_PX = 150;
/** 베이크 PNG 실제 변(vega 등 768). 툴 내부 1024와 다름. 틱 width() 금지. */
export const TRANSIT_BAKED_NATIVE_PX = 768;
/** 허브 nebulaBackdropLayer opacity */
export const TRANSIT_BAKED_FILL_ALPHA = 0.94;
export const TRANSIT_SPACE_DRIFT_PX_PER_SEC = 1.15;
export const TRANSIT_SPACE_PHASE_SEC = 1.6;
/** 구름은 1.15~1.7px/s. 80ms는 Picture+setState가 전투 프레임과 겹쳐 끊김. */
export const TRANSIT_PARALLAX_TICK_MS = 120;
/**
 * Picture+setState 최소 간격. 틱(120ms)마다 finishRecordingAsPicture 하면
 * 궤도 전투 Picture(60Hz)와 겹쳐 Hermes/Finalizer가 3~5초 주기로 걷는다.
 * 구름 1.7px/s 기준 320ms ≈ 0.5px — 레이아웃·첫 프레임은 force commit.
 */
export const TRANSIT_PARALLAX_MIN_COMMIT_MS = 320;
/** 화면 좌표: +x 오른쪽, +y 아래 = 좌상→우하 */
export const TRANSIT_DIAGONAL_SX = 1;
export const TRANSIT_DIAGONAL_SY = 0.68;
/** 이동전투 별빛 — 고정 카탈로그. 틱 신규 할당 없음. */
export const TRANSIT_STAR_COUNT = 52;
export const TRANSIT_STAR_STRIDE = 4;
/** 구름(1.15+)보다 느림. 원경. */
export const TRANSIT_STAR_DRIFT_PX_PER_SEC = 0.28;
export const TRANSIT_STAR_TWINKLE_RAD_PER_SEC = 1.35;

export function hashTransitDestKey(destSystemId: string): number {
  const key = destSystemId.trim() || 'transit';
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickTransitSpaceCdIndex(destSystemId: string): number {
  return hashTransitDestKey(destSystemId) % TRANSIT_SPACE_CD_COUNT;
}

/** 이번 조우에서 실제로 그릴 space_cd 슬롯 2개. */
export function resolveTransitCloudImageSlots(
  indexBase: number,
  cloudIndexBias: number,
): readonly [number, number] {
  const a = ((indexBase + cloudIndexBias) % TRANSIT_SPACE_CD_COUNT + TRANSIT_SPACE_CD_COUNT)
    % TRANSIT_SPACE_CD_COUNT;
  const b = (a + 1) % TRANSIT_SPACE_CD_COUNT;
  return [a, b];
}

/**
 * 구름·베이크가 모두 있어야 첫 Picture를 올린다.
 * 일부만 그린 프레임을 연속 commit하면 초반 성운이 깜박인다.
 */
export function areTransitNebulaLayersReady(input: {
  clouds: readonly (object | null | undefined)[];
  indexBase: number;
  cloudIndexBias: number;
  bakedRequired: boolean;
  baked: object | null | undefined;
}): boolean {
  const a = ((input.indexBase + input.cloudIndexBias) % TRANSIT_SPACE_CD_COUNT + TRANSIT_SPACE_CD_COUNT)
    % TRANSIT_SPACE_CD_COUNT;
  const b = (a + 1) % TRANSIT_SPACE_CD_COUNT;
  if (!input.clouds[a] || !input.clouds[b]) return false;
  if (input.bakedRequired && !input.baked) return false;
  return true;
}

/**
 * 레이아웃 재측정 직후 일반 틱은 건너뛰되, force(첫 프레임·확정 리사이즈)는 그린다.
 * force까지 막으면 Canvas/Picture가 빈 채로 남는다.
 */
export function shouldSkipTransitParallaxResizeTick(input: {
  force: boolean;
  skipTicks: number;
  hasLivePicture: boolean;
}): { skip: boolean; nextSkipTicks: number } {
  if (input.force || input.skipTicks <= 0) {
    return { skip: false, nextSkipTicks: input.force ? 0 : input.skipTicks };
  }
  if (input.hasLivePicture) {
    return { skip: true, nextSkipTicks: input.skipTicks - 1 };
  }
  return { skip: false, nextSkipTicks: 0 };
}

/**
 * 은하 지도 이탈 reclaim이 이미 켜진 이동전투 성운을 지우지 않는다.
 */
export function shouldPreserveTransitNebulaOnExternalReclaim(input: {
  mounted: boolean;
  active: boolean;
}): boolean {
  return input.mounted === true && input.active === true;
}

/**
 * useImage가 소스 교체 직후 잠깐 null이어도 직전 레이어를 유지한다.
 * null로 덮으면 성운이 생겼다가 사라진다.
 */
export function resolveHeldTransitLayerImage<T>(
  incoming: T | null | undefined,
  held: T | null | undefined,
): T | null {
  return incoming ?? held ?? null;
}

/** 별 드리프트 시점을 한 바퀴 안에서 고르기 위한 가상 경과 상한(초). */
export const TRANSIT_SESSION_STAR_BIAS_SPAN_SEC = 240;

export type TransitSessionViewStart = {
  /** 구름 랩에 더하는 공통 시점 [0,1). 겹 상대 위상(0.5/0)은 유지 */
  cloudStartFrac: number;
  /** space_cd 시작 장. 01·02 세트는 같고 첫 장만 다름 */
  cloudIndexBias: number;
  /** 별 필드 elapsed에 더하는 초 */
  starElapsedBiasSec: number;
};

/**
 * 전투 1회 시점. 속도·대각·겹 규칙은 그대로, 시작 오프셋만 시드마다 다름.
 * 틱에서 호출하지 말 것 — 마운트/조우 시작 1회.
 */
export function resolveTransitSessionViewStart(seed: number): TransitSessionViewStart {
  let s = seed >>> 0;
  s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  const cloudStartFrac = (s & 0xffff) / 65536;
  s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  const cloudIndexBias = s % TRANSIT_SPACE_CD_COUNT;
  s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
  const starElapsedBiasSec = ((s & 0xffff) / 65536) * TRANSIT_SESSION_STAR_BIAS_SPAN_SEC;
  return { cloudStartFrac, cloudIndexBias, starElapsedBiasSec };
}

export function rollTransitSessionViewSeed(nowMs = Date.now()): number {
  return ((nowMs ^ Math.imul(nowMs, 1664525)) >>> 0) || 1;
}

export type TransitCloudLayerMotion = {
  vx: number;
  vy: number;
  wrapPhaseFrac: number;
  alpha: number;
};

export function resolveTransitCloudLayerMotions(): TransitCloudLayerMotion[] {
  const layers: TransitCloudLayerMotion[] = [];
  for (let i = 0; i < TRANSIT_CLOUD_LAYER_COUNT; i += 1) {
    const speed = TRANSIT_CLOUD_LAYER_SPEEDS_PX_PER_SEC[i]!;
    layers.push({
      vx: speed * TRANSIT_DIAGONAL_SX,
      vy: speed * TRANSIT_DIAGONAL_SY,
      wrapPhaseFrac: TRANSIT_CLOUD_LAYER_WRAP_PHASE_FRAC[i]!,
      alpha: TRANSIT_CLOUD_LAYER_ALPHA[i]!,
    });
  }
  return layers;
}

/** 레거시 StageShell 크롬 합. Backdrop 구름에는 사용하지 않음. */
export function resolveTransitStageInsets(safeBottomPx = 0): { topPx: number; bottomPx: number } {
  return {
    topPx: STAGE_TOP_INSET_PX,
    bottomPx: Math.max(STAGE_BOTTOM_MIN_INSET_PX, Math.max(0, safeBottomPx)),
  };
}

/**
 * 레거시: StageShell 포그라운드 패드 숫자.
 * Backdrop 컨테이너/구름 dest에 적용하면 단색 띠가 난다. 호출하지 말 것.
 */
export function resolveTransitBackdropChromePad(safeBottomPx = 0): { topPx: number; bottomPx: number } {
  return {
    topPx: STAGE_TOP_INSET_PX,
    bottomPx: Math.max(0, STAGE_BOTTOM_MIN_INSET_PX - Math.max(0, safeBottomPx)),
  };
}

/** 레거시 콘텐츠 박스 수학. 현재 구름은 raw canvas를 넘긴다. */
export function resolveTransitFullscreenContentBox(
  canvasW: number,
  canvasH: number,
  topPx: number,
  bottomPx: number,
): { x: number; y: number; w: number; h: number } {
  const top = Math.max(0, topPx);
  const bottom = Math.max(0, bottomPx);
  return {
    x: 0,
    y: top,
    w: Math.max(1, canvasW),
    h: Math.max(1, canvasH - top - bottom),
  };
}

/** 성운 베이크 cover 정사각. Backdrop는 (w,h,0,0) — 짧은 변 기준으로 원본 크기가 남지 않게 화면을 채움. */
export function resolveTransitBakedFillBox(
  canvasW: number,
  canvasH: number,
  topPx?: number,
  bottomPx?: number,
): { x: number; y: number; size: number } {
  const insets = resolveTransitStageInsets();
  const content = resolveTransitFullscreenContentBox(
    canvasW,
    canvasH,
    topPx ?? insets.topPx,
    bottomPx ?? insets.bottomPx,
  );
  const size = Math.max(0, Math.max(content.w, content.h));
  return {
    x: content.x + (content.w - size) * 0.5,
    y: content.y + (content.h - size) * 0.5,
    size,
  };
}

/** 위·아래 검은 덮개. Backdrop가 구름을 그린 다음 fill로 덮는다. 뷰 인셋·clipRect 아님. */
export function resolveTransitChromeCoverBands(canvasH: number): {
  topY: number;
  topH: number;
  bottomY: number;
  bottomH: number;
} {
  const topH = STAGE_TOP_INSET_PX;
  const bottomH = STAGE_BOTTOM_MIN_INSET_PX;
  return {
    topY: 0,
    topH,
    bottomY: Math.max(0, canvasH - bottomH),
    bottomH,
  };
}

/** 한 장 구름 dest — 정사각. 짧은 변 × 1.25라 가로는 차고 세로는 안 늘림. */
export function resolveTransitCloudSpriteSize(
  canvasW: number,
  canvasH: number,
): { w: number; h: number } {
  const side = Math.max(
    1,
    Math.round(Math.min(canvasW, canvasH) * TRANSIT_CLOUD_SPRITE_FILL_FRAC),
  );
  return { w: side, h: side };
}

/** nx, ny, rPx, phase. 길이 = COUNT*STRIDE. 레이아웃과 무관한 정규화 좌표. */
export function fillTransitStarCatalog(out: Float32Array, seed = 0xa4c51e): void {
  const need = TRANSIT_STAR_COUNT * TRANSIT_STAR_STRIDE;
  if (out.length < need) return;
  let s = seed >>> 0;
  for (let i = 0; i < TRANSIT_STAR_COUNT; i += 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const nx = (s & 0xffff) / 65536;
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const ny = (s & 0xffff) / 65536;
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const r = 0.55 + ((s & 0xff) / 255) * 1.15;
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const phase = ((s & 0xffff) / 65536) * Math.PI * 2;
    const o = i * TRANSIT_STAR_STRIDE;
    out[o] = nx;
    out[o + 1] = ny;
    out[o + 2] = r;
    out[o + 3] = phase;
  }
}

export function resolveTransitStarDrift(): { vx: number; vy: number } {
  return {
    vx: TRANSIT_STAR_DRIFT_PX_PER_SEC * TRANSIT_DIAGONAL_SX,
    vy: TRANSIT_STAR_DRIFT_PX_PER_SEC * TRANSIT_DIAGONAL_SY,
  };
}

/** 원경 별 위치·반짝임. out = [x, y, r, alpha]. 틱에서 새 객체 만들지 말 것. */
export function writeTransitStarDraw(
  catalog: Float32Array,
  index: number,
  canvasW: number,
  canvasH: number,
  elapsedSec: number,
  out: Float32Array,
): void {
  const o = index * TRANSIT_STAR_STRIDE;
  const nx = catalog[o] ?? 0;
  const ny = catalog[o + 1] ?? 0;
  const r = catalog[o + 2] ?? 0.7;
  const phase = catalog[o + 3] ?? 0;
  const vx = TRANSIT_STAR_DRIFT_PX_PER_SEC * TRANSIT_DIAGONAL_SX;
  const vy = TRANSIT_STAR_DRIFT_PX_PER_SEC * TRANSIT_DIAGONAL_SY;
  out[0] = wrapParallaxOffset(nx * canvasW + elapsedSec * vx, canvasW);
  out[1] = wrapParallaxOffset(ny * canvasH + elapsedSec * vy, canvasH);
  out[2] = r;
  const twinkle = 0.5 + 0.5 * Math.sin(elapsedSec * TRANSIT_STAR_TWINKLE_RAD_PER_SEC + phase);
  out[3] = r >= 1.25 ? 0.38 + 0.42 * twinkle : 0.22 + 0.28 * twinkle;
}

export function resolveTransitSpaceDrift(): { vx: number; vy: number; phaseSec: number } {
  return {
    vx: TRANSIT_SPACE_DRIFT_PX_PER_SEC * TRANSIT_DIAGONAL_SX,
    vy: TRANSIT_SPACE_DRIFT_PX_PER_SEC * TRANSIT_DIAGONAL_SY,
    phaseSec: TRANSIT_SPACE_PHASE_SEC,
  };
}

type TransitSystemLook = {
  planets: readonly { id: string }[];
  connections: readonly string[];
};

/** 목적지 행성(허브 참고) → dest id 자체가 행성 → 출발 → 이웃. */
export function resolveTransitNearbyNebulaPlanetId(input: {
  originSystemId: string;
  destSystemId: string;
  getSystem: (systemId: string) => TransitSystemLook | undefined;
}): string {
  const destId = input.destSystemId.trim();
  const originId = input.originSystemId.trim();
  const dest = destId ? input.getSystem(destId) : undefined;
  const destPlanet = dest?.planets[0]?.id?.trim() ?? '';
  if (destPlanet) return destPlanet;
  if (destId) return destId;
  const origin = originId ? input.getSystem(originId) : undefined;
  const originPlanet = origin?.planets[0]?.id?.trim() ?? '';
  if (originPlanet) return originPlanet;
  const links = origin?.connections ?? [];
  for (let i = 0; i < links.length; i += 1) {
    const sid = links[i]!.trim();
    if (!sid || sid === originId) continue;
    const planetId = input.getSystem(sid)?.planets[0]?.id?.trim() ?? '';
    if (planetId) return planetId;
  }
  return originId;
}

export function wrapParallaxOffset(t: number, period: number): number {
  if (!(period > 0) || !Number.isFinite(t)) return 0;
  const m = t % period;
  return m < 0 ? m + period : m;
}

/**
 * 구름 한 바퀴 이동량(x축 px). 화면 중앙을 지나 대각선으로 흐르다
 * 스프라이트가 화면 밖으로 완전히 나간 뒤에만 반대편(역시 화면 밖)으로 되돌아간다.
 * 화면 안에서 위치가 튀면 구름이 깜박이며 새로 생기는 것처럼 보인다.
 */
export function resolveTransitCloudTravelPeriod(
  canvasW: number,
  canvasH: number,
  spriteW: number,
  spriteH: number,
): number {
  const slope = TRANSIT_DIAGONAL_SY / TRANSIT_DIAGONAL_SX;
  const exitByX = (canvasW + spriteW) * 0.5;
  const exitByY = slope > 0 ? (canvasH + spriteH) * 0.5 / slope : exitByX;
  const exit = Math.min(exitByX, exitByY);
  return Math.max(1, exit * 2 + TRANSIT_CLOUD_OFFSCREEN_MARGIN_PX * 2);
}

/** ox·oy = 화면 중앙 기준 구름 중심 이동량. 위상 0.5면 정중앙. */
export function resolveTransitCloudScrollOrigin(input: {
  canvasW: number;
  canvasH: number;
  spriteW: number;
  spriteH: number;
  elapsedSec: number;
  vx: number;
  wrapPhaseFrac: number;
  /** 조우마다 다른 시점. 기본 0이면 기존 중앙(0.5) 규칙 그대로 */
  sessionStartFrac?: number;
}): { ox: number; oy: number } {
  const period = resolveTransitCloudTravelPeriod(
    input.canvasW,
    input.canvasH,
    input.spriteW,
    input.spriteH,
  );
  const frac = wrapParallaxOffset(input.wrapPhaseFrac + (input.sessionStartFrac ?? 0), 1);
  const u = wrapParallaxOffset(input.elapsedSec * input.vx + frac * period, period) - period * 0.5;
  return {
    ox: u,
    oy: u * (TRANSIT_DIAGONAL_SY / TRANSIT_DIAGONAL_SX),
  };
}

/** ox=oy=0 일 때 화면 중앙. */
export function resolveTransitCloudSpriteDest(input: {
  canvasW: number;
  canvasH: number;
  spriteW: number;
  spriteH: number;
  ox: number;
  oy: number;
}): { x: number; y: number; w: number; h: number } {
  return {
    x: (input.canvasW - input.spriteW) * 0.5 + input.ox,
    y: (input.canvasH - input.spriteH) * 0.5 + input.oy,
    w: input.spriteW,
    h: input.spriteH,
  };
}

export function countTransitCloudsOverlappingViewport(
  dests: readonly { x: number; y: number; w: number; h: number }[],
  canvasW: number,
  canvasH: number,
): number {
  let n = 0;
  for (let i = 0; i < dests.length; i += 1) {
    const d = dests[i]!;
    if (intersectRects(d.x, d.y, d.w, d.h, 0, 0, canvasW, canvasH)) n += 1;
  }
  return n;
}

export function intersectRects(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): { x: number; y: number; w: number; h: number } | null {
  const x = Math.max(ax, bx);
  const y = Math.max(ay, by);
  const w = Math.min(ax + aw, bx + bw) - x;
  const h = Math.min(ay + ah, by + bh) - y;
  if (!(w > 0) || !(h > 0)) return null;
  return { x, y, w, h };
}

export function mapDestCropToSrc(
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number,
  srcW: number,
  srcH: number,
): { x: number; y: number; w: number; h: number } | null {
  if (!(destW > 0) || !(destH > 0) || !(srcW > 0) || !(srcH > 0)) return null;
  const x = ((cropX - destX) / destW) * srcW;
  const y = ((cropY - destY) / destH) * srcH;
  const w = (cropW / destW) * srcW;
  const h = (cropH / destH) * srcH;
  if (!(w > 0) || !(h > 0)) return null;
  return { x, y, w, h };
}

