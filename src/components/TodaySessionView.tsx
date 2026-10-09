"use client";
import { useState } from 'react';
import { Clock, Zap, RefreshCw, BookOpen, CheckCircle2, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { Poem, AppState } from '../lib/types';
import { buildTodaySession, type TodayTask, type TodayTaskReason } from '../lib/todaySession';
import { tGender, withName } from '../lib/arabicUtils';
import { Card, Badge, Button } from '../ui';

interface Props {
  state: AppState;
  onStudy: (poem: Poem) => void;
  onStartWeakVerse: (poem: Poem, verseIndex: number) => void;
  onStartCumulative: (poem: Poem, verseIndex: number) => void;
}

function getReasonBadge(reason: TodayTaskReason) {
  switch (reason) {
    case 'needs_strengthening':
      return <Badge variant="error">يحتاج إلى تقوية</Badge>;
    case 'due_for_review':
      return <Badge variant="warning">مراجعة مستحقة</Badge>;
    case 'new_verse':
      return <Badge variant="accent">بيت جديد</Badge>;
  }
}

function getReasonIcon(reason: TodayTaskReason) {
  switch (reason) {
    case 'needs_strengthening':
      return <Zap size={14} className="!text-[var(--error)]" strokeWidth={1.5} />;
    case 'due_for_review':
      return <RefreshCw size={14} className="!text-[var(--warning)]" strokeWidth={1.5} />;
    case 'new_verse':
      return <BookOpen size={14} className="!text-[var(--accent)]" strokeWidth={1.5} />;
  }
}

function getPoemFromState(state: AppState, poemId: string): Poem | undefined {
  return state.poems.find(p => p.id === poemId);
}

export default function TodaySessionView({ state, onStudy, onStartWeakVerse, onStartCumulative }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const todayData = buildTodaySession(state.poems, state.stats, state.errorLog, state.lastTodaySessionCompletedAt);
  const { tasks, hasWeakVerses, hasDueReviews, hasNewVerses } = todayData;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  const getTaskNotification = () => {
    if (hasNewVerses) return withName(state.userProfile, tGender(state.userProfile, 'مَدَارِج — لديكِ أبيات جديدة تنتظر الحفظ', 'مَدَارِج — لديكَ أبيات جديدة تنتظر الحفظ'));
    if (hasWeakVerses) return withName(state.userProfile, tGender(state.userProfile, 'مَدَارِج — لديكِ أبيات تحتاج إلى تقوية', 'مَدَارِج — لديكَ أبيات تحتاج إلى تقوية'));
    if (hasDueReviews) return withName(state.userProfile, tGender(state.userProfile, 'مَدَارِج — حان وقت مراجعة محفوظاتك', 'مَدَارِج — حان وقت مراجعة محفوظاتك'));
    return '';
  };

  if (state.poems.length === 0) {
    return (
      <Card className="!px-8 !h-[120px] !overflow-hidden !shadow-md !flex !items-center">
        <div className="!flex !items-center !gap-5">
          <div className="!w-12 !h-12 !rounded-2xl !bg-[var(--accent-light)] !flex !items-center !justify-center !shrink-0 !shadow-sm !border !border-[var(--accent)]/10">
            <Clock size={28} className="!text-[var(--accent)] !shrink-0" strokeWidth={2.2} />
          </div>
          <div className="!flex-1 !min-w-0 !flex !flex-col !gap-1">
            <h3 className="!text-lg !font-bold !text-[var(--text-0)] !leading-none">جلسة اليوم</h3>
            <p className="!text-sm !text-[var(--text-2)] !font-medium !leading-none">{tGender(state.userProfile, 'أضيفي قصيدة وابدئي رحلة الحفظ', 'أضف قصيدة وابدأ رحلة الحفظ')}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`!px-8 !shadow-md !flex !flex-col transition-all duration-300 !relative ${isExpanded && tasks.length > 0 ? '!h-auto !py-6' : '!h-[120px] !overflow-hidden'}`}>
      {/* الصف العلوي (دائماً ظاهر) */}
      <div className={`!flex !items-center !w-full !min-h-[120px] ${!isExpanded || tasks.length === 0 ? '!h-full' : '!mb-6'}`}>
        {/* عنوان القسم ومحتوى النصوص */}
        <div className="!flex !items-center !gap-5 !flex-1">
          <div className="!w-12 !h-12 !rounded-2xl !bg-[var(--accent-light)] !flex !items-center !justify-center !shrink-0 !shadow-sm !border !border-[var(--accent)]/10">
            <Clock size={28} className="!text-[var(--accent)] !shrink-0" strokeWidth={2.2} />
          </div>
          <div className="!flex-1 !min-w-0 !flex !flex-col !gap-1.5">
            <h2 className="!text-lg !font-bold !text-[var(--text-0)] !leading-none">جلسة اليوم</h2>
            <p className="!text-sm !text-[var(--text-3)] !font-bold !opacity-60 !uppercase !tracking-wider !leading-none">
              {tasks.length > 0 ? getTaskNotification() : (state.lastTodaySessionCompletedAt ? tGender(state.userProfile, "اكتملت مهام اليوم بنجاح", "اكتملت مهام اليوم بنجاح") : tGender(state.userProfile, "لا توجد مهام حالية", "لا توجد مهام حالية"))}
            </p>
            
            {/* ملخص الإشعارات (البادجات) - الآن في السطر الثالث */}
            <div className="!flex !gap-2 !flex-wrap !mt-1">
              {tasks.length > 0 ? (
                <>
                  {hasWeakVerses && (
                    <div className="!flex !items-center !gap-1.5 !px-3 !py-1 !rounded-full !bg-[var(--error-light)] !text-[var(--error)] !text-[11px] !font-bold !border !border-[var(--error)]/10">
                      <Zap size={10} strokeWidth={3} />
                      <span>يحتاج إلى تقوية</span>
                    </div>
                  )}
                  {hasDueReviews && (
                    <div className="!flex !items-center !gap-1.5 !px-3 !py-1 !rounded-full !bg-[var(--warning-light)] !text-[var(--warning)] !text-[11px] !font-bold !border !border-[var(--warning)]/10">
                      <RefreshCw size={10} strokeWidth={3} />
                      <span>مراجعة</span>
                    </div>
                  )}
                  {hasNewVerses && (
                    <div className="!flex !items-center !gap-1.5 !px-3 !py-1 !rounded-full !bg-[var(--accent-light)] !text-[var(--accent-text)] !text-[11px] !font-bold !border !border-[var(--accent)]/10">
                      <BookOpen size={10} strokeWidth={3} />
                      <span>جديد</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="!flex !items-center !gap-1.5 !px-3 !py-1 !rounded-full !bg-[var(--bg-3)] !text-[var(--text-3)] !text-[11px] !font-bold !border !border-[var(--border-0)]">
                  <CheckCircle2 size={10} strokeWidth={3} />
                  <span>{tGender(state.userProfile, 'أنتِ ملتزمة بالجدول', 'أنتَ ملتزم بالجدول')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* زر السهم السفلي للفتح والطي (يظهر فقط إذا كانت هناك مهام) */}
        {tasks.length > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className={`!p-2 hover:!bg-[var(--bg-3)] !rounded-xl transition-all !text-[var(--text-3)] !cursor-pointer !shrink-0 ${isExpanded ? '!bg-[var(--bg-3)]' : ''}`}
            title={isExpanded ? "طي" : "توسيع"}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>

      {/* قائمة المهام (تظهر فقط عند التوسيع) */}
      {isExpanded && (
        <div className="!flex !flex-col !gap-3 !w-full animate-fade-in">
          <div className="!flex !flex-col !gap-4">
            {tasks.map((task, idx) => {
              const poem = getPoemFromState(state, task.poemId);
              if (!poem) return null;
              return (
                <TaskItem
                  key={`${task.poemId}:${task.verseIndex}:${idx}`}
                  task={task}
                  poem={poem}
                  onStart={() => {
                    if (task.reason === 'needs_strengthening') {
                      onStartWeakVerse(poem, task.verseIndex);
                    } else if (task.reason === 'due_for_review') {
                      onStartCumulative(poem, task.verseIndex);
                    } else {
                      onStartCumulative(poem, task.verseIndex);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

function TaskItem({ task, poem, onStart }: { task: TodayTask; poem: Poem; onStart: () => void }) {
  const verse = poem.verses[task.verseIndex];
  
  return (
    <div className="!w-full !flex !items-center !gap-4 !p-4 !rounded-2xl !bg-[var(--bg-2)] !border !border-[var(--border-0)] !text-right group !min-w-0">
      {/* أيقونة الحالة */}
      <div className="!shrink-0 !w-10 !h-10 !rounded-full !flex !items-center !justify-center !bg-white/30 !shadow-sm !border !border-white/20">
        {getReasonIcon(task.reason)}
      </div>

      {/* محتوى البيت */}
      <div className="!flex-1 !min-w-0 !flex !flex-col !gap-2">
        <div className="!flex !items-center !gap-2">
          <span className="!text-[10px] !text-[var(--text-3)] !font-bold">{task.reasonLabel}</span>
          <span className="!text-[9px] !text-[var(--text-3)] !opacity-60">| {task.poemTitle}</span>
        </div>
        
        {/* عرض البيت: صدر وعجز */}
        <div className="!flex !flex-col !gap-1" style={{ fontFamily: 'var(--font-poem)' }}>
          <p className="!text-sm !text-[var(--text-0)] !font-bold !leading-relaxed">
            {verse?.sadr || task.verseText}
          </p>
          {verse?.ajar && (
            <p className="!text-sm !text-[var(--text-1)] !font-medium !opacity-80 !leading-relaxed !pr-6">
              {verse.ajar}
            </p>
          )}
        </div>
      </div>

      {/* السهم الجانبي (للانتقال لجلسة الحفظ) */}
      <button
        onClick={onStart}
        className="!p-2 !rounded-xl !bg-[var(--accent-light)] !text-[var(--accent-text)] hover:!bg-[var(--accent)] hover:!text-white transition-all group/btn !shrink-0 !shadow-sm !cursor-pointer"
        title="بدء الحفظ"
      >
        <ChevronLeft size={18} className="group-hover/btn:!translate-x-[-2px] transition-transform" strokeWidth={2.5} />
      </button>
    </div>
  );
}