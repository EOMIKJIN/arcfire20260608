import firestore, {
  addDoc,
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
export const BATTLES_COLLECTION = 'battles';

const db = () => getFirestore();

export function usersCollectionRef() {
  return collection(db(), USERS_COLLECTION);
}

export function userDocRef(uid: string) {
  return doc(db(), USERS_COLLECTION, uid);
}

export function arccoreDocRef(docId: string) {
  return doc(db(), ARCCORE_COLLECTION, docId);
}

export function battlesCollectionRef() {
  return collection(db(), BATTLES_COLLECTION);
}

export {
  addDoc,
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
