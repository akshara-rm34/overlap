import { doc, onSnapshot, type Timestamp } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
import { db } from './firebase';

export type OfferLetterStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type Profile = {
  displayName: string;
  verified: boolean;
  verificationMethod: 'work_email' | 'offer_letter' | null;
  company: string | null;
  verifiedAt: Timestamp | null;
};

type ProfileState = {
  profile: Profile | null;
  offerLetterStatus: OfferLetterStatus;
  loading: boolean;
  // True once the user taps "Skip for now" on the verify screen. Resets when the app restarts.
  verifySkipped: boolean;
  skipVerify: () => void;
};

const ProfileContext = createContext<ProfileState>({
  profile: null,
  offerLetterStatus: 'none',
  loading: true,
  verifySkipped: false,
  skipVerify: () => {},
});

// Live view of the signed-in user's public profile and private verification status.
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [offerLetterStatus, setOfferLetterStatus] = useState<OfferLetterStatus>('none');
  const [loaded, setLoaded] = useState({ profile: false, private: false });
  const [verifySkipped, setVerifySkipped] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfile(snap.exists() ? (snap.data() as Profile) : null);
      setLoaded((l) => ({ ...l, profile: true }));
    });
    const unsubPrivate = onSnapshot(doc(db, 'private', user.uid), (snap) => {
      setOfferLetterStatus((snap.get('offerLetterStatus') as OfferLetterStatus) ?? 'none');
      setLoaded((l) => ({ ...l, private: true }));
    });
    return () => {
      unsubProfile();
      unsubPrivate();
    };
  }, [user]);

  const loading = !loaded.profile || !loaded.private;
  return (
    <ProfileContext.Provider
      value={{
        profile,
        offerLetterStatus,
        loading,
        verifySkipped,
        skipVerify: () => setVerifySkipped(true),
      }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
