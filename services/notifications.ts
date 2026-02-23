import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';

export interface Notification {
  id: string;
  recipientId: string;
  type: 'registration';
  eventId: string;
  eventName: string;
  registeredUserId: string;
  registeredUserName: string;
  registeredUserAvatar?: string;
  read: boolean;
  createdAt: string;
}

export const createRegistrationNotification = async ({
  recipientId,
  eventId,
  eventName,
  registeredUserId,
  registeredUserName,
  registeredUserAvatar,
}: {
  recipientId: string;
  eventId: string;
  eventName: string;
  registeredUserId: string;
  registeredUserName: string;
  registeredUserAvatar?: string;
}) => {
  await addDoc(collection(db, 'notifications'), {
    recipientId,
    type: 'registration',
    eventId,
    eventName,
    registeredUserId,
    registeredUserName,
    registeredUserAvatar: registeredUserAvatar || '',
    read: false,
    createdAt: new Date().toISOString(),
  });
};

// ─── No composite index needed — fetch all, filter in JS ─────────────────────
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const snap = await getDocs(collection(db, 'notifications'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Notification))
    .filter(n => n.recipientId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getAllNotifications = async (): Promise<Notification[]> => {
  const snap = await getDocs(collection(db, 'notifications'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Notification))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const markAsRead = async (notificationId: string) => {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
};

export const markAllAsRead = async (notifications: Notification[]) => {
  await Promise.all(
    notifications.filter(n => !n.read).map(n => markAsRead(n.id))
  );
};

export const createTeamInviteNotification = async ({
  recipientId,
  inviterName,
  inviterId,
  inviterAvatar,
  eventId,
  eventName,
  teamName,
}: {
  recipientId: string;
  inviterName: string;
  inviterId: string;
  inviterAvatar?: string;
  eventId: string;
  eventName: string;
  teamName: string;
}) => {
  await addDoc(collection(db, 'notifications'), {
    recipientId,
    type: 'team_invite',
    inviterName,
    inviterId,
    inviterAvatar: inviterAvatar || '',
    eventId,
    eventName,
    teamName,
    read: false,
    createdAt: new Date().toISOString(),
  });
};

export const createJoinRequestNotification = async ({
  recipientId,
  requesterName,
  requesterId,
  requesterAvatar,
  teamName,
  eventName,
  teamId,
}: {
  recipientId: string;
  requesterName: string;
  requesterId: string;
  requesterAvatar?: string;
  teamName: string;
  eventName: string;
  teamId: string;
}) => {
  await addDoc(collection(db, 'notifications'), {
    recipientId,
    type: 'join_request',
    requesterName,
    requesterId,
    requesterAvatar: requesterAvatar || '',
    teamName,
    eventName,
    teamId,
    read: false,
    createdAt: new Date().toISOString(),
  });
};

export const createJoinAcceptedNotification = async ({
  recipientId,
  leaderName,
  teamName,
  eventName,
}: {
  recipientId: string;
  leaderName: string;
  teamName: string;
  eventName: string;
}) => {
  await addDoc(collection(db, 'notifications'), {
    recipientId,
    type: 'join_accepted',
    leaderName,
    teamName,
    eventName,
    read: false,
    createdAt: new Date().toISOString(),
  });
};

export const createMessageNotification = async ({
  recipientId,
  senderName,
  senderId,
  senderAvatar,
  eventName,
  messageId,
}: {
  recipientId: string;
  senderName: string;
  senderId: string;
  senderAvatar?: string;
  eventName?: string;
  messageId: string;
}) => {
  await addDoc(collection(db, 'notifications'), {
    recipientId,
    type: 'message',
    senderName,
    senderId,
    senderAvatar: senderAvatar || '',
    eventName: eventName || '',
    messageId,
    read: false,
    createdAt: new Date().toISOString(),
  });
};