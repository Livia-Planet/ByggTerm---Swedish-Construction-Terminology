export type CategoryId = 'tools' | 'materials' | 'safety' | 'rules' | 'methods';
export type TermCategory = CategoryId;

export type Language = 'zh' | 'sv' | 'en';
export type UILanguage = Language;

export type ActiveTab = 'dictionary' | 'flashcards' | 'quiz' | 'favorites';

export type MasteryStatus = 'unmarked' | 'mastered' | 'review';

export interface ConstructionTerm {
  id: string;
  term: string;
  letter: string;
  category: CategoryId;
  explanationSv: string;
  translationZh: string;
  translationEn: string;
  exampleSv?: string;
  exampleZh?: string;
}

export type SrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface SrsRecord {
  reps: number;
  intervalDays: number;
  easeFactor: number;
  lastReviewedAt: number; // timestamp in ms
  nextReviewAt: number;   // timestamp in ms
  familiarity: number;    // 0: forgot/again, 1: hard, 2: good, 3: easy/mastered
}

export type QuizScope = 'all' | 'favorites' | 'needsReview';

export interface UserProgress {
  version: number;
  favorites: string[];
  mastered: string[];
  needsReview: string[];
  srsRecords: Record<string, SrsRecord>;
  quizHistory: {
    score: number;
    total: number;
    date: string;
    scope?: QuizScope;
  }[];
}

export interface QuizQuestion {
  id: string;
  term: ConstructionTerm;
  prompt: string;
  promptType: 'term_to_meaning' | 'definition_to_term';
  options: {
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }[];
}
