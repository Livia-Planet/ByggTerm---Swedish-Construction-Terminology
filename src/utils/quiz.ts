import { ConstructionTerm } from '../types';
import { ALL_TERMS } from '../data/terms';

/**
 * Standard Fisher-Yates unbiased shuffling algorithm.
 * Guarantees uniform permutation distribution, eliminating bias from sort(() => Math.random() - 0.5).
 */
export function shuffleArray<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
}

/**
 * Robust 4-Step Distractor Generation Algorithm with Global Fallback:
 * Step 1: Exclude the target term itself from candidates.
 * Step 2: Prioritize distractors from the exact same category within scope.
 * Step 3: If same-category candidates are insufficient, supplement from other categories in scope.
 * Step 3b (Small-sample fallback): If scope candidates are still insufficient (< count,
 *         e.g., in "only favorites" or "error notebook" mode with < 4 terms),
 *         unconditionally supplement from the global dictionary ALL_TERMS (deduplicating).
 * Step 4: Return a completely randomized distractor array via unbiased Fisher-Yates shuffle.
 */
export function generateDistractors(
  targetTerm: ConstructionTerm,
  scopeTerms: ConstructionTerm[] = ALL_TERMS,
  count: number = 3,
  globalFallbackPool: ConstructionTerm[] = ALL_TERMS
): ConstructionTerm[] {
  const targetCount = Math.max(0, count);
  if (targetCount === 0) return [];

  // Step 1: 排除目标词汇本身
  const candidates = scopeTerms.filter((t) => t.id !== targetTerm.id);

  // Step 2: 优先从同类别抽取
  const sameCategory = candidates.filter((t) => t.category === targetTerm.category);
  const shuffledSameCat = shuffleArray(sameCategory);
  let selected = shuffledSameCat.slice(0, targetCount);

  // Step 3: 若同类不足，先从当前候选池补齐其他类别 (必须去重)
  if (selected.length < targetCount) {
    const selectedIds = new Set(selected.map((s) => s.id));
    selectedIds.add(targetTerm.id);
    const remainingScopeCandidates = candidates.filter((t) => !selectedIds.has(t.id));
    const shuffledRemaining = shuffleArray(remainingScopeCandidates);
    const neededFromScope = targetCount - selected.length;
    selected = [...selected, ...shuffledRemaining.slice(0, neededFromScope)];
  }

  // Step 3b: 小样本兜底机制 — 若范围筛选后仍不足 count 个 (如仅收藏了 1~3 个词汇)，
  // 必须强行引用全量词库 ALL_TERMS 补足干扰项，杜绝选项不足 4 个或生成空白
  if (selected.length < targetCount) {
    const selectedIds = new Set(selected.map((s) => s.id));
    selectedIds.add(targetTerm.id);

    // 优先从全局全量库中抽取同类别词汇
    const globalSameCat = globalFallbackPool.filter(
      (t) => !selectedIds.has(t.id) && t.category === targetTerm.category
    );
    const shuffledGlobalSame = shuffleArray(globalSameCat);
    const neededFromGlobalSame = targetCount - selected.length;
    selected = [...selected, ...shuffledGlobalSame.slice(0, neededFromGlobalSame)];

    // 若同类依然不足，从全局全量库补足任意词汇
    if (selected.length < targetCount) {
      selected.forEach((s) => selectedIds.add(s.id));
      const globalRemaining = globalFallbackPool.filter((t) => !selectedIds.has(t.id));
      const shuffledGlobalRemaining = shuffleArray(globalRemaining);
      const neededFinal = targetCount - selected.length;
      selected = [...selected, ...shuffledGlobalRemaining.slice(0, neededFinal)];
    }
  }

  // Step 4: 返回打乱顺序的干扰项集合 (严格无偏 Fisher-Yates 洗牌)
  return shuffleArray(selected);
}
