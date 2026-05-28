import { api } from "@/lib/api";
import { STORAGE_KEYS, readJSON, writeJSON } from "@/lib/storage";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

type LoginBody = {
  email: string;
  password: string;
};

export function loadSession(): AuthSession | null {
  return readJSON<AuthSession | null>(STORAGE_KEYS.authSession, null);
}

export function saveSession(session: AuthSession): void {
  writeJSON(STORAGE_KEYS.authSession, session);
  window.dispatchEvent(new Event("voro-auth-change"));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.authSession);
  window.dispatchEvent(new Event("voro-auth-change"));
}

export function getAuthToken(): string | null {
  return loadSession()?.token ?? null;
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken());
}

export async function validateToken(): Promise<boolean> {
  if (!isAuthenticated()) return false;
  try {
    await api.get("/api/auth/me");
    return true;
  } catch {
    clearSession();
    return false;
  }
}

let _sessionChecked = false;

export async function ensureValidSession(): Promise<void> {
  if (_sessionChecked) return;
  _sessionChecked = true;
  await validateToken();
}

export async function login(body: LoginBody): Promise<AuthSession> {
  const session = await api.post<AuthSession>("/api/auth/login", body);
  saveSession(session);
  return session;
}

export async function logout(): Promise<void> {
  try {
    await api.post<void>("/api/auth/logout");
  } finally {
    clearSession();
  }
}

export async function deleteAccount(): Promise<void> {
  try {
    await api.del<void>("/api/auth/account");
  } finally {
    clearSession();
  }
}
