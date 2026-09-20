import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';

interface PWAInstallButtonProps {
  lang: Language;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed and opened as a standalone app
  if (isInstalled) {
    return (
      <div
        id="pwa-installed-badge"
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium"
        title={
          lang === 'sv'
            ? 'Installerad som PWA offline-app'
            : lang === 'zh'
            ? '已安装为 PWA 离线应用'
            : 'Installed as PWA offline app'
        }
      >
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden md:inline">
          {lang === 'sv' ? 'PWA Aktiv' : lang === 'zh' ? 'PWA 已就绪' : 'PWA Ready'}
        </span>
      </div>
    );
  }

  // Native beforeinstallprompt is ready (Chromium, Chrome Mobile, Edge)
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition shadow-sm animate-pulse hover:animate-none active:scale-95"
        title={
          lang === 'sv'
            ? 'Installera ByggTerm på din enhet för fullständig offlineanvändning'
            : lang === 'zh'
            ? '安装 ByggTerm 到设备，支持无网离线秒开'
            : 'Install ByggTerm on your device for full offline access'
        }
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>
          {lang === 'sv' ? 'Installera app' : lang === 'zh' ? '安装应用' : 'Install PWA'}
        </span>
      </button>
    );
  }

  // iOS Safari flow (WebKit does not support beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowGuideModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-medium text-xs transition active:scale-95"
          title={
            lang === 'sv'
              ? 'Installera på iPhone / iPad'
              : lang === 'zh'
              ? '在 iPhone/iPad 上安装'
              : 'Install on iOS'
          }
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>
            {lang === 'sv' ? 'Installera' : lang === 'zh' ? '安装应用' : 'Install'}
          </span>
        </button>

        {showGuideModal && (
          <div
            id="pwa-ios-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
          >
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
              <button
                onClick={() => setShowGuideModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Stäng"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {lang === 'sv'
                      ? 'Installera på iPhone / iPad'
                      : lang === 'zh'
                      ? '安装到 iOS 桌面'
                      : 'Install on iPhone / iPad'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'sv'
                      ? 'Få blixtsnabb offline-åtkomst på bygget'
                      : lang === 'zh'
                      ? '地下室等施工现场无需网络秒开'
                      : 'Fast offline access on construction sites'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-300 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <p>
                    {lang === 'sv' ? (
                      <>
                        Tryck på <strong className="text-white">Dela-knappen</strong> (
                        <Share className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" />) i Safaris
                        verktygsfält.
                      </>
                    ) : lang === 'zh' ? (
                      <>
                        点击 Safari 底部的 <strong className="text-white">分享按钮</strong> (
                        <Share className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" />)。
                      </>
                    ) : (
                      <>
                        Tap the <strong className="text-white">Share</strong> button (
                        <Share className="w-3.5 h-3.5 inline mx-0.5 text-sky-400" />) in Safari's toolbar.
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <p>
                    {lang === 'sv' ? (
                      <>
                        Bläddra nedåt och välj <strong className="text-white">Lägg till på hemskärmen</strong> (
                        <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-amber-400" />).
                      </>
                    ) : lang === 'zh' ? (
                      <>
                        向下滚动并点击 <strong className="text-white">添加到主屏幕</strong> (
                        <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-amber-400" />)。
                      </>
                    ) : (
                      <>
                        Scroll down and tap <strong className="text-white">Add to Home Screen</strong> (
                        <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-amber-400" />).
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowGuideModal(false)}
                className="mt-5 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition text-center shadow"
              >
                {lang === 'sv' ? 'Jag förstår' : lang === 'zh' ? '知道了' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop or browsers before event fires: give a neat informational trigger
  return (
    <>
      <button
        id="pwa-install-hint-btn"
        onClick={() => setShowGuideModal(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-slate-700/80 font-medium text-xs transition active:scale-95"
        title={
          lang === 'sv'
            ? 'Installera som offline-app'
            : lang === 'zh'
            ? '安装为离线应用 (PWA)'
            : 'Install as offline app'
        }
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {lang === 'sv' ? 'Installera app' : lang === 'zh' ? '安装应用' : 'Install PWA'}
        </span>
      </button>

      {showGuideModal && (
        <div
          id="pwa-info-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Stäng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {lang === 'sv'
                    ? 'Installera ByggTerm PWA'
                    : lang === 'zh'
                    ? '安装 ByggTerm 离线应用'
                    : 'Install ByggTerm PWA'}
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'sv'
                    ? 'Offline-läge för byggarbetsplatser'
                    : lang === 'zh'
                    ? '适合施工现场地下室等弱网环境'
                    : 'Offline capability for construction sites'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 mb-4">
              {lang === 'sv' ? (
                <>
                  ByggTerm är en fullfjädrad PWA. Du kan klicka på installationsikonen (
                  <Download className="w-3.5 h-3.5 inline mx-0.5 text-amber-400" />) i webbläsarens adressfält (t.ex. Google Chrome, Edge) eller välja <em>"Installera ByggTerm"</em> i webbläsarmenyn för att spara appen direkt på skrivbordet eller telefonen.
                </>
              ) : lang === 'zh' ? (
                <>
                  ByggTerm 已支持完整 PWA 渐进式离线缓存。您可点击浏览器地址栏右侧的<strong>“安装应用”图标</strong>（或在 Chrome / Edge 菜单中点击<em>“安装 ByggTerm”</em>），即可生成桌面原生独立应用，所有词条均已预存本地。
                </>
              ) : (
                <>
                  ByggTerm is a fully offline-capable PWA. Click the install icon in your browser address bar or menu to install it to your device home screen or desktop.
                </>
              )}
            </p>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition text-center shadow"
            >
              {lang === 'sv' ? 'Stäng' : lang === 'zh' ? '关闭' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
