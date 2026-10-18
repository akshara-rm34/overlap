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

## Checks

```bash
npm run typecheck
npx expo lint
```

## Project layout

- `src/app/` routes (Expo Router). `(auth)` = welcome, sign in, sign up. `(app)` = signed-in screens.
- `src/lib/firebase.ts` Firebase setup and emulator connection.
- `src/lib/auth.tsx` auth state and sign up / sign in / sign out.
- `src/lib/profile.tsx` live profile + verification status for the signed-in user.
- `src/lib/verification.ts` calls the verification functions and uploads offer letters.
- `functions/` Cloud Functions (TypeScript). `config.ts` has all tunable values.
- `firestore.rules`, `storage.rules` security rules. Full Firestore rules and tests come in build step 7.

Deploy and EAS Update steps get added in build step 9.
