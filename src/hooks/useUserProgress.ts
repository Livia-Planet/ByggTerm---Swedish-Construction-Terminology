import { useState, useEffect, useCallback } from 'react';
import { UserProgress, SrsRating, SrsRecord, QuizScope } from '../types';
import {
  CURRENT_STORAGE_VERSION,
  loadUserProgress,
  saveUserProgress,
  clearStoredProgress,
  defaultProgress,
} from '../utils/storage';
import { calculateNextSrs, ONE_DAY_MS } from '../utils/srs';
import { mergeUserProgress, isValidProgress } from '../utils/backup';

export { CURRENT_STORAGE_VERSION };

export function useUserProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    return loadUserProgress();
  });

  // Sync to localStorage using robust quota defense in storage.ts
  useEffect(() => {
    saveUserProgress(progress);
  }, [progress]);

  // Toggle favorite
  const toggleFavorite = useCallback((id: string) => {
    setProgress((prev) => {
      const exists = prev.favorites.includes(id);
      return {
        ...prev,
        favorites: exists
          ? prev.favorites.filter((item) => item !== id)
          : [...prev.favorites, id],
      };
    });
  }, []);

  // Toggle mastered
  const toggleMastered = useCallback((id: string) => {
    setProgress((prev) => {
      const exists = prev.mastered.includes(id);
      const now = Date.now();
      const existingSrs = prev.srsRecords[id];

      const newSrsRecords = {
        ...prev.srsRecords,
        [id]: exists
          ? {
              reps: Math.max(0, (existingSrs?.reps ?? 1) - 1),
              intervalDays: 1,
              easeFactor: existingSrs?.easeFactor ?? 2.5,
              lastReviewedAt: now,
              nextReviewAt: now + ONE_DAY_MS,
              familiarity: 1,
            }
          : {
              reps: (existingSrs?.reps ?? 0) + 1,
              intervalDays: 7,
              easeFactor: existingSrs?.easeFactor ?? 2.5,
              lastReviewedAt: now,
              nextReviewAt: now + 7 * ONE_DAY_MS,
              familiarity: 3,
            },
      };

      return {
        ...prev,
        mastered: exists
          ? prev.mastered.filter((item) => item !== id)
          : [...prev.mastered, id],
        needsReview: exists
          ? prev.needsReview
          : prev.needsReview.filter((item) => item !== id),
        srsRecords: newSrsRecords,
      };
    });
  }, []);

  // Mark term as needing review
  const markNeedsReview = useCallback((id: string) => {
    setProgress((prev) => {
      const now = Date.now();
      const existingSrs = prev.srsRecords[id];

      const newSrsRecords = {
        ...prev.srsRecords,
        [id]: {
          reps: 0,
          intervalDays: 0,
          easeFactor: Math.max(1.3, (existingSrs?.easeFactor ?? 2.5) - 0.2),
          lastReviewedAt: now,
          nextReviewAt: now, // Due right away!
          familiarity: 0,
        },
      };

      return {
        ...prev,
        needsReview: prev.needsReview.includes(id) ? prev.needsReview : [...prev.needsReview, id],
        mastered: prev.mastered.filter((item) => item !== id),
        srsRecords: newSrsRecords,
      };
    });
  }, []);

  /**
   * SM-2 SRS spaced repetition rating handler
   */
  const recordSrsReview = useCallback((id: string, rating: SrsRating) => {
    setProgress((prev) => {
      const now = Date.now();
      const record = prev.srsRecords[id];
      const safeRecord: SrsRecord = {
        reps: typeof record?.reps === 'number' && !isNaN(record.reps) ? record.reps : 0,
        intervalDays:
          typeof record?.intervalDays === 'number' && !isNaN(record.intervalDays)
            ? record.intervalDays
            : 0,
        easeFactor:
          typeof record?.easeFactor === 'number' && !isNaN(record.easeFactor) && record.easeFactor >= 1.3
            ? record.easeFactor
            : 2.5,
        lastReviewedAt:
          typeof record?.lastReviewedAt === 'number' && !isNaN(record.lastReviewedAt)
            ? record.lastReviewedAt
            : now,
        nextReviewAt:
          typeof record?.nextReviewAt === 'number' && !isNaN(record.nextReviewAt)
            ? record.nextReviewAt
            : now,
        familiarity:
          typeof record?.familiarity === 'number' && !isNaN(record.familiarity)
            ? record.familiarity
            : 0,
      };
      const updatedRecord = calculateNextSrs(safeRecord, rating, now);

      let newNeedsReview = [...prev.needsReview];
      let newMastered = [...prev.mastered];

      if (rating === 'again' || rating === 'hard') {
        if (!newNeedsReview.includes(id)) {
          newNeedsReview.push(id);
        }
        newMastered = newMastered.filter((mId) => mId !== id);
      } else if (rating === 'good') {
        newNeedsReview = newNeedsReview.filter((rId) => rId !== id);
      } else if (rating === 'easy') {
        newNeedsReview = newNeedsReview.filter((rId) => rId !== id);
        if (!newMastered.includes(id)) {
          newMastered.push(id);
        }
      }

      return {
        ...prev,
        needsReview: newNeedsReview,
        mastered: newMastered,
        srsRecords: {
          ...prev.srsRecords,
          [id]: updatedRecord,
        },
      };
    });
  }, []);

  const recordQuizResult = useCallback(
    (score: number, total: number, scope: QuizScope = 'all', date = new Date().toISOString()) => {
      setProgress((prev) => ({
        ...prev,
        quizHistory: [...prev.quizHistory, { score, total, date, scope }],
      }));
    },
    []
  );

  const resetAllProgress = useCallback(() => {
    clearStoredProgress();
    setProgress(defaultProgress);
  }, []);

  const restoreProgress = useCallback(
    (imported: UserProgress, mode: 'overwrite' | 'merge'): { success: boolean; error?: string } => {
      if (!isValidProgress(imported)) {
        const errMsg = '导入数据结构校验失败：字段类型不合规或已损坏';
        console.error('restoreProgress rejected:', errMsg);
        return { success: false, error: errMsg };
      }

      try {
        if (mode === 'overwrite') {
          saveUserProgress(imported);
          setProgress(imported);
        } else {
          setProgress((prev) => {
            const merged = mergeUserProgress(prev, imported);
            saveUserProgress(merged);
            return merged;
          });
        }
        return { success: true };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : '恢复写入本地存储时发生异常';
        return { success: false, error: errMsg };
      }
    },
    []
  );

  return {
    progress,
    toggleFavorite,
    toggleMastered,
    markNeedsReview,
    recordSrsReview,
    recordQuizResult,
    resetAllProgress,
    restoreProgress,
  };
}
