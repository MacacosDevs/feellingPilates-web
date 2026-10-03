import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

export const apiClient = axios.create({ baseURL });

const TOKEN_KEY = 'feelingpilates.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

declare module 'axios' {
  interface AxiosRequestConfig {
    session?: { expires?: boolean };
  }
}

interface SessionBoundary {
  capture: () => { generation: number; token: string | null };
  unauthorized: (identity: { generation: number; status: 401 }) => void;
}

let sessionBoundary: SessionBoundary | undefined;
const requestGenerations = new WeakMap<object, number>();

/** Composition supplies policy; transport only captures and reports identity. */
export function configureSessionBoundary(boundary: SessionBoundary | undefined): void {
  sessionBoundary = boundary;
}

apiClient.interceptors.request.use((config) => {
  const captured = sessionBoundary?.capture();
  const token = captured ? captured.token : getToken();
  if (token && captured && config.session?.expires !== false) {
    requestGenerations.set(config, captured.generation);
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, undefined, { synchronous: true });

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const generation = error.config && requestGenerations.get(error.config);
    if (error.response?.status === 401 && generation !== undefined) {
      try {
        sessionBoundary?.unauthorized(Object.freeze({ generation, status: 401 }));
      } catch {
        // A boundary failure must not replace the caller's original Axios error.
      }
    }
    return Promise.reject(error);
  },
);
