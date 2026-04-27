// SKELETON — not yet used at runtime.
// The backend isn't connected; every domain repo under `lib/*` currently
// reads from localStorage (see the MOCK headers there). Once the backend
// is live, swap each repo function to call `api.*` per its TODO(backend)
// note. Configure the URL via VITE_API_BASE_URL (defaults to localhost:8080).
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
  // TODO(backend): attach auth headers here once the backend exposes an auth
  //                endpoint (e.g. `Authorization: Bearer <jwt>` from a token
  //                stored after POST /api/auth/login). On 401, redirect to a
  //                login route and clear the token.
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
