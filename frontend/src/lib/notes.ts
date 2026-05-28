import { api, documentsApi } from "@/lib/api";
import type { Note } from "@/types/note";

export type { Note };

type NoteDTO = {
  id: string;
  class_id: string;
  filename: string;
  size: number;
  added_at: number;
  document_id?: string;
};

const fromDTO = (dto: NoteDTO): Note => ({
  id: dto.id,
  classId: dto.class_id,
  filename: dto.filename,
  size: dto.size,
  addedAt: dto.added_at,
  documentId: dto.document_id,
});

export const loadNotes = (): Promise<Note[]> =>
  api.get<NoteDTO[]>("/api/notes").then((dtos) => dtos.map(fromDTO));

export const listNotesByClass = (classId: string): Promise<Note[]> =>
  api.get<NoteDTO[]>(`/api/notes?classId=${encodeURIComponent(classId)}`).then((dtos) => dtos.map(fromDTO));

export const addNote = (note: {
  classId: string;
  filename: string;
  size: number;
  documentId?: string;
}): Promise<Note> =>
  api.post<NoteDTO>("/api/notes", {
    class_id: note.classId,
    filename: note.filename,
    size: note.size,
    document_id: note.documentId,
  }).then(fromDTO);

export const deleteNote = (id: string): Promise<void> =>
  api.del<void>(`/api/notes/${id}`);

export const deleteNotesByClass = (classId: string): Promise<void> =>
  api.del<void>(`/api/notes?classId=${encodeURIComponent(classId)}`);

export const deleteRemoteDocumentsByClass = async (
  classId: string,
): Promise<string[]> => {
  const notes = await listNotesByClass(classId);
  const documentIds = [
    ...new Set(
      notes.map((n) => n.documentId).filter((id): id is string => Boolean(id)),
    ),
  ];
  const results = await Promise.allSettled(
    documentIds.map((id) => documentsApi.delete(id)),
  );
  return documentIds.filter((_, i) => results[i].status === "rejected");
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

export const latestDocumentIdForClass = async (
  classId: string,
): Promise<string | undefined> => {
  const notes = await listNotesByClass(classId);
  const withDoc = notes
    .filter((n) => n.documentId)
    .sort((a, b) => b.addedAt - a.addedAt);
  return withDoc[0]?.documentId;
};
