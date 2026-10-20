# Overlap

Sprint 3 learning prototype for CS 4261 (team Roommate Finder). React Native + Expo Router + Firebase.

## Setup

Needs Node 20+ and Java 11+ (for the Firebase emulators).

```bash
npm install
npm --prefix functions install
cp .env.example .env   # defaults point at the local emulators
cp functions/.env.example functions/.env
echo "EMAIL_SECRET=unset" > functions/.secret.local
```

## Run locally

Two terminals:

```bash
# 1. Firebase emulators (Auth, Firestore, Functions, Storage). UI at http://localhost:4000
npm run emulators

# 2. Expo dev server. Scan the QR code with Expo Go.
npx expo start
```

Your phone and laptop must be on the same Wi-Fi. The app finds the emulators using the same IP that Metro runs on.
Emulator data is saved to `emulator-data/` when you stop the emulators and loaded again next time.

`npm run emulators` builds the functions once on start. If you change code in `functions/`, run
`npm run functions:watch` in a third terminal so the emulator picks up changes.

## Test data (emulator only)

With the emulators running:

```bash
npm run seed              # adds 11 fake users in Seattle, WA and Atlanta, GA
npm run seed -- --remove  # deletes them
```

Set your stay to around Jun 7 – Aug 27, 2027 in either city to see a mix of full and partial
overlaps. To test chat from both sides, sign out and sign in as a seed user
(`seed-atl-01@example.com` etc., password in the comment at the top of `scripts/seed-emulator.ts`).
The seed script only talks to the emulators. Never put fake profiles in the real project.

## Verification emails

The functions send codes through `sendEmail()` in `functions/src/email.ts`. Pick the provider in `functions/.env` (copy it from `functions/.env.example`):

- `EMAIL_PROVIDER=console` (default): emulator only. The code is printed in the emulator logs
  (terminal 1, or the Logs tab at http://localhost:4000). No real email is sent.
- `EMAIL_PROVIDER=resend`: put the Resend API key in `functions/.secret.local` as `EMAIL_SECRET=...`.
  Without a verified domain, Resend only delivers to the email on your Resend account.
- `EMAIL_PROVIDER=gmail`: set `GMAIL_USER` and `EMAIL_FROM` to the Gmail address, and put a Gmail
  app password in `functions/.secret.local` as `EMAIL_SECRET=...`.

`functions/.secret.local` is git-ignored. For the real project the secret goes in Secret Manager
(`firebase functions:secrets:set EMAIL_SECRET`), covered in step 9.

Blocked domains, the domain to company map, admin uids, and matching thresholds are all in
`functions/src/config.ts`.

## Offer letter review

Uploaded letters wait for someone on the team to check them by hand.

1. Add your uid to `ADMIN_UIDS` in `functions/src/config.ts` (find it under Authentication in
   the Firebase console, or at http://localhost:4000/auth for the emulators).
2. In the app, go to your profile. A "Review offer letters" link shows up for admins only.
3. Open the file in the console under Storage (`offerLetters/<uid>/`), check it, then approve
   (type the company name) or reject.

Approving marks the user verified with `verificationMethod: "offer_letter"` and logs
`verify_completed`. Rejecting sends them back to the verify screens. Either way the file is deleted.
Admin accounts are also left out of the funnel numbers.

## Analysis scripts

They run against the emulators by default. Add `-- --project <id>` for the real project (run
`gcloud auth application-default login` first).

```bash
npm run funnel             # Sprint 3 metrics vs. targets
npm run export-events      # writes exports/events-<date>.csv (git-ignored)
npm run delete-test-data -- --yes   # after the sprint: deletes every account and all data
```

The export replaces uids with participant ids (P01, P02, ... in sign-up order), including the
uids inside `otherUid` and `convId`. Each user's id is saved on their profile, so it stays the
same across exports. Add `--include-team` to either script to count admin accounts.

## Checks

```bash
npm run typecheck
npx expo lint
npm run test:rules   # Firestore + Storage security rules tests (starts its own emulators)
```

`test:rules` uses `firebase.test.json`, which runs on different ports, so it works while your
dev emulators are running.

## Event logging

Every study event goes through `logEvent(name, props)` in `src/lib/events.ts` and lands in the
`events` collection as `{ uid, name, props, ts }`. `verify_completed` is written by the
server when a code is confirmed. The app can only create events (no reads, edits, or deletes).

| Event | When |
|---|---|
| `signup` | account created |
| `verify_started` | work email code requested (or resent), or offer letter uploaded |
| `verify_completed` | server confirms the code |
| `search` | matches screen opened (verified users) |
| `match_shown` | each match, the first time it shows in an app session |
| `profile_view` | a match's profile opened |
| `badge_tap` | badge explanation opened |
| `message_sent` | every message, with `isFirstInConversation` and `messageCount` |
| `checklist_started` | first checklist answer |
| `checklist_completed` | all 5 answered and saved the first time |

The app's "What we log" page (`src/app/what-we-log.tsx`, linked from the welcome screen and the
profile) explains this list in plain words. Update it if you add an event.

## Project layout

- `src/app/` routes (Expo Router). `(auth)` = welcome, sign in, sign up. `(app)` = signed-in screens:
  `verify/` (work email, code, offer letter), `stay` (city, dates, budget, bio), `checklist`, `profile`,
  and `index` (home, which sends new users through stay and checklist first).
- `src/components/` shared UI. `src/lib/theme.ts` has the colors and fonts from the Figma prototype.
- `src/lib/checklist.ts` the five checklist questions and how answers read on a profile.
- `src/lib/matches.ts` live matches for the signed-in user.
- `src/lib/chat.ts` conversations and messages. A conversation's id is the two uids sorted and
  joined with `_`. It's created with the first message, and only between matched users.
- `functions/src/matching.ts` `computeMatches`: rebuilds matches when a user's city, dates, or
  verified flag change. The overlap math is in `functions/src/overlap.ts`.
- `scripts/` seed script and analysis scripts. `scripts/lib/admin.ts` picks emulators vs. real project.
- `functions/src/offerLetters.ts` team-only offer letter review. The screen is `src/app/(app)/admin.tsx`.
- `src/lib/firebase.ts` Firebase setup and emulator connection.
- `src/lib/auth.tsx` auth state and sign up / sign in / sign out.
- `src/lib/profile.tsx` live profile + verification status for the signed-in user.
- `src/lib/verification.ts` calls the verification functions and uploads offer letters.
- `functions/` Cloud Functions (TypeScript). `config.ts` has all tunable values.
- `firestore.rules`, `storage.rules` security rules. Tests are in `tests/rules/`.

Deploy and EAS Update steps get added in build step 9.
