import { MATCHING } from './config';

export type Stay = { startDate: string; endDate: string }; // YYYY-MM-DD, inclusive

export type Overlap = {
  overlapType: 'full' | 'partial';
  overlapDays: number;
  overlapStart: string;
  overlapEnd: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

function lengthInDays(s: Stay): number {
  return dayNumber(s.endDate) - dayNumber(s.startDate) + 1;
}

// full = overlap covers at least 80% of the shorter stay; partial = at least 14 days; else no match.
export function computeOverlap(a: Stay, b: Stay): Overlap | null {
  const overlapStart = a.startDate > b.startDate ? a.startDate : b.startDate;
  const overlapEnd = a.endDate < b.endDate ? a.endDate : b.endDate;
  const overlapDays = dayNumber(overlapEnd) - dayNumber(overlapStart) + 1;
  if (overlapDays < MATCHING.minPartialDays) return null;

  const shorter = Math.min(lengthInDays(a), lengthInDays(b));
  const overlapType = overlapDays >= MATCHING.fullOverlapShare * shorter ? 'full' : 'partial';
  return { overlapType, overlapDays, overlapStart, overlapEnd };
}

export type Budget = { budgetMin?: number; budgetMax?: number };
export type BudgetFit = 'fits' | 'no_overlap' | 'unknown';

// "fits" when the two monthly budget ranges share at least one dollar amount.
export function budgetFit(a: Budget, b: Budget): BudgetFit {
  if (a.budgetMin == null || a.budgetMax == null || b.budgetMin == null || b.budgetMax == null) {
    return 'unknown';
  }
  return a.budgetMin <= b.budgetMax && b.budgetMin <= a.budgetMax ? 'fits' : 'no_overlap';
}
