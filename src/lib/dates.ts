// Dates are stored as local "YYYY-MM-DD" strings.

export function toYmd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const short = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const withYear = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDate(s: string, year = false): string {
  return (year ? withYear : short).format(fromYmd(s));
}

// "Jun 8 – Aug 28"
export function formatRange(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}
