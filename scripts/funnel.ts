// Prints the Sprint 3 metrics (BUILD_SPEC section 1) against their targets, from the events log.
//
//   npm run funnel                         local emulators
//   npm run funnel -- --project <id>       real project
//   add --include-team to count the team's own accounts

import { describeTarget, isTeam, loadEvents } from './lib/admin.ts';

const events = (await loadEvents()).filter((e) => !isTeam(e.uid));
const byName = (name: string) => events.filter((e) => e.name === name);
const uidsOf = (name: string) => new Set(byName(name).map((e) => e.uid));

function pct(n: number, d: number) {
  return d ? `${Math.round((n / d) * 100)}%` : '—';
}

function line(label: string, value: string, detail: string, target?: string, met?: boolean) {
  const result = !target
    ? ''
    : met === undefined
      ? target
      : `${target.padEnd(6)} ${met ? 'met' : 'not met'}`;
  console.log(`${label.padEnd(44)} ${value.padStart(5)}  ${detail.padEnd(18)} ${result}`);
}

const signedUp = uidsOf('signup');
const started = uidsOf('verify_started');
const verified = uidsOf('verify_completed');
const messaged = uidsOf('message_sent');
const checklistDone = uidsOf('checklist_completed');

console.log(`Overlap funnel · ${describeTarget()} · ${events.length} events\n`);
console.log(`${'Metric'.padEnd(44)} ${'Value'.padStart(5)}  ${'Count'.padEnd(18)} Target`);
console.log('-'.repeat(84));

// 1. Verification rate: sign-ups who finished verifying.
const verifiedOfSignups = [...signedUp].filter((u) => verified.has(u)).length;
const verifyRate = signedUp.size ? verifiedOfSignups / signedUp.size : 0;
line(
  'Sign-ups who finished verification',
  pct(verifiedOfSignups, signedUp.size),
  `${verifiedOfSignups} of ${signedUp.size}`,
  '≥ 70%',
  verifyRate >= 0.7,
);
const method = (m: string) =>
  new Set(
    byName('verify_completed')
      .filter((e) => e.props?.method === m)
      .map((e) => e.uid),
  ).size;
line('  started verifying', pct(started.size, signedUp.size), `${started.size} users`);
line('  verified by work email', String(method('work_email')), 'users');
line('  verified by offer letter', String(method('offer_letter')), 'users');

// 2. Verified users who messaged at least one match.
const verifiedWhoMessaged = [...verified].filter((u) => messaged.has(u)).length;
line(
  'Verified users who sent ≥ 1 message',
  pct(verifiedWhoMessaged, verified.size),
  `${verifiedWhoMessaged} of ${verified.size}`,
  '≥ 50%',
  verified.size > 0 && verifiedWhoMessaged / verified.size >= 0.5,
);

// 3. First message in each conversation: partial vs. full overlap.
const firsts = byName('message_sent').filter((e) => e.props?.isFirstInConversation === true);
const full = firsts.filter((e) => e.props?.overlapType === 'full').length;
const partial = firsts.filter((e) => e.props?.overlapType === 'partial').length;
line('First messages to full overlaps', pct(full, firsts.length), `${full} of ${firsts.length}`);
line(
  'First messages to partial overlaps',
  pct(partial, firsts.length),
  `${partial} of ${firsts.length}`,
  'report the split',
);

// 4. Conversations where both people completed the checklist.
// A conversation's id is the two uids joined with "_".
const convs = new Set(byName('message_sent').map((e) => e.props?.convId as string));
const bothDone = [...convs].filter((c) => c.split('_').every((u) => checklistDone.has(u))).length;
line(
  'Conversations where both did the checklist',
  pct(bothDone, convs.size),
  `${bothDone} of ${convs.size}`,
  '≥ 40%',
  convs.size > 0 && bothDone / convs.size >= 0.4,
);

// Extra context for the badge question (the main answer comes from the exit survey).
const views = byName('profile_view').length;
const taps = byName('badge_tap').length;
console.log('');
line('Profile views', String(views), '');
line('Badge taps per profile view', pct(taps, views), `${taps} taps`);
line('Matches shown', String(byName('match_shown').length), '');
line('Messages sent', String(byName('message_sent').length), '');

process.exit(0);
