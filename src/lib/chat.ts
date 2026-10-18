import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from './auth';
import { db } from './firebase';
import type { OverlapType } from './matches';

export const MESSAGE_MAX = 2000;

export type Conversation = {
  id: string;
  participants: [string, string];
  overlapType: OverlapType;
  createdBy: string;
  lastMessageAt: Timestamp | null;
  lastMessageText: string;
  lastSenderId: string;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  sentAt: Timestamp | null;
};

export function convIdFor(a: string, b: string): string {
  return [a, b].sort().join('_');
}

export function otherUidIn(convId: string, me: string): string {
  const [a, b] = convId.split('_');
  return a === me ? b : a;
}

// Conversations the signed-in user is in, most recent first.
export function useConversations() {
  const { user } = useAuth();
  const [list, setList] = useState<Conversation[] | null>(null);
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc'),
    );
    return onSnapshot(q, (snap) =>
      setList(
        snap.docs.map(
          (d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as Conversation,
        ),
      ),
    );
  }, [user]);
  return list;
}

// One conversation (null if it hasn't been started yet) and its messages, oldest first.
export function useConversation(convId: string) {
  const [conv, setConv] = useState<Conversation | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(
    () =>
      onSnapshot(doc(db, 'conversations', convId), (snap) =>
        setConv(snap.exists() ? ({ id: snap.id, ...snap.data() } as Conversation) : null),
      ),
    [convId],
  );

  useEffect(() => {
    const q = query(collection(db, 'conversations', convId, 'messages'), orderBy('sentAt', 'asc'));
    return onSnapshot(q, (snap) =>
      setMessages(
        snap.docs.map(
          (d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as Message,
        ),
      ),
    );
  }, [convId]);

  return { conv, messages };
}

type SendArgs = {
  convId: string;
  me: string;
  text: string;
  // Needed only for the first message, which creates the conversation.
  newConversation?: { overlapType: OverlapType };
};

export async function sendMessage({ convId, me, text, newConversation }: SendArgs) {
  const body = text.trim().slice(0, MESSAGE_MAX);
  if (!body) return;
  const convRef = doc(db, 'conversations', convId);
  const msgRef = doc(collection(convRef, 'messages'));
  const last = {
    lastMessageAt: serverTimestamp(),
    lastMessageText: body.slice(0, 140),
    lastSenderId: me,
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  if (newConversation) {
    batch.set(convRef, {
      participants: convId.split('_'),
      overlapType: newConversation.overlapType,
      createdBy: me,
      createdAt: serverTimestamp(),
      ...last,
    });
  } else {
    batch.update(convRef, last);
  }
  batch.set(msgRef, { senderId: me, text: body, sentAt: serverTimestamp() });
  await batch.commit();
}
