import React from 'react';
import { ActiveTab, Language } from '../types';
import { BookOpen, Layers, Award, Star } from 'lucide-react';
import { I18N } from '../data/i18n';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  favoritesCount: number;
  needsReviewCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  lang,
  favoritesCount,
  needsReviewCount,
}) => {
  const t = I18N[lang];
  const totalBadges = favoritesCount + needsReviewCount;

  const tabs = [
    {
      id: 'dictionary' as ActiveTab,
      label: t.navDictionary,
      icon: BookOpen,
      badge: 0,
    },
    {
      id: 'flashcards' as ActiveTab,
      label: t.navFlashcards,
      icon: Layers,
      badge: 0,
    },
    {
      id: 'quiz' as ActiveTab,
      label: t.navQuiz,
      icon: Award,
      badge: 0,
    },
    {
      id: 'favorites' as ActiveTab,
      label: t.navFavorites,
      icon: Star,
      badge: totalBadges,
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobil huvudnavigering"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-[env(safe-area-inset-bottom)] sm:hidden shadow-lg select-none"
    >
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id);
                // iPhone 14 Haptic Touch Feedback
                if (typeof window !== 'undefined' && window.navigator?.vibrate) {
                  try {
                    window.navigator.vibrate(10);
                  } catch (e) {
                    // Ignore if not permitted
                  }
                }
              }}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 relative transition-all active:scale-95 ${
                isActive ? 'text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {/* Active Upper Highlight Indicator */}
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-amber-500 rounded-b-full shadow-xs" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'scale-100'
                  } ${tab.id === 'favorites' && favoritesCount > 0 ? 'fill-amber-400 text-amber-500' : ''}`}
                />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-3 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] mt-1 tracking-tight truncate max-w-full font-medium">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
