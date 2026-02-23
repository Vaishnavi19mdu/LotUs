import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, getDoc, query, where } from 'firebase/firestore';
import { Event } from '../types';
import { createRegistrationNotification } from './notifications';

export const createEvent = async (
  eventData: Omit<Event, 'id' | 'participantsCount' | 'teamsCount' | 'registeredUserIds'>,
  creatorId: string
) => {
  const ref = await addDoc(collection(db, 'events'), {
    ...eventData,
    createdBy: creatorId,
    participantsCount: 0,
    teamsCount: 0,
    registeredUserIds: [],
    createdAt: new Date().toISOString()
  });
  return ref.id;
};

export const getEvents = async (creatorId?: string): Promise<Event[]> => {
  const snap = await getDocs(collection(db, 'events'));
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Event));
  if (creatorId) return all.filter((e: any) => e.createdBy === creatorId);
  return all;
};

export const registerForEvent = async (
  eventId: string,
  userId: string,
  userName: string,
  userAvatar?: string
) => {
  const eventRef = doc(db, 'events', eventId);
  const eventSnap = await getDoc(eventRef);
  const eventData = eventSnap.data();
  if (!eventData) throw new Error('Event not found');

  await updateDoc(eventRef, {
    registeredUserIds: arrayUnion(userId),
    participantsCount: (eventData.participantsCount || 0) + 1
  });

  const createdBy = eventData.createdBy;
  if (createdBy && createdBy !== userId) {
    await createRegistrationNotification({
      recipientId: createdBy,
      eventId,
      eventName: eventData.name,
      registeredUserId: userId,
      registeredUserName: userName,
      registeredUserAvatar: userAvatar,
    });
  }

  await createRegistrationNotification({
    recipientId: 'superadmin',
    eventId,
    eventName: eventData.name,
    registeredUserId: userId,
    registeredUserName: userName,
    registeredUserAvatar: userAvatar,
  });
};

export const unregisterForEvent = async (eventId: string, userId: string) => {
  // 1. Remove from event
  const eventRef = doc(db, 'events', eventId);
  const eventSnap = await getDoc(eventRef);
  const eventData = eventSnap.data();
  if (!eventData) throw new Error('Event not found');

  await updateDoc(eventRef, {
    registeredUserIds: arrayRemove(userId),
    participantsCount: Math.max(0, (eventData.participantsCount || 1) - 1)
  });

  // 2. Handle team cleanup
  const teamsSnap = await getDocs(
    query(collection(db, 'teams'), where('eventId', '==', eventId))
  );

  for (const teamDoc of teamsSnap.docs) {
    const team = teamDoc.data();

    // If user is the leader → delete the whole team
    if (team.leaderId === userId) {
      await deleteDoc(teamDoc.ref);
      continue;
    }

    // If user is a member → remove them
    if (team.members?.includes(userId)) {
      await updateDoc(teamDoc.ref, {
        members: arrayRemove(userId)
      });
    }

    // If user had a pending invite or join request → clean those up too
    if (team.invites?.includes(userId)) {
      await updateDoc(teamDoc.ref, { invites: arrayRemove(userId) });
    }
    if (team.joinRequests?.includes(userId)) {
      await updateDoc(teamDoc.ref, { joinRequests: arrayRemove(userId) });
    }
  }
};