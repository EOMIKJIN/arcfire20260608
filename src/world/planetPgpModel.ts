// ============================================================
// 행성 총생산(PGP · Planet Gross Production) — 5대 스탯(R/P/D/T/E) 기반
// ============================================================

import type { PlanetCoreGaugeView } from '../store/planetCoreRuntimeStore';

/** 5대 스탯 스칼라 — 각 0..100 정수 */
export type PlanetPgpStats = {
  resource: number;
  population: number;
  defense: number;
  technology: number;
  environment: number;
};

const R_BMU_PER_POINT = 1000;
const P_BMU_PER_POINT = 500;

/** 0..100 정수로 클램프·반올림 */
export function clampPlanetPgpStat(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * PGP 계산용 행성 값 객체.
 * (월드 CSV `Planet` 타입과 구분 — R/P/D/T/E 스칼라만 보유)
 */
export class PlanetPgpPlanet {
  private _resource: number;
  private _population: number;
  private _defense: number;
  private _technology: number;
  private _environment: number;

  constructor(stats: Partial<PlanetPgpStats> = {}) {
    this._resource = clampPlanetPgpStat(stats.resource ?? 0);
    this._population = clampPlanetPgpStat(stats.population ?? 0);
    this._defense = clampPlanetPgpStat(stats.defense ?? 0);
    this._technology = clampPlanetPgpStat(stats.technology ?? 0);
    this._environment = clampPlanetPgpStat(stats.environment ?? 0);
  }

  get resource(): number {
    return this._resource;
  }
  set resource(value: number) {
    this._resource = clampPlanetPgpStat(value);
  }

  get population(): number {
    return this._population;
  }
  set population(value: number) {
    this._population = clampPlanetPgpStat(value);
  }

  get defense(): number {
    return this._defense;
  }
  set defense(value: number) {
    this._defense = clampPlanetPgpStat(value);
  }

  get technology(): number {
    return this._technology;
  }
  set technology(value: number) {
    this._technology = clampPlanetPgpStat(value);
  }

  get environment(): number {
    return this._environment;
  }
  set environment(value: number) {
    this._environment = clampPlanetPgpStat(value);
  }

  /** R/P/D/T/E 스냅샷 */
  toStats(): PlanetPgpStats {
    return {
      resource: this._resource,
      population: this._population,
      defense: this._defense,
      technology: this._technology,
      environment: this._environment,
    };
  }

  /**
   * 행성 총생산(PGP, BMU) — 정수 반환.
   *
   * base_output = R×1000 + P×500
   * T_mod = 1 + T/100, E_mod = 0.5 + E/100, D_mod = 0.5 + D/200
   * total_pgp = floor(base_output × T_mod × E_mod × D_mod)
   */
  calculatePgp(): number {
    return calculatePlanetPgpFromStats(this.toStats());
  }

  /** snake_case 별칭 (스펙·외부 문서 호환) */
  calculate_pgp(): number {
    return this.calculatePgp();
  }
}

export function calculatePlanetPgpFromStats(stats: PlanetPgpStats): number {
  const r = clampPlanetPgpStat(stats.resource);
  const p = clampPlanetPgpStat(stats.population);
  const d = clampPlanetPgpStat(stats.defense);
  const t = clampPlanetPgpStat(stats.technology);
  const e = clampPlanetPgpStat(stats.environment);

  const baseOutput = r * R_BMU_PER_POINT + p * P_BMU_PER_POINT;
  const tMod = 1.0 + t / 100;
  const eMod = 0.5 + e / 100;
  const dMod = 0.5 + d / 200;

  return Math.floor(baseOutput * tMod * eMod * dMod);
}

/** `planetCoreRuntimeStore` 게이지 → PGP 행성 값 객체 */
export function planetPgpFromCoreGauge(gauge: PlanetCoreGaugeView): PlanetPgpPlanet {
  return new PlanetPgpPlanet({
    resource: gauge.resource,
    population: gauge.population,
    defense: gauge.defense,
    technology: gauge.technology,
    environment: gauge.environment,
  });
}

/** UI 표기 — 천 단위 구분 + BMU */
export function formatPlanetPgpBmu(pgp: number): string {
  const n = Math.max(0, Math.floor(Number.isFinite(pgp) ? pgp : 0));
  return `${n.toLocaleString('ko-KR')} BMU`;
}
