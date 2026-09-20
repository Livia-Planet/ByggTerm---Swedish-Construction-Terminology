import { UserProgress, ConstructionTerm, SrsRecord } from '../types';
import { CURRENT_STORAGE_VERSION, migrateAndValidateProgress } from './storage';

export interface BackupPayload {
  appName: 'ByggTerm';
  schemaVersion: number;
  exportedAt: string;
  stats: {
    totalFavorites: number;
    totalMastered: number;
    totalNeedsReview: number;
    totalSrsTracked: number;
    totalQuizAttempts: number;
  };
  progress: UserProgress;
}

/**
 * Trigger download of a Blob with a specified filename.
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports the complete UserProgress to a timestamped JSON backup file.
 */
export function exportProgressToJson(progress: UserProgress): void {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `byggterm-backup-${dateStr}.json`;

  const payload: BackupPayload = {
    appName: 'ByggTerm',
    schemaVersion: progress.version || CURRENT_STORAGE_VERSION,
    exportedAt: now.toISOString(),
    stats: {
      totalFavorites: progress.favorites.length,
      totalMastered: progress.mastered.length,
      totalNeedsReview: progress.needsReview.length,
      totalSrsTracked: Object.keys(progress.srsRecords).length,
      totalQuizAttempts: progress.quizHistory.length,
    },
    progress,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, filename);
}

/**
 * Escapes a cell for CSV formatting according to RFC 4180.
 * Ensures internal double quotes are escaped to "" and wrapped in quotes.
 */
export function escapeCsvCell(cell: string | number | undefined | null): string {
  if (cell == null) return '""';
  const str = String(cell);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Type guard to verify if an unknown object satisfies the UserProgress structure.
 * Prevents corrupted or malformed data from crashing the application.
 */
export function isValidProgress(data: unknown): data is UserProgress {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return false;
  }

  const p = data as Record<string, unknown>;

  // Check array fields
  if (
    !Array.isArray(p.favorites) ||
    !p.favorites.every((item) => typeof item === 'string') ||
    !Array.isArray(p.mastered) ||
    !p.mastered.every((item) => typeof item === 'string') ||
    !Array.isArray(p.needsReview) ||
    !p.needsReview.every((item) => typeof item === 'string') ||
    !Array.isArray(p.quizHistory)
  ) {
    return false;
  }

  // Check srsRecords dictionary
  if (!p.srsRecords || typeof p.srsRecords !== 'object' || Array.isArray(p.srsRecords)) {
    return false;
  }

  // Validate each SRS record node
  for (const record of Object.values(p.srsRecords as Record<string, unknown>)) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      return false;
    }
    const r = record as Record<string, unknown>;
    if (
      typeof r.reps !== 'number' ||
      typeof r.intervalDays !== 'number' ||
      typeof r.easeFactor !== 'number' ||
      typeof r.lastReviewedAt !== 'number' ||
      typeof r.nextReviewAt !== 'number' ||
      typeof r.familiarity !== 'number'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Exports a refined mistakes/review list to an Excel-friendly CSV with UTF-8 BOM.
 */
export function exportMistakesToCsv(
  terms: ConstructionTerm[],
  needsReviewIds: string[],
  srsRecords: Record<string, SrsRecord>
): void {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const filename = `byggterm-mistakes-${dateStr}.csv`;

  // Find all terms that need review
  const reviewTerms = terms.filter((term) => needsReviewIds.includes(term.id));

  // CSV headers (Swedish / Chinese bilingual headers for clarity)
  const headers = [
    'Term ID',
    'Svensk Fackterm (瑞典语术语)',
    'Kinesisk Översättning (中文释义)',
    'Engelsk Översättning (英文翻译)',
    'Kategori (分类)',
    'Repetitioner (复习次数)',
    'SRS Intervall Dagar (间隔天数)',
    'Lätthetsfaktor EF (难度系数)',
    'Status (记忆状态)',
    'Senast Repeterad (最后复习时间)',
    'Nästa Repetition (下次复习到期)',
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  reviewTerms.forEach((term) => {
    const srs = srsRecords[term.id];
    const familiarityMap: Record<number, string> = {
      0: '陌生 (Again)',
      1: '模糊 (Hard)',
      2: '熟悉 (Good)',
      3: '掌握 (Easy)',
    };
    const familiarityText = srs ? familiarityMap[srs.familiarity] || '待巩固' : '未评级';
    const lastReviewedDate = srs?.lastReviewedAt
      ? new Date(srs.lastReviewedAt).toLocaleString()
      : '未复习';
    const nextReviewDate = srs?.nextReviewAt
      ? new Date(srs.nextReviewAt).toLocaleString()
      : '立即到期';

    const row = [
      term.id,
      term.term,
      term.translationZh,
      term.translationEn,
      term.category,
      srs ? srs.reps : 0,
      srs ? srs.intervalDays : 0,
      srs ? srs.easeFactor.toFixed(2) : '2.50',
      familiarityText,
      lastReviewedDate,
      nextReviewDate,
    ];

    rows.push(row.map(escapeCsvCell).join(','));
  });

  // Prepend UTF-8 BOM (\uFEFF) to guarantee Excel correctly reads UTF-8 on Windows & Mac
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  data?: UserProgress;
  summary?: {
    favoritesCount: number;
    masteredCount: number;
    needsReviewCount: number;
    srsCount: number;
    quizCount: number;
    exportedAt?: string;
    version: number;
  };
}

/**
 * Validates an uploaded JSON backup file string against expected schema.
 */
export function validateBackupJson(rawText: string): ValidationResult {
  try {
    if (!rawText || !rawText.trim()) {
      return { valid: false, error: '上传的文件内容为空' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch (parseErr) {
      return {
        valid: false,
        error: `JSON 格式损坏: ${parseErr instanceof Error ? parseErr.message : '非合规 JSON 语法'}`,
      };
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, error: '文件非有效 JSON 对象格式' };
    }

    const rootObj = parsed as Record<string, unknown>;

    // Support both direct UserProgress or wrapped BackupPayload
    let candidateProgress: unknown = parsed;
    let exportedAt: string | undefined;

    if ('progress' in rootObj && typeof rootObj.progress === 'object' && rootObj.progress !== null) {
      candidateProgress = rootObj.progress;
      if (typeof rootObj.exportedAt === 'string') {
        exportedAt = rootObj.exportedAt;
      }
    }

    if (!candidateProgress || typeof candidateProgress !== 'object' || Array.isArray(candidateProgress)) {
      return { valid: false, error: '未找到有效的学习进度数据 (progress)' };
    }

    const candObj = candidateProgress as Record<string, unknown>;

    // 关键防错校验：排除与 ByggTerm 无关的任意 JSON
    const hasCoreField =
      'favorites' in candObj ||
      'mastered' in candObj ||
      'needsReview' in candObj ||
      'srsRecords' in candObj ||
      'quizHistory' in candObj;

    if (!hasCoreField) {
      return {
        valid: false,
        error: '未识别到 ByggTerm 学习进度结构（缺少收藏、掌握或 SRS 记忆数据），请选择正确的备份文件',
      };
    }

    // 检查各字段若存在是否为合法类型，杜绝类型断裂
    if ('favorites' in candObj && (!Array.isArray(candObj.favorites) || !candObj.favorites.every((x) => typeof x === 'string'))) {
      return { valid: false, error: '备份中的收藏列表 (favorites) 结构异常（非有效字符串数组）' };
    }
    if ('mastered' in candObj && (!Array.isArray(candObj.mastered) || !candObj.mastered.every((x) => typeof x === 'string'))) {
      return { valid: false, error: '备份中的已掌握列表 (mastered) 结构异常（非有效字符串数组）' };
    }
    if ('needsReview' in candObj && (!Array.isArray(candObj.needsReview) || !candObj.needsReview.every((x) => typeof x === 'string'))) {
      return { valid: false, error: '备份中的待复习列表 (needsReview) 结构异常（非有效字符串数组）' };
    }
    if ('srsRecords' in candObj && (typeof candObj.srsRecords !== 'object' || candObj.srsRecords === null || Array.isArray(candObj.srsRecords))) {
      return { valid: false, error: '备份中的记忆曲线 (srsRecords) 格式损坏' };
    }

    // Run through safe schema validator & migrator
    const sanitized = migrateAndValidateProgress(candidateProgress);

    // Strict type guard validation
    if (!isValidProgress(sanitized)) {
      return { valid: false, error: '数据结构与 ByggTerm 备份规范不符或核心字段损坏' };
    }

    return {
      valid: true,
      data: sanitized,
      summary: {
        favoritesCount: sanitized.favorites.length,
        masteredCount: sanitized.mastered.length,
        needsReviewCount: sanitized.needsReview.length,
        srsCount: Object.keys(sanitized.srsRecords).length,
        quizCount: sanitized.quizHistory.length,
        exportedAt,
        version: sanitized.version,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '未知解析异常';
    return { valid: false, error: `导入校验失败: ${msg}` };
  }
}

/**
 * Merges imported progress into current user progress with smart conflict resolution.
 * - Favorites: union of both lists.
 * - Mastered & NeedsReview: union with logical state resolution.
 * - SRS Records: picks the record with latest review date or higher reps.
 * - Quiz History: concatenated and deduplicated by timestamp/score.
 */
export function mergeUserProgress(current: UserProgress, imported: UserProgress): UserProgress {
  // 1. Favorites: unique union
  const favorites = Array.from(new Set([...current.favorites, ...imported.favorites]));

  // 2. SRS Records: merge per-term
  const mergedSrsRecords: Record<string, SrsRecord> = { ...current.srsRecords };

  for (const [id, importedRecord] of Object.entries(imported.srsRecords)) {
    const currentRecord = current.srsRecords[id];
    if (!currentRecord) {
      mergedSrsRecords[id] = importedRecord;
    } else {
      // Pick the more advanced or more recently practiced record
      if (importedRecord.lastReviewedAt > currentRecord.lastReviewedAt) {
        mergedSrsRecords[id] = importedRecord;
      } else if (importedRecord.lastReviewedAt === currentRecord.lastReviewedAt) {
        mergedSrsRecords[id] =
          importedRecord.reps >= currentRecord.reps ? importedRecord : currentRecord;
      } else {
        mergedSrsRecords[id] = currentRecord;
      }
    }
  }

  // 3. Mastered & NeedsReview
  // If a term is in both imported and current with differing status, look at SRS record to determine
  const masteredSet = new Set<string>([...current.mastered, ...imported.mastered]);
  const needsReviewSet = new Set<string>([...current.needsReview, ...imported.needsReview]);

  // If a term is present in both mastered and needsReview sets after union,
  // consult the merged SRS record or default to needsReview for safety:
  for (const termId of Array.from(masteredSet)) {
    if (needsReviewSet.has(termId)) {
      const srs = mergedSrsRecords[termId];
      if (srs && (srs.familiarity === 3 || srs.intervalDays >= 6)) {
        needsReviewSet.delete(termId);
      } else {
        masteredSet.delete(termId);
      }
    }
  }

  // 4. Quiz History: combine and sort chronologically
  const quizHistoryCombined = [...current.quizHistory, ...imported.quizHistory];
  const seenQuizKeys = new Set<string>();
  const deduplicatedHistory: UserProgress['quizHistory'] = [];

  for (const q of quizHistoryCombined) {
    const key = `${q.date}_${q.score}_${q.total}_${q.scope ?? 'all'}`;
    if (!seenQuizKeys.has(key)) {
      seenQuizKeys.add(key);
      deduplicatedHistory.push(q);
    }
  }

  deduplicatedHistory.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return {
    version: CURRENT_STORAGE_VERSION,
    favorites,
    mastered: Array.from(masteredSet),
    needsReview: Array.from(needsReviewSet),
    srsRecords: mergedSrsRecords,
    quizHistory: deduplicatedHistory,
  };
}
