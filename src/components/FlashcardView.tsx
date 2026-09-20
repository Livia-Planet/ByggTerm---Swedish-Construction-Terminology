import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  Star,
  CheckCircle2,
  XCircle,
  Volume2,
  Sparkles,
  Clock,
  Check,
  TrendingUp,
  Brain,
  Printer,
} from 'lucide-react';
import { ConstructionTerm, Language, TermCategory, SrsRecord, SrsRating } from '../types';
import { CATEGORIES } from '../data/categories';
import { I18N } from '../data/i18n';
import { speakSwedish } from '../utils/tts';
import { calculateNextInterval } from '../utils/srs';
import { shuffleArray } from '../utils/quiz';
import { A4PrintModal } from './A4PrintModal';

interface FlashcardViewProps {
  terms: ConstructionTerm[];
  lang: Language;
  favorites: string[];
  mastered: string[];
  needsReview: string[];
  srsRecords: Record<string, SrsRecord>;
  onToggleFavorite: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onMarkNeedsReview: (id: string) => void;
  onRecordSrsReview: (id: string, rating: SrsRating) => void;
}

type FilterMode = 'srsDue' | 'unmastered' | 'all' | 'favorites' | 'needsReview';

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  terms,
  lang,
  favorites,
  mastered,
  needsReview,
  srsRecords,
  onToggleFavorite,
  onToggleMastered,
  onMarkNeedsReview,
  onRecordSrsReview,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('srsDue');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [speakingTarget, setSpeakingTarget] = useState<'term' | 'explanation' | 'example' | null>(null);
  const [justGradedRating, setJustGradedRating] = useState<SrsRating | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const t = I18N[lang];
  const now = Date.now();

  // Helper: check if a term is due for review
  const isDueForReview = useCallback(
    (termId: string) => {
      const record = srsRecords[termId];
      if (!record) {
        // Unreviewed terms or terms in needsReview are treated as due
        return needsReview.includes(termId);
      }
      return record.nextReviewAt <= now;
    },
    [srsRecords, needsReview, now]
  );

  // Active pool of flashcard terms
  const cardDeck = useMemo(() => {
    let list = terms.filter((term) => {
      // Category filter
      if (categoryFilter !== 'ALL' && term.category !== categoryFilter) {
        return false;
      }

      // Filter Mode
      if (filterMode === 'srsDue') {
        return isDueForReview(term.id);
      }
      if (filterMode === 'favorites') {
        return favorites.includes(term.id);
      }
      if (filterMode === 'unmastered') {
        return !mastered.includes(term.id);
      }
      if (filterMode === 'needsReview') {
        return needsReview.includes(term.id);
      }
      return true; // 'all'
    });

    // SRS Prioritization sorting:
    // If not manually shuffled, sort so due cards and lowest familiarity appear first!
    if (shuffleSeed === 0) {
      list = [...list].sort((a, b) => {
        const recA = srsRecords[a.id];
        const recB = srsRecords[b.id];

        const dueA = !recA || recA.nextReviewAt <= now ? 0 : 1;
        const dueB = !recB || recB.nextReviewAt <= now ? 0 : 1;

        if (dueA !== dueB) {
          return dueA - dueB; // Due first
        }

        const famA = recA?.familiarity ?? 0;
        const famB = recB?.familiarity ?? 0;
        return famA - famB; // Lower familiarity first
      });
    } else {
      // Unbiased Fisher-Yates random shuffle
      list = shuffleArray(list);
    }

    return list;
  }, [terms, filterMode, categoryFilter, favorites, mastered, needsReview, srsRecords, isDueForReview, now, shuffleSeed]);

  // Total count of cards currently due for review
  const totalDueCount = useMemo(() => {
    return terms.filter((term) => isDueForReview(term.id)).length;
  }, [terms, isDueForReview]);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= cardDeck.length) {
      setCurrentIndex(Math.max(0, cardDeck.length - 1));
    }
    setIsFlipped(false);
  }, [cardDeck.length, currentIndex]);

  const currentTerm: ConstructionTerm | undefined = cardDeck[currentIndex];

  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setSpeakingTarget(null);
    if (currentIndex < cardDeck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0); // loop back
    }
  }, [currentIndex, cardDeck.length]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setSpeakingTarget(null);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      setCurrentIndex(cardDeck.length - 1);
    }
  }, [currentIndex, cardDeck.length]);

  const handleShuffle = () => {
    setShuffleSeed(Date.now());
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleResetSort = () => {
    setShuffleSeed(0);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleSpeak = (e: React.MouseEvent, target: 'term' | 'explanation' | 'example', text: string) => {
    e.stopPropagation();
    if (speakingTarget === target) {
      setSpeakingTarget(null);
      return;
    }
    setSpeakingTarget(target);
    speakSwedish(text, {
      rate: 0.85,
      onStart: () => setSpeakingTarget(target),
      onEnd: () => setSpeakingTarget(null),
      onError: () => setSpeakingTarget(null),
    });
  };

  // SRS Rating Handler
  const handleGrade = (rating: SrsRating) => {
    if (!currentTerm) return;
    setJustGradedRating(rating);
    onRecordSrsReview(currentTerm.id, rating);

    setTimeout(() => {
      setJustGradedRating(null);
      handleNext();
    }, 280);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (isFlipped) {
        // 1: Again, 2: Hard, 3: Good, 4: Easy
        if (e.key === '1') handleGrade('again');
        if (e.key === '2') handleGrade('hard');
        if (e.key === '3') handleGrade('good');
        if (e.key === '4') handleGrade('easy');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, isFlipped, currentTerm]);

  // Touch swipe gesture recognition for mobile devices (iPhone 14)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Minimum swipe threshold 45px and predominantly horizontal
    if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (typeof window !== 'undefined' && window.navigator?.vibrate) {
        try { window.navigator.vibrate(10); } catch (err) {}
      }
      if (deltaX < 0) {
        // Swiped Left -> Next Card
        handleNext();
      } else {
        // Swiped Right -> Previous Card
        handlePrev();
      }
    }
  };

  if (cardDeck.length === 0) {
    return (
      <div id="flashcard-empty-state" className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          {filterMode === 'srsDue'
            ? lang === 'sv'
              ? 'Alla repetitioner är klara för idag! 🎉'
              : lang === 'zh'
              ? '太棒了！今日所有到期卡片均已复习完毕！🎉'
              : 'All scheduled reviews are completed for today! 🎉'
            : filterMode === 'unmastered'
            ? lang === 'sv'
              ? 'Fantastiskt! Du har behärskat alla termer i detta urval!'
              : '你已熟练掌握所有词汇！'
            : t.noResults}
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {filterMode === 'srsDue'
            ? lang === 'sv'
              ? 'Inga fler kort i intervallrepetitionskön just nu. Du kan bläddra bland alla termer eller träna på favoriter.'
              : '当前记忆曲线中暂无待复习词汇。你可以切换为“全词库”或“未掌握”模式继续保持手感。'
            : lang === 'sv'
            ? 'Byt filterläge för att repetera tidigare inlärda termer eller alla ord i ordboken.'
            : '请切换筛选模式以复习全部词汇，或重新挑战。'}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setFilterMode('unmastered');
              setCategoryFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-xs hover:bg-amber-400 transition"
          >
            {t.unmasteredOnly}
          </button>
          <button
            onClick={() => {
              setFilterMode('all');
              setCategoryFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-xs hover:bg-slate-800 transition"
          >
            {t.filterAll} ({terms.length})
          </button>
        </div>
      </div>
    );
  }

  const category = CATEGORIES[currentTerm.category] || CATEGORIES.tools;
  const isFavorite = favorites.includes(currentTerm.id);
  const currentSrs = srsRecords[currentTerm.id];
  const progressPercent = Math.round(((currentIndex + 1) / cardDeck.length) * 100);

  // Format SRS Badge info
  const getSrsBadge = () => {
    if (!currentSrs) {
      return {
        label: lang === 'sv' ? 'Ny term' : lang === 'zh' ? '新入词库' : 'New',
        color: 'bg-slate-100 text-slate-600 border-slate-200',
      };
    }
    if (currentSrs.nextReviewAt <= now) {
      return {
        label: lang === 'sv' ? 'Repetition idag' : lang === 'zh' ? '今日到期复习' : 'Due Today',
        color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse',
      };
    }
    if (currentSrs.familiarity === 3) {
      return {
        label: lang === 'sv' ? `Behärskad (${currentSrs.intervalDays} d)` : lang === 'zh' ? `熟练掌握 (${currentSrs.intervalDays}天)` : `Mastered (${currentSrs.intervalDays}d)`,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (currentSrs.familiarity === 2) {
      return {
        label: lang === 'sv' ? `Bekant (${currentSrs.intervalDays} d)` : lang === 'zh' ? `熟悉良好 (${currentSrs.intervalDays}天)` : `Good (${currentSrs.intervalDays}d)`,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    }
    return {
      label: lang === 'sv' ? 'Fuzzy / Svårt' : lang === 'zh' ? '模糊待巩固' : 'Hard / Review',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  };

  const srsBadge = getSrsBadge();

  // Dynamic SM-2 interval forecasts for the current flashcard
  const baseInterval = currentSrs?.intervalDays ?? 0;
  const currentEase = currentSrs?.easeFactor ?? 2.5;
  const hardInterval = calculateNextInterval(baseInterval, currentEase, 'hard');
  const goodInterval = calculateNextInterval(baseInterval, currentEase, 'good');
  const easyInterval = calculateNextInterval(baseInterval, currentEase, 'easy');

  return (
    <div id="flashcards-container" className="max-w-3xl mx-auto space-y-5">
      {/* Top Deck Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Deck Selector Mode with SRS Due Priority */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {/* SRS Due Tab */}
            <button
              id="deck-filter-srs"
              onClick={() => {
                setFilterMode('srsDue');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                filterMode === 'srsDue'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-900" />
              <span>{t.srsDue}</span>
              <span className={`px-1.5 py-0.2 text-[11px] rounded-full font-mono ${
                totalDueCount > 0 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalDueCount}
              </span>
            </button>

            {/* Unmastered Tab */}
            <button
              id="deck-filter-unmastered"
              onClick={() => {
                setFilterMode('unmastered');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterMode === 'unmastered'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.unmasteredOnly} ({terms.length - mastered.length})
            </button>

            {/* All Terms Tab */}
            <button
              id="deck-filter-all"
              onClick={() => {
                setFilterMode('all');
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.filterAll} ({terms.length})
            </button>

            {/* Favorites Tab */}
            {favorites.length > 0 && (
              <button
                id="deck-filter-favorites"
                onClick={() => {
                  setFilterMode('favorites');
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                  filterMode === 'favorites'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{t.favoritesOnly} ({favorites.length})</span>
              </button>
            )}

            {/* Needs Review Tab */}
            {needsReview.length > 0 && (
              <button
                id="deck-filter-review"
                onClick={() => {
                  setFilterMode('needsReview');
                  setCurrentIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                  filterMode === 'needsReview'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <XCircle className="w-3 h-3" />
                <span>{t.needsReview} ({needsReview.length})</span>
              </button>
            )}
          </div>

          {/* Shuffle / Priority Reset & A4 Print Controls */}
          <div className="flex items-center gap-1.5">
            {shuffleSeed > 0 ? (
              <button
                onClick={handleResetSort}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold hover:bg-amber-100 transition"
                title="Återställ till SRS prioriterad ordning"
              >
                <Brain className="w-3.5 h-3.5 text-amber-600" />
                <span>SRS Prioritet</span>
              </button>
            ) : (
              <button
                id="shuffle-deck-btn"
                onClick={handleShuffle}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                title={t.shuffle}
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-600" />
                <span>{t.shuffle}</span>
              </button>
            )}

            <button
              id="export-a4-flashcards-btn"
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs transition"
              title={t.exportA4Print}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.exportA4Print}</span>
              <span className="sm:hidden">A4</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Counter */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span>{t.cardCounter(currentIndex + 1, cardDeck.length)}</span>
              {shuffleSeed === 0 && (
                <span className="text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 font-medium hidden sm:inline">
                  {t.srsQueueActive}
                </span>
              )}
            </span>
            <span className="font-mono text-slate-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* The 3D Flip Card Container with Mobile Swipe Gesture Support */}
      <div
        id="interactive-flashcard"
        onClick={() => {
          if (typeof window !== 'undefined' && window.navigator?.vibrate) {
            try { window.navigator.vibrate(8); } catch (err) {}
          }
          setIsFlipped((prev) => !prev);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`cursor-pointer min-h-[380px] sm:min-h-[430px] rounded-3xl border-2 bg-white p-6 sm:p-8 shadow-md hover:shadow-lg transition-all flex flex-col justify-between relative overflow-hidden select-none touch-manipulation ${
          justGradedRating ? 'scale-[0.98] border-amber-400' : 'border-slate-200/90'
        }`}
      >
        {/* Subtle Background Accent */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-amber-50/50 pointer-events-none" />

        {/* Card Header: Category badge, SRS status badge, Letter tag, Star & Audio */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${category.bg} ${category.text} ${category.border}`}
            >
              <span>{category.icon}</span>
              <span>{category.name[lang]}</span>
            </span>

            {/* SRS Status Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${srsBadge.color}`}
            >
              <span>{srsBadge.label}</span>
            </span>

            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              #{currentTerm.letter}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Term TTS */}
            <button
              onClick={(e) => handleSpeak(e, 'term', currentTerm.term)}
              className={`p-2 rounded-xl border transition ${
                speakingTarget === 'term'
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-amber-50'
              }`}
              title={t.playAudio}
            >
              <Volume2 className={`w-5 h-5 ${speakingTarget === 'term' ? 'animate-pulse text-amber-600' : ''}`} />
            </button>

            {/* Star toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(currentTerm.id);
              }}
              className={`p-2 rounded-xl border transition ${
                isFavorite
                  ? 'border-amber-300 bg-amber-50 text-amber-500'
                  : 'border-slate-200 bg-slate-50 text-slate-400 hover:text-amber-500'
              }`}
              title={isFavorite ? t.removeFavorite : t.addFavorite}
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Card Body: Dynamic Front vs Back */}
        <div className="py-6 sm:py-7 my-auto relative z-10 text-center">
          {!isFlipped ? (
            /* FRONT: Swedish Term */
            <div className="space-y-4 animate-in fade-in duration-200">
              <span className="text-xs font-bold tracking-wider uppercase text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 inline-block">
                🇸🇪 {t.swedishTerm}
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
                {currentTerm.term}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium pt-3 flex items-center justify-center gap-1.5">
                <RotateCw className="w-4 h-4 text-amber-500" />
                <span>{t.flipPrompt}</span>
              </p>
            </div>
          ) : (
            /* BACK: Swedish Förklaring + Example + Chinese + English */
            <div className="space-y-3.5 text-left animate-in fade-in duration-200">
              <div className="text-center pb-2 border-b border-slate-100 flex items-center justify-center gap-2">
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {currentTerm.term}
                </h3>
              </div>

              {/* Swedish Explanation with Independent Pronunciation */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    🇸🇪 {t.swedishDesc}
                  </span>
                  <button
                    onClick={(e) => handleSpeak(e, 'explanation', currentTerm.explanationSv)}
                    className={`px-2 py-0.5 rounded-md border text-xs flex items-center gap-1 transition ${
                      speakingTarget === 'explanation'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:text-amber-800'
                    }`}
                    title={t.playExplanation}
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${speakingTarget === 'explanation' ? 'animate-pulse text-amber-600' : ''}`} />
                    <span className="text-[10px] font-mono">0.85x</span>
                  </button>
                </div>
                <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
                  {currentTerm.explanationSv}
                </p>
              </div>

              {/* Swedish Example Sentence (if available) with Independent Pronunciation */}
              {currentTerm.exampleSv && (
                <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/70 text-xs sm:text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1">
                      🔨 {t.example}
                    </span>
                    <button
                      onClick={(e) => handleSpeak(e, 'example', currentTerm.exampleSv!)}
                      className={`px-2 py-0.5 rounded-md border text-xs flex items-center gap-1 transition ${
                        speakingTarget === 'example'
                          ? 'bg-amber-200 text-amber-950 border-amber-400'
                          : 'border-amber-200 bg-white text-amber-800 hover:bg-amber-100/60'
                      }`}
                      title={t.playExample}
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${speakingTarget === 'example' ? 'animate-pulse text-amber-700' : ''}`} />
                      <span className="text-[10px] font-mono">0.85x</span>
                    </button>
                  </div>
                  <p className="font-medium text-slate-800 italic">
                    "{currentTerm.exampleSv}"
                  </p>
                  {currentTerm.exampleZh && (
                    <p className="text-slate-600 text-xs mt-0.5">
                      {currentTerm.exampleZh}
                    </p>
                  )}
                </div>
              )}

              {/* Chinese & English Translations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block mb-0.5">
                    🇨🇳 {t.chineseTrans}
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    {currentTerm.translationZh}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-0.5">
                    🇬🇧 {t.englishTrans}
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    {currentTerm.translationEn}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card Footer: Flip hint & Keyboard instructions */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 relative z-10">
          <span className="hidden sm:inline">
            {isFlipped ? (
              <span>
                Kortbetyg: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">1</kbd> Glömt, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">2</kbd> Svårt, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">3</kbd> Bra, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">4</kbd> Lätt
              </span>
            ) : (
              <span>
                Tangentbord: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">Mellanslag</kbd> vänd, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-[10px]">← / →</kbd> bläddra
              </span>
            )}
          </span>
          <span className="sm:hidden text-[11px] font-medium text-slate-500">
            👈 Svep för att bläddra
          </span>
          <span className="font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            <RotateCw className="w-3.5 h-3.5" />
            {t.flipCard}
          </span>
        </div>
      </div>

      {/* SRS 4-Tier Grading Action Panel (Visible when card is flipped) */}
      {isFlipped ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-amber-600" />
              <span>SRS Intervallbetyg / 记忆评估</span>
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              Klicka för att schemalägga nästa repetition
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* 1. Again (1 day reset) */}
            <button
              id="srs-grade-again"
              onClick={() => handleGrade('again')}
              className="min-h-[48px] py-3 px-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 active:scale-95 transition flex flex-col items-center justify-center text-center shadow-2xs"
            >
              <div className="flex items-center gap-1 text-xs sm:text-sm font-black">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{t.srsRatingAgain}</span>
              </div>
              <span className="text-[10px] text-rose-600/80 font-mono mt-0.5 font-semibold">
                1 dag / {lang === 'sv' ? 'Imorgon' : lang === 'zh' ? '明天重测' : 'Tomorrow'}
              </span>
            </button>

            {/* 2. Hard */}
            <button
              id="srs-grade-hard"
              onClick={() => handleGrade('hard')}
              className="min-h-[48px] py-3 px-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 active:scale-95 transition flex flex-col items-center justify-center text-center shadow-2xs"
            >
              <div className="flex items-center gap-1 text-xs sm:text-sm font-black">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{t.srsRatingHard}</span>
              </div>
              <span className="text-[10px] text-amber-700/80 font-mono mt-0.5 font-semibold">
                +{hardInterval} {hardInterval === 1 ? (lang === 'sv' ? 'dag' : '天') : (lang === 'sv' ? 'dagar' : '天')}
              </span>
            </button>

            {/* 3. Good */}
            <button
              id="srs-grade-good"
              onClick={() => handleGrade('good')}
              className="min-h-[48px] py-3 px-2 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 active:scale-95 transition flex flex-col items-center justify-center text-center shadow-2xs"
            >
              <div className="flex items-center gap-1 text-xs sm:text-sm font-black">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>{t.srsRatingGood}</span>
              </div>
              <span className="text-[10px] text-blue-700/80 font-mono mt-0.5 font-semibold">
                +{goodInterval} {goodInterval === 1 ? (lang === 'sv' ? 'dag' : '天') : (lang === 'sv' ? 'dagar' : '天')}
              </span>
            </button>

            {/* 4. Easy */}
            <button
              id="srs-grade-easy"
              onClick={() => handleGrade('easy')}
              className="min-h-[48px] py-3 px-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 active:scale-95 transition flex flex-col items-center justify-center text-center shadow-2xs"
            >
              <div className="flex items-center gap-1 text-xs sm:text-sm font-black">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{t.srsRatingEasy}</span>
              </div>
              <span className="text-[10px] text-emerald-700/80 font-mono mt-0.5 font-semibold">
                +{easyInterval} {easyInterval === 1 ? (lang === 'sv' ? 'dag' : '天') : (lang === 'sv' ? 'dagar' : '天')}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* Standard Navigation Bar when card is on front */
        <div className="flex items-center justify-between gap-3">
          <button
            id="flashcard-prev-btn"
            onClick={handlePrev}
            className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.prevCard}</span>
          </button>

          <button
            id="flashcard-flip-action-btn"
            onClick={() => {
              if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                try { window.navigator.vibrate(8); } catch (err) {}
              }
              setIsFlipped(true);
            }}
            className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
          >
            <RotateCw className="w-4 h-4" />
            <span>{t.flipCard}</span>
          </button>

          <button
            id="flashcard-next-btn"
            onClick={handleNext}
            className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
          >
            <span>{t.nextCard}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* A4 Flashcard Print & PDF Export Modal */}
      <A4PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        initialScope={filterMode === 'favorites' ? 'favorites' : filterMode === 'needsReview' ? 'needsReview' : 'current'}
        currentFilteredTerms={cardDeck}
        allTerms={terms}
        favorites={favorites}
        needsReview={needsReview}
        lang={lang}
      />
    </div>
  );
};
