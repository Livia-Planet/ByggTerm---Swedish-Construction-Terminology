import { ConstructionTerm } from '../types';
import { termsPart1 } from './termsPart1';
import { termsPart2 } from './termsPart2';
import { termsPart3 } from './termsPart3';
import { termsPart4 } from './termsPart4';
import { termsPart5 } from './termsPart5';
import { termsPart6 } from './termsPart6';
import { termsPart7 } from './termsPart7';

export const ALL_TERMS: ConstructionTerm[] = [
  ...termsPart1,
  ...termsPart2,
  ...termsPart3,
  ...termsPart4,
  ...termsPart5,
  ...termsPart6,
  ...termsPart7,
];

// Unique letters present in the dataset, ordered
export const AVAILABLE_LETTERS: string[] = Array.from(
  new Set(ALL_TERMS.map((t) => t.letter))
).sort((a, b) => a.localeCompare(b, 'sv'));

// Pre-indexed lookup by ID
export const TERMS_MAP: Record<string, ConstructionTerm> = ALL_TERMS.reduce(
  (acc, term) => {
    acc[term.id] = term;
    return acc;
  },
  {} as Record<string, ConstructionTerm>
);

export { speakSwedish } from '../utils/speech';
