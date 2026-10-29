import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
}

const installState: InstallState = {
  deferredPrompt: null,
  isInstalled: false,
};
const installListeners = new Set<() => void>();

function notifyInstallState() {
  installListeners.forEach((listener) => listener());
}

function detectInstalledMode() {
  return typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectPlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) ||
    (userAgent.includes('macintosh') && window.navigator.maxTouchPoints > 1);
  if (isIOSDevice) return 'ios';
  if (userAgent.includes('android')) return 'android';
  return 'desktop';
}

if (typeof window !== 'undefined') {
  installState.isInstalled = detectInstalledMode();
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    event.preventDefault();
    installState.deferredPrompt = event as BeforeInstallPromptEvent;
    notifyInstallState();
  });
  window.addEventListener('appinstalled', () => {
    installState.isInstalled = true;
    installState.deferredPrompt = null;
    notifyInstallState();
  });
}

export function usePWAInstall() {
  const [state, setState] = useState(installState);
  const [platform] = useState(detectPlatform);

  useEffect(() => {
    const syncInstallState = () => setState({ ...installState });
    installListeners.add(syncInstallState);
    syncInstallState();

    return () => {
      installListeners.delete(syncInstallState);
    };
  }, []);

  const install = async () => {
    const deferredPrompt = installState.deferredPrompt;
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      installState.deferredPrompt = null;
      notifyInstallState();
      return outcome === 'accepted';
    } catch (error) {
      console.error('PWA installation prompt failed:', error);
      installState.deferredPrompt = null;
      notifyInstallState();
      return false;
    }
  };

  return {
    isInstallable: !!state.deferredPrompt,
    isInstalled: state.isInstalled,
    platform,
    install,
  };
}
