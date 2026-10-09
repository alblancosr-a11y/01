"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { X, CheckCircle2, XCircle, Sparkles, AlertTriangle } from 'lucide-react';
import type { Poem, AppSettings, VerseStats, ErrorLogEntry, SuccessLogEntry, PoemStats, UserProfile } from '../lib/types';
import type { FateenRoundState } from '../lib/fateenChallenge';
import { tGender, withName, genderText } from '../lib/arabicUtils';
import {
  createFateenRound,
  getCurrentVerseIndex,
  getCurrentKeyword,
  submitAnswer,
  getRemainingCount,
  getTotalCount,
  getProgressPercent,
  hasKeywordForVerse,
  selectKeywords,
} from '../lib/fateenChallenge';
import { compareAnswers, removeTashkeel, type ComparisonResult, type DiffToken } from '../lib/poem-parser';
import { detectErrorType, createErrorEntry, createSuccessEntry } from '../lib/errorLog';
import { defaultVerseStats } from '../lib/storage';
import { Button, ProgressBar, Card } from '../ui';
import GazelleIcon from './GazelleIcon';

// ===== أنواع =====

type Phase = 'intro' | 'question' | 'feedback' | 'complete';

interface Props {
  poem: Poem;
  settings: AppSettings;
  userProfile: UserProfile;
  poemStats: PoemStats | undefined;
  onClose: () => void;
  onVerseUpdate: (poemId: string, vs: VerseStats) => void;
  onErrorLog: (entry: ErrorLogEntry) => void;
  onSuccessLog: (entry: SuccessLogEntry) => void;
}

// ===== رسائل فطين الافتتاحية =====

const FATEEN_INTROS = [
  "مرحبًا! أنا فطين.\n[أحضرتَ|أحضرتِ] [قصيدتَك|قصيدتكِ]، وأنا أحضرتُ [لكَ|لكِ] تحديًا صغيرًا...\nسأتنقّل بين أبياتها على غير ترتيب، و[أعطيكَ|أعطيكِ] من كل بيت كلمةً واحدة فقط.\nإن [استطعتَ|استطعتِ] أن [تستحضر|تستحضري] البيت من تلك الكلمة، [فلكَ|فلكِ] الجولة.\nلكن [انتبه|انتبهي]... لن [تعرف|تعرفي] أيَّ بيت سأختار بعد ذلك!\nهل [تستطيع|تستطيعين] يا (اسم المستخدم) أن تسبق فطين؟",

  "أهلًا [بكَ|بكِ]! أنا فطين. نِصاب تحدينا اليوم يسير: كلمةٌ واحدة تُلقى [إليكَ|إليكِ] من كل بيت، و[عليكَ|عليكِ] إظهار البيت بتمام شَطْرَيْه. الأبياتُ مبعثرة، والكلمات مقتطعة بعناية… فهل تثبت ذاكرة [المستخدم (اسم المستخدم)|الآنسة (اسم المستخدم)] أمام حيلتي؟",

  "مرحبًا! أنا فطين، غزال التحديات ومضمار الأبيات. [استخلصتُ لكَ|استخلصتُ لكِ] من كل بيت كلمة واحدة [ووجّهتُ الباقي لذاكرتكَ|ووجّهتُ الباقي لذاكرتكِ]… لن تلتزم الأبيات ترتيبًا، ولن تكون الكلمة طيّعة. فهيا نستكشف ما [خزنته ذاكرتكَ|خزنته ذاكرتكِ] يا (اسم المستخدم)!",
];

// ===== رسائل فطين أثناء الجولة =====

const FATEEN_CORRECT_MSGS = [
  'أحسنت[َ|ِ] يا (اسم المستخدم)! هل [ستكمل|ستكملين] التحدّي بهذه القوّة؟',
  '[أصبتَ|أصبتِ] — كانت الكلمة خيطًا، [فغزلتَ|فغزلتِ] منها البيتَ بأكمله.',
  'ما ظننتُ أن هذه الكلمة وحدها كفيلةٌ بفتح أقفال البيت بهذه السرعة!',
  'هذه [لكَ يا سيدي|لكِ يا آنسة]… بيدَ أن الجولات الباقية تنطوي على ما هو أشد وأدقّ.',
  '[أدركتَ|أدركتِ] الصواب يا (اسم المستخدم)! قد بدت [ذاكرتكَ|ذاكرتكِ] أسبق من حيلتي هذه المرة.',
  '[أدركتَه|أدركتِه]! [هلمَّ|هلمِّي]، [فسألقي إليكَ|فسألقي إليكِ] بكلمةٍ أشدّ مَكْرًا.',
  'إجابةٌ سديدة يا [سيدي|آنسة]… أعترفُ [أنكَ نزعتَ|أنكِ نزعتِ] البيتَ من جعبتي قبل أن أستوعب.',
  '[شيّدتَ|شيّدتِ] أركان البيت كلمةً كلمة، وما اضطرب [لكَ|لكِ] حرفٌ ولا وزن.',
  'براعةٌ مشهودة يا (اسم المستخدم)! غير أن البيت التالي يتوارى بدهاء.',
  'حسبتُ أني ظبّطتُ هذه الكلمة وأخفيتها، لكنّها غدت مفتاحًا طيّعًا بين [يديكَ|يديكِ].',
  'أحسنتَ الصنيع! إن ذاكرة [حافِظِ|حافِظةِ] الشعر لا تستدرجها الحِيَل.',
  '[أصبتَ|أصبتِ] يا (اسم المستخدم)! ولكن تذكّر، ما زال في جعبتي كلماتٌ لم أُشهِرها بعد.',
  'ضربةُ حاذق! [استحضرتَ|استحضرتِ] الصدرَ والعَجُز ببراعة.',
  'كانت هذه الجولة لصالحك[َ|ِ] منذ البدء، لكن الخاتمة هي التي تحسم.',
];

const FATEEN_WRONG_MSGS = [
  'مهلًا! استأثرتُ بهذا البيت… لكنك[َ|ِ] [ستعود|ستعودين] لانتزاعه بقوة أشد.',
  'كان هذا البيت حليفي قبل أن [تتمَّ|تتمّي] تأمّل الكلمة.',
  'استغللتُ ثغرةً يسيرة — لا بأس، فالذاكرةُ تُصقلُ بالكرّ والفرّ.',
  'أفلت [منك|منكِ] شَطْرا البيت… وقد أفردتُ له موضعًا في قسم التقوية لتثبيته.',
  'ظفرتُ به! لقد [راوغتكَ|راوغتكِ] الكلمة عند الحرف الأخير.',
  'خطوةٌ واحدة باعدت بينك[َ|ِ] وبين استحضاره، وما زال المضمارُ [أمامكَ|أمامكِ] لتجاوزها.',
  'الجولة لي هذه المرة… غير أن المعركة أطول من بيت واحد.',
  '[ناهزتَ|ناهزتِ] الصواب! [خانكَ|خانكِ] الحرف الأخير، وأنا لا أتسامح في دقائق الشعر.',
  'استملكتُ هذا البيت… وسيبقى قيد التثبيت حتى [تُحكمَ قبضتكَ|تُحكمي قبضتَكِ] عليه.',
  'هذه الجولة لي! بيدَ أن [ذاكرتكَ|ذاكرتكِ] طافت حول الحمى وكانت أطول باعًا مما أظن.',
  '[لمحتُكَ تثبت الصدر ثم تتريّث|لمحتُكِ تثبتين الصدر ثم تتريّثين]… وكان العَجُز قد انسَلَّ معي.',
  'انتزعته قبل أن تتكامل حروفه! [اجمع|اجمعي] شتات [ذهنك|ذهنكِ]، فالطريق ما زال ممتدًّا.',
  'الغلبة لي هذه المرة… ولا [تبتئس|تبتئسي]، فالعثراتُ هي التي تصنع الحُفّاظ.',
  'تصدّع بناءُ [بيتكَ|بيتكِ] عند آخر شطر… فتداركتُه وأخذتُه قبل السقوط.',
];

const FATEEN_MSG_RECENT_LIMIT = 5;

const FATEEN_WIN_MSGS = [
  "لااا… استُؤصلت حيلتي وأُلحقت بي الهزيمة!\nلم أستطع أن أختلس [منك|منكِ] بيتًا واحدًا ولا شَطْرًا.\nلقد كانت [ذاكرتكَ|ذاكرتكِ] أنفذ بصيرة من حيلتي!",

  "انكسرت الحيلة…\n[أثبتَّ|أثبتِّ] بما لا يدع مجالًا للريب أن [ذاكرتكَ|ذاكرتكِ] عصيّةٌ على الزلل.\nفطين يحني قرنيه إجلالًا [لثباتكَ وقوة استحضاركَ|لثباتكِ وقوة استحضاركِ].",

  "أعترفُ مجبرًا… كانت هذه الجولة دانية القِطاف [لكَ يا سيدي (اسم المستخدم)|لكِ يا آنسة (اسم المستخدم)].\nأن تُبنى الأبيات بتمامها انطلاقًا من كلمة فريدة؛ فذاك شأوٌ لا يناله إلا الخواص!\nفطين يسلّم بالهزيمة هذه الكَرّة. [أبدعتَ|أبدعتِ] صنيعًا!",
];

const FATEEN_LOSS_MSGS = [
  "هذه الجولة انقادت لي يا (اسم المستخدم)!\nاستأثرتُ ببعض [أبياتكَ|أبياتكِ] وأحكمتُ القبضة عليها، ولكن لا يدخلنّ [عليك|عليكِ] اليأس.\n[أعد|أعيدي] صقل الأبيات، ثم [كرّ|كرّي] عليّ كرّةً أخرى.",

  "ها! الغلبة لي في هذه المَرّة.\nولكني أعلم يقيناً أن [همّتكَ|همّتكِ] لن تقنع بهذه النتيجة…\nالأبيات التي خانت[كَ|كِ] حروفها لا تتطلب إلا صقلاً وتكراراً متأنياً.\n[عُد|عُودي] إلى الميدان متى ما اكتملت [عدّتكَ|عدّتكِ] يا (اسم المستخدم)!",

  "فطين يتصدر هذا الشوط!\nولكن لا ضير ولا أسف — فكلُّ بيتٍ عزّ [عليك|عليكِ] استحضاره\nليس سوى محطة لشحذ الذاكرة.",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function PoeticVerseDisplay({
  sadr,
  ajar,
  showTashkeel = true,
  fontSize = '1.25rem',
}: {
  sadr: string;
  ajar: string;
  showTashkeel?: boolean;
  fontSize?: string;
}) {
  const fmt = (t: string) => (showTashkeel ? t : removeTashkeel(t));

  if (!ajar || !ajar.trim()) {
    return (
      <div className="poetic-verse" style={{ fontFamily: 'var(--font-poem)', fontSize, lineHeight: '2.1', color: 'var(--text-0)' }}>
        <div className="poetic-sadr">{fmt(sadr)}</div>
      </div>
    );
  }

  return (
    <div className="poetic-verse" style={{ fontFamily: 'var(--font-poem)', fontSize, lineHeight: '2.1', color: 'var(--text-0)' }}>
      <div className="poetic-sadr">{fmt(sadr)}</div>
      <div className="poetic-ajar">{fmt(ajar)}</div>
    </div>
  );
}

function DiffDisplay({ tokens }: { tokens: DiffToken[] }) {
  return (
   <p className="!inline-block !text-sm !leading-loose" style={{ fontFamily: 'var(--font-poem)' }}>
      {tokens.map((t, i) => (
        <span
          key={i}
          className={
            t.type === 'correct' ? 'diff-correct' :
            t.type === 'missing' ? 'diff-missing' :
            'diff-error'
          }
        >
          {t.text}{' '}
        </span>
      ))}
    </p>
  );
}

export default function FateenChallengeView({
  poem,
  settings,
  userProfile,
  poemStats,
  onClose,
  onVerseUpdate,
  onErrorLog,
  onSuccessLog,
}: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [round, setRound] = useState<FateenRoundState | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showTashkeel, setShowTashkeel] = useState(true);
  const [lastResult, setLastResult] = useState<ComparisonResult | null>(null);
  const [lastVerseIndex, setLastVerseIndex] = useState<number | null>(null);
  const [fateenMsg, setFateenMsg] = useState<string | null>(null);
  const msgHistoryRef = useRef<string[]>([]);
  
  const processMsg = (msg: string) => {
    return genderText(userProfile, msg);
  };

  const [introMsg] = useState(() =>
    processMsg(FATEEN_INTROS[Math.floor(Math.random() * FATEEN_INTROS.length)])
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fontSizes = ['1.1rem', '1.4rem', '1.7rem'];
  const verseFontSize = fontSizes[settings.fontSize - 1] || '1.4rem';

  const availability = useMemo(() => {
    const { keywords, noKeywordVerses } = selectKeywords(poem.verses);
    return {
      playable: Object.keys(keywords).length,
      total: poem.verses.length,
      unavailable: noKeywordVerses.length,
    };
  }, [poem.verses]);

  const isPlayable = availability.playable > 0;

  const skipNoKeywordVerses = useCallback((r: FateenRoundState): FateenRoundState => {
    let current = r;
    while (
      !current.isComplete &&
      getCurrentVerseIndex(current) !== null &&
      !hasKeywordForVerse(current, getCurrentVerseIndex(current)!)
    ) {
      current = submitAnswer(current, false);
    }
    return current;
  }, []);

  const pickFateenMsg = useCallback((isCorrect: boolean): string => {
    const pool = isCorrect ? FATEEN_CORRECT_MSGS : FATEEN_WRONG_MSGS;
    const history = msgHistoryRef.current;
    const recent = history.slice(-FATEEN_MSG_RECENT_LIMIT);
    let candidates = pool.filter(m => !recent.includes(m));
    if (candidates.length === 0) {
      const last = history[history.length - 1];
      candidates = pool.filter(m => m !== last);
    }
    if (candidates.length === 0) candidates = pool;
    const msg = candidates[Math.floor(Math.random() * candidates.length)];
    msgHistoryRef.current = [...history, msg].slice(-24);
    return msg;
  }, []);

  const startRound = useCallback(() => {
    msgHistoryRef.current = [];
    const newRound = createFateenRound(poem);
    const adjusted = skipNoKeywordVerses(newRound);
    setRound(adjusted);

    if (adjusted.isComplete) {
      setPhase('complete');
    } else {
      setUserAnswer('');
      setLastResult(null);
      setLastVerseIndex(null);
      setFateenMsg(null);
      setPhase('question');
    }
  }, [poem, skipNoKeywordVerses]);

  const checkAnswer = useCallback(() => {
    if (!round) return;
    const verseIndex = getCurrentVerseIndex(round);
    if (verseIndex === null) return;

    const verse = poem.verses[verseIndex];
    const result = compareAnswers(userAnswer, verse.text, {
      requireTashkeel: settings.requireTashkeel,
    });

    const newRound = submitAnswer(round, result.isCorrect);
    setLastResult(result);
    setLastVerseIndex(verseIndex);
    setRound(newRound);

    setFateenMsg(processMsg(pickFateenMsg(result.isCorrect)));

    const targetVerse = poem.verses[verseIndex];
    if (targetVerse) {
      if (!result.isCorrect) {
        const hasAjar = Boolean(targetVerse.ajar?.trim());
        const errorType = detectErrorType('write_all', result.diffTokens, hasAjar);
        onErrorLog(createErrorEntry({
          poemId: poem.id,
          verseIndex,
          verseText: targetVerse.text,
          exerciseType: 'write_all',
          source: 'fateen',
          level: null,
          errorType,
          userAnswer,
        }));

        const existingStats = poemStats?.verses[verseIndex] || defaultVerseStats(verseIndex);
        onVerseUpdate(poem.id, {
          ...existingStats,
          attempts: existingStats.attempts + 1,
          errors: existingStats.errors + 1,
          sessionErrors: existingStats.sessionErrors + 1,
        });
      } else {
        onSuccessLog(createSuccessEntry({
          poemId: poem.id,
          verseIndex,
          exerciseType: 'write_all',
          source: 'fateen',
          level: null,
        }));

        const existingStats = poemStats?.verses[verseIndex] || defaultVerseStats(verseIndex);
        onVerseUpdate(poem.id, {
          ...existingStats,
          attempts: existingStats.attempts + 1,
          correct: existingStats.correct + 1,
          sessionCorrect: existingStats.sessionCorrect + 1,
        });
      }
    }

    setPhase('feedback');
  }, [round, userAnswer, poem, settings, poemStats, onVerseUpdate, onErrorLog, onSuccessLog, pickFateenMsg]);

  const nextQuestion = useCallback(() => {
    if (!round) return;

    if (round.isComplete) {
      setPhase('complete');
      return;
    }

    const adjusted = skipNoKeywordVerses(round);
    setRound(adjusted);

    if (adjusted.isComplete) {
      setPhase('complete');
    } else {
      setUserAnswer('');
      setLastResult(null);
      setLastVerseIndex(null);
      setFateenMsg(null);
      setPhase('question');
    }
  }, [round, skipNoKeywordVerses]);

  useEffect(() => {
    if (phase === 'question' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [phase]);

  const currentVerseIndex = round ? getCurrentVerseIndex(round) : null;
  const currentKeyword = round && currentVerseIndex !== null ? getCurrentKeyword(round) : null;
  const lastVerse = lastVerseIndex !== null ? poem.verses[lastVerseIndex] : null;

  return (
    <div className="!fixed !inset-0 !z-50 app-bg !flex !flex-col">
      {/* الرأس */}
      <div className="glass-header !flex !items-center !justify-between session-content !py-3 !border-b !border-[var(--border-0)] !shrink-0">
        <div className="!flex !items-center !gap-1">
          <button
            onClick={() => setShowTashkeel(s => !s)}
            className="!p-1.5 !rounded-lg !text-[var(--text-3)] hover:!text-[var(--text-1)] hover:!bg-[var(--bg-2)] !transition-colors"
            title={showTashkeel ? 'إخفاء التشكيل' : 'إظهار التشكيل'}
          >
            <Sparkles size={14} strokeWidth={1.5} />
          </button>
        </div>
        <div className="!text-center !flex-1">
          <div className="!flex !items-center !justify-center !gap-0.5">
           <GazelleIcon size={18} className="!text-[var(--accent)]" />
           <p className="!text-sm !font-bold !text-[var(--text-0)]">تحدي فطين</p>
          </div>
         <p className="!text-[10px] !text-[var(--text-3)]">
  {poem.title} · {poem.verses.length} بيت
</p>
        </div>
        <button
          onClick={onClose}
          className="!p-1.5 !rounded-lg !text-[var(--text-3)] hover:!text-[var(--text-0)] hover:!bg-[var(--bg-2)] !transition-colors"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* شريط التقدم */}
      {round && (phase === 'question' || phase === 'feedback' || phase === 'complete') && (
        <div className="!px-8 !py-2.5 !border-b !border-[var(--border-0)]">
          <ProgressBar value={getProgressPercent(round)} className="!mx-8" />
          <div className="!flex !justify-between !text-[12px] !text-[var(--text-3)] !mt-1.5">
  <span>{round.tested.length} / {getTotalCount(round)}</span>
  <span>{getRemainingCount(round)} متبقٍ</span>
</div>
        </div>
      )}

      {/* المحتوى */}
      <div className="!flex-1 !overflow-y-auto !px-8 !py-8">
        <div className="!w-full !max-w-2xl md:!max-w-3xl !mx-auto !flex !flex-col !items-center !space-y-6 animate-fade-in">

          {/* ═══ المقدمة ═══ */}
          {phase === 'intro' && (
            <>
              <div className="!flex !justify-center !mb-5">
  <div className="!w-16 !h-16 !rounded-2xl gradient-accent !flex !items-center !justify-center !shadow-lg !shadow-[var(--accent)]/25 accent-glow">
    <GazelleIcon size={50} className="!text-white" />
              </div>
              </div>

              <Card className="!p-6 !w-full !max-w-[92%] !self-center">
                <div className="!space-y-3">
                  {introMsg.split('\n').map((line, i) => (
                    <p
                      key={i}
                      className={`!text-[12px] !leading-7 !text-center ${i === 0 ? '!font-medium !text-[var(--text-0)]' : '!text-[var(--text-1)]'}`}
                      
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </Card>

              <div className="!flex !items-center !justify-center !gap-4 !text-[11px] !text-[var(--text-3)]">
                <span>{poem.title}</span>
                <span>·</span>
                <span>{poem.verses.length} بيت</span>
                <span>·</span>
                <span>{availability.playable} {tGender(userProfile, 'كلمة مفتاح', 'كلمة مفتاح')}</span>
              </div>

              {isPlayable ? (
                <>
                  {availability.unavailable > 0 && (
                    <div className="!flex !items-start !gap-2.5 !p-3.5 !rounded-xl !bg-[var(--warning-light)] !border !border-[var(--warning)]/20">
                      <AlertTriangle size={14} className="!text-[var(--warning)] !shrink-0 !mt-0.5" strokeWidth={1.5} />
                      <p className="!text-[11px] !text-[var(--text-1)] !leading-5" >
                        {availability.unavailable} {tGender(userProfile, 'من أبيات هذه القصيدة لا تتوفر له كلمة مفتاح فريدة، لذا سيتخطّاه فطين تلقائيًا.', 'من أبيات هذه القصيدة لا تتوفر له كلمة مفتاح فريدة، لذا سيتخطاه فطين تلقائيًا.')}
                      </p>
                    </div>
                  )}

                  <div className="!flex !justify-center !pt-3">
                    <Button variant="primary" size="lg" onClick={startRound} className="!px-6">
                      {tGender(userProfile, 'هيّا نبدأ', 'هيا نبدأ')}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="!space-y-4">
                  <div className="!flex !items-start !gap-2.5 !p-4 !rounded-xl !bg-[var(--warning-light)] !border !border-[var(--warning)]/20">
                    <AlertTriangle size={15} className="!text-[var(--warning)] !shrink-0 !mt-0.5" strokeWidth={1.5} />
                    <div className="!space-y-1">
                      <p className="!text-xs !font-medium !text-[var(--text-0)]" >
                        {tGender(userProfile, 'هذه القصيدة لا تصلح للتحدي حاليًا', 'هذه القصيدة لا تصلح للتحدي حاليًا')}
                      </p>
                      <p className="!text-[11px] !text-[var(--text-1)] !leading-5" >
                        {tGender(userProfile, 'لم يجد فطين كلمةً فريدةً في أي بيت منها — فالكلمات إما مشتركة بين أبيات القصيدة أو وظيفية لا تصلح مفتاحًا. اختاري قصيدة أخرى.', 'لم يجد فطين كلمةً فريدةً في أي بيت منها — فالكلمات إما مشتركة بين أبيات القصيدة أو وظيفية لا تصلح مفتاحاً. اختر قصيدة أخرى.')}
                      </p>
                    </div>
                  </div>

                  <div className="!flex !justify-center">
                    <Button variant="ghost" size="md" onClick={onClose}>
                      {tGender(userProfile, 'عودة لاختيار قصيدة', 'عودة لاختيار قصيدة')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ السؤال ═══ */}
          {phase === 'question' && round && currentKeyword && (
            <>
              <div className="!space-y-5">
                <div className="!flex !items-center !justify-center !gap-1 !text-xs !text-[var(--text-3)]">
                  <GazelleIcon size={13} className="!text-[var(--accent)]" />
                  <span className="!font-bold">كلمة فطين</span>
                </div>

                <div className="!flex !justify-center">
                <div className="glass-card !inline-flex !items-center !justify-center !w-[6rem] !py-4 !rounded-2xl accent-glow !border-[var(--accent)]/25">
                    <p
                       className="!text-xl !font-medium gradient-accent-text !text-center"
                       style={{ fontFamily: 'var(--font-poem)', lineHeight: '2' }}
                    >
                      {currentKeyword}
                    </p>
                  </div>
                </div>

                <p className="!text-center !text-sm !text-[var(--text-2)]">
                  {genderText(userProfile, '[استحضر|استحضري] البيت كاملًا')}
                </p>
              </div>

              <div className="!space-y-4 !w-full">
               <textarea
  ref={textareaRef}
  value={userAnswer}
  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserAnswer(e.target.value)}
  placeholder={genderText(userProfile, '[اكتب|اكتبي] البيت كاملًا...')}
  dir="rtl"
  rows={3}
  style={{
    fontFamily: 'var(--font-poem)',
    fontSize: '1.25rem'
  }}
  className="!w-full !px-4 !py-3 !rounded-xl !border !border-[var(--border-0)] !bg-[var(--glass-bg)] backdrop-blur-[8px] !text-[var(--text-0)] !text-sm !leading-[2.5] placeholder:!text-[var(--text-3)] focus:!border-[var(--accent-soft)] focus:!ring-2 focus:!ring-[var(--accent)]/20 !transition-all !duration-250 !outline-none !resize-none !text-center"
/>

                <div className="!flex !justify-center">
                  <Button
 variant="primary"
 size="md"
 onClick={checkAnswer}
 disabled={!userAnswer.trim()}
 className="!px-4"
>
                    {genderText(userProfile, '[أجب|أجيبي]')}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ═══ نتيجة الإجابة ═══ */}
          {phase === 'feedback' && round && lastVerse && lastResult && (
            <>
              <div className="!flex !flex-col !items-center !gap-3 !py-2">
                {lastResult.isCorrect ? (
                  <>
                    <div className="!w-10 !h-10 !rounded-full !bg-[var(--success-light)] !flex !items-center !justify-center">
                      <CheckCircle2 size={20} className="!text-[var(--success)]" strokeWidth={1.5} />
                    </div>
                    <p className="!text-sm !font-medium !text-[var(--success)]" >
                      {genderText(userProfile, '[استحضرتَ|استحضرتِ] البيت بنجاح')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="!w-10 !h-10 !rounded-full !bg-[var(--error-light)] !flex !items-center !justify-center">
                      <XCircle size={20} className="!text-[var(--error)]" strokeWidth={1.5} />
                    </div>
                    <p className="!text-sm !font-medium !text-[var(--error)]" >
                      لم يُستحضر البيتُ على الوجه الصحيح.
                    </p>
                  </>
                )}
              </div>

          {/* رسالة فطين */}
{fateenMsg && (
  <div className="!inline-flex !items-start !rounded-xl !bg-[var(--glass-bg)] !mx-auto">
    <div className="!flex !items-start !gap-0.5 !py-3.5 !px-[10px]">
      <GazelleIcon
        size={14}
        className="!text-[var(--accent)] !shrink-0 !mt-1"
      />
      <p className="!text-xs !text-[var(--text-1)] !leading-6">
        {fateenMsg}
      </p>
    </div>
  </div>
)}

              <Card className="!p-5 !px-[28px]">
                <p className="!text-[11px] !text-[var(--text-3)] !mb-3 !text-center" >
                  البيت الصحيح:
                </p>
                <PoeticVerseDisplay
                  sadr={lastVerse.sadr}
                  ajar={lastVerse.ajar}
                  showTashkeel={showTashkeel}
                  fontSize="1.25rem"
                />
              </Card>

              {!lastResult.isCorrect && lastResult.diffTokens.length > 0 && (
               <Card className="!w-fit !mx-auto !p-4 !px-[10px]">
                  <p className="!text-[11px] !text-[var(--text-3)] !mb-2 !text-center" >
                    {genderText(userProfile, '[إجابتكَ|إجابتكِ]:')}
                  </p>
                  <div className="!text-center">
                    <DiffDisplay tokens={lastResult.diffTokens} />
                  </div>
                </Card>
              )}

              <div className="!flex !justify-center !pt-3">
                <Button variant="primary" size="md" onClick={nextQuestion} className="!px-[20px]">
                  {round.isComplete ? genderText(userProfile, '[أنهِ الجولة|أنهي الجولة]') : 'التالي'}
                </Button>
              </div>
            </>
          )}

          {/* ═══ الإكمال ═══ */}
          {phase === 'complete' && round && (
            <>
              {(() => {
                const userWins = round.errors.length === 0;
                const endMessage = processMsg(userWins
                  ? pickRandom(FATEEN_WIN_MSGS)
                  : pickRandom(FATEEN_LOSS_MSGS));

                return (
                  <>
                    {/* الفائز */}
                    <div className="!flex !flex-col !items-center !gap-4 !py-8">
                     <div className={`!w-16 !h-16 !rounded-2xl !flex !items-center !justify-center ${userWins ? '!bg-[var(--success-light)]' : 'gradient-accent !shadow-lg !shadow-[var(--accent)]/25'}`}>
                        {userWins ? (
                          <CheckCircle2 size={32} className="!text-[var(--success)]" strokeWidth={1.5} />
                        ) : (
                          <GazelleIcon size={32} className="!text-white" />
                        )}
                      </div>

                      <div className="!text-center !space-y-1.5">
                        <p className="!text-lg !font-bold !text-[var(--text-0)]" >
                          {userWins ? genderText(userProfile, '[أنتَ الفائز!|أنتِ الفائزة!]') : 'فطين هو الفائز'}
                        </p>
                        <p className="!text-sm !text-[var(--text-2)]" >
                          {userWins
                            ? genderText(userProfile, 'لم يستطع فطين أن يفلت [منكَ|منكِ] ببيت واحد')
                            : genderText(userProfile, 'أمسكَ فطين ببعض [أبياتكَ|أبياتكِ]')}
                        </p>
                      </div>
                    </div>

                    {/* رسالة فطين الختامية */}
                   <Card className="!p-5 !px-7">
  <div>
    {endMessage.split('\n').map((line, i) => (
      <p
        key={i}
        className={`!text-sm !leading-7 ${i === 0 ? '!font-medium !text-[var(--text-0)]' : '!text-[var(--text-1)]'}`}
      >
        {i === 0 && (
          <GazelleIcon
            size={18}
            className={`!inline-block !align-middle !ml-1 ${userWins ? '!text-[var(--success)]' : '!text-[var(--accent)]'}`}
          />
        )}
        {line}
      </p>
    ))}
  </div>
</Card>

                    {/* الإحصائيات */}
                   <div className="!grid !grid-cols-3 !gap-3">
                     <Card className="!p-4 !px-3 !text-center">
                        <p className="!text-xl !font-bold !text-[var(--text-0)] tabular-nums">{round.verseOrder.length}</p>
                       <p className="!text-[10px] !text-[var(--text-3)]">
                        إجمالي الأبيات
                       </p>
                      </Card>
                     <Card className="!p-4 !px-3 !text-center">
                        <p className="!text-xl !font-bold !text-[var(--success)] tabular-nums">{round.correct.length}</p>
                        <p className="!text-[10px] !text-[var(--text-3)]">
                          {tGender(userProfile, 'صحيحة', 'صحيحة')}
                        </p>
                      </Card>
                     <Card className="!p-4 !px-3 !text-center">
                        <p className="!text-xl !font-bold !text-[var(--error)] tabular-nums">{round.errors.length}</p>
                        <p className="!text-[10px] !text-[var(--text-3)]">
                          {tGender(userProfile, 'أخطاء', 'أخطاء')}
                        </p>
                      </Card>
                    </div>

                    {/* الأبيات التي أخطأت فيها */}
                    {!userWins && round.errors.length > 0 && (
                      <div>
                        <h4 className="!text-xs !font-medium !text-[var(--text-1)] !mb-3" >
                          {tGender(userProfile, 'الأبيات التي أخطأتِ فيها:', 'الأبيات التي أخطأتَ فيها:')}
                        </h4>
                        <div className="!space-y-0">
                          {round.errors.map((verseIdx, i) => {
                            const v = poem.verses[verseIdx];
                            if (!v) return null;
                            return (
                              <Card key={verseIdx} className="!p-3.5 !mb-[6px]">
                                <div className="!flex !items-start !gap-3">
                                  <span className="!inline-flex !items-center !justify-center !w-5 !h-5 !rounded-full !bg-[var(--error-light)] !text-[var(--error)] !text-[10px] !font-bold !shrink-0">
                                    {i + 1}
                                  </span>
                                 <div className="!flex-1 !min-w-0 !flex !flex-col !justify-center">
                                    <p className="!text-[10px] !text-[var(--text-3)] !mb-1" >
                                      البيت {verseIdx + 1}
                                    </p>
                                    <PoeticVerseDisplay
                                      sadr={v.sadr}
                                      ajar={v.ajar}
                                      showTashkeel={showTashkeel}
                                      fontSize="1rem"
                                    />
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* أزرار */}
                  <div className="!flex !justify-center !gap-3 !pt-3">
  <Button variant="ghost" size="md" onClick={onClose}>
    {tGender(userProfile, 'عودة', 'عودة')}
  </Button>
  <Button variant="primary" size="md" onClick={startRound} className="!px-4">
  {tGender(userProfile, 'جولة جديدة', 'جولة جديدة')}
</Button>
</div>

<div className="!h-[200px] !shrink-0" />
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}