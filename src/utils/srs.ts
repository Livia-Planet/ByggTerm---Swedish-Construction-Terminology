import { SrsRating, SrsRecord } from '../types';

export const DEFAULT_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;
export const ONE_DAY_MS = 86400000; // 24 * 60 * 60 * 1000 ms

/**
 * Strict sanitizer providing safe defaults for legacy / corrupted / partial LocalStorage records.
 * Prevents undefined / null / NaN propagation into arithmetic operations.
 */
export function sanitizeSrsRecord(record?: Partial<SrsRecord> | null): SrsRecord {
  const now = Date.now();
  const reps =
    typeof record?.reps === 'number' && !isNaN(record.reps)
      ? Math.max(0, Math.floor(record.reps))
      : 0;

  const intervalDays =
    typeof record?.intervalDays === 'number' && !isNaN(record.intervalDays)
      ? Math.max(0, Math.round(record.intervalDays))
      : 0;

  const easeFactor =
    typeof record?.easeFactor === 'number' &&
    !isNaN(record.easeFactor) &&
    record.easeFactor >= MIN_EASE_FACTOR
      ? Number(record.easeFactor.toFixed(2))
      : DEFAULT_EASE_FACTOR;

  const lastReviewedAt =
    typeof record?.lastReviewedAt === 'number' && !isNaN(record.lastReviewedAt)
      ? record.lastReviewedAt
      : now;

  const nextReviewAt =
    typeof record?.nextReviewAt === 'number' && !isNaN(record.nextReviewAt)
      ? record.nextReviewAt
      : now;

  const familiarity =
    typeof record?.familiarity === 'number' && !isNaN(record.familiarity)
      ? Math.min(3, Math.max(0, Math.round(record.familiarity)))
      : 0;

  return {
    reps,
    intervalDays,
    easeFactor,
    lastReviewedAt,
    nextReviewAt,
    familiarity,
  };
}

/**
 * Creates a baseline default SRS record for a newly introduced term.
 */
export function createDefaultSrsRecord(isDueImmediately = true): SrsRecord {
  const now = Date.now();
  return {
    reps: 0,
    intervalDays: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    lastReviewedAt: now,
    nextReviewAt: isDueImmediately ? now : now + ONE_DAY_MS,
    familiarity: 1,
  };
}

/**
 * Standard SuperMemo SM-2 Spaced Repetition Algorithm.
 * Sanitizes input records against legacy format discrepancies (NaN/undefined protection),
 * then computes updated Ease Factor, repetitions, interval days, and due timestamp.
 *
 * Ratings:
 * - again: q = 1 (forgot / reset reps to 0, interval = 1)
 * - hard:  q = 2 (retrieval effort high, reset / shorter interval)
 * - good:  q = 3 (successful recall, standard SM-2 exponential spacing)
 * - easy:  q = 5 (effortless recall, 1.3x bonus interval multiplier)
 */
export function calculateNextSrs(
  prevRecord: Partial<SrsRecord> | undefined | null,
  rating: SrsRating,
  customNow?: number
): SrsRecord {
  const now = typeof customNow === 'number' && !isNaN(customNow) ? customNow : Date.now();
  
  // 严格旧数据兜底防线：防止 undefined / null / NaN 导致计算崩溃
  const safeRecord = sanitizeSrsRecord(prevRecord);
  let reps = safeRecord.reps;
  let intervalDays = safeRecord.intervalDays || 1;
  let easeFactor = safeRecord.easeFactor;

  // 映射 rating 到 SM-2 标准 0-5 分制 (Again: 1, Hard: 2, Good: 3, Easy: 5)
  const qMap: Record<SrsRating, number> = { again: 1, hard: 2, good: 3, easy: 5 };
  const q = qMap[rating] ?? 3;

  // 1. 更新难度因子 Ease Factor (EF)
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (isNaN(easeFactor) || easeFactor < MIN_EASE_FACTOR) {
    easeFactor = MIN_EASE_FACTOR; // 强制最低下限 1.3
  }
  easeFactor = Number(easeFactor.toFixed(2));

  // 2. 根据评分计算下次复习间隔
  if (q < 3) {
    // 答错或重置
    reps = 0;
    intervalDays = 1;
  } else {
    // 答对
    if (reps === 0) {
      intervalDays = 1;
    } else if (reps === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    reps += 1;
  }

  // Easy 给予额外 1.3 倍成长奖励
  if (rating === 'easy' && reps > 1) {
    intervalDays = Math.round(intervalDays * 1.3);
  }

  // 保底至少 1 天，防止意外负数或 0 天死循环
  intervalDays = Math.max(1, intervalDays);

  const nextReviewAt = now + intervalDays * ONE_DAY_MS;
  const familiarityMap: Record<SrsRating, number> = { again: 0, hard: 1, good: 2, easy: 3 };

  return {
    reps,
    intervalDays,
    easeFactor,
    lastReviewedAt: now,
    nextReviewAt,
    familiarity: familiarityMap[rating] ?? 2,
  };
}

/**
 * Predicts the next interval for a given term state and rating.
 */
export function calculateNextInterval(
  baseInterval: number,
  easeFactor: number,
  rating: SrsRating,
  reps: number = 1
): number {
  const dummyRecord: SrsRecord = {
    reps,
    intervalDays: baseInterval,
    easeFactor,
    lastReviewedAt: 0,
    nextReviewAt: 0,
    familiarity: 1,
  };
  return calculateNextSrs(dummyRecord, rating).intervalDays;
}

/**
 * Predicts the updated Ease Factor based on SM-2 formula.
 */
export function calculateNextEaseFactor(currentEase: number, rating: SrsRating): number {
  const qMap: Record<SrsRating, number> = { again: 1, hard: 2, good: 3, easy: 5 };
  const q = qMap[rating] ?? 3;
  const base = typeof currentEase === 'number' && !isNaN(currentEase) ? currentEase : DEFAULT_EASE_FACTOR;
  const nextEf = base + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  return Number(Math.max(MIN_EASE_FACTOR, isNaN(nextEf) ? DEFAULT_EASE_FACTOR : nextEf).toFixed(2));
}

/**
 * Evaluates an SRS review according to standard SM-2 algorithm.
 * Backward compatible alias for calculateNextSrs.
 */
export function calculateSm2Review(
  existingRecord: Partial<SrsRecord> | undefined | null,
  rating: SrsRating,
  customTimestamp?: number
): SrsRecord {
  return calculateNextSrs(existingRecord, rating, customTimestamp);
}
