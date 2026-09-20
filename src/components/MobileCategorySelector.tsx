import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Tag, X } from 'lucide-react';
import { TermCategory, Language } from '../types';
import { CATEGORIES } from '../data/categories';

interface MobileCategorySelectorProps {
  selectedCategory: string;
  onSelectCategory: (categoryKey: string) => void;
  categoryCounts: Record<string, number>;
  lang: Language;
  totalTermsCount: number;
}

export const MobileCategorySelector: React.FC<MobileCategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  lang,
  totalTermsCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (key: string) => {
    onSelectCategory(key);
    setIsOpen(false);
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(8);
      } catch (e) {}
    }
  };

  const isAll = selectedCategory === 'ALL';
  const activeCat = !isAll ? CATEGORIES[selectedCategory as TermCategory] : null;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-300">
      {/* Collapsible Accordion Header */}
      <button
        type="button"
        id="category-collapse-toggle"
        onClick={() => {
          setIsOpen(!isOpen);
          if (typeof window !== 'undefined' && window.navigator?.vibrate) {
            try {
              window.navigator.vibrate(6);
            } catch (e) {}
          }
        }}
        className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between bg-slate-50/80 hover:bg-slate-100/90 active:bg-slate-200/60 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            {lang === 'zh' ? '专业分类筛选' : lang === 'sv' ? 'Fackkategorier' : 'Categories'}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
              isAll
                ? 'bg-slate-900 text-white border-slate-900'
                : `${activeCat?.bg} ${activeCat?.text} ${activeCat?.border}`
            }`}
          >
            {activeCat && <span>{activeCat.icon}</span>}
            <span>
              {isAll
                ? lang === 'zh' ? '全部领域' : lang === 'sv' ? 'Alla områden' : 'All Domains'
                : activeCat?.name[lang]}
            </span>
            <span className="opacity-80 font-mono text-[10px]">
              ({isAll ? totalTermsCount : categoryCounts[selectedCategory] || 0})
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold shrink-0">
          <span>
            {isOpen
              ? lang === 'zh' ? '收起' : lang === 'sv' ? 'Dölj' : 'Collapse'
              : lang === 'zh' ? '切换类别' : lang === 'sv' ? 'Välj' : 'Select'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-600" />
          )}
        </div>
      </button>

      {/* Accordion Pills Body */}
      {isOpen && (
        <div className="p-3 bg-white border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* ALL Option */}
            <button
              id="cat-mobile-all"
              onClick={() => handleSelect('ALL')}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                isAll
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>📚</span>
                <span>{lang === 'zh' ? '全部工程领域' : lang === 'sv' ? 'Alla områden' : 'All Categories'}</span>
              </div>
              <span className="font-mono text-[11px] opacity-80 font-semibold">({totalTermsCount})</span>
            </button>

            {/* Individual Categories */}
            {(Object.keys(CATEGORIES) as TermCategory[]).map((catKey) => {
              const cat = CATEGORIES[catKey];
              const isSelected = selectedCategory === catKey;
              const count = categoryCounts[catKey] || 0;

              return (
                <button
                  key={catKey}
                  id={`cat-mobile-${catKey}`}
                  onClick={() => handleSelect(catKey)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between border ${
                    isSelected
                      ? `${cat.bg} ${cat.text} ${cat.border} ring-2 ring-amber-400 font-bold shadow-xs`
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="text-base">{cat.icon}</span>
                    <span className="truncate">{cat.name[lang]}</span>
                  </div>
                  <span className="font-mono text-[11px] opacity-75 shrink-0 font-medium">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
