import { collection, doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { useAuth } from './auth';
import { db } from './firebase';
import type { Profile } from './profile';

export type OverlapType = 'full' | 'partial';

export type Match = {
  otherUid: string;
  overlapType: OverlapType;
  overlapDays: number;
  overlapStart: string;
  overlapEnd: string;
};

export type MatchWithProfile = Match & { profile: Profile | null };

// Live list of the signed-in user's matches, longest overlap first, with each person's profile.
export function useMatches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [profiles, setProfiles] = useState<Record<string, Profile | null>>({});

  useEffect(() => {
    if (!user) return;
    return onSnapshot(collection(db, 'matches', user.uid, 'items'), (snap) => {
      const list = snap.docs.map((d) => d.data() as Match);
      list.sort((a, b) => b.overlapDays - a.overlapDays);
      setMatches(list);
    });
  }, [user]);

  const ids = (matches ?? []).map((m) => m.otherUid).join(',');
  useEffect(() => {
    if (!ids) return;
    const unsubs = ids
      .split(',')
      .map((id) =>
        onSnapshot(doc(db, 'users', id), (snap) =>
          setProfiles((p) => ({ ...p, [id]: snap.exists() ? (snap.data() as Profile) : null })),
        ),
      );
    return () => unsubs.forEach((u) => u());
  }, [ids]);

  const withProfiles: MatchWithProfile[] | null = matches
    ? matches.map((m) => ({ ...m, profile: profiles[m.otherUid] ?? null }))
    : null;
  return withProfiles;
}
