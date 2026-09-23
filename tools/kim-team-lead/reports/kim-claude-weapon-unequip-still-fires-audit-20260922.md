# 무기 전량 해제했는데도 전투에서 발사됨 — 원인 조사 + 수정안 (2026-09-22)

```text
status=REVIEWED APPLY
task_id=weapon-unequip-still-fires-audit-20260922
kind=BUG_FIX (김팀장 2026-09-23 적용)
대표님 보고=전함 무기 전부 장착해제해도 전투 돌입 시 무기가 발사됨
대표님 요구=무기 없이 전투 나가면 발사 없음 · 인벤 비우면 그 채널은 정확히 NULL(해제) 상태
```

## 0. 결론

**재현 원인 확정.** `equipSlots`가 무장의 정본이라는 설계 의도(주석까지 있음)는 지켜지고 있지만, **슬롯이 비어 있을 때 "무기 없음"이 아니라 "그 함선 기종의 기본(스톡) 무장으로 대체"하는 폴백이 4개 무기 채널 전부에 걸려 있다.** 플레이어가 4개 슬롯을 전부 해제해도, 전투 스폰 시점에 이 폴백이 다시 채워 넣는다. 특히 근접(로켓) 채널은 **최후 수단으로 하드코딩된 무기 id까지 보장**돼 있어, 이론상 절대 완전 비무장이 될 수 없다.

## 1. 원인 — `resolvePlayerFlagshipCombatBinding` 의 슬롯-폴백 로직

파일: `src/components/planet/PlanetEdenRaidTestLayer.tsx:1971-2056`

```ts
// 1981행 주석: "플레이어 전투 무장은 equipSlots가 정본이다. ship.weapons 잔존값은 발사 판정에 쓰지 않는다."
const slotLaserRaw = String(player.ship.equipSlots?.WEAPON_1?.itemDefId ?? '').trim();
...
let laserWeaponId = slotLaserId && isKnownCapitalWeaponId(slotLaserId) ? slotLaserId : '';
...
if (!laserWeaponId && runtimeBase?.laserWeaponId?.trim()) {
  const fallback = runtimeBase.laserWeaponId.trim();
  if (isKnownCapitalWeaponId(fallback)) laserWeaponId = fallback;   // ← 슬롯 비었는데 기종 기본무장으로 채움
}
if (!missileWeaponId && runtimeBase?.missileWeaponId?.trim()) { ... }        // 동일
if (!closeRangeWeaponId && runtimeBase?.closeRangeWeaponId?.trim()) { ... }  // 동일
if (!closeRangeWeaponId && isKnownCapitalWeaponId(DEFAULT_CLOSE_RANGE_WEAPON_ID)) {
  closeRangeWeaponId = DEFAULT_CLOSE_RANGE_WEAPON_ID;   // ← 기종 기본값도 없으면 전역 상수(w_missile_arc_005)로 강제 채움
}
if (!auxWeaponId && runtimeBase?.auxWeaponId?.trim()) { ... }               // 동일
```

`runtimeBase`는 `NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[npcShipId]` — 플레이어 함선이 매핑되는 **NPC 함선 CSV 행의 "그 기종이 보통 들고 있는 무기" 기본값**이다. NPC 스폰 시 "장비 데이터가 없어도 최소한의 무장은 갖게" 하려고 만든 안전망으로 보이는데, **같은 함수가 플레이어에도 그대로 쓰이면서 "슬롯을 비웠다"와 "장비 데이터가 원래 없다"를 구분하지 못한다.** 결과적으로 의도된 계약(주석 1981행)과 실제 동작이 어긋난다 — `ship.weapons`(구 방식)는 확실히 안 쓰지만, **`runtimeBase` 폴백이 사실상 같은 역할(항상 뭔가는 쏜다)을 대신 하고 있다.**

`DEFAULT_CLOSE_RANGE_WEAPON_ID`(`src/game/combatWeaponSlots.ts:18`, `'w_missile_arc_005'`)까지 가면 **CSV 기본값조차 없어도 근접(WEAPON_3) 채널은 무조건 채워진다** — 레이저·미사일·보조는 CSV 기본값이 없으면 실제로 빈 채 남을 수 있지만, 근접 슬롯은 구조적으로 항상 뭔가 발사되게 되어 있다.

## 2. 영향 범위

`resolvePlayerFlagshipCombatBinding()`은 `initAgents()`(`:2561`) 한 곳에서만 호출되고, 이 함수는 **플레이어 진영 전함 스폰의 공용 진입점**이다. 이 파일(`PlanetEdenRaidTestLayer.tsx`) 자체가 `capitalRealtimeBridge.ts`를 통해 **이동중 전투(STAGE 3, `app/(game)/combat.tsx`)와 허브 궤도 레이드 양쪽에 재노출**돼 같이 쓰인다(재노출 주석: "구현체를 스테이지 중립 이름으로 재노출"). 즉 **플레이어가 참여하는 실시간 함대 전투 전반에 영향**이 있다 — 특정 화면 하나의 문제가 아니다.

## 3. 재현 조건 확인

- 슬롯 해제는 `src/game/durability/durabilityModel.ts:118-128` `clearEquipSlot()`에서 무기 슬롯을 `{ itemDefId: UNEQUIPPED_WEAPON_ITEM_ID('0'), name: '' }`으로 채운다(내구도 파괴 자동해제 경로). 수동 장착해제 UI도 같은 `'0'` 관례를 따른다고 보는 게 합리적이다(`combatWeaponSlots.ts`의 `isEquipSlotFilled`가 이 값을 "비어있음"으로 판정하는 공용 헬퍼).
- `resolvePlayerFlagshipCombatBinding`의 체크(`slotLaserRaw !== '0'`)는 이 값을 올바르게 "비어있음"으로 인식한다 — **슬롯 판정 자체는 맞다.** 문제는 그 다음 폴백 단계.
- 따라서: 4슬롯 전부 `'0'`이어도 → `laserWeaponId`/`missileWeaponId`/`auxWeaponId`는 CSV `runtimeBase`에 값이 있으면 채워지고, `closeRangeWeaponId`는 CSV에도 없으면 전역 기본값으로 **항상** 채워진다. **대표님이 보신 "전부 해제해도 쏜다"와 정확히 일치.**

## 4. 폴백 경로 2곳 — 하나만 고치면 안 됨

다운스트림 발사 판정(`:3420-3423`, `:3652`, `:3709` 등 — `ag.laserWeaponId.trim().length > 0` 류)은 **이미 빈 문자열을 정확히 "그 채널 비활성"으로 처리한다.** 즉 `weaponId`를 진짜 빈 값(`''`)으로만 채우면 발사 엔진 쪽은 손댈 필요가 없다. 문제는 그 빈 값이 채워지기 **전에** 두 군데서 대체값이 끼어든다는 것.

### 경로 A — `resolvePlayerFlagshipCombatBinding` (1차, 근본 원인)

`:1990-2012`. 슬롯이 비었을 때(`slotXxxId === ''`) 곧바로 `runtimeBase`(그 함선 기종의 CSV 기본무장) → (근접만) 전역 상수 `DEFAULT_CLOSE_RANGE_WEAPON_ID`로 채운다. "슬롯이 의도적으로 비었다"와 "슬롯 값이 손상돼 알아볼 수 없다"를 구분하지 않는다.

### 경로 B — `createCapitalAgentBase` (2차, 잔여 위험)

`:2273-2275`:
```ts
const specifiedClose = runtimeConfig?.closeRangeWeaponId;
const closeRangeWeaponId =
  specifiedClose === undefined ? DEFAULT_CLOSE_RANGE_WEAPON_ID : specifiedClose.trim();
```
경로 A를 고쳐서 `mergedRuntime.closeRangeWeaponId`가 `''`(빈 문자열)로 명시적으로 채워지면 `specifiedClose === undefined`가 거짓이 되어 이 폴백은 정상적으로 건너뛴다 — **단, 그 대전제는 `mergedRuntime` 객체 자체가 `undefined`가 아니어야 한다.** `resolvePlayerFlagshipCombatBinding`(`:2031-2048`)은 `runtimeBase`와 `perf.runtimeConfig`가 둘 다 없으면 `mergedRuntime` 전체를 `undefined`로 반환하는 분기가 있다 — 이 경우 `runtimeConfig?.closeRangeWeaponId`가 옵셔널 체이닝으로 `undefined`가 되어 경로 B가 다시 발동한다. 플레이어 함선이 매핑되는 NPC 함선 id에 CSV 런타임 행이 없는 드문 경우에 해당하는 잔여 위험이다.

## 5. 제안 수정안 (대표님 요구 반영 — 제안만, 미적용)

목표: **슬롯 미장착 = 그 채널 weaponId가 명시적으로 빈 값(`''`)** — "해제된 NULL 상태"를 어느 경로를 타든 보장.

### 5-1. 경로 A — `resolvePlayerFlagshipCombatBinding` (`:1990-2012`)

폴백을 "슬롯 값이 있는데 알 수 없는 id"인 경우로만 좁힌다. 슬롯이 애초에 비어있으면(`slotXxxRaw === '' || slotXxxRaw === '0'`) 그 즉시 확정 `''`로 두고 `runtimeBase`를 보지 않는다.

```ts
// before (슬롯이 비었으면 항상 기종 기본무장으로 대체)
let laserWeaponId = slotLaserId && isKnownCapitalWeaponId(slotLaserId) ? slotLaserId : '';
if (!laserWeaponId && runtimeBase?.laserWeaponId?.trim()) {
  const fallback = runtimeBase.laserWeaponId.trim();
  if (isKnownCapitalWeaponId(fallback)) laserWeaponId = fallback;
}
// (missile · closeRange · aux 동일 패턴 + closeRange는 DEFAULT_CLOSE_RANGE_WEAPON_ID 추가 폴백)

// after (슬롯이 "명시적으로 비었음"과 "값이 있는데 손상됨"을 구분)
const laserSlotEmpty = !slotLaserRaw || slotLaserRaw === UNEQUIPPED_WEAPON_ITEM_ID;
let laserWeaponId = '';
if (!laserSlotEmpty) {
  laserWeaponId = isKnownCapitalWeaponId(slotLaserId)
    ? slotLaserId
    // 슬롯엔 뭔가 있는데 카탈로그에 없는 손상 데이터 — 방어적 복구만 CSV 기본값 참조
    : (runtimeBase?.laserWeaponId?.trim() ?? '');
}
// missile · aux 동일 패턴.
// closeRange는 DEFAULT_CLOSE_RANGE_WEAPON_ID 전역 폴백 자체를 플레이어 바인딩에서 제거(§5-3).
```

`isEquipSlotFilled`(이미 `combatWeaponSlots.ts`에 있음 — `id && id !== UNEQUIPPED_WEAPON_ITEM_ID`)를 그대로 재사용해 "비었음" 판정을 한 곳에서만 하도록 통일하는 편이 안전하다(직접 `=== '0'` 비교를 새로 만들지 않음).

### 5-2. 경로 B — `createCapitalAgentBase` (`:2273-2275`)

`undefined`(진짜 데이터 없음)와 `''`(명시적으로 비었음)을 구분하는 지금 방식은 유지하되, **경로 A가 절대 `undefined` runtimeConfig를 플레이어에게 넘기지 않도록** 5-3에서 보강한다. 이 함수 자체(NPC 스폰에도 쓰임)는 건드리지 않는 편이 안전 — NPC는 CSV 데이터가 원래 없을 수 있고, 그 경우 기본 근접무기를 갖는 게 의도된 동작이다.

### 5-3. 안전망 — `resolvePlayerFlagshipCombatBinding`의 `mergedRuntime`이 `undefined`가 되지 않게

`:2031-2048`. `runtimeBase`도 없고 `perf.runtimeConfig`도 없으면 지금은 `mergedRuntime = undefined`를 반환해 경로 B가 다시 기본값을 채운다. 플레이어 한정으로 최소 `{}` 베이스는 보장해 4개 weaponId 필드가 항상 명시적 문자열(빈 값 포함)로 내려가게 한다.

```ts
const mergedRuntime = {
  ...(runtimeBase ?? {}),
  ...(perf.runtimeConfig ?? {}),
  laserWeaponId: laserWeaponId || '',
  missileWeaponId: missileWeaponId || '',
  closeRangeWeaponId: closeRangeWeaponId || '',
  auxWeaponId: auxWeaponId || '',
};
```
(런타임 튜닝값 — 쿨다운/기동 등 — 은 `runtimeBase`/`perf.runtimeConfig`가 아예 없을 때 기존에도 `undefined`로 넘어가 하위에서 각자 기본값을 썼으므로, 이 병합으로 그 동작이 깨지진 않는다. `Boolean(runtimeBase)` 분기 제거가 다른 필드에 영향 없는지는 구현 시 diff로 재확인.)

### 5-4. `DEFAULT_CLOSE_RANGE_WEAPON_ID` — 플레이어 경로에서 제거

경로 A의 근접(WEAPON_3) 최종 폴백(`if (!closeRangeWeaponId && isKnownCapitalWeaponId(DEFAULT_CLOSE_RANGE_WEAPON_ID))`)을 **플레이어 바인딩에서는 삭제**한다. 이 상수는 NPC가 장비 데이터 없이 스폰될 때만 의미가 있다 — `createCapitalAgentBase`(경로 B) 쪽 NPC 스폰 경로에는 그대로 둔다.

## 6. 게이트 (구현 시)

- `npx tsc --noEmit -p tsconfig.client.json`
- 신규 단위 테스트: 4슬롯 전부 해제 → `resolvePlayerFlagshipCombatBinding().runtimeConfig`의 laser/missile/closeRange/aux 4개 전부 `''`
- 1개만 장착 → 그 채널만 값, 나머지 3개 `''`
- 손상 데이터(슬롯에 알 수 없는 id) → 기존처럼 CSV 기본값으로 방어적 복구(회귀 없음 확인)
- 실기: 전투 진입해 실제로 발사 이펙트/피해가 0인지 확인(코드 레벨 assert로는 못 잡는 시각적 확인)

## 7. 정책 질문 — 구현 전 결정 필요

무기 전량 해제 상태로 전투에 진입하는 걸 **그대로 허용**할지(아무것도 못 쏘고 버티기만 함), 아니면 **진입 자체를 막고 안내**할지는 밸런스/UX 결정이다. 지금 코드엔 그런 게이트가 없다(무장 여부와 무관하게 전투 진입 가능) — 위 수정만 넣으면 "허용" 쪽으로 확정되는 셈이라, 명시적으로 정해두길 권한다.

## 8. 미확인

- 수동 장착해제 UI(조선소 화면)가 durability 자동해제와 동일하게 `UNEQUIPPED_WEAPON_ITEM_ID('0')`을 쓰는지 실물 코드로 재확인은 못 함(간접 근거로만 확인) — 구현 착수 시 같이 확인 권장.
- 근접 외 3채널이 CSV `runtimeBase`에 실제로 값이 채워진 함선이 몇 종인지 CSV 데이터 전수 확인 안 함.
- §5-3 병합 방식이 기존에 `runtimeBase` 부재 시 하위 소비 지점들이 기대하던 `undefined` 동작(쿨다운 등 필드별 기본값 폴백)과 완전히 동치인지, 구현 시 필드 단위로 diff 대조 필요.

**김팀장(Cursor 본창) 확인 요청** — §5 수정안 채택 여부·§7 정책 질문 판단 후 착수 지시 바랍니다. 코드는 미적용.
