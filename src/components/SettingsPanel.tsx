import type { AppSettings, UserProfile } from '../lib/types';
import { Button } from '../ui';
import SettingsContent from './SettingsContent';

interface Props { 
  settings: AppSettings; 
  userProfile: UserProfile;
  onUpdate: (s: Partial<AppSettings>) => void; 
  onUpdateProfile: (p: Partial<UserProfile>) => void;
  requestPermission: () => Promise<boolean>;
  onClose: () => void; 
}

export default function SettingsPanel({ settings, userProfile, onUpdate, onUpdateProfile, requestPermission, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="!w-full !max-w-md glass-modal !rounded-3xl !overflow-hidden animate-scale-in !max-h-[90vh] !overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="!px-5 !py-6 !flex !flex-col !gap-1 !border-b !border-[var(--border-0)]">
          <h2 className="!text-xl !font-bold !text-[var(--text-0)]">الإعدادات</h2>
          <p className="!text-xs !text-[var(--text-3)] !font-bold !uppercase !tracking-tight !opacity-60">تخصيص تجربة القراءة والحفظ</p>
        </div>
        <div className="!p-6">
          <SettingsContent 
            settings={settings}
            userProfile={userProfile}
            onUpdate={onUpdate}
            onUpdateProfile={onUpdateProfile}
            requestPermission={requestPermission}
          />
        </div>
        <div className="!px-5 !py-4 !border-t !border-[var(--border-0)] !flex !justify-center !sticky !bottom-0 !bg-[var(--glass-bg)] !backdrop-blur-md">
          <Button variant="ghost" size="sm" onClick={onClose} className="!text-xs !font-bold">إغلاق الإعدادات</Button>
        </div>
      </div>
    </div>
  );
}