// MOCK IMPLEMENTATION — backed by localStorage.
// Records every quiz session the user finishes; the count drives the
// "Solved Quiz" stat on Home. No score/answers are tracked yet.
import { STORAGE_KEYS, genId, readJSON, writeJSON } from "@/lib/storage";
import type { SolvedQuiz } from "@/types/solvedQuiz";

export type { SolvedQuiz };

// TODO(backend): GET /api/quizzes/solved
//                Response: SolvedQuiz[] = [{ id, classId, completedAt }]
//                Used by HomePage for the "Solved Quiz" stat (.length).
//                Future: extend with score/correctCount/total once tracked.
export const loadSolvedQuizzes = (): SolvedQuiz[] =>
  readJSON<SolvedQuiz[]>(STORAGE_KEYS.solvedQuizzes, []);

// TODO(backend): POST /api/quizzes/solved
//                Body: { classId: string } (extend later with answers/score)
//                Response: SolvedQuiz (server fills id, completedAt).
//                Triggered when user clicks Finish on the last question.
export const addSolvedQuiz = (classId: string): SolvedQuiz => {
  const list = loadSolvedQuizzes();
  const created: SolvedQuiz = {
    id: genId("s"),
    classId,
    completedAt: Date.now(),
  };
  writeJSON(STORAGE_KEYS.solvedQuizzes, [...list, created]);
  return created;
};
