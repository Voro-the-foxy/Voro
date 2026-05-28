import { api } from "@/lib/api";
import type { Exam } from "@/types/exam";

export type { Exam };

export const loadExams = (): Promise<Exam[]> =>
  api.get<Exam[]>("/api/exams");

export const saveExams = (exams: Exam[]): Promise<Exam[]> =>
  api.put<Exam[]>("/api/exams", exams);

export const loadExamsMaster = (): Promise<boolean> =>
  api.get<{ enabled: boolean }>("/api/exams/master").then((r) => r.enabled);

export const saveExamsMaster = (enabled: boolean): Promise<void> =>
  api.put<void>("/api/exams/master", { enabled });

export const newExamId = (): string => crypto.randomUUID();
