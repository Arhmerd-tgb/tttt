import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Clipboard } from '@capacitor/clipboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { Share } from '@capacitor/share';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNativePlatform = Capacitor.isNativePlatform();
export const nativePlatform = Capacitor.getPlatform();

export function parsePaymentReference(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('reference')
      || parsed.searchParams.get('trxref')
      || '';
  } catch {
    return '';
  }
}

export async function initializeNativeApp(handlers = {}) {
  document.documentElement.classList.add('is-native');
  document.documentElement.classList.add(`platform-${nativePlatform}`);

  if (!isNativePlatform) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (nativePlatform === 'android') {
      await StatusBar.setBackgroundColor({ color: '#fffaf6' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (error) {
    console.warn('Status bar setup failed.', error);
  }

  try {
    const status = await Network.getStatus();
    handlers.onConnectivity?.(status.connected);
    await Network.addListener('networkStatusChange', (nextStatus) => {
      handlers.onConnectivity?.(nextStatus.connected);
    });
  } catch (error) {
    console.warn('Network monitoring is unavailable.', error);
  }

  try {
    await NativeApp.addListener('appStateChange', ({ isActive }) => {
      handlers.onAppState?.(isActive);
    });
    await NativeApp.addListener('backButton', async () => {
      const handled = await handlers.onBack?.();
      if (!handled) await NativeApp.exitApp();
    });
    await NativeApp.addListener('appUrlOpen', ({ url }) => {
      handlers.onDeepLink?.(url);
    });
    const launchUrl = await NativeApp.getLaunchUrl();
    if (launchUrl?.url) handlers.onDeepLink?.(launchUrl.url);
  } catch (error) {
    console.warn('Native app listeners could not be attached.', error);
  }
}

export async function hideSplashScreen() {
  try {
    await SplashScreen.hide({ fadeOutDuration: 250 });
  } catch {
    // Splash screen is a no-op on the web.
  }
}

export async function openPaymentUrl(url) {
  if (isNativePlatform) {
    await Browser.open({ url, presentationStyle: 'fullscreen' });
    return;
  }
  window.location.assign(url);
}

export async function closeInAppBrowser() {
  if (!isNativePlatform) return;
  try {
    await Browser.close();
  } catch {
    // Browser may already be closed.
  }
}

export async function copyText(value) {
  const text = String(value ?? '');
  if (isNativePlatform) {
    await Clipboard.write({ string: text });
    return;
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error('Clipboard access is unavailable.');
}

export async function shareContent({ title, text, url }) {
  if (isNativePlatform) {
    await Share.share({ title, text, url, dialogTitle: 'Share Ashmie' });
    return;
  }
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return;
  }
  await copyText(url || text || '');
}

export async function tapFeedback() {
  if (!isNativePlatform) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Haptics are optional.
  }
}
