import React, { useState, memo } from 'react';
import {
  Volume2,
  Star,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { ConstructionTerm, Language } from '../types';
import { CATEGORIES } from '../data/categories';
import { I18N } from '../data/i18n';
import { speakText, speakSwedish } from '../utils/tts';
import { highlightMatch } from '../utils/highlight';

interface TermCardProps {
  term: ConstructionTerm;
  lang: Language;
  isFavorite: boolean;
  isMastered: boolean;
  onToggleFavorite: (id: string) => void;
  onToggleMastered: (id: string) => void;
  searchQuery?: string;
  showEnglish?: boolean;
  showChinese?: boolean;
}

export const TermCard: React.FC<TermCardProps> = memo(({
  term,
  lang,
  isFavorite,
  isMastered,
  onToggleFavorite,
  onToggleMastered,
  searchQuery = '',
  showEnglish = true,
  showChinese = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [speakingTarget, setSpeakingTarget] = useState<'term' | 'explanation' | 'example' | null>(null);
  const t = I18N[lang];
  const cat = CATEGORIES[term.category] || CATEGORIES.tools;

  const handleSpeak = (e: React.MouseEvent, target: 'term' | 'explanation' | 'example', text: string) => {
    e.stopPropagation();

    // Haptic feedback on tap
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(6);
      } catch (err) {}
    }

    // If already speaking this target, clicking stops it
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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(8);
      } catch (err) {}
    }
    let textToCopy = `${term.term}\nSvenska: ${term.explanationSv}\nKinesiska: ${term.translationZh}\nEngelska: ${term.translationEn}`;
    if (term.exampleSv) {
      textToCopy += `\nExempel: ${term.exampleSv}`;
      if (term.exampleZh) {
        textToCopy += ` (${term.exampleZh})`;
      }
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(10);
      } catch (err) {}
    }
    onToggleFavorite(term.id);
  };

  const handleMasteredClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
      try {
        window.navigator.vibrate(12);
      } catch (err) {}
    }
    onToggleMastered(term.id);
  };

  // Highlight search matches using cached regex utility
  const highlight = (text: string) => highlightMatch(text, searchQuery);

  return (
    <article
      id={`term-card-${term.id}`}
      className={`group relative rounded-2xl border transition-all duration-200 bg-white shadow-xs hover:shadow-md ${
        isMastered
          ? 'border-emerald-300 bg-emerald-50/20'
          : isFavorite
          ? 'border-amber-300 bg-amber-50/10'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Card Header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          {/* Term Title & Pronounce */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                {highlight(term.term)}
              </h3>
              {/* Swedish Pronounce Audio Button for Term (44px HIG Touch Area) */}
              <button
                id={`pronounce-btn-${term.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                    try { window.navigator.vibrate(6); } catch (err) {}
                  }
                  speakText(term.term, 'sv-SE');
                }}
                className="min-w-[44px] min-h-[44px] p-2 flex items-center justify-center rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 active:scale-90 transition-all"
                title="朗读瑞典语发音"
                aria-label="朗读发音"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Category Tag */}
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${cat.bg} ${cat.text} ${cat.border}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name[lang]}</span>
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                #{term.letter}
              </span>
            </div>
          </div>

          {/* Action Buttons: Star, Mastered, Copy (44x44px Touch Targets) */}
          <div className="flex items-center space-x-0.5 shrink-0">
            {/* Copy button */}
            <button
              id={`copy-btn-${term.id}`}
              onClick={handleCopy}
              className="min-w-[44px] min-h-[44px] p-2 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90 transition-all"
              title={copied ? t.copied : t.copy}
              aria-label="Kopiera term"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>

            {/* Star button */}
            <button
              id={`favorite-btn-${term.id}`}
              onClick={handleFavoriteClick}
              className={`min-w-[44px] min-h-[44px] p-2 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                isFavorite
                  ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
              }`}
              title={isFavorite ? t.removeFavorite : t.addFavorite}
              aria-label="Bokmärk term"
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>

            {/* Mastered button */}
            <button
              id={`master-btn-${term.id}`}
              onClick={handleMasteredClick}
              className={`min-w-[44px] min-h-[44px] p-2 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                isMastered
                  ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
              }`}
              title={isMastered ? t.markReview : t.markMastered}
              aria-label="Markera som behärskad"
            >
              <CheckCircle2 className={`w-5 h-5 ${isMastered ? 'fill-emerald-600 text-white' : ''}`} />
            </button>
          </div>
        </div>

        {/* Swedish Explanation (Förklaring) with Independent TTS Button */}
        <div className="mt-2 p-3.5 rounded-xl bg-slate-50/90 border border-slate-100 text-slate-800 text-sm leading-relaxed">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
              🇸🇪 {t.swedishDesc}
            </span>
            <button
              id={`pronounce-exp-btn-${term.id}`}
              onClick={(e) => handleSpeak(e, 'explanation', term.explanationSv)}
              className={`min-h-[38px] px-2.5 py-1 rounded-lg border transition-all text-xs flex items-center gap-1.5 active:scale-95 ${
                speakingTarget === 'explanation'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs font-bold'
                  : 'border-slate-200 bg-white text-slate-700 hover:text-amber-900 hover:bg-amber-50/60'
              }`}
              title={t.playExplanation}
              aria-label={`Uttal av förklaring för ${term.term}`}
            >
              <Volume2 className={`w-4 h-4 ${speakingTarget === 'explanation' ? 'animate-pulse text-amber-600' : ''}`} />
              <span className="text-[11px] font-mono font-medium">0.85x</span>
            </button>
          </div>
          <p className="font-sans text-slate-800 font-normal">
            {highlight(term.explanationSv)}
          </p>
        </div>

        {/* Swedish Example Sentence (Exempel) with Independent TTS Button */}
        {term.exampleSv && (
          <div className="mt-2.5 p-3 rounded-xl bg-amber-50/30 border border-amber-200/60 text-xs sm:text-sm">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-bold text-amber-900 text-xs flex items-center gap-1">
                🔨 {t.example}
              </span>
              <button
                id={`pronounce-example-btn-${term.id}`}
                onClick={(e) => handleSpeak(e, 'example', term.exampleSv!)}
                className={`min-h-[38px] px-2.5 py-1 rounded-lg border transition-all text-xs flex items-center gap-1.5 active:scale-95 ${
                  speakingTarget === 'example'
                    ? 'bg-amber-200 text-amber-950 border-amber-400 shadow-xs font-bold'
                    : 'border-amber-200 bg-white text-amber-800 hover:bg-amber-100/60'
                }`}
                title={t.playExample}
                aria-label={`Uttal av exempel för ${term.term}`}
              >
                <Volume2 className={`w-4 h-4 ${speakingTarget === 'example' ? 'animate-pulse text-amber-700' : ''}`} />
                <span className="text-[11px] font-mono font-medium">0.85x</span>
              </button>
            </div>
            <p className="font-medium text-slate-800 italic mb-0.5">
              "{highlight(term.exampleSv)}"
            </p>
            {term.exampleZh && (
              <p className="text-slate-600 text-xs">
                {term.exampleZh}
              </p>
            )}
          </div>
        )}

        {/* Trilingual Translations (Chinese & English) */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs sm:text-sm">
          {showChinese && (
            <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-100/80">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  🇨🇳 {t.chineseTrans}
                </span>
                <button
                  id={`pronounce-zh-btn-${term.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                      try { window.navigator.vibrate(6); } catch (err) {}
                    }
                    speakText(term.translationZh, 'zh-CN');
                  }}
                  className="min-w-[40px] min-h-[40px] p-1.5 flex items-center justify-center text-slate-400 hover:text-amber-600 active:scale-90 transition-colors"
                  title="朗读中文发音"
                  aria-label="朗读中文发音"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-900 font-semibold leading-snug">
                {highlight(term.translationZh)}
              </p>
            </div>
          )}

          {showEnglish && (
            <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-100/80">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 block mb-1">
                🇬🇧 {t.englishTrans}
              </span>
              <p className="text-slate-900 font-semibold leading-snug">
                {highlight(term.translationEn)}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
});

TermCard.displayName = 'TermCard';
