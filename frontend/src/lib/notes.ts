// MOCK IMPLEMENTATION — backed by localStorage; only metadata is stored.
// The actual file bytes are NOT persisted (no real upload happens). When
// hooked to the backend, `addNote` must send the File via multipart/form-data
// per its TODO(backend) note.
import { STORAGE_KEYS, genId, readJSON, writeJSON } from "@/lib/storage";
import type { Note } from "@/types/note";

export type { Note };

// TODO(backend): GET /api/notes
//                Optional query: ?classId=... to filter by lecture.
//                Response: Note[] = [{ id, classId, filename, size, addedAt }]
//                Sort: server returns most-recent first (or accepts ?sort=).
export const loadNotes = (): Note[] =>
  readJSON<Note[]>(STORAGE_KEYS.notes, []);

// TODO(backend): POST /api/notes (multipart/form-data)
//                Form fields: classId (string), file (the lecture note file).
//                Response: Note (server fills in id, size, addedAt; classId echoed).
//                The frontend currently stores only metadata; once wired,
//                send the actual File object selected by the user.
export const addNote = (note: Omit<Note, "id" | "addedAt">): Note => {
  const list = loadNotes();
  const created: Note = { ...note, id: genId("n"), addedAt: Date.now() };
  writeJSON(STORAGE_KEYS.notes, [...list, created]);
  return created;
};
