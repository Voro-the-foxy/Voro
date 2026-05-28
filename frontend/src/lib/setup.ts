import { api } from "@/lib/api";
import { loadClasses } from "@/lib/classes";
import { listNotesByClass } from "@/lib/notes";
import { SetupReadinessSchema } from "@/lib/validation";
import type { SetupState, SetupStep } from "@/types/setup";

export type { SetupState, SetupStep };

export const loadSetup = (): Promise<SetupState> =>
  api.get<SetupState>("/api/setup");

export const markStepDone = (step: SetupStep): Promise<SetupState> =>
  api.post<SetupState>("/api/setup/steps", { step });

export const checkSetupReadiness = async () => {
  const [state, allClasses] = await Promise.all([loadSetup(), loadClasses()]);
  const scheduled = allClasses.filter((c) => c.slots.length > 0);
  const classes = await Promise.all(
    scheduled.map(async (c) => {
      const notes = await listNotesByClass(c.id);
      return { id: c.id, name: c.name, slots: c.slots, noteCount: notes.length };
    }),
  );
  const notesComplete =
    scheduled.length > 0 && classes.every((c) => c.noteCount >= 1);
  const zodResult = SetupReadinessSchema.safeParse({ ...state, classes });
  return { zodResult, notesComplete, state };
};

export const isSetupComplete = async (): Promise<boolean> => {
  try {
    const { zodResult } = await checkSetupReadiness();
    return zodResult.success;
  } catch {
    return false;
  }
};
