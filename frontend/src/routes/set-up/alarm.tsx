import AlarmPage from '@/pages/AlarmPage'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { isAuthenticated } from '@/lib/auth'

type SetupSearch = { from?: 'setting' | 'mypage' };

export const Route = createFileRoute('/set-up/alarm')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' });
    }
  },
  validateSearch: (s: Record<string, unknown>): SetupSearch => ({
    from: s.from === 'setting' || s.from === 'mypage' ? s.from : undefined,
  }),
  component: AlarmPage,
})
