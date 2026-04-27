// MOCK IMPLEMENTATION — backed by localStorage.
// Classes (the user's lecture roster) are persisted in the browser only.
// Swap each function for the matching `api.*` call once the backend is live.
import { STORAGE_KEYS, genId, readJSON, writeJSON } from "@/lib/storage";
import type { ClassItem } from "@/types/schedule";

export type { ClassItem };

// TODO(backend): GET /api/classes
//                Response: ClassItem[] = [{ id, name, slots: string[] }]
//                Slots are timetable cell keys "day-slot" (day 0-6, slot 0-47, 30-min units).
export const loadClasses = (): ClassItem[] =>
  readJSON<ClassItem[]>(STORAGE_KEYS.classes, []);

// TODO(backend): PUT /api/classes (bulk replace) — preferred for the timetable editor
//                Body: ClassItem[]
//                Response: ClassItem[] (server may reassign ids)
//                Alternative: per-item POST /api/classes, PUT /api/classes/:id,
//                DELETE /api/classes/:id during inline edits.
export const saveClasses = (classes: ClassItem[]) => {
  writeJSON(STORAGE_KEYS.classes, classes);
};

// TODO(backend): POST /api/classes
//                Body: { name: string, slots?: string[] } (slots default [])
//                Response: ClassItem with server-assigned id.
//                Used by UploadNotePage when adding a brand-new lecture.
export const addClass = (name: string): ClassItem => {
  const list = loadClasses();
  const item: ClassItem = { id: genId("c"), name, slots: [] };
  saveClasses([...list, item]);
  return item;
};
