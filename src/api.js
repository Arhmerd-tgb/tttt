import { Capacitor } from '@capacitor/core';

const configuredBase = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export const API_BASE_URL = configuredBase;

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

const REQUEST_TIMEOUT_MS = 20000;

const offlineMessage = 'Unable to reach Ashmie. Check your internet connection and try again.';
const missingBaseMessage = 'This app build is missing its API address. Reinstall the latest version or contact support.';

export async function apiFetch(path, options = {}) {
  if (Capacitor.isNativePlatform() && !API_BASE_URL) {
    return {
      ok: false,
      status: 0,
      json: async () => ({ message: missingBaseMessage }),
      text: async () => missingBaseMessage,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || REQUEST_TIMEOUT_MS);

  try {
    const fetchOptions = { ...options };
    delete fetchOptions.timeout;
    return await fetch(apiUrl(path), {
      ...fetchOptions,
      credentials: 'omit',
      cache: 'no-store',
      signal: fetchOptions.signal || controller.signal,
    });
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'The request timed out. Check your connection and try again.'
      : offlineMessage;
    return {
      ok: false,
      status: 0,
      json: async () => ({ message }),
      text: async () => message,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
