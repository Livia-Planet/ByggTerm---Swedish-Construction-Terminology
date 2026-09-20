import React, { useState, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  Flame,
  ArrowRight,
  Star,
  BookOpen,
  Filter,
} from 'lucide-react';
import { ConstructionTerm, Language, TermCategory, QuizScope } from '../types';
import { ALL_TERMS } from '../data/terms';
import { CATEGORIES } from '../data/categories';
import { I18N } from '../data/i18n';
import { speakSwedish } from '../utils/tts';
import { shuffleArray, generateDistractors } from '../utils/quiz';

interface QuizViewProps {
  terms: ConstructionTerm[];
  lang: Language;
  favorites: string[];
  needsReview: string[];
  onRecordQuizResult: (score: number, total: number, scope?: QuizScope) => void;
  onMarkNeedsReview: (id: string) => void;
}

type QuizMode = 'term_to_meaning' | 'explanation_to_term' | 'mixed';
type PromptType = 'term_to_meaning' | 'definition_to_term';

interface Question {
  term: ConstructionTerm;
  prompt: string;
  subPrompt?: string;
  promptType: PromptType;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

export const QuizView: React.FC<QuizViewProps> = ({
  terms,
  lang,
  favorites,
  needsReview,
  onRecordQuizResult,
  onMarkNeedsReview,
}) => {
  const [quizState, setQuizState] = useState<'config' | 'in_progress' | 'completed'>('config');
  const [quizScope, setQuizScope] = useState<QuizScope>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [quizMode, setQuizMode] = useState<QuizMode>('term_to_meaning');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [incorrectQuestions, setIncorrectQuestions] = useState<Question[]>([]);

  const t = I18N[lang];

  // Derive terms available in the chosen scope
  const scopedTerms = useMemo(() => {
    if (quizScope === 'favorites') {
      return terms.filter((term) => favorites.includes(term.id));
    }
    if (quizScope === 'needsReview') {
      return terms.filter((term) => needsReview.includes(term.id));
    }
    return terms;
  }, [terms, quizScope, favorites, needsReview]);

  // Further filter by category if chosen
  const availablePool = useMemo(() => {
    if (selectedCategory === 'ALL') {
      return scopedTerms;
    }
    return scopedTerms.filter((term) => term.category === selectedCategory);
  }, [scopedTerms, selectedCategory]);

  // Allowed question counts based on available terms
  const questionCountOptions = useMemo(() => {
    const total = availablePool.length;
    if (total <= 0) return [0];
    if (total <= 5) return [total];
    if (total <= 10) return [5, total];
    if (total <= 20) return [5, 10, total];
    return [10, 20, Math.min(30, total)];
  }, [availablePool.length]);

  // Adjust question count if pool changed
  React.useEffect(() => {
    if (availablePool.length > 0) {
      if (questionCount > availablePool.length || !questionCountOptions.includes(questionCount)) {
        setQuestionCount(questionCountOptions[questionCountOptions.length - 1]);
      }
    }
  }, [availablePool.length, questionCount, questionCountOptions]);

  // Generate Questions using strict unbiased Fisher-Yates and 4-step distractor algorithm
  const startQuiz = (overridePool?: ConstructionTerm[]) => {
    const targetPool = overridePool || availablePool;
    if (targetPool.length === 0) return;

    // Shuffle target pool using unbiased Fisher-Yates
    const shuffledPool = shuffleArray(targetPool);
    const count = Math.min(questionCount > 0 ? questionCount : 5, shuffledPool.length);
    const selectedTerms = shuffledPool.slice(0, count);

    const generatedQuestions: Question[] = selectedTerms.map((targetTerm) => {
      // Step 1, 2, 3, 4: Robust 4-step distractors (same category priority + global fallback to ALL_TERMS + final shuffle)
      const distractors = generateDistractors(targetTerm, terms, 3, ALL_TERMS);

      // Combine 1 target and 3 distractors, then Fisher-Yates shuffle
      const allOptions = shuffleArray([targetTerm, ...distractors]);

      if (quizMode === 'term_to_meaning') {
        return {
          term: targetTerm,
          prompt: targetTerm.term,
          subPrompt:
            lang === 'zh'
              ? '请选出正确的中文释义：'
              : lang === 'sv'
              ? 'Välj rätt betydelse:'
              : 'Choose the correct meaning:',
          promptType: 'term_to_meaning',
          options: allOptions.map((opt) => ({
            id: opt.id,
            text: `${opt.translationZh} / ${opt.translationEn}`,
            isCorrect: opt.id === targetTerm.id,
          })),
        };
      } else if (quizMode === 'explanation_to_term') {
        return {
          term: targetTerm,
          prompt: targetTerm.explanationSv,
          subPrompt:
            lang === 'zh'
              ? '请根据释义选出对应的瑞典语术语：'
              : lang === 'sv'
              ? 'Vilken svensk term avses?'
              : 'Which Swedish term matches?',
          promptType: 'definition_to_term',
          options: allOptions.map((opt) => ({
            id: opt.id,
            text: opt.term,
            isCorrect: opt.id === targetTerm.id,
          })),
        };
      } else {
        // mixed mode
        const isTermPrompt = Math.random() > 0.5;
        if (isTermPrompt) {
          return {
            term: targetTerm,
            prompt: targetTerm.term,
            subPrompt: `${targetTerm.explanationSv.slice(0, 80)}...`,
            promptType: 'term_to_meaning',
            options: allOptions.map((opt) => ({
              id: opt.id,
              text: opt.translationZh,
              isCorrect: opt.id === targetTerm.id,
            })),
          };
        } else {
          return {
            term: targetTerm,
            prompt: targetTerm.explanationSv,
            subPrompt:
              lang === 'zh'
                ? '请根据释义选出对应的瑞典语术语：'
                : lang === 'sv'
                ? 'Vilken svensk term avses?'
                : 'Which Swedish term matches?',
            promptType: 'definition_to_term',
            options: allOptions.map((opt) => ({
              id: opt.id,
              text: opt.term,
              isCorrect: opt.id === targetTerm.id,
            })),
          };
        }
      }
    });

    setQuestions(generatedQuestions);
    setCurrentQIndex(0);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setIncorrectQuestions([]);
    setQuizState('in_progress');
  };

  const currentQuestion: Question | undefined = questions[currentQIndex];

  const handleSelectOption = (optionId: string) => {
    if (isAnswerSubmitted || !currentQuestion) return;

    setSelectedOptionId(optionId);
    setIsAnswerSubmitted(true);

    const isCorrect = currentQuestion.options.find((o) => o.id === optionId)?.isCorrect;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setStreak((prev) => {
        const next = prev + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
      setIncorrectQuestions((prev) => [...prev, currentQuestion]);
      onMarkNeedsReview(currentQuestion.term.id);
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
    } else {
      const finalScore = score + (currentQuestion?.options.find((o) => o.id === selectedOptionId)?.isCorrect ? 0 : 0);
      onRecordQuizResult(finalScore, questions.length, quizScope);
      setQuizState('completed');
    }
  };

  /**
   * Anti-cheating audio prompt handler:
   * Prior to submission, definition questions MUST speak the explanation rather than leaking the target term.
   */
  const handlePromptAudio = (question: Question) => {
    if (question.promptType === 'definition_to_term') {
      speakSwedish(question.term.explanationSv, { rate: 0.85 });
    } else {
      speakSwedish(question.term.term, { rate: 0.85 });
    }
  };

  const getHonorTitle = (percentage: number) => {
    if (percentage === 100) {
      return {
        badge: '🏆',
        title: lang === 'sv' ? 'Byggmästare!' : lang === 'zh' ? '特级建造大师 / 完美通关！' : 'Master Builder!',
        desc: lang === 'sv' ? 'Full pott! Du behärskar dessa byggtermer till fullo.' : '满分！所有专业工程术语全对，熟练度极高！',
        color: 'text-amber-500 bg-amber-50 border-amber-300',
      };
    } else if (percentage >= 80) {
      return {
        badge: '🎖️',
        title: lang === 'sv' ? 'Platschef!' : lang === 'zh' ? '项目经理级别 / 掌握扎实！' : 'Site Manager!',
        desc: lang === 'sv' ? 'Grymt jobbat! Du har mycket god koll på facktermerna.' : '非常扎实！绝大部分专业词汇均已融会贯通。',
        color: 'text-emerald-600 bg-emerald-50 border-emerald-300',
      };
    } else if (percentage >= 60) {
      return {
        badge: '🔨',
        title: lang === 'sv' ? 'Byggnadsarbetare!' : lang === 'zh' ? '一线专业工匠 / 良好水准！' : 'Skilled Worker!',
        desc: lang === 'sv' ? 'Bra genomfört! Repetera gärna de få orden du missade.' : '良好通过！建议针对本次错题稍作温故即可巩固。',
        color: 'text-blue-600 bg-blue-50 border-blue-300',
      };
    } else {
      return {
        badge: '📐',
        title: lang === 'sv' ? 'Bygglärling!' : lang === 'zh' ? '工程学徒 / 持续进阶！' : 'Apprentice!',
        desc: lang === 'sv' ? 'Bra försök! Missade ord har automatiskt lagts till i din repetitionslista.' : '已自动将错题收录进待复习列表，随时可定向重测！',
        color: 'text-slate-600 bg-slate-100 border-slate-300',
      };
    }
  };

  // 1. CONFIGURATION VIEW
  if (quizState === 'config') {
    const isPoolEmpty = availablePool.length === 0;

    return (
      <div id="quiz-config-view" className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.quizTitle}
          </h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {lang === 'sv'
              ? 'Testa och stärk dina kunskaper i svensk byggterminologi med anpassade frågeområden.'
              : lang === 'zh'
              ? '自主选择测试题源（全词库、收藏夹或错题集），强化瑞典语工程现场专业词汇记忆。'
              : 'Test and enhance your Swedish construction vocabulary with targeted scopes.'}
          </p>
        </div>

        {/* 1. Quiz Scope Selection Panel */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-600" />
            <span>{t.quizScope}</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* All terms */}
            <button
              id="quiz-scope-all"
              onClick={() => {
                setQuizScope('all');
                setSelectedCategory('ALL');
              }}
              className={`p-3.5 rounded-xl border text-left transition relative ${
                quizScope === 'all'
                  ? 'border-amber-500 bg-amber-50/70 text-slate-900 ring-2 ring-amber-400 font-medium'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-700" />
                  {t.quizScopeAll}
                </span>
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  {terms.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {lang === 'sv' ? 'Slumpmässigt ur hela ordförrådet' : '从全部工程词库中随机抽题'}
              </p>
            </button>

            {/* Favorites only */}
            <button
              id="quiz-scope-favorites"
              onClick={() => setQuizScope('favorites')}
              className={`p-3.5 rounded-xl border text-left transition relative ${
                quizScope === 'favorites'
                  ? 'border-amber-500 bg-amber-50/70 text-slate-900 ring-2 ring-amber-400 font-medium'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Star className={`w-3.5 h-3.5 ${favorites.length > 0 ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                  {t.quizScopeFavorites}
                </span>
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  {favorites.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {lang === 'sv' ? 'Bara ord du själv har stjärnmärkt' : '仅从你的重点收藏词汇中出题'}
              </p>
            </button>

            {/* Mistakes & Review only */}
            <button
              id="quiz-scope-review"
              onClick={() => setQuizScope('needsReview')}
              className={`p-3.5 rounded-xl border text-left transition relative ${
                quizScope === 'needsReview'
                  ? 'border-rose-500 bg-rose-50/70 text-slate-900 ring-2 ring-rose-400 font-medium'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <XCircle className={`w-3.5 h-3.5 ${needsReview.length > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
                  {t.quizScopeReview}
                </span>
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                  {needsReview.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {lang === 'sv' ? 'Tidigare felaktiga eller osäkra ord' : '集中攻克错题与待巩固词汇'}
              </p>
            </button>
          </div>

          {/* Empty Scope Alert */}
          {isPoolEmpty && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2">
              <div>
                <p className="font-semibold">
                  {quizScope === 'favorites'
                    ? lang === 'sv'
                      ? 'Din favoritlista är tom ännu!'
                      : '当前收藏夹为空，暂无法出题。'
                    : lang === 'sv'
                    ? 'Din repetitionslista är tom! Inga missade ord just nu.'
                    : '待复习错题集为空，暂无错题需要强化。'}
                </p>
                <p className="text-amber-800/80">
                  {lang === 'sv'
                    ? 'Välj "Hela ordlistan" eller markera ord i ordboken först.'
                    : '你可以切换为“全词库抽题”，或在词典/闪卡中收藏难词后再来测验。'}
                </p>
              </div>
              <button
                onClick={() => {
                  setQuizScope('all');
                  setSelectedCategory('ALL');
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition whitespace-nowrap self-start sm:self-center shadow-xs"
              >
                {lang === 'sv' ? 'Byt till Hela ordlistan' : '切换为全词库抽题'}
              </button>
            </div>
          )}
        </div>

        {/* 2. Question Count Setting */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            {t.questionCount} {availablePool.length > 0 && `(可用: ${availablePool.length} 词)`}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {questionCountOptions.map((num) => (
              <button
                key={num}
                disabled={isPoolEmpty}
                onClick={() => setQuestionCount(num)}
                className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition ${
                  questionCount === num && !isPoolEmpty
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none'
                }`}
              >
                {num === availablePool.length && availablePool.length > 5
                  ? `${num} (${lang === 'sv' ? 'Alla' : '全部'})`
                  : `${num} ${lang === 'sv' ? 'frågor' : lang === 'zh' ? '道题' : 'questions'}`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Quiz Mode Setting */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            {t.quizMode}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => setQuizMode('term_to_meaning')}
              className={`p-3 rounded-xl border text-left transition ${
                quizMode === 'term_to_meaning'
                  ? 'border-amber-500 bg-amber-50 text-slate-900 ring-2 ring-amber-400'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-xs font-bold mb-0.5">🇸🇪 Term ➔ 🇨🇳 / 🇬🇧</div>
              <div className="text-[11px] text-slate-500">
                {lang === 'sv' ? 'Svensk term till översättning' : '看瑞典语术语选释义'}
              </div>
            </button>

            <button
              onClick={() => setQuizMode('explanation_to_term')}
              className={`p-3 rounded-xl border text-left transition ${
                quizMode === 'explanation_to_term'
                  ? 'border-amber-500 bg-amber-50 text-slate-900 ring-2 ring-amber-400'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-xs font-bold mb-0.5">📖 Förklaring ➔ 🇸🇪</div>
              <div className="text-[11px] text-slate-500">
                {lang === 'sv' ? 'Beskrivning till svensk term' : '看瑞典语专业释义选术语'}
              </div>
            </button>

            <button
              onClick={() => setQuizMode('mixed')}
              className={`p-3 rounded-xl border text-left transition ${
                quizMode === 'mixed'
                  ? 'border-amber-500 bg-amber-50 text-slate-900 ring-2 ring-amber-400'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-xs font-bold mb-0.5">🔀 Blandat läge</div>
              <div className="text-[11px] text-slate-500">
                {lang === 'sv' ? 'Varierade frågetyper' : '双向混合出题'}
              </div>
            </button>
          </div>
        </div>

        {/* 4. Category Focus Setting */}
        {quizScope === 'all' && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {t.categoryFilter}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.allCategories} ({terms.length})
              </button>
              {(Object.keys(CATEGORIES) as TermCategory[]).map((catKey) => {
                const cat = CATEGORIES[catKey];
                const isSelected = selectedCategory === catKey;
                const catCount = terms.filter((item) => item.category === catKey).length;
                return (
                  <button
                    key={catKey}
                    onClick={() => setSelectedCategory(catKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                      isSelected
                        ? `${cat.bg} ${cat.text} ${cat.border} ring-2 ring-amber-400 font-bold`
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name[lang]}</span>
                    <span className="text-[10px] opacity-70">({catCount})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          id="start-quiz-btn"
          disabled={isPoolEmpty}
          onClick={() => startQuiz()}
          className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-base shadow-sm hover:bg-amber-400 active:scale-[0.99] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Award className="w-5 h-5" />
          <span>{t.startQuiz}</span>
        </button>
      </div>
    );
  }

  // 2. COMPLETED VIEW
  if (quizState === 'completed') {
    const percentage = Math.round((score / questions.length) * 100);
    const honor = getHonorTitle(percentage);

    return (
      <div id="quiz-results-view" className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in duration-300">
        <div className="text-center space-y-3 pb-6 border-b border-slate-100">
          <div className="text-5xl">{honor.badge}</div>
          <div className="space-y-1">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${honor.color}`}>
              {honor.title}
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {t.quizSummary}
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">{honor.desc}</p>
          </div>

          {/* Performance metrics */}
          <div className="grid grid-cols-3 gap-3 pt-3 max-w-sm mx-auto">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-500 block">Poäng / 得分</span>
              <span className="text-2xl font-black text-slate-900">
                {score} / {questions.length}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-500 block">Träffsäkerhet</span>
              <span className="text-2xl font-black text-amber-600">{percentage}%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xs text-slate-500 block">Bästa streak</span>
              <span className="text-2xl font-black text-emerald-600">{bestStreak} 🔥</span>
            </div>
          </div>

          {/* Scope Badge */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <span>{t.quizScope}:</span>
              <strong>
                {quizScope === 'all'
                  ? t.quizScopeAll
                  : quizScope === 'favorites'
                  ? t.quizScopeFavorites
                  : t.quizScopeReview}
              </strong>
            </span>
          </div>
        </div>

        {/* Review Missed Questions */}
        {incorrectQuestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-500" />
                <span>
                  {lang === 'sv'
                    ? `Frågor att repetera (${incorrectQuestions.length})`
                    : lang === 'zh'
                    ? `本次测验错题列表 (${incorrectQuestions.length} 道)`
                    : `Questions to review (${incorrectQuestions.length})`}
                </span>
              </h3>
              <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-medium border border-rose-200">
                {lang === 'sv' ? 'Tillagda i repetitionskön' : '已自动标记至待复习队列'}
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {incorrectQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 text-xs sm:text-sm space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{q.term.term}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => speakSwedish(q.term.term, { rate: 0.85 })}
                        className="text-slate-500 hover:text-amber-800 p-1 rounded hover:bg-rose-100/60"
                        title={lang === 'sv' ? 'Lyssna på term' : '播放术语'}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 text-xs">{q.term.explanationSv}</p>
                  <p className="font-medium text-amber-900 text-xs">
                    🇨🇳 {q.term.translationZh} | 🇬🇧 {q.term.translationEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {incorrectQuestions.length > 0 ? (
            <button
              id="retry-missed-btn"
              onClick={() => startQuiz(incorrectQuestions.map((q) => q.term))}
              className="py-3 px-4 rounded-xl bg-rose-600 text-white font-bold text-sm shadow-xs hover:bg-rose-700 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{lang === 'sv' ? `Gör om missade (${incorrectQuestions.length})` : `仅重测本次错题 (${incorrectQuestions.length})`}</span>
            </button>
          ) : (
            <button
              onClick={() => startQuiz()}
              className="py-3 px-4 rounded-xl bg-amber-500 text-slate-950 font-bold text-sm shadow-xs hover:bg-amber-400 transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.tryAgain}</span>
            </button>
          )}

          <button
            onClick={() => setQuizState('config')}
            className="py-3 px-4 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2"
          >
            <span>{t.newQuiz}</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. IN-PROGRESS ACTIVE QUIZ
  if (!currentQuestion) return null;

  const category = CATEGORIES[currentQuestion.term.category] || CATEGORIES.tools;

  return (
    <div id="active-quiz-view" className="max-w-2xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Top Header: Progress & Streak */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500">
            {t.questionCounter(currentQIndex + 1, questions.length)}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {score} {t.correct}
          </span>
          <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
            ({quizScope === 'favorites' ? t.quizScopeFavorites : quizScope === 'needsReview' ? t.quizScopeReview : t.quizScopeAll})
          </span>
        </div>

        {/* Streak Counter */}
        {streak > 1 && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200 animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>{streak} i rad!</span>
          </div>
        )}
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${category.bg} ${category.text} ${category.border}`}
          >
            <span>{category.icon}</span>
            <span>{category.name[lang]}</span>
          </span>

          {/* Prompt audio button with cheat-prevention logic:
              When promptType is 'definition_to_term', reads the explanation rather than leaking the answer. */}
          <button
            type="button"
            onClick={() => handlePromptAudio(currentQuestion)}
            className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-800 transition"
            title={
              currentQuestion.promptType === 'definition_to_term'
                ? lang === 'sv'
                  ? 'Läs upp förklaring (skyddar mot facit)'
                  : lang === 'zh'
                  ? '朗读释义（防泄题）'
                  : 'Listen to explanation'
                : lang === 'sv'
                ? 'Läs upp term'
                : lang === 'zh'
                ? '朗读术语'
                : 'Listen to term'
            }
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Prompt Content */}
        <div className="space-y-2 text-center sm:text-left">
          {currentQuestion.subPrompt && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {currentQuestion.subPrompt}
            </p>
          )}
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {currentQuestion.prompt}
          </h3>
        </div>

        {/* Multiple Choice Options */}
        <div className="grid grid-cols-1 gap-3 pt-2">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedOptionId === opt.id;
            let btnStyle = 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-800';

            if (isAnswerSubmitted) {
              if (opt.isCorrect) {
                btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400';
              } else if (isSelected && !opt.isCorrect) {
                btnStyle = 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-300';
              } else {
                btnStyle = 'bg-white border-slate-200 opacity-50 text-slate-500';
              }
            }

            return (
              <button
                key={opt.id}
                id={`quiz-option-${idx}`}
                disabled={isAnswerSubmitted}
                onClick={() => handleSelectOption(opt.id)}
                className={`p-4 rounded-xl border-2 text-left font-medium text-sm sm:text-base transition-all flex items-center justify-between gap-3 ${btnStyle}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center font-mono">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt.text}</span>
                </div>

                {isAnswerSubmitted && (
                  <div>
                    {opt.isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {isSelected && !opt.isCorrect && <XCircle className="w-5 h-5 text-rose-600" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Answer Explanation Breakdown: Explicitly separated buttons for Term vs Explanation */}
        {isAnswerSubmitted && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t.explanation}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => speakSwedish(currentQuestion.term.term, { rate: 0.85 })}
                  className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5 text-xs font-semibold transition"
                  title={lang === 'sv' ? 'Spela upp term' : lang === 'zh' ? '播放术语 (Term)' : 'Play Term'}
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>{lang === 'sv' ? 'Spela term' : lang === 'zh' ? '播放术语 (Term)' : 'Play Term'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => speakSwedish(currentQuestion.term.explanationSv, { rate: 0.85 })}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-1.5 text-xs font-semibold transition"
                  title={lang === 'sv' ? 'Spela upp förklaring' : lang === 'zh' ? '播放释义 (Explanation)' : 'Play Explanation'}
                >
                  <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>{lang === 'sv' ? 'Spela förklaring' : lang === 'zh' ? '播放释义 (Explanation)' : 'Play Explanation'}</span>
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <strong className="text-slate-900 font-bold">{currentQuestion.term.term}</strong>: {currentQuestion.term.explanationSv}
            </p>
            <div className="pt-1 text-xs text-slate-600 flex flex-wrap gap-3 font-medium">
              <span>🇨🇳 {currentQuestion.term.translationZh}</span>
              <span>🇬🇧 {currentQuestion.term.translationEn}</span>
            </div>
          </div>
        )}

        {/* Next Question / Finish Button */}
        {isAnswerSubmitted && (
          <div className="pt-2">
            <button
              id="quiz-next-question-btn"
              onClick={handleNextQuestion}
              className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm sm:text-base hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-sm"
            >
              <span>{currentQIndex < questions.length - 1 ? t.nextQuestion : t.seeResults}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
