"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, Swords, User, CheckCircle2, RotateCcw, AlertTriangle, Settings2 } from 'lucide-react';
import type { AppState, UserProfile, SajalMessage } from '../lib/types';
import { Card, Button, Input } from '../ui';
import { tGender, withName, genderText } from '../lib/arabicUtils';
import { 
  buildSajalLibrary, 
  getCleanFirstLetter, 
  getCleanLastLetter, 
  validateUserVerse, 
  findVerseByStartingLetter,
  SajalVerseEntry
} from '../lib/sajalLogic';
import { normalizeForComparison } from '../lib/poem-parser';
import GazelleIcon from './GazelleIcon';

interface Props {
  state: AppState;
  onSetup: () => void;
  onClose: () => void;
}

type GamePhase = 'playing' | 'complete';

export default function SajalArenaView({ state, onSetup, onClose }: Props) {
  const { userProfile, sajalPoems, poems, sajalSettings } = state;
  const [phase, setPhase] = useState<GamePhase>('playing');
  const [turn, setTurn] = useState(1);
  const [messages, setMessages] = useState<SajalMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedVerseTexts, setUsedVerseTexts] = useState<string[]>([]);
  const [requiredLetter, setRequiredLetter] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // بناء المكتبة مرة واحدة عند بدء المكون
  const library = useMemo(() => {
    return buildSajalLibrary(sajalPoems, poems, sajalSettings.includeHifzPoems);
  }, [sajalPoems, poems, sajalSettings.includeHifzPoems]);

  // تهيئة اللعبة ببيت افتتاحي من فطين
  useEffect(() => {
    if (messages.length === 0 && library.length > 0) {
      setIsThinking(true);
      const timer = setTimeout(() => {
        // اختيار بيت افتتاحي عشوائي
        const startVerse = library[Math.floor(Math.random() * library.length)];
        const lastLetter = getCleanLastLetter(startVerse.text);
        
        setMessages([{
          id: 'start-fateen',
          sender: 'fateen',
          text: startVerse.text,
          sadr: startVerse.sadr,
          ajar: startVerse.ajar,
          timestamp: Date.now()
        }]);
        setUsedVerseTexts([startVerse.text]);
        setRequiredLetter(lastLetter);
        setIsThinking(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [library, messages.length]);

  // التمرير التلقائي لأسفل المحادثة
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!userInput.trim() || phase === 'complete' || isThinking) return;

    const userVerseText = userInput.trim();
    const normOpts = { ignoreTashkeel: true, ignorePunctuation: true };
    const userNorm = normalizeForComparison(userVerseText, normOpts);
    
    // المرحلة 1 و 2: التحقق من البيت والحرف
    const validation = validateUserVerse(userVerseText, requiredLetter, library, userProfile);
    
    if (!validation.isValid) {
      setError(validation.error || 'خطأ في التحقق');
      return;
    }

    // المرحلة 3: منع التكرار (للمستخدم وفطين) باستخدام النصوص المطبعة
    if (usedVerseTexts.some(t => normalizeForComparison(t, normOpts) === userNorm)) {
      setError(tGender(userProfile, 'هذا البيت استُخدم في هذه الجولة من قبل. اختاري بيتاً آخر.', 'هذا البيت استُخدم في هذه الجولة من قبل. اختر بيتاً آخر.'));
      return;
    }

    // الإجابة صحيحة - إضافة رسالة المستخدم
    const userMsg: SajalMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: validation.matchedVerse?.text || userVerseText,
      sadr: validation.matchedVerse?.sadr,
      ajar: validation.matchedVerse?.ajar,
      timestamp: Date.now()
    };

    const newUsed = [...usedVerseTexts, userMsg.text];
    setMessages(prev => [...prev, userMsg]);
    setUsedVerseTexts(newUsed);
    setError(null);
    setUserInput('');
    setIsThinking(true);

    // دور فطين
    const userLastLetter = getCleanLastLetter(userVerseText);
    // البحث عن رد لفطين مع استبعاد الأبيات المستخدمة (بالمطابقة المطبعة)
    const fateenVerse = findVerseByStartingLetter(library, userLastLetter, newUsed);

    if (!fateenVerse) {
      // لا يوجد رد صالح لفطين
      setError(tGender(userProfile, 'لم أجد في مضماركِ بيتاً يبدأ بهذا الحرف، غيّري بيتكِ واختاري بيتاً آخر.', 'لم أجد في مضماركَ بيتاً يبدأ بهذا الحرف، غيّر بيتكَ واختر بيتاً آخر.'));
      setIsThinking(false);
      return;
    }

    // فطين وجد رداً
    setTimeout(() => {
      const fateenMsg: SajalMessage = {
        id: `fateen-${Date.now()}`,
        sender: 'fateen',
        text: fateenVerse.text,
        sadr: fateenVerse.sadr,
        ajar: fateenVerse.ajar,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, fateenMsg]);
      setUsedVerseTexts(prev => [...prev, fateenVerse.text]);
      setRequiredLetter(getCleanLastLetter(fateenVerse.text));
      setIsThinking(false);
      
      if (turn >= 10) {
        setPhase('complete');
      } else {
        setTurn(prev => prev + 1);
      }
    }, 800);
  };

  const restartGame = () => {
    setTurn(1);
    setMessages([]);
    setUsedVerseTexts([]);
    setRequiredLetter(null);
    setPhase('playing');
    setError(null);
    setUserInput('');
  };

  if (library.length === 0) {
  return (
    <div className="!modal-overlay" onClick={onClose}>
      <Card className="!w-full !max-w-md !p-8 !text-center !animate-scale-in" onClick={() => {}}>
        <div className="!w-16 !h-16 !rounded-2xl !bg-[var(--bg-3)] !flex !items-center !justify-center !mx-auto !mb-6 !opacity-40">
          <Swords size={32} />
        </div>
        <h2 className="!text-xl !font-bold !text-[var(--text-0)] !mb-2">المضمار خالٍ</h2>
        <p className="!text-sm !text-[var(--text-3)] !mb-8">
          {tGender(userProfile, 'مضماركِ خالٍ الآن. أضيفي قصائدكِ أولاً لنبدأ السجال.', 'مضماركَ خالٍ الآن. أضف قصائدكَ أولاً لنبدأ السجال.')}
        </p>
        <Button variant="primary" onClick={onSetup} className="!w-full">
          إضافة قصيدة
        </Button>
      </Card>
    </div>
  );
}

return (
  <div className="!fixed !inset-0 !z-50 !app-bg !flex !flex-col">
    {/* Header */}
    <div className="!glass-header !flex !items-center !justify-between !px-6 !py-4 !border-b !border-[var(--border-0)] !shrink-0 !shadow-sm">
      <div className="!flex !items-center !gap-3">
        <div className="!w-9 !h-9 !rounded-xl !gradient-accent !flex !items-center !justify-center !shadow-md !relative !right-[10px]">
          <Swords size={18} className="!text-white" strokeWidth={2.5} />
        </div>
        <div className="!relative !right-[10px]">
          <h2 className="!text-base !font-bold !text-[var(--text-0)]">مضمار السجال الشعري</h2>
          {phase === 'playing' && (
            <p className="!text-[10px] !text-[var(--text-3)] !font-bold !uppercase !tracking-widest">
              الجولة {turn} من 10
            </p>
          )}
        </div>
      </div>
      <div className="!flex !items-center !gap-1 !relative !left-[10px]">
        <button 
          onClick={onSetup} 
          className="!p-2 !rounded-lg !text-[var(--text-3)] hover:!text-[var(--text-1)] hover:!bg-[var(--bg-2)] !transition-colors"
          title="إعداد المضمار"
        >
          <Settings2 size={20} />
        </button>
        <button onClick={onClose} className="!p-2 !rounded-lg !text-[var(--text-3)] hover:!text-[var(--text-0)] hover:!bg-[var(--bg-2)] !transition-colors">
          <X size={20} />
        </button>
      </div>
    </div>

      {/* Game Content */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full relative">
        {phase === 'playing' ? (
          <>
            {/* Messages Scroll Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 !pt-4 !pb-12 !space-y-2 scroll-smooth"
            >{messages.map((msg) => (
              
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'fateen' ? 'justify-start' : 'justify-end'} animate-fade-in px-6`}
                >
               <div className={`flex gap-4 max-w-[90%] ${msg.sender === 'user' ? 'flex-row-reverse !translate-x-4' : '!-translate-x-4'}`}>
                    <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center border shadow-sm ${
                      msg.sender === 'fateen' 
                        ? 'bg-[var(--accent-light)] border-[var(--accent)]/20 text-[var(--accent)]' 
                        : 'bg-white/40 border-white/40 text-[var(--text-2)]'
                    }`}>
                      {msg.sender === 'fateen' ? <GazelleIcon size={18} /> : <User size={18} />}
                    </div>
                  <div className={`!px-8 !py-2 rounded-[2rem] ${msg.sender === 'user' ? '!-translate-x-2' : 'translate-x-2'} ${
                      msg.sender === 'fateen'
                        ? 'glass-card !bg-white/60 dark:!bg-black/60 rounded-tr-none'
                        : 'gradient-accent text-white shadow-[0_8px_24px_rgba(0,122,255,0.25)] rounded-tl-none'
                    }`}>
                      <div 
                        className="text-sm md:text-base leading-relaxed font-bold text-right flex flex-col gap-1.5"
                        style={{ fontFamily: 'var(--font-poem)' }}
                      >
                        <p className="poetic-sadr">{msg.sadr || msg.text}</p>
                        {msg.ajar && (
                          <p className="poetic-ajar opacity-95">{msg.ajar}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="h-4" />
            </div>

           {/* Input Area */}
<div className="!p-6 !border-t !border-[var(--border-0)] !bg-[var(--glass-bg)] !backdrop-blur-xl !shrink-0">
  {error && (
    <div className="!flex !items-center !gap-2 !mb-4 !p-3 !rounded-xl !bg-[var(--error-light)] !text-[var(--error)] !border !border-[var(--error)]/10 !animate-fade-in">
      <AlertTriangle size={14} className="!shrink-0" />
      <p className="!text-xs !font-bold">{error}</p>
    </div>
  )}

  <div className="!flex !flex-col !gap-4">
    <div className="!flex !items-center !justify-between !px-1">
      <div className="!text-xs !font-bold !text-[var(--text-2)]">
        {requiredLetter ? (
          <p>{tGender(userProfile, 'اكتبي بيتاً يبدأ بحرف:', 'اكتب بيتاً يبدأ بحرف:')} <span className="!text-xl !text-[var(--accent)] !mr-1 !tabular-nums !font-extrabold">{requiredLetter}</span></p>
        ) : (
          <p>{tGender(userProfile, 'ابدئي السجال بأي بيت من مضماركِ', 'ابدأ السجال بأي بيت من مضماركَ')}</p>
        )}
      </div>
    </div>
    
    <div className="!relative !flex !gap-2">
      <Input
        value={userInput}
        disabled={isThinking}
        onChange={(e) => { setUserInput(e.target.value); setError(null); }}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder={isThinking ? tGender(userProfile, 'فطين يفكّر...', 'فطين يفكّر...') : tGender(userProfile, 'اكتبي البيت هنا...', 'اكتب البيت هنا...')}
        className="!flex-1 !h-14 !text-lg !font-bold !pr-4"
        dir="rtl"
        style={{ fontFamily: 'var(--font-poem)' }}
      />
      <button 
        onClick={handleSend}
        disabled={!userInput.trim() || isThinking}
        className="!w-14 !h-14 !rounded-2xl !gradient-accent !text-white !flex !items-center !justify-center !shadow-lg !shadow-[var(--accent)]/20 active:!scale-95 !transition-all disabled:!opacity-50 disabled:!grayscale !cursor-pointer"
      >
        <Send size={20} className={`!rotate-180 ${isThinking ? '!animate-pulse' : ''}`} />
      </button>
    </div>
  </div>
</div>
</>
) : (
  /* Result Phase */
  <div className="!flex-1 !flex !items-center !justify-center !p-8 !animate-fade-in">
    <Card className="!w-full !max-w-lg !p-10 !text-center !shadow-2xl !flex !flex-col !items-center !gap-8">
      <div className="!w-20 !h-20 !rounded-3xl !bg-[var(--success-light)] !text-[var(--success)] !flex !items-center !justify-center !shadow-inner">
        <CheckCircle2 size={40} strokeWidth={2.5} />
      </div>
      
      <div className="!space-y-2">
        <h2 className="!text-3xl !font-extrabold !text-[var(--text-0)] !tracking-tight">
          {tGender(userProfile, 'أتممتِ السجال!', 'أتممتَ السجال!')}
        </h2>
        <p className="!text-sm !text-[var(--text-3)] !font-medium">
          {withName(userProfile, tGender(userProfile, 'لقد أبليتِ بلاءً حسناً في مضمار الشعر', 'لقد أبليتَ بلاءً حسناً في مضمار الشعر'))}
        </p>
      </div>

      <div className="!grid !grid-cols-2 !gap-4 !w-full">
        <div className="!p-4 !rounded-2xl !bg-[var(--bg-2)] !border !border-[var(--border-0)]">
          <p className="!text-2xl !font-black !text-[var(--text-0)] !tabular-nums">{turn} / 10</p>
          <p className="!text-[10px] !text-[var(--text-3)] !font-bold !uppercase !mt-1">عدد الجولات</p>
        </div>
        <div className="!p-4 !rounded-2xl !bg-[var(--bg-2)] !border !border-[var(--border-0)]">
          <p className="!text-2xl !font-black !text-[var(--success)] !tabular-nums">{turn}</p>
          <p className="!text-[10px] !text-[var(--text-3)] !font-bold !uppercase !mt-1">
            {tGender(userProfile, 'أبياتكِ الصحيحة', 'أبياتكَ الصحيحة')}
          </p>
        </div>
      </div>

      <div className="!flex !flex-col !gap-3 !w-full !pt-4">
        <Button variant="primary" size="lg" className="!w-full !h-14 !shadow-md" onClick={restartGame}>
          <RotateCcw size={18} className="!ml-2" />
          سجال جديد
        </Button>
        <Button variant="ghost" size="md" className="!w-full !font-bold" onClick={onClose}>
          العودة إلى المضمار
        </Button>
      </div>
       </Card>
  </div>
)}
      </div>
    </div>
  );
}