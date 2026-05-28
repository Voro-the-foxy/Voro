import { api } from "@/lib/api";
import { documentsApi } from "@/lib/api";
import type { ClassItem } from "@/types/schedule";

export type { ClassItem };

export const loadClasses = (): Promise<ClassItem[]> =>
  api.get<ClassItem[]>("/api/classes");

export const saveClasses = (classes: ClassItem[]): Promise<ClassItem[]> =>
  api.put<ClassItem[]>("/api/classes", classes);

export const addClass = (name: string): Promise<ClassItem> =>
  api.post<ClassItem>("/api/classes", { name });

export const deleteClass = (classId: string): Promise<void> =>
  api.del<void>(`/api/classes/${classId}`);

export const deleteClassWithMaterialsDeep = async (
  classId: string,
): Promise<{ failedDocumentIds: string[] }> => {
  const { listNotesByClass } = await import("@/lib/notes");
  const notes = await listNotesByClass(classId);
  const documentIds = [
    ...new Set(
      notes.map((n) => n.documentId).filter((id): id is string => Boolean(id)),
    ),
  ];

  const results = await Promise.allSettled(
    documentIds.map((id) => documentsApi.delete(id)),
  );
  const failedDocumentIds = documentIds.filter(
    (_, i) => results[i].status === "rejected",
  );

  await import("@/lib/notes").then((m) => m.deleteNotesByClass(classId));
  await import("@/lib/attempts").then((m) => m.deleteAttemptsByClass(classId));
  await deleteClass(classId);

  return { failedDocumentIds };
};
