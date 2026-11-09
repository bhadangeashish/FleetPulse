// FleetPulse TMS - Service Worker & Background Sync Helper
// Coordinates PWA caching, offline shell, and Background Sync API

import { processOfflineSyncQueue } from './syncEngine';

export const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[FleetPulse SW] Registered successfully with scope:', registration.scope);

    // Listen for background sync triggers or postMessage from worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'TRIGGER_OFFLINE_SYNC') {
        console.log('[FleetPulse SW] Received background sync trigger from Service Worker');
        processOfflineSyncQueue().catch(console.error);
      }
    });

    return registration;
  } catch (err) {
    console.warn('[FleetPulse SW] Registration failed:', err);
    return null;
  }
};

/**
 * Request Background Sync registration via Service Worker SyncManager
 */
export const requestBackgroundSync = async (tag: string = 'fleetpulse-sync-queue'): Promise<boolean> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if ('sync' in reg && (reg as any).sync?.register) {
      await (reg as any).sync.register(tag);
      console.log(`[FleetPulse SW] Background Sync registered for tag: ${tag}`);
      return true;
    }
    return false;
  } catch (err) {
    console.warn('[FleetPulse SW] Background Sync registration not supported or failed:', err);
    return false;
  }
};

