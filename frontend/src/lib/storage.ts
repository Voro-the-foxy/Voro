export const STORAGE_KEYS = {
  classNotif: "voro.classNotif.v1",
  examNotif: "voro.examNotif.v1",
  authSession: "voro.auth.session.v1",
} as const;

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
