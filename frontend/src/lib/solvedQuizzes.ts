import { listAttempts, listAttemptsByClass } from "@/lib/attempts";
import type { SolvedQuiz } from "@/types/solvedQuiz";

export type { SolvedQuiz };

export const loadSolvedQuizzes = async (): Promise<SolvedQuiz[]> => {
  const attempts = await listAttempts();
  return attempts.map((a) => ({ id: a.id, classId: a.classId, completedAt: a.completedAt }));
};

export const loadSolvedQuizzesByClass = async (classId: string): Promise<SolvedQuiz[]> => {
  const attempts = await listAttemptsByClass(classId);
  return attempts.map((a) => ({ id: a.id, classId: a.classId, completedAt: a.completedAt }));
};

export const deleteSolvedQuizzesByClass = async (_classId: string): Promise<void> => {
  // Covered by deleteAttemptsByClass — no separate action needed.
};
