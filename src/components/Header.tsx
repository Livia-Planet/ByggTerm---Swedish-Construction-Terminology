import React from 'react';
import {
  BookOpen,
  Layers,
  Award,
  Star,
  HardHat,
  Globe,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ActiveTab, Language } from '../types';
import { I18N } from '../data/i18n';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  totalTermsCount: number;
  masteredCount: number;
  favoritesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  totalTermsCount,
  masteredCount,
  favoritesCount,
}) => {
  const t = I18N[lang];

  return (
    <header id="app-header" className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <HardHat className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  ByggTerm
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                    A–Ä
                  </span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-normal">
                {lang === 'sv'
                  ? 'Facktermer inom Bygg & Anläggning'
                  : lang === 'zh'
                  ? '瑞典语建筑工程专业术语三语学习应用'
                  : 'Swedish Construction & Civil Engineering Terminology'}
              </p>
            </div>
          </div>

          {/* Right Controls: Stats & Language Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Quick Stats Pill */}
            <div className="hidden md:flex items-center space-x-3 bg-slate-800/80 px-3.5 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-300">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  <strong className="text-white font-semibold">{totalTermsCount}</strong> {t.totalTerms}
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  <strong>{masteredCount}</strong> {t.mastered}
                </span>
              </div>
              {favoritesCount > 0 && (
                <>
                  <span className="text-slate-600">|</span>
                  <div className="flex items-center space-x-1.5 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{favoritesCount}</span>
                  </div>
                </>
              )}
            </div>

            {/* Language Selector */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700/60 text-xs sm:text-sm">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1 hidden sm:inline" />
              <button
                id="lang-btn-sv"
                onClick={() => setLang('sv')}
                className={`px-2 py-1 rounded transition font-medium ${
                  lang === 'sv'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Svenska"
              >
                SV
              </button>
              <button
                id="lang-btn-zh"
                onClick={() => setLang('zh')}
                className={`px-2 py-1 rounded transition font-medium ${
                  lang === 'zh'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="中文"
              >
                中文
              </button>
              <button
                id="lang-btn-en"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded transition font-medium ${
                  lang === 'en'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* In-App PWA Installation Trigger */}
            <PWAInstallButton lang={lang} />
          </div>
        </div>

        {/* Tab Navigation: Visible on desktop, transitioned to BottomNav on mobile */}
        <nav className="hidden md:flex space-x-2 border-t border-slate-800/80 pt-1 pb-2 overflow-x-auto no-scrollbar">
          <button
            id="tab-btn-dictionary"
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'dictionary'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.navDictionary}</span>
            <span
              className={`text-xs px-1.5 py-0.2 rounded-full ${
                activeTab === 'dictionary'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {totalTermsCount}
            </span>
          </button>

          <button
            id="tab-btn-flashcards"
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'flashcards'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.navFlashcards}</span>
          </button>

          <button
            id="tab-btn-quiz"
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>{t.navQuiz}</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </button>

          <button
            id="tab-btn-favorites"
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Star className={`w-4 h-4 ${favoritesCount > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{t.navFavorites}</span>
            {favoritesCount > 0 && (
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'favorites'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {favoritesCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};
