import { createFileRoute, redirect } from '@tanstack/react-router';
import HomePage from '@/pages/HomePage';
import { isSetupComplete } from '@/lib/setup';

export const Route = createFileRoute('/home')({
  beforeLoad: () => {
    if (!isSetupComplete()) {
      throw redirect({ to: '/' });
    }
  },
  component: HomePage,
});
