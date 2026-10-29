import React, { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { RotateCw, WifiOff, X } from 'lucide-react';

export const PWAStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [updateReady, setUpdateReady] = useState(false);
  const [updateError, setUpdateError] = useState(false);
  const [dismissedUpdate, setDismissedUpdate] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] = useState<
    ((reloadPage?: boolean) => Promise<void>) | null
  >(null);

  useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh: () => setUpdateReady(true),
      onRegisterError: (error) => {
        console.error('Service worker registration failed:', error);
      },
    });
    setUpdateServiceWorker(() => updateSW);

    const updateOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  const applyUpdate = async () => {
    if (!updateServiceWorker) return;
    setUpdateError(false);
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Service worker update failed:', error);
      setUpdateError(true);
    }
  };

  if (isOnline && (!updateReady || dismissedUpdate)) return null;

  return (
    <div className="pwa-status-stack" aria-live="polite">
      {!isOnline && (
        <div className="pwa-status-banner" role="status">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
          <p>
            Offline. The cached app shell may open, but live job discovery, matching, syncing, and scans need a connection.
          </p>
        </div>
      )}
      {isOnline && updateReady && !dismissedUpdate && (
        <div className="pwa-status-banner" role="status">
          <RotateCw className="h-4 w-4 shrink-0 text-cyan-300" />
          <p>{updateError ? 'The update could not be applied. Try again.' : 'An app update is ready.'}</p>
          <button type="button" onClick={applyUpdate} className="pwa-status-action">
            Reload
          </button>
          <button
            type="button"
            onClick={() => setDismissedUpdate(true)}
            className="pwa-status-close"
            aria-label="Dismiss update notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
