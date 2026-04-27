import AlarmPage from '@/pages/AlarmPage'
import { createFileRoute } from '@tanstack/react-router'

type SetupSearch = { from?: 'setting' };

export const Route = createFileRoute('/set-up/alarm')({
  validateSearch: (s: Record<string, unknown>): SetupSearch => ({
    from: s.from === 'setting' ? 'setting' : undefined,
  }),
  component: AlarmPage,
})
