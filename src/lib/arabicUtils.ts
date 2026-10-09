import { UserProfile } from "./types";

/**
 * دالة مساعدة لتصريف النصوص حسب طريقة المخاطبة المختارة
 * تتبع ترتيب (بنت، ولد) للحفاظ على التوافق
 */
export function tGender(profile: UserProfile | undefined, female: string, male: string): string {
  if (!profile) return female;
  return profile.preferredAddressing === 'boy' ? male : female;
}

/**
 * دالة مساعدة لإضافة اسم المستخدم للنص عند الحاجة
 */
export function withName(profile: UserProfile | undefined, text: string, prefix: string = ' يا '): string {
  if (!profile || !profile.name) return text;
  const name = profile.name.trim();
  if (!name) return text;
  return `${text}${prefix}${name}`;
}

/**
 * محرك استبدال نصوص متقدم للجندر
 * يأخذ نصاً يحتوي على وسوم مثل [مذكر|مؤنث] ويستبدلها بناءً على الجندر
 */
export function genderText(profile: UserProfile | undefined, text: string): string {
  if (!text) return '';
  const isMale = profile?.preferredAddressing === 'boy';
  const name = profile?.name || '';
  
  // 1. استبدال وسوم الجندر [مذكر|مؤنث]
  let result = text.replace(/\[([^|]+)\|([^\]]+)\]/g, (_, male, female) => {
    return isMale ? male : female;
  });
  
  // 2. استبدال وسوم الاسم (اسم المستخدم) أو (اسم المستخدمة)
  result = result.replace(/\(اسم المستخدمة?\)/g, name);
  
  return result;
}
