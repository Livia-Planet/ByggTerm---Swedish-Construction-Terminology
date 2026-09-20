import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PWAProvider } from './context/PWAContext';
import { registerSW } from 'virtual:pwa-register';
import './index.css';

// 注册 VitePWA Service Worker
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('ByggTerm 有新版本更新，是否立即刷新以获取最新词库？')) {
      updateSW && updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('ByggTerm 离线缓存已就绪，可在无网施工现场正常使用！');
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PWAProvider>
      <App />
    </PWAProvider>
  </React.StrictMode>
);

