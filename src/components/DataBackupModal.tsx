import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  RefreshCw,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { ConstructionTerm, Language, UserProgress } from '../types';
import { I18N } from '../data/i18n';
import {
  exportProgressToJson,
  exportMistakesToCsv,
  validateBackupJson,
  ValidationResult,
} from '../utils/backup';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  terms: ConstructionTerm[];
  progress: UserProgress;
  onRestoreProgress: (
    imported: UserProgress,
    mode: 'overwrite' | 'merge'
  ) => { success: boolean; error?: string } | void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  lang,
  terms,
  progress,
  onRestoreProgress,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'export' | 'import'>('export');
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const t = I18N[lang];

  const handleExportJson = () => {
    exportProgressToJson(progress);
  };

  const handleExportCsv = () => {
    exportMistakesToCsv(terms, progress.needsReview, progress.srsRecords);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsSuccess(false);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) {
        setErrorMessage('文件内容为空');
        setValidation(null);
        return;
      }

      const res = validateBackupJson(content);
      if (!res.valid) {
        setErrorMessage(res.error || '备份文件结构不合法');
        setValidation(null);
      } else {
        setValidation(res);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('读取文件失败，请重试');
      setValidation(null);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (!validation?.data) return;

    const result = onRestoreProgress(validation.data, importMode);
    if (result && !result.success) {
      setErrorMessage(result.error || '数据恢复失败，已保留当前学习进度');
      setIsSuccess(false);
      return;
    }

    setIsSuccess(true);
    setErrorMessage(null);
    setTimeout(() => {
      onClose();
      setIsSuccess(false);
      setValidation(null);
      setFileName('');
    }, 1500);
  };

  const resetImportState = () => {
    setValidation(null);
    setFileName('');
    setErrorMessage(null);
    setIsSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      id="data-backup-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="data-backup-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">{t.dataBackup}</h3>
              <p className="text-xs text-slate-400">
                {lang === 'sv'
                  ? 'Säkerhetskopiera eller återställ dina data lokalt'
                  : lang === 'zh'
                  ? '安全导出与恢复学习进度、错题及 SRS 记忆周期'
                  : 'Export and restore your progress & retention history offline'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition"
            title="Stäng / 关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Export vs Import */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => {
              setActiveSubTab('export');
              resetImportState();
            }}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeSubTab === 'export'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{lang === 'sv' ? 'Exportera säkerhetskopia' : lang === 'zh' ? '数据导出 (备份)' : 'Export Backup'}</span>
          </button>

          <button
            onClick={() => setActiveSubTab('import')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeSubTab === 'import'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{lang === 'sv' ? 'Importera / Återställ' : lang === 'zh' ? '数据导入 (恢复)' : 'Import & Restore'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {activeSubTab === 'export' ? (
            /* EXPORT VIEW */
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {lang === 'sv'
                    ? 'All data sparas lokalt i din webbläsare. Genom att ladda ner en säkerhetskopia kan du tryggt flytta framsteg mellan dator, surfplatta och mobil.'
                    : lang === 'zh'
                    ? '所有学习数据均离线保存在本地浏览器中。定期导出备份文件，即可在手机、平板与电脑间安全迁移学习记录。'
                    : 'All learning progress is preserved in local storage. Export a backup to safeguard your data or transfer across devices.'}
                </p>
              </div>

              {/* JSON Export Card */}
              <div className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition bg-white flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.exportJson}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.exportJsonDesc}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-mono text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">
                        ★ {progress.favorites.length} {lang === 'sv' ? 'favoriter' : '收藏'}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">
                        ✓ {progress.mastered.length} {lang === 'sv' ? 'inlärda' : '牢记'}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">
                        ⟳ {Object.keys(progress.srsRecords).length} SRS
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">
                        ✎ {progress.quizHistory.length} {lang === 'sv' ? 'tester' : '测验'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  id="btn-export-json"
                  onClick={handleExportJson}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'sv' ? 'Ladda ner' : '下载 JSON'}</span>
                </button>
              </div>

              {/* CSV Export Card */}
              <div className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition bg-white flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 mt-0.5">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{t.exportCsv}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.exportCsvDesc}</p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                        {progress.needsReview.length} {lang === 'sv' ? 'aktiva repetitionsord' : '待复习错题'}
                      </span>
                      <span className="text-slate-400">• UTF-8 BOM (Excel OK)</span>
                    </div>
                  </div>
                </div>

                <button
                  id="btn-export-csv"
                  onClick={handleExportCsv}
                  disabled={progress.needsReview.length === 0}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition shadow-xs ${
                    progress.needsReview.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                  title={progress.needsReview.length === 0 ? '暂无错题' : '导出 CSV'}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'sv' ? 'Ladda ner' : '下载 CSV'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* IMPORT VIEW */
            <div className="space-y-4">
              {/* File Dropzone / Select */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/60 hover:bg-amber-50/20 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center mx-auto text-slate-500 group-hover:text-amber-600 group-hover:border-amber-300 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 mt-2">
                  {fileName || (lang === 'sv' ? 'Klicka för att välja JSON-backupfil' : '点击选择 ByggTerm JSON 备份文件')}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'sv'
                    ? 'Stödjer filer skapade av ByggTerm (*.json)'
                    : '仅支持由 ByggTerm 导出的 .json 格式备份文件'}
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-bold">验证失败：</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* Validated File Summary & Mode Selection */}
              {validation?.valid && validation.summary && (
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">
                        {lang === 'sv' ? 'Giltig säkerhetskopia verifierad' : '备份文件解析有效'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      v{validation.summary.version}
                    </span>
                  </div>

                  {/* Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">
                        {lang === 'sv' ? 'Favoriter' : '收藏词汇'}
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {validation.summary.favoritesCount}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">
                        {lang === 'sv' ? 'Inlärda' : '牢记词汇'}
                      </div>
                      <div className="text-sm font-bold text-emerald-600 mt-0.5">
                        {validation.summary.masteredCount}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">
                        {lang === 'sv' ? 'Repetition' : '待强化错题'}
                      </div>
                      <div className="text-sm font-bold text-rose-600 mt-0.5">
                        {validation.summary.needsReviewCount}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">
                        {lang === 'sv' ? 'SRS Poster' : 'SRS 记录'}
                      </div>
                      <div className="text-sm font-bold text-amber-600 mt-0.5">
                        {validation.summary.srsCount}
                      </div>
                    </div>
                  </div>

                  {/* Import Strategy Options */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      {lang === 'sv' ? 'Välj sammanslagningsstrategi:' : '选择数据合并策略：'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        className={`border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition ${
                          importMode === 'merge'
                            ? 'border-amber-500 bg-amber-50/40 text-amber-950 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="mt-0.5 text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="text-xs font-bold">{t.importModeMerge}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {lang === 'sv'
                              ? 'Kombinerar befintliga framsteg med filen. Sparar de bästa resultaten.'
                              : '保留现有记录，并入备份中的新词汇与更高复习次数。'}
                          </div>
                        </div>
                      </label>

                      <label
                        className={`border rounded-xl p-3 flex items-start gap-2.5 cursor-pointer transition ${
                          importMode === 'overwrite'
                            ? 'border-rose-500 bg-rose-50/40 text-rose-950 shadow-2xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'overwrite'}
                          onChange={() => setImportMode('overwrite')}
                          className="mt-0.5 text-rose-600 focus:ring-rose-500"
                        />
                        <div>
                          <div className="text-xs font-bold">{t.importModeOverwrite}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {lang === 'sv'
                              ? 'Rensar lokala data helt och ersätter med innehållet i backupen.'
                              : '完全以备份文件为准，覆盖替换当前设备上的所有数据。'}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="pt-2">
                    <button
                      id="btn-confirm-import"
                      onClick={handleApplyImport}
                      disabled={isSuccess}
                      className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-xs ${
                        isSuccess
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {isSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{lang === 'sv' ? 'Återställning klar!' : '数据恢复完成并已生效！'}</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>{t.confirmImport}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
          >
            {lang === 'sv' ? 'Stäng' : '关闭'}
          </button>
        </div>
      </div>
    </div>
  );
};
