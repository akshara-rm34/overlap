import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { auth, db } from './firebase';
import type { BudgetFit, OverlapType } from './matches';
import type { Access, VerificationMethod } from './profile';

// How a first message related to the suggested one (F22).
//   unedited: sent as suggested. edited: started from the suggestion, then changed. none: typed.
export type SuggestionUse = 'unedited' | 'edited' | 'none';

// Every event the app logs, with its props. verify_completed, variant_assigned, and
// letter_reviewed are logged by the server.
type EventProps = {
  signup: Record<string, never>;
  verify_started: { method: VerificationMethod };
  // Required group only: "Browse matches while you verify".
  verify_skipped: Record<string, never>;
  // Matches screen opened, once the list has loaded. matchCount 0 = a zero-match search.
  search: { city: string; matchCount: number; access: Access };
  // Matches screen closed or left. durationMs = time spent on the list.
  feed_left: { durationMs: number; access: Access };
  match_shown: {
    otherUid: string;
    overlapType: OverlapType;
    overlapDays: number;
    budgetFit: BudgetFit;
    access: Access;
  };
  profile_view: { otherUid: string; overlapType: OverlapType | null; access: Access };
  badge_tap: { otherUid: string; method: VerificationMethod | null };
  // A user with limited access tapped Message.
  locked_message_tap: { otherUid: string };
  suggestion_shown: { convId: string; otherUid: string };
  message_sent: {
    convId: string;
    otherUid: string;
    overlapType: OverlapType | null;
    isFirstInConversation: boolean;
    messageCount: number; // messages this user has sent in this conversation, including this one
    // True when the other person has already written and this is this user's first message.
    isReply: boolean;
    suggestion: SuggestionUse;
  };
  checklist_started: Record<string, never>;
  checklist_completed: Record<string, never>;
  // The "no code yet?" card on the code screen (F20).
  code_fallback_shown: { secondsWaited: number };
  code_fallback_tap: { secondsWaited: number };
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
