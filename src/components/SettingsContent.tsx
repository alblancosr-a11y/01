"use client";

import { useState } from 'react';
import type { AppSettings, UserProfile } from '../lib/types';
import { Button, Input } from '../ui';
import { Heart, User, Bell, Moon, Sun, Type, Hash, Gauge, AudioLines } from 'lucide-react';

interface Props {
  settings: AppSettings;
  userProfile: UserProfile;
  onUpdate: (s: Partial<AppSettings>) => void;
  onUpdateProfile: (p: Partial<UserProfile>) => void;
  requestPermission: () => Promise<boolean>;
}

function Toggle({ value, onChange, disabled = false }: { value: boolean; onChange: (v: boolean) => void | Promise<void>; disabled?: boolean }) {
  return (
    <button 
      disabled={disabled}
      onClick={() => onChange(!value)} 
      className={`!relative !inline-flex !w-9 !h-5 !rounded-full transition-all duration-200 !shrink-0 ${value ? '!bg-[var(--accent)]' : '!bg-[var(--bg-3)]'} ${disabled ? '!opacity-50 !cursor-not-allowed' : '!cursor-pointer'}`}
    >
      <span className={`!absolute !top-0.5 !w-4 !h-4 !rounded-full !bg-white !shadow-sm transition-all duration-200 ${value ? '!right-0.5' : '!right-auto !left-0.5'}`} />
    </button>
  );
}

export default function SettingsContent({ settings, userProfile, onUpdate, onUpdateProfile, requestPermission }: Props) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userProfile.name);

  const saveName = () => {
    onUpdateProfile({ name: tempName });
    setIsEditingName(false);
  };

  return (
    <div className="!flex !flex-col !gap-8 !pb-20">
      {/* القسم الأول: بيانات المستخدم */}
      <div className="!flex !flex-col !gap-3">
        <h3 className="!text-[10px] !font-extrabold !text-[var(--text-3)] !uppercase !tracking-widest !px-1">بياناتك</h3>
        <div className="!flex !flex-col !gap-0 !divide-y !divide-[var(--border-0)] glass-card !rounded-3xl !overflow-hidden !border !border-[var(--border-0)]">
          <div className="!p-4 !flex !items-center !justify-between !gap-4">
            <div className="!flex-1 !min-w-0">
              <p className="!text-xs !text-[var(--text-3)] !mb-0.5">الاسم</p>
              {isEditingName ? (
                <div className="!flex !gap-2 !mt-2">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="اسمك"
                    className="!py-1.5 !text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={saveName} className="!px-3">حفظ</Button>
                </div>
              ) : (
                <p className="!text-sm !font-bold !text-[var(--text-0)] !truncate">{userProfile.name}</p>
              )}
            </div>
            {!isEditingName && (
              <Button variant="ghost" size="sm" onClick={() => { setTempName(userProfile.name); setIsEditingName(true); }} className="!text-xs !h-8 !px-3 !bg-[var(--bg-2)] hover:!bg-[var(--bg-3)]">تعديل</Button>
            )}
          </div>
          <div className="!p-4 !flex !items-center !justify-between !gap-4">
            <p className="!text-sm !font-bold !text-[var(--text-0)]">طريقة المخاطبة</p>
            <div className="!flex !gap-1 !bg-[var(--bg-2)] !p-1 !rounded-xl">
              <button
                onClick={() => onUpdateProfile({ preferredAddressing: 'girl' })}
                className={`!flex !items-center !gap-1.5 !px-3 !py-1.5 !rounded-lg !text-[10px] !font-bold transition-all ${
                  userProfile.preferredAddressing === 'girl'
                    ? '!bg-[var(--accent)] !text-white !shadow-sm'
                    : '!text-[var(--text-2)] hover:!text-[var(--text-0)]'
                }`}
              >
                <Heart size={12} fill={userProfile.preferredAddressing === 'girl' ? "currentColor" : "none"} />
                بنت
              </button>
              <button
                onClick={() => onUpdateProfile({ preferredAddressing: 'boy' })}
                className={`!flex !items-center !gap-1.5 !px-3 !py-1.5 !rounded-lg !text-[10px] !font-bold transition-all ${
                  userProfile.preferredAddressing === 'boy'
                    ? '!bg-[var(--accent)] !text-white !shadow-sm'
                    : '!text-[var(--text-2)] hover:!text-[var(--text-0)]'
                }`}
              >
                <User size={12} fill={userProfile.preferredAddressing === 'boy' ? "currentColor" : "none"} />
                ولد
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* القسم الثاني: إعدادات التطبيق */}
      <div className="!flex !flex-col !gap-3">
        <h3 className="!text-[10px] !font-extrabold !text-[var(--text-3)] !uppercase !tracking-widest !px-1">التطبيق</h3>
        <div className="!flex !flex-col !gap-0 !divide-y !divide-[var(--border-0)] glass-card !rounded-3xl !overflow-hidden !border !border-[var(--border-0)]">
          <div className="!p-4 !flex !items-center !justify-between !gap-4">
            <div className="!flex !items-center !gap-3">
              <div className="!w-8 !h-8 !rounded-lg !bg-[var(--bg-2)] !flex !items-center !justify-center !text-[var(--text-2)]">
                {settings.darkMode ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <div className="!flex !flex-col !gap-0.5">
                <p className="!text-sm !font-bold !text-[var(--text-0)]">الوضع الليلي</p>
                <p className="!text-[10px] !text-[var(--text-3)] !font-medium">تصميم داكن مريح للعينين</p>
              </div>
            </div>
            <Toggle value={settings.darkMode} onChange={v => onUpdate({ darkMode: v })} />
          </div>

          <div className="!p-4 !flex !items-center !justify-between !gap-4">
            <div className="!flex !items-center !gap-3">
              <div className="!w-8 !h-8 !rounded-lg !bg-[var(--bg-2)] !flex !items-center !justify-center !text-[var(--text-2)]">
                <Bell size={16} />
              </div>
              <div className="!flex !flex-col !gap-0.5">
                <p className="!text-sm !font-bold !text-[var(--text-0)]">الإشعارات</p>
                <p className="!text-[10px] !text-[var(--text-3)] !font-medium">تلقي تنبيهات عند حان موعد المهام</p>
              </div>
            </div>
            <Toggle 
              value={settings.notificationsEnabled} 
              onChange={async (v) => {
                if (v) {
                  const granted = await requestPermission();
                  if (!granted) return;
                }
                onUpdate({ notificationsEnabled: v });
              }} 
            />
          </div>

          <div className="!p-4 !flex !items-center !justify-between !gap-4">
            <div className="!flex !items-center !gap-3">
              <div className="!w-8 !h-8 !rounded-lg !bg-[var(--bg-2)] !flex !items-center !justify-center !text-[var(--text-2)]">
                <Type size={16} />
              </div>
              <div className="!flex !flex-col !gap-0.5">
                <p className="!text-sm !font-bold !text-[var(--text-0)]">حجم الخط</p>
                <p className="!text-[10px] !text-[var(--text-3)] !font-medium">تغيير مقاس نص الأبيات</p>
              </div>
            </div>
            <div className="!flex !gap-1 !bg-[var(--bg-2)] !p-1 !rounded-xl">
              {[1, 2, 3].map(s => (
                <button key={s} onClick={() => onUpdate({ fontSize: s })} className={`!px-3 !py-1.5 !rounded-lg !text-[10px] !font-bold transition-all ${settings.fontSize === s ? '!bg-[var(--accent)] !text-white !shadow-sm' : '!text-[var(--text-2)] hover:!text-[var(--text-0)]'}`}>{s === 1 ? 'صغير' : s === 2 ? 'وسط' : 'كبير'}</button>
              ))}
            </div>
          </div>

          <div className="!p-4 !flex !items-center !justify-between !gap-4">
            <div className="!flex !items-center !gap-3">
              <div className="!w-8 !h-8 !rounded-lg !bg-[var(--bg-2)] !flex !items-center !justify-center !text-[var(--text-2)]">
                <Hash size={16} />
              </div>
              <div className="!flex !flex-col !gap-0.5">
                <p className="!text-sm !font-bold !text-[var(--text-0)]">التشكيل إلزامي</p>
                <p className="!text-[10px] !text-[var(--text-3)] !font-medium">مطابقة الحركات في الاختبارات</p>
              </div>
            </div>
            <Toggle value={settings.requireTashkeel} onChange={v => onUpdate({ requireTashkeel: v })} />
          </div>

          <div className="!p-4 !flex !items-center !justify-between !gap-4">
            <div className="!flex !items-center !gap-3">
              <div className="!w-8 !h-8 !rounded-lg !bg-[var(--bg-2)] !flex !items-center !justify-center !text-[var(--text-2)]">
                <Hash size={16} />
              </div>
              <div className="!flex !flex-col !gap-0.5">
                <p className="!text-sm !font-bold !text-[var(--text-0)]">أرقام الأبيات</p>
                <p className="!text-[10px] !text-[var(--text-3)] !font-medium">عرض تسلسل الأبيات في القراءة</p>
              </div>
            </div>
            <Toggle value={settings.showVerseNumbers} onChange={v => onUpdate({ showVerseNumbers: v })} />
          </div>
        </div>
      </div>

      {/* القسم الثالث: إعدادات الصوت */}
      <div className="!flex !flex-col !gap-3">
        <h3 className="!text-[10px] !font-extrabold !text-[var(--text-3)] !uppercase !tracking-widest !px-1">القراءة الصوتية</h3>
        <div className="!flex !flex-col !gap-0 !divide-y !divide-[var(--border-0)] glass-card !rounded-3xl !overflow-hidden !border !border-[var(--border-0)]">
          <div className="!p-4 !flex !flex-col !gap-4">
            <div className="!flex !items-center !justify-between">
              <div className="!flex !items-center !gap-3">
                <div className="!w-8 !h-8 !rounded-lg !bg-[var(--bg-2)] !flex !items-center !justify-center !text-[var(--text-2)]">
                  <Gauge size={16} />
                </div>
                <p className="!text-sm !font-bold !text-[var(--text-0)]">سرعة القراءة</p>
              </div>
              <span className="!text-xs !font-bold !text-[var(--accent-text)] !tabular-nums">{settings.speechRate}x</span>
            </div>
            <input
              type="range" min="0.5" max="1.5" step="0.1"
              value={settings.speechRate}
              onChange={e => onUpdate({ speechRate: Number(e.target.value) })}
              className="!w-full !accent-[var(--accent)] !h-1.5 !bg-[var(--bg-3)] !rounded-lg !appearance-none !cursor-pointer"
            />
          </div>
          <div className="!p-4 !flex !flex-col !gap-4">
            <div className="!flex !items-center !justify-between">
              <div className="!flex !items-center !gap-3">
                <div className="!w-8 !h-8 !rounded-lg !bg-[var(--bg-2)] !flex !items-center !justify-center !text-[var(--text-2)]">
                  <AudioLines size={16} />
                </div>
                <p className="!text-sm !font-bold !text-[var(--text-0)]">نبرة الصوت</p>
              </div>
              <span className="!text-xs !font-bold !text-[var(--accent-text)] !tabular-nums">{settings.speechPitch}</span>
            </div>
            <input
              type="range" min="0.5" max="2" step="0.1"
              value={settings.speechPitch}
              onChange={e => onUpdate({ speechPitch: Number(e.target.value) })}
              className="!w-full !accent-[var(--accent)] !h-1.5 !bg-[var(--bg-3)] !rounded-lg !appearance-none !cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}