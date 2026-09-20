/**
 * Robust Speech Synthesis (TTS) module tailored for Swedish construction terminology.
 * Optimized for iOS Safari and mobile browsers:
 * - Pre-warms and caches Swedish voice upon initialization without blocking UI gestures.
 * - Guarantees synchronous invocation of window.speechSynthesis.speak() in user gesture scope.
 * - Handles onvoiceschanged asynchronous loading and state-machine audio queue clearing.
 */

/**
 * Robust Speech Synthesis (TTS) module tailored for Swedish construction terminology.
 * Optimized for iOS Safari and mobile browsers:
 * - Pre-warms and caches Swedish voice upon initialization without blocking UI gestures.
 * - Guarantees synchronous invocation of window.speechSynthesis.speak() and window.speechSynthesis.resume() in user gesture scope.
 * - Detects missing offline voice packs with graceful notifications.
 * - Handles onvoiceschanged asynchronous loading and state-machine audio queue clearing.
 */

export interface TtsWarning {
  type: 'voice-missing' | 'not-allowed' | 'offline' | 'unsupported';
  message: string;
}

export type TtsWarningListener = (warning: TtsWarning) => void;

const ttsWarningListeners: Set<TtsWarningListener> = new Set();

export function subscribeTtsWarning(listener: TtsWarningListener): () => void {
  ttsWarningListeners.add(listener);
  return () => {
    ttsWarningListeners.delete(listener);
  };
}

export function notifyTtsWarning(type: TtsWarning['type'], message: string): void {
  const payload: TtsWarning = { type, message };
  ttsWarningListeners.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.warn('TTS warning listener error:', err);
    }
  });
}

/**
 * 瑞典语/中文 文本语音朗读工具类 (Web Speech API)
 */
export const speakText = (text: string, lang: 'sv-SE' | 'zh-CN' = 'sv-SE', rate: number = 0.9) => {
  if (!('speechSynthesis' in window)) {
    notifyTtsWarning('unsupported', '当前浏览器不支持语音合成功能');
    return;
  }

  try {
    // 显式唤醒与队列清理 (iOS Safari 关键兼容性修复)
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate; // 略微放慢语速以方便清晰听辨施工专业词汇

    // 获取系统可用的发音人列表，优先匹配目标语言
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice =
      voices.find((v) => v.lang.startsWith(lang)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else if (lang.startsWith('sv')) {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      if (isOffline) {
        notifyTtsWarning(
          'voice-missing',
          '离线模式下未检测到本地瑞典语音色。如需无网发音，建议在系统设置 > 辅助功能 > 朗读内容 中下载瑞典语音频包。'
        );
      }
    }

    utterance.onerror = (e) => {
      const errorStr = (e as SpeechSynthesisErrorEvent)?.error;
      if (errorStr === 'not-allowed') {
        notifyTtsWarning('not-allowed', 'iOS 限制未授权音频播放，请直接轻触发音按钮触发。');
      } else if (errorStr === 'voice-unavailable') {
        notifyTtsWarning('voice-missing', '当前设备缺少对应语音包，可前往系统辅助功能设置下载。');
      }
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('speakText error:', err);
  }
};

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

let cachedSwedishVoice: SpeechSynthesisVoice | null = null;
let isInitialized = false;

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Synchronously retrieves the best Swedish voice from cache or available voices.
 * Never awaits or yields to the microtask queue to protect user gesture scope.
 */
export function getSwedishVoice(): SpeechSynthesisVoice | null {
  if (cachedSwedishVoice) return cachedSwedishVoice;
  if (!isSpeechSupported()) return null;

  try {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      cachedSwedishVoice =
        voices.find((v) => v.lang === 'sv-SE' || v.lang === 'sv_SE') ||
        voices.find((v) => v.lang.toLowerCase().startsWith('sv')) ||
        null;
    }
  } catch {
    cachedSwedishVoice = null;
  }

  return cachedSwedishVoice;
}

/**
 * Initializes TTS engine: pre-caches voices silently and hooks into iOS touch events
 * to unlock speech synthesis on mobile browsers without waiting for audio actions.
 */
export function initTts(): void {
  if (isInitialized || !isSpeechSupported()) return;
  isInitialized = true;

  try {
    // 1. 启动时立即触发静默 getVoices()，填充底层语音缓存
    getSwedishVoice();

    // 2. 监听异步发音人更新（Chromium / Safari 动态加载音色时自动刷新）
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        cachedSwedishVoice = null;
        getSwedishVoice();
      };
    }

    // 3. iOS Safari 手势预热解锁机制：首次用户触控或点击时同步唤醒音频合成队列
    const unlockMobileSpeech = () => {
      try {
        if ('speechSynthesis' in window) {
          getSwedishVoice();
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }
      } catch {
        // ignore
      }
      window.removeEventListener('touchstart', unlockMobileSpeech);
      window.removeEventListener('click', unlockMobileSpeech);
    };

    window.addEventListener('touchstart', unlockMobileSpeech, { capture: true, once: true, passive: true });
    window.addEventListener('click', unlockMobileSpeech, { capture: true, once: true, passive: true });
  } catch (err) {
    console.warn('TTS init error:', err);
  }
}

// Auto-initialize when running in browser
if (typeof window !== 'undefined') {
  initTts();
}

/**
 * Gracefully stops any active or queued speech synthesis.
 */
export function stopSpeech(): void {
  if (!isSpeechSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch (err: unknown) {
    console.warn('speechSynthesis.cancel warning:', err);
  }
}

/**
 * Synthesizes Swedish speech in a strictly synchronous execution frame.
 * Crucial for iOS Safari: speak() is invoked directly in the user click/touch stack,
 * avoiding any microtask/promise hops that would destroy the User Gesture Scope.
 */
export function speakSwedish(
  text: string,
  optionsOrRate: number | SpeechOptions = 1.0
): Promise<void> {
  const options: SpeechOptions =
    typeof optionsOrRate === 'number'
      ? { rate: optionsOrRate }
      : (optionsOrRate ?? { rate: 1.0 });

  const rate = typeof options.rate === 'number' ? options.rate : 1.0;
  const pitch = typeof options.pitch === 'number' ? options.pitch : 1.0;

  return new Promise((resolve) => {
    if (!isSpeechSupported() || !text || !text.trim()) {
      resolve();
      return;
    }

    try {
      // 状态机清理：取消未完成的发音，避免队列堆积
      window.speechSynthesis.cancel();

      // iOS 唤醒：若先前处于暂停状态，同步唤醒
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.lang = 'sv-SE';
      utterance.rate = rate;
      utterance.pitch = pitch;

      // 优先从内存缓存同步读取已解析的 sv-SE 音色，避免任何等待
      const voice = getSwedishVoice();
      if (voice) {
        utterance.voice = voice;
      } else {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        if (isOffline) {
          notifyTtsWarning(
            'voice-missing',
            '离线模式下未检测到本地瑞典语发音人。建议在 iOS 设置 > 辅助功能 > 朗读内容 中下载瑞典语语音包。'
          );
        }
      }

      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        const errorStr = (event as SpeechSynthesisErrorEvent)?.error;
        if (errorStr === 'not-allowed') {
          notifyTtsWarning('not-allowed', 'iOS 限制非手势音频播放，请直接轻触按钮重试。');
        } else if (errorStr === 'voice-unavailable') {
          notifyTtsWarning('voice-missing', '当前设备缺少瑞典语发音包，可前往系统设置下载。');
        }
        options.onError?.(event);
        resolve();
      };

      // 同步触发播放指令，严禁前置 await / Promise
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('TTS 执行拦截:', e);
      options.onError?.(e);
      resolve();
    }
  });
}
