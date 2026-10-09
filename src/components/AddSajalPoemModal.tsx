"use client";

import { useState, useEffect } from 'react';
import { X, FileText, User, Swords } from 'lucide-react';
import type { SajalPoem, Verse } from '../lib/types';
import { parsePoem } from '../lib/poem-parser';
import { Button, Input, TextArea, Badge } from '../ui';
import { tGender } from '../lib/arabicUtils';
import { UserProfile } from '../lib/types';

interface Props {
  userProfile: UserProfile;
  onClose: () => void;
  onAdd: (poem: SajalPoem) => void;
  editPoem?: SajalPoem;
}

export default function AddSajalPoemModal({ userProfile, onClose, onAdd, editPoem }: Props) {
  const [title, setTitle] = useState(editPoem?.title || '');
  const [poet, setPoet] = useState(editPoem?.poet || '');
  const [rawText, setRawText] = useState(editPoem?.rawText || '');
  const [verses, setVerses] = useState<Verse[]>(editPoem?.verses || []);
  const [error, setError] = useState('');

  useEffect(() => {
    setVerses(rawText.trim() ? parsePoem(rawText) : []);
  }, [rawText]);

  const handleSubmit = () => {
    if (!rawText.trim()) {
      setError(tGender(userProfile, 'أدخلي نص القصيدة', 'أدخل نص القصيدة'));
      return;
    }

    if (!verses.length) {
      setError(tGender(userProfile, 'لم يُتعرف على أبيات — كل سطرين بيت', 'لم يتم التعرف على أبيات — كل سطرين بيت'));
      return;
    }

    onAdd({
      id: editPoem?.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: title.trim() || 'قصيدة بدون عنوان',
      poet: poet.trim() || 'شاعر غير معروف',
      rawText: rawText.trim(),
      verses,
      createdAt: editPoem?.createdAt || Date.now(),
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="!w-full !max-w-lg glass-modal !rounded-2xl !overflow-hidden !animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="!flex !items-center !justify-between !px-5 !py-3 !border-b !border-[var(--border-0)] !bg-white/5">
          <div className="!flex !items-center !gap-3">
            <Swords size={16} className="!text-[var(--accent)]" />
            <h2 className="!text-sm !font-semibold !text-[var(--text-0)] !me-8">
              {editPoem ? 'تعديل قصيدة السجال' : 'إضافة قصيدة للسجال'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="!p-1.5 !rounded-lg !text-[var(--text-3)] hover:!text-[var(--text-0)] hover:!bg-[var(--bg-2)] !transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="!px-6 !py-5 !flex !flex-col !gap-4 !max-h-[75dvh] !overflow-y-auto">
          <div className="!flex !flex-col !gap-2">
            <label className="!text-xs !font-bold !text-[var(--text-1)] !px-1 !uppercase !tracking-wider">
              اسم القصيدة
            </label>

            <div className="!relative">
              <FileText
                size={16}
                className="!absolute !right-4 !top-1/2 !-translate-y-1/2 !text-[var(--text-3)] !opacity-40"
              />
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: لاميّة العرب"
                className="!pr-12"
              />
            </div>
          </div>

          <div className="!flex !flex-col !gap-2">
            <label className="!text-xs !font-bold !text-[var(--text-1)] !px-1 !uppercase !tracking-wider">
              الشاعر
            </label>

            <div className="!relative">
              <User
                size={16}
                className="!absolute !right-4 !top-1/2 !-translate-y-1/2 !text-[var(--text-3)] !opacity-40"
              />
              <Input
                value={poet}
                onChange={e => setPoet(e.target.value)}
                placeholder="مثال: الشنفرى"
                className="!pr-12"
              />
            </div>
          </div>

          <div className="!flex !flex-col !gap-2">
            <div className="!flex !justify-between !items-end !px-1">
              <label className="!text-xs !font-bold !text-[var(--text-1)] !uppercase !tracking-wider">
                نص القصيدة
              </label>

              <div>
                <Badge variant="accent">
                  {verses.length} بيت
                </Badge>
              </div>
            </div>

            <TextArea
              value={rawText}
              onChange={e => { setRawText(e.target.value); setError(''); }}
              placeholder={tGender(userProfile, 'اكتبي الأبيات هنا...', 'اكتب الأبيات هنا...')}
              rows={5}
              dir="rtl"
              style={{
                fontFamily: 'var(--font-poem)',
                fontSize: '1rem',
                lineHeight: '2.5rem',
                paddingRight: '16px',
                paddingTop: '10px'
              }}
              className="!bg-white/5 dark:!bg-black/20 !border-[var(--border-1)] focus:!border-[var(--accent)]"
            />

            {error && (
              <p className="!text-[10px] !text-[var(--error)] !font-bold !px-1">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="!flex !items-center !justify-between !px-5 !py-4 !border-t !border-[var(--border-0)] !bg-white/5">
          <Button
            variant="ghost"
            size="sm"
            className="!w-auto !px-4 !font-bold"
            onClick={onClose}
          >
            إلغاء
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="!w-auto !h-[36px] !px-4"
            onClick={handleSubmit}
          >
            {editPoem ? 'حفظ التعديلات' : 'إضافة للمضمار'}
          </Button>
        </div>
      </div>
    </div>
  );
}