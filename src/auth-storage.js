import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'ashmie_auth_token';
let cachedToken = '';

export function getAuthToken() {
  return cachedToken;
}

export async function loadAuthToken() {
  try {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    cachedToken = value || '';
  } catch (error) {
    console.warn('Unable to load the stored session token.', error);
    cachedToken = '';
  }
  return cachedToken;
}

export async function setAuthToken(token) {
  cachedToken = token || '';
  try {
    if (cachedToken) await Preferences.set({ key: TOKEN_KEY, value: cachedToken });
    else await Preferences.remove({ key: TOKEN_KEY });
  } catch (error) {
    console.warn('Unable to persist the session token.', error);
  }
}

export function clearAuthToken() {
  cachedToken = '';
  return Preferences.remove({ key: TOKEN_KEY }).catch((error) => {
    console.warn('Unable to clear the session token.', error);
  });
}
