import firestore, {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  getDocs,
  getFirestore,
  limit,
  query,
  setDoc,
  where,
} from '@react-native-firebase/firestore';

export const USERS_COLLECTION = 'users';
export const ARCCORE_COLLECTION = 'arccore';

const db = () => getFirestore();

export function userDocRef(uid: string) {
  return doc(db(), USERS_COLLECTION, uid);
}

/** 플레이어 계정 게임 저장 백업 — `users/{uid}/game_save_backups/{backupId}` */
export function gameSaveBackupDocRef(uid: string, backupId: string) {
  return doc(db(), USERS_COLLECTION, uid, 'game_save_backups', backupId);
}

export function gameSaveBackupsCollectionRef(uid: string) {
  return collection(db(), USERS_COLLECTION, uid, 'game_save_backups');
}

export function gameSaveBackupPayloadChunksCollectionRef(uid: string, backupId: string) {
  return collection(
    db(),
    USERS_COLLECTION,
    uid,
    'game_save_backups',
    backupId,
    'payload_chunks',
  );
}

export function arccoreDocRef(docId: string) {
  return doc(db(), ARCCORE_COLLECTION, docId);
}

export {
  deleteDoc,
  doc,
  firestore,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  getDocs,
  limit,
  query,
  setDoc,
  where,
};
