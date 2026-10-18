export type Checklist = {
  schedule: 'early' | 'standard' | 'late';
  cleanliness: 1 | 2 | 3 | 4 | 5;
  guests: 'rarely' | 'sometimes' | 'often';
  budgetFlexible: boolean;
  stayingFullTerm: 'yes' | 'probably' | 'unsure';
};

export type ChecklistKey = keyof Checklist;

type Question<K extends ChecklistKey> = {
  key: K;
  title: string; // short name, used on profiles
  question: string;
  hint?: string;
  options: { value: Checklist[K]; label: string; summary: string }[];
};

// The five checklist questions, in order. `summary` is how an answer reads on a profile.
export const QUESTIONS: [
  Question<'schedule'>,
  Question<'cleanliness'>,
  Question<'guests'>,
  Question<'budgetFlexible'>,
  Question<'stayingFullTerm'>,
] = [
  {
    key: 'schedule',
    title: 'Schedule',
    question: 'What’s your daily schedule like?',
    options: [
      { value: 'early', label: 'Early riser', summary: 'Early riser' },
      { value: 'standard', label: 'Standard', summary: 'Standard office hours' },
      { value: 'late', label: 'Night owl', summary: 'Night owl' },
    ],
  },
  {
    key: 'cleanliness',
    title: 'Cleanliness',
    question: 'How tidy do you keep shared spaces?',
    hint: '1 = pretty relaxed, 5 = very tidy',
    options: [1, 2, 3, 4, 5].map((n) => ({
      value: n as Checklist['cleanliness'],
      label: String(n),
      summary: `${n} out of 5`,
    })),
  },
  {
    key: 'guests',
    title: 'Guests',
    question: 'How often do you have guests over?',
    options: [
      { value: 'rarely', label: 'Rarely', summary: 'Rarely has guests' },
      { value: 'sometimes', label: 'Sometimes', summary: 'Occasional guests' },
      { value: 'often', label: 'Often', summary: 'Often has guests' },
    ],
  },
  {
    key: 'budgetFlexible',
    title: 'Budget',
    question: 'Is your budget flexible?',
    options: [
      { value: true, label: 'A little', summary: 'Somewhat flexible' },
      { value: false, label: 'No, it’s firm', summary: 'Firm' },
    ],
  },
  {
    key: 'stayingFullTerm',
    title: 'Staying full term',
    question: 'Are you staying for your full dates?',
    options: [
      { value: 'yes', label: 'Yes', summary: 'Yes' },
      { value: 'probably', label: 'Probably', summary: 'Probably' },
      { value: 'unsure', label: 'Not sure', summary: 'Not sure yet' },
    ],
  },
];

export function answerSummary<K extends ChecklistKey>(key: K, value: Checklist[K]): string {
  const q = QUESTIONS.find((x) => x.key === key) as Question<K>;
  return q.options.find((o) => o.value === value)?.summary ?? '—';
}

export function isComplete(c: Partial<Checklist>): c is Checklist {
  return QUESTIONS.every((q) => c[q.key] !== undefined);
}
