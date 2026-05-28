// Empty string = relative URL → Vite proxy forwards to backend (no CORS)
// Explicit URL (e.g. Capacitor build) = direct request to that host
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL || "";

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

function authHeaders(): Record<string, string> {
  try {
    const raw = localStorage.getItem("voro.auth.session.v1");
    if (!raw) return {};
    const session = JSON.parse(raw) as { token?: unknown };
    return typeof session.token === "string"
      ? { Authorization: `Bearer ${session.token}` }
      : {};
  } catch {
    return {};
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  timeoutMs = 8000,
): Promise<T> {
  const headers: Record<string, string> = {
    ...authHeaders(),
    ...(body ? { "Content-Type": "application/json" } : {}),
  };
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) {
      localStorage.removeItem("voro.auth.session.v1");
      window.dispatchEvent(new Event("voro-session-expired"));
    }
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function uploadMultipart<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 401) {
      localStorage.removeItem("voro.auth.session.v1");
      window.dispatchEvent(new Event("voro-session-expired"));
    }
    throw new ApiError(res.status, body);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown, timeoutMs?: number) => request<T>("POST", path, body, timeoutMs),
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
  delete: (id: string): Promise<void> => api.del<void>(`/api/documents/${id}`),
};

export const quizzesApi = {
  create: (body: QuizCreateBody): Promise<QuizDTO> =>
    api.post<QuizDTO>("/api/quizzes", body, 120_000),
  get: (id: string): Promise<QuizDTO> => api.get<QuizDTO>(`/api/quizzes/${id}`),
};
