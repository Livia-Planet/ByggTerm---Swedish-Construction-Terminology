import { useEffect, useState } from 'react';
import { usePWA } from '../context/PWAContext';

export function usePWAInstall() {
  const { deferredPrompt, isInstallable, installPWA } = usePWA();
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect standalone display mode (already installed or opened as standalone PWA)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsInstalled(isStandalone);

    // Detect iOS devices (Safari does not support beforeinstallprompt)
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await installPWA();
      return true;
    } catch (err) {
      console.error('PWA install prompt error:', err);
      return false;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    install,
  };
}

