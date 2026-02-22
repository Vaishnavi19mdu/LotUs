import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
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
  // 1. Get event data to find creator and name
  const eventRef = doc(db, 'events', eventId);
  const eventSnap = await getDoc(eventRef);
  const eventData = eventSnap.data();

  if (!eventData) throw new Error('Event not found');

  // 2. Update the event registration count and list
  await updateDoc(eventRef, {
    registeredUserIds: arrayUnion(userId),
    participantsCount: (eventData.participantsCount || 0) + 1
  });

  // 3. Notify the event creator (skip if they're registering their own event)
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

  // 4. Always notify superadmin (uses special 'superadmin' recipientId)
  await createRegistrationNotification({
    recipientId: 'superadmin',
    eventId,
    eventName: eventData.name,
    registeredUserId: userId,
    registeredUserName: userName,
    registeredUserAvatar: userAvatar,
  });
};