import { db } from '../firebase';
import { collection, addDoc, getDocs, doc, updateDoc, setDoc, getDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  content: string;
  eventId?: string;
  eventName?: string;
  type: 'team_invite_message' | 'dm';
  status: 'pending' | 'accepted' | 'rejected';
  read: boolean;
  createdAt: string;
}

// Block doc ID: `${senderId}_${recipientId}`
export interface BlockRecord {
  senderId: string;
  recipientId: string;
  rejectionCount: number;
  blocked: boolean; // true after 6 rejections
}

const blockDocId = (senderId: string, recipientId: string) =>
  `${senderId}_${recipientId}`;

export const getBlockRecord = async (
  senderId: string,
  recipientId: string
): Promise<BlockRecord | null> => {
  const snap = await getDoc(doc(db, 'messageBlocks', blockDocId(senderId, recipientId)));
  return snap.exists() ? (snap.data() as BlockRecord) : null;
};

export const isBlocked = async (senderId: string, recipientId: string): Promise<boolean> => {
  const record = await getBlockRecord(senderId, recipientId);
  return record?.blocked ?? false;
};

export const sendMessage = async ({
  senderId,
  senderName,
  senderAvatar,
  recipientId,
  content,
  eventId,
  eventName,
  type = 'dm',
}: {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  content: string;
  eventId?: string;
  eventName?: string;
  type?: 'team_invite_message' | 'dm';
}): Promise<string> => {
  // Check if blocked
  const blocked = await isBlocked(senderId, recipientId);
  if (blocked) throw new Error('BLOCKED');

  const ref = await addDoc(collection(db, 'messages'), {
    senderId,
    senderName,
    senderAvatar: senderAvatar || '',
    recipientId,
    content,
    eventId: eventId || '',
    eventName: eventName || '',
    type,
    status: 'pending',
    read: false,
    createdAt: new Date().toISOString(),
  });

  return ref.id;
};

export const acceptMessage = async (messageId: string) => {
  await updateDoc(doc(db, 'messages', messageId), {
    status: 'accepted',
    read: true,
  });
};

export const rejectMessage = async (
  messageId: string,
  senderId: string,
  recipientId: string
) => {
  // Update message status
  await updateDoc(doc(db, 'messages', messageId), {
    status: 'rejected',
    read: true,
  });

  // Increment rejection count
  const blockId = blockDocId(senderId, recipientId);
  const blockRef = doc(db, 'messageBlocks', blockId);
  const existing = await getDoc(blockRef);

  if (existing.exists()) {
    const current = existing.data() as BlockRecord;
    const newCount = (current.rejectionCount || 0) + 1;
    await updateDoc(blockRef, {
      rejectionCount: newCount,
      blocked: newCount >= 6,
    });
  } else {
    await setDoc(blockRef, {
      senderId,
      recipientId,
      rejectionCount: 1,
      blocked: false,
    });
  }
};

export const getMessagesForUser = async (userId: string): Promise<Message[]> => {
  const snap = await getDocs(collection(db, 'messages'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Message))
    .filter(m => m.recipientId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getSentMessagesForUser = async (userId: string): Promise<Message[]> => {
  const snap = await getDocs(collection(db, 'messages'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Message))
    .filter(m => m.senderId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const markMessageRead = async (messageId: string) => {
  await updateDoc(doc(db, 'messages', messageId), { read: true });
};

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

// Thread ID is always sorted so both users get same doc: "uid1_uid2"
export const getChatThreadId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

export const sendChatMessage = async ({
  senderId,
  senderName,
  senderAvatar,
  recipientId,
  text,
}: {
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  text: string;
}) => {
  const threadId = getChatThreadId(senderId, recipientId);
  await addDoc(collection(db, 'chats', threadId, 'messages'), {
    senderId,
    senderName,
    senderAvatar: senderAvatar || '',
    recipientId,
    text,
    createdAt: new Date().toISOString(),
    read: false,
  });
};

export const subscribeToChatMessages = (
  uid1: string,
  uid2: string,
  callback: (messages: ChatMessage[]) => void
): (() => void) => {
  const threadId = getChatThreadId(uid1, uid2);
  const q = collection(db, 'chats', threadId, 'messages');
  return onSnapshot(q, snap => {
    const msgs = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as ChatMessage))
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    callback(msgs);
  });
};

export const getAcceptedContacts = async (userId: string): Promise<string[]> => {
  // Returns list of userIds who have accepted messages from/to this user
  const snap = await getDocs(collection(db, 'messages'));
  const contacts = new Set<string>();
  snap.docs.forEach(d => {
    const m = d.data();
    if (m.status === 'accepted') {
      if (m.senderId === userId) contacts.add(m.recipientId);
      if (m.recipientId === userId) contacts.add(m.senderId);
    }
  });
  return Array.from(contacts);
};