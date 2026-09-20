import React, { useState, useEffect } from 'react';
import { ALL_TERMS } from './data/terms';
import { ActiveTab, Language } from './types';
import { Header } from './components/Header';
import { DictionaryView } from './components/DictionaryView';
import { FlashcardView } from './components/FlashcardView';
import { QuizView } from './components/QuizView';
import { FavoritesView } from './components/FavoritesView';
import { BottomNav } from './components/BottomNav';
import { useUserProgress } from './hooks/useUserProgress';
import { HardHat, Sparkles, BookOpen, Layers, Award, RotateCcw, AlertTriangle, Volume2 } from 'lucide-react';
import { subscribeStorageWarning, StorageWarning } from './utils/storage';
import { initTts, subscribeTtsWarning, TtsWarning } from './utils/tts';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dictionary');
  const [lang, setLang] = useState<Language>('zh'); // default to Chinese for the bilingual user, switchable to SV/EN anytime
  const [storageWarning, setStorageWarning] = useState<StorageWarning | null>(null);
  const [ttsWarning, setTtsWarning] = useState<TtsWarning | null>(null);

  useEffect(() => {
    // 提前触发静默 getVoices() 预热并绑定 iOS 触控解锁
    initTts();

    const unsubscribeStorage = subscribeStorageWarning((warning) => {
      setStorageWarning(warning);
    });

    const unsubscribeTts = subscribeTtsWarning((warning) => {
      setTtsWarning(warning);
      const timer = setTimeout(() => {
        setTtsWarning(null);
      }, 7000);
      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribeStorage();
      unsubscribeTts();
    };
  }, []);

  const {
    progress,
    toggleFavorite,
    toggleMastered,
    markNeedsReview,
    recordSrsReview,
    recordQuizResult,
    resetAllProgress,
    restoreProgress,
  } = useUserProgress();

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Persistent Global Header with Tabs and Stats */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        totalTermsCount={ALL_TERMS.length}
        masteredCount={progress.mastered.length}
        favoritesCount={progress.favorites.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 sm:pb-8">
        {activeTab === 'dictionary' && (
          <DictionaryView
            terms={ALL_TERMS}
            lang={lang}
            favorites={progress.favorites}
            mastered={progress.mastered}
            needsReview={progress.needsReview}
            srsRecords={progress.srsRecords}
            onToggleFavorite={toggleFavorite}
            onToggleMastered={toggleMastered}
            onNavigateToFlashcards={() => setActiveTab('flashcards')}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardView
            terms={ALL_TERMS}
            lang={lang}
            favorites={progress.favorites}
            mastered={progress.mastered}
            needsReview={progress.needsReview}
            srsRecords={progress.srsRecords}
            onToggleFavorite={toggleFavorite}
            onToggleMastered={toggleMastered}
            onMarkNeedsReview={markNeedsReview}
            onRecordSrsReview={recordSrsReview}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizView
            terms={ALL_TERMS}
            lang={lang}
            favorites={progress.favorites}
            needsReview={progress.needsReview}
            onRecordQuizResult={recordQuizResult}
            onMarkNeedsReview={markNeedsReview}
          />
        )}

        {activeTab === 'favorites' && (
          <FavoritesView
            terms={ALL_TERMS}
            lang={lang}
            favorites={progress.favorites}
            mastered={progress.mastered}
            needsReview={progress.needsReview}
            progress={progress}
            onToggleFavorite={toggleFavorite}
            onToggleMastered={toggleMastered}
            onStartFlashcardWithFiltered={() => setActiveTab('flashcards')}
            onStartQuizWithScope={() => setActiveTab('quiz')}
            onRestoreProgress={restoreProgress}
          />
        )}
      </main>

      {/* App Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500 mt-auto mb-16 sm:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <HardHat className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-700">ByggTerm</span>
            <span>— Facktermer inom Bygg och Anläggning (A–Ä, {ALL_TERMS.length} termer)</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (window.confirm(lang === 'sv' ? 'Vill du nollställa dina sparade framsteg?' : '确定要重置所有学习进度与错题记录吗？')) {
                  resetAllProgress();
                }
              }}
              className="text-slate-400 hover:text-rose-600 transition flex items-center gap-1"
              title="Återställ framsteg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'sv' ? 'Nollställ framsteg' : lang === 'zh' ? '重置学习进度' : 'Reset progress'}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Dock (iPhone 14 Thumb Ergonomics & Safe Area) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        favoritesCount={progress.favorites.length}
        needsReviewCount={progress.needsReview.length}
      />

      {/* Global TTS Audio Warning Toast (iOS Voice Pack & Audio Gesture Reminder) */}
      {ttsWarning && (
        <div className="fixed bottom-20 sm:bottom-5 right-3 sm:right-5 z-50 max-w-sm sm:max-w-md bg-slate-900/95 backdrop-blur-md border border-amber-500/40 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
          <Volume2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-400">
              {ttsWarning.type === 'voice-missing'
                ? '语音包提示 / Röstmeddelande'
                : ttsWarning.type === 'not-allowed'
                ? '手势播放限制 / Behörighet'
                : '语音播放提示'}
            </p>
            <p className="text-slate-300 mt-1 leading-relaxed">{ttsWarning.message}</p>
          </div>
          <button
            onClick={() => setTtsWarning(null)}
            className="text-slate-400 hover:text-white p-1 text-xs font-bold rounded"
            title="Stäng / 关闭"
          >
            ✕
          </button>
        </div>
      )}

      {/* Global Storage Warning Toast */}
      {storageWarning && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-amber-50 border-2 border-amber-300 text-amber-950 p-4 rounded-xl shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold">{storageWarning.title}</p>
            <p className="text-amber-800 mt-1 leading-relaxed">{storageWarning.message}</p>
          </div>
          <button
            onClick={() => setStorageWarning(null)}
            className="text-amber-600 hover:text-amber-900 p-1 text-xs font-bold rounded"
            title="Stäng / 关闭"
          >
            ✕
          </button>
        </div>
      )}

      {/* PWA Offline Mode Status Indicator */}
      <OfflineIndicator lang={lang} />
    </div>
  );
}
