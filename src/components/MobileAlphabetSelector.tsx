import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Grid, X, Check } from 'lucide-react';
import { Language } from '../types';

interface MobileAlphabetSelectorProps {
  selectedLetter: string;
  onSelectLetter: (letter: string) => void;
  alphabet: string[];
  termCountsByLetter: Record<string, number>;
  lang: Language;
  totalTermsCount: number;
}

export const MobileAlphabetSelector: React.FC<MobileAlphabetSelectorProps> = ({
  selectedLetter,
  onSelectLetter,
  alphabet,
  termCountsByLetter,
  lang,
  totalTermsCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (letter: string) => {
    onSelectLetter(letter);
    setIsOpen(false);
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(8);
      } catch (e) {
        // ignore
      }
    }
  };

  const isAll = selectedLetter === '' || selectedLetter === 'ALL';
  const currentCount = isAll
    ? totalTermsCount
    : termCountsByLetter[selectedLetter] || 0;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-300">
      {/* Collapsible Header Bar (Touch Target 48px) */}
      <button
        type="button"
        id="alphabet-collapse-toggle"
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
            <Grid className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800">
            {lang === 'zh' ? 'A–Ä 字母快速索引' : lang === 'sv' ? 'A–Ä Bokstavsregister' : 'A–Ä Alphabet Index'}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold bg-amber-500 text-slate-950 rounded-full shadow-2xs">
            <span>{isAll ? (lang === 'zh' ? '全部 A–Ä' : lang === 'sv' ? 'Alla A–Ä' : 'All A–Ä') : selectedLetter}</span>
            <span className="opacity-80 font-mono text-[10px]">({currentCount})</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold shrink-0">
          <span>
            {isOpen
              ? lang === 'zh' ? '收起' : lang === 'sv' ? 'Dölj' : 'Collapse'
              : lang === 'zh' ? '展开矩阵' : lang === 'sv' ? 'Visa alla' : 'Expand'}
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-600" />
          )}
        </div>
      </button>

      {/* Collapsible 6-Column Grid (Zero Horizontal Scrolling) */}
      {isOpen && (
        <div className="p-3 bg-white border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-[11px] text-slate-500">
            <span>
              {lang === 'zh'
                ? '点击任意字母直接筛选并自动折叠'
                : lang === 'sv'
                ? 'Tryck på en bokstav för att filtrera'
                : 'Tap a letter to filter'}
            </span>
            {!isAll && (
              <button
                onClick={() => handleSelect('ALL')}
                className="text-amber-600 font-bold hover:text-amber-800 flex items-center gap-0.5"
              >
                <X className="w-3 h-3" />
                <span>{lang === 'zh' ? '重置为全部' : lang === 'sv' ? 'Återställ' : 'Reset'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-7 md:grid-cols-10">
            {/* ALL Option */}
            <button
              id="letter-mobile-all"
              onClick={() => handleSelect('ALL')}
              className={`min-h-[44px] py-1.5 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                isAll
                  ? 'bg-slate-900 text-white shadow-xs scale-[1.02] ring-2 ring-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95'
              }`}
            >
              <span className="leading-tight">{lang === 'zh' ? '全部' : lang === 'sv' ? 'Alla' : 'All'}</span>
              <span className="text-[10px] opacity-75 font-mono">{totalTermsCount}</span>
            </button>

            {/* Alphabet list A to Ä */}
            {alphabet.map((letter) => {
              const count = termCountsByLetter[letter] || 0;
              const isSelected = selectedLetter === letter;

              return (
                <button
                  key={letter}
                  id={`letter-mobile-${letter}`}
                  onClick={() => handleSelect(letter)}
                  disabled={count === 0}
                  className={`min-h-[44px] py-1 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.04] ring-2 ring-amber-400 font-black'
                      : count > 0
                      ? 'bg-slate-50 hover:bg-amber-50 text-slate-800 border border-slate-200/80 active:scale-95'
                      : 'bg-slate-50 text-slate-300 border border-transparent cursor-not-allowed opacity-30'
                  }`}
                  aria-label={`${letter} (${count})`}
                >
                  <span className="text-sm font-extrabold leading-none">{letter}</span>
                  {count > 0 && (
                    <span
                      className={`text-[9.5px] mt-0.5 font-mono ${
                        isSelected ? 'text-slate-950 font-bold' : 'text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
