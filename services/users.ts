import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { User } from '../types';

export const getAllUsers = async (): Promise<User[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
};

export const updateUserProfile = async (userId: string, data: Partial<User>) => {
  await updateDoc(doc(db, 'users', userId), { ...data });
};