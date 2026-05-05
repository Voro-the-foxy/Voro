export type QuizAttempt = {
  id: string;
  classId: string;
  quizId: string;
  lectureTitle: string;
  questionIds: string[];
  answers: number[];
  correctIndices: number[];
  score: number;
  total: number;
  completedAt: number;
};
