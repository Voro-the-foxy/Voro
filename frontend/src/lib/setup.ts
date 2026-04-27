// MOCK IMPLEMENTATION — backed by localStorage.
// All functions below operate on browser storage, not a real server. They
// simulate the eventual API surface; swap them for `api.*` calls per the
// TODO(backend) markers when the backend is ready.
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";
import type { SetupState, SetupStep } from "@/types/setup";

export type { SetupState, SetupStep };

const DEFAULT: SetupState = {
  schedule: false,
  alarm: false,
  exam: false,
};

// TODO(backend): GET /api/users/me/setup
//                Response: SetupState { schedule, alarm, exam } (booleans).
//                Auth: requires session/JWT in header.
export const loadSetup = (): SetupState => {
  const stored = readJSON<Partial<SetupState>>(STORAGE_KEYS.setup, {});
  return { ...DEFAULT, ...stored };
};

// TODO(backend): POST /api/users/me/setup/steps
//                Body: { step: 'schedule' | 'alarm' | 'exam' }
//                Response: updated SetupState.
export const markStepDone = (step: SetupStep) => {
  const s = loadSetup();
  s[step] = true;
  writeJSON(STORAGE_KEYS.setup, s);
};

// Derived from loadSetup; no separate endpoint needed unless backend
// wants to expose a precomputed flag.
export const isSetupComplete = () => {
  const s = loadSetup();
  return s.schedule && s.alarm && s.exam;
};
