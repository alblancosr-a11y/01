import type { Poem, PoemStats, VerseStats, ErrorLogEntry } from './types';
import { getWeakVerseIndices } from './algorithm';

export type TodayTaskReason =
  | 'needs_strengthening'  // يحتاج إلى تقوية (خطأ فعلي)
  | 'due_for_review'       // مراجعة مستحقة
  | 'new_verse';           // بيت جديد

export interface TodayTask {
  poemId: string;
  poemTitle: string;
  poemPoet: string;
  verseIndex: number;
  verseText: string;
  reason: TodayTaskReason;
  /** وصف قصير للسبب */
  reasonLabel: string;
}

export interface TodaySessionData {
  tasks: TodayTask[];
  hasWeakVerses: boolean;
  hasDueReviews: boolean;
  hasNewVerses: boolean;
  totalCount: number;
}

function getReasonLabel(reason: TodayTaskReason): string {
  switch (reason) {
    case 'needs_strengthening': return 'يحتاج إلى تقوية';
    case 'due_for_review': return 'مراجعة مستحقة';
    case 'new_verse': return 'بيت جديد';
  }
}

/**
 * بناء قائمة مهام جلسة اليوم مع مهمة واحدة فقط حسب الأولوية
 * الأولوية: جديد → تقوية → مراجعة
 * 24 ساعة انتظار بعد إكمال المهمة.
 */
export function buildTodaySession(
  poems: Poem[],
  stats: Record<string, PoemStats>,
  errorLog: ErrorLogEntry[],
  lastCompletedAt: number | null
): TodaySessionData {
  if (poems.length === 0) {
    return { tasks: [], hasWeakVerses: false, hasDueReviews: false, hasNewVerses: false, totalCount: 0 };
  }

  const now = Date.now();
  // إذا اكتملت المهمة قبل أقل من 24 ساعة، لا تظهر مهام جديدة
  if (lastCompletedAt && now - lastCompletedAt < 24 * 60 * 60 * 1000) {
    return { tasks: [], hasWeakVerses: false, hasDueReviews: false, hasNewVerses: false, totalCount: 0 };
  }

  // 1. أولوية: بيت جديد (حفظ)
  for (const poem of poems) {
    const lastCompleted = typeof poem.lastCompletedVerseIndex === 'number' && poem.lastCompletedVerseIndex >= 0
      ? poem.lastCompletedVerseIndex
      : -1;
    const nextNewIdx = lastCompleted + 1;
    
    if (nextNewIdx < poem.verses.length) {
      const verse = poem.verses[nextNewIdx];
      return {
        tasks: [{
          poemId: poem.id,
          poemTitle: poem.title,
          poemPoet: poem.poet,
          verseIndex: nextNewIdx,
          verseText: verse.text,
          reason: 'new_verse',
          reasonLabel: getReasonLabel('new_verse'),
        }],
        hasNewVerses: true,
        hasWeakVerses: false,
        hasDueReviews: false,
        totalCount: 1,
      };
    }
  }

  // 2. أولوية: تقوية (من سجل الأخطاء)
  // نبحث عن أي بيت في سجل الأخطاء لم يصل إلى مستوى Mastered أو Strong
  const allErrors = [...errorLog].sort((a, b) => b.timestamp - a.timestamp);
  for (const log of allErrors) {
    const poem = poems.find(p => p.id === log.poemId);
    if (!poem) continue;
    const pStats = stats[poem.id];
    const vStats = pStats?.verses[log.verseIndex];
    
    // إذا لم يصل للثبات بعد وعليه أخطاء
    if (!vStats || (vStats.memory.standalone !== 'mastered' && vStats.memory.standalone !== 'strong')) {
      const verse = poem.verses[log.verseIndex];
      if (verse) {
        return {
          tasks: [{
            poemId: poem.id,
            poemTitle: poem.title,
            poemPoet: poem.poet,
            verseIndex: log.verseIndex,
            verseText: verse.text,
            reason: 'needs_strengthening',
            reasonLabel: getReasonLabel('needs_strengthening'),
          }],
          hasNewVerses: false,
          hasWeakVerses: true,
          hasDueReviews: false,
          totalCount: 1,
        };
      }
    }
  }

  // 3. أولوية: مراجعة (تكرار متباعد)
  for (const poem of poems) {
    const pStats = stats[poem.id];
    if (!pStats) continue;
    for (let vIdx = 0; vIdx < poem.verses.length; vIdx++) {
      const vStats = pStats.verses[vIdx];
      if (vStats && vStats.memory.standalone !== 'new' && now >= vStats.nextReviewAt) {
        const verse = poem.verses[vIdx];
        return {
          tasks: [{
            poemId: poem.id,
            poemTitle: poem.title,
            poemPoet: poem.poet,
            verseIndex: vIdx,
            verseText: verse.text,
            reason: 'due_for_review',
            reasonLabel: getReasonLabel('due_for_review'),
          }],
          hasNewVerses: false,
          hasWeakVerses: false,
          hasDueReviews: true,
          totalCount: 1,
        };
      }
    }
  }

  return { tasks: [], hasWeakVerses: false, hasDueReviews: false, hasNewVerses: false, totalCount: 0 };
}
