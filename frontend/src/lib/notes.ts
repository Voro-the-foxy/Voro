import { documentsApi } from "@/lib/api";
import { STORAGE_KEYS, genId, readJSON, writeJSON } from "@/lib/storage";
import type { Note } from "@/types/note";

export type { Note };

export const loadNotes = (): Note[] =>
  readJSON<Note[]>(STORAGE_KEYS.notes, []);

export const addNote = (note: Omit<Note, "id" | "addedAt">): Note => {
  const list = loadNotes();
  const created: Note = { ...note, id: genId("n"), addedAt: Date.now() };
  writeJSON(STORAGE_KEYS.notes, [...list, created]);
  return created;
};

export const uploadNote = async (params: {
  classId: string;
  file: File;
  title?: string;
}): Promise<Note> => {
  const doc = await documentsApi.upload(params.file, params.title);
  return addNote({
    classId: params.classId,
    filename: params.file.name,
    size: params.file.size,
    documentId: doc.id,
  });
};

export const latestDocumentIdForClass = (classId: string): string | undefined => {
  const withDoc = loadNotes()
    .filter((n) => n.classId === classId && n.documentId)
    .sort((a, b) => b.addedAt - a.addedAt);
  return withDoc[0]?.documentId;
};
