import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from './firebase';
import type { Profile } from './profile';

// Live public profile for any user. undefined while loading, null if missing.
export function useUserProfile(uid: string | null | undefined) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, 'users', uid), (snap) =>
      setProfile(snap.exists() ? (snap.data() as Profile) : null),
    );
  }, [uid]);
  return profile;
}
