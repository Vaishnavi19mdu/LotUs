import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  content: string;
  eventId?: string;
  eventName?: string;
  type: 'team_invite_message' | 'general';
  read: boolean;
  createdAt: string;
}

export const sendMessage = async ({
  senderId,
  senderName,
  senderAvatar,
  recipientId,
  content,
  eventId,
  eventName,
}: {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  content: string;
  eventId?: string;
  eventName?: string;
}) => {
  await addDoc(collection(db, 'messages'), {
    senderId,
    senderName,
    senderAvatar: senderAvatar || '',
    recipientId,
    content,
    eventId: eventId || '',
    eventName: eventName || '',
    type: 'team_invite_message',
    read: false,
    createdAt: new Date().toISOString(),
  });
};

export const getMessagesForUser = async (userId: string): Promise<Message[]> => {
  const snap = await getDocs(collection(db, 'messages'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Message))
    .filter(m => m.recipientId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const markMessageRead = async (messageId: string) => {
  await updateDoc(doc(db, 'messages', messageId), { read: true });
};