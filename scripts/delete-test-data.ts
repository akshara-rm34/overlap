// Deletes ALL test data after the sprint: accounts, profiles, private docs, codes, matches,
// conversations, messages, events, and uploaded offer letters. Run export-events first.
//
//   npm run delete-test-data -- --yes                      local emulators
//   npm run delete-test-data -- --project <id> --yes       real project (can't be undone)

import { auth, bucket, db, describeTarget, flag } from './lib/admin.ts';

const COLLECTIONS = ['users', 'private', 'verificationCodes', 'matches', 'conversations', 'events'];

if (!flag('yes')) {
  console.log(`This deletes every account and all data in ${describeTarget()}.`);
  console.log('Export the events first, then run again with --yes.');
  process.exit(1);
}

for (const name of COLLECTIONS) {
  await db.recursiveDelete(db.collection(name)); // includes subcollections (items, messages)
  console.log(`Deleted ${name}`);
}

await bucket().deleteFiles({ prefix: 'offerLetters/' });
console.log('Deleted offer letters');

let deleted = 0;
let pageToken: string | undefined;
do {
  const page = await auth.listUsers(1000, pageToken);
  if (page.users.length) await auth.deleteUsers(page.users.map((u) => u.uid));
  deleted += page.users.length;
  pageToken = page.pageToken;
} while (pageToken);
console.log(`Deleted ${deleted} accounts`);

console.log(`Done. ${describeTarget()} is empty.`);
process.exit(0);
