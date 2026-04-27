// MOCK IMPLEMENTATION — backed by localStorage.
// Exams and the master toggle live in browser storage. Swap to `api.*`
// calls per TODO(backend) markers when the backend is wired.
import { STORAGE_KEYS, genId, readBool, readJSON, writeBool, writeJSON } from "@/lib/storage";
import type { Exam } from "@/types/exam";

export type { Exam };

// TODO(backend): GET /api/exams
//                Response: Exam[] = [{ id, className, year, month(0-11),
//                day, hour(1-12), minute(0-59), period: 'AM'|'PM', enabled }]
//                className references an existing class by name (not id);
//                consider switching to classId once the schedule API is wired.
export const loadExams = (): Exam[] =>
  readJSON<Exam[]>(STORAGE_KEYS.exams, []);

// TODO(backend): PUT /api/exams (bulk replace)
//                Body: Exam[]
//                Response: Exam[] (server-canonical).
//                Per-item alternative: POST/PUT/DELETE /api/exams[/id].
export const saveExams = (exams: Exam[]) => {
  writeJSON(STORAGE_KEYS.exams, exams);
};

// TODO(backend): GET /api/exams/master
//                Response: { enabled: boolean }
export const loadExamsMaster = (): boolean =>
  readBool(STORAGE_KEYS.examsMaster, true);

// TODO(backend): PUT /api/exams/master
//                Body: { enabled: boolean }
//                Response: { enabled: boolean }
export const saveExamsMaster = (enabled: boolean) => {
  writeBool(STORAGE_KEYS.examsMaster, enabled);
};

export const newExamId = () => genId("e");
