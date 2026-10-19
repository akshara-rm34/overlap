import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { auth, db } from './firebase';
import type { OverlapType } from './matches';

// Every event the app logs, with its props. verify_completed is logged by the server.
type EventProps = {
  signup: Record<string, never>;
  verify_started: { method: 'work_email' | 'offer_letter' };
  search: { city: string };
  match_shown: { otherUid: string; overlapType: OverlapType; overlapDays: number };
  profile_view: { otherUid: string; overlapType: OverlapType | null };
  badge_tap: { otherUid: string };
  message_sent: {
    convId: string;
    otherUid: string;
    overlapType: OverlapType | null;
    isFirstInConversation: boolean;
    messageCount: number; // messages this user has sent in this conversation, including this one
  };
  checklist_started: Record<string, never>;
  checklist_completed: Record<string, never>;
};

export type EventName = keyof EventProps;

// Writes a timestamped event for the study. Never throws, so logging can't break the app.
export function logEvent<N extends EventName>(name: N, props: EventProps[N]): void {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  addDoc(collection(db, 'events'), { uid, name, props, ts: serverTimestamp() }).catch((err) =>
    console.warn(`logEvent(${name}) failed`, err),
  );
}

// match_shown fires once per match per app session.
const shownThisSession = new Set<string>();

export function logMatchShown(props: EventProps['match_shown']) {
  if (shownThisSession.has(props.otherUid)) return;
  shownThisSession.add(props.otherUid);
  logEvent('match_shown', props);
}
