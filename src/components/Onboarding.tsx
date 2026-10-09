"use client";

import { useState } from 'react';
import { UserProfile } from '../lib/types';
import { Button, Card, Input } from '../ui';
import { User, Heart } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    preferredAddressing: 'girl',
    onboardingCompleted: false,
  });

  const nextStep = () => {
    if (step === 1) {
      setStep(2);
    } else {
      if (profile.name.trim()) {
        onComplete({ ...profile, onboardingCompleted: true });
      }
    }
  };

  return (
    <div className="!fixed !inset-0 !z-[100] app-bg !flex !items-center !justify-center !p-6 !overflow-y-auto">
      {/* ضبط الحشوة الداخلية المتوازنة من الأعلى والأسفل والجوانب */}
      <Card className="!w-full !max-w-md !p-8 !shadow-2xl animate-scale-in !flex !flex-col !gap-6">
        <div className="!text-center !space-y-2 !pt-2">
          <h1 className="!text-2xl !font-extrabold !text-[var(--text-0)] !tracking-tight">مرحباً بك في مَدَارِج</h1>
          <p className="!text-sm !text-[var(--text-3)] !font-medium">خطوات بسيطة لنخصص لك تجربة الحفظ</p>
        </div>

        {step === 1 ? (
          <div className="!space-y-6 animate-fade-in !pb-2">
            <h2 className="!text-lg !font-bold !text-[var(--text-1)] !text-center">حدد جنسك لتخصيص صيغة المخاطبة</h2>
            <div className="!grid !grid-cols-2 !gap-4">
              <button
                onClick={() => setProfile({ ...profile, preferredAddressing: 'girl' })}
                className={`!flex !flex-col !items-center !gap-3 !p-6 !rounded-2xl !border-2 !transition-all ${
                  profile.preferredAddressing === 'girl'
                    ? '!border-[var(--accent)] !bg-[var(--accent-light)]'
                    : '!border-[var(--border-0)] !bg-[var(--bg-2)] hover:!border-[var(--border-1)]'
                }`}
              >
                <Heart size={32} className={profile.preferredAddressing === 'girl' ? '!text-[var(--accent)]' : '!text-[var(--text-3)]'} />
                <span className={`!font-bold ${profile.preferredAddressing === 'girl' ? '!text-[var(--accent-text)]' : '!text-[var(--text-2)]'}`}>بنت</span>
              </button>
              <button
                onClick={() => setProfile({ ...profile, preferredAddressing: 'boy' })}
                className={`!flex !flex-col !items-center !gap-3 !p-6 !rounded-2xl !border-2 !transition-all ${
                  profile.preferredAddressing === 'boy'
                    ? '!border-[var(--accent)] !bg-[var(--accent-light)]'
                    : '!border-[var(--border-0)] !bg-[var(--bg-2)] hover:!border-[var(--border-1)]'
                }`}
              >
                <User size={32} className={profile.preferredAddressing === 'boy' ? '!text-[var(--accent)]' : '!text-[var(--text-3)]'} />
                <span className={`!font-bold ${profile.preferredAddressing === 'boy' ? '!text-[var(--accent-text)]' : '!text-[var(--text-2)]'}`}>ولد</span>
              </button>
            </div>
            <div className="!pt-3">
              <Button variant="primary" className="!w-full" onClick={nextStep}>
                متابعة
              </Button>
            </div>
          </div>
        ) : (
          <div className="!space-y-6 animate-fade-in !pb-2">
            <h2 className="!text-lg !font-bold !text-[var(--text-1)] !text-center">ما اسمك؟</h2>
            <div className="!space-y-4">
              <Input
                placeholder={profile.preferredAddressing === 'girl' ? "ادخلي اسمكِ هنا..." : "أدخل اسمكَ هنا..."}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="!text-center !text-lg !h-14"
                autoFocus
              />
              <p className="!text-[10px] !text-[var(--text-3)] !text-center">
                {profile.preferredAddressing === 'girl' ? 'سنستخدم اسمكِ لتشجيعكِ أثناء رحلة الحفظ' : 'سنستخدم اسمكَ لتشجيعكَ أثناء رحلة الحفظ'}
              </p>
            </div>
            <div className="!flex !flex-col !gap-3 !pt-2">
              <Button variant="primary" className="!w-full !h-14" onClick={nextStep} disabled={!profile.name.trim()}>
                {profile.preferredAddressing === 'girl' ? 'ابدئي الآن' : 'ابدأ الآن'}
              </Button>
              <button onClick={() => setStep(1)} className="!text-xs !text-[var(--text-3)] !font-bold hover:!text-[var(--text-1)] !transition-colors">
                العودة للمرحلة السابقة
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}