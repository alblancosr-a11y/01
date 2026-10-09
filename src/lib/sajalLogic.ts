import { Verse, SajalPoem, Poem, UserProfile } from './types';
import { removeTashkeel, normalizeForComparison } from './poem-parser';

/**
 * استخراج الحرف الأول "النظيف" من البيت
 */
export function getCleanFirstLetter(text: string): string {
  if (!text) return '';
  const normalized = normalizeForComparison(text, { 
    ignoreTashkeel: true, 
    ignorePunctuation: true, 
    ignoreSpaces: false 
  });
  return normalized.charAt(0);
}

/**
 * استخراج الحرف الأخير "النظيف" من البيت (القافية)
 */
export function getCleanLastLetter(text: string): string {
  if (!text) return '';
  const normalized = normalizeForComparison(text, { 
    ignoreTashkeel: true, 
    ignorePunctuation: true, 
    ignoreSpaces: false 
  });
  // نتأكد من إزالة أي مسافات زائدة في النهاية
  const trimmed = normalized.trim();
  return trimmed.charAt(trimmed.length - 1);
}

export interface SajalVerseEntry {
  poemId: string;
  poemTitle: string;
  verseIndex: number;
  text: string;
  sadr: string;
  ajar: string;
  firstLetter: string;
  lastLetter: string;
}

/**
 * بناء قائمة شاملة لكل الأبيات المتاحة للسجال
 */
export function buildSajalLibrary(
  sajalPoems: SajalPoem[],
  hifzPoems: Poem[],
  includeHifz: boolean
): SajalVerseEntry[] {
  const library: SajalVerseEntry[] = [];

  // إضافة قصائد السجال
  for (const poem of sajalPoems) {
    for (const verse of poem.verses) {
      library.push({
        poemId: poem.id,
        poemTitle: poem.title,
        verseIndex: verse.index,
        text: verse.text,
        sadr: verse.sadr,
        ajar: verse.ajar,
        firstLetter: getCleanFirstLetter(verse.text),
        lastLetter: getCleanLastLetter(verse.text),
      });
    }
  }

  // إضافة قصائد الحفظ إذا تم تفعيل الخيار
  if (includeHifz) {
    for (const poem of hifzPoems) {
      for (const verse of poem.verses) {
        library.push({
          poemId: poem.id,
          poemTitle: poem.title,
          verseIndex: verse.index,
          text: verse.text,
          sadr: verse.sadr,
          ajar: verse.ajar,
          firstLetter: getCleanFirstLetter(verse.text),
          lastLetter: getCleanLastLetter(verse.text),
        });
      }
    }
  }

  return library;
}

/**
 * البحث عن بيت يبدأ بحرف معين
 */
export function findVerseByStartingLetter(
  library: SajalVerseEntry[],
  letter: string,
  excludeTexts: string[] = []
): SajalVerseEntry | null {
  const matches = library.filter(
    v => v.firstLetter === letter && !excludeTexts.includes(v.text)
  );
  
  if (matches.length === 0) return null;
  
  // اختيار عشوائي من المطابقات
  return matches[Math.floor(Math.random() * matches.length)];
}

/**
 * التحقق من صحة بيت المستخدم
 */
export function validateUserVerse(
  userText: string,
  requiredLetter: string | null,
  library: SajalVerseEntry[],
  userProfile?: UserProfile
): { isValid: boolean; error?: string; matchedVerse?: SajalVerseEntry } {
  // 1. مطابقة الحرف (إذا لم يكن أول بيت في الجولة)
  if (requiredLetter) {
    const userFirstLetter = getCleanFirstLetter(userText);
    if (userFirstLetter !== requiredLetter) {
      const errorMsg = userProfile?.preferredAddressing === 'girl'
        ? `بيتُكِ لا يبدأ بالحرف المطلوب. ابدئي بحرف «${requiredLetter}».`
        : `بيتُكَ لا يبدأ بالحرف المطلوب. ابدأ بحرف «${requiredLetter}».`;
      return { 
        isValid: false, 
        error: errorMsg 
      };
    }
  }

  // 2. مطابقة البيت مع المكتبة (باستخدام منطق فطين للتطبيع)
  const userNorm = normalizeForComparison(userText, { ignoreTashkeel: true, ignorePunctuation: true });
  
  const matched = library.find(v => {
    const libNorm = normalizeForComparison(v.text, { ignoreTashkeel: true, ignorePunctuation: true });
    return libNorm === userNorm;
  });

  if (!matched) {
    return { 
      isValid: false, 
      error: "الحرف صحيح، لكن هذا البيت ليس ضمن قصائد مضمارك." 
    };
  }

  return { isValid: true, matchedVerse: matched };
}
