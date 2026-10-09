"use client";

import { Swords, ChevronLeft } from 'lucide-react';
import { Card } from '../ui';
import { AppState } from '../lib/types';
import { tGender } from '../lib/arabicUtils';

interface Props {
  state: AppState;
  onClick: () => void;
}

export default function SajalArenaCard({ state, onClick }: Props) {
  const sajalCount = state.sajalPoems.length;
  
  return (
    <Card 
      hover 
      onClick={onClick}
      className="px-8 !h-[120px] overflow-hidden shadow-md flex items-center relative group cursor-pointer border border-[var(--accent)]/10"
    >
      <div className="flex items-center gap-5 w-full">
        {/* أيقونة السيف - الشعار الرئيسي */}
        <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center shrink-0 shadow-sm border border-[var(--accent)]/10 relative right-[12px] group-hover:scale-110 transition-transform duration-300">
          <Swords size={28} className="text-[var(--accent)] shrink-0" strokeWidth={2.2} />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col gap-1 relative top-[2px]">
          <h2 className="text-lg font-bold text-[var(--text-0)] leading-none">مضمار السجال الشعري</h2>
          <p className="text-sm text-[var(--text-3)] font-bold opacity-60 uppercase tracking-wider leading-none mt-0.5">
            {sajalCount === 0 
              ? tGender(state.userProfile, 'أضيفي قصائدكِ وابدئي السجال', 'أضف قصائدك وابدأ السجال')
              : tGender(state.userProfile, `${sajalCount} قصيدة في مضماركِ حالياً`, `${sajalCount} قصيدة في مضماركَ حالياً`)}
          </p>
          
          <div className="flex gap-2 mt-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--accent-text)] text-[11px] font-bold border border-[var(--accent)]/10">
  
            </div>
          </div>
        </div>

        <div className="shrink-0 mr-auto relative left-[12px]">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] text-[var(--accent-text)] flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-white transition-all duration-300 glass-interactive !border-[var(--accent)]/10">
            <ChevronLeft size={20} strokeWidth={3} />
          </div>
        </div>
      </div>
    </Card>
  );
}
