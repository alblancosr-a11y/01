"use client";

import { useEffect, useCallback } from 'react';
import { TodaySessionData, TodayTask } from '../lib/todaySession';
import { UserProfile } from '../lib/types';
import { withName, tGender } from '../lib/arabicUtils';

const NOTIFIED_TASK_KEY = 'madarij_last_notified_task';

export function useNotifications(todayData: TodaySessionData, enabled: boolean, profile: UserProfile | undefined) {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const sendNotification = useCallback((task: TodayTask) => {
    if (!enabled) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const notifiedKey = `${task.poemId}-${task.verseIndex}-${task.reason}`;
    const lastNotified = localStorage.getItem(NOTIFIED_TASK_KEY);

    if (lastNotified === notifiedKey) return;

    let title = 'مَدَارِج';
    let body = '';

    switch (task.reason) {
      case 'new_verse':
        title = withName(profile, 'حان وقت الحفظ');
        body = tGender(profile, 'لديكِ أبيات جديدة تنتظر الحفظ', 'لديكَ أبيات جديدة تنتظر الحفظ');
        break;
      case 'needs_strengthening':
        title = withName(profile, 'حان وقت تقوية الحفظ');
        body = tGender(profile, 'لديكِ أبيات تحتاج إلى تقوية', 'لديكَ أبيات تحتاج إلى تقوية');
        break;
      case 'due_for_review':
        title = withName(profile, 'حان وقت المراجعة');
        body = tGender(profile, 'لديكِ محفوظات جاهزة للمراجعة', 'لديكَ محفوظات جاهزة للمراجعة');
        break;
    }

    // Use Service Worker if available for better background support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icon-512.png',
          badge: '/icon-512.png',
          dir: 'rtl',
          data: {
            poemId: task.poemId,
            verseIndex: task.verseIndex,
            reason: task.reason
          },
          tag: 'today-task' // Ensures only one notification is shown even if state changes
        });
      });
    } else {
      new Notification(title, { body, icon: '/icon-512.png', dir: 'rtl' });
    }

    localStorage.setItem(NOTIFIED_TASK_KEY, notifiedKey);
  }, []);

  useEffect(() => {
    if (todayData.tasks.length > 0) {
      // Small delay to let the app settle
      const timer = setTimeout(() => {
        sendNotification(todayData.tasks[0]);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [todayData, sendNotification]);

  return { requestPermission };
}
