export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API ${status}: ${body}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function uploadMultipart<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

// ----- Backend types (mirror Go DTOs in backend/internal/handler/dto/quiz_dto.go) -----

export type DocumentDTO = {
  id: string;
  title: string;
  source_type: string;
  chunk_count: number;
};

export type QuestionDTO = {
  id: string;
  question_text: string;
  choices: string[];
  answer_index: number;
  explanation: string;
  source_chunk_ids: string[];
  validation_score: number | null;
};

export type QuizDTO = {
  id: string;
  document_id: string;
  status: string;
  questions: QuestionDTO[];
};

export type QuizCreateBody = {
  document_id: string;
  count?: number;
  difficulty?: "easy" | "medium" | "hard";
  threshold?: number;
};

export const documentsApi = {
  upload: (file: File, title?: string): Promise<DocumentDTO> => {
    const fd = new FormData();
    fd.append("file", file);
    if (title) fd.append("title", title);
    return uploadMultipart<DocumentDTO>("/api/documents", fd);
  },
  list: (): Promise<DocumentDTO[]> => api.get<DocumentDTO[]>("/api/documents"),
};

export const quizzesApi = {
  create: (body: QuizCreateBody): Promise<QuizDTO> =>
    api.post<QuizDTO>("/api/quizzes", body),
  get: (id: string): Promise<QuizDTO> => api.get<QuizDTO>(`/api/quizzes/${id}`),
};
