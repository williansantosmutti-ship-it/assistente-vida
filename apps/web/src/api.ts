const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function getToken() {
  return localStorage.getItem("assistente.token");
}

export function setToken(token: string) {
  localStorage.setItem("assistente.token", token);
}

export function clearToken() {
  localStorage.removeItem("assistente.token");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message ?? "Erro na requisicao.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
