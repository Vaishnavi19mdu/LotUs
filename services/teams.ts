import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Team } from '../types';

export const createTeam = async (name: string, eventId: string, leaderId: string): Promise<string> => {
  const ref = await addDoc(collection(db, 'teams'), {
    name,
    eventId,
    leaderId,
    members: [leaderId],
    invites: [],
    createdAt: new Date().toISOString()
  });
  return ref.id;
};

export const getTeams = async (): Promise<Team[]> => {
  const snap = await getDocs(collection(db, 'teams'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Team));
};

export const inviteToTeam = async (teamId: string, userId: string) => {
  await updateDoc(doc(db, 'teams', teamId), {
    invites: arrayUnion(userId)
  });
};

export const joinTeam = async (teamId: string, userId: string) => {
  await updateDoc(doc(db, 'teams', teamId), {
    members: arrayUnion(userId)
  });
};