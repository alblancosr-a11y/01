"use client";

import { useEffect, useRef, useState } from 'react';
import { Swords, User } from 'lucide-react';
import type { UserProfile } from '../lib/types';
import { tGender } from '../lib/arabicUtils';
import GazelleIcon from './GazelleIcon';

/**
 * مشهد افتتاح «السجال الشعري» — لوحان مائلا القطع بإطار نيون يندفعان من جانبي الشاشة
 * (فطين يمينًا، المستخدم يسارًا) ويلتقيان في الوسط، وفي نقطة التصادم يتوهّج شعار السيوف.
 *
 * الخط الزمني (بالملّي ثانية):
 *   150  → يندفع اللوحان من الجانبين بتسارع (مع تمدد خفيف يوحي بالسرعة)
 *   1250 → لحظة التصادم: وميض + موجة صدمة + ارتداد اللوحين + اهتزاز خفيف
 *   1350 → يظهر شعار السيوف في مركز التصادم
 *   1500 → تظهر دائرتا فطين والمستخدم فوق اللوحين
 *   2150 → يظهر عنوان المضمار
 *   3700 → خروج سلس ثم onComplete
 */

const T = {
  start: 150,
  clash: 1250,
  end: 3700,
  fade: 450,
} as const;

// ═══ ألوان اللوحين (من لوحة التطبيق) ═══
//  المستخدم (يسار): النيلي/البنفسجي (accent الوضع الداكن #6366f1)
//  فطين (يمين): الأزرق السماوي (accent-soft #5ac8fa / accent #007aff)
const PANEL = {
  user: { deep: '60,32,170', mid: '109,77,242', neon: '#b9a8ff', glow: '#7a5cf5' },
  fateen: { deep: '8,52,140', mid: '47,155,255', neon: '#8fe0ff', glow: '#2f9bff' },
} as const;

interface Props {
  userProfile: UserProfile;
  onComplete: () => void;
}

const getSize = () =>
  typeof window === 'undefined' ? { w: 390, h: 760 } : { w: window.innerWidth, h: window.innerHeight };

/**
 * لوح مائل القطع بإطار نيون: تعبئته غامقة عند حافة الشاشة وشفافة عند نقطة الالتقاء.
 * side = 'left' | 'right'
 */
function Panel({ side, w, h }: { side: 'left' | 'right'; w: number; h: number }) {
  const c = side === 'left' ? PANEL.user : PANEL.fateen;
  const mx = Math.min(w * 0.05, 22);       // هامش جانبي
  const top = h * 0.04, bottom = h * 0.96; // هامش علوي/سفلي
  const sl = Math.min(h * 0.07, w * 0.08); // مقدار الميل
  const g = Math.min(8, w * 0.012);        // فجوة صغيرة عند الالتقاء
  const cx = w / 2;
  const pts = side === 'left'
    ? [[mx, top], [cx - g + sl, top], [cx - g - sl, bottom], [mx, bottom]]
    : [[cx + g + sl, top], [w - mx, top], [w - mx, bottom], [cx + g - sl, bottom]];
  const poly = pts.map(p => p.join(',')).join(' ');
  const gid = `svg-${side}`;
  // التدرج: الحافة الخارجية غامقة ← المركز شفاف
  const x1 = side === 'left' ? mx : w - mx;
  const x2 = side === 'left' ? cx - g : cx + g;
  return (
    <div className={`sv-panel sv-panel-${side}`}>
      <svg
        className="sv-panel-svg"
        width={w} height={h} viewBox={`0 0 ${w} ${h}`}
        shapeRendering="geometricPrecision"
      >
        <defs>
          <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1={x1} y1="0" x2={x2} y2="0">
            <stop offset="0" stopColor={`rgb(${c.deep})`} stopOpacity="0.96" />
            <stop offset="0.35" stopColor={`rgb(${c.deep})`} stopOpacity="0.62" />
            <stop offset="0.75" stopColor={`rgb(${c.mid})`} stopOpacity="0.12" />
            <stop offset="1" stopColor={`rgb(${c.mid})`} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={poly} fill={`url(#${gid})`} />
        {/* وهج النيون بطبقات خطوط متدرجة (أخف بكثير من فلتر drop-shadow على SVG كامل الشاشة) */}
        <polygon points={poly} fill="none" stroke={c.glow} strokeWidth="18" strokeOpacity="0.07" strokeLinejoin="round" />
        <polygon points={poly} fill="none" stroke={c.glow} strokeWidth="11" strokeOpacity="0.14" strokeLinejoin="round" />
        <polygon points={poly} fill="none" stroke={c.glow} strokeWidth="6" strokeOpacity="0.30" strokeLinejoin="round" />
        <polygon points={poly} fill="none" stroke={c.neon} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function SajalVsIntro({ userProfile, onComplete }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);
  const [size, setSize] = useState(getSize);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  };

  useEffect(() => {
    // يتجاهل تغيّرات شريط المتصفح الصغيرة في الجوال حتى لا يُعاد رسم اللوحين أثناء الحركة
    const onResize = () => {
      const n = getSize();
      setSize(prev => (Math.abs(n.w - prev.w) < 2 && Math.abs(n.h - prev.h) < 100 ? prev : n));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ===== البدء والإنهاء =====
  // نؤخر بدء الحركة إطارين حتى يجهّز المتصفح الطبقات (يمنع تقطّع اللحظات الأولى)،
  // ثم تُحسب مدة المشهد من لحظة البدء الفعلية.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) root.classList.add('sv-reduced');
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>;
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        root.classList.add('sv-play');
        const total = reduced ? 1800 : T.end;
        t1 = setTimeout(() => root.classList.add('sv-out'), total);
        t2 = setTimeout(finish, total + T.fade);
      });
    });
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userName = userProfile.name?.trim() || tGender(userProfile, 'أنتِ', 'أنتَ');

  return (
    <div
      ref={rootRef}
      className="sv-root"
      role="dialog"
      aria-label="بدء السجال الشعري"
      onClick={finish}
    >
      <div className="sv-bg" />
      <div className="sv-stage">
        <Panel side="left" w={size.w} h={size.h} />
        <Panel side="right" w={size.w} h={size.h} />

        {/* خط التصادم المائل — يستحضر حدّ اللوحتين المتوهجتين في التصميم المرجعي */}
        <div className="sv-seam" />
        <div className="sv-glow" />
        <div className="sv-shock" />
        <div className="sv-shock sv-shock-2" />
        <div className="sv-flash" />

        {/* اليسار: المستخدم */}
        <div className="sv-fighter sv-fighter-left">
          <div className="sv-avatar sv-avatar-user">
            <User size={40} strokeWidth={1.8} />
          </div>
          <span className="sv-name">{userName}</span>
        </div>

        {/* اليمين: فطين */}
        <div className="sv-fighter sv-fighter-right">
          <div className="sv-avatar sv-avatar-fateen">
            <GazelleIcon size={46} strokeWidth={1.7} />
          </div>
          <span className="sv-name">فطين</span>
        </div>

        {/* الشعار بدل VS */}
        <div className="sv-sword">
          <Swords size={72} strokeWidth={2} />
        </div>

        <div className="sv-title">
          <span className="sv-title-main">مضمار السجال الشعري</span>
          <span className="sv-title-sub">{tGender(userProfile, 'استعدّي للنزال', 'استعدّ للنزال')}</span>
        </div>
      </div>

      <button
        type="button"
        className="sv-skip"
        onClick={e => { e.stopPropagation(); finish(); }}
      >
        تخطي
      </button>
    </div>
  );
}
