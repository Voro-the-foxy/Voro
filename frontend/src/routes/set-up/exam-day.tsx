import { createFileRoute, redirect } from '@tanstack/react-router';
import ExamSettingPage from '@/pages/ExamSettingPage';
import { isAuthenticated } from '@/lib/auth';

type SetupSearch = { from?: 'setting' | 'mypage' };

export const Route = createFileRoute('/set-up/exam-day')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' });
    }
  },
  validateSearch: (s: Record<string, unknown>): SetupSearch => ({
    from: s.from === 'setting' || s.from === 'mypage' ? s.from : undefined,
  }),
  component: ExamSettingPage,
});
