import { doc, onSnapshot, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
import type { Checklist } from './checklist';
import { auth, db } from './firebase';

export type OfferLetterStatus = 'none' | 'pending' | 'approved' | 'rejected';

export const CITIES = ['Atlanta', 'Seattle'] as const;
export type City = (typeof CITIES)[number];

export type Stay = {
  city: City;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  budgetMin: number;
  budgetMax: number;
  bio: string;
};

export const BIO_MAX = 280;

export type Profile = Partial<Stay> & {
  displayName: string;
  checklist: Checklist | null;
  checklistCompletedAt: Timestamp | null;
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
  // Same idea for the checklist during onboarding.
  checklistSkipped: boolean;
  skipChecklist: () => void;
};

const ProfileContext = createContext<ProfileState>({
  profile: null,
  offerLetterStatus: 'none',
  loading: true,
  verifySkipped: false,
  skipVerify: () => {},
  checklistSkipped: false,
  skipChecklist: () => {},
});

// Live view of the signed-in user's public profile and private verification status.
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [offerLetterStatus, setOfferLetterStatus] = useState<OfferLetterStatus>('none');
  const [loaded, setLoaded] = useState({ profile: false, private: false });
  const [verifySkipped, setVerifySkipped] = useState(false);
  const [checklistSkipped, setChecklistSkipped] = useState(false);

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
        checklistSkipped,
        skipChecklist: () => setChecklistSkipped(true),
      }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}

function myRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  return doc(db, 'users', uid);
}

export function saveStay(stay: Stay) {
  return updateDoc(myRef(), { ...stay, updatedAt: serverTimestamp() });
}

// checklistCompletedAt is set the first time all five are answered and kept after edits.
export function saveChecklist(checklist: Checklist, alreadyCompleted: boolean) {
  return updateDoc(myRef(), {
    checklist,
    ...(alreadyCompleted ? {} : { checklistCompletedAt: serverTimestamp() }),
    updatedAt: serverTimestamp(),
  });
}
