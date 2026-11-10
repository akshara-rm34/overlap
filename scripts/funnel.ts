// Prints the Sprint 4 metrics against their targets, from the events log, split by A/B group.
//
//   npm run funnel                         local emulators
//   npm run funnel -- --project <id>       real project
//   add --include-team to count the team's own accounts
//
// Each line says what it counts: people, pairs (two people), or events.

import { describeTarget, isTeam, loadEvents, type EventDoc } from './lib/admin.ts';

const events = (await loadEvents()).filter((e) => !isTeam(e.uid));
const byName = (name: string, list = events) => list.filter((e) => e.name === name);
const uidsOf = (name: string, list = events) => new Set(byName(name, list).map((e) => e.uid));
const prop = <T>(e: EventDoc, key: string) => e.props?.[key] as T;

// ---------- helpers ----------

function pct(n: number, d: number) {
  return d ? `${Math.round((n / d) * 100)}%` : '—';
}
function frac(n: number, d: number) {
  return `${n} of ${d}`;
}
function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}
function num(x: number | null, digits = 1) {
  return x === null ? '—' : String(Math.round(x * 10 ** digits) / 10 ** digits);
}
function tsMs(e: EventDoc) {
  return e.ts?.toMillis() ?? 0;
}
function heading(title: string) {
  console.log(`\n${title}`);
  console.log('-'.repeat(96));
}

// label | required | optional | all | target
function row(label: string, cols: string[], target = '') {
  console.log(`${label.padEnd(46)} ${cols.map((c) => c.padStart(12)).join(' ')}  ${target}`);
}

// ---------- groups ----------

const variantOf = new Map<string, string>();
for (const e of byName('variant_assigned')) variantOf.set(e.uid, prop<string>(e, 'variant'));
const GROUPS = ['required', 'optional', 'all'] as const;
const inGroup = (g: (typeof GROUPS)[number]) => (uid: string) =>
  g === 'all' || variantOf.get(uid) === g;

// For each group, one cell per metric: "n of d (p%)".
function byGroup(people: Set<string>, base: Set<string>) {
  return GROUPS.map((g) => {
    const b = [...base].filter(inGroup(g));
    const n = b.filter((u) => people.has(u)).length;
    return `${frac(n, b.length)} ${pct(n, b.length)}`;
  });
}

console.log(`Overlap Sprint 4 · ${describeTarget()} · ${events.length} events`);

// ---------- 1. Verification and the A/B test ----------

heading('1. Verification (people)                       required     optional          all');
const signedUp = uidsOf('signup');
const verified = uidsOf('verify_completed');
const started = uidsOf('verify_started');
const messaged = uidsOf('message_sent');
const firstMsgSenders = new Set(
  byName('message_sent')
    .filter((e) => prop(e, 'isFirstInConversation') === true)
    .map((e) => e.uid),
);

row('Sign-ups', GROUPS.map((g) => String([...signedUp].filter(inGroup(g)).length)));
row('Started verifying', byGroup(started, signedUp));
row('Finished verifying', byGroup(verified, signedUp), 'target ≥ 80% (S3: 75%)');
row('Sent a first message (M ÷ S)', byGroup(firstMsgSenders, signedUp), 'compare groups');
row('Sent any message', byGroup(messaged, signedUp));

const method = (m: string) =>
  new Set(
    byName('verify_completed')
      .filter((e) => prop(e, 'method') === m)
      .map((e) => e.uid),
  );
row('  verified by work email', byGroup(method('work_email'), signedUp));
row('  verified by offer letter', byGroup(method('offer_letter'), signedUp));

// Messages sent before the sender was verified (only possible in the optional group).
const verifiedAt = new Map<string, number>();
for (const e of byName('verify_completed')) verifiedAt.set(e.uid, tsMs(e));
const unverifiedSenders = new Set(
  byName('message_sent')
    .filter((e) => !verifiedAt.has(e.uid) || tsMs(e) < verifiedAt.get(e.uid)!)
    .map((e) => e.uid),
);
row('Sent a message while unverified', byGroup(unverifiedSenders, signedUp));

// ---------- 2. Browsing before verifying (required group) ----------

heading('2. Browsing before verifying (required group)');
const required = new Set([...signedUp].filter(inGroup('required')));
const skipped = new Set([...uidsOf('verify_skipped')].filter((u) => required.has(u)));
const skippedThenVerified = [...skipped].filter((u) => verified.has(u)).length;
const lockedTaps = byName('locked_message_tap');
row('Chose "Browse matches first" (people)', [frac(skipped.size, required.size)]);
row('  later finished verifying (people)', [frac(skippedThenVerified, skipped.size)]);
row('Tapped Message before verifying (people)', [String(uidsOf('locked_message_tap').size)]);
row('  taps (events)', [String(lockedTaps.length)]);

// ---------- 3. Conversations ----------

heading('3. Conversations (pairs unless noted)');
const msgs = byName('message_sent');
const convIds = [...new Set(msgs.map((e) => prop<string>(e, 'convId')))];
const verifiedMessagers = [...verified].filter((u) => messaged.has(u)).length;
row('Verified users who sent ≥ 1 message (people)', [
  `${frac(verifiedMessagers, verified.size)} ${pct(verifiedMessagers, verified.size)}`,
]);

const firsts = msgs.filter((e) => prop(e, 'isFirstInConversation') === true);
const usedSuggestion = new Set(
  firsts.filter((e) => prop(e, 'suggestion') !== 'none').map((e) => e.uid),
);
const verifiedUsedSuggestion = [...verified].filter((u) => usedSuggestion.has(u)).length;
row(
  'Verified users who used the suggestion (people)',
  [`${frac(verifiedUsedSuggestion, verified.size)} ${pct(verifiedUsedSuggestion, verified.size)}`],
  'target ≥ 65% (S3: 56% messaged)',
);
const suggestionCount = (s: string) => firsts.filter((e) => prop(e, 'suggestion') === s).length;
row('First messages: suggestion sent unedited', [frac(suggestionCount('unedited'), firsts.length)]);
row('First messages: suggestion edited', [frac(suggestionCount('edited'), firsts.length)]);
row('First messages: typed (suggestion ignored)', [frac(suggestionCount('none'), firsts.length)]);
row('Suggestions shown (events)', [String(byName('suggestion_shown').length)]);

// Reply rate and time to reply, per conversation.
const replyHours: number[] = [];
let replied = 0;
for (const convId of convIds) {
  const inConv = msgs.filter((e) => prop(e, 'convId') === convId).sort((a, b) => tsMs(a) - tsMs(b));
  const first = inConv[0];
  const reply = inConv.find((e) => e.uid !== first.uid);
  if (reply) {
    replied++;
    replyHours.push((tsMs(reply) - tsMs(first)) / 3_600_000);
  }
}
const within48 = replyHours.filter((h) => h <= 48).length;
row('Reply rate (R ÷ M)', [`${frac(replied, convIds.length)} ${pct(replied, convIds.length)}`]);
row('Median time to reply (hours)', [num(median(replyHours))]);
row('Replied within 48 hours', [frac(within48, replied)]);

// Two-way: both people sent at least 2 messages.
const twoWay = convIds.filter((c) => {
  const inConv = msgs.filter((e) => prop(e, 'convId') === c);
  return c.split('_').every((u) => inConv.filter((e) => e.uid === u).length >= 2);
}).length;
row('Two-way conversations (both sent ≥ 2)', [frac(twoWay, convIds.length)]);
console.log('  Decision to room together comes from the follow-up interviews (the app can’t see it).');

// ---------- 4. Who people message ----------

heading('4. Who people message (pairs)');
const pairKey = (a: string, b: string) => `${a}>${b}`;
const shown = new Map<string, EventDoc>();
for (const e of byName('match_shown')) shown.set(pairKey(e.uid, prop(e, 'otherUid')), e);
const viewed = new Set(byName('profile_view').map((e) => pairKey(e.uid, prop(e, 'otherUid'))));
const messagedPairs = new Set(firsts.map((e) => pairKey(e.uid, prop(e, 'otherUid'))));

row('First messages per profile viewed', [
  `${frac(messagedPairs.size, viewed.size)} ${pct(messagedPairs.size, viewed.size)}`,
], 'higher than Sprint 3');

for (const [label, key, values] of [
  ['overlap', 'overlapType', ['full', 'partial']],
  ['budget', 'budgetFit', ['fits', 'no_overlap']],
] as const) {
  for (const v of values) {
    const pairs = [...shown.entries()].filter(([, e]) => prop(e, key) === v).map(([k]) => k);
    const n = pairs.filter((k) => messagedPairs.has(k)).length;
    row(`Messaged per match shown, ${label} = ${v}`, [`${frac(n, pairs.length)} ${pct(n, pairs.length)}`]);
  }
}
const neverOpened = [...shown.keys()].filter((k) => !viewed.has(k)).length;
row('Matches shown but never opened', [frac(neverOpened, shown.size)]);

// ---------- 5. Match list ----------

heading('5. Match list');
const searches = byName('search');
const zero = searches.filter((e) => prop(e, 'matchCount') === 0);
row('Match list opens (events)', [String(searches.length)]);
row('  with zero matches (events)', [frac(zero.length, searches.length)]);
row('  people who saw zero matches', [String(new Set(zero.map((e) => e.uid)).size)]);
const feedSeconds = byName('feed_left').map((e) => prop<number>(e, 'durationMs') / 1000);
row('Median time on the list (seconds)', [num(median(feedSeconds), 0)]);

// ---------- 6. Code delivery fallback ----------

heading('6. Code delivery (people)');
row('Saw "No code yet?"', [String(uidsOf('code_fallback_shown').size)]);
row('  switched to offer letter', [String(uidsOf('code_fallback_tap').size)]);

// ---------- 7. Offer letter review ----------

heading('7. Offer letter review (letters)');
const reviews = byName('letter_reviewed');
const approved = reviews.filter((e) => prop(e, 'decision') === 'approved').length;
const turnaround = reviews.map((e) => prop<number | null>(e, 'reviewMinutes')).filter((x) => x != null) as number[];
const handsOn = reviews.map((e) => prop<number | null>(e, 'handsOnSeconds')).filter((x) => x != null) as number[];
row('Letters reviewed', [String(reviews.length)]);
row('  approved', [frac(approved, reviews.length)]);
row('Median upload-to-decision (minutes)', [num(median(turnaround))]);
row('Average hands-on review (minutes)', [num(mean(handsOn) === null ? null : mean(handsOn)! / 60)]);
const perLetterMin = mean(handsOn) === null ? null : mean(handsOn)! / 60;
row('Staffing for 1,000 users (hours)', [num(perLetterMin === null ? null : (perLetterMin * 1000) / 60)], '= avg minutes × 1000 ÷ 60');
const mismatchCounts = new Map<string, number>();
for (const e of reviews) {
  for (const m of prop<string[]>(e, 'mismatches') ?? []) {
    mismatchCounts.set(m, (mismatchCounts.get(m) ?? 0) + 1);
  }
}
for (const [m, n] of [...mismatchCounts.entries()].sort((a, b) => b[1] - a[1])) {
  row(`  mismatch: ${m}`, [String(n)]);
}

console.log('\nBadge understanding (≤ 1 of 10 unsure) comes from the exit survey.');
row('Badge taps per profile view (events)', [pct(byName('badge_tap').length, byName('profile_view').length)]);

process.exit(0);
