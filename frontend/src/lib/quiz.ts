import { ApiError, quizzesApi, type QuizDTO } from "@/lib/api";
import { latestDocumentIdForClass } from "@/lib/notes";
import type { Quiz } from "@/types/quiz";

const QUIZ_CACHE_KEY = "voro.classQuiz.v1";

type ClassQuizMap = Record<string, string>;

function loadCacheMap(): ClassQuizMap {
  try {
    const raw = localStorage.getItem(QUIZ_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCachedQuizId(classId: string, quizId: string) {
  const map = loadCacheMap();
  map[classId] = quizId;
  localStorage.setItem(QUIZ_CACHE_KEY, JSON.stringify(map));
}

export const clearCachedQuizForClass = (classId: string) => {
  const map = loadCacheMap();
  delete map[classId];
  localStorage.setItem(QUIZ_CACHE_KEY, JSON.stringify(map));
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
  clearCachedQuizForClass(classId);
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
      clearCachedQuizForClass(classId);
    }
  }

  const documentId = await latestDocumentIdForClass(classId);
  if (!documentId) {
    throw new Error("No uploaded material found for this class");
  }

  const dto = await quizzesApi.create({
    document_id: documentId,
    count: 5,
    difficulty: "medium",
    threshold: 0.7,
  });
  if (dto.questions.length === 0) {
    throw new Error("No questions passed validation — try adding more material or retry");
  }
  setCachedQuizId(classId, dto.id);
  return toFrontendQuiz(dto, classId, lectureTitle);
};
