import { ApiError, quizzesApi, type QuizDTO } from "@/lib/api";
import { latestDocumentIdForClass } from "@/lib/notes";
import { readJSON, writeJSON } from "@/lib/storage";
import type { Quiz } from "@/types/quiz";

const QUIZ_CACHE_KEY = "voro.classQuiz.v1";

type ClassQuizMap = Record<string, string>;

const loadCacheMap = (): ClassQuizMap =>
  readJSON<ClassQuizMap>(QUIZ_CACHE_KEY, {});

const setCachedQuizId = (classId: string, quizId: string) => {
  const map = loadCacheMap();
  map[classId] = quizId;
  writeJSON(QUIZ_CACHE_KEY, map);
};

const clearCachedQuizId = (classId: string) => {
  const map = loadCacheMap();
  delete map[classId];
  writeJSON(QUIZ_CACHE_KEY, map);
};

const toFrontendQuiz = (
  dto: QuizDTO,
  classId: string,
  lectureTitle: string,
): Quiz => ({
  classId,
  lectureTitle,
  questions: dto.questions.map((q) => ({
    id: q.id,
    type: "multiple_choice" as const,
    prompt: q.question_text,
    choices: q.choices,
    correctIndex: q.answer_index,
    explanation: q.explanation || undefined,
  })),
});

export const hasCachedQuiz = (classId: string): boolean =>
  Boolean(loadCacheMap()[classId]);

export const regenerateQuizForClass = async (
  classId: string,
  lectureTitle: string,
): Promise<Quiz> => {
  clearCachedQuizId(classId);
  return loadQuizForClass(classId, lectureTitle);
};

export const loadQuizForClass = async (
  classId: string,
  lectureTitle: string,
): Promise<Quiz> => {
  const cachedId = loadCacheMap()[classId];
  if (cachedId) {
    try {
      const dto = await quizzesApi.get(cachedId);
      return toFrontendQuiz(dto, classId, lectureTitle);
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 404) throw e;
      clearCachedQuizId(classId);
      // fall through to regenerate
    }
  }

  const documentId = latestDocumentIdForClass(classId);
  if (!documentId) {
    throw new Error("이 강의에 업로드된 자료가 없습니다");
  }

  const dto = await quizzesApi.create({
    document_id: documentId,
    count: 5,
    difficulty: "medium",
    threshold: 0.7,
  });
  if (dto.questions.length === 0) {
    throw new Error("검증을 통과한 문제가 없습니다 — 자료를 보강하거나 다시 시도해주세요");
  }
  setCachedQuizId(classId, dto.id);
  return toFrontendQuiz(dto, classId, lectureTitle);
};
