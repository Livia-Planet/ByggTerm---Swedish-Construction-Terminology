import { UserProgress, SrsRecord, QuizScope } from '../types';

export const CURRENT_STORAGE_VERSION = 2;
export const STORAGE_KEY_V2 = 'byggterm_user_progress_v2';
export const LEGACY_STORAGE_KEY_V1 = 'byggterm_user_progress_v1';

export interface StorageWarning {
  title: string;
  message: string;
  timestamp: number;
}

export type StorageWarningListener = (warning: StorageWarning) => void;

const warningListeners: Set<StorageWarningListener> = new Set();

/**
 * Subscribe to storage capacity warnings to display friendly toasts/UI alerts.
 */
export function subscribeStorageWarning(listener: StorageWarningListener): () => void {
  warningListeners.add(listener);
  return () => {
    warningListeners.delete(listener);
  };
}

export function notifyStorageWarning(title: string, message: string): void {
  const payload: StorageWarning = {
    title,
    message,
    timestamp: Date.now(),
  };
  warningListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (err: unknown) {
      console.warn('Storage warning listener error:', err);
    }
  });
}

export const defaultProgress: UserProgress = {
  version: CURRENT_STORAGE_VERSION,
  favorites: [],
  mastered: [],
  needsReview: [],
  srsRecords: {},
  quizHistory: [],
};

// --- Strict Type Guards (No 'any' or unsafe assertions) ---

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function extractStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return [];
  const result: string[] = [];
  for (let i = 0; i < val.length; i++) {
    const item = val[i];
    if (typeof item === 'string') {
      result.push(item);
    }
  }
  return result;
}

function isQuizScope(val: unknown): val is QuizScope {
  return val === 'all' || val === 'favorites' || val === 'needsReview';
}

/**
 * Detects if a caught exception is a browser localStorage QuotaExceededError.
 */
export function isQuotaExceededError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return (
      error.code === 22 ||
      error.code === 1014 ||
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }
  return false;
}

/**
 * Migrates and validates user progress without using 'any' or loose assertions.
 */
export function migrateAndValidateProgress(raw: unknown): UserProgress {
  if (!isRecord(raw)) {
    return defaultProgress;
  }

  const favorites = extractStringArray(raw.favorites);
  const mastered = extractStringArray(raw.mastered);
  const needsReview = extractStringArray(raw.needsReview);

  // Validate quiz history array
  const rawHistory = Array.isArray(raw.quizHistory) ? raw.quizHistory : [];
  const quizHistory: UserProgress['quizHistory'] = [];

  for (let i = 0; i < rawHistory.length; i++) {
    const entry = rawHistory[i];
    if (isRecord(entry)) {
      const score = typeof entry.score === 'number' ? entry.score : 0;
      const total = typeof entry.total === 'number' ? entry.total : 0;
      const date = typeof entry.date === 'string' ? entry.date : new Date().toISOString();
      const scope = isQuizScope(entry.scope) ? entry.scope : undefined;
      quizHistory.push({ score, total, date, scope });
    }
  }

  // Validate or build SRS records
  const srsRecords: Record<string, SrsRecord> = {};
  if (isRecord(raw.srsRecords)) {
    const rawSrsMap = raw.srsRecords;
    const srsKeys = Object.keys(rawSrsMap);
    for (let i = 0; i < srsKeys.length; i++) {
      const key = srsKeys[i];
      const val = rawSrsMap[key];
      if (isRecord(val)) {
        const easeFactor =
          typeof val.easeFactor === 'number' && !isNaN(val.easeFactor) && val.easeFactor >= 1.3
            ? Number(val.easeFactor.toFixed(2))
            : 2.5;
        const reps =
          typeof val.reps === 'number' && !isNaN(val.reps) ? Math.max(0, Math.floor(val.reps)) : 0;
        const intervalDays =
          typeof val.intervalDays === 'number' && !isNaN(val.intervalDays)
            ? Math.max(0, Math.round(val.intervalDays))
            : 0;
        const familiarity =
          typeof val.familiarity === 'number' && !isNaN(val.familiarity)
            ? Math.min(3, Math.max(0, Math.round(val.familiarity)))
            : 0;
        const lastReviewedAt =
          typeof val.lastReviewedAt === 'number' && !isNaN(val.lastReviewedAt)
            ? val.lastReviewedAt
            : Date.now();
        const nextReviewAt =
          typeof val.nextReviewAt === 'number' && !isNaN(val.nextReviewAt)
            ? val.nextReviewAt
            : Date.now();

        srsRecords[key] = {
          reps,
          intervalDays,
          easeFactor,
          lastReviewedAt,
          nextReviewAt,
          familiarity,
        };
      }
    }
  }

  // Pre-seed SRS records from legacy mastered / needsReview lists if not yet populated
  const now = Date.now();
  for (let i = 0; i < mastered.length; i++) {
    const id = mastered[i];
    if (!srsRecords[id]) {
      srsRecords[id] = {
        reps: 2,
        intervalDays: 7,
        easeFactor: 2.5,
        lastReviewedAt: now - 86400000,
        nextReviewAt: now + 7 * 86400000,
        familiarity: 3,
      };
    }
  }

  for (let i = 0; i < needsReview.length; i++) {
    const id = needsReview[i];
    if (!srsRecords[id]) {
      srsRecords[id] = {
        reps: 0,
        intervalDays: 0,
        easeFactor: 2.2,
        lastReviewedAt: now,
        nextReviewAt: now,
        familiarity: 0,
      };
    }
  }

  return {
    version: CURRENT_STORAGE_VERSION,
    favorites,
    mastered,
    needsReview,
    srsRecords,
    quizHistory,
  };
}

/**
 * Prunes non-essential caches (e.g. old quiz history) to recover storage quota.
 */
function pruneUserProgress(data: UserProgress): UserProgress {
  // Keep only the most recent 10 quiz results
  const trimmedHistory = data.quizHistory.slice(-10);
  return {
    ...data,
    quizHistory: trimmedHistory,
  };
}

/**
 * Loads user progress from localStorage with automated V1 to V2 migration.
 */
export function loadUserProgress(): UserProgress {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultProgress;
  }

  try {
    // 1. Try V2 storage first
    const storedV2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (storedV2) {
      const parsed: unknown = JSON.parse(storedV2);
      return migrateAndValidateProgress(parsed);
    }

    // 2. Fallback to V1 legacy storage and auto-migrate
    const storedV1 = window.localStorage.getItem(LEGACY_STORAGE_KEY_V1);
    if (storedV1) {
      const parsedV1: unknown = JSON.parse(storedV1);
      const migrated = migrateAndValidateProgress(parsedV1);
      // Persist migrated format to V2 and clear legacy key
      saveUserProgress(migrated);
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
      } catch (cleanErr: unknown) {
        console.warn('Unable to remove legacy storage key:', cleanErr);
      }
      return migrated;
    }
  } catch (err: unknown) {
    console.error('Failed to parse user progress from storage:', err);
  }

  return defaultProgress;
}

/**
 * Saves user progress to localStorage with deep QuotaExceededError defense and auto-pruning.
 */
export function saveUserProgress(progress: UserProgress): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  const serialized = JSON.stringify(progress);

  try {
    window.localStorage.setItem(STORAGE_KEY_V2, serialized);
    return true;
  } catch (err: unknown) {
    if (isQuotaExceededError(err)) {
      console.warn('localStorage QuotaExceededError encountered. Initiating automated cache pruning...');

      // 1. Clear legacy storage key
      try {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
      } catch (cleanLegacyErr: unknown) {
        console.warn('Failed to clear legacy key during quota recovery:', cleanLegacyErr);
      }

      // 2. Prune non-essential cache (trim quiz history)
      const pruned = pruneUserProgress(progress);
      const prunedSerialized = JSON.stringify(pruned);

      try {
        window.localStorage.setItem(STORAGE_KEY_V2, prunedSerialized);
        notifyStorageWarning(
          'Lagringsutrymme optimerat',
          'Webbläsarens lagringsutrymme var fullt. Äldre testhistorik har rensats automatiskt för att skydda dina termframsteg.'
        );
        return true;
      } catch (retryErr: unknown) {
        console.error('Critical: localStorage quota remains exceeded even after pruning:', retryErr);
        notifyStorageWarning(
          'Lagringsfel',
          'Lagringsutrymmet är fullt. Ändringar kunde inte sparas lokalt.'
        );
        return false;
      }
    } else {
      console.error('Unexpected error while writing to localStorage:', err);
      return false;
    }
  }
}

/**
 * Resets all user progress and removes stored keys.
 */
export function clearStoredProgress(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY_V2);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
  } catch (err: unknown) {
    console.warn('Failed to remove keys from localStorage:', err);
  }
}
