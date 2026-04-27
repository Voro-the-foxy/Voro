import { createFileRoute } from '@tanstack/react-router';
import ExamSettingPage from '@/pages/ExamSettingPage';

type SetupSearch = { from?: 'setting' };

export const Route = createFileRoute('/set-up/exam-day')({
  validateSearch: (s: Record<string, unknown>): SetupSearch => ({
    from: s.from === 'setting' ? 'setting' : undefined,
  }),
  component: ExamSettingPage,
});
