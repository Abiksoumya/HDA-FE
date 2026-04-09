import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL, API_FALLBACK_URL } from './config';

interface JwtPayload {
  exp: number;
  iat: number;
  [key: string]: unknown;
}

function getTokenExpiryInfo(decoded: JwtPayload): number {
  const { exp } = decoded;
  const now = Date.now() / 1000;
  const diff = exp - now;
  if (import.meta.env.DEV) {
    if (diff > 0) {
      console.log(`[Token] Expires in ${Math.floor(diff / 60)} minute(s).`);
    } else {
      console.warn(`[Token] Expired ${Math.abs(Math.floor(diff / 60))} minute(s) ago.`);
    }
  }
  return diff;
}

export function isTokenValid(token: string): boolean {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    getTokenExpiryInfo(decoded);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

function addAuthInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (import.meta.env.DEV) {
        console.error('[API Error]', error?.response?.status, error?.message);
      }
      return Promise.reject(error);
    },
  );
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const axiosClient = axios.create({
  baseURL: API_FALLBACK_URL,
  headers: { 'Content-Type': 'application/json' },
});

addAuthInterceptor(apiClient);
addAuthInterceptor(axiosClient);

export default apiClient;
