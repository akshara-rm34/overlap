import { collection, doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from './auth';
import { db } from './firebase';
import type { HousingStatus, VerificationMethod } from './profile';

export type OverlapType = 'full' | 'partial';
export type BudgetFit = 'fits' | 'no_overlap' | 'unknown';

// The limited profile computeMatches copies into each match. It's all a user who is still
// verifying can see about someone.
export type MatchCardData = {
  firstName: string;
  company: string | null;
  verificationMethod: VerificationMethod | null; // null = not verified (optional group)
  startDate: string;
  endDate: string;
  budgetMin: number | null;
  budgetMax: number | null;
  housingStatus: HousingStatus | null;
};

export type Match = {
  otherUid: string;
  overlapType: OverlapType;
  overlapDays: number;
  overlapStart: string;
  overlapEnd: string;
  budgetFit: BudgetFit;
  card: MatchCardData;
};

// Live list of the signed-in user’s matches, longest overlap first.
export function useMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[] | null>(null);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'matches', user.uid, 'items'), (snap) => {
      const list = snap.docs.map((d) => d.data() as Match).filter((m) => m.card);
      list.sort((a, b) => b.overlapDays - a.overlapDays);
      setMatches(list);
    });
  }, [user]);

  return matches;
}

// The signed-in user's match with one person. undefined while loading, null if not matched.
export function useMatch(otherUid: string | null | undefined) {
  const { user } = useAuth();
  const [match, setMatch] = useState<Match | null | undefined>(undefined);
  useEffect(() => {
    if (!user || !otherUid) return;
    return onSnapshot(doc(db, 'matches', user.uid, 'items', otherUid), (snap) =>
      setMatch(snap.exists() ? (snap.data() as Match) : null),
    );
  }, [user, otherUid]);
  return match;
}
