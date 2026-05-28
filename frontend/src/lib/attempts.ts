import { api } from "@/lib/api";
import type { QuizAttempt } from "@/types/attempt";

export type { QuizAttempt };

export type SaveAttemptInput = Omit<QuizAttempt, "id" | "completedAt" | "score" | "total"> & {
  score?: number;
  total?: number;
};

type AttemptDTO = {
  id: string;
  class_id: string;
  quiz_id: string;
  lecture_title: string;
  question_ids: string[];
  answers: number[];
  correct_indices: number[];
  score: number;
  total: number;
  completed_at: number;
};

const fromDTO = (dto: AttemptDTO): QuizAttempt => ({
  id: dto.id,
  classId: dto.class_id,
  quizId: dto.quiz_id,
  lectureTitle: dto.lecture_title,
  questionIds: dto.question_ids,
  answers: dto.answers,
  correctIndices: dto.correct_indices,
  score: dto.score,
  total: dto.total,
  completedAt: dto.completed_at,
});

export const listAttempts = (): Promise<QuizAttempt[]> =>
  api.get<AttemptDTO[]>("/api/attempts").then((dtos) => dtos.map(fromDTO));

export const listAttemptsByClass = (classId: string): Promise<QuizAttempt[]> =>
  api.get<AttemptDTO[]>(`/api/attempts?classId=${encodeURIComponent(classId)}`).then((dtos) => dtos.map(fromDTO));

export const getAttempt = (id: string): Promise<QuizAttempt> =>
  api.get<AttemptDTO>(`/api/attempts/${id}`).then(fromDTO);

export const latestAttemptForClass = async (
  classId: string,
): Promise<QuizAttempt | undefined> => {
  const list = await listAttemptsByClass(classId);
  return list.sort((a, b) => b.completedAt - a.completedAt)[0];
};

export const deleteAttemptsByClass = (classId: string): Promise<void> =>
  api.del<void>(`/api/attempts?classId=${encodeURIComponent(classId)}`);

export const saveAttempt = (input: SaveAttemptInput): Promise<QuizAttempt> =>
  api.post<AttemptDTO>("/api/attempts", {
    class_id: input.classId,
    quiz_id: input.quizId,
    lecture_title: input.lectureTitle,
    question_ids: input.questionIds,
    answers: input.answers,
    correct_indices: input.correctIndices,
    score: input.score,
    total: input.total,
  }).then(fromDTO);
