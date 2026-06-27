import { BaseArcSubCore } from './BaseArcSubCore';
import { getArcCoreInboundDronePolicy } from '../balance/arcCoreInboundDronePolicy';
import {
  isArcInboundDroneCampaignSimActive,
  isArcInboundDroneHubRenderEligible,
  readArcInboundDroneHubBridge,
} from '../inboundDrone/arcInboundDroneHubBridge';
import { runInboundDroneInterceptPass } from '../inboundDrone/runInboundDroneInterceptPass';
import { readPlanetOrbitClockMs } from '../orbitClockMsBridge';
import { resolveArcInboundDroneStrikeLeakMul } from '../inboundDrone/resolveInboundDroneStrikeLeak';
import { applyPlanetAttackCoreDamage } from '../planetAttack/applyPlanetAttackCoreDamage';
import { PLANET_ATTACK_KIND } from '../planetAttack/planetAttackKind';
import { usePlayerStore } from '../../store/playerStore';
import {
  useArcInboundDroneStore,
  type ArcInboundDrone,
} from '../../store/arcInboundDroneStore';

type PendingSpawn = {
  dueSec: number;
  planetId: string;
};

type PlanetInboundDroneCampaign = {
  planetId: string;
  drones: ArcInboundDrone[];
  pendingSpawns: PendingSpawn[];
  waveAccSec: number;
  droneSeq: number;
};

/**
 * 아크코어 드론 — 행성별 벽시계 inbound 캠페인.
 * 시설·출발·백그라운드·궤도 전투 = PAUSE (상태 유지). 행성 이탈 = 캠페인 Map 보존.
 * 플레이어 임의 취소 API 없음 — abort 는 계정 초기화·onShutdown 만.
 */
export class ArcInboundDroneSubCore extends BaseArcSubCore {
  private readonly campaigns = new Map<string, PlanetInboundDroneCampaign>();
  private publishAccSec = 0;
  private lastPublishedKey: string | null = null;
  private lastRenderEligible = false;
  private lastPublishedPlanetId: string | null = null;

  private static readonly SNAPSHOT_INTERVAL_SEC = 0.25;
  /** Skia trail 페이드 — `INBOUND_DRONE_TRAIL_FADE_MS`와 맞춤 */
  private static readonly TRAIL_FADE_SEC = 1.4;
  /** 동시 보관 행성 캠페인 상한 — Map 누적 방지 */
  private static readonly MAX_CAMPAIGNS = 5;

  constructor() {
    super('arc_inbound_drone_subcore', '아크코어 드론 서브코어');
    this.onWallTick = ({ wallDeltaSec, elapsedWallSec }) => {
      this.tick(wallDeltaSec, elapsedWallSec);
    };
  }

  override onBoot(): void {
    this.syncRenderSnapshot(null, true);
  }

  override onShutdown(): void {
    this.resetAllCampaigns();
  }

  /** 계정 초기화 — `resetArcInboundDroneCampaigns()` */
  resetAllCampaigns(): void {
    this.campaigns.clear();
    this.publishAccSec = 0;
    this.lastPublishedKey = null;
    this.lastRenderEligible = false;
    this.lastPublishedPlanetId = null;
    this.syncRenderSnapshot(null, true);
  }

  /** STAGE blur — 앵커 1행성만 유지, 활성 드론·pending 비움(캠페인 wave 누적은 유지) */
  trimCampaignsForStageExit(keepPlanetId: string | null): void {
    this.publishAccSec = 0;
    this.lastPublishedKey = null;
    this.lastRenderEligible = false;
    this.lastPublishedPlanetId = null;

    if (!keepPlanetId?.trim()) {
      this.campaigns.clear();
      this.syncRenderSnapshot(null, true);
      return;
    }

    const keep = keepPlanetId.trim();
    for (const pid of [...this.campaigns.keys()]) {
      if (pid !== keep) {
        this.campaigns.delete(pid);
      }
    }

    const campaign = this.campaigns.get(keep);
    if (campaign) {
      campaign.drones = [];
      campaign.pendingSpawns = [];
    }

    this.syncRenderSnapshot(null, true);
  }

  private getOrCreateCampaign(planetId: string): PlanetInboundDroneCampaign {
    let campaign = this.campaigns.get(planetId);
    if (!campaign) {
      campaign = {
        planetId,
        drones: [],
        pendingSpawns: [],
        waveAccSec: 0,
        droneSeq: 0,
      };
      this.campaigns.set(planetId, campaign);
    }
    return campaign;
  }

  private pruneCampaigns(keepPlanetId: string): void {
    if (this.campaigns.size <= ArcInboundDroneSubCore.MAX_CAMPAIGNS) return;
    for (const pid of this.campaigns.keys()) {
      if (pid === keepPlanetId) continue;
      if (this.campaigns.size <= ArcInboundDroneSubCore.MAX_CAMPAIGNS) break;
      this.campaigns.delete(pid);
    }
  }

  private pendingSpawnCap(policy: ReturnType<typeof getArcCoreInboundDronePolicy>): number {
    return Math.max(policy.waveCount, policy.waveCount * 3);
  }

  private tick(wallDeltaSec: number, elapsedWallSec: number): void {
    const playerPlanetId = usePlayerStore.getState().player?.currentPlanetId ?? null;
    const hub = readArcInboundDroneHubBridge();
    const simActive = isArcInboundDroneCampaignSimActive(playerPlanetId, hub);
    const renderEligible = isArcInboundDroneHubRenderEligible(playerPlanetId, hub);

    if (!playerPlanetId) {
      this.handleRenderTransition(renderEligible, null, false);
      return;
    }

    const campaign = this.getOrCreateCampaign(playerPlanetId);
    this.pruneCampaigns(playerPlanetId);

    if (simActive) {
      this.runCampaignTick(campaign, wallDeltaSec, elapsedWallSec);
    }

    const renderTransition =
      renderEligible !== this.lastRenderEligible
      || (renderEligible && this.lastPublishedPlanetId !== playerPlanetId);

    this.handleRenderTransition(renderEligible, campaign, renderTransition);

    if (renderEligible) {
      this.publishAccSec += wallDeltaSec;
      if (this.publishAccSec >= ArcInboundDroneSubCore.SNAPSHOT_INTERVAL_SEC) {
        this.publishAccSec = 0;
        this.publishCampaignSnapshot(campaign, false);
      }
    } else {
      this.publishAccSec = 0;
    }
  }

  private handleRenderTransition(
    renderEligible: boolean,
    campaign: PlanetInboundDroneCampaign | null,
    force: boolean,
  ): void {
    if (renderEligible) {
      if (force && campaign) {
        this.publishAccSec = 0;
        this.publishCampaignSnapshot(campaign, true);
      }
      this.lastRenderEligible = true;
      return;
    }

    if (this.lastRenderEligible || force) {
      this.syncRenderSnapshot(null, true);
    }
    this.lastRenderEligible = false;
  }

  private runCampaignTick(
    campaign: PlanetInboundDroneCampaign,
    wallDeltaSec: number,
    elapsedWallSec: number,
  ): void {
    const planetId = campaign.planetId;
    const policy = getArcCoreInboundDronePolicy();

    campaign.waveAccSec += wallDeltaSec;
    if (campaign.waveAccSec >= policy.waveIntervalSec) {
      campaign.waveAccSec = 0;
      this.scheduleWave(campaign, planetId, elapsedWallSec, policy);
    }

    this.flushPendingSpawns(campaign, elapsedWallSec, planetId, policy);

    for (const d of campaign.drones) {
      if (d.phase !== 'inbound') continue;
      const startWall = d.inboundStartWallSec ?? elapsedWallSec;
      const elapsed = Math.min(
        d.inboundDurationSec,
        Math.max(0, elapsedWallSec - startWall),
      );
      d.inboundElapsedSec = elapsed;
      if (elapsed >= d.inboundDurationSec) {
        d.phase = 'impacted';
        applyPlanetAttackCoreDamage({
          planetId: d.planetId,
          attackKind: PLANET_ATTACK_KIND.ARC_INBOUND_DRONE_IMPACT,
          sourceId: d.id,
          intensityMul: resolveArcInboundDroneStrikeLeakMul(d),
        });
      }
    }

    runInboundDroneInterceptPass(planetId, campaign.drones, wallDeltaSec);

    for (const d of campaign.drones) {
      if (d.phase !== 'inbound' && d.trailEndWallSec == null) {
        d.trailEndWallSec = elapsedWallSec;
      }
    }

    campaign.drones = campaign.drones.filter((d) => {
      if (d.phase === 'inbound') return true;
      const end = d.trailEndWallSec ?? elapsedWallSec;
      return elapsedWallSec - end < ArcInboundDroneSubCore.TRAIL_FADE_SEC;
    });
    while (campaign.drones.length > policy.maxActiveDrones) {
      campaign.drones.shift();
    }
  }

  private scheduleWave(
    campaign: PlanetInboundDroneCampaign,
    planetId: string,
    elapsedWallSec: number,
    policy: ReturnType<typeof getArcCoreInboundDronePolicy>,
  ): void {
    const cap = this.pendingSpawnCap(policy);
    for (let i = 0; i < policy.waveCount; i += 1) {
      if (campaign.pendingSpawns.length >= cap) break;
      campaign.pendingSpawns.push({
        dueSec: elapsedWallSec + i * policy.staggerSec,
        planetId,
      });
    }
  }

  private flushPendingSpawns(
    campaign: PlanetInboundDroneCampaign,
    elapsedWallSec: number,
    planetId: string,
    policy: ReturnType<typeof getArcCoreInboundDronePolicy>,
  ): void {
    if (campaign.pendingSpawns.length === 0) return;
    const kept: PendingSpawn[] = [];
    for (const job of campaign.pendingSpawns) {
      if (job.planetId !== planetId) continue;
      if (job.dueSec > elapsedWallSec) {
        kept.push(job);
        continue;
      }
      if (campaign.drones.length >= policy.maxActiveDrones) {
        kept.push(job);
        continue;
      }
      this.spawnDrone(campaign, planetId, policy, elapsedWallSec);
    }
    campaign.pendingSpawns = kept;
  }

  private spawnDrone(
    campaign: PlanetInboundDroneCampaign,
    planetId: string,
    policy: ReturnType<typeof getArcCoreInboundDronePolicy>,
    elapsedWallSec: number,
  ): void {
    campaign.droneSeq += 1;
    const drone: ArcInboundDrone = {
      id: `arc_inbound_drone_${planetId}_${campaign.droneSeq}`,
      planetId,
      approachAngleRad: Math.random() * Math.PI * 2,
      inboundStartOrbitMs: readPlanetOrbitClockMs(),
      inboundStartWallSec: elapsedWallSec,
      inboundElapsedSec: 0,
      inboundDurationSec: policy.inboundDurationSec,
      hp: policy.droneHp,
      maxHp: policy.droneHp,
      phase: 'inbound',
      defenseZoneDwellSec: 0,
    };
    campaign.drones.push(drone);
  }

  private syncRenderSnapshot(campaign: PlanetInboundDroneCampaign | null, force: boolean): void {
    if (!force && !campaign) return;
    this.lastPublishedKey = null;
    this.lastPublishedPlanetId = campaign?.planetId ?? null;
    useArcInboundDroneStore.getState().setSnapshot({
      drones: campaign ? campaign.drones.map((d) => ({ ...d })) : [],
      initialized: true,
    });
  }

  private publishCampaignSnapshot(campaign: PlanetInboundDroneCampaign, force: boolean): void {
    let key = `${campaign.planetId}:${campaign.drones.length}`;
    for (const d of campaign.drones) {
      if (d.phase === 'inbound') {
        key += `|${d.id}:${d.phase}:${Math.floor(d.inboundElapsedSec * 4)}:${d.hp}`;
      } else {
        key += `|${d.id}:${d.phase}:${Math.round(d.inboundElapsedSec * 10)}:${d.hp}`;
      }
    }
    if (!force && key === this.lastPublishedKey) return;
    this.lastPublishedKey = key;
    this.lastPublishedPlanetId = campaign.planetId;

    useArcInboundDroneStore.getState().setSnapshot({
      drones: campaign.drones.map((d) => ({ ...d })),
      initialized: true,
    });
  }
}
