import { readFileSync } from 'node:fs';

import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';

export async function testEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: 'demo-overlap-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
}

// A profile as the app creates it at sign-up.
export function newProfile(name: string) {
  return {
    displayName: name,
    participantId: null,
    verified: false,
    verificationMethod: null,
    company: null,
    verifiedAt: null,
    checklist: null,
    checklistCompletedAt: null,
  };
}

export const stay = {
  city: 'Atlanta, GA',
  startDate: '2027-06-07',
  endDate: '2027-08-27',
  budgetMin: 900,
  budgetMax: 1200,
  bio: 'hi',
};

export const checklist = {
  schedule: 'standard',
  cleanliness: 4,
  guests: 'sometimes',
  budgetFlexible: true,
  stayingFullTerm: 'yes',
};
