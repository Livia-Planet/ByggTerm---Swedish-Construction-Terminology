import React from 'react';

// Cache compiled regular expressions to prevent re-compilation on every card render
const regexCache = new Map<string, RegExp>();

function getSearchRegex(query: string): RegExp | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const cached = regexCache.get(trimmed);
  if (cached) return cached;

  try {
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    if (regexCache.size > 50) {
      regexCache.clear();
    }
    regexCache.set(trimmed, regex);
    return regex;
  } catch {
    return null;
  }
}

/**
 * Highlight matched search terms efficiently without re-instantiating regex per render
 */
export function highlightMatch(text: string, query?: string): React.ReactNode {
  if (!query || !query.trim() || !text) {
    return text;
  }

  const regex = getSearchRegex(query);
  if (!regex) return text;

  // Split and render marks
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    // Reset regex lastIndex if needed because of 'g' flag
    regex.lastIndex = 0;
    if (regex.test(part)) {
      return (
        <mark key={index} className="bg-amber-200 text-slate-900 rounded-xs px-0.5 font-semibold">
          {part}
        </mark>
      );
    }
    return part;
  });
}
