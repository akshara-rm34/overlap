// Dumps the events collection to CSV, with uids replaced by participant ids.
//
//   npm run export-events                         local emulators
//   npm run export-events -- --project <id>       real project
//   add --include-team to keep the team's own accounts
//
// Writes exports/events-<date>.csv (git-ignored).

import { mkdirSync, writeFileSync } from 'node:fs';

import { describeTarget, isTeam, loadEvents, participantIds, pidOf, db } from './lib/admin.ts';

const ids = await participantIds(db);
const events = (await loadEvents()).filter((e) => !isTeam(e.uid));

// uids inside props become participant ids too.
function anonymize(key: string, value: unknown): unknown {
  if (key === 'otherUid' && typeof value === 'string') return pidOf(ids, value);
  if (key === 'convId' && typeof value === 'string') {
    return value
      .split('_')
      .map((uid) => pidOf(ids, uid))
      .join('_');
  }
  return value;
}

const propKeys = [...new Set(events.flatMap((e) => Object.keys(e.props ?? {})))].sort();
const header = ['participantId', 'name', ...propKeys, 'ts'];

function cell(v: unknown): string {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const rows = events.map((e) => [
  pidOf(ids, e.uid),
  e.name,
  ...propKeys.map((k) => anonymize(k, e.props?.[k])),
  e.ts?.toDate().toISOString() ?? '',
]);

const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\n') + '\n';
mkdirSync('exports', { recursive: true });
const file = `exports/events-${new Date().toISOString().slice(0, 10)}.csv`;
writeFileSync(file, csv);

console.log(`Exported ${events.length} events from ${describeTarget()} to ${file}`);
process.exit(0);
