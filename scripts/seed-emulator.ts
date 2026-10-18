// Fake users for LOCAL EMULATOR TESTING ONLY. Never run this against the real project:
// testers must only match with real people, or the study data is invalid.
//
//   npm run seed            add or reset the fake users
//   npm run seed -- --remove  delete them
//
// The emulators (with functions) must be running, so computeMatches builds the matches.
// All seed accounts use the password "seedpass1" if you want to sign in as one.

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'demo-overlap';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
if (!PROJECT_ID.startsWith('demo-')) throw new Error('Seed only runs against a demo- project.');

initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

type Seed = {
  uid: string;
  name: string;
  company: string | null; // null = not verified
  city: string;
  start: string;
  end: string;
  budget: [number, number];
  bio: string;
  checklist: Record<string, unknown> | null;
};

const C = {
  standard: {
    schedule: 'standard',
    cleanliness: 4,
    guests: 'sometimes',
    budgetFlexible: true,
    stayingFullTerm: 'yes',
  },
  early: {
    schedule: 'early',
    cleanliness: 5,
    guests: 'rarely',
    budgetFlexible: false,
    stayingFullTerm: 'yes',
  },
  late: {
    schedule: 'late',
    cleanliness: 3,
    guests: 'often',
    budgetFlexible: true,
    stayingFullTerm: 'probably',
  },
};

// Summer 2027 stays. With your stay around Jun 7 – Aug 27, you should see a mix of
// full and partial overlaps, and the "no match" people should never show up.
const SEEDS: Seed[] = [
  // Seattle, WA
  {
    uid: 'seed-sea-01',
    name: 'Jordan Lee',
    company: 'Microsoft',
    city: 'Seattle, WA',
    start: '2027-06-01',
    end: '2027-08-27',
    budget: [1100, 1300],
    bio: 'CS student moving to Seattle for the summer. Tidy and easygoing, usually in the office during the week.',
    checklist: C.standard,
  },
  {
    uid: 'seed-sea-02',
    name: 'Priya Shah',
    company: 'Amazon',
    city: 'Seattle, WA',
    start: '2027-06-14',
    end: '2027-09-03',
    budget: [1200, 1400],
    bio: 'SDE intern. Big on cooking and early runs.',
    checklist: C.early,
  },
  {
    uid: 'seed-sea-03',
    name: 'Evan Brooks',
    company: 'Google',
    city: 'Seattle, WA',
    start: '2027-05-24',
    end: '2027-07-09',
    budget: [1000, 1250],
    bio: 'Short summer internship, then back to school.',
    checklist: C.late,
  },
  {
    uid: 'seed-sea-04',
    name: 'Noah Williams',
    company: 'acme.com',
    city: 'Seattle, WA',
    start: '2027-07-12',
    end: '2027-09-10',
    budget: [900, 1150],
    bio: 'Starting mid-July. Quiet, likes board games.',
    checklist: null,
  },
  {
    uid: 'seed-sea-05',
    name: 'Liam Park',
    company: 'Meta',
    city: 'Seattle, WA',
    start: '2027-09-07',
    end: '2027-12-17',
    budget: [1300, 1600],
    bio: 'Fall co-op. (No match for summer stays.)',
    checklist: C.standard,
  },
  {
    uid: 'seed-sea-06',
    name: 'Maya Chen',
    company: null,
    city: 'Seattle, WA',
    start: '2027-06-07',
    end: '2027-08-27',
    budget: [1100, 1300],
    bio: 'Not verified, so she should never show up.',
    checklist: C.standard,
  },
  // Atlanta, GA
  {
    uid: 'seed-atl-01',
    name: 'Sofia Martinez',
    company: 'Delta',
    city: 'Atlanta, GA',
    start: '2027-06-07',
    end: '2027-08-27',
    budget: [900, 1200],
    bio: 'Data intern near Hartsfield. Looking for someone in Midtown.',
    checklist: C.standard,
  },
  {
    uid: 'seed-atl-02',
    name: 'Marcus Johnson',
    company: 'The Home Depot',
    city: 'Atlanta, GA',
    start: '2027-05-31',
    end: '2027-08-13',
    budget: [800, 1100],
    bio: 'Software intern at the Vinings office.',
    checklist: C.early,
  },
  {
    uid: 'seed-atl-03',
    name: 'Hannah Kim',
    company: 'Coca-Cola',
    city: 'Atlanta, GA',
    start: '2027-07-19',
    end: '2027-10-01',
    budget: [1000, 1300],
    bio: 'Marketing analytics intern, starting late July.',
    checklist: C.late,
  },
  {
    uid: 'seed-atl-04',
    name: 'Diego Alvarez',
    company: 'NCR',
    city: 'Atlanta, GA',
    start: '2027-06-21',
    end: '2027-08-20',
    budget: [950, 1250],
    bio: 'Midtown office, would love a short commute.',
    checklist: C.standard,
  },
  {
    uid: 'seed-atl-05',
    name: 'Ava Thompson',
    company: 'Ramp',
    city: 'Atlanta, GA',
    start: '2027-08-16',
    end: '2027-11-20',
    budget: [1100, 1400],
    bio: 'Fall internship. (13 days of overlap with Jun 7 – Aug 27, so no match.)',
    checklist: null,
  },
];

async function remove() {
  for (const s of SEEDS) {
    await db.doc(`users/${s.uid}`).delete(); // computeMatches cleans up their matches
    await db.doc(`private/${s.uid}`).delete();
    await auth.deleteUser(s.uid).catch(() => {});
  }
  console.log(`Removed ${SEEDS.length} seed users.`);
}

async function seed() {
  for (const s of SEEDS) {
    const email = `${s.uid}@example.com`;
    await auth.deleteUser(s.uid).catch(() => {});
    await auth.createUser({ uid: s.uid, email, password: 'seedpass1', displayName: s.name });
    await db.doc(`users/${s.uid}`).set({
      displayName: s.name,
      participantId: null,
      city: s.city,
      startDate: s.start,
      endDate: s.end,
      budgetMin: s.budget[0],
      budgetMax: s.budget[1],
      bio: s.bio,
      verified: s.company !== null,
      verificationMethod: s.company !== null ? 'work_email' : null,
      company: s.company,
      verifiedAt: s.company !== null ? FieldValue.serverTimestamp() : null,
      checklist: s.checklist,
      checklistCompletedAt: s.checklist ? FieldValue.serverTimestamp() : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`Seeded ${SEEDS.length} users in Seattle, WA and Atlanta, GA.`);
  console.log(
    'Matches are built by computeMatches in the functions emulator (give it a few seconds).',
  );
}

await (process.argv.includes('--remove') ? remove() : seed());
process.exit(0);
