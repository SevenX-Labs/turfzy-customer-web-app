const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const TOKEN_KEY = "turfzy_token";

export type ApiFailure = { success: false; message: string; status?: number; data?: unknown };

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `turfzy_session=1; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = "turfzy_session=; Path=/; Max-Age=0; SameSite=Lax";
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  const abortFromCaller = () => controller.abort();
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted) {
      throw { success: false, message: "The venue service is taking too long to respond. Please try again.", status: 408 } satisfies ApiFailure;
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw { success: false, message: data.message ?? "Something went wrong. Please try again.", status: response.status, data } satisfies ApiFailure;
  }
  return data as T;
}

export const request = <T>(path: string, method = "GET", body?: unknown) => api<T>(path, {
  method,
  body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
});
