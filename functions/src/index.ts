/**
 * Firebase Functions 엔트리.
 * 월드 확장 일일 개방은 앱 로컬 `WorldExpansionSubCore` + 벽시계만 사용한다(RTDB 마스터 틱 제거).
 * 그래프 스냅샷: `npm run build:world-expansion-graph`
 */
import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';

admin.initializeApp();

export const ping = onRequest((req, res) => {
  res.status(200).send('ok');
});
