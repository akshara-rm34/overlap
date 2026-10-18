// All tunable values live here: blocklists, the company map, admins, and thresholds.

// Sign-up emails can be personal, but these can't be used to verify.
export const PERSONAL_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
];

// A school email doesn't prove relocation. Set to false to allow .edu addresses.
export const BLOCK_EDU = true;

// Work email domain -> company name shown on profiles.
// Domains not listed here show the domain itself (e.g. "acme.com").
export const COMPANY_NAMES: Record<string, string> = {
  'amazon.com': 'Amazon',
  'apple.com': 'Apple',
  'google.com': 'Google',
  'meta.com': 'Meta',
  'microsoft.com': 'Microsoft',
  'delta.com': 'Delta',
  'homedepot.com': 'The Home Depot',
  'coca-cola.com': 'Coca-Cola',
  'ncr.com': 'NCR',
  'ramp.com': 'Ramp',
};

// uids allowed to approve offer letters.
export const ADMIN_UIDS: string[] = [];

export const VERIFICATION = {
  codeTtlMinutes: 10,
  maxAttempts: 5,
  maxSendsPerHour: 3,
};

// Used by computeMatches (step 4).
export const MATCHING = {
  fullOverlapShare: 0.8, // full = overlap is at least 80% of the shorter stay
  minPartialDays: 14,
};
