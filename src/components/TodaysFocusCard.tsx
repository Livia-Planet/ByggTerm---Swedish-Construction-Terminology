import React, { useState } from 'react';
import { Sparkles, Clock, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { ConstructionTerm, Language, SrsRecord } from '../types';

interface TodaysFocusCardProps {
  terms: ConstructionTerm[];
  srsRecords: Record<string, SrsRecord>;
  needsReview: string[];
  lang: Language;
  onStartReview: () => void;
}

export const TodaysFocusCard: React.FC<TodaysFocusCardProps> = ({
  terms,
  srsRecords,
  needsReview,
  lang,
  onStartReview,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const now = Date.now();

  // Calculate terms due for SRS
  const dueTerms = terms.filter((term) => {
    const rec = srsRecords[term.id];
    if (rec) {
      return rec.nextReviewAt <= now;
    }
    return needsReview.includes(term.id);
  });

  const dueCount = dueTerms.length;

  if (dueCount === 0) {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-emerald-950">
              {lang === 'zh'
                ? '今日记忆曲线复习已达成！'
                : lang === 'sv'
                ? 'Dagens repetitioner är avklarade!'
                : "Today's review queue is all clear!"}
            </p>
            <p className="text-emerald-700/90 text-[11px] mt-0.5">
              {lang === 'zh'
                ? '暂无待复习词汇，可自由浏览全词库或进行小测'
                : lang === 'sv'
                ? 'Bra jobbat! Fortsätt med quiz eller ordboken.'
                : 'Great work! Feel free to practice quiz or browse terms.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/80 to-amber-100/50 border-2 border-amber-300/80 rounded-2xl shadow-xs overflow-hidden transition-all">
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-tight text-slate-900">
                {lang === 'zh' ? '今日专属强化聚焦' : lang === 'sv' ? 'Dagens repetitioner' : "Today's Focus"}
              </span>
              <span className="px-2 py-0.2 rounded-full bg-rose-500 text-white font-extrabold text-[10px] animate-pulse">
                {dueCount} {lang === 'zh' ? '词待巩固' : lang === 'sv' ? 'att repetera' : 'due'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {lang === 'zh'
                ? `根据艾宾浩斯记忆曲线，当前有 ${dueCount} 个专业词汇到达最佳强化节点。`
                : lang === 'sv'
                ? `${dueCount} termer behöver repeteras enligt SRS-intervallet.`
                : `${dueCount} terms are scheduled for memory consolidation today.`}
            </p>
          </div>
        </div>

        <button
          id="todays-focus-start-btn"
          onClick={onStartReview}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs shrink-0 transition-all"
        >
          <span>{lang === 'zh' ? '立即强化' : lang === 'sv' ? 'Repetera' : 'Start'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
