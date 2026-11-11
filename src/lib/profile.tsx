import { doc, onSnapshot, serverTimestamp, updateDoc, type Timestamp } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from './auth';
import type { Checklist } from './checklist';
import { auth, db } from './firebase';

export type OfferLetterStatus = 'none' | 'pending' | 'approved' | 'rejected';

// Sprint 4 A/B test, assigned by the server right after sign-up.
//   required: verify before opening full profiles or messaging (can browse limited match cards)
//   optional: full access right away; verifying adds a badge
export type Variant = 'required' | 'optional';

// full = open profiles and message. limited = browse match cards only.
export type Access = 'full' | 'limited';

export type HousingStatus = 'search_together' | 'have_place' | 'either';

export const HOUSING_OPTIONS: { value: HousingStatus; label: string; summary: string }[] = [
  { value: 'search_together', label: 'Find a place together', summary: 'Wants to find a place together' },
  { value: 'have_place', label: 'I have a place', summary: 'Has a place, needs a roommate' },
  { value: 'either', label: 'Either works', summary: 'Open to either' },
];

export function housingSummary(s: HousingStatus | null | undefined): string | null {
  return HOUSING_OPTIONS.find((o) => o.value === s)?.summary ?? null;
}

export type VerificationMethod = 'work_email' | 'offer_letter';

export type Stay = {
  city: string; // "City, ST" from src/lib/cities.ts
  startDate: string; // YYYY-MM-DD
  endDate: string;
  budgetMin: number;
  budgetMax: number;
  housingStatus: HousingStatus;
  bio: string;
};

export const BIO_MAX = 280;

export type Profile = Partial<Stay> & {
  displayName: string;
  checklist: Checklist | null;
  checklistCompletedAt: Timestamp | null;
  verified: boolean;
  verificationMethod: VerificationMethod | null;
  company: string | null;
  verifiedAt: Timestamp | null;
  variant?: Variant;
};

export function accessFor(p: Pick<Profile, 'verified' | 'variant'> | null | undefined): Access {
  return p?.verified || p?.variant === 'optional' ? 'full' : 'limited';
}

// How long to wait for the server to assign a group before falling back to "required".
const VARIANT_WAIT_MS = 6000;

type ProfileState = {
  profile: Profile | null;
  offerLetterStatus: OfferLetterStatus;
  variant: Variant;
  access: Access;
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
  variant: 'required',
  access: 'limited',
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
  const [variantTimedOut, setVariantTimedOut] = useState(false);

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

  // New profiles get their group from a Cloud Function a moment after sign-up.
  const waitingForVariant = !!profile && !profile.variant && !variantTimedOut;
  useEffect(() => {
    if (!waitingForVariant) return;
    const t = setTimeout(() => setVariantTimedOut(true), VARIANT_WAIT_MS);
    return () => clearTimeout(t);
  }, [waitingForVariant]);

  const variant: Variant = profile?.variant ?? 'required';
  const loading = !loaded.profile || !loaded.private || waitingForVariant;
  return (
    <ProfileContext.Provider
      value={{
        profile,
        offerLetterStatus,
        variant,
        access: accessFor({ verified: profile?.verified ?? false, variant }),
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
