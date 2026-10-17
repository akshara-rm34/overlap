# Overlap

Sprint 3 learning prototype for CS 4261 (team Roommate Finder). React Native + Expo Router + Firebase.

## Setup

Needs Node 20+ and Java 11+ (for the Firebase emulators).

```bash
npm install
cp .env.example .env   # defaults point at the local emulators
```

## Run locally

Two terminals:

```bash
# 1. Firebase emulators (Auth, Firestore). UI at http://localhost:4000
npm run emulators

# 2. Expo dev server. Scan the QR code with Expo Go.
npx expo start
```

Your phone and laptop must be on the same Wi-Fi. The app finds the emulators using the same IP that Metro runs on.
Emulator data is saved to `emulator-data/` when you stop the emulators and loaded again next time.

## Checks

```bash
npm run typecheck
npx expo lint
```

## Project layout

- `src/app/` routes (Expo Router). `(auth)` = welcome, sign in, sign up. `(app)` = signed-in screens.
- `src/lib/firebase.ts` Firebase setup and emulator connection.
- `src/lib/auth.tsx` auth state and sign up / sign in / sign out.
- `firestore.rules` temporary rules. The full rules and tests come in build step 7.

Deploy and EAS Update steps get added in build step 9.
