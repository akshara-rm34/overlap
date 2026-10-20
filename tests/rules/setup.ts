import { readFileSync } from 'node:fs';

import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';

// Each test file loads only its own rules. The files run in parallel, and reloading the other
// file's rules mid-test made the first storage upload fail now and then.
export async function testEnv(service: 'firestore' | 'storage'): Promise<RulesTestEnvironment> {
  const rules = readFileSync(`${service}.rules`, 'utf8');
  return initializeTestEnvironment({ projectId: 'demo-overlap-rules', [service]: { rules } });
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
