import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, HardHat } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language } from '../types';

interface OfflineIndicatorProps {
  lang: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ lang }) => {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowRestored(false);
    } else if (wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!isOnline) {
    return (
      <aside
        id="pwa-offline-indicator"
        aria-label="Offline Mode Notice"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-slate-900/95 text-amber-300 border border-amber-500/40 px-3.5 py-2 text-xs font-medium shadow-xl backdrop-blur-xs animate-in slide-in-from-bottom-2"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
        <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <span className="font-bold text-white">
            {lang === 'sv' ? 'Offlineläge' : lang === 'zh' ? '离线模式' : 'Offline Mode'}
          </span>
          <span className="text-slate-300 ml-1.5 hidden sm:inline">
            {lang === 'sv'
              ? 'Alla 700+ byggtermer och funktioner är tillgängliga offline.'
              : lang === 'zh'
              ? '全部 700+ 词条及测验卡片已在本地缓存，支持弱网施工现场流畅使用。'
              : 'All 700+ terms are cached and available offline.'}
          </span>
        </div>
      </aside>
    );
  }

  if (showRestored) {
    return (
      <aside
        id="pwa-online-restored"
        aria-label="Online Restored Notice"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-950/95 text-emerald-200 border border-emerald-500/40 px-3.5 py-2 text-xs font-medium shadow-xl backdrop-blur-xs animate-in fade-in"
      >
        <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          {lang === 'sv'
            ? 'Anslutning återställd'
            : lang === 'zh'
            ? '已恢复网络连接'
            : 'Online connection restored'}
        </span>
      </aside>
    );
  }

  return null;
};
