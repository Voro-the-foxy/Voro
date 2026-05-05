// Repository for quiz attempts.
// Backed by localStorage today; swap the body of the functions below
// for `api.*` calls when the backend exposes /api/attempts.
import { STORAGE_KEYS, genId, readJSON, writeJSON } from "@/lib/storage";
import { addSolvedQuiz } from "@/lib/solvedQuizzes";
import type { QuizAttempt } from "@/types/attempt";

export type { QuizAttempt };

export type SaveAttemptInput = Omit<QuizAttempt, "id" | "completedAt" | "score" | "total"> & {
  score?: number;
  total?: number;
};

const loadAll = (): QuizAttempt[] =>
  readJSON<QuizAttempt[]>(STORAGE_KEYS.attempts, []);

export const listAttempts = (): QuizAttempt[] => loadAll();

export const listAttemptsByClass = (classId: string): QuizAttempt[] =>
  loadAll()
    .filter((a) => a.classId === classId)
    .sort((a, b) => b.completedAt - a.completedAt);

export const getAttempt = (id: string): QuizAttempt | undefined =>
  loadAll().find((a) => a.id === id);

export const latestAttemptForClass = (classId: string): QuizAttempt | undefined =>
  listAttemptsByClass(classId)[0];

export const saveAttempt = (input: SaveAttemptInput): QuizAttempt => {
  const total = input.total ?? input.questionIds.length;
  const score =
    input.score ??
    input.answers.reduce(
      (acc, ans, i) => (ans === input.correctIndices[i] ? acc + 1 : acc),
      0,
    );
  const created: QuizAttempt = {
    id: genId("a"),
    classId: input.classId,
    quizId: input.quizId,
    lectureTitle: input.lectureTitle,
    questionIds: input.questionIds,
    answers: input.answers,
    correctIndices: input.correctIndices,
    score,
    total,
    completedAt: Date.now(),
  };
  writeJSON(STORAGE_KEYS.attempts, [...loadAll(), created]);
  // Keep the legacy "solved" counter in sync so HomePage stats still work.
  addSolvedQuiz(input.classId);
  return created;
};
