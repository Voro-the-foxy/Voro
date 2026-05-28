import { createFileRoute, redirect } from '@tanstack/react-router';
import HomePage from '@/pages/HomePage';
import { isAuthenticated } from '@/lib/auth';

export const Route = createFileRoute('/home')({
  beforeLoad: () => {
    if (!isAuthenticated()) {
      throw redirect({ to: '/login' });
    }
  },
  component: HomePage,
});
