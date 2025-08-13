export enum QuestionType {
  TEXT = "TEXT",
  NUMERIC = "NUMERIC",
  YES_NO = "YES_NO",
  MCQ = "MCQ",
  MULTI_SELECT = "MULTI_SELECT",
}

export interface ScreeningQuestionInterface {
  _id: string;
  jobId: string;
  question: string;
  questionType: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}
