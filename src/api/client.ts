// ============================================================
// API client — API-ready abstraction.
// Today it resolves from mock data with a simulated latency.
// Swap `mockResolve` for real fetch() calls when the backend
// is available, keeping the service signatures identical.
// ============================================================

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

/** Simulate network latency for a realistic UX (loading states, etc.). */
export function mockResolve<T>(data: T, delay = 420): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredCloneSafe(data)), delay));
}

function structuredCloneSafe<T>(data: T): T {
  if (typeof structuredClone === "function") return structuredClone(data);
  return JSON.parse(JSON.stringify(data));
}

/** Real HTTP request helper (used once the backend is wired). */
export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const apiConfig = { useMocks: USE_MOCKS };
