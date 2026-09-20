import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  X,
  Scissors,
  Layers,
  FileText,
  HardHat,
  Star,
  XCircle,
  CheckSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ConstructionTerm, Language } from '../types';
import { CATEGORIES } from '../data/categories';
import { I18N } from '../data/i18n';

export type PrintScope = 'current' | 'needsReview' | 'favorites' | 'all';
export type CardMode = 'field' | 'folding';

interface A4PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScope?: PrintScope;
  currentFilteredTerms: ConstructionTerm[];
  allTerms: ConstructionTerm[];
  favorites: string[];
  needsReview: string[];
  lang: Language;
}

const CARDS_PER_PAGE = 9; // 3 x 3 A4 grid

export const A4PrintModal: React.FC<A4PrintModalProps> = ({
  isOpen,
  onClose,
  initialScope = 'current',
  currentFilteredTerms,
  allTerms,
  favorites,
  needsReview,
  lang,
}) => {
  const [scope, setScope] = useState<PrintScope>(initialScope);
  const [includeExamples, setIncludeExamples] = useState<boolean>(true);
  const [cardMode, setCardMode] = useState<CardMode>('field');
  const [previewPageIndex, setPreviewPageIndex] = useState<number>(0);

  const t = I18N[lang];

  // Resolve terms for chosen scope
  const selectedTerms = useMemo(() => {
    switch (scope) {
      case 'needsReview':
        return allTerms.filter((term) => needsReview.includes(term.id));
      case 'favorites':
        return allTerms.filter((term) => favorites.includes(term.id));
      case 'all':
        return allTerms;
      case 'current':
      default:
        return currentFilteredTerms.length > 0 ? currentFilteredTerms : allTerms;
    }
  }, [scope, currentFilteredTerms, allTerms, favorites, needsReview]);

  // Group terms into pages of 9 cards
  const pages = useMemo(() => {
    const chunked: ConstructionTerm[][] = [];
    for (let i = 0; i < selectedTerms.length; i += CARDS_PER_PAGE) {
      chunked.push(selectedTerms.slice(i, i + CARDS_PER_PAGE));
    }
    return chunked;
  }, [selectedTerms]);

  const totalPages = Math.max(1, pages.length);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 1. On-Screen Interactive Modal (Hidden during printing via .print-hide) */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print-hide animate-in fade-in duration-200">
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
          role="dialog"
          aria-modal="true"
        >
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>{t.exportA4Print}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-semibold border border-amber-300">
                    A4 • 3×3 (9 {lang === 'sv' ? 'kort/sida' : lang === 'zh' ? '张/页' : 'cards/page'})
                  </span>
                </h3>
                <p className="text-xs text-slate-500 hidden sm:block">
                  {t.exportA4PrintDesc}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition"
              title={t.printClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Config Controls Bar */}
          <div className="p-4 sm:p-5 bg-white border-b border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Scope Selector */}
              <div>
                <label className="font-bold text-slate-700 mb-1.5 block">
                  {t.printScopeLabel}
                </label>
                <select
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value as PrintScope);
                    setPreviewPageIndex(0);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="current">
                    {t.printScopeCurrent} ({currentFilteredTerms.length})
                  </option>
                  <option value="needsReview">
                    {t.printScopeNeedsReview} ({needsReview.length})
                  </option>
                  <option value="favorites">
                    {t.printScopeFavorites} ({favorites.length})
                  </option>
                  <option value="all">
                    {t.printScopeAll} ({allTerms.length})
                  </option>
                </select>
              </div>

              {/* Mode Selector (Field 3x3 vs Folding) */}
              <div>
                <label className="font-bold text-slate-700 mb-1.5 block">
                  {t.printCardMode}
                </label>
                <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCardMode('field')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition ${
                      cardMode === 'field'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.printModeFieldCards}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardMode('folding')}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition ${
                      cardMode === 'folding'
                        ? 'bg-white text-slate-900 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {t.printModeFolding}
                  </button>
                </div>
              </div>

              {/* Toggle Examples */}
              <div>
                <label className="font-bold text-slate-700 mb-1.5 block">
                  {lang === 'sv' ? 'Innehållsval' : lang === 'zh' ? '卡片内容选项' : 'Content Options'}
                </label>
                <button
                  type="button"
                  onClick={() => setIncludeExamples(!includeExamples)}
                  className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between font-semibold transition ${
                    includeExamples
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-slate-50 border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t.printIncludeExamples}</span>
                  </span>
                  <span className={`w-2 h-2 rounded-full ${includeExamples ? 'bg-amber-500' : 'bg-slate-300'}`} />
                </button>
              </div>

              {/* Action Print Button */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={handlePrint}
                  disabled={selectedTerms.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t.printCardsBtn}</span>
                </button>
              </div>
            </div>

            {/* Summary & Page Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">
                  {t.printSummary(selectedTerms.length, totalPages)}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 flex items-center gap-1">
                  <Scissors className="w-3 h-3 text-slate-400" />
                  <span>
                    {lang === 'sv'
                      ? 'Klipplinjer & vikmarkeringar ingår'
                      : lang === 'zh'
                      ? '已预设裁剪虚线与边角导引'
                      : 'Cutting guides included'}
                  </span>
                </span>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500 mr-1 font-mono">
                    {lang === 'sv' ? 'Förhandsgranska sida' : lang === 'zh' ? '预览第' : 'Page'}{' '}
                    {previewPageIndex + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
                    disabled={previewPageIndex === 0}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={previewPageIndex === totalPages - 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Screen Preview Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
            {selectedTerms.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center max-w-md my-auto border border-slate-200 space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800">
                  {lang === 'sv' ? 'Inga kort i detta urval' : '当前所选范围无词汇'}
                </h4>
                <p className="text-xs text-slate-500">
                  {lang === 'sv'
                    ? 'Välj ett annat utskriftsurval i menyn ovan.'
                    : '请在上方切换为“全词库”或“当前筛选结果”。'}
                </p>
              </div>
            ) : (
              /* Realistic A4 Preview Sheet Representation */
              <div
                className="bg-white rounded-xl shadow-lg border border-slate-300 w-full max-w-[780px] p-5 sm:p-7 flex flex-col justify-between"
                style={{ minHeight: '620px' }}
              >
                {/* A4 Sheet Header */}
                <div className="pb-3 mb-3 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-2">
                    <HardHat className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-slate-900 tracking-wide">
                      ByggTerm • Facktermer inom Bygg & Anläggning
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 font-mono text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                      A4 Sida {previewPageIndex + 1} / {totalPages}
                    </span>
                    <span className="text-slate-400">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* 3x3 Card Grid */}
                <div className="grid grid-cols-3 gap-3 flex-1">
                  {(pages[previewPageIndex] || []).map((term, index) => (
                    <PreviewCardItem
                      key={term.id}
                      term={term}
                      index={index}
                      cardMode={cardMode}
                      includeExamples={includeExamples}
                    />
                  ))}
                  {/* Fill empty slots if last page has fewer than 9 cards */}
                  {Array.from({
                    length: CARDS_PER_PAGE - (pages[previewPageIndex]?.length || 0),
                  }).map((_, emptyIdx) => (
                    <div
                      key={`empty-${emptyIdx}`}
                      className="border border-dashed border-slate-200 rounded-lg bg-slate-50/50 flex items-center justify-center text-slate-300 text-[10px]"
                    >
                      <span>✂ ByggTerm</span>
                    </div>
                  ))}
                </div>

                {/* A4 Sheet Footer */}
                <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Scissors className="w-3 h-3 text-slate-400" />
                    <span>
                      {lang === 'sv'
                        ? 'Klipp längs de streckade linjerna • Standardformat för ficka/verktygslåda'
                        : lang === 'zh'
                        ? '沿虚线剪裁后随身携带 • 适合工装口袋与施工现场即查即记'
                        : 'Cut along dashed lines • Field pocket format'}
                    </span>
                  </span>
                  <span>Standard SS-EN / AMA / BBR Compliant Vocabulary</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Pure Dedicated Print Document mounted directly to document.body (Isolates print DOM from #root) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div id="a4-print-document" className="hidden print:block">
            {pages.map((pageTerms, pageIndex) => (
              <div key={`print-page-${pageIndex}`} className="a4-page-sheet">
                {/* Page Header */}
                <div className="a4-print-header">
                  <div className="a4-header-left">
                    <strong>ByggTerm</strong> — Facktermer inom Bygg & Anläggning (Svenska • 中文 • English)
                  </div>
                  <div className="a4-header-right">
                    Sida {pageIndex + 1} / {totalPages} • {new Date().toLocaleDateString('sv-SE')}
                  </div>
                </div>

                {/* 3x3 Card Grid */}
                <div className="a4-card-grid">
                  {pageTerms.map((term, cardIdx) => (
                    <PrintCardItem
                      key={`print-${term.id}-${cardIdx}`}
                      term={term}
                      cardMode={cardMode}
                      includeExamples={includeExamples}
                    />
                  ))}
                  {/* Blank filler boxes for 9-grid alignment */}
                  {Array.from({
                    length: CARDS_PER_PAGE - pageTerms.length,
                  }).map((_, emptyIdx) => (
                    <div key={`print-empty-${emptyIdx}`} className="a4-flashcard a4-empty-card a4-card-item">
                      <div className="empty-content">✂ ByggTerm</div>
                    </div>
                  ))}
                </div>

                {/* Page Footer */}
                <div className="a4-print-footer">
                  <span>✂ Klipp längs de streckade linjerna • Praktisk storlek för ficka och arbetskläder</span>
                  <span>ByggTerm Trilingual Field Reference • AMA / BBR</span>
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};

/**
 * On-Screen Card Preview Item
 */
const PreviewCardItem: React.FC<{
  term: ConstructionTerm;
  index: number;
  cardMode: CardMode;
  includeExamples: boolean;
}> = ({ term, cardMode, includeExamples }) => {
  const cat = CATEGORIES[term.category] || CATEGORIES.materials;

  return (
    <div className="border border-dashed border-slate-300 rounded-lg p-2.5 flex flex-col justify-between bg-white text-left relative text-xs hover:border-amber-400 transition">
      {/* Cut corner indicator */}
      <span className="absolute top-0 right-0 p-0.5 text-[8px] text-slate-300">
        ✂
      </span>

      <div>
        {/* Category & Letter Header */}
        <div className="flex items-center justify-between gap-1 pb-1 mb-1 border-b border-slate-100">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600">
            <span>{cat.icon}</span>
            <span className="truncate max-w-[80px]">{cat.nameSv}</span>
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
            {term.letter}-{term.id.split('-')[1] || '01'}
          </span>
        </div>

        {/* Swedish Term */}
        <h4 className="font-black text-slate-900 text-xs sm:text-sm leading-snug tracking-tight">
          {term.term}
        </h4>

        {/* Folding Midline Indicator */}
        {cardMode === 'folding' && (
          <div className="my-1.5 border-t border-dashed border-amber-300 relative text-center">
            <span className="bg-white px-1 text-[8px] text-amber-700 font-mono absolute -top-2 left-1/2 -translate-x-1/2">
              -- VIKLINJE / 折叠线 --
            </span>
          </div>
        )}

        {/* Chinese & English Translations */}
        <div className="mt-1 space-y-0.5">
          <p className="font-bold text-amber-900 text-[11px] leading-tight">
            {term.translationZh}
          </p>
          <p className="text-slate-500 text-[10px] italic leading-tight">
            {term.translationEn}
          </p>
        </div>

        {/* Swedish Concise Definition */}
        <p className="mt-1 text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
          {term.explanationSv}
        </p>
      </div>

      {/* Practical Jobsite Example Box */}
      {includeExamples && term.exampleSv && (
        <div className="mt-1.5 pt-1 border-t border-slate-100 bg-amber-50/70 p-1.5 rounded text-[9.5px] space-y-0.5">
          <p className="text-amber-950 font-medium italic line-clamp-2 leading-tight">
            "{term.exampleSv}"
          </p>
          {term.exampleZh && (
            <p className="text-amber-800 text-[9px] line-clamp-1">
              {term.exampleZh}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Dedicated Print Card Item (Optimized for High-Contrast Crisp Ink on Paper)
 */
const PrintCardItem: React.FC<{
  term: ConstructionTerm;
  cardMode: CardMode;
  includeExamples: boolean;
}> = ({ term, cardMode, includeExamples }) => {
  const cat = CATEGORIES[term.category] || CATEGORIES.materials;

  return (
    <div className="a4-flashcard print-card a4-card-item">
      <div className="card-inner">
        {/* Card Header */}
        <div className="card-header">
          <span className="category-tag">
            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-text">{cat.nameSv}</span>
          </span>
          <span className="term-code font-mono">
            {term.letter}-{term.id.split('-')[1] || '01'}
          </span>
        </div>

        {/* Swedish Term */}
        <div className="term-title">
          {term.term}
        </div>

        {/* Folding Midline */}
        {cardMode === 'folding' && (
          <div className="fold-line">
            <span>--- VIKLINJE (FOLD) ---</span>
          </div>
        )}

        {/* Translations */}
        <div className="translation-section">
          <div className="zh-translation">{term.translationZh}</div>
          <div className="en-translation">{term.translationEn}</div>
        </div>

        {/* Swedish Definition */}
        <div className="swedish-definition">
          {term.explanationSv}
        </div>

        {/* Jobsite Practical Example */}
        {includeExamples && term.exampleSv && (
          <div className="example-box">
            <div className="example-sv">
              <span className="icon">🔨</span>
              <span>"{term.exampleSv}"</span>
            </div>
            {term.exampleZh && (
              <div className="example-zh">{term.exampleZh}</div>
            )}
          </div>
        )}

        {/* Cut guide scissors mark */}
        <div className="cut-corner">✂</div>
      </div>
    </div>
  );
};
