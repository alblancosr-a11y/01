"use client"; 
 
import { X, Plus, Trash2, Edit2, Swords, BookOpen, AlertCircle, User } from 'lucide-react'; 
import type { AppState, SajalPoem, SajalSettings, UserProfile } from '../lib/types'; 
import { Button, Card, Badge } from '../ui'; 
import { tGender } from '../lib/arabicUtils'; 
 
interface Props { 
  state: AppState; 
  onAddPoem: () => void; 
  onEditPoem: (poem: SajalPoem) => void; 
  onDeletePoem: (id: string) => void; 
  onUpdateSettings: (settings: Partial<SajalSettings>) => void; 
  onStartGame: () => void; 
  onClose: () => void; 
} 
 
export default function SajalArenaSetup({  
  state,  
  onAddPoem,  
  onEditPoem,  
  onDeletePoem,  
  onUpdateSettings,  
  onStartGame, 
  onClose  
}: Props) { 
  const { sajalPoems, sajalSettings, userProfile } = state; 
  const isLimitReached = sajalPoems.length >= 50; 
 
  return ( 
    <div className="modal-overlay" onClick={onClose}> 
      <div  
        className="!w-full !max-w-2xl glass-modal !rounded-3xl !overflow-hidden !animate-scale-in !h-[560px] !max-h-[90dvh] !flex !flex-col" 
        onClick={e => e.stopPropagation()} 
      > 
        {/* Header - ثابت في الأعلى */} 
        <div className="!px-6 !py-3 !border-b !border-[var(--border-0)] !flex !items-center !justify-between !shrink-0 !bg-white/5"> 
          <div className="!flex !items-center !gap-3 !min-w-0 !pr-1"> 
            <div className="!w-8 !h-8 !rounded-lg gradient-accent !flex !items-center !justify-center !shrink-0 !shadow-lg !shadow-[var(--accent)]/20"> 
              <Swords size={16} className="!text-white" strokeWidth={2.5} /> 
            </div> 
            <div className="!min-w-0"> 
              <h2 className="!text-sm !font-bold !text-[var(--text-0)] !truncate">قصائد السجال</h2> 
            </div> 
          </div> 
          <button onClick={onClose} className="!p-1 !rounded-lg !text-[var(--text-3)] hover:!text-[var(--text-0)] hover:!bg-[var(--bg-2)] !transition-colors !shrink-0"> 
            <X size={16} /> 
          </button> 
        </div> 
 
        {/* Content Area - المساحة الوحيدة القابلة للتمرير مع ارتفاع مرن داخل النافذة الثابتة */} 
        <div className="!flex-1 !min-h-0 !overflow-y-auto !p-4 !space-y-4"> 
          {/* Settings Toggle */} 
          <Card className="!p-4 !border-dashed !border-2 !border-[var(--accent)]/20 !bg-[var(--accent-light)]/30 !shrink-0"> 
            <div className="!flex !items-center !justify-between !gap-4"> 
              <div className="!flex !items-center !gap-3"> 
                <div>  
                  <p className="!text-sm !font-bold !text-[var(--text-0)]">ضم قصائدي المحفوظة إلى السجال</p> 
                  <p className="!text-[10px] !text-[var(--text-3)]">استخدام قصائد الحفظ الموجودة أصلًا دون نسخها</p> 
                </div> 
              </div> 
              <button  
                onClick={() => onUpdateSettings({ includeHifzPoems: !sajalSettings.includeHifzPoems })} 
                className={`!relative !inline-flex !w-11 !h-6 !rounded-full !transition-all !duration-200 !shrink-0 ${sajalSettings.includeHifzPoems ? '!bg-[var(--accent)]' : '!bg-[var(--bg-3)]'}`} 
              > 
                <span className={`!absolute !top-1 !w-4 !h-4 !rounded-full !bg-white !shadow-sm !transition-all !duration-200 ${sajalSettings.includeHifzPoems ? '!right-1' : '!right-auto !left-1'}`} /> 
              </button> 
            </div> 
          </Card> 
 
          {/* Poems List Section */} 
          <div className="!space-y-4"> 
            <div className="!flex !items-center !justify-between !px-1"> 
              <h3 className="!text-xs !font-extrabold !text-[var(--text-3)] !uppercase !tracking-widest"> 
                مكتبة المضمار ({sajalPoems.length}/50) 
              </h3> 
              {!isLimitReached && ( 
                <Button variant="primary" size="sm" onClick={onAddPoem} className="!h-9 !px-4 !shadow-sm !gap-1"> 
                  <Plus size={14} className="!ml-1" /> 
                  إضافة قصيدة 
                </Button> 
              )} 
            </div> 
 
            {sajalPoems.length === 0 ? ( 
              <div className="!py-10 !flex !flex-col !items-center !gap-4 !text-center !border-2 !border-dashed !border-[var(--border-1)] !rounded-3xl !bg-[var(--bg-2)]/30"> 
                <div className="!w-12 !h-12 !rounded-full !bg-[var(--bg-3)] !flex !items-center !justify-center !text-[var(--text-3)] !opacity-40"> 
                  <Swords size={24} /> 
                </div> 
                <div className="!space-y-1 !px-4"> 
                  <p className="!text-sm !font-bold !text-[var(--text-1)]">المضمار خاوٍ حالياً</p> 
                  <p className="!text-xs !text-[var(--text-3)] !mb-4">{tGender(userProfile, 'أضيفي أول قصيدة للسجال لتبدئي التحدي', 'أضف أول قصيدة للسجال لتبدأ التحدي')}</p> 
                  <Button variant="primary" size="sm" onClick={onAddPoem} className="!shadow-sm !px-3 !flex !items-center !gap-0.5"> 
                    <Plus size={14} className="!ml-1" /> 
                    إضافة أول قصيدة 
                  </Button> 
                </div> 
              </div> 
            ) : ( 
              <div className="!grid !gap-3"> 
                {sajalPoems.map(poem => ( 
                  <div key={poem.id} className="!group !p-4 !rounded-2xl !bg-[var(--bg-2)] !border !border-[var(--border-0)] hover:!border-[var(--accent)]/30 !transition-all !flex !items-center !justify-between !gap-4 !shrink-0"> 
                    <div className="!min-w-0 !flex-1"> 
                      <p className="!font-bold !text-[var(--text-0)] !text-sm !truncate">{poem.title}</p> 
                      <div className="!flex !items-center !gap-2 !mt-1"> 
                        <div className="!flex !items-center !gap-1"> 
                          <BookOpen size={10} className="!text-[var(--text-3)]" /> 
                          <span className="!text-[10px] !text-[var(--text-3)] !font-medium">{poem.verses.length} بيت</span> 
                        </div> 
                        <span className="!text-[10px] !text-[var(--text-3)] !opacity-40">|</span> 
                        <div className="!flex !items-center !gap-1 !min-w-0 !flex-1"> 
                          <User size={10} className="!text-[var(--text-3)]" /> 
                          <span className="!text-[10px] !text-[var(--text-3)] !truncate">{poem.poet}</span> 
                        </div> 
                      </div> 
                    </div> 
                    <div className="!flex !items-center !gap-1 !shrink-0 !opacity-0 group-hover:!opacity-100 !transition-opacity"> 
                      <button onClick={() => onEditPoem(poem)} className="!p-2 !rounded-lg !text-[var(--text-3)] hover:!text-[var(--accent)] hover:!bg-[var(--accent-light)] !transition-all"> 
                        <Edit2 size={14} /> 
                      </button> 
                      <button onClick={() => onDeletePoem(poem.id)} className="!p-2 !rounded-lg !text-[var(--text-3)] hover:!text-[var(--error)] hover:!bg-[var(--error-light)] !transition-all"> 
                        <Trash2 size={14} /> 
                      </button> 
                    </div> 
                  </div> 
                ))} 
              </div> 
            )} 
 
            {isLimitReached && ( 
              <div className="!flex !items-center !gap-2 !p-3 !rounded-xl !bg-amber-500/10 !text-amber-600 !border !border-amber-500/20 !mt-4 !shrink-0"> 
                <AlertCircle size={14} /> 
                <p className="!text-[10px] !font-bold">{tGender(userProfile, 'تم الوصول للحد الأقصى (50 قصيدة). احذفي بعضها لإضافة المزيد.', 'تم الوصول للحد الأقصى (50 قصيدة). احذف بعضها لإضافة المزيد.')}</p> 
              </div> 
            )} 
             
            {/* 70px Spacer - مساحة فارغة إجبارية في نهاية المحتوى القابل للتمرير */} 
            <div className="!h-[70px] !shrink-0" /> 
          </div> 
        </div> 
 
        {/* Footer - ثابت في الأسفل */} 
        <div className="!p-4 !border-t !border-[var(--border-0)] !flex !justify-center !shrink-0 !bg-[var(--glass-bg)] !backdrop-blur-md !z-10"> 
          <Button  
            variant="primary"  
            size="lg"  
            className="!w-full !shadow-lg !shadow-[var(--accent)]/20 !flex !items-center !justify-center !gap-2" 
            disabled={sajalPoems.length === 0 && !sajalSettings.includeHifzPoems} 
            onClick={onStartGame} 
          > 
            <Swords size={18} className="!ml-2" /> 
            {tGender(userProfile, 'ابدئي السجال', 'ابدأ السجال')} 
          </Button> 
        </div> 
      </div> 
    </div> 
  ); 
}