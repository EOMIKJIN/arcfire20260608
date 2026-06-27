/**
 * 메인스테이지(다크) — G-ARCHIVE tactical 버튼·패널 톤
 * 오버레이 라이트 카드(`TACTICAL_OVERLAY`)와 동일 헤더/CTA 그레이, 다크 배경용 투명도.
 */
import { TACTICAL_OVERLAY } from '../overlay/tacticalOverlayStyles';

export const TACTICAL_HUB = {
  tileBg: 'rgba(37, 41, 48, 0.52)',
  tileBorder: 'rgba(255, 255, 255, 0.22)',
  /** 상단 광원 그라데이션 — default 타일 */
  tileGradTop: '#343A44',
  tileGradMid: '#252930',
  tileGradBottom: '#14181E',
  /** 상단 광원 그라데이션 — primary(출발 등) */
  tilePrimaryGradTop: '#363C48',
  tilePrimaryGradMid: '#22262E',
  tilePrimaryGradBottom: '#101418',
  tileTopSheen: 'rgba(255, 255, 255, 0.14)',
  tileIconInk: 'rgba(184, 190, 201, 0.90)',
  /** 스캔·수색 게이지 LED와 동일 — 활성·프레스 아이콘 */
  tileIconLedActive: '#35D0FF',
  /** 아이콘 대비 한 단계 어두운 라벨 */
  tileLabelInk: 'rgba(148, 156, 170, 0.92)',
  tileLabelPrimaryInk: 'rgba(172, 180, 194, 0.92)',
  tileLabelLedActive: '#229ECC',
  tileLabelDisabledInk: TACTICAL_OVERLAY.btnSecondaryInk,
  tilePrimaryBg: TACTICAL_OVERLAY.btnPrimaryBg,
  tilePrimaryBorder: 'rgba(255, 255, 255, 0.26)',
  tilePrimaryInk: 'rgba(210, 216, 224, 0.92)',
  tileActiveInk: 'rgba(210, 216, 224, 0.94)',
  tileDisabledInk: TACTICAL_OVERLAY.btnSecondaryInk,
  panelBorder: 'rgba(120, 132, 160, 0.32)',
  panelBg: 'rgba(14, 18, 26, 0.44)',
  chromeBorder: 'rgba(255, 255, 255, 0.1)',
  chromeBg: 'rgba(37, 41, 48, 0.48)',
  chromeInk: 'rgba(210, 216, 224, 0.92)',
  /** 탑바 아이콘·통화 칩 라벨 */
  topBarIconInk: 'rgba(184, 190, 201, 0.9)',
  topBarCurrencyInk: 'rgba(232, 235, 240, 0.95)',
  miningCardBorder: 'rgba(130, 138, 150, 0.38)',
  miningCardBg: 'rgba(20, 24, 30, 0.72)',
  miningGuideInk: 'rgba(188, 194, 204, 0.88)',
  miningSummaryInk: 'rgba(184, 190, 201, 0.85)',
  controlBtnBorder: 'rgba(122, 140, 164, 0.42)',
  controlBtnBg: 'rgba(37, 41, 48, 0.65)',
  /** 파일럿 정보 펼침 — G-ARCHIVE 다크 그레이 (블루 bg_panel 대체) */
  pilotExpandBg: 'rgba(37, 41, 48, 0.94)',
  pilotExpandBorder: 'rgba(255, 255, 255, 0.1)',
  pilotLabelInk: 'rgba(184, 190, 201, 0.85)',
  pilotValueInk: 'rgba(210, 216, 224, 0.92)',
  pilotValueHighlightInk: 'rgba(232, 235, 240, 0.98)',
} as const;
