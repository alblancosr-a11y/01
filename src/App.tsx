"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Poem, VerseStats, ErrorLogEntry, SuccessLogEntry, SessionSource, SajalPoem } from './lib/types';
import { useAppState } from './hooks/useAppState';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PoemsPage from './components/PoemsPage';
import AddPoemModal from './components/AddPoemModal';
import SessionStartModal from './components/SessionStartModal';
import SessionView from './components/SessionView';
import ReadingView from './components/ReadingView';
import StatsView from './components/StatsView';
import SettingsPanel from './components/SettingsPanel';
import TodaySessionView from './components/TodaySessionView';
import ErrorLogView from './components/ErrorLogView';
import FateenChallengeView from './components/FateenChallengeView';
import FateenSelectPoem from './components/FateenSelectPoem';
import Onboarding from './components/Onboarding';
import SettingsContent from './components/SettingsContent';
import SajalArenaCard from './components/SajalArenaCard';
import SajalArenaSetup from './components/SajalArenaSetup';
import AddSajalPoemModal from './components/AddSajalPoemModal';
import SajalArenaView from './components/SajalArenaView';
import { Button, Card } from './ui';
import { AlertCircle, ChevronLeft, Bell, Swords } from 'lucide-react';
import { buildTodaySession } from './lib/todaySession';
import { useNotifications } from './hooks/useNotifications';
import { tGender } from './lib/arabicUtils';

type Page = 'home' | 'poems' | 'session' | 'stats' | 'settings' | 'fateen' | 'sajal_arena';

type Modal =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; poem: Poem }
  | { type: 'session_start'; poem: Poem }
  | {
      type: 'session';
      poem: Poem;
      mode: 'cumulative' | 'chain' | 'continue_from' | 'where_am_i' | 'review' | 'weak_verses';
      source?: SessionSource;
      startFromVerse?: number;
      newVerseIndex?: number;
      segmentIndex?: number;
      weakVerseIndex?: number;
    }
  | { type: 'reading'; poem: Poem }
  | { type: 'stats'; poem: Poem }
  | { type: 'settings' }
  | { type: 'delete_confirm'; poem: Poem }
  | { type: 'error_log' }
  | { type: 'fateen'; poem: Poem }
  | { type: 'sajal_setup' }
  | { type: 'sajal_add_poem'; editPoem?: SajalPoem };

export default function App() {
  const {
    state,
    updateSettings,
    updateUserProfile,
    addPoem,
    updatePoem,
    deletePoem,
    updateVerseStats,
    updateSessionStats,
    updateCurrentVerse,
    setActiveSession,
    addErrorLogEntry,
    addSuccessLogEntry,
    markTodaySessionCompleted,
    addSajalPoem,
    deleteSajalPoem,
    updateSajalSettings,
  } = useAppState();

  const [page, setPage] = useState<Page>('home');
  const [modal, setModal] = useState<Modal>({ type: 'none' });

  // Today Session Data for notifications
  const todayData = state 
    ? buildTodaySession(state.poems, state.stats, state.errorLog, state.lastTodaySessionCompletedAt)
    : { tasks: [], hasWeakVerses: false, hasDueReviews: false, hasNewVerses: false, totalCount: 0 };

  const { requestPermission } = useNotifications(todayData, state?.settings.notificationsEnabled ?? false, state?.userProfile);



  // Dark mode
  useEffect(() => {
    if (!state) return;

    document.body.classList.toggle('dark', state.settings.darkMode);
  }, [state?.settings.darkMode]);

  const handleAddPoem = useCallback(
    (poem: Poem) => {
      addPoem(poem);
    },
    [addPoem]
  );

  const handleEditPoem = useCallback(
    (poem: Poem) => {
      updatePoem(poem);
    },
    [updatePoem]
  );

  const handleDeletePoem = useCallback(
    (poemId: string) => {
      deletePoem(poemId);
      setModal({ type: 'none' });
    },
    [deletePoem]
  );

  const handleStartSession = useCallback(
    (
      poem: Poem,
      mode:
        | 'cumulative'
        | 'chain'
        | 'continue_from'
        | 'where_am_i'
        | 'review'
        | 'weak_verses',
      opts?: {
        startFromVerse?: number;
        newVerseIndex?: number;
        segmentIndex?: number;
        weakVerseIndex?: number;
        source?: SessionSource;
      }
    ) => {
      setActiveSession(poem.id);

      setModal({
        type: 'session',
        poem,
        mode,
        source: opts?.source,
        startFromVerse: opts?.startFromVerse,
        newVerseIndex: opts?.newVerseIndex,
        segmentIndex: opts?.segmentIndex,
        weakVerseIndex: opts?.weakVerseIndex,
      });
    },
    [setActiveSession]
  );

  // فتح بيت ضعيف من جلسة اليوم
  const handleStartWeakVerse = useCallback(
    (poem: Poem, verseIndex: number) => {
      const latestPoem =
        state?.poems.find(p => p.id === poem.id) || poem;

      handleStartSession(latestPoem, 'weak_verses', {
        weakVerseIndex: verseIndex,
        source: 'today_session',
      });
    },
    [state, handleStartSession]
  );

  // فتح بيت تراكمي من جلسة اليوم
  const handleStartCumulative = useCallback(
    (poem: Poem, verseIndex: number) => {
      const latestPoem =
        state?.poems.find(p => p.id === poem.id) || poem;

      handleStartSession(latestPoem, 'cumulative', {
        startFromVerse: verseIndex,
        source: 'today_session',
      });
    },
    [state, handleStartSession]
  );

  // Handle deep linking from notifications
  useEffect(() => {
    if (!state) return;

    const handleAction = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const poemId = urlParams.get('poemId');
      const verseIndex = parseInt(urlParams.get('verseIndex') || '-1');
      const reason = urlParams.get('reason');

      if (action === 'study' && poemId) {
        const poem = state.poems.find(p => p.id === poemId);
        if (poem) {
          if (reason === 'needs_strengthening') {
            handleStartWeakVerse(poem, verseIndex);
          } else {
            handleStartCumulative(poem, verseIndex);
          }
          // Clear URL params
          window.history.replaceState({}, document.title, "/");
        }
      }
    };

    handleAction();

    // Listen for messages from Service Worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const { poemId, verseIndex, reason } = event.data.data;
        const poem = state.poems.find(p => p.id === poemId);
        if (poem) {
          if (reason === 'needs_strengthening') {
            handleStartWeakVerse(poem, verseIndex);
          } else {
            handleStartCumulative(poem, verseIndex);
          }
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, [state, handleStartWeakVerse, handleStartCumulative]);

  const handleVerseUpdate = useCallback(
    (poemId: string, vs: VerseStats) => {
      updateVerseStats(poemId, vs);
    },
    [updateVerseStats]
  );

  const handleSessionComplete = useCallback(
    (poemId: string, correct: number, errors: number, source?: SessionSource) => {
      updateSessionStats(poemId, correct, errors);
      if (source === 'today_session') {
        markTodaySessionCompleted();
      }
      setActiveSession(null);
      setModal({ type: 'none' });
    },
    [updateSessionStats, setActiveSession, markTodaySessionCompleted]
  );

  const handleCurrentVerseUpdate = useCallback(
    (poemId: string, idx: number, markCompleted = false) => {
      updateCurrentVerse(poemId, idx, markCompleted);
    },
    [updateCurrentVerse]
  );

  const handleErrorLog = useCallback(
    (entry: ErrorLogEntry) => {
      addErrorLogEntry(entry);
    },
    [addErrorLogEntry]
  );

  const handleSuccessLog = useCallback(
    (entry: SuccessLogEntry) => {
      addSuccessLogEntry(entry);
    },
    [addSuccessLogEntry]
  );

  const openStudy = useCallback((poem: Poem) => {
    setModal({ type: 'session_start', poem });
  }, []);

  if (!state) {
    return (
      <div className="!min-h-screen !min-h-dvh !flex !items-center !justify-center !bg-[var(--bg-0)]">
        <p className="!text-sm !text-[var(--text-3)]">
          جارٍ التحميل...
        </p>
      </div>
    );
  }

  const { poems, stats, settings } = state;

  const getLatestPoem = (p: Poem) =>
    poems.find(item => item.id === p.id) || p;

  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          <Dashboard
            state={state}
            onStudy={openStudy}
            onNavigate={p => setPage(p as Page)}
            todaySection={
              <SajalArenaCard 
                state={state}
                onClick={() => {
                  setModal({ type: 'sajal_setup' });
                }}
              />
            }
          />
        );

      case 'poems':
        return (
          <PoemsPage
            state={state}
            onAdd={() => setModal({ type: 'add' })}
            onStudy={openStudy}
            onRead={poem =>
              setModal({ type: 'reading', poem })
            }
            onStats={poem =>
              setModal({ type: 'stats', poem })
            }
            onDelete={poem =>
              setModal({ type: 'delete_confirm', poem })
            }
          />
        );

      case 'fateen':
        return (
          <FateenSelectPoem
            state={state}
            onSelectPoem={poem =>
              setModal({ type: 'fateen', poem })
            }
            onAddPoem={() =>
              setModal({ type: 'add' })
            }
          />
        );

      case 'stats':
        return (
          <div className="!flex !flex-col !gap-6">
            <div className="!flex !items-center !justify-between !px-1">
              <div className="!flex !flex-col !gap-1">
                <h2 className="!text-lg !font-bold !text-[var(--text-0)]">
                  الإحصائيات
                </h2>

                <p className="!text-xs !text-[var(--text-3)] !font-medium">
                  {poems.length} قصيدة · إجمالي الجلسات:{' '}
                  {Object.values(stats).reduce(
                    (s, p) => s + p.totalSessions,
                    0
                  )}
                </p>
              </div>

              <button
                onClick={() =>
                  setModal({ type: 'error_log' })
                }
               className="!flex !items-center !gap-1 !px-4 !py-2 !rounded-xl !border !border-[var(--border-0)] !bg-[var(--bg-2)] !text-xs !font-bold !text-[var(--text-2)] hover:!text-[var(--text-0)] transition-all"
              >
                <AlertCircle
                  size={14}
                  strokeWidth={2.5}
                />

                <span className="!hidden sm:!inline">
                  سجل الأخطاء
                </span>

                <span className="!tabular-nums">
                  ({state.errorLog.length})
                </span>
              </button>
            </div>

            {poems.length === 0 ? (
              <Card className="!p-10 !text-center !text-sm !text-[var(--text-3)] !font-medium">
                {tGender(state.userProfile, 'أضيفي قصيدة أولًا لرؤية الإحصائيات', 'أضف قصيدة أولاً لرؤية الإحصائيات')}
              </Card>
            ) : (
              <div className="!flex !flex-col !gap-3 !pb-[200px]">
                {poems.map(poem => (
                  <Card
                    key={poem.id}
                    hover
                    className="!p-4 !flex !items-center !justify-between !gap-4"
                    onClick={() =>
                      setModal({
                        type: 'stats',
                        poem,
                      })
                    }
                  >
                    <div className="!min-w-0 !flex !flex-col !gap-0.5">
                      <p className="!font-bold !text-[var(--text-0)] !text-sm !truncate">
                        {poem.title}
                      </p>

                      <p className="!text-xs !text-[var(--text-3)] !truncate">
                        {poem.poet} ·{' '}
                        {stats[poem.id]?.totalSessions || 0}{' '}
                        جلسة
                      </p>
                    </div>

                    <ChevronLeft
                      size={16}
                      className="!text-[var(--text-3)] !opacity-40"
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="!flex !flex-col !gap-6 !max-w-2xl !mx-auto">
            <div className="!px-1 !flex !flex-col !gap-1">
              <h2 className="!text-lg !font-bold !text-[var(--text-0)]">
                الإعدادات
              </h2>

              <p className="!text-xs !text-[var(--text-3)] !font-medium">
                تُحفظ تفضيلاتك تلقائيًا في المتصفح
              </p>
            </div>

            <SettingsContent 
              settings={settings} 
              userProfile={state.userProfile} 
              onUpdate={updateSettings} 
              onUpdateProfile={updateUserProfile} 
              requestPermission={requestPermission} 
            />
          </div>
        );

      case 'sajal_arena':
        return (
          <SajalArenaView
            state={state}
            onSetup={() => setModal({ type: 'sajal_setup' })}
            onClose={() => setPage('home')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {page === 'sajal_arena' ? (
        <SajalArenaView
          state={state}
          onSetup={() => setModal({ type: 'sajal_setup' })}
          onClose={() => setPage('home')}
        />
      ) : (
        <Layout
          currentPage={page as any}
          onNavigate={setPage as any}
          darkMode={settings.darkMode}
          onToggleDark={() =>
            updateSettings({
              darkMode: !settings.darkMode,
            })
          }
        >
          {!state.userProfile.onboardingCompleted && (
            <Onboarding onComplete={(profile) => updateUserProfile(profile)} />
          )}
          {renderPage()}
        </Layout>
      )}

      {/* ===== Modal: Add/Edit Poem ===== */}
      {(modal.type === 'add' ||
        modal.type === 'edit') && (
        <AddPoemModal
          state={state}
          onClose={() => setModal({ type: 'none' })}
          onAdd={
            modal.type === 'add'
              ? handleAddPoem
              : handleEditPoem
          }
          editPoem={
            modal.type === 'edit'
              ? modal.poem
              : undefined
          }
        />
      )}

      {/* ===== Modal: Session Start ===== */}
      {modal.type === 'session_start' && (
        <SessionStartModal
          poem={getLatestPoem(modal.poem)}
          stats={stats[modal.poem.id]}
          userProfile={state.userProfile}
          onStart={(mode, opts) => {
            if (mode === 'fateen') {
              setModal({
                type: 'fateen',
                poem: getLatestPoem(modal.poem),
              });
            } else {
              handleStartSession(
                getLatestPoem(modal.poem),
                mode,
                opts
              );
            }
          }}
          onFateen={() =>
            setModal({
              type: 'fateen',
              poem: getLatestPoem(modal.poem),
            })
          }
          onClose={() =>
            setModal({ type: 'none' })
          }
        />
      )}

      {/* ===== Modal: Session ===== */}
      {modal.type === 'session' && (
        <SessionView
          poem={getLatestPoem(modal.poem)}
          stats={stats[modal.poem.id]}
          settings={settings}
          userProfile={state.userProfile}
          mode={modal.mode}
          source={modal.source}
          startFromVerse={modal.startFromVerse}
          newVerseIndex={modal.newVerseIndex}
          segmentIndex={modal.segmentIndex}
          weakVerseIndex={modal.weakVerseIndex}
          onClose={() => {
            setActiveSession(null);
            setModal({ type: 'none' });
          }}
          onVerseUpdate={handleVerseUpdate}
          onSessionComplete={handleSessionComplete}
          onCurrentVerseUpdate={handleCurrentVerseUpdate}
          onErrorLog={handleErrorLog}
          onSuccessLog={handleSuccessLog}
        />
      )}

      {/* ===== Modal: Reading ===== */}
      {modal.type === 'reading' && (
        <ReadingView
          poem={getLatestPoem(modal.poem)}
          stats={stats[modal.poem.id]}
          settings={settings}
          onClose={() =>
            setModal({ type: 'none' })
          }
        />
      )}

      {/* ===== Modal: Stats ===== */}
      {modal.type === 'stats' && (
        <StatsView
          state={state}
          poem={getLatestPoem(modal.poem)}
          stats={stats[modal.poem.id]}
          errorLog={state.errorLog}
          onClose={() =>
            setModal({ type: 'none' })
          }
        />
      )}

      {/* ===== Modal: Settings ===== */}
      {modal.type === 'settings' && (
        <SettingsPanel
          settings={settings}
          userProfile={state.userProfile}
          onUpdate={updateSettings}
          onUpdateProfile={updateUserProfile}
          requestPermission={requestPermission}
          onClose={() =>
            setModal({ type: 'none' })
          }
        />
      )}

      {/* ===== Modal: Delete Confirm ===== */}
      {modal.type === 'delete_confirm' && (
        <div
          className="modal-overlay"
          onClick={() =>
            setModal({ type: 'none' })
          }
        >
          <div
            className="!w-full !max-w-sm glass-modal !rounded-xl !p-6 animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="!text-sm !font-semibold !text-[var(--text-0)] !mb-2">
              حذف القصيدة
            </h3>

            <p className="!text-xs !text-[var(--text-2)] !mb-6">
              {tGender(state.userProfile, `هل تريدين حذف «${modal.poem.title}»؟ لن يمكن التراجع.`, `هل تريد حذف «${modal.poem.title}»؟ لن يمكن التراجع.`)}
            </p>

            <div className="!flex !gap-2 !justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setModal({ type: 'none' })
                }
              >
                إلغاء
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  handleDeletePoem(modal.poem.id)
                }
              >
                حذف
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Modal: Error Log ===== */}
      {modal.type === 'error_log' && (
        <ErrorLogView
          errorLog={state.errorLog}
          successLog={state.successLog}
          poems={poems}
          onClose={() =>
            setModal({ type: 'none' })
          }
        />
      )}

      {/* ===== Modal: Fateen Challenge ===== */}
      {modal.type === 'fateen' && (
        <FateenChallengeView
          poem={getLatestPoem(modal.poem)}
          settings={settings}
          userProfile={state.userProfile}
          poemStats={stats[modal.poem.id]}
          onClose={() =>
            setModal({ type: 'none' })
          }
          onVerseUpdate={handleVerseUpdate}
          onErrorLog={handleErrorLog}
          onSuccessLog={handleSuccessLog}
        />
      )}

      {/* ===== Modal: Sajal Arena Setup ===== */}
      {modal.type === 'sajal_setup' && (
        <SajalArenaSetup 
          state={state}
          onAddPoem={() => setModal({ type: 'sajal_add_poem' })}
          onEditPoem={(poem) => setModal({ type: 'sajal_add_poem', editPoem: poem })}
          onDeletePoem={deleteSajalPoem}
          onUpdateSettings={updateSajalSettings}
          onStartGame={() => {
            setModal({ type: 'none' });
            setPage('sajal_arena');
          }}
          onClose={() => setModal({ type: 'none' })}
        />
      )}

      {/* ===== Modal: Sajal Add Poem ===== */}
      {modal.type === 'sajal_add_poem' && (
        <AddSajalPoemModal 
          userProfile={state.userProfile}
          onAdd={addSajalPoem}
          editPoem={modal.editPoem}
          onClose={() => {
            const hasPoems = state.sajalPoems.length > 0 || state.sajalSettings.includeHifzPoems;
            setModal(hasPoems ? { type: 'sajal_setup' } : { type: 'none' });
          }}
        />
      )}
    </>
  );
}