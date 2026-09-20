import React, { useState, useMemo } from 'react';
import {
  Star,
  XCircle,
  BookOpen,
  Layers,
  Copy,
  Check,
  Award,
  Database,
  Printer,
} from 'lucide-react';
import { ConstructionTerm, Language, QuizScope, UserProgress } from '../types';
import { I18N } from '../data/i18n';
import { TermCard } from './TermCard';
import { MemoryDashboard } from './MemoryDashboard';
import { DataBackupModal } from './DataBackupModal';
import { A4PrintModal } from './A4PrintModal';

interface FavoritesViewProps {
  terms: ConstructionTerm[];
  lang: Language;
  favorites: string[];
  mastered: string[];
  needsReview: string[];
  progress: UserProgress;
  onToggleFavorite: (id: string) => void;
  onToggleMastered: (id: string) => void;
  onStartFlashcardWithFiltered: () => void;
  onStartQuizWithScope?: (scope: QuizScope) => void;
  onRestoreProgress: (imported: UserProgress, mode: 'overwrite' | 'merge') => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  terms,
  lang,
  favorites,
  mastered,
  needsReview,
  progress,
  onToggleFavorite,
  onToggleMastered,
  onStartFlashcardWithFiltered,
  onStartQuizWithScope,
  onRestoreProgress,
}) => {
  const [subTab, setSubTab] = useState<'favorites' | 'needsReview'>('favorites');
  const [copied, setCopied] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const t = I18N[lang];

  const favoriteTerms = useMemo(() => {
    return terms.filter((term) => favorites.includes(term.id));
  }, [terms, favorites]);

  const reviewTerms = useMemo(() => {
    return terms.filter((term) => needsReview.includes(term.id));
  }, [terms, needsReview]);

  const activeTerms = subTab === 'favorites' ? favoriteTerms : reviewTerms;

  const handleExportText = () => {
    const lines = activeTerms.map(
      (term) => `${term.term}\t${term.translationZh}\t${term.translationEn}\t${term.explanationSv}`
    );
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div id="favorites-view" className="space-y-6">
      {/* 1. Memory Retention Dashboard with Ring Progress & 7-Day Forecast */}
      <MemoryDashboard
        terms={terms}
        lang={lang}
        progress={progress}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onStartFlashcards={onStartFlashcardWithFiltered}
      />

      {/* 2. Sub-Tabs Header & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Sub-Tabs: Favorites vs Mistakes */}
        <div className="flex items-center space-x-2">
          <button
            id="tab-favorites-sub"
            onClick={() => setSubTab('favorites')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              subTab === 'favorites'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Star className="w-4 h-4 fill-amber-400" />
            <span>{t.navFavorites}</span>
            <span className="font-mono text-xs opacity-80">({favorites.length})</span>
          </button>

          <button
            id="tab-review-sub"
            onClick={() => setSubTab('needsReview')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
              subTab === 'needsReview'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>{t.needsReview}</span>
            <span className="font-mono text-xs opacity-80">({needsReview.length})</span>
          </button>
        </div>

        {/* Actions: Direct Quiz, Flashcard Jump, Copy Text & Backup */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {activeTerms.length > 0 && (
            <>
              <button
                onClick={handleExportText}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Kopiera lista till urklipp"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copied : 'Kopiera lista'}</span>
              </button>

              {onStartQuizWithScope && (
                <button
                  onClick={() => onStartQuizWithScope(subTab === 'favorites' ? 'favorites' : 'needsReview')}
                  className="px-3 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>{subTab === 'favorites' ? '仅测收藏词' : '定向测错题'}</span>
                </button>
              )}

              <button
                onClick={onStartFlashcardWithFiltered}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'sv' ? 'Öva med kort' : '闪卡巩固'}</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            title={t.exportA4Print}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.exportA4Print}</span>
          </button>

          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition"
            title={t.dataBackup}
          >
            <Database className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === 'sv' ? 'Backup / Återställ' : lang === 'zh' ? '备份/恢复' : 'Backup'}</span>
          </button>
        </div>
      </div>

      {/* Grid of Terms */}
      {activeTerms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTerms.map((term) => (
            <TermCard
              key={term.id}
              term={term}
              lang={lang}
              isFavorite={favorites.includes(term.id)}
              isMastered={mastered.includes(term.id)}
              onToggleFavorite={onToggleFavorite}
              onToggleMastered={onToggleMastered}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            {subTab === 'favorites' ? <Star className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              {subTab === 'favorites'
                ? lang === 'sv'
                  ? 'Inga sparade favoriter ännu'
                  : '暂无收藏的术语'
                : lang === 'sv'
                ? 'Inga termer behöver övas just nu'
                : '暂无待复习错题'}
            </h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {subTab === 'favorites'
                ? lang === 'sv'
                  ? 'Klicka på stjärnikonen på valfri term i ordboken för att spara den här.'
                  : '在词典中点击星星图标即可将难词加入专属收藏夹。'
                : lang === 'sv'
                ? 'Termer som du markerar med "Behöver öva" eller svarar fel på i testet samlas här.'
                : '在闪卡或测试中答错或标记为需巩固的词汇将自动进入复习队列。'}
            </p>
          </div>
        </div>
      )}

      {/* 3. Offline Data Backup & Restore Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        lang={lang}
        terms={terms}
        progress={progress}
        onRestoreProgress={onRestoreProgress}
      />

      {/* 4. A4 Flashcard Print & PDF Export Modal */}
      <A4PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        initialScope={subTab === 'favorites' ? 'favorites' : 'needsReview'}
        currentFilteredTerms={activeTerms}
        allTerms={terms}
        favorites={favorites}
        needsReview={needsReview}
        lang={lang}
      />
    </div>
  );
};
