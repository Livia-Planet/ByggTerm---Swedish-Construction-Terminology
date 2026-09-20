import { Language } from '../types';

export interface Translations {
  navDictionary: string;
  navFlashcards: string;
  navQuiz: string;
  navFavorites: string;
  totalTerms: string;
  mastered: string;
  searchPlaceholder: string;
  filterAll: string;
  filterAllLetters: string;
  letterIndex: string;
  categoryFilter: string;
  allCategories: string;
  favoritesOnly: string;
  unmasteredOnly: string;
  clearFilters: string;
  resultsCount: string;
  noResults: string;
  swedishTerm: string;
  swedishDesc: string;
  chineseTrans: string;
  englishTrans: string;
  playAudio: string;
  copy: string;
  copied: string;
  addFavorite: string;
  removeFavorite: string;
  markMastered: string;
  markReview: string;
  flipCard: string;
  flipPrompt: string;
  needsPractice: string;
  iKnowThis: string;
  prevCard: string;
  nextCard: string;
  shuffle: string;
  cardCounter: (current: number, total: number) => string;
  needsReview: string;
  quizTitle: string;
  startQuiz: string;
  questionCount: string;
  quizMode: string;
  questionCounter: (current: number, total: number) => string;
  correct: string;
  explanation: string;
  nextQuestion: string;
  seeResults: string;
  quizSummary: string;
  tryAgain: string;
  newQuiz: string;
  playExplanation: string;
  playExample: string;
  example: string;
  quizScope: string;
  quizScopeAll: string;
  quizScopeFavorites: string;
  quizScopeReview: string;
  srsDue: string;
  srsFuzzy: string;
  srsGood: string;
  srsMastered: string;
  srsRatingAgain: string;
  srsRatingHard: string;
  srsRatingGood: string;
  srsRatingEasy: string;
  srsQueueActive: string;
  memoryDashboardTitle: string;
  memoryDashboardDesc: string;
  retentionOverview: string;
  srsForecastTitle: string;
  srsForecastDesc: string;
  statMastered: string;
  statDue: string;
  statGood: string;
  statAgain: string;
  statUnstarted: string;
  statTotalEngaged: string;
  dataBackup: string;
  exportJson: string;
  exportJsonDesc: string;
  exportCsv: string;
  exportCsvDesc: string;
  importBackup: string;
  importModeOverwrite: string;
  importModeMerge: string;
  confirmImport: string;
  forecastDayToday: string;
  forecastDayTomorrow: string;
  retentionRateLabel: string;
  exportA4Print: string;
  exportA4PrintDesc: string;
  printCardsBtn: string;
  printScopeLabel: string;
  printScopeCurrent: string;
  printScopeFavorites: string;
  printScopeNeedsReview: string;
  printScopeAll: string;
  printIncludeExamples: string;
  printCardMode: string;
  printModeFieldCards: string;
  printModeFolding: string;
  printSummary: (cards: number, pages: number) => string;
  printClose: string;
}

export const I18N: Record<Language, Translations> = {
  sv: {
    navDictionary: 'Ordbok',
    navFlashcards: 'Flashcards',
    navQuiz: 'Kunskapstest',
    navFavorites: 'Favoriter & Repetition',
    totalTerms: 'termer',
    mastered: 'Inlärda',
    searchPlaceholder: 'Sök term, förklaring, kinesiska eller engelska...',
    filterAll: 'Alla',
    filterAllLetters: 'Rensa bokstavsfilter',
    letterIndex: 'Bokstavsregister (A–Ä)',
    categoryFilter: 'Kategorier',
    allCategories: 'Alla kategorier',
    favoritesOnly: 'Favoriter',
    unmasteredOnly: 'Oinlärda',
    clearFilters: 'Rensa alla filter',
    resultsCount: 'Visar',
    noResults: 'Inga matchande termer hittades',
    swedishTerm: 'Svensk fackterm',
    swedishDesc: 'Svensk förklaring',
    chineseTrans: 'Kinesisk översättning',
    englishTrans: 'Engelsk översättning',
    playAudio: 'Lyssna på svenskt uttal',
    playExplanation: 'Lyssna på förklaring',
    playExample: 'Lyssna på exempelmening',
    example: 'Exempel på byggarbetsplatsen',
    copy: 'Kopiera term och förklaring',
    copied: 'Kopierad!',
    addFavorite: 'Lägg till som favorit',
    removeFavorite: 'Ta bort favoritmarkering',
    markMastered: 'Markera som inlärd',
    markReview: 'Lägg till i repetitionslistan',
    flipCard: 'Klicka för att vända kortet',
    flipPrompt: 'Klicka var som helst på kortet för att se förklaring och översättningar',
    needsPractice: 'Behöver öva',
    iKnowThis: 'Kan detta',
    prevCard: 'Föregående',
    nextCard: 'Nästa',
    shuffle: 'Blanda kortlek',
    cardCounter: (cur, tot) => `Kort ${cur} av ${tot}`,
    needsReview: 'Behöver övas',
    quizTitle: 'Bygg- och anläggningstest',
    startQuiz: 'Starta testet nu',
    questionCount: 'Antal frågor',
    quizMode: 'Frågeläge',
    quizScope: 'Testurval',
    quizScopeAll: 'Hela ordlistan',
    quizScopeFavorites: 'Endast favoriter',
    quizScopeReview: 'Endast repetitionsord',
    questionCounter: (cur, tot) => `Fråga ${cur} av ${tot}`,
    correct: 'rätt',
    explanation: 'Förklaring & Ordfakta',
    nextQuestion: 'Nästa fråga',
    seeResults: 'Se resultat',
    quizSummary: 'Testresultat',
    tryAgain: 'Gör om testet',
    newQuiz: 'Konfigurera nytt test',
    srsDue: 'Repetition idag',
    srsFuzzy: 'Osäker',
    srsGood: 'Bekant',
    srsMastered: 'Behärskad',
    srsRatingAgain: 'Glömt (Idag)',
    srsRatingHard: 'Svårt (1 d)',
    srsRatingGood: 'Bra (3 d)',
    srsRatingEasy: 'Lätt (7 d)',
    srsQueueActive: 'SRS Intervallrepetition aktiv',
    memoryDashboardTitle: 'Minnesöversikt & Glömskekurva',
    memoryDashboardDesc: 'SM-2 algoritmbaserad uppföljning av repetitionsintervall och behärskningsgrad.',
    retentionOverview: 'Inlärningsstatus',
    srsForecastTitle: 'Kommande 7 dagars repetitionsprognos',
    srsForecastDesc: 'Beräknat antal termer som når repetitionsdatum under de närmaste 7 dagarna.',
    statMastered: 'Inlärda',
    statDue: 'Förfallna idag',
    statGood: 'Bekanta',
    statAgain: 'Svåra / Nya',
    statUnstarted: 'Ostartade',
    statTotalEngaged: 'Aktiva termer',
    dataBackup: 'Säkerhetskopiering & Data',
    exportJson: 'Exportera JSON-kopia',
    exportJsonDesc: 'Spara alla framsteg, intervaller och historik i en lokal JSON-fil.',
    exportCsv: 'Exportera fellista (CSV)',
    exportCsvDesc: 'Ladda ner repetitionsord som Excel-kompatibel CSV (UTF-8).',
    importBackup: 'Importera säkerhetskopia',
    importModeOverwrite: 'Ersätt befintlig data',
    importModeMerge: 'Slå samman med lokal data',
    confirmImport: 'Återställ data nu',
    forecastDayToday: 'Idag',
    forecastDayTomorrow: 'Imorgon',
    retentionRateLabel: 'Kunskapsbehållning',
    exportA4Print: 'Skriv ut A4-ordkort',
    exportA4PrintDesc: 'Exportera utskriftsoptimerade A4-ark (3x3 kort per sida) med tydliga klipplinjer för byggarbetsplatsen.',
    printCardsBtn: 'Skriv ut / Spara PDF',
    printScopeLabel: 'Utskriftsurval',
    printScopeCurrent: 'Aktuellt filter i vyn',
    printScopeFavorites: 'Mina sparade favoriter',
    printScopeNeedsReview: 'Felaktiga / Svåra termer',
    printScopeAll: 'Hela ordlistan (alla termer)',
    printIncludeExamples: 'Inkludera byggexempel',
    printCardMode: 'Kortformat',
    printModeFieldCards: 'Fältkort (3x3 kompakt rutnät)',
    printModeFolding: 'Dubbelsidig vikning (kort med baksida)',
    printSummary: (cards, pages) => `${cards} kort fördelat på ${pages} A4-sidor (9 kort/sida)`,
    printClose: 'Stäng förhandsgranskning',
  },
  zh: {
    navDictionary: '三语词典',
    navFlashcards: '闪卡复习',
    navQuiz: '互动测验',
    navFavorites: '重点收藏 & 错题',
    totalTerms: '专业术语',
    mastered: '已掌握',
    searchPlaceholder: '即时搜索瑞典语术语、瑞典语释义、中文或英文...',
    filterAll: '全部',
    filterAllLetters: '清除字母筛选',
    letterIndex: '首字母索引 (A–Ä)',
    categoryFilter: '分类标签筛选',
    allCategories: '全部类别',
    favoritesOnly: '已收藏',
    unmasteredOnly: '未掌握词汇',
    clearFilters: '重置所有筛选',
    resultsCount: '找到词汇',
    noResults: '未找到符合条件的专业术语',
    swedishTerm: '瑞典语专业术语',
    swedishDesc: '瑞典语官方释义 (Förklaring)',
    chineseTrans: '中文精准翻译',
    englishTrans: '英文精准翻译',
    playAudio: '朗读瑞典语术语 (sv-SE)',
    playExplanation: '朗读瑞典语释义 (0.85x)',
    playExample: '朗读瑞典语工程例句 (0.85x)',
    example: '工程施工现场例句',
    copy: '复制术语与三语释义',
    copied: '已复制！',
    addFavorite: '加入重点收藏',
    removeFavorite: '取消收藏',
    markMastered: '标记为已牢记',
    markReview: '加入错题复习队列',
    flipCard: '翻转卡片',
    flipPrompt: '点击卡片任意区域或按空格键翻转查看释义',
    needsPractice: '需再复习',
    iKnowThis: '熟练掌握',
    prevCard: '上一张',
    nextCard: '下一张',
    shuffle: '随机乱序抽卡',
    cardCounter: (cur, tot) => `第 ${cur} / ${tot} 张卡片`,
    needsReview: '待强化错题',
    quizTitle: '建筑与工程专业术语测验',
    startQuiz: '开启互动测验',
    questionCount: '测验题量',
    quizMode: '出题模式',
    quizScope: '测验抽题范围',
    quizScopeAll: '全词库抽题',
    quizScopeFavorites: '仅测收藏夹词汇',
    quizScopeReview: '仅测错题/待复习词汇',
    questionCounter: (cur, tot) => `第 ${cur} / ${tot} 题`,
    correct: '正确',
    explanation: '专业考点深度解析',
    nextQuestion: '下一题',
    seeResults: '查看测验成绩',
    quizSummary: '测验成绩报告',
    tryAgain: '重新测验',
    newQuiz: '设置新测验',
    srsDue: '今日待复习',
    srsFuzzy: '模糊待巩固',
    srsGood: '熟悉良好',
    srsMastered: '熟练掌握',
    srsRatingAgain: '又忘了 (立即重学)',
    srsRatingHard: '模糊 (1天后)',
    srsRatingGood: '熟悉 (3天后)',
    srsRatingEasy: '熟练 (7天后)',
    srsQueueActive: 'SRS 间隔重复记忆队列优先',
    memoryDashboardTitle: '学习概览与记忆曲线',
    memoryDashboardDesc: '基于艾宾浩斯记忆遗忘曲线与 SM-2 算法，动态跟踪词汇熟练度与周期复习节点。',
    retentionOverview: '记忆状态分布',
    srsForecastTitle: '未来 7 天待复习预测分布',
    srsForecastDesc: '根据艾宾浩斯记忆间隔，预测未来一周内每日需复习巩固的词汇负荷。',
    statMastered: '已牢记',
    statDue: '今日待复习',
    statGood: '熟悉良好',
    statAgain: '陌生/模糊',
    statUnstarted: '全库未学',
    statTotalEngaged: '已纳入记忆追踪',
    dataBackup: '数据离线备份与恢复',
    exportJson: '导出完整备份 (JSON)',
    exportJsonDesc: '将全部收藏夹、牢记词汇、错题集、SRS 记忆间隔及测验历史保存为本地 JSON 文件。',
    exportCsv: '导出精简错题集 (CSV)',
    exportCsvDesc: '生成 Excel 兼容 (UTF-8 BOM) 的错题集，包含复习次数、SRS 间隔及下次到期时间。',
    importBackup: '读取并恢复备份文件',
    importModeOverwrite: '覆盖本地模式 (以备份为准)',
    importModeMerge: '智能合并模式 (合并并取最优进度)',
    confirmImport: '确认导入并生效',
    forecastDayToday: '今日',
    forecastDayTomorrow: '明天',
    retentionRateLabel: '熟练保持率',
    exportA4Print: '导出 A4 打印闪卡',
    exportA4PrintDesc: '采用标准 A4 纸张 3x3 矩形卡片网格排版，含清晰剪裁折叠参考线与现场工程例句，方便打印带至工地随时记忆。',
    printCardsBtn: '立即打印 / 另存为 PDF',
    printScopeLabel: '打印内容范围',
    printScopeCurrent: '当前筛选结果',
    printScopeFavorites: '我的重点收藏词',
    printScopeNeedsReview: '错题与待巩固词集',
    printScopeAll: '全词库所有专业词汇',
    printIncludeExamples: '包含现场工程例句',
    printCardMode: '排版模式',
    printModeFieldCards: '现场便携卡 (3x3 网格/页)',
    printModeFolding: '双面对折背诵卡 (居中折线)',
    printSummary: (cards, pages) => `共 ${cards} 张闪卡，预计占用 ${pages} 页 A4 纸 (标准 9 张/页)`,
    printClose: '关闭预览',
  },
  en: {
    navDictionary: 'Dictionary',
    navFlashcards: 'Flashcards',
    navQuiz: 'Quiz Mode',
    navFavorites: 'Favorites & Review',
    totalTerms: 'terms',
    mastered: 'Mastered',
    searchPlaceholder: 'Search Swedish term, explanation, Chinese or English...',
    filterAll: 'All',
    filterAllLetters: 'Clear letter filter',
    letterIndex: 'Letter Index (A–Ä)',
    categoryFilter: 'Categories',
    allCategories: 'All Categories',
    favoritesOnly: 'Favorites',
    unmasteredOnly: 'Unmastered',
    clearFilters: 'Reset all filters',
    resultsCount: 'Showing',
    noResults: 'No matching terms found',
    swedishTerm: 'Swedish Construction Term',
    swedishDesc: 'Swedish Explanation (Förklaring)',
    chineseTrans: 'Chinese Translation',
    englishTrans: 'English Translation',
    playAudio: 'Play Swedish pronunciation',
    playExplanation: 'Play Swedish explanation',
    playExample: 'Play Swedish example sentence',
    example: 'Site Example Sentence',
    copy: 'Copy term and explanation',
    copied: 'Copied!',
    addFavorite: 'Bookmark term',
    removeFavorite: 'Remove bookmark',
    markMastered: 'Mark as Mastered',
    markReview: 'Add to Review List',
    flipCard: 'Click to flip card',
    flipPrompt: 'Click anywhere or press Space to reveal explanation and translations',
    needsPractice: 'Need Practice',
    iKnowThis: 'I Know This',
    prevCard: 'Previous',
    nextCard: 'Next',
    shuffle: 'Shuffle Deck',
    cardCounter: (cur, tot) => `Card ${cur} of ${tot}`,
    needsReview: 'Needs Practice',
    quizTitle: 'Construction Terminology Quiz',
    startQuiz: 'Start Quiz Now',
    questionCount: 'Question Count',
    quizMode: 'Quiz Mode',
    quizScope: 'Question Pool',
    quizScopeAll: 'All Terms',
    quizScopeFavorites: 'Favorites Only',
    quizScopeReview: 'Mistakes & Review Only',
    questionCounter: (cur, tot) => `Question ${cur} of ${tot}`,
    correct: 'correct',
    explanation: 'Term Analysis & Explanation',
    nextQuestion: 'Next Question',
    seeResults: 'See Results',
    quizSummary: 'Quiz Performance Summary',
    tryAgain: 'Retake Quiz',
    newQuiz: 'Configure New Quiz',
    srsDue: 'Due for Review',
    srsFuzzy: 'Fuzzy / Hard',
    srsGood: 'Familiar / Good',
    srsMastered: 'Mastered',
    srsRatingAgain: 'Again (Today)',
    srsRatingHard: 'Hard (1d)',
    srsRatingGood: 'Good (3d)',
    srsRatingEasy: 'Easy (7d)',
    srsQueueActive: 'SRS Spaced Repetition Queue Active',
    memoryDashboardTitle: 'Memory Status & Retention Dashboard',
    memoryDashboardDesc: 'SM-2 spaced repetition tracking for long-term construction vocabulary retention.',
    retentionOverview: 'Retention Overview',
    srsForecastTitle: 'Next 7 Days Review Forecast',
    srsForecastDesc: 'Projected review workload based on the Ebbinghaus forgetting curve intervals.',
    statMastered: 'Mastered',
    statDue: 'Due Today',
    statGood: 'Good',
    statAgain: 'Again / Hard',
    statUnstarted: 'Unstarted',
    statTotalEngaged: 'Tracked Terms',
    dataBackup: 'Data Backup & Restore',
    exportJson: 'Export Full Backup (JSON)',
    exportJsonDesc: 'Save all bookmarks, mastered words, review items, SRS data, and quiz history to a JSON file.',
    exportCsv: 'Export Mistakes (CSV)',
    exportCsvDesc: 'Download review queue as an Excel-friendly UTF-8 CSV with SRS metrics.',
    importBackup: 'Import Backup File',
    importModeOverwrite: 'Overwrite local progress',
    importModeMerge: 'Merge with local progress',
    confirmImport: 'Apply & Restore Data',
    forecastDayToday: 'Today',
    forecastDayTomorrow: 'Tomorrow',
    retentionRateLabel: 'Retention Health',
    exportA4Print: 'Export A4 Flashcards',
    exportA4PrintDesc: 'Export printable A4 sheets (3x3 cards per page) with cutting lines and jobsite examples for field study.',
    printCardsBtn: 'Print / Save as PDF',
    printScopeLabel: 'Print Scope',
    printScopeCurrent: 'Current Filtered Cards',
    printScopeFavorites: 'My Bookmarked Favorites',
    printScopeNeedsReview: 'Mistakes & Review Queue',
    printScopeAll: 'All Vocabulary Terms',
    printIncludeExamples: 'Include Site Examples',
    printCardMode: 'Layout Format',
    printModeFieldCards: 'Field Pocket Cards (3x3 Grid)',
    printModeFolding: 'Two-Sided Folding Cards',
    printSummary: (cards, pages) => `${cards} cards across ${pages} A4 pages (9 cards/page)`,
    printClose: 'Close Preview',
  },
};
