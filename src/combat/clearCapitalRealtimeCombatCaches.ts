/**
 * 전투·행성 이탈 시 네이티브 비트맵을 한 번에 비우려던 진입점.
 *
 * **주의:** RN Android의 `Image.clearMemoryCache()`는 라우트 전환 직후·저메모리 상태에서
 * 메인 스레드 장시간 점유 → ANR 또는 프로세스 종료(사용자에게는 ‘버그로 실행 중단’)로 이어질 수 있다.
 * 장시간 채굴 후 은하맵 이동 시 크래시 재현과도 부합하므로 **여기서는 호출하지 않는다.**
 * Skia/화면 언마운트·포커스 해제로 대부분 해제되며, 필요하면 네이티브에서 백그라운드 큐로 별도 설계한다.
 */
export function clearCapitalRealtimeCombatPresentationCaches(): void {
  /* intentionally empty — avoid global Image.clearMemoryCache on route blur */
}
