import React, { useMemo } from 'react';
import {
  Brain,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Database,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { ConstructionTerm, Language, UserProgress } from '../types';
import { I18N } from '../data/i18n';

/**
 * Returns the midnight (00:00:00.000) timestamp for a given date in local time.
 */
export const getStartOfDay = (date: Date | number = new Date()): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

interface MemoryDashboardProps {
  terms: ConstructionTerm[];
  lang: Language;
  progress: UserProgress;
  onOpenBackupModal: () => void;
  onStartFlashcards?: () => void;
}

export const MemoryDashboard: React.FC<MemoryDashboardProps> = ({
  terms,
  lang,
  progress,
  onOpenBackupModal,
  onStartFlashcards,
}) => {
  const t = I18N[lang];

  // 1. Calculate Retention Categories (Mastered, Due, Good, Again)
  const stats = useMemo(() => {
    const now = Date.now();
    const { mastered, needsReview, srsRecords } = progress;

    let countMastered = 0;
    let countDue = 0;
    let countGood = 0;
    let countAgain = 0;

    const classifiedIds = new Set<string>();

    // Pass 1: Examine all tracked SRS records
    for (const [id, srs] of Object.entries(srsRecords)) {
      classifiedIds.add(id);

      if (needsReview.includes(id) || srs.familiarity === 0 || srs.reps === 0) {
        countAgain++;
      } else if (srs.nextReviewAt <= now) {
        countDue++;
      } else if (mastered.includes(id) || (srs.familiarity === 3 && srs.intervalDays >= 6)) {
        countMastered++;
      } else if (srs.familiarity === 2) {
        countGood++;
      } else {
        countAgain++;
      }
    }

    // Pass 2: Terms in mastered or needsReview without SRS record
    for (const id of mastered) {
      if (!classifiedIds.has(id)) {
        classifiedIds.add(id);
        countMastered++;
      }
    }

    for (const id of needsReview) {
      if (!classifiedIds.has(id)) {
        classifiedIds.add(id);
        countAgain++;
      }
    }

    const totalEngaged = countMastered + countDue + countGood + countAgain;
    const countUnstarted = Math.max(0, terms.length - totalEngaged);

    const retentionRate =
      totalEngaged > 0 ? Math.round(((countMastered + countGood) / totalEngaged) * 100) : 0;

    return {
      countMastered,
      countDue,
      countGood,
      countAgain,
      totalEngaged,
      countUnstarted,
      retentionRate,
    };
  }, [terms, progress]);

  // 2. Calculate Future 7-Day SRS Due Forecast Distribution with Natural Day Normalization
  const forecastData = useMemo(() => {
    const todayStart = getStartOfDay(new Date());
    const ONE_DAY_MS = 86400000;

    const weekDayNamesZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekDayNamesSv = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
    const weekDayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize 7 forecast slots for index 0 (today) through 6
    const dailyCounts = [0, 0, 0, 0, 0, 0, 0];

    // Distribute SRS records by natural day boundary
    for (const srs of Object.values(progress.srsRecords)) {
      if (!srs || typeof srs.nextReviewAt !== 'number') continue;

      // Natural day offset relative to local midnight
      const dayIndex = Math.floor((srs.nextReviewAt - todayStart) / ONE_DAY_MS);

      if (dayIndex <= 0) {
        // Overdue or due today -> belongs to Day 0
        dailyCounts[0]++;
      } else if (dayIndex < 7) {
        dailyCounts[dayIndex]++;
      }
    }

    // Also account for terms explicitly marked in needsReview without SRS records (due today)
    for (const id of progress.needsReview) {
      if (!progress.srsRecords[id]) {
        dailyCounts[0]++;
      }
    }

    const days = dailyCounts.map((count, i) => {
      const dayDate = new Date(todayStart + i * ONE_DAY_MS);
      const dayOfWeek = dayDate.getDay();
      let label = '';
      const subLabel = `${dayDate.getMonth() + 1}/${dayDate.getDate()}`;

      if (i === 0) {
        label = t.forecastDayToday;
      } else if (i === 1) {
        label = t.forecastDayTomorrow;
      } else {
        label =
          lang === 'sv'
            ? weekDayNamesSv[dayOfWeek]
            : lang === 'zh'
            ? weekDayNamesZh[dayOfWeek]
            : weekDayNamesEn[dayOfWeek];
      }

      return {
        dayIndex: i,
        label,
        subLabel,
        count,
        isToday: i === 0,
      };
    });

    const total7DaysCount = dailyCounts.reduce((sum, c) => sum + c, 0);
    // Ensure guaranteed minimum denominator to eliminate any chance of division by zero
    const maxDayCount = Math.max(...dailyCounts, 5);

    return {
      days,
      total7DaysCount,
      maxDayCount,
    };
  }, [progress, lang, t]);

  // Donut SVG circumference calculation
  const donutRadius = 38;
  const circumference = 2 * Math.PI * donutRadius; // ≈ 238.76

  const donutSegments = useMemo(() => {
    if (stats.totalEngaged === 0) {
      return [];
    }

    const segments = [
      { name: 'mastered', count: stats.countMastered, color: '#10b981' }, // emerald-500
      { name: 'good', count: stats.countGood, color: '#0ea5e9' },         // sky-500
      { name: 'due', count: stats.countDue, color: '#f59e0b' },           // amber-500
      { name: 'again', count: stats.countAgain, color: '#f43f5e' },       // rose-500
    ];

    let currentOffset = 0;
    return segments.map((seg) => {
      const fraction = seg.count / stats.totalEngaged;
      const strokeDash = fraction * circumference;
      const offset = currentOffset;
      currentOffset -= strokeDash;

      return {
        ...seg,
        strokeDasharray: `${strokeDash} ${circumference - strokeDash}`,
        strokeDashoffset: offset,
        percentage: Math.round(fraction * 100),
      };
    });
  }, [stats, circumference]);

  // SVG Spline curve for the 7-day review forecast
  const chartPoints = useMemo(() => {
    const width = 420;
    const height = 110;
    const padX = 36;
    const padYTop = 24;
    const padYBottom = 26;
    const chartHeight = height - padYTop - padYBottom;
    const chartWidth = width - padX * 2;

    const points = forecastData.days.map((d, index) => {
      const x = padX + (index / 6) * chartWidth;
      // Protected against NaN, division by zero, and negative overflow
      const normalized =
        forecastData.maxDayCount > 0
          ? Math.min(1, Math.max(0, d.count / forecastData.maxDayCount))
          : 0;
      const y = padYTop + (1 - normalized) * chartHeight;
      return { x, y, ...d };
    });

    // Generate smooth SVG path d
    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const midX = (curr.x + next.x) / 2;
        pathD += ` C ${midX} ${curr.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
      }
    }

    const areaD =
      points.length > 0
        ? `${pathD} L ${points[points.length - 1].x} ${height - padYBottom} L ${points[0].x} ${
            height - padYBottom
          } Z`
        : '';

    return { points, pathD, areaD, height, width, padYBottom };
  }, [forecastData]);

  return (
    <div
      id="memory-retention-dashboard"
      className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Dashboard Top Header */}
      <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-amber-50/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-xs">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {t.memoryDashboardTitle}
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-amber-300 font-medium">
                SM-2 SRS
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{t.memoryDashboardDesc}</p>
          </div>
        </div>

        {/* Action: Data Backup Modal Trigger */}
        <button
          id="btn-open-backup-modal"
          onClick={onOpenBackupModal}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
        >
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.dataBackup}</span>
        </button>
      </div>

      {/* Main Grid: Left (Ratio Donut & Progress) + Right (7-Day Forecast Curve) */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Donut & Status Ratio (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 pr-0 lg:pr-3 lg:border-r lg:border-slate-100">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {t.retentionOverview}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {stats.totalEngaged} / {terms.length} {lang === 'sv' ? 'aktiva' : '活跃词'}
              </span>
            </div>

            {/* Donut & Stats Row */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              {/* Pure SVG Donut Chart */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="10"
                  />

                  {/* Slices */}
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.name}
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="10"
                      strokeDasharray={seg.strokeDasharray}
                      strokeDashoffset={seg.strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  ))}
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {stats.retentionRate}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {t.retentionRateLabel}
                  </span>
                </div>
              </div>

              {/* Legend Badges */}
              <div className="flex-1 space-y-1.5 text-xs">
                {/* Mastered */}
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-700 font-medium">{t.statMastered}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-mono">
                    <span className="font-bold text-slate-900">{stats.countMastered}</span>
                    <span className="text-[10px] text-slate-400">
                      (
                      {stats.totalEngaged > 0
                        ? Math.round((stats.countMastered / stats.totalEngaged) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>

                {/* Good / Familiar */}
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                    <span className="text-slate-700 font-medium">{t.statGood}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-mono">
                    <span className="font-bold text-slate-900">{stats.countGood}</span>
                    <span className="text-[10px] text-slate-400">
                      (
                      {stats.totalEngaged > 0
                        ? Math.round((stats.countGood / stats.totalEngaged) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>

                {/* Due for Review */}
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-slate-700 font-medium">{t.statDue}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-mono">
                    <span className="font-bold text-amber-700">{stats.countDue}</span>
                    <span className="text-[10px] text-slate-400">
                      (
                      {stats.totalEngaged > 0
                        ? Math.round((stats.countDue / stats.totalEngaged) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>

                {/* Again / Hard */}
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 transition">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="text-slate-700 font-medium">{t.statAgain}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-mono">
                    <span className="font-bold text-rose-700">{stats.countAgain}</span>
                    <span className="text-[10px] text-slate-400">
                      (
                      {stats.totalEngaged > 0
                        ? Math.round((stats.countAgain / stats.totalEngaged) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
              {stats.totalEngaged > 0 ? (
                <>
                  <div
                    style={{ width: `${(stats.countMastered / stats.totalEngaged) * 100}%` }}
                    className="bg-emerald-500 transition-all duration-500"
                    title={`${t.statMastered}: ${stats.countMastered}`}
                  />
                  <div
                    style={{ width: `${(stats.countGood / stats.totalEngaged) * 100}%` }}
                    className="bg-sky-500 transition-all duration-500"
                    title={`${t.statGood}: ${stats.countGood}`}
                  />
                  <div
                    style={{ width: `${(stats.countDue / stats.totalEngaged) * 100}%` }}
                    className="bg-amber-500 transition-all duration-500"
                    title={`${t.statDue}: ${stats.countDue}`}
                  />
                  <div
                    style={{ width: `${(stats.countAgain / stats.totalEngaged) * 100}%` }}
                    className="bg-rose-500 transition-all duration-500"
                    title={`${t.statAgain}: ${stats.countAgain}`}
                  />
                </>
              ) : (
                <div className="w-full bg-slate-200 text-[10px] text-center text-slate-400">
                  暂无活跃学习记录
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {lang === 'sv' ? 'Total vokabulärtäckning' : '全库覆盖率'}:{' '}
                <strong className="text-slate-700 font-mono">
                  {Math.round((stats.totalEngaged / (terms.length || 1)) * 100)}%
                </strong>
              </span>
              <span>
                {stats.countUnstarted} {lang === 'sv' ? 'ostartade' : '词待开启'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Future 7-Day SRS Forecast Distribution (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                {t.srsForecastTitle}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">{t.srsForecastDesc}</p>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold">
              {lang === 'sv' ? '7 dgr totalt' : '7天累计'}: {forecastData.total7DaysCount}
            </span>
          </div>

          {/* Forecast Chart Card (Pure Lightweight SVG + Tailwind) */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 relative overflow-hidden">
            <svg
              className="w-full h-36 select-none"
              viewBox={`0 0 ${chartPoints.width} ${chartPoints.height}`}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="srsCurveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal Guidelines */}
              <line
                x1="20"
                y1="25"
                x2="400"
                y2="25"
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <line
                x1="20"
                y1={chartPoints.height - chartPoints.padYBottom}
                x2="400"
                y2={chartPoints.height - chartPoints.padYBottom}
                stroke="#cbd5e1"
                strokeWidth="1"
              />

              {/* Bars per day */}
              {chartPoints.points.map((pt) => {
                const barWidth = 22;
                const barX = pt.x - barWidth / 2;
                const barH = Math.max(3, chartPoints.height - chartPoints.padYBottom - pt.y);

                return (
                  <g key={pt.dayIndex} className="group cursor-pointer">
                    {/* Bar rectangle */}
                    <rect
                      x={barX}
                      y={pt.y}
                      width={barWidth}
                      height={barH}
                      rx="4"
                      className={`transition-all duration-300 ${
                        pt.isToday
                          ? 'fill-amber-500'
                          : pt.count > 0
                          ? 'fill-amber-300/80 hover:fill-amber-400'
                          : 'fill-slate-200/70'
                      }`}
                    />

                    {/* Count Text atop Bar */}
                    <text
                      x={pt.x}
                      y={Math.max(16, pt.y - 6)}
                      textAnchor="middle"
                      className={`text-[11px] font-mono font-bold ${
                        pt.isToday ? 'fill-amber-700' : 'fill-slate-600'
                      }`}
                    >
                      {pt.count}
                    </text>
                  </g>
                );
              })}

              {/* Area fill under curve */}
              {chartPoints.areaD && (
                <path d={chartPoints.areaD} fill="url(#srsCurveGrad)" />
              )}

              {/* Curve Line */}
              {chartPoints.pathD && (
                <path
                  d={chartPoints.pathD}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Data points */}
              {chartPoints.points.map((pt) => (
                <circle
                  key={`dot-${pt.dayIndex}`}
                  cx={pt.x}
                  cy={pt.y}
                  r="3.5"
                  fill="#ffffff"
                  stroke={pt.isToday ? '#d97706' : '#f59e0b'}
                  strokeWidth="2"
                />
              ))}
            </svg>

            {/* X-Axis Labels Row */}
            <div className="grid grid-cols-7 gap-1 text-center pt-1 border-t border-slate-200/60">
              {forecastData.days.map((d) => (
                <div
                  key={d.dayIndex}
                  className={`flex flex-col items-center py-1 rounded-md transition ${
                    d.isToday ? 'bg-amber-100/70 font-bold text-amber-950' : 'text-slate-600'
                  }`}
                >
                  <span className="text-[11px] font-semibold">{d.label}</span>
                  <span className="text-[9px] font-mono text-slate-400">{d.subLabel}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notice / Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="text-slate-600">
                {stats.countDue > 0
                  ? lang === 'sv'
                    ? `Idag har du ${stats.countDue} termer som behöver repeteras enligt kurvan.`
                    : `今日有 ${stats.countDue} 个词汇到达复习节点，及时巩固可锁定长期记忆。`
                  : lang === 'sv'
                  ? 'Inga förfallna repetitioner just nu. Bra jobbat!'
                  : '今日暂无到期复习词汇，记忆状态维持良好！'}
              </span>
            </div>

            {onStartFlashcards && stats.countDue > 0 && (
              <button
                onClick={onStartFlashcards}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition"
              >
                <Layers className="w-3 h-3" />
                <span>{lang === 'sv' ? 'Repetera nu' : '立即复习'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
