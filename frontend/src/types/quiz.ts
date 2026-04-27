export type QuizClass = {
  id: string;
  name: string;
  lectureTitle: string;
};

export type MultipleChoiceQuestion = {
  id: string;
  type: "multiple_choice";
  prompt: string;
  choices: string[];
  correctIndex: number;
};

export type OpenAnswerQuestion = {
  id: string;
  type: "open_answer";
  prompt: string;
  explanation: string;
};

export type Question = MultipleChoiceQuestion | OpenAnswerQuestion;

export type Quiz = {
  classId: string;
  lectureTitle: string;
  questions: Question[];
};
