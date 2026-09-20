import React, { useState, useMemo, useDeferredValue, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  CheckCircle2,
  Star,
  Layers,
  BookOpen,
  Eye,
  EyeOff,
  Printer,
} from 'lucide-react';
import { ConstructionTerm, TermCategory, Language, SrsRecord } from '../types';
import { CATEGORIES } from '../data/categories';
import { AVAILABLE_LETTERS } from '../data/terms';
import { I18N } from '../data/i18n';
import { TermCard } from './TermCard';
import { A4PrintModal } from './A4PrintModal';
import { MobileAlphabetSelector } from './MobileAlphabetSelector';
import { MobileCategorySelector } from './MobileCategorySelector';
import { TodaysFocusCard } from './TodaysFocusCard';

interface DictionaryViewProps {
  terms: ConstructionTerm[];
  lang: Language;
  favorites: string[];
  mastered: string[];
  needsReview?: string[];
  srsRecords?: Record<string, SrsRecord>;
  onToggleFavorite: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onNavigateToFlashcards?: () => void;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  terms,
  lang,
  favorites,
  mastered,
  needsReview = [],
  srsRecords = {},
  onToggleFavorite,
  onToggleMastered,
  onNavigateToFlashcards,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites' | 'unmastered' | 'mastered'>('all');
  const [showChinese, setShowChinese] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [displayCount, setDisplayCount] = useState(40);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  // Auto-reset display count when search or filter criteria change
  useEffect(() => {
    setDisplayCount(40);
  }, [deferredSearchQuery, selectedLetter, selectedCategory, filterMode]);

  const t = I18N[lang];

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: terms.length };
    Object.keys(CATEGORIES).forEach((catKey) => {
      counts[catKey] = terms.filter((item) => item.category === catKey).length;
    });
    return counts;
  }, [terms]);

  // Letter counts
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    AVAILABLE_LETTERS.forEach((letter) => {
      counts[letter] = terms.filter((item) => item.letter === letter).length;
    });
    return counts;
  }, [terms]);

  // Filtered terms with deferred query to prevent input lag
  const filteredTerms = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();

    return terms.filter((term) => {
      // 1. Letter filter
      if (selectedLetter !== 'ALL' && term.letter !== selectedLetter) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'ALL' && term.category !== selectedCategory) {
        return false;
      }

      // 3. Status filter
      if (filterMode === 'favorites' && !favorites.includes(term.id)) {
        return false;
      }
      if (filterMode === 'mastered' && !mastered.includes(term.id)) {
        return false;
      }
      if (filterMode === 'unmastered' && mastered.includes(term.id)) {
        return false;
      }

      // 4. Search query (Swedish term, Swedish explanation, Chinese translation, English translation)
      if (q) {
        const matchesTerm = term.term.toLowerCase().includes(q);
        const matchesSv = term.explanationSv.toLowerCase().includes(q);
        const matchesZh = term.translationZh.toLowerCase().includes(q);
        const matchesEn = term.translationEn.toLowerCase().includes(q);
        return matchesTerm || matchesSv || matchesZh || matchesEn;
      }

      return true;
    });
  }, [terms, selectedLetter, selectedCategory, filterMode, deferredSearchQuery, favorites, mastered]);

  const visibleTerms = useMemo(() => {
    return filteredTerms.slice(0, displayCount);
  }, [filteredTerms, displayCount]);

  // Seamless scroll pagination using IntersectionObserver
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting) {
          setDisplayCount((prev) => {
            if (prev < filteredTerms.length) {
              return prev + 40;
            }
            return prev;
          });
        }
      },
      {
        root: null,
        rootMargin: '300px 0px',
        threshold: 0.05,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredTerms.length]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedLetter('ALL');
    setSelectedCategory('ALL');
    setFilterMode('all');
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedLetter !== 'ALL' ||
    selectedCategory !== 'ALL' ||
    filterMode !== 'all';

  return (
    <div id="dictionary-view" className="space-y-4 sm:space-y-6">
      {/* Personalized SRS Today's Focus Card */}
      {onNavigateToFlashcards && (
        <TodaysFocusCard
          terms={terms}
          srsRecords={srsRecords}
          needsReview={needsReview}
          lang={lang}
          onStartReview={onNavigateToFlashcards}
        />
      )}

      {/* Search & Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        {/* Search Input Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="dictionary-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setDisplayCount(40);
            }}
            placeholder={t.searchPlaceholder}
            className="w-full pl-11 pr-10 min-h-[48px] py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base transition bg-slate-50/50 hover:bg-white"
          />
          {searchQuery && (
            <button
              id="clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600"
              aria-label="Rensa sökning"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 1. Foldable A–Ä Alphabet Index (No Horizontal Scrolling) */}
        <MobileAlphabetSelector
          selectedLetter={selectedLetter}
          onSelectLetter={(letter) => {
            setSelectedLetter(letter);
            setDisplayCount(40);
          }}
          alphabet={AVAILABLE_LETTERS}
          termCountsByLetter={letterCounts}
          lang={lang}
          totalTermsCount={terms.length}
        />

        {/* 2. Foldable Accordion Category Selector (No Horizontal Scrolling) */}
        <MobileCategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={(catKey) => {
            setSelectedCategory(catKey);
            setDisplayCount(40);
          }}
          categoryCounts={categoryCounts}
          lang={lang}
          totalTermsCount={terms.length}
        />

        {/* Secondary Filter & Display Toggle Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Status buttons (Touch friendly min-h-[40px]) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterMode('all')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl font-medium transition active:scale-95 ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.filterAll}
            </button>
            <button
              onClick={() => setFilterMode('favorites')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 active:scale-95 ${
                filterMode === 'favorites'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{t.favoritesOnly}</span>
              <span className="font-mono text-[11px] font-bold">({favorites.length})</span>
            </button>
            <button
              onClick={() => setFilterMode('unmastered')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 active:scale-95 ${
                filterMode === 'unmastered'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{t.unmasteredOnly}</span>
              <span className="font-mono text-[11px] font-bold">
                ({terms.length - mastered.length})
              </span>
            </button>
            <button
              onClick={() => setFilterMode('mastered')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1.5 active:scale-95 ${
                filterMode === 'mastered'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.mastered}</span>
              <span className="font-mono text-[11px] font-bold">({mastered.length})</span>
            </button>
          </div>

          {/* Translation Toggles & Reset */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <button
              onClick={() => setShowChinese(!showChinese)}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition active:scale-95 ${
                showChinese
                  ? 'border-amber-300 bg-amber-50 text-amber-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
              title="Visa/Dölj kinesiska översättningar"
            >
              {showChinese ? <Eye className="w-4 h-4 text-amber-600" /> : <EyeOff className="w-4 h-4" />}
              <span>🇨🇳 {t.chineseTrans}</span>
            </button>

            <button
              onClick={() => setShowEnglish(!showEnglish)}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition active:scale-95 ${
                showEnglish
                  ? 'border-blue-300 bg-blue-50 text-blue-900 font-bold shadow-2xs'
                  : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}
              title="Visa/Dölj engelska översättningar"
            >
              {showEnglish ? <Eye className="w-4 h-4 text-blue-600" /> : <EyeOff className="w-4 h-4" />}
              <span>🇬🇧 {t.englishTrans}</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition font-bold"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Result Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-sm font-medium text-slate-600">
          {t.resultsCount}: <strong className="text-slate-900 font-bold">{filteredTerms.length}</strong> {t.totalTerms}
          {selectedLetter !== 'ALL' && (
            <span className="ml-2 text-slate-500">
              (Bokstav: <span className="font-semibold text-slate-800">{selectedLetter}</span>)
            </span>
          )}
        </p>

        {filteredTerms.length > 0 && (
          <button
            id="dict-export-a4-btn"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-900 transition text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            title="Exportera och skriv ut A4-ordkort"
          >
            <Printer className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {lang === 'zh'
                ? `导出 A4 打印闪卡 (${filteredTerms.length})`
                : lang === 'sv'
                ? `Exportera A4-kort (${filteredTerms.length})`
                : `Export A4 Cards (${filteredTerms.length})`}
            </span>
          </button>
        )}
      </div>

      {/* Terms Grid */}
      {filteredTerms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleTerms.map((term) => (
            <TermCard
              key={term.id}
              term={term}
              lang={lang}
              isFavorite={favorites.includes(term.id)}
              isMastered={mastered.includes(term.id)}
              onToggleFavorite={onToggleFavorite}
              onToggleMastered={onToggleMastered}
              searchQuery={searchQuery}
              showChinese={showChinese}
              showEnglish={showEnglish}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">{t.noResults}</h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {lang === 'sv'
                ? 'Inga termer matchade dina filterkriterier. Prova att rensa sökningen eller välja en annan bokstav.'
                : lang === 'zh'
                ? '未找到符合条件的专业术语，请尝试清空搜索词或切换字母/分类标签。'
                : 'No terms matched your search filters. Try clearing your search query or choosing another letter.'}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm shadow-xs hover:bg-amber-400 transition"
            >
              {t.clearFilters}
            </button>
          )}
        </div>
      )}

      {/* Pagination / Load More */}
      {filteredTerms.length > displayCount && (
        <div className="text-center pt-4 pb-8 space-y-3">
          <div ref={loadMoreSentinelRef} className="h-4 w-full" aria-hidden="true" />
          <button
            id="load-more-btn"
            onClick={() => setDisplayCount((prev) => prev + 40)}
            className="px-6 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition shadow-xs"
          >
            {lang === 'sv'
              ? `Visa fler termer (${visibleTerms.length} av ${filteredTerms.length})`
              : lang === 'zh'
              ? `加载更多词汇 (已显示 ${visibleTerms.length} / 共 ${filteredTerms.length} 条)`
              : `Load more terms (${visibleTerms.length} of ${filteredTerms.length})`}
          </button>
        </div>
      )}

      {/* A4 Printable Flashcard Generator Modal */}
      <A4PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        initialScope="current"
        currentFilteredTerms={filteredTerms}
        allTerms={terms}
        favorites={favorites}
        needsReview={needsReview}
        lang={lang}
      />
    </div>
  );
};
