// ============================================================
// 심리스 PVP Mock 유저 팩토리
// - 기본 20명(10:10 상한 테스트) 생성
// ============================================================

import type { FirestoreUserDocMock } from './seamlessPvpTypes';

export function createMockSeamlessUsers(count: number = 20): FirestoreUserDocMock[] {
  const n = Math.max(1, Math.min(20, Math.floor(count)));
  const out: FirestoreUserDocMock[] = [];
  for (let i = 0; i < n; i++) {
    const idx = i + 1;
    out.push({
      uid: `mock_user_${String(idx).padStart(2, '0')}`,
      nickname: `Pilot-${String(idx).padStart(2, '0')}`,
      status: idx % 4 === 0 ? 'combat_ready' : idx % 3 === 0 ? 'planet_landed' : 'moving',
      team: 'none',
      systemId: 'arcadia',
      planetId: 'arcadia_prime',
      position: {
        x: 220 + (i % 5) * 42,
        y: 170 + Math.floor(i / 5) * 36,
      },
      shipStats: {
        hull: 520 + (i % 7) * 14,
        shield: 260 + (i % 6) * 18,
        attack: 54 + (i % 8) * 2,
        defense: 34 + (i % 7) * 2,
        speed: 22 + (i % 5),
        critRate: 0.05 + (i % 6) * 0.01,
      },
      updatedAt: 0,
    });
  }
  return out;
}
